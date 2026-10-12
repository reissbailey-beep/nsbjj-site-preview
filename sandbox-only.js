'use strict';
// Public sandbox: no live tracking, real contacts, bookings, Gymdesk signup or external form submissions.
window.NSBJJ_PREVIEW=true;
window.NSBJJ_TRACKING=Object.freeze({TRACKING_LIVE:false,CHECKOUT_LIVE:false});
document.addEventListener('submit',function(e){
 if(e.target.id!=='pay'){e.preventDefault();e.stopImmediatePropagation();alert('Sandbox only: no message or booking has been sent.');return;}
 var agree=document.getElementById('sandbox-agree');if(!agree||!agree.checked){e.preventDefault();e.stopImmediatePropagation();if(agree)agree.reportValidity();}
},true);
document.addEventListener('click',function(e){var a=e.target.closest('a[href]');if(a&&(/^(mailto:|tel:)/.test(a.href)||(/^https?:/.test(a.href)&&new URL(a.href).origin!==location.origin))){e.preventDefault();e.stopImmediatePropagation();alert('Sandbox only: external booking and contact links are disabled.');}},true);
document.addEventListener('DOMContentLoaded',function(){
 var note=document.createElement('p');note.id='sandbox-banner';note.textContent='PRIVATE PREVIEW — checkout is a placeholder. No payment, membership or class booking.';note.style.cssText='margin:0;padding:10px 16px;background:#F2B705;color:#111;text-align:center;font:700 14px system-ui';document.body.insertBefore(note,document.body.firstChild);
 var style=document.createElement('style');document.head.appendChild(style);function align(){style.textContent='.site-header{top:'+note.offsetHeight+'px}#sandbox-banner{position:relative;z-index:1100}.sandbox-note{padding:16px;border:1px solid #F2B705;margin:16px 0}.sandbox-note label{display:flex;gap:10px;align-items:flex-start}.sandbox-note input{width:20px;height:20px;flex-shrink:0}';}align();addEventListener('resize',align);
 var form=document.getElementById('pay');if(form){
  var values={name:'Sam',email:'sam@example.test',phone:'+447700900123'};
  Object.keys(values).forEach(function(k){var field=form.elements[k];if(field){field.value=values[k];field.readOnly=true;field.autocomplete='off';}});
  var box=document.createElement('div');box.className='sandbox-note';box.innerHTML='<p>Use fictional details and a Stripe test card only. This test does not start a membership or reserve a class.</p><label><input id="sandbox-agree" type="checkbox" required> I understand this is a sandbox test with no real payment or booking.</label>';
  form.querySelector('.btn-pay').insertAdjacentElement('beforebegin',box);
  var agreement=document.getElementById('trial-agreement');if(agreement)agreement.textContent='Sandbox demonstration of a £20 trial and an optional £65 gi. No real card or personal information should be entered. Real membership terms do not take effect in this test.';
  var placeholder=form.querySelector('.stripe-ph');if(placeholder)placeholder.textContent='Placeholder: checkout is not connected in this preview. Nothing is charged.';
 }
 var membership=document.getElementById('membership-status');if(membership)membership.textContent='Sandbox only. No real Gymdesk account or membership is created. Staff handoff will be tested separately.';
 var signup=document.getElementById('signup');if(signup){signup.removeAttribute('href');signup.setAttribute('aria-disabled','true');signup.textContent='Account setup disabled in sandbox';}
 document.querySelectorAll('.mock-note').forEach(function(n){n.textContent='Stripe sandbox: test payments only. No real purchase, membership or booking.';});
});
