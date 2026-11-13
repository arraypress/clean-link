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

import {FRAGMENT_SHARE_SUFFIXES, GLOBAL_KEPT_ON_PATHS, GLOBAL_PARAMETERS, HOST_RULES, NEVER_STRIP_HOSTS, REDIRECT_RULES} from './data/rules.js';
import {AFFILIATE_PARAMETERS, AFFILIATE_REDIRECTS} from './data/affiliate.js';
import {SITE_KEPT_ON_PATHS, SITE_SPARED_HOSTS} from './data/corrections.js';
import {removingPercentEncoding, URLComponents} from './url/components.js';

/** @import {ParameterPattern, RedirectEncoding, RedirectSource} from './data/rules.js' */

/**
 * What kind of tracking a parameter is (swift-url-kit's `TrackingCategory`).
 *
 * @typedef {'analytics' | 'social' | 'email' | 'ecommerce' | 'other'} TrackingCategory
 */

/**
 * One parameter a clean removed, and why (the Swift's `RemovedParameter`).
 *
 * @typedef {object} RemovedParameter
 * @property {string} name The name, percent-decoded and lowercased.
 * @property {TrackingCategory} category What kind of tracking it is.
 * @property {string} scope `'global'` for a name that's tracking on every
 *   site; otherwise the site whose rule removed it (`'Amazon'`, `'YouTube'`).
 */

/**
 * Everything a clean changed, so it can be shown rather than just trusted
 * (the Swift's `CleanReport`).
 *
 * @typedef {object} CleanReport
 * @property {string} original The link as given.
 * @property {string} cleaned The link with the tracking gone: what
 *   {@link withoutTracking} returns.
 * @property {RemovedParameter[]} removed Every parameter removed, in the order found.
 * @property {string[]} unwrapped The redirect pages peeled, outermost first
 *   (`['Google', 'Outlook Safe Links']` for a Gmail link to a Safe Link).
 * @property {string[]} pathChanges What changed in the path, in words
 *   (`'removed /ref=sr_1_3'`, `'canonicalised to /dp/B08N5WRWNW'`).
 * @property {boolean} fragmentRemoved Whether a tracking `#fragment` was dropped.
 * @property {SignedScheme|null} signed The signature scheme the link (after
 *   unwrapping) is signed with, when that signature covers its whole query, so
 *   that taking a parameter out can stop it opening; else null. JavaScript
 *   only: the Swift's report has no such field.
 */

/**
 * A way of signing a link whose signature covers every query parameter
 * (see {@link signedScheme}).
 *
 * @typedef {'AWS Signature V4' | 'Google Cloud Storage' | 'OAuth 1.0' | 'Shopify' | 'Laravel' | 'imgix' | 'Google Maps'} SignedScheme
 */

/**
 * What a clean may leave alone. Every option is off by default, which is the
 * Swift's default clean.
 *
 * @typedef {object} CleanOptions
 * @property {boolean} [keepAffiliate] Keep what credits a referrer for a sale:
 *   the parameters in `AFFILIATE_PARAMETERS` (Amazon's `tag`, eBay's `campid`,
 *   Awin's `awc`…) and the affiliate networks' own redirect pages (Rakuten,
 *   eBay's rover), so a creator's link still pays them. The tracking around
 *   them still goes.
 * @property {readonly string[]} [keep] Names of query parameters to leave in
 *   whatever the rules say, as a report names them (decoded; any case): for a
 *   person who looked at what a clean would remove and wants one of them
 *   kept. Redirects, the path and the fragment are cleaned as usual.
 * @property {boolean} [keepSigned] Leave a signed link's query, path and
 *   fragment exactly as they are (`report.signed` says which links those
 *   are); redirect pages in front of it are still unwrapped. For cleaning
 *   nobody asked for (on copy, in the address bar), where a link that stops
 *   opening is worse than one that keeps its tracking.
 */

/** How many nested redirects to peel: a Gmail link to a Safe Link to a page is three. */
const MAXIMUM_UNWRAPS = 3;

