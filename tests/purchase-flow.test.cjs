"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const code=fs.readFileSync(path.join(root,"test-store-v2.js"),"utf8");
function harness(saved=new Map()){
  const storage={getItem:k=>saved.has(k)?saved.get(k):null,
    setItem:(k,v)=>saved.set(k,String(v)),removeItem:k=>saved.delete(k)};
  const window={localStorage:storage};
  vm.runInNewContext(code,{window});
  return {store:window.FTWTestStore,storage,saved};
}
function fragment(a,b){
  const i=html.indexOf(a),j=html.indexOf(b,i+a.length);
  assert.ok(i>=0&&j>i,"Missing source fragment "+a);
  return html.slice(i,j);
}
function economy(ctx){
  const code=fragment("function syncPrizes(){","function save(){");
  return vm.runInNewContext(code+"\n({syncPrizes})",ctx).syncPrizes;
}
function getPrice(){
  return vm.runInNewContext(fragment("function gemPrice(o){","function renderWardrobe(){")+"\n({gemPrice})").gemPrice;
}
test("The one Store combines wardrobe collections and gem packs",()=>{
  assert.match(html,/id="wbtn"[^>]+>[\s\S]*?<span>Store<\/span>/);
  assert.match(html,/<section id="shop" hidden>/);
  assert.match(html,/id="store-products"/);
  assert.match(html,/id="tilesH"/);assert.match(html,/id="tilesP"/);
  assert.match(html,/id="tilesS"/);assert.match(html,/id="tilesT"/);
  assert.doesNotMatch(html,/<section id="store" hidden/);
  assert.doesNotMatch(html,/<h1>Wardrobe<\/h1>/);
});
test("The only simulated cash products are full game and repeatable gem packs",()=>{
  const {store}=harness(),products=store.PRODUCTS;
  assert.deepEqual(Array.from(products,p=>p.id),[
    "feed_the_wolf_full_unlock","ftw_gems_50","ftw_gems_150","ftw_gems_400"
  ]);
  assert.equal(products.filter(p=>p.gems>0).length,3);
  assert.ok(products.every(p=>!p.outfit));
});
test("Gem packs stack, survive relaunch, and reset without touching progress",()=>{
  const h=harness();
  h.saved.set("ftw-save",JSON.stringify({cleared:{0:true},li:1}));
  h.store.purchase("ftw_gems_50",h.storage);
  h.store.purchase("ftw_gems_50",h.storage);
  h.store.purchase("ftw_gems_150",h.storage);
  assert.equal(h.store.gemsGranted(h.store.read(h.storage)),250);
  assert.equal(harness(h.saved).store.gemsGranted(h.store.read(h.storage)),250);
  h.store.reset(h.storage);
  assert.equal(h.store.gemsGranted(h.store.read(h.storage)),0);
  assert.equal(JSON.parse(h.saved.get("ftw-save")).cleared[0],true);
});
test("The full game is a one-time unlock; packs are repeatable",()=>{
  const h=harness();
  h.store.purchase(h.store.FULL_ID,h.storage);
  h.store.purchase(h.store.FULL_ID,h.storage);
  const r=h.store.read(h.storage);
  assert.equal(h.store.has(r,h.store.FULL_ID),true);
  assert.equal(r.purchased.length,1);
  assert.equal(h.store.gemsGranted(r),0);
  assert.match(html,/const FREE_LEVEL_COUNT = 5;/);
  assert.match(html,/if \(!canPlay\(index,daily\)\)/);
  assert.match(html,/result\.verified !== true/);
});
test("Each cosmetic has a gem price including milestone rewards and pets",()=>{
  const price=getPrice();
  assert.equal(price({id:"wolf",free:true,slot:"hero"}),0);
  assert.equal(price({id:"fox",slot:"hero",cost:15,from:6}),15);
  assert.equal(price({id:"bandana",slot:"neck",level:5}),19);
  assert.ok(price({id:"phoenix",slot:"pet",hard:70})>0);
  assert.ok(price({id:"marquee",slot:"head",level:100})>0);
  assert.match(html,/if\(!o\.cost\)gemUnlocked\[o\.id\]=price/);
});
test("Bought gems enter the real earned/spent-gem balance once",()=>{
  const h=harness();
  h.store.purchase("ftw_gems_50",h.storage);
  const ctx={
    owned:{wolf:true,party:true,bandana:true},worn:{hero:"wolf"},
    gems:0,cleared:{},stars:{0:3},dailyDone:{},hints:0,
    gemUnlocked:{bandana:19},
    OUTFITS:[{id:"wolf",free:true},{id:"party",cost:6,slot:"head"},{id:"bandana",level:5,slot:"neck"}],
    mockGemCredits:()=>h.store.gemsGranted(h.store.read(h.storage))
  };
  economy(ctx)();
  assert.equal(ctx.gems,28); // 3 earned + 50 pack - 6 outfit - 19 milestone buy
  economy(ctx)();
  assert.equal(ctx.gems,28); // no double credit
});
test("Progress reset preserves purchased gems; purchase reset preserves level progress",()=>{
  const h=harness();
  h.saved.set("ftw-save",JSON.stringify({li:40,gemUnlocked:{bandana:19}}));
  h.store.purchase("ftw_gems_400",h.storage);
  h.saved.delete("ftw-save"); // progress-only reset
  assert.equal(h.store.gemsGranted(h.store.read(h.storage)),400);
  h.saved.set("ftw-save",JSON.stringify({li:15}));
  h.store.reset(h.storage); // purchase-only reset
  assert.equal(h.store.gemsGranted(h.store.read(h.storage)),0);
  assert.equal(JSON.parse(h.saved.get("ftw-save")).li,15);
  assert.match(html,/gemUnlocked=\{\};hints=0/);
  assert.match(html,/gemUnlocked, hints/);
});
test("Test controls must be stripped for App Store release",()=>{
  const guard=fs.readFileSync(path.join(root,"scripts","check-release.cjs"),"utf8");
  assert.match(guard,/test-store-v2\.js/);
  assert.match(guard,/id="developer/);
  assert.match(html,/TEST MODE · NO PAYMENT · NO APPLE CHARGE/);
  assert.match(html,/id="developer-open"/);
});
