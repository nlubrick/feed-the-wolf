"use strict";
/* Generate a real Xcode icon from the EXACT FTW Dev home-screen wolf image.
   The repository's SVG is a different, angular design, not the cheerful wolf
   used by FTW Dev. iOS tester and production now share that same character.
   AppIcon.appiconset needs an opaque 1024x1024 PNG in signed IPA builds. */
const fs=require("node:fs"),path=require("node:path"),sharp=require("sharp");
const root=path.resolve(__dirname,"..");
async function writeIosIcon(options={}){
 const project=options.project||path.join(root,"ios","App","App");
 const web=options.web||path.join(root,"www");
 const icons=path.join(project,"Assets.xcassets","AppIcon.appiconset");
 if(!fs.existsSync(icons))throw new Error("Generated iOS AppIcon.appiconset is missing: "+icons);
 // FTW Dev currently uses an embedded apple-touch-icon PNG. Reusing these
 // exact image bytes (rather than the separate angular wolf SVG) makes the
 // TestFlight icon match FTW Dev. A small BETA badge differentiates tester IPAs.
 const tester=fs.existsSync(path.join(web,"feed-the-wolf-beta-icon.svg"));
 const source=path.join(root,"index.html");
 const html=fs.readFileSync(source,"utf8");
 const match=html.match(/<link rel="apple-touch-icon" href="data:image\/png;base64,([^"]+)">/);
 if(!match)throw new Error("FTW Dev home-screen icon is missing from index.html");
 const wolf=Buffer.from(match[1],"base64");
 const filename="AppIcon-512@2x.png",destination=path.join(icons,filename);
 let pipeline=sharp(wolf).resize(1024,1024,{fit:"fill",kernel:"lanczos3"}).flatten({background:"#292052"});
 if(tester){
  const badge=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect x="716" y="866" width="277" height="112" rx="48" fill="#f7d678" stroke="#252045" stroke-width="12"/><text x="854" y="940" font-family="Arial,Helvetica,sans-serif" font-size="64" font-weight="900" letter-spacing="2" text-anchor="middle" fill="#252045">BETA</text></svg>');
  pipeline=pipeline.composite([{input:badge}]);
 }
 const buffer=await pipeline.png({palette:false,compressionLevel:9}).toBuffer();
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
