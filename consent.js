/* NSBJJ cookie consent + attribution (self-hosted, no third-party CMP). UK PECR / UK GDPR.
   Loaded synchronously in <head> on every page so other scripts can use window.nsbjjConsent straight away.

   API
     nsbjjConsent.get()        -> 'accepted' | 'rejected' | null (no choice yet, or choice older than 12 months)
     nsbjjConsent.accepted()   -> true only after the visitor clicked Accept
     nsbjjConsent.set(choice)  -> 'accepted' | 'rejected' (stores it, fires the event)
     nsbjjConsent.open()       -> re-opens the banner (footer "Cookie settings" uses [data-cookie-settings])
     nsbjjConsent.onAccept(fn) -> runs fn now if accepted, otherwise the moment the visitor accepts
   Event
     document 'nsbjj:consent'  -> detail: {choice:'accepted'|'rejected'}
   Attribution (for the Stripe Checkout Session metadata, see own-checkout/stripe-plan.md)
     nsbjjAttribution.get()    -> {utm_source, utm_medium, utm_campaign, gclid, fbclid, fbp, fbc}
     UTMs/gclid/fbclid are read from the URL and carried page-to-page in the URL (no device storage) until consent;
     after Accept they are also kept in localStorage for 30 days, and fbp/fbc are read from Meta's _fbp/_fbc cookies
     (fbc is built from fbclid if the Pixel hasn't set _fbc yet).
   Storage used by this file: localStorage "nsbjj-consent" (strictly necessary: remembers the choice);
     after Accept only: localStorage "nsbjj-attr" (30 days) and "nsbjj-conv-<transaction id>" (stops a purchase being counted twice). */
