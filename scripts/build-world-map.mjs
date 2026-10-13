// Generates src/admin/world-map.json (the analytics map) from Natural Earth 1:110m (world-atlas).
// One-off: the tools are not project dependencies. To regenerate, in an empty folder:
//   npm i world-atlas@2.0.2 d3-geo@3.1.1 topojson-client@3.1.0 i18n-iso-countries@7.14.0
//   node <project>/scripts/build-world-map.mjs <that folder> <project>/src/admin/world-map.json
import {writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const [toolsDir, out] = process.argv.slice(2);
const require = createRequire(path.resolve(toolsDir, 'package.json'));
const {geoNaturalEarth1, geoPath} = await import(pathToFileURL(require.resolve('d3-geo')).href);
const {feature} = require('topojson-client');
const countries = require('i18n-iso-countries');
const world = require('world-atlas/countries-110m.json');

const W = 1000;
const H = 520;
const geo = feature(world, world.objects.countries);
geo.features = geo.features.filter((f) => f.id !== '010'); // Antarctica: no visitors, half the height
const projection = geoNaturalEarth1().fitExtent([[0, 0], [W, H]], geo);
const draw = geoPath(projection).digits(1);
const locations = geo.features
  .map((f) => ({id: (countries.numericToAlpha2(f.id) || '').toLowerCase(), path: draw(f)}))
  .filter((l) => l.id && l.path);
writeFileSync(out, JSON.stringify({viewBox: `0 0 ${W} ${H}`, locations}));
console.log(`${locations.length} countries → ${out}`);
