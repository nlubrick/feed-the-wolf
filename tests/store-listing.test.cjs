"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,".."),s=require("../scripts/store-listing.cjs"),l=s.load();
test("Every store listing field fits its store's length limit",()=>{
 for(const [name,text,limit] of s.fields(l)){assert.equal(typeof text,"string",name);assert.ok([...text].length>0&&[...text].length<=limit,name+" is "+[...text].length+" of "+limit);}
 assert.ok(!/,\s/.test(l.apple.keywords),"Apple keywords are comma separated with no spaces after commas");
 assert.equal(fs.readFileSync(path.join(root,"store","LISTING.md"),"utf8"),s.markdown(l),"store/LISTING.md is out of date: run node scripts/store-listing.cjs");
});
test("The listing tells the truth about the game and what it costs",()=>{
 const d=s.description(l),page=fs.readFileSync(path.join(root,"index.html"),"utf8");
 const w={};vm.runInNewContext(fs.readFileSync(path.join(root,"store-catalog-v1.js"),"utf8"),{window:w});
 assert.deepEqual(l.apple.inAppPurchases.map(p=>p.id),Array.from(w.FTWCatalog.PRODUCTS,p=>p.id),"listed purchases match the game's products");
 assert.ok(d.includes(w.FTWCatalog.PRODUCTS[0].price),"the unlock price in the listing matches the game");
 for(const claim of ["Free to download","Levels 1 to 5","110 levels","Gem packs are optional","No ads","Failure Entertainment"])assert.ok(d.includes(claim),claim);
 assert.match(page,/const FREE_LEVEL_COUNT = 5;/);
 const OUTFITS=vm.runInNewContext(page.slice(page.indexOf("const OUTFITS = ["),page.indexOf("/* Pets: small companions"))+"\nOUTFITS");
 assert.equal(OUTFITS.filter(o=>o.slot==="hero").length,13);assert.equal(OUTFITS.filter(o=>o.slot==="pet").length,16);
 assert.ok(OUTFITS.filter(o=>o.slot!=="hero"&&o.slot!=="pet").length>20);
 assert.doesNotMatch(page+fs.readFileSync(path.join(root,"privacy.html"),"utf8"),/googletagmanager|google-analytics|fonts\.googleapis|facebook\.net|doubleclick/,"no trackers or third-party font requests, as the listing and policy say");
});
test("Privacy and support pages exist at the URLs the listing gives, and link to each other",()=>{
 for(const [key,file] of [["privacy","privacy.html"],["support","support.html"]]){
  assert.equal(l.urls[key],"https://feed-the-wolf.onrender.com/"+file);
  assert.ok(fs.existsSync(path.join(root,file)),file);
 }
 const privacy=fs.readFileSync(path.join(root,"privacy.html"),"utf8"),support=fs.readFileSync(path.join(root,"support.html"),"utf8");
 assert.match(privacy,/href="\.\/support\.html"/);assert.match(support,/href="\.\/privacy\.html"/);
 for(const word of ["RevenueCat","Apple","Google","no analytics","Render","Children"])assert.ok(privacy.toLowerCase().includes(word.toLowerCase()),word);
 assert.match(support,/id="contact"/);assert.match(support,/Restore purchases/);
 for(const page of [privacy,support])assert.match(page,/mailto:nlubrick@gmail\.com/,"public support email must work on both pages");
 assert.doesNotMatch(support,/A support email address will be listed here/,"remove placeholder before public release");
 const page=fs.readFileSync(path.join(root,"index.html"),"utf8");
 assert.match(page,/feed-the-wolf\.onrender\.com\/privacy\.html/);assert.match(page,/feed-the-wolf\.onrender\.com\/support\.html/);
});
