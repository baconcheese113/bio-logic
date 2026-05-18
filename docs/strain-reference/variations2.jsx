// variations2.jsx — Four design philosophies for Strain's gameplay screen.
// A · Petri Dish Command   — microscope eyepiece, no chrome
// B · Lab Bench Split      — tissue battle | lab workbench
// C · Body Map Strategic   — zoomed-out tissue layers + blood vessel
// D · Infection Log Dossier — annotated case file

const STAGE_W = 1340;
const STAGE_H = 760;

// ─── Shared annotation helper for these layouts ────────────────────────────
function Anno({ x, y, w, text, tilt, arrow, color = '#1f1d18' }) {
  return (
    <div className={`anno ${tilt || ''}`}
         style={{ left: x, top: y, width: w, color, zIndex: 8 }}>
      {text}
    </div>
  );
}

function AnnoArrows({ items, width, height }) {
  return (
    <svg className="anno-arrow" viewBox={`0 0 ${width} ${height}`}
         width={width} height={height}
         style={{ position: 'absolute', inset: 0 }}>
      {items.filter(i => i.arrow).map((a, i) => {
        const [[sx, sy], [ex, ey]] = a.arrow;
        const cx = (sx + ex) / 2 + (a.curve || 0);
        const cy = (sy + ey) / 2 + (a.curveY || -18);
        const dx = ex - cx, dy = ey - cy;
        const ang = Math.atan2(dy, dx);
        const ax1 = ex - Math.cos(ang - 0.4) * 8;
        const ay1 = ey - Math.sin(ang - 0.4) * 8;
        const ax2 = ex - Math.cos(ang + 0.4) * 8;
        const ay2 = ey - Math.sin(ang + 0.4) * 8;
        return (
          <g key={i}>
            <path d={`M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`} />
            <path d={`M ${ex} ${ey} L ${ax1} ${ay1} M ${ex} ${ey} L ${ax2} ${ay2}`} />
          </g>
        );
      })}
    </svg>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// A · Petri Dish Command — full circular microscope view, diegetic chrome
// ───────────────────────────────────────────────────────────────────────────
function VariationA() {
  const W = STAGE_W, H = STAGE_H;
  // Circular field — center the scope
  const DIA = 720;
  const cx = W / 2, cy = H / 2 + 6;

  // Compose battle inside circle
  const sceneCenter = [W * 0.40, H * 0.55];
  const items = defaultAssault(W, H, sceneCenter);

  // Annotations
  const annos = [
    { text: 'microscope eyepiece · no chrome', x: W / 2 - 100, y: 14, tilt: 'tilt',
      arrow: [[W / 2 + 50, 32], [W / 2 + 90, 76]] },
    { text: 'cytokine wash · next wave from NE', x: cx + 200, y: 100, tilt: 'tilt-r',
      arrow: [[cx + 240, 122], [cx + 200, 180]] },
    { text: 'biofilm slows the neutrophil swarm', x: cx + 100, y: cy - 180, tilt: 'tilt-r',
      arrow: [[cx + 180, cy - 160], [cx + 130, cy - 50]] },
    { text: 'macrophage engulfing a bacterium', x: 30, y: cy + 160, tilt: 'tilt',
      arrow: [[180, cy + 170], [W * 0.20 + 30, H * 0.78 - 4]] },
    { text: 'antibody-tagged · about to be cleared', x: cx - 220, y: cy + 30,
      arrow: [[cx - 80, cy + 50], [cx - 30, cy + 90]] },
    { text: 'Founder Cell · stressed, surface proteins fading', x: cx - 280, y: cy - 110, tilt: 'tilt',
      arrow: [[cx - 130, cy - 90], [cx - 20, cy - 4]] },
    { text: 'tiny HUD chips · plasmid + instruments', x: 36, y: 22,
      arrow: [[180, 56], [220, 90]] },
    { text: 'wave indicator · top-right chip', x: W - 320, y: 16,
      arrow: [[W - 200, 36], [W - 170, 64]] },
  ];

  return (
    <div className="stage variation" style={{
      width: W, height: H, position: 'relative', overflow: 'hidden',
      background: 'radial-gradient(circle at 50% 50%, #2a1410 0%, #0a0604 70%)',
    }}>
      {/* The microscope iris — circular tissue view */}
      <div style={{
        position: 'absolute', left: (W - DIA) / 2, top: (H - DIA) / 2,
        width: DIA, height: DIA, borderRadius: '50%',
        overflow: 'hidden',
        boxShadow: 'inset 0 0 80px rgba(0,0,0,.7), 0 0 24px rgba(0,0,0,.5)',
        border: '2px solid #2a261c',
      }}>
        <BattleScene
          width={DIA} height={DIA} shape="circle"
          vignette
          cytokineFrom={[DIA * 0.78, DIA * 0.20]}
          colonyCenter={[DIA * 0.42, DIA * 0.55]}
          colonyRadius={80}
          colonySize="md"
          geneMix={['normal', 'biofilm', 'normal', 'surface']}
          {...(() => {
            const it = defaultAssault(DIA, DIA, [DIA * 0.42, DIA * 0.55]);
            return it;
          })()}
        />
      </div>

      {/* Floating plasmid HUD — bottom-left */}
      <div style={{ position: 'absolute', left: 24, bottom: 24, zIndex: 6 }}>
        <PlasmidPanel size="sm" skin="hud" />
        <div style={{
          marginTop: 6, fontFamily: '"Patrick Hand"', fontSize: 11, color: 'rgba(244,236,220,.7)',
          textAlign: 'center', width: 170,
        }}>
          tap to open editor
        </div>
      </div>

      {/* Instrument chips — top-right */}
      <div style={{ position: 'absolute', right: 24, top: 70, zIndex: 6, width: 170 }}>
        <InstrumentBay skin="chips" />
      </div>

      {/* Wave indicator — top-right pill */}
      <div style={{ position: 'absolute', right: 24, top: 18, zIndex: 6,
                    background: 'rgba(255,251,240,.92)',
                    border: '1.4px solid #2a261c', borderRadius: 50,
                    padding: '6px 14px', boxShadow: '2px 2px 0 rgba(0,0,0,.4)' }}>
        <WaveIndicator compact />
      </div>

      {/* Founder health — bottom-right */}
      <div style={{ position: 'absolute', right: 24, bottom: 24, zIndex: 6,
                    background: 'rgba(255,251,240,.86)',
                    border: '1.4px solid #2a261c', borderRadius: 12,
                    padding: '8px 12px', boxShadow: '2px 2px 0 rgba(0,0,0,.4)' }}>
        <FounderHealth state="stressed" />
      </div>

      <AnnoArrows items={annos} width={W} height={H} />
      {annos.map((a, i) => <Anno key={i} {...a} color="#f4ecdc" />)}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// B · Lab Bench Split — left tissue / right workbench
// ───────────────────────────────────────────────────────────────────────────
function VariationB() {
  const W = STAGE_W, H = STAGE_H;
  const STRIP = 38;                 // central cytokine strip
  const HALF = (W - STRIP) / 2;     // ~ 651

  const sceneCenter = [HALF * 0.5, H * 0.55];
  const items = defaultAssault(HALF, H, sceneCenter);

  const annos = [
    { text: 'live tissue battle · top-down', x: 30, y: 18, tilt: 'tilt',
      arrow: [[180, 38], [220, 70]] },
    { text: 'lab bench · plasmid + instruments + samples', x: HALF + STRIP + 24, y: 18,
      arrow: [[HALF + STRIP + 250, 36], [HALF + STRIP + 220, 80]] },
    { text: 'central cytokine strip · live signal', x: HALF - 90, y: H - 38, tilt: 'tilt-r',
      arrow: [[HALF + STRIP / 2, H - 22], [HALF + STRIP / 2, H - 200]] },
    { text: 'sample tubes drift to bench', x: HALF - 80, y: 240,
      arrow: [[HALF + 14, 256], [HALF + STRIP + 18, 256]] },
    { text: 'gene swap reflects back to colony', x: HALF + STRIP + 20, y: H - 60, tilt: 'tilt',
      arrow: [[HALF + STRIP + 16, H - 50], [HALF - 40, H - 60]], curveY: -40 },
  ];

  return (
    <div className="stage variation" style={{
      width: W, height: H, position: 'relative', overflow: 'hidden',
      background: '#f4ecdc',
    }}>
      {/* Left half — tissue battle */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: HALF, height: H }}>
        <BattleScene
          width={HALF} height={H} shape="rect"
          cytokineFrom={[HALF * 0.78, H * 0.20]}
          colonyCenter={sceneCenter}
          colonyRadius={92}
          colonySize="lg"
          geneMix={['normal', 'biofilm', 'normal', 'surface', 'complement']}
          {...items}
        />
        {/* Battlefield HUD */}
        <div style={{ position: 'absolute', left: 14, top: 14,
                      background: 'rgba(255,251,240,.92)', border: '1.4px solid #2a261c',
                      borderRadius: 8, padding: '6px 10px',
                      fontFamily: '"Kalam"', fontWeight: 700, fontSize: 13, color: '#1f1d18',
                      boxShadow: '2px 2px 0 rgba(0,0,0,.18)' }}>
          tissue site · forearm dermis
        </div>
        <div style={{ position: 'absolute', left: 14, bottom: 14, zIndex: 6,
                      background: 'rgba(255,251,240,.92)',
                      border: '1.4px solid #2a261c', borderRadius: 50,
                      padding: '6px 14px',
                      boxShadow: '2px 2px 0 rgba(0,0,0,.18)' }}>
          <WaveIndicator compact />
        </div>
      </div>

      {/* Central cytokine strip — live molecular signal */}
      <CytokineStrip x={HALF} y={0} width={STRIP} height={H} />

      {/* Right half — workbench */}
      <div style={{ position: 'absolute', left: HALF + STRIP, top: 0,
                    width: HALF, height: H,
                    background: `
                      repeating-linear-gradient(0deg, rgba(0,0,0,.025) 0 1px, transparent 1px 6px),
                      linear-gradient(180deg, #f8f2e2, #e8dec2)
                    `,
                    borderLeft: '1px solid #2a261c' }}>
        <div style={{ padding: '18px 22px 14px',
                      fontFamily: '"Kalam"', fontWeight: 700, fontSize: 18, color: '#1f1d18',
                      borderBottom: '1.5px dashed #6f6553', display: 'flex',
                      justifyContent: 'space-between', alignItems: 'baseline' }}>
          Bench
          <span style={{ fontFamily: '"Patrick Hand"', fontSize: 13, color: '#6f6553' }}>
            18s window · swap one gene
          </span>
        </div>
        {/* Plasmid editor */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 6px' }}>
          <PlasmidPanel size="lg" skin="card" />
        </div>
        {/* Instruments + sample tray */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 10, padding: '4px 18px 12px' }}>
          <InstrumentBay skin="card" orientation="horizontal" />
        </div>
        {/* Sample tray at bottom */}
        <div style={{ position: 'absolute', left: 18, right: 18, bottom: 18,
                      background: '#fffbf0', border: '1.4px solid #2a261c',
                      borderRadius: 10, padding: '8px 12px',
                      boxShadow: '2px 2px 0 rgba(0,0,0,.08)',
                      display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontFamily: '"Kalam"', fontWeight: 700, fontSize: 12, color: '#1f1d18',
                        textTransform: 'uppercase', letterSpacing: .8 }}>
            sample tray
          </div>
          <SampleTubes count={5} />
          <div style={{ fontFamily: '"Patrick Hand"', fontSize: 11, color: '#6f6553', marginLeft: 'auto' }}>
            drag a tube into a slot
          </div>
        </div>
      </div>

      <AnnoArrows items={annos} width={W} height={H} />
      {annos.map((a, i) => <Anno key={i} {...a} />)}
    </div>
  );
}

// Cytokine strip — vertical molecular-signal column between halves of layout B
function CytokineStrip({ x, y, width, height }) {
  const seed = rngSeq(77);
  const blips = Array.from({ length: 36 }).map(() => ({
    y: seed() * height,
    mag: 0.3 + seed() * 0.7,
    color: ['#c4471f', '#a8551c', '#3a6ac2', '#3a8c4d'][Math.floor(seed() * 4)],
  }));
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width, height,
      background: '#0d0a06',
      borderLeft: '1px solid #2a261c', borderRight: '1px solid #2a261c',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 8, left: 0, right: 0,
                    textAlign: 'center', fontFamily: '"Patrick Hand"', fontSize: 9,
                    color: 'rgba(244,236,220,.7)', writingMode: 'vertical-rl',
                    height: '100%', letterSpacing: 1 }}>
        cytokine · live
      </div>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Spectrum strip */}
        {blips.map((b, i) => (
          <rect key={i} x={4} y={b.y} width={width - 8} height={1.4}
                fill={b.color} opacity={b.mag} />
        ))}
        {/* Spike marker — "IL-8 surge" */}
        <g transform={`translate(0 ${height * 0.32})`}>
          <rect x={2} y={-1.5} width={width - 4} height={3} fill="#c4471f" />
          <text x={width / 2} y={-6} fill="#f4ecdc" fontSize="8" fontFamily='"Patrick Hand"' textAnchor="middle">
            IL-8 ↑
          </text>
        </g>
      </svg>
    </div>
  );
}

