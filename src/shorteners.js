/**
 * @module shorteners
 * @description Recognising short links (bit.ly, t.co, lnkd.in…): links
 * whose destination is kept on the shortener's server, so no offline clean
 * can show where they go. A port of swift-url-kit's `Shorteners.service(for:)`;
 * the table is in `data/shorteners.js`. Recognition only, never a request.
 *
 * Pure: no DOM, no network.
 */

import {SHORTENER_HOSTS} from './data/shorteners.js';
import {normaliseHost} from './clean.js';
import {URLComponents} from './url/components.js';

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
export function shortenerService(urlOrHost) {
    if (typeof urlOrHost !== 'string') return null;
    const text = urlOrHost.trim();
    const host = normaliseHost(text.includes('://') ? URLComponents.parse(text)?.host ?? null : text);
    if (host === null) return null;
    if (Object.hasOwn(SHORTENER_HOSTS, host)) return SHORTENER_HOSTS[host];
    const owner = Object.keys(SHORTENER_HOSTS)
        .filter((known) => host.endsWith(`.${known}`))
        .sort((a, b) => b.length - a.length)[0];
    return owner === undefined ? null : SHORTENER_HOSTS[owner];
}
