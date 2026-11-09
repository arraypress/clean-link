/**
 * JS vs Swift: every line of a golden file through the port, printing each
 * mismatch, then the reports (`node diff.mjs [golden.json] [reports.json]`;
 * without arguments, the checked-in fixtures).
 *
 * @module scripts/golden/diff
 */

import { mismatches, readGolden, readReports, reportMismatches } from './compare.mjs';

const lines = readGolden(process.argv[2]);
const bad = mismatches(lines);
for (const { input, swift, js } of bad) console.log(JSON.stringify(input), '\n  swift', JSON.stringify(swift), '\n  js   ', JSON.stringify(js));
console.log(`${lines.length - bad.length}/${lines.length} match`);
if (bad.length) process.exitCode = 1;

const reports = readReports(process.argv[3]);
const badReports = reportMismatches(reports);
for (const { input, swift, js } of badReports) console.log(JSON.stringify(input), '\n  swift', JSON.stringify(swift), '\n  js   ', JSON.stringify(js));
console.log(`${reports.length - badReports.length}/${reports.length} reports match`);
if (badReports.length) process.exitCode = 1;
