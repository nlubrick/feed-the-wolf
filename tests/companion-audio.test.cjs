"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const page=fs.readFileSync(path.join(root,"index.html"),"utf8");
const bonus=fs.readFileSync(path.join(root,"bonus-levels-v1.js"),"utf8");
test("Companion is drawn AFTER water/lava overlays and keeps a visible high-contrast sprite",()=>{
  const draw=page.slice(page.indexOf("function draw(now){"),page.indexOf("function drawAmbient(now"));
  assert.ok(draw.includes("drawPet(now);"));
  assert.ok(draw.indexOf("drawPet(now);")>draw.indexOf("ctx.drawImage(mb[0].c"),"pet should not be washed out by lava overlay");
  assert.ok(draw.indexOf("drawPet(now);")>draw.indexOf("ctx.drawImage(mb[1].c"),"pet should not be washed out by water overlay");
  assert.ok(draw.indexOf("drawPet(now);")<draw.indexOf("ctx.restore();\n  // gates sit"),"still clip the pet inside rooms");
  const fn=page.slice(page.indexOf("function drawPet(now){"),page.indexOf("/* Gems are worked out",page.indexOf("function drawPet(now){")));
  assert.match(fn,/sz = 29/);
  assert.match(fn,/ctx\.shadowBlur = 3/);
});
test("Exiting or skipping a mini-game immediately resumes regular level music, respecting Music Off",()=>{
  const flow=page.slice(page.indexOf("function goToCampaignStage(number){"),page.indexOf("const bonusController=window.FTWBonus.mount"));
  assert.match(flow,/if\(bonusController\.stage\)bonusController\.close\(\);/);
  assert.match(flow,/if\(ok\)\{\s*save\(\);\s*[\s\S]*?if\(musicOn\)musicStart\(\)/);
  const calls=[];
  const bonusController={stage:{},close(){calls.push("close");this.stage=null;}};
  const host={window:{FTWBonus:{at:()=>({type:"puzzle",puzzleIndex:10})}},bonusController,
   canPlay:()=>true,show:()=>calls.push("show"),load:()=>{calls.push("load");return true;},
   musicOn:true,musicStart:()=>calls.push("music"),save:()=>calls.push("save"),daily:false};
  const go=vm.runInNewContext(flow+"\ngoToCampaignStage",host);
  assert.equal(go(11),true);
  assert.deepEqual(calls,["close","show","load","save","music"]);
  calls.length=0;host.musicOn=false;bonusController.stage={};
  assert.equal(go(11),true);
  assert.deepEqual(calls,["close","show","load","save"]);
});
test("Mini-game audio reuses one AudioContext across stages rather than closing it",()=>{
  const code=bonus.slice(bonus.indexOf("class Music{"),bonus.indexOf("class Controller{"));
  let made=0,closed=0,timer=0;const intervals=new Map();
  class AC{
    constructor(){made++;this.state="running";this.currentTime=0;}
    resume(){this.state="running";return Promise.resolve();}
    close(){this.state="closed";closed++;return Promise.resolve();}
    createOscillator(){return{frequency:{setValueAtTime(){}},connect(){},start(){},stop(){}};}
    createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}
  }
  const host={root:{AudioContext:AC},worldScores:[{root:60,motif:Array(16).fill(0),bass:[40,42,44,45],color:"triangle"}],
   midiHz:m=>440*Math.pow(2,(m-69)/12),pace:{match:"match",pipes:"pipes",hidden:"hidden"},
   setInterval:f=>{intervals.set(++timer,f);return timer;},clearInterval:id=>intervals.delete(id)};
  const Music=vm.runInNewContext(code+"\nMusic",host),m=new Music();
  m.start("match",0,true);assert.equal(made,1);assert.equal(intervals.size,1);
  m.stop();assert.equal(intervals.size,0);assert.equal(closed,0);
  m.start("pipes",0,true);assert.equal(made,1);assert.equal(m.ctx.state,"running");
  m.ctx.state="interrupted";m.wake();assert.equal(m.ctx.state,"running");
  m.start("hidden",0,false);assert.equal(intervals.size,0);assert.equal(m.enabled,false);
  m.start("match",0,true);assert.equal(made,1);assert.equal(intervals.size,1);
  m.stop();assert.equal(closed,0);assert.equal(intervals.size,0);
});
