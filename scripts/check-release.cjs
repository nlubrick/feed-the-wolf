"use strict";
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const page=fs.readFileSync(path.join(root,"index.html"),"utf8");
const errors=[];
if(/const FTW_QA_PREVIEW\s*=\s*true/.test(page))errors.push("Development-only full/demo entitlement bypass is still enabled.");
if(/id="qa-toggle"/.test(page))errors.push("Remove the QA preview control from production HTML.");
if(!page.includes("result.verified !== true"))errors.push("Verified StoreKit entitlement check is missing.");
if(!page.includes("const FREE_LEVEL_COUNT = 5"))errors.push("Five free levels gate is missing.");
if(!fs.existsSync(path.join(root,"expansion-levels.js")))errors.push("Missing 60-level expansion.");
if(errors.length){console.error("Release blocked:\n - "+errors.join("\n - "));process.exitCode=1;}
else console.log("Release-source checks passed. Apple sandbox purchase tests and App Review are still required.");
