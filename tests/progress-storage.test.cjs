"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,".."),src=fs.readFileSync(path.join(root,"progress-store-v1.js"),"utf8");
const page=fs.readFileSync(path.join(root,"index.html"),"utf8");
const sample=(level=5)=>JSON.stringify({cleared:{0:true,1:true},stars:{0:3},owned:{wolf:true},worn:{hero:"wolf"},bs:{},li:level,cs:level+1,sv:2});
function store(seed={}){
 const data=new Map(Object.entries(seed));
 return{data,getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};
}
function harness(local=store(),indexedDB=null){
 const host={localStorage:local,indexedDB};
 vm.runInNewContext(src,{window:host});
 return{progress:host.FTWProgress,local};
}
test("Existing save is preserved and automatically backed up, not reset on boot",async()=>{
 const raw=sample(27),local=store({"ftw-save":raw}),{progress}=harness(local);
 assert.deepEqual({...await progress.recover()},{source:"primary",recovered:false});
 assert.equal(local.getItem("ftw-save"),raw);
 assert.equal(local.getItem("ftw-save-backup-v1"),raw);
});
test("Missing or corrupt main save restores valid local backup before game starts",async()=>{
 const raw=sample(32);
 for(const old of [null,"{garbled"]){
  const local=store({"ftw-save-backup-v1":raw});
  if(old!==null)local.setItem("ftw-save",old);
  const {progress}=harness(local);
  assert.equal((await progress.recover()).recovered,true);
  assert.equal(local.getItem("ftw-save"),raw);
  assert.equal(progress.blocked(),false);
 }
});
test("Corrupt save with no backup does not permit boot to overwrite it",async()=>{
 const local=store({"ftw-save":"{corrupt"}),{progress}=harness(local);
 assert.deepEqual({...await progress.recover()},{source:"damaged",recovered:false,warning:true});
 assert.equal(progress.blocked(),true);
 assert.equal(local.getItem("ftw-save"),"{corrupt");
});
test("Explicit DEV progress reset clears the backup, so a deliberate reset stays reset",async()=>{
 const local=store({"ftw-save":sample(10),"ftw-save-backup-v1":sample(10)}),{progress}=harness(local);
 await progress.clear();
 local.removeItem("ftw-save");
 assert.equal(local.getItem("ftw-save-backup-v1"),null);
 assert.equal((await progress.recover()).source,"new");
});
test("Manual progress backup import validates format and does not grant purchase entitlement",async()=>{
 const local=store(),{progress}=harness(local),raw=sample(15);
 assert.equal(progress.parse(raw).li,15);
 assert.equal(progress.parse('{"fullGame":true}'),null);
 await progress.replace(raw);
 assert.equal(local.getItem("ftw-save"),raw);
 assert.equal(local.getItem("ftw-save-backup-v1"),raw);
 assert.match(page,/format:"feed-the-wolf-progress",version:1/);
 assert.match(page,/progress-import/);
 assert.match(page,/Full-game purchases are not included/);
});
test("Web game awaits recovery before initializing, uses backups on saves, no test-only shortcuts in production",()=>{
 assert.match(page,/recovery=await window\.FTWProgress\.recover\(\)/);
 assert.match(page,/if\(window\.FTWProgress\)window\.FTWProgress\.put\(text\)/);
 assert.match(page,/if\(window\.FTWProgress\?\.blocked\(\)\)return/);
 const worker=fs.readFileSync(path.join(root,"service-worker.js"),"utf8");
 assert.match(worker,/progress-store-v1\.js/);
 const {build}=require("../scripts/build.cjs"),{check}=require("../scripts/check-release.cjs");
 const os=require("node:os"),temp=fs.mkdtempSync(path.join(os.tmpdir(),"ftw-progress-"));
 try{const result=build("production",temp);assert.ok(result.files.includes("progress-store-v1.js"));assert.deepEqual(check(temp).errors,[]);}
 finally{fs.rmSync(temp,{recursive:true,force:true});}
});
