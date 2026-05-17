import type {
  PlacedPart,
  EnvironmentState,
  EngineOutput,
  PartState,
  TranscriptionUnit,
  CellHealth,
  CellHealthReason,
  PartDef,
  EnhancerLink,
} from './types';

const MAX_PASSES = 5;
const PROTEASE_CAPACITY = 12;
const TRANSCRIPTION_BURDEN_THRESHOLD = 10;
const TRANSCRIPTION_CRITICAL_THRESHOLD = 16;
const TOXIN_THRESHOLD = 2;

// Proteins that are toxic above TOXIN_THRESHOLD
const TOXIC_PROTEINS = new Set(['CcdB']);

interface SweepResult {
  proteins: Record<string, number>;
  functionalRNAs: Record<string, number>;
  transcriptionUnits: TranscriptionUnit[];
}

interface DegradationResult {
  proteins: Record<string, number>;
  proteaseLoad: number;
}

interface EnhancerBoostResult {
  boostedLoadRates: Map<string, number>;
  enhancerLinks: EnhancerLink[];
}

type ArcDirection = 'clockwise' | 'counterclockwise';

interface EnhancerCandidate {
  promoterIdx: number;
  distance: number;
  direction: ArcDirection;
  blockedByInstanceId?: string;
}

export function runEngine(
  parts: PlacedPart[],
  defsMap: Map<string, PartDef>,
  env: EnvironmentState,
): EngineOutput {
  // Apply enhancer boosts as a pre-processing step
  const enhancerResult = computeEnhancerBoosts(parts, defsMap, env);
  const boostedLoadRates = enhancerResult.boostedLoadRates;

  let knownProteinLevels: Record<string, number> = {};
  let knownFunctionalRNAs: Record<string, number> = {};
  let lastSweep: SweepResult | null = null;
  let lastProteaseLoad = 0;

  // Fixed-point iteration: promoter-protein feedback loops
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    const blockedPromoters = computeDCas9Blocking(
      parts,
      defsMap,
      env,
      knownProteinLevels,
      knownFunctionalRNAs,
    );

    const knownProteins = new Set(Object.keys(knownProteinLevels).filter(k => knownProteinLevels[k] > 0));
    const sweep = doAllSweeps(parts, defsMap, env, knownProteins, blockedPromoters, boostedLoadRates);
    const degradation = applyTagDegradation(sweep.proteins, parts, defsMap, env);
    const rawProteins = degradation.proteins;
    lastProteaseLoad = degradation.proteaseLoad;

    const prevKeys = Object.keys(knownProteinLevels).sort().join(',');
    const nextKeys = Object.keys(rawProteins).filter(k => rawProteins[k] > 0).sort().join(',');

    const converged =
      prevKeys === nextKeys &&
      JSON.stringify(sweep.functionalRNAs) === JSON.stringify(knownFunctionalRNAs);

    lastSweep = { ...sweep, proteins: rawProteins };
    knownProteinLevels = rawProteins;
    knownFunctionalRNAs = sweep.functionalRNAs;

    if (converged) break;
  }

  if (!lastSweep) {
    return emptyOutput();
  }

  const finalKnownProteins = new Set(Object.keys(lastSweep.proteins).filter(k => lastSweep!.proteins[k] > 0));
  const finalBlockedPromoters = computeDCas9Blocking(
    parts,
    defsMap,
    env,
    lastSweep.proteins,
    knownFunctionalRNAs,
  );
  const transcriptionalLoad = computeActiveTranscriptionalLoad(
    parts,
    defsMap,
    env,
    lastSweep.transcriptionUnits,
    boostedLoadRates,
  );
  const partStates = computePartStates(parts, defsMap, env, finalKnownProteins, finalBlockedPromoters, lastSweep);
  const cellHealth = computeCellHealth(transcriptionalLoad, lastProteaseLoad, lastSweep.proteins);

  return {
    proteins: lastSweep.proteins,
    transcripts: computeTranscripts(lastSweep.transcriptionUnits),
    functionalRNAs: lastSweep.functionalRNAs,
    partStates,
    cellHealth,
    transcriptionUnits: lastSweep.transcriptionUnits,
    enhancerLinks: enhancerResult.enhancerLinks,
    efficiencyScore: { partCount: parts.length, transcriptionalLoad, proteaseLoad: lastProteaseLoad },
  };
}

// ── Enhancement pre-pass ─────────────────────────────────────────────

