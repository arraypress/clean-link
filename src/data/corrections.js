/**
 * @module data/corrections
 * @description Where this port is more careful than swift-url-kit 0.2.0:
 * names a site's rule removes that one of its pages reads, and hosts a
 * brand rule catches that aren't the brand's shop. JavaScript only, so none
 * of it is in the golden files; each is worth taking back to the Swift
 * (`HostRules.swift`), after which it belongs in `rules.js`.
 *
 * Data only; names and paths are lowercased, as the cleaner compares them.
 */

/**
 * Site (a `HOST_RULES` label) → the names its rule removes that some of its
 * pages need, with the path fragments of those pages:
 *
 * - Bing Maps reads `sp` as the pins on the map (`sp=point.47.6_-122.3_Name`);
 *   on a search it is the suggestion's position.
 * - Facebook's old event pages are found by `eid` (`/event.php?eid=…`).
 * - A LinkedIn Learning link shared by its teacher opens the course with
 *   `courseClaim`.
 *
 * @type {Readonly<Record<string, Readonly<Record<string, readonly string[]>>>>}
 */
export const SITE_KEPT_ON_PATHS = Object.freeze({
    'Bing': Object.freeze({sp: Object.freeze(['/maps'])}),
    'Facebook': Object.freeze({eid: Object.freeze(['/event.php'])}),
    'LinkedIn': Object.freeze({courseclaim: Object.freeze(['/learning/'])}),
});

/**
 * Site (a `HOST_RULES` label) → hosts its rule matches that it must leave
 * alone, as suffixes. Amazon's brand rule matches `aws.amazon.com` and the
 * AWS console, where `tag`, `ref` and `th` are the page's own (a resource's
 * tags, a marketplace filter), and where no path is a product's.
 *
 * @type {Readonly<Record<string, readonly string[]>>}
 */
export const SITE_SPARED_HOSTS = Object.freeze({
    'Amazon': Object.freeze(['aws.amazon.com', 'aws.amazon.cn']),
});
