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
 * A redirect page and where it keeps its destination.
 *
 * @typedef {object} RedirectRule
 * @property {HostPattern[]} hosts Where it applies.
 * @property {string} [pathPrefix] Its path starts with this.
 * @property {{query?: string[], pathAfter?: string, proofpointV3?: boolean}} source Where the destination is.
 * @property {'percent' | 'schemeless' | 'bingBase64' | 'proofpointV2'} [encoding] How it's encoded. Default 'percent'.
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
 */
export const GLOBAL_PARAMETERS = Object.freeze({
    analytics: [
        // Google Analytics / Ads / Merchant
        prefix('utm_'), exact('gclid'), exact('gclsrc'), exact('dclid'),
        exact('gbraid'), exact('wbraid'), exact('gad_source'), exact('gad_campaignid'),
        exact('gad'), exact('srsltid'), exact('_ga'), exact('_gl'), exact('gs_l'),
        // Microsoft, Yandex, Baidu
        exact('msclkid'), exact('yclid'), exact('ysclid'), exact('_openstat'),
        // Matomo / Piwik
        prefix('mtm_'), prefix('pk_'), prefix('piwik_'), prefix('matomo_'),
        // Adobe / Marin / Kenshoo / Webtrekk / AT Internet
        exact('s_kwcid'), exact('ef_id'), exact('mkwid'), exact('pcrid'), exact('pgrid'),
        exact('ptaid'), prefix('wt_'), exact('wtrid'), exact('xtor'), exact('xtref'),
        prefix('at_'), prefix('otm_'), prefix('stm_'), prefix('hmb_'),
        // IBM Acoustic
        exact('cm_mmc'), exact('cm_ven'), exact('cm_cat'), exact('cm_pla'),
        exact('cm_ite'), exact('cm_lm'), exact('cm_sp'),
        // Assorted attribution
        exact('cmpid'), exact('mbid'), exact('ncid'), exact('sr_share'),
        exact('guccounter'), exact('guce_referrer'), exact('guce_referrer_sig'),
        exact('sznclid'), exact('dicbo'), exact('wickedid'), exact('rb_clickid'),
        exact('ceneo_spo'), exact('os_ehash'), exact('_branch_match_id'),
        exact('_branch_referrer'), exact('ocid'), exact('icid'), exact('intcid'),
        exact('intcmp'), exact('int_source'), exact('int_medium'), exact('int_campaign'),
        exact('soc_src'), exact('soc_trk'), exact('echobox'), exact('__source'),
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
    ],
    email: [
        // Mailchimp, Marketo, HubSpot
        exact('mc_cid'), exact('mc_eid'), exact('mc_tc'), exact('mkt_tok'),
        exact('_hsenc'), exact('_hsmi'), exact('__hstc'), exact('__hssc'),
        exact('__hsfp'), exact('hsctatracking'), prefix('hsa_'),
        // Klaviyo, Drip, Vero, Omeda, Bronto, ActiveCampaign, Blueshift, Salesforce
        exact('_ke'), exact('_kx'), exact('__s'), exact('vero_conv'), exact('vero_id'),
        exact('oly_anon_id'), exact('oly_enc_id'), exact('_bta_tid'), exact('_bta_c'),
        exact('vgo_ee'), prefix('bsft_'), prefix('sfmc_'), prefix('trk_'),
        // dotdigital, MailerLite, ConvertKit, Beehiiv, Eloqua
        exact('dm_i'), exact('ml_subscriber'), exact('ml_subscriber_hash'),
        exact('ck_subscriber_id'), exact('_bhlid'), exact('elqtrackid'), exact('elqtrack'),
        exact('elqaid'), exact('elqat'), exact('elqcampaignid'),
        exact('nr_email_referer'), exact('sms_source'), exact('sms_click'), exact('sms_uph'),
    ],
    ecommerce: [
        // Affiliate networks: Awin, CJ, Rakuten, Impact, Zanox, Amazon Associates
        exact('awc'), exact('cjevent'), exact('cjdata'), exact('ranmid'), exact('raneaid'),
        exact('ransiteid'), exact('irclickid'), exact('irgwc'), exact('zanpid'),
        exact('ascsubtag'), exact('linkcode'), exact('linkid'), exact('creativeasin'),
        prefix('pf_rd_'), prefix('pd_rd_'), exact('affid'), exact('aff_id'),
        exact('affiliate_id'), exact('aff_request_id'), exact('clickid'), exact('click_id'),
        exact('k_clickid'),
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
 * Tracking that is only tracking on one site (HostRules.all): `ref` is
 * Amazon's tag and GitHub's branch, so it is removed on the one and kept on
 * the other. `excluding` spares hosts that match `hosts` (Gmail under Google).
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
        exact('_u'), exact('opi'), exact('ie'), exact('oe'),
    ], category: 'analytics', label: 'Google',
       excluding: [suffix('mail.google.com'), suffix('accounts.google.com'),
                   suffix('docs.google.com'), suffix('drive.google.com')]},

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

    {hosts: [brand('yandex'), exact('ya.ru')], parameters: [
        exact('lr'), exact('redircnt'), exact('clid'),
    ], category: 'analytics', label: 'Yandex'},

    // MARK: Video

    {hosts: [suffix('youtube.com'), suffix('youtu.be'), suffix('youtube-nocookie.com')],
             parameters: [
        exact('feature'), exact('si'), exact('kw'), exact('pp'), exact('ab_channel'),
        exact('embeds_referring_euri'), exact('embeds_referring_origin'),
        exact('source_ve_path'),
    ], category: 'other', label: 'YouTube'},

    {hosts: [suffix('netflix.com')], parameters: [
        exact('trackid'), exact('tctx'), prefix('jb'),
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
    ], category: 'other', label: 'Bilibili'},

    // MARK: Music

    {hosts: [suffix('spotify.com'), exact('spotify.link')], parameters: [
        exact('si'), exact('nd'), exact('dlsi'),
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
        exact('notif_id'), exact('notif_t'),
    ], category: 'social', label: 'Facebook'},

    {hosts: [suffix('threads.net'), suffix('threads.com')], parameters: [
        exact('xmt'),
    ], category: 'social', label: 'Threads'},

    {hosts: [suffix('twitter.com'), suffix('x.com'), exact('t.co')], parameters: [
        exact('s'), exact('t'), exact('cn'), exact('src'), exact('ref_url'),
        exact('cxt'), exact('mx'),
    ], category: 'social', label: 'Twitter/X'},

    {hosts: [suffix('tiktok.com')], parameters: [
        exact('_d'), exact('_t'), exact('_r'), exact('u_code'), exact('preview_pb'),
        exact('timestamp'), exact('user_id'), exact('share_app_name'), exact('share_app_id'),
        exact('share_iid'), exact('share_link_id'), exact('source'), exact('sender_device'),
        exact('sender_web_id'), exact('is_from_webapp'), exact('is_copy_url'), exact('k'),
        exact('checksum'), exact('tt_from'), exact('enter_from'), exact('enter_method'),
        exact('_svg'), exact('refer'), exact('referer_url'), exact('referer_video_id'),
        exact('web_id'),
    ], category: 'social', label: 'TikTok'},

    {hosts: [suffix('douyin.com')], parameters: [
        exact('previous_page'), exact('enter_from'), exact('enter_method'), exact('iid'),
    ], category: 'social', label: 'Douyin'},

    {hosts: [suffix('reddit.com'), exact('redd.it')], parameters: [
        exact('$deep_link'), exact('%24deep_link'), exact('correlation_id'),
        exact('ref_campaign'), exact('ref_source'), exact('$3p'), exact('%243p'),
        exact('rdt'), exact('$original_url'), exact('%24original_url'),
        exact('share_id'), exact('ref'), exact('ref_share'),
    ], category: 'social', label: 'Reddit'},

    {hosts: [suffix('linkedin.com'), exact('lnkd.in')], parameters: [
        exact('trk'), exact('trkinfo'), exact('trkemail'), exact('refid'),
        exact('trackingid'), exact('lipi'), exact('licu'), exact('original_referer'),
        exact('upsellorderorigin'), exact('midtoken'), exact('midsig'), exact('eid'),
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
        exact('refer_flag'), exact('from'),
    ], category: 'social', label: 'Weibo'},

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
        prefix('cv_ct_'), prefix('sb-ci-'),
    ], category: 'ecommerce', label: 'Amazon'},

    {hosts: [suffix('imdb.com')], parameters: [exact('ref_')],
             category: 'ecommerce', label: 'IMDb'},

    {hosts: [brand('ebay')], parameters: [
        exact('_trkparms'), exact('_trksid'), exact('_from'), exact('hash'),
        exact('mkevt'), exact('mkcid'), exact('mkrid'), exact('mkpid'), exact('campid'),
        exact('toolid'), exact('customid'), exact('amdata'),
    ], category: 'ecommerce', label: 'eBay'},

    {hosts: [brand('aliexpress')], parameters: [
        exact('ws_ab_test'), exact('btsid'), exact('algo_expid'), exact('algo_exp_id'),
        exact('algo_pvid'), exact('gps-id'), prefix('scm'), exact('cv'), exact('af'),
        exact('mall_affr'), exact('sk'), exact('dp'), exact('terminal_id'),
        exact('spm'), exact('pdp_npi'), exact('pdp_ext_f'), exact('gatewayadapt'),
        exact('utparam-url'), exact('aff_fcid'), exact('aff_fsk'), exact('aff_platform'),
        exact('aff_trace_key'), exact('afsmartredirect'), exact('srcsns'),
        exact('businesstype'), exact('templateid'),
    ], category: 'ecommerce', label: 'AliExpress'},

    {hosts: [suffix('taobao.com'), suffix('tmall.com')], parameters: [
        exact('spm'), exact('scm'), exact('ut_sk'), exact('sp_tk'), exact('share_crt_v'),
        exact('suid'), exact('cpp'), exact('shareurl'), exact('short_name'), exact('pvid'),
        exact('un'), exact('sourcetype'), exact('tbsocialpopkey'), exact('app'),
        exact('bxsign'), exact('tk'),
    ], category: 'ecommerce', label: 'Taobao'},

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

    // MARK: Publishers

    {hosts: [suffix('nytimes.com')], parameters: [
        exact('smid'), exact('smtyp'), exact('emc'), exact('nl'), exact('te'),
        exact('referringsource'), exact('regi_id'), exact('segment_id'),
        exact('campaign_id'), exact('instance_id'), exact('user_id'),
    ], category: 'other', label: 'New York Times'},

    {hosts: [suffix('theguardian.com')], parameters: [exact('cmp')],
             category: 'other', label: 'The Guardian'},

    {hosts: [suffix('bbc.com'), suffix('bbc.co.uk')], parameters: [
        exact('ns_mchannel'), exact('ns_source'), exact('ns_campaign'),
        exact('ns_linkname'), exact('ns_fee'),
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

    {hosts: [suffix('substack.com')], parameters: [exact('r'), exact('s')],
             category: 'other', label: 'Substack'},

    {hosts: [suffix('wikipedia.org'), suffix('wikimedia.org')], parameters: [exact('wprov')],
             category: 'other', label: 'Wikipedia'},

    // MARK: Work

    {hosts: [suffix('github.com')], parameters: [
        exact('email_token'), exact('email_source'), exact('notification_referrer_id'),
        exact('ref_cta'), exact('ref_loc'), exact('ref_page'), exact('ref_product'),
        exact('ref_style'), exact('ref_plan'),
    ], category: 'other', label: 'GitHub'},

    {hosts: [suffix('stackoverflow.com'), suffix('stackexchange.com')], parameters: [
        exact('so_medium'), exact('so_source'), exact('r'),
    ], category: 'other', label: 'Stack Overflow'},

    {hosts: [suffix('quora.com')], parameters: [
        exact('ch'), exact('oid'), exact('share'), exact('srid'), exact('target_type'),
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
]));

/**
 * Redirect pages that carry their destination in the URL (Redirects.rules),
 * peeled offline. The first matching rule that yields an http(s) URL wins.
 * `source`: a query parameter tried in order ('' = the whole query), the
 * rest of the path after a prefix, or Proofpoint v3's `__…__;`.
 * `encoding` (default 'percent'): 'bingBase64', 'proofpointV2', 'schemeless'.
 *
 * @type {readonly RedirectRule[]}
 */
export const REDIRECT_RULES = Object.freeze(/** @type {RedirectRule[]} */ ([
    // Search engines and mail clients — where most pasted redirects come from
    {hosts: [brand('google')], pathPrefix: '/url',
                 source: {query: ['url', 'q']}, label: 'Google'},
    {hosts: [brand('google')], pathPrefix: '/amp/s/',
                 source: {pathAfter: '/amp/s/'}, encoding: 'schemeless', label: 'Google AMP'},
    {hosts: [suffix('googleadservices.com'), brand('doubleclick')],
                 source: {query: ['adurl']}, label: 'Google Ads'},
    {hosts: [brand('bing')], pathPrefix: '/ck/a',
                 source: {query: ['u']}, encoding: 'bingBase64', label: 'Bing'},
    {hosts: [suffix('duckduckgo.com')], pathPrefix: '/l/',
                 source: {query: ['uddg']}, label: 'DuckDuckGo'},
    {hosts: [suffix('safelinks.protection.outlook.com')],
                 source: {query: ['url']}, label: 'Outlook Safe Links'},
    {hosts: [suffix('urldefense.proofpoint.com')], pathPrefix: '/v2/url',
                 source: {query: ['u']}, encoding: 'proofpointV2', label: 'Proofpoint'},
    {hosts: [suffix('urldefense.com')], pathPrefix: '/v3/',
                 source: {proofpointV3: true}, label: 'Proofpoint'},
    {hosts: [exact('slack-redir.net')], pathPrefix: '/link',
                 source: {query: ['url']}, label: 'Slack'},

    // Social
    {hosts: [exact('l.facebook.com'), exact('lm.facebook.com'), exact('l.messenger.com')],
                 pathPrefix: '/l.php', source: {query: ['u']}, label: 'Facebook'},
    {hosts: [exact('l.instagram.com')], source: {query: ['u']}, label: 'Instagram'},
    {hosts: [exact('l.threads.net'), exact('l.threads.com')], source: {query: ['u']}, label: 'Threads'},
    {hosts: [suffix('youtube.com')], pathPrefix: '/redirect',
                 source: {query: ['q']}, label: 'YouTube'},
    {hosts: [exact('out.reddit.com'), exact('click.redditmail.com')],
                 source: {query: ['url']}, label: 'Reddit'},
    {hosts: [suffix('linkedin.com')], pathPrefix: '/redir/redirect',
                 source: {query: ['url']}, label: 'LinkedIn'},
    {hosts: [exact('t.umblr.com')], pathPrefix: '/redirect',
                 source: {query: ['z']}, label: 'Tumblr'},
    {hosts: [exact('vk.com')], pathPrefix: '/away.php',
                 source: {query: ['to']}, label: 'VK'},
    {hosts: [exact('disq.us')], source: {query: ['url']}, label: 'Disqus'},
    {hosts: [suffix('deviantart.com')], pathPrefix: '/users/outgoing',
                 source: {query: ['url']}, label: 'DeviantArt'},

    // Gaming, shopping, misc
    {hosts: [suffix('steamcommunity.com')], pathPrefix: '/linkfilter/',
                 source: {query: ['url', 'u']}, label: 'Steam'},
    {hosts: [suffix('curseforge.com')], pathPrefix: '/linkout',
                 source: {query: ['remoteUrl']}, label: 'CurseForge'},
    {hosts: [brand('ebay')], pathPrefix: '/rover/',
                 source: {query: ['mpre']}, label: 'eBay'},
    {hosts: [suffix('linksynergy.com')], source: {query: ['murl']}, label: 'Rakuten'},
    {hosts: [suffix('anonym.to'), exact('href.li')],
                 source: {query: ['url', '']}, label: 'Anonymiser'},
    {hosts: [suffix('cdn.ampproject.org')], pathPrefix: '/c/s/',
                 source: {pathAfter: '/c/s/'}, encoding: 'schemeless', label: 'AMP cache'},
    {hosts: [suffix('cdn.ampproject.org')], pathPrefix: '/v/s/',
                 source: {pathAfter: '/v/s/'}, encoding: 'schemeless', label: 'AMP cache'},
]));

/** Share-button fragment suffixes: AddThis's `#.Vh3x.twitter`, ShareThis's `#sthash.abc.dpbs` (Fragments.shareSuffixes). */
export const FRAGMENT_SHARE_SUFFIXES = Object.freeze(new Set([
    'facebook', 'twitter', 'email', 'linkedin', 'gmail', 'tumblr', 'reddit',
    'pinterest', 'whatsapp', 'dpuf', 'dpbs', 'gplus', 'google_plus',
]));
