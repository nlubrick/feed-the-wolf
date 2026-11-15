/* Pantry Panic: five genuine rotating-pipe puzzles, one per themed location. */
(function(root){
"use strict";
const PATHS=[
 [[2,0],[2,1],[2,2],[2,3],[2,4]],
 [[2,0],[2,1],[1,1],[1,2],[1,3],[2,3],[2,4]],
 [[2,0],[2,1],[3,1],[3,2],[3,3],[2,3],[2,4]],
 [[2,0],[1,0],[1,1],[1,2],[2,2],[3,2],[3,3],[3,4],[2,4]],
 [[2,0],[2,1],[1,1],[1,2],[0,2],[0,3],[1,3],[1,4],[2,4]]
];
const DIR=[[-1,0],[0,1],[1,0],[0,-1]];
function direction(a,b){return DIR.findIndex(d=>a[0]+d[0]===b[0]&&a[1]+d[1]===b[1]);}
function mask(path,i){
 const prev=path[i-1],next=path[i+1],cur=path[i];
 const incoming=prev?direction(cur,prev):3;
 const outgoing=next?direction(cur,next):1;
 if(incoming<0||outgoing<0)throw Error("Non-adjacent pantry route");
 return(1<<incoming)|(1<<outgoing);
}
function rotate(m){return((m<<1)&15)|((m>>3)&1);}
function trace(grid){
 let row=2,col=0,enter=3,trail=[],visited=new Set();
 for(let i=0;i<26;i++){
  if(row<0||row>4||col<0||col>4)return{win:false,trail,reason:"The soup escaped the kitchen!"};
  const cell=row*5+col,m=grid[cell];trail.push(cell);
  if(visited.has(cell))return{win:false,trail,reason:"The soup is running in circles."};
  visited.add(cell);
  if(!(m&(1<<enter)))return{win:false,trail,reason:"An open pipe is missing. Rotate a piece to connect it."};
  const exits=[0,1,2,3].filter(d=>d!==enter&&(m&(1<<d)));
  if(exits.length!==1)return{win:false,trail,reason:"Find a pipe with a single open exit."};
  const exit=exits[0];
  if(row===2&&col===4&&exit===1)return{win:true,trail,reason:"The soup has reached the wolf!"};
  row+=DIR[exit][0];col+=DIR[exit][1];enter=(exit+2)%4;
 }
 return{win:false,trail,reason:"The path is caught in a loop."};
}
function seeded(seed){let x=seed>>>0;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function create(chapter){
 const path=PATHS[chapter],r=seeded(99671+chapter*301);
 const solution=new Array(25).fill(null);
 path.forEach((pt,i)=>solution[pt[0]*5+pt[1]]=mask(path,i));
 const initial=solution.map(m=>{
  if(m===null){let result=r()<.5?5:3;for(let j=0;j<Math.floor(r()*4);j++)result=rotate(result);return result;}
  let result=m,turns=1+Math.floor(r()*3);
  while(turns--)result=rotate(result);
  return result;
 });
 return{solution,initial,path};
}
function tileSVG(m,flowing){
 let arms="";
 for(let i=0;i<4;i++)if(m&(1<<i)){
  const [x,y]=[[32,3],[61,32],[32,61],[3,32]][i];
  arms+='<path d="M32 32 L'+x+' '+y+'" fill="none" stroke="'+
   (flowing?"#8be3b5":"#c2a27e")+'" style="stroke:var('+(flowing?"--fw-flow-out":"--fw-pipe")+')" stroke-width="20" stroke-linecap="round"/>'+
   '<path d="M32 32 L'+x+' '+y+'" fill="none" stroke="'+
   (flowing?"#65c9e4":"#4b4d74")+'" style="stroke:var('+(flowing?"--fw-flow":"--fw-pipe-in")+')" stroke-width="12" stroke-linecap="round"/>';
 }
 return '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'+
  '<rect x="1" y="1" width="62" height="62" rx="13" fill="#252039" stroke="#846986" style="fill:var(--fw-pipe-bg);stroke:var(--fw-accent-dark)" stroke-width="2"/>'+
  arms+'<circle cx="32" cy="32" r="10" fill="'+(flowing?"#c9fbed":"#e0c298")+
  '" stroke="#68566d" stroke-width="3"/></svg>';
}
function mount(api){
 const config=create(api.stage.chapter),grid=config.initial.slice();
 let turns=0,lit=[],alive=true,passed=false;
 api.instructions("Rotate the pipes to deliver a warm bowl of soup. Tap any piece to turn it 90 degrees; press Test Flow to pour.");
 api.message("Start at the pot on the left. Reach the wolf's bowl on the right!");
 function draw(){
  if(!alive)return;
  api.hud.innerHTML='<span><b>Rotations: '+turns+'</b></span>'+
   '<button type="button" class="fw-pipe-test" data-flow-test>Test Flow</button>';
  const ends=root.FTWBonusThemes?root.FTWBonusThemes.pipes(api.stage.chapter):null;
  api.play.innerHTML='<div class="fw-pipe-labels"><span>'+(ends?ends.from.toUpperCase():"SOUP POT")+' \u25B6</span><span>\u25B6 WOLF\'S BOWL</span></div>'+
   '<div class="fw-pipe-wrap'+(ends?' fw-pipe-ends':'')+'">'+(ends?'<div class="fw-pipe-end">'+ends.pot+'</div>':'')+
   '<div class="fw-pipe-grid" role="grid" aria-label="Five by five rotating pipe puzzle">'+
   grid.map((m,i)=>'<button type="button" class="fw-pipe-tile'+(lit.includes(i)?' flowing':'')+
   '" data-pipe="'+i+'" aria-label="Rotate pipe row '+(Math.floor(i/5)+1)+
   ' column '+(i%5+1)+'">'+tileSVG(m,lit.includes(i))+'</button>').join('')+'</div>'+
   (ends?'<div class="fw-pipe-end">'+ends.bowl+'</div>':'')+'</div>'+
   '<p class="fw-pipe-caption">The entire soup route must connect from the left pot to the right bowl. Every tap rotates one joint.</p>';
 }
 function click(e){
  if(passed)return;
  const btn=e.target.closest("[data-flow-test]");
  if(btn){
   const result=trace(grid);lit=result.trail;api.message(result.reason);draw();
   if(result.win){passed=true;api.sound(true);api.win();}
   else api.sound(false);
   return;
  }
  const tile=e.target.closest("[data-pipe]");if(!tile)return;
  const i=Number(tile.dataset.pipe);
  grid[i]=rotate(grid[i]);turns++;lit=[];
  api.tone(330+(i%5)*40,.07);api.message("Turned a pipe. Test the flow when you are ready.");
  draw();
 }
 api.play.addEventListener("click",click);draw();
 return{destroy(){alive=false;api.play.removeEventListener("click",click);},preview:()=>grid.slice()};
}
root.FTWBonus.register("pipes",mount);
root.FTWPipesRules=Object.freeze({PATHS,create,trace,mask,rotate});
})(typeof window!=="undefined"?window:{});
