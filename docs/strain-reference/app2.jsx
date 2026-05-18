// app2.jsx — Tabs + intro + single stage per variation + tweaks
const { useState } = React;

const TAB_DATA = [
  {
    id: 'A', key: 'petri',
    title: 'Petri Dish Command',
    tag: 'diegetic · no chrome',
    intent: 'Single circular microscope view. Game state is purely spatial — what you see on the tissue is what you know. Plasmid and instruments float as tiny HUD chips you tap to expand.',
    feels: 'Living system. Most immersive. Lowest cognitive overhead between battle and tools.',
    risks: 'New players may miss the tiny HUD. Cytokine wash must read as "telegraph" not noise.',
    Comp: window.VariationA,
  },
  {
    id: 'B', key: 'split',
    title: 'Lab Bench Split',
    tag: 'fight ⇆ engineer',
    intent: 'Screen split 50/50. Left half is the live tissue battle; right half is the lab bench — plasmid editor centered, three instrument readouts, sample tube tray. A central cytokine strip links them with live signal.',
    feels: 'You are both general and scientist. The two phases of play (fight / engineer) have permanent screen real-estate.',
    risks: 'Battlefield smaller than other layouts. Eyes have to scan further during crisis.',
    Comp: window.VariationB,
  },
  {
    id: 'C', key: 'bodymap',
    title: 'Body Map Strategic',
    tag: 'multi-zone · zoomed out',
    intent: 'Cross-section of tissue layers: epidermis, dermis, blood vessel, subcutis. Multiple colony clusters across zones — each with its own gene configuration. Click a cluster, edit its plasmid in a popup. Triage which zones to defend, which to sacrifice.',
    feels: 'Strategic. You become a general managing fronts, not a defender of one base.',
    risks: 'Bigger map = more to track. Per-cluster plasmid micro-management could overload — needs aggressive defaults.',
    Comp: window.VariationC,
  },
  {
    id: 'D', key: 'dossier',
    title: 'Infection Log Dossier',
    tag: 'scientific aesthetic',
    intent: 'You are a scientist reading a live case file. Central microscopy printout with hand-drawn annotations. Clipped lab reports surround it. Plasmid map drawn like a paper figure. Escalation comes as a clinical report update.',
    feels: 'Highest educational signal. Looks like doing real science under pressure. Slowest pace.',
    risks: 'Static-feeling. Real-time tension fights the documentary aesthetic. Needs careful motion design.',
    Comp: window.VariationD,
  },
];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "tab": "A",
  "showAnnotations": true,
  "showNotes": true,
  "darkPage": false
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [activeTab, setActiveTab] = useState(t.tab || 'A');

  React.useEffect(() => { setActiveTab(t.tab); }, [t.tab]);
  React.useEffect(() => { document.body.classList.toggle('dark', !!t.darkPage); }, [t.darkPage]);
  React.useEffect(() => { document.body.classList.toggle('no-anno', !t.showAnnotations); }, [t.showAnnotations]);

  const active = TAB_DATA.find((d) => d.id === activeTab) || TAB_DATA[0];

  return (
    <>
      <div className="tabs" role="tablist">
        {TAB_DATA.map((d) => (
          <button
            key={d.id}
            className={`tab ${activeTab === d.id ? 'active' : ''}`}
            onClick={() => { setActiveTab(d.id); setTweak('tab', d.id); }}
            role="tab"
            aria-selected={activeTab === d.id}
            data-screen-label={`Tab ${d.id} · ${d.title}`}
          >
            <span className="tk">{d.id}</span>
            {d.title}
            <span className="tag">{d.tag}</span>
          </button>
        ))}
      </div>

      <section className="tab-body"
               data-screen-label={`${active.id} · ${active.title}`}>
        <div className="intro">
          <div className="col">
            <h2><span className="badge">{active.id}</span>{active.title}</h2>
            <p>{active.intent}</p>
          </div>
          <div className="col">
            <h3>What it feels like</h3>
            <p style={{ marginTop: 0 }}>{active.feels}</p>
          </div>
          <div className="col">
            <h3>Risks</h3>
            <p style={{ marginTop: 0 }}>{active.risks}</p>
          </div>
        </div>

        <div className="single-stage"
             data-screen-label={`${active.id} · gameplay screen`}>
          <div className="stage-hd">
            <h3>
              <span className="num">▸</span>
              Active immune assault · t=04:12
            </h3>
            <div className="caption">
              two threat fronts · IL-8 spike · Founder stressed · 18s to next escalation
            </div>
          </div>
          <active.Comp />
        </div>

        {t.showNotes && (
          <div className="notes">
            <div>
              <h4>Consistent across all four</h4>
              <p>Same biology: neutrophils with multi-lobed nuclei, macrophages engulfing edge bacteria, Y-shaped antibodies, biofilm holding the NE front, surface-protein switching evading tags.</p>
              <p>Same plasmid: 4/6 slots used · BioFilm · SurfaceSwitch · ComplementInh · with CapsuleB queued in the tray.</p>
              <p>Same crisis moment: neutrophil swarm + macrophage pair, antibody-α confirmed, IL-8 spiking — next wave masked behind a "?" telegraph.</p>
            </div>
            <div>
              <h4>What this direction tries</h4>
              {active.id === 'A' && (
                <>
                  <p>"The dish IS the screen." All UI is diegetic — the tissue itself telegraphs incoming danger via cytokine wash from the direction the next wave will come.</p>
                  <p>Closest to a real-time strategy / Plague Inc lineage. Hand-feel of the plasmid is preserved by keeping it always visible, just small.</p>
                </>
              )}
              {active.id === 'B' && (
                <>
                  <p>Permanently visible split between execution layer (left) and strategy layer (right). Cytokine strip is the bridge — a live signal pipe.</p>
                  <p>Between escalations the eye moves right. During escalations it moves left. The split itself teaches the loop.</p>
                </>
              )}
              {active.id === 'C' && (
                <>
                  <p>Zooms way out — you see the whole infection at once, not one tissue tile. Multiple plasmid configurations running in parallel, one per cluster.</p>
                  <p>Best framing for the late-game triage problem the brief described: "you cannot counter everything, you have to decide which threat to absorb."</p>
                </>
              )}
              {active.id === 'D' && (
                <>
                  <p>Pushes hardest on the BioRender / Nature-figure aesthetic the brief asked for. Annotations are the UI. Real-time numbers appear as escalation report updates, not HUD bars.</p>
                  <p>Educational ceiling is highest here — every readout looks like the thing it would be in a real lab.</p>
                </>
              )}
            </div>
            <div>
              <h4>Open questions</h4>
              <p>Hover-preview the plasmid swap's effect on the tissue before commit?</p>
              <p>Wave indicator: time-to-next as countdown, or as "threat pressure" gauge?</p>
              <p>Instruments: passive (auto-run on idle samples) or active (require manual drag)?</p>
              <p>Founder Cell death = game over, or "promote new founder from healthiest descendant"?</p>
            </div>
          </div>
        )}
      </section>

      <TweaksPanel title="Wireframe controls">
        <TweakSection label="Variation" />
        <TweakRadio
          label="Active"
          value={t.tab}
          options={['A', 'B', 'C', 'D']}
          onChange={(v) => setTweak('tab', v)}
        />
        <TweakSection label="View" />
        <TweakToggle label="Annotations" value={t.showAnnotations}
                     onChange={(v) => setTweak('showAnnotations', v)} />
        <TweakToggle label="Design notes" value={t.showNotes}
                     onChange={(v) => setTweak('showNotes', v)} />
        <TweakToggle label="Dark page" value={t.darkPage}
                     onChange={(v) => setTweak('darkPage', v)} />
      </TweaksPanel>
    </>
  );
}

// Inject helper styles for the single-stage wrapper
const _styleNode = document.createElement('style');
_styleNode.textContent = `
  body.no-anno .anno, body.no-anno .anno-arrow { display: none !important; }
  .single-stage { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
  .single-stage .stage-hd { display: flex; align-items: baseline; justify-content: space-between;
                            border-bottom: 1.5px dashed var(--ink-3); padding-bottom: 4px; }
  .single-stage .stage-hd h3 { font-family:"Kalam"; font-weight:700; font-size:20px; margin:0; }
  .single-stage .stage-hd .num { display:inline-block; border:1.5px solid var(--rule); border-radius:6px;
                                 padding:0 7px; font-size:14px; margin-right:8px; background:#fff; }
  .single-stage .stage-hd .caption { font-size: 14px; color: var(--ink-3); }
  .stage.variation { margin: 0 auto; }
`;
document.head.appendChild(_styleNode);

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
