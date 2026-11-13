/**
 * The port against swift-url-kit: the golden file (the Swift's own output for
 * every input, see its "about"), the Swift's URLStripper tests, `cleanLink`'s
 * own rules, and the Foundation URL reading underneath.
 *
 * @module tests/clean-link
 */

import {describe, it} from 'node:test';
import assert from 'node:assert/strict';
import {AFFILIATE_PARAMETERS, cleanLink, cleanReport, SHORTENER_HOSTS, shortenerService, withoutTracking} from '../src/index.js';
import {URLComponents} from '../src/url/components.js';
import {REDIRECT_RULES} from '../src/data/rules.js';
import {AFFILIATE_REDIRECTS} from '../src/data/affiliate.js';
import {mismatches, readGolden, readReports, reportMismatches} from '../scripts/golden/compare.mjs';

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

    it('reports exactly what the Swift’s URLStripper.report does, for every input', () => {
        const reports = readReports();
        assert.equal(reports.length, readGolden().length);
        // Every kind of change is in there, not only parameters.
        for (const field of /** @type {const} */ (['removed', 'unwrapped', 'pathChanges'])) assert.ok(reports.filter((r) => r[field].length).length >= 20, field);
        assert.ok(reports.filter((r) => r.fragmentRemoved).length >= 5);
        assert.deepEqual(reportMismatches(reports), []);
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

// Ported from swift-url-kit 0.2.0's URLStripperTests: the rules audited
// against seven tracking lists (2026-11-09). Each fix failed before it.
describe('withoutTracking (URLStripperTests, 0.2.0 fixes)', () => {
    const clean = withoutTracking;

    it('Microsoft’s fwlink keeps its LinkId; Amazon’s linkId still goes', () => {
        assert.equal(clean('https://go.microsoft.com/fwlink/?LinkId=550986'), 'https://go.microsoft.com/fwlink/?LinkId=550986');
        assert.equal(clean('https://www.amazon.com/dp/B08N5WRWNW?linkId=abc&tag=x-20'), 'https://www.amazon.com/dp/B08N5WRWNW');
    });

    it('affiliate ids are only tracking where a list says so', () => {
        const affwp = 'https://example.com/wp-admin/admin.php?page=affiliate-wp-affiliates&action=edit_affiliate&affiliate_id=5';
        assert.equal(clean(affwp), affwp);
        assert.equal(clean('https://example.com/edd?aff_id=5&affid=6'), 'https://example.com/edd?aff_id=5&affid=6');
        assert.equal(clean('https://www.newegg.com/p/N82E1?affid=1&item=2'), 'https://www.newegg.com/p/N82E1?item=2');
    });

    it('a MusicBrainz id is data off Condé Nast', () => {
        const lastfm = 'https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&mbid=a74b1b7f-71a5-4011-9441-d0b5e4122711';
        assert.equal(clean(lastfm), lastfm);
        assert.equal(clean('https://www.wired.com/story/x/?mbid=social_twitter'), 'https://www.wired.com/story/x/');
        assert.equal(clean('https://www.newyorker.com/a?mbid=nl&cndid=1&bxid=2'), 'https://www.newyorker.com/a');
    });

    it('Google keeps the query’s code page; oe still goes', () => {
        assert.equal(clean('https://www.google.com/search?q=%83%7B&ie=Shift_JIS'), 'https://www.google.com/search?q=%83%7B&ie=Shift_JIS');
        assert.equal(clean('https://www.google.com/search?q=x&oe=UTF-8'), 'https://www.google.com/search?q=x');
    });

    it('Yandex’s region and Netflix’s title survive', () => {
        assert.equal(clean('https://yandex.ru/search/?text=weather&lr=2'), 'https://yandex.ru/search/?text=weather&lr=2');
        assert.equal(clean('https://www.netflix.com/browse?jbv=80100172'), 'https://www.netflix.com/browse?jbv=80100172');
        assert.equal(clean('https://www.netflix.com/title/80100172?trackId=1&tctx=2'), 'https://www.netflix.com/title/80100172');
    });

    it('Apps Script parameters are the app’s', () => {
        const gas = 'https://script.google.com/macros/s/AKfy/exec?source=sheet&cd=1';
        assert.equal(clean(gas), gas);
    });

    it('Proofpoint v3 keeps the wrapped query and decodes its replacements', () => {
        assert.equal(clean('https://urldefense.com/v3/__https://www.example.com/path?a=1&utm_source=pp__;!!ABC!def$'), 'https://www.example.com/path?a=1');
        assert.equal(clean('https://urldefense.com/v3/__https://example.com/a*b__;Iw!!ABC!def$'), 'https://example.com/a#b');
        // `**A` is a run of two; "JmFi" is base64url of "&ab".
        assert.equal(clean('https://urldefense.com/v3/__https://example.com/p?x=1*y=2**Az__;JmFi!!ABC$'), 'https://example.com/p?x=1&y=2abz');
        assert.equal(clean('https://urldefense.com/v3/__https:/example.com/s__;!!ABC$'), 'https://example.com/s');
    });

    it('a Proofpoint link that does not unwrap is left whole (its signature)', () => {
        const v4 = 'https://urldefense.com/v4/__https://example.com/?utm_source=x__;!!ABC$';
        assert.equal(clean(v4), v4);
        const short = 'https://urldefense.com/v3/__https://example.com/a*b__;!!ABC$';
        assert.equal(clean(short), short);
    });

    it('Disqus drops its hash and nothing else', () => {
        assert.equal(clean('https://disq.us/url?url=https%3A%2F%2Fexample.com%2Fdisqus%3Aabc&cuid=1'), 'https://example.com/disqus');
        assert.equal(clean('https://disq.us/url?url=https%3A%2F%2Fexample.com%3A8080%2F'), 'https://example.com:8080/');
    });

    it('double-encoded destinations unwrap', () => {
        assert.equal(clean('https://www.curseforge.com/linkout?remoteUrl=https%253a%252f%252fexample.com%252fcf'), 'https://example.com/cf');
    });

    it('unsubscribe tokens survive on unsubscribe pages only', () => {
        assert.equal(clean('https://info.example.com/unsubscribe?mkt_tok=abc'), 'https://info.example.com/unsubscribe?mkt_tok=abc');
        assert.equal(clean('https://go.example.com/UnsubscribePage.html?mkt_unsubscribe=1&mkt_tok=abc'), 'https://go.example.com/UnsubscribePage.html?mkt_unsubscribe=1&mkt_tok=abc');
        assert.equal(clean('https://go.example.com/index.php/email/emailWebview?mkt_tok=abc&utm_source=x'), 'https://go.example.com/index.php/email/emailWebview?mkt_tok=abc');
        assert.equal(clean('https://app.kit.com/unsubscribe?ck_subscriber_id=1'), 'https://app.kit.com/unsubscribe?ck_subscriber_id=1');
        assert.equal(clean('https://example.com/post?mkt_tok=abc&id=1'), 'https://example.com/post?id=1');
        assert.equal(clean('https://example.com/post?ck_subscriber_id=1&id=1'), 'https://example.com/post?id=1');
        // A parameter named like an Object.prototype key is just a parameter.
        assert.equal(clean('https://example.com/?constructor=1&__proto__=2&utm_source=x'), 'https://example.com/?constructor=1&__proto__=2');
    });

    it('archives, signed links and tickets are never cleaned', () => {
        for (const url of [
            'https://web.archive.org/web/20200101000000/https://example.com/page?id=1&utm_source=x',
            'https://archive.ph/newest/https://example.com/page?id=1&utm_source=x',
            'https://s123.t.eloqua.com/e/er?s=1&lid=2&elqTrackId=abc&elqaid=3&elqat=1',
            'https://univis.uni-erlangen.de/form?__s=2&dsc=anew/lecture_view',
            'https://tix.axs.com/abc?irclickid=x&utm_source=y',
            'https://web.archive.org/web/2020/https://www.amazon.com/T/dp/B08N5WRWNW/ref=x?tag=a#xtor=1',
            'https://archive.ph/x?',
        ]) assert.equal(clean(url), url);
        // A redirect to an archive is still unwrapped; the archived URL is kept whole.
        const google = 'https://www.google.com/url?q=https%3A%2F%2Fweb.archive.org%2Fweb%2F2020%2Fhttps%3A%2F%2Fexample.com%2F%3Fid%3D1%26utm_source%3Dx';
        assert.equal(cleanReport(google).cleaned, 'https://web.archive.org/web/2020/https://example.com/?id=1&utm_source=x');
        assert.deepEqual(cleanReport(google).unwrapped, ['Google']);
        assert.equal(clean('https://example.com/a?__s=abcdef&id=1'), 'https://example.com/a?id=1');
    });

    it('TikTok keeps enter_from; Douyin and Google’s viewport size still go', () => {
        assert.equal(clean('https://www.tiktok.com/effect/1?enter_from=x&is_from_webapp=1'), 'https://www.tiktok.com/effect/1?enter_from=x');
        assert.equal(clean('https://www.douyin.com/video/1?enter_from=x'), 'https://www.douyin.com/video/1');
        assert.equal(clean('https://www.google.com/search?q=x&biw=440&bih=974'), 'https://www.google.com/search?q=x');
    });

    it('names lists strip but sites need are kept', () => {
        for (const url of [
            'https://www.ebay.com/itm/123456789012?var=987',
            'https://www.amazon.com/dp/B08N5WRWNW?psc=1',
            'https://www.tiktok.com/search?q=cats',
            'https://www.temu.com/goods.html?goods_id=1&sku_id=2',
            'https://example.com/?spm=1&ref=nav&referrer=x',
            'https://onelink.me/abc?pid=email&af_force_deeplink=true',
            'https://example.com/ads?adId=123&adgroupid=4',
            'https://t.me/iv?url=https%3A%2F%2Fexample.com%2Fa&rhash=1',
            'https://www.kickstarter.com/discover/advanced?term=board+games',
            'https://www.flipkart.com/p/itm1?pid=X&lid=LST1',
            'https://shop.example.com/authentication/login?analytics_trace_id=1',
            'https://app.adjust.com/abc?adj_t=xyz&adj_campaign=c',
            'https://www.shein.com/p.html?mallCode=1',
        ]) assert.equal(clean(url), url, url);
        assert.equal(clean('https://www.xiaohongshu.com/explore/abc?xsec_token=T&xhsshare=CopyLink'), 'https://www.xiaohongshu.com/explore/abc?xsec_token=T');
    });
});

describe('withoutTracking (URLStripperTests, 0.2.0 additions)', () => {
    const clean = withoutTracking;

    it('new global names, each in its category', () => {
        assert.equal(clean('https://example.com/?s_cid=em&rdt_cid=1&qclid=2&tblci=3&vmcid=4&id=1'), 'https://example.com/?id=1');
        assert.equal(clean('https://example.com/?itm_source=a&itm_medium=b&ga_source=c&fbadid=d&ttadid=e&sscid=f&id=1'), 'https://example.com/?id=1');
        assert.equal(clean('https://example.com/?nb_placement=a&mt_click_id=b&et_rid=c&mindbox-click-id=d&cm_cr=e&int_term=f&id=1'), 'https://example.com/?id=1');
        const {removed} = cleanReport('https://example.com/?pjclid=1&fb_comment_id=2&oft_id=3&cq_src=4');
        assert.deepEqual(removed.map((r) => r.category), ['ecommerce', 'social', 'email', 'analytics']);
        assert.ok(removed.every((r) => r.scope === 'global'));
    });

    it('new site rules', () => {
        assert.equal(clean('https://www.instagram.com/p/C1/?igsh=x&ig_rid=y&stkn=z'), 'https://www.instagram.com/p/C1/');
        assert.equal(clean('https://x.com/u/status/1?refsrc=a&a=b&s=20'), 'https://x.com/u/status/1');
        assert.equal(clean('https://youtu.be/dQw4w9WgXcQ?si=a&is=b&t=30'), 'https://youtu.be/dQw4w9WgXcQ?t=30');
        assert.equal(clean('https://www.linkedin.com/feed/update/urn:li:activity:1/?rcm=x&origin=y'), 'https://www.linkedin.com/feed/update/urn:li:activity:1/');
        assert.equal(clean('https://www.msn.com/en-gb/news/x?ocid=a&cvid=b&ei=c&pc=d'), 'https://www.msn.com/en-gb/news/x');
        assert.equal(clean('https://www.temu.com/goods.html?goods_id=1&_x_ads_id=2&refer_page_name=3'), 'https://www.temu.com/goods.html?goods_id=1');
        assert.equal(clean('https://www.amazon.co.uk/dp/B08N5WRWNW?hvadid=1&hvdev=c&ingress=0&psc=1'), 'https://www.amazon.co.uk/dp/B08N5WRWNW?psc=1');
        assert.equal(clean('https://www.audible.co.uk/pd/B0?ref_=a&qid=1&source_code=PROMO'), 'https://www.audible.co.uk/pd/B0?source_code=PROMO');
        assert.equal(clean('https://www.tiktok.com/@u/video/1?share_region=GB&ug_btm=x'), 'https://www.tiktok.com/@u/video/1');
        assert.equal(clean('https://www.reddit.com/r/swift/comments/1/x/?entry_point=feed&post_index=2'), 'https://www.reddit.com/r/swift/comments/1/x/');
        assert.equal(clean('https://open.spotify.com/track/1?si=a&pi=b&sp_cid=c'), 'https://open.spotify.com/track/1');
        assert.equal(clean('https://www.wsj.com/articles/x?mod=hp_lead_pos1&reflink=share'), 'https://www.wsj.com/articles/x');
        assert.equal(clean('https://www.flipkart.com/p/itm1?pid=X&otracker=search&ssid=1'), 'https://www.flipkart.com/p/itm1?pid=X');
    });

    it('new redirect wrappers, each with its label', () => {
        const T = 'https%3A%2F%2Fexample.com%2Fdest%3Fid%3D1';
        const D = 'https://example.com/dest?id=1';
        /** @type {[string, string, string][]} */
        const cases = [
            [`https://www.google.com/aclk?sa=l&ai=DChc&ae=2&adurl=${T}`, D, 'Google Ads'],
            ['https://www.google.com/amp/www.example.com/amp/page', 'https://www.example.com/amp/page', 'Google AMP'],
            ['https://www.linkedin.com/safety/go?url=https%3A%2F%2Fexample.com%2Fl&trk=x', 'https://example.com/l', 'LinkedIn'],
            [`https://www.linkedin.com/safety/go/?url=${T}&trk=flagship-messaging-web`, D, 'LinkedIn'],
            ['https://www.facebook.com/l.php?u=https%3A%2F%2Fexample.com%2F', 'https://example.com/', 'Facebook'],
            [`https://m.facebook.com/l.php?u=${T}&h=AT0`, D, 'Facebook'],
            ['https://www.facebook.com/flx/warn/?u=https%3A%2F%2Fexample.com%2Ff&h=AT0', 'https://example.com/f', 'Facebook'],
            ['https://l.wl.co/l?u=https%3A%2F%2Fexample.com%2Fw', 'https://example.com/w', 'WhatsApp'],
            ['https://m.vk.com/away.php?to=https%3A%2F%2Fexample.com%2Fv', 'https://example.com/v', 'VK'],
            [`https://vk.ru/away.php?to=${T}`, D, 'VK'],
            [`https://ok.ru/dk?cmd=logExternal&st.cmd=x&st.link=${T}`, D, 'OK'],
            [`https://gcc02.safelinks.protection.office365.us/?url=${T}&data=x`, D, 'Outlook Safe Links'],
            ['https://statics.teams.cdn.office.net/evergreen-assets/safelinks/2/atp-safelinks.html?url=https%3A%2F%2Fexample.com%2Ft&locale=en-gb', 'https://example.com/t', 'Teams Safe Links'],
            [`https://urldefense.proofpoint.com/v1/url?u=${T}&k=abc`, D, 'Proofpoint'],
            ['https://urldefense.com/v3/__https://example.com/dest?id=1__;!!ABC!def$', D, 'Proofpoint'],
            ['https://linkprotect.cudasvc.com/url?a=https%3a%2f%2fexample.com%2fb&c=E,1,x&typo=1', 'https://example.com/b', 'Barracuda'],
            ['https://secure-web.cisco.com/1AbC/https%3A%2F%2Fexample.com%2Fc', 'https://example.com/c', 'Cisco Secure Email'],
            ['https://eu-central-1.protection.sophos.com?d=example.com&u=aHR0cHM6Ly9leGFtcGxlLmNvbS9kZXN0P2lkPTE%3D&i=x&t=y&h=z', D, 'Sophos'],
            [`https://imsva91-ctp.trendmicro.com:443/wis/clicktime/v1/query?url=${T}&umid=abc&auth=x`, D, 'Trend Micro'],
            [`https://clicktime.symantec.com/15tSyX?u=${T}`, D, 'Symantec'],
            [`https://medium.com/r/?url=${T}`, D, 'Medium'],
            [`https://www.pinterest.com/offsite/?url=${T}&pin=1&token=x`, D, 'Pinterest'],
            ['https://r.search.yahoo.com/_ylt=Awr/RV=2/RE=1/RO=10/RU=https%3a%2f%2fexample.com%2fdest/RK=2/RS=abc-', 'https://example.com/dest', 'Yahoo'],
            [`https://gate.sc/?url=${T}&token=x`, D, 'SoundCloud'],
            [`https://link.zhihu.com/?target=${T}`, D, 'Zhihu'],
            [`https://weibo.cn/sinaurl?u=${T}`, D, 'Weibo'],
            [`https://www.douban.com/link2/?url=${T}`, D, 'Douban'],
            [`https://search.naver.com/p/crd/rd?m=1&px=1&u=${T}`, D, 'Naver'],
            [`https://gitee.com/link?target=${T}`, D, 'Gitee'],
            [`https://link.csdn.net/?target=${T}`, D, 'CSDN'],
            [`https://link.juejin.cn/?target=${T}`, D, 'Juejin'],
            [`https://links.jianshu.com/go?to=${T}`, D, 'Jianshu'],
            ['https://links.govdelivery.com/track?type=click&enid=abc&msgid=1&url=https://example.com/dest', 'https://example.com/dest', 'GovDelivery'],
            ['https://abc.r.us-east-1.awstrack.me/L0/https:%2F%2Fexample.com%2Fdest%3Fid=1/1/0100-abc/xyz=', D, 'Amazon SES'],
            ['https://e.customeriomail.com/e/c/eyJlbWFpbF9pZCI6IngiLCJocmVmIjoiaHR0cHM6Ly9leGFtcGxlLmNvbS9kZXN0P2lkPTEiLCJsaW5rX2lkIjoxfQ/sig', D, 'Customer.io'],
            ['https://click.convertkit-mail2.com/abc/def/aHR0cHM6Ly9leGFtcGxlLmNvbS9kZXN0P2lkPTE', D, 'Kit'],
            ['https://aax-us-east.amazon-adsystem.com/x/c/Qabc/https://example.com/dest', 'https://example.com/dest', 'Amazon Ads'],
            ['https://www.awin1.com/cread.php?awinmid=1&awinaffid=2&ued=https%3A%2F%2Fexample.com%2Fa', 'https://example.com/a', 'Awin'],
            [`https://www.anrdoezrs.net/click-123-456?url=${T}`, D, 'CJ'],
            [`https://www.dpbolvw.net/click-123-456?url=${T}`, D, 'CJ'],
            [`https://brand.sjv.io/c/123/456/789?u=${T}`, D, 'Impact'],
            ['https://shareasale.com/r.cfm?b=1&u=2&m=3&urllink=example.com%2Fdest%3Fid%3D1&afftrack=', D, 'ShareASale'],
            [`https://prf.hn/click/camref:1100l/destination:${T}`, D, 'Partnerize'],
            [`https://go.skimresources.com/?id=123X456&xs=1&url=${T}`, D, 'Skimlinks'],
            [`https://redirect.viglink.com/?key=x&u=${T}`, D, 'Viglink'],
            [`https://ad.admitad.com/g/abc/?ulp=${T}`, D, 'Admitad'],
            [`https://clk.tradedoubler.com/click?p=1&a=2&url=${T}`, D, 'Tradedoubler'],
        ];
        for (const [wrapped, destination, label] of cases) {
            const report = cleanReport(wrapped);
            assert.equal(report.cleaned, destination, wrapped);
            assert.deepEqual(report.unwrapped, [label], wrapped);
        }
        assert.equal(clean('https://shareasale.com/r.cfm?urllink=https%3A%2F%2Fexample.com%2Fs'), 'https://example.com/s');
        assert.equal(clean('https://eu-central-1.protection.sophos.com?d=x&u=bm90IGEgdXJs'), 'https://eu-central-1.protection.sophos.com?d=x&u=bm90IGEgdXJs');
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

// Where the port is more careful than swift-url-kit 0.2.0 (`data/corrections.js`, and the
// redirect and fragment checks in `clean.js`): real links the Swift's rules break.
describe('more careful than the Swift', () => {
    /** @type {[string, string][]} */
    const kept = [
        // A redirect page's path is the page, not a path that starts with its letters.
        ['https://developers.google.com/amp/cache/overview', 'Google’s own /amp/ pages'],
        ['https://www.google.com/amp/', 'an AMP link with no destination'],
        ['https://support.google.com/url-help?url=https://example.com/', '/url-help is not /url'],
        ['https://www.google.com/urlx?q=https://example.com/', '/urlx is not /url'],
        ['https://www.linkedin.com/redir/redirect-policy?url=https://example.com/', '/redir/redirect-policy'],
        // A name its site's rule removes elsewhere, on the page that reads it.
        ['https://www.bing.com/maps?cp=47.6~-122.3&lvl=12&sp=point.47.6_-122.3_Space%20Needle', 'Bing Maps’ pins'],
        ['https://www.facebook.com/event.php?eid=123456', 'Facebook’s old event pages'],
        ['https://www.linkedin.com/learning/some-course?courseClaim=AQF1&u=1', 'a shared LinkedIn Learning course'],
        // AWS is under Amazon's name, not its shop.
        ['https://console.aws.amazon.com/resource-groups/tag-editor?region=us-east-1&tag=team', 'the AWS console'],
        ['https://aws.amazon.com/marketplace/search/results?searchTerms=x&ref=nav&th=1', 'AWS Marketplace'],
        ['https://docs.aws.amazon.com/dp/B08N5WRWNW/ref=x', 'an AWS path'],
        // A heading, not tracking.
        ['https://example.com/docs#utm_tutorial', 'a heading named utm_…'],
    ];
    for (const [url, what] of kept) {
        it(`leaves ${what} alone`, () => {
            assert.equal(withoutTracking(url), url);
            assert.equal(cleanLink(url), null);
        });
    }

    it('still cleans the same sites everywhere else', () => {
        assert.equal(withoutTracking('https://www.bing.com/search?q=cats&form=QBLH&sp=-1'), 'https://www.bing.com/search?q=cats');
        assert.equal(withoutTracking('https://www.facebook.com/photo.php?fbid=1&eid=2'), 'https://www.facebook.com/photo.php?fbid=1');
        assert.equal(withoutTracking('https://www.linkedin.com/jobs/view/1?courseClaim=x&trk=y'), 'https://www.linkedin.com/jobs/view/1');
        assert.equal(withoutTracking('https://www.amazon.com/Some-Title/dp/B08N5WRWNW/ref=sr_1_1?tag=x-20'), 'https://www.amazon.com/dp/B08N5WRWNW');
        assert.equal(withoutTracking('https://www.google.com/amp/s/example.com/a?x=1'), 'https://example.com/a?x=1');
        assert.equal(withoutTracking('https://www.google.com/url?q=https://example.com/a&sa=D'), 'https://example.com/a');
        assert.equal(withoutTracking('https://www.anrdoezrs.net/click-123-456?url=https%3A%2F%2Fexample.com%2F'), 'https://example.com/');
        assert.equal(withoutTracking('https://example.com/#utm_source=x'), 'https://example.com/');
        assert.equal(withoutTracking('https://example.com/#?utm_medium=x'), 'https://example.com/');
    });

    it('cleanLink keeps a link whose only change is how it is written', () => {
        assert.equal(cleanLink('https://example.com/path?'), null);
        assert.equal(cleanLink('https://example.com/path?#frag'), null);
        assert.equal(cleanLink('https://example.com:/a?q=a|b'), null);
        // Something taken out: the cleaned link, however else it is rewritten.
        assert.equal(cleanLink('https://example.com:/a?q=a|b&utm_source=x'), 'https://example.com/a?q=a%7Cb');
    });
});

describe('cleanReport', () => {
    it('names each parameter removed, its kind and the rule that removed it, in order', () => {
        const report = cleanReport('https://www.amazon.co.uk/Some-Thing/dp/B08N5WRWNW/ref=sr_1_3?utm_source=x&th=1&keep=1');
        assert.equal(report.cleaned, 'https://www.amazon.co.uk/dp/B08N5WRWNW?keep=1');
        assert.deepEqual(report.removed, [
            {name: 'utm_source', category: 'analytics', scope: 'global'},
            {name: 'th', category: 'ecommerce', scope: 'Amazon'},
        ]);
        assert.deepEqual(report.pathChanges, ['removed /ref=sr_1_3', 'canonicalised to /dp/B08N5WRWNW']);
        assert.deepEqual(report.unwrapped, []);
        assert.equal(report.fragmentRemoved, false);
    });

    it('lists nested redirects outermost first, and cleans the destination', () => {
        const safe = `https://eur01.safelinks.protection.outlook.com/?url=${encodeURIComponent('https://example.com/a?fbclid=1')}&data=x`;
        const report = cleanReport(`https://www.google.com/url?q=${encodeURIComponent(safe)}&sa=D`);
        assert.deepEqual(report.unwrapped, ['Google', 'Outlook Safe Links']);
        assert.equal(report.cleaned, 'https://example.com/a');
        assert.deepEqual(report.removed, [{name: 'fbclid', category: 'social', scope: 'global'}]);
    });

    it('reports a dropped tracking fragment, and an encoded name decoded', () => {
        const report = cleanReport('https://example.com/a?%55TM_Source=x#xtor=RSS-1');
        assert.equal(report.cleaned, 'https://example.com/a');
        assert.deepEqual(report.removed, [{name: 'utm_source', category: 'analytics', scope: 'global'}]);
        assert.equal(report.fragmentRemoved, true);
    });

    it('text that isn’t a URL: the global rules, reported; nothing to do is an empty report', () => {
        assert.deepEqual(cleanReport('see example.com?utm_source=x&a=1').removed, [{name: 'utm_source', category: 'analytics', scope: 'global'}]);
        assert.deepEqual(cleanReport('  '), {original: '  ', cleaned: '  ', removed: [], unwrapped: [], pathChanges: [], fragmentRemoved: false, signed: null});
    });

    it('cleaned is always what withoutTracking returns', () => {
        for (const {input} of readGolden()) assert.equal(cleanReport(input).cleaned, withoutTracking(input), input);
    });
});

describe('keepAffiliate', () => {
    const keep = {keepAffiliate: true};
    const amazon = 'https://www.amazon.com/dp/B08N5WRWNW?tag=creator-20&linkCode=ll1&ref_=as_li_ss_tl&utm_source=x';

    it('keeps Amazon’s tag and takes out the rest; by default the tag goes too', () => {
        assert.equal(withoutTracking(amazon), 'https://www.amazon.com/dp/B08N5WRWNW');
        assert.equal(withoutTracking(amazon, keep), 'https://www.amazon.com/dp/B08N5WRWNW?tag=creator-20');
        assert.deepEqual(cleanReport(amazon, keep).removed.map((r) => r.name), ['linkcode', 'ref_', 'utm_source']);
    });

    it('keeps the networks’ global names (Awin, Impact) and eBay Partner Network’s', () => {
        assert.equal(withoutTracking('https://shop.example/p?awc=1_2_3&irclickid=abc&gclid=x', keep), 'https://shop.example/p?awc=1_2_3&irclickid=abc');
        assert.equal(withoutTracking('https://www.ebay.com/itm/123456789012?campid=533&mkevt=1&_trksid=p1', keep), 'https://www.ebay.com/itm/123456789012?campid=533&mkevt=1');
        assert.equal(withoutTracking('not a url?awc=1&utm_source=x', keep), 'not a url?awc=1');
    });

    it('leaves an affiliate network’s redirect wrapped (unwrapping skips the credit), but not others', () => {
        const rakuten = `https://click.linksynergy.com/deeplink?id=abc&murl=${encodeURIComponent('https://shop.example/p')}`;
        assert.equal(withoutTracking(rakuten), 'https://shop.example/p');
        assert.equal(withoutTracking(rakuten, keep), rakuten);
        assert.deepEqual(cleanReport(rakuten, keep).unwrapped, []);
        assert.equal(withoutTracking('https://www.google.com/url?q=https://example.com/a', keep), 'https://example.com/a');
    });

    it('cleanLink takes the option: a link with only its credit has nothing to take out', () => {
        assert.equal(cleanLink('https://www.amazon.com/dp/B08N5WRWNW?tag=creator-20', keep), null);
        assert.equal(cleanLink('https://www.amazon.com/dp/B08N5WRWNW?tag=creator-20'), 'https://www.amazon.com/dp/B08N5WRWNW');
    });

    it('leaves every affiliate network’s wrapper wrapped (Awin, CJ, Impact, ShareASale…), with its credit', () => {
        const awin = 'https://www.awin1.com/cread.php?awinmid=1&ued=https%3A%2F%2Fexample.com%2Fa';
        assert.equal(withoutTracking(awin, keep), awin);
        assert.equal(withoutTracking(awin), 'https://example.com/a');
        for (const wrapped of [
            'https://www.anrdoezrs.net/click-123-456?url=https%3A%2F%2Fexample.com%2Fc',
            'https://brand.sjv.io/c/123/456/789?u=https%3A%2F%2Fexample.com%2Fi',
            'https://shareasale.com/r.cfm?b=1&u=2&m=3&urllink=example.com%2Fs',
            'https://prf.hn/click/camref:1100l/destination:https%3A%2F%2Fexample.com%2Fp',
            'https://go.skimresources.com/?id=1X2&url=https%3A%2F%2Fexample.com%2Fk',
            'https://redirect.viglink.com/?key=x&u=https%3A%2F%2Fexample.com%2Fv',
            'https://ad.admitad.com/g/abc/?ulp=https%3A%2F%2Fexample.com%2Fa',
            'https://clk.tradedoubler.com/click?p=1&a=2&url=https%3A%2F%2Fexample.com%2Ft',
        ]) {
            assert.equal(withoutTracking(wrapped, keep), wrapped, wrapped);
            assert.notEqual(withoutTracking(wrapped), wrapped, wrapped);
        }
        // Not an affiliate network: still unwrapped.
        assert.equal(withoutTracking('https://www.linkedin.com/safety/go?url=https%3A%2F%2Fexample.com%2Fl', keep), 'https://example.com/l');
    });

    it('keeps the new networks’ and shops’ credit (ShareASale, Partnerize, Impact, Amazon OneLink, Humble…)', () => {
        assert.equal(withoutTracking('https://shop.example/p?sscid=1&pjclid=2&im_ref=3&gclid=x', keep), 'https://shop.example/p?sscid=1&pjclid=2&im_ref=3');
        assert.equal(withoutTracking('https://www.amazon.com/dp/B08N5WRWNW?asc_source=a&hvadid=1', keep), 'https://www.amazon.com/dp/B08N5WRWNW?asc_source=a');
        assert.equal(withoutTracking('https://www.humblebundle.com/store/x?partner=y&mcid=z', keep), 'https://www.humblebundle.com/store/x?partner=y');
        assert.equal(withoutTracking('https://wise.com/invite?partnerizecampaignid=1&clickref=2', keep), 'https://wise.com/invite?partnerizecampaignid=1&clickref=2');
    });

    it('names only redirect labels that exist', () => {
        const labels = new Set(REDIRECT_RULES.map((rule) => rule.label));
        for (const label of AFFILIATE_REDIRECTS) assert.ok(labels.has(label), label);
    });

    it('lists lowercased names, each in one programme', () => {
        const names = Object.values(AFFILIATE_PARAMETERS).flat();
        assert.deepEqual(names, names.map((n) => n.toLowerCase()));
        assert.equal(new Set(names).size, names.length);
    });
});

describe('shortenerService', () => {
    it('names the service behind a short link or host', () => {
        assert.equal(shortenerService('https://bit.ly/3xYz'), 'Bitly');
        assert.equal(shortenerService('https://t.co/abc'), 'Twitter/X');
        assert.equal(shortenerService('lnkd.in'), 'LinkedIn');
        assert.equal(shortenerService('  WWW.Bit.LY.  '), 'Bitly');
    });

    it('a subdomain counts, and the longer of two hosts wins', () => {
        assert.equal(shortenerService('https://custom.bit.ly/x'), 'Bitly');
        assert.equal(shortenerService('https://maps.app.goo.gl/x'), 'Google Maps');
        assert.equal(shortenerService('https://a.maps.app.goo.gl/x'), 'Google Maps');
        assert.equal(shortenerService('https://goo.gl/x'), 'Google');
    });

    it('a bare host may come with a path or a port', () => {
        assert.equal(shortenerService('bit.ly/3xYz'), 'Bitly');
        assert.equal(shortenerService('bit.ly:443'), 'Bitly');
        assert.equal(shortenerService('youtu.be/abc?t=5'), 'YouTube');
        assert.equal(shortenerService('example.com/bit.ly'), null);
    });

    it('anything else is null', () => {
        assert.equal(shortenerService('https://example.com/bit.ly'), null);
        assert.equal(shortenerService('https://notbit.ly/x'), null);
        assert.equal(shortenerService('mailto:a@bit.ly'), null);
        assert.equal(shortenerService(''), null);
        assert.equal(shortenerService('https://exa mple.com/'), null);
        assert.equal(shortenerService(/** @type {string} */ (/** @type {unknown} */ (42))), null);
    });

    it('the table is the Swift’s 69 hosts, lowercased', () => {
        assert.equal(Object.keys(SHORTENER_HOSTS).length, 69);
        assert.deepEqual(Object.keys(SHORTENER_HOSTS), Object.keys(SHORTENER_HOSTS).map((h) => h.toLowerCase()));
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

    it('writes the port as a number when it had to encode anything, as Foundation rewrites the string', () => {
        // Checked against Foundation (macOS 27): an empty port goes, a leading zero goes.
        assert.equal(parsed('https://example.com:/\u0301/x').string, 'https://example.com/%CC%81/x');
        assert.equal(parsed('https://example.com:/a?q=é').string, 'https://example.com/a?q=%C3%A9');
        assert.equal(parsed('https://u é@example.com:/a').string, 'https://u%20%C3%A9@example.com/a');
        assert.equal(parsed('https://bücher.example:080/a').string, 'https://xn--bcher-kva.example:80/a');
        assert.equal(parsed('https://example.com:/a%').string, 'https://example.com/a%25');
        // Nothing to encode: the string as given.
        assert.equal(parsed('https://example.com:/a%20b').string, 'https://example.com:/a%20b');
        assert.equal(parsed('https://example.com:080/a').string, 'https://example.com:080/a');
        assert.equal(withoutTracking('https://www.google.com/url?q=https%3A%2F%2Fexample.com%3A%2F%CC%81%2Fx'), 'https://example.com/%CC%81/x');
    });

    it('decodes like Foundation: a path that won’t decode is "", a value null', () => {
        const c = parsed('https://ex.com/%FF?a=%FF&b=%26');
        assert.equal(c.path, '');
        assert.deepEqual(c.queryItems, [{name: 'a', value: null}, {name: 'b', value: '&'}]);
    });
});
