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
export type TrackingCategory = 'analytics' | 'social' | 'email' | 'ecommerce' | 'other';
export type RemovedParameter = {
    /**
     * The name, percent-decoded and lowercased.
     */
    name: string;
    /**
     * What kind of tracking it is.
     */
    category: TrackingCategory;
    /**
     * `'global'` for a name that's tracking on every
     * site; otherwise the site whose rule removed it (`'Amazon'`, `'YouTube'`).
     */
    scope: string;
};
export type CleanReport = {
    /**
     * The link as given.
     */
    original: string;
    /**
     * The link with the tracking gone: what
     * {@link withoutTracking} returns.
     */
    cleaned: string;
    /**
     * Every parameter removed, in the order found.
     */
    removed: RemovedParameter[];
    /**
     * The redirect pages peeled, outermost first
     * (`['Google', 'Outlook Safe Links']` for a Gmail link to a Safe Link).
     */
    unwrapped: string[];
    /**
     * What changed in the path, in words
     * (`'removed /ref=sr_1_3'`, `'canonicalised to /dp/B08N5WRWNW'`).
     */
    pathChanges: string[];
    /**
     * Whether a tracking `#fragment` was dropped.
     */
    fragmentRemoved: boolean;
    /**
     * The signature scheme the link (after
     * unwrapping) is signed with, when that signature covers its whole query, so
     * that taking a parameter out can stop it opening; else null. JavaScript
     * only: the Swift's report has no such field.
     */
    signed: SignedScheme | null;
};
export type SignedScheme = 'AWS Signature V4' | 'Google Cloud Storage' | 'OAuth 1.0' | 'Shopify' | 'Laravel' | 'imgix' | 'Google Maps';
export type CleanOptions = {
    /**
     * Keep what credits a referrer for a sale:
     * the parameters in `AFFILIATE_PARAMETERS` (Amazon's `tag`, eBay's `campid`,
     * Awin's `awc`…) and the affiliate networks' own redirect pages (Rakuten,
     * eBay's rover), so a creator's link still pays them. The tracking around
     * them still goes.
     */
    keepAffiliate?: boolean;
    /**
     * Leave a signed link's query, path and
     * fragment exactly as they are (`report.signed` says which links those
     * are); redirect pages in front of it are still unwrapped. For cleaning
     * nobody asked for (on copy, in the address bar), where a link that stops
     * opening is worse than one that keeps its tracking.
     */
    keepSigned?: boolean;
};
/**
 * The link without its tracking, for inserting or sharing; null when there
 * was nothing to take out or it isn't an http(s) link (`mailto:`,
 * `javascript:`, plain text).
 *
 * "Nothing to take out" includes changes that are only Foundation writing
 * the same URL differently (`|` as `%7C`, a bare trailing `?` dropped): the
 * user's link is left as it was.
 *
 * @param {string} url - The link.
 * @param {CleanOptions} [options] - What to leave alone. Default: nothing.
 * @returns {string|null} The cleaned link, or null.
 * @example
 * cleanLink('https://example.com/?utm_source=x'); // 'https://example.com/'
 * cleanLink('https://example.com/?id=1');         // null
 * cleanLink('https://example.com/path?');         // null
 */
export declare function cleanLink(url: string, options?: CleanOptions): string | null;
/**
 * Swift's `String.withoutTracking`, exactly: any string in, the cleaned
 * string out (unchanged when there's nothing to clean). Strings that aren't
 * URLs still lose `utm_*` and the other global names.
 *
 * @param {string} input - Any text; usually a link.
 * @param {CleanOptions} [options] - What to leave alone. Default: nothing.
 * @returns {string} The cleaned text.
 * @example
 * withoutTracking('https://example.com/?utm_source=x&id=1'); // 'https://example.com/?id=1'
 */
export declare function withoutTracking(input: string, options?: CleanOptions): string;
/**
 * Swift's `URLStripper.report`: the cleaned link together with everything
 * that was taken out and why, for showing the user. `cleaned` is exactly
 * what {@link withoutTracking} returns; with the default options every field
 * matches the Swift's report (`tests/fixtures/golden-reports.json`).
 *
 * @param {string} input - Any text; usually a link.
 * @param {CleanOptions} [options] - What to leave alone. Default: nothing.
 * @returns {CleanReport} What changed.
 * @example
 * cleanReport('https://www.google.com/url?q=https://example.com/a%3Futm_source%3Dx');
 * // {original: …, cleaned: 'https://example.com/a', unwrapped: ['Google'],
 * //  removed: [{name: 'utm_source', category: 'analytics', scope: 'global'}],
 * //  pathChanges: [], fragmentRemoved: false, signed: null}
 */
export declare function cleanReport(input: string, options?: CleanOptions): CleanReport;
/**
 * A host as the rules compare it: lowercased, no trailing dot, no `www.`;
 * null for none or empty (HostMatcher.normalise). Internal: shared with
 * `shorteners.js`, not exported from the package.
 *
 * @param {string|null} host - A host as written.
 * @returns {string|null} The normalised host.
 */
export declare function normaliseHost(host: string | null): string | null;
export type PathClean = {
    path: string;
    changes: string[];
};
