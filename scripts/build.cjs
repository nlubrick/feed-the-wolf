/* Builds Feed the Wolf from the one shared codebase.

     node scripts/build.cjs beta         -> dist/beta         (developer tools and practice checkout included)
     node scripts/build.cjs production   -> dist/production   (everything between BETA-START and BETA-END removed)
     node scripts/build.cjs external     -> dist/external     (the production code, with the beta store keys: for outside
                                                              testers, who buy through the store's own sandbox)
     add --www to also copy the result into www/, the folder the iPhone and Android app shells load.

   The website on Render is the repository itself, which is the beta. This script never changes source files. */
"use strict";
const fs=require("fs"),path=require("path");
const root=path.resolve(__dirname,"..");
const BETA_ONLY_FILES=["test-store-v2.js"];
const TEXT=/\.(html|js|css|webmanifest|json|svg)$/;

function stripBeta(text,file){
 let out=text.replace(/<!--BETA-START-->[\s\S]*?<!--BETA-END-->/g,"").replace(/\/\*BETA-START\*\/[\s\S]*?\/\*BETA-END\*\//g,"");
 if(/BETA-START|BETA-END/.test(out))throw new Error(file+": a BETA-START or BETA-END marker has no partner");
 for(const f of BETA_ONLY_FILES)out=out.split('"./'+f+'",').join("");
 // With no beta block there is nothing to plug in; make that impossible to change at run time.
 return out.replace("let BETA = null;","const BETA = null;");
}
function shellFiles(){
 const sw=fs.readFileSync(path.join(root,"service-worker.js"),"utf8"),m=sw.match(/const CORE=(\[[^\]]+\])/);
 if(!m)throw new Error("Could not read the CORE list from service-worker.js");
 const files=new Set(JSON.parse(m[1]).map(f=>f.replace(/^\.\//,"")).filter(Boolean));
 files.add("index.html");files.add("service-worker.js");return[...files];
}
function storeConfig(target){
 // Outside testers use the same sandbox keys as the beta, with none of the beta's tools.
 let cfg={};try{const all=JSON.parse(fs.readFileSync(path.join(root,"build.config.json"),"utf8"));cfg=all[target]||(target==="external"?all.beta:null)||{};}catch(e){}
 const rc=Object.assign({ios:"",android:""},cfg.revenueCat||{});
 if(process.env.FTW_RC_IOS_KEY)rc.ios=process.env.FTW_RC_IOS_KEY;
 if(process.env.FTW_RC_ANDROID_KEY)rc.android=process.env.FTW_RC_ANDROID_KEY;
 return{build:target,revenueCat:{ios:String(rc.ios||""),android:String(rc.android||"")}};
}
function build(target,outDir){
 if(!["beta","production","external"].includes(target))throw new Error('Build target must be "beta", "production" or "external"');
 const out=outDir||path.join(root,"dist",target),prod=target!=="beta";
 fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
 const written=[];
 for(const f of shellFiles()){
  if(prod&&BETA_ONLY_FILES.includes(f))continue;
  const from=path.join(root,f);
  if(!fs.existsSync(from))throw new Error("Listed in the app shell but missing: "+f);
  const to=path.join(out,f);fs.mkdirSync(path.dirname(to),{recursive:true});
  if(f==="store-config.js")fs.writeFileSync(to,"/* Written by scripts/build.cjs for the "+target+" build. */\nwindow.FTW_STORE_CONFIG="+JSON.stringify(storeConfig(target))+";\n");
  else if(prod&&TEXT.test(f))fs.writeFileSync(to,stripBeta(fs.readFileSync(from,"utf8"),f));
  else fs.copyFileSync(from,to);
  written.push(f);
 }
 // Anything the page loads must be in the bundle, or the app would open to a blank screen with no network.
 const html=fs.readFileSync(path.join(out,"index.html"),"utf8");
 for(const ref of html.matchAll(/(?:src|href)="\.\/([^"?#]+)/g))if(!fs.existsSync(path.join(out,ref[1])))throw new Error(target+": index.html needs "+ref[1]+" but it is not in the build");
 return{target,out,files:written,config:storeConfig(target)};
}
module.exports={build,stripBeta,shellFiles,storeConfig,BETA_ONLY_FILES};
if(require.main===module){
 const target=process.argv[2],r=build(target);
 if(process.argv.includes("--www")){const www=path.join(root,"www");fs.rmSync(www,{recursive:true,force:true});fs.cpSync(r.out,www,{recursive:true});}
 const keys=["ios","android"].filter(k=>r.config.revenueCat[k]);
 console.log(target+" build: "+r.files.length+" files in "+path.relative(root,r.out)+(process.argv.includes("--www")?" (copied to www/)":"")+
  " · store keys: "+(keys.length?keys.join(", "):"none, so nothing can be bought"));
}