function computeEnhancerBoosts(
  parts: PlacedPart[],
  defsMap: Map<string, PartDef>,
  env: EnvironmentState,
): EnhancerBoostResult {
  const boostedLoadRates = new Map<string, number>();
  const enhancerLinks: EnhancerLink[] = [];
  const n = parts.length;

  for (let i = 0; i < n; i++) {
    const def = defsMap.get(parts[i].defId);
    if (!def || def.type !== 'enhancer') continue;
    if (!def.validHostModes.includes(env.hostMode)) continue;
    if (!def.boostFactor) continue;

    const candidates: EnhancerCandidate[] = [];

    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      const pDef = defsMap.get(parts[j].defId);
      if (!pDef || pDef.type !== 'promoter') continue;
      if (!pDef.validHostModes.includes(env.hostMode)) continue;

      candidates.push(makeEnhancerCandidate(i, j, 'clockwise', parts, defsMap, env));
      candidates.push(makeEnhancerCandidate(i, j, 'counterclockwise', parts, defsMap, env));
    }

    const openCandidates = candidates
      .filter(candidate => candidate.blockedByInstanceId === undefined)
      .sort((a, b) => a.distance - b.distance || directionPriority(a.direction) - directionPriority(b.direction));

    if (openCandidates.length > 0) {
      const nearestIdx = openCandidates[0].promoterIdx;
      const nearestId = parts[nearestIdx].instanceId;
      const existingBoost = boostedLoadRates.get(nearestId) ?? 1;
      boostedLoadRates.set(nearestId, existingBoost * def.boostFactor);
      enhancerLinks.push({
        enhancerInstanceId: parts[i].instanceId,
        promoterInstanceId: nearestId,
      });

      const nearestBlocked = nearestBlockedCandidate(candidates);
      if (nearestBlocked?.blockedByInstanceId) {
        enhancerLinks.push({
          enhancerInstanceId: parts[i].instanceId,
          blockedByInstanceId: nearestBlocked.blockedByInstanceId,
        });
      }
    } else {
      const nearestBlocked = nearestBlockedCandidate(candidates);

      enhancerLinks.push({
        enhancerInstanceId: parts[i].instanceId,
        blockedByInstanceId: nearestBlocked?.blockedByInstanceId,
      });
    }
  }

  return { boostedLoadRates, enhancerLinks };
}

function nearestBlockedCandidate(candidates: EnhancerCandidate[]): EnhancerCandidate | undefined {
  return candidates
    .filter(candidate => candidate.blockedByInstanceId !== undefined)
    .sort((a, b) => a.distance - b.distance || directionPriority(a.direction) - directionPriority(b.direction))[0];
}

function makeEnhancerCandidate(
  enhancerIdx: number,
  promoterIdx: number,
  direction: ArcDirection,
  parts: PlacedPart[],
  defsMap: Map<string, PartDef>,
  env: EnvironmentState,
): EnhancerCandidate {
  const distance = arcDistance(enhancerIdx, promoterIdx, direction, parts.length);
  const blockerIdx = findEnhancerBlocker(enhancerIdx, promoterIdx, direction, parts, defsMap, env);
  return {
    promoterIdx,
    distance,
    direction,
    blockedByInstanceId: blockerIdx === null ? undefined : parts[blockerIdx].instanceId,
  };
}

function arcDistance(fromIdx: number, toIdx: number, direction: ArcDirection, partCount: number): number {
  return direction === 'clockwise'
    ? (toIdx - fromIdx + partCount) % partCount
    : (fromIdx - toIdx + partCount) % partCount;
}

function directionPriority(direction: ArcDirection): number {
  return direction === 'clockwise' ? 0 : 1;
}

function findEnhancerBlocker(
  fromIdx: number,
  toIdx: number,
  direction: ArcDirection,
  parts: PlacedPart[],
  defsMap: Map<string, PartDef>,
  env: EnvironmentState,
): number | null {
  for (const idx of indexesBetween(fromIdx, toIdx, direction, parts.length)) {
    const def = defsMap.get(parts[idx].defId);
    if (
      def?.type === 'insulator' &&
      def.blocksEnhancers === true &&
      def.validHostModes.includes(env.hostMode) &&
      (!def.directional || direction === parts[idx].orientation)
    ) {
      return idx;
    }
  }

  return null;
}

function indexesBetween(fromIdx: number, toIdx: number, direction: ArcDirection, partCount: number): number[] {
  const indexes: number[] = [];
  let idx = direction === 'clockwise'
    ? (fromIdx + 1) % partCount
    : (fromIdx - 1 + partCount) % partCount;

  while (idx !== toIdx) {
    indexes.push(idx);
    idx = direction === 'clockwise'
      ? (idx + 1) % partCount
      : (idx - 1 + partCount) % partCount;
  }

  return indexes;
}

