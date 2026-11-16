/* Builds candidate puzzles for levels 41-100 and keeps only ones that pass a solver audit.
   Usage: node tools/generate-levels.cjs <location 0|1|2> <seconds> <out.json>
   A candidate is kept when: it can be won; no device can be removed or broken without making it unwinnable;
   the shortest win needs most of the pins; few pull orders win; and a first pull is neither always safe nor always fatal. */
const fs=require("fs"),path=require("path");
const root=path.resolve(__dirname,".."),source=fs.readFileSync(path.join(root,"index.html"),"utf8");
const between=(t,a,b)=>{const i=t.indexOf(a),j=t.indexOf(b,i+a.length);return t.slice(i+a.length,j);};
const {newState,pull}=new Function(between(source,"//LOGIC-START","//LOGIC-END")+"\nreturn {newState,pull};")();
const copy=x=>JSON.parse(JSON.stringify(x));
function rng(seed){let x=seed>>>0;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}

/* Every way the pins can be pulled, counted once per distinct position (different orders often reach the same one). */
function audit(level){
  const memo=new Map();
  const key=s=>JSON.stringify([s.pulled,s.ents.map(e=>[e.c,e.gone,e.wet]),s.pools.map(q=>[q.n,q.y,q.lo,q.hi]),s.gates,s.dead,s.broken,s.sawUsed,s.down,s.parent]);
  const ev=st=>{
    if(st.status==="win")return{wins:1,d:0,p:1,ws:1};
    if(st.status!=="play")return{wins:0,d:99,p:0,ws:0};
    const k=key(st);let r=memo.get(k);if(r)return r;
    let wins=0,d=99,p=0,n=0,ws=0;
    for(let i=0;i<level.pins.length;i++){ if(st.pulled[i])continue; const t=copy(st); pull(t,level,i); const e=ev(t); wins+=e.wins; p+=e.p; n++; if(e.d+1<d){d=e.d+1;ws=e.ws;}else if(e.d+1===d)ws+=e.ws; }
    r={wins,d,p:n?p/n:0,ws};memo.set(k,r);return r;
  };
  const s0=newState(level);let firstOk=0;
  for(let i=0;i<level.pins.length;i++){ const t=copy(s0); pull(t,level,i); if(ev(t).wins)firstOk++; }
  const top=ev(s0); if(!top.wins)return null;
  return{wins:top.wins,shortest:top.d,shortestWays:top.ws,random:top.p,firstOk};
}
const winnable=level=>!!audit(level);

