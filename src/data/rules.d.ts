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
export type RedirectSource = {
    query?: string[];
    pathAfter?: string;
    proofpointV3?: boolean;
    lastPathSegment?: boolean;
    pathSegment?: string;
    pathSegmentAfter?: string;
    pathAfterSegments?: number;
};
export type RedirectEncoding = 'percent' | 'schemeless' | 'schemeOptional' | 'bingBase64' | 'proofpointV2' | 'proofpointV3' | 'base64' | 'disqus' | {
    base64JSON: string;
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
    source: RedirectSource;
    /**
     * How it's encoded. Default 'percent'.
     */
    encoding?: RedirectEncoding;
    /**
     * Who runs it, for reading the table.
     */
    label: string;
};
/**
 * Parameters that are tracking on EVERY host (GlobalParameters.table). The bar
 * is "no site anywhere uses this name for something functional", which is
 * why `ref`, `tag`, `s`, `k` and `from` are not here but in HOST_RULES.
 *
 * swift-url-kit 0.2.0's additions come from an audit against seven lists, all
 * fetched on 2026-11-09: AdGuard's URL Tracking filter, uBlock Origin's
 * uAssets, Brave's query-filter, Firefox's Query Stripping and Strip on Share,
 * DuckDuckGo's tracking-parameters and ClearURLs. `linkid`, `affid`, `aff_id`,
 * `affiliate_id` and `mbid` moved out (each is functional somewhere).
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
 * Global names that are NOT tracking on some paths (GlobalParameters.keptOnPaths),
 * where the token is how the page knows who is asking: Marketo's unsubscribe
 * and web-view pages read `mkt_tok`, Kit's unsubscribe page reads
 * `ck_subscriber_id`. Name → lowercased fragments of the (decoded) path; a
 * path containing any of them, in any case, keeps the name. From Brave's
 * `kConditionalQueryStringTrackers` (brave-browser#9018, #44341).
 *
 * @type {Readonly<Record<string, readonly string[]>>}
 */
export declare const GLOBAL_KEPT_ON_PATHS: Readonly<Record<string, readonly string[]>>;
/**
 * Tracking that is only tracking on one site (HostRules.all): `ref` is
 * Amazon's tag and GitHub's branch, so it is removed on the one and kept on
 * the other. `excluding` spares hosts that match `hosts` (Gmail under Google).
 *
 * swift-url-kit 0.2.0 adds the mainstream sites' pairs from the same audit
 * (each in at least one list, none a list or the site uses functionally).
 * They're for cleaning a link someone copies or shares, never for rewriting
 * a navigation: Google Lens and AI Mode loop without `biw`/`bih`.
 */
export declare const HOST_RULES: readonly HostRule[];
/**
 * Hosts whose links are never cleaned, only unwrapped when they're a redirect
 * (HostRules.neverStrip): their query is the content. An archived page's own
 * URL, a signed Proofpoint link that didn't unwrap, a ticket or a login
 * token. From the lists' allowlists (AdGuard, uBlock Origin, Brave's
 * `kExemptedHostnames`, DuckDuckGo), fetched 2026-11-09; UnivIS reads Drip's
 * `__s` as its own session parameter.
 *
 * @type {readonly HostPattern[]}
 */
export declare const NEVER_STRIP_HOSTS: readonly HostPattern[];
/**
 * Redirect pages that carry their destination in the URL (Redirects.rules),
 * peeled offline. The first matching rule that yields an http(s) URL wins.
 * See {@link RedirectSource} and {@link RedirectEncoding}. Affiliate networks'
 * wrappers are labelled by network, so `keepAffiliate` can leave them wrapped.
 *
 * @type {readonly RedirectRule[]}
 */
export declare const REDIRECT_RULES: readonly RedirectRule[];
/** Share-button fragment suffixes: AddThis's `#.Vh3x.twitter`, ShareThis's `#sthash.abc.dpbs` (Fragments.shareSuffixes). */
export declare const FRAGMENT_SHARE_SUFFIXES: Readonly<Set<string>>;
