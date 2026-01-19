<script lang="ts">
  import { onMount } from 'svelte';

  let { testType = null, result = 'negative' } = $props<{
    testType: string | null;
    result: 'positive' | 'negative';
  }>();

  let canvas: HTMLCanvasElement;

  onMount(() => {
    drawAgglutination();
  });

  $effect(() => {
    // Redraw when testType or result changes
    if (canvas) {
      drawAgglutination();
    }
  });

  function drawAgglutination() {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw slide background
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw slide border
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    if (!testType) {
      // No test selected - show empty slide
      ctx.fillStyle = '#666';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Select a test to begin', canvas.width / 2, canvas.height / 2);
      return;
    }

    // Draw particles
    const particleCount = 80;
    const particleRadius = 3;

    if (result === 'positive') {
      // Clustered particles (agglutination)
      const clusterCount = 8;
      const clusters: Array<{ x: number; y: number }> = [];

      // Generate cluster centers
      for (let i = 0; i < clusterCount; i++) {
        clusters.push({
          x: 50 + Math.random() * (canvas.width - 100),
          y: 50 + Math.random() * (canvas.height - 100),
        });
      }

      // Draw particles clustered around centers
      ctx.fillStyle = '#d32f2f';
      for (let i = 0; i < particleCount; i++) {
        const cluster = clusters[Math.floor(Math.random() * clusterCount)];
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 25; // Cluster radius
        const x = cluster.x + Math.cos(angle) * distance;
        const y = cluster.y + Math.sin(angle) * distance;

        ctx.beginPath();
        ctx.arc(x, y, particleRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Add "clumped" label
      ctx.fillStyle = '#d32f2f';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AGGLUTINATION POSITIVE', canvas.width / 2, 30);

    } else {
      // Evenly distributed particles (no agglutination)
      ctx.fillStyle = '#757575';
      for (let i = 0; i < particleCount; i++) {
        const x = 30 + Math.random() * (canvas.width - 60);
        const y = 30 + Math.random() * (canvas.height - 60);

        ctx.beginPath();
        ctx.arc(x, y, particleRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Add "smooth" label
      ctx.fillStyle = '#666';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NO AGGLUTINATION', canvas.width / 2, 30);
    }
  }
</script>

<div class="slide-container">
  <canvas bind:this={canvas} width="500" height="350"></canvas>
</div>

<style>
  .slide-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: #1a1a1a;
    padding: 2rem;
  }

  canvas {
    border: 3px solid #4a4a4a;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  }
</style>
