// Builds server/admin-visible.json: for every scope of source_data.json, the keys
// the admin should show — texts a visitor actually sees. Hidden from the admin
// (but still used by the site): decorative mock-ups (inside aria-hidden), screen-reader
// only texts (aria-*, alt, title, sr-only) and the hero editor's interface.
// Runs automatically before `npm run dev` and `npm run build`.
import {readdirSync, readFileSync, statSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve(import.meta.dirname, '..');
const src = path.join(root, 'src');
const HIDDEN_SCOPES = new Set([
  'components/hero/data', 'components/hero/icons', 'components/hero/Studio', 'components/hero/PropertyPanel',
  'components/approach/ApproachPanel', 'components/layout/SiteLayout', 'components/Logo',
]);
const A11Y_ATTRS = /^(aria-.*|alt|title)$/;

function jsxAttr(el, name) {
  const opening = ts.isJsxElement(el) ? el.openingElement : el;
  return opening.attributes.properties.find((p) => ts.isJsxAttribute(p) && p.name.getText() === name);
}

function isVisibleUsage(call) {
  for (let node = call, child = null; node; child = node, node = node.parent) {
    if (ts.isJsxAttribute(node) && A11Y_ATTRS.test(node.name.getText())) return false;
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      // attribute values of this element don't count as its content
      const inOwnAttributes = child && (ts.isJsxOpeningElement(child) || ts.isJsxAttributes(child) || ts.isJsxAttribute(child));
      if (inOwnAttributes && ts.isJsxSelfClosingElement(node)) continue;
      const hidden = jsxAttr(node, 'aria-hidden');
      if (hidden && !/\{\s*false\s*\}/.test(hidden.getText())) return false;
      const cls = jsxAttr(node, 'className');
      if (cls && /(^|[\s"'])sr-only($|[\s"'])/.test(cls.getText()) && !/not-sr-only/.test(cls.getText())) return false;
    }
  }
  return true;
}

const visible = {};
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const file = path.join(dir, name);
    if (statSync(file).isDirectory()) walk(file);
    else if (/\.tsx?$/.test(name) && !name.endsWith('.d.ts')) {
      const code = readFileSync(file, 'utf8');
      const scope = code.match(/const \$t = text\((["'])([^"']+)\1\)/)?.[2];
      if (!scope || HIDDEN_SCOPES.has(scope)) continue;
      const sf = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, name.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
      const keys = (visible[scope] ??= new Set());
      (function visit(node) {
        if (ts.isCallExpression(node) && node.expression.getText() === '$t' && ts.isStringLiteral(node.arguments[0])) {
          if (isVisibleUsage(node)) keys.add(node.arguments[0].text);
        }
        ts.forEachChild(node, visit);
      })(sf);
    }
  }
})(src);

// page titles are shown in the browser tab
const data = JSON.parse(readFileSync(path.join(root, 'source_data.json'), 'utf8'));
for (const [scope, entries] of Object.entries(data)) {
  if ('meta-title' in entries) (visible[scope] ??= new Set()).add('meta-title');
}

const out = Object.fromEntries(
  Object.entries(visible)
    .filter(([, keys]) => keys.size)
    .map(([scope, keys]) => [scope, Object.keys(data[scope] ?? {}).filter((k) => keys.has(k))]),
);
writeFileSync(path.join(root, 'server', 'admin-visible.json'), JSON.stringify(out, null, 1) + '\n');
const total = Object.values(data).reduce((n, v) => n + Object.keys(v).length, 0) - Object.keys(data._about).length;
console.log(`admin-index: ${Object.values(out).flat().length} editable texts of ${total} in ${Object.keys(out).length} sections`);
