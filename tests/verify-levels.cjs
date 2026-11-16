// Run with: node tests/verify-levels.cjs
// Regression check for the 40 original puzzles and every new normal/hard variant.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root,"index.html"),"utf8");
const expansion = fs.readFileSync(path.join(root,"expansion-levels.js"),"utf8");
const between = (text,start,end) => {
  const a=text.indexOf(start);
  assert(a>=0,"Missing "+start);
  const b=text.indexOf(end,a+start.length);
  assert(b>=0,"Missing "+end);
  return text.slice(a+start.length,b);
};
const original = JSON.parse(between(source,"const LEVELS = ",";\n"));
const levels = JSON.parse(expansion.slice(expansion.indexOf("window.FTW_EXPANSION_LEVELS = ") + 30).trim().replace(/;\s*$/,""));
assert.equal(original.length,40);
assert.equal(levels.length,60);
const all = original.concat(levels);
assert.equal(all.length,100);
assert.equal(new Set(all.map(x=>x.name)).size,100,"Level names must be unique");
let hash=0x811c9dc5;
for(const ch of JSON.stringify(original)){hash^=ch.charCodeAt(0);hash=Math.imul(hash,0x01000193);}
assert.equal((hash>>>0).toString(16),"9432cc98","The original forty puzzles have changed");

const rules = between(source,"//LOGIC-START","//LOGIC-END");
const {newState,pull} = new Function(rules+"\nreturn {newState,pull};")();
new Function(between(source,"<script>\n","</script>")); // browser script syntax
const copy = x=>JSON.parse(JSON.stringify(x));
function solve(level,skip=-1){
  let calls=0;
  function dfs(state,path){
    if(state.status==="win") return path;
    if(state.status==="lose" || ++calls>400000) return null;
    for(let i=0;i<level.pins.length;i++){
      if(i===skip || state.pulled[i]) continue;
      const next=copy(state);
      pull(next,level,i);
      const win=dfs(next,path.concat(i));
      if(win) return win;
    }
    return null;
  }
  const path=dfs(newState(level),[]);
  assert(calls<=400000,"Search budget exceeded on "+level.name);
  return path;
}
let validated=0;
for(const [index,normal] of all.entries()){
  for(const [difficulty,level] of [["normal",normal],["hard",normal.hard]]){
    assert(level,"Missing "+difficulty+" mode for "+normal.name);
    const winning=solve(level);
    assert(winning,"Unsolvable level "+(index+1)+" "+difficulty);
    if(index>=40){
      const expected=["gear","bloom","beacon"][Math.floor((index-40)/20)];
      assert(level.gadgets.length>=1,"New levels need their location's device");
      assert(level.gadgets.every(g=>g.kind===expected),"Wrong device on "+normal.name);
      assert(level.pins.length>=5&&level.pins.length<=8,"Pin count out of range on "+normal.name);
      assert(winning.length>=4,"Too short: "+normal.name+" "+difficulty);
      for(let j=0;j<level.gadgets.length;j++){            // take any one device away and the level must become unwinnable
        const t=copy(level);t.gadgets.splice(j,1);
        t.gadgets.forEach(g=>{if(g.after!=null){if(g.after===j)delete g.after;else if(g.after>j)g.after--;}});
        assert.equal(solve(t),null,"A device is optional on "+normal.name+" "+difficulty);
      }
    }
    validated++;
  }
}
assert(source.includes('const FREE_LEVEL_COUNT = 5'));
assert(source.includes('return hasFullAccess() ||'));
assert(source.includes('id="unlock-restore"'));
assert(source.includes('id="developer"'));
assert(source.includes('id="dev-reset-purchase"'));
assert(source.includes('id="dev-reset-progress"'));
assert(source.includes('FTW_TEST_BUILD = true'));
if(process.argv.includes("--release")){
  assert.fail("Release blocked: remove the development preview and integrate verified native StoreKit 2 before release.");
}
console.log("OK: "+all.length+" levels / "+validated+" solvable variants; no device on any of the 120 new variants is optional.");
