"use strict";
const test=require("node:test"), assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),os=require("node:os"),vm=require("node:vm");
const {createTester}=require("../scripts/build-tester.cjs");
const dir=fs.mkdtempSync(path.join(os.tmpdir(),"ftw-tester-"));
test.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
test("Public tester build keeps fake checkout, strips developer execution and install identity is distinct",()=>{
  createTester(dir);
  const page=fs.readFileSync(path.join(dir,"index.html"),"utf8");
  for(const id of ["test-checkout","test-checkout-confirm","test-checkout-cancel","beta-badge"])
    assert.ok(page.includes('id="'+id+'"'),id);
  for(const id of ["developer","developer-open","developer-from-unlock","dev-jump","dev-full","dev-reset-all","store-dev"])
    assert.ok(!page.includes('id="'+id+'"'),id);
  const js=[...page.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join("\n");
  for(const re of [/developerMode/,/previewFull/,/openDeveloper/,/renderDeveloper/,/resetTesting/,/dev-jump/])
    assert.doesNotMatch(js,re);
  for(const match of page.matchAll(/<script>([\s\S]*?)<\/script>/g))
    new vm.Script(match[1]);
  assert.match(js,/fullAccess: \(\) => testCheckoutAvailable\(\) && simulatedPurchase/);
  assert.match(js,/FTW_FAKE_SHOP\.purchase/);
  const manifest=JSON.parse(fs.readFileSync(path.join(dir,"manifest.webmanifest"),"utf8"));
  assert.equal(manifest.short_name,"Wolf BETA");
  assert.ok(fs.existsSync(path.join(dir,"feed-the-wolf-beta-icon.svg")));
  assert.match(fs.readFileSync(path.join(dir,"service-worker.js"),"utf8"),/feed-the-wolf-beta-icon\.svg/);
  assert.match(fs.readFileSync(path.join(dir,"store-config.js"),"utf8"),/"build":"tester"/);
  assert.ok(fs.existsSync(path.join(dir,"test-store-v2.js")));
});
