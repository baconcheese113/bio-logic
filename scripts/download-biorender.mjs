import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const defaultQueries = ['e coli', 'staphylococcus', 'bacterial colony', 'gram stain', 'blood cells', 'epithelial cells', 'yeast', 'virus', 'patient', 'blood sample', 'urine sample', 'swab sample', 'microscope', 'microscope slide', 'petri dish', 'agar plate', 'culture dish', 'test tube', 'falcon tube', 'pipette', 'centrifuge', 'incubator', 'flask', 'colony picking', 'antibiotic sensitivity test'];
const queries = process.argv.slice(2).length ? process.argv.slice(2) : defaultQueries;
const canvasUrl = 'https://app.biorender.com/illustrations/canvas-beta/6a17afefcb8d7a99cb5f6678';
const profileDir = resolve(process.cwd(), '.cache', 'biorender-playwright-profile');
const outputDir = resolve(process.cwd(), 'assets', 'biorender', 'svg-happy-path');
const perQuery = Number(process.env.BIORENDER_PER_QUERY || '2');
let currentTitle = '';
let svgs = new Map();

const slug = (value) => value.replace(/\W+/g, '-').toLowerCase().replace(/^-|-$/g, '');
const saveIfSvg = (value) => {
  if (value?.startsWith('data:image/svg+xml,')) svgs.set(decodeURIComponent(value.slice(value.indexOf(',') + 1)), currentTitle);
};

async function getPreviewTitle(page) {
  return page.evaluate(() => {
    let node = document.querySelector('img[alt="Asset preview"]')?.parentElement;
    for (let depth = 0; depth < 8 && node; depth += 1) {
      const title = node.querySelector('p')?.textContent?.trim();
      if (title) return title;
      node = node.parentElement;
    }
    return '';
  });
}

async function searchAndSave(page, query) {
  console.log(`\n=== ${query} ===`);
  svgs = new Map();
  await page.getByTestId('asset-search-input').fill(query);
  await page.keyboard.press('Enter');
  await page.locator('#biorender-asset-search-panel [role="option"]').filter({ hasText: 'Search for:' }).first().click({ timeout: 2000 }).catch(() => {});
  await page.waitForTimeout(1200);

  const results = page.locator('#biorender-asset-search-panel [data-test="assets-container"]').filter({ visible: true });
  await results.first().waitFor({ state: 'visible', timeout: 10000 });
  const resultCount = await results.count();
  console.log(`found ${resultCount} results`);

  for (let index = 0; index < resultCount && svgs.size < perQuery; index += 1) {
    const result = results.nth(index);
    if (await result.locator('.asset-complex-icon-container, .asset-complex-overlay-container').count()) {
      console.log(`skip grouped result ${index + 1}`);
      continue;
    }
    currentTitle = await result.evaluate((node) => node.closest('.asset-container')?.getAttribute('data-test') || '').catch(() => '');
    console.log(`hover result ${index + 1}`);
    await result.hover();
    await page.waitForTimeout(800);
    currentTitle = await getPreviewTitle(page) || currentTitle;
    console.log(`title: ${currentTitle || 'untitled'}`);
    saveIfSvg(await page.locator('img[alt="Asset preview"]').first().getAttribute('src').catch(() => null));
  }

  await Promise.all([...svgs].map(([svg, title], index) => writeFile(resolve(outputDir, `${slug(query)}--${slug(title || query)}-${index + 1}.svg`), svg)));
  console.log(`saved ${svgs.size} SVG(s)`);
}

await mkdir(outputDir, { recursive: true });
const context = await chromium.launchPersistentContext(profileDir, { headless: false, viewport: { width: 1400, height: 900 } });
const page = context.pages()[0] || (await context.newPage());
page.on('request', (request) => saveIfSvg(request.url()));

console.log('goto canvas');
await page.goto(canvasUrl, { waitUntil: 'domcontentloaded' });
console.log('wait for Icons (sign in if BioRender asks)');
await page.getByRole('button', { name: /^Icons\b/i }).waitFor({ state: 'visible', timeout: 600000 });
console.log('click Icons');
await page.getByRole('button', { name: /^Icons\b/i }).click();

for (const query of queries) await searchAndSave(page, query);

console.log(`\nDone. Saved SVGs to ${outputDir}`);
await context.close();
