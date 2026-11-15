/* PRE-RELEASE SIMULATOR ONLY — never ship to the App Store or a paid public release.
 * No payment processor, network request, Apple billing or real charge is performed. */
(function(root){
  "use strict";
  const KEY="ftw-test-receipts-v1";
  const FULL_ID="feed_the_wolf_full_unlock";
  const PRODUCTS=Object.freeze([
    Object.freeze({id:FULL_ID, name:"The Full Adventure",category:"Game unlock",price:"$2.99",outfit:null,description:"All 100 levels, Hard Mode, daily puzzles, and earnable collections."}),
    Object.freeze({id:"ftw_test_copper_fox",name:"Copper Fox",category:"Playable character",price:"$0.99",outfit:"copper",description:"Play as the copper-colored fox right away."}),
    Object.freeze({id:"ftw_test_moss_fox",name:"Moss Fox",category:"Playable character",price:"$0.99",outfit:"mossfox",description:"Take an enchanted fox through every castle."}),
    Object.freeze({id:"ftw_test_firefly",name:"Firefly Companion",category:"Companion pet",price:"$0.99",outfit:"firefly",description:"A glowing little companion for your adventure."}),
    Object.freeze({id:"ftw_test_phoenix",name:"Mini Phoenix",category:"Companion pet",price:"$1.49",outfit:"phoenix",description:"Bring an animated fiery friend along."}),
    Object.freeze({id:"ftw_test_grand_crown",name:"Grand Crown",category:"Costume",price:"$0.99",outfit:"marquee",description:"A bright royal crown for your character."})
  ]);
  const valid=new Set(PRODUCTS.map(p=>p.id));
  const copy=()=>({purchased:[]});
  function storageOrNull(storage){
    if(storage)return storage;
    try{return root.localStorage || null;}catch(e){return null;}
  }
  function read(storage){
    try {
      const saved=storageOrNull(storage)?.getItem(KEY);
      const parsed=saved?JSON.parse(saved):null;
      const ids=parsed&&Array.isArray(parsed.purchased)?parsed.purchased:[];
      return {purchased:[...new Set(ids.filter(id=>typeof id==="string"&&valid.has(id)))]};
    }catch(e){return copy();}
  }
  function write(receipts,storage){
    const value={purchased:[...new Set((receipts.purchased||[]).filter(id=>valid.has(id)))]};
    try{storageOrNull(storage)?.setItem(KEY,JSON.stringify(value));}catch(e){}
    return value;
  }
  function purchase(id,storage){
    if(!valid.has(id))throw new Error("Unknown test product");
    const receipts=read(storage);
    if(!receipts.purchased.includes(id))receipts.purchased.push(id);
    return write(receipts,storage);
  }
  function reset(storage){
    try{storageOrNull(storage)?.removeItem(KEY);}catch(e){}
    return copy();
  }
  function has(receipts,id){return !!receipts?.purchased?.includes(id);}
  root.FTWTestStore=Object.freeze({KEY,FULL_ID,PRODUCTS,read,write,purchase,reset,has});
})(typeof window!=="undefined"?window:{});
