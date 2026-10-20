/* Shared Me-LON tracker: no names, emails or persistent cross-site advertising IDs. */
(() => {
 'use strict';
 const tag=document.currentScript,book=tag?.dataset.book||'platform';
 const endpoint='https://asia-south1-statoberrydrona.cloudfunctions.net/melonMetrics';
 const parentOrigins=['https://www.agrinoteskau.com','https://agrinoteskau.com'];
 const bookOrigins=['https://kaumelon.github.io','https://statoberrypapaya.github.io'];
 const isParent=parentOrigins.includes(location.origin),embedded=window.parent!==window;
 const uid=()=>crypto.randomUUID();
 const disabled=()=>navigator.doNotTrack==='1'||navigator.globalPrivacyControl===true||localStorage.getItem('melon-analytics-optout')==='1';
 let context;
 try{
  if(location.protocol!=='https:'||/bot|crawler|spider|headless/i.test(navigator.userAgent))return;
  if(embedded&&!isParent){context={};}else{
  if(disabled())return;
  let visitor=localStorage.getItem('melon-analytics-visitor');if(!visitor){visitor=uid();localStorage.setItem('melon-analytics-visitor',visitor);}
  let session=sessionStorage.getItem('melon-analytics-session');if(!session){session=uid();sessionStorage.setItem('melon-analytics-session',session);}
  context={visitor,session};}
 }catch{return;}
 // Embedded books request their Me-LON tab's anonymous context, so third-party storage is not required.
 if(isParent){
  window.addEventListener('message',event=>{
   const frame=document.querySelector('.book-reader');
   if(event.data?.type!=='melon-context-request'||!frame||event.source!==frame.contentWindow||!bookOrigins.includes(event.origin))return;
   event.source.postMessage({type:'melon-context',...context,disabled:disabled()},event.origin);
  });
  if(document.querySelector('.book-reader')||location.pathname.includes('usage'))return;
 }
 function start(ctx){
  let day='',state,key,last=performance.now(),activeAt=performance.now(),pending=false;
  const memory=new Map();
  function load(){const next=new Date(Date.now()+19800000).toISOString().slice(0,10);if(day===next)return;day=next;key='melon-state:'+book+':'+day;let stored;try{stored=JSON.parse(sessionStorage.getItem(key)||'null');}catch{}state=stored||{seconds:0,seq:0,lastSentSeconds:-1};}
  function save(){try{sessionStorage.setItem(key,JSON.stringify(state));}catch{memory.set(key,state);}}
  load();
  const activity=()=>{activeAt=performance.now();};
  for(const name of ['pointerdown','pointermove','keydown','scroll','touchstart'])window.addEventListener(name,activity,{passive:true});
  const tick=()=>{load();const now=performance.now(),delta=Math.min((now-last)/1000,2);last=now;if(document.visibilityState==='visible'&&document.hasFocus()&&now-activeAt<90000){state.seconds=Math.min(21600,state.seconds+delta);save();}};
  const send=async()=>{
   try{if((!embedded&&disabled())||pending)return;}catch{return;}
   load();const seconds=Math.floor(state.seconds);if(seconds===state.lastSentSeconds&&state.lastSentPage===location.pathname)return;pending=true;state.seq++;save();
   const body={book,visitor:ctx.visitor,session:ctx.session,seq:state.seq,seconds,page:location.pathname,source:book==='platform'?'site':'book',device:innerWidth<768?'mobile':innerWidth<1024?'tablet':'desktop'};
   try{const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(body),keepalive:true,credentials:'omit'});if(r.ok){const d=await r.json();if(d.recorded){state.lastSentSeconds=seconds;state.lastSentPage=location.pathname;save();}}}catch{}finally{pending=false;}
  };
  tick();send();setInterval(tick,1000);setInterval(send,60000);
  document.addEventListener('visibilitychange',()=>{tick();if(document.visibilityState==='hidden')send();else activity();});
  window.addEventListener('pagehide',()=>{tick();send();});
 }
 if(embedded&&book!=='platform'){
  const onContext=e=>{if(e.source!==window.parent||!parentOrigins.includes(e.origin)||e.data?.type!=='melon-context')return;window.removeEventListener('message',onContext);if(!e.data.disabled)start(e.data);};
  window.addEventListener('message',onContext);
  for(const origin of parentOrigins)window.parent.postMessage({type:'melon-context-request'},origin);
 }else start(context);
})();