/** Foundation's `.whitespacesAndNewlines`, for trimming. */
const TRIM = /^[\p{Z}\t\n\v\f\r\u0085]+|[\p{Z}\t\n\v\f\r\u0085]+$/gu;
/** Swift's `Character.isWhitespace`. */
const WHITESPACE = /\p{White_Space}/u;

/**
 * Flattened for one-pass matching, each with its category (GlobalParameters.flat).
 *
 * @type {readonly [ParameterPattern, TrackingCategory][]}
 */
const GLOBAL_FLAT = Object.entries(GLOBAL_PARAMETERS).flatMap(([category, patterns]) =>
    patterns.map((pattern) => /** @type {[ParameterPattern, TrackingCategory]} */ ([pattern, /** @type {TrackingCategory} */ (category)])));

/** Every affiliate parameter name, for `keepAffiliate`. */
const AFFILIATE_NAMES = new Set(Object.values(AFFILIATE_PARAMETERS).flat());

/** `http://` or `https://`, the letters in any ASCII case (Redirects.hasHTTPScheme). */
const HTTP_SCHEME = /^https?:\/\//i;

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
export function cleanLink(url, options = {}) {
    if (typeof url !== 'string') return null;
    const trimmed = url.replace(TRIM, '');
    const parts = WHITESPACE.test(trimmed) ? null : URLComponents.parse(trimmed);
    if (!parts || !/^https?$/i.test(parts.scheme ?? '') || !parts.host) return null;
    const report = cleanReport(trimmed, options);
    // The same link only written differently (`|` as `%7C`, "host:/" as
    // "host/", a bare "?" dropped) isn't worth swapping in for the user's.
    const changed = report.removed.length > 0 || report.unwrapped.length > 0 || report.pathChanges.length > 0 || report.fragmentRemoved;
    return changed && report.cleaned !== trimmed ? report.cleaned : null;
}

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
export function withoutTracking(input, options = {}) {
    return cleanReport(input, options).cleaned;
}

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
export function cleanReport(input, options = {}) {
    const keepAffiliate = options.keepAffiliate === true;
    const keepSigned = options.keepSigned === true;
    const keep = new Set((options.keep ?? []).map((name) => name.toLowerCase()));
    const trimmed = input.replace(TRIM, '');
    if (!trimmed) return report(input, input);
    // A URL can't contain whitespace; Foundation would encode it anyway and
    // rewrite text that was never a URL. Those get the by-hand fallback.
    let components = WHITESPACE.test(trimmed) ? null : URLComponents.parse(trimmed);
    if (!components) return fallback(input, trimmed, keepAffiliate, keep);

    // 1. Redirects, outermost first.
    /** @type {string[]} */
    const unwrapped = [];
    while (unwrapped.length < MAXIMUM_UNWRAPS) {
        const found = unwrap(components, keepAffiliate);
        if (!found) break;
        components = found.target;
        unwrapped.push(found.label);
    }

    const host = normaliseHost(components.host);
    const signed = signedScheme(components, host);
    // Asked to leave signed links alone: as given, or the destination as its
    // redirect page wrote it.
    if (signed && keepSigned) return report(input, unwrapped.length ? components.string : trimmed, {unwrapped, signed});
    // An archived page, a signed link that didn't unwrap: its query is the
    // content. Unwrapped, never cleaned.
    if (host !== null && matchesAny(host, NEVER_STRIP_HOSTS)) return report(input, components.string, {unwrapped, signed});
    const rules = host === null ? [] : HOST_RULES.filter((rule) => matchesAny(host, rule.hosts) && !matchesAny(host, rule.excluding ?? []) && !isSpared(host, rule.label));
    const path = components.path;

    // 2. Query. Work on the percent-encoded items so kept parameters come
    //    back byte for byte: `+` stays `+`, `%20` stays `%20`.
    /** @type {RemovedParameter[]} */
    const removed = [];
    const items = components.percentEncodedQueryItems;
    if (items) {
        const kept = items.filter((item) => {
            const name = (removingPercentEncoding(item.name) ?? item.name).toLowerCase();
            if (keep.has(name) || (keepAffiliate && AFFILIATE_NAMES.has(name))) return true;
            const global = globalCategory(name, path);
            if (global) {
                removed.push({name, category: global, scope: 'global'});
                return false;
            }
            const rule = rules.find((r) => matchesParameter(name, r.parameters) && !isKeptOn(path, r.label, name));
            if (rule) {
                removed.push({name, category: rule.category, scope: rule.label});
                return false;
            }
            return true;
        });
        components.percentEncodedQueryItems = kept.length ? kept : null;
    }

    // 3. Path.
    /** @type {string[]} */
    let pathChanges = [];
    if (host !== null) {
        const path = cleanPath(components.path, host);
        if (path) {
            components.path = path.path;
            pathChanges = path.changes;
        }
    }

    // 4. Fragment.
    const fragment = components.fragment;
    const fragmentRemoved = fragment !== null && isTrackingFragment(fragment);
    if (fragmentRemoved) components.fragment = null;

    return report(input, components.string, {removed, unwrapped, pathChanges, fragmentRemoved, signed});
}

