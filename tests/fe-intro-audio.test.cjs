"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,".."),index=fs.readFileSync(path.join(root,"index.html"),"utf8");
const launcher=fs.readFileSync(path.join(root,"studio-boot-v2.js"),"utf8");
test("FE intro claims audio before game startup, and asks game to silence on launch",()=>{
 assert.match(index,/<script>window\.__feStudioIntroActive = !new URLSearchParams\(location\.search\)\.has\("credits"\);<\/script>/);
 assert.ok(index.indexOf("window.__feStudioIntroActive = !new URLSearchParams")<index.indexOf('studio-boot-v2.js'));
 assert.match(launcher,/window\.__feStudioIntroActive=true;\s*window\.dispatchEvent\(new Event\("failure-studio-intro-opened"\)\)/);
});
test("Cold start and return to foreground never resume underlying game music during FE logo",()=>{
 const source=index.slice(index.indexOf("let tunes = {}, musicOn = true;"),index.indexOf("\nfunction start(data){"));
 assert.ok(source.startsWith("let tunes"));
 const docListeners={},winListeners={};let made=0,played=0,paused=0,bonusStopped=0;
 const fakeAudio=()=>({paused:true,loop:false,currentTime:0,play(){played++;this.paused=false;return Promise.resolve();},pause(){paused++;this.paused=true;}});
 const elements={game:{hidden:false},bonus:{hidden:true},music:{setAttribute(){},addEventListener(){}}};
 const page={
  hidden:false,addEventListener(type,fn){docListeners[type]=fn;},
 };
 const win={__feStudioIntroActive:true,addEventListener(type,fn){winListeners[type]=fn;},
  FTWWorldMusic:{render(){return new DataView(new ArrayBuffer(44))}},
  FTWBonus:{worldScores:[]}};
 const bonusController={stage:null,music:{enabled:false,stop(){bonusStopped++;this.enabled=false;},start(){this.enabled=true;played++;}}};
 const ctx={window:win,document:page,$:id=>elements[id],localStorage:{getItem(){return null;},setItem(){}},
  tunes:{},bonusController,Audio:function(){made++;return fakeAudio();},
  URL:{createObjectURL(){return "blob:test"}},Blob:class Blob{},
  buildTune(){return new DataView(new ArrayBuffer(44))},daily:false,dayNo(){return 1;},li:0,hardOn:false};
 const fns=vm.runInNewContext(source+"\n({musicStart,musicStop,pauseGameAudio})",ctx);
 fns.musicStart();assert.equal(made,0,"the FE intro prevents music initialization on cold start");
 winListeners["failure-studio-intro-opened"]();assert.equal(played,0);
 docListeners.visibilitychange();assert.equal(played,0,"foreground while FE logo is up must stay silent");
 win.__feStudioIntroActive=false;
 docListeners.click();assert.equal(made,1);assert.equal(played,1,"game music starts after intro, on user tap");
 win.__feStudioIntroActive=true;
 winListeners["failure-studio-intro-opened"]();assert.ok(paused>0,"active game music stops when intro opens");
 docListeners.visibilitychange();assert.equal(played,1,"foreground must not restart music beneath intro");
 win.__feStudioIntroActive=false;docListeners.click();assert.equal(played,2);
 winListeners.pagehide();assert.ok(paused>=2,"backgrounding should pause game music");
 elements.game.hidden=true;elements.bonus.hidden=false;bonusController.stage={mode:"match",chapter:0};
 win.__feStudioIntroActive=true;
 docListeners.click();assert.equal(played,2,"bonus soundtrack also blocked during intro");
 win.__feStudioIntroActive=false;docListeners.click();assert.equal(played,3,"bonus soundtrack resumes after intro on a tap");
 winListeners["failure-studio-intro-opened"]();assert.ok(bonusStopped>0,"bonus music also stops at intro");
});
