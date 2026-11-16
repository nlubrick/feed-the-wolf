"use strict";
/* Generate a real Xcode app icon after Capacitor creates its native project.
   A web manifest and apple-touch-icon only help Safari home-screen bookmarks,
   never the signed iOS IPA or App Store Connect / TestFlight.
   Native AppIcon.appiconset must contain a nontransparent 1024x1024 PNG. */
const fs=require("node:fs"),path=require("node:path"),sharp=require("sharp");
const root=path.resolve(__dirname,"..");
async function writeIosIcon(options={}){
 const project=options.project||path.join(root,"ios","App","App");
 const web=options.web||path.join(root,"www");
 const icons=path.join(project,"Assets.xcassets","AppIcon.appiconset");
 if(!fs.existsSync(icons))throw new Error("Generated iOS AppIcon.appiconset is missing: "+icons);
 // The internal tester flavor includes a distinct BETA badge; production/external
 // uses the unbadged wolf. Never use the browser's small 180px icon for native.
 const tester=fs.existsSync(path.join(web,"feed-the-wolf-beta-icon.svg"));
 const source=path.join(web,tester?"feed-the-wolf-beta-icon.svg":"feed-the-wolf-icon.svg");
 if(!fs.existsSync(source))throw new Error("Native iOS wolf icon source is missing: "+source);
 const filename="AppIcon-512@2x.png",destination=path.join(icons,filename);
 const buffer=await sharp(fs.readFileSync(source),{density:300})
  .resize(1024,1024,{fit:"fill"})
  .flatten({background:"#191234"})
  .png({palette:false,compressionLevel:9})
  .toBuffer();
 const info=await sharp(buffer).metadata();
 if(info.width!==1024||info.height!==1024||info.hasAlpha||info.channels!==3)
  throw new Error("Invalid iOS icon: requires an opaque 1024x1024 RGB PNG");
 fs.writeFileSync(destination,buffer);
 fs.writeFileSync(path.join(icons,"Contents.json"),JSON.stringify({
  images:[{filename,idiom:"universal",platform:"ios",size:"1024x1024"}],
  info:{author:"xcode",version:1}
 },null,2)+"\n");
 console.log("iOS native AppIcon installed: "+path.relative(root,destination)+(tester?" (BETA)":""));
 return{destination,source,tester};
}
module.exports={writeIosIcon};
if(require.main===module)writeIosIcon().catch(e=>{console.error(e);process.exitCode=1;});
