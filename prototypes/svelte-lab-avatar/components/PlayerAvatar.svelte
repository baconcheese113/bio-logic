<script lang="ts">
  import type { Player } from '../../shared/types';
  import { SAMPLE_COLORS, CONDITION_OPACITY } from '../../shared/types';

  interface Props {
    player: Player;
    tileSize: number;
  }

  let { player, tileSize }: Props = $props();

  const facingRotation = $derived({
    up: 0,
    right: 90,
    down: 180,
    left: 270,
  }[player.facing]);

  const targetX = $derived(
    player.targetPosition ? player.targetPosition.x * tileSize : player.position.x * tileSize
  );
  const targetY = $derived(
    player.targetPosition ? player.targetPosition.y * tileSize : player.position.y * tileSize
  );
</script>

<div
  class="player-avatar"
  class:moving={player.isMoving}
  style:left="{targetX}px"
  style:top="{targetY}px"
  style:width="{tileSize}px"
  style:height="{tileSize}px"
  data-ref="player"
  aria-label="Player at position {player.position.x}, {player.position.y}"
>
  <div class="avatar-body" style:transform="rotate({facingRotation}deg)">
    <div class="avatar-icon">🧑‍🔬</div>
    <div class="avatar-direction"></div>
  </div>

  {#if player.heldSample}
    <div
      class="held-sample"
      style:background={SAMPLE_COLORS[player.heldSample.type]}
      style:opacity={CONDITION_OPACITY[player.heldSample.condition]}
      aria-label="Carrying {player.heldSample.label}"
    ></div>
  {/if}
</div>

<style>
  .player-avatar { position: absolute; display: flex; align-items: center; justify-content: center; z-index: 50; pointer-events: none; transition: left 0.3s ease, top 0.3s ease; }
  .player-avatar.moving { animation: bob 0.15s ease-in-out infinite alternate; }
  @keyframes bob { 0% { transform: translateY(0); } 100% { transform: translateY(-3px); } }

  .avatar-body { position: relative; width: 48px; height: 48px; transition: transform 0.2s ease; }
  .avatar-icon { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; font-size: 2rem; background: linear-gradient(145deg, #2a2520 0%, #1a1815 100%); border: 3px solid var(--brass); border-radius: 50%; box-shadow: 0 4px 8px rgba(0,0,0,0.5), 0 0 12px rgba(184,149,110,0.4); }
  .avatar-direction { position: absolute; top: -4px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 10px solid #ffc107; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5)); }

  .held-sample { position: absolute; bottom: -4px; right: -4px; width: 18px; height: 18px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.4); animation: glow 1s ease-in-out infinite alternate; }
  @keyframes glow { 0% { box-shadow: 0 2px 4px rgba(0,0,0,0.4); } 100% { box-shadow: 0 2px 8px rgba(255,255,255,0.3); } }
</style>
