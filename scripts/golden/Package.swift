// swift-tools-version: 6.1
import PackageDescription

// Golden harness: runs swift-url-kit's cleaner over a list of URLs to make
// the golden file. Depends on the library by path; touches nothing in it.
let package = Package(
    name: "golden",
    platforms: [.macOS(.v14)],
    dependencies: [.package(path: "../../../../../Swift/Libraries/swift-url-kit")],
    targets: [
        .executableTarget(name: "golden", dependencies: [.product(name: "URLStripper", package: "swift-url-kit")]),
    ]
)
