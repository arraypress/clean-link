/**
 * Builds inputs.json: every URLStripper test input, real-world tracking
 * forms, and the Foundation parsing edges the port has to match (from the
 * probe files a Foundation run wrote: probe.json, p2.json, p3.json).
 *
 * @module scripts/golden/inputs
 */
import {readFileSync, writeFileSync} from 'node:fs';

/** Bing's redirect: base64url of the destination after "a1". @param {string} url */
const bing = (url) => 'a1' + Buffer.from(url).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
/** Percent-encode everything but letters and digits. @param {string} s */
const alnum = (s) => [...Buffer.from(s)].map((b) => /[A-Za-z0-9]/.test(String.fromCharCode(b)) ? String.fromCharCode(b) : '%' + b.toString(16).toUpperCase().padStart(2, '0')).join('');

// 1. Every literal string in the Swift stripper tests (that looks like a URL or a test input).
const swiftTests = readFileSync('/Users/davidsherlock/Developer/Swift/Libraries/swift-url-kit/Tests/URLStripperTests/URLStripperTests.swift', 'utf8');
const fromTests = [...swiftTests.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1].replace(/\\"/g, '"'))
    .filter((s) => /[/?.]/.test(s) && !s.includes('\\(') && !/^(a |an |the |not |each|x|withoutTracking)/i.test(s) && s.length > 6);
const hosts = ['www.amazon.com', 'amazon.co.uk', 'smile.amazon.de', 'www.amazon.com.au', 'amazon.co.jp'];
const notAmazon = ['amazon.example.com', 'amazonaws.com', 'notamazon.com', 'amazon-adsystem.com'];
const interpolated = [
    ...hosts.map((h) => `https://${h}/dp/B08N5WRWNW?tag=aff-21&psc=1`),
    ...notAmazon.map((h) => `https://${h}/x?tag=keep`),
    `https://www.bing.com/ck/a?!&&p=abc&u=${bing('https://example.com/page?id=1')}&ntb=1`,
    'https://www.google.com/url?q=' + alnum('https://eur01.safelinks.protection.outlook.com/?url=' + alnum('https://example.com/final?id=9')),
    '', '   ',
];

// 2. Real-world tracking forms.
const realWorld = [
    // utm_* and friends
    'https://www.theverge.com/2026/1/5/24000000/apple-vision?utm_source=twitter&utm_medium=social&utm_campaign=verge',
    'https://blog.example.com/post/how-to?utm_source=newsletter&utm_medium=email&utm_campaign=weekly&utm_content=cta&utm_term=swift',
    'https://www.example.org/?utm_id=123&utm_source_platform=x',
    'https://news.ycombinator.com/item?id=40000000',
    'https://www.notion.so/Page-Title-1a2b3c4d5e6f?pvs=4',
    'https://www.figma.com/file/abc123/Design?node-id=0%3A1&t=AbCdEf-0',
    'https://docs.google.com/document/d/1AbC/edit?usp=sharing&utm_source=x',
    'https://drive.google.com/file/d/1AbC/view?usp=drive_link&source=x',
    'https://mail.google.com/mail/u/0/#inbox/FMfcgz',
    // Ads click ids
    'https://shop.example.com/sale?gclid=Cj0KCQjw&gad_source=1&gbraid=0AAA&wbraid=CkQ',
    'https://www.example.com/landing?msclkid=abc123&utm_source=bing',
    'https://example.com/p?fbclid=IwAR2abcDEF&mibextid=Zxz2cZ',
    'https://example.com/article?mc_cid=abc123&mc_eid=def456',
    'https://example.com/a?_hsenc=p2&_hsmi=1&__hstc=1.2&__hssc=3&__hsfp=4',
    'https://example.com/a?yclid=1&ysclid=2&_openstat=3',
    'https://example.com/a?srsltid=AfmBOo&_gl=1*abc*_ga*MTE',
    'https://example.com/a?twclid=2-abc&ttclid=E.C.P&li_fat_id=uuid&epik=dj0y',
    'https://example.com/a?igshid=MzRlODBiNWFlZA==&igsh=abc',
    'https://example.com/?ref_src=twsrc%5Etfw',
    'https://example.com/?oly_enc_id=1&oly_anon_id=2&vero_id=3&mkt_tok=4',
    'https://example.com/?irclickid=abc&irgwc=1&cjevent=x&awc=1_2',
    // YouTube
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ&si=AbCdEfGhIjKlMnOp',
    'https://youtu.be/dQw4w9WgXcQ?si=AbCdEf&t=30',
    'https://www.youtube.com/shorts/abc123def45?feature=share',
    'https://m.youtube.com/watch?v=abc&feature=youtu.be&pp=ygUE',
    'https://www.youtube.com/watch?v=abc&ab_channel=Rick&t=1m2s',
    'https://music.youtube.com/watch?v=abc&si=xyz&list=RDAMVM',
    'https://www.youtube.com/playlist?list=PL123&si=abc',
    'https://www.youtube-nocookie.com/embed/abc?si=x&start=5',
    // Spotify, Apple
    'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=a1b2c3d4e5f6',
    'https://open.spotify.com/album/1A2B3C?si=x&nd=1&dlsi=y',
    'https://open.spotify.com/episode/5abc?si=abc&context=spotify%3Aplaylist%3A37i9',
    'https://spotify.link/AbCdEf?si=1',
    'https://music.apple.com/gb/album/x/123?i=456&uo=4&app=music&at=1000lHKX&ct=share',
    'https://apps.apple.com/us/app/x/id123?mt=8&pt=1234&ls=1',
    'https://podcasts.apple.com/us/podcast/x/id1?i=100&itscg=30200&itsct=pod',
    // Twitter / X
    'https://twitter.com/jack/status/20?s=20',
    'https://x.com/elonmusk/status/1700000000000000000?s=46&t=AbCdEfGhIjKl',
    'https://x.com/user/status/1?ref_src=twsrc%5Egoogle&src=share&cxt=HHwW',
    'https://mobile.twitter.com/user?s=21&lang=en',
    'https://t.co/AbCdEf123?amp=1&s=1',
    // Facebook
    'https://www.facebook.com/story.php?story_fbid=1&id=2&mibextid=WC7FNe&rdid=abc',
    'https://m.facebook.com/groups/123/permalink/456/?ref=share&__tn__=%2CO*F',
    'https://www.facebook.com/events/123/?acontext=%7B%22ref%22%3A52%7D&aref=0&ref=newsfeed',
    'https://www.facebook.com/photo/?fbid=1&set=a.2&__cft__[0]=AZW&__tn__=EH-R',
    'https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.nytimes.com%2F2026%2F01%2F01%2Fx.html%3Fsmid%3Dfb-share%26fbclid%3DIwAR&h=AT1',
    'https://lm.facebook.com/l.php?u=https%3A%2F%2Fexample.com%2Fm&h=AT2&s=1',
    'https://l.messenger.com/l.php?u=https%3A%2F%2Fexample.com%2Fmsg&h=AT3',
    'https://www.facebook.com/l.php?u=https%3A%2F%2Fexample.com%2F',
    'https://example.com/fb-login#_=_',
    // Instagram, Threads
    'https://www.instagram.com/p/C1AbCdEf/?igsh=MWQ1ZGUxMzBkMA==',
    'https://www.instagram.com/reel/C1AbCdEf/?igshid=NTc4MTIwNjQ2YQ%3D%3D&utm_source=ig_web_copy_link',
    'https://l.instagram.com/?u=https%3A%2F%2Fexample.com%2Fbio%3Futm_source%3Dig%26id%3D1&e=AT0',
    'https://www.threads.net/@user/post/C1Ab?xmt=AQGz',
    'https://www.threads.com/@user/post/C1Ab?xmt=AQGz&slof=1',
    'https://l.threads.net/?u=https%3A%2F%2Fexample.com%2Fth&e=AT',
    // LinkedIn
    'https://www.linkedin.com/posts/satya_ai-activity-7160000000000000000-AbCd?utm_source=share&utm_medium=member_desktop',
    'https://www.linkedin.com/in/someone/?originalSubdomain=uk&trk=public_profile',
    'https://www.linkedin.com/jobs/view/123/?refId=abc&trackingId=def%3D%3D&trk=flagship3',
    'https://www.linkedin.com/feed/update/urn:li:activity:7160/?lipi=urn%3Ali&licu=urn',
    'https://www.linkedin.com/redir/redirect?url=https%3A%2F%2Fexample.com%2Fli%3Futm_source%3Dlinkedin&urlhash=AbCd&trk=public_post',
    'https://lnkd.in/dAbCdEf?trk=x',
    // TikTok
    'https://www.tiktok.com/@user/video/7300000000000000000?is_from_webapp=1&sender_device=pc&web_id=7300',
    'https://www.tiktok.com/@user/video/7300000000000000000?_r=1&_t=8hAbC&u_code=d&share_app_id=1233&checksum=abc',
    'https://www.tiktok.com/t/ZT8AbCdEf/?k=1',
    'https://vm.tiktok.com/ZMAbCdEf/',
    // Reddit
    'https://www.reddit.com/r/swift/comments/abc123/title/?share_id=AbCd&utm_content=1&utm_medium=ios_app&utm_name=ioscss&utm_source=share&utm_term=1',
    'https://www.reddit.com/r/swift/comments/abc123/title/?rdt=12345&ref=share&ref_source=link',
    'https://out.reddit.com/t3_abc?url=https%3A%2F%2Fexample.com%2Freddit&token=AQ&app_name=reddit.com',
    'https://click.redditmail.com/CL0/https:%2F%2Fwww.reddit.com%2Fr%2Fx/1/abc?url=https%3A%2F%2Fwww.reddit.com%2Fr%2Fswift%3F%24deep_link%3Dtrue%26correlation_id%3Dabc',
    // Amazon
    'https://www.amazon.com/Apple-MacBook-13-inch-Storage/dp/B0CX23V2ZK/ref=sr_1_1?crid=2X&keywords=macbook&qid=1700&sprefix=mac%2Caps%2C200&sr=8-1',
    'https://www.amazon.co.uk/dp/B09XS7JWHH?ref_=cm_sw_r_cp_ud_dp_ABC&th=1&psc=1',
    'https://www.amazon.com/gp/product/B08N5WRWNW?pf_rd_r=X&pf_rd_p=Y&pd_rd_w=Z&linkCode=sl1&tag=aff-20&linkId=abc',
    'https://www.amazon.de/gp/aw/d/B08N5WRWNW/ref=ox_sc_act_image_1?smid=A3JWKAKR8XB7XF',
    'https://www.amazon.com/exec/obidos/ASIN/0596009208/ref=nosim/aff-20',
    'https://www.amazon.com/s?k=usb+c+hub&crid=1&sprefix=usb%2Caps&ref=nb_sb_noss',
    'https://www.amazon.com/ref=nav_logo',
    'https://www.amazon.com/stores/Apple/page/77D9E1F7?ref_=ast_bln',
    'https://www.amazon.fr/-/en/Some-Book/dp/2070612759/ref=sr_1_1?dib=eyJ2&dib_tag=se',
    'https://www.amazon.in/Samsung-Galaxy/dp/B0CS6F8Y6L/?_encoding=UTF8&pd_rd_w=X&content-id=amzn1&pf_rd_p=1',
    'https://a.co/d/AbCdEfG',
    'https://amzn.to/3AbCdEf?tag=x',
    'https://www.amazon.com/hz/wishlist/ls/ABC123?ref_=wl_share',
    // eBay
    'https://www.ebay.com/itm/Vintage-Leica-Lens/256000000000?hash=item3b9:g:abc&_trkparms=amclksrc%3DITM&_trksid=p2047675',
    'https://www.ebay.com/itm/256000000000?mkcid=16&mkevt=1&mkrid=711-127632-2357-0&ssspo=abc&sssrc=2047675&ssuid=x&var=1',
    'https://www.ebay.co.uk/sch/i.html?_nkw=leica&_sacat=0&_from=R40&_trksid=m570',
    'https://rover.ebay.com/rover/1/711-53200-19255-0/1?mpre=https%3A%2F%2Fwww.ebay.com%2Fitm%2F123456789012&campid=533',
    // Etsy, AliExpress, others
    'https://www.etsy.com/listing/123456789/handmade-mug?click_key=abc&click_sum=def&ref=hp_rv-1&frs=1&sts=1',
    'https://www.aliexpress.com/item/1005001234567890.html?spm=a2g0o.productlist.0.0.abc&algo_pvid=x&aff_fcid=y&gatewayAdapt=glo2usa',
    'https://item.taobao.com/item.htm?id=123&spm=a1z10&ut_sk=1.abc&sp_tk=xyz',
    'https://www.walmart.com/ip/Thing/123456?athbdg=L1600&u1=abc',
    'https://www.bestbuy.com/site/x/123.p?skuId=123&intl=nosplash&ref=212&loc=1',
    'https://www.target.com/p/x/-/A-123?afid=google&cpng=PTID1&lnm=81938',
    'https://store.steampowered.com/app/570/Dota_2/?snr=1_4_4__13',
    'https://www.booking.com/hotel/gb/x.html?aid=304142&label=gen173&sid=abc&checkin=2026-12-01&checkout=2026-12-03',
    'https://www.airbnb.co.uk/rooms/12345?source_impression_id=p3_abc&federated_search_id=x&check_in=2026-12-01&adults=2',
    'https://www.tripadvisor.co.uk/Hotel_Review-g1-d2-Reviews-X.html?m=19905',
    // Publishers
    'https://www.nytimes.com/2026/01/01/technology/x.html?smid=nytcore-ios-share&referringSource=articleShare&sgrp=c-cb',
    'https://www.nytimes.com/2026/01/01/x.html?unlocked_article_code=1.abc&smid=url-share',
    'https://www.theguardian.com/technology/2026/jan/01/x?CMP=Share_iOSApp_Other',
    'https://www.bbc.co.uk/news/technology-123?at_medium=RSS&at_campaign=rss&ns_source=twitter',
    'https://www.washingtonpost.com/tech/2026/01/01/x/?itid=hp-top&wpisrc=nl_tech',
    'https://www.bloomberg.com/news/articles/2026-01-01/x?srnd=homepage-europe&leadSource=uverify%20wall',
    'https://www.forbes.com/sites/x/2026/01/01/y/?sh=12ab34cd',
    'https://www.spiegel.de/netzwelt/x-a-123?sara_ref=re-so-app-sh',
    'https://medium.com/@user/title-1a2b3c4d?source=rss----1&sk=abc',
    'https://user.substack.com/p/title?r=abc12&s=w&utm_campaign=post&utm_medium=web',
    'https://en.wikipedia.org/wiki/Swift_(programming_language)?wprov=sfti1',
    'https://en.wikipedia.org/wiki/URL#Syntax',
    'https://example.com/article#xtor=CS1-1',
    'https://example.com/article#.Uyab3Cd.facebook',
    'https://example.com/article#sthash.AbCd1234.dpuf',
    'https://example.com/article#echobox=1700000000',
    'https://example.com/article#:~:text=quick%20brown',
    // Work
    'https://github.com/apple/swift/pull/1?notification_referrer_id=NT_abc&email_token=x&email_source=notifications',
    'https://github.com/apple/swift/tree/main?ref_cta=Sign+up&ref_loc=header&ref_page=%2F',
    'https://github.com/apple/swift/blob/main/README.md?plain=1#L10',
    'https://stackoverflow.com/questions/123/title?so_medium=email&so_source=x&r=abc',
    'https://stackoverflow.com/a/123/456',
    'https://www.quora.com/What-is-x?ch=10&oid=1&share=abc&srid=x&target_type=question',
    'https://uk.indeed.com/viewjob?jk=abc123&from=serp&vjs=3&tk=1h&advn=1',
    'https://www.glassdoor.co.uk/job-listing/x.htm?jl=1&ao=1&guid=x&src=GD_JOB_AD&cs=1',
    'https://addons.mozilla.org/en-GB/firefox/addon/x/?src=search&utm_source=addons',
    'https://zoom.us/j/1234567890?pwd=abc123&utm_source=calendar',
    'https://meet.google.com/abc-defg-hij?authuser=0&hs=122',
    'https://calendar.google.com/calendar/event?eid=abc&ctz=Europe/London',
    // Search engines
    'https://www.google.com/search?q=swift+url&rlz=1C5CHFA&oq=swift+url&gs_lcrp=EgZj&sourceid=chrome&ie=UTF-8',
    'https://www.google.co.uk/search?q=weather&sca_esv=abc&sxsrf=AHTn&ei=xyz&ved=0ahUK&uact=5',
    'https://www.google.com/maps/place/London/@51.5,-0.1,10z?entry=ttu&g_ep=EgoyMDI0',
    'https://play.google.com/store/apps/details?id=com.example&pcampaignid=web_share&referrer=utm_source%3Dx',
    'https://www.bing.com/search?q=swift&form=QBLH&sp=-1&pq=swif&sc=8-4&qs=n&sk=&cvid=ABC',
    'https://duckduckgo.com/?q=swift&t=h_&ia=web',
    'https://search.yahoo.com/search?p=swift&fr=yfp-t&fr2=sb-top',
    'https://yandex.ru/search/?text=swift&lr=213&clid=1955454',
    // Redirect wrappers
    'https://www.google.com/url?sa=t&source=web&rct=j&opi=89978449&url=https://www.example.com/page%3Fid%3D1%26utm_source%3Dgoogle&ved=2ahUKEwi&usg=AOvVaw0',
    'https://www.google.co.uk/url?q=https://www.bbc.co.uk/news&sa=U&ved=0ahUKE&usg=AOvVaw',
    'https://www.google.com/url?q=https%3A%2F%2Fwww.amazon.co.uk%2FSony-WH-1000XM5%2Fdp%2FB09XS7JWHH%2Fref%3Dsr_1_3%3Ftag%3Dx-21&sa=D&ved=2ahUK',
    'https://www.google.com/amp/s/www.theguardian.com/world/2026/jan/01/x.amp?usqp=mq331AQ',
    'https://www.google.com/amp/www.example.com/amp/page',
    'https://www.googleadservices.com/pagead/aclk?sa=L&ai=abc&adurl=https://shop.example.com/p%3Fgclid%3Dx%26id%3D1',
    'https://ad.doubleclick.net/ddm/clk/1;2;3?adurl=https%3A%2F%2Fexample.com%2Fdc',
    `https://www.bing.com/ck/a?!&&p=abc123&ptn=3&ver=2&hsh=3&fclid=1&u=${bing('https://www.example.com/bing-result?utm_source=bing&page=2')}&ntb=1`,
    `https://www.bing.com/ck/a?u=${bing('https://例え.jp/パス')}`,
    'https://duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.example.com%2Fddg%3Futm_source%3Dddg&rut=abc123',
    'https://eur03.safelinks.protection.outlook.com/?url=https%3A%2F%2Fwww.example.com%2Finvoice%3Fid%3D42%26utm_campaign%3Dbilling&data=05%7C02%7Cuser%40example.com%7Cabc&sdata=AbC%3D&reserved=0',
    'https://nam12.safelinks.protection.outlook.com/ap/w-59584e83/?url=https%3A%2F%2Fexample.sharepoint.com%2Fsites%2Fx&data=05',
    'https://urldefense.proofpoint.com/v2/url?u=https-3A__www.example.com_a_b-3Fc-3D1-26utm-5Fsource-3Demail&d=DwMFaQ&c=abc&r=def&m=ghi&s=jkl&e=',
    'https://urldefense.com/v3/__https://www.example.com/path?a=1&utm_source=pp__;!!ABC!def$',
    'https://urldefense.com/v3/__https://example.com__;!!X',
    'https://slack-redir.net/link?url=https%3A%2F%2Fexample.com%2Fslack%3Futm_source%3Dslack&v=3',
    'https://www.youtube.com/redirect?event=video_description&redir_token=QUFF&q=https%3A%2F%2Fexample.com%2Fyt%3Futm_source%3Dyoutube&v=abc',
    'https://t.umblr.com/redirect?z=https%3A%2F%2Fexample.com%2Ftumblr&t=abc&b=t',
    'https://vk.com/away.php?to=https%3A%2F%2Fexample.com%2Fvk&cc_key=',
    'https://disq.us/url?url=https%3A%2F%2Fexample.com%2Fdisqus%3Aabc&cuid=1',
    'https://www.deviantart.com/users/outgoing?url=https://example.com/da',
    'https://steamcommunity.com/linkfilter/?u=https%3A%2F%2Fexample.com%2Fsteam',
    'https://www.curseforge.com/linkout?remoteUrl=https%253a%252f%252fexample.com%252fcf',
    'https://click.linksynergy.com/deeplink?id=abc&mid=1&murl=https%3A%2F%2Fwww.example.com%2Fp%3Fid%3D1',
    'https://anonym.to/?https://example.com/anon?utm_source=x&id=1',
    'https://href.li/?https://example.com/href',
    'https://www-example-com.cdn.ampproject.org/c/s/www.example.com/amp/page.html?utm_source=amp',
    'https://www-example-com.cdn.ampproject.org/v/s/www.example.com/amp/v.html?amp_js_v=0.1',
    'https://www.google.com/url?q=javascript:alert(1)&sa=D',
    'https://www.google.com/url?q=ftp://example.com/file&sa=D',
    'https://www.google.com/url?q=&url=&sa=D',
    'https://www.google.com/url?esrc=s&q=&rct=j&sa=U&url=https://www.example.com/&ved=2ah&usg=AOv',
    // Opaque trackers and shorteners: left alone offline
    'https://click.mailchimp.com/track/click/30000/example.com?p=eyJz',
    'https://bit.ly/3AbCdEf',
    'https://tinyurl.com/abc123?utm_source=x',
    'https://example.us1.list-manage.com/track/click?u=abc&id=def&e=ghi',
    // Shopify, misc
    'https://shop.example.com/products/tee?variant=123&_pos=1&_sid=abc&_ss=r&_fd=0&_psq=tee',
    'https://example.myshopify.com/collections/all?pr_prod_strat=copurchase&pr_rec_id=abc&pr_seq=uniform',
    'https://www.example.com/?_branch_match_id=123&_branch_referrer=H4sI',
    'https://example.com/?guccounter=1&guce_referrer=aHR0&guce_referrer_sig=AQAA',
    'https://www.netflix.com/title/80100172?trackId=123&tctx=0%2C0&jbv=1',
    'https://www.twitch.tv/somebody?tt_medium=redt&tt_content=channel',
    'https://www.bilibili.com/video/BV1xx411c7mD/?spm_id_from=333.1007&vd_source=abc&p=2',
    'https://www.pinterest.co.uk/pin/123/?sender=abc&sfo=1&nic_v2=x',
    'https://www.pinterest.com/pin/123/?nic_v3=1A&invite_code=x',
    'https://www.roblox.com/games/123/x?refPageId=abc',
    'https://www.imdb.com/title/tt0111161/?ref_=nv_sr_srsg_0',
    'https://www.imdb.com/title/tt0111161/?ref=x',
    'https://weibo.com/123/abc?refer_flag=1001&from=page',
    'https://www.douyin.com/video/123?previous_page=app_code_link&iid=1',
    'https://www.snapchat.com/add/user?sc_referrer=x&sc_ua=y&share_id=z',
    'https://www.tumblr.com/user/123/post?source=share',
    'https://vk.com/wall-1_2?from=search&ref=x&w=wall',
    // Functional parameters that must survive
    'https://www.google.com/search?q=utm_source',
    'https://github.com/owner/repo/compare/main...feature?ref=main&expand=1',
    'https://example.com/redirect?url=https%3A%2F%2Fother.com',
    'https://example.com/search?q=amazon+ref%3D&tag=sale&s=1&t=2&k=3',
    'https://www.reddit.com/search/?q=swift&type=link&sort=new',
    'https://open.spotify.com/search/si',
    'https://www.youtube.com/results?search_query=si+feature',
];

// 3. Foundation parsing edges (all checked by hand against URLComponents).
const edges = JSON.parse(readFileSync('probe.json', 'utf8'))
    .concat(JSON.parse(readFileSync('p2.json', 'utf8')), JSON.parse(readFileSync('p3.json', 'utf8')))
    .concat([
        'https://ex.com:abc/?utm_source=1', 'https://ex<.com/?utm_source=1&a=1', '1http://x.com?utm_source=1',
        'https://h%41.com/?utm_source=1', 'https://[v1.x]/?utm_source=1', 'https://ex.com./?utm_source=1',
        'https://www.amazon.com./dp/B08N5WRWNW?tag=x', 'https://WWW.AMAZON.COM/Thing/dp/B08N5WRWNW?TAG=x',
        'https://u:pw:x@h.com/?utm_source=1', 'https://u@x@h.com/p?utm_source=1', 'https://ex.com/a?b=1#c#d',
        'mailto:someone@example.com', 'javascript:void(0)', 'tel:+441234567890', 'data:text/plain,hi?utm_source=1',
        'https://bücher.example/?utm_source=1&q=1', 'https://example.com/?=utm_source&utm_source=',
        'not a url', 'utm_source=1', '?utm_source=1&a=1', 'https://ex.com/a?a&b&utm_source&c',
        `https://www.bing.com/ck/a?u=${bing('https://example.com/')}`.replace(/v$/, 'w'),
        'https://urldefense.proofpoint.com/v2/url?u=https-3A__ex.com_a-3F-ZZ-2-25&d=x',
        'https://ex.com/a?b=%e2%82%ac&utm_source=1',
        'https://ex.com/%e2%82%ac/a?utm_source=1',
    ]);

const all = [...new Set([...fromTests, ...interpolated, ...realWorld, ...edges])];
writeFileSync('inputs.json', JSON.stringify(all, null, 1));
console.log(all.length, 'inputs;', fromTests.length, 'from tests');