/**
 * A report, with nothing changed unless `changes` says so.
 *
 * @param {string} original - The input.
 * @param {string} cleaned - The output.
 * @param {Partial<Omit<CleanReport, 'original' | 'cleaned'>>} [changes] - What changed.
 * @returns {CleanReport} The report.
 */
function report(original, cleaned, changes = {}) {
    return {original, cleaned, removed: [], unwrapped: [], pathChanges: [], fragmentRemoved: false, signed: null, ...changes};
}

// MARK: - Signed links

/**
 * The scheme a link is signed with, when the signature covers the whole
 * query: the server works the signature out again from every parameter it
 * is sent, so a tracking parameter that was there when the link was signed
 * can't be taken out (and one added afterwards has already broken it).
 *
 * Each is recognised by what only that scheme writes, never by a common
 * name alone: `?state=CA&code=SAVE10&expires=never` is a shop's search.
 *
 * - AWS Signature V4 (an S3 presigned URL): `X-Amz-Signature` with
 *   `X-Amz-Algorithm`. The canonical request holds every query parameter
 *   but the signature.
 * - Google Cloud Storage V4 signed URLs: `X-Goog-Signature` with
 *   `X-Goog-Algorithm`; the same canonical request.
 * - OAuth 1.0 (RFC 5849 §3.4.1): `oauth_signature` with
 *   `oauth_signature_method`; the base string holds every parameter.
 * - Shopify (OAuth callbacks and app proxies): `hmac` or `signature`, 64 hex
 *   digits, with `shop` and `timestamp`; an HMAC-SHA256 of all the others.
 * - Laravel signed routes: `signature`, 64 hex digits (and `expires`, a
 *   number, when there is one); an HMAC-SHA256 of the URL as written.
 * - imgix: `s`, 32 hex digits, on `*.imgix.net`; an MD5 of the path and query.
 * - Google Maps Platform: `signature` on `maps.googleapis.com`; an HMAC of
 *   the path and query.
 *
 * Not these, which sign named fields only and ignore other parameters:
 * Azure's SAS (`sig`), CloudFront (`Signature`, `Key-Pair-Id`), AWS
 * Signature V2 (`AWSAccessKeyId`, `Signature`).
 *
 * @param {URLComponents} components - The link, unwrapped.
 * @param {string|null} host - Its host, normalised.
 * @returns {SignedScheme|null}
 */
function signedScheme(components, host) {
    const items = components.percentEncodedQueryItems;
    if (!items) return null;
    /** @type {Map<string, string>} */
    const values = new Map();
    for (const item of items) {
        const name = (removingPercentEncoding(item.name) ?? item.name).toLowerCase();
        if (!values.has(name)) values.set(name, item.value ?? '');
    }
    /** @param {string} name */
    const has = (name) => (values.get(name) ?? '') !== '';
    /**
     * @param {string} name
     * @param {number} digits
     */
    const isHex = (name, digits) => {
        const value = values.get(name) ?? '';
        return value.length === digits && /^[0-9a-f]+$/i.test(value);
    };
    if (has('x-amz-signature') && has('x-amz-algorithm')) return 'AWS Signature V4';
    if (has('x-goog-signature') && has('x-goog-algorithm')) return 'Google Cloud Storage';
    if (has('oauth_signature') && has('oauth_signature_method')) return 'OAuth 1.0';
    if ((isHex('hmac', 64) || isHex('signature', 64)) && has('shop') && has('timestamp')) return 'Shopify';
    if (isHex('signature', 64) && (!values.has('expires') || /^[0-9]+$/.test(values.get('expires') ?? ''))) return 'Laravel';
    if (host !== null && matchesAny(host, [{kind: 'suffix', value: 'imgix.net'}]) && isHex('s', 32)) return 'imgix';
    if (host === 'maps.googleapis.com' && has('signature')) return 'Google Maps';
    return null;
}

