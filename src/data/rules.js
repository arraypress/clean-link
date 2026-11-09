/**
 * @module data/rules
 * @description The rule tables behind `clean.js`, ported from
 * swift-url-kit (`URLStripper/Support/GlobalParameters.swift`,
 * `URLStripper/Support/HostRules.swift`, `URLCore/Support/Redirects.swift`,
 * `URLStripper/Support/Fragments.swift`). Kept line for line in the Swift's
 * order and wrapping, `.exact("x")` written `exact('x')`, so the two diff
 * cleanly: change a table there, change it here, regenerate the golden file.
 *
 * Data only; matching lives in `clean.js`. Names are lowercased.
 */

/**
 * A parameter name to match: the whole name, or any name starting with it.
 *
 * @typedef {Readonly<{kind: 'exact' | 'prefix', value: string}>} ParameterPattern
 */

/**
 * A host to match: `suffix` is the host or any subdomain of it; `brand` is a
 * label followed by one or two short TLD labels (amazon.co.uk, smile.amazon.de).
 *
 * @typedef {Readonly<{kind: 'suffix' | 'brand', value: string}>} HostPattern
 */

/**
 * Parameters that are tracking on one site only (HostRules' `HostRule`).
 *
 * @typedef {object} HostRule
 * @property {readonly Readonly<{kind: string, value: string}>[]} hosts Where it applies (exact, suffix or brand).
 * @property {readonly ParameterPattern[]} parameters The names it removes there.
 * @property {'analytics' | 'social' | 'email' | 'ecommerce' | 'other'} category What kind of tracking they are.
 * @property {string} label The site, as reports name it ("Amazon").
 * @property {readonly Readonly<{kind: string, value: string}>[]} [excluding] Hosts spared though `hosts` matches them.
 */

/**
 * Where a redirect keeps its destination (RedirectRule.Source): a query
 * parameter tried in order ('' = the whole query); the rest of the path after
 * a prefix; Proofpoint v3's `__<url>__;<replacements>`; the last path segment;
 * the segment that starts with a prefix, after it (`RU=`, `destination:`); the
 * one segment after a path prefix (`/L0/`); or everything after N segments.
 * The path sources read the path as written, still percent-encoded.
 *
 * @typedef {{query?: string[], pathAfter?: string, proofpointV3?: boolean, lastPathSegment?: boolean,
 *   pathSegment?: string, pathSegmentAfter?: string, pathAfterSegments?: number}} RedirectSource
 */

/**
 * How a redirect's destination is encoded (RedirectRule.Encoding). Default
 * 'percent'. `{base64JSON: key}` is base64 of a JSON object holding the URL
 * at `key` (Customer.io's `href`).
 *
 * @typedef {'percent' | 'schemeless' | 'schemeOptional' | 'bingBase64' | 'proofpointV2' | 'proofpointV3'
 *   | 'base64' | 'disqus' | {base64JSON: string}} RedirectEncoding
 */

/**
 * A redirect page and where it keeps its destination.
 *
 * @typedef {object} RedirectRule
 * @property {HostPattern[]} hosts Where it applies.
 * @property {string} [pathPrefix] Its path starts with this.
 * @property {RedirectSource} source Where the destination is.
 * @property {RedirectEncoding} [encoding] How it's encoded. Default 'percent'.
 * @property {string} label Who runs it, for reading the table.
 */

/** @param {string} value @returns {ParameterPattern} */
const exact = (value) => Object.freeze({kind: 'exact', value});
/** @param {string} value @returns {ParameterPattern} */
const prefix = (value) => Object.freeze({kind: 'prefix', value});
/** @param {string} value @returns {HostPattern} */
const suffix = (value) => Object.freeze({kind: 'suffix', value});
/** @param {string} value @returns {HostPattern} */
const brand = (value) => Object.freeze({kind: 'brand', value});

/**
 * Parameters that are tracking on EVERY host (GlobalParameters.table). The bar
 * is "no site anywhere uses this name for something functional", which is
 * why `ref`, `tag`, `s`, `k` and `from` are not here but in HOST_RULES.
 *
 * swift-url-kit 0.2.0's additions come from an audit against seven lists, all
 * fetched on 2026-11-09: AdGuard's URL Tracking filter, uBlock Origin's
 * uAssets, Brave's query-filter, Firefox's Query Stripping and Strip on Share,
 * DuckDuckGo's tracking-parameters and ClearURLs. `linkid`, `affid`, `aff_id`,
 * `affiliate_id` and `mbid` moved out (each is functional somewhere).
 */
