"use strict";
const test=require("node:test"), assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const page=fs.readFileSync(path.resolve(__dirname,"../index.html"),"utf8");
test("Developer level jumper replays only completed normal stages and won mini-games",()=>{
  const match=page.match(/function completedForDeveloperJump\(stage\)\{[\s\S]*?\n\}/);
  assert.ok(match,"Replay-only helper must exist");
  const ctx={cleared:{4:true},bonusResults:{6:"win",15:"skip","28h":"win"}};
  const canReplay=vm.runInNewContext(match[0]+"\ncompletedForDeveloperJump",ctx);
  assert.equal(canReplay({type:"puzzle",puzzleIndex:4}),true);
  assert.equal(canReplay({type:"puzzle",puzzleIndex:5}),false);
  assert.equal(canReplay({type:"bonus",number:6}),true);
  assert.equal(canReplay({type:"bonus",number:15}),false);
  assert.equal(canReplay({type:"bonus",number:28}),false);
  assert.equal(canReplay(null),false);
  assert.match(page,/if\(!completedForDeveloperJump\(stage\)\)/);
  assert.match(page,/Only completed levels can be replayed here/);
});
