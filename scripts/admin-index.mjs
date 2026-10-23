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
  'components/hero/Studio',
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
      // a page made from templates/ServicePage: every text of its scope is shown on it
      const servicePage = code.match(/<ServicePage scope="([^"]+)"/)?.[1];
      if (servicePage) (visible[servicePage] ??= new Set()).add(/.*/);
      // text("scope"), or text(SCOPE) with `const SCOPE = "scope"`
      const named = code.match(/const \$t = text\((\w+)\)/)?.[1];
      const scope = code.match(/const \$t = text\((["'])([^"']+)\1\)/)?.[2]
        ?? (named && code.match(new RegExp(`const ${named} = (["'])([^"']+)\\1`))?.[2]);
      if (!scope || HIDDEN_SCOPES.has(scope)) continue;
      const sf = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, name.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
      const keys = (visible[scope] ??= new Set());
      (function visit(node) {
        // $t('key'), $t(`item-${n}`) (every key of that shape) and list('key') (a list of texts, see textList)
        const fn = ts.isCallExpression(node) && node.expression.getText();
        const arg = (fn === '$t' || fn === 'list') && node.arguments[0];
        if (arg && isVisibleUsage(node)) {
          if (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) keys.add(arg.text);
          else if (ts.isTemplateExpression(arg)) {
            const parts = [arg.head.text, ...arg.templateSpans.map((t) => t.literal.text)];
            keys.add(new RegExp('^' + parts.map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.+') + '$'));
          }
        }
        ts.forEachChild(node, visit);
      })(sf);
    }
  }
})(src);

// page titles are shown in the browser tab
const data = JSON.parse(readFileSync(path.join(root, 'source_data.json'), 'utf8'));
// Legal pages render their numbered sections dynamically through the existing text editor.
for (const scope of ['/politica-de-confidentialitate', '/politica-de-cookies', '/terms-and-conditions']) {
  (visible[scope] ??= new Set()).add(/.*/);
}
for (const [scope, entries] of Object.entries(data)) {
  if ('meta-title' in entries) (visible[scope] ??= new Set()).add('meta-title');
}

const out = Object.fromEntries(
  Object.entries(visible)
    .filter(([, keys]) => keys.size)
    .map(([scope, keys]) => [scope, Object.keys(data[scope] ?? {}).filter((k) => [...keys].some((x) => (x instanceof RegExp ? x.test(k) : x === k)))]),
);
writeFileSync(path.join(root, 'server', 'admin-visible.json'), JSON.stringify(out, null, 1) + '\n');
const total = Object.values(data).reduce((n, v) => n + Object.keys(v).length, 0) - Object.keys(data._about).length;
console.log(`admin-index: ${Object.values(out).flat().length} editable texts of ${total} in ${Object.keys(out).length} sections`);
