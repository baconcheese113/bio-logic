<script lang="ts">
  import type { PlacedPart, EngineOutput, PartType } from '../lib/types';
  import { PARTS_DEF_MAP } from '../lib/parts-grammar';
  import { CX, CY, R, pointOnRing, partAnglesFor } from '../lib/plasmid-utils';

  interface Props {
    parts: PlacedPart[];
    engineOutput: EngineOutput | null;
  }

  interface RnapAgent {
    id: number;
    tuIndex: number;
    phase: 'transcribe';
    startAngle: number;
    endAngle: number;
    progress: number;
    x: number;
    y: number;
    opacity: number;
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
    readThroughFraction?: number;
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
  }

  interface ProteinBurst {
    x: number;
    y: number;
    vx: number;
    vy: number;
    opacity: number;
    color: string;
  }

  interface FloatingEnzyme {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    opacity: number;
    color: string;
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

  let { parts, engineOutput }: Props = $props();

  let rnapAgents = $state<RnapAgent[]>([]);
  let ribosomes = $state<RibosomeAgent[]>([]);
  let mRNAMolecules = $state<MRNAMolecule[]>([]);
  let proteinBursts = $state<ProteinBurst[]>([]);
  let floatingEnzymes = $state<FloatingEnzyme[]>([]);
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

  function createDockedTranscript(track: TrackInfo, slotIndex: number, totalSlots: number): MRNAMolecule {
    const dock = transcriptDockPoint(slotIndex, totalSlots);
    return {
      id: 10000 + slotIndex,
      tuIndex: slotIndex,
      phase: 'docked',
      x: dock.x,
      y: dock.y,
      targetX: dock.x,
      targetY: dock.y,
      opacity: track.continuedFromTerminatorInstanceId ? 0.72 : 0.92,
      len: transcriptLength(track.components.length),
      angle: 0,
      geneProducts: [...track.geneProducts],
      components: [...track.components],
      color: getProductColor(track.geneProducts[0] ?? '') ?? '#22d3ee',
      strength: track.strength,
      readThroughFraction: track.readThroughFraction,
    };
  }

  function transcriptComponentOffset(mrna: MRNAMolecule, componentIndex: number): number {
    const count = Math.max(1, mrna.components.length);
    const step = mrna.len / count;
    return -mrna.len / 2 + step * componentIndex + step / 2;
  }

  function transcriptPoint(mrna: MRNAMolecule, offset: number): { x: number; y: number } {
    const angleRad = (mrna.angle * Math.PI) / 180;
    return {
      x: mrna.x + Math.cos(angleRad) * offset,
      y: mrna.y + Math.sin(angleRad) * offset,
    };
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

  function summarizeTranscript(mrna: MRNAMolecule): string {
    const labels = mrna.components.map(component => component.label);
    const text = labels.join(' -> ');
    return text.length > 42 ? `${text.slice(0, 39)}...` : text;
  }

  function proteinDisplayName(product: string): string {
    const names: Record<string, string> = {
      LacZ: 'LacZ',
      Cat: 'Cat',
      AmyE: 'AmyE',
      CcdB: 'CcdB',
      Protein1: 'P1',
      Protein2: 'P2',
      Protein3: 'P3',
    };
    return names[product] ?? product;
  }

  const meterProteins = $derived.by(() => {
    if (!engineOutput) return [] as Array<{ name: string; target: number }>;
    return Object.entries(engineOutput.proteins)
      .filter(([, level]) => level > 0.05)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, target]) => ({ name, target: Math.max(0.2, target) }));
  });

  function emitProteinBurstAt(x: number, y: number, color: string): void {
    for (let i = 0; i < 4; i++) {
      const burstAngle = Math.random() * 2 * Math.PI;
      const speed = 0.018 + Math.random() * 0.022;
      proteinBursts.push({
        x, y,
        vx: Math.cos(burstAngle) * speed,
        vy: Math.sin(burstAngle) * speed,
        opacity: 0.88,
        color,
      });
    }
  }

  function emitFloatingEnzyme(x: number, y: number, color: string): void {
    if (floatingEnzymes.length >= 14) return;
    const angle = Math.random() * 2 * Math.PI;
    const speed = 0.006 + Math.random() * 0.01;
    floatingEnzymes.push({
      id: nextAgentId++,
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      opacity: 0.85,
      color,
    });
  }

  function wavyMRNA(len: number): string {
    const half = len / 2;
    const amp = 3.5;
    return `M ${-half} 0 Q ${-half / 2} ${amp} 0 0 Q ${half / 2} ${-amp} ${half} 0`;
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
    ribosomes = [];
    proteinBursts = [];
    floatingEnzymes = [];
    translatedProteinLevels = {};
  });

  $effect(() => {
    let frameId = 0;
    let lastTime = 0;
    let directBurstTimer = 0;

    function spawnRnapAgents(dt: number, speedScale: number): void {
      if (transcriptionTracks.length === 0) return;

      const maxStrength = transcriptionTracks.reduce((max, track) => Math.max(max, track.strength), 0.01);

      transcriptionTracks.forEach((track, i) => {
        const relativeStrength = Math.max(0.02, track.strength / maxStrength);
        const activeForTrack = rnapAgents.filter((agent) => agent.tuIndex === i).length;
        const maxAgents = Math.max(1, Math.min(3, Math.ceil(relativeStrength * 3)));

        if (activeForTrack >= maxAgents) return;

        const spawnChance = dt * 0.00022 * relativeStrength * speedScale;
        if (Math.random() >= spawnChance) return;

        const startPt = pointOnRing(track.startAngle, R + 4);
        rnapAgents.push({
          id: nextAgentId++,
          tuIndex: i,
          phase: 'transcribe',
          startAngle: track.startAngle,
          endAngle: track.endAngle,
          progress: 0,
          x: startPt.x,
          y: startPt.y,
          opacity: 0.9,
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
        });
      }

      if (ribosomes.length > targetCount) {
        ribosomes = ribosomes.slice(0, targetCount);
      }
    }

    function tick(time: number): void {
      frameId = requestAnimationFrame(tick);

      const dt = lastTime === 0 ? 16 : Math.min(50, time - lastTime);
      lastTime = time;

      if (!engineOutput) {
        rnapAgents = [];
        ribosomes = [];
        mRNAMolecules = [];
        proteinBursts = [];
        floatingEnzymes = [];
        return;
      }

      const speedScale = engineOutput.cellHealth.state === 'burdened' ? 0.65 : 1;
      spawnRnapAgents(dt, speedScale);
      ensureRibosomes();

      const nextRnapAgents = rnapAgents
        .filter((agent) => transcriptionTracks[agent.tuIndex] !== undefined)
        .map((agent) => {
        const trackForAgent = transcriptionTracks[agent.tuIndex];
        if (!trackForAgent) return null;
        const startAngle = trackForAgent.startAngle;
        const endAngle = trackForAgent.endAngle;
        const rawProgress = agent.progress + dt * 0.00024 * speedScale;

        if (rawProgress >= 1.0) {
          const track = trackForAgent;
          if (track.components.length > 0) {
            const existing = mRNAMolecules.find((mrna) => mrna.tuIndex === agent.tuIndex);
            const slotTracks = transcriptionTracks.filter(t => t.components.length > 0).slice(0, 6);
            const slotIndex = Math.min(slotTracks.length - 1, slotTracks.findIndex((t) => t.id === track.id));
            const safeSlotIndex = slotIndex < 0 ? 0 : slotIndex;
            const slotCount = Math.max(1, slotTracks.length);

            if (!existing) {
              const startPoint = pointOnRing(track.endAngle, R + 26);
              const dock = transcriptDockPoint(safeSlotIndex, slotCount);
              mRNAMolecules.push({
                id: nextAgentId++,
                tuIndex: agent.tuIndex,
                phase: 'travel',
                x: startPoint.x,
                y: startPoint.y,
                targetX: dock.x,
                targetY: dock.y,
                opacity: track.continuedFromTerminatorInstanceId ? 0.72 : 0.92,
                len: transcriptLength(track.components.length),
                angle: 0,
                geneProducts: [...track.geneProducts],
                components: [...track.components],
                color: getProductColor(track.geneProducts[0] ?? ''),
                strength: track.strength,
                readThroughFraction: track.readThroughFraction,
              });
            } else {
              const dock = transcriptDockPoint(safeSlotIndex, slotCount);
              mRNAMolecules = mRNAMolecules.map((mrna) => mrna.id === existing.id
                ? {
                    ...mrna,
                    phase: 'docked',
                    targetX: dock.x,
                    targetY: dock.y,
                    x: dock.x,
                    y: dock.y,
                    opacity: track.continuedFromTerminatorInstanceId ? 0.72 : 0.92,
                    components: [...track.components],
                    geneProducts: [...track.geneProducts],
                    readThroughFraction: track.readThroughFraction,
                  }
                : mrna);
            }
          }
          return null;
        }

        const angle = interpolateAngle(startAngle, endAngle, rawProgress);
        const point = pointOnRing(angle, R + 4);
        return { ...agent, startAngle, endAngle, progress: rawProgress, x: point.x, y: point.y };
      });

      rnapAgents = nextRnapAgents.filter((agent): agent is RnapAgent => agent !== null);

      // Keep messenger RNA molecules anchored in on-screen transcript slots.
      mRNAMolecules = mRNAMolecules
        .map((mrna) => ({
          ...mrna,
          ...(() => {
            if (mrna.phase === 'docked') {
              return { x: mrna.targetX, y: mrna.targetY, opacity: Math.min(0.95, mrna.opacity + dt * 0.0002) };
            }

            const dx = mrna.targetX - mrna.x;
            const dy = mrna.targetY - mrna.y;
            const dist = Math.hypot(dx, dy) || 1;
            const step = dt * 0.09;
            const nx = mrna.x + (dx / dist) * Math.min(step, dist);
            const ny = mrna.y + (dy / dist) * Math.min(step, dist);
            if (dist < 3) {
              return { phase: 'docked' as const, x: mrna.targetX, y: mrna.targetY, opacity: 0.95 };
            }
            return { x: nx, y: ny, opacity: 0.92 };
          })(),
        }))
        .slice(-6);

      if (transcriptionTracks.length === 0 && engineOutput && Object.keys(engineOutput.proteins).length > 0) {
        directBurstTimer += dt;
        if (directBurstTimer >= 650) {
          directBurstTimer = 0;
          for (const part of parts) {
            const def = PARTS_DEF_MAP.get(part.defId);
            if (def?.type !== 'gene' || !def.product) continue;
            const idx = indexByInstanceId.get(part.instanceId);
            if (idx === undefined) continue;
            const angle = partAngles[idx] ?? 0;
            const anchor = pointOnRing(angle, R + 18);
            emitProteinBurstAt(anchor.x, anchor.y, def.color ?? '#60a5fa');
          }
        }
      }

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
          if (dockedTranscripts.length > 0 && Math.random() < 0.012 * speedScale) {
            const target = dockedTranscripts[Math.floor(Math.random() * dockedTranscripts.length)];
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

          const rbsIndex = Math.max(0, ribosome.targetComponentIndex - 1);
          const dockPoint = transcriptPoint(targetMRNA, transcriptComponentOffset(targetMRNA, rbsIndex));
          const targetX = dockPoint.x;
          const targetY = dockPoint.y;

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
          return { ...ribosome, phase: 'wander', x: spawn.x, y: spawn.y, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25, targetMRNAId: null, targetProduct: null, targetComponentIndex: null, progress: 0 };
        }

        const progress = ribosome.progress + dt * 0.00046 * speedScale;
        const startOffset = transcriptComponentOffset(targetMRNA, Math.max(0, ribosome.targetComponentIndex - 1));
        const endOffset = Math.min(
          targetMRNA.len / 2 - 6,
          transcriptComponentOffset(targetMRNA, ribosome.targetComponentIndex) + 20,
        );
        const startPoint = transcriptPoint(targetMRNA, startOffset);
        const endPoint = transcriptPoint(targetMRNA, endOffset);
        const t = Math.min(progress, 1);
        const x = startPoint.x + (endPoint.x - startPoint.x) * t;
        const y = startPoint.y + (endPoint.y - startPoint.y) * t;

        if (progress >= 1) {
          emitProteinBurstAt(x, y, getProductColor(ribosome.targetProduct));
          emitFloatingEnzyme(x, y, getProductColor(ribosome.targetProduct));
          translatedProteinLevels = {
            ...translatedProteinLevels,
            [ribosome.targetProduct]: Math.min(
              engineOutput.proteins[ribosome.targetProduct] ?? Number.POSITIVE_INFINITY,
              (translatedProteinLevels[ribosome.targetProduct] ?? 0) + 1,
            ),
          };
          const spawn = randomCytoplasmPoint();
          return {
            ...ribosome,
            phase: 'wander',
            x: spawn.x, y: spawn.y,
            vx: (Math.random() - 0.5) * 0.25,
            vy: (Math.random() - 0.5) * 0.25,
            targetMRNAId: null, targetProduct: null, targetComponentIndex: null, progress: 0,
          };
        }

        return { ...ribosome, x, y, progress };
      });

      proteinBursts = proteinBursts
        .map((burst) => ({
          ...burst,
          x: burst.x + burst.vx * dt,
          y: burst.y + burst.vy * dt,
          opacity: burst.opacity - dt * 0.0009,
        }))
        .filter((burst) => burst.opacity > 0.03)
        .slice(-72);

      floatingEnzymes = floatingEnzymes
        .map((enzyme) => {
          const jx = (Math.random() - 0.5) * 0.006;
          const jy = (Math.random() - 0.5) * 0.006;
          const vx = enzyme.vx * 0.997 + jx;
          const vy = enzyme.vy * 0.997 + jy;
          const x = clamp(enzyme.x + vx * dt, 52, 348);
          const y = clamp(enzyme.y + vy * dt, 52, 348);
          return {
            ...enzyme, x, y,
            vx: x === 52 || x === 348 ? -vx : vx,
            vy: y === 52 || y === 348 ? -vy : vy,
            opacity: enzyme.opacity - dt * 0.000055,
          };
        })
        .filter((enzyme) => enzyme.opacity > 0.05);
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

    {#each rnapAgents as agent (agent.id)}
      {#if agent.phase === 'transcribe'}
        {@const transcribedAngle = interpolateAngle(agent.startAngle, agent.endAngle, agent.progress)}
        <path d={describeArc(agent.startAngle, transcribedAngle, R + 10)} class="mrna-trace" />
      {/if}
      <g transform="translate({agent.x},{agent.y})" opacity={agent.opacity}>
        <path d="M -12 -2 C -10 -9, 1 -11, 9 -6 C 15 -2, 13 8, 5 10 C -4 12, -14 7, -12 -2 Z" class="rnap-body" />
        <circle cx="-4" cy="-1" r="4" class="rnap-pocket" />
        <rect x="1.5" y="-2.4" width="8" height="4.8" rx="2.4" class="rnap-channel" />
        <path d="M 8 4 Q 14 8 20 7" class="rnap-rna-tail" />
      </g>
    {/each}

    {#each mRNAMolecules as mrna (mrna.id)}
      <g transform="translate({mrna.x},{mrna.y}) rotate({mrna.angle})" opacity={mrna.opacity}>
        <rect x={-(mrna.len / 2) - 12} y="-13" width={mrna.len + 24} height="40" rx="8" class="transcript-panel" />
        <text x={-(mrna.len / 2) - 4} y="4" text-anchor="end" font-size="11" fill="#475569">5'</text>
        <path d={wavyMRNA(mrna.len)} class="mrna-backbone" />
        {#each mrna.components as comp, ci}
          {@const offset = transcriptComponentOffset(mrna, ci)}
          <circle cx={offset} cy="0" r="8" fill={comp.color} stroke="rgba(0,0,0,0.3)" stroke-width="1" />
          <text x={offset} y="21" text-anchor="middle" font-size="11" fill="#94a3b8">{comp.label}</text>
        {/each}
        <text x={(mrna.len / 2) + 4} y="4" text-anchor="start" font-size="11" fill="#475569">3'</text>
        {#if mrna.readThroughFraction !== undefined}
          <text x={(mrna.len / 2) + 4} y="-15" text-anchor="start" font-size="11" fill="#fbbf24">{Math.round(mrna.readThroughFraction * 100)}% RT</text>
        {/if}
      </g>
    {/each}

    <!-- Output and constraint meters -->
    <g transform="translate(14,16)">
      <rect x="0" y="0" width="168" height={18 + meterProteins.length * 18 + 26} fill="rgba(2, 6, 23, 0.72)" stroke="rgba(148, 163, 184, 0.4)" stroke-width="1" rx="8" />
      <text x="8" y="12" fill="#cbd5e1" font-size="11">Outputs</text>
      {#each meterProteins as meter, idx (meter.name)}
        {@const rowY = 18 + idx * 18}
        {@const current = translatedProteinLevels[meter.name] ?? 0}
        {@const ratio = Math.min(1, current / meter.target)}
        <text x="8" y={rowY + 10} fill="#e2e8f0" font-size="11">{proteinDisplayName(meter.name)}</text>
        <rect x="62" y={rowY + 2} width="80" height="10" fill="#1f2937" rx="5" />
        <rect x="62" y={rowY + 2} width={80 * ratio} height="10" fill="#22c55e" rx="5" />
        <text x="148" y={rowY + 10} text-anchor="end" font-size="11" fill="#6ee7b7">{meter.target.toFixed(1)}</text>
      {/each}

      <text x="8" y={26 + meterProteins.length * 18} fill="#e2e8f0" font-size="11">Cell stress</text>
      <rect x="62" y={18 + meterProteins.length * 18 + 8} width="96" height="10" fill="#1f2937" rx="5" />
      <rect
        x="62"
        y={18 + meterProteins.length * 18 + 8}
        width={96 * (engineOutput.cellHealth.state === 'normal' ? 0.2 : engineOutput.cellHealth.state === 'burdened' ? 0.65 : 1)}
        height="10"
        fill="#ef4444"
        rx="5"
      />
    </g>

    {#each ribosomes as ribosome (ribosome.id)}
      <g transform="translate({ribosome.x},{ribosome.y})" opacity={ribosome.opacity}>
        <ellipse cx="-2.8" cy="0" rx="4.2" ry="3.3" class="ribo-large" />
        <ellipse cx="2.6" cy="0" rx="3.3" ry="2.5" class="ribo-small" />
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

    {#each proteinBursts as burst, i (`${i}-${burst.color}-${i}`)}
      <circle cx={burst.x} cy={burst.y} r="3.3" fill={burst.color} opacity={burst.opacity} />

        {#each floatingEnzymes as enzyme (enzyme.id)}
          <circle cx={enzyme.x} cy={enzyme.y} r="5.5" fill={enzyme.color} stroke="rgba(0,0,0,0.25)" stroke-width="1" opacity={enzyme.opacity} />
        {/each}

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
      {#each Array(clpxpQueueCount) as _, queueIdx}
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
    stroke-width: 2;
    stroke-linecap: round;
  }

  .read-through-track {
    stroke: #fbbf24;
    stroke-dasharray: 4 5;
  }

  .mrna-trace {
    fill: none;
    stroke: #7dd3fc;
    stroke-width: 2.4;
    stroke-linecap: round;
    opacity: 0.9;

    .mrna-backbone {
      fill: none;
      stroke: #22d3ee;
      stroke-width: 1.5;
      stroke-linecap: round;
      opacity: 0.6;
    }

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

  .rnap-body {
    fill: #f59e0b;
    stroke: #78350f;
    stroke-width: 1;
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
</style>
