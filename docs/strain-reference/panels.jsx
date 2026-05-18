// panels.jsx — UI shells that wrap the bio illustrations.
// Each shell is reusable across variations with different chrome (HUD chip,
// lab-bench card, popup, dossier annotation).

// ─── Plasmid editor panel — three skins ────────────────────────────────────
function PlasmidPanel({ size = 'md', skin = 'card', title = 'Plasmid Editor', candidateIdx = 2, ghostIdx = 0 }) {
  const dims = { sm: 170, md: 220, lg: 280 }[size];
  const arcs = [
    { from: 10, to: 90, color: '#3a8c4d', label: 'BioFilm', candidate: ghostIdx === 0 },
    { from: 100, to: 170, color: '#3a6ac2', label: 'SurfaceSwitch' },
    { from: 180, to: 230, color: '#6b4a8c', label: 'CapsuleB', dim: true, ghost: true },
    { from: 240, to: 310, color: '#c4471f', label: 'ComplementInh' },
  ];
  const parts = [
    { label: 'CapsuleB', color: '#6b4a8c' },
    { label: 'FastGrow', color: '#d4a72c' },
    { label: 'Mucin++',  color: '#3fb39b' },
    { label: 'AntiAB',   color: '#3a6ac2' },
  ];

  const inner = (
    <Plasmid size={dims} arcs={arcs} parts={parts} showTray={skin !== 'minimal'} />
  );

  if (skin === 'card') {
    return (
      <div style={panelStyles.card}>
        <div style={panelStyles.cardHd}>
          <span style={panelStyles.cardTitle}>{title}</span>
          <span style={panelStyles.cardSub}>swap one gene · 18s to next wave</span>
        </div>
        {inner}
        <div style={panelStyles.tradeoff}>
          <b style={{ color: '#c4471f' }}>swap CapsuleB in</b> → BioFilm drops out (only 4 slots)
        </div>
      </div>
    );
  }
  if (skin === 'hud') {
    return (
      <div style={panelStyles.hud}>
        {inner}
      </div>
    );
  }
  if (skin === 'popup') {
    return (
      <div style={panelStyles.popup}>
        <div style={panelStyles.popupHd}>
          <span style={{ fontFamily: '"Kalam"', fontWeight: 700, fontSize: 14 }}>Cluster β · Plasmid</span>
          <span style={panelStyles.x}>×</span>
        </div>
        {inner}
      </div>
    );
  }
  if (skin === 'dossier') {
    return (
      <div style={panelStyles.dossier}>
        <div style={panelStyles.dossierHd}>
          plasmid map · annotated
          <span style={{ fontSize: 10, color: '#6f6553', marginLeft: 6 }}>fig.&nbsp;3a</span>
        </div>
        {inner}
        <div style={{
          marginTop: 6, fontFamily: '"Architects Daughter", "Patrick Hand"', fontSize: 11,
          color: '#1f3f7a', lineHeight: 1.3,
        }}>
          ※ slot 5 / 6 empty — reserved for CapsuleB this cycle.<br/>
          BioFilm expression ↓ if swapped (note: macrophage chew-through observed).
        </div>
      </div>
    );
  }
  return inner;
}

// ─── Instrument bay — stack of ELISA / PCR / open slot ─────────────────────
function InstrumentBay({ skin = 'card', orientation = 'vertical' }) {
  const items = [
    {
      label: 'ELISA · cytokine panel',
      content: <ElisaPlate size={120} signal={[[1,2],[1,3],[2,3]]} />,
      interp: <span><b style={{ color: '#a8551c' }}>IL-8 elevated</b> — neutrophil surge incoming</span>,
    },
    {
      label: 'PCR · antibody profile',
      content: <GelImage width={150} height={75} bands={[{ lane: 2, y: 32, height: 4, intensity: 1 }, { lane: 3, y: 48, height: 3, intensity: 0.6 }]} />,
      interp: <span>surface antigen <b style={{ color: '#1f3f7a' }}>α</b> detected in host antibodies</span>,
    },
    {
      label: 'Open slot · drag sample',
      content: <EmptyInstrument />,
      interp: <span style={{ color: '#6f6553' }}>load tissue sample to run</span>,
    },
  ];

  if (skin === 'dossier') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((it, i) => (
          <div key={i} style={panelStyles.dossierClip}>
            <div style={panelStyles.tape} />
            <div style={panelStyles.dossierHd}>{it.label}</div>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>{it.content}</div>
            <div style={{ fontFamily: '"Architects Daughter", "Patrick Hand"', fontSize: 11, color: '#1f1d18', borderTop: '1px dashed #6f6553', paddingTop: 4 }}>
              {it.interp}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (skin === 'chips') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.slice(0, 2).map((it, i) => (
          <div key={i} style={panelStyles.chip}>
            <div style={{ fontFamily: '"Patrick Hand"', fontSize: 10, color: '#6f6553' }}>{it.label}</div>
            {it.content}
            <div style={{ fontFamily: '"Patrick Hand"', fontSize: 10.5, color: '#1f1d18', textAlign: 'center' }}>{it.interp}</div>
          </div>
        ))}
      </div>
    );
  }

  // 'card' default — used by Lab Bench Split
  const dir = orientation === 'horizontal' ? 'row' : 'column';
  return (
    <div style={{ display: 'flex', flexDirection: dir, gap: 10, flexWrap: 'wrap' }}>
      {items.map((it, i) => (
        <div key={i} style={panelStyles.instCard}>
          <div style={panelStyles.cardHd}>
            <span style={panelStyles.cardTitle}>{it.label}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>{it.content}</div>
          <div style={panelStyles.interp}>{it.interp}</div>
        </div>
      ))}
    </div>
  );
}

