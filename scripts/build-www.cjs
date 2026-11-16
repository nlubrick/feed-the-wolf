/* Copies exactly the files the game needs into www/, the folder the iPhone and Android app shells load.
   The list is the service worker's own app-shell list, so the app and the website can never drift apart.
   Usage: npm run build:www */
"use strict";
const fs=require("fs"),path=require("path");
const root=path.resolve(__dirname,".."),out=path.join(root,"www");
const sw=fs.readFileSync(path.join(root,"service-worker.js"),"utf8");
const m=sw.match(/const CORE=(\[[^\]]+\])/);
if(!m)throw new Error("Could not read the CORE list from service-worker.js");
const files=JSON.parse(m[1]).map(f=>f.replace(/^\.\//,"")).filter(Boolean);
if(!files.includes("index.html"))files.push("index.html");
files.push("service-worker.js");
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
let bytes=0;
for(const f of new Set(files)){
 const from=path.join(root,f);
 if(!fs.existsSync(from))throw new Error("Listed in the app shell but missing: "+f);
 fs.mkdirSync(path.dirname(path.join(out,f)),{recursive:true});fs.copyFileSync(from,path.join(out,f));bytes+=fs.statSync(from).size;
}
// Anything index.html loads must be in the bundle, or the app would show a blank screen offline.
const html=fs.readFileSync(path.join(out,"index.html"),"utf8");
for(const ref of html.matchAll(/(?:src|href)="\.\/([^"?#]+)/g))if(!fs.existsSync(path.join(out,ref[1])))throw new Error("index.html needs "+ref[1]+" but it is not in the app shell list");
console.log("www/ built: "+new Set(files).size+" files, "+Math.round(bytes/1024)+" KB");
