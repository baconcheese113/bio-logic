<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    placedDisks: Array<{ antibiotic: string; x: number; y: number; zoneSize: number }>;
    bacterialLawnPrepared: boolean;
    incubationProgress: number;
    incubated: boolean;
    lawnColor: string;
  }

  let { placedDisks = [], bacterialLawnPrepared = false, incubationProgress = 0, incubated = false, lawnColor = '#d4c5a8' }: Props = $props();

  let canvas: HTMLCanvasElement;
  let rulerX = $state(50); // Ruler position
  let rulerY = $state(100);
  let isDraggingRuler = $state(false);
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  function getMousePos(event: MouseEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  function isOverRuler(x: number, y: number): boolean {
    const rulerLength = 100;
    const rulerHeight = 40;
    return x >= rulerX - 5 && x <= rulerX + rulerLength + 5 &&
           y >= rulerY - 15 && y <= rulerY + rulerHeight - 15;
  }

  function handleMouseDown(event: MouseEvent) {
    if (!incubated) return;
    const pos = getMousePos(event);
    
    if (isOverRuler(pos.x, pos.y)) {
      isDraggingRuler = true;
      dragOffsetX = pos.x - rulerX;
      dragOffsetY = pos.y - rulerY;
      canvas.style.cursor = 'grabbing';
    }
  }

  function handleMouseMove(event: MouseEvent) {
    const pos = getMousePos(event);
    
    if (isDraggingRuler) {
      rulerX = pos.x - dragOffsetX;
      rulerY = pos.y - dragOffsetY;
      draw();
    } else if (incubated && isOverRuler(pos.x, pos.y)) {
      canvas.style.cursor = 'grab';
    } else {
      canvas.style.cursor = 'default';
    }
  }

  function handleMouseUp() {
    if (isDraggingRuler) {
      isDraggingRuler = false;
      canvas.style.cursor = 'grab';
    }
  }

  function draw() {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw petri dish
    const centerX = 250;
    const centerY = 200;
    const dishRadius = 180;

    // Dish background (agar)
    ctx.fillStyle = '#e8d9c0';
    ctx.beginPath();
    ctx.arc(centerX, centerY, dishRadius, 0, Math.PI * 2);
    ctx.fill();

    // Dish border
    ctx.strokeStyle = '#a0a0a0';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw bacterial lawn if prepared
    if (bacterialLawnPrepared || incubationProgress > 0 || incubated) {
      ctx.fillStyle = lawnColor; // Use organism's colony color
      ctx.beginPath();
      ctx.arc(centerX, centerY, dishRadius - 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw zones of inhibition (growing during incubation)
    if (incubationProgress > 0 || incubated) {
      for (const disk of placedDisks) {
        if (disk.zoneSize > 6) { // Only draw zone if larger than disk
          // Calculate current zone size based on incubation progress
          const currentZoneSize = incubated 
            ? disk.zoneSize 
            : 6 + ((disk.zoneSize - 6) * (incubationProgress / 100));
          
          ctx.fillStyle = '#e8d9c0'; // Clear zone (same as agar)
          ctx.beginPath();
          // Zone size is diameter in mm, convert to pixels (2px per mm)
          const zoneRadiusPx = (currentZoneSize / 2) * 2;
          ctx.arc(disk.x, disk.y, zoneRadiusPx, 0, Math.PI * 2);
          ctx.fill();

          // Subtle zone border
          ctx.strokeStyle = 'rgba(160, 160, 160, 0.3)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    // Draw antibiotic disks
    for (const disk of placedDisks) {
      // White paper disk
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(disk.x, disk.y, 6, 0, Math.PI * 2); // 6mm diameter disks
      ctx.fill();

      // Disk border
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Antibiotic label
      ctx.fillStyle = '#000000';
      ctx.font = '9px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = disk.antibiotic.substring(0, 3).toUpperCase();
      ctx.fillText(label, disk.x, disk.y);
    }

    // Messages based on workflow state
    if (!bacterialLawnPrepared) {
      ctx.fillStyle = '#888888';
      ctx.font = '14px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText('Prepare bacterial lawn first', centerX, centerY);
    } else if (bacterialLawnPrepared && placedDisks.length === 0) {
      ctx.fillStyle = '#888888';
      ctx.font = '14px Georgia';
      ctx.textAlign = 'center';
      ctx.fillText('Place antibiotic disks on bacterial lawn', centerX, centerY);
    }

    // Draw ruler scale when incubated (draggable)
    if (incubated) {
      const rulerLength = 100; // 50mm in pixels (2px per mm)
      
      // Ruler background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.fillRect(rulerX - 5, rulerY - 15, rulerLength + 10, 35);
      ctx.strokeRect(rulerX - 5, rulerY - 15, rulerLength + 10, 35);
      
      // Ruler body (main line)
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rulerX, rulerY);
      ctx.lineTo(rulerX + rulerLength, rulerY);
      ctx.stroke();
      
      // Draw tick marks and labels
      ctx.fillStyle = '#333';
      ctx.font = '9px Arial';
      ctx.textAlign = 'center';
      
      // Every 10mm (20px)
      for (let i = 0; i <= 50; i += 10) {
        const x = rulerX + (i * 2);
        
        // Tall tick for 10mm marks
        ctx.beginPath();
        ctx.moveTo(x, rulerY);
        ctx.lineTo(x, rulerY + 8);
        ctx.stroke();
        
        // Label - align left for 0, center for others
        if (i === 0) {
          ctx.textAlign = 'left';
          ctx.fillText(`${i}`, x, rulerY + 18);
          ctx.textAlign = 'center';
        } else {
          ctx.fillText(`${i}`, x, rulerY + 18);
        }
      }
      
      // Every 5mm (10px) - medium ticks
      for (let i = 5; i < 50; i += 10) {
        const x = rulerX + (i * 2);
        ctx.beginPath();
        ctx.moveTo(x, rulerY);
        ctx.lineTo(x, rulerY + 6);
        ctx.stroke();
      }
      
      // Every 1mm (2px) - small ticks
      for (let i = 1; i < 50; i++) {
        if (i % 5 !== 0) { // Skip the 5mm marks
          const x = rulerX + (i * 2);
          ctx.beginPath();
          ctx.moveTo(x, rulerY);
          ctx.lineTo(x, rulerY + 3);
          ctx.stroke();
        }
      }
      
      // Label
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('mm', rulerX + rulerLength + 5, rulerY + 5);
      
      // Drag hint
      ctx.font = '8px Arial';
      ctx.fillStyle = '#666';
      ctx.textAlign = 'center';
      ctx.fillText('drag to measure', rulerX + rulerLength / 2, rulerY - 8);
    }
  }

  $effect(() => {
    draw();
  });

  onMount(() => {
    draw();
  });
</script>

<div class="antibiotic-plate">
  <canvas
    bind:this={canvas}
    width="500"
    height="400"
    onmousedown={handleMouseDown}
    onmousemove={handleMouseMove}
    onmouseup={handleMouseUp}
    onmouseleave={handleMouseUp}
  ></canvas>
</div>

<style>
  .antibiotic-plate {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1a1a1a;
  }

  canvas {
    border-radius: 4px;
  }
</style>
