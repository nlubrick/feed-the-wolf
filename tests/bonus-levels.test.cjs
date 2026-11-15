"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,".."),page=fs.readFileSync(path.join(root,"index.html"),"utf8");
const sources=["bonus-themes-v1.js","bonus-levels-v1.js","bonus-match-v1.js","bonus-pipes-v1.js","bonus-hidden-v1.js","world-music-v1.js"];
function setup(){
 const window={};
 for(const file of sources)vm.runInNewContext(fs.readFileSync(path.join(root,file),"utf8"),{window});
 return window;
}
test("115 consecutive stages contain all 100 unchanged puzzle IDs and 15 bonuses",()=>{
 const {FTWBonus}=setup(),items=FTWBonus.stages;
 assert.equal(items.length,115);assert.equal(FTWBonus.bonus.length,15);
 assert.deepEqual(Array.from(items,s=>s.number),Array.from({length:115},(_,i)=>i+1));
 const puzzles=items.filter(s=>s.type==="puzzle");
 assert.deepEqual(Array.from(puzzles,s=>s.puzzleIndex),Array.from({length:100},(_,i)=>i));
 assert.equal(FTWBonus.puzzleStage(99).number,115);
 assert.equal(FTWBonus.at(6).mode,"match");
 assert.equal(FTWBonus.at(7).puzzleIndex,5);
});
test("The 15 bonus stage numbers and chapter order are fixed for QA",()=>{
 const {FTWBonus}=setup();
 const expect=[
 [6,"match",0],[14,"pipes",0],[22,"hidden",0],
 [29,"match",1],[37,"pipes",1],[45,"hidden",1],
 [52,"match",2],[60,"pipes",2],[68,"hidden",2],
 [75,"match",3],[83,"pipes",3],[91,"hidden",3],
 [98,"match",4],[106,"pipes",4],[114,"hidden",4]
 ];
 assert.deepEqual(Array.from(FTWBonus.bonus,s=>[s.number,s.mode,s.chapter]),expect);
});
test("All five Feast Match starts have legal moves and no accidental opening matches",()=>{
 const {FTWMatchRules:r}=setup();
 for(let chapter=0;chapter<5;chapter++){
  const grid=r.makeGrid(5541+chapter*743);
  assert.equal(grid.length,36);
  assert.equal(r.find(grid).matches.size,0);
  assert.equal(r.possible(grid),true);
  assert.ok(grid.every(n=>n>=0&&n<6));
 }
});
test("Every Pantry Panic route has a correct solution and rotated opening pieces",()=>{
 const {FTWPipesRules:r}=setup();
 for(let chapter=0;chapter<5;chapter++){
  const data=r.create(chapter),grid=data.initial.slice();
  assert.equal(grid.length,25);
  assert.equal(r.trace(data.initial).win,false);
  assert.ok(data.solution.some((v,i)=>v!==null&&v!==data.initial[i]));
  data.solution.forEach((v,i)=>{if(v!==null)grid[i]=v;});
  assert.equal(r.trace(grid).win,true,"Pipe chapter "+chapter+" must be solvable");
 }
});
test("Dinner Detective asks for more in each location, and every target is drawn and reachable",()=>{
 const {FTWHiddenRules:r}=setup();
 assert.deepEqual(Array.from(r.targets,t=>t.length),[4,5,6,7,8]);
 for(let chapter=0;chapter<5;chapter++){
  const targets=r.targets[chapter];
  assert.equal(new Set(targets).size,targets.length);
  const svg=r.scene(chapter,new Set());
  for(const id of targets)assert.ok(svg.includes('data-object="'+id+'"'));
  assert.equal((svg.match(/data-object="/g)||[]).length,12);
  assert.match(svg,/role="button" tabindex="0"/);
  assert.doesNotMatch(svg,/NaN|undefined/);
  if(chapter)assert.ok(r.SECONDS[chapter]<r.SECONDS[chapter-1]);
 }
});
test("Feast Match goals rise faster than the moves allowed",()=>{
 const {FTWMatchRules:r}=setup();
 assert.equal(r.GOALS.length,5);
 for(let c=1;c<5;c++)assert.ok(r.GOALS[c][0]/r.GOALS[c][1]>r.GOALS[c-1][0]/r.GOALS[c-1][1]);
 assert.ok(r.GOALS[0][0]/r.GOALS[0][1]<3,"the first one must be winnable with plain matches");
});
test("Pantry Panic limits tighten but always leave room to solve",()=>{
 const {FTWPipesRules:r}=setup();
 assert.equal(r.limits(0).turns,0);assert.equal(r.limits(0).pours,0);
 for(let c=1;c<5;c++){const l=r.limits(c);assert.ok(l.turns>=l.min+2,"chapter "+c);assert.ok(l.pours>=3);}
 for(let c=2;c<5;c++)assert.ok(r.limits(c).turns/r.limits(c).min<r.limits(c-1).turns/r.limits(c-1).min);
});
test("Five chapter motifs exist; four new WAV scores are valid PCM files",()=>{
 const {FTWBonus,FTWWorldMusic}=setup();
 assert.equal(FTWBonus.worldScores.length,5);
 for(let chapter=1;chapter<5;chapter++){
  const wav=FTWWorldMusic.render(chapter,false,FTWBonus.worldScores);
  assert.equal(wav.getUint32(24,true),22050);
  assert.equal(wav.getUint16(22,true),1);
  assert.equal(wav.getUint16(34,true),16);
  assert.ok(wav.byteLength>200000);
 }
 assert.match(page,/world===0\?buildTune\(hardOn\)/);
});
test("Browser integrates play, skip, saved bonus status and five-level demo",()=>{
 assert.match(page,/function finishBonusStage\(stage,won\)/);
 assert.match(page,/bonusResults\[stage\.number\]="skip"/);
 assert.match(page,/bonusEarnedGems\(\)/);
 assert.match(page,/bs:bonusResults, cs:campaignStage/);
 assert.match(page,/bonusResults=obj\(sv\.bs\)/);
 assert.match(page,/stage\.number===6\|\|hasFullAccess\(\)/);
 assert.match(page,/const FREE_LEVEL_COUNT = 5/);
 assert.match(page,/id="dev-level"[^>]+max="115"/);
 assert.match(page,/if \(!canPlay\(index,daily\)\)/);
});
test("The PWA app shell caches each mode, music and its responsive layout",()=>{
 const sw=fs.readFileSync(path.join(root,"service-worker.js"),"utf8");
 for(const f of sources.concat("bonus-style-v1.css","bonus-themes-v1.css"))assert.ok(sw.includes(f),f+" missing from cache");
 assert.match(sw,/ftw-install-v13/);
 assert.match(page,/id="bonus-root"/);
});

test("Every location has its own banner, seek-and-find room and pipe ends",()=>{
 const {FTWBonusThemes:t,FTWHiddenRules:h,FTWBonus}=setup();
 assert.equal(t.count,5);
 const banners=new Set(),rooms=new Set();
 for(let c=0;c<5;c++){
  const b=t.banner(c),r=t.room(c);
  assert.doesNotMatch(b+r.art(),/NaN|undefined/);
  banners.add(b);rooms.add(r.art());
  assert.equal(r.spots.length,12);
  assert.equal(new Set(r.spots.map(p=>p.join())).size,12,"objects must not share a spot");
  for(const [x,y] of r.spots)assert.ok(x>=40&&x<=660&&y>=60&&y<=430,"spot inside the room");
  const svg=h.scene(c,new Set());
  for(const [x,y] of r.spots)assert.ok(svg.includes('translate('+x+' '+y+')'));
  assert.ok(t.pipes(c).pot.includes("<svg")&&t.pipes(c).bowl.includes("<svg"));
 }
 assert.equal(banners.size,5);assert.equal(rooms.size,5);
 assert.match(page,/bonus-themes-v1\.css/);assert.match(page,/bonus-themes-v1\.js/);
});
