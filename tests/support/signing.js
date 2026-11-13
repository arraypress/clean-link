/**
 * Signed links for the tests, made and checked here the way each service
 * documents it, with made-up keys: a link "verifies" when the signature
 * worked out again from the link as it now is equals the one it carries.
 * That is what the service does when the link is opened, so a clean that
 * stops a link verifying has stopped it opening. Nothing is fetched.
 *
 * @module tests/support/signing
 */

import {createHash, createHmac} from 'node:crypto';

/**
 * A way of signing links: `sign` makes one from an address and its query,
 * `verify` says whether a link still carries the right signature.
 *
 * @typedef {{sign: (base: string, query: string) => string, verify: (url: string) => boolean}} Scheme
 */

/**
 * @param {string | Buffer} key
 * @param {string} text
 * @returns {Buffer} HMAC-SHA256.
 */
const hmac = (key, text) => createHmac('sha256', key).update(text).digest();

/**
 * @param {string} text
 * @returns {string} Percent-encoded as RFC 3986 says (AWS's UriEncode).
 */
const encode = (text) => encodeURIComponent(text).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

/**
 * @param {string} url
 * @returns {[string, string]} The address before the `?`, and the query as written.
 */
function split(url) {
    const [whole] = url.split('#');
    const at = whole.indexOf('?');
    return at < 0 ? [whole, ''] : [whole.slice(0, at), whole.slice(at + 1)];
}

/**
 * @param {string} query - As written.
 * @returns {[string, string][]} Name and value of each parameter, still encoded.
 */
function pairs(query) {
    return query.split('&').filter(Boolean).map((pair) => {
        const eq = pair.indexOf('=');
        return eq < 0 ? [pair, ''] : [pair.slice(0, eq), pair.slice(eq + 1)];
    });
}

/**
 * @param {string} query - As written.
 * @param {string} name
 * @returns {string | undefined} The parameter's value, still encoded.
 */
const valueOf = (query, name) => pairs(query).find(([key]) => key === name)?.[1];

/**
 * A scheme that appends `name=<signature>`, the signature worked out by
 * `mac` from the address and the query without that parameter.
 *
 * @param {string} name - The signature's parameter.
 * @param {(base: string, query: string) => string} mac - The signature for an address and the rest of its query, as written.
 * @returns {Scheme}
 */
function appended(name, mac) {
    return {
        sign: (base, query) => `${base}?${query}&${name}=${mac(base, query)}`,
        verify(url) {
            const [base, query] = split(url);
            const rest = query.split('&').filter((pair) => pair.split('=')[0] !== name).join('&');
            return valueOf(query, name) === mac(base, rest);
        },
    };
}

const AWS = {id: 'AKIAIOSFODNN7EXAMPLE', secret: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', region: 'eu-west-2', date: '20261113', time: '20261113T100000Z'};

/**
 * AWS Signature V4 for a presigned S3 GET: the canonical request holds
 * every query parameter, sorted, so one more or one fewer changes it.
 */
export const s3 = appended('X-Amz-Signature', (base, query) => {
    const {pathname, host} = new URL(base);
    const canonicalQuery = pairs(query)
        .map(([name, value]) => `${encode(decodeURIComponent(name))}=${encode(decodeURIComponent(value))}`)
        .sort()
        .join('&');
    const request = ['GET', pathname, canonicalQuery, `host:${host}\n`, 'host', 'UNSIGNED-PAYLOAD'].join('\n');
    const scope = `${AWS.date}/${AWS.region}/s3/aws4_request`;
    const toSign = ['AWS4-HMAC-SHA256', AWS.time, scope, createHash('sha256').update(request).digest('hex')].join('\n');
    const key = [AWS.date, AWS.region, 's3', 'aws4_request'].reduce((k, part) => hmac(k, part), /** @type {string | Buffer} */ (`AWS4${AWS.secret}`));
    return hmac(key, toSign).toString('hex');
});

/** The query every presigned S3 link here carries before its signature. */
export const S3_QUERY = `X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=${encode(`${AWS.id}/${AWS.date}/${AWS.region}/s3/aws4_request`)}&X-Amz-Date=${AWS.time}&X-Amz-Expires=3600&X-Amz-SignedHeaders=host`;

/** Laravel's signed routes: HMAC-SHA256 of the URL as written, without `signature`. */
export const laravel = appended('signature', (base, query) => hmac('base64:local-test-key', query ? `${base}?${query}` : base).toString('hex'));

/** Shopify's OAuth callback: HMAC-SHA256 of every other parameter, decoded and sorted. */
export const shopify = appended('hmac', (_base, query) => hmac('shpss_local', pairs(query).map(([name, value]) => `${decodeURIComponent(name)}=${decodeURIComponent(value)}`).sort().join('&')).toString('hex'));

/** imgix: MD5 of the token, the path and the query as written. */
export const imgix = appended('s', (base, query) => createHash('md5').update(`localtoken${new URL(base).pathname}${query ? `?${query}` : ''}`).digest('hex'));

/**
 * Azure Blob SAS: the signature covers the SAS's own fields and the blob,
 * not the rest of the query, so other parameters come and go freely.
 */
export const azure = appended('sig', (base, query) => {
    const fields = ['sp', 'st', 'se', 'spr', 'sv', 'sr'].map((name) => decodeURIComponent(valueOf(query, name) ?? ''));
    return encode(hmac('azure-local-key', [new URL(base).pathname, ...fields].join('\n')).toString('base64'));
});