// ── dCas9 blocking ───────────────────────────────────────────────────

function computeDCas9Blocking(
  parts: PlacedPart[],
  defsMap: Map<string, PartDef>,
  env: EnvironmentState,
  knownProteinLevels: Record<string, number>,
  knownFunctionalRNAs: Record<string, number>,
): Set<string> {
  const blocked = new Set<string>();
  const dcas9Level = env.hostMode === 'eukaryotic'
    ? knownProteinLevels['dCas9-NLS'] ?? 0
    : knownProteinLevels['dCas9'] ?? 0;
  if (dcas9Level === 0) return blocked;

  // Collect all active guide RNA targets and their levels.
  const guideRNATargets: string[] = [];
  for (const [defId, level] of Object.entries(knownFunctionalRNAs)) {
    if (level <= 0) continue;
    const def = defsMap.get(defId);
    if (def?.type === 'crispr' && def.targetPromoter) {
      guideRNATargets.push(def.targetPromoter);
    }
  }

  if (guideRNATargets.length === 0) return blocked;

  // dCas9 is split equally among all guide RNA types.
  const dcas9PerGuide = dcas9Level / guideRNATargets.length;

  // A promoter is blocked if its guide gets enough dCas9 (threshold = 0.5).
  for (const targetDefId of guideRNATargets) {
    if (dcas9PerGuide >= 0.5) {
      // Block all instances of this promoter type
      for (const part of parts) {
        if (part.defId === targetDefId) {
          blocked.add(part.instanceId);
        }
      }
    }
  }

  return blocked;
}

function computeActiveTranscriptionalLoad(
  parts: PlacedPart[],
  defsMap: Map<string, PartDef>,
  env: EnvironmentState,
  transcriptionUnits: TranscriptionUnit[],
  boostedLoadRates: Map<string, number>,
): number {
  const activePromoterIds = new Set(transcriptionUnits.map(tu => tu.promoterInstanceId));

  return parts.reduce((sum, part) => {
    if (!activePromoterIds.has(part.instanceId)) return sum;
    const def = defsMap.get(part.defId);
    if (!def || def.type !== 'promoter' || !def.validHostModes.includes(env.hostMode)) return sum;
    return sum + (def.rnaPLoadRate ?? 0) * (boostedLoadRates.get(part.instanceId) ?? 1);
  }, 0);
}

// ── Main sweep algorithm ─────────────────────────────────────────────

function doAllSweeps(
  parts: PlacedPart[],
  defsMap: Map<string, PartDef>,
  env: EnvironmentState,
  knownProteins: Set<string>,
  blockedPromoters: Set<string>,
  boostedLoadRates: Map<string, number>,
): SweepResult {
  const proteins: Record<string, number> = {};
  const functionalRNAs: Record<string, number> = {};
  const transcriptionUnits: TranscriptionUnit[] = [];
  const n = parts.length;

  for (let i = 0; i < n; i++) {
    const part = parts[i];
    const def = defsMap.get(part.defId);
    if (!def || def.type !== 'promoter') continue;
    if (!def.validHostModes.includes(env.hostMode)) continue;

    // Check if this promoter is active
    if (blockedPromoters.has(part.instanceId)) continue;
    if (!isPromoterActive(def, env, knownProteins)) continue;

    const baseRate = def.rnaPLoadRate ?? 1;
    const boostMult = boostedLoadRates.get(part.instanceId) ?? 1;
    const rnaPLoadRate = baseRate * boostMult;

    const result = sweepFrom(i, parts, defsMap, env, rnaPLoadRate);
    transcriptionUnits.push(...result.tus);

    for (const [product, level] of Object.entries(result.proteins)) {
      proteins[product] = (proteins[product] ?? 0) + level;
    }
    for (const [defId, level] of Object.entries(result.functionalRNAs)) {
      functionalRNAs[defId] = (functionalRNAs[defId] ?? 0) + level;
    }
  }

  return { proteins, functionalRNAs, transcriptionUnits };
}

interface SingleSweepResult {
  proteins: Record<string, number>;
  functionalRNAs: Record<string, number>;
  tus: TranscriptionUnit[];
}

