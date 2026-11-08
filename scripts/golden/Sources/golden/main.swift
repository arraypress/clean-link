import Foundation
import URLStripper

// Usage: golden <inputs.json> <out.json>
// Runs swift-url-kit's `withoutTracking` over every input and writes the
// golden file: tests/fixtures/golden.json.
let args = CommandLine.arguments
let inputs = try JSONDecoder().decode([String].self, from: Data(contentsOf: URL(fileURLWithPath: args[1])))
struct Line: Encodable { let input: String; let output: String }
struct Golden: Encodable { let about: String; let lines: [Line] }
let lines = inputs.map { Line(input: $0, output: $0.withoutTracking) }
let golden = Golden(about: "swift-url-kit URLStripper String.withoutTracking, run on macOS by a scratch harness (Package.swift depending on the library by path). Each output is the Swift's; clean-link.js must match every line.", lines: lines)
let encoder = JSONEncoder()
encoder.outputFormatting = [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes]
try encoder.encode(golden).write(to: URL(fileURLWithPath: args[2]))
print("\(lines.count) lines, \(lines.filter { $0.input != $0.output }.count) changed")
