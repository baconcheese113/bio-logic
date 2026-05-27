<script lang="ts">
  import {
    cards,
    createInitialGameState,
    instruments,
    partLibrary,
    phases,
    roleProfiles,
    type CellState,
    type DesignedPlasmid,
    type GameState,
    type PartId,
    type PendingPlay,
    type RoleId,
    type TileState,
  } from './game-data';

  type PanelMode = 'inspect' | 'plasmid' | 'instruments';

  const actionLimit = 3;
  let game: GameState = $state(createInitialGameState());
  let panelMode: PanelMode = $state('inspect');

  const activeRole = $derived(roleProfiles.find((role) => role.id === game.activeRole) ?? roleProfiles[0]);
  const selectedTile = $derived(game.tiles.find((tile) => tile.id === game.selectedTileId) ?? game.tiles[0]);
  const selectedCard = $derived(cards.find((card) => card.id === game.selectedCardId) ?? cards[0]);
  const selectedInstrument = $derived(instruments.find((instrument) => instrument.id === game.selectedInstrumentId) ?? instruments[0]);
  const selectedParts = $derived(partLibrary.filter((part) => game.selectedParts.includes(part.id)));
  const selectedTileCells = $derived(game.cells.filter((cell) => cell.x === selectedTile.x && cell.y === selectedTile.y));
  const activeCards = $derived(cards.filter((card) => card.role === game.activeRole));
  const currentPhase = $derived.by(() => {
    const phase = phases.toReversed().find((item) => game.organDamage >= item.threshold);
    return phase ?? phases[0];
  });
  const visibleTumorCount = $derived(game.cells.filter((cell) => cell.kind === 'tumor' && !cell.hidden).length);
  const hiddenTumorCount = $derived(game.cells.filter((cell) => cell.kind === 'tumor' && cell.hidden).length);
  const remissionScore = $derived(Math.max(0, 8 - game.cells.filter((cell) => cell.kind === 'tumor').length * 2 - game.autoimmuneDamage));
  const outcome = $derived.by(() => {
    if (game.organDamage >= 12) return 'Organ failure: pathology wins this scenario.';
    if (remissionScore >= 6 && game.cells.filter((cell) => cell.kind === 'tumor').length <= 1) return 'Sustained remission: immune wins this scenario.';
    return 'Match unresolved: telegraphed plays can still tip the board.';
  });
  const plasmidBehavior = $derived.by(() => describePlasmid(game.selectedParts));

  function selectTile(tile: TileState) {
    game.selectedTileId = tile.id;
  }

  function spendAction(): boolean {
    if (game.actionsRemaining <= 0) {
      game.log.unshift('No actions remaining. End the turn to resolve charged plays.');
      return false;
    }

    game.actionsRemaining -= 1;
    return true;
  }

  function commitSelectedCard() {
    if (!spendAction()) return;

    const pendingPlay: PendingPlay = {
      id: Date.now(),
      role: game.activeRole,
      cardId: selectedCard.id,
      name: selectedCard.name,
      targetTileId: selectedTile.id,
      remainingTurns: selectedCard.charge,
      result: selectedCard.text,
    };

    game.pending.push(pendingPlay);
    adjustResource(game.activeRole, -selectedCard.cost);
    game.log.unshift(`${activeRole.name} committed ${selectedCard.name}; opponent can see ${selectedCard.tag.toLowerCase()} charging.`);
  }

  function runSelectedInstrument() {
    if (!spendAction()) return;

    const pendingRun: PendingPlay = {
      id: Date.now(),
      role: game.activeRole,
      instrumentId: selectedInstrument.id,
      name: selectedInstrument.name,
      targetTileId: selectedTile.id,
      remainingTurns: selectedInstrument.turns,
      result: `${selectedInstrument.output} Input: ${selectedInstrument.input}.`,
    };

    game.pending.push(pendingRun);
    game.log.unshift(`${activeRole.name} loaded ${selectedInstrument.name}; results will arrive in ${selectedInstrument.turns} turn(s).`);
  }

  function togglePart(partId: PartId) {
    if (game.selectedParts.includes(partId)) {
      game.selectedParts = game.selectedParts.filter((id) => id !== partId);
      return;
    }

    if (game.selectedParts.length >= 7) {
      game.log.unshift('Plasmids stay readable at 3-7 parts; remove a part before adding more.');
      return;
    }

    game.selectedParts = [...game.selectedParts, partId];
  }

  function savePlasmid() {
    if (!spendAction()) return;

    const plasmid: DesignedPlasmid = {
      id: `plasmid-${Date.now()}`,
      name: `${activeRole.name} construct ${game.plasmids.length + 1}`,
      parts: [...game.selectedParts],
      behavior: plasmidBehavior,
    };

    game.plasmids.push(plasmid);
    const target = firstCellForRole(game.activeRole);
    if (target) {
      target.plasmid = plasmid.name;
      target.expression = 2;
    }
    game.log.unshift(`${plasmid.name} saved and queued for expression: ${plasmid.behavior}`);
  }

  function endTurn() {
    resolvePending();
    moveCells();
    game.activeRole = game.activeRole === 'immune' ? 'pathology' : 'immune';
    game.actionsRemaining = actionLimit;
    if (game.activeRole === 'immune') game.turn += 1;
    game.pathologyResource += game.organDamage >= 7 ? 2 : 1;
    game.immuneResource += visibleTumorCount > 0 ? 2 : 1;
    game.log.unshift(`Turn passes to ${game.activeRole === 'immune' ? 'Immune' : 'Pathology'} during ${currentPhase.name.toLowerCase()} phase.`);
  }

  function resetPrototype() {
    game = createInitialGameState();
    panelMode = 'inspect';
  }

  function resolvePending() {
    const resolved: PendingPlay[] = [];
    for (const play of game.pending) {
      play.remainingTurns -= 1;
      if (play.remainingTurns <= 0) resolved.push(play);
    }

    game.pending = game.pending.filter((play) => play.remainingTurns > 0);
    for (const play of resolved) {
      applyPlay(play);
    }
  }

  function applyPlay(play: PendingPlay) {
    if (play.cardId === 'antigen-scan' || play.instrumentId === 'microscope' || play.instrumentId === 'flow-cytometer') {
      if (game.decoyShield) {
        game.decoyShield = false;
        game.log.unshift('Antigen decoy absorbed a detection result.');
        return;
      }

      revealNear(play.targetTileId, play.instrumentId === 'flow-cytometer' ? 2 : 1);
      game.immuneResource += 1;
      game.log.unshift(`${play.name} resolved: tumor markers revealed around the sampled tile.`);
      return;
    }

    if (play.cardId === 'cytotoxic-burst') {
      const before = game.cells.length;
      game.cells = game.cells.filter((cell) => !(cell.kind === 'tumor' && !cell.hidden && distanceToTile(cell, play.targetTileId) <= 1));
      game.autoimmuneDamage += 1;
      game.log.unshift(`Cytotoxic burst cleared ${before - game.cells.length} tumor cell(s), with collateral tissue damage.`);
      return;
    }

    if (play.cardId === 'recruit-t-cells') {
      game.cells.push({ id: `t-cell-${Date.now()}`, kind: 't-cell', role: 'immune', x: 1, y: 1, hidden: false, plasmid: 'fresh patrol plasmid', expression: 1 });
      game.immuneResource += 2;
      game.log.unshift('Lymph node recruited a new T cell patrol.');
      return;
    }

    if (play.cardId === 'angiogenesis') {
      game.organDamage += 2;
      game.pathologyResource += 1;
      damageTile(play.targetTileId, 1);
      game.log.unshift('Angiogenesis raised vessel access and organ damage.');
      return;
    }

    if (play.cardId === 'immune-decoy') {
      game.decoyShield = true;
      for (const cell of game.cells) {
        if (cell.kind === 'tumor' && distanceToTile(cell, play.targetTileId) <= 1) cell.hidden = true;
      }
      game.log.unshift('Antigen decoy hid local pathology markers.');
      return;
    }

    if (play.cardId === 'matrix-breakdown') {
      const tile = game.tiles.find((item) => item.id === play.targetTileId);
      if (tile) game.cells.push({ id: `tumor-${Date.now()}`, kind: 'tumor', role: 'pathology', x: tile.x, y: tile.y, hidden: true });
      game.organDamage += 1;
      game.log.unshift('Matrix breakdown seeded a new hidden tumor cell.');
      return;
    }

    if (play.instrumentId === 'pcr' || play.instrumentId === 'elisa') {
      game.log.unshift(`${play.name} result: ${play.result}`);
    }
  }

  function revealNear(tileId: string, range: number) {
    for (const tile of game.tiles) {
      if (tileDistance(tile, tileId) <= range) tile.visible = true;
    }

    for (const cell of game.cells) {
      if (cell.kind === 'tumor' && distanceToTile(cell, tileId) <= range) cell.hidden = false;
    }
  }

  function moveCells() {
    for (const cell of game.cells) {
      if (cell.role === 'immune' && visibleTumorCount > 0) {
        const target = game.cells.find((item) => item.kind === 'tumor' && !item.hidden);
        if (target) stepToward(cell, target.x, target.y);
      }

      if (cell.kind === 'tumor' && cell.plasmid?.toLowerCase().includes('stealth')) {
        cell.hidden = true;
      }

      if (cell.expression && cell.expression > 0) cell.expression -= 1;
    }
  }

  function stepToward(cell: CellState, x: number, y: number) {
    cell.x += Math.sign(x - cell.x);
    cell.y += Math.sign(y - cell.y);
  }

  function adjustResource(role: RoleId, amount: number) {
    if (role === 'immune') {
      game.immuneResource = Math.max(0, game.immuneResource + amount);
      return;
    }

    game.pathologyResource = Math.max(0, game.pathologyResource + amount);
  }

  function firstCellForRole(role: RoleId): CellState | undefined {
    return game.cells.find((cell) => cell.role === role);
  }

  function damageTile(tileId: string, amount: number) {
    const tile = game.tiles.find((item) => item.id === tileId);
    if (tile) tile.damage += amount;
  }

  function distanceToTile(cell: CellState, tileId: string): number {
    const tile = game.tiles.find((item) => item.id === tileId);
    if (!tile) return Number.POSITIVE_INFINITY;
    return Math.max(Math.abs(cell.x - tile.x), Math.abs(cell.y - tile.y));
  }

  function tileDistance(tile: TileState, targetTileId: string): number {
    const target = game.tiles.find((item) => item.id === targetTileId);
    if (!target) return Number.POSITIVE_INFINITY;
    return Math.max(Math.abs(tile.x - target.x), Math.abs(tile.y - target.y));
  }

  function describePlasmid(partIds: PartId[]): string {
    const parts = partLibrary.filter((part) => partIds.includes(part.id));
    const hasHypoxia = parts.some((part) => part.id === 'hypoxia-promoter');
    const hasSilencer = parts.some((part) => part.id === 'cd47-silencer');
    const hasSignal = parts.some((part) => part.id === 'il2-signal');
    const hasTag = parts.some((part) => part.id === 'degradation-tag');

    if (hasHypoxia && hasSilencer) return 'In low oxygen, cells expose eat-me signals so macrophages can clear them.';
    if (hasSignal && hasTag) return 'Briefly emits IL-2 to pull T cells into a suspicious tile.';
    if (hasSignal) return 'Produces a local recruitment signal that attracts immune cells.';
    if (hasSilencer) return 'Reduces CD47-like evasion, making the expressing cell easier to remove.';
    return 'Functional baseline expression, but no specialist behavior yet.';
  }
