/**
 * @module data/affiliate
 * @description What credits a referrer for a sale: the parameters affiliate
 * programmes read, and the redirect pages that record the click on the way.
 * `keepAffiliate` keeps them, so someone who wants to support the creator
 * who shared a link can share it on with their credit intact. Everything
 * else (the click ids, search positions and share tokens around them) still
 * goes. JavaScript only: swift-url-kit has no such option (its nearest is
 * `CleanOptions.preserve`, a list of names).
 *
 * Data only; names are lowercased, as the cleaner compares them.
 */

/**
 * Affiliate programme → the parameters that carry its credit. Only names the
 * rules would otherwise remove are worth listing: elsewhere they're kept anyway.
 *
 * @type {Readonly<Record<string, readonly string[]>>}
 */
export const AFFILIATE_PARAMETERS = Object.freeze({
    'Amazon Associates': Object.freeze(['tag']),
    'eBay Partner Network': Object.freeze(['campid', 'customid', 'toolid', 'mkcid', 'mkrid', 'mkevt']),
    'Awin': Object.freeze(['awc', 'zanpid']),
    'CJ': Object.freeze(['cjevent', 'cjdata']),
    'Rakuten Advertising': Object.freeze(['ranmid', 'raneaid', 'ransiteid']),
    'Impact': Object.freeze(['irclickid', 'irgwc']),
    'AliExpress Portals': Object.freeze(['aff_fcid', 'aff_fsk', 'aff_platform', 'aff_trace_key']),
    'Booking.com Affiliate Partner': Object.freeze(['aid']),
    'Target Partners': Object.freeze(['afid']),
    'Walmart Affiliates': Object.freeze(['u1']),
    'Other networks': Object.freeze(['affid', 'aff_id', 'affiliate_id']),
});

/**
 * Redirect pages (their `label` in `REDIRECT_RULES`) that are an affiliate
 * network recording the click: unwrapping one skips the credit.
 *
 * @type {ReadonlySet<string>}
 */
export const AFFILIATE_REDIRECTS = Object.freeze(new Set(['Rakuten', 'eBay']));
