// bio.jsx — BioRender-style SVG illustrations.
// Real biological shapes: bacteria, neutrophils, macrophages, antibodies,
// plasmid, instrument readouts. Used by the four wireframe variations.

// ─── small deterministic prng so layouts are stable across renders ─────────
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

// ─── Tissue background ─────────────────────────────────────────────────────
// Warm pink ECM with fibrous texture and a faint cytokine wash overlay.
function TissueBg({ width = 800, height = 600, vignette = false, cytokineFrom, cytokineColor = '#ff8a4a' }) {
  const r = rng(7);
  // ECM fibres — short curved strokes
  const fibres = Array.from({ length: 70 }).map((_, i) => {
    const x = r() * width, y = r() * height;
    const len = 18 + r() * 32;
    const ang = r() * Math.PI * 2;
    return { x, y, dx: Math.cos(ang) * len, dy: Math.sin(ang) * len };
  });
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
         style={{ position: 'absolute', inset: 0, display: 'block' }}>
      <defs>
        <radialGradient id={`tg-${width}`} cx="50%" cy="42%" r="75%">
          <stop offset="0%" stopColor="#fbd2c2" />
          <stop offset="50%" stopColor="#f0a896" />
          <stop offset="100%" stopColor="#c97160" />
        </radialGradient>
        <radialGradient id={`vg-${width}`} cx="50%" cy="50%" r="68%">
          <stop offset="60%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(40,8,8,.55)" />
        </radialGradient>
        <radialGradient id={`cyto-${width}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={cytokineColor} stopOpacity=".45" />
          <stop offset="70%" stopColor={cytokineColor} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width={width} height={height} fill={`url(#tg-${width})`} />
      {/* ECM fibres */}
      <g stroke="#a85040" strokeWidth="0.6" opacity=".22" strokeLinecap="round" fill="none">
        {fibres.map((f, i) => (
          <path key={i} d={`M ${f.x} ${f.y} q ${f.dx * 0.5} ${f.dy * 0.3 - 4} ${f.dx} ${f.dy}`} />
        ))}
      </g>
      {/* Capillary fibres — wispy */}
      <g stroke="#8b3527" strokeWidth="0.5" opacity=".18" fill="none">
        {Array.from({ length: 14 }).map((_, i) => {
          const y = (i + 1) * (height / 16);
          const wob = 8 + r() * 14;
          return <path key={i} d={`M 0 ${y} Q ${width / 3} ${y - wob} ${width / 2} ${y} T ${width} ${y + wob - 4}`} />;
        })}
      </g>
      {/* Cytokine wash — telegraphs where the next wave is coming from */}
      {cytokineFrom && (
        <g transform={`translate(${cytokineFrom[0]} ${cytokineFrom[1]})`}>
          <circle r={Math.max(width, height) * 0.55} fill={`url(#cyto-${width})`} />
        </g>
      )}
      {vignette && <rect x="0" y="0" width={width} height={height} fill={`url(#vg-${width})`} />}
    </svg>
  );
}

// ─── Bacterium — rod with fimbriae + surface proteins ──────────────────────
// gene: 'biofilm'|'surface'|'capsule'|'complement'|'normal' affects glow color
function Bacterium({ x = 0, y = 0, angle = 0, scale = 1, gene = 'normal', tagged = false, engulfed = false, founder = false }) {
  const glowMap = {
    normal: 'transparent',
    biofilm: '#5bd089',
    surface: '#6aa7ff',
    capsule: '#c2b3d8',
    complement: '#ffa64d',
    founder: '#fff2c4',
  };
  const glow = founder ? glowMap.founder : glowMap[gene] || 'transparent';
  const opacity = engulfed ? 0.4 : 1;
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`} opacity={opacity}>
      {/* Outer glow when gene active */}
      {glow !== 'transparent' && (
        <ellipse cx="0" cy="0" rx="22" ry="11" fill={glow} opacity={founder ? 0.45 : 0.32}
                 style={founder ? { filter: 'blur(3px)' } : { filter: 'blur(2px)' }} />
      )}
      {/* Fimbriae (hair-like projections) */}
      <g stroke="#5a3a2a" strokeWidth="0.5" opacity=".55">
        <path d="M -14 -5 q -3 -3 -6 -2" fill="none" />
        <path d="M -12 0 q -4 0 -7 1" fill="none" />
        <path d="M -14 5 q -3 3 -6 4" fill="none" />
        <path d="M 14 -5 q 3 -3 6 -2" fill="none" />
        <path d="M 14 5 q 3 3 6 4" fill="none" />
      </g>
      {/* Cell body */}
      <ellipse cx="0" cy="0" rx="14" ry="6.5"
               fill={founder ? '#fff3d6' : '#f4e3c5'}
               stroke="#6d4126" strokeWidth="0.9" />
      {/* Interior texture - cytoplasm granules */}
      <circle cx="-5" cy="-1" r="1.2" fill="#c79866" opacity=".5" />
      <circle cx="3" cy="1.5" r="1" fill="#c79866" opacity=".5" />
      <circle cx="7" cy="-1.5" r="0.9" fill="#c79866" opacity=".4" />
      {/* Surface proteins / spikes — color depends on gene */}
      {gene === 'surface' || gene === 'normal' || founder ? (
        <g fill={gene === 'surface' ? '#3d77d6' : '#c44a32'} opacity=".85">
          <circle cx="-9" cy="-5.5" r="1.4" />
          <circle cx="-3" cy="-6" r="1.4" />
          <circle cx="3" cy="-6" r="1.4" />
          <circle cx="9" cy="-5.5" r="1.4" />
          <circle cx="-6" cy="6" r="1.4" />
          <circle cx="0" cy="6.5" r="1.4" />
          <circle cx="6" cy="6" r="1.4" />
        </g>
      ) : null}
      {/* Biofilm — extra exopolysaccharide goo around */}
      {gene === 'biofilm' && (
        <ellipse cx="0" cy="0" rx="18" ry="9" fill="#5bd089" opacity=".22" />
      )}
      {/* Capsule — slimy outer layer */}
      {gene === 'capsule' && (
        <ellipse cx="0" cy="0" rx="17" ry="9" fill="none" stroke="#9c87bd" strokeWidth="1.6" opacity=".7" strokeDasharray="2 2" />
      )}
      {/* Antibody tag */}
      {tagged && <Antibody x={2} y={-12} angle={20} scale={0.55} />}
      {/* Founder cell extra glow ring */}
      {founder && (
        <ellipse cx="0" cy="0" rx="22" ry="12" fill="none" stroke="#fff2c4" strokeWidth="0.8" opacity=".8" />
      )}
    </g>
  );
}

// ─── Bacterial colony — cluster ────────────────────────────────────────────
function BacterialColony({ cx, cy, count = 24, radius = 60, seed = 1, geneMix = ['normal'], founderAt = [0, 0], taggedIdx = [], engulfedIdx = [] }) {
  const r = rng(seed);
  const bacs = Array.from({ length: count }).map((_, i) => {
    const ang = r() * Math.PI * 2;
    const rr = Math.sqrt(r()) * radius;
    return {
      x: cx + Math.cos(ang) * rr,
      y: cy + Math.sin(ang) * rr,
      angle: r() * 360,
      scale: 0.7 + r() * 0.45,
      gene: geneMix[Math.floor(r() * geneMix.length)],
    };
  });
  // Founder at specified offset from cx/cy
  const founderX = cx + founderAt[0];
  const founderY = cy + founderAt[1];
  return (
    <g>
      {bacs.map((b, i) => (
        <Bacterium key={i}
                   x={b.x} y={b.y} angle={b.angle} scale={b.scale}
                   gene={b.gene}
                   tagged={taggedIdx.includes(i)}
                   engulfed={engulfedIdx.includes(i)} />
      ))}
      <Bacterium x={founderX} y={founderY} angle={0} scale={1.2} founder gene="normal" />
    </g>
  );
}

// ─── Neutrophil — multi-lobed nucleus, granular cytoplasm ──────────────────
function Neutrophil({ x = 0, y = 0, scale = 1, stressed = false }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* Cytoplasm */}
      <circle r="20" fill="#f0c2d6" stroke="#8a2a5a" strokeWidth="1" opacity={stressed ? 0.55 : 1} />
      {/* Granules */}
      <g fill="#b04a7f" opacity=".55">
        <circle cx="-8" cy="-4" r="1.2" />
        <circle cx="6" cy="-9" r="1" />
        <circle cx="10" cy="6" r="1.3" />
        <circle cx="-4" cy="10" r="1.1" />
        <circle cx="-12" cy="4" r="1" />
        <circle cx="3" cy="3" r="1.2" />
        <circle cx="-1" cy="-12" r="1" />
        <circle cx="13" cy="-2" r="1.1" />
      </g>
      {/* Multi-lobed nucleus — 3 connected lobes */}
      <g fill="#5b1f3f" opacity=".92">
        <ellipse cx="-6" cy="-3" rx="6" ry="5" />
        <ellipse cx="5" cy="-5" rx="5" ry="4.5" />
        <ellipse cx="2" cy="6" rx="5.5" ry="5" />
        {/* connecting strands */}
        <path d="M -2 -3 Q 0 -6 2 -5" stroke="#5b1f3f" strokeWidth="2" fill="none" />
        <path d="M 4 -1 Q 3 2 2 3" stroke="#5b1f3f" strokeWidth="2" fill="none" />
      </g>
    </g>
  );
}

// ─── Macrophage — large, irregular, with pseudopods ────────────────────────
function Macrophage({ x = 0, y = 0, scale = 1, engulfing = false, angle = 0 }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
      {/* Irregular body with pseudopods */}
      <path
        d="M -32 -8
           C -38 -22 -22 -34 -8 -32
           C 6 -36 26 -26 30 -10
           C 38 4 30 22 16 28
           C 2 34 -14 30 -24 22
           C -34 14 -32 -4 -32 -8 Z"
        fill="#d8b8c8" stroke="#5a3050" strokeWidth="1.1" opacity=".92" />
      {/* Pseudopod extensions */}
      <path d="M 28 -6 Q 38 -10 44 -4" fill="#d8b8c8" stroke="#5a3050" strokeWidth="1" />
      <path d="M -32 4 Q -42 8 -46 16" fill="none" stroke="#5a3050" strokeWidth="1" />
      {/* Cytoplasmic granules / vesicles */}
      <g fill="#9a6e88" opacity=".55">
        <circle cx="-10" cy="-12" r="2.5" />
        <circle cx="8" cy="-6" r="2" />
        <circle cx="14" cy="10" r="2.5" />
        <circle cx="-6" cy="14" r="2" />
        <circle cx="-18" cy="2" r="1.8" />
      </g>
      {/* Kidney-shaped nucleus */}
      <path d="M -8 -10
               C -16 -12 -18 -2 -12 4
               C -4 8 4 6 6 -2
               C 8 -10 0 -14 -8 -10 Z"
            fill="#3d1e35" opacity=".88" />
      {/* Engulfment — show a small captured bacterium being pulled in */}
      {engulfing && (
        <g transform="translate(26 -2) rotate(15)">
          <ellipse cx="0" cy="0" rx="10" ry="5" fill="#f4e3c5" stroke="#6d4126" strokeWidth="0.7" opacity=".55" />
          <path d="M -8 -4 Q 0 -10 8 -4" fill="none" stroke="#5a3050" strokeWidth="1" strokeDasharray="2 2" />
        </g>
      )}
    </g>
  );
}

// ─── Antibody — Y-shape ────────────────────────────────────────────────────
function Antibody({ x = 0, y = 0, angle = 0, scale = 1, color = '#dbe2f0' }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
      {/* Y-shape: two upper arms (Fab), one lower stem (Fc) */}
      <g stroke="#3a4a6a" strokeWidth="1.4" fill={color} strokeLinejoin="round" strokeLinecap="round">
        <path d="M -7 -10 L 0 0 L 7 -10" />
        <path d="M 0 0 L 0 9" />
        {/* Variable region knobs */}
        <circle cx="-7" cy="-10" r="2.4" />
        <circle cx="7" cy="-10" r="2.4" />
        <circle cx="0" cy="9" r="2" />
      </g>
    </g>
  );
}

// ─── Biofilm layer — semi-transparent green barrier ────────────────────────
function Biofilm({ d, opacity = 0.38 }) {
  return (
    <g>
      <path d={d} fill="#5bd089" opacity={opacity} />
      <path d={d} fill="none" stroke="#2f9156" strokeWidth="1" strokeDasharray="3 3" opacity=".55" />
    </g>
  );
}

// ─── Plasmid — circular DNA with labeled gene arcs ─────────────────────────
// gives a real genetics-paper look.
function Plasmid({
  size = 220,
  arcs = [],         // [{from: deg, to: deg, color, label, dim?, ghost?, candidate?}]
  parts = [],        // [{label, color, icon}] — parts tray
  showTray = true,
  hoveredIdx = null, // dashed border on this arc
}) {
  const cx = size / 2, cy = size / 2;
  const R = size * 0.36;
  const polar = (deg, rad) => [
    cx + Math.cos((deg - 90) * Math.PI / 180) * rad,
    cy + Math.sin((deg - 90) * Math.PI / 180) * rad,
  ];
  const arcPath = (from, to, rad) => {
    const [x1, y1] = polar(from, rad);
    const [x2, y2] = polar(to, rad);
    const large = (to - from) > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${rad} ${rad} 0 ${large} 1 ${x2} ${y2}`;
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
        <defs>
          <radialGradient id={`pl-bg-${size}`} cx="50%" cy="50%" r="50%">
            <stop offset="80%" stopColor="rgba(255,251,240,.0)" />
            <stop offset="100%" stopColor="rgba(255,251,240,.4)" />
          </radialGradient>
        </defs>
        {/* Double-stranded helix circles */}
        <circle cx={cx} cy={cy} r={R + 4} fill="none" stroke="#2a261c" strokeWidth="1.1" />
        <circle cx={cx} cy={cy} r={R - 4} fill="none" stroke="#2a261c" strokeWidth="1.1" />
        {/* Base-pair ticks across the helix */}
        <g stroke="#2a261c" strokeWidth="0.55" opacity=".5">
          {Array.from({ length: 48 }).map((_, i) => {
            const a = (i / 48) * 360;
            const [x1, y1] = polar(a, R - 4);
            const [x2, y2] = polar(a, R + 4);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
        </g>
        {/* Gene arcs */}
        {arcs.map((arc, i) => (
          <g key={i} opacity={arc.dim ? 0.3 : 1}>
            <path
              d={arcPath(arc.from, arc.to, R)}
              fill="none"
              stroke={arc.color}
              strokeWidth="10"
              strokeLinecap="butt"
              strokeDasharray={arc.ghost ? '5 4' : 'none'}
              opacity={arc.ghost ? 0.55 : 1} />
            {/* hover/candidate dashed outline */}
            {(arc.candidate || hoveredIdx === i) && (
              <path
                d={arcPath(arc.from - 1, arc.to + 1, R)}
                fill="none" stroke="#1f1d18" strokeWidth="1.4"
                strokeDasharray="4 3" opacity=".8" />
            )}
            {/* Arrowhead at arc end (gene direction) */}
            {(() => {
              const [tx, ty] = polar(arc.to, R);
              const [px, py] = polar(arc.to - 2, R);
              const dx = tx - px, dy = ty - py;
              const ang = Math.atan2(dy, dx);
              const a1 = ang + Math.PI - 0.4, a2 = ang + Math.PI + 0.4;
              return (
                <path
                  d={`M ${tx} ${ty} L ${tx + Math.cos(a1) * 7} ${ty + Math.sin(a1) * 7}
                      M ${tx} ${ty} L ${tx + Math.cos(a2) * 7} ${ty + Math.sin(a2) * 7}`}
                  stroke={arc.color} strokeWidth="2.4" strokeLinecap="round" />
              );
            })()}
            {/* Label at midpoint, outside */}
            {(() => {
              const mid = (arc.from + arc.to) / 2;
              const [lx, ly] = polar(mid, R + 22);
              return (
                <text x={lx} y={ly} fontSize="10" fontFamily='"Patrick Hand"'
                      textAnchor={lx < cx ? 'end' : 'start'}
                      fill="#1f1d18" opacity={arc.dim ? 0.6 : 1}>
                  {arc.label}
                </text>
              );
            })()}
            {/* Tick at arc start (restriction site style) */}
            {(() => {
              const [sx, sy] = polar(arc.from, R - 8);
              const [ex, ey] = polar(arc.from, R + 8);
              return <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="#2a261c" strokeWidth="1.2" />;
            })()}
          </g>
        ))}
        {/* Empty slot markers — small open brackets between arcs */}
        {/* Center label */}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fontFamily='"Kalam"' fontWeight="700" fill="#1f1d18">
          pSTRAIN-04
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fontFamily='"Patrick Hand"' fill="#6f6553">
          4 / 6 slots used
        </text>
        <text x={cx} y={cy + 22} textAnchor="middle" fontSize="8" fontFamily='"Patrick Hand"' fill="#6f6553">
          7.4 kb
        </text>
      </svg>
      {/* Parts tray */}
      {showTray && parts.length > 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: `repeat(${parts.length}, 1fr)`, gap: 6,
          padding: '6px 8px', background: 'rgba(255,251,240,.7)',
          border: '1px solid #2a261c', borderRadius: 8, width: '100%',
          boxShadow: '2px 2px 0 rgba(0,0,0,.06)',
        }}>
          {parts.map((p, i) => (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: 4, background: '#fffaea', border: `1.4px solid ${p.color}`, borderRadius: 5,
              fontFamily: '"Patrick Hand"', fontSize: 10, color: '#1f1d18',
            }}>
              <div style={{
                width: 22, height: 8, background: p.color, borderRadius: 2,
                border: '0.5px solid rgba(0,0,0,.35)',
              }} />
              <div style={{ lineHeight: 1.05, textAlign: 'center' }}>{p.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ELISA plate — small well grid with colored signal ─────────────────────
function ElisaPlate({ size = 130, signal = [[1,2],[1,3]] }) {
  const cols = 8, rows = 6;
  const cellW = (size - 18) / cols;
  const cellH = (size - 26) / rows;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Plate body */}
      <rect x="1" y="1" width={size - 2} height={size - 2} rx="6" fill="#f4ecdc" stroke="#2a261c" strokeWidth="1.2" />
      <text x={size/2} y="14" textAnchor="middle" fontSize="9" fontFamily='"Kalam"' fontWeight="700" fill="#1f1d18">ELISA · 96-well</text>
      <g transform="translate(9 18)">
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((_, c) => {
            const isSignal = signal.some((s) => s[0] === r && s[1] === c);
            const isWeak = signal.some((s) => s[0] === r && Math.abs(s[1] - c) === 1);
            const fill = isSignal ? '#4a2a0e'
                      : isWeak ? '#a87a3a'
                      : '#f4d9b4';
            return (
              <circle key={`${r}-${c}`}
                      cx={c * cellW + cellW/2}
                      cy={r * cellH + cellH/2}
                      r={Math.min(cellW, cellH) * 0.36}
                      fill={fill} stroke="#2a261c" strokeWidth="0.5" />
            );
          })
        )}
      </g>
    </svg>
  );
}

// ─── Gel image — PCR/electrophoresis bands ─────────────────────────────────
function GelImage({ width = 160, height = 90, bands = [{ lane: 1, intensity: 0.9 }] }) {
  const lanes = 5;
  const laneW = (width - 16) / lanes;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Gel body */}
      <rect x="1" y="1" width={width - 2} height={height - 2} rx="3" fill="#1d2d28" stroke="#2a261c" strokeWidth="1" />
      {/* Wells */}
      <g transform="translate(8 6)">
        {Array.from({ length: lanes }).map((_, i) => (
          <rect key={i} x={i * laneW + 4} y="0" width={laneW - 8} height="4" fill="#0d1a15" stroke="#5b9b7a" strokeWidth="0.3" />
        ))}
      </g>
      {/* Ladder lane 0 */}
      <g transform="translate(8 12)" fill="#9ce6b6">
        {[18, 30, 42, 54, 66].map((y, i) => (
          <rect key={i} x={4} y={y} width={laneW - 8} height="2.5" opacity={0.95 - i * 0.1} />
        ))}
      </g>
      {/* Sample bands */}
      <g transform="translate(8 12)" fill="#a0eebf">
        {bands.map((b, i) => (
          <rect key={i} x={b.lane * laneW + 4} y={b.y || 36} width={laneW - 8} height={b.height || 3.5}
                opacity={b.intensity} />
        ))}
      </g>
      <text x={width / 2} y={height - 4} textAnchor="middle" fontSize="8" fontFamily='"Patrick Hand"' fill="#9ce6b6">
        PCR · agarose 1.5%
      </text>
    </svg>
  );
}

