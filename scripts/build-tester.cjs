"use strict";
/*
 * Shareable, no-charge browser tester build.
 * Source beta retains the Developer lab; production remains free of all test purchases.
 * This third flavor removes developer UI and executable shortcuts, but retains the
 * explicitly labeled simulated checkout so testers can complete the game without accounts.
 *
 * The exact-source assertions below intentionally fail when Claude changes the beta lab:
 * review the transformed output instead of silently shipping a hidden developer bypass.
 */
const fs = require("node:fs");
const path = require("node:path");
const {build} = require("./build.cjs");
const root = path.resolve(__dirname, "..");
function exactly(s, find, replacement) {
  const i=s.indexOf(find);
  if(i<0 || s.indexOf(find,i+find.length)>=0) throw new Error("Tester build: expected exactly one "+find.slice(0,70));
  return s.slice(0,i)+replacement+s.slice(i+find.length);
}
function cut(s, start, end) {
  const a=s.indexOf(start), b=a<0?-1:s.indexOf(end,a+start.length);
  if(a<0 || b<0 || s.indexOf(start,a+start.length)>=0) throw new Error("Tester build: cannot isolate "+start.slice(0,70));
  return s.slice(0,a)+s.slice(b);
}
function createTester(out) {
  build("beta",out);
  const htmlPath=path.join(out,"index.html");
  let page=fs.readFileSync(htmlPath,"utf8");
  // Keep the test-store purchase UI, but remove every entry point to developer controls.
  page=exactly(page,'<!--BETA-START--><button class="linkish" id="developer-open" type="button" hidden>Developer</button><!--BETA-END-->',"");
  page=exactly(page,'<button class="quiet" id="developer-from-unlock" type="button" hidden>Developer tools</button>',"");
  page=exactly(page,'<!--BETA-START--><button class="quiet" id="store-dev" type="button" hidden>Developer</button><!--BETA-END-->',"");
  page=cut(page,'  <section id="developer" hidden aria-label="Developer testing tools">','  <div id="test-checkout"');
  // Erase developer state, navigation, full preview, jump, and reset implementations.
  page=exactly(page,'let developerMode = false, previewFull = false, developerReturnView = "game";\n',"");
  page=cut(page,'function renderDeveloper(){','function openFakeCheckout(id){');
  page=exactly(page,'$("store-dev").addEventListener("click",openDeveloper);\n',"");
  page=cut(page,'$("dev-view-paywall").addEventListener("click",()=>{','BETA = {');
  page=exactly(page,'syncPrizes();dressWolf();save();renderWardrobe();renderStore();renderDeveloper();updateStoreButtons();',
    'syncPrizes();dressWolf();save();renderWardrobe();renderStore();if(BETA)BETA.refresh();updateStoreButtons();');
  page=exactly(page,'  screens: ["developer"],','  screens: [],');
  page=exactly(page,'  fullAccess: () => (developerMode && previewFull) || (testCheckoutAvailable() && simulatedPurchase),',
    '  fullAccess: () => testCheckoutAvailable() && simulatedPurchase,');
  page=exactly(page,'  previewAll: () => developerMode && previewFull,','  previewAll: () => false,');
  page=exactly(page,'  refresh: renderDeveloper,',
    '  refresh: () => { $("store-test-note").hidden = !testCheckoutAvailable(); },');
  page=cut(page,'    if (developerMode && previewFull && !ownsFullGame()){','    } else if (testing){');
  // The cut above leaves the else branch's closing brace: replace it with a normal if.
  page=exactly(page,'    } else if (testing){','    if (testing){');
  const inline=[...page.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join("\n");
  for(const re of [/\bdeveloperMode\b/,/\bpreviewFull\b/,/\bopenDeveloper\b/,/\brenderDeveloper\b/,/\bresetTesting\b/,/dev-jump/,/dev-full/,/dev-reset/]) {
    if(re.test(inline)) throw new Error("Tester build has developer JavaScript: "+re);
  }
  for(const re of [/id="developer"/,/id="developer-open"/,/id="dev-jump"/,/id="dev-full"/,/id="store-dev"/]) {
    if(re.test(page))throw new Error("Tester build has a developer control: "+re);
  }
  for(const id of ['id="test-checkout"','id="test-checkout-confirm"','id="beta-badge"']){
    if(!page.includes(id))throw new Error("Tester build missing "+id);
  }
  // Safari uses this title for the separately installed iPhone home-screen app.
  page=exactly(page,'<title>Feed the Wolf</title>','<title>Feed the Wolf BETA</title>');
  page=exactly(page,'<meta name="apple-mobile-web-app-title" content="Feed the Wolf">','<meta name="apple-mobile-web-app-title" content="Wolf BETA">');
  page=exactly(page,'<meta name="application-name" content="Feed the Wolf">','<meta name="application-name" content="Wolf BETA">');
  fs.writeFileSync(htmlPath,page);
  // Distinct home-screen app identity and icon, without changing the user's existing install.
  const manifestPath=path.join(out,"manifest.webmanifest");
  const manifest=JSON.parse(fs.readFileSync(manifestPath,"utf8"));
  manifest.name="Feed the Wolf BETA · Failure Entertainment";
  manifest.short_name="Wolf BETA";
  manifest.icons=manifest.icons.map(icon=>({...icon,src:"./feed-the-wolf-beta-icon.svg"}));
  fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+"\n");
  const iconPath=path.join(out,"feed-the-wolf-beta-icon.svg");
  const icon=fs.readFileSync(path.join(out,"feed-the-wolf-icon.svg"),"utf8");
  const overlay='<g><rect x="283" y="414" width="189" height="68" rx="20" fill="#f6d37c" stroke="#1b1530" stroke-width="6"/><text x="377" y="459" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="39" fill="#27143a">BETA</text></g>';
  if(!icon.includes("</svg>"))throw new Error("Missing SVG closing tag");
  fs.writeFileSync(iconPath,exactly(icon,"</svg>",overlay+"\n</svg>"));
  // The service worker caches the transformed manifest and tester icon, not the dev shell.
  const swPath=path.join(out,"service-worker.js");
  let sw=fs.readFileSync(swPath,"utf8");
  sw=sw.replace(/const VERSION="[^"]+";/,'const VERSION="ftw-public-beta-v1";');
  sw=exactly(sw,'"./feed-the-wolf-icon.svg"','"./feed-the-wolf-icon.svg","./feed-the-wolf-beta-icon.svg"');
  fs.writeFileSync(swPath,sw);
  const configPath=path.join(out,"store-config.js");
  const cfg=fs.readFileSync(configPath,"utf8");
  fs.writeFileSync(configPath,exactly(cfg,'"build":"beta"','"build":"tester"'));
  return out;
}
if(require.main===module){
  const arg=process.argv[2],out=arg&&!arg.startsWith("--")?path.resolve(arg):path.join(root,"dist","tester");
  createTester(out);
  if(process.argv.includes("--www")){
    const www=path.join(root,"www");fs.rmSync(www,{recursive:true,force:true});fs.cpSync(out,www,{recursive:true});
  }
  console.log("Tester bundle ready: "+path.relative(root,out)+" (no Developer panel, simulated checkout only)");
}
module.exports={createTester};
