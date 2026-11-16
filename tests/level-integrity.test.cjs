"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const page=fs.readFileSync(path.join(root,"index.html"),"utf8");
const extra=fs.readFileSync(path.join(root,"expansion-levels.js"),"utf8");
const pos=page.indexOf("const LEVELS = ");
assert.ok(pos>0,"main level list found");
const block=page.slice(pos+"const LEVELS = ".length);
const json=block.slice(0,block.indexOf(";\n"));
const originals=JSON.parse(json);
const host={};
vm.runInNewContext(extra,{window:host});
const levels=originals.concat(host.FTW_EXPANSION_LEVELS || []);
const engine=vm.runInNewContext(page.slice(page.indexOf("//LOGIC-START"),page.indexOf("//LOGIC-END"))+"\n({newState,pull})");
function fnv(text){let h=2166136261>>>0;for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619)>>>0;return h.toString(16);}
function solve(level,budget=400000){
  let visited=0;
  function search(state,moves){
    if(state.status==="win")return moves;
    if(state.status==="lose"||++visited>budget)return null;
    for(let i=0;i<level.pins.length;i++){
      if(state.pulled[i])continue;
      const next=JSON.parse(JSON.stringify(state));
      engine.pull(next,level,i);
      const winner=search(next,moves.concat(i));
      if(winner)return winner;
    }
    return null;
  }
  return search(engine.newState(level),[]);
}
test("Claude's original forty are untouched",()=>{
  assert.equal(originals.length,40);
  assert.equal(fnv(json),"d68ed914");
});
test("The expansion contains exactly sixty unique new levels and five chapters",()=>{
  assert.equal(levels.length,100);
  assert.equal(new Set(levels.map(l=>l.name)).size,100);
  assert.ok(levels.every(l=>l.hard));
  for(const [n,kind] of ["gear","bloom","beacon"].entries()){
    for(const level of levels.slice(40+n*20,60+n*20)){
      for(const l of [level,level.hard]){
        assert.ok(l.gadgets.length>=1&&l.gadgets.length<=2);
        assert.ok(l.gadgets.every(g=>g.kind===kind));
        assert.ok(l.pins.length>=5&&l.pins.length<=8,"pins on "+level.name);
      }
    }
  }
});
test("All normal and hard puzzles can be won; new toys cannot be skipped",()=>{
  for(let i=0;i<levels.length;i++){
    for(const [mode,level] of [["normal",levels[i]],["hard",levels[i].hard]]){
      const path=solve(level);
      assert.ok(path,"unsolved level "+(i+1)+" "+mode);
      if(i>=40){
        assert.ok(path.length>=4,"level "+(i+1)+" "+mode+" is over in "+path.length+" pulls");
        const bare=JSON.parse(JSON.stringify(level));bare.gadgets=[];
        assert.equal(solve(bare),null,"level "+(i+1)+" "+mode+" can be won without its devices");
      }
    }
  }
});
test("Five-level demo and StoreKit ownership never rely on saved paid flags",()=>{
  assert.match(page,/const FREE_LEVEL_COUNT = 5;/);
  assert.match(page,/if \(!canPlay\(index,daily\)\)/);
  assert.match(page,/result\.verified !== true/);
  assert.doesNotMatch(page,/localStorage\.(?:setItem|getItem)\(["']ftw-(?:premium|full-game|fullGame)/);
});

test("Levels 41-100 are longer and less forgiving than the first forty",()=>{
  const pulls=l=>solve(l).length,avg=a=>a.reduce((x,y)=>x+y,0)/a.length;
  const early=avg(levels.slice(0,40).map(l=>l.pins.length)),late=avg(levels.slice(40).map(l=>l.pins.length));
  assert.ok(late>=early+1.5,"pins: "+early.toFixed(1)+" then "+late.toFixed(1));
  for(let c=0;c<3;c++){
    const block=levels.slice(40+c*20,60+c*20);
    assert.ok(avg(block.slice(10).map(l=>l.pins.length))>=avg(block.slice(0,10).map(l=>l.pins.length)),"each location gets bigger as it goes");
    assert.ok(block.slice(12).some(l=>l.gadgets.length===2),"later levels use two devices");
  }
  assert.ok(levels.slice(40,60).some(l=>l.gadgets.some(g=>g.after!=null)),"Clockwork has numbered gears");
});
test("Each location's device has its own catch",()=>{
  const st=l=>engine.newState(l),run=(l,order)=>{const s=st(l);for(const i of order)engine.pull(s,l,i);return s;};
  // gears: turning number 2 before number 1 strips it
  const gears={cols:3,rows:3,rooms:[{id:"A",x:0,y:0,has:{boulder:1}},{id:"B",x:1,y:0,has:{boulder:1}},{id:"C",x:0,y:1},{id:"D",x:1,y:1},{id:"K",x:0,y:2,has:{king:1}},{id:"M",x:1,y:2},{id:"T",x:2,y:2,has:{treasure:1}}],
    pins:[{a:"A",b:"C",dir:"v"},{a:"B",b:"D",dir:"v"}],gadgets:[{kind:"gear",c:"C",a:"K",b:"M"},{kind:"gear",c:"D",a:"M",b:"T",after:0}]};
  assert.equal(run(gears,[0,1]).status,"win");
  const wrong=run(gears,[1,0]);assert.equal(wrong.dead[1],true);assert.notEqual(wrong.status,"win");
  // bloom: drinks the water that opens it, and lava first kills it
  const bloom=(first)=>({cols:2,rows:2,rooms:[{id:"W",x:0,y:0,has:{[first]:1}},{id:"B",x:0,y:1},{id:"K",x:1,y:1,has:{king:1}},{id:"X",x:1,y:0}],pins:[{a:"W",b:"B",dir:"v"}],gadgets:[{kind:"bloom",c:"B",a:"B",b:"K"}]});
  const wet=run(bloom("water"),[0]);assert.equal(wet.gates[0],true);assert.equal(wet.pools[0].n,0,"the bloom drank the water");
  const burnt=run(bloom("lava"),[0]);assert.equal(burnt.gates[0],false);assert.equal(burnt.dead[0],true);
  // beacon: lit by lava it clears the ghost off its floor; water first puts it out
  const beacon=(first)=>({cols:2,rows:2,rooms:[{id:"L",x:0,y:0,has:{[first]:1}},{id:"B",x:0,y:1,has:{ghost:1}},{id:"K",x:1,y:1},{id:"X",x:1,y:0}],pins:[{a:"L",b:"B",dir:"v"}],gadgets:[{kind:"beacon",c:"B",a:"B",b:"K"}]});
  const lit=run(beacon("lava"),[0]);assert.equal(lit.gates[0],true);assert.equal(lit.ents.find(e=>e.k==="ghost").gone,true);
  const doused=run(beacon("water"),[0]);assert.equal(doused.dead[0],true);
});
