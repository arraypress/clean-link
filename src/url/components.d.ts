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
/**
 * Swift's `removingPercentEncoding`: null for a stray `%` or bytes that
 * aren't UTF-8.
 *
 * @param {string} text
 * @returns {string|null}
 */
export declare function removingPercentEncoding(text: string): string | null;
/**
 * The parts of a URL string, percent-encoded as Foundation stores them.
 * Getters without "percentEncoded" decode, like Swift's.
 */
export declare class URLComponents {
    /** @type {string|null} */ scheme: string | null;
    /** @type {string|null} */ percentEncodedUser: string | null;
    /** @type {string|null} */ percentEncodedPassword: string | null;
    /** @type {string|null} */ percentEncodedHost: string | null;
    /** @type {string|null} The host as typed when it was punycoded. */ unicodeHost: string | null;
    /** @type {string|null} The port as typed; "" for "host:". */ portText: string | null;
    /** @type {string} */ percentEncodedPath: string;
    /** @type {string|null} */ percentEncodedQuery: string | null;
    /** @type {string|null} */ percentEncodedFragment: string | null;
    rebuilt: boolean;
    /**
     * `URLComponents(string:)`: null where Foundation returns nil.
     *
     * @param {string} string
     * @returns {URLComponents|null}
     */
    static parse(string: string): URLComponents | null;
    constructor();
    /** @returns {string|null} Decoded; Unicode for a punycoded host. */
    get host(): string | null;
    /** @returns {string} Decoded; "" when it doesn't decode, as Foundation does. */
    get path(): string;
    /** @param {string} path - Decoded. */
    set path(path: string);
    /** @returns {string|null} Decoded; null when it doesn't decode. */
    get query(): string | null;
    /** @returns {string|null} Decoded; null when it doesn't decode. */
    get fragment(): string | null;
    /** @param {null} value - Only removing is needed. */
    set fragment(value: null);
    /** @returns {{name: string, value: string|null}[]|null} Split on "&" and the first "="; a name without "=" has a null value. */
    get percentEncodedQueryItems(): {
        name: string;
        value: string | null;
    }[] | null;
    /** @param {{name: string, value: string|null}[]|null} items */
    set percentEncodedQueryItems(items: {
        name: string;
        value: string | null;
    }[] | null);
    /** @returns {{name: string, value: string|null}[]} Decoded; a name that doesn't decode is "", a value null. */
    get queryItems(): {
        name: string;
        value: string | null;
    }[];
    /** @returns {string} */
    get string(): string;
}
