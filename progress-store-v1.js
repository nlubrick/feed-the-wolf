/* Local progress recovery for the web beta and native shell.
   The same-origin browser stores are independent of Test/real-money entitlements.
   A downloaded JSON backup is required for recovery after ALL site data is deleted. */
(function(root){
"use strict";
const KEY="ftw-save", FALLBACK="ftw-save-backup-v1", DB_NAME="ftw-progress-backup-v1", STORE="snapshots", SLOT="latest", LIMIT=2000000;
let dbReady=null, pending=Promise.resolve(), damaged=false;
function parse(text){
 if(typeof text!=="string"||text.length<2||text.length>LIMIT)return null;
 try{
  const s=JSON.parse(text);
  if(!s||typeof s!=="object"||Array.isArray(s))return null;
  if(!s.cleared||typeof s.cleared!=="object"||Array.isArray(s.cleared))return null;
  if(!Number.isInteger(s.li)||s.li<0||s.li>100)return null;
  return s;
 }catch(e){return null;}
}
function readLocal(key){try{return root.localStorage.getItem(key);}catch(e){return null;}}
function writeLocal(key,text){try{root.localStorage.setItem(key,text);return true;}catch(e){return false;}}
function openDB(){
 if(dbReady)return dbReady;
 dbReady=new Promise(resolve=>{
  if(!root.indexedDB){resolve(null);return;}
  try{
   const req=root.indexedDB.open(DB_NAME,1);
   req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE);};
   req.onsuccess=()=>resolve(req.result);
   req.onerror=()=>resolve(null);req.onblocked=()=>resolve(null);
  }catch(e){resolve(null);}
 });
 return dbReady;
}
async function readDB(){
 const db=await openDB();if(!db)return null;
 return new Promise(resolve=>{
  try{const tx=db.transaction(STORE,"readonly"),r=tx.objectStore(STORE).get(SLOT);
   r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>resolve(null);
   tx.onabort=()=>resolve(null);
  }catch(e){resolve(null);}
 });
}
async function writeDB(text){
 const db=await openDB();if(!db)return false;
 return new Promise(resolve=>{
  try{
   const tx=db.transaction(STORE,"readwrite");
   tx.objectStore(STORE).put(text,SLOT);
   tx.oncomplete=()=>resolve(true);
   tx.onerror=()=>resolve(false);tx.onabort=()=>resolve(false);
  }catch(e){resolve(false);}
 });
}
async function deleteDB(){
 const db=await openDB();if(!db)return;
 await new Promise(resolve=>{
  try{
   const tx=db.transaction(STORE,"readwrite");
   tx.objectStore(STORE).delete(SLOT);
   tx.oncomplete=()=>resolve();tx.onerror=()=>resolve();tx.onabort=()=>resolve();
  }catch(e){resolve();}
 });
}
function put(text){
 if(!parse(text))return false;
 const local=writeLocal(FALLBACK,text);
 pending=pending.then(()=>writeDB(text)).catch(()=>false);
 return local;
}
async function recover(){
 const current=readLocal(KEY);
 if(parse(current)){put(current);return {source:"primary",recovered:false};}
 const fallback=readLocal(FALLBACK);
 if(parse(fallback)&&writeLocal(KEY,fallback)){
  put(fallback);return {source:"local-backup",recovered:true};
 }
 const dbText=await readDB();
 if(parse(dbText)&&writeLocal(KEY,dbText)){
  put(dbText);return {source:"browser-backup",recovered:true};
 }
 if(current!==null&&current!==""){damaged=true;return {source:"damaged",recovered:false,warning:true};}
 return {source:"new",recovered:false};
}
function blocked(){return damaged;}
function clear(){
 damaged=false;
 try{root.localStorage.removeItem(FALLBACK);}catch(e){}
 pending=pending.then(()=>deleteDB()).catch(()=>{});
 return pending;
}
async function replace(text){
 if(!parse(text))throw Error("That is not a valid Feed the Wolf save.");
 if(!writeLocal(KEY,text))throw Error("The browser could not save this file. Check private browsing or site storage settings.");
 damaged=false;put(text);await pending;
 if(root.FTWNativeSave)root.FTWNativeSave.put(text);
}
function current(){
 return parse(readLocal(KEY))||parse(readLocal(FALLBACK));
}
root.FTWProgress=Object.freeze({parse,put,recover,blocked,clear,replace,current});
})(typeof window!=="undefined"?window:globalThis);