// ─── Chromatogram — sequence trace ─────────────────────────────────────────
function Chromatogram({ width = 200, height = 70 }) {
  const r = rng(33);
  const make = (offset, color) => {
    let d = `M 4 ${height - 8}`;
    for (let x = 4; x < width - 4; x += 4) {
      const peak = (x + offset) % 24 < 4 ? 28 + r() * 14 : 4 + r() * 6;
      d += ` L ${x} ${height - 8 - peak}`;
    }
    return <path d={d} fill="none" stroke={color} strokeWidth="1" opacity=".85" />;
  };
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect x="1" y="1" width={width-2} height={height-2} fill="#fffbf0" stroke="#2a261c" strokeWidth="1" rx="2" />
      {make(0, '#1f7a3f')}
      {make(6, '#1f3f7a')}
      {make(12, '#7a1f3f')}
      {make(18, '#a08020')}
      {/* baseline */}
      <line x1="4" y1={height - 8} x2={width - 4} y2={height - 8} stroke="#2a261c" strokeWidth="0.4" />
      <text x="6" y="11" fontSize="8" fontFamily='"Patrick Hand"' fill="#3a352a">surfA · 240 bp</text>
    </svg>
  );
}

// ─── Wave indicator — current threats + next escalation ────────────────────
function WaveIndicator({ active = ['neutrophil', 'macrophage'], next = '?', seconds = 18, compact = false }) {
  const iconFor = (k, s = 22) => {
    if (k === 'neutrophil') return <Neutrophil scale={s / 60} />;
    if (k === 'macrophage') return <Macrophage scale={s / 90} />;
    if (k === 'antibody')  return <Antibody scale={s / 18} />;
    return null;
  };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: compact ? 10 : 14,
      fontFamily: '"Patrick Hand"', color: '#1f1d18',
    }}>
      <div style={{ fontSize: compact ? 11 : 12, color: '#6f6553', textTransform: 'uppercase', letterSpacing: .8 }}>
        Wave 3 · active
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {active.map((k, i) => (
          <div key={i} style={{
            width: compact ? 30 : 36, height: compact ? 30 : 36,
            border: '1.4px solid #2a261c', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#fffbf0',
            boxShadow: '0 0 8px rgba(255, 80, 60, .35)',
          }}>
            <svg width={compact ? 22 : 26} height={compact ? 22 : 26} viewBox="-20 -20 40 40">
              {iconFor(k)}
            </svg>
          </div>
        ))}
        {/* Next telegraph */}
        <div style={{
          width: compact ? 30 : 36, height: compact ? 30 : 36, borderRadius: '50%',
          border: '1.4px dashed #2a261c', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'repeating-linear-gradient(45deg, #f4ecdc, #f4ecdc 3px, #e8dcc0 3px, #e8dcc0 6px)',
          fontFamily: '"Kalam"', fontWeight: 700, fontSize: 18, color: '#1f1d18',
        }}>?</div>
      </div>
      <div style={{ fontSize: compact ? 12 : 13, color: '#1f1d18' }}>
        next escalation <b style={{ color: '#c4471f' }}>{seconds}s</b>
      </div>
    </div>
  );
}

Object.assign(window, {
  TissueBg, Bacterium, BacterialColony, Neutrophil, Macrophage, Antibody, Biofilm,
  Plasmid, ElisaPlate, GelImage, Chromatogram, WaveIndicator,
});
