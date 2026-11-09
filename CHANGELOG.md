# Changelog

All notable changes to `@arraypress/clean-link` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] — 2026-11-10

### Added

- `cleanReport(url, options?)`: what a clean took out and why (each parameter with its category and rule, the redirects peeled, path changes, a dropped fragment). A port of swift-url-kit's `URLStripper.report`, held to the Swift's report for every golden input (`tests/fixtures/golden-reports.json`; the harness writes it with a third argument).
- `keepAffiliate` option for `withoutTracking`, `cleanLink` and `cleanReport`: keeps affiliate credit (`AFFILIATE_PARAMETERS`, and the affiliate networks' redirect pages left wrapped: Awin, CJ, Impact, ShareASale, Partnerize, Skimlinks, Viglink, Admitad, Tradedoubler, Rakuten, eBay's rover). Off by default.
- `shortenerService(urlOrHost)` and `SHORTENER_HOSTS`: recognise short links (bit.ly, t.co, lnkd.in…), from swift-url-kit's `Shorteners`. Recognition only; nothing is fetched.
- The rules follow swift-url-kit 0.2.0, audited against seven tracking lists (AdGuard, uBlock Origin, Brave, Firefox's Query Stripping and Strip on Share, DuckDuckGo, ClearURLs; fetched 2026-11-09): 176 global tracking names, 37 new site rules and 21 extended (Instagram, Temu, MSN, Audible, Condé Nast…), and 46 redirect formats (LinkedIn's safety/go, Teams and GCC Safe Links, Facebook's www/m l.php and flx/warn, WhatsApp, Barracuda, Cisco, Sophos, Trend Micro, Symantec, Amazon SES, Kit, Customer.io, Yahoo, and the affiliate networks).
- Links that are never cleaned, only unwrapped (`NEVER_STRIP_HOSTS`): web archives, urldefense, AXS, Eloqua, UnivIS. `mkt_tok` and `ck_subscriber_id` stay on unsubscribe pages (`GLOBAL_KEPT_ON_PATHS`).
- `keepAffiliate` also keeps the new networks' ids (`sscid`, `pjclid`, `im_ref`, `ir_*`, `admitad_uid`…) and the new shops' (Amazon OneLink `asc_*`, Humble's `partner`, Epic's `epic_affiliate`, Wise, Trip.com, Newegg, Otto).

### Fixed

- Microsoft's `fwlink?LinkId=` links survive (`linkid` is Amazon's and Humble's only); `affid`, `aff_id`, `affiliate_id` and `mbid` are no longer removed everywhere; Google keeps `ie`, Yandex `lr`, Netflix `jbv`, TikTok `enter_from`; Apps Script links are left alone.
- Proofpoint v3 links keep the wrapped URL's query and decode its `*` replacements; Disqus drops its `:hash`; double-encoded destinations (CurseForge) unwrap.
- A URL with an empty port (`host:/`) that Foundation has to percent-encode loses the `:`, as Foundation writes it.

Every line of the golden file (795 inputs) and every report matches the Swift.

## [1.0.0] — 2026-11-09

### Added

- `withoutTracking(url)` and `cleanLink(url)`: swift-url-kit's URLStripper (default clean) in JavaScript, with Foundation's `URLComponents` reading, held to the Swift's output for 523 links (`tests/fixtures/golden.json`, harness in `scripts/golden/`). From Tabby's `convert/clean-link.js`.
