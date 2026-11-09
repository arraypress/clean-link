/**
 * @module url/components
 * @description Foundation's `URLComponents(string:)`, as much of it as
 * swift-url-kit's cleaner leans on, so `clean.js` returns what the Swift
 * returns byte for byte.
 *
 * Not the WHATWG `URL` on purpose: that one lowercases hosts, adds a "/" path,
 * drops default ports and re-encodes queries, so a ported cleaner on top of it
 * would disagree with the Swift on most links. This one reads RFC 3986 the way
 * modern Foundation does: characters a component can't hold are
 * percent-encoded (`|` → `%7C`, `é` → `%C3%A9`, a stray `%` → `%25`), a
 * non-ASCII host becomes punycode, a host with a character it can't hold
 * fails. Every behaviour here was checked against Foundation (macOS 27); the
 * golden file in `tests/fixtures/golden.json` holds it to that.
 *
 * Pure: no DOM. `URL` is used only to punycode a non-ASCII host.
 */

const UNRESERVED = 'A-Za-z0-9\\-._~';
const SUB_DELIMS = "!$&'()*+,;=";
/**
 * Characters escaped for use inside a regex character class.
 *
 * @param {string} chars
 * @returns {string}
 */
const escapeClass = (chars) => chars.replace(/[\]\\^-]/g, '\\$&');

/** What each component holds without encoding (RFC 3986, as Foundation reads it). */
const ALLOWED = Object.freeze({
    user: new RegExp(`[${UNRESERVED}${escapeClass(SUB_DELIMS)}]`),
    password: new RegExp(`[${UNRESERVED}${escapeClass(SUB_DELIMS)}]`),
    host: new RegExp(`[${UNRESERVED}${escapeClass(SUB_DELIMS)}]`),
    path: new RegExp(`[${UNRESERVED}${escapeClass(`${SUB_DELIMS}:@/`)}]`),
    query: new RegExp(`[${UNRESERVED}${escapeClass(`${SUB_DELIMS}:@/?`)}]`),
    fragment: new RegExp(`[${UNRESERVED}${escapeClass(`${SUB_DELIMS}:@/?`)}]`),
});

const SCHEME = /^[A-Za-z][A-Za-z0-9+\-.]*$/;
const HEX = /^[0-9A-Fa-f]{2}$/;
const IP_LITERAL = /^\[[0-9A-Za-z:._~!$&'()*+,;=%-]*\]$/;
const INT64_MAX = 9223372036854775807n;
const utf8 = new TextEncoder();

/**
 * Percent-encode what a component can't hold, keeping valid `%XX` escapes
 * as they are (their hex case too).
 *
 * @param {string} text
 * @param {RegExp} allowed - One character that may stay.
 * @param {boolean} keepEscapes - False when `text` is already decoded (a setter).
 * @returns {string}
 */
function encode(text, allowed, keepEscapes) {
    let out = '';
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '%' && keepEscapes && HEX.test(text.slice(i + 1, i + 3))) {
            out += text.slice(i, i + 3);
            i += 2;
        } else if (c !== '%' && allowed.test(c)) {
            out += c;
        } else {
            const point = String.fromCodePoint(text.codePointAt(i) ?? 0);
            if (point.length === 2) i++;
            for (const byte of utf8.encode(point)) out += `%${byte.toString(16).toUpperCase().padStart(2, '0')}`;
        }
    }
    return out;
}

/**
 * Swift's `removingPercentEncoding`: null for a stray `%` or bytes that
 * aren't UTF-8.
 *
 * @param {string} text
 * @returns {string|null}
 */
export function removingPercentEncoding(text) {
    if (!text.includes('%')) return text;
    const bytes = [];
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '%') {
            const hex = text.slice(i + 1, i + 3);
            if (!HEX.test(hex)) return null;
            bytes.push(parseInt(hex, 16));
            i += 2;
        } else {
            const point = String.fromCodePoint(text.codePointAt(i) ?? 0);
            if (point.length === 2) i++;
            bytes.push(...utf8.encode(point));
        }
    }
    try {
        return new TextDecoder('utf-8', {fatal: true}).decode(new Uint8Array(bytes));
    } catch {
        return null;
    }
}

