'use strict';
window.NSBJJ_PREVIEW=true;window.NSBJJ_PREVIEW_MEDIA=true;
window.NSBJJ_TRACKING=Object.freeze({TRACKING_LIVE:false,CHECKOUT_LIVE:false});
document.addEventListener('submit',function(e){e.preventDefault();e.stopImmediatePropagation();if(e.target.id==='pay'){location.href='gi.html?preview=1';}else alert('Design preview: no booking or message has been sent.');},true);
document.addEventListener('click',function(e){var a=e.target.closest('a[href]');if(a&&a.href.startsWith('https://www.google.com/maps/'))return;if(a&&(/^(mailto:|tel:)/.test(a.href)||(/^https?:/.test(a.href)&&new URL(a.href).origin!==location.origin))){e.preventDefault();e.stopImmediatePropagation();alert('Design preview: external booking and contact links are disabled.');}},true);
document.addEventListener('DOMContentLoaded',function(){
  var note=document.createElement('p');note.textContent='DESIGN PREVIEW — no payments, bookings or messages sent';note.style.cssText='margin:0;padding:8px 16px;background:#C9A227;color:#111;text-align:center;font:600 12px system-ui';document.body.insertBefore(note,document.body.firstChild);
  var style=document.createElement('style');document.head.appendChild(style);function align(){style.textContent='.site-header{top:'+note.offsetHeight+'px}.vframe video{display:block;width:100%;height:100%;object-fit:contain}';}align();addEventListener('resize',align);
  document.querySelectorAll('input[name=name],input[name=email],input[name=phone]').forEach(function(el){el.required=false;el.value='';el.placeholder='Preview only — no personal details needed';el.disabled=true;});
  document.querySelectorAll('.btn-yes').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();e.stopImmediatePropagation();location.href='welcome.html?preview=1&gi=1';},true);});
  document.querySelectorAll('.btn-no').forEach(function(a){a.href='welcome.html?preview=1';a.removeAttribute('data-carry');});
  if(/\/welcome(?:\.html)?\/?$/.test(location.pathname)){var n=document.querySelector('.wl-name');if(n)n.textContent=', Sam';var em=document.getElementById('rc-email');if(em)em.textContent='sam@example.test';var status=document.getElementById('payment-status-text');if(status)status.textContent='Preview receipt — no payment taken';}
  var paidBanner=document.querySelector('.paid-banner');if(paidBanner)paidBanner.textContent='Preview trial only — no payment or booking has been made.';
  var facade=document.querySelector('.vfacade');if(facade)facade.addEventListener('click',function(e){e.stopImmediatePropagation();var wrap=document.createElement('div');wrap.className='vframe';var video=document.createElement('video');video.src='video/welcome-nsbjj-720.mp4';video.controls=true;video.autoplay=true;video.playsInline=true;wrap.appendChild(video);facade.replaceWith(wrap);},true);
});
