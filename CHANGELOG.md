# Changelog

All notable changes to `@arraypress/clean-link` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-11-09

### Added

- `withoutTracking(url)` and `cleanLink(url)`: swift-url-kit's URLStripper (default clean) in JavaScript, with Foundation's `URLComponents` reading, held to the Swift's output for 523 links (`tests/fixtures/golden.json`, harness in `scripts/golden/`). From Tabby's `convert/clean-link.js`.
