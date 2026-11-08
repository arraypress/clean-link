/**
 * @arraypress/clean-link
 *
 * Takes the tracking out of a link, offline: tracking query parameters,
 * redirect wrappers (google.com/url?q=, Outlook Safe Links, Facebook's
 * l.php…), Amazon's `/ref=` path segments and slugs (→ `/dp/ASIN`), eBay's
 * item slugs, and share fragments (`#xtor=`, AddThis). A port of
 * swift-url-kit's URLStripper, held to the Swift's own output for 500+ links.
 *
 * Zero dependencies. Works in any JS runtime with `URL`.
 *
 * @module @arraypress/clean-link
 */

export { cleanLink, withoutTracking } from './clean.js';
