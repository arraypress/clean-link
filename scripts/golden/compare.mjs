/**
 * The golden file and how the port is held to it, shared by the test
 * (tests/clean-link.test.js) and the harness's diff (diff.mjs).
 *
 * @module scripts/golden/compare
 */

import { readFileSync } from 'node:fs';
import { withoutTracking } from '../../src/index.js';

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