/**
 * A host as Foundation keeps it: valid ASCII as typed, non-ASCII as punycode
 * (and remembered, lowercased, for `host`), anything else a failure.
 *
 * @param {string} raw
 * @returns {{encoded: string, unicode: string|null}|null}
 */
function readHost(raw) {
    if (raw.startsWith('[')) return IP_LITERAL.test(raw) ? {encoded: raw, unicode: null} : null;
    // eslint-disable-next-line no-control-regex
    if (/[^\x00-\x7f]/.test(raw)) {
        try {
            const encoded = new URL(`http://${raw}/`).hostname;
            return encoded ? {encoded, unicode: raw.toLowerCase()} : null;
        } catch {
            return null;
        }
    }
    for (let i = 0; i < raw.length; i++) {
        if (raw[i] === '%') {
            if (!HEX.test(raw.slice(i + 1, i + 3))) return null;
            i += 2;
        } else if (!ALLOWED.host.test(raw[i])) {
            return null;
        }
    }
    return {encoded: raw, unicode: null};
}

/**
 * The parts of a URL string, percent-encoded as Foundation stores them.
 * Getters without "percentEncoded" decode, like Swift's.
 */
export class URLComponents {
    /**
     * `URLComponents(string:)`: null where Foundation returns nil.
     *
     * @param {string} string
     * @returns {URLComponents|null}
     */
    static parse(string) {
        const c = new URLComponents();
        let rest = string;
        /** Whether any part had to be encoded (or a host punycoded). */
        let encoded = false;

        // A scheme is everything before a ":" that comes before any "/?#".
        // A colon there that can't end a scheme ("1a:b") is a failure;
        // a leading one (":x") is just part of the path.
        const first = rest.search(/[:/?#]/);
        if (first > 0 && rest[first] === ':') {
            const scheme = rest.slice(0, first);
            if (!SCHEME.test(scheme)) return null;
            c.scheme = scheme;
            rest = rest.slice(first + 1);
        }

        if (rest.startsWith('//')) {
            const end = rest.slice(2).search(/[/?#]/);
            const authority = end < 0 ? rest.slice(2) : rest.slice(2, end + 2);
            rest = end < 0 ? '' : rest.slice(end + 2);

            // The last "@" ends the user info; any before it are encoded.
            let hostPort = authority;
            const at = authority.lastIndexOf('@');
            if (at >= 0) {
                const info = authority.slice(0, at);
                hostPort = authority.slice(at + 1);
                const colon = info.indexOf(':');
                const user = colon < 0 ? info : info.slice(0, colon);
                c.percentEncodedUser = encode(user, ALLOWED.user, true);
                c.percentEncodedPassword = colon < 0 ? null : encode(info.slice(colon + 1), ALLOWED.password, true);
                encoded ||= c.percentEncodedUser !== user || (colon >= 0 && c.percentEncodedPassword !== info.slice(colon + 1));
            }

            let rawHost = hostPort;
            let port = null;
            const close = hostPort.startsWith('[') ? hostPort.indexOf(']') : -1;
            if (hostPort.startsWith('[') && close < 0) return null;
            const colon = hostPort.indexOf(':', close < 0 ? 0 : close);
            if (colon >= 0) {
                rawHost = hostPort.slice(0, colon);
                port = hostPort.slice(colon + 1);
                if (!/^[0-9]*$/.test(port) || (port && BigInt(port) > INT64_MAX)) return null;
            }
            const host = readHost(rawHost);
            if (!host) return null;
            c.percentEncodedHost = host.encoded;
            c.unicodeHost = host.unicode;
            c.portText = port;
            encoded ||= host.unicode !== null;
        }

        const hash = rest.indexOf('#');
        if (hash >= 0) {
            c.percentEncodedFragment = encode(rest.slice(hash + 1), ALLOWED.fragment, true);
            encoded ||= c.percentEncodedFragment !== rest.slice(hash + 1);
            rest = rest.slice(0, hash);
        }
        const mark = rest.indexOf('?');
        if (mark >= 0) {
            c.percentEncodedQuery = encode(rest.slice(mark + 1), ALLOWED.query, true);
            encoded ||= c.percentEncodedQuery !== rest.slice(mark + 1);
            rest = rest.slice(0, mark);
        }
        c.percentEncodedPath = encode(rest, ALLOWED.path, true);
        encoded ||= c.percentEncodedPath !== rest;
        // Foundation writes a string it had to encode out again from its
        // parts, so the port comes back as a number: "host:/" → "host/",
        // ":080" → ":80".
        c.rebuilt = encoded;
        return c;
    }

    constructor() {
        /** @type {string|null} */ this.scheme = null;
        /** @type {string|null} */ this.percentEncodedUser = null;
        /** @type {string|null} */ this.percentEncodedPassword = null;
        /** @type {string|null} */ this.percentEncodedHost = null;
        /** @type {string|null} The host as typed when it was punycoded. */ this.unicodeHost = null;
        /** @type {string|null} The port as typed; "" for "host:". */ this.portText = null;
        /** @type {string} */ this.percentEncodedPath = '';
        /** @type {string|null} */ this.percentEncodedQuery = null;
        /** @type {string|null} */ this.percentEncodedFragment = null;
        // Foundation hands back the parsed string until a setter is used;
        // after that it rebuilds it, and the port is written as a number.
        this.rebuilt = false;
    }

    /** @returns {string|null} Decoded; Unicode for a punycoded host. */
    get host() {
        if (this.percentEncodedHost === null) return null;
        return this.unicodeHost ?? removingPercentEncoding(this.percentEncodedHost) ?? this.percentEncodedHost;
    }

    /** @returns {string} Decoded; "" when it doesn't decode, as Foundation does. */
    get path() {
        return removingPercentEncoding(this.percentEncodedPath) ?? '';
    }

    /** @param {string} path - Decoded. */
    set path(path) {
        this.percentEncodedPath = encode(path, ALLOWED.path, false);
        this.rebuilt = true;
    }

    /** @returns {string|null} Decoded; null when it doesn't decode. */
    get query() {
        return this.percentEncodedQuery === null ? null : removingPercentEncoding(this.percentEncodedQuery);
    }

    /** @returns {string|null} Decoded; null when it doesn't decode. */
    get fragment() {
        return this.percentEncodedFragment === null ? null : removingPercentEncoding(this.percentEncodedFragment);
    }

    /** @param {null} value - Only removing is needed. */
    set fragment(value) {
        this.percentEncodedFragment = value;
        this.rebuilt = true;
    }

    /** @returns {{name: string, value: string|null}[]|null} Split on "&" and the first "="; a name without "=" has a null value. */
    get percentEncodedQueryItems() {
        if (this.percentEncodedQuery === null) return null;
        if (this.percentEncodedQuery === '') return [];
        return this.percentEncodedQuery.split('&').map((item) => {
            const eq = item.indexOf('=');
            return eq < 0 ? {name: item, value: null} : {name: item.slice(0, eq), value: item.slice(eq + 1)};
        });
    }

    /** @param {{name: string, value: string|null}[]|null} items */
    set percentEncodedQueryItems(items) {
        this.percentEncodedQuery = items === null
            ? null
            : items.map(({name, value}) => (value === null ? name : `${name}=${value}`)).join('&');
        this.rebuilt = true;
    }

    /** @returns {{name: string, value: string|null}[]} Decoded; a name that doesn't decode is "", a value null. */
    get queryItems() {
        return (this.percentEncodedQueryItems ?? []).map(({name, value}) => ({
            name: removingPercentEncoding(name) ?? '',
            value: value === null ? null : removingPercentEncoding(value),
        }));
    }

    /** @returns {string} */
    get string() {
        let out = this.scheme === null ? '' : `${this.scheme}:`;
        if (this.percentEncodedHost !== null) {
            out += '//';
            if (this.percentEncodedUser !== null) {
                out += this.percentEncodedUser;
                if (this.percentEncodedPassword !== null) out += `:${this.percentEncodedPassword}`;
                out += '@';
            }
            out += this.percentEncodedHost;
            if (this.portText !== null) {
                if (!this.rebuilt) out += `:${this.portText}`;
                else if (this.portText !== '') out += `:${BigInt(this.portText)}`;
            }
        }
        out += this.percentEncodedPath;
        if (this.percentEncodedQuery !== null) out += `?${this.percentEncodedQuery}`;
        if (this.percentEncodedFragment !== null) out += `#${this.percentEncodedFragment}`;
        return out;
    }
}