function sweepFrom(
  startIdx: number,
  parts: PlacedPart[],
  defsMap: Map<string, PartDef>,
  env: EnvironmentState,
  rnaPLoadRate: number,
): SingleSweepResult {
  const n = parts.length;
  const proteins: Record<string, number> = {};
  const functionalRNAs: Record<string, number> = {};
  const tus: TranscriptionUnit[] = [];

  // currentTranscriptLevel drops at each leaky terminator
  let transcriptLevel = rnaPLoadRate;
  // Bacteria: ribosomes require a Shine-Dalgarno site; eukaryotes require a Kozak sequence.
  // Without an explicit RBS part upstream, translation rate is 0.
  let currentRbsRate = 0;
  let currentTU: TranscriptionUnit = {
    promoterInstanceId: parts[startIdx].instanceId,
    geneProducts: [],
    strength: rnaPLoadRate,
    hasReadThrough: false,
  };
  let tagPendingForProduct: string | null = null;
  let lastGeneTranslationRate = 0;
  let fusionPending = false;

  // Track proteins accumulated before a terminator (only commit on termination)
  const pending: Record<string, number> = {};
  const pendingFRNAs: Record<string, number> = {};

  for (let step = 1; step < n; step++) {
    const idx = (startIdx + step) % n;
    if (idx === startIdx) break; // full circle, no terminator found — discard

    const part = parts[idx];
    const def = defsMap.get(part.defId);
    if (!def) continue;
    if (!def.validHostModes.includes(env.hostMode)) continue;

    switch (def.type) {
      case 'rbs': {
        currentRbsRate = def.translationRate ?? 1.0;
        fusionPending = false;
        break;
      }
      case 'linker': {
        const previousWasTagged = tagPendingForProduct?.includes('::tagged::') ?? false;
        fusionPending = tagPendingForProduct !== null && lastGeneTranslationRate > 0 && !previousWasTagged;
        currentRbsRate = 0;
        break;
      }
      case 'signal-sequence': {
        // Modify the last added gene product with NLS flag by renaming it
        if (tagPendingForProduct && def.destination === 'nucleus') {
          // Rename gene product to indicate NLS tagging (dCas9 → dCas9-NLS)
          const nlsProduct: string = `${tagPendingForProduct}-NLS`;
          const level = pending[tagPendingForProduct] ?? 0;
          delete pending[tagPendingForProduct];
          pending[nlsProduct] = (pending[nlsProduct] ?? 0) + level;
          currentTU.geneProducts = currentTU.geneProducts.map(g =>
            g === tagPendingForProduct ? nlsProduct : g,
          );
          tagPendingForProduct = nlsProduct;
        }
        fusionPending = false;
        break;
      }
      case 'gene': {
        const product = def.product ?? def.id;
        const stabilityMult = 1; // tags modify this later
        const translationRate = fusionPending ? lastGeneTranslationRate : currentRbsRate;
        const level = transcriptLevel * translationRate * stabilityMult;

        if (level > 0 && fusionPending && tagPendingForProduct) {
          const fusedProduct: string = `${tagPendingForProduct}::fusion::${product}`;
          const priorLevel = pending[tagPendingForProduct] ?? 0;
          delete pending[tagPendingForProduct];
          pending[fusedProduct] = (pending[fusedProduct] ?? 0) + Math.min(priorLevel, level);

          const lastIdx = currentTU.geneProducts.lastIndexOf(tagPendingForProduct);
          if (lastIdx >= 0) currentTU.geneProducts[lastIdx] = fusedProduct;
          tagPendingForProduct = fusedProduct;
          lastGeneTranslationRate = translationRate;
        } else if (level > 0) {
          pending[product] = (pending[product] ?? 0) + level;
          currentTU.geneProducts.push(product);
          tagPendingForProduct = product;
          lastGeneTranslationRate = translationRate;
        } else {
          tagPendingForProduct = null;
          lastGeneTranslationRate = 0;
        }

        fusionPending = false;
        currentRbsRate = 0; // each non-fused coding sequence still needs its own RBS/Kozak
        break;
      }
      case 'crispr': {
        // Guide RNA: functional RNA, no ribosome-binding site needed.
        pendingFRNAs[part.defId] = (pendingFRNAs[part.defId] ?? 0) + transcriptLevel;
        tagPendingForProduct = null;
        lastGeneTranslationRate = 0;
        fusionPending = false;
        break;
      }
      case 'tag': {
        // Applies to the immediately preceding gene product
        if (tagPendingForProduct && def.tagRate) {
          // Replace the pending protein with a tagged version
          const taggedKey: string = `${tagPendingForProduct}::tagged::${def.tagRate}`;
          const prevLevel = pending[tagPendingForProduct] ?? 0;
          delete pending[tagPendingForProduct];
          pending[taggedKey] = (pending[taggedKey] ?? 0) + prevLevel;
          // Update geneProducts list
          const lastIdx = currentTU.geneProducts.lastIndexOf(tagPendingForProduct);
          if (lastIdx >= 0) currentTU.geneProducts[lastIdx] = taggedKey;
          tagPendingForProduct = taggedKey;
        }
        fusionPending = false;
        break;
      }
      case 'insulator': {
        fusionPending = false;
        break;
      }
      case 'terminator': {
        const readThrough = def.readThroughPct ?? 0;
        const stabilityBonus = def.mRNAStabilityBonus ?? 0;

        // Commit pending proteins with stability bonus
        for (const [prod, lv] of Object.entries(pending)) {
          proteins[prod] = (proteins[prod] ?? 0) + lv * (1 + stabilityBonus);
        }
        for (const [rnaId, lv] of Object.entries(pendingFRNAs)) {
          functionalRNAs[rnaId] = (functionalRNAs[rnaId] ?? 0) + lv;
        }

        currentTU.strength = transcriptLevel;
        currentTU.terminatorInstanceId = part.instanceId;
        currentTU.hasReadThrough = readThrough > 0;
        currentTU.readThroughFraction = readThrough > 0 ? readThrough : undefined;
        tus.push({ ...currentTU, geneProducts: [...currentTU.geneProducts] });

        if (readThrough > 0) {
          // Continue sweep at reduced transcript level
          transcriptLevel *= readThrough;
          currentTU = {
            promoterInstanceId: parts[startIdx].instanceId,
            geneProducts: [],
            strength: transcriptLevel,
            continuedFromTerminatorInstanceId: part.instanceId,
            hasReadThrough: false,
          };
          // Clear pending — committed above
          for (const k of Object.keys(pending)) delete pending[k];
          for (const k of Object.keys(pendingFRNAs)) delete pendingFRNAs[k];
          tagPendingForProduct = null;
          lastGeneTranslationRate = 0;
          fusionPending = false;
          currentRbsRate = 0; // read-through mRNA still needs its own RBS per gene
        } else {
          // Full termination
          return { proteins, functionalRNAs, tus };
        }
        break;
      }
      // Other promoters encountered during sweep — skip (don't restart)
      default:
        fusionPending = false;
        break;
    }
  }

  // Unterminated: discard pending, return any already-committed proteins
  return { proteins, functionalRNAs, tus };
}