function build(rand,loc,cfg){
  const cols=cfg.cols,rows=3,pick=a=>a[Math.floor(rand()*a.length)],chance=p=>rand()<p;
  let cells=[];for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)cells.push([x,y]);
  for(let k=0,drop=1+Math.floor(rand()*(cols===5?5:3));k<drop;k++)cells.splice(Math.floor(rand()*cells.length),1);
  const ids="ABCDEFGHIJKLMNO",rooms=cells.map(([x,y],i)=>({id:ids[i],x,y,has:{}})),at=(x,y)=>rooms.find(r=>r.x===x&&r.y===y);
  const free=()=>rooms.filter(r=>!Object.keys(r.has).length),put=(k,n=1,where)=>{const f=where||free();if(!f.length)return null;const r=pick(f);r.has[k]=n;return r;};
  const low=rooms.filter(r=>r.y>=1);
  if(!put("king",1,low)||!put("treasure",1,free().filter(r=>r.y>=1)))return null;
  if(chance(.65))put("monster");
  if(chance(loc===2?.8:.2))put("ghost");
  const kind=["gear","bloom","beacon"][loc];
  put("lava",chance(.25)?2:1); if(chance(loc===2?.75:.35))put("lava");
  if(chance(loc===1?1:.6))put("water",chance(loc===1?.5:.2)?2:1); if(chance(loc===1?.6:.2))put("water");
  if(loc===0||chance(.4))put("boulder",1,free().filter(r=>r.y<rows-1&&at(r.x,r.y+1))); if(loc===0)put("boulder",1,free().filter(r=>r.y<rows-1&&at(r.x,r.y+1)));
  if(chance(.3))put("tnt"); if(chance(.25))put("ice"); if(cfg.captive)put("captive",1,free().filter(r=>r.y>=1));
  const pins=[],weak=[],wallPairs=[];
  for(const r of rooms){
    const right=at(r.x+1,r.y),below=at(r.x,r.y+1);
    if(right){ if(chance(.5))pins.push({a:r.id,b:right.id,dir:"h"}); else wallPairs.push([r,right]); }
    if(below){ if(chance(.5))pins.push({a:r.id,b:below.id,dir:"v"}); else if(chance(.12))weak.push({a:r.id,b:below.id}); }
  }
  // devices: each sits in a room and opens a gate in a wall that has no pin
  const gadgets=[],count=cfg.devices;
  for(let g=0;g<count;g++){
    if(!wallPairs.length)return null;
    const [ra,rb]=wallPairs.splice(Math.floor(rand()*wallPairs.length),1)[0];
    let dev;
    if(kind==="gear"){ const drops=rooms.filter(r=>r.has.boulder&&at(r.x,r.y+1)&&!at(r.x,r.y+1).has.lava&&!at(r.x,r.y+1).has.water&&!gadgets.some(q=>q.c===at(r.x,r.y+1).id)); if(!drops.length)return null; const b=pick(drops); dev=at(b.x,b.y+1);
      if(!pins.some(p=>p.dir==="v"&&p.a===b.id)){ const w=weak.findIndex(q=>q.a===b.id); if(w>=0)weak.splice(w,1); pins.push({a:b.id,b:dev.id,dir:"v"}); } }
    else dev=pick(rooms.filter(r=>!r.has.lava&&!r.has.water&&!gadgets.some(q=>q.c===r.id)));
    if(!dev)return null;
    const gad={kind,c:dev.id,a:ra.id,b:rb.id}; if(kind==="gear"&&g>0&&cfg.ordered)gad.after=g-1; gadgets.push(gad);
  }
  if(pins.length<cfg.pins)return null;
  while(pins.length>cfg.pins){ const i=Math.floor(rand()*pins.length); if(kind==="gear"&&gadgets.some(g=>pins[i].dir==="v"&&pins[i].b===g.c))continue; pins.splice(i,1); }
  const spring=[],saw=[];
  if(chance(.12)){ const r=pick(rooms.filter(q=>q.y>0&&at(q.x,q.y-1)&&at(q.x+1,q.y)&&!gadgets.some(g=>g.c===q.id))||[]); if(r)spring.push({c:r.id,to:at(r.x+1,r.y).id}); }
  const lv={cols,rows,rooms:rooms.map(r=>Object.keys(r.has).length?r:{id:r.id,x:r.x,y:r.y}),pins,gadgets};
  if(weak.length)lv.weak=weak; if(spring.length)lv.spring=spring;
  return lv;
}
function accept(lv,cfg){
  const a=audit(lv); if(!a)return null;
  if(a.shortest<cfg.minPulls||a.random>cfg.maxRandom||a.wins>cfg.maxWins)return null;
  if(a.firstOk===lv.pins.length||a.firstOk===0)return null;
  for(let j=0;j<lv.gadgets.length;j++){ const t=copy(lv); t.gadgets.splice(j,1); t.gadgets.forEach(g=>{ if(g.after!=null){ if(g.after===j)delete g.after; else if(g.after>j)g.after--; } }); if(winnable(t))return null; }   // every device must matter
  if(lv.gadgets.some(g=>g.after!=null)){ const t=copy(lv); t.gadgets.forEach(g=>delete g.after); const b=audit(t); if(b&&b.wins===a.wins)return null; }   // and so must the order
  return a;
}
/* ---------- search: start from any winnable room plan and keep changing one thing at a time while it gets harder ---------- */
function mutate(lv,rand,loc,cfg){
  const t=copy(lv),R=t.rooms,pick=a=>a[Math.floor(rand()*a.length)],at=(x,y)=>R.find(r=>r.x===x&&r.y===y);
  for(const r of R)r.has=r.has||{};
  const empty=()=>R.filter(r=>!Object.keys(r.has).length),items=()=>R.reduce((n,r)=>n+Object.keys(r.has).length,0);
  const H=[],V=[];for(const r of R){const a=at(r.x+1,r.y),b=at(r.x,r.y+1);if(a)H.push([r.id,a.id]);if(b)V.push([r.id,b.id]);}
  const key=(a,b,d)=>a+">"+b+d,used=new Set(t.pins.map(p=>key(p.a,p.b,p.dir)));
  for(const g of t.gadgets)used.add(key(g.a,g.b,"h")); for(const w of (t.weak||[]))used.add(key(w.a,w.b,"v"));
  const freeH=H.filter(([a,b])=>!used.has(key(a,b,"h"))),freeV=V.filter(([a,b])=>!used.has(key(a,b,"v")));
  const op=Math.floor(rand()*11);
  if(op===0||op>=9){ const src=pick(R.filter(r=>op>=9?(r.has.king||r.has.treasure):Object.keys(r.has).length)),e=empty(); if(!src||!e.length)return null; const k=op>=9?(src.has.king?"king":"treasure"):pick(Object.keys(src.has)),dst=pick(e); dst.has[k]=src.has[k]; delete src.has[k]; }
  else if(op===1){ const e=empty(); if(!e.length||items()>=9)return null; const pool=["lava","lava","water","boulder","tnt","ice","monster"].concat(loc===2?["ghost","ghost","lava"]:loc===1?["water","water"]:["boulder","boulder"]); const k=pick(pool);
    if((k==="monster"||k==="ghost")&&R.filter(r=>r.has.monster||r.has.ghost).length>=2)return null; pick(e).has[k]=1; }
  else if(op===2){ const c=R.filter(r=>Object.keys(r.has).some(k=>!["king","treasure","captive"].includes(k))); if(!c.length||items()<=4)return null; const r=pick(c); delete r.has[pick(Object.keys(r.has).filter(k=>!["king","treasure","captive"].includes(k)))]; }
  else if(op===3||op===4){ const all=freeH.map(x=>[...x,"h"]).concat(freeV.map(x=>[...x,"v"])); if(!all.length)return null; t.pins.splice(Math.floor(rand()*t.pins.length),1); const [a,b,dir]=pick(all); t.pins.push({a,b,dir}); }
  else if(op===5){ t.weak=t.weak||[]; if(t.weak.length&&rand()<.5)t.weak.splice(Math.floor(rand()*t.weak.length),1); else { if(!freeV.length||t.weak.length>=2)return null; const [a,b]=pick(freeV); t.weak.push({a,b}); } }
  else if(op===6){ const g=pick(t.gadgets),c=R.filter(r=>!r.has.lava&&!r.has.water&&!t.gadgets.some(q=>q.c===r.id)); if(!c.length)return null; g.c=pick(c).id; }
  else if(op===7){ if(!freeH.length)return null; const g=pick(t.gadgets),[a,b]=pick(freeH); g.a=a; g.b=b; }
  else { const f=R.filter(r=>r.has.lava||r.has.water); if(!f.length)return null; const r=pick(f),k=r.has.lava?"lava":"water"; r.has[k]=r.has[k]===1?2:1; }
  for(const g of t.gadgets){ const r=R.find(q=>q.id===g.c); if(r.has.lava||r.has.water)return null; }
  for(const r of R)if(!Object.keys(r.has).length)delete r.has;
  if(t.weak&&!t.weak.length)delete t.weak;
  return t;
}
function essential(lv,a){
  let n=0;
  for(let j=0;j<lv.gadgets.length;j++){ const t=copy(lv); t.gadgets.splice(j,1); t.gadgets.forEach(g=>{ if(g.after!=null){ if(g.after===j)delete g.after; else if(g.after>j)g.after--; } }); if(!winnable(t))n++; }
  let order=true;
  if(lv.gadgets.some(g=>g.after!=null)){ const t=copy(lv); t.gadgets.forEach(g=>delete g.after); const b=audit(t); order=!b||b.wins!==a.wins; }
  return{devices:n,order};
}
function score(lv,cfg){
  const a=audit(lv); if(!a)return null;
  const mixed=a.firstOk>0&&a.firstOk<lv.pins.length;
  return{a,value:Math.min(a.shortest,cfg.minPulls+1)*10-Math.log2(1+a.shortestWays)*2.5-a.random*50-Math.max(0,Math.log2(a.wins/cfg.maxWins))*2+(mixed?4:-6)};
}
const passes=(lv,cfg,sc)=>sc.a.shortest>=cfg.minPulls&&sc.a.random<=cfg.maxRandom&&sc.a.wins<=cfg.maxWins&&sc.a.firstOk>0&&sc.a.firstOk<lv.pins.length;
function climb(seed,loc,cfg,steps=2400){
  const rand=rng(seed*7919+loc*104729+cfg.pins*31);
  let lv=null,sc=null;
  for(let k=0;k<80&&!sc;k++){ lv=build(rand,loc,cfg); if(lv)sc=score(lv,cfg); }
  if(!sc)return null;
  const good=(l,s)=>{ if(!passes(l,cfg,s))return false; const e=essential(l,s.a); return e.devices===l.gadgets.length&&e.order; };
  for(let i=0;i<steps;i++){
    const m=mutate(lv,rand,loc,cfg); if(!m)continue;
    const s2=score(m,cfg); if(!s2)continue;
    const heat=5*(1-i/steps);                       // early on, accept a slightly worse plan now and then to get out of dead ends
    if(s2.value<sc.value-heat*rand())continue;
    lv=m;sc=s2;
    if(passes(lv,cfg,sc)&&good(lv,sc))return{level:lv,audit:sc.a};
  }
  return null;
}
/* ---------- composer: build a level out of obstacles that each need dealing with, then let the audit judge it ----------
   The wolf and his dinner sit at opposite ends of the bottom floor. Every cell between them holds something that must be
   dealt with before its walls come down (a hunter, a pool of lava, a ghost, a caged wolf), the supplies for that hang
   above, and one or two walls are device gates. Decoy rooms hold things that ruin dinner if they are let go. */
