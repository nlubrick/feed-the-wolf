/* App shell cache for Feed the Wolf. Network-first, so fresh releases are never hidden behind an old cache. */
const VERSION="ftw-install-v34";
const CORE=["./","./index.html","./expansion-levels.js","./store-catalog-v1.js","./store-config.js","./store-bridge-v1.js","./test-store-v2.js","./bonus-style-v1.css","./bonus-themes-v1.css","./bonus-themes-v1.js","./bonus-levels-v1.js","./bonus-match-v1.js","./bonus-pipes-v1.js","./bonus-hidden-v1.js","./bonus-arcade-v1.js","./bonus-arcade-b-v1.js","./world-music-v1.js","./studio-boot-v2.js","./studio-credits-roll-v2.js","./failure-entertainment-intro-v2.html","./manifest.webmanifest","./feed-the-wolf-icon.svg"];
self.addEventListener("install",event=>{
 event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(CORE.map(url=>new Request(url,{cache:"reload"})))).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==VERSION).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
 const req=event.request;
 if(req.method!=="GET")return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin)return;
 // Network first for everything, so a new release shows up straight away; the cache is only for playing offline.
 event.respondWith(fetch(req,{cache:"no-cache"}).then(response=>{
  if(response.ok){const copy=response.clone();caches.open(VERSION).then(cache=>cache.put(req,copy)).catch(()=>{});}
  return response;
 }).catch(()=>caches.match(req,{ignoreSearch:true}).then(hit=>hit||(req.mode==="navigate"?caches.match("./index.html"):Response.error()))));
});