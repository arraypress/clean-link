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
export const SHORTENER_HOSTS = Object.freeze({
    // General-purpose
    'bit.ly': 'Bitly', 'bitly.com': 'Bitly', 'j.mp': 'Bitly', 'tinyurl.com': 'TinyURL',
    'tiny.cc': 'Tiny.cc', 't.ly': 'T.LY', 'is.gd': 'is.gd', 'v.gd': 'v.gd', 'ow.ly': 'Hootsuite',
    'buff.ly': 'Buffer', 'rebrand.ly': 'Rebrandly', 'cutt.ly': 'Cuttly', 'shorturl.at': 'ShortURL',
    'short.io': 'Short.io', 'bl.ink': 'BL.INK', 'snip.ly': 'Sniply', 'trib.al': 'Trib.al',
    'dlvr.it': 'dlvr.it', 'ift.tt': 'IFTTT', 'mcaf.ee': 'McAfee', 'po.st': 'Po.st',
    's.id': 'S.id', 'rb.gy': 'Rebrandly', 'tr.im': 'tr.im', 'goo.gl': 'Google', 'g.co': 'Google',
    'lnkd.in': 'LinkedIn', 't.co': 'Twitter/X', 'fb.me': 'Facebook', 'amzn.to': 'Amazon',
    'amzn.eu': 'Amazon', 'amzn.asia': 'Amazon', 'a.co': 'Amazon', 'youtu.be': 'YouTube',
    'redd.it': 'Reddit', 'spoti.fi': 'Spotify', 'spotify.link': 'Spotify', 'apple.co': 'Apple',
    'msft.it': 'Microsoft', 'aka.ms': 'Microsoft', 'pin.it': 'Pinterest', '1drv.ms': 'OneDrive',
    'we.tl': 'WeTransfer', 'db.tt': 'Dropbox', 'chng.it': 'Change.org', 'flic.kr': 'Flickr',
    'gph.is': 'Giphy', 'boxd.it': 'Letterboxd', 'pca.st': 'Pocket Casts', 'dai.ly': 'Dailymotion',
    'b23.tv': 'Bilibili', 'vm.tiktok.com': 'TikTok', 'vt.tiktok.com': 'TikTok', 'nico.ms': 'Niconico',
    'abnb.me': 'Airbnb', 'on.soundcloud.com': 'SoundCloud', 'link.medium.com': 'Medium',
    'maps.app.goo.gl': 'Google Maps', 'photos.app.goo.gl': 'Google Photos', 'forms.gle': 'Google Forms',
    'w3w.co': 'what3words', 'lu.ma': 'Luma', 'cal.com': 'Cal.com',
    // Ad-interstitial shorteners — the destination is behind an ad wall
    'adf.ly': 'Adfly', 'bc.vc': 'BC.VC', 'ouo.io': 'ouo.io', 'shorte.st': 'Shorte.st',
    'linkvertise.com': 'Linkvertise', 'sub2unlock.com': 'Sub2Unlock',
});
