/**
 * Gera as imagens (WebP) e os vídeos (MP4/WebM) do site a partir da cena 3D.
 * Uso: node scripts/render.mjs [ids...]
 * (sobe um `next dev` na porta 3100 com a rota temporária /render)
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright')); }
import sharp from 'sharp';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const BASE = process.env.RENDER_URL || 'http://localhost:3100/render/';
const OUT = path.resolve('public/media');

const STILLS = {
  hero: { file: 'hero-poster', w: 1920, h: 1080, t: 2.2 },
  before: { file: 'before', w: 1600, h: 1000, t: 0 },
  after: { file: 'after', w: 1600, h: 1000, t: 0 },
  'final-cta': { file: 'final-cta', w: 1920, h: 1000, t: 3.5 },
  'lavagem-detalhada': { file: 'services/lavagem-detalhada', w: 1000, h: 1250, t: 1.8 },
  'lavagem-premium': { file: 'services/lavagem-premium', w: 1000, h: 1250, t: 2.4 },
  'higienizacao-interna': { file: 'services/higienizacao-interna', w: 1000, h: 1250, t: 1 },
  'polimento-tecnico': { file: 'services/polimento-tecnico', w: 1000, h: 1250, t: 4.2 },
  vitrificacao: { file: 'services/vitrificacao', w: 1000, h: 1250, t: 1.2 },
  'limpeza-motor': { file: 'services/limpeza-motor', w: 1000, h: 1250, t: 2.8 },
  'higienizacao-bancos': { file: 'services/higienizacao-bancos', w: 1000, h: 1250, t: 1 },
  'estetica-completa': { file: 'services/estetica-completa', w: 1000, h: 1250, t: 3.1 },
};

const VIDEOS = {
  'v-box': { file: 'structure/box', w: 1280, h: 800 },
  'v-polimento': { file: 'structure/polimento', w: 1280, h: 800 },
  'v-rodas': { file: 'structure/rodas', w: 1280, h: 800 },
  'v-ambiente': { file: 'structure/ambiente', w: 1280, h: 800 },
};
const FPS = Number(process.env.FPS || 24);
const SECONDS = Number(process.env.SECONDS || 6);

const only = process.argv.slice(2);
const pick = (obj) => Object.entries(obj).filter(([k]) => !only.length || only.includes(k));

// Rota temporária: só existe enquanto o script roda
const ROUTE = path.resolve('src/app/render/page.tsx');
await mkdir(path.dirname(ROUTE), { recursive: true });
await writeFile(ROUTE, "export { default } from '@/studio/RenderStudio';\n");
let server;
const cleanup = async () => {
  server?.kill();
  if (existsSync(ROUTE)) await rm(path.dirname(ROUTE), { recursive: true, force: true });
};
process.on('SIGINT', async () => { await cleanup(); process.exit(1); });
if (!process.env.RENDER_URL) {
  server = spawn('npx', ['next', 'dev', '-p', '3100'], { env: { ...process.env, NEXT_DIST_DIR: '.next-render' }, stdio: 'ignore' });
  for (let i = 0; i < 120; i++) {
    try { if ((await fetch(BASE)).ok) break; } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
}

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

async function open(id, w, h) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error(`[${id}]`, e.message));
  await page.goto(`${BASE}?shot=${id}`);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 180000 });
  return page;
}

const toBuf = (dataUrl) => Buffer.from(dataUrl.split(',')[1], 'base64');

for (const [id, s] of pick(STILLS)) {
  const t0 = Date.now();
  const page = await open(id, s.w, s.h);
  const png = toBuf(await page.evaluate((t) => window.__frame(t), s.t));
  const file = path.join(OUT, `${s.file}.webp`);
  await mkdir(path.dirname(file), { recursive: true });
  await sharp(png).webp({ quality: 82, effort: 6 }).toFile(file);
  console.log(`still ${id} -> ${file} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  await page.close();
}

for (const [id, v] of pick(VIDEOS)) {
  const t0 = Date.now();
  const page = await open(id, v.w, v.h);
  const dir = path.resolve('scripts/render/frames', id);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const total = FPS * SECONDS;
  for (let i = 0; i < total; i++) {
    const jpg = toBuf(await page.evaluate((t) => window.__frame(t, 'image/jpeg', 0.95), i / FPS));
    await writeFile(path.join(dir, `${String(i).padStart(4, '0')}.jpg`), jpg);
  }
  await page.close();
  const base = path.join(OUT, v.file);
  await mkdir(path.dirname(base), { recursive: true });
  const ff = (args) =>
    new Promise((res, rej) => {
      const p = spawn('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });
      p.on('exit', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg ${c}`))));
    });
  const input = ['-framerate', String(FPS), '-i', path.join(dir, '%04d.jpg')];
  await ff([...input, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', '-preset', 'slow', '-movflags', '+faststart', '-an', `${base}.mp4`]);
  await ff([...input, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '36', '-row-mt', '1', '-an', `${base}.webm`]);
  await sharp(path.join(dir, '0000.jpg')).resize({ width: 960 }).webp({ quality: 75 }).toFile(`${base}.webp`);
  console.log(`video ${id} -> ${base}.mp4/.webm (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}

await browser.close();
await cleanup();