(function(){
  'use strict';
  var KEY='nsbjj-consent', ATTR='nsbjj-attr', MAX_AGE=365*864e5, ATTR_AGE=30*864e5;
  var ATTR_KEYS=['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','fbclid'];

  /* ---------- TRACKING CONFIG (Jim) ----------
     TRACKING_LIVE stays false on the mockup so nothing reaches Meta or Google Ads from test pages.
     Set it to true on the live domain once the Pixel ID is in. */
  var CFG=window.NSBJJ_TRACKING=window.NSBJJ_TRACKING||{
    TRACKING_LIVE:false,
    CHECKOUT_LIVE:false,                                   // true once /api/checkout etc. are deployed (trial form then goes to Stripe)
    META_PIXEL_ID:'186884630860567',                     // 'New School BJJ Brixton' dataset, ad account 469686058308652 (Jim, 5 Oct 2026)
    GOOGLE_ADS_ID:'AW-962693517',
    GOOGLE_ADS_PURCHASE_SEND_TO:'AW-962693517/hdiHCL_e3Y4dEI2ThssD',
    GA4_ID:''                                              // optional, only if Google Analytics is used
  };

  function read(){try{var v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&(v.choice==='accepted'||v.choice==='rejected')&&Date.now()-v.ts<MAX_AGE)return v.choice;}catch(e){}return null;}
  var choice=read(), waiting=[];
  function fire(){try{document.dispatchEvent(new CustomEvent('nsbjj:consent',{detail:{choice:choice}}));}catch(e){}}
  function clearMarketing(){
    try{localStorage.removeItem(ATTR);Object.keys(localStorage).forEach(function(k){if(k.indexOf('nsbjj-conv-')===0)localStorage.removeItem(k);});}catch(e){}
    var host=location.hostname.split('.'),doms=['',location.hostname];
    for(var i=0;i<host.length-1;i++)doms.push('.'+host.slice(i).join('.'));
    document.cookie.split(';').forEach(function(c){var n=c.split('=')[0].trim();
      if(/^(_fbp|_fbc|_ga|_ga_.*|_gcl_.*|_gid)$/.test(n))doms.forEach(function(d){document.cookie=n+'=; Max-Age=0; path=/'+(d?'; domain='+d:'');});});
  }

  var api=window.nsbjjConsent={
    get:function(){return choice;},
    accepted:function(){return choice==='accepted';},
    set:function(c){
      var was=choice; choice=c;
      try{localStorage.setItem(KEY,JSON.stringify({choice:c,ts:Date.now(),v:1}));}catch(e){}
      hideBanner(); fire();
      if(c==='accepted'){saveAttr();var q=waiting;waiting=[];q.forEach(run);}
      if(c==='rejected'){clearMarketing(); if(was==='accepted')location.reload();}  // reload unloads anything already started
    },
    open:function(){showBanner(true);},
    onAccept:function(fn){if(choice==='accepted')run(fn);else waiting.push(fn);}
  };
  function run(fn){try{fn();}catch(e){if(window.console)console.error(e);}}

  /* ---------- Attribution ---------- */
  var urlP=new URLSearchParams(location.search), attr={};
  try{var s=JSON.parse(localStorage.getItem(ATTR)||'null');if(s&&Date.now()-s.ts<ATTR_AGE&&choice==='accepted')attr=s.d||{};}catch(e){}
  ATTR_KEYS.forEach(function(k){if(urlP.get(k))attr[k]=urlP.get(k).slice(0,200);});
  function cookie(n){var m=document.cookie.match('(?:^|; )'+n+'=([^;]*)');return m?decodeURIComponent(m[1]):'';}
  function saveAttr(){try{localStorage.setItem(ATTR,JSON.stringify({ts:Date.now(),d:attr}));}catch(e){}}
  if(choice==='accepted')saveAttr();
  window.nsbjjAttribution={
    get:function(){
      var o={};ATTR_KEYS.forEach(function(k){o[k]=attr[k]||'';});
      if(choice==='accepted'){
        o.fbp=cookie('_fbp');
        o.fbc=cookie('_fbc')||(attr.fbclid?'fb.1.'+Date.now()+'.'+attr.fbclid:'');
      }else{o.fbp='';o.fbc='';}
      return o;
    },
    /* Adds UTMs/gclid/fbclid to internal links that keep the visitor in the trial flow ([data-carry] and links to trial/gi/welcome). */
    carry:function(root){
      (root||document).querySelectorAll('a[href]').forEach(function(a){
        var h=a.getAttribute('href');
        if(!/^(trial|gi|welcome)\.html/.test(h)&&!a.hasAttribute('data-carry'))return;
        var u=new URL(h,location.href);
        ATTR_KEYS.forEach(function(k){if(attr[k]&&!u.searchParams.get(k))u.searchParams.set(k,attr[k]);});
        a.setAttribute('href',u.pathname.split('/').pop()+u.search+u.hash);
      });
    }
  };

  /* ---------- Marketing tags: ONLY run after Accept ----------
     Jim: Pixel base code and Google tag live here so they can never fire before consent. */
  api.onAccept(function(){
    if(!CFG.TRACKING_LIVE){if(window.console)console.info('[nsbjj] consent accepted; TRACKING_LIVE=false, so Pixel/Google tags not loaded (mockup).');return;}
    // Meta Pixel (standard base code, PageView). Skipped until a real Pixel ID is set.
    if(CFG.META_PIXEL_ID&&CFG.META_PIXEL_ID.charAt(0)!=='['){
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      fbq('init',CFG.META_PIXEL_ID); fbq('track','PageView');
    }
    // Google tag (Google Ads, plus GA4 if an ID is set).
    var g=document.createElement('script');g.async=true;g.src='https://www.googletagmanager.com/gtag/js?id='+CFG.GOOGLE_ADS_ID;document.head.appendChild(g);
    window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){dataLayer.push(arguments);};
    gtag('js',new Date()); gtag('config',CFG.GOOGLE_ADS_ID); if(CFG.GA4_ID)gtag('config',CFG.GA4_ID);
  });

  /* Purchase conversions for gi.html (trial) and welcome.html (trial + gi) (see own-checkout/stripe-plan.md). Call once per purchase with data verified by the server
     (/api/session), never raw URL values. The trial and the gi are SEPARATE purchases:
       trial: {value:20, event_id:<trial event_id>,      transaction_id:<trial Checkout Session id cs_...>}
       gi:    {value:65, event_id:<trial event_id>-gi,   transaction_id:<trial Checkout Session id>-gi}
     Fires the Meta Purchase (eventID = event_id, deduped with the server/Zapier CAPI event) and the Google Ads conversion
     (transaction_id dedupes in Google Ads), only after Accept, once per transaction (localStorage nsbjj-conv-<transaction_id>). */
  var sentPurchases=Object.create(null);
  window.nsbjjTrackPurchase=function(p){ // p = {value, currency:'GBP', event_id, transaction_id}
    var tid=p.transaction_id||p.session_id; if(!tid||!p.event_id)return;
    api.onAccept(function(){
      if(!CFG.TRACKING_LIVE||window.NSBJJ_PREVIEW)return;
      if(sentPurchases[tid])return;sentPurchases[tid]=true;
      var k='nsbjj-conv-'+tid;
      try{if(localStorage.getItem(k))return;localStorage.setItem(k,'1');}catch(e){}
      if(!CFG.TRACKING_LIVE){if(window.console)console.info('[nsbjj] would fire Purchase',p);return;}
      if(window.fbq)fbq('track','Purchase',{value:p.value,currency:p.currency||'GBP'},{eventID:p.event_id});
      if(window.gtag)gtag('event','conversion',{send_to:CFG.GOOGLE_ADS_PURCHASE_SEND_TO,value:p.value,currency:p.currency||'GBP',transaction_id:tid});
    });
  };

  /* ---------- Click-to-load embeds ----------
     <div class="consent-embed" data-embed="map" data-src="https://www.google.com/maps?...&output=embed" data-title="..."> ...placeholder... </div>
     <div class="consent-embed" data-embed="gymdesk" data-gym="AyJpe"> ...placeholder... </div>
     They load automatically after Accept. "Load map"/"Load live timetable" loads just that one embed for this visit, without storing a choice. */
  var gymdeskScript=false;
  function loadEmbed(el){
    if(window.NSBJJ_PREVIEW)return; // Offline previews retain local placeholders even after Accept.
    if(el.getAttribute('data-loaded'))return; el.setAttribute('data-loaded','1');
    var t=el.getAttribute('data-embed');
    if(t==='map'){
      var f=document.createElement('iframe');f.src=el.getAttribute('data-src');f.title=el.getAttribute('data-title')||'Map';
      f.loading='lazy';f.referrerPolicy='no-referrer-when-downgrade';f.allowFullscreen=true;
      el.innerHTML='';el.appendChild(f);
    }else if(t==='gymdesk'){
      el.innerHTML='<div class="gymdesk-schedule" attr-gym="'+el.getAttribute('data-gym')+'"></div>';
      if(!gymdeskScript){gymdeskScript=true;var s=document.createElement('script');s.src='https://app.gymdesk.com/js/widgets.js';document.body.appendChild(s);}
    }
    el.classList.add('is-loaded');
  }
  window.nsbjjLoadEmbed=loadEmbed;

  /* ---------- Banner ---------- */
  var banner=null;
  function build(){
    banner=document.createElement('div');
    banner.className='cookie-banner';banner.setAttribute('role','region');banner.setAttribute('aria-label','Cookie choices');
    banner.innerHTML='<p class="cb-title">Cookies</p>'+
      '<p class="cb-text">We\'d like to use optional cookies to show our map, live timetable and videos, and to measure our adverts. Nothing optional loads unless you accept.</p><a class="cb-link" href="privacy.html#p13">Cookie details</a>'+
      '<p class="cb-state" hidden></p>'+
      '<div class="cb-btns"><button type="button" class="cb-btn" data-c="rejected">Reject</button><button type="button" class="cb-btn" data-c="accepted">Accept</button></div>';
    banner.addEventListener('click',function(e){var b=e.target.closest('[data-c]');if(b)api.set(b.getAttribute('data-c'));});
    document.body.appendChild(banner);
  }
  function showBanner(fromSettings){
    if(!document.body){document.addEventListener('DOMContentLoaded',function(){showBanner(fromSettings);});return;}
    if(!banner)build();
    var st=banner.querySelector('.cb-state');
    if(fromSettings&&choice){st.hidden=false;st.textContent='Your current choice: '+(choice==='accepted'?'accepted':'rejected')+'. You can change it at any time.';}else st.hidden=true;
    banner.hidden=false;document.documentElement.classList.add('has-cookie-banner');
    if(fromSettings)banner.querySelector('.cb-btn').focus();
  }
  function hideBanner(){if(banner)banner.hidden=true;document.documentElement.classList.remove('has-cookie-banner');}

  function init(){
    document.querySelectorAll('.consent-embed').forEach(function(el){
      var b=el.querySelector('[data-load]');if(b)b.addEventListener('click',function(){loadEmbed(el);});
    });
    api.onAccept(function(){document.querySelectorAll('.consent-embed').forEach(loadEmbed);});
    document.addEventListener('click',function(e){var s=e.target.closest('[data-cookie-settings]');if(s){e.preventDefault();api.open();}});
    window.nsbjjAttribution.carry();
    /* First visit: wait for the first scroll (or ~4s) so the bar never sits over the hero on load. */
    if(!choice){
      var shown=false,t;
      var go=function(){if(shown||choice)return;shown=true;clearTimeout(t);window.removeEventListener('scroll',go);showBanner(false);};
      window.addEventListener('scroll',go,{passive:true,once:true});t=setTimeout(go,4000);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
