/* Picks 20 normal and 20 hard puzzles per location from the audited candidates and writes expansion-levels.js.
   Usage: node tools/assemble-levels.cjs cand0.json cand1.json cand2.json */
const fs=require("fs"),path=require("path");
const NAMES=[
 ["First cog","Wind it up","Loose screw","Counterweight","The mainspring","Tick, then tock","Brass tacks","Two-stroke","Grease the wheels","Small hand first","The escapement","Spanner in the works","Clock in","Like clockwork","Second wind","Gear change","Overwound","The governor","Tolerances","The Grand Mechanism"],
 ["Drink up","Green fingers","A little drizzle","Thirsty work","Hothouse","Late bloomer","Water feature","Do not overwater","Night shade","The potting shed","Root and branch","Compost corner","Cuttings","The long drink","Dew point","Hardy perennial","Greenhouse effect","Pruning season","Garden path","The Moonflower"],
 ["Lights, action!","Opening night","Stage fright","Footlights","The understudy","Cue the lava","Places, please","The prompt box","Curtain up","Limelight","Dress rehearsal","Break a leg","The fly loft","Trapdoor","Standing room only","The second act","House lights","Encore","Exit, pursued","The Final Bow"]];
const src=process.argv.slice(2).map(f=>JSON.parse(fs.readFileSync(f,"utf8")));
const sigOf=l=>l.rooms.map(r=>Object.keys(r.has||{}).sort().join("+")).filter(Boolean).sort().join(",")+"|"+l.gadgets.length+"|"+l.pins.length;
function hint(l,loc){
  const has=k=>l.rooms.some(r=>r.has&&r.has[k]),parts=[];
  if(loc===0)parts.push(l.gadgets.some(g=>g.after!=null)?"Gear 1 before gear 2. Turn one early and it strips its teeth.":"Land a boulder on the gear to open its gate.");
  if(loc===1)parts.push("The bloom drinks a measure of whatever water reaches it. Keep lava off it until it has opened.");
  if(loc===2)parts.push(has("ghost")?"A lit beacon clears its floor of ghosts. Water on an unlit one puts it out for good.":"Lava lights the beacon. Water on an unlit one puts it out for good.");
  if(has("captive"))parts.push("Everyone out of their cages before dinner.");
  else if(has("monster"))parts.push("Deal with the hunter before any wall between us comes down.");
  else if(has("lava"))parts.push("Cool the lava before you open a way to it.");
  return parts.join(" ");
}
function choose(pool,plan,used){
  const out=[];
  for(const tier of plan){
    const order=[tier,tier-1,tier+1,tier-2,tier+2].filter(t=>t>=0);
    let got=null;
    for(const t of order){ const c=pool.filter(x=>x.tier===t&&!x.taken); if(!c.length)continue;
      got=c.find(x=>!used.has(sigOf(x.level)))||c[0]; break; }
    if(!got)throw Error("not enough candidates");
    got.taken=true;used.add(sigOf(got.level));out.push(got);
  }
  return out;
}
const all=[],stats=[];
src.forEach((pool,loc)=>{
  const used=new Set();
  const normal=choose(pool,[0,0,0,0,0,0,1,1,1,1,1,1,2,2,2,2,3,3,3,3],used);
  // within each tier, easier first
  for(const t of [0,1,2,3]){ const idx=normal.map((x,i)=>x.tier===t?i:-1).filter(i=>i>=0),sorted=idx.map(i=>normal[i]).sort((a,b)=>b.audit.random-a.audit.random); idx.forEach((i,k)=>normal[i]=sorted[k]); }
  const hard=choose(pool,[4,4,4,4,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5],used).sort((a,b)=>b.audit.random-a.audit.random);
  normal.forEach((n,i)=>{ const lv={name:NAMES[loc][i],...n.level,hint:hint(n.level,loc),hard:{...hard[i].level,hint:hint(hard[i].level,loc)}}; all.push(lv); stats.push({loc,i,pins:lv.pins.length,pulls:n.audit.shortest,random:n.audit.random,hpins:hard[i].level.pins.length,hpulls:hard[i].audit.shortest,hrandom:hard[i].audit.random}); });
});
const head=`/* Feed the Wolf: levels 41-100, three locations of twenty.
 * Built by tools/generate-levels.cjs and chosen by tools/assemble-levels.cjs. Every level here was kept only because a
 * full search of its pull orders showed: it can be won; it cannot be won with any of its devices removed (or, for
 * numbered gears, with the numbering ignored); its shortest win needs most of its pins; and few pull orders win.
 * That proves they are solvable and not trivial. It does not prove they are fun: they still need playing. */
window.FTW_EXPANSION_LEVELS = `;
fs.writeFileSync(path.resolve(__dirname,"..","expansion-levels.js"),head+JSON.stringify(all)+";\n");
for(let loc=0;loc<3;loc++){ const s=stats.filter(x=>x.loc===loc),avg=k=>(s.reduce((n,x)=>n+x[k],0)/s.length);
  console.log(["Clockwork","Conservatory","Theatre"][loc],"normal: pins",avg("pins").toFixed(1),"pulls",avg("pulls").toFixed(1),"random win",(avg("random")*100).toFixed(1)+"%","| hard: pins",avg("hpins").toFixed(1),"pulls",avg("hpulls").toFixed(1),"random win",(avg("hrandom")*100).toFixed(1)+"%"); }
