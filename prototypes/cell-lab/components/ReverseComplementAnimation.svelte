<script lang="ts">
  interface Props {
    sequence: string;
    oncomplete: () => void;
  }

  let { sequence, oncomplete }: Props = $props();

  const COMPLEMENT: Record<string, string> = { A: 'T', T: 'A', C: 'G', G: 'C' };
  const CELL_W = 11;
  const ROW_H = 26;  // 22px line-height + 4px padding
  const BOND_H = 8;

  const bases = $derived(sequence.split(''));
  const n = $derived(bases.length);
  const reversedBases = $derived([...bases].reverse());
  const complementBases = $derived(reversedBases.map(b => COMPLEMENT[b] ?? b));
  const bondTypes = $derived(reversedBases.map(b => (b === 'G' || b === 'C') ? 'gc' : 'at'));
  const swingCenter = $derived((n - 1) / 2);

  // Phase: 0=show, 1=swing, 2=complement reveal, 3=dsDNA pair, 4=merge, 5=done
  let phase = $state(0);
  let swingT = $state(0);
  let compRevealCount = $state(0);
  let mergeT = $state(0);

  // Labels for main strand: 5'/3' before swing, 3'/5' after (reversed)
  const mainLeftLabel = $derived(phase >= 2 ? '3′' : '5′');
  const mainRightLabel = $derived(phase >= 2 ? '5′' : '3′');

  function easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  $effect(() => {
    let cancelled = false;
    let rafId: number | undefined;
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Phase 0: brief pause (300ms)
    timers.push(setTimeout(() => {
      if (cancelled) return;
      phase = 1;

      // Phase 1: orbital swing (500ms) — only bases orbit
      const dur = 500;
      const start = performance.now();
      function swingTick(now: number) {
        if (cancelled) return;
        const raw = Math.min((now - start) / dur, 1);
        swingT = easeInOut(raw);
        if (raw < 1) {
          rafId = requestAnimationFrame(swingTick);
        } else {
          swingT = 1;
          timers.push(setTimeout(() => {
            if (cancelled) return;
            phase = 2;

            // Phase 2: reveal complement bases one by one (60ms each)
            let ci = 0;
            intervalId = setInterval(() => {
              if (cancelled) { clearInterval(intervalId); return; }
              ci++;
              compRevealCount = ci;
              if (ci >= n) {
                clearInterval(intervalId);
                intervalId = undefined;
                timers.push(setTimeout(() => {
                  if (cancelled) return;
                  phase = 3;

                  // Phase 3: hold dsDNA pairing (500ms)
                  timers.push(setTimeout(() => {
                    if (cancelled) return;
                    phase = 4;

                    // Phase 4: merge — complement slides up, main fades (400ms)
                    const mDur = 400;
                    const mStart = performance.now();
                    function mergeTick(now: number) {
                      if (cancelled) return;
                      const raw = Math.min((now - mStart) / mDur, 1);
                      mergeT = easeInOut(raw);
                      if (raw < 1) {
                        rafId = requestAnimationFrame(mergeTick);
                      } else {
                        mergeT = 1;
                        phase = 5;
                        timers.push(setTimeout(() => {
                          if (!cancelled) oncomplete();
                        }, 200));
                      }
                    }
                    rafId = requestAnimationFrame(mergeTick);
                  }, 500));
                }, 200));
              }
            }, 60);
          }, 200));
        }
      }
      rafId = requestAnimationFrame(swingTick);
    }, 300));

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      if (rafId !== undefined) cancelAnimationFrame(rafId);
      if (intervalId !== undefined) clearInterval(intervalId);
    };
  });
</script>