export const GLOBAL_PARAMETERS = Object.freeze({
    analytics: [
        // Google Analytics / Ads / Merchant
        prefix('utm_'), exact('gclid'), exact('gclsrc'), exact('dclid'),
        exact('gbraid'), exact('wbraid'), exact('gad_source'), exact('gad_campaignid'),
        exact('gad'), exact('srsltid'), exact('_ga'), exact('_gl'), exact('gs_l'),
        // DuckDuckGo's GA-style aliases (DuckDuckGo's list only)
        exact('ga_source'), exact('ga_medium'), exact('ga_campaign'), exact('ga_term'),
        exact('ga_content'), exact('ga_place'),
        // Other ad platforms' click ids: Reddit, Quora, Taboola, Yahoo DSP (Google
        // CM360's third-party click ids and the vendors' docs), RedTrack, Adsterra…
        exact('rdt_cid'), exact('qclid'), exact('tblci'), exact('vmcid'), exact('rtkcid'),
        exact('adsterra_clid'), exact('adsterra_placement_id'), exact('aiad_clid'),
        exact('clckid'), exact('iclid'), exact('loclid'), exact('jmtyclid'), exact('tgclid'),
        exact('syclid'), exact('external_click_id'), exact('unicorn_click_id'),
        // Microsoft, Yandex, Baidu
        exact('msclkid'), exact('yclid'), exact('ysclid'), exact('_openstat'),
        exact('ymclid'), exact('ym_tracking_id'), exact('ymid'),
        // Matomo / Piwik
        prefix('mtm_'), prefix('pk_'), prefix('piwik_'), prefix('matomo_'),
        // Adobe / Marin / Kenshoo / Webtrekk / AT Internet
        exact('s_kwcid'), exact('ef_id'), exact('mkwid'), exact('pcrid'), exact('pgrid'),
        exact('ptaid'), prefix('wt_'), exact('wtrid'), exact('xtor'), exact('xtref'),
        prefix('at_'), prefix('otm_'), prefix('stm_'), prefix('hmb_'),
        exact('s_cid'), exact('adobe_mc_ref'), exact('adobe_mc_sdid'),
        exact('wtmc'), exact('wtzmc'),   // Webtrekk without the underscore (ClearURLs)
        // IBM Acoustic
        exact('cm_mmc'), exact('cm_ven'), exact('cm_cat'), exact('cm_pla'),
        exact('cm_ite'), exact('cm_lm'), exact('cm_sp'), exact('cm_cr'), exact('cm_me'),
        // Assorted attribution
        exact('cmpid'), exact('ncid'), exact('sr_share'),
        exact('guccounter'), exact('guce_referrer'), exact('guce_referrer_sig'),
        exact('sznclid'), exact('dicbo'), exact('wickedid'), exact('rb_clickid'),
        exact('ceneo_spo'), exact('os_ehash'), exact('_branch_match_id'),
        exact('_branch_referrer'), exact('ocid'), exact('icid'), exact('intcid'),
        exact('intcmp'), exact('int_source'), exact('int_medium'), exact('int_campaign'),
        exact('int_content'), exact('int_term'),
        exact('soc_src'), exact('soc_trk'), exact('echobox'), exact('__source'),
        exact('itm_source'), exact('itm_medium'), exact('itm_campaign'), exact('itm_content'),
        exact('itm_term'), exact('tracking_source'),
        // Northbeam (nb_placement and nb_expid_meta are in three lists; the rest
        // of the family is from Firefox's Strip on Share)
        exact('nb_placement'), exact('nb_expid_meta'), exact('nb_adtype'), exact('nb_ap'),
        exact('nb_fii'), exact('nb_klid'), exact('nb_kwd'), exact('nb_li_ms'),
        exact('nb_lp_ms'), exact('nb_mi'), exact('nb_mt'), exact('nb_pc'), exact('nb_pi'),
        exact('nb_ppi'), exact('nb_ti'),
        // Klar, shopping-feed and Criteo campaign macros (Firefox's Strip on Share)
        exact('klar_source'), exact('klar_cpid'), exact('klar_adid'), exact('channable'),
        exact('cq_src'), exact('cq_cmp'), exact('cq_con'), exact('cq_med'), exact('cq_net'),
        exact('cq_plac'), exact('cq_plt'), exact('cq_term'), exact('cto_pld'),
        // MyTarget (VK Ads)
        exact('mt_adset'), exact('mt_campaign'), exact('mt_click_id'), exact('mt_creative'),
        exact('mt_link_id'), exact('mt_medium'), exact('mt_network'), exact('mt_sub1'),
        exact('mt_sub2'), exact('mt_sub3'), exact('mt_sub4'), exact('mt_sub5'),
        // Japanese ad measurement: EBiS, Zucks, Yahoo! JAPAN, LINE, Beyond, Famad, Bance
        exact('ebisadid'), exact('ebisother1'), exact('ebisother2'), exact('ebisother3'),
        exact('ebisother4'), exact('ebisother5'), exact('_bdadid'), exact('_zucks_suid'),
        exact('yj_r'), exact('ldtag_cl'), exact('lt_r'), exact('beyond_uzcvid'),
        exact('beyond_uzmcvid'), exact('uzcid'), exact('famad_xuid'), exact('bance_xuid'),
        // Assorted, each in both AdGuard's and uBlock Origin's lists
        exact('__io_lv'), exact('_io_session_id'), exact('_ly_c'), exact('_ly_r'),
        exact('_clde'), exact('_cldee'), exact('_ope'), exact('_sgm_action'),
        exact('_sgm_campaign'), exact('_sgm_pinned'), exact('_sgm_source'), exact('_sgm_term'),
        exact('adc_publisher'), exact('adc_token'), exact('adfrom'), exact('analytics_context'),
        exact('asgtbndr'), exact('bemobdata'), exact('cstrackid'), exact('cx_click'),
        exact('cx_recsorder'), exact('cx_recswidget'), exact('dpg_source'), exact('dpg_medium'),
        exact('dpg_campaign'), exact('dpg_content'), exact('nx_source'), exact('oprtrack'),
        exact('personaclick_input_query'), exact('personaclick_search_query'),
        exact('spot_im_redirect_source'), exact('srclt'), exact('tcsack'), exact('usqp'),
        exact('vs_campaign_id'), exact('vsm_cid'), exact('vsm_pid'), exact('vsm_type'),
        exact('winflncrtag'), exact('x-a-medium'),
    ],
    social: [
        exact('fbclid'), exact('fb_action_ids'), exact('fb_action_types'),
        exact('fb_source'), exact('fb_ref'), exact('action_object_map'),
        exact('action_type_map'), exact('action_ref_map'),
        exact('igshid'), exact('igsh'),
        exact('twclid'), exact('__twitter_impression'), exact('ref_src'),
        exact('tw_source'), exact('tw_campaign'), exact('tw_term'),
        exact('tw_content'), exact('tw_adid'),
        exact('ttclid'), exact('li_fat_id'), exact('sccid'), exact('ndclid'),
        exact('epik'),
        // Meta, X, TikTok and LINE ad macros and share ids
        exact('fbadid'), exact('fbc_id'), exact('fb_comment_id'), exact('meta_placement'),
        exact('meta_site_source'), exact('tw_medium'), exact('tw_kwdid'), exact('tw_profile_id'),
        exact('ttadid'), exact('line_uid'),
    ],
    email: [
        // Mailchimp, Marketo, HubSpot
        exact('mc_cid'), exact('mc_eid'), exact('mc_tc'), exact('mkt_tok'),
        exact('_hsenc'), exact('_hsmi'), exact('__hstc'), exact('__hssc'),
        exact('__hsfp'), exact('hsctatracking'), prefix('hsa_'), exact('hss_channel'),
        // Klaviyo, Drip, Vero, Omeda, Bronto, ActiveCampaign, Blueshift, Salesforce
        exact('_ke'), exact('_kx'), exact('__s'), exact('vero_conv'), exact('vero_id'),
        exact('oly_anon_id'), exact('oly_enc_id'), exact('_bta_tid'), exact('_bta_c'),
        exact('vgo_ee'), prefix('bsft_'), prefix('sfmc_'), prefix('trk_'),
        // dotdigital, MailerLite, ConvertKit, Beehiiv, Eloqua
        exact('dm_i'), exact('ml_subscriber'), exact('ml_subscriber_hash'),
        exact('ck_subscriber_id'), exact('_bhlid'), exact('elqtrackid'), exact('elqtrack'),
        exact('elqaid'), exact('elqat'), exact('elqcampaignid'),
        exact('nr_email_referer'), exact('sms_source'), exact('sms_click'), exact('sms_uph'),
        // Salesforce Marketing Cloud and Commerce Cloud, Squarespace, Mindbox,
        // Brave's `oft_*`, and assorted mail platforms
        exact('et_rid'), exact('sc_customer'), exact('sc_eh'), exact('sc_uid'),
        exact('ss_email_id'), exact('bbeml'), exact('mindbox-click-id'),
        exact('mindbox-message-key'), exact('oft_c'), exact('oft_ck'), exact('oft_d'),
        exact('oft_id'), exact('oft_ids'), exact('oft_k'), exact('oft_lk'), exact('oft_sk'),
        exact('emcs_t'), exact('ems_dl'), exact('eml-mediaplan'), exact('eml-name'),
        exact('eml-publisher'),
    ],
    ecommerce: [
        // Affiliate networks: Awin, CJ, Rakuten, Impact, Zanox, Amazon Associates
        exact('awc'), exact('cjevent'), exact('cjdata'), exact('ranmid'), exact('raneaid'),
        exact('ransiteid'), exact('irclickid'), exact('irgwc'), exact('zanpid'),
        exact('ascsubtag'), exact('linkcode'), exact('creativeasin'),
        prefix('pf_rd_'), prefix('pd_rd_'), exact('aff_request_id'), exact('clickid'),
        exact('click_id'), exact('k_clickid'),
        // ShareASale, Partnerize, Impact, Admitad
        exact('sscid'), exact('pjclid'), exact('x-clickref'), exact('im_ref'),
        exact('ir_adid'), exact('ir_campaignid'), exact('ir_partnerid'), exact('admitad_uid'),
        // Shopify storefront tracking — on every Shopify shop, custom domains included
        exact('_pos'), exact('_sid'), exact('_ss'), exact('_psq'), exact('_fd'),
        exact('pr_prod_strat'), exact('pr_rec_id'), exact('pr_rec_pid'),
        exact('pr_ref_pid'), exact('pr_seq'),
    ],
    other: [
        exact('ito'), exact('ftag'), exact('taid'), exact('gdfms'), exact('gdftrk'),
        exact('gdffi'),
    ],
});

