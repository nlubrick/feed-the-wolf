/* App shell cache for Feed the Wolf. Navigations use network-first for fresh releases. */
const VERSION="ftw-install-v9";
const CORE=["./","./index.html","./expansion-levels.js","./studio-boot-v2.js","./studio-credits-roll-v2.js","./failure-entertainment-intro-v2.html","./manifest.webmanifest","./feed-the-wolf-icon.svg"];
self.addEventListener("install",event=>{
 event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==VERSION).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
 const req=event.request;
 if(req.method!=="GET")return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin)return;
 if(req.mode==="navigate"){
  event.respondWith(fetch(req).then(response=>{
   if(response.ok){const copy=response.clone();caches.open(VERSION).then(cache=>cache.put(req,copy)).catch(()=>{});}
   return response;
  }).catch(()=>caches.match(req,{ignoreSearch:true}).then(hit=>hit||caches.match("./index.html"))));
 }else{
  event.respondWith(caches.match(req,{ignoreSearch:true}).then(hit=>hit||fetch(req).then(response=>{
   if(response.ok){const copy=response.clone();caches.open(VERSION).then(cache=>cache.put(req,copy)).catch(()=>{});}
   return response;
  })));
 }
});