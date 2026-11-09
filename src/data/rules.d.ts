/**
 * @module data/rules
 * @description The rule tables behind `clean.js`, ported from
 * swift-url-kit (`URLStripper/Support/GlobalParameters.swift`,
 * `URLStripper/Support/HostRules.swift`, `URLCore/Support/Redirects.swift`,
 * `URLStripper/Support/Fragments.swift`). Kept line for line in the Swift's
 * order and wrapping, `.exact("x")` written `exact('x')`, so the two diff
 * cleanly: change a table there, change it here, regenerate the golden file.
 *
 * Data only; matching lives in `clean.js`. Names are lowercased.
 */
export type ParameterPattern = Readonly<{
    kind: 'exact' | 'prefix';
    value: string;
}>;
export type HostPattern = Readonly<{
    kind: 'suffix' | 'brand';
    value: string;
}>;
export type HostRule = {
    /**
     * Where it applies (exact, suffix or brand).
     */
    hosts: readonly Readonly<{
        kind: string;
        value: string;
    }>[];
    /**
     * The names it removes there.
     */
    parameters: readonly ParameterPattern[];
    /**
     * What kind of tracking they are.
     */
    category: 'analytics' | 'social' | 'email' | 'ecommerce' | 'other';
    /**
     * The site, as reports name it ("Amazon").
     */
    label: string;
    /**
     * Hosts spared though `hosts` matches them.
     */
    excluding?: readonly Readonly<{
        kind: string;
        value: string;
    }>[];
};
export type RedirectRule = {
    /**
     * Where it applies.
     */
    hosts: HostPattern[];
    /**
     * Its path starts with this.
     */
    pathPrefix?: string;
    /**
     * Where the destination is.
     */
    source: {
        query?: string[];
        pathAfter?: string;
        proofpointV3?: boolean;
    };
    /**
     * How it's encoded. Default 'percent'.
     */
    encoding?: 'percent' | 'schemeless' | 'bingBase64' | 'proofpointV2';
    /**
     * Who runs it, for reading the table.
     */
    label: string;
};
/**
 * Parameters that are tracking on EVERY host (GlobalParameters.table). The bar
 * is "no site anywhere uses this name for something functional", which is
 * why `ref`, `tag`, `s`, `k` and `from` are not here but in HOST_RULES.
 */
export declare const GLOBAL_PARAMETERS: Readonly<{
    analytics: Readonly<{
        kind: 'exact' | 'prefix';
        value: string;
    }>[];
    social: Readonly<{
        kind: 'exact' | 'prefix';
        value: string;
    }>[];
    email: Readonly<{
        kind: 'exact' | 'prefix';
        value: string;
    }>[];
    ecommerce: Readonly<{
        kind: 'exact' | 'prefix';
        value: string;
    }>[];
    other: Readonly<{
        kind: 'exact' | 'prefix';
        value: string;
    }>[];
}>;
/**
 * Tracking that is only tracking on one site (HostRules.all): `ref` is
 * Amazon's tag and GitHub's branch, so it is removed on the one and kept on
 * the other. `excluding` spares hosts that match `hosts` (Gmail under Google).
 */
export declare const HOST_RULES: readonly HostRule[];
/**
 * Redirect pages that carry their destination in the URL (Redirects.rules),
 * peeled offline. The first matching rule that yields an http(s) URL wins.
 * `source`: a query parameter tried in order ('' = the whole query), the
 * rest of the path after a prefix, or Proofpoint v3's `__…__;`.
 * `encoding` (default 'percent'): 'bingBase64', 'proofpointV2', 'schemeless'.
 *
 * @type {readonly RedirectRule[]}
 */
export declare const REDIRECT_RULES: readonly RedirectRule[];
/** Share-button fragment suffixes: AddThis's `#.Vh3x.twitter`, ShareThis's `#sthash.abc.dpbs` (Fragments.shareSuffixes). */
export declare const FRAGMENT_SHARE_SUFFIXES: Readonly<Set<string>>;
