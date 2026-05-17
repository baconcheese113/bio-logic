<script lang="ts">
  import type { PlacedPart, EngineOutput, PartType } from '../lib/types';
  import { PARTS_DEF_MAP } from '../lib/parts-grammar';
  import { CX, CY, R, pointOnRing, partAnglesFor } from '../lib/plasmid-utils';

  interface Props {
    parts: PlacedPart[];
    engineOutput: EngineOutput | null;
    hostMode?: 'bacterial' | 'eukaryotic';
  }

  interface RnapAgent {
    id: number;
    tuIndex: number;
    phase: 'wander' | 'approach' | 'transcribe' | 'release';
    startAngle: number;
    endAngle: number;
    progress: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    opacity: number;
    trailPoints: { x: number; y: number }[];
    releaseProgress: number;
    mRNASpawned: boolean;
  }

  interface PeptideBead {
    x: number;
    y: number;
    px: number;
    py: number;
  }

  interface PeptideChain {
    id: number;
    beads: PeptideBead[];
    color: string;
    complete: boolean;
    foldProgress: number;
    age: number;
    driftVx: number;
    driftVy: number;
    product: string;
  }

  interface MRNAMolecule {
    id: number;
    tuIndex: number;
    phase: 'travel' | 'docked';
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    opacity: number;
    len: number;
    angle: number;
    geneProducts: string[];
    components: TranscriptComponent[];
    color: string;
    strength: number;
    copyNumber: number;
    pulse: number;
    readThroughFraction?: number;
    /** Arc shape of the RNA trail at release, relative to anchor (resampled to MRNA_PATH_N pts) */
    originPath: { x: number; y: number }[];
    /** Final display shape relative to dock (resampled to MRNA_PATH_N pts) */
    strandPath: { x: number; y: number }[];
    /** 0 = showing arc trail shape, 1 = showing strand shape */
    morphProgress: number;
    rate: number;
    rateTimer: number;
    rateCount: number;
  }

  interface RibosomeAgent {
    id: number;
    phase: 'wander' | 'dock' | 'translate';
    x: number;
    y: number;
    vx: number;
    vy: number;
    opacity: number;
    targetMRNAId: number | null;
    targetProduct: string | null;
    targetComponentIndex: number | null;
    progress: number;
    chain: PeptideBead[];
  }

  interface TrackInfo {
    id: string;
    startAngle: number;
    endAngle: number;
    strength: number;
    geneProducts: string[];
    components: TranscriptComponent[];
    continuedFromTerminatorInstanceId?: string;
    readThroughFraction?: number;
  }

  interface TranscriptComponent {
    id: string;
    label: string;
    color: string;
    type: PartType;
    product?: string;
  }

  interface TranslationTarget {
    product: string;
    componentIndex: number;
    weight: number;
  }

  let { parts, engineOutput, hostMode = 'bacterial' }: Props = $props();

  let rnapAgents = $state<RnapAgent[]>([]);
  let ribosomes = $state<RibosomeAgent[]>([]);
  let mRNAMolecules = $state<MRNAMolecule[]>([]);
  let peptideChains = $state<PeptideChain[]>([]);
  let translatedProteinLevels = $state<Record<string, number>>({});
  let nextAgentId = $state(1);

  const partAngles = $derived(partAnglesFor(parts.length));

  const indexByInstanceId = $derived.by(() => {
    const map = new Map<string, number>();
    parts.forEach((part, idx) => map.set(part.instanceId, idx));
    return map;
  });

  const healthClass = $derived.by(() => {
    if (!engineOutput) return '';
    return engineOutput.cellHealth.state === 'burdened'
      ? 'pulse-amber'
      : engineOutput.cellHealth.state === 'toxic' || engineOutput.cellHealth.state === 'lysed'
        ? 'pulse-red'
        : '';
  });

  const clpxpVisible = $derived(parts.some((part) => PARTS_DEF_MAP.get(part.defId)?.type === 'tag'));

  const clpxpQueueCount = $derived.by(() => {
    if (!engineOutput) return 0;
    const load = Object.values(engineOutput.proteins).reduce((sum, value) => sum + value, 0);
    return Math.min(3, Math.floor(load / 4));
  });

  const litGeneIds = $derived.by(() => {
    const active = new Set<string>();
    if (!engineOutput) return active;

    for (const tu of engineOutput.transcriptionUnits) {
      for (const proteinName of tu.geneProducts) {
        for (const part of parts) {
          const def = PARTS_DEF_MAP.get(part.defId);
          if (def?.type === 'gene' && def.product === proteinName) {
            active.add(part.instanceId);
          }
        }
      }
    }

    return active;
  });



  function normalizeArc(startAngle: number, endAngle: number): number {
    const arc = (endAngle - startAngle + 360) % 360;
    return arc === 0 ? 180 : arc;
  }

  function interpolateAngle(startAngle: number, endAngle: number, progress: number): number {
    const arc = normalizeArc(startAngle, endAngle);
    return startAngle + arc * progress;
  }

  function describeArc(startAngle: number, endAngle: number, radius: number): string {
    const start = pointOnRing(startAngle, radius);
    const end = pointOnRing(endAngle, radius);
    const largeArc = normalizeArc(startAngle, endAngle) > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  }

  function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  function randomCytoplasmPoint(): { x: number; y: number } {
    const angle = Math.random() * 2 * Math.PI;
    const radius = 18 + Math.random() * 86;
    return {
      x: CX + Math.cos(angle) * radius,
      y: CY + Math.sin(angle) * radius,
    };
  }

  function transcriptDockPoint(slotIndex: number, totalSlots: number): { x: number; y: number } {
    const spacing = totalSlots > 4 ? 54 : 68;
    const totalHeight = Math.max(0, totalSlots - 1) * spacing;
    return {
      x: CX,
      y: CY - totalHeight / 2 + slotIndex * spacing,
    };
  }

  function getProductColor(product: string): string {
    for (const def of PARTS_DEF_MAP.values()) {
      if (def.type === 'gene' && def.product === product) return def.color ?? '#60a5fa';
    }
    return '#60a5fa';
  }

  function transcriptLength(componentCount: number): number {
    return Math.min(170, Math.max(92, 48 + componentCount * 18));
  }

  function codingTargets(mrna: MRNAMolecule): TranslationTarget[] {
    return mrna.components
      .map((component, componentIndex) => {
        if (component.type !== 'gene' || !component.product) return null;
        const level = engineOutput?.proteins[component.product] ?? 0;
        if (level <= 0) return null;
        return { product: component.product, componentIndex, weight: level };
      })
      .filter((target): target is TranslationTarget => target !== null);
  }

  function chooseTranslationTarget(mrna: MRNAMolecule): TranslationTarget | null {
    const targets = codingTargets(mrna);
    if (targets.length === 0) return null;

    const total = targets.reduce((sum, target) => sum + target.weight, 0);
    let pick = Math.random() * total;
    for (const target of targets) {
      pick -= target.weight;
      if (pick <= 0) return target;
    }
    return targets[targets.length - 1] ?? null;
  }

  function transcriptTranslationWeight(mrna: MRNAMolecule): number {
    // Weight by strength only — copyNumber biases too heavily toward dominant mRNAs.
    const hasCoding = codingTargets(mrna).length > 0;
    return hasCoding ? Math.max(0.25, mrna.strength) : 0;
  }

  function chooseTranscriptForTranslation(transcripts: MRNAMolecule[]): MRNAMolecule | null {
    const weighted = transcripts.map((mrna) => ({
      mrna,
      weight: transcriptTranslationWeight(mrna),
    }));
    const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
    if (total <= 0) return null;

    let pick = Math.random() * total;
    for (const entry of weighted) {
      pick -= entry.weight;
      if (pick <= 0) return entry.mrna;
    }
    return weighted[weighted.length - 1]?.mrna ?? null;
  }

  const MRNA_PATH_N = 30;

  function resamplePath(pts: { x: number; y: number }[], n: number): { x: number; y: number }[] {
    if (pts.length === 0) return Array.from({ length: n }, () => ({ x: 0, y: 0 }));
    if (pts.length === 1) return Array.from({ length: n }, () => ({ x: pts[0].x, y: pts[0].y }));
    const cum = [0];
    for (let i = 1; i < pts.length; i++) {
      cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    }
    const total = cum[cum.length - 1];
    return Array.from({ length: n }, (_, k) => {
      const d = total === 0 ? 0 : (k / (n - 1)) * total;
      let lo = 0; let hi = cum.length - 2;
      while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (cum[mid] <= d) lo = mid; else hi = mid - 1; }
      const segLen = cum[lo + 1] - cum[lo];
      const t = segLen > 0 ? (d - cum[lo]) / segLen : 0;
      const a = pts[lo]; const b = pts[Math.min(lo + 1, pts.length - 1)];
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    });
  }

  function nearestEdgeTo(pt: { x: number; y: number }): { x: number; y: number } {
    const spread = (Math.random() - 0.5) * 50;
    const dl = pt.x;
    const dr = 400 - pt.x;
    const dt = pt.y;
    const db = 400 - pt.y;
    const minD = Math.min(dl, dr, dt, db);
    if (minD === dl) return { x: -35, y: pt.y + spread };
    if (minD === dr) return { x: 435, y: pt.y + spread };
    if (minD === dt) return { x: pt.x + spread, y: -35 };
    return { x: pt.x + spread, y: 435 };
  }

  function computeStrandPath(components: TranscriptComponent[], seed: number = 0): { x: number; y: number }[] {
    const n = components.length;
    const totalW = Math.max(70, n * 24 + 28);
    const steps = Math.max(36, n * 10);
    const r1 = (seed * 1234567 % 97) / 97;
    const r2 = (seed * 7654321 % 83) / 83;
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = -totalW / 2 + t * totalW;
      // Multi-harmonic wave: primary codon rhythm + secondary stem-loop hint
      const wave = Math.sin(t * Math.PI * (2.2 + r1 * 0.8)) * 9
                 + Math.sin(t * Math.PI * (5 + r2 * 2) + r1 * 2) * 3.5;
      pts.push({ x, y: wave });
    }
    return pts;
  }

  /** Per-protein fold geometry: returns N target positions (relative to centroid) for each bead. */
  function proteinFoldTargets(product: string, n: number): { x: number; y: number }[] {
    const p = product.toLowerCase();
    if (p === 'lacz') {
      // Beta-galactosidase: tetramer (2×2 subunit arrangement)
      const corners: [number, number][] = [[-6, -6], [6, -6], [-6, 6], [6, 6]];
      return Array.from({ length: n }, (_, i) => ({ x: corners[i % 4][0], y: corners[i % 4][1] }));
    }
    if (p === 'cat') {
      // Chloramphenicol acetyltransferase: trimer (120° symmetry)
      return Array.from({ length: n }, (_, i) => {
        const angle = (i % 3) / 3 * Math.PI * 2 - Math.PI / 2;
        return { x: Math.cos(angle) * 5.5, y: Math.sin(angle) * 5.5 };
      });
    }
    if (p.includes('gfp') || p.includes('rfp') || p.includes('yfp') || p.includes('cfp')) {
      // Fluorescent protein: beta-barrel (circular bead ring)
      return Array.from({ length: n }, (_, i) => {
        const angle = (i / Math.max(n, 1)) * Math.PI * 2;
        return { x: Math.cos(angle) * 4, y: Math.sin(angle) * 4 };
      });
    }
    // Generic: loose circle
    return Array.from({ length: n }, (_, i) => {
      const angle = (i / Math.max(n, 1)) * Math.PI * 2;
      return { x: Math.cos(angle) * 3.5, y: Math.sin(angle) * 3.5 };
    });
  }

  function posOnStrand(path: { x: number; y: number }[], t: number): { x: number; y: number } {
    if (path.length < 2) return path[0] ?? { x: 0, y: 0 };
    const scaled = Math.max(0, Math.min(1, t)) * (path.length - 1);
    const i = Math.floor(scaled);
    const frac = scaled - i;
    const a = path[Math.min(i, path.length - 1)];
    const b = path[Math.min(i + 1, path.length - 1)];
    return { x: a.x + (b.x - a.x) * frac, y: a.y + (b.y - a.y) * frac };
  }

  function collectTranscribedComponents(startIdx: number, terminatorInstanceId?: string): TranscriptComponent[] {
    const components: TranscriptComponent[] = [];
    const n = parts.length;

    for (let step = 1; step < n; step++) {
      const idx = (startIdx + step) % n;
      const part = parts[idx];
      const def = PARTS_DEF_MAP.get(part.defId);
      if (!def) continue;

      // Skip terminators and promoters — they're regulatory for RNAP, not for the mRNA itself
      if (def.type !== 'terminator' && def.type !== 'promoter') {
        components.push({
          id: part.instanceId,
          label: def.label ?? def.id,
          color: def.color ?? '#94a3b8',
          type: def.type,
          product: def.product,
        });
      }

      if (terminatorInstanceId) {
        if (part.instanceId === terminatorInstanceId) break;
      } else if (def.type === 'terminator') {
        break;
      }
    }

    return components;
  }

  const transcriptionTracks = $derived.by(() => {
    if (!engineOutput) return [] as TrackInfo[];

    // Track the last terminator angle per promoter to correctly position read-through RNA polymerase.
    const promLastTermAngle = new Map<string, number>();
    const promLastTermIdx = new Map<string, number>();
    const promLastReadThroughFraction = new Map<string, number>();

    return engineOutput.transcriptionUnits
      .map((tu, tuIdx) => {
        const startIdx = indexByInstanceId.get(tu.promoterInstanceId);
        if (startIdx === undefined) return null;

        // Read-through TUs start where the previous TU's terminator was
        const promDefaultAngle = partAngles[startIdx] ?? 0;
        const logicalStartIdx = promLastTermIdx.get(tu.promoterInstanceId) ?? startIdx;
        const startAngle = promLastTermAngle.get(tu.promoterInstanceId) ?? promDefaultAngle;
        const readThroughFraction = tu.continuedFromTerminatorInstanceId
          ? promLastReadThroughFraction.get(tu.promoterInstanceId)
          : undefined;
        let endAngle = startAngle + 160;
        let endIdx = logicalStartIdx;

        if (tu.terminatorInstanceId) {
          const termIdx = indexByInstanceId.get(tu.terminatorInstanceId);
          if (termIdx !== undefined) {
            endAngle = partAngles[termIdx] ?? endAngle;
            endIdx = termIdx;
          }
          promLastTermAngle.set(tu.promoterInstanceId, endAngle);
          promLastTermIdx.set(tu.promoterInstanceId, endIdx);
          if (tu.readThroughFraction !== undefined) {
            promLastReadThroughFraction.set(tu.promoterInstanceId, tu.readThroughFraction);
          }
        }

        return {
          id: `tu-${tuIdx}`,
          startAngle,
          endAngle,
          strength: tu.strength,
          geneProducts: tu.geneProducts,
          components: collectTranscribedComponents(logicalStartIdx, tu.terminatorInstanceId),
          continuedFromTerminatorInstanceId: tu.continuedFromTerminatorInstanceId,
          readThroughFraction,
        };
      })
      .filter((track): track is TrackInfo => track !== null);
  });

  const trackSignature = $derived.by(() =>
    transcriptionTracks
      .map((t) => `${t.id}:${t.startAngle.toFixed(2)}:${t.endAngle.toFixed(2)}:${t.strength.toFixed(3)}:${t.geneProducts.join('|')}:${t.components.map(component => component.id).join('|')}:${t.continuedFromTerminatorInstanceId ?? ''}`)
      .join(';'),
  );

  $effect(() => {
    // Reset animated agents when transcription geometry changes.
    trackSignature;
    rnapAgents = [];
    mRNAMolecules = [];
    peptideChains = [];
    ribosomes = [];
    translatedProteinLevels = {};
  });

  $effect(() => {
    let frameId = 0;
    let lastTime = 0;

    function ensureRnapPool(): void {
      if (transcriptionTracks.length === 0) return;
      const maxStrength = transcriptionTracks.reduce((max, t) => Math.max(max, t.strength), 0.01);

      // Spawn targeted RNAP from the edge nearest to each promoter.
      // Read-through TUs don't recruit new RNAP — they're already-transcribing polymerases.
      transcriptionTracks.forEach((track, i) => {
        if (track.continuedFromTerminatorInstanceId) return;
        const relativeStrength = Math.max(0.02, track.strength / maxStrength);
        const active = rnapAgents.filter(a => a.tuIndex === i && a.phase !== 'release').length;
        const max = Math.max(1, Math.min(3, Math.ceil(relativeStrength * 3)));
        if (active >= max) return;

        // Find nearest edge to promoter
        const promoterPt = pointOnRing(track.startAngle, R);
        const edgeSpawn = nearestEdgeTo(promoterPt);
        const toPromoter = { x: promoterPt.x - edgeSpawn.x, y: promoterPt.y - edgeSpawn.y };
        const dist = Math.hypot(toPromoter.x, toPromoter.y) || 1;

        rnapAgents.push({
          id: nextAgentId++,
          tuIndex: i,
          phase: 'wander',
          startAngle: track.startAngle,
          endAngle: track.endAngle,
          progress: 0,
          x: edgeSpawn.x,
          y: edgeSpawn.y,
          vx: (toPromoter.x / dist) * 0.010 + (Math.random() - 0.5) * 0.004,
          vy: (toPromoter.y / dist) * 0.010 + (Math.random() - 0.5) * 0.004,
          opacity: 0.0,
          trailPoints: [],
          releaseProgress: 0,
          mRNASpawned: false,
        });
      });
    }

    function ensureRibosomes(): void {
      if (!engineOutput) return;

      const outputTotal = Object.values(engineOutput.proteins).reduce((sum, value) => sum + value, 0);
      const targetCount = outputTotal <= 0 ? 0 : Math.max(2, Math.min(8, Math.ceil(outputTotal / 2)));

      while (ribosomes.length < targetCount) {
        const spawn = randomCytoplasmPoint();
        ribosomes.push({
          id: nextAgentId++,
          phase: 'wander',
          x: spawn.x,
          y: spawn.y,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          opacity: 0.88,
          targetMRNAId: null,
          targetProduct: null,
          targetComponentIndex: null,
          progress: 0,
          chain: [],
        });
      }

      if (ribosomes.length > targetCount) {
        ribosomes = ribosomes.slice(0, targetCount);
      }
    }

    function seedActivePolymerases(): void {
      if (!engineOutput || rnapAgents.length > 0 || transcriptionTracks.length === 0) return;
      // Bootstrap with a few already-transcribing agents so the level doesn't start empty
      for (const [i, track] of transcriptionTracks.slice(0, 3).entries()) {
        const progress = 0.18 + i * 0.24;
        const angle = interpolateAngle(track.startAngle, track.endAngle, Math.min(0.82, progress));
        const point = pointOnRing(angle, R + 4);
        const trail: { x: number; y: number }[] = [];
        const steps = Math.floor(progress * 24);
        for (let s = 0; s <= steps; s++) {
          const a = interpolateAngle(track.startAngle, track.endAngle, s / steps * Math.min(0.82, progress));
          trail.push(pointOnRing(a, R + 10));
        }
        rnapAgents.push({
          id: nextAgentId++,
          tuIndex: i,
          phase: 'transcribe',
          startAngle: track.startAngle,
          endAngle: track.endAngle,
          progress: Math.min(0.82, progress),
          x: point.x,
          y: point.y,
          vx: 0,
          vy: 0,
          opacity: 0.9,
          trailPoints: trail,
          releaseProgress: 0,
          mRNASpawned: false,
        });
      }
    }

    function startTranslationIfIdle(): void {
      const dockedTranscripts = mRNAMolecules.filter((m) => m.phase === 'docked' && codingTargets(m).length > 0);
      if (dockedTranscripts.length === 0) return;

      // Assign idle ribosomes to available transcripts — each one independently
      const idleIndices = ribosomes
        .map((r, i) => ({ r, i }))
        .filter(({ r }) => r.phase === 'wander');
      if (idleIndices.length === 0) return;

      // Only push if the busy fraction is low (avoid over-assigning)
      const busyCount = ribosomes.filter(r => r.phase !== 'wander').length;
      if (busyCount >= Math.ceil(ribosomes.length * 0.75)) return;

      // Pick one random idle ribosome per call
      const pick = idleIndices[Math.floor(Math.random() * idleIndices.length)];
      const target = chooseTranscriptForTranslation(dockedTranscripts);
      if (!target) return;
      const translationTarget = chooseTranslationTarget(target);
      if (!translationTarget) return;

      ribosomes = ribosomes.map((ribosome, index) => index === pick.i
        ? {
            ...ribosome,
            phase: 'dock',
            targetMRNAId: target.id,
            targetProduct: translationTarget.product,
            targetComponentIndex: translationTarget.componentIndex,
            progress: 0,
            chain: [],
          }
        : ribosome);
    }

    function tick(time: number): void {
      frameId = requestAnimationFrame(tick);

      const dt = lastTime === 0 ? 16 : Math.min(50, time - lastTime);
      lastTime = time;

      if (!engineOutput) {
        rnapAgents = [];
        ribosomes = [];
        mRNAMolecules = [];
        peptideChains = [];
        return;
      }

      const speedScale = engineOutput.cellHealth.state === 'burdened' ? 0.65 : 1;
      seedActivePolymerases();
      ensureRnapPool();
      ensureRibosomes();

      const nextRnapAgents: RnapAgent[] = [];
      for (const agent of rnapAgents) {
        const track = transcriptionTracks[agent.tuIndex];

        // --- WANDER: slow drift toward promoter from the nearest edge ---
        if (agent.phase === 'wander') {
          const vx = agent.vx;
          const vy = agent.vy;
          const x = agent.x + vx * dt;
          const y = agent.y + vy * dt;
          const opacity = Math.min(0.82, agent.opacity + dt * 0.0012);
          // Transition to approach once within ~1.6x ring radius of center
          const distToCenter = Math.hypot(x - CX, y - CY);
          if (distToCenter < R * 1.6) {
            nextRnapAgents.push({ ...agent, phase: 'approach', x, y, opacity });
          } else {
            nextRnapAgents.push({ ...agent, x, y, vx, vy, opacity });
          }
          continue;
        }

        // --- APPROACH: move toward the promoter on the ring ---
        if (agent.phase === 'approach') {
          if (!track) { nextRnapAgents.push({ ...agent, phase: 'wander' }); continue; }
          const target = pointOnRing(track.startAngle, R + 4);
          const dx = target.x - agent.x;
          const dy = target.y - agent.y;
          const dist = Math.hypot(dx, dy) || 1;
          const step = dt * 0.12 * speedScale;
          const x = agent.x + (dx / dist) * Math.min(step, dist);
          const y = agent.y + (dy / dist) * Math.min(step, dist);
          if (dist < 6) {
            nextRnapAgents.push({ ...agent, phase: 'transcribe', x, y, vx: 0, vy: 0, progress: 0, trailPoints: [], startAngle: track.startAngle, endAngle: track.endAngle, opacity: 0.9 });
          } else {
            nextRnapAgents.push({ ...agent, x, y });
          }
          continue;
        }

        // --- TRANSCRIBE: move along ring, grow the RNA trail ---
        if (agent.phase === 'transcribe') {
          if (!track) { nextRnapAgents.push({ ...agent, phase: 'wander' }); continue; }
          const rawProgress = agent.progress + dt * 0.00024 * speedScale;
          const angle = interpolateAngle(track.startAngle, track.endAngle, Math.min(rawProgress, 1));
          const point = pointOnRing(angle, R + 4);

          // Accumulate trail point every ~3% progress
          const newTrail = [...agent.trailPoints];
          const lastAngle = newTrail.length > 0
            ? interpolateAngle(track.startAngle, track.endAngle, (newTrail.length - 1) / 34)
            : track.startAngle - 1;
          if (angle - lastAngle > (normalizeArc(track.startAngle, track.endAngle) / 34)) {
            newTrail.push(pointOnRing(angle, R + 10));
          }

          if (rawProgress >= 1.0) {
            // Complete — enter release phase; RNAP drifts radially out
            const releaseDir = pointOnRing(track.endAngle, 1);
            nextRnapAgents.push({
              ...agent,
              phase: 'release',
              progress: 1,
              x: point.x,
              y: point.y,
              vx: (point.x - CX) * 0.002,
              vy: (point.y - CY) * 0.002,
              trailPoints: newTrail,
              releaseProgress: 0,
            });
            void releaseDir;
          } else {
            nextRnapAgents.push({ ...agent, progress: rawProgress, x: point.x, y: point.y, trailPoints: newTrail });
          }
          continue;
        }

        // --- RELEASE: spawn mRNA immediately, RNAP drifts off-screen and despawns ---
        if (agent.phase === 'release') {
          // Spawn mRNA on first frame of release (at terminator position)
          if (!agent.mRNASpawned) {
            const tuTrack = track ?? transcriptionTracks[agent.tuIndex];
            if (tuTrack && tuTrack.components.length > 0) {
              const slotTracks = transcriptionTracks.filter(t => t.components.length > 0 && !t.continuedFromTerminatorInstanceId).slice(0, 6);
              const slotIndex = Math.max(0, slotTracks.findIndex(t => t.id === tuTrack.id));
              const slotCount = Math.max(1, slotTracks.length);
              const dock = transcriptDockPoint(slotIndex, slotCount);

              // Always spawn a new traveling mRNA — it merges with any existing card on arrival
              const mrnaId = nextAgentId++;
              const anchor = { x: agent.x, y: agent.y };
              const relTrail = agent.trailPoints.length >= 2
                ? agent.trailPoints.map(p => ({ x: p.x - anchor.x, y: p.y - anchor.y }))
                : [{ x: 0, y: -8 }, { x: 0, y: 8 }];
              mRNAMolecules.push({
                id: mrnaId,
                tuIndex: agent.tuIndex,
                phase: 'travel',
                x: anchor.x,
                y: anchor.y,
                targetX: dock.x,
                targetY: dock.y,
                opacity: tuTrack.continuedFromTerminatorInstanceId ? 0.72 : 0.92,
                len: transcriptLength(tuTrack.components.length),
                angle: 0,
                geneProducts: [...tuTrack.geneProducts],
                components: [...tuTrack.components],
                color: getProductColor(tuTrack.geneProducts[0] ?? ''),
                strength: tuTrack.strength,
                copyNumber: 1,
                pulse: 1,
                readThroughFraction: tuTrack.readThroughFraction,
                originPath: resamplePath(relTrail, MRNA_PATH_N),
                strandPath: resamplePath(computeStrandPath(tuTrack.components, mrnaId), MRNA_PATH_N),
                morphProgress: 0,
                rate: 0,
                rateTimer: 0,
                rateCount: 1,
              });
            }
          }

          // RNAP drifts radially outward; accelerate away from ring
          const outDir = { x: agent.x - CX, y: agent.y - CY };
          const outLen = Math.hypot(outDir.x, outDir.y) || 1;
          const vx = agent.vx + (outDir.x / outLen) * 0.018 * dt * 0.016;
          const vy = agent.vy + (outDir.y / outLen) * 0.018 * dt * 0.016;
          const x = agent.x + vx * dt;
          const y = agent.y + vy * dt;
          const opacity = Math.max(0, agent.opacity - dt * 0.0018);

          // Despawn when off-screen
          if (x < -60 || x > 460 || y < -60 || y > 460) continue;

          nextRnapAgents.push({ ...agent, mRNASpawned: true, releaseProgress: agent.releaseProgress + dt * 0.001, x, y, vx, vy, opacity });
          continue;
        }
      }

      rnapAgents = nextRnapAgents;

      // Keep messenger RNA molecules anchored in on-screen transcript slots.
      mRNAMolecules = mRNAMolecules
        .map((mrna) => {
          const morphProgress = Math.min(1, mrna.morphProgress + dt * 0.0014);
          const pulse = Math.max(0, mrna.pulse - dt * 0.0018);
          if (mrna.phase === 'docked') {
            return { ...mrna, x: mrna.targetX, y: mrna.targetY, opacity: Math.min(0.95, mrna.opacity + dt * 0.0002), pulse, morphProgress };
          }
          const dx = mrna.targetX - mrna.x;
          const dy = mrna.targetY - mrna.y;
          const dist = Math.hypot(dx, dy) || 1;
          const step = dt * 0.072;
          const nx = mrna.x + (dx / dist) * Math.min(step, dist);
          const ny = mrna.y + (dy / dist) * Math.min(step, dist);
          if (dist < 3) {
            return { ...mrna, phase: 'docked' as const, x: mrna.targetX, y: mrna.targetY, opacity: 0.95, pulse, morphProgress: 1 };
          }
          return { ...mrna, x: nx, y: ny, opacity: 0.92, pulse, morphProgress };
        })
        .slice(-8);

      // Merge multiple docked mRNAs for the same TU into the original card
      {
        const dockedByTu = new Map<number, MRNAMolecule[]>();
        for (const m of mRNAMolecules) {
          if (m.phase === 'docked') {
            const list = dockedByTu.get(m.tuIndex) ?? [];
            list.push(m);
            dockedByTu.set(m.tuIndex, list);
          }
        }
        const absorbedIds = new Set<number>();
        const copyBoosts = new Map<number, number>();
        for (const [, group] of dockedByTu) {
          if (group.length <= 1) continue;
          group.sort((a, b) => a.id - b.id);
          const canonical = group[0];
          group.slice(1).forEach(m => absorbedIds.add(m.id));
          copyBoosts.set(canonical.id, (copyBoosts.get(canonical.id) ?? 0) + group.length - 1);
        }
        if (absorbedIds.size > 0) {
          mRNAMolecules = mRNAMolecules
            .filter(m => !absorbedIds.has(m.id))
            .map(m => {
              const boost = copyBoosts.get(m.id) ?? 0;
              return boost > 0 ? { ...m, copyNumber: Math.min(10, m.copyNumber + boost), pulse: 1, rateCount: m.rateCount + boost } : m;
            });
        }
      }

      // mRNA degradation + rate tracking
      mRNAMolecules = mRNAMolecules
        .map(mrna => {
          const copyNumber = mrna.phase === 'docked'
            ? Math.max(0, mrna.copyNumber - dt * 0.00018)
            : mrna.copyNumber;
          const rateTimer = mrna.rateTimer + dt;
          const rateCount = mrna.rateCount;
          // Refresh rate every 10 s
          if (rateTimer >= 10000) {
            return { ...mrna, copyNumber, rate: rateCount * 6, rateCount: 0, rateTimer: 0 };
          }
          return { ...mrna, copyNumber, rateTimer };
        })
        .filter(mrna => mrna.copyNumber > 0.08 || mrna.phase !== 'docked');

      startTranslationIfIdle();

      ribosomes = ribosomes.map((ribosome) => {
        if (ribosome.phase === 'wander') {
          const jitterX = (Math.random() - 0.5) * 0.015;
          const jitterY = (Math.random() - 0.5) * 0.015;
          const vx = ribosome.vx * 0.99 + jitterX;
          const vy = ribosome.vy * 0.99 + jitterY;
          const x = clamp(ribosome.x + vx * dt, 76, 324);
          const y = clamp(ribosome.y + vy * dt, 48, 338);
          const boundedVx = x === 76 || x === 324 ? -vx * 0.55 : vx;
          const boundedVy = y === 48 || y === 338 ? -vy * 0.55 : vy;

          const dockedTranscripts = mRNAMolecules.filter((m) => m.phase === 'docked' && codingTargets(m).length > 0);
          const copyCount = dockedTranscripts.reduce((sum, mrna) => sum + mrna.copyNumber, 0);
          const bindChance = Math.min(0.08, (0.006 + copyCount * 0.004) * speedScale);
          if (dockedTranscripts.length > 0 && Math.random() < bindChance) {
            const target = chooseTranscriptForTranslation(dockedTranscripts);
            if (!target) return { ...ribosome, x, y, vx: boundedVx, vy: boundedVy };
            const translationTarget = chooseTranslationTarget(target);
            if (translationTarget) {
              return {
                ...ribosome,
                phase: 'dock',
                x,
                y,
                vx: boundedVx,
                vy: boundedVy,
                targetMRNAId: target.id,
                targetProduct: translationTarget.product,
                targetComponentIndex: translationTarget.componentIndex,
              };
            }
          }

          return { ...ribosome, x, y, vx: boundedVx, vy: boundedVy };
        }

        if (ribosome.phase === 'dock') {
          const targetMRNA = mRNAMolecules.find((m) => m.id === ribosome.targetMRNAId);
          if (!targetMRNA || ribosome.targetComponentIndex === null) {
            return { ...ribosome, phase: 'wander', targetMRNAId: null, targetProduct: null, targetComponentIndex: null };
          }

          const startT = Math.max(0, (ribosome.targetComponentIndex - 1) / Math.max(1, targetMRNA.components.length));
          const relPos = posOnStrand(targetMRNA.strandPath, startT);
          const targetX = targetMRNA.x + relPos.x;
          const targetY = targetMRNA.y + relPos.y;

          const dx = targetX - ribosome.x;
          const dy = targetY - ribosome.y;
          const dist = Math.hypot(dx, dy) || 1;
          const step = dt * 0.075 * speedScale;
          const x = ribosome.x + (dx / dist) * Math.min(step, dist);
          const y = ribosome.y + (dy / dist) * Math.min(step, dist);

          if (dist < 4) {
            return {
              ...ribosome,
              phase: 'translate',
              x, y,
              progress: 0,
            };
          }

          return { ...ribosome, x, y };
        }

        // Translate one coding region on the bound messenger RNA.
        const targetMRNA = mRNAMolecules.find((m) => m.id === ribosome.targetMRNAId);
        if (!targetMRNA || ribosome.targetComponentIndex === null || !ribosome.targetProduct) {
          const spawn = randomCytoplasmPoint();
          return { ...ribosome, phase: 'wander', x: spawn.x, y: spawn.y, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25, targetMRNAId: null, targetProduct: null, targetComponentIndex: null, progress: 0, chain: [] };
        }

        const progress = ribosome.progress + dt * 0.00028 * speedScale;
        const n = Math.max(1, targetMRNA.components.length);
        // Find RBS (one component before gene) as start, gene end as finish
        const startT = Math.max(0, (ribosome.targetComponentIndex - 1) / n);
        const endT = Math.min(1, (ribosome.targetComponentIndex + 0.8) / n);
        // Follow exact strandPath curve — interpolate t along the path
        const curT = startT + (endT - startT) * Math.min(progress, 1);
        const curRel = posOnStrand(targetMRNA.strandPath, curT);
        const x = targetMRNA.x + curRel.x;
        const y = targetMRNA.y + curRel.y;

        // Grow peptide bead at ribosome exit tunnel (right side, slightly below)
        const exitX = x + 6;
        const exitY = y + 3;
        const newChain = [...ribosome.chain];
        if (newChain.length === 0 || Math.floor(progress * 10) > newChain.length - 1) {
          newChain.push({ x: exitX, y: exitY, px: exitX, py: exitY });
        }
        // Verlet integration with gravity for hanging beads (first bead pinned to exit)
        const gravity = 0.014 * (dt / 16);
        for (let bi = 1; bi < newChain.length; bi++) {
          const bead = newChain[bi];
          const vx2 = (bead.x - bead.px) * 0.82;
          const vy2 = (bead.y - bead.py) * 0.82;
          newChain[bi] = { x: bead.x + vx2, y: bead.y + vy2 + gravity, px: bead.x, py: bead.y };
        }
        newChain[0] = { x: exitX, y: exitY, px: exitX, py: exitY };
        // Distance constraints — enforce bead spacing of 4px
        const beadSpacing = 4;
        for (let bi = 1; bi < newChain.length; bi++) {
          const a = newChain[bi - 1];
          const b = newChain[bi];
          const dx2 = b.x - a.x;
          const dy2 = b.y - a.y;
          const d2 = Math.hypot(dx2, dy2) || 1;
          const diff2 = (d2 - beadSpacing) / d2 * 0.5;
          if (bi > 1) { a.x += dx2 * diff2; a.y += dy2 * diff2; }
          b.x -= dx2 * diff2;
          b.y -= dy2 * diff2;
        }

        if (progress >= 1) {
          translatedProteinLevels = {
            ...translatedProteinLevels,
            [ribosome.targetProduct]: Math.min(
              engineOutput.proteins[ribosome.targetProduct] ?? Number.POSITIVE_INFINITY,
              (translatedProteinLevels[ribosome.targetProduct] ?? 0) + 1,
            ),
          };
          if (newChain.length > 1) {
            // Zero stored velocities so beads don't explode on detachment
            const driftAngle = Math.random() * Math.PI * 2;
            peptideChains.push({
              id: nextAgentId++,
              beads: newChain.map(b => ({ x: b.x, y: b.y, px: b.x, py: b.y })),
              color: getProductColor(ribosome.targetProduct),
              complete: true,
              foldProgress: 0,
              age: 0,
              driftVx: Math.cos(driftAngle) * 0.006,
              driftVy: Math.sin(driftAngle) * 0.006,
              product: ribosome.targetProduct,
            });
          }
          const spawn = randomCytoplasmPoint();
          return {
            ...ribosome,
            phase: 'wander',
            x: spawn.x, y: spawn.y,
            vx: (Math.random() - 0.5) * 0.25,
            vy: (Math.random() - 0.5) * 0.25,
            targetMRNAId: null, targetProduct: null, targetComponentIndex: null, progress: 0, chain: [],
          };
        }

        return { ...ribosome, x, y, progress, chain: newChain };
      });

      // Detached peptide chain: fold over ~4s, drift as stable protein clump, degrade after ~12s
      peptideChains = peptideChains.map(chain => {
        const age = chain.age + dt;
        const fp = Math.min(1, chain.foldProgress + dt * 0.00025);
        const n = Math.max(1, chain.beads.length);
        const cx2 = chain.beads.reduce((s, b) => s + b.x, 0) / n;
        const cy2 = chain.beads.reduce((s, b) => s + b.y, 0) / n;

        // Drift moves the whole chain together
        const drift = { x: chain.driftVx * dt, y: chain.driftVy * dt };

        const foldTargets = proteinFoldTargets(chain.product, n);
        let beads: PeptideBead[];
        if (fp < 1) {
          // Folding: spring toward protein-specific target positions
          const foldStrength = fp * 0.04;
          beads = chain.beads.map((b, bi) => {
            const tgt = foldTargets[bi] ?? { x: 0, y: 0 };
            const nx = b.x + (cx2 + tgt.x - b.x) * foldStrength + drift.x + (Math.random() - 0.5) * 0.1;
            const ny = b.y + (cy2 + tgt.y - b.y) * foldStrength + drift.y + (Math.random() - 0.5) * 0.1;
            return { x: nx, y: ny, px: nx, py: ny };
          });
        } else {
          // Fully folded: hold target positions, Brownian drift as a unit
          beads = chain.beads.map((b, bi) => {
            const tgt = foldTargets[bi] ?? { x: 0, y: 0 };
            return {
              x: cx2 + tgt.x + drift.x + (Math.random() - 0.5) * 0.06,
              y: cy2 + tgt.y + drift.y + (Math.random() - 0.5) * 0.06,
              px: b.x, py: b.y,
            };
          });
        }

        return { ...chain, beads, foldProgress: fp, age };
      }).filter(chain => chain.age < (chain.beads.length > 4 ? 13000 : 9000));

    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  });

</script>

{#if engineOutput}
  <svg class="anim" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    {#if healthClass}
      <circle class={healthClass} cx={CX} cy={CY} r={R} fill="none" stroke-width="4" />
    {/if}

    {#each transcriptionTracks as track (track.id)}
      <path
        d={describeArc(track.startAngle, track.endAngle, R + 10)}
        class={track.continuedFromTerminatorInstanceId ? 'tu-track read-through-track' : 'tu-track'}
        opacity={track.continuedFromTerminatorInstanceId ? 0.42 : 0.78}
      />
    {/each}

    <!-- Eukaryotic nuclear boundary -->
    {#if hostMode === 'eukaryotic'}
      {@const nx = CX + R * 0.65}
      {@const ny = CY}
      {@const erd = 5}
      <ellipse
        cx={CX} cy={CY}
        rx={R * 0.65} ry={R * 0.55}
        fill="none"
        stroke="#6366f1"
        stroke-width="1.4"
        stroke-dasharray="8 4"
        opacity="0.45"
        pointer-events="none"
      />
      <!-- Nuclear pore gap (clip a small arc at 0° using a white rect trick) -->
      <rect
        x={nx - erd} y={CY - erd}
        width={erd * 2} height={erd * 2}
        fill="#0f0e0d"
        opacity="0.92"
        pointer-events="none"
      />
      <line
        x1={nx - erd} y1={CY - erd}
        x2={nx - erd} y2={CY + erd}
        stroke="#818cf8" stroke-width="1.2" opacity="0.6"
        pointer-events="none"
      />
      <line
        x1={nx + erd} y1={CY - erd}
        x2={nx + erd} y2={CY + erd}
        stroke="#818cf8" stroke-width="1.2" opacity="0.6"
        pointer-events="none"
      />
    {/if}

    {#each rnapAgents as agent (agent.id)}
      {#if agent.phase === 'transcribe' && agent.progress > 0.01}
        {@const transcribedAngle = interpolateAngle(agent.startAngle, agent.endAngle, agent.progress)}
        <path d={describeArc(agent.startAngle, transcribedAngle, R + 10)} class="mrna-trace" />
      {/if}
      <g transform="translate({agent.x},{agent.y})" opacity={agent.opacity}>
        <path d="M -12 -2 C -10 -9, 1 -11, 9 -6 C 15 -2, 13 8, 5 10 C -4 12, -14 7, -12 -2 Z" class="rnap-body" />
        <circle cx="-4" cy="-1" r="4" class="rnap-pocket" />
        <rect x="1.5" y="-2.4" width="8" height="4.8" rx="2.4" class="rnap-channel" />
        {#if agent.phase === 'transcribe' || agent.phase === 'release'}
          {@const tailLength = 8 + agent.progress * 28}
          <path d={`M 8 4 q ${tailLength * 0.4} 6 ${tailLength} 4`} class="rnap-rna-tail" />
        {/if}
      </g>
    {/each}

    {#each mRNAMolecules as mrna (mrna.id)}
      {@const curPath = mrna.originPath.map((op, i) => {
        const sp = mrna.strandPath[i] ?? { x: 0, y: 0 };
        const t = mrna.morphProgress;
        return { x: op.x * (1 - t) + sp.x * t, y: op.y * (1 - t) + sp.y * t };
      })}
      {@const strandBottom = curPath.reduce((mx, p) => Math.max(mx, p.y), 0)}
      {@const strandPoints = curPath.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
      {@const rateStr = mrna.rate > 0 ? `${mrna.rate.toFixed(1)}×/min` : '…'}
      {@const pt5 = curPath[0] ?? { x: 0, y: 0 }}
      {@const pt3 = curPath[curPath.length - 1] ?? { x: 0, y: 0 }}
      <g transform="translate({mrna.x},{mrna.y})" opacity={mrna.opacity} pointer-events="none">
        <!-- mRNA backbone strand -->
        <polyline points={strandPoints} fill="none" stroke="#22d3ee" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" opacity={mrna.pulse > 0 ? 1 : 0.72} />
        <!-- 5' (cyan) and 3' (amber) end caps -->
        <circle cx={pt5.x} cy={pt5.y} r="3" fill="#22d3ee" opacity="0.7" />
        <circle cx={pt3.x} cy={pt3.y} r="3" fill="#f59e0b" opacity="0.7" />
        <!-- Component markers along strand -->
        {#each mrna.components as comp, ci (comp.id)}
          {@const t = (ci + 0.5) / Math.max(1, mrna.components.length)}
          {@const pos = posOnStrand(curPath, t)}
          {#if comp.type === 'gene'}
            <circle cx={pos.x} cy={pos.y} r="6.5" fill={comp.color} stroke="#0f172a" stroke-width="1" />
            <text x={pos.x} y={pos.y - 10} text-anchor="middle" font-size="9" fill={comp.color} class="mrna-seq-label">{comp.label}</text>
            <!-- Stop codon marker (UAA/UAG/UGA) after each gene -->
            {@const stopT = (ci + 0.88) / Math.max(1, mrna.components.length)}
            {@const stopPos = posOnStrand(curPath, stopT)}
            <text x={stopPos.x} y={stopPos.y + 3} text-anchor="middle" font-size="7" fill="#ef4444" class="mrna-seq-label" opacity="0.7">■</text>
          {:else if comp.type === 'rbs'}
            <circle cx={pos.x} cy={pos.y} r="4" fill="#94a3b8" stroke="#0f172a" stroke-width="0.8" />
            <text x={pos.x} y={pos.y - 7} text-anchor="middle" font-size="7" fill="#94a3b8" class="mrna-seq-label" opacity="0.7">SD</text>
          {:else if comp.type === 'linker'}
            <rect x={pos.x - 4} y={pos.y - 2.5} width="8" height="5" rx="2" fill="#64748b" stroke="#0f172a" stroke-width="0.7" />
          {/if}
        {/each}
        <!-- Rate counter and read-through label -->
        <text y={strandBottom + 14} text-anchor="middle" class="mrna-seq-label">{rateStr}</text>
        {#if mrna.readThroughFraction !== undefined}
          <text y={strandBottom + 26} text-anchor="middle" font-size="10" fill="#fbbf24">{Math.round(mrna.readThroughFraction * 100)}% RT</text>
        {/if}
      </g>
    {/each}

    <!-- Detached peptide chains folding into stable protein clumps -->
    {#each peptideChains as chain (chain.id)}
      {@const maxAge = chain.beads.length > 4 ? 13000 : 9000}
      {@const fade = chain.age > maxAge - 3000 ? Math.max(0, 1 - (chain.age - (maxAge - 3000)) / 3000) : 1}
      {#if chain.beads.length > 1}
        {#if chain.foldProgress < 0.7}
          <!-- Still folding: connected bead chain -->
          <polyline
            points={chain.beads.map(b => `${b.x.toFixed(1)},${b.y.toFixed(1)}`).join(' ')}
            fill="none" stroke={chain.color} stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"
            opacity={0.45 * fade} pointer-events="none"
          />
          {#each chain.beads as bead, bi (bi)}
            <circle cx={bead.x} cy={bead.y} r={1.8 + (bi % 2) * 0.5} fill={chain.color} stroke="rgba(0,0,0,0.2)" stroke-width="0.5" opacity={0.85 * fade} pointer-events="none" />
          {/each}
        {:else}
          <!-- Folded protein: protein-specific subunit arrangement -->
          {@const pcx = chain.beads.reduce((s, b) => s + b.x, 0) / chain.beads.length}
          {@const pcy = chain.beads.reduce((s, b) => s + b.y, 0) / chain.beads.length}
          {@const prod = chain.product.toLowerCase()}
          {#if prod === 'lacz'}
            <!-- β-galactosidase: 4 subunits (tetramer, 2×2) -->
            {#each [[-6,-6],[6,-6],[-6,6],[6,6]] as [ox, oy], si (si)}
              <circle cx={pcx + ox} cy={pcy + oy} r="4.5" fill={chain.color} stroke="#1e3a8a" stroke-width="0.9" opacity={0.88 * fade} pointer-events="none" />
            {/each}
            <circle cx={pcx} cy={pcy} r="2" fill="rgba(0,0,0,0.25)" opacity={fade} pointer-events="none" />
          {:else if prod === 'cat'}
            <!-- Chloramphenicol acetyltransferase: 3 subunits (trimer) -->
            {#each [[0,-6.5],[5.6,3.25],[-5.6,3.25]] as [ox, oy], si (si)}
              <circle cx={pcx + ox} cy={pcy + oy} r="4.2" fill={chain.color} stroke="#064e3b" stroke-width="0.9" opacity={0.88 * fade} pointer-events="none" />
            {/each}
          {:else if prod.includes('gfp') || prod.includes('rfp') || prod.includes('yfp') || prod.includes('cfp')}
            <!-- Fluorescent protein: beta-barrel (ring of beads + chromophore) -->
            {#each Array.from({length: 8}, (_, k) => k) as k (k)}
              {@const angle = (k / 8) * Math.PI * 2}
              <circle cx={pcx + Math.cos(angle) * 4.5} cy={pcy + Math.sin(angle) * 4.5} r="2" fill={chain.color} stroke="#0f172a" stroke-width="0.5" opacity={0.78 * fade} pointer-events="none" />
            {/each}
            <circle cx={pcx} cy={pcy} r="2.8" fill={chain.color} stroke="none" opacity={0.95 * fade} class="fp-chromophore" pointer-events="none" />
          {:else}
            <!-- Default: radial bead cluster (generic enzyme) -->
            {#each chain.beads as bead, bi (bi)}
              <circle cx={bead.x} cy={bead.y} r={2 + (bi % 3) * 0.4} fill={chain.color} stroke="rgba(0,0,0,0.15)" stroke-width="0.5" opacity={0.82 * fade} pointer-events="none" />
            {/each}
          {/if}
        {/if}
      {/if}
    {/each}

    {#each ribosomes as ribosome (ribosome.id)}
      <!-- Growing peptide chain attached to this ribosome -->
      {#if ribosome.phase === 'translate' && ribosome.chain.length > 1 && ribosome.targetProduct}
        {@const peptideColor = getProductColor(ribosome.targetProduct)}
        <polyline
          points={ribosome.chain.map(b => `${b.x.toFixed(1)},${b.y.toFixed(1)}`).join(' ')}
          fill="none" stroke={peptideColor} stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"
          opacity="0.55" pointer-events="none"
        />
        {#each ribosome.chain as bead, bi (bi)}
          <circle cx={bead.x} cy={bead.y} r={1.8 + (bi % 2) * 0.4} fill={peptideColor} stroke="rgba(0,0,0,0.2)" stroke-width="0.5" opacity="0.85" pointer-events="none" />
        {/each}
      {/if}
      <g transform="translate({ribosome.x},{ribosome.y})" opacity={ribosome.opacity}>
        <ellipse cx="-3.2" cy="0" rx="5.2" ry="4.1" class="ribo-large" />
        <ellipse cx="3.5" cy="-0.2" rx="4" ry="3" class="ribo-small" />
        <circle cx="-1.2" cy="-0.4" r="1.2" class="ribo-groove" />
      </g>
    {/each}

    {#each parts as part (part.instanceId)}
      {#if litGeneIds.has(part.instanceId)}
        {@const idx = indexByInstanceId.get(part.instanceId)}
        {@const angle = idx === undefined ? 0 : partAngles[idx] ?? 0}
        {@const point = pointOnRing(angle, R)}
        <circle cx={point.x} cy={point.y} r="13" class="gene-halo" />
      {/if}
    {/each}

    {#if clpxpVisible}
      {@const hx = CX + 155}
      {@const hy = CY}
      <polygon
        points={[0, 1, 2, 3, 4, 5].map((k) => {
          const angle = (k * 60 - 90) * Math.PI / 180;
          return `${hx + 10 * Math.cos(angle)},${hy + 10 * Math.sin(angle)}`;
        }).join(' ')}
        fill="none"
        stroke="#f97316"
        stroke-width="2"
        opacity="0.85"
      />
      {#each Array(clpxpQueueCount) as _, queueIdx (queueIdx)}
        <circle cx={hx - 18 - queueIdx * 10} cy={hy} r="3" fill="#f97316" opacity={0.7 - queueIdx * 0.15} />
      {/each}
    {/if}
  </svg>
{/if}

<style>
  .anim {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .tu-track {
    fill: none;
    stroke: #7dd3fc;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-dasharray: 5 7;
    animation: flow-dash 1.6s linear infinite;
  }

  .read-through-track {
    stroke: #fbbf24;
    stroke-dasharray: 4 5;
  }

  .transcript-release-particle {
    filter: drop-shadow(0 0 4px #22d3ee);
  }

  .mrna-trace {
    fill: none;
    stroke: #7dd3fc;
    stroke-width: 2.4;
    stroke-linecap: round;
    opacity: 0.9;
  }

  .mrna-backbone {
    fill: none;
    stroke: #22d3ee;
    stroke-width: 1.5;
    stroke-linecap: round;
    opacity: 0.6;
  }

  .mrna-blob {
    pointer-events: none;
  }

  .mrna-blob-pulse {
    filter: drop-shadow(0 0 8px rgba(34, 211, 238, 0.5));
  }

  .mrna-squiggle {
    fill: none;
    stroke: #22d3ee;
    stroke-width: 1.2;
    stroke-linecap: round;
    opacity: 0.45;
  }

  .mrna-seq-label {
    font-family: var(--font-mono);
    font-size: 10px;
    fill: #64748b;
  }

  .translation-trace {
    fill: none;
    stroke: #fef08a;
    stroke-width: 2;
    stroke-linecap: round;
    opacity: 0.82;
  }

  .transcript-panel {
    fill: rgba(15, 23, 42, 0.82);
    stroke: rgba(125, 211, 252, 0.22);
    stroke-width: 1;
  }

  .transcript-panel.copied {
    stroke: rgba(34, 211, 238, 0.72);
    filter: drop-shadow(0 0 6px rgba(34, 211, 238, 0.3));
  }

  .copy-badge {
    fill: rgba(8, 47, 73, 0.94);
    stroke: rgba(125, 211, 252, 0.55);
    stroke-width: 1;
  }

  .copy-text {
    fill: #cffafe;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
  }

  .rnap-body {
    fill: #f59e0b;
    stroke: #78350f;
    stroke-width: 1;
  }

  .rnap-lobe {
    fill: none;
    stroke: #fde68a;
    stroke-width: 1.4;
    stroke-linecap: round;
    opacity: 0.85;
  }

  .rnap-pocket {
    fill: #fcd34d;
    stroke: #78350f;
    stroke-width: 0.8;
  }

  .rnap-channel {
    fill: #fef3c7;
    stroke: #78350f;
    stroke-width: 0.6;
  }

  .rnap-rna-tail {
    fill: none;
    stroke: #22d3ee;
    stroke-width: 1.7;
    stroke-linecap: round;
  }

  .ribo-large {
    fill: #f8fafc;
    stroke: #334155;
    stroke-width: 1;
  }

  .ribo-small {
    fill: #e2e8f0;
    stroke: #334155;
    stroke-width: 1;
  }

  .ribo-groove {
    fill: #94a3b8;
    opacity: 0.78;
  }

  .nascent-peptide {
    fill: none;
    stroke-width: 2.2;
    stroke-linecap: round;
    opacity: 0.86;
  }

  .nascent-protein {
    opacity: 0.88;
    filter: drop-shadow(0 0 4px rgba(255,255,255,0.18));
  }

  .fp-chromophore {
    filter: drop-shadow(0 0 3px currentColor);
    animation: chromophore-pulse 1.8s ease-in-out infinite;
  }

  @keyframes chromophore-pulse {
    0%, 100% { opacity: 0.85; }
    50% { opacity: 1; }
  }

  .gene-halo {
    fill: none;
    stroke: #fde047;
    stroke-width: 1.8;
    opacity: 0.55;
    animation: gene-pulse 1.25s ease-in-out infinite;
  }

  .pulse-amber {
    stroke: #f59e0b;
    animation: pulse-ring 1.4s ease-in-out infinite;
  }

  .pulse-red {
    stroke: #ef4444;
    animation: pulse-ring 0.8s ease-in-out infinite;
  }

  @keyframes pulse-ring {
    0%, 100% { opacity: 0.15; }
    50% { opacity: 0.65; }
  }

  @keyframes gene-pulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.7; }
  }

  @keyframes flow-dash {
    to { stroke-dashoffset: -12; }
  }
</style>
