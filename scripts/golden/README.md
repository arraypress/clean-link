# Golden file: link cleaning

`src/clean.js` is a port of swift-url-kit's default clean (URLStripper). This harness
runs the Swift cleaner over the same inputs, so the two can be diffed whenever either changes.

```sh
node inputs.mjs                                   # writes inputs.json (Swift test inputs + real-world forms)
swift build -c release
.build/release/golden inputs.json golden.json ../../tests/fixtures/golden-reports.json
                                                  # the Swift's answers (a bare list), and its reports
node diff.mjs golden.json                         # JS vs Swift, line by line and report by report
node diff.mjs                                     # or against the checked-in fixtures
```

The checked-in fixture (`tests/fixtures/golden.json`) is the same list wrapped as
`{about, lines}`; when the Swift changes, replace its `lines` with the new `golden.json`.
The reports fixture (`tests/fixtures/golden-reports.json`, `{about, reports}`: `URLStripper.report`
with default options for every input) is written in place.

The package depends on `~/Developer/Swift/Libraries/swift-url-kit` by relative path and changes
nothing in it. `npm test` checks the JS against the same file (`tests/clean-link.test.js`).
