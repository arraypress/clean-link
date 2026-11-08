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

import {FRAGMENT_SHARE_SUFFIXES, GLOBAL_PARAMETERS, HOST_RULES, REDIRECT_RULES} from './data/rules.js';
import {removingPercentEncoding, URLComponents} from './url/components.js';

/** How many nested redirects to peel: a Gmail link to a Safe Link to a page is three. */
const MAXIMUM_UNWRAPS = 3;

/** Foundation's `.whitespacesAndNewlines`, for trimming. */
const TRIM = /^[\p{Z}\t\n\v\f\r\u0085]+|[\p{Z}\t\n\v\f\r\u0085]+$/gu;
/** Swift's `Character.isWhitespace`. */
const WHITESPACE = /\p{White_Space}/u;

/** Flattened for one-pass matching (GlobalParameters.flat). */
const GLOBAL_FLAT = Object.values(GLOBAL_PARAMETERS).flat();

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
export function cleanLink(url) {
    if (typeof url !== 'string') return null;
    const trimmed = url.replace(TRIM, '');
    const parts = WHITESPACE.test(trimmed) ? null : URLComponents.parse(trimmed);
    if (!parts || !/^https?$/i.test(parts.scheme ?? '') || !parts.host) return null;
    const cleaned = withoutTracking(trimmed);
    // The same link only re-written by Foundation (`|` as `%7C`, "host:/" as
    // "host/") isn't worth swapping in for the user's.
    parts.rebuilt = true;
    return cleaned === trimmed || cleaned === parts.string ? null : cleaned;
}

/**
 * Swift's `String.withoutTracking`, exactly: any string in, the cleaned
 * string out (unchanged when there's nothing to clean). Strings that aren't
 * URLs still lose `utm_*` and the other global names.
 *
 * @param {string} input
 * @returns {string}
 */
export function withoutTracking(input) {
    const trimmed = input.replace(TRIM, '');
    if (!trimmed) return input;
    // A URL can't contain whitespace; Foundation would encode it anyway and
    // rewrite text that was never a URL. Those get the by-hand fallback.
    let components = WHITESPACE.test(trimmed) ? null : URLComponents.parse(trimmed);
    if (!components) return fallback(input, trimmed);

    // 1. Redirects, outermost first.
    for (let unwraps = 0; unwraps < MAXIMUM_UNWRAPS; unwraps++) {
        const target = unwrap(components);
        if (!target) break;
        components = target;
    }

    const host = normaliseHost(components.host);
    const rules = host === null ? [] : HOST_RULES.filter((rule) => matchesAny(host, rule.hosts) && !matchesAny(host, rule.excluding ?? []));

    // 2. Query. Work on the percent-encoded items so kept parameters come
    //    back byte for byte: `+` stays `+`, `%20` stays `%20`.
    const items = components.percentEncodedQueryItems;
    if (items) {
        const kept = items.filter((item) => {
            const name = (removingPercentEncoding(item.name) ?? item.name).toLowerCase();
            return !matchesParameter(name, GLOBAL_FLAT) && !rules.some((rule) => matchesParameter(name, rule.parameters));
        });
        components.percentEncodedQueryItems = kept.length ? kept : null;
    }

    // 3. Path.
    if (host !== null) {
        const path = cleanPath(components.path, host);
        if (path !== null) components.path = path;
    }

    // 4. Fragment.
    const fragment = components.fragment;
    if (fragment !== null && isTrackingFragment(fragment)) components.fragment = null;

    return components.string;
}

// MARK: - Fallback

/**
 * For strings Foundation refuses (spaces, stray characters): split on `?`
 * and `&` by hand and apply only the host-independent rules.
 *
 * @param {string} original
 * @param {string} s - Trimmed.
 * @returns {string}
 */
function fallback(original, s) {
    const q = s.indexOf('?');
    if (q < 0) return original;
    const base = s.slice(0, q);
    let rest = s.slice(q + 1);
    let fragment = '';
    const hash = rest.indexOf('#');
    if (hash >= 0) {
        fragment = rest.slice(hash);
        rest = rest.slice(0, hash);
    }
    const kept = rest.split('&').filter((pair) => {
        // Swift's `split(separator: "=", maxSplits: 1).first` skips empty
        // pieces, so "=utm_source" is named utm_source.
        const name = (pair.split('=').find((piece) => piece !== '') ?? pair).toLowerCase();
        return !matchesParameter(name, GLOBAL_FLAT);
    });
    return base + (kept.length ? `?${kept.join('&')}` : '') + fragment;
}

// MARK: - HostMatcher

/**
 * Lowercased, no trailing dot, no `www.`; null for none or empty.
 *
 * @param {string|null} host
 * @returns {string|null}
 */
function normaliseHost(host) {
    if (!host) return null;
    let h = host.toLowerCase();
    if (h.endsWith('.')) h = h.slice(0, -1);
    if (h.startsWith('www.')) h = h.slice(4);
    return h;
}

/**
 * @param {string} host - Normalised.
 * @param {{kind: string, value: string}[]} patterns
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
 * @param {{kind: string, value: string}[]} patterns
 * @returns {boolean}
 */
