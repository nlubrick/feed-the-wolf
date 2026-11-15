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
function solve(level,budget=100000){
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
      assert.equal(level.gadgets.length,1);
      assert.equal(level.gadgets[0].kind,kind);
    }
  }
});
test("All normal and hard puzzles can be won; new toys cannot be skipped",()=>{
  for(let i=0;i<levels.length;i++){
    for(const [mode,level] of [["normal",levels[i]],["hard",levels[i].hard]]){
      const path=solve(level);
      assert.ok(path,"unsolved level "+(i+1)+" "+mode);
      if(i>=40)assert.ok(path.includes(level.pins.length-1),"level "+(i+1)+" "+mode+" skipped its new toy");
    }
  }
});
test("Five-level demo and StoreKit ownership never rely on saved paid flags",()=>{
  assert.match(page,/const FREE_LEVEL_COUNT = 5;/);
  assert.match(page,/if \(!canPlay\(index,daily\)\)/);
  assert.match(page,/result\.verified !== true/);
  assert.doesNotMatch(page,/localStorage\.(?:setItem|getItem)\(["']ftw-(?:premium|full-game|fullGame)/);
});
