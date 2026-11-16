/* Feed the Wolf: the real-money products, shared by the beta and production builds.
   The IDs must match the products created in App Store Connect, Google Play Console and RevenueCat exactly. */
(function(root){
  "use strict";
  const FULL_ID="feed_the_wolf_full_unlock";
  const PRODUCTS=Object.freeze([
    Object.freeze({id:FULL_ID,name:"The Full Adventure",category:"One-time unlock",price:"$2.99",gems:0,
      description:"Unlock all 110 levels: 100 pull-the-pin puzzles and 10 different mini-games, plus Hard Mode and the daily puzzle. Includes a free Chick pet and Bandana, only for full-game owners."}),
    Object.freeze({id:"ftw_gems_50",name:"Gem Pouch",category:"Gems",price:"$0.99",gems:50,
      description:"50 gems to spend on characters, pets, costumes or hints."}),
    Object.freeze({id:"ftw_gems_150",name:"Gem Chest",category:"Gems",price:"$1.99",gems:150,
      description:"150 gems for the bigger wardrobe wishlist."}),
    Object.freeze({id:"ftw_gems_400",name:"Gem Vault",category:"Gems",price:"$3.99",gems:400,
      description:"400 gems to unlock your favorite companions and outfits."})
  ]);
  root.FTWCatalog=Object.freeze({FULL_ID,PRODUCTS,ENTITLEMENT:"full_game"});
})(typeof window!=="undefined"?window:globalThis);