function compose(rand,loc,cfg){
  const C=cfg.cols,pick=a=>a[Math.floor(rand()*a.length)],chance=p=>rand()<p,ID="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const rooms=[],pins=[],gadgets=[];
  const get=(x,y)=>rooms.find(q=>q.x===x&&q.y===y);
  const room=(x,y,has)=>{ let r=get(x,y); if(!r){ r={id:ID[rooms.length],x,y,has:{}}; rooms.push(r); } Object.assign(r.has,has||{}); return r; };
  const drop=(upper,lower)=>pins.push({a:upper.id,b:lower.id,dir:"v"});
  const flip=chance(.5),X=i=>flip?C-1-i:i,bottom=[];
  for(let i=0;i<C;i++)bottom.push(room(X(i),2));
  const kCell=bottom[0],tCell=bottom[C-1],kind=["gear","bloom","beacon"][loc];
  if(chance(.2))drop(room(kCell.x,1,{king:1}),kCell); else kCell.has.king=1;
  if(chance(.35))drop(room(tCell.x,1,{treasure:1}),tCell); else tCell.has.treasure=1;
  const inner=bottom.slice(1,C-1);let monster=false,ghost=false,dryGhost=null;
  const obst=inner.map(()=>{ const r=rand(); if(!monster&&r<.4){monster=true;return "monster";} if(r<.62)return "lava"; if(!ghost&&r<(loc===2?.92:.72)){ghost=true;return "ghost";} return "empty"; });
  if(cfg.captive)obst[obst.indexOf("empty")>=0?obst.indexOf("empty"):Math.floor(rand()*obst.length)]="captive";
  const gates=[];while(gates.length<Math.min(cfg.devices,C-1)){ const i=Math.floor(rand()*(C-1)); if(!gates.includes(i))gates.push(i); }
  for(let i=0;i<C-1;i++)if(!gates.includes(i))pins.push({a:bottom[i].id,b:bottom[i+1].id,dir:"h"});
  inner.forEach((cell,i)=>{ const o=obst[i];
    if(o==="monster"){ cell.has.monster=1; if(chance(.4)){ const s=room(cell.x,1,{lava:1}); drop(s,cell); drop(room(cell.x,0,{water:1}),s); } else drop(room(cell.x,1,{boulder:1}),cell); }
    else if(o==="lava"){ cell.has.lava=1; drop(room(cell.x,1,{water:1}),cell); }
    else if(o==="ghost"){ cell.has.ghost=1; if(loc===2&&chance(.65))dryGhost=cell; else drop(room(cell.x,1,{water:1}),cell); }
    else if(o==="captive")cell.has.captive=1;
  });
  for(let n=0;n<gates.length;n++){
    const gi=gates[n];let dev;
    const freeCols=bottom.filter(b=>!get(b.x,1)&&!get(b.x,0));
    if(kind==="beacon"&&dryGhost){ dev=dryGhost; const s=room(dev.x,1,{lava:1}); drop(s,dev); drop(room(dev.x,0,{water:1}),s); dryGhost=null; }
    else { if(!freeCols.length)return null; const b=pick(freeCols); dev=room(b.x,1);
      const top=room(b.x,0,kind==="gear"?{boulder:1}:kind==="bloom"?{water:chance(.45)?2:1}:{lava:chance(.3)?2:1}); drop(top,dev);
      if(kind!=="gear"&&chance(.5))drop(dev,b);                                    // what is left over can be sent on down
    }
    const g={kind,c:dev.id,a:bottom[gi].id,b:bottom[gi+1].id}; if(kind==="gear"&&n>0&&cfg.ordered)g.after=n-1; gadgets.push(g);
  }
  if(dryGhost)drop(room(dryGhost.x,1,{water:1}),dryGhost);
  for(let d=0;d<cfg.decoys;d++){
    const spots=bottom.filter(b=>!get(b.x,1)); if(!spots.length)break;
    const b=pick(spots),what=b===tCell?pick(["lava","boulder"]):b===kCell?pick(["lava","water","boulder"]):pick(["lava","water","tnt"]);
    drop(room(b.x,1,{[what]:1}),b);
  }
  if(!rooms.some(r=>r.y===0)){ for(const r of rooms)r.y--; }
  const rows=rooms.some(r=>r.y===2)?3:2;
  for(let i=pins.length-1;i>0;i--){ const j=Math.floor(rand()*(i+1)); [pins[i],pins[j]]=[pins[j],pins[i]]; }
  return{cols:C,rows,rooms:rooms.map(r=>Object.keys(r.has).length?r:{id:r.id,x:r.x,y:r.y}),pins,gadgets};
}
const TIERS=[ {cols:4,pins:[5,6],devices:1,decoys:0,minPulls:4,maxRandom:.12},
  {cols:4,pins:[6,7],devices:1,decoys:1,minPulls:5,maxRandom:.07},
  {cols:5,pins:[6,8],devices:2,ordered:true,decoys:0,minPulls:5,maxRandom:.05},
  {cols:5,pins:[7,8],devices:2,ordered:true,decoys:1,minPulls:6,maxRandom:.03},
  {cols:4,pins:[6,7],devices:1,decoys:1,captive:true,minPulls:5,maxRandom:.05},
  {cols:5,pins:[7,8],devices:2,ordered:true,decoys:1,captive:true,minPulls:6,maxRandom:.025} ];
