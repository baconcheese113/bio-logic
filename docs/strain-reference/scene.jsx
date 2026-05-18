// scene.jsx — shared BattleScene: tissue + colony + immune cells + interactions.
// Composed by each of the four variations with different framing.

// Helper — defines a circle-clip path for petri / microscope shape
function ClipDef({ id, width, height, shape, padding = 20 }) {
  if (shape === 'circle') {
    const r = Math.min(width, height) / 2 - padding;
    return (
      <defs>
        <clipPath id={id}>
          <circle cx={width / 2} cy={height / 2} r={r} />
        </clipPath>
      </defs>
    );
  }
  return (
    <defs>
      <clipPath id={id}>
        <rect x="0" y="0" width={width} height={height} rx="10" />
      </clipPath>
    </defs>
  );
}

// ─── BattleScene — one tissue battle ───────────────────────────────────────
function BattleScene({
  width = 800, height = 600,
  shape = 'rect',         // 'rect' | 'circle'
  vignette = false,
  cytokineFrom,
  colonyCenter,           // [x, y]
  colonyRadius = 90,
  colonySize = 'md',      // sm / md / lg → controls bacteria count
  geneMix = ['normal', 'biofilm', 'normal', 'surface'],
  neutrophils = [],       // [{x,y,scale}]
  macrophages = [],       // [{x,y,scale,angle,engulfing}]
  antibodies = [],        // [{x,y,angle,scale}]
  biofilmPath,            // 'M ... Z'
  showFounder = true,
  founderState = 'stressed',
  extraSvg,               // function(svg) returning extra svg children
}) {
  const cc = colonyCenter || [width * 0.42, height * 0.55];
  const count = { sm: 14, md: 28, lg: 48 }[colonySize];

  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden',
                  borderRadius: shape === 'circle' ? '50%' : 10 }}>
      <TissueBg width={width} height={height} vignette={vignette}
                cytokineFrom={cytokineFrom} />
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
           style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {/* Biofilm under the bacteria */}
        {biofilmPath && <Biofilm d={biofilmPath} />}

        {/* Floating antibodies behind cells */}
        {antibodies.map((a, i) => (
          <Antibody key={`ab-${i}`} x={a.x} y={a.y} angle={a.angle || 0} scale={a.scale || 1} />
        ))}

        {/* Bacterial colony */}
        <BacterialColony
          cx={cc[0]} cy={cc[1]}
          count={count} radius={colonyRadius}
          seed={11} geneMix={geneMix}
          founderAt={[0, 0]}
          taggedIdx={[3, 11]}
          engulfedIdx={[count - 1, count - 2]}
        />

        {/* Macrophages */}
        {macrophages.map((m, i) => (
          <Macrophage key={`mac-${i}`} x={m.x} y={m.y} scale={m.scale || 1}
                      angle={m.angle || 0} engulfing={m.engulfing} />
        ))}

        {/* Neutrophil swarm */}
        {neutrophils.map((n, i) => (
          <Neutrophil key={`neu-${i}`} x={n.x} y={n.y} scale={n.scale || 1} />
        ))}

        {/* Per-scene extras */}
        {extraSvg && extraSvg({ width, height })}
      </svg>
    </div>
  );
}

// Default population helper — generates the standard "active assault" tableau
function defaultAssault(width, height, colonyCenter) {
  const cc = colonyCenter || [width * 0.42, height * 0.55];
  // Neutrophil swarm from top-right
  const neutrophils = [];
  const swarmAnchor = [width * 0.78, height * 0.18];
  const swarmSeed = rngSeq(101);
  for (let i = 0; i < 7; i++) {
    neutrophils.push({
      x: swarmAnchor[0] + (swarmSeed() - 0.5) * 140,
      y: swarmAnchor[1] + (swarmSeed() - 0.5) * 120,
      scale: 0.85 + swarmSeed() * 0.4,
    });
  }
  // Two macrophages from west / SW
  const macrophages = [
    { x: width * 0.15, y: height * 0.45, scale: 1.05, angle: 15, engulfing: false },
    { x: width * 0.20, y: height * 0.78, scale: 0.95, angle: -10, engulfing: true },
  ];
  // Antibodies sprinkled near colony edge
  const antibodies = [
    { x: cc[0] - 60, y: cc[1] - 70, angle: 10, scale: 0.95 },
    { x: cc[0] + 80, y: cc[1] - 30, angle: -25, scale: 0.85 },
    { x: cc[0] + 110, y: cc[1] + 60, angle: 35, scale: 0.9 },
    { x: cc[0] - 30, y: cc[1] + 90, angle: -10, scale: 0.8 },
  ];
  // Biofilm on the NE side, between colony and neutrophils
  const biofilm = `M ${cc[0] + 30} ${cc[1] - 100}
                   Q ${cc[0] + 130} ${cc[1] - 120} ${cc[0] + 170} ${cc[1] - 40}
                   Q ${cc[0] + 180} ${cc[1] + 40} ${cc[0] + 120} ${cc[1] + 70}
                   Q ${cc[0] + 60} ${cc[1] + 30} ${cc[0] + 30} ${cc[1] - 100} Z`;
  return { neutrophils, macrophages, antibodies, biofilmPath: biofilm };
}

// Minimal rng sequence — for one-off generation
function rngSeq(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
}

Object.assign(window, { BattleScene, defaultAssault, rngSeq });
