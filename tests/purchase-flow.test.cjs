"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const page=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
function between(begin,end){
  const a=page.indexOf(begin),b=page.indexOf(end,a+begin.length);
  assert.ok(a>=0 && b>a,"missing source fragment "+begin);
  return page.slice(a,b);
}
const developerCode=between("/* BETA TEST BUILD ONLY","/* iOS host must expose");
const purchaseCode=between("async function storeAction(action){",'$("unlock-buy").addEventListener');

function createHarness(existing=new Map(),native=false){
  const elements=new Map(),opened=[],views=[],notices=[];
  const context={
    window:{confirm:()=>true},
    document:{
      querySelector:()=>null,
      createElement:()=>({setAttribute(){},remove(){},textContent:""}),
      body:{appendChild(){}}
    },
    setTimeout(){},
    localStorage:{
      getItem:k=>existing.has(k)?existing.get(k):null,
      setItem:(k,v)=>existing.set(k,String(v)),
      removeItem:k=>existing.delete(k)
    },
    $:id=>{
      if(!elements.has(id))elements.set(id,{hidden:false,checked:false,disabled:false,textContent:"",
        value:"1",addEventListener(){}});
      return elements.get(id);
    },
    nativeStore:()=>native?{}:null,
    fullGame:false,li:0,daily:false,hardOn:false,seq:[],hintPaid:{},
    hintOn:false,hintKey:"",hintPaid:{},hints:0,
    cleared:{},stars:{},fails:{},owned:{},worn:{},dailyDone:{},seen:{},
    LEVELS:Array.from({length:100},(_,i)=>({name:"Level "+(i+1)})),
    FREE_LEVEL_COUNT:5,
    pendingUnlockTarget:null,entitlementReturnLevel:null,
    storeBusy:false,
    show:name=>views.push(name),
    load:level=>{context.li=level;context.seq=[];},
    save:()=>existing.set("ftw-save",JSON.stringify({
      cleared:context.cleared,stars:context.stars,li:context.li
    })),
    syncPrizes(){},dressWolf(){},renderWardrobe(){},updateStoreButtons(){},
    resumeUnlockedPlay:()=>opened.push("resume"),
    openUnlock:(level,isDaily)=>opened.push({level,isDaily})
  };
  const api=vm.runInNewContext(developerCode+"\n"+purchaseCode+
    "\n({hasFullAccess,testCheckoutAvailable,openDeveloper,setPreviewFull,leaveDeveloper,resetTesting,storeAction})",context);
  return{api,context,elements,storage:existing,opened,views,notices};
}

test("First launch is a free trial; a TEST purchase persists across relaunch",async()=>{
  const h=createHarness();
  assert.equal(h.api.hasFullAccess(),false);
  assert.equal(h.api.testCheckoutAvailable(),true);
  await h.api.storeAction("purchase");
  assert.equal(h.storage.get("ftw-beta-simulated-unlock-v1"),"yes");
  assert.equal(h.api.hasFullAccess(),true);
  assert.ok(h.opened.includes("resume"));
  const reopened=createHarness(h.storage);
  assert.equal(reopened.api.hasFullAccess(),true);
});

test("Developer preview can expose full content without creating a purchase",()=>{
  const h=createHarness();
  h.api.openDeveloper();
  h.api.setPreviewFull(true);
  assert.equal(h.api.hasFullAccess(),true);
  assert.equal(h.storage.has("ftw-beta-simulated-unlock-v1"),false);
  h.api.leaveDeveloper(true);
  assert.equal(h.api.hasFullAccess(),false);
});

test("Reset test purchase preserves cleared levels and reopens the paywall",async()=>{
  const h=createHarness();
  h.context.cleared={0:true,1:true,2:true,3:true,4:true};
  h.context.li=11;
  await h.api.storeAction("purchase");
  h.api.openDeveloper();
  h.api.resetTesting("purchase");
  assert.equal(h.api.hasFullAccess(),false);
  assert.equal(h.storage.has("ftw-beta-simulated-unlock-v1"),false);
  assert.equal(h.context.cleared[4],true);
  assert.ok(h.opened.some(o=>o&&o.level===5&&o.isDaily===false));
});

test("Reset progress retains purchase; Reset Both clears everything",async()=>{
  const h=createHarness();
  await h.api.storeAction("purchase");
  h.context.cleared={0:true,1:true};
  h.context.stars={0:3};
  h.context.owned={wolf:true,fox:true};
  h.context.li=23;
  h.api.openDeveloper();
  h.api.resetTesting("progress");
  assert.equal(h.api.hasFullAccess(),true);
  assert.equal(h.context.li,0);
  assert.equal(Object.keys(h.context.cleared).length,0);
  assert.equal(Object.keys(h.context.stars).length,0);
  assert.equal(h.storage.get("ftw-beta-simulated-unlock-v1"),"yes");
  h.api.openDeveloper();
  h.api.resetTesting("all");
  assert.equal(h.api.hasFullAccess(),false);
  assert.equal(h.context.li,0);
  assert.equal(h.storage.has("ftw-beta-simulated-unlock-v1"),false);
});

test("Simulated purchase never overrides presence of native StoreKit bridge",()=>{
  const h=createHarness(new Map([["ftw-beta-simulated-unlock-v1","yes"]]),true);
  assert.equal(h.api.testCheckoutAvailable(),false);
  assert.equal(h.api.hasFullAccess(),false);
});

test("The installed home-screen build persists position and retains five-level gate",()=>{
  assert.match(page,/const FREE_LEVEL_COUNT = 5/);
  assert.match(page,/if \(!canPlay\(index,daily\)\)/);
  assert.match(page,/li, hard:hardOn/);
  assert.match(page,/const requested = Number\.isInteger\(sv\.li\)/);
  assert.match(page,/result\.verified !== true/);
  assert.match(page,/TEST PURCHASE ONLY · NO PAYMENT WILL BE TAKEN/);
});