// MARK: - Fallback

/**
 * For strings Foundation refuses (spaces, stray characters): split on `?`
 * and `&` by hand and apply only the host-independent rules.
 *
 * @param {string} original - As given.
 * @param {string} s - Trimmed.
 * @param {boolean} keepAffiliate - Keep affiliate names.
 * @param {ReadonlySet<string>} keep - Names to keep, lowercased.
 * @returns {CleanReport} What changed.
 */
function fallback(original, s, keepAffiliate, keep) {
    const q = s.indexOf('?');
    if (q < 0) return report(original, original);
    const base = s.slice(0, q);
    let rest = s.slice(q + 1);
    let fragment = '';
    const hash = rest.indexOf('#');
    if (hash >= 0) {
        fragment = rest.slice(hash);
        rest = rest.slice(0, hash);
    }
    /** @type {RemovedParameter[]} */
    const removed = [];
    const kept = rest.split('&').filter((pair) => {
        // Swift's `split(separator: "=", maxSplits: 1).first` skips empty
        // pieces, so "=utm_source" is named utm_source.
        const name = (pair.split('=').find((piece) => piece !== '') ?? pair).toLowerCase();
        if (keep.has(name) || (keepAffiliate && AFFILIATE_NAMES.has(name))) return true;
        const global = globalCategory(name, base);
        if (global) removed.push({name, category: global, scope: 'global'});
        return !global;
    });
    return report(original, base + (kept.length ? `?${kept.join('&')}` : '') + fragment, {removed});
}

/**
 * The category a lowercased name has on a page with this path, or null
 * (GlobalParameters.category(of:onPath:)): `GLOBAL_KEPT_ON_PATHS` first,
 * so an unsubscribe page keeps the token it reads, then the global table.
 *
 * @param {string} name - Lowercased.
 * @param {string} path - Decoded; for text that isn't a URL, what's before the `?`.
 * @returns {TrackingCategory|null}
 */
function globalCategory(name, path) {
    if (Object.hasOwn(GLOBAL_KEPT_ON_PATHS, name)) {
        const lower = path.toLowerCase();
        if (GLOBAL_KEPT_ON_PATHS[name].some((fragment) => lower.includes(fragment))) return null;
    }
    return GLOBAL_FLAT.find(([pattern]) => matchesParameter(name, [pattern]))?.[1] ?? null;
}

/**
 * Whether a site's rule leaves a host alone though it matches it
 * (`SITE_SPARED_HOSTS`: AWS under Amazon).
 *
 * @param {string} host - Normalised.
 * @param {string} label - The site's rule.
 * @returns {boolean}
 */
function isSpared(host, label) {
    return (SITE_SPARED_HOSTS[label] ?? []).some((spared) => host === spared || host.endsWith(`.${spared}`));
}

/**
 * Whether a page reads a name its site's rule removes elsewhere
 * (`SITE_KEPT_ON_PATHS`: `sp` on Bing Maps).
 *
 * @param {string} path - Decoded.
 * @param {string} label - The site's rule.
 * @param {string} name - Lowercased.
 * @returns {boolean}
 */
function isKeptOn(path, label, name) {
    const fragments = SITE_KEPT_ON_PATHS[label]?.[name];
    if (!fragments) return false;
    const lower = path.toLowerCase();
    return fragments.some((fragment) => lower.includes(fragment));
}

// MARK: - HostMatcher

/**
 * A host as the rules compare it: lowercased, no trailing dot, no `www.`;
 * null for none or empty (HostMatcher.normalise). Internal: shared with
 * `shorteners.js`, not exported from the package.
 *
 * @param {string|null} host - A host as written.
 * @returns {string|null} The normalised host.
 */
