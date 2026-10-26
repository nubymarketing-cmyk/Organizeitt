// Gera uma única página HTML (JS e CSS embutidos) para publicar a demonstração.
// Uso: node scripts/build-artifact.mjs <arquivo-de-saída.html>
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = process.argv[2];
if (!out) throw new Error('Informe o arquivo de saída.');
const dir = 'dist-artifact';
execSync(`npx vite build --outDir ${dir} --emptyOutDir`, {
  stdio: 'inherit',
  env: { ...process.env, VITE_ROUTER: 'memory' },
});

const assets = join(dir, 'assets');
const files = readdirSync(assets);
const css = files.filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(assets, f), 'utf8')).join('\n');
const js = files.filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(assets, f), 'utf8')).join('\n');

const page = `<title>Portal do Cliente Nuby</title>
<meta name="theme-color" content="#0C0B1D">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Manrope:wght@400;500;600;700&display=swap">
<style>${css}</style>
<div id="root"></div>
<script type="module">${js.replace(/<\/script/gi, '<\\/script')}</script>
`;
writeFileSync(out, page);
console.log(`Página gerada: ${out} (${Math.round(page.length / 1024)} KB)`);
