// Resume informes JSON de Lighthouse en una tabla Markdown.
// Uso: node tools/lh-summary.mjs docs/lighthouse/antes-local-*.json
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const files = process.argv.slice(2);
const ms = (v) => (v / 1000).toFixed(1).replace('.', ',') + ' s';
const kb = (v) => (v / 1024 / 1024).toFixed(2).replace('.', ',') + ' MB';

console.log('| Informe | Perf | LCP | FCP | SI | TBT | CLS | Peso | Pedidos | A11y | SEO | BP |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const f of files) {
  const j = JSON.parse(readFileSync(f, 'utf8'));
  const a = j.audits;
  const c = j.categories;
  const score = (k) => (c[k] ? Math.round(c[k].score * 100) : '—');
  const reqs = a['network-requests']?.details?.items?.length ?? '—';
  console.log(`| ${basename(f, '.json')} | ${score('performance')} | ${ms(a['largest-contentful-paint'].numericValue)} | ${ms(a['first-contentful-paint'].numericValue)} | ${ms(a['speed-index'].numericValue)} | ${Math.round(a['total-blocking-time'].numericValue)} ms | ${a['cumulative-layout-shift'].numericValue.toFixed(3)} | ${kb(a['total-byte-weight'].numericValue)} | ${reqs} | ${score('accessibility')} | ${score('seo')} | ${score('best-practices')} |`);
}