export function normaliseHost(host) {
    if (!host) return null;
    let h = host.toLowerCase();
    if (h.endsWith('.')) h = h.slice(0, -1);
    if (h.startsWith('www.')) h = h.slice(4);
    return h;
}

/**
 * @param {string} host - Normalised.
 * @param {readonly {kind: string, value: string}[]} patterns
 * @returns {boolean}
 */
function matchesAny(host, patterns) {
    return patterns.some(({kind, value}) => {
        if (kind === 'exact') return host === value;
        if (kind === 'suffix') return host === value || host.endsWith(`.${value}`);
        // brand: a label equal to it, then one or two labels of 2–3 letters
        // (amazon.com, amazon.co.uk, smile.amazon.de; not amazonaws.com).
        const labels = host.split('.').filter(Boolean);
        const i = labels.indexOf(value);
        const tail = i < 0 ? [] : labels.slice(i + 1);
        return tail.length >= 1 && tail.length <= 2 && tail.every((label) => /^\p{Alphabetic}{2,3}$/u.test(label));
    });
}

/**
 * @param {string} name - Lowercased.
 * @param {readonly {kind: string, value: string}[]} patterns
 * @returns {boolean}
 */
function matchesParameter(name, patterns) {
    return patterns.some(({kind, value}) => (kind === 'exact' ? name === value : name.startsWith(value)));
}

// MARK: - Redirects

/**
 * The destination a redirect URL carries and who runs the redirect, or null
 * when it isn't one (or, keeping affiliate credit, is an affiliate network's).
 *
 * @param {URLComponents} components
 * @param {boolean} keepAffiliate - Leave affiliate networks' redirects wrapped.
 * @returns {{target: URLComponents, label: string}|null}
 */
function unwrap(components, keepAffiliate) {
    const host = normaliseHost(components.host);
    if (host === null) return null;
    const path = components.path;
    for (const rule of REDIRECT_RULES) {
        if (!matchesAny(host, rule.hosts)) continue;
        if (keepAffiliate && AFFILIATE_REDIRECTS.has(rule.label)) continue;
        if (rule.pathPrefix && !isUnder(path, rule.pathPrefix)) continue;
        const raw = extract(rule.source, components);
        const decoded = raw === null ? null : decode(raw, rule.encoding ?? 'percent');
        const target = decoded === null ? null : URLComponents.parse(decoded);
        // Only http(s): a redirect to `javascript:` stays wrapped.
        if (!target || !/^https?$/.test(target.scheme?.toLowerCase() ?? '') || !target.host) continue;
        return {target, label: rule.label};
    }
    return null;
}

/**
 * Whether a path is a redirect page's: at its prefix, or below it. A prefix
 * that ends a segment (`/url`, `/l.php`) is followed by nothing or a `/`, so
 * Google's `/url` isn't `/url-help`; one that ends inside a segment (`/c/`,
 * CJ's `/click-`) is followed by anything.
 *
 * @param {string} path - Decoded.
 * @param {string} prefix - A rule's `pathPrefix`.
 * @returns {boolean}
 */
function isUnder(path, prefix) {
    if (!path.startsWith(prefix)) return false;
    return /[/-]$/.test(prefix) || path.length === prefix.length || path[prefix.length] === '/';
}

/**
 * Where a redirect keeps its destination, read out as written (Redirects.extract).
 *
 * @param {RedirectSource} source
 * @param {URLComponents} components
 * @returns {string|null}
 */
