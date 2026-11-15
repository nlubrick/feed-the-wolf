"use strict";
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const page=fs.readFileSync(path.join(root,"index.html"),"utf8");
const errors=[];
if(/const FTW_QA_PREVIEW\s*=\s*true/.test(page) || /\bDEV_PREVIEW\b/.test(page) || /\bpreviewFull\b/.test(page))
  errors.push("Remove all QA/demo-full preview bypass code before releasing.");
if(/id="qa-toggle"/.test(page))errors.push("Remove the old QA toggle from production HTML.");
if(/id="dev-preview"/.test(page))errors.push("Remove the development panel and level jumper before release.");
if(/const DEV_PREVIEW\s*=/.test(page))errors.push("Remove the ?dev=1 entitlement preview branch.");
if(/const FTW_QA_PREVIEW\s*=\s*true/.test(page))errors.push("Remove any alternate QA switch.");
if(/const FTW_TEST_BUILD\s*=\s*true/.test(page) || /\bFTW_TEST_PURCHASE_KEY\b/.test(page))
  errors.push("Remove simulated purchase and browser entitlement storage before the actual sale.");
if(/id="developer-open"/.test(page) || /id="developer"/.test(page) || /id="developer-from-unlock"/.test(page))
  errors.push("Remove the beta developer button, reset console and test checkout UI.");
if(!page.includes("result.verified !== true"))errors.push("Verified StoreKit entitlement check is missing.");
if(!page.includes("const FREE_LEVEL_COUNT = 5"))errors.push("Five free levels gate is missing.");
if(!fs.existsSync(path.join(root,"expansion-levels.js")))errors.push("Missing 60-level expansion.");
if(errors.length){console.error("Release blocked:\n - "+errors.join("\n - "));process.exitCode=1;}
else console.log("Release-source checks passed. Apple sandbox purchase tests and App Review are still required.");