/**
 * Global names that are NOT tracking on some paths (GlobalParameters.keptOnPaths),
 * where the token is how the page knows who is asking: Marketo's unsubscribe
 * and web-view pages read `mkt_tok`, Kit's unsubscribe page reads
 * `ck_subscriber_id`. Name → lowercased fragments of the (decoded) path; a
 * path containing any of them, in any case, keeps the name. From Brave's
 * `kConditionalQueryStringTrackers` (brave-browser#9018, #44341).
 *
 * @type {Readonly<Record<string, readonly string[]>>}
 */
export const GLOBAL_KEPT_ON_PATHS = Object.freeze({
    'mkt_tok': Object.freeze(['unsubscribe', 'emailwebview']),
    'ck_subscriber_id': Object.freeze(['/unsubscribe']),
});

/**
 * Tracking that is only tracking on one site (HostRules.all): `ref` is
 * Amazon's tag and GitHub's branch, so it is removed on the one and kept on
 * the other. `excluding` spares hosts that match `hosts` (Gmail under Google).
 *
 * swift-url-kit 0.2.0 adds the mainstream sites' pairs from the same audit
 * (each in at least one list, none a list or the site uses functionally).
 * They're for cleaning a link someone copies or shares, never for rewriting
 * a navigation: Google Lens and AI Mode loop without `biw`/`bih`.
 */