// ── Tag degradation / resource competition ───────────────────────────

function applyTagDegradation(
  rawProteins: Record<string, number>,
  _parts: PlacedPart[],
  _defsMap: Map<string, PartDef>,
  _env: EnvironmentState,
): DegradationResult {
  const result: Record<string, number> = {};

  // Separate tagged from untagged
  const tagged: Array<{ cleanName: string; tagRate: number; level: number }> = [];
  for (const [key, level] of Object.entries(rawProteins)) {
    const match = key.match(/^(.+)::tagged::(\d+(?:\.\d+)?)$/);
    if (match) {
      tagged.push({ cleanName: match[1], tagRate: parseFloat(match[2]), level });
    } else {
      result[key] = (result[key] ?? 0) + level;
    }
  }

  if (tagged.length === 0) return { proteins: result, proteaseLoad: 0 };

  // Compute total tagged load for protease saturation
  const totalTaggedLoad = tagged.reduce((sum, t) => sum + t.level * t.tagRate, 0);
  const saturationFactor = 1 + totalTaggedLoad / PROTEASE_CAPACITY;

  for (const { cleanName, tagRate, level } of tagged) {
    const effectiveDegRate = tagRate / saturationFactor;
    const finalLevel = level / effectiveDegRate;
    result[cleanName] = (result[cleanName] ?? 0) + finalLevel;
  }

  return { proteins: result, proteaseLoad: totalTaggedLoad };
}

// ── Part states (for animation layer) ───────────────────────────────

