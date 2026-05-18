<script lang="ts">
  import type { GameOverState } from '../lib/simulation-engine';

  interface Props {
    gameOver: GameOverState;
    elapsedSeconds: number;
    wave: number;
    onRetry: () => void;
  }

  let { gameOver, elapsedSeconds, wave, onRetry }: Props = $props();
  const minutes = $derived(Math.floor(elapsedSeconds / 60));
  const seconds = $derived(Math.floor(elapsedSeconds % 60).toString().padStart(2, '0'));
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-labelledby="game-over-title">
  <section class:win={gameOver.kind === 'win'} class="modal">
    <h2 id="game-over-title">{gameOver.title}</h2>
    <div class="stats">
      <span>time survived {minutes}:{seconds}</span>
      <span>wave reached {wave}</span>
    </div>
    <p>{gameOver.detail}</p>
    <p class="suggestion">{gameOver.suggestion}</p>
    <button type="button" onclick={onRetry}>{gameOver.kind === 'win' ? 'Run again' : 'Retry'}</button>
  </section>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 20px;
    background: rgba(12, 8, 6, 0.78);
    z-index: 20;
  }

  .modal {
    width: min(520px, 100%);
    display: grid;
    gap: 14px;
    padding: 22px;
    background: #fffbf0;
    color: #1f1d18;
    border: 2px solid #2a261c;
    border-radius: 10px;
    box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.24);
  }

  h2 {
    margin: 0;
    color: #9b3523;
    font-size: 24px;
  }

  .win h2 {
    color: #2f6b3f;
  }

  .stats {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    color: #6f6553;
    font-family: var(--font-mono);
    font-size: 14px;
  }

  p {
    margin: 0;
    font-size: 17px;
    line-height: 1.35;
  }

  .suggestion {
    padding: 10px 12px;
    border-left: 4px solid #3a8c4d;
    background: #edf4e8;
    font-weight: 700;
  }

  button {
    justify-self: start;
    min-height: 40px;
    padding: 8px 18px;
    border: 1px solid #2a261c;
    border-radius: 6px;
    background: #2f5137;
    color: #fff8e8;
    font-size: 15px;
  }
</style>
