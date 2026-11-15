"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const page=fs.readFileSync(path.join(root,"index.html"),"utf8");
const fakeStoreCode=fs.readFileSync(path.join(root,"test-store.js"),"utf8");
function between(begin,end){
  const a=page.indexOf(begin),b=page.indexOf(end,a+begin.length);
  assert.ok(a>=0&&b>a,"Missing fragment "+begin);return page.slice(a,b);
}
const devCode=between("/* BETA TEST BUILD ONLY","/* iOS host must expose");
const purchaseCode=between("async function storeAction(action){",'$("unlock-buy").addEventListener');
const productIds=["copper","mossfox","firefly","phoenix","marquee"];
const items=productIds.map((id,i)=>({
  id,slot:i<2?"hero":i===4?"head":"pet",name:id,cost:20,premium:true
}));
function createHarness(saved=new Map(),native=false){
  const storage={getItem:k=>saved.has(k)?saved.get(k):null,
    setItem:(k,v)=>saved.set(k,String(v)),removeItem:k=>saved.delete(k)};
  const elements=new Map(), opened=[],views=[];
  const $=id=>{
    if(!elements.has(id))elements.set(id,{
      hidden:["unlock","store","test-checkout"].includes(id),checked:false,disabled:false,
      textContent:"",value:"1",innerHTML:"",isConnected:true,addEventListener(){},focus(){}
    });
    return elements.get(id);
  };
  const win={confirm:()=>true,localStorage:storage};
  vm.runInNewContext(fakeStoreCode,{window:win});
  const ctx={
    window:win,localStorage:storage,
    document:{activeElement:{isConnected:true,focus(){}},
      querySelector:()=>null,createElement:()=>({setAttribute(){},remove(){},textContent:""}),
      body:{appendChild(){}},addEventListener(){}},
    setTimeout(){},clearTimeout(){},
    $,
    nativeStore:()=>native?{}:null,
    fullGame:false,li:0,daily:false,hardOn:false,seq:[],hintPaid:{},hintOn:false,hintKey:"",hints:0,
    cleared:{},stars:{},fails:{},owned:{},worn:{},dailyDone:{},seen:{},
    LEVELS:Array.from({length:100},(_,i)=>({name:"Level "+(i+1)})),
    OUTFITS:items,FREE_LEVEL_COUNT:5,FULL_UNLOCK_PRODUCT_ID:"feed_the_wolf_full_unlock",
    pendingUnlockTarget:null,entitlementReturnLevel:null,storeBusy:false,
    thumb:()=>"",heroSvg:()=>({src:""}),
    show:view=>views.push(view),load:level=>{ctx.li=level;ctx.seq=[];},
    save:()=>saved.set("ftw-save",JSON.stringify({cleared:ctx.cleared,stars:ctx.stars,li:ctx.li})),
    syncPrizes:()=>ctx._grant?.(),dressWolf(){},renderWardrobe(){},updateStoreButtons(){},
    resumeUnlockedPlay:()=>opened.push("resume"),
    openUnlock:(level,isDaily)=>opened.push({level,isDaily})
  };
  const api=vm.runInNewContext(devCode+"\n"+purchaseCode+
    "\n({hasFullAccess,testCheckoutAvailable,openDeveloper,setPreviewFull,leaveDeveloper,resetTesting,storeAction,openFakeCheckout,confirmFakeCheckout,fakeShopHasProduct,grantFakeCosmetics})",ctx);
  ctx._grant=api.grantFakeCosmetics;
  return {api,ctx,saved,elements,opened,views,store:win.FTWTestStore};
}
async function buy(h,id){
  if(id==="feed_the_wolf_full_unlock")await h.api.storeAction("purchase");
  else h.api.openFakeCheckout(id);
  assert.equal(h.elements.get("test-checkout").hidden,false);
  assert.equal(h.saved.has("ftw-beta-simulated-unlock-v1"),false);
  h.api.confirmFakeCheckout();
  assert.equal(h.elements.get("test-checkout").hidden,true);
}
test("Free demo, no-charge full-game checkout and persistent re-opening",async()=>{
  const h=createHarness();assert.equal(h.api.hasFullAccess(),false);
  await h.api.storeAction("purchase");assert.equal(h.api.hasFullAccess(),false);
  h.api.confirmFakeCheckout();
  assert.equal(h.api.hasFullAccess(),true);
  assert.equal(h.saved.get("ftw-beta-simulated-unlock-v1"),"yes");
  assert.ok(h.opened.includes("resume"));
  const again=createHarness(h.saved);assert.equal(again.api.hasFullAccess(),true);
});
test("Five optional store items can be purchased without affecting the full-game purchase",async()=>{
  const h=createHarness();
  await buy(h,"ftw_test_copper_fox");
  assert.equal(h.api.fakeShopHasProduct("ftw_test_copper_fox"),true);
  assert.equal(h.ctx.owned.copper,true);
  assert.equal(h.ctx.worn.hero,"copper");
  assert.equal(h.api.hasFullAccess(),false);
  const again=createHarness(h.saved);assert.equal(again.api.fakeShopHasProduct("ftw_test_copper_fox"),true);
});
test("Developer preview does not grant purchase; exiting removes preview",()=>{
  const h=createHarness();h.api.openDeveloper();h.api.setPreviewFull(true);
  assert.equal(h.api.hasFullAccess(),true);
  assert.equal(h.saved.has("ftw-beta-simulated-unlock-v1"),false);
  h.api.leaveDeveloper(true);assert.equal(h.api.hasFullAccess(),false);
});
test("Reset purchases retains cleared levels, removes store items, and reopens paywall",async()=>{
  const h=createHarness();h.ctx.cleared={0:true,1:true,2:true,3:true,4:true};h.ctx.li=11;
  await buy(h,"ftw_test_firefly");
  await buy(h,"feed_the_wolf_full_unlock");
  h.api.openDeveloper();h.api.resetTesting("purchase");
  assert.equal(h.api.hasFullAccess(),false);
  assert.equal(h.api.fakeShopHasProduct("ftw_test_firefly"),false);
  assert.equal(h.saved.has("ftw-beta-simulated-unlock-v1"),false);
  assert.equal(h.ctx.owned.firefly,undefined);
  assert.equal(h.ctx.cleared[4],true);
  assert.ok(h.opened.some(o=>o&&o.level===5));
});
test("Reset progress keeps purchased items and full game; reset both clears both",async()=>{
  const h=createHarness();await buy(h,"ftw_test_firefly");await buy(h,"feed_the_wolf_full_unlock");
  h.ctx.cleared={0:true};h.ctx.stars={0:3};h.ctx.li=42;
  h.api.openDeveloper();h.api.resetTesting("progress");
  assert.equal(h.api.hasFullAccess(),true);assert.equal(h.ctx.li,0);
  assert.deepEqual(Object.keys(h.ctx.cleared),[]);
  assert.equal(h.ctx.owned.firefly,true);
  h.api.openDeveloper();h.api.resetTesting("all");
  assert.equal(h.api.hasFullAccess(),false);assert.equal(h.api.fakeShopHasProduct("ftw_test_firefly"),false);
});
test("Native StoreKit disables mock purchases even if fake receipts exist",()=>{
  const saved=new Map([["ftw-beta-simulated-unlock-v1","yes"]]);
  const h=createHarness(saved,true);
  assert.equal(h.api.testCheckoutAvailable(),false);
  assert.equal(h.api.hasFullAccess(),false);
});
test("Home-screen resume and five-level price gate remain present",()=>{
  assert.match(page,/const FREE_LEVEL_COUNT = 5/);
  assert.match(page,/if \(!canPlay\(index,daily\)\)/);
  assert.match(page,/li, hard:hardOn/);
  assert.match(page,/const requested = Number\.isInteger\(sv\.li\)/);
  assert.match(page,/result\.verified !== true/);
  assert.match(page,/TEST PURCHASE ONLY · NO PAYMENT WILL BE TAKEN/);
});
