"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,".."),page=fs.readFileSync(path.join(root,"index.html"),"utf8");
const sources=["bonus-themes-v1.js","bonus-levels-v1.js","bonus-match-v1.js","bonus-pipes-v1.js","bonus-hidden-v1.js","bonus-arcade-v1.js","bonus-arcade-b-v1.js","world-music-v1.js"];
function setup(){
 const window={};
 for(const file of sources)vm.runInNewContext(fs.readFileSync(path.join(root,file),"utf8"),{window});
 return window;
}
test("110 consecutive stages contain all 100 unchanged puzzle IDs and 10 mini-games",()=>{
 const {FTWBonus}=setup(),items=FTWBonus.stages;
 assert.equal(items.length,110);assert.equal(FTWBonus.TOTAL,110);assert.equal(FTWBonus.bonus.length,10);
 assert.deepEqual(Array.from(items,s=>s.number),Array.from({length:110},(_,i)=>i+1));
 const puzzles=items.filter(s=>s.type==="puzzle");
 assert.deepEqual(Array.from(puzzles,s=>s.puzzleIndex),Array.from({length:100},(_,i)=>i));
 assert.equal(FTWBonus.puzzleStage(99).number,110);
 assert.equal(FTWBonus.at(6).mode,"match");
 assert.equal(FTWBonus.at(7).puzzleIndex,5);
});
test("Ten different mini-games, two per location, at fixed stage numbers",()=>{
 const {FTWBonus}=setup();
 const expect=[
 [6,"match",0],[15,"dash",0],
 [28,"pipes",1],[37,"catch",1],
 [50,"chain",2],[59,"gear",2],
 [72,"firefly",3],[81,"run",3],
 [94,"hidden",4],[103,"sneak",4]
 ];
 assert.deepEqual(Array.from(FTWBonus.bonus,s=>[s.number,s.mode,s.chapter]),expect);
 assert.equal(new Set(FTWBonus.bonus.map(s=>s.mode)).size,10,"no mini-game repeats");
 assert.equal(FTWBonus.bonus.reduce((t,s)=>t+s.reward,0),135,"mini-game gems total is unchanged");
 // the three older games each use one of their five tuned tiers in the story, leaving harder ones for Hard Mode
 assert.deepEqual(Array.from(["match","pipes","hidden"],m=>FTWBonus.bonus.find(s=>s.mode===m).tier),[0,1,2]);
});
test("Saves from the 115-stage layout keep their place and their mini-game gems",()=>{
 const {FTWBonus}=setup();
 assert.deepEqual({...FTWBonus.legacy(1,{})},{stage:1,gems:0});
 assert.equal(FTWBonus.legacy(7,{}).stage,7);                      // old stage 7 was puzzle 6; it still is
 assert.equal(FTWBonus.legacy(15,{}).stage,FTWBonus.puzzleStage(12).number);   // old 15 = puzzle 13 (index 12)
 assert.equal(FTWBonus.legacy(115,{}).stage,110);
 assert.equal(FTWBonus.legacy(14,{}).stage,FTWBonus.puzzleStage(12).number);   // was standing on an old mini-game: on to the next puzzle
 assert.equal(FTWBonus.legacy(1,{6:"win",14:"win",22:"skip",114:"win"}).gems,5+5+13);
 assert.match(page,/window\.FTWBonus\.legacy\(/);assert.match(page,/sv:2/);
});
test("The Dinner Machine is solvable, not solved as dealt, and not solved by most settings",()=>{
 const {FTWChainRules:r}=setup();
 assert.equal(r.LEVELS.length,2);
 for(const level of r.LEVELS){
  assert.equal(r.simulate(level,level.start).win,false);
  let wins=0,n=0;const go=a=>{if(a.length===level.planks.length){n++;if(r.simulate(level,a).win)wins++;return;}for(let i=0;i<5;i++)go(a.concat(i));};go([]);
  assert.ok(wins>=3,"solvable in several ways: "+wins);assert.ok(wins/n<.12,"but most tilts fail: "+wins+"/"+n);
 }
 const a=r.simulate(r.LEVELS[0],[3,0,0]);assert.equal(a.win,true);assert.equal(a.rang,true);   // the same tilts always give the same run
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
 assert.match(page,/bs:bonusResults, lg:legacyBonusGems, sv:2, cs:campaignStage/);
 assert.match(page,/bonusResults=obj\(sv\.bs\)/);
 assert.match(page,/stage\.number===6\|\|hasFullAccess\(\)/);
 assert.match(page,/const FREE_LEVEL_COUNT = 5/);
 assert.match(page,/id="dev-level"[^>]+max="110"/);
 assert.match(page,/if \(!canPlay\(index,daily\)\)/);
});
test("The PWA app shell caches each mode, music and its responsive layout",()=>{
 const sw=fs.readFileSync(path.join(root,"service-worker.js"),"utf8");
 for(const f of sources.concat("bonus-style-v1.css","bonus-themes-v1.css"))assert.ok(sw.includes(f),f+" missing from cache");
 assert.match(sw,/ftw-install-v28/);
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

test("Pantry Panic: the Test Flow button in the HUD actually pours",()=>{
 const {FTWPipesRules:r}=setup();
 const box=()=>({innerHTML:"",on:{},addEventListener(t,f){this.on[t]=f;},removeEventListener(t){delete this.on[t];},querySelector(){return null;}});
 let msg="",won=false;
 const api={stage:{chapter:0},play:box(),hud:box(),instructions(){},message(m){msg=m;},win(){won=true;},lose(){},sound(){},tone(){},wolf:null};
 const game=r.mount(api);
 assert.match(api.hud.innerHTML,/data-flow-test/);
 assert.equal(typeof api.hud.on.click,"function","the HUD must listen for the Test Flow tap");
 const tap=(sel,data)=>({target:{closest:q=>q===sel?{dataset:data||{}}:null}});
 api.hud.on.click(tap("[data-flow-test]"));
 assert.notEqual(msg,"");assert.equal(won,false,"the scrambled board must not pass");
 const data=r.create(0);
 data.solution.forEach((want,i)=>{if(want===null)return;let m=game.preview()[i],k=0;while(m!==want&&k++<4){api.play.on.click(tap("[data-pipe]",{pipe:String(i)}));m=game.preview()[i];}});
 api.hud.on.click(tap("[data-flow-test]"));
 assert.equal(won,true,"a solved board must win when poured");
 assert.doesNotMatch(api.play.innerHTML,/BOILER|SOUP POT|WOLF'S BOWL/);
 game.destroy();assert.equal(api.hud.on.click,undefined);
});

test("Location tracks are about a minute, never clip, and loop without a seam",()=>{
 const {FTWBonus,FTWWorldMusic}=setup();
 for(let chapter=1;chapter<5;chapter++)for(const hard of [false,true]){
  const wav=FTWWorldMusic.render(chapter,hard,FTWBonus.worldScores),n=(wav.byteLength-44)/2,secs=n/22050;
  assert.ok(secs>45&&secs<95,"chapter "+chapter+" is "+secs.toFixed(0)+"s");
  let peak=0,jump=0;const v=i=>wav.getInt16(44+((i+n)%n)*2,true);
  for(let i=0;i<n;i++){peak=Math.max(peak,Math.abs(v(i)));}
  assert.ok(peak<32000,"no clipping");
  // the step from the last sample to the first must be no bigger than ordinary steps inside the track
  for(let i=1000;i<n-1000;i+=97)jump=Math.max(jump,Math.abs(v(i)-v(i-1)));
  assert.ok(Math.abs(v(0)-v(-1))<=jump,"chapter "+chapter+" clicks at the loop point");
  // and the join must not be a hole: the half second either side of it is as loud as the track on average
  const rms=(from,len)=>{let q=0;for(let i=0;i<len;i++){const x=v(from+i);q+=x*x;}return Math.sqrt(q/len);};
  assert.ok(rms(-11025,22050)>rms(0,n)*.45,"chapter "+chapter+" goes quiet at the loop point");
 }
});

test("The four new locations are four different pieces of music",()=>{
 const {FTWBonus,FTWWorldMusic}=setup(),sc=FTWBonus.worldScores,lens=new Set(),sig=[];
 for(let c=1;c<5;c++){
  assert.ok(sc[c].motif.every(m=>sc[c].scale.includes(((m%12)+12)%12)),sc[c].name+" tune stays in its own scale");
  const wav=FTWWorldMusic.render(c,false,sc),n=(wav.byteLength-44)/2;lens.add(n);
  // a crude fingerprint: loudness in each of 64 equal slices
  const f=[];for(let k=0;k<64;k++){let q=0;const a=Math.floor(n*k/64),b=Math.floor(n*(k+1)/64);for(let i=a;i<b;i+=7){const v=wav.getInt16(44+i*2,true);q+=v*v;}f.push(Math.sqrt(q/((b-a)/7)));}
  sig.push(f);
 }
 assert.equal(lens.size,4,"four different lengths");
 for(let a=0;a<4;a++)for(let b=a+1;b<4;b++){
  assert.notDeepEqual(Array.from(sc[a+1].motif),Array.from(sc[b+1].motif));
  assert.notEqual(sc[a+1].root+":"+Array.from(sc[a+1].scale),sc[b+1].root+":"+Array.from(sc[b+1].scale),"each has its own key or scale");
  assert.notDeepEqual(Array.from(sc[a+1].bass),Array.from(sc[b+1].bass));
 }
});
test("Mini-games have level arrows, and the match board animates",()=>{
 const src=fs.readFileSync(path.join(root,"bonus-levels-v1.js"),"utf8"),match=fs.readFileSync(path.join(root,"bonus-match-v1.js"),"utf8"),css=fs.readFileSync(path.join(root,"bonus-themes-v1.css"),"utf8");
 assert.match(src,/data-bonus-action="next" aria-label="Next level"/);assert.match(page,/canNext:stage=>/);
 for(const k of ["fw-popping","fw-falling","fw-sliding"]){assert.ok(match.includes(k),k);assert.ok(css.includes("."+k),k+" style");}
});

test("Feast Match: four in a square is a match and earns a Wolf Howl",()=>{
 const {FTWMatchRules:r}=setup();
 const g=Array.from({length:36},(_,i)=>[0,1,2,3,4,5][(i+Math.floor(i/6)*2)%6]);   // no lines, no squares
 assert.equal(r.find(g).matches.size,0);
 g[14]=g[15]=g[20]=g[21]=3;g[13]=0;g[16]=1;g[8]=4;g[9]=5;g[26]=4;g[27]=5;g[19]=2;g[22]=0;
 const f=r.find(g),sq=f.runs.find(q=>q.square);
 assert.ok(sq,"square found");assert.deepEqual(Array.from(sq),[14,15,20,21]);
 assert.ok(f.runs.some(q=>q.length>=4),"counts as a big match, so it makes a Howl");
 for(const i of [14,15,20,21])assert.ok(f.matches.has(i));
 for(let seed=1;seed<=60;seed++){const b=r.makeGrid(seed*37);assert.equal(r.find(b).matches.size,0,"new boards start with no ready-made lines or squares");assert.ok(r.possible(b));}
});

test("Mini-game sound comes back after the app has been in the background",()=>{
 const src=fs.readFileSync(path.join(root,"bonus-levels-v1.js"),"utf8");
 assert.match(src,/wake\(\)\{/);
 assert.match(src,/\["pointerdown","touchend","click"\]\)this\.node\.addEventListener\(type,\(\)=>this\.music\.wake\(\),true\)/,"every tap in a mini-game must be able to restart audio");
 assert.doesNotMatch(page,/actx\.state === "suspended"/,"the main game must also resume from iOS's interrupted state");
});