export const HOST_RULES = Object.freeze(/** @type {HostRule[]} */ ([

    // MARK: Search engines

    {hosts: [brand('google')], parameters: [
        exact('ved'), exact('ei'), exact('oq'), exact('esrc'), exact('uact'),
        exact('cd'), exact('cad'), exact('sa'), exact('usg'), exact('ust'),
        exact('rct'), exact('source'), exact('sxsrf'), exact('rlz'), exact('aqs'),
        exact('sourceid'), exact('iflsig'), exact('fbs'), exact('ictx'), exact('cshid'),
        exact('pcampaignid'), exact('sca_esv'), exact('sca_upv'), prefix('gs_'),
        prefix('gws_'), prefix('gfe_'), exact('bih'), exact('biw'), exact('dpr'),
        exact('vet'), exact('atyp'), exact('sei'), exact('dcr'), exact('je'),
        exact('_u'), exact('opi'), exact('oe'),
        exact('sclient'), exact('visit_id'), exact('sstk'), exact('uds'), exact('g_ep'),
        exact('site'),
    ], category: 'analytics', label: 'Google',
       // `ie` is not here: it is the query's code page (`ie=Shift_JIS`), and
       // uBlock Origin and AdGuard withdrew it ("Breaks codepage in Google Search").
       // Apps Script web apps take whatever parameters their author chose.
       excluding: [suffix('mail.google.com'), suffix('accounts.google.com'),
                   suffix('docs.google.com'), suffix('drive.google.com'),
                   suffix('script.google.com')]},

    {hosts: [suffix('play.google.com')], parameters: [
        exact('pcampaignid'), exact('referrer'),
    ], category: 'analytics', label: 'Google Play'},

    {hosts: [brand('bing')], parameters: [
        exact('cvid'), exact('sk'), exact('sp'), exact('sc'), exact('qs'), exact('qp'),
        exact('form'), exact('pq'), exact('ghc'), exact('ghsh'), exact('ghacc'),
        exact('ghpl'), exact('pglt'), exact('ntref'), exact('refig'),
    ], category: 'analytics', label: 'Bing'},

    {hosts: [suffix('duckduckgo.com')], parameters: [exact('t')],
             category: 'analytics', label: 'DuckDuckGo'},

    {hosts: [brand('yahoo')], parameters: [
        exact('fr'), exact('fr2'),
    ], category: 'analytics', label: 'Yahoo'},

    // Not `lr`: it is the search region (`lr=213` is Moscow), and changes the results.
    {hosts: [brand('yandex'), exact('ya.ru')], parameters: [
        exact('redircnt'), exact('clid'), exact('search_domain'), exact('search_source'),
        exact('did'), exact('mlid'), exact('msid'), exact('stid'), exact('persistent_id'),
        exact('source-serpid'), exact('suggest_reqid'), exact('utm-term'),
    ], category: 'analytics', label: 'Yandex'},

    {hosts: [suffix('msn.com')], parameters: [
        exact('cvid'), exact('ei'), exact('pc'), exact('vid'),
    ], category: 'analytics', label: 'MSN'},

    {hosts: [suffix('microsoft.com')], parameters: [
        exact('cvid'), exact('epi'), exact('nclid'),
    ], category: 'analytics', label: 'Microsoft'},

    // MARK: Video

    {hosts: [suffix('youtube.com'), suffix('youtu.be'), suffix('youtube-nocookie.com')],
             parameters: [
        exact('feature'), exact('si'), exact('kw'), exact('pp'), exact('ab_channel'),
        exact('embeds_referring_euri'), exact('embeds_referring_origin'),
        exact('source_ve_path'), exact('is'),
    ], category: 'other', label: 'YouTube'},

    // Not `jbv`: it opens a title's details over /browse.
    {hosts: [suffix('netflix.com')], parameters: [
        exact('trackid'), exact('tctx'),
    ], category: 'other', label: 'Netflix'},

    {hosts: [suffix('twitch.tv')], parameters: [
        exact('tt_medium'), exact('tt_content'), exact('tt_email_id'),
    ], category: 'other', label: 'Twitch'},

    {hosts: [suffix('bilibili.com'), exact('b23.tv')], parameters: [
        exact('spm_id_from'), exact('vd_source'), exact('from_source'), exact('from'),
        exact('seid'), exact('share_source'), exact('share_medium'), exact('share_plat'),
        exact('share_tag'), exact('share_session_id'), exact('share_from'),
        exact('share_times'), exact('unique_k'), exact('plat_id'), exact('buvid'),
        exact('is_story_h5'), exact('up_id'), exact('bbid'), exact('ts'),
        exact('visit_id'), exact('session_id'), exact('broadcast_type'),
        exact('is_room_feed'), exact('refer_from'), exact('msource'),
        exact('timestamp'), exact('launch_id'), exact('live_from'),
        exact('spmid'), exact('from_spmid'), exact('from_spm_id'), exact('track_id'),
        exact('trackid'), exact('request_id'), exact('caid'), exact('creative_id'),
        exact('linked_creative_id'), exact('csource'), exact('resource_id'),
        exact('source_id'), exact('native_mode'),
    ], category: 'other', label: 'Bilibili'},

    {hosts: [suffix('dailymotion.com')], parameters: [exact('ads_params')],
             category: 'other', label: 'Dailymotion'},

    {hosts: [suffix('giphy.com')], parameters: [
        exact('cid'), exact('ct'), exact('rid'),
    ], category: 'other', label: 'Giphy'},

    // MARK: Music

    {hosts: [suffix('spotify.com'), exact('spotify.link')], parameters: [
        exact('si'), exact('nd'), exact('dlsi'), exact('pi'), exact('sp_cid'),
        exact('referral'),
    ], category: 'other', label: 'Spotify'},

    {hosts: [suffix('apple.com')], parameters: [
        exact('app'), prefix('ign-itsc'), prefix('ign-mpt'), exact('itscg'),
        exact('itsct'), exact('ct'), exact('mt'), exact('ls'), exact('at'),
        exact('pt'), exact('uo'),
    ], category: 'analytics', label: 'Apple'},

    // MARK: Social

    {hosts: [suffix('facebook.com'), exact('fb.com'), exact('fb.me'), exact('fb.watch')],
             parameters: [
        exact('ref'), exact('fref'), exact('refid'), exact('ref_type'), exact('refsrc'),
        prefix('hc_'), prefix('__cft__'), prefix('__xts__'), exact('__tn__'), exact('eid'),
        exact('comment_tracking'), exact('dti'), exact('app'), exact('video_source'),
        exact('ftentidentifier'), exact('pageid'), exact('padding'), exact('ls_ref'),
        exact('action_history'), exact('tracking'), exact('referral_code'),
        exact('referral_story_type'), exact('eav'), exact('sfnsn'), exact('idorvanity'),
        exact('wtsid'), exact('rdc'), exact('rdr'), exact('paipv'), exact('_nc_x'),
        exact('_rdr'), exact('mibextid'), exact('rdid'), exact('extid'),
        exact('notif_id'), exact('notif_t'), exact('share_url'),
    ], category: 'social', label: 'Facebook'},

    {hosts: [suffix('instagram.com')], parameters: [
        exact('ig_rid'), exact('stkn'), exact('click_source'),
    ], category: 'social', label: 'Instagram'},

    {hosts: [suffix('threads.net'), suffix('threads.com')], parameters: [
        exact('xmt'),
    ], category: 'social', label: 'Threads'},

    {hosts: [suffix('twitter.com'), suffix('x.com'), exact('t.co')], parameters: [
        exact('s'), exact('t'), exact('cn'), exact('src'), exact('ref_url'),
        exact('cxt'), exact('mx'), exact('refsrc'), exact('a'),
    ], category: 'social', label: 'Twitter/X'},

    // Not `enter_from` (Douyin keeps it): TikTok's effect pages need it to bring
    // comments back after a login, so uBlock Origin and AdGuard withdrew it.
    {hosts: [suffix('tiktok.com')], parameters: [
        exact('_d'), exact('_t'), exact('_r'), exact('u_code'), exact('preview_pb'),
        exact('timestamp'), exact('user_id'), exact('share_app_name'), exact('share_app_id'),
        exact('share_iid'), exact('share_link_id'), exact('source'), exact('sender_device'),
        exact('sender_web_id'), exact('is_from_webapp'), exact('is_copy_url'), exact('k'),
        exact('checksum'), exact('tt_from'), exact('enter_method'),
        exact('_svg'), exact('refer'), exact('referer_url'), exact('referer_video_id'),
        exact('web_id'), exact('t'), exact('embed_source'), exact('share_author_id'),
        exact('share_region'), exact('social_share_type'), exact('trackparams'),
        exact('ug_btm'), exact('sec_user_id'),
    ], category: 'social', label: 'TikTok'},

    {hosts: [suffix('douyin.com')], parameters: [
        exact('previous_page'), exact('enter_from'), exact('enter_method'), exact('iid'),
    ], category: 'social', label: 'Douyin'},

    {hosts: [suffix('reddit.com'), exact('redd.it')], parameters: [
        exact('$deep_link'), exact('%24deep_link'), exact('correlation_id'),
        exact('ref_campaign'), exact('ref_source'), exact('$3p'), exact('%243p'),
        exact('rdt'), exact('$original_url'), exact('%24original_url'),
        exact('share_id'), exact('ref'), exact('ref_share'), exact('entry_point'),
        exact('post_index'), exact('post_fullname'), exact('target_user'),
    ], category: 'social', label: 'Reddit'},

    {hosts: [suffix('linkedin.com'), exact('lnkd.in')], parameters: [
        exact('trk'), exact('trkinfo'), exact('trkemail'), exact('refid'),
        exact('trackingid'), exact('lipi'), exact('licu'), exact('original_referer'),
        exact('upsellorderorigin'), exact('midtoken'), exact('midsig'), exact('eid'),
        exact('rcm'), exact('ebp'), exact('alternatechannel'), exact('isjobsearch'),
        exact('origin'), exact('originalreferer'), exact('courseclaim'),
    ], category: 'social', label: 'LinkedIn'},

    {hosts: [suffix('pinterest.com'), exact('pin.it')], parameters: [
        exact('sender'), exact('sfo'), exact('nic_v2'), exact('nic_v3'),
    ], category: 'social', label: 'Pinterest'},

    {hosts: [suffix('snapchat.com')], parameters: [exact('sc_referrer'), exact('sc_ua')],
             category: 'social', label: 'Snapchat'},

    {hosts: [suffix('tumblr.com')], parameters: [exact('source')],
             category: 'social', label: 'Tumblr'},

    {hosts: [exact('vk.com'), exact('vk.ru')], parameters: [
        exact('from'), exact('ref'), exact('ref_domain'),
    ], category: 'social', label: 'VK'},

    {hosts: [suffix('weibo.com'), suffix('weibo.cn')], parameters: [
        exact('refer_flag'), exact('from'), exact('dt_dapp'), exact('weibo_id'),
    ], category: 'social', label: 'Weibo'},

    // Never `xsec_token`: the note page will not open without it.
    {hosts: [suffix('xiaohongshu.com')], parameters: [
        exact('xhsshare'), exact('share_id'), exact('share_channel'), exact('app_platform'),
        exact('app_version'), exact('apptime'), exact('appuid'), exact('author_share'),
        exact('share_from_user_hidden'), exact('shareredid'), exact('exsource'),
    ], category: 'social', label: 'Xiaohongshu'},

    {hosts: [suffix('zhihu.com')], parameters: [
        exact('hybrid_search_source'), exact('hybrid_search_extra'),
    ], category: 'social', label: 'Zhihu'},

    {hosts: [suffix('meetup.com')], parameters: [
        exact('eventorigin'), exact('recid'), exact('recsource'), exact('searchid'),
        exact('_xtd'), exact('rv'),
    ], category: 'social', label: 'Meetup'},

    {hosts: [suffix('change.org')], parameters: [
        exact('source_location'), exact('recruiter'), exact('recruited_by_id'),
        exact('share_id'), exact('user_flow'), exact('psf_variant'), exact('share_intent'),
    ], category: 'social', label: 'Change.org'},

    // MARK: Shopping

    {hosts: [brand('amazon'), exact('a.co'), exact('amzn.to'), exact('amzn.eu'), exact('amzn.asia')],
             parameters: [
        exact('ref'), exact('ref_'), exact('tag'), exact('th'), exact('qid'), exact('sr'),
        exact('srs'), exact('sprefix'), exact('crid'), exact('dchild'), exact('camp'),
        exact('creative'), exact('aaxitk'), exact('hsa_cr_id'), exact('content-id'),
        exact('dib'), exact('dib_tag'), exact('social_share'), exact('starsleft'),
        exact('skiptwisterog'), exact('_encoding'), exact('smid'), exact('qualifier'),
        exact('spia'), exact('ms3_c'), exact('refrid'), exact('rnid'),
        exact('field-lbr_brands_browse-bin'), prefix('__mk_'), exact('ie'), exact('adid'),
        prefix('cv_ct_'), prefix('sb-ci-'), exact('linkid'),
        // Google Shopping ad macros, OneLink (Associates), share and widget tracking
        exact('hvadid'), exact('hvbmt'), exact('hvdev'), exact('hvlocphy'), exact('hvnetw'),
        exact('hvrand'), exact('hvtargid'), exact('hydadcr'), exact('adgrpid'),
        exact('creativeid'), exact('ingress'), exact('visitid'), exact('vtr'), exact('ts_id'),
        exact('plattr'), exact('sbo'), exact('sp_csd'), exact('store_ref'),
        exact('ref_pageloadid'), exact('pageloadid'), exact('asc_campaign'),
        exact('asc_refurl'), exact('asc_source'), exact('twitchreferral'), exact('ytwchpos'),
        exact('reftag'), exact('ld'), exact('eac_id'), exact('eac_link'), exact('eac_selected'),
        exact('lp_slot'),
    ], category: 'ecommerce', label: 'Amazon'},

    // Not `source_code`: on Audible it is a promotion code.
    {hosts: [brand('audible')], parameters: [
        exact('ref'), exact('ref_'), exact('qid'), exact('sr'), exact('crid'),
        exact('content-id'), exact('dchild'), exact('_encoding'),
    ], category: 'ecommerce', label: 'Audible'},

    {hosts: [suffix('imdb.com')], parameters: [exact('ref_')],
             category: 'ecommerce', label: 'IMDb'},

    {hosts: [brand('ebay')], parameters: [
        exact('_trkparms'), exact('_trksid'), exact('_from'), exact('hash'),
        exact('mkevt'), exact('mkcid'), exact('mkrid'), exact('mkpid'), exact('campid'),
        exact('toolid'), exact('customid'), exact('amdata'), exact('ssspo'), exact('sssrc'),
        exact('ssuid'), exact('_skw'),
    ], category: 'ecommerce', label: 'eBay'},

    {hosts: [brand('aliexpress')], parameters: [
        exact('ws_ab_test'), exact('btsid'), exact('algo_expid'), exact('algo_exp_id'),
        exact('algo_pvid'), exact('gps-id'), prefix('scm'), exact('cv'), exact('af'),
        exact('mall_affr'), exact('sk'), exact('dp'), exact('terminal_id'),
        exact('spm'), exact('pdp_npi'), exact('pdp_ext_f'), exact('gatewayadapt'),
        exact('utparam-url'), exact('aff_fcid'), exact('aff_fsk'), exact('aff_platform'),
        exact('aff_trace_key'), exact('afsmartredirect'), exact('srcsns'),
        exact('businesstype'), exact('templateid'), exact('curpageloguid'), exact('pvid'),
        exact('utparam'), exact('aff_short_key'),
    ], category: 'ecommerce', label: 'AliExpress'},

    {hosts: [brand('temu')], parameters: [
        prefix('_x_'), prefix('_oak_'), exact('_bg_fs'), exact('_p_rfs'), exact('_p_jump_id'),
        exact('refer_page_name'), exact('refer_page_id'), exact('refer_page_sn'),
        exact('refer_page_el_sn'), exact('refer_share_channel'), exact('refer_share_id'),
        exact('refer_share_suin'), exact('refer_source'), exact('from_share'),
        exact('share_img'), exact('mrk_rec'), exact('adg_ctx'), exact('freesia_scene'),
        exact('top_gallery_url'),
    ], category: 'ecommerce', label: 'Temu'},

    {hosts: [brand('shein')], parameters: [
        exact('src_module'), exact('src_tab_page_id'), exact('src_identifier'),
        exact('ici'), exact('scici'),
    ], category: 'ecommerce', label: 'Shein'},

    {hosts: [suffix('taobao.com'), suffix('tmall.com')], parameters: [
        exact('spm'), exact('scm'), exact('ut_sk'), exact('sp_tk'), exact('share_crt_v'),
        exact('suid'), exact('cpp'), exact('shareurl'), exact('short_name'), exact('pvid'),
        exact('un'), exact('sourcetype'), exact('tbsocialpopkey'), exact('app'),
        exact('bxsign'), exact('tk'), exact('ali_trackid'), exact('ali_refid'),
        exact('abbucket'), exact('abtest'), exact('acm'), exact('union_lens'), exact('utparam'),
        exact('xmktid'), exact('tksid'), exact('app_pvid'), exact('impid'), exact('lygclk'),
        exact('bftrwd'), exact('bfttag'), exact('turing_bucket'), exact('mytmenu'),
        exact('trackinfo'), exact('utkn'), exact('user_number_id'), exact('traceid'),
    ], category: 'ecommerce', label: 'Taobao'},

    {hosts: [suffix('flipkart.com')], parameters: [
        exact('_refid'), exact('pageuid'), exact('pwsvid'), exact('ssid'), exact('otracker'),
        exact('fm'), exact('ppt'), exact('ppn'), exact('srno'), exact('hpid'), exact('affid'),
    ], category: 'ecommerce', label: 'Flipkart'},

    {hosts: [brand('shopee')], parameters: [
        exact('sp_atk'), exact('xptdk'), exact('publish_id'),
    ], category: 'ecommerce', label: 'Shopee'},

    {hosts: [brand('lazada')], parameters: [
        exact('laz_trackid'), exact('mkttid'), exact('clicktrackinfo'), exact('spm'),
        exact('scm'), exact('acm'), exact('ad_src'), exact('abid'), exact('pvid'),
        exact('impsrc'), exact('pid_pvid'),
    ], category: 'ecommerce', label: 'Lazada'},

    {hosts: [suffix('tokopedia.com')], parameters: [exact('extparam')],
             category: 'ecommerce', label: 'Tokopedia'},

    {hosts: [suffix('rakuten.co.jp')], parameters: [
        exact('scid'), exact('sc2id'), exact('iasid'), exact('l-id'), exact('s-id'),
        exact('trflg'),
    ], category: 'ecommerce', label: 'Rakuten Ichiba'},

    {hosts: [suffix('newegg.com')], parameters: [
        exact('acrid'), exact('asid'), exact('asubid'), exact('affname'), exact('affid'),
    ], category: 'ecommerce', label: 'Newegg'},

    {hosts: [suffix('otto.de')], parameters: [
        exact('affiliateid'), exact('campid'), exact('actionid'),
    ], category: 'ecommerce', label: 'Otto'},

    {hosts: [brand('idealo')], parameters: [
        exact('offerlistid'), exact('offerkey'), exact('osid'), exact('lcb'), exact('disc'),
    ], category: 'ecommerce', label: 'Idealo'},

    {hosts: [suffix('argos.co.uk')], parameters: [
        exact('clickorigin'), exact('istbid'), exact('istcompanyid'), exact('istfeedid'),
        exact('istitemid'),
    ], category: 'ecommerce', label: 'Argos'},

    {hosts: [suffix('allegro.pl')], parameters: [exact('reco_id')],
             category: 'ecommerce', label: 'Allegro'},

    {hosts: [suffix('etsy.com')], parameters: [
        exact('click_key'), exact('click_sum'), exact('organic_search_click'), exact('ref'),
        exact('frs'), exact('crt'), exact('sts'), exact('share_time'),
    ], category: 'ecommerce', label: 'Etsy'},

    {hosts: [suffix('walmart.com')], parameters: [exact('u1'), prefix('ath')],
             category: 'ecommerce', label: 'Walmart'},

    {hosts: [suffix('bestbuy.com')], parameters: [
        exact('loc'), exact('acampid'), exact('mpid'), exact('intl'), exact('ref'),
    ], category: 'ecommerce', label: 'Best Buy'},

    {hosts: [suffix('target.com')], parameters: [
        exact('afid'), exact('cpng'), exact('fndsrc'), exact('lnm'), exact('ref'),
    ], category: 'ecommerce', label: 'Target'},

    {hosts: [suffix('steampowered.com'), suffix('steamcommunity.com')],
             parameters: [exact('snr')], category: 'ecommerce', label: 'Steam'},

    {hosts: [suffix('epicgames.com')], parameters: [
        exact('epic_affiliate'), exact('epic_gameid'),
    ], category: 'ecommerce', label: 'Epic Games'},

    {hosts: [suffix('gog.com')], parameters: [
        exact('pp'), exact('link_id'), exact('track_click'),
    ], category: 'ecommerce', label: 'GOG'},

    {hosts: [suffix('humblebundle.com')], parameters: [
        exact('partner'), exact('mcid'), exact('linkid'),
    ], category: 'ecommerce', label: 'Humble Bundle'},

    {hosts: [suffix('wise.com')], parameters: [
        exact('partnerizecampaignid'), exact('clickref'), exact('adref'), exact('partnerid'),
    ], category: 'ecommerce', label: 'Wise'},

    {hosts: [suffix('roblox.com')], parameters: [exact('refpageid')],
             category: 'other', label: 'Roblox'},

    // MARK: Travel

    {hosts: [brand('airbnb')], parameters: [
        exact('federated_search_id'), exact('search_type'), exact('source'),
        exact('source_impression_id'), exact('previous_page_section_name'),
        exact('unique_share_id'), exact('viralityentrypoint'), exact('_set_bev_on_new_domain'),
    ], category: 'other', label: 'Airbnb'},

    {hosts: [suffix('booking.com')], parameters: [
        exact('aid'), exact('label'), exact('sid'), exact('srpvid'), exact('from_sn'),
        exact('ucfs'),
    ], category: 'ecommerce', label: 'Booking.com'},

    {hosts: [brand('tripadvisor')], parameters: [exact('m'), prefix('sup')],
             category: 'other', label: 'Tripadvisor'},

    {hosts: [suffix('trip.com')], parameters: [
        exact('allianceid'), exact('trip_sub1'),
    ], category: 'ecommerce', label: 'Trip.com'},

    {hosts: [suffix('uber.com')], parameters: [exact('uclick_id')],
             category: 'other', label: 'Uber'},

    // MARK: Publishers

    {hosts: [suffix('nytimes.com')], parameters: [
        exact('smid'), exact('smtyp'), exact('emc'), exact('nl'), exact('te'),
        exact('referringsource'), exact('regi_id'), exact('segment_id'),
        exact('campaign_id'), exact('instance_id'), exact('user_id'), exact('impression_id'),
        exact('sgrp'),
    ], category: 'other', label: 'New York Times'},

    {hosts: [suffix('wsj.com')], parameters: [exact('reflink'), exact('mod')],
             category: 'other', label: 'WSJ'},

    {hosts: [suffix('cnn.com'), suffix('cnn.co.jp')], parameters: [exact('ref')],
             category: 'other', label: 'CNN'},

    {hosts: [suffix('reuters.com')], parameters: [exact('rpc')],
             category: 'other', label: 'Reuters'},

    {hosts: [suffix('theathletic.com')], parameters: [exact('source')],
             category: 'other', label: 'The Athletic'},

    // Condé Nast's titles share one platform. `mbid` was global until 0.2.0.
    {hosts: [suffix('newyorker.com'), suffix('wired.com'), suffix('wired.co.uk'),
                     suffix('vanityfair.com'), suffix('vogue.com'), suffix('gq.com')], parameters: [
        exact('mbid'), exact('bxid'), exact('cndid'), exact('esrc'), exact('source'),
    ], category: 'other', label: 'Condé Nast'},

    {hosts: [suffix('boredpanda.com')], parameters: [
        exact('cexp_id'), exact('cexp_var'), exact('h'),
    ], category: 'other', label: 'Bored Panda'},

    {hosts: [suffix('theguardian.com')], parameters: [exact('cmp')],
             category: 'other', label: 'The Guardian'},

    {hosts: [suffix('bbc.com'), suffix('bbc.co.uk')], parameters: [
        exact('ns_mchannel'), exact('ns_source'), exact('ns_campaign'),
        exact('ns_linkname'), exact('ns_fee'), exact('facebook_page'),
    ], category: 'other', label: 'BBC'},

    {hosts: [suffix('washingtonpost.com')], parameters: [
        exact('itid'), exact('wpisrc'), exact('wpmk'), exact('tid'),
    ], category: 'other', label: 'Washington Post'},

    {hosts: [suffix('bloomberg.com')], parameters: [
        exact('leadsource'), exact('srnd'), exact('sref'), exact('in_source'),
    ], category: 'other', label: 'Bloomberg'},

    {hosts: [suffix('forbes.com')], parameters: [exact('sh')],
             category: 'other', label: 'Forbes'},

    {hosts: [suffix('spiegel.de')], parameters: [
        exact('b'), exact('sara_ref'), exact('sara_ecid'),
    ], category: 'other', label: 'Spiegel'},

    {hosts: [suffix('medium.com')], parameters: [exact('source')],
             category: 'other', label: 'Medium'},

    {hosts: [suffix('substack.com')], parameters: [
        exact('r'), exact('s'), exact('triedredirect'), exact('isfreemail'),
    ], category: 'other', label: 'Substack'},

    {hosts: [suffix('goodreads.com')], parameters: [
        exact('ref'), exact('ac'), exact('from_search'), exact('from_srp'), exact('qid'),
        exact('rank'),
    ], category: 'other', label: 'Goodreads'},

    {hosts: [suffix('wikipedia.org'), suffix('wikimedia.org')], parameters: [exact('wprov')],
             category: 'other', label: 'Wikipedia'},

    // MARK: Work

    {hosts: [suffix('github.com')], parameters: [
        exact('email_token'), exact('email_source'), exact('notification_referrer_id'),
        exact('ref_cta'), exact('ref_loc'), exact('ref_page'), exact('ref_product'),
        exact('ref_style'), exact('ref_plan'), exact('reference_location'),
    ], category: 'other', label: 'GitHub'},

    {hosts: [suffix('stackoverflow.com'), suffix('stackexchange.com')], parameters: [
        exact('so_medium'), exact('so_source'), exact('r'),
    ], category: 'other', label: 'Stack Overflow'},

    {hosts: [suffix('quora.com')], parameters: [
        exact('ch'), exact('oid'), exact('share'), exact('srid'), exact('target_type'),
        exact('al_imp'),
    ], category: 'other', label: 'Quora'},

    {hosts: [suffix('notion.so'), suffix('notion.site')], parameters: [exact('pvs')],
             category: 'other', label: 'Notion'},

    {hosts: [suffix('indeed.com')], parameters: [
        exact('from'), exact('alid'), exact('tk'), exact('vjtk'), exact('advn'),
        exact('adid'), exact('sjdu'), exact('xkcb'),
    ], category: 'other', label: 'Indeed'},

    {hosts: [suffix('glassdoor.com')], parameters: [
        exact('ao'), exact('guid'), exact('src'), exact('vt'), exact('cs'), exact('cb'),
    ], category: 'other', label: 'Glassdoor'},

    {hosts: [suffix('mozilla.org')], parameters: [exact('src'), exact('redirect_source')],
             category: 'other', label: 'Mozilla'},

    {hosts: [suffix('kickstarter.com')], parameters: [
        exact('ref'), exact('total_hits'),
    ], category: 'other', label: 'Kickstarter'},

    {hosts: [suffix('fiverr.com')], parameters: [
        exact('context_referrer'), exact('funnel'), exact('ref_ctx_id'), exact('source'),
        exact('context_type'), exact('imp_id'), exact('pos'),
    ], category: 'other', label: 'Fiverr'},
]));

