"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),os=require("node:os"),vm=require("node:vm"),sharp=require("sharp");
const root=path.resolve(__dirname,".."),page=fs.readFileSync(path.join(root,"index.html"),"utf8");
test("native iOS icon is generated from the full resolution wolf SVG after Capacitor generates the project",async()=>{
 const {writeIosIcon}=require("../scripts/ios-app-icon.cjs");
 const version=fs.readFileSync(path.join(root,"scripts/set-app-version.cjs"),"utf8");
 assert.match(version,/if\(platform==="ios"\)await require\("\.\/ios-app-icon\.cjs"\)\.writeIosIcon\(\)/);
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"ftw-icon-test-"));
 try{
  const assets=path.join(tmp,"App","Assets.xcassets","AppIcon.appiconset"),web=path.join(tmp,"www");
  fs.mkdirSync(assets,{recursive:true});fs.mkdirSync(web);
  fs.copyFileSync(path.join(root,"feed-the-wolf-icon.svg"),path.join(web,"feed-the-wolf-icon.svg"));
  let output=await writeIosIcon({project:path.join(tmp,"App"),web});
  assert.equal(output.tester,false);
  let meta=await sharp(output.destination).metadata();
  assert.equal(meta.width,1024);assert.equal(meta.height,1024);assert.equal(meta.hasAlpha,false);
  assert.equal(meta.channels,3);
  const json=JSON.parse(fs.readFileSync(path.join(assets,"Contents.json"),"utf8"));
  assert.equal(json.images[0].filename,path.basename(output.destination));
  assert.equal(json.images[0].size,"1024x1024");
  let svg=fs.readFileSync(path.join(web,"feed-the-wolf-icon.svg"),"utf8");
  fs.writeFileSync(path.join(web,"feed-the-wolf-beta-icon.svg"),svg.replace("</svg>",'<text x="256" y="455">BETA</text></svg>'));
  output=await writeIosIcon({project:path.join(tmp,"App"),web});
  assert.equal(output.tester,true);
  assert.match(output.source,/beta-icon\.svg$/);
  assert.notDeepEqual(await fs.promises.readFile(output.destination),Buffer.alloc(0));
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
test("game SFX context is discarded on iOS background and recreated on the first resumed interaction",async()=>{
 const source=page.slice(page.indexOf("let actx = null, noiseB = null"),page.indexOf("/* ---------- music: an original castle-caper loop"));
 assert.ok(source.includes("sfxDispose"));
 let made=0,closed=0,played=0;const docs={},wins={};
 class AC {
  constructor(){this.state="running";this.sampleRate=8;this.currentTime=0;made++;}
  createBuffer(){return{getChannelData(){return new Float32Array(8)}}}
  createOscillator(){return{type:"",frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},start(){played++},stop(){}};}
  createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}
  createBufferSource(){return{connect(){},start(){played++},stop(){}};}
  createBiquadFilter(){return{frequency:{value:0},connect(){}};}
  close(){closed++;this.state="closed";return Promise.resolve();}
  resume(){this.state="running";return Promise.resolve();}
 }
 const sound={setAttribute(){},addEventListener(){}},window={AudioContext:AC,__feStudioIntroActive:false,addEventListener:(type,fn)=>{wins[type]=fn}};
 const document={hidden:false,addEventListener:(type,fn)=>{docs[type]=fn}};
 const host={window,document,localStorage:{getItem(){return null}},$:()=>sound,Math};
 const {sfx,sfxInit}=vm.runInNewContext(source+"\n({sfx,sfxInit})",host);
 docs.pointerdown();sfx("pin");assert.equal(made,1);assert.ok(played>0);
 document.hidden=true;docs.visibilitychange();assert.equal(closed,1);
 document.hidden=false;docs.pointerdown();sfx("pin");assert.equal(made,2);assert.ok(played>1);
 wins.pagehide();assert.equal(closed,2);
 docs.click();assert.equal(made,3);
 window.__feStudioIntroActive=true;docs.pointerdown();assert.equal(made,3,"FE studio intro must not acquire game audio");
 window.__feStudioIntroActive=false;
 document.hidden=true;docs.visibilitychange();document.hidden=false;docs.touchend();assert.equal(made,4);
});
