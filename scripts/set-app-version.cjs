/* Stamps a unique, always-increasing build number (and the version from package.json) into the generated app projects.
   Apple and Google both refuse an upload whose build number they have seen before.

     node scripts/set-app-version.cjs ios       # after `npx cap add ios`
     node scripts/set-app-version.cjs android   # after `npx cap add android`

   The number is minutes since 1 Jan 1970 (UTC): unique per minute, larger for every later build, independent of any
   CI counter that could be reset, and well inside Android's limit of 2,100,000,000. Set FTW_BUILD_NUMBER to choose one. */
"use strict";
const fs=require("fs"),path=require("path");
const root=path.resolve(__dirname,"..");
const ANDROID_MAX=2100000000;
function buildNumber(now=Date.now(),env=process.env){
 const chosen=env.FTW_BUILD_NUMBER;
 const n=chosen?Number(chosen):Math.floor(now/60000);
 if(!Number.isSafeInteger(n)||n<1||n>ANDROID_MAX)throw new Error("Build number must be a whole number from 1 to "+ANDROID_MAX+", got "+(chosen||n));
 return n;
}
function versionName(){
 const v=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8")).version;
 if(!/^\d+\.\d+\.\d+$/.test(v))throw new Error("package.json version must look like 1.2.3, got "+v);
 return v;
}
/* Each returns the new file text, and throws if the project file is not shaped as expected, so a build can never
   go out silently carrying the template's "1". */
function stampIos(pbxproj,number,version){
 const a=/CURRENT_PROJECT_VERSION = [^;]+;/g,b=/MARKETING_VERSION = [^;]+;/g;
 if(!(pbxproj.match(a)||[]).length||!(pbxproj.match(b)||[]).length)throw new Error("iOS project has no CURRENT_PROJECT_VERSION or MARKETING_VERSION to set");
 return pbxproj.replace(a,"CURRENT_PROJECT_VERSION = "+number+";").replace(b,"MARKETING_VERSION = "+version+";");
}
function stampAndroid(gradle,number,version){
 const a=/versionCode\s+\d+/,b=/versionName\s+"[^"]*"/;
 if(!a.test(gradle)||!b.test(gradle))throw new Error("Android build.gradle has no versionCode or versionName to set");
 return gradle.replace(a,"versionCode "+number).replace(b,'versionName "'+version+'"');
}
module.exports={buildNumber,versionName,stampIos,stampAndroid,ANDROID_MAX};
if(require.main===module){
 const platform=process.argv[2],number=buildNumber(),version=versionName();
 const file=platform==="ios"?path.join(root,"ios","App","App.xcodeproj","project.pbxproj"):platform==="android"?path.join(root,"android","app","build.gradle"):null;
 if(!file)throw new Error("Say which platform: ios or android");
 if(!fs.existsSync(file))throw new Error(file+" does not exist yet. Generate the "+platform+" project first.");
 const before=fs.readFileSync(file,"utf8"),after=platform==="ios"?stampIos(before,number,version):stampAndroid(before,number,version);
 fs.writeFileSync(file,after);
 console.log(platform+": version "+version+", build "+number);
}
