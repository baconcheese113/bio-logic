<script lang="ts">
  import { onMount } from 'svelte';
  import { correctOrganism, currentCase } from '../../../stores/game-state';
  import { CLINICAL_DIAGNOSES } from '../../../../data/clinical-diagnoses';
  import { CELL_TYPES } from '../../../../data/organisms';

  // Gate boundaries (player can adjust these)
  let gateX1 = $state(30);
  let gateY1 = $state(30);
  let gateX2 = $state(70);
  let gateY2 = $state(70);

  let isDragging = $state(false);
  let dragCorner: 'tl' | 'tr' | 'bl' | 'br' | null = $state(null);
  let canvas: HTMLCanvasElement;
  let cells: Array<{ x: number; y: number; population: string }> = [];

  // Gaussian (normal) distribution random number generator (Box-Muller transform)
  function gaussianRandom(mean: number, stdDev: number): number {
    let u1 = Math.random();
    let u2 = Math.random();
    let z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  // Generate outlier cells that appear far from main cluster
  function generateOutlier(): { x: number; y: number } {
    // Outliers can appear anywhere, often near debris region or edges
    const regions = [
      { x: 5, y: 5, spread: 3 },    // Near debris
      { x: 90, y: 90, spread: 5 },  // High scatter corner
      { x: 15, y: 80, spread: 4 },  // Random middle
      { x: 80, y: 15, spread: 4 },  // Random middle
    ];
    const region = regions[Math.floor(Math.random() * regions.length)];
    return {
      x: Math.max(0, Math.min(100, gaussianRandom(region.x, region.spread))),
      y: Math.max(0, Math.min(100, gaussianRandom(region.y, region.spread))),
    };
  }

  // Get flow cytometry data
  const flowData = $derived(() => {
    if ($currentCase.answerFormat === 'clinical-diagnosis') {
      const diagnosis = CLINICAL_DIAGNOSES.find(d => d.id === $currentCase.correctAnswer);
      return diagnosis?.flowCytometry;
    }
    return $correctOrganism?.flowCytometry;
  });

  export function runCytometer() {
    cells = [];
    
    const data = flowData();
    if (!data) {
      return;
    }

    // Generate cells based on populations with random variation
    const totalCells = 1000;
    data.populations.forEach((pop) => {
      const cellType = CELL_TYPES[pop.type];
      // Add ±5-10% random variation to percentages
      const variance = (Math.random() - 0.5) * 0.15; // ±7.5%
      const adjustedPercentage = Math.max(5, Math.min(95, pop.percentage * (1 + variance)));
      const count = Math.floor((adjustedPercentage / 100) * totalCells);
      const outlierCount = Math.floor(count * (cellType.outlierPercentage / 100));
      const normalCount = count - outlierCount;
      
      // Generate normal cells in tight cluster
      for (let i = 0; i < normalCount; i++) {
        const x = Math.max(0, Math.min(100, gaussianRandom(cellType.forwardScatterMean, cellType.stdDevFSC)));
        const y = Math.max(0, Math.min(100, gaussianRandom(cellType.sideScatterMean, cellType.stdDevSSC)));
        cells.push({ x, y, population: cellType.name });
      }
      
      // Generate outlier cells scattered randomly
      for (let i = 0; i < outlierCount; i++) {
        const outlier = generateOutlier();
        cells.push({ x: outlier.x, y: outlier.y, population: cellType.name });
      }
    });

    // Shuffle cells array to simulate random order of cells flowing through cytometer
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    // Render cells gradually
    let cellIndex = 0;
    const renderInterval = setInterval(() => {
      if (cellIndex < cells.length) {
        drawCells(cellIndex);
        cellIndex += 10;
      } else {
        clearInterval(renderInterval);
      }
    }, 20);
  }

  function drawCells(upTo: number) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#1a3a1a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const pos = (i / 10) * canvas.width;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(canvas.width, pos);
      ctx.stroke();
    }

    // Draw axis tick marks and labels
    ctx.fillStyle = '#6a9fb5';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    
    // X-axis (FSC) tick marks
    for (let i = 0; i <= 10; i++) {
      const value = i * 10;
      const x = (i / 10) * canvas.width;
      
      // Tick mark
      ctx.strokeStyle = '#6a9fb5';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, canvas.height - 25);
      ctx.lineTo(x, canvas.height - 20);
      ctx.stroke();
      
      // Label (only show 0, 20, 40, 60, 80, 100 to avoid clutter)
      if (i % 2 === 0 || i === 0 || i === 10) {
        ctx.fillText(value.toString(), x, canvas.height - 8);
      }
    }
    
    // Y-axis (SSC) tick marks
    ctx.textAlign = 'left';
    for (let i = 0; i <= 10; i++) {
      const value = i * 10;
      const y = canvas.height - (i / 10) * canvas.height;
      
      // Tick mark
      ctx.strokeStyle = '#6a9fb5';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(10, y);
      ctx.stroke();
      
      // Label (only show 0, 20, 40, 60, 80, 100 to avoid clutter)
      if (i % 2 === 0 || i === 0 || i === 10) {
        ctx.fillText(value.toString(), 12, y + 3);
      }
    }

    // Draw cells
    cells.slice(0, upTo).forEach(cell => {
      const x = (cell.x / 100) * canvas.width;
      const y = canvas.height - (cell.y / 100) * canvas.height;
      
      ctx.fillStyle = '#0f0';
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    // Draw gate
    drawGate(ctx);
  }

  function drawGate(ctx: CanvasRenderingContext2D) {
    const x1 = (gateX1 / 100) * canvas.width;
    const y1 = canvas.height - (gateY1 / 100) * canvas.height;
    const x2 = (gateX2 / 100) * canvas.width;
    const y2 = canvas.height - (gateY2 / 100) * canvas.height;

    ctx.strokeStyle = '#f00';
    ctx.lineWidth = 2;
    ctx.strokeRect(x1, y2, x2 - x1, y1 - y2);

    // Draw corner handles
    const handleSize = 8;
    ctx.fillStyle = '#f00';
    ctx.fillRect(x1 - handleSize / 2, y2 - handleSize / 2, handleSize, handleSize);
    ctx.fillRect(x2 - handleSize / 2, y2 - handleSize / 2, handleSize, handleSize);
    ctx.fillRect(x1 - handleSize / 2, y1 - handleSize / 2, handleSize, handleSize);
    ctx.fillRect(x2 - handleSize / 2, y1 - handleSize / 2, handleSize, handleSize);
  }

  function handleMouseDown(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / canvas.width) * 100;
    const my = 100 - ((e.clientY - rect.top) / canvas.height) * 100;

    const threshold = 3;
    if (Math.abs(mx - gateX1) < threshold && Math.abs(my - gateY1) < threshold) {
      isDragging = true;
      dragCorner = 'tl';
    } else if (Math.abs(mx - gateX2) < threshold && Math.abs(my - gateY1) < threshold) {
      isDragging = true;
      dragCorner = 'tr';
    } else if (Math.abs(mx - gateX1) < threshold && Math.abs(my - gateY2) < threshold) {
      isDragging = true;
      dragCorner = 'bl';
    } else if (Math.abs(mx - gateX2) < threshold && Math.abs(my - gateY2) < threshold) {
      isDragging = true;
      dragCorner = 'br';
    }
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDragging || !dragCorner) return;

    const rect = canvas.getBoundingClientRect();
    const mx = Math.max(0, Math.min(100, ((e.clientX - rect.left) / canvas.width) * 100));
    const my = Math.max(0, Math.min(100, 100 - ((e.clientY - rect.top) / canvas.height) * 100));

    if (dragCorner === 'tl') {
      gateX1 = mx;
      gateY1 = my;
    } else if (dragCorner === 'tr') {
      gateX2 = mx;
      gateY1 = my;
    } else if (dragCorner === 'bl') {
      gateX1 = mx;
      gateY2 = my;
    } else if (dragCorner === 'br') {
      gateX2 = mx;
      gateY2 = my;
    }

    drawCells(cells.length);
  }

  function handleMouseUp() {
    isDragging = false;
    dragCorner = null;
  }

  onMount(() => {
    if (canvas) {
      canvas.width = 600;
      canvas.height = 600;
      drawCells(0);
    }
  });

  export function getGatedPercentage(): number {
    const minX = Math.min(gateX1, gateX2);
    const maxX = Math.max(gateX1, gateX2);
    const minY = Math.min(gateY1, gateY2);
    const maxY = Math.max(gateY1, gateY2);

    const gatedCells = cells.filter(cell => 
      cell.x >= minX && cell.x <= maxX && cell.y >= minY && cell.y <= maxY
    );

    return cells.length > 0 ? (gatedCells.length / cells.length) * 100 : 0;
  }
  
  export function getGatedPopulations(): { name: string; percentage: number }[] {
    const minX = Math.min(gateX1, gateX2);
    const maxX = Math.max(gateX1, gateX2);
    const minY = Math.min(gateY1, gateY2);
    const maxY = Math.max(gateY1, gateY2);

    const gatedCells = cells.filter(cell => 
      cell.x >= minX && cell.x <= maxX && cell.y >= minY && cell.y <= maxY
    );

    // Count cells by population
    const populationCounts: Record<string, number> = {};
    gatedCells.forEach(cell => {
      populationCounts[cell.population] = (populationCounts[cell.population] || 0) + 1;
    });

    // Convert to percentages
    const total = gatedCells.length;
    return Object.entries(populationCounts)
      .map(([name, count]) => ({
        name,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .filter(pop => pop.percentage > 5) // Only include populations >5%
      .sort((a, b) => b.percentage - a.percentage); // Sort by percentage descending
  }
  
  export function getGatedMeasurements(): { count: number; percentage: number; meanFSC: number; meanSSC: number } {
    const minX = Math.min(gateX1, gateX2);
    const maxX = Math.max(gateX1, gateX2);
    const minY = Math.min(gateY1, gateY2);
    const maxY = Math.max(gateY1, gateY2);

    const gatedCells = cells.filter(cell => 
      cell.x >= minX && cell.x <= maxX && cell.y >= minY && cell.y <= maxY
    );

    const count = gatedCells.length;
    const percentage = cells.length > 0 ? (count / cells.length) * 100 : 0;
    
    // Calculate mean FSC and SSC
    const meanFSC = count > 0 
      ? Math.round(gatedCells.reduce((sum, cell) => sum + cell.x, 0) / count)
      : 0;
    const meanSSC = count > 0
      ? Math.round(gatedCells.reduce((sum, cell) => sum + cell.y, 0) / count)
      : 0;

    return { count, percentage, meanFSC, meanSSC };
  }
</script>

<div class="cytometer-container">
  <div class="screen-bezel">
    <div class="screen-label">CYTOFLUOROGRAPH 4800A</div>
    <div class="axis-labels">
      <div class="y-axis-label">Side Scatter (Granularity) →</div>
      <div class="x-axis-label">Forward Scatter (Size) →</div>
      <canvas
        bind:this={canvas}
        class="cytometer-screen"
        onmousedown={handleMouseDown}
        onmousemove={handleMouseMove}
        onmouseup={handleMouseUp}
        onmouseleave={handleMouseUp}
      ></canvas>
    </div>
  </div>
</div>

<style>
  .cytometer-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    background: linear-gradient(to bottom, #1a1a1a, #0a0a0a);
  }

  .screen-bezel {
    background: #2a2a2a;
    border: 8px solid #4a4a4a;
    border-radius: 8px;
    padding: 2rem;
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.8);
    position: relative;
  }

  .screen-label {
    position: absolute;
    top: 0.5rem;
    left: 50%;
    transform: translateX(-50%);
    font-family: 'Courier New', monospace;
    color: #888;
    font-size: 0.8rem;
    letter-spacing: 2px;
  }

  .cytometer-screen {
    display: block;
    border: 2px solid #1a1a1a;
    cursor: crosshair;
    box-shadow: inset 0 0 20px rgba(0, 255, 0, 0.1);
    pointer-events: auto;
  }

  .axis-labels {
    position: relative;
    width: 600px;
    height: 600px;
    pointer-events: none;
  }

  .x-axis-label {
    position: absolute;
    bottom: -1.5rem;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    color: #888;
    font-size: 0.9rem;
  }

  .y-axis-label {
    position: absolute;
    left: -6rem;
    top: 50%;
    transform: translateY(-50%) rotate(-90deg);
    transform-origin: center;
    color: #888;
    font-size: 0.9rem;
    white-space: nowrap;
  }
</style>
