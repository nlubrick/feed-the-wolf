/* Turns store/listing.json into store/LISTING.md (a copy-and-paste sheet for App Store Connect and Google Play Console)
   and reports each field's length against the store's limit. Usage: node scripts/store-listing.cjs */
"use strict";
const fs=require("fs"),path=require("path");
const root=path.resolve(__dirname,"..");
const LIMITS={apple:{name:30,nameFallback:30,subtitle:30,promotionalText:170,keywords:100,whatsNew:4000,description:4000},google:{title:30,shortDescription:80,description:4000},
 iap:{displayName:30,description:45},testFlight:{betaDescription:4000,whatToTest:4000}};
function load(){return JSON.parse(fs.readFileSync(path.join(root,"store","listing.json"),"utf8"));}
function description(l){return l.description.join("\n\n");}
/* Every length-limited field, with its text and limit. */
function fields(l){
 const d=description(l),out=[];
 for(const k of ["name","nameFallback","subtitle","promotionalText","keywords","whatsNew"])out.push(["apple."+k,l.apple[k],LIMITS.apple[k]]);
 out.push(["apple.description",d,LIMITS.apple.description],["google.title",l.google.title,LIMITS.google.title],["google.shortDescription",l.google.shortDescription,LIMITS.google.shortDescription],["google.description",d,LIMITS.google.description]);
 for(const p of l.apple.inAppPurchases){out.push(["iap."+p.id+".displayName",p.displayName,LIMITS.iap.displayName],["iap."+p.id+".description",p.description,LIMITS.iap.description]);}
 out.push(["testFlight.betaDescription",l.testFlight.betaDescription,LIMITS.testFlight.betaDescription],["testFlight.whatToTest",l.testFlight.whatToTest,LIMITS.testFlight.whatToTest]);
 return out;
}
function markdown(l){
 const box=t=>"```\n"+t+"\n```",len=(t,n)=>" ("+[...t].length+" of "+n+" characters)";
 const A=l.apple,G=l.google,d=description(l);
 return ["# Feed the Wolf: store listing","",
  "Copy each box into the matching field. Generated from `store/listing.json`; edit that file, not this one.","",
  "| | |","|---|---|","| Seller / developer name | "+l.seller+" |","| Copyright | "+l.copyright+" |","| Category | "+l.category.primary+" (secondary: "+l.category.secondary+") |",
  "| Privacy policy URL | "+l.urls.privacy+" |","| Support URL | "+l.urls.support+" |","| Marketing URL | "+l.urls.marketing+" |","",
  "## Apple App Store","",
  "**App name**"+len(A.name,30),box(A.name),"If that name is taken, use this one"+len(A.nameFallback,30)+":",box(A.nameFallback),
  "**Subtitle**"+len(A.subtitle,30),box(A.subtitle),"**Promotional text**"+len(A.promotionalText,170),box(A.promotionalText),
  "**Keywords**"+len(A.keywords,100),box(A.keywords),"**Description**"+len(d,4000),box(d),"**What's New in This Version**"+len(A.whatsNew,4000),box(A.whatsNew),"",
  "### In-app purchases","","| Product ID | Type | Display name | Description |","|---|---|---|---|",
  ...A.inAppPurchases.map(p=>"| `"+p.id+"` | "+p.type+" | "+p.displayName+" | "+p.description+" |"),"",
  "## Google Play","","**App name**"+len(G.title,30),box(G.title),"**Short description**"+len(G.shortDescription,80),box(G.shortDescription),
  "**Full description**"+len(d,4000),"Same text as the Apple description above.","",
  "Create the same four products in Play Console with the same product IDs: the unlock as a one-time product, the gem packs as consumable one-time products.","",
  "## Age rating questionnaire (suggested answers)","",l.ageRating._note,"",...Object.entries(l.ageRating).filter(e=>e[0]!=="_note").map(e=>"- **"+e[0].replace(/([A-Z])/g," $1").toLowerCase()+":** "+e[1]),"",
  "## App Privacy (Apple) and Data safety (Google): suggested answers","",l.dataPrivacy._note,"",
  "- **Used for tracking:** "+l.dataPrivacy.tracking,...l.dataPrivacy.collected.map(c=>"- **Collected:** "+c.type+". Linked to identity: "+c.linkedToIdentity+". Purpose: "+c.purpose+". Collected by: "+c.by+"."),
  "- **Not collected:** "+l.dataPrivacy.notCollected,"- **Encrypted in transit:** "+l.dataPrivacy.dataEncryptedInTransit,"- **Deletion:** "+l.dataPrivacy.deletionRequest,"",
  "## TestFlight","","**Beta App Description**",box(l.testFlight.betaDescription),"**What to Test**",box(l.testFlight.whatToTest),""].join("\n");
}
module.exports={load,fields,markdown,description,LIMITS};
if(require.main===module){
 const l=load();let bad=0;
 for(const [name,text,limit] of fields(l)){const n=[...text].length;if(n>limit){bad++;console.error("TOO LONG: "+name+" is "+n+" of "+limit);}}
 fs.writeFileSync(path.join(root,"store","LISTING.md"),markdown(l));
 console.log(bad?bad+" field(s) over the limit":"store/LISTING.md written; every field is within its limit");
 if(bad)process.exitCode=1;
}