function matchesParameter(name, patterns) {
    return patterns.some(({kind, value}) => (kind === 'exact' ? name === value : name.startsWith(value)));
}

// MARK: - Redirects

/**
 * The destination a redirect URL carries, or null when it isn't one.
 *
 * @param {URLComponents} components
 * @returns {URLComponents|null}
 */
function unwrap(components) {
    const host = normaliseHost(components.host);
    if (host === null) return null;
    const path = components.path;
    for (const rule of REDIRECT_RULES) {
        if (!matchesAny(host, rule.hosts)) continue;
        if (rule.pathPrefix && !path.startsWith(rule.pathPrefix)) continue;
        const raw = extract(rule.source, components);
        const decoded = raw === null ? null : decode(raw, rule.encoding ?? 'percent');
        const target = decoded === null ? null : URLComponents.parse(decoded);
        // Only http(s): a redirect to `javascript:` stays wrapped.
        if (!target || !/^https?$/.test(target.scheme?.toLowerCase() ?? '') || !target.host) continue;
        return target;
    }
    return null;
}

/**
 * @param {{query?: string[], pathAfter?: string, proofpointV3?: boolean}} source
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
    // Proofpoint v3: /v3/__https://example.com/path__;!!Hash$
    const open = path.indexOf('__');
    const close = open < 0 ? -1 : path.indexOf('__;', open + 2);
    return close < 0 ? null : path.slice(open + 2, close);
}

/**
 * @param {string} raw
 * @param {'percent'|'schemeless'|'bingBase64'|'proofpointV2'} encoding
 * @returns {string|null}
 */
function decode(raw, encoding) {
    switch (encoding) {
        case 'percent':
            // Already decoded once as a query value; Google sometimes double-encodes.
            return raw.startsWith('http') ? raw : removingPercentEncoding(raw);
        case 'schemeless': {
            const stripped = raw.startsWith('/') ? raw.slice(1) : raw;
            return stripped ? `https://${stripped}` : null;
        }
        case 'bingBase64': {
            // Bing prefixes base64url of the URL with "a1".
            if (!raw.startsWith('a1')) return null;
            let b64 = raw.slice(2).replace(/-/g, '+').replace(/_/g, '/');
            while ([...b64].length % 4 !== 0) b64 += '=';
            return base64Utf8(b64);
        }
        case 'proofpointV2': {
            // `_` stands for `/`; `-XX` for `%XX`.
            const out = raw.replace(/_|-([0-9A-Fa-f０-９Ａ-Ｆａ-ｆ]{2})/gu,
                (match, hex) => (match === '_' ? '/' : `%${hex}`));
            return removingPercentEncoding(out) ?? out;
        }
        default:
            return null;
    }
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
 * The path without tracking for a normalised host, or null when unchanged.
 *
 * @param {string} path - Decoded.
 * @param {string} host
 * @returns {string|null}
 */
function cleanPath(path, host) {
    if (matchesAny(host, [{kind: 'brand', value: 'amazon'}, {kind: 'exact', value: 'a.co'}])) return amazonPath(path);
    if (matchesAny(host, [{kind: 'brand', value: 'ebay'}])) return ebayPath(path);
    return null;
}

/**
 * Amazon carries attribution in path segments (`/ref=sr_1_3`) and wraps the
 * product id in a slug that changes with the title. A product needs only
 * `/dp/ASIN`, after a `/-/xx` locale prefix when there is one.
 *
 * @param {string} path
 * @returns {string|null}
 */
function amazonPath(path) {
    let changed = false;
    let segments = path.split('/').filter(Boolean);
    if (segments.some((s) => s.startsWith('ref='))) {
        segments = segments.filter((s) => !s.startsWith('ref='));
        changed = true;
    }
    const locale = segments.length >= 2 && segments[0] === '-' ? segments.slice(0, 2) : [];
    const id = asin(segments);
    if (id) {
        const canonical = [...locale, 'dp', id];
        if (canonical.join('/') !== segments.join('/')) {
            segments = canonical;
            changed = true;
        }
    }
    if (!changed) return null;
    return segments.length ? `/${segments.join('/')}` : '/';
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
 * @returns {string|null}
 */
function ebayPath(path) {
    const segments = path.split('/').filter(Boolean);
    const i = segments.indexOf('itm');
    if (i < 0 || i + 2 >= segments.length) return null;
    const id = segments[i + 2];
    const digits = [...id];
    if (digits.length < 9 || !digits.every(isNumber)) return null;
    return `/${[...segments.slice(0, i + 1), id].join('/')}`;
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
    if (f.startsWith('xtor=') || f.startsWith('utm_') || f.startsWith('?utm_')) return true;
    if (f.startsWith('echobox=') || f.startsWith('sthash.')) return true;
    if (f.startsWith('.')) { // AddThis: .abc.twitter
        const parts = f.split('.').filter(Boolean);
        if (parts.length >= 2 && FRAGMENT_SHARE_SUFFIXES.has(parts[parts.length - 1])) return true;
    }
    return false;
}
