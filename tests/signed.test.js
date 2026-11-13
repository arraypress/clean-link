/**
 * Signed links: a signature that covers the whole query is reported
 * (`report.signed`) and, when asked (`keepSigned`), the link is left alone.
 * The links are signed and checked by `support/signing.js`, the way each
 * service does it, so "stops verifying" here is "stops opening" there.
 *
 * @module tests/signed
 */

import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import {cleanLink, cleanReport, withoutTracking} from '../src/index.js';
import {azure, imgix, laravel, S3_QUERY, s3, shopify} from './support/signing.js';

const S3 = 'https://reports-bucket.s3.eu-west-2.amazonaws.com/2026/Q3%20report%20%28final%29.pdf';
const DISPOSITION = 'response-content-disposition=attachment%3B%20filename%3D%22Q3%20report.pdf%22';
const VERIFY = 'https://app.example.com/email/verify/42/9b1de';
const VERIFY_QUERY = 'expires=1794650000&redirect=%2Fteam%2Fa+b%7Cc';
const CALLBACK = 'https://app.example.com/auth/callback';
const CALLBACK_QUERY = 'code=0907a61c0c8d55e99db179b68161bc00&host=YWRtaW4uc2hvcGlmeS5jb20vc3RvcmUveA&shop=x.myshopify.com&state=0.6784241404160823&timestamp=1794640000';
const IMAGE = 'https://acme.imgix.net/photos/cat.jpg';
const IMAGE_QUERY = 'w=800&h=600&fit=crop&txt=Hello%20world';
const BLOB = 'https://acme.blob.core.windows.net/docs/report.pdf';
const BLOB_QUERY = 'sv=2024-11-04&st=2026-11-13T10%3A00%3A00Z&se=2026-11-14T10%3A00%3A00Z&sr=b&sp=r&spr=https';

/**
 * A finished link with a parameter put in at the start, in the middle or at
 * the end of its query, as a mail tool or a share button adds one.
 *
 * @param {string} url
 * @param {'start' | 'middle' | 'end'} where
 * @param {string} [parameter]
 * @returns {string}
 */
function tagged(url, where, parameter = 'utm_source=newsletter') {
    const [base, query] = url.split('?');
    const parts = query.split('&');
    parts.splice({start: 0, middle: Math.ceil(parts.length / 2), end: parts.length}[where], 0, parameter);
    return `${base}?${parts.join('&')}`;
}

/** Each whole-query scheme: a link signed as its service signs it, and the name it is reported by. */
const SCHEMES = [
    {scheme: s3, name: 'AWS Signature V4', base: S3, query: `${DISPOSITION}&${S3_QUERY}`},
    {scheme: laravel, name: 'Laravel', base: VERIFY, query: VERIFY_QUERY},
    {scheme: shopify, name: 'Shopify', base: CALLBACK, query: CALLBACK_QUERY},
    {scheme: imgix, name: 'imgix', base: IMAGE, query: IMAGE_QUERY},
];

describe('signed links (the signers are the services’ own arithmetic)', () => {
    it('the fixtures sign as the services do: fixed links, and a changed query stops verifying', () => {
        assert.equal(s3.sign(S3, `${DISPOSITION}&${S3_QUERY}`), `${S3}?${DISPOSITION}&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F20261113%2Feu-west-2%2Fs3%2Faws4_request&X-Amz-Date=20261113T100000Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=bb424d46c444eb1e145c51a9c429986cc9a2143f842fdf8dff0859165bb1472f`);
        assert.equal(laravel.sign(VERIFY, VERIFY_QUERY), `${VERIFY}?${VERIFY_QUERY}&signature=40db86102c84f377cc74fa69e66073491e6123c9ba3fb50db0493e1379565e6f`);
        assert.equal(shopify.sign(CALLBACK, CALLBACK_QUERY), `${CALLBACK}?${CALLBACK_QUERY}&hmac=1cc0305dc60d4e81f76e997093ee57fec6e1629d1e9923b7b46e318440bf1d2c`);
        assert.equal(imgix.sign(IMAGE, IMAGE_QUERY), `${IMAGE}?${IMAGE_QUERY}&s=6f6ef646d4aabeca33f656b295179e8a`);
        for (const {scheme, base, query} of SCHEMES) {
            const link = scheme.sign(base, query);
            assert.equal(scheme.verify(link), true, link);
            assert.equal(scheme.verify(tagged(link, 'end')), false, link);
        }
    });
});

