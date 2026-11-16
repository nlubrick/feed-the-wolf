/* Release gate. Builds the production bundle and fails if any developer shortcut, purchase bypass,
   practice checkout or test-only storage is still in it, or if a purchase safeguard has gone missing.
   Usage: npm run release:check   (add --strict to also require store keys, for the day real sales are switched on) */
"use strict";
const fs=require("node:fs"),path=require("node:path"),os=require("node:os");
const {build,BETA_ONLY_FILES}=require("./build.cjs");
const FORBIDDEN=[
 [/developerMode|previewFull|setPreviewFull|openDeveloper|renderDeveloper|leaveDeveloper|resetTesting/,"developer panel code"],
 [/id="developer|id="dev-|id="store-dev"|dev-level|dev-full|dev-jump|dev-reset/,"developer panel markup"],
 [/simulatedPurchase|FTW_TEST_PURCHASE_KEY|ftw-beta-simulated-unlock|FTW_TEST_BUILD|testCheckoutAvailable/,"simulated full-game purchase"],
 [/FTWTestStore|FTW_FAKE_SHOP|fakeStoreReceipts|FakeCheckout|fakeShopHasProduct|resetFakeStore|ftw-test-receipts|test-store-v2/,"practice store and its test-only storage"],
 [/test-checkout|store-test-note|TEST PURCHASE|TEST MODE|TEST STORE|TEST BUILD|Test purchase/,"practice checkout wording or markup"],
 [/[?&]dev=|DEV_PREVIEW|FTW_QA_PREVIEW|qa-toggle|dev-preview/,"old preview switches"],
 [/[Ss]imulated (purchase|checkout|App Store)/,"simulated purchase wording"],
 [/beta-badge|BETA TEST BUILD|BETA-START|BETA-END/,"beta markers or badge"],
 [/\blet BETA\b|\bBETA\s*=\s*\{/,"a beta tool block that could be plugged in"]
];
function check(dir){
 const errors=[],files=fs.readdirSync(dir,{recursive:true}).map(String).filter(f=>fs.statSync(path.join(dir,f)).isFile());
 for(const f of files){
  if(BETA_ONLY_FILES.includes(path.basename(f))){errors.push(f+" must not be in the production build");continue;}
  if(!/\.(html|js|css|webmanifest|json)$/.test(f))continue;
  const text=fs.readFileSync(path.join(dir,f),"utf8");
  for(const [re,what] of FORBIDDEN){const m=text.match(re);if(m)errors.push(f+": "+what+' ("'+m[0]+'")');}
 }
 const page=fs.readFileSync(path.join(dir,"index.html"),"utf8");
 const need=(ok,msg)=>{if(!ok)errors.push(msg);};
 need(page.includes("const BETA = null;"),"index.html: the beta hook must be a constant null in production");
 need(/function hasFullAccess\(\)\{ return fullGame \|\| !!\(BETA && BETA\.fullAccess\(\)\); \}/.test(page),"index.html: full access must depend only on the verified purchase");
 need(page.includes("result.verified !== true"),"index.html: the verified-entitlement check is missing");
 need(page.includes("result.verified!==true"),"index.html: the verified gem-pack check is missing");
 need(page.includes("const FREE_LEVEL_COUNT = 5"),"index.html: the five-free-levels gate is missing");
 need(fs.existsSync(path.join(dir,"store-bridge-v1.js"))&&fs.existsSync(path.join(dir,"store-catalog-v1.js")),"the store bridge or catalog is missing");
 need(fs.existsSync(path.join(dir,"expansion-levels.js")),"levels 41 to 100 are missing");
 const cfg=fs.readFileSync(path.join(dir,"store-config.js"),"utf8");
 need(/"build":"production"/.test(cfg),"store-config.js is not marked as the production build");
 const keys=/"ios":"[^"]{9,}"/.test(cfg)&&/"android":"[^"]{9,}"/.test(cfg);
 return{errors,keys,files:files.length};
}
module.exports={check,FORBIDDEN};
if(require.main===module){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),"ftw-release-"));
 try{
  build("production",dir);const r=check(dir),strict=process.argv.includes("--strict");
  if(strict&&!r.keys)r.errors.push("store keys are not set, so nothing could be sold (set them in build.config.json or the environment)");
  if(r.errors.length){console.error("Release blocked:\n - "+r.errors.join("\n - "));process.exitCode=1;}
  else console.log("Production build is clean: "+r.files+" files, no developer tools, practice checkout or test storage."+
   (r.keys?"":"\nStore keys are not set yet, so this build cannot sell anything. That is intended until real purchases are approved."));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
}
