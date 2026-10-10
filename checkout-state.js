/* Shared, fail-closed checks for server-verified checkout responses.
   This does not enable checkout, create a payment or replace server verification. */
(function(root){
  'use strict';
  var SESSION=/^cs_(test|live)_[A-Za-z0-9]+$/;
  function sessionId(id){return typeof id==='string'&&SESSION.test(id);}
  function purchase(p,value,transactionId){
    return !!p&&p.value===value&&p.transaction_id===transactionId&&
      typeof p.event_id==='string'&&p.event_id.trim().length>0;
  }
  function paidSession(s,id){
    return sessionId(id)&&!!s&&s.paid===true&&s.currency==='GBP'&&
      purchase(s.trial,20,id)&&
      (s.gi===null||s.gi===undefined||purchase(s.gi,65,id+'-gi'));
  }
  function stripeCheckoutUrl(value){
    if(typeof value!=='string')return false;
    try{var u=new URL(value);return u.protocol==='https:'&&u.hostname==='checkout.stripe.com'&&
      u.port===''&&u.username===''&&u.password==='';}catch(e){return false;}
  }
  var api=Object.freeze({sessionId:sessionId,paidSession:paidSession,stripeCheckoutUrl:stripeCheckoutUrl});
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.NSBJJCheckout=api;
})(typeof window==='object'?window:globalThis);
