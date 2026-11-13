/**
 * The golden file and how the port is held to it, shared by the test
 * (tests/clean-link.test.js) and the harness's diff (diff.mjs).
 *
 * @module scripts/golden/compare
 */

import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { cleanReport, withoutTracking } from '../../src/index.js';

/** @import { CleanReport } from '../../src/index.js' */

/**
 * One line of the golden file: an input and the Swift's answer.
 *
 * @typedef {{input: string, output: string}} GoldenLine
 */

/**
 * One line where the port and the Swift disagree.
 *
 * @typedef {{input: string, swift: string, js: string}} Mismatch
 */

/** The Swift's `URLStripper.report` for every input (the harness's third argument). */
export const REPORTS_FIXTURE = new URL('../../tests/fixtures/golden-reports.json', import.meta.url);

/** The checked-in golden file. */
export const GOLDEN_FIXTURE = new URL('../../tests/fixtures/golden.json', import.meta.url);

/**
 * Read a golden file: the harness writes a bare list, the checked-in fixture
 * wraps it as `{about, lines}`.
 *
 * @param {string | URL} [file] - Default {@link GOLDEN_FIXTURE}.
 * @returns {GoldenLine[]} Its lines.
 */
export function readGolden(file = GOLDEN_FIXTURE) {
  const parsed = JSON.parse(readFileSync(file, 'utf8'));
  return Array.isArray(parsed) ? parsed : parsed.lines;
}

/**
 * Every line the port answers differently, a throw counted as an answer.
 *
 * @param {readonly GoldenLine[]} lines - From {@link readGolden}.
 * @returns {Mismatch[]} Empty when the port matches the Swift everywhere.
 */
export function mismatches(lines) {
  return lines.flatMap(({ input, output }) => {
    let js;
    try {
      js = withoutTracking(input);
    } catch (error) {
      js = `THROW ${/** @type {Error} */ (error).message}`;
    }
    return js === output ? [] : [{ input, swift: output, js }];
  });
}

/**
 * Read a reports file the harness wrote (`{about, reports}`).
 *
 * @param {string | URL} [file] - Default {@link REPORTS_FIXTURE}.
 * @returns {Omit<CleanReport, 'signed'>[]} The Swift's reports, in input order.
 */
export function readReports(file = REPORTS_FIXTURE) {
  return JSON.parse(readFileSync(file, 'utf8')).reports;
}

/**
 * Every report the port gives differently from the Swift's, field by field.
 *
 * @param {readonly Omit<CleanReport, 'signed'>[]} reports - From {@link readReports}.
 * @returns {{input: string, swift: Omit<CleanReport, 'signed'>, js: CleanReport}[]} Empty when every report matches.
 */
export function reportMismatches(reports) {
  return reports.flatMap((swift) => {
    const js = cleanReport(swift.original);
    // `signed` is the port's own (the Swift's report has no such field).
    const shared = Object.fromEntries(Object.entries(js).filter(([field]) => field !== 'signed'));
    return isDeepStrictEqual(shared, { ...swift }) ? [] : [{ input: swift.original, swift, js }];
  });
}