function computePartStates(
  parts: PlacedPart[],
  defsMap: Map<string, PartDef>,
  env: EnvironmentState,
  knownProteins: Set<string>,
  blockedPromoters: Set<string>,
  sweep: SweepResult,
): Record<string, PartState> {
  const states: Record<string, PartState> = {};

  for (const part of parts) {
    const def = defsMap.get(part.defId);
    if (!def) {
      states[part.instanceId] = { state: 'inert' };
      continue;
    }

    if (!def.validHostModes.includes(env.hostMode)) {
      states[part.instanceId] = { state: 'inert', reason: 'wrong host mode' };
      continue;
    }

    if (def.type === 'promoter') {
      if (blockedPromoters.has(part.instanceId)) {
        states[part.instanceId] = { state: 'blocked', reason: 'blocked by guide RNA and dCas9' };
      } else if (!isPromoterActive(def, env, knownProteins)) {
        const reason = def.repressedBy && knownProteins.has(def.repressedBy)
          ? 'repressed'
          : def.activatedBy && !knownProteins.has(def.activatedBy)
          ? 'missing activator'
          : 'no signal';
        states[part.instanceId] = { state: 'repressed', reason };
      } else {
        const inTU = sweep.transcriptionUnits.some(
          tu => tu.promoterInstanceId === part.instanceId,
        );
        states[part.instanceId] = { state: inTU ? 'active' : 'silent' };
      }
    } else {
      states[part.instanceId] = { state: 'active' };
    }
  }

  return states;
}

// ── Cell health ───────────────────────────────────────────────────────

function computeCellHealth(
  transcriptionalLoad: number,
  proteaseLoad: number,
  proteins: Record<string, number>,
): CellHealth {
  const reasons: CellHealthReason[] = [];

  if (transcriptionalLoad >= TRANSCRIPTION_CRITICAL_THRESHOLD) {
    return { state: 'lysed', reasons: ['transcriptional-load'] };
  }
  if (transcriptionalLoad >= TRANSCRIPTION_BURDEN_THRESHOLD) {
    reasons.push('transcriptional-load');
  }

  if (proteaseLoad >= PROTEASE_CAPACITY) {
    reasons.push('protease-saturation');
  }

  // Toxic protein
  for (const [name, level] of Object.entries(proteins)) {
    if (TOXIC_PROTEINS.has(name) && level > TOXIN_THRESHOLD) {
      reasons.push('toxic-protein');
      return { state: 'toxic', reasons };
    }
  }

  const state = reasons.length > 0 ? 'burdened' : 'normal';
  return { state, reasons };
}

// ── Transcript levels ────────────────────────────────────────────────

function computeTranscripts(tus: TranscriptionUnit[]): Record<string, number> {
  const transcripts: Record<string, number> = {};
  for (const tu of tus) {
    for (const gene of tu.geneProducts) {
      transcripts[gene] = (transcripts[gene] ?? 0) + tu.strength;
    }
  }
  return transcripts;
}

// ── Helpers ───────────────────────────────────────────────────────────

function isPromoterActive(
  def: PartDef,
  env: EnvironmentState,
  knownProteins: Set<string>,
): boolean {
  const signalActive = def.signal ? (env.signals[def.signal] ?? 0) > 0 : true;
  const repressed = def.repressedBy ? knownProteins.has(def.repressedBy) : false;
  const activated = def.activatedBy ? knownProteins.has(def.activatedBy) : true;
  return signalActive && !repressed && activated;
}

function emptyOutput(): EngineOutput {
  return {
    proteins: {},
    transcripts: {},
    functionalRNAs: {},
    partStates: {},
    cellHealth: { state: 'normal', reasons: [] },
    transcriptionUnits: [],
    enhancerLinks: [],
    efficiencyScore: { partCount: 0, transcriptionalLoad: 0, proteaseLoad: 0 },
  };
}

// ── Puzzle evaluation ─────────────────────────────────────────────────

import type { CircularExpect } from './types';

export function checkExpect(output: EngineOutput, expect: CircularExpect): boolean {
  if (expect.proteins) {
    for (const [protein, constraint] of Object.entries(expect.proteins)) {
      const level = output.proteins[protein] ?? 0;
      if (constraint.min !== undefined && level < constraint.min) return false;
      if (constraint.max !== undefined && level > constraint.max) return false;
    }
  }

  if (expect.proteinRatio) {
    const { a, b, min, max } = expect.proteinRatio;
    const aLevel = output.proteins[a] ?? 0;
    const bLevel = output.proteins[b] ?? 0;
    if (bLevel === 0) return false;
    const ratio = aLevel / bLevel;
    if (min !== undefined && ratio < min) return false;
    if (max !== undefined && ratio > max) return false;
  }

  if (expect.cellHealth) {
    const { state, not } = expect.cellHealth;
    if (state !== undefined && output.cellHealth.state !== state) return false;
    if (not !== undefined && output.cellHealth.state === not) return false;
  }

  return true;
}
