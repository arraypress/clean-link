/**
 * @arraypress/clean-link
 *
 * Takes the tracking out of a link, offline: tracking query parameters,
 * redirect wrappers (google.com/url?q=, Outlook Safe Links, Facebook's
 * l.php…), Amazon's `/ref=` path segments and slugs (→ `/dp/ASIN`), eBay's
 * item slugs, and share fragments (`#xtor=`, AddThis). Says what it took out
 * and why (`cleanReport`), can leave affiliate credit in place
 * (`keepAffiliate`), and recognises short links whose destination only
 * their server knows (`shortenerService`). A port of swift-url-kit's
 * URLStripper, held to the Swift's own output for 500+ links.
 *
 * Zero dependencies. Works in any JS runtime with `URL`.
 *
 * @module @arraypress/clean-link
 */

export { cleanLink, cleanReport, withoutTracking } from './clean.js';
export { shortenerService } from './shorteners.js';
export { AFFILIATE_PARAMETERS } from './data/affiliate.js';
export { SHORTENER_HOSTS } from './data/shorteners.js';

/**
 * The public types, for a caller's JSDoc.
 *
 * @typedef {import('./clean.js').CleanOptions} CleanOptions
 * @typedef {import('./clean.js').CleanReport} CleanReport
 * @typedef {import('./clean.js').RemovedParameter} RemovedParameter
 * @typedef {import('./clean.js').SignedScheme} SignedScheme
 * @typedef {import('./clean.js').TrackingCategory} TrackingCategory
 */
