"use strict";
/* The beta and production builds come from one codebase. These tests build both and check each behaves as it must. */
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),os=require("node:os"),vm=require("node:vm");
const root=path.resolve(__dirname,".."),{build,stripBeta,BETA_ONLY_FILES}=require("../scripts/build.cjs"),{check}=require("../scripts/check-release.cjs");
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"ftw-builds-"));
const beta=build("beta",path.join(tmp,"beta")),prod=build("production",path.join(tmp,"production"));
const read=(b,f)=>fs.readFileSync(path.join(b.out,f),"utf8");
const scripts=html=>[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
test.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));

test("Beta build keeps the developer tools and says it is a test build",()=>{
 const page=read(beta,"index.html");
 for(const id of ["developer","dev-full","dev-level","dev-jump","dev-reset-purchase","dev-reset-progress","dev-reset-all","test-checkout","beta-badge"])assert.ok(page.includes('id="'+id+'"'),id);
 assert.match(page,/BETA TEST BUILD/);assert.match(page,/function resetTesting\(kind\)/);assert.match(page,/BETA = \{/);
 assert.ok(beta.files.includes("test-store-v2.js"));
 assert.match(read(beta,"store-config.js"),/"build":"beta"/);
 assert.equal(read(beta,"index.html"),fs.readFileSync(path.join(root,"index.html"),"utf8"),"the beta build is the repository page, unchanged (so the Render site is the beta)");
});
test("Production build has no developer tools, purchase bypass, practice checkout or test storage",()=>{
 const r=check(prod.out);
 assert.deepEqual(r.errors,[]);
 assert.ok(!prod.files.includes("test-store-v2.js"));assert.ok(!fs.existsSync(path.join(prod.out,"test-store-v2.js")));
 const page=read(prod,"index.html");
 assert.match(page,/const BETA = null;/);
 assert.doesNotMatch(read(prod,"service-worker.js"),/test-store/);
 assert.match(read(prod,"store-config.js"),/"build":"production"/);
});
test("The release gate fails by itself if a shortcut or simulated purchase is left in",()=>{
 const cases={
  "a developer switch":s=>s.replace("const BETA = null;","const BETA = null;\nlet developerMode=true;"),
  "a preview bypass":s=>s.replace("function hasFullAccess(){ return fullGame || !!(BETA && BETA.fullAccess()); }","function hasFullAccess(){ return true; }"),
  "a simulated purchase":s=>s+"<script>localStorage.getItem('ftw-beta-simulated-unlock-v1')</script>",
  "the practice store":s=>s.replace("</head>",'<script src="./test-store-v2.js"></script></head>'),
  "a pluggable beta block":s=>s.replace("const BETA = null;","let BETA = null;"),
  "an unverified unlock":s=>s.split("result.verified !== true").join("false"),
  "the developer panel":s=>s.replace("</body>",'<section id="developer"></section></body>')
 };
 for(const [name,spoil] of Object.entries(cases)){
  const dir=path.join(tmp,"spoiled");fs.rmSync(dir,{recursive:true,force:true});fs.cpSync(prod.out,dir,{recursive:true});
  const before=fs.readFileSync(path.join(dir,"index.html"),"utf8"),after=spoil(before);
  assert.notEqual(after,before,name+": the test must actually change the page");
  fs.writeFileSync(path.join(dir,"index.html"),after);
  assert.ok(check(dir).errors.length>0,"release check must fail for "+name);
 }
 const dir=path.join(tmp,"withstore");fs.rmSync(dir,{recursive:true,force:true});fs.cpSync(prod.out,dir,{recursive:true});
 fs.copyFileSync(path.join(root,"test-store-v2.js"),path.join(dir,"test-store-v2.js"));
 assert.ok(check(dir).errors.length>0,"a stray practice-store file must fail the check");
});
test("Game content is identical in both builds",()=>{
 for(const f of prod.files){
  if(f==="index.html"||f==="service-worker.js"||f==="store-config.js")continue;
  assert.ok(fs.readFileSync(path.join(beta.out,f)).equals(fs.readFileSync(path.join(prod.out,f))),f+" differs between builds");
 }
 assert.deepEqual(beta.files.filter(f=>!BETA_ONLY_FILES.includes(f)),prod.files);
 // The page itself differs only by the removed beta blocks.
 assert.equal(stripBeta(read(beta,"index.html"),"index.html"),read(prod,"index.html"));
 for(const needle of ["const LEVELS","function syncPrizes(){","const OUTFITS = [","function gemPrice(o){","const FREE_LEVEL_COUNT = 5;","Free gifts with the full game"])
  assert.ok(read(prod,"index.html").includes(needle),needle);
});
test("Both pages are valid script and every element the production code looks up exists",()=>{
 for(const b of [beta,prod]){
  const page=read(b,"index.html");
  for(const code of scripts(page))new vm.Script(code,{filename:b.target+"-inline.js"});
  const ids=new Set([...page.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
  for(const m of page.matchAll(/\$\("([a-z0-9-]+)"\)/g))assert.ok(ids.has(m[1]),b.target+": code looks up #"+m[1]+" but the page has no such element");
 }
});
test("Unlock rules: the production page grants paid access only from a verified purchase",()=>{
 const page=read(prod,"index.html");
 const frag=(a,b)=>{const i=page.indexOf(a),j=page.indexOf(b,i+a.length);assert.ok(i>=0&&j>i,a);return page.slice(i,j);};
 const ctx={fullGame:false,FREE_LEVEL_COUNT:5};
 vm.runInNewContext("const BETA = null;\n"+frag("function ownsFullGame(){","function betaRefresh(){")+frag("function canPlay(index,isDaily){","function updateStoreButtons(){")+
  "\nout={locked:canPlay(5,false),free:canPlay(4,false),daily:canPlay(0,true),owns:ownsFullGame(),full:hasFullAccess()};",Object.assign(ctx,{out:null}));
 assert.deepEqual({...ctx.out},{locked:false,free:true,daily:false,owns:false,full:false});
 assert.match(page,/if \(!result \|\| result\.productId !== FULL_UNLOCK_PRODUCT_ID \|\| result\.verified !== true \|\| result\.entitled !== true\) return false;/);
 // Beta: the same rules, plus the preview and practice purchase, which exist only there.
 assert.match(read(beta,"index.html"),/fullAccess: \(\) => \(developerMode && previewFull\) \|\| \(testCheckoutAvailable\(\) && simulatedPurchase\)/);
});
test("Store keys: none are set, so neither build can sell anything yet",()=>{
 for(const b of [beta,prod])assert.deepEqual(b.config.revenueCat,{ios:"",android:""});
 assert.equal(check(prod.out).keys,false);
 const cfg=JSON.parse(fs.readFileSync(path.join(root,"build.config.json"),"utf8"));
 for(const t of ["beta","production"])assert.deepEqual(cfg[t].revenueCat,{ios:"",android:""});
});
test("Store bridge: only the store's own records unlock the game or add gems",async()=>{
 const window={};
 vm.runInNewContext(fs.readFileSync(path.join(root,"store-catalog-v1.js"),"utf8")+fs.readFileSync(path.join(root,"store-bridge-v1.js"),"utf8"),{window});
 assert.equal(window.FeedTheWolfStore,undefined,"no bridge in a browser");
 const FULL=window.FTWCatalog.FULL_ID,calls=[];
 let info={entitlements:{active:{}},nonSubscriptionTransactions:[]};
 const plugin={
  configure:async o=>{calls.push(["configure",o.apiKey]);},
  getProducts:async o=>{calls.push(["getProducts",o.type]);return{products:o.productIdentifiers.map(id=>({identifier:id,priceString:id===FULL?"£2.99":"£0.99"}))};},
  getCustomerInfo:async()=>({customerInfo:info}),
  purchaseStoreProduct:async({product})=>{
   if(product.identifier==="ftw_gems_150"){const e=new Error("cancelled");e.userCancelled=true;throw e;}
   if(product.identifier===FULL)info={...info,entitlements:{active:{full_game:{isActive:true}}}};
   else info={...info,nonSubscriptionTransactions:info.nonSubscriptionTransactions.concat({productIdentifier:product.identifier,transactionIdentifier:"t"+info.nonSubscriptionTransactions.length})};
   return{customerInfo:info,productIdentifier:product.identifier};
  },
  restorePurchases:async()=>({customerInfo:info})
 };
 const store=window.FTWStoreBridge.create(plugin,"appl_examplekey",window.FTWCatalog);
 let r=await store.status(FULL);
 assert.equal(r.verified,true);assert.equal(r.entitled,false);assert.equal(r.displayPrice,"£2.99");
 r=await store.purchase("ftw_gems_150");assert.equal(r.verified,false);assert.equal(r.cancelled,true);
 r=await store.purchase("ftw_gems_50");r=await store.purchase("ftw_gems_50");
 assert.deepEqual({...r.gemPacks},{ftw_gems_50:2});assert.equal(r.entitled,false);
 r=await store.purchase(FULL);assert.equal(r.entitled,true);assert.equal(r.productId,FULL);
 r=await store.restore(FULL);assert.equal(r.entitled,true);assert.deepEqual({...r.gemPacks},{ftw_gems_50:2});
 // duplicate transactions and unknown products are not counted twice or at all
 info={entitlements:{active:{}},nonSubscriptionTransactions:[{productIdentifier:"ftw_gems_400",transactionIdentifier:"a"},{productIdentifier:"ftw_gems_400",transactionIdentifier:"a"},{productIdentifier:"something_else",transactionIdentifier:"b"}]};
 r=await store.status(FULL);assert.deepEqual({...r.gemPacks},{ftw_gems_400:1});assert.equal(r.entitled,false,"a refunded or missing entitlement closes the game again");
 await assert.rejects(()=>store.purchase("not_a_product"));
 assert.equal(calls.filter(c=>c[0]==="configure").length,1,"the store is configured once");
 // The catalog and the practice store must list the same products.
 const t={};vm.runInNewContext(fs.readFileSync(path.join(root,"test-store-v2.js"),"utf8"),{window:t});
 assert.deepEqual(JSON.parse(JSON.stringify(t.FTWTestStore.PRODUCTS)),JSON.parse(JSON.stringify(window.FTWCatalog.PRODUCTS)));
});
test("Progress survives an app update: same storage key, same app address, and a native backup copy",async()=>{
 const cap=JSON.parse(fs.readFileSync(path.join(root,"capacitor.config.json"),"utf8"));
 assert.equal(cap.appId,"com.failureentertainment.feedthewolf");assert.equal(cap.webDir,"www");
 assert.deepEqual(cap.server,{androidScheme:"https",iosScheme:"capacitor",hostname:"localhost"},"changing the app's address would orphan every saved game");
 for(const b of [beta,prod]){const page=read(b,"index.html");assert.match(page,/localStorage\.setItem\("ftw-save", text\)/);assert.match(page,/localStorage\.getItem\("ftw-save"\)/);assert.match(page,/FTWNativeSave\.put\(text\)/);}
 const window={};vm.runInNewContext(fs.readFileSync(path.join(root,"store-bridge-v1.js"),"utf8"),{window});
 const native=new Map(),web=new Map();
 const prefs={set:async({key,value})=>{native.set(key,value);},get:async({key})=>({value:native.has(key)?native.get(key):null})};
 const storage={getItem:k=>web.has(k)?web.get(k):null,setItem:(k,v)=>web.set(k,String(v))};
 let reloads=0;const b=window.FTWStoreBridge.backup(prefs,storage,()=>reloads++);
 assert.equal(await b.restore(),false,"nothing to restore on a fresh install");
 b.put(JSON.stringify({li:42,sv:2}));await Promise.resolve();
 web.clear();                                   // the web view lost its copy
 assert.equal(await b.restore(),true);assert.equal(JSON.parse(web.get("ftw-save")).li,42);assert.equal(reloads,1);
 web.set("ftw-save",JSON.stringify({li:50}));assert.equal(await b.restore(),false,"never overwrites a save that is there");
 native.set("ftw-save","not json");web.clear();assert.equal(await b.restore(),false,"a damaged backup is ignored");
});
test("External-tester build: production code, no practice checkout, sandbox keys required",()=>{
 const ext=build("external",path.join(tmp,"external"));
 assert.deepEqual(check(ext.out,"external").errors,[]);
 assert.equal(read(ext,"index.html"),read(prod,"index.html"),"outside testers get exactly the production page");
 assert.ok(!fs.existsSync(path.join(ext.out,"test-store-v2.js")));
 assert.match(read(ext,"store-config.js"),/"build":"external"/);
 assert.equal(check(ext.out,"external").keys,false,"no keys yet, so the strict check that guards this build still fails");
});
test("Every app build gets a unique, increasing build number that both stores accept",()=>{
 const v=require("../scripts/set-app-version.cjs");
 const t0=Date.UTC(2026,10,16,21,0,0),a=v.buildNumber(t0,{}),b=v.buildNumber(t0+60000,{}),later=v.buildNumber(Date.UTC(2099,0,1),{});
 assert.ok(b>a);assert.ok(later<v.ANDROID_MAX,"still valid for Android at the end of the century");
 assert.equal(v.buildNumber(t0,{FTW_BUILD_NUMBER:"42"}),42);
 for(const bad of ["0","-3","1.5","abc","99999999999"])assert.throws(()=>v.buildNumber(t0,{FTW_BUILD_NUMBER:bad}));
 // the shapes Capacitor 8 generates
 const pbx="\t\t\t\tCURRENT_PROJECT_VERSION = 1;\n\t\t\t\tMARKETING_VERSION = 1.0;\n\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = com.failureentertainment.feedthewolf;\n\t\t\t\tCURRENT_PROJECT_VERSION = 1;\n\t\t\t\tMARKETING_VERSION = 1.0;\n";
 const out=v.stampIos(pbx,a,"0.2.0");
 assert.equal((out.match(new RegExp("CURRENT_PROJECT_VERSION = "+a+";","g"))||[]).length,2);assert.equal((out.match(/MARKETING_VERSION = 0\.2\.0;/g)||[]).length,2);
 assert.match(out,/PRODUCT_BUNDLE_IDENTIFIER = com\.failureentertainment\.feedthewolf;/);
 const gradle='        applicationId "com.failureentertainment.feedthewolf"\n        versionCode 1\n        versionName "1.0"\n';
 const g=v.stampAndroid(gradle,a,"0.2.0");
 assert.match(g,new RegExp("versionCode "+a+"\\n"));assert.match(g,/versionName "0\.2\.0"/);assert.match(g,/applicationId "com\.failureentertainment\.feedthewolf"/);
 assert.throws(()=>v.stampIos("nothing here",a,"0.2.0"));assert.throws(()=>v.stampAndroid("nothing here",a,"0.2.0"));
 assert.match(v.versionName(),/^\d+\.\d+\.\d+$/);
 assert.equal(v.versionName({FTW_RELEASE_VERSION:"1.0.0"}),"1.0.0");
 assert.throws(()=>v.versionName({FTW_RELEASE_VERSION:"release"}));
});
test("Codemagic: every workflow stamps the build number before compiling; only internal TestFlight uploads",()=>{
 const y=fs.readFileSync(path.join(root,"codemagic.yaml"),"utf8");
 const flows=y.split(/\n  (?=[a-z0-9-]+:\n    name:)/).slice(1);
 assert.deepEqual(flows.map(f=>f.split(":")[0]),["android-beta-debug","ios-beta-simulator","ios-beta-signed","ios-external-beta","ios-appstore-review"]);
 for(const f of flows){
  const name=f.split(":")[0],plat=name.startsWith("android")?"android":"ios";
  const stamp=f.indexOf("node scripts/set-app-version.cjs "+plat),sync=f.indexOf("npx cap sync "+plat),compile=f.search(/gradlew assemble|xcodebuild |xcode-project build-ipa/);
  assert.ok(sync>0&&stamp>sync&&compile>stamp,name+": stamp must come after the project is generated and before it is compiled");
  // Internal TestFlight and review candidates upload to ASC but never submit.
  if(name==="ios-beta-signed"||name==="ios-appstore-review"){
   assert.match(f,/\n    publishing:\n      app_store_connect:\n        auth: integration\n        submit_to_testflight: false\n        submit_to_app_store: false\n/);
  }else assert.doesNotMatch(f,/\n    publishing:/,name+" must not publish");
  assert.doesNotMatch(f,/submit_to_app_store: true|submit_to_testflight: true|google_play:|beta_groups:/,name+" must not release to anyone automatically");
  assert.match(f,/npm test/);
 }
 // the signing set-up of the working signed workflow is untouched
 const signed=flows[2];
 assert.match(signed,/app_store_connect: Feed the Wolf Codemagic/);assert.match(signed,/distribution_type: app_store/);
 assert.match(signed,/bundle_identifier: com\.failureentertainment\.feedthewolf/);assert.match(signed,/node scripts\/build-tester\.cjs --www/);
 const ext=flows[3];
 assert.match(ext,/node scripts\/build\.cjs external --www/);assert.match(ext,/check-release\.cjs --target external --strict/);
 assert.doesNotMatch(ext,/build-tester/,"outside testers never get the practice checkout");
 const review=flows[4];
 assert.match(review,/node scripts\/build\.cjs production --www/);
 assert.match(review,/check-release\.cjs --target production --strict --platform ios/);
 assert.match(review,/revenuecat_production/);
 assert.match(review,/FTW_RELEASE_VERSION=1\.0\.0 node scripts\/set-app-version\.cjs ios/);
 assert.doesNotMatch(review,/build-tester|--target external/);
 assert.match(review,/bundle_identifier: com\.failureentertainment\.feedthewolf/);
});

test("Review release gate accepts only real platform-specific Apple RevenueCat keys",()=>{
 const {iosKeyStatus}=require("../scripts/check-release.cjs");
 const dir=path.join(tmp,"key-review");
 fs.mkdirSync(dir,{recursive:true});
 const evalKey=key=>{
  fs.writeFileSync(path.join(dir,"store-config.js"),'window.FTW_STORE_CONFIG='+JSON.stringify({build:"production",revenueCat:{ios:key,android:""}})+';\n');
  return iosKeyStatus(dir);
 };
 for(const key of ["","test_demoStoreKey123","not-used-in-this-ios-build","appl_example","goog_abcdef123456","appl_"]){
  assert.equal(evalKey(key).ok,false,key);
 }
 assert.equal(evalKey("appl_1234567890123456").ok,true);
 assert.equal(evalKey("appl_1234567890123456").reason,undefined);
});