</script>

<svelte:head>
  <title>Cytosis Prototype</title>
</svelte:head>

<main class="cytosis-shell">
  <header class="cytosis-topbar">
    <div>
      <p class="eyebrow">Cytosis digital paper prototype</p>
      <h1>Tumor vs Immune</h1>
    </div>
    <div class="turn-strip" aria-label="Turn state">
      <span>Turn {game.turn}</span>
      <strong style={`--role-color: ${activeRole.color}`}>{activeRole.name}</strong>
      <span>{game.actionsRemaining}/{actionLimit} actions</span>
    </div>
    <button class="icon-button" type="button" aria-label="Reset prototype" title="Reset prototype" onclick={resetPrototype}>R</button>
  </header>

  <section class="status-band" aria-label="Scenario status">
    <div>
      <span>Phase</span>
      <strong>{currentPhase.name}</strong>
    </div>
    <div>
      <span>Organ damage</span>
      <meter min="0" max="12" value={game.organDamage}></meter>
      <strong>{game.organDamage}/12</strong>
    </div>
    <div>
      <span>Autoimmune damage</span>
      <meter min="0" max="6" value={game.autoimmuneDamage}></meter>
      <strong>{game.autoimmuneDamage}/6</strong>
    </div>
    <div>
      <span>Detected / hidden tumor</span>
      <strong>{visibleTumorCount} / {hiddenTumorCount}</strong>
    </div>
    <div>
      <span>Current read</span>
      <strong>{outcome}</strong>
    </div>
  </section>

  <div class="play-layout">
    <section class="board-region" aria-label="Tissue board">
      <div class="board-tools">
        <div>
          <p class="eyebrow">Shared tissue grid</p>
          <h2>Telegraphed plays resolve between turns</h2>
        </div>
        <button class="btn-primary" type="button" onclick={endTurn}>End turn / resolve</button>
      </div>

      <div class="hex-board" style="--columns: 11">
        {#each game.tiles as tile (tile.id)}
          {@const tileCells = game.cells.filter((cell) => cell.x === tile.x && cell.y === tile.y)}
          {@const pendingHere = game.pending.filter((play) => play.targetTileId === tile.id)}
          <button
            class:selected={tile.id === game.selectedTileId}
            class={`hex-tile zone-${tile.zone}`}
            type="button"
            aria-label={`${tile.zone} tile ${tile.x}, ${tile.y}`}
            title={`${tile.zone}; oxygen ${tile.oxygen}; damage ${tile.damage}`}
            onclick={() => selectTile(tile)}
          >
            <span class="tile-fog" class:hidden={tile.visible}></span>
            <span class="tile-label">{tile.zone}</span>
            <span class="cell-stack">
              {#each tileCells as cell (cell.id)}
                {#if !cell.hidden || cell.role !== 'pathology' || tile.visible}
                  <span class={`cell-dot cell-${cell.kind}`} title={cell.plasmid ?? cell.kind}></span>
                {/if}
              {/each}
            </span>
            {#each pendingHere as play (play.id)}
              <span class="charge-chip" title={play.result}>{play.remainingTurns}</span>
            {/each}
          </button>
        {/each}
      </div>
    </section>

    <aside class="control-panel" aria-label="Command panel">
      <div class="role-card" style={`--role-color: ${activeRole.color}`}>
        <span>{activeRole.resourceName}</span>
        <strong>{game.activeRole === 'immune' ? game.immuneResource : game.pathologyResource}</strong>
        <p>{activeRole.objective}</p>
      </div>

      <div class="tabs" role="tablist" aria-label="Command modes">
        <button class:active={panelMode === 'inspect'} type="button" onclick={() => panelMode = 'inspect'}>Inspect</button>
        <button class:active={panelMode === 'instruments'} type="button" onclick={() => panelMode = 'instruments'}>Instruments</button>
        <button class:active={panelMode === 'plasmid'} type="button" onclick={() => panelMode = 'plasmid'}>Plasmid</button>
      </div>

      {#if panelMode === 'inspect'}
        <section class="panel-section">
          <h3>Selected tile</h3>
          <dl class="tile-readout">
            <div><dt>Zone</dt><dd>{selectedTile.zone}</dd></div>
            <div><dt>Oxygen</dt><dd>{selectedTile.oxygen}/10</dd></div>
            <div><dt>Damage</dt><dd>{selectedTile.damage}</dd></div>
            <div><dt>Visible</dt><dd>{selectedTile.visible ? 'yes' : 'fogged'}</dd></div>
          </dl>

          <div class="entity-list">
            {#each selectedTileCells as cell (cell.id)}
              <article class="entity-row">
                <span class={`cell-dot cell-${cell.kind}`}></span>
                <div>
                  <strong>{cell.kind}</strong>
                  <p>{cell.hidden ? 'hidden marker state' : cell.plasmid ?? 'baseline behavior'}</p>
                </div>
              </article>
            {:else}
              <p class="empty-text">No cells on this tile.</p>
            {/each}
          </div>
        </section>

        <section class="panel-section">
          <h3>Action cards</h3>
          <div class="card-list">
            {#each activeCards as card (card.id)}
              <button class:active={game.selectedCardId === card.id} type="button" title={card.text} onclick={() => game.selectedCardId = card.id}>
                <span>{card.tag}</span>
                <strong>{card.name}</strong>
                <small>{card.charge} turn charge</small>
              </button>
            {/each}
          </div>
          <button class="btn-primary full-width" type="button" onclick={commitSelectedCard}>Commit {selectedCard.name}</button>
        </section>
      {:else if panelMode === 'instruments'}
        <section class="panel-section">
          <h3>Instrument bench</h3>
          <div class="instrument-grid">
            {#each instruments as instrument (instrument.id)}
              <button class:active={game.selectedInstrumentId === instrument.id} type="button" title={instrument.output} onclick={() => game.selectedInstrumentId = instrument.id}>
                <strong>{instrument.name}</strong>
                <span>{instrument.turns} turn run</span>
                <small>{instrument.input}</small>
              </button>
            {/each}
          </div>
          <button class="btn-primary full-width" type="button" onclick={runSelectedInstrument}>Run {selectedInstrument.name}</button>
        </section>

        <section class="panel-section">
          <h3>Pending queue</h3>
          {#each game.pending as play (play.id)}
            <article class="queue-row">
              <strong>{play.name}</strong>
              <span>{play.remainingTurns} turn(s)</span>
              <p>{play.result}</p>
            </article>
          {:else}
            <p class="empty-text">No visible commitments are charging.</p>
          {/each}
        </section>
      {:else}
        <section class="panel-section">
          <h3>Parts library</h3>
          <div class="parts-list">
            {#each partLibrary as part (part.id)}
              <button class:active={game.selectedParts.includes(part.id)} type="button" title={part.text} onclick={() => togglePart(part.id)}>
                <span>{part.type}</span>
                <strong>{part.name}</strong>
              </button>
            {/each}
          </div>
        </section>

        <section class="plasmid-preview">
          <h3>Construct preview</h3>
          <div class="dna-line" aria-label="Selected plasmid parts">
            {#each selectedParts as part (part.id)}
              <span class={`part-token part-${part.type}`}>{part.name}</span>
            {/each}
          </div>
          <p>{plasmidBehavior}</p>
          <button class="btn-primary full-width" type="button" onclick={savePlasmid}>Save and deploy</button>
        </section>
      {/if}
    </aside>
  </div>

  <footer class="hand-row" aria-label="Recent log and saved plasmids">
    <section>
      <h2>Match log</h2>
      <ol>
        {#each game.log.slice(0, 4) as line, index (`${index}-${line}`)}
          <li>{line}</li>
        {/each}
      </ol>
    </section>
    <section>
      <h2>Designed plasmids</h2>
      <div class="saved-plasmids">
        {#each game.plasmids as plasmid (plasmid.id)}
          <article>
            <strong>{plasmid.name}</strong>
            <p>{plasmid.behavior}</p>
          </article>
        {/each}
      </div>
    </section>
  </footer>
</main>