function EmptyInstrument() {
  return (
    <div style={{
      width: 140, height: 75, border: '1.5px dashed #6f6553', borderRadius: 6,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 6, background: 'repeating-linear-gradient(45deg, #fffbf0, #fffbf0 4px, #f4ecdc 4px, #f4ecdc 8px)',
      fontFamily: '"Patrick Hand"', fontSize: 11, color: '#6f6553',
    }}>
      <svg width="18" height="32" viewBox="0 0 18 32">
        <path d="M 4 2 H 14 V 22 Q 14 30 9 30 Q 4 30 4 22 Z" fill="#fffaea" stroke="#2a261c" strokeWidth="1" />
        <rect x="4" y="2" width="10" height="3" fill="#3fb39b" />
        <rect x="4" y="22" width="10" height="6" fill="#3fb39b" opacity=".4" />
      </svg>
      Run Instrument
    </div>
  );
}

// ─── Founder cell health indicator (illustration-only) ─────────────────────
function FounderHealth({ state = 'stressed', size = 64 }) {
  const tint = state === 'critical' ? 0.35 : state === 'stressed' ? 0.7 : 1;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: '"Patrick Hand"' }}>
      <svg width={size} height={size} viewBox="-30 -30 60 60" style={{ opacity: tint }}>
        <ellipse cx="0" cy="0" rx="26" ry="14" fill="#fff2c4" opacity=".55" style={{ filter: 'blur(3px)' }} />
        <Bacterium scale={1.6} founder />
      </svg>
      <div style={{ fontSize: 12, color: '#1f1d18' }}>
        <div style={{ fontFamily: '"Kalam"', fontWeight: 700, fontSize: 14 }}>Founder Cell</div>
        <div style={{ color: state === 'critical' ? '#c4471f' : state === 'stressed' ? '#a8551c' : '#3a7a3a' }}>
          {state === 'critical' ? 'membrane damage' :
           state === 'stressed' ? 'surface proteins fading' :
           'glowing · flagella active'}
        </div>
      </div>
    </div>
  );
}

// ─── styles ────────────────────────────────────────────────────────────────
const panelStyles = {
  card: {
    background: '#fffbf0', border: '1.4px solid #2a261c', borderRadius: 10,
    padding: '10px 12px 12px', boxShadow: '3px 3px 0 rgba(0,0,0,.08)',
    display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center',
  },
  cardHd: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', width: '100%', gap: 8 },
  cardTitle: { fontFamily: '"Kalam"', fontWeight: 700, fontSize: 13, color: '#1f1d18' },
  cardSub: { fontFamily: '"Patrick Hand"', fontSize: 11, color: '#6f6553' },
  tradeoff: {
    fontFamily: '"Patrick Hand"', fontSize: 11, color: '#1f1d18', textAlign: 'center',
    width: '100%', borderTop: '1px dashed #6f6553', paddingTop: 6, lineHeight: 1.3,
  },
  hud: {
    background: 'rgba(255,251,240,.86)',
    border: '1.4px solid #2a261c',
    borderRadius: 50,
    padding: 8,
    boxShadow: '0 0 16px rgba(0,0,0,.18), 3px 3px 0 rgba(0,0,0,.12)',
    backdropFilter: 'blur(6px)',
  },
  popup: {
    background: '#fffbf0', border: '1.4px solid #2a261c', borderRadius: 10,
    padding: '6px 10px 10px',
    boxShadow: '4px 4px 0 rgba(0,0,0,.18)',
    width: 'fit-content',
  },
  popupHd: { display: 'flex', justifyContent: 'space-between', alignItems: 'center',
             borderBottom: '1px dashed #6f6553', paddingBottom: 4, marginBottom: 6 },
  x: { fontFamily: '"Kalam"', fontWeight: 700, color: '#6f6553', cursor: 'pointer' },
  dossier: {
    background: '#fffaea',
    border: '1px solid #2a261c',
    padding: '8px 10px 10px',
    boxShadow: '2px 2px 0 rgba(0,0,0,.1)',
    fontFamily: '"Patrick Hand"',
    position: 'relative',
  },
  dossierHd: {
    fontFamily: '"Kalam"', fontWeight: 700, fontSize: 12, color: '#1f1d18',
    textTransform: 'uppercase', letterSpacing: .8, marginBottom: 4,
  },
  dossierClip: {
    background: '#fffaea', border: '1px solid #2a261c', padding: '12px 10px 8px',
    position: 'relative', boxShadow: '2px 2px 0 rgba(0,0,0,.08)',
  },
  tape: {
    position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%) rotate(-2deg)',
    width: 50, height: 14, background: 'rgba(255, 230, 130, .7)',
    border: '1px solid rgba(180, 130, 30, .5)',
  },
  chip: {
    background: 'rgba(255,251,240,.88)', border: '1.2px solid #2a261c', borderRadius: 8,
    padding: 4, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center',
    backdropFilter: 'blur(6px)', boxShadow: '2px 2px 0 rgba(0,0,0,.12)',
  },
  instCard: {
    background: '#fffbf0', border: '1.4px solid #2a261c', borderRadius: 8,
    padding: 8, display: 'flex', flexDirection: 'column', gap: 5,
    boxShadow: '2px 2px 0 rgba(0,0,0,.06)', minWidth: 168,
  },
  interp: {
    fontFamily: '"Patrick Hand"', fontSize: 11.5, color: '#1f1d18',
    borderTop: '1px dashed #6f6553', paddingTop: 4, lineHeight: 1.25,
  },
};

Object.assign(window, { PlasmidPanel, InstrumentBay, FounderHealth, EmptyInstrument });