function make(seed,loc,tier){
  const cfg=TIERS[tier],lv=compose(rng(seed*7919+loc*104729+tier*31),loc,cfg);
  if(!lv||lv.pins.length<cfg.pins[0]||lv.pins.length>cfg.pins[1])return null;
  const a=audit(lv); if(!a||a.shortest<cfg.minPulls||a.random>cfg.maxRandom||a.firstOk===0||a.firstOk===lv.pins.length)return null;
  const e=essential(lv,a); if(e.devices!==lv.gadgets.length||!e.order)return null;
  return{tier,seed,audit:a,level:lv};
}
if(require.main===module){
  const loc=+process.argv[2],secs=+process.argv[3],out=process.argv[4],found=[],seen=new Set(),end=Date.now()+secs*1000;let tried=0;
  for(let seed=1;Date.now()<end;seed++){ const t=seed%TIERS.length; tried++; const r=make(seed,loc,t); if(!r)continue;
    const sig=JSON.stringify(r.level.rooms.map(q=>[q.x,q.y,Object.keys(q.has||{}).join()]).sort()); if(seen.has(sig))continue; seen.add(sig); found.push(r); }
  fs.writeFileSync(out,JSON.stringify(found));
  console.log("location",loc,"tried",tried,"kept",found.length,"by tier",TIERS.map((_,t)=>found.filter(f=>f.tier===t).length).join(","));
}
module.exports={audit,winnable,compose,make,essential,TIERS,newState,pull};