/**
 * Hosts whose links are never cleaned, only unwrapped when they're a redirect
 * (HostRules.neverStrip): their query is the content. An archived page's own
 * URL, a signed Proofpoint link that didn't unwrap, a ticket or a login
 * token. From the lists' allowlists (AdGuard, uBlock Origin, Brave's
 * `kExemptedHostnames`, DuckDuckGo), fetched 2026-11-09; UnivIS reads Drip's
 * `__s` as its own session parameter.
 *
 * @type {readonly HostPattern[]}
 */
export const NEVER_STRIP_HOSTS = Object.freeze([
    // Web archives
    suffix('archive.org'), suffix('wayback.archive-it.org'), suffix('archive.today'),
    suffix('archive.ph'), suffix('archive.is'), suffix('archive.li'), suffix('archive.md'),
    suffix('archive.vn'), suffix('archive.fo'), suffix('megalodon.jp'),
    suffix('warp.ndl.go.jp'), suffix('gyo.tc'),
    // Signed or token-bearing links
    suffix('urldefense.com'), suffix('urldefense.proofpoint.com'), suffix('axs.com'),
    suffix('eloqua.com'),
    // UnivIS course catalogues
    suffix('univis.uni-erlangen.de'), suffix('univis.uni-bamberg.de'),
    suffix('univis.uni-luebeck.de'), suffix('univis.uni-kiel.de'), suffix('univis.th-koeln.de'),
]);