<div class="rc-inplace">
  <!-- Complement strand: appears ABOVE main, slides down during merge -->
  {#if phase >= 2 && phase <= 4}
    <div class="rc-strand rc-comp"
      style:top="{Math.round(-(ROW_H + BOND_H) * (1 - mergeT))}px"
    >
      <span class="rc-label rc-left">5′</span>
      <span class="rc-label rc-right">3′</span>
      {#each complementBases as base, i}
        <span class="rc-cell"
          class:revealed={i < compRevealCount}
          class:latest={phase === 2 && i === compRevealCount - 1}
        >{i < compRevealCount ? base : '\u00A0'}</span>
      {/each}
    </div>
  {/if}

  <!-- Bond indicators between paired bases (phases 2–4) -->
  {#if phase >= 2 && phase < 5}
    <div class="rc-bonds"
      style:opacity={phase >= 4 ? Math.max(0, 1 - mergeT * 2) : 1}
    >
      {#each reversedBases as _, i}
        <span class="rc-bond {bondTypes[i]}" class:active={i < compRevealCount}></span>
      {/each}
    </div>
  {/if}

  <!-- Main strand: bases swing from original order to reversed -->
  <div class="rc-strand rc-main"
    class:paired={phase >= 2 && phase < 5}
    style:opacity={phase >= 4 ? Math.max(0, 1 - mergeT * 2) : 1}
  >
    <span class="rc-label rc-left">{mainLeftLabel}</span>
    <span class="rc-label rc-right">{mainRightLabel}</span>
    {#if phase <= 1}
      {#each bases as base, i}
        {@const rx = (i - swingCenter) * CELL_W}
        {@const dx = phase === 1 ? rx * (Math.cos(swingT * Math.PI) - 1) : 0}
        {@const dy = phase === 1 ? Math.abs(rx) * Math.sin(swingT * Math.PI) : 0}
        <span class="rc-cell"
          style:transform="translate({dx}px, {dy}px)"
          style:z-index={Math.round(dy + 1)}
        >{base}</span>
      {/each}
    {:else}
      {#each reversedBases as base}
        <span class="rc-cell">{base}</span>
      {/each}
    {/if}
  </div>
</div>

<style>
  .rc-inplace {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    z-index: 10;
  }

  .rc-strand {
    display: flex;
    align-items: center;
    position: relative;
    padding: 2px 0;
    background: rgba(30, 30, 30, 0.85);
    border-radius: 3px;
    white-space: nowrap;
    overflow: visible;
  }

  /* Backbone rails — inner edges of each strand during pairing */
  .rc-comp {
    position: absolute;
    left: 0;
    will-change: top;
    border-bottom: 1px solid rgba(180, 160, 130, 0.3);
  }

  .rc-main.paired {
    border-top: 1px solid rgba(180, 160, 130, 0.3);
  }

  .rc-label {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    font-family: var(--font-mono, monospace);
    font-size: 11px;
    color: var(--brass-light, #d4b896);
    opacity: 0.8;
    pointer-events: none;
    white-space: nowrap;
  }

  .rc-label.rc-left { right: 100%; margin-right: 3px; }
  .rc-label.rc-right { left: 100%; margin-left: 3px; }

  .rc-cell {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 11px;
    font-family: var(--font-mono, monospace);
    font-size: 12px;
    line-height: 22px;
    color: var(--parchment, #f5f0e6);
    will-change: transform;
    position: relative;
  }

  .rc-bonds {
    position: absolute;
    left: 0;
    top: -8px;
    display: flex;
    height: 8px;
  }

  .rc-bond {
    width: 11px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.1s;
  }

  .rc-bond.active {
    opacity: 1;
  }

  /* AT base pair — 2 hydrogen bonds (dashed, dimmer) */
  .rc-bond.at::after {
    content: '';
    width: 0;
    height: 5px;
    border-left: 1px dashed rgba(107, 189, 107, 0.45);
  }

  /* GC base pair — 3 hydrogen bonds (solid, brighter) */
  .rc-bond.gc::after {
    content: '';
    width: 0;
    height: 7px;
    border-left: 1.5px solid rgba(107, 189, 107, 0.7);
  }

  .rc-cell.revealed {
    color: #6bbd6b;
    text-shadow: 0 0 6px rgba(107, 189, 107, 0.5);
    transition: color 0.15s;
  }

  .rc-cell.latest {
    color: #8dff8d;
    text-shadow: 0 0 10px rgba(141, 255, 141, 0.7);
  }
</style>