describe('cleanReport: signed', () => {
    for (const {scheme, name, base, query} of SCHEMES) {
        it(`names ${name}, with tracking in the link or not`, () => {
            const link = scheme.sign(base, query);
            assert.equal(cleanReport(link).signed, name);
            assert.equal(cleanReport(tagged(link, 'middle')).signed, name);
            assert.equal(cleanReport(`https://www.google.com/url?q=${encodeURIComponent(link)}&sa=D`).signed, name);
        });
    }

    it('names the schemes known by their parameters alone', () => {
        assert.equal(cleanReport('https://storage.googleapis.com/bucket/file.pdf?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=sa%40p.iam.gserviceaccount.com%2F20261113%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20261113T100000Z&X-Goog-Expires=900&X-Goog-SignedHeaders=host&X-Goog-Signature=5f0a').signed, 'Google Cloud Storage');
        assert.equal(cleanReport('https://api.example.com/1/photos?oauth_consumer_key=dpf43f3p2l4k3l03&oauth_nonce=kllo9940pd9333jh&oauth_signature=tR3%2BTy81lMeYAr%2FFid0kMTYa%2FWM%3D&oauth_signature_method=HMAC-SHA1&oauth_timestamp=1191242096&size=original').signed, 'OAuth 1.0');
        assert.equal(cleanReport('https://shop.example.com/apps/proxy?shop=x.myshopify.com&path_prefix=%2Fapps%2Fproxy&timestamp=1794640000&signature=a9718877bea71c2484f91608a7eaea1532bdf71f5c56825065fa4ccabe549ef3').signed, 'Shopify');
        assert.equal(cleanReport('https://app.example.com/unsubscribe/42?signature=40db86102c84f377cc74fa69e66073491e6123c9ba3fb50db0493e1379565e6f').signed, 'Laravel');
        assert.equal(cleanReport('https://maps.googleapis.com/maps/api/staticmap?center=London&zoom=12&size=400x400&client=gme-acme&signature=YWJjZGVmZ2hpamtsbW5vcHFyc3Q=').signed, 'Google Maps');
    });

    /** @type {[string, string][]} */
    const unsigned = [
        ['https://shop.example.com/search?state=CA&code=SAVE10&policy=returns&expires=never&utm_source=newsletter', 'a shop’s search with sign-in-sounding names'],
        ['https://example.com/petition?signature=Jane+Doe&expires=never', 'a signature that is a name'],
        ['https://example.com/doc?signature=40db86102c84f377cc74fa69e66073491e6123c9ba3fb50db0493e1379565e6f&expires=never', 'a hex signature whose expires is not a time'],
        ['https://example.com/search?s=6f6ef646d4aabeca33f656b295179e8a', 'a 32-digit s away from imgix'],
        ['https://acme.imgix.net/photos/cat.jpg?w=800&s=cats', 'an imgix s that is not a signature'],
        ['https://app.example.com/oauth/callback?code=4%2F0AfJohXn-abc&state=xyz123&utm_source=google', 'an OAuth 2 callback (a code to look up)'],
        ['https://app.example.com/users/password/edit?reset_password_token=abcdef&utm_source=transactional', 'a password reset (a token to look up)'],
        ['https://example.com/a?X-Amz-Signature=abc', 'X-Amz-Signature with no algorithm'],
        ['https://example.com/a?hmac=1cc0305dc60d4e81f76e997093ee57fec6e1629d1e9923b7b46e318440bf1d2c', 'an hmac without Shopify’s shop and timestamp'],
        // Signed, but over named fields only: other parameters come and go.
        [azure.sign(BLOB, BLOB_QUERY), 'an Azure SAS'],
        ['https://d111111abcdef8.cloudfront.net/private/video.mp4?Expires=1794650000&Signature=nitfHRCrtziwO2HwPfWw~yYDhUF5EwRunQA-j19DzZr&Key-Pair-Id=K2JCJMDEHXQW5F', 'a CloudFront signed URL'],
        ['https://bucket.s3.amazonaws.com/file.pdf?AWSAccessKeyId=AKIAIOSFODNN7EXAMPLE&Expires=1794650000&Signature=vjbyPxybdZaNmGa%2ByT272YEAiv4%3D', 'AWS Signature V2'],
        ['see example.com?signature=40db86102c84f377cc74fa69e66073491e6123c9ba3fb50db0493e1379565e6f', 'text that is not a link'],
    ];
    for (const [url, what] of unsigned) {
        it(`does not call ${what} signed`, () => assert.equal(cleanReport(url).signed, null));
    }

    it('an Azure SAS verifies with a tracker and without: nothing to guard', () => {
        const link = azure.sign(BLOB, BLOB_QUERY);
        for (const where of /** @type {const} */ (['start', 'end'])) {
            assert.equal(azure.verify(tagged(link, where)), true);
            assert.equal(withoutTracking(tagged(link, where), {keepSigned: true}), link);
            assert.equal(azure.verify(link), true);
        }
    });
});