function extract(source, components) {
    if (source.query) {
        const items = components.queryItems;
        for (const name of source.query) {
            if (name === '') {
                // `href.li/?https://example.com`: the whole query is the URL.
                const query = components.query;
                if (query?.startsWith('http')) return query;
                continue;
            }
            const value = items.find((item) => item.name === name)?.value;
            if (value) return value;
        }
        return null;
    }
    const path = components.path;
    if (source.pathAfter !== undefined) {
        if (!path.startsWith(source.pathAfter)) return null;
        let rest = path.slice(source.pathAfter.length);
        const query = components.query;
        if (query) rest += `?${query}`;
        return rest || null;
    }
    const encodedPath = components.percentEncodedPath;
    if (source.lastPathSegment) return pathSegments(encodedPath).at(-1) ?? null;
    if (source.pathSegment !== undefined) {
        const prefix = source.pathSegment;
        const segment = pathSegments(encodedPath).find((s) => s.startsWith(prefix) && s.length > prefix.length);
        return segment === undefined ? null : segment.slice(prefix.length);
    }
    if (source.pathSegmentAfter !== undefined) {
        if (!encodedPath.startsWith(source.pathSegmentAfter)) return null;
        const segment = encodedPath.slice(source.pathSegmentAfter.length).split('/')[0];
        return segment || null;
    }
    const query = components.percentEncodedQuery;
    const fragment = components.percentEncodedFragment;
    if (source.pathAfterSegments !== undefined) {
        // "/x/c/token/https://example.com/a" after 3 → "https://example.com/a"
        let rest = encodedPath;
        for (let i = 0; i < source.pathAfterSegments; i++) {
            const slash = rest.startsWith('/') ? rest.indexOf('/', 1) : -1;
            if (slash < 0) return null;
            rest = rest.slice(slash);
        }
        if (!rest.startsWith('/')) return null;
        let out = rest.slice(1);
        if (query) out += `?${query}`;
        if (fragment) out += `#${fragment}`;
        return out || null;
    }
    // Proofpoint v3: /v3/__https://example.com/path?a=1__;Iw!!Hash$. The wrapped
    // URL keeps its own query, so read the whole string as written.
    let raw = encodedPath;
    if (query !== null) raw += `?${query}`;
    if (fragment !== null) raw += `#${fragment}`;
    if (!raw.startsWith('/v3/__')) return null;
    const payload = raw.slice(6);
    const close = payload.indexOf('__;', 1);
    if (close < 0) return null;
    const bang = payload.indexOf('!', close + 3);
    return payload.slice(0, bang < 0 ? payload.length : bang);
}

/**
 * A path's non-empty segments as written (still percent-encoded), so an
 * encoded `/` inside one stays inside it.
 *
 * @param {string} encodedPath
 * @returns {string[]}
 */
function pathSegments(encodedPath) {
    return encodedPath.split('/').filter(Boolean);
}

/**
 * The destination decoded (Redirects.decode); null when it can't be.
 *
 * @param {string} raw
 * @param {RedirectEncoding} encoding
 * @returns {string|null}
 */
