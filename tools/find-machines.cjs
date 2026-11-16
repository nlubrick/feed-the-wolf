/* Searches for Dinner Machine layouts: enough tilt combinations that work to be fair, few enough to need thought.
   Usage: node tools/find-machines.cjs  (prints two layouts to paste between LEVELS-START and LEVELS-END) */
"use strict";const W=360;
const fs=require("fs"),path=require("path"),vm=require("vm");
const window={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,"..","bonus-arcade-b-v1.js"),"utf8"),{window});
const R=window.FTWChainRules;
function rng(seed){let x=seed>>>0;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function combos(n){const out=[];const go=a=>{if(a.length===n){out.push(a.slice());return;}for(let i=0;i<5;i++){a.push(i);go(a);a.pop();}};go([]);return out;}
function find(n,lo,hi,seed){
 const r=rng(seed),all=combos(n);let best=null;
 for(let tries=0;tries<(n>3?1600:2500);tries++){
  const planks=[];for(let i=0;i<n;i++)planks.push([Math.round((i%2?205:75)+r()*80),Math.round(92+i*(200/n)+r()*20),n>3?76:84]);
  const pegs=[];for(let i=0;i<(n>3?2:1);i++)pegs.push([Math.round(40+r()*280),Math.round(110+r()*200),12]);
  const bell=[Math.round(40+r()*280),Math.round(150+r()*130),15],bowl=[Math.round(110+r()*140),376,n>3?50:54],hw=bowl[2]/2;
  const walls=[[44,318,bowl[0]-hw-2,346],[W-44,318,bowl[0]+hw+2,346]];
  
  if(planks.some(p=>Math.hypot(p[0]-bell[0],p[1]-bell[1])<56)||pegs.some(p=>Math.hypot(p[0]-bell[0],p[1]-bell[1])<40||planks.some(q=>Math.hypot(p[0]-q[0],p[1]-q[1])<52)))continue;
  const level={ball:[60,34],planks,pegs,walls,bell,bowl,start:planks.map(()=>2)};
  if(R.simulate(level,level.start).win)continue;
  const wins=all.filter(c=>{const o=R.simulate(level,c);return o.win&&o.t>2.2&&o.t<9;});
  if(wins.length<lo||wins.length>hi)continue;
  // every plank should matter: the winning sets must not all share... rather, each plank must vary the outcome
  const matters=planks.every((_,i)=>new Set(wins.map(c=>c[i])).size<5);
  const dist=Math.min(...wins.map(c=>c.reduce((t,v)=>t+Math.abs(v-2),0)));
  if(!matters||dist<2)continue;
  const score=dist*3-Math.abs(wins.length-(lo+hi)/2);
  if(!best||score>best.score)best={score,level,wins:wins.length,dist,sample:wins[0]};
 }
 return best;
}
const a=find(3,7,16,11),b=find(4,6,50,23);
for(const x of [a,b])if(!x)console.log("none");else console.log(JSON.stringify(x.level).replace(/"/g,""),"// wins",x.wins,"min taps",x.dist,"e.g.",x.sample.join(""));