describe('cleaning a signed link', () => {
    for (const {scheme, name, base, query} of SCHEMES) {
        it(`${name}: a tracker added after signing is taken out byte for byte, and the link verifies again`, () => {
            const link = scheme.sign(base, query);
            for (const where of /** @type {const} */ (['start', 'middle', 'end'])) {
                const broken = tagged(link, where, where === 'end' ? 'fbclid=IwAR0abc' : undefined);
                assert.equal(scheme.verify(broken), false);
                assert.equal(withoutTracking(broken), link);
                assert.equal(cleanLink(broken), link);
            }
        });

        it(`${name}: a tracker that was signed in can’t be taken out, which keepSigned knows`, () => {
            const link = scheme.sign(base, `${query}&utm_source=newsletter&utm_medium=email`);
            assert.equal(scheme.verify(link), true);
            // Asked to clean: it does, the report says the link was signed, and it no longer verifies.
            const report = cleanReport(link);
            assert.equal(report.signed, name);
            assert.deepEqual(report.removed.map((parameter) => parameter.name), ['utm_source', 'utm_medium']);
            assert.equal(scheme.verify(report.cleaned), false);
            // Asked to leave signed links alone: as given, still verifying.
            const kept = cleanReport(link, {keepSigned: true});
            assert.deepEqual(kept, {original: link, cleaned: link, removed: [], unwrapped: [], pathChanges: [], fragmentRemoved: false, signed: name});
            assert.equal(scheme.verify(kept.cleaned), true);
            assert.equal(withoutTracking(link, {keepSigned: true}), link);
            assert.equal(cleanLink(link, {keepSigned: true}), null);
        });
    }
});

describe('keepSigned', () => {
    it('leaves a signed link exactly as written: no rewriting, its fragment and spaces around it aside', () => {
        const link = laravel.sign('https://app.example.com:/files', 'expires=1794650000&name=a|b&utm_source=x');
        assert.equal(withoutTracking(`${link}#xtor=RSS-1`, {keepSigned: true}), `${link}#xtor=RSS-1`);
        assert.equal(withoutTracking(`  ${link}\n`, {keepSigned: true}), link);
        assert.equal(laravel.verify(withoutTracking(link, {keepSigned: true})), true);
    });

    it('still unwraps a redirect page in front of a signed link, and keeps the link whole', () => {
        const link = s3.sign(S3, `${DISPOSITION}&utm_source=newsletter&${S3_QUERY}`);
        const report = cleanReport(`https://www.google.com/url?q=${encodeURIComponent(link)}&sa=D&utm_source=mail`, {keepSigned: true});
        assert.deepEqual(report.unwrapped, ['Google']);
        assert.deepEqual(report.removed, []);
        assert.equal(report.cleaned, link);
        assert.equal(s3.verify(report.cleaned), true);
    });

    it('changes nothing for links that aren’t signed', () => {
        const shop = 'https://shop.example.com/search?state=CA&code=SAVE10&policy=returns&expires=never&utm_source=newsletter';
        assert.equal(withoutTracking(shop, {keepSigned: true}), 'https://shop.example.com/search?state=CA&code=SAVE10&policy=returns&expires=never');
        assert.equal(cleanLink('https://www.amazon.co.uk/Some-Thing/dp/B08N5WRWNW/ref=sr_1_3?th=1', {keepSigned: true}), 'https://www.amazon.co.uk/dp/B08N5WRWNW');
        assert.equal(cleanLink(azure.sign(BLOB, `utm_source=x&${BLOB_QUERY}`), {keepSigned: true}), azure.sign(BLOB, BLOB_QUERY));
    });

    it('works with keepAffiliate', () => {
        const link = laravel.sign('https://shop.example.com/offer', 'expires=1794650000&tag=creator-20&utm_source=x');
        assert.equal(cleanLink(link, {keepSigned: true, keepAffiliate: true}), null);
    });
});