function SampleTubes({ count = 5 }) {
  const colors = ['#3a8c4d', '#c4471f', '#3a6ac2', '#6b4a8c', '#d4a72c'];
  return (
    <div style={{ display: 'flex', gap: 5 }}>
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} width={18} height={36} viewBox="0 0 18 36">
          <path d="M 4 1 H 14 V 24 Q 14 33 9 33 Q 4 33 4 24 Z"
                fill="#fffaea" stroke="#2a261c" strokeWidth="1" />
          <rect x="4" y="1" width="10" height="3" fill="#2a261c" />
          <rect x="4" y="24" width="10" height="9" fill={colors[i % colors.length]} opacity=".7" />
        </svg>
      ))}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// C · Body Map Strategic — tissue cross-section with blood vessel
// ───────────────────────────────────────────────────────────────────────────
function VariationC() {
  const W = STAGE_W, H = STAGE_H;

  // Tissue layer bands
  const layers = [
    { name: 'epidermis',   y0: 0,            y1: 90,           fill: ['#f6e2c8', '#e6c39e'] },
    { name: 'papillary dermis', y0: 90,      y1: 230,          fill: ['#f6b89c', '#e09478'] },
    { name: 'reticular dermis', y0: 230,     y1: 420,          fill: ['#dc8870', '#b8624e'] },
    // blood vessel band runs through 420-490
    { name: 'subcutis',    y0: 490,          y1: H,            fill: ['#a8523c', '#6e2e22'] },
  ];

  // 3 colony clusters across layers
  const clusters = [
    { x: 250, y: 180, r: 60, label: 'α · surface-switch', color: '#3a6ac2', size: 'md',
      mix: ['normal', 'surface', 'surface'], stress: 'mild' },
    { x: 760, y: 320, r: 90, label: 'β · biofilm + complement', color: '#3a8c4d', size: 'lg',
      mix: ['biofilm', 'normal', 'complement', 'biofilm'], stress: 'heavy', selected: true },
    { x: 1080, y: 620, r: 70, label: 'Ω · Founder (capsule)', color: '#6b4a8c', size: 'md',
      mix: ['capsule', 'capsule', 'normal'], stress: 'mild', isFounder: true },
  ];
  const selected = clusters[1];

  // Threat positions — pouring out of blood vessel
  const macrophages = [
    { x: 480, y: 460, scale: 0.85, angle: 5, engulfing: false },
    { x: 880, y: 460, scale: 0.9, angle: -10, engulfing: false },
    { x: 880, y: 380, scale: 1.0, angle: 12, engulfing: true },  // engaged with β
  ];
  const neutrophils = [];
  const swarmA = rngSeq(202);
  for (let i = 0; i < 6; i++) {
    neutrophils.push({
      x: 480 + (swarmA() - 0.5) * 80,
      y: 470 + (swarmA() - 0.5) * 30 + i * 4,
      scale: 0.7 + swarmA() * 0.3,
    });
  }
  for (let i = 0; i < 5; i++) {
    neutrophils.push({
      x: 880 + (swarmA() - 0.5) * 60,
      y: 460 + (swarmA() - 0.5) * 20,
      scale: 0.7 + swarmA() * 0.3,
    });
  }

  const annos = [
    { text: 'epidermis', x: 18, y: 30, tilt: 'tilt',
      arrow: [[80, 46], [120, 60]] },
    { text: 'blood vessel · immune-cell highway', x: 18, y: 460, tilt: 'tilt',
      arrow: [[200, 478], [320, 460]] },
    { text: 'cluster β selected · plasmid popup open', x: selected.x - 240, y: selected.y - 220,
      tilt: 'tilt-r', arrow: [[selected.x - 90, selected.y - 200], [selected.x - 10, selected.y - 60]] },
    { text: 'Founder cluster — deepest tissue', x: clusters[2].x - 60, y: clusters[2].y + 90,
      tilt: 'tilt', arrow: [[clusters[2].x + 30, clusters[2].y + 80], [clusters[2].x + 4, clusters[2].y + 30]] },
    { text: 'macrophage engaged with β edge', x: 720, y: 270,
      arrow: [[820, 290], [860, 360]] },
    { text: 'neutrophil reinforcements arriving', x: 380, y: 540, tilt: 'tilt-r',
      arrow: [[490, 540], [490, 490]] },
    { text: 'each cluster · its own plasmid config', x: 100, y: 110,
      arrow: [[200, 130], [240, 170]] },
  ];

  return (
    <div className="stage variation" style={{
      width: W, height: H, position: 'relative', overflow: 'hidden',
      background: '#f0d4b0',
    }}>
      {/* Tissue layer bands */}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}
           style={{ position: 'absolute', inset: 0 }}>
        <defs>
          {layers.map((L, i) => (
            <linearGradient key={i} id={`layer-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={L.fill[0]} />
              <stop offset="100%" stopColor={L.fill[1]} />
            </linearGradient>
          ))}
          <linearGradient id="vessel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8d2c1f" />
            <stop offset="50%" stopColor="#c4471f" />
            <stop offset="100%" stopColor="#7a2515" />
          </linearGradient>
        </defs>
        {layers.map((L, i) => (
          <rect key={i} x={0} y={L.y0} width={W} height={L.y1 - L.y0}
                fill={`url(#layer-${i})`} />
        ))}
        {/* Blood vessel band */}
        <g>
          <path d={`M 0 420 Q 200 410 400 422 T 800 420 T 1200 425 T ${W} 420
                    L ${W} 490 Q 1100 498 900 488 T 500 490 T 0 488 Z`}
                fill="url(#vessel)" />
          {/* Vessel highlight */}
          <path d={`M 0 432 Q 200 422 400 434 T 800 432 T ${W} 432`}
                stroke="#ff8a4a" strokeWidth="1.2" fill="none" opacity=".5" />
          {/* Vessel labels */}
        </g>
        {/* ECM texture - light fibres in each layer */}
        <g stroke="#7a3a2a" strokeWidth=".5" opacity=".18" fill="none">
          {Array.from({ length: 80 }).map((_, i) => {
            const r = rngSeq(303 + i);
            const x = r() * W, y = r() * H;
            // Skip vessel
            if (y > 415 && y < 495) return null;
            const len = 14 + r() * 22;
            const ang = r() * Math.PI * 2;
            return <path key={i} d={`M ${x} ${y} q ${Math.cos(ang) * len * 0.5} ${-4} ${Math.cos(ang) * len} ${Math.sin(ang) * len}`} />;
          })}
        </g>

        {/* Macrophages and neutrophils */}
        {macrophages.map((m, i) => (
          <Macrophage key={`mac-${i}`} x={m.x} y={m.y} scale={m.scale}
                      angle={m.angle} engulfing={m.engulfing} />
        ))}
        {neutrophils.map((n, i) => (
          <Neutrophil key={`neu-${i}`} x={n.x} y={n.y} scale={n.scale} />
        ))}

        {/* Bacterial clusters */}
        {clusters.map((c, i) => (
          <g key={i}>
            {/* Cluster glow */}
            <circle cx={c.x} cy={c.y} r={c.r + 14}
                    fill={c.color} opacity=".12" style={{ filter: 'blur(4px)' }} />
            <BacterialColony
              cx={c.x} cy={c.y}
              count={{ sm: 14, md: 20, lg: 32 }[c.size]}
              radius={c.r}
              seed={i * 7 + 5}
              geneMix={c.mix}
              taggedIdx={i === 1 ? [3, 7] : []}
              engulfedIdx={i === 1 ? [15, 16] : []}
            />
            {/* Selection ring */}
            {c.selected && (
              <circle cx={c.x} cy={c.y} r={c.r + 22} fill="none"
                      stroke="#1f1d18" strokeWidth="1.4" strokeDasharray="6 4" opacity=".8" />
            )}
            {/* Founder marker */}
            {c.isFounder && (
              <g>
                <circle cx={c.x} cy={c.y} r={c.r + 18} fill="none"
                        stroke="#fff2c4" strokeWidth="1.6" opacity=".9" />
                <text x={c.x} y={c.y - c.r - 26} textAnchor="middle"
                      fontFamily='"Kalam"' fontWeight="700" fontSize="13"
                      fill="#1f1d18">FOUNDER</text>
              </g>
            )}
            {/* Cluster label */}
            <g transform={`translate(${c.x} ${c.y + c.r + 22})`}>
              <rect x={-100} y={-14} width={200} height={26} rx={13}
                    fill="rgba(255,251,240,.92)" stroke="#2a261c" strokeWidth="1.2" />
              <circle cx={-86} cy={-1} r={6} fill={c.color} />
              <text x={-74} y={4} fontFamily='"Patrick Hand"' fontSize="12.5" fill="#1f1d18">
                {c.label}
              </text>
            </g>
          </g>
        ))}

        {/* Layer label markers - left edge */}
        <g fontFamily='"Patrick Hand"' fontSize="11" fill="#1f1d18">
          <text x={10} y={84}>epidermis</text>
          <text x={10} y={224}>dermis · papillary</text>
          <text x={10} y={414}>dermis · reticular</text>
          <text x={10} y={H - 14}>subcutis</text>
        </g>
      </svg>

      {/* Plasmid popup over cluster β */}
      <div style={{ position: 'absolute', left: selected.x - 130, top: selected.y - 280, zIndex: 6 }}>
        <PlasmidPanel size="md" skin="popup" />
        {/* Tether line from popup down to cluster */}
        <svg width="260" height="80" viewBox="0 0 260 80"
             style={{ position: 'absolute', left: 0, top: '100%', pointerEvents: 'none' }}>
          <path d="M 130 0 Q 130 30 130 60" stroke="#2a261c" strokeWidth="1.4"
                strokeDasharray="3 3" fill="none" />
        </svg>
      </div>

      {/* Floating instrument panel — bottom-left */}
      <div style={{ position: 'absolute', left: 22, bottom: 22, zIndex: 6, width: 320,
                    background: 'rgba(255,251,240,.92)', border: '1.4px solid #2a261c',
                    borderRadius: 12, padding: 10, boxShadow: '3px 3px 0 rgba(0,0,0,.18)' }}>
        <div style={{ fontFamily: '"Kalam"', fontWeight: 700, fontSize: 13,
                      color: '#1f1d18', marginBottom: 6,
                      textTransform: 'uppercase', letterSpacing: .8 }}>
          Cluster β · readouts
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <ElisaPlate size={110} signal={[[1,2],[1,3],[2,3]]} />
          <div style={{ flex: 1, fontFamily: '"Patrick Hand"', fontSize: 11.5, lineHeight: 1.35, color: '#1f1d18' }}>
            <b style={{ color: '#a8551c' }}>IL-8 elevated</b> at β · neutrophil surge confirmed.
            <br/>Surface antigen <b style={{ color: '#1f3f7a' }}>α</b> in host antibodies.
          </div>
        </div>
      </div>

      {/* Wave indicator + founder health, top-right */}
      <div style={{ position: 'absolute', right: 22, top: 22, zIndex: 6,
                    background: 'rgba(255,251,240,.92)', border: '1.4px solid #2a261c',
                    borderRadius: 50, padding: '6px 14px',
                    boxShadow: '2px 2px 0 rgba(0,0,0,.18)' }}>
        <WaveIndicator compact />
      </div>

      <AnnoArrows items={annos} width={W} height={H} />
      {annos.map((a, i) => <Anno key={i} {...a} />)}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// D · Infection Log Dossier — annotated case file
// ───────────────────────────────────────────────────────────────────────────
function VariationD() {
  const W = STAGE_W, H = STAGE_H;
  const PHOTO_W = 720, PHOTO_H = 520;
  const photoX = (W - PHOTO_W) / 2 + 10;
  const photoY = 110;

  const annos = [
    { text: 'classified · case file aesthetic', x: 40, y: 18, tilt: 'tilt',
      arrow: [[180, 38], [200, 76]] },
    { text: 'central microscopy printout · annotated', x: photoX - 10, y: photoY - 36, tilt: 'tilt-r',
      arrow: [[photoX + 200, photoY - 18], [photoX + 220, photoY + 20]] },
    { text: 'clipped lab reports surround the image', x: W - 360, y: 20, tilt: 'tilt',
      arrow: [[W - 200, 40], [W - 160, 90]] },
    { text: 'plasmid map · hand-annotated', x: 24, y: photoY + 230,
      arrow: [[200, photoY + 240], [240, photoY + 200]], curveY: 20 },
    { text: 'escalation report · clinical telegraph', x: photoX + 60, y: H - 30, tilt: 'tilt',
      arrow: [[photoX + 230, H - 18], [photoX + 230, H - 90]] },
  ];

  // Scene parameters (inside the photo)
  const sceneCenter = [PHOTO_W * 0.42, PHOTO_H * 0.55];
  const battleItems = defaultAssault(PHOTO_W, PHOTO_H, sceneCenter);

  return (
    <div className="stage variation" style={{
      width: W, height: H, position: 'relative', overflow: 'hidden',
      background: `
        repeating-linear-gradient(0deg, rgba(0,0,0,.018) 0 1px, transparent 1px 28px),
        radial-gradient(800px 500px at 30% 20%, #f8eed4 0%, #e5d3a8 100%)
      `,
    }}>
      {/* Top header bar — looks like a case file letterhead */}
      <div style={{ position: 'absolute', left: 24, right: 24, top: 18,
                    display: 'flex', alignItems: 'baseline',
                    borderBottom: '2.5px solid #2a261c', paddingBottom: 8,
                    fontFamily: '"Kalam"', color: '#1f1d18' }}>
        <div style={{ fontWeight: 700, fontSize: 22, letterSpacing: 1 }}>
          INFECTION LOG · CASE 04
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 14, fontSize: 13, fontFamily: '"Patrick Hand"', color: '#3a352a' }}>
          <span>host: <b>H. sapiens</b></span>
          <span>strain: <b>pSTRAIN-04</b></span>
          <span>elapsed: <b>04:12</b></span>
          <span style={{ color: '#c4471f' }}><b>STATUS: ESCALATING</b></span>
        </div>
      </div>

      {/* Central microscopy photo */}
      <div style={{ position: 'absolute', left: photoX, top: photoY,
                    width: PHOTO_W, height: PHOTO_H,
                    transform: 'rotate(-0.6deg)',
                    boxShadow: '4px 6px 0 rgba(0,0,0,.18), 0 0 0 8px #fffaea, 0 0 0 9px #2a261c',
                    background: '#000' }}>
        <BattleScene
          width={PHOTO_W} height={PHOTO_H}
          shape="rect"
          cytokineFrom={[PHOTO_W * 0.78, PHOTO_H * 0.20]}
          colonyCenter={sceneCenter}
          colonyRadius={80}
          colonySize="md"
          geneMix={['normal', 'biofilm', 'normal', 'surface', 'complement']}
          {...battleItems}
        />
        {/* Photo annotations — hand-drawn circles + arrows on the print */}
        <svg width={PHOTO_W} height={PHOTO_H} viewBox={`0 0 ${PHOTO_W} ${PHOTO_H}`}
             style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {/* Circle around founder cell */}
          <g transform={`translate(${sceneCenter[0]} ${sceneCenter[1]})`}>
            <circle r={28} fill="none" stroke="#c4471f" strokeWidth="2.4" opacity=".9"
                    strokeDasharray="0" />
            <text x={32} y={-14} fontFamily='"Architects Daughter"' fontSize="14"
                  fontWeight="700" fill="#c4471f">PROTECT</text>
            <path d={`M 28 -14 Q 22 -10 18 -2`} stroke="#c4471f" strokeWidth="1.6" fill="none" />
          </g>
          {/* Arrow to engulfment */}
          <g>
            <path d={`M 130 470 Q 200 440 ${sceneCenter[0] - 100} ${sceneCenter[1] + 70}`}
                  stroke="#fffaea" strokeWidth="1.8" fill="none" strokeDasharray="0" />
            <text x={50} y={460} fontFamily='"Architects Daughter"' fontSize="13"
                  fontWeight="700" fill="#fffaea">phagocytosis: 2 cells lost</text>
          </g>
          {/* Arrow to neutrophil swarm */}
          <g>
            <path d={`M ${PHOTO_W - 60} 50 Q ${PHOTO_W - 100} 90 ${PHOTO_W - 180} 130`}
                  stroke="#fffaea" strokeWidth="1.8" fill="none" />
            <text x={PHOTO_W - 230} y={42} fontFamily='"Architects Daughter"' fontSize="13"
                  fontWeight="700" fill="#fffaea">neutrophil swarm N=7</text>
          </g>
          {/* Circle around biofilm */}
          <g>
            <ellipse cx={sceneCenter[0] + 120} cy={sceneCenter[1] - 30} rx="68" ry="42"
                     fill="none" stroke="#5bd089" strokeWidth="2" opacity=".95"
                     transform={`rotate(20 ${sceneCenter[0] + 120} ${sceneCenter[1] - 30})`} />
            <text x={sceneCenter[0] + 180} y={sceneCenter[1] - 70} fontFamily='"Architects Daughter"'
                  fontSize="13" fontWeight="700" fill="#5bd089">biofilm holding</text>
          </g>
          {/* Tagged bacterium arrow */}
          <g>
            <path d={`M 80 200 Q 170 220 ${sceneCenter[0] - 50} ${sceneCenter[1] - 20}`}
                  stroke="#dbe2f0" strokeWidth="1.8" fill="none" />
            <text x={26} y={194} fontFamily='"Architects Daughter"' fontSize="13"
                  fontWeight="700" fill="#dbe2f0">Ab-α tagged · clearance pending</text>
          </g>
          {/* Scale bar */}
          <g transform={`translate(${PHOTO_W - 110} ${PHOTO_H - 24})`}>
            <line x1={0} y1={0} x2={80} y2={0} stroke="#fffaea" strokeWidth="2" />
            <line x1={0} y1={-4} x2={0} y2={4} stroke="#fffaea" strokeWidth="2" />
            <line x1={80} y1={-4} x2={80} y2={4} stroke="#fffaea" strokeWidth="2" />
            <text x={40} y={-7} fontFamily='"Patrick Hand"' fontSize="11" fill="#fffaea" textAnchor="middle">
              20 µm
            </text>
          </g>
        </svg>
        {/* Photo caption ribbon */}
        <div style={{ position: 'absolute', left: 12, top: 12,
                      background: 'rgba(0,0,0,.6)', color: '#fffaea',
                      fontFamily: '"Patrick Hand"', fontSize: 11, padding: '3px 8px',
                      letterSpacing: .8 }}>
          Fig. 1 · site β · t=04:12 · DIC
        </div>
      </div>

      {/* LEFT column — Plasmid map dossier */}
      <div style={{ position: 'absolute', left: 22, top: photoY,
                    width: photoX - 38, transform: 'rotate(-1deg)' }}>
        <PlasmidPanel size="md" skin="dossier" />
      </div>

      {/* RIGHT column — clipped lab reports */}
      <div style={{ position: 'absolute', right: 22, top: photoY,
                    width: W - (photoX + PHOTO_W) - 32,
                    display: 'flex', flexDirection: 'column', gap: 14,
                    transform: 'rotate(1deg)' }}>
        <InstrumentBay skin="dossier" />
      </div>

      {/* Bottom escalation report */}
      <div style={{ position: 'absolute', left: photoX, bottom: 18, width: PHOTO_W,
                    background: '#fffaea', border: '1.4px solid #2a261c',
                    padding: '8px 14px',
                    boxShadow: '3px 3px 0 rgba(0,0,0,.12)',
                    transform: 'rotate(0.3deg)',
                    display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 14, height: 14, borderRadius: '50%', background: '#c4471f',
          boxShadow: '0 0 0 3px rgba(196,71,31,.25)',
        }} />
        <div style={{ fontFamily: '"Kalam"', fontWeight: 700, fontSize: 14, color: '#c4471f',
                      letterSpacing: 0.5, textTransform: 'uppercase' }}>
          Escalation Report
        </div>
        <div style={{ fontFamily: '"Patrick Hand"', fontSize: 13, color: '#1f1d18', flex: 1 }}>
          IL-8 surge detected · neutrophil recruitment confirmed · second wave est. arrival{' '}
          <b style={{ color: '#c4471f' }}>18s</b> · suspected addition: macrophage M1 polarization.
        </div>
        <div style={{ fontFamily: '"Patrick Hand"', fontSize: 11, color: '#6f6553' }}>
          stamped 04:12:33
        </div>
      </div>

      {/* Small bottom-right founder vitals */}
      <div style={{ position: 'absolute', right: 22, bottom: 18,
                    width: W - (photoX + PHOTO_W) - 32,
                    background: '#fffaea', border: '1.4px solid #2a261c',
                    padding: '8px 12px',
                    boxShadow: '2px 2px 0 rgba(0,0,0,.12)',
                    transform: 'rotate(0.6deg)' }}>
        <FounderHealth state="stressed" size={50} />
      </div>

      <AnnoArrows items={annos} width={W} height={H} />
      {annos.map((a, i) => <Anno key={i} {...a} />)}
    </div>
  );
}

Object.assign(window, { VariationA, VariationB, VariationC, VariationD });
