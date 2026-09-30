// ==========================================================================
// css-swap-test.mjs — Verificación de la Fase 2 (sistema de diseño).
//
// Arma una COPIA de referencia/ en .tmp/css-swap/ y le reemplaza el CSS
// original por el CSS nuevo compilado desde src/styles:
//   bootstrap.min.css   → subconjunto compilado de src/styles/vendor/bootstrap.scss
//   custom.css          → src/styles/index.css con todos sus @import resueltos
//   slicknav/magnific/mousecursor → src/styles/vendor/*.css
// Así se puede comparar "mismo HTML + CSS nuevo" contra el original con
// tools/compare.mjs y tools/computed-styles.mjs.
//
// Uso: node tools/css-swap-test.mjs
// ==========================================================================
import fs from 'node:fs';
import path from 'node:path';
import * as sass from 'sass';

const root = path.resolve(import.meta.dirname, '..');
const ref = path.join(root, 'referencia');
const out = path.join(root, '.tmp', 'css-swap');
const styles = path.join(root, 'src', 'styles');

fs.rmSync(out, { recursive: true, force: true });
// Copia recursiva manual: fs.cpSync de Node 24 se cae en Windows con rutas
// que tienen caracteres no ASCII (la carpeta del proyecto tiene "ñ").
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    e.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}
copyDir(ref, out);

// Resuelve @import "./x.css" recursivamente (lo mismo que hace Vite al compilar).
function bundle(file) {
  const dir = path.dirname(file);
  return fs.readFileSync(file, 'utf8').replace(/@import\s+"([^"]+\.css)";/g, (_, rel) => bundle(path.join(dir, rel)));
}
// En src/ las imágenes del CSS apuntan a src/assets/images; en la copia, a images/.
const fixUrls = (css) => css
  .replaceAll("../../assets/images/", '../images/');

const custom = fixUrls(bundle(path.join(styles, 'index.css')));
fs.writeFileSync(path.join(out, 'css', 'custom.css'), custom);

const bs = sass.compile(path.join(styles, 'vendor', 'bootstrap.scss'), {
  loadPaths: [path.join(root, 'node_modules')],
  quietDeps: true,
  silenceDeprecations: ['import', 'global-builtin', 'color-functions'],
});
fs.writeFileSync(path.join(out, 'css', 'bootstrap.min.css'), bs.css);

for (const [orig, mine] of [['slicknav.min.css', 'slicknav.css'], ['magnific-popup.css', 'magnific-popup.css'], ['mousecursor.css', 'cursor.css']]) {
  fs.copyFileSync(path.join(styles, 'vendor', mine), path.join(out, 'css', orig));
}
console.log(`Copia lista en ${out}  (custom.css ${custom.length} B, bootstrap ${bs.css.length} B)`);
