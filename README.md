# @arraypress/clean-link

Take the tracking out of a link, offline: tracking query parameters, redirect wrappers (google.com/url?q=, Outlook Safe Links, Facebook's l.php, Bing, Proofpoint, Slack…), Amazon's `/ref=` path segments and slugs (→ `/dp/ASIN`), eBay's item slugs, and share fragments (`#xtor=`, AddThis). It never fetches anything.

A port of [swift-url-kit](https://github.com/arraypress)'s URLStripper (default options), held to the Swift's own output for 523 links by a golden file. Rules are host-scoped: `ref` is Amazon's affiliate tag but GitHub's branch, `t` is Twitter's share token but YouTube's timestamp, so a global list would break real links.

Zero dependencies. Works in Node.js, browsers, extensions and workers (anything with `URL`).

## Install

```bash
npm install @arraypress/clean-link
```

## Usage

```js
import { cleanLink, withoutTracking } from '@arraypress/clean-link';

withoutTracking('https://example.com/?utm_source=x&id=1')   // 'https://example.com/?id=1'
withoutTracking('https://www.google.com/url?q=https%3A%2F%2Fexample.com%2Fa')  // 'https://example.com/a'
withoutTracking('https://www.amazon.co.uk/Some-Product/dp/B08N5WRWNW/ref=sr_1_1?tag=aff-21')
// 'https://www.amazon.co.uk/dp/B08N5WRWNW'

cleanLink('https://example.com/?utm_source=x')   // 'https://example.com/'
cleanLink('https://example.com/?id=1')           // null: nothing to take out
cleanLink('mailto:a@example.com?utm_source=x')    // null: not an http(s) link
```

## API

### `withoutTracking(url: string): string`

The link with its tracking taken out, as the Swift's `String.withoutTracking` returns it. Text that isn't a URL comes back as given (trimmed). Up to three nested redirects are peeled (a Gmail link to a Safe Link to a page); a redirect to anything but http(s) stays wrapped.

### `cleanLink(url: string): string | null`

For inserting or sharing: the cleaned link, or `null` when there was nothing to take out or it isn't an http(s) link. "Nothing to take out" includes changes that are only the URL written differently (`|` as `%7C`), so the user's own link is kept.

## How it reads URLs

Not with WHATWG `URL`, on purpose: that one lowercases hosts, adds a "/" path, drops default ports and re-encodes queries, so a cleaner on top of it would disagree with the Swift on most links. `src/url/components.js` reads RFC 3986 the way Foundation's `URLComponents` does, byte for byte.

## Golden file

`tests/fixtures/golden.json` is swift-url-kit's output for every input in `scripts/golden/inputs.json`; `npm test` holds the port to every line (`npm run golden` prints any mismatch). `scripts/golden/README.md` explains regenerating it with Swift when either side changes.

## Development

`npm test` runs ESLint, a strict TypeScript check of the JSDoc (the `.d.ts` files are generated from it with `npm run types`, and the check fails while one is stale), the tests, and jscpd.

## License

MIT © 2026 David Sherlock / ArrayPress Limited
