/* Feed the Wolf: the bridge between the game and the real stores, through RevenueCat (Apple App Store and Google Play).
   It only switches on inside the iPhone or Android app, and only when this build was given a store key.
   The game never trusts anything but what this returns: {verified:true, entitled:true} comes only from the store's own records.
   Also keeps a second copy of the save in the phone's app storage, so an update or a storage clean-up cannot lose progress. */
(function(root){
"use strict";
const SAVE_KEY="ftw-save";
function create(plugin,key,catalog){
 const packs=catalog.PRODUCTS.filter(p=>p.gems>0).map(p=>p.id),ids=catalog.PRODUCTS.map(p=>p.id);
 let ready=null,products=null;
 const init=()=>ready||(ready=Promise.resolve(plugin.configure({apiKey:key})).catch(e=>{ready=null;throw e;}));
 async function loadProducts(){
  if(!products){const r=await plugin.getProducts({productIdentifiers:ids,type:"NON_SUBSCRIPTION"});products=(r&&r.products)||[];}
  return products;
 }
 /* What the store says this customer owns: the full-game entitlement, and how many of each gem pack they have ever bought. */
 function summary(info,productId){
  const active=info&&info.entitlements&&info.entitlements.active,ent=active&&active[catalog.ENTITLEMENT];
  const gemPacks={},seen=new Set();
  for(const t of (info&&info.nonSubscriptionTransactions)||[]){
   if(!t||!packs.includes(t.productIdentifier)||seen.has(t.transactionIdentifier))continue;
   seen.add(t.transactionIdentifier);gemPacks[t.productIdentifier]=(gemPacks[t.productIdentifier]||0)+1;
  }
  const prices={};for(const p of products||[])if(p&&ids.includes(p.identifier)&&typeof p.priceString==="string")prices[p.identifier]=p.priceString;
  return{productId,verified:!!info,entitled:!!(info&&ent&&ent.isActive!==false),gemPacks,prices,displayPrice:prices[catalog.FULL_ID]};
 }
 return{
  async status(productId){await init();const r=await plugin.getCustomerInfo();try{await loadProducts();}catch(e){}return summary(r&&r.customerInfo,productId);},
  async purchase(productId){
   await init();const product=(await loadProducts()).find(p=>p.identifier===productId);
   if(!product)throw new Error("That product is not available in this store yet.");
   try{const r=await plugin.purchaseStoreProduct({product});return summary(r&&r.customerInfo,productId);}
   catch(e){if(e&&e.userCancelled)return{productId,verified:false,entitled:false,cancelled:true};throw e;}
  },
  async restore(productId){await init();const r=await plugin.restorePurchases();try{await loadProducts();}catch(e){}return summary(r&&r.customerInfo,productId);}
 };
}
/* A second copy of the save in native app storage. Puts it back if the web view's own copy has gone missing. */
function backup(prefs,storage,reload){
 const put=text=>{try{const p=prefs.set({key:SAVE_KEY,value:String(text)});if(p&&p.catch)p.catch(()=>{});}catch(e){}};
 const restore=async()=>{
  try{
   if(storage.getItem(SAVE_KEY))return false;
   const r=await prefs.get({key:SAVE_KEY});
   if(!r||typeof r.value!=="string"||r.value.length<2)return false;
   JSON.parse(r.value);storage.setItem(SAVE_KEY,r.value);if(reload)reload();return true;
  }catch(e){return false;}
 };
 return{put,restore};
}
root.FTWStoreBridge=Object.freeze({create,backup});
const cap=root.Capacitor,plugins=cap&&cap.Plugins,platform=cap&&typeof cap.getPlatform==="function"?cap.getPlatform():"web";
const cfg=root.FTW_STORE_CONFIG||{},key=cfg.revenueCat&&cfg.revenueCat[platform];
if((platform==="ios"||platform==="android")&&plugins){
 if(plugins.Purchases&&typeof key==="string"&&key.length>8&&root.FTWCatalog)root.FeedTheWolfStore=create(plugins.Purchases,key,root.FTWCatalog);
 if(plugins.Preferences){
  let storage=null;try{storage=root.localStorage;}catch(e){}
  if(storage){
   const b=backup(plugins.Preferences,storage,()=>{try{if(!root.sessionStorage.getItem("ftw-restored")){root.sessionStorage.setItem("ftw-restored","1");root.location.reload();}}catch(e){}});
   root.FTWNativeSave=b;b.restore();
  }
 }
}
})(typeof window!=="undefined"?window:globalThis);
