/**
 * @module shorteners
 * @description Recognising short links (bit.ly, t.co, lnkd.in…): links
 * whose destination is kept on the shortener's server, so no offline clean
 * can show where they go. A port of swift-url-kit's `Shorteners.service(for:)`;
 * the table is in `data/shorteners.js`. Recognition only, never a request.
 *
 * Pure: no DOM, no network.
 */
/**
 * The shortener service behind a link or host ("Bitly", "Twitter/X"), or null
 * when it isn't a known shortener. A subdomain of a shortener counts (only
 * its owner can make one); where two entries fit, the longer host wins
 * (`maps.app.goo.gl` is Google Maps, not Google).
 *
 * @param {string} urlOrHost - A link (`https://bit.ly/abc`) or a bare host
 *   (`bit.ly`, `www.bit.ly`); case and a trailing dot don't matter.
 * @returns {string|null} The service's name, or null.
 * @example
 * shortenerService('https://bit.ly/3xYz');       // 'Bitly'
 * shortenerService('maps.app.goo.gl');           // 'Google Maps'
 * shortenerService('https://example.com/bit.ly'); // null
 */
export declare function shortenerService(urlOrHost: string): string | null;