function decode(raw, encoding) {
    if (typeof encoding === 'object') {
        // Base64 of a JSON object holding the URL at a key: Customer.io's {"href": …}.
        const text = base64Utf8(padBase64(removingPercentEncoding(raw) ?? raw));
        if (text === null) return null;
        let object;
        try {
            object = JSON.parse(text);
        } catch {
            return null;
        }
        const value = object !== null && typeof object === 'object' && !Array.isArray(object) ? object[encoding.base64JSON] : undefined;
        return typeof value === 'string' ? value : null;
    }
    switch (encoding) {
        case 'percent':
            // A query value is decoded once already. Google sometimes double-encodes,
            // CurseForge always does, and a path segment arrives still encoded.
            return HTTP_SCHEME.test(raw) ? raw : removingPercentEncoding(raw);
        case 'schemeless': {
            const stripped = raw.startsWith('/') ? raw.slice(1) : raw;
            // A destination starts with a host: "/amp/s/example.com/a", not Google's own "/amp/cache/overview".
            return /^[^/?#]+\.[^/?#.]+(?:[/?#:]|$)/.test(stripped) ? `https://${stripped}` : null;
        }
        case 'schemeOptional': {
            const url = decode(raw, 'percent');
            if (url === null || HTTP_SCHEME.test(url)) return url;
            return url.includes('://') ? null : decode(url, 'schemeless');
        }
        case 'bingBase64':
            // Bing prefixes base64url of the URL with "a1".
            return raw.startsWith('a1') ? base64Utf8(padBase64(raw.slice(2))) : null;
        case 'base64':
            return base64Utf8(padBase64(removingPercentEncoding(raw) ?? raw));
        case 'disqus': {
            // https://example.com/page:AbC12: Disqus's hash after the last colon,
            // past the scheme's; a port (all digits) is not one.
            const url = decode(raw, 'percent');
            if (url === null) return null;
            const scheme = url.indexOf('://');
            const colon = url.lastIndexOf(':');
            if (scheme < 0 || colon <= scheme) return url;
            const hash = url.slice(colon + 1);
            return /^[A-Za-z0-9_-]+$/.test(hash) && !/^[0-9]+$/.test(hash) ? url.slice(0, colon) : url;
        }
        case 'proofpointV2': {
            // `_` stands for `/`; `-XX` for `%XX`.
            const out = raw.replace(/_|-([0-9A-Fa-f０-９Ａ-Ｆａ-ｆ]{2})/gu,
                (match, hex) => (match === '_' ? '/' : `%${hex}`));
            return removingPercentEncoding(out) ?? out;
        }
        case 'proofpointV3':
            return proofpointV3(raw);
        default:
            return null;
    }
}

/** Proofpoint v3's run lengths: `**A` is 2 characters … `**_` is 65. */
const PROOFPOINT_RUNS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/**
 * Proofpoint v3, as its reference decoder (urldecoder.py) reads it:
 * `<url>__;<replacements>`, the URL percent-encoded, each `*` standing for
 * the next character of the base64url replacement list and `**X` for the
 * next 2…65 of them, by X's place in `A–Z a–z 0–9 - _`.
 *
 * @param {string} raw - What `extract` read: `<url>__;<replacements>`.
 * @returns {string|null}
 */
function proofpointV3(raw) {
    const split = raw.indexOf('__;');
    if (split < 0) return null;
    // A scheme written with one slash, "https:/example.com", gets its second.
    let url = raw.slice(0, split).replace(/^([A-Za-z0-9+.-]+:\/)([^/].)/, '$1/$2');
    url = removingPercentEncoding(url) ?? url;
    const chars = [...url];
    if (!chars.includes('*')) return url;
    const text = base64Utf8(padBase64(raw.slice(split + 3)));
    if (text === null) return null;
    const replacements = [...text];
    let out = '';
    let used = 0;
    for (let i = 0; i < chars.length;) {
        if (chars[i] !== '*') {
            out += chars[i++];
            continue;
        }
        let length = 1;
        if (i + 2 < chars.length && chars[i + 1] === '*') {
            const place = PROOFPOINT_RUNS.indexOf(chars[i + 2]);
            if (place < 0) return null;
            length = place + 2;
            i += 3;
        } else {
            i += 1;
        }
        if (used + length > replacements.length) return null;
        out += replacements.slice(used, used + length).join('');
        used += length;
    }
    return out;
}

/**
 * Base64 (standard or URL-safe) as Foundation reads it after Swift's
 * `base64Text` pads it: `-` and `_` swapped for `+` and `/`, `=` added up to
 * a multiple of four.
 *
 * @param {string} s
 * @returns {string}
 */
function padBase64(s) {
    let b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    while ([...b64].length % 4 !== 0) b64 += '=';
    return b64;
}

/**
 * Foundation's strict `Data(base64Encoded:)` then UTF-8: null for anything
 * outside the alphabet, bad padding, or bytes that aren't text.
 *
 * @param {string} b64
 * @returns {string|null}
 */
function base64Utf8(b64) {
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(b64)) return null;
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    try {
        return new TextDecoder('utf-8', {fatal: true}).decode(bytes);
    } catch {
        return null;
    }
}

// MARK: - Paths

/**
 * A path's tracking taken out, and what changed in words (Paths.clean).
 *
 * @typedef {{path: string, changes: string[]}} PathClean
 */

/**
 * The path without tracking for a normalised host, or null when unchanged.
 *
 * @param {string} path - Decoded.
 * @param {string} host
 * @returns {PathClean|null}
 */
function cleanPath(path, host) {
    if (matchesAny(host, [{kind: 'brand', value: 'amazon'}, {kind: 'exact', value: 'a.co'}])) return isSpared(host, 'Amazon') ? null : amazonPath(path);
    if (matchesAny(host, [{kind: 'brand', value: 'ebay'}])) return ebayPath(path);
    return null;
}

