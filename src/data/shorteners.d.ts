/**
 * @module data/shorteners
 * @description Hosts that exist to hide a destination behind a short code,
 * ported from swift-url-kit (`URLCore/Support/Shorteners.swift`), in the
 * Swift's order. Recognition only: a shortener keeps its destination on its
 * server, so finding it needs a request, which this library never makes.
 *
 * Data only; matching lives in `shorteners.js`. Hosts are lowercased, with
 * no `www.`.
 */
/**
 * Host → the service behind it. Includes platform-owned shorteners (youtu.be,
 * redd.it), whose destination is still hidden until resolved.
 *
 * @type {Readonly<Record<string, string>>}
 */
export declare const SHORTENER_HOSTS: Readonly<Record<string, string>>;
