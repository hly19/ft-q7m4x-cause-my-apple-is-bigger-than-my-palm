// Renders PWA PNG icons from an SVG using the preinstalled Playwright Chromium.
// Run: node scripts/make-icons.mjs
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { mkdirSync } from 'node:fs';

const mark = (pad) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" ${pad ? '' : 'rx="14"'} fill="#059669"/>
  <g transform="translate(32 32) scale(${pad ? 0.7 : 1}) translate(-32 -32)">
    <path d="M14 36h8l5-12 8 22 5-14h10" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;

const out = [
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['icon-maskable-512.png', 512, true],
  ['apple-touch-icon.png', 180, true],
];

mkdirSync('public/icons', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, size, full] of out) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0">${mark(full).replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  await page.screenshot({ path: `public/icons/${name}`, omitBackground: !full });
}
await browser.close();
console.log('icons written');
