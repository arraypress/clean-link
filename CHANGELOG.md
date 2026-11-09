# Changelog

All notable changes to `@arraypress/clean-link` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] — 2026-11-09

### Added

- `cleanReport(url, options?)`: what a clean took out and why (each parameter with its category and rule, the redirects peeled, path changes, a dropped fragment). A port of swift-url-kit's `URLStripper.report`, held to the Swift's report for all 523 golden inputs (`tests/fixtures/golden-reports.json`; the harness writes it with a third argument).
- `keepAffiliate` option for `withoutTracking`, `cleanLink` and `cleanReport`: keeps affiliate credit (`AFFILIATE_PARAMETERS`, and the Rakuten and eBay rover redirects left wrapped). Off by default, so the default clean is unchanged.
- `shortenerService(urlOrHost)` and `SHORTENER_HOSTS`: recognise short links (bit.ly, t.co, lnkd.in…), from swift-url-kit's `Shorteners`. Recognition only; nothing is fetched.

### Unchanged

- The rule tables and the default clean: every golden line still matches the Swift.

## [1.0.0] — 2026-11-09

### Added

- `withoutTracking(url)` and `cleanLink(url)`: swift-url-kit's URLStripper (default clean) in JavaScript, with Foundation's `URLComponents` reading, held to the Swift's output for 523 links (`tests/fixtures/golden.json`, harness in `scripts/golden/`). From Tabby's `convert/clean-link.js`.
