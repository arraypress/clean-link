/**
 * JS vs Swift: every line of a golden file through the port, printing each
 * mismatch. `node diff.mjs [golden.json]`; without an argument, the
 * checked-in fixture.
 *
 * @module scripts/golden/diff
 */

import { mismatches, readGolden } from './compare.mjs';

const lines = readGolden(process.argv[2]);
const bad = mismatches(lines);
for (const { input, swift, js } of bad) console.log(JSON.stringify(input), '\n  swift', JSON.stringify(swift), '\n  js   ', JSON.stringify(js));
console.log(`${lines.length - bad.length}/${lines.length} match`);
if (bad.length) process.exitCode = 1;
