/**
 * The port against swift-url-kit: the golden file (the Swift's own output for
 * every input, see its "about"), the Swift's URLStripper tests, `cleanLink`'s
 * own rules, and the Foundation URL reading underneath.
 *
 * @module tests/clean-link
 */

import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import {cleanLink, withoutTracking} from '../src/index.js';
import {URLComponents} from '../src/url/components.js';
import {mismatches, readGolden} from '../scripts/golden/compare.mjs';

/**
 * `URLComponents.parse`, failing the test when it can't read `text`.
 *
 * @param {string} text
 * @returns {URLComponents}
 */
function parsed(text) {
    const components = URLComponents.parse(text);
    assert.ok(components, text);
    return components;
}

describe('golden parity with swift-url-kit', () => {
    it('matches the Swift on every line of the golden file', () => {
        const lines = readGolden();
        assert.ok(lines.length >= 500);
        assert.deepEqual(mismatches(lines), []);
    });
});

// Ported from swift-url-kit Tests/URLStripperTests/URLStripperTests.swift
// (the default clean; options, reports and category helpers aren't ported).
describe('withoutTracking (URLStripperTests)', () => {
    const clean = withoutTracking;

    it('basic tracking removal', () => {
        assert.equal(clean('https://example.com?utm_source=newsletter&id=123&fbclid=abc'), 'https://example.com?id=123');
    });

    it('empty and untouched URLs', () => {
        assert.equal(clean(''), '');
        assert.equal(clean('https://example.com'), 'https://example.com');
        assert.equal(clean('https://example.com/path'), 'https://example.com/path');
        assert.equal(clean('https://example.com?'), 'https://example.com');
    });

    it('all tracking removed drops the question mark', () => {
        assert.equal(clean('https://example.com?utm_source=test&utm_medium=email&gclid=123&fbclid=456'), 'https://example.com');
    });

    it('functional parameters survive in order', () => {
        assert.equal(clean('https://example.com?utm_source=test&id=123&page=2&sort=date'), 'https://example.com?id=123&page=2&sort=date');
    });

    it('names are case-insensitive and kept ones keep their case', () => {
        assert.equal(clean('https://example.com?UTM_SOURCE=test&Fbclid=123&ID=page'), 'https://example.com?ID=page');
    });

    it('parameters without values, and empty values', () => {
        assert.equal(clean('https://example.com?utm_source&fbclid&id=123'), 'https://example.com?id=123');
        assert.equal(clean('https://example.com?utm_source=&id=123'), 'https://example.com?id=123');
        assert.equal(clean('https://example.com?utm_source=test&id=&page=2'), 'https://example.com?id=&page=2');
    });

    it('port and anchor survive', () => {
        assert.equal(clean('https://analytics.example.com:8443/dashboard?utm_source=email&report_id=1#section1'), 'https://analytics.example.com:8443/dashboard?report_id=1#section1');
    });

    it('kept parameters come back byte for byte', () => {
        assert.equal(clean('https://example.com?utm_source=t&name=John%20Doe&q=usb+c+hub'), 'https://example.com?name=John%20Doe&q=usb+c+hub');
        assert.equal(clean('https://example.com?utm_campaign=summer%202023&search=cats%20%26%20dogs'), 'https://example.com?search=cats%20%26%20dogs');
    });

    it('a Unicode host becomes punycode, as URLComponents does', () => {
        assert.equal(clean('https://müller.de/product?utm_source=test&productId=123'), 'https://xn--mller-kva.de/product?productId=123');
    });

    it('malformed strings still get the global rules', () => {
        assert.equal(clean('not-a-valid-url?utm_source=test&id=123'), 'not-a-valid-url?id=123');
        assert.equal(clean('has a space?utm_source=x&id=1'), 'has a space?id=1');
    });

    it('cleaning is idempotent', () => {
        const once = clean('https://www.amazon.com/Great-Thing/dp/B08N5WRWNW/ref=sr_1_3?tag=x-20&utm_source=a');
        assert.equal(clean(once), once);
    });

    it('functional parameters that share a name with tracking are kept', () => {
        for (const url of [
            'https://www.amazon.com/s?k=usb+c+hub&i=electronics',
            'https://wordpress.org/?s=gutenberg',
            'https://example.blog/posts?tag=swift&page=2',
            'https://gitlab.com/o/r/-/blob/README.md?ref_type=heads&ref=v1.0',
            'https://github.com/apple/swift/compare?ref=release',
            'https://shop.example.com/list?price=10-20&sort=asc',
            'https://docs.example.com/page?hash=section-2',
            'https://time.example.com/convert?from=UTC&to=PST&ts=1700000000',
            'https://app.example.com/profile?user_id=42',
            'https://jobs.example.com/search?keywords=swift+developer',
            'https://api.example.com/data?_=1700000000&id=7',
            'https://www.bilibili.com/video/BV1xx411c7mD?bvid=BV1xx411c7mD&p=2',
            'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&list=PL1',
            'https://medium.com/@a/post-1a2b3c?sk=friendlinkkey',
            'https://zoom.us/j/1234567890?pwd=abc123',
            'https://t.me/somebot?start=ref123',
            'https://www.nytimes.com/2026/01/01/x.html?unlocked_article_code=1.abc',
        ]) assert.equal(clean(url), url, url);
    });

    it('Twitter share parameters are tracking on X only', () => {
        assert.equal(clean('https://x.com/user/status/1?s=20&t=abc'), 'https://x.com/user/status/1');
        assert.equal(clean('https://twitter.com/user/status/1?s=46&t=xyz&ref_src=twsrc'), 'https://twitter.com/user/status/1');
        assert.equal(clean('https://example.com/search?s=swift&t=week'), 'https://example.com/search?s=swift&t=week');
    });

    it('si is tracking on YouTube and Spotify but not elsewhere', () => {
        assert.equal(clean('https://youtu.be/dQw4w9WgXcQ?si=abcDEF'), 'https://youtu.be/dQw4w9WgXcQ');
        assert.equal(clean('https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=x&nd=1'), 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT');
        assert.equal(clean('https://example.com/item?si=7'), 'https://example.com/item?si=7');
    });

    it('YouTube keeps time and playlist but loses share cruft', () => {
        assert.equal(clean('https://www.youtube.com/watch?v=dQw4w9WgXcQ&utm_source=facebook&feature=share&t=42s'), 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s');
        assert.equal(clean('https://www.youtube.com/watch?v=abc&list=PL123&index=3&pp=ygUF&ab_channel=Name'), 'https://www.youtube.com/watch?v=abc&list=PL123&index=3');
    });

    it('the Amazon brand matches every country and nothing else', () => {
        for (const host of ['www.amazon.com', 'amazon.co.uk', 'smile.amazon.de', 'www.amazon.com.au', 'amazon.co.jp']) {
            assert.equal(clean(`https://${host}/dp/B08N5WRWNW?tag=aff-21&psc=1`), `https://${host}/dp/B08N5WRWNW?psc=1`, host);
        }
        for (const host of ['amazon.example.com', 'amazonaws.com', 'notamazon.com', 'amazon-adsystem.com']) {
            assert.equal(clean(`https://${host}/x?tag=keep`), `https://${host}/x?tag=keep`, host);
        }
    });

    it('Facebook’s own links lose their internal tracking; ref elsewhere stays', () => {
        assert.equal(clean('https://www.facebook.com/page/posts/123?ref=share&__cft__[0]=abc&__tn__=-UK&mibextid=xyz'), 'https://www.facebook.com/page/posts/123');
        assert.equal(clean('https://example.com/docs?ref=nav'), 'https://example.com/docs?ref=nav');
    });

    it('TikTok share parameters are scoped to TikTok', () => {
        assert.equal(clean('https://www.tiktok.com/@u/video/1?ttclid=abc&is_from_webapp=1&sender_device=pc&id=video'), 'https://www.tiktok.com/@u/video/1?id=video');
        assert.equal(clean('https://example.com?ttclid=abc&is_from_webapp=1&id=video'), 'https://example.com?is_from_webapp=1&id=video');
    });

    it('Gmail is excluded from the Google rule', () => {
        assert.equal(clean('https://mail.google.com/mail/u/0/?source=x#inbox'), 'https://mail.google.com/mail/u/0/?source=x#inbox');
        assert.equal(clean('https://www.google.com/search?q=swift&source=hp&ei=abc&ved=2ah&oq=swi'), 'https://www.google.com/search?q=swift');
    });

    it('publisher rules', () => {
        assert.equal(clean('https://cnn.com/article?utm_source=twCNN&utm_medium=social&ftag=cnn123'), 'https://cnn.com/article');
        assert.equal(clean('https://bbc.com/news/tech-123?at_medium=custom7&at_campaign=64&article_id=tech-123'), 'https://bbc.com/news/tech-123?article_id=tech-123');
        assert.equal(clean('https://nytimes.com/article?smid=tw-nytimes&smtyp=cur&story_id=456'), 'https://nytimes.com/article?story_id=456');
        assert.equal(clean('https://www.theguardian.com/uk?CMP=share_btn_tw'), 'https://www.theguardian.com/uk');
        assert.equal(clean('https://example.com/compare?cmp=a,b'), 'https://example.com/compare?cmp=a,b');
    });

    it('prefix rules catch variants no list could enumerate', () => {
        assert.equal(clean('https://example.com?utm_reader=x&utm_viz_id=y&utm_swu=z&mtm_group=g&pk_kwd=k&hsa_ver=3&sfmc_activityid=9&at_custom9=q&id=1'), 'https://example.com?id=1');
    });

    it('email marketing platforms', () => {
        assert.equal(clean('https://example.com?_hsenc=p2ANqtz-abc&_hsmi=12345&utm_campaign=email'), 'https://example.com');
        assert.equal(clean('https://example.com?mkt_tok=eyJ0eXAi&article_id=10'), 'https://example.com?article_id=10');
        assert.equal(clean('https://example.com?mc_cid=abc&mc_eid=def&ck_subscriber_id=1&_bhlid=2&id=3'), 'https://example.com?id=3');
        assert.equal(clean('https://example.com?jobid=123&subid=456&sfmc_sub=789&content_id=article'), 'https://example.com?jobid=123&subid=456&content_id=article');
    });

    it('affiliate networks and Shopify storefront tracking', () => {
        assert.equal(clean('https://shop.example.com/p/1?awc=123_456&cjevent=abc&irclickid=xyz&ranMID=1&colour=red'), 'https://shop.example.com/p/1?colour=red');
        assert.equal(clean('https://shop.example.com/products/tee?variant=1&_pos=2&_sid=abc&_ss=r&pr_rec_pid=9'), 'https://shop.example.com/products/tee?variant=1');
    });

    it('a Google search redirect becomes the destination', () => {
        assert.equal(clean('https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=&cad=rja&uact=8&ved=2ahUKEwjX&url=https%3A%2F%2Fexample.com%2Farticle'), 'https://example.com/article');
        assert.equal(clean('https://www.google.com/url?q=https://example.com/a?id%3D1&sa=D'), 'https://example.com/a?id=1');
        assert.equal(clean('https://www.google.co.uk/amp/s/www.example.com/amp/article'), 'https://www.example.com/amp/article');
    });

    it('Bing’s redirect is base64', () => {
        const payload = Buffer.from('https://example.com/page?id=1').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        assert.equal(clean(`https://www.bing.com/ck/a?!&&p=abc&u=a1${payload}&ntb=1`), 'https://example.com/page?id=1');
    });

    it('DuckDuckGo, Outlook, Proofpoint and Slack', () => {
        assert.equal(clean('https://duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fx&rut=abc'), 'https://example.com/x');
        assert.equal(clean('https://nam12.safelinks.protection.outlook.com/?url=https%3A%2F%2Fexample.com%2Fdoc%3Fid%3D5&data=05%7C01%7C&sdata=abc&reserved=0'), 'https://example.com/doc?id=5');
        assert.equal(clean('https://urldefense.proofpoint.com/v2/url?u=https-3A__www.example.com_path-3Fq-3D1&d=DwMF&c=abc&e='), 'https://www.example.com/path?q=1');
        assert.equal(clean('https://urldefense.com/v3/__https://example.com/a/b__;!!AbC-dEf$'), 'https://example.com/a/b');
        assert.equal(clean('https://slack-redir.net/link?url=https%3A%2F%2Fexample.com%2Fs'), 'https://example.com/s');
    });

    it('social and gaming redirects', () => {
        assert.equal(clean('https://l.facebook.com/l.php?u=https%3A%2F%2Fexample.com%2Ff%3Ffbclid%3DIwAR&h=AT0'), 'https://example.com/f');
        assert.equal(clean('https://l.instagram.com/?u=https%3A%2F%2Fexample.com%2Fi&e=AT1'), 'https://example.com/i');
        assert.equal(clean('https://www.youtube.com/redirect?event=video_description&q=https%3A%2F%2Fexample.com%2Fy'), 'https://example.com/y');
        assert.equal(clean('https://out.reddit.com/t3_abc?url=https%3A%2F%2Fexample.com%2Fr&token=1'), 'https://example.com/r');
        assert.equal(clean('https://www.linkedin.com/redir/redirect?url=https%3A%2F%2Fexample.com%2Fl&urlhash=x'), 'https://example.com/l');
        assert.equal(clean('https://steamcommunity.com/linkfilter/?url=https://example.com/s'), 'https://example.com/s');
        assert.equal(clean('https://vk.com/away.php?to=https%3A%2F%2Fexample.com%2Fv&cc_key='), 'https://example.com/v');
        assert.equal(clean('https://t.umblr.com/redirect?z=https%3A%2F%2Fexample.com%2Ft&t=abc'), 'https://example.com/t');
        assert.equal(clean('https://www-example-com.cdn.ampproject.org/c/s/www.example.com/page'), 'https://www.example.com/page');
    });

    it('nested redirects are all peeled (a Gmail link to a Safe Link to a page)', () => {
        /** @param {string} s */
        const encode = (s) => s.replace(/[^A-Za-z0-9]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`);
        const inner = 'https://example.com/final?id=9';
        const safelink = `https://eur01.safelinks.protection.outlook.com/?url=${encode(inner)}`;
        assert.equal(clean(`https://www.google.com/url?q=${encode(safelink)}`), inner);
    });

    it('redirects to non-http schemes are refused', () => {
        assert.equal(clean('https://www.google.com/url?q=javascript:alert(1)'), 'https://www.google.com/url?q=javascript:alert(1)');
    });

    it('Amazon path attribution and canonicalisation', () => {
        assert.equal(clean('https://www.amazon.com/Sony-WH-1000XM5-Headphones/dp/B09XS7JWHH/ref=sr_1_3?keywords=x&qid=1&sr=8-3&tag=a-20'), 'https://www.amazon.com/dp/B09XS7JWHH?keywords=x');
        assert.equal(clean('https://www.amazon.co.uk/gp/product/B08N5WRWNW/ref=ppx_yo_dt_b?ie=UTF8&psc=1'), 'https://www.amazon.co.uk/dp/B08N5WRWNW?psc=1');
        assert.equal(clean('https://www.amazon.de/-/en/Some-Thing/dp/B08N5WRWNW/'), 'https://www.amazon.de/-/en/dp/B08N5WRWNW');
        assert.equal(clean('https://amazon.ca/gp/product/B789?ref=ppx_yo_dt&tag=ca-20'), 'https://amazon.ca/gp/product/B789');
    });

    it('the eBay item slug is dropped', () => {
        assert.equal(clean('https://www.ebay.co.uk/itm/Vintage-Camera-Lens/123456789012?hash=item1:g:abc&_trkparms=x'), 'https://www.ebay.co.uk/itm/123456789012');
    });

    it('tracking fragments go and anchors stay', () => {
        assert.equal(clean('https://example.com/a#xtor=RSS-1'), 'https://example.com/a');
        assert.equal(clean('https://example.com/a#utm_source=x'), 'https://example.com/a');
        assert.equal(clean('https://example.com/a#.Vh3xYz.twitter'), 'https://example.com/a');
        assert.equal(clean('https://example.com/a#_=_'), 'https://example.com/a');
        assert.equal(clean('https://example.com/a#sthash.AbC1.dpbs'), 'https://example.com/a');
        assert.equal(clean('https://example.com/a#section-2'), 'https://example.com/a#section-2');
        assert.equal(clean('https://example.com/a#:~:text=hello'), 'https://example.com/a#:~:text=hello');
    });
});

describe('cleanLink', () => {
    it('returns the cleaned link', () => {
        assert.equal(cleanLink('https://example.com/a?utm_source=newsletter&id=1'), 'https://example.com/a?id=1');
        assert.equal(cleanLink('  https://www.google.com/url?q=https://example.com/a&sa=D  '), 'https://example.com/a');
    });

    it('returns null when there is nothing to take out', () => {
        assert.equal(cleanLink('https://example.com/a?id=1'), null);
        assert.equal(cleanLink('https://github.com/apple/swift/compare?ref=release'), null);
        // Foundation would write these differently ("%7C", no empty port), but nothing was tracking.
        assert.equal(cleanLink('https://example.com/a?q=a|b'), null);
        assert.equal(cleanLink('https://example.com:/a?q=1'), null);
    });

    it('returns null for what isn’t an http(s) link', () => {
        assert.equal(cleanLink('not a url?utm_source=x'), null);
        assert.equal(cleanLink('example.com/?utm_source=x'), null);
        assert.equal(cleanLink('mailto:someone@example.com?utm_source=x&subject=hi'), null);
        assert.equal(cleanLink('javascript:alert(1)?utm_source=x'), null);
        assert.equal(cleanLink('ftp://example.com/?utm_source=x'), null);
        assert.equal(cleanLink('https:///path?utm_source=x'), null);
        assert.equal(cleanLink(''), null);
        assert.equal(cleanLink(/** @type {any} */ (undefined)), null);
    });
});

describe('URLComponents (Foundation’s reading)', () => {
    it('keeps the string as given until something is set, then writes the port as a number', () => {
        const c = parsed('HTTPS://EX.com:080/a?x=1');
        assert.equal(c.string, 'HTTPS://EX.com:080/a?x=1');
        const items = c.percentEncodedQueryItems;
        c.percentEncodedQueryItems = items; // Setting anything rebuilds the string.
        assert.equal(c.string, 'HTTPS://EX.com:80/a?x=1');
    });

    it('encodes what a component can’t hold, punycodes a Unicode host, refuses a bad one', () => {
        assert.equal(parsed('https://bücher.example/é?a=|#b#c').string, 'https://xn--bcher-kva.example/%C3%A9?a=%7C#b%23c');
        assert.equal(parsed('https://ex.com/?a=%zz').percentEncodedQuery, 'a=%25zz');
        assert.equal(URLComponents.parse('https://ex<.com/'), null);
        assert.equal(URLComponents.parse('https://ex.com:8a/'), null);
        assert.equal(URLComponents.parse('1a:b'), null);
    });

    it('decodes like Foundation: a path that won’t decode is "", a value null', () => {
        const c = parsed('https://ex.com/%FF?a=%FF&b=%26');
        assert.equal(c.path, '');
        assert.deepEqual(c.queryItems, [{name: 'a', value: null}, {name: 'b', value: '&'}]);
    });
});
