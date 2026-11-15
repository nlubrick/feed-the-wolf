/* BETA SIMULATED STORE ONLY. No actual payments, Apple billing or network checkout.
 * Do not ship this file in the public/paid release. */
(function(root){
  "use strict";
  const KEY="ftw-test-receipts-v1";
  const FULL_ID="feed_the_wolf_full_unlock";
  const PRODUCTS=Object.freeze([
    Object.freeze({id:FULL_ID,name:"The Full Adventure",category:"One-time unlock",price:"$2.99",gems:0,
      description:"Unlock all 100 levels, Hard Mode, and the daily puzzle."}),
    Object.freeze({id:"ftw_gems_50",name:"Gem Pouch",category:"Gems",price:"$0.99",gems:50,
      description:"50 gems to spend on characters, pets, costumes or hints."}),
    Object.freeze({id:"ftw_gems_150",name:"Gem Chest",category:"Gems",price:"$1.99",gems:150,
      description:"150 gems for the bigger wardrobe wishlist."}),
    Object.freeze({id:"ftw_gems_400",name:"Gem Vault",category:"Gems",price:"$3.99",gems:400,
      description:"400 gems to unlock your favorite companions and outfits."})
  ]);
  const packs=PRODUCTS.filter(p=>p.gems>0),packIds=new Set(packs.map(p=>p.id));
  function storage(storage){if(storage)return storage;try{return root.localStorage||null;}catch(e){return null;}}
  function empty(){return{purchased:[],packs:{}};}
  function read(store){
    try{
      const raw=storage(store)?.getItem(KEY),p=raw?JSON.parse(raw):null;
      const purchased=p?.purchased?.includes(FULL_ID)?[FULL_ID]:[];
      const counts={};
      for(const product of packs){
        const n=p?.packs?.[product.id];
        if(Number.isSafeInteger(n)&&n>0&&n<=10000)counts[product.id]=n;
      }
      return{purchased,packs:counts};
    }catch(e){return empty();}
  }
  function write(state,store){
    const counts={};
    for(const product of packs){
      const n=state?.packs?.[product.id];if(Number.isSafeInteger(n)&&n>0&&n<=10000)counts[product.id]=n;
    }
    const result={purchased:state?.purchased?.includes(FULL_ID)?[FULL_ID]:[],packs:counts};
    storage(store)?.setItem(KEY,JSON.stringify(result)); // Throw on disabled/quota storage.
    return result;
  }
  function purchase(id,store){
    const p=PRODUCTS.find(p=>p.id===id);
    if(!p)throw new Error("Unknown test product");
    const current=read(store);
    if(id===FULL_ID){
      if(!current.purchased.includes(FULL_ID))current.purchased.push(FULL_ID);
    }else if(packIds.has(id)){
      current.packs[id]=(current.packs[id]||0)+1;
    }
    return write(current,store);
  }
  function reset(store){storage(store)?.removeItem(KEY);return empty();}
  function has(state,id){return id===FULL_ID&&!!state?.purchased?.includes(FULL_ID);}
  function gemsGranted(state){
    return packs.reduce((total,p)=>total+p.gems*(Number.isSafeInteger(state?.packs?.[p.id])?state.packs[p.id]:0),0);
  }
  function count(state,id){return packIds.has(id)?(state?.packs?.[id]||0):has(state,id)?1:0;}
  root.FTWTestStore=Object.freeze({KEY,FULL_ID,PRODUCTS,read,write,purchase,reset,has,gemsGranted,count});
})(typeof window!=="undefined"?window:{});