/**
 * Amazon carries attribution in path segments (`/ref=sr_1_3`) and wraps the
 * product id in a slug that changes with the title. A product needs only
 * `/dp/ASIN`, after a `/-/xx` locale prefix when there is one.
 *
 * @param {string} path
 * @returns {PathClean|null}
 */
function amazonPath(path) {
    /** @type {string[]} */
    const changes = [];
    let segments = path.split('/').filter(Boolean);
    const refs = segments.filter((s) => s.startsWith('ref='));
    if (refs.length) {
        segments = segments.filter((s) => !s.startsWith('ref='));
        changes.push(`removed /${refs.join(', /')}`);
    }
    const locale = segments.length >= 2 && segments[0] === '-' ? segments.slice(0, 2) : [];
    const id = asin(segments);
    if (id) {
        const canonical = [...locale, 'dp', id];
        if (canonical.join('/') !== segments.join('/')) {
            segments = canonical;
            changes.push(`canonicalised to /dp/${id}`);
        }
    }
    if (!changes.length) return null;
    return {path: segments.length ? `/${segments.join('/')}` : '/', changes};
}

/**
 * Swift's Character.isNumber, near enough (Numeric_Type ≈ \p{N}).
 *
 * @param {string} c - One character.
 * @returns {boolean}
 */
const isNumber = (c) => /^\p{N}$/u.test(c);
/**
 * Swift's `isLetter && isUppercase`.
 *
 * @param {string} c - One character.
 * @returns {boolean}
 */
const isUpperLetter = (c) => /^\p{Alphabetic}$/u.test(c) && /^\p{Uppercase}$/u.test(c);

/**
 * The ASIN in a product path: `/dp/X`, `/gp/product/X`, `/gp/aw/d/X`,
 * `/exec/obidos/ASIN/X`. Exactly ten upper-case letters and digits.
 *
 * @param {string[]} segments
 * @returns {string|null}
 */
function asin(segments) {
    /** @param {string} s */
    const isASIN = (s) => {
        const chars = [...s];
        return chars.length === 10 && chars.every((c) => isUpperLetter(c) || isNumber(c));
    };
    for (let i = 0; i + 1 < segments.length; i++) {
        const [s, next] = [segments[i], segments[i + 1]];
        if ((s === 'dp' || s === 'ASIN' || s === 'd') && isASIN(next)) return next;
        if (s === 'product' && i > 0 && segments[i - 1] === 'gp' && isASIN(next)) return next;
    }
    return null;
}

/**
 * eBay item URLs carry the title as a slug: `/itm/Some-Title/123456789012`
 * is `/itm/123456789012`.
 *
 * @param {string} path
 * @returns {PathClean|null}
 */
function ebayPath(path) {
    const segments = path.split('/').filter(Boolean);
    const i = segments.indexOf('itm');
    if (i < 0 || i + 2 >= segments.length) return null;
    const id = segments[i + 2];
    const digits = [...id];
    if (digits.length < 9 || !digits.every(isNumber)) return null;
    return {path: `/${[...segments.slice(0, i + 1), id].join('/')}`, changes: [`canonicalised to /itm/${id}`]};
}

// MARK: - Fragments

/**
 * Whether a (decoded) fragment is tracking. Anchors stay, and so do text
 * fragments (`#:~:text=`), which are what the user asked to highlight.
 *
 * @param {string} fragment
 * @returns {boolean}
 */
function isTrackingFragment(fragment) {
    const f = fragment.toLowerCase();
    if (!f) return false;
    if (f === '_=_') return true; // Facebook OAuth
    // "#utm_source=x" is tracking; "#utm_tutorial" is a heading.
    if (f.startsWith('xtor=') || /^\??utm_[^=]*=/.test(f)) return true;
    if (f.startsWith('echobox=') || f.startsWith('sthash.')) return true;
    if (f.startsWith('.')) { // AddThis: .abc.twitter
        const parts = f.split('.').filter(Boolean);
        if (parts.length >= 2 && FRAGMENT_SHARE_SUFFIXES.has(parts[parts.length - 1])) return true;
    }
    return false;
}
