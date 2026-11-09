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

`inputs.mjs` builds the first 523 inputs (it needs the Foundation probe files
`probe.json`, `p2.json`, `p3.json`, which aren't checked in). Since 1.1.0 the checked-in
`inputs.json` is extended in place: 266 inputs for swift-url-kit 0.2.0's rules (its new
test literals, 79 redirect-wrapper formats, edges of each new code path) and 6 for
Foundation's port rewriting. Add new inputs to the end of `inputs.json`.

The checked-in fixture (`tests/fixtures/golden.json`) is the same list wrapped as
`{about, lines}`; when the Swift changes, replace its `lines` with the new `golden.json`.
The reports fixture (`tests/fixtures/golden-reports.json`, `{about, reports}`: `URLStripper.report`
with default options for every input) is written in place.

The package depends on `~/Developer/Swift/Libraries/swift-url-kit` by relative path and changes
nothing in it. `npm test` checks the JS against the same file (`tests/clean-link.test.js`).
