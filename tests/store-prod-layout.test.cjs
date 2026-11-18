"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {stripBeta}=require("../scripts/build.cjs");

test("production removes the entire beta checkout without closing the app shell",()=>{
  const html=fs.readFileSync(path.join(__dirname,"..","index.html"),"utf8");
  const production=stripBeta(html,"index.html");
  const help=production.indexOf('<section id="help" hidden>');
  const shop=production.indexOf('<section id="shop" hidden>');
  assert.ok(help>0&&shop>help,"help and Store screens must survive production build");
  assert.match(production.slice(help-80,help),/<\/section>\s*$/,"the full-game unlock screen should be immediately followed by Help, not a stray closing div");
  assert.ok(!production.includes('id="test-checkout"'),"simulated checkout must not ship");
  assert.ok(!production.includes('id="developer"'),"developer lab must not ship");
});
