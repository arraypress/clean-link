/**
 * @module clean
 * @description Takes the tracking out of a link, offline: tracking query
 * parameters, redirect wrappers (google.com/url?q=, Outlook Safe Links,
 * Facebook's l.php…), Amazon's `/ref=` path segments and slugs (→ `/dp/ASIN`),
 * eBay's item slugs, and share fragments (`#xtor=`, AddThis).
 *
 * A port of swift-url-kit's URLStripper (`Cleaner.swift`, `Paths.swift`,
 * `Fragments.swift`) and the parts of URLCore it uses (`HostMatcher.swift`,
 * `Redirects.swift`), default options only. Behaviour-identical to the Swift's
 * `String.withoutTracking`; `tests/fixtures/golden.json` is the Swift's own
 * output for 500+ links and the tests hold this to every line.
 * The tables are in `data/rules.js`. URLExpander (following shorteners
 * over the network) is deliberately not ported: this never fetches anything.
 *
 * Rules are host-scoped: `ref` is Amazon's affiliate tag and GitHub's branch,
 * `t` is Twitter's share token and YouTube's timestamp. A global list breaks
 * real links (the Swift measured 12 of 15).
 *
 * Pure: no DOM, no network.
 */
/**
 * The link without its tracking, for inserting or sharing; null when there
 * was nothing to take out or it isn't an http(s) link (`mailto:`,
 * `javascript:`, plain text).
 *
 * "Nothing to take out" includes changes that are only Foundation writing
 * the same URL differently (`|` as `%7C`): the user's link is left as it was.
 *
 * @param {string} url
 * @returns {string|null}
 */
export declare function cleanLink(url: string): string | null;
/**
 * Swift's `String.withoutTracking`, exactly: any string in, the cleaned
 * string out (unchanged when there's nothing to clean). Strings that aren't
 * URLs still lose `utm_*` and the other global names.
 *
 * @param {string} input
 * @returns {string}
 */
export declare function withoutTracking(input: string): string;
