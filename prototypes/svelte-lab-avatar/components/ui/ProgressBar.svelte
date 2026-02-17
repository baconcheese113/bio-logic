<!--
  ProgressBar — value (0-1), optional label, optional gradient colors.
  Uses base.css progress-track/fill classes.
-->
<script lang="ts">
  interface Props {
    /** Progress value from 0 to 1 */
    value: number;
    /** Optional text label shown above the bar */
    label?: string;
    /** CSS gradient or color for the fill (defaults to brass) */
    gradient?: string;
    /** Max width constraint */
    maxWidth?: string;
  }

  let { value, label, gradient, maxWidth }: Props = $props();

  const fill = $derived(gradient ?? 'linear-gradient(90deg, var(--brass-dark), var(--brass-light))');
  const pct = $derived(`${Math.min(100, Math.max(0, value * 100))}%`);
</script>

{#if label}
  <span class="text-xs text-parchment-aged">{label}</span>
{/if}
<div class="progress-track" style:max-width={maxWidth}>
  <div class="progress-fill" style:width={pct} style:background={fill}></div>
</div>
