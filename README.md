# @arraypress/clean-link

Take the tracking out of a link, offline: tracking query parameters, redirect wrappers (google.com/url?q=, Outlook and Teams Safe Links, Facebook's l.php, LinkedIn, Bing, Proofpoint, the mail gateways, affiliate networks…), Amazon's `/ref=` path segments and slugs (→ `/dp/ASIN`), eBay's item slugs, and share fragments (`#xtor=`, AddThis). It can say what it took out and why, leave affiliate credit in place, and recognise short links (bit.ly, t.co…) whose destination only their server knows. It never fetches anything.

A port of [swift-url-kit](https://github.com/arraypress)'s URLStripper (default options), held to the Swift's own output, and its own report of what it removed, for 795 links by golden files. Rules are host-scoped: `ref` is Amazon's affiliate tag but GitHub's branch, `t` is Twitter's share token but YouTube's timestamp, so a global list would break real links.

Zero dependencies. Works in Node.js, browsers, extensions and workers (anything with `URL`).

## Install

```bash
npm install @arraypress/clean-link
```

## Usage

```js
import { cleanLink, cleanReport, shortenerService, withoutTracking } from '@arraypress/clean-link';

withoutTracking('https://example.com/?utm_source=x&id=1')   // 'https://example.com/?id=1'
withoutTracking('https://www.google.com/url?q=https%3A%2F%2Fexample.com%2Fa')  // 'https://example.com/a'
withoutTracking('https://www.amazon.co.uk/Some-Product/dp/B08N5WRWNW/ref=sr_1_1?tag=aff-21')
// 'https://www.amazon.co.uk/dp/B08N5WRWNW'

cleanLink('https://example.com/?utm_source=x')   // 'https://example.com/'
cleanLink('https://example.com/?id=1')           // null: nothing to take out
cleanLink('mailto:a@example.com?utm_source=x')    // null: not an http(s) link

cleanReport('https://www.google.com/url?q=https%3A%2F%2Fexample.com%2Fa%3Futm_source%3Dx')
// { original: '…', cleaned: 'https://example.com/a', unwrapped: ['Google'],
//   removed: [{ name: 'utm_source', category: 'analytics', scope: 'global' }],
//   pathChanges: [], fragmentRemoved: false, signed: null }

cleanReport('https://bucket.s3.amazonaws.com/a.pdf?utm_source=x&X-Amz-Algorithm=AWS4-HMAC-SHA256&…&X-Amz-Signature=…').signed
// 'AWS Signature V4': the signature covers utm_source too; without it the link may not open
cleanLink('https://bucket.s3.amazonaws.com/a.pdf?utm_source=x&X-Amz-Algorithm=AWS4-HMAC-SHA256&…&X-Amz-Signature=…', { keepSigned: true })
// null: left alone

withoutTracking('https://www.amazon.com/dp/B08N5WRWNW?tag=creator-20&utm_source=x', { keepAffiliate: true })
// 'https://www.amazon.com/dp/B08N5WRWNW?tag=creator-20'

shortenerService('https://bit.ly/3xYz')   // 'Bitly': only a request to bit.ly can say where it goes
shortenerService('https://example.com/')  // null
```

## API

### `withoutTracking(url: string, options?: CleanOptions): string`

The link with its tracking taken out, as the Swift's `String.withoutTracking` returns it. Text that isn't a URL comes back as given (trimmed). Up to three nested redirects are peeled (a Gmail link to a Safe Link to a page); a redirect to anything but http(s) stays wrapped.

### `cleanLink(url: string, options?: CleanOptions): string | null`

For inserting or sharing: the cleaned link, or `null` when there was nothing to take out or it isn't an http(s) link. "Nothing to take out" includes changes that are only the URL written differently (`|` as `%7C`, a bare `?` dropped), so the user's own link is kept.

### `cleanReport(url: string, options?: CleanOptions): CleanReport`

The Swift's `URLStripper.report`: the cleaned link and everything taken out, for showing rather than just trusting it. `cleaned` is exactly what `withoutTracking` returns.

| Field | |
|---|---|
| `original` | The link as given. |
| `cleaned` | The link without its tracking. |
| `removed` | Each parameter removed, in order: `{name, category, scope}`. `name` is decoded and lowercased; `category` is `'analytics'`, `'social'`, `'email'`, `'ecommerce'` or `'other'`; `scope` is `'global'` (tracking everywhere) or the site whose rule removed it (`'Amazon'`). |
| `unwrapped` | The redirect pages peeled, outermost first: `['Google', 'Outlook Safe Links']`. |
| `pathChanges` | Path changes in words: `'removed /ref=sr_1_3'`, `'canonicalised to /dp/B08N5WRWNW'`. |
| `fragmentRemoved` | Whether a tracking `#fragment` was dropped. |
| `signed` | The scheme the link (after unwrapping) is signed with, when its signature covers the whole query; else `null`. See [Signed links](#signed-links). JavaScript only. |

### `CleanOptions`

| Option | |
|---|---|
| `keepAffiliate` | Keep what credits a referrer for a sale, so a creator's link still pays them: the names in `AFFILIATE_PARAMETERS` (Amazon's `tag`, eBay Partner Network's `campid`…, Awin's `awc`, Impact's `irclickid`, …) and the affiliate networks' own redirect pages (Awin, CJ, Impact, ShareASale, Partnerize, Skimlinks, Viglink, Admitad, Tradedoubler, Rakuten's linksynergy, eBay's rover), left wrapped. The tracking around them still goes. Off by default. JavaScript only: the Swift has no such option, so it isn't in the golden files. |
| `keep` | Names of query parameters to leave in whatever the rules say (`{ keep: ['si'] }`), as a report names them (decoded; any case): for a person who looked at what a clean would remove and wants one kept. Redirects, the path and the fragment are cleaned as usual. JavaScript only. |
| `keepSigned` | Leave a signed link (one whose report says `signed`) exactly as written: query, path and fragment. Redirect pages in front of it are still unwrapped. For cleaning nobody asked for (on copy, in an address bar). Off by default. JavaScript only. |

### Signed links

Some links carry a signature their server works out again from **every** query parameter it is sent. If `utm_source` was in the link when it was signed, taking it out stops the link opening; if it was added afterwards, the link is already broken and taking it out mends it. The link alone can't say which, so by default the clean goes ahead and `cleanReport(…).signed` names the scheme, for a caller to say so ("if it doesn't open, use the original"); with `keepSigned` the link is left alone.

| `signed` | Recognised by |
|---|---|
| `'AWS Signature V4'` | `X-Amz-Signature` with `X-Amz-Algorithm` (S3 presigned URLs) |
| `'Google Cloud Storage'` | `X-Goog-Signature` with `X-Goog-Algorithm` |
| `'OAuth 1.0'` | `oauth_signature` with `oauth_signature_method` |
| `'Shopify'` | `hmac` or `signature` of 64 hex digits, with `shop` and `timestamp` (OAuth callbacks, app proxies) |
| `'Laravel'` | `signature` of 64 hex digits; `expires`, when there is one, a number (signed routes) |
| `'imgix'` | `s` of 32 hex digits on `*.imgix.net` |
| `'Google Maps'` | `signature` on `maps.googleapis.com` |

Names alone never count: `?state=CA&code=SAVE10&expires=never` is a shop's search, and an OAuth 2 `code` or a reset `token` is looked up, not signed over. Azure SAS (`sig`), CloudFront (`Signature`, `Key-Pair-Id`) and AWS Signature V2 sign named fields only, so other parameters come and go freely; they aren't reported. The tests sign links as each service documents it and check they verify before and after (`tests/support/signing.js`).

### `shortenerService(urlOrHost: string): string | null`

The service behind a short link (`'Bitly'`, `'Twitter/X'`, `'LinkedIn'`), or `null`. A link's destination is kept on a shortener's server, so nothing offline can show it: this only recognises one (swift-url-kit's `Shorteners`), so an app can offer to ask. Takes a link or a bare host; `www.`, case and subdomains don't matter, and the longer of two matching hosts wins (`maps.app.goo.gl` is Google Maps).

### `SHORTENER_HOSTS`, `AFFILIATE_PARAMETERS`

The tables behind those two, frozen: host → service, and affiliate programme → its parameter names.

## How it reads URLs

Not with WHATWG `URL`, on purpose: that one lowercases hosts, adds a "/" path, drops default ports and re-encodes queries, so a cleaner on top of it would disagree with the Swift on most links. `src/url/components.js` reads RFC 3986 the way Foundation's `URLComponents` does, byte for byte.

## Where it is more careful than the Swift

A few real links broke under swift-url-kit 0.2.0's rules; this port leaves them alone (`src/data/corrections.js` and two checks in `src/clean.js`), and each is worth taking back to the Swift:

- A redirect page's path is that page or below it: Google's `/url` isn't `/url-help`, and its `/amp/…` unwraps only when a host follows (`developers.google.com/amp/cache/overview` was turned into `https://cache/overview`).
- `sp` stays on Bing Maps (its pins), `eid` on Facebook's `/event.php`, `courseClaim` on LinkedIn Learning.
- AWS (`aws.amazon.com`, the console) isn't Amazon's shop: its `tag`, `ref` and `th` stay and its paths aren't product paths.
- A fragment is tracking when it sets a `utm_` name (`#utm_source=x`), not when it is a heading called `#utm_tutorial`.
- `cleanLink` returns `null` unless something was taken out: a bare trailing `?` dropped is the same link.
- Signed links are reported, and left alone on request (`signed`, `keepSigned`, above).

None of these inputs are in the golden files, which still match line for line.

## Golden file

`tests/fixtures/golden.json` is swift-url-kit's output for every input in `scripts/golden/inputs.json`, and `tests/fixtures/golden-reports.json` its `URLStripper.report` for each; `npm test` holds the port to every line and every report (`npm run golden` prints any mismatch). `scripts/golden/README.md` explains regenerating it with Swift when either side changes.

## Development

`npm test` runs ESLint, a strict TypeScript check of the JSDoc (the `.d.ts` files are generated from it with `npm run types`, and the check fails while one is stale), the tests, and jscpd.

## License

MIT © 2026 David Sherlock / ArrayPress Limited