/**
 * Redirect pages that carry their destination in the URL (Redirects.rules),
 * peeled offline. The first matching rule that yields an http(s) URL wins.
 * See {@link RedirectSource} and {@link RedirectEncoding}. Affiliate networks'
 * wrappers are labelled by network, so `keepAffiliate` can leave them wrapped.
 *
 * @type {readonly RedirectRule[]}
 */
export const REDIRECT_RULES = Object.freeze(/** @type {RedirectRule[]} */ ([
    // Search engines and mail clients — where most pasted redirects come from
    {hosts: [brand('google')], pathPrefix: '/url',
                 source: {query: ['url', 'q']}, label: 'Google'},
    {hosts: [brand('google')], pathPrefix: '/amp/s/',
                 source: {pathAfter: '/amp/s/'}, encoding: 'schemeless', label: 'Google AMP'},
    {hosts: [brand('google')], pathPrefix: '/amp/',
                 source: {pathAfter: '/amp/'}, encoding: 'schemeless', label: 'Google AMP'},
    {hosts: [brand('google')], pathPrefix: '/aclk',
                 source: {query: ['adurl']}, label: 'Google Ads'},
    {hosts: [suffix('googleadservices.com'), brand('doubleclick')],
                 source: {query: ['adurl']}, label: 'Google Ads'},
    {hosts: [brand('bing')], pathPrefix: '/ck/a',
                 source: {query: ['u']}, encoding: 'bingBase64', label: 'Bing'},
    {hosts: [suffix('duckduckgo.com')], pathPrefix: '/l/',
                 source: {query: ['uddg']}, label: 'DuckDuckGo'},
    {hosts: [exact('r.search.yahoo.com')], source: {pathSegment: 'RU='}, label: 'Yahoo'},
    {hosts: [suffix('naver.com')], pathPrefix: '/p/crd/rd',
                 source: {query: ['u']}, label: 'Naver'},
    {hosts: [suffix('safelinks.protection.outlook.com'),
                         suffix('safelinks.protection.office365.us')],
                 source: {query: ['url']}, label: 'Outlook Safe Links'},
    {hosts: [suffix('teams.cdn.office.net')], pathPrefix: '/evergreen-assets/safelinks/',
                 source: {query: ['url']}, label: 'Teams Safe Links'},
    {hosts: [suffix('urldefense.proofpoint.com')], pathPrefix: '/v1/url',
                 source: {query: ['u']}, label: 'Proofpoint'},
    {hosts: [suffix('urldefense.proofpoint.com')], pathPrefix: '/v2/url',
                 source: {query: ['u']}, encoding: 'proofpointV2', label: 'Proofpoint'},
    {hosts: [suffix('urldefense.com')], pathPrefix: '/v3/',
                 source: {proofpointV3: true}, encoding: 'proofpointV3', label: 'Proofpoint'},
    {hosts: [suffix('linkprotect.cudasvc.com')], pathPrefix: '/url',
                 source: {query: ['a']}, label: 'Barracuda'},
    {hosts: [suffix('secure-web.cisco.com')], source: {lastPathSegment: true},
                 label: 'Cisco Secure Email'},
    {hosts: [suffix('protection.sophos.com')], source: {query: ['u']},
                 encoding: 'base64', label: 'Sophos'},
    {hosts: [suffix('trendmicro.com')], pathPrefix: '/wis/clicktime/',
                 source: {query: ['url']}, label: 'Trend Micro'},
    {hosts: [suffix('clicktime.symantec.com')], source: {query: ['u']}, label: 'Symantec'},
    {hosts: [exact('slack-redir.net')], pathPrefix: '/link',
                 source: {query: ['url']}, label: 'Slack'},

    // Mail platforms' click tracking that carries the destination
    {hosts: [suffix('links.govdelivery.com')], pathPrefix: '/track',
                 source: {query: ['url']}, label: 'GovDelivery'},
    {hosts: [suffix('awstrack.me')], pathPrefix: '/L0/',
                 source: {pathSegmentAfter: '/L0/'}, label: 'Amazon SES'},
    {hosts: [suffix('customeriomail.com')], pathPrefix: '/e/c/',
                 source: {pathSegmentAfter: '/e/c/'}, encoding: {base64JSON: 'href'}, label: 'Customer.io'},
    {hosts: [exact('click.convertkit-mail.com'), exact('click.convertkit-mail2.com'),
                         exact('click.convertkit-mail3.com'), exact('click.convertkit-mail4.com')],
                 source: {lastPathSegment: true}, encoding: 'base64', label: 'Kit'},

    // Social
    {hosts: [exact('l.facebook.com'), exact('lm.facebook.com'), exact('l.messenger.com'),
                         exact('facebook.com'), exact('m.facebook.com')],
                 pathPrefix: '/l.php', source: {query: ['u']}, label: 'Facebook'},
    {hosts: [suffix('facebook.com')], pathPrefix: '/flx/warn',
                 source: {query: ['u']}, label: 'Facebook'},
    {hosts: [exact('l.instagram.com')], source: {query: ['u']}, label: 'Instagram'},
    {hosts: [exact('l.threads.net'), exact('l.threads.com')], source: {query: ['u']}, label: 'Threads'},
    {hosts: [exact('l.wl.co')], source: {query: ['u']}, label: 'WhatsApp'},
    {hosts: [suffix('youtube.com')], pathPrefix: '/redirect',
                 source: {query: ['q']}, label: 'YouTube'},
    {hosts: [exact('out.reddit.com'), exact('click.redditmail.com')],
                 source: {query: ['url']}, label: 'Reddit'},
    {hosts: [suffix('linkedin.com')], pathPrefix: '/redir/redirect',
                 source: {query: ['url']}, label: 'LinkedIn'},
    {hosts: [suffix('linkedin.com')], pathPrefix: '/safety/go',
                 source: {query: ['url']}, label: 'LinkedIn'},
    {hosts: [exact('t.umblr.com')], pathPrefix: '/redirect',
                 source: {query: ['z']}, label: 'Tumblr'},
    {hosts: [suffix('vk.com'), suffix('vk.ru')], pathPrefix: '/away.php',
                 source: {query: ['to']}, label: 'VK'},
    {hosts: [suffix('ok.ru')], pathPrefix: '/dk',
                 source: {query: ['st.link']}, label: 'OK'},
    {hosts: [exact('disq.us')], source: {query: ['url']}, encoding: 'disqus', label: 'Disqus'},
    {hosts: [suffix('deviantart.com')], pathPrefix: '/users/outgoing',
                 source: {query: ['url']}, label: 'DeviantArt'},
    {hosts: [suffix('medium.com')], pathPrefix: '/r/',
                 source: {query: ['url']}, label: 'Medium'},
    {hosts: [brand('pinterest')], pathPrefix: '/offsite',
                 source: {query: ['url']}, label: 'Pinterest'},
    {hosts: [exact('gate.sc')], source: {query: ['url']}, label: 'SoundCloud'},
    {hosts: [suffix('weibo.cn')], pathPrefix: '/sinaurl',
                 source: {query: ['u', 'toasturl']}, label: 'Weibo'},
    {hosts: [suffix('douban.com')], pathPrefix: '/link2',
                 source: {query: ['url']}, label: 'Douban'},
    {hosts: [exact('link.zhihu.com')], source: {query: ['target']}, label: 'Zhihu'},
    {hosts: [exact('link.csdn.net')], source: {query: ['target']}, label: 'CSDN'},
    {hosts: [exact('link.juejin.cn')], source: {query: ['target']}, label: 'Juejin'},
    {hosts: [exact('gitee.com')], pathPrefix: '/link',
                 source: {query: ['target']}, label: 'Gitee'},
    {hosts: [exact('links.jianshu.com')], pathPrefix: '/go',
                 source: {query: ['to']}, label: 'Jianshu'},

    // Gaming, shopping, misc
    {hosts: [suffix('steamcommunity.com')], pathPrefix: '/linkfilter/',
                 source: {query: ['url', 'u']}, label: 'Steam'},
    {hosts: [suffix('curseforge.com')], pathPrefix: '/linkout',
                 source: {query: ['remoteUrl']}, label: 'CurseForge'},
    {hosts: [brand('ebay')], pathPrefix: '/rover/',
                 source: {query: ['mpre']}, label: 'eBay'},
    {hosts: [suffix('amazon-adsystem.com')], pathPrefix: '/x/c/',
                 source: {pathAfterSegments: 3}, label: 'Amazon Ads'},
    {hosts: [suffix('anonym.to'), exact('href.li')],
                 source: {query: ['url', '']}, label: 'Anonymiser'},
    {hosts: [suffix('cdn.ampproject.org')], pathPrefix: '/c/s/',
                 source: {pathAfter: '/c/s/'}, encoding: 'schemeless', label: 'AMP cache'},
    {hosts: [suffix('cdn.ampproject.org')], pathPrefix: '/v/s/',
                 source: {pathAfter: '/v/s/'}, encoding: 'schemeless', label: 'AMP cache'},

    // Affiliate networks — each records the click that credits a referrer
    {hosts: [suffix('linksynergy.com')], source: {query: ['murl']}, label: 'Rakuten'},
    {hosts: [suffix('awin1.com')], source: {query: ['ued']}, label: 'Awin'},
    {hosts: [suffix('anrdoezrs.net'), suffix('dpbolvw.net'), suffix('jdoqocy.com'),
                         suffix('tkqlhce.com'), suffix('kqzyfj.com')], pathPrefix: '/click-',
                 source: {query: ['url']}, label: 'CJ'},
    {hosts: [suffix('sjv.io'), suffix('pxf.io'), suffix('7eer.net'), suffix('evyy.net'),
                         suffix('ojrq.net')], pathPrefix: '/c/',
                 source: {query: ['u']}, label: 'Impact'},
    {hosts: [suffix('shareasale.com')], pathPrefix: '/r.cfm',
                 source: {query: ['urllink']}, encoding: 'schemeOptional', label: 'ShareASale'},
    {hosts: [exact('prf.hn')], pathPrefix: '/click/',
                 source: {pathSegment: 'destination:'}, label: 'Partnerize'},
    {hosts: [exact('go.skimresources.com'), exact('go.redirectingat.com')],
                 source: {query: ['url']}, label: 'Skimlinks'},
    {hosts: [exact('redirect.viglink.com')], source: {query: ['u', 'ourl']}, label: 'Viglink'},
    {hosts: [suffix('admitad.com')], source: {query: ['ulp']}, label: 'Admitad'},
    {hosts: [suffix('tradedoubler.com')], source: {query: ['url', '_td_deeplink']},
                 label: 'Tradedoubler'},
]));

/** Share-button fragment suffixes: AddThis's `#.Vh3x.twitter`, ShareThis's `#sthash.abc.dpbs` (Fragments.shareSuffixes). */
export const FRAGMENT_SHARE_SUFFIXES = Object.freeze(new Set([
    'facebook', 'twitter', 'email', 'linkedin', 'gmail', 'tumblr', 'reddit',
    'pinterest', 'whatsapp', 'dpuf', 'dpbs', 'gplus', 'google_plus',
]));
