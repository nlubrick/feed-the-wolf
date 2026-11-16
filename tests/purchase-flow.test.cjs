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
  assert.match(html,/id="tilesH"/);assert.match(html,/id="tilesS"/);assert.doesNotMatch(html,/id="tilesP"/);   // prizes and costumes share one shelf
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
    mockGemCredits:()=>h.store.gemsGranted(h.store.read(h.storage)),
    bonusEarnedGems:()=>0
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
  assert.match(html,/gemUnlocked=\{\};bonusResults=\{\};legacyBonusGems=0;campaignStage=1;hints=0/);
  assert.match(html,/gemUnlocked, bs:bonusResults, lg:legacyBonusGems, sv:2, cs:campaignStage, hints/);
});
test("Test controls must be stripped for App Store release",()=>{
  const guard=fs.readFileSync(path.join(root,"scripts","check-release.cjs"),"utf8");
  assert.match(guard,/test-store-v2\.js/);
  assert.match(guard,/id="developer/);
  assert.match(html,/TEST MODE · NO PAYMENT · NO APPLE CHARGE/);
  assert.match(html,/id="developer-open"/);
});
test("Location trophies are earned, never bought, and every fifth level pays a gem bonus",()=>{
  const OUTFITS=vm.runInNewContext(fragment("const OUTFITS = [","/* Pets: small companions")+"\nOUTFITS");
  const trophies=OUTFITS.filter(o=>o.trophy!=null);
  assert.deepEqual(Array.from(trophies,o=>o.trophy).sort(),[0,1,2,3,4]);           // one per location
  assert.equal(OUTFITS.filter(o=>"level" in o||"hard" in o).length,0);              // no other free level or Hard Mode prizes
  assert.equal(OUTFITS.filter(o=>o.slot==="pet").length,16);
  assert.match(html,/if\(o\.trophy!=null\)\{testToast\(/);                           // the Store refuses to sell a trophy
  const run=(cleared,stars)=>{const ctx={owned:{},worn:{},gems:0,cleared,stars,dailyDone:{},hints:0,gemUnlocked:{},OUTFITS,mockGemCredits:()=>0,bonusEarnedGems:()=>0};
    const got=economy(ctx)();return {ctx,got};};
  let r=run({0:true,1:true,2:true,3:true},{0:3,1:3,2:3,3:3});
  assert.equal(r.ctx.gems,12);assert.equal(r.got,null);
  r=run({0:true,1:true,2:true,3:true,4:true},{0:3,1:3,2:3,3:3,4:3});
  assert.equal(r.ctx.gems,25);                                                       // 15 stars + 10 bonus
  assert.deepEqual(Object.keys(r.ctx.owned),["wolf"]);                                // gems, not an item
  r=run({19:true},{});assert.equal(r.got.id,"crown");assert.equal(r.ctx.gems,10);
  r=run({"99h":true},{"99h":3});assert.equal(r.got.id,"marquee");assert.equal(r.ctx.gems,21); // 6 stars + 15 hard bonus
  // A full normal and hard run plus mini-games comes within a month of daily puzzles of buying the whole Store.
  const price=getPrice(),store=OUTFITS.filter(o=>!o.free&&o.trophy==null).reduce((t,o)=>t+price(o),0);
  const all={},st={};for(let i=0;i<100;i++){all[i]=all[i+"h"]=true;st[i]=st[i+"h"]=3;}
  r=run(all,st);
  assert.ok(store-(r.ctx.gems+135)<=5*31,"Store "+store+" vs earned "+(r.ctx.gems+135));
});
test("Buying the game gives a free pet and accessory, and refunds gems already spent on them",()=>{
  const OUTFITS=[{id:"wolf",free:true,slot:"hero"},{id:"chick",slot:"pet",cost:14,gift:true},{id:"bandana",slot:"neck",from:5,gift:true},{id:"party",slot:"head",cost:6}];
  const make=(bought,owned,gemUnlocked)=>({owned,worn:{},gems:0,cleared:{},stars:{0:3,1:3,2:3,3:3,4:3,5:3,6:3,7:3,8:3,9:3,10:3,11:3,12:3},dailyDone:{},hints:0,gemUnlocked,OUTFITS,mockGemCredits:()=>0,bonusEarnedGems:()=>0,ownsFullGame:()=>bought});
  let c=make(false,{},{});economy(c)();
  assert.equal(c.owned.chick,undefined);assert.equal(c.owned.bandana,undefined);assert.equal(c.gems,39);   // 13 levels at three stars
  c=make(true,{},{});economy(c)();
  assert.equal(c.owned.chick,true);assert.equal(c.owned.bandana,true);assert.equal(c.worn.pet,"chick");assert.equal(c.worn.neck,"bandana");
  assert.equal(c.gems,39,"the gifts cost nothing");
  c=make(true,{chick:true,bandana:true,party:true},{bandana:19});economy(c)();
  assert.equal(c.gems,33,"only the party hat is charged; the chick and bandana gems come back");
  assert.equal(c.gemUnlocked.bandana,undefined);
  assert.match(html,/function ownsFullGame\(\)\{ return fullGame \|\| \(testCheckoutAvailable\(\) && simulatedPurchase\); \}/);   // the developer preview switch does not hand out gifts
});
test("The full-game gifts are listed in the Store but cannot be bought with gems",()=>{
  const OUTFITS=vm.runInNewContext(fragment("const OUTFITS = [","/* Pets: small companions")+"\nOUTFITS");
  assert.deepEqual(Array.from(OUTFITS.filter(o=>o.gift),o=>o.id+":"+o.slot).sort(),["bandana:neck","chick:pet"]);
  assert.match(html,/if\(o\.gift\)\{openUnlock\(li,false,true\);return;\}/);      // tapping one shows the full-game offer instead of a gem price
  assert.match(html,/id="unlock-gifts"/);assert.match(html,/Free gifts with the full game/);
  assert.match(code,/free Chick pet and Bandana/);
});
test("A demo save cannot mint gems or trophies from levels past the free five",()=>{
  const OUTFITS=vm.runInNewContext(fragment("const OUTFITS = [","/* Pets: small companions")+"\nOUTFITS");
  const cleared={},stars={};for(let i=0;i<100;i++){cleared[i]=cleared[i+"h"]=true;stars[i]=stars[i+"h"]=3;}
  const make=full=>({owned:{},worn:{},gems:0,cleared,stars,dailyDone:{1:true,2:true},hints:0,gemUnlocked:{},OUTFITS,mockGemCredits:()=>0,bonusEarnedGems:()=>0,ownsFullGame:()=>full,hasFullAccess:()=>full,FREE_LEVEL_COUNT:5});
  let c=make(false);economy(c)();
  assert.equal(c.gems,25,"five free levels at three stars plus the level-5 bonus");
  assert.deepEqual(Object.keys(c.owned),["wolf"]);
  c=make(true);economy(c)();
  assert.equal(c.gems,300+600+200+300+10);assert.equal(OUTFITS.filter(o=>o.trophy!=null&&c.owned[o.id]).length,5);
});
