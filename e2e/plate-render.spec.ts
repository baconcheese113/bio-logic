import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const REFERENCE_URL =
  '/prototypes/svelte-lab-avatar/?seed=42&paths=reference#/reference';

const IMAGE_MODE_URL =
  '/prototypes/svelte-lab-avatar/?paths=image#/reference';

const REF_IMAGE_URL =
  '/prototypes/svelte-lab-avatar/components/reference/s-aureus-real.png';

// Plate crop coordinates (% of reference image) — tune if the ref photo changes
const REF_PLATE = { centerX: 0.5, centerY: 0.47, radiusFrac: 0.40 };

test('deterministic colony render matches golden screenshot', async ({
  page,
}) => {
  await page.goto(REFERENCE_URL);

  const canvas = page.locator('.plate-canvas');
  await expect(canvas).toBeVisible();
  await page.waitForTimeout(2000);

  await expect(canvas).toHaveScreenshot('colony-plate-golden.png', {
    maxDiffPixelRatio: 0.02,
  });
});

test('compare render against reference photo', async ({ page }) => {
  await page.goto(IMAGE_MODE_URL);

  const canvas = page.locator('.plate-canvas');
  await expect(canvas).toBeVisible();
  // Extra time for image load + heightmap extraction + WebGL init
  await page.waitForTimeout(3000);

  const screenshot = await canvas.screenshot();

  const result = await page.evaluate(
    async ({
      renderedBase64,
      refImageUrl,
      plate,
    }: {
      renderedBase64: string;
      refImageUrl: string;
      plate: { centerX: number; centerY: number; radiusFrac: number };
    }) => {
      const SIZE = 600;
      const PLATE_R = SIZE * 0.46;
      const HALF = SIZE / 2;

      function loadImg(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`Failed to load: ${src}`));
          img.src = src;
        });
      }

      // Draw rendered screenshot onto a 2D canvas so we can read pixels
      const renderImg = await loadImg(
        `data:image/png;base64,${renderedBase64}`,
      );
      const renderCanvas = document.createElement('canvas');
      renderCanvas.width = SIZE;
      renderCanvas.height = SIZE;
      const renderCtx = renderCanvas.getContext('2d')!;
      renderCtx.drawImage(renderImg, 0, 0);
      const renderData = renderCtx.getImageData(0, 0, SIZE, SIZE);

      // Load reference photo, crop to plate area, resize to 600×600
      const refImg = await loadImg(refImageUrl);
      const imgW = refImg.naturalWidth;
      const imgH = refImg.naturalHeight;
      const plateCX = imgW * plate.centerX;
      const plateCY = imgH * plate.centerY;
      const plateR = Math.min(imgW, imgH) * plate.radiusFrac;
      const sx = plateCX - plateR;
      const sy = plateCY - plateR;
      const sSize = plateR * 2;

      const refCanvas = document.createElement('canvas');
      refCanvas.width = SIZE;
      refCanvas.height = SIZE;
      const refCtx = refCanvas.getContext('2d')!;
      refCtx.drawImage(refImg, sx, sy, sSize, sSize, 0, 0, SIZE, SIZE);
      const refData = refCtx.getImageData(0, 0, SIZE, SIZE);

      // Build a side-by-side diff canvas: [render | reference | diff]
      const diffCanvas = document.createElement('canvas');
      diffCanvas.width = SIZE * 3;
      diffCanvas.height = SIZE;
      const diffCtx = diffCanvas.getContext('2d')!;
      diffCtx.drawImage(renderCanvas, 0, 0);
      diffCtx.drawImage(refCanvas, SIZE, 0);

      const diffImgData = diffCtx.createImageData(SIZE, SIZE);

      let totalPlatePixels = 0;
      let totalDiff = 0;
      let match25 = 0;
      let match50 = 0;

      for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
          const dx = x - HALF;
          const dy = y - HALF;
          const inPlate = dx * dx + dy * dy < PLATE_R * PLATE_R;
          const i = (y * SIZE + x) * 4;

          if (!inPlate) {
            diffImgData.data[i] = 30;
            diffImgData.data[i + 1] = 30;
            diffImgData.data[i + 2] = 30;
            diffImgData.data[i + 3] = 255;
            continue;
          }

          totalPlatePixels++;
          const dr = Math.abs(renderData.data[i] - refData.data[i]);
          const dg = Math.abs(renderData.data[i + 1] - refData.data[i + 1]);
          const db = Math.abs(renderData.data[i + 2] - refData.data[i + 2]);
          const pixelDiff = (dr + dg + db) / 3;

          totalDiff += pixelDiff;
          if (pixelDiff < 25) match25++;
          if (pixelDiff < 50) match50++;

          // Heat-map: green = close, yellow = moderate, red = far
          const t = Math.min(1, pixelDiff / 128);
          diffImgData.data[i] = Math.round(t * 255);
          diffImgData.data[i + 1] = Math.round((1 - t) * 255);
          diffImgData.data[i + 2] = 0;
          diffImgData.data[i + 3] = 255;
        }
      }

      diffCtx.putImageData(diffImgData, SIZE * 2, 0);

      // Labels
      diffCtx.font = '16px sans-serif';
      diffCtx.fillStyle = 'white';
      diffCtx.fillText('Render', 10, 22);
      diffCtx.fillText('Reference', SIZE + 10, 22);
      diffCtx.fillText('Diff (green=close)', SIZE * 2 + 10, 22);

      return {
        totalPlatePixels,
        avgColorDiff: totalDiff / totalPlatePixels,
        similarity25: match25 / totalPlatePixels,
        similarity50: match50 / totalPlatePixels,
        diffDataUrl: diffCanvas.toDataURL('image/png'),
      };
    },
    {
      renderedBase64: screenshot.toString('base64'),
      refImageUrl: REF_IMAGE_URL,
      plate: REF_PLATE,
    },
  );

  // Save the side-by-side diff image to disk
  const diffPath = path.join('test-results', 'reference-comparison.png');
  fs.mkdirSync(path.dirname(diffPath), { recursive: true });
  const diffBuffer = Buffer.from(
    result.diffDataUrl.replace(/^data:image\/png;base64,/, ''),
    'base64',
  );
  fs.writeFileSync(diffPath, diffBuffer);

  console.log('');
  console.log('=== Reference Photo Comparison ===');
  console.log(`  Plate pixels:       ${result.totalPlatePixels}`);
  console.log(`  Avg color diff:     ${result.avgColorDiff.toFixed(1)} / 255`);
  console.log(
    `  Within 25 (tight):  ${(result.similarity25 * 100).toFixed(1)}%`,
  );
  console.log(
    `  Within 50 (loose):  ${(result.similarity50 * 100).toFixed(1)}%`,
  );
  console.log(`  Diff image saved:   ${diffPath}`);
  console.log('');

  // Attach the diff image to the Playwright HTML report
  test.info().attach('reference-comparison', {
    body: diffBuffer,
    contentType: 'image/png',
  });
});

test('page loads without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto(REFERENCE_URL);
  await page.locator('.plate-canvas').waitFor({ state: 'visible' });
  await page.waitForTimeout(1000);

  expect(errors).toEqual([]);
});
