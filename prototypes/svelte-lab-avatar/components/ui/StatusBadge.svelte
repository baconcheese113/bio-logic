<!--
  StatusBadge — maps a status string to a styled badge.
  Pass a `variant` for preset colors, or `bg`/`color` overrides for custom colors.
-->
<script lang="ts">
  type Variant = 'idle' | 'busy' | 'ready' | 'error';

  interface Props {
    label: string;
    variant?: Variant;
    bg?: string;
    color?: string;
  }

  let { label, variant, bg, color }: Props = $props();

  const VARIANT_STYLES: Record<Variant, { bg: string; color: string }> = {
    idle:  { bg: 'var(--status-idle)',  color: 'white' },
    busy:  { bg: 'var(--status-busy)',  color: 'var(--bg-darkest)' },
    ready: { bg: 'var(--status-ready)', color: 'white' },
    error: { bg: 'var(--status-error)', color: 'white' },
  };

  let computed = $derived(() => {
    if (bg) return { bg, color: color ?? 'white' };
    if (variant) return VARIANT_STYLES[variant];
    return { bg: 'var(--bg-medium)', color: 'var(--parchment-aged)' };
  });
</script>

<span
  class="badge"
  style:background={computed().bg}
  style:color={computed().color}
>
  {label}
</span>
