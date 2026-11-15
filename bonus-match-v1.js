/* Feast Match: 5 unique food-themed six-by-six match-three bonus levels. */
(function(root){
"use strict";
const NAMES=["Roast","Cheese","Apple","Fish","Mushroom","Berries"];
const DRAW=[
 '<ellipse cx="31" cy="38" rx="24" ry="17" fill="#bd522c" stroke="#762f1a" stroke-width="3"/><path d="M12 32 Q30 14 52 33" fill="none" stroke="#faad62" stroke-width="7" stroke-linecap="round"/><path d="M48 34 L60 18" stroke="#fff1d2" stroke-width="7" stroke-linecap="round"/><circle cx="58" cy="15" r="5" fill="#fff1d2"/><circle cx="52" cy="13" r="4" fill="#fff1d2"/>',
 '<path d="M10 27 L48 13 L57 49 L10 55Z" fill="#f4b547" stroke="#a56a1f" stroke-width="3"/><path d="M10 27 L35 35 L57 49 L48 13Z" fill="#ffe792"/><circle cx="30" cy="45" r="4" fill="#e19831"/><circle cx="46" cy="40" r="3" fill="#e19831"/>',
 '<path d="M32 20 C13 5 3 26 13 46 C19 60 35 55 43 54 C61 46 60 14 43 18Z" fill="#f5574a" stroke="#982b2b" stroke-width="3"/><path d="M31 20 Q30 10 37 6" stroke="#6e421f" stroke-width="4" fill="none"/><path d="M34 13 Q47 -2 56 11 Q46 20 34 13Z" fill="#70c75b"/><path d="M17 27 Q19 21 23 21" stroke="#ffcba4" stroke-width="4" fill="none"/>',
 '<path d="M8 34 Q26 9 49 24 L58 16 L58 48 L49 40 Q26 58 8 34Z" fill="#6ac6d6" stroke="#267588" stroke-width="3"/><path d="M19 28 Q28 34 19 42" fill="none" stroke="#dcfdff" stroke-width="4"/><circle cx="17" cy="34" r="3" fill="#14364a"/><path d="M30 22 L38 12 L43 22" fill="#359eaf"/>',
 '<path d="M9 34 C4 9 60 9 56 34 Q44 41 35 35 L35 50 Q30 60 25 50 L25 35 Q14 39 9 34Z" fill="#e5b27e" stroke="#8d5b3e" stroke-width="3"/><path d="M11 31 Q15 9 33 16 Q47 14 54 31Z" fill="#d85d66"/><circle cx="20" cy="26" r="3" fill="#fff0d8"/><circle cx="38" cy="23" r="4" fill="#fff0d8"/><circle cx="45" cy="30" r="3" fill="#fff0d8"/>',
 '<circle cx="30" cy="37" r="19" fill="#9460cb" stroke="#603783" stroke-width="3"/><circle cx="20" cy="31" r="8" fill="#b688ed"/><circle cx="40" cy="36" r="9" fill="#7b48a7"/><path d="M30 21 Q30 9 37 9 M28 18 Q20 6 12 14" stroke="#6daf62" stroke-width="4" fill="none"/><circle cx="22" cy="29" r="3" fill="#fff" opacity=".7"/>'
];
const SVG=DRAW.map(s=>'<svg viewBox="0 0 64 64" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">'+s+'</svg>');
function rng(seed){let x=seed>>>0;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function find(grid){
 const matches=new Set(),runs=[];
 for(let y=0;y<6;y++)for(let x=0;x<6;){
  let end=x+1,v=grid[y*6+x];
  while(v>=0&&end<6&&grid[y*6+end]===v)end++;
  if(end-x>=3){const run=[];for(let j=x;j<end;j++){const i=y*6+j;matches.add(i);run.push(i);}runs.push(run);}
  x=end;
 }
 for(let x=0;x<6;x++)for(let y=0;y<6;){
  let end=y+1,v=grid[y*6+x];
  while(v>=0&&end<6&&grid[end*6+x]===v)end++;
  if(end-y>=3){const run=[];for(let j=y;j<end;j++){const i=j*6+x;matches.add(i);run.push(i);}runs.push(run);}
  y=end;
 }
 return{matches,runs};
}
function possible(grid){
 for(let i=0;i<36;i++)for(const j of [i+1,i+6]){
  if(j>=36||(j===i+1&&i%6===5))continue;
  [grid[i],grid[j]]=[grid[j],grid[i]];
  const valid=find(grid).matches.size>0;
  [grid[i],grid[j]]=[grid[j],grid[i]];
  if(valid)return true;
 }
 return false;
}
function makeGrid(seed){
 for(let attempt=0;attempt<50;attempt++){
  const pick=rng(seed+attempt*977),g=[];
  for(let i=0;i<36;i++){
   const choices=[0,1,2,3,4,5].filter(v=>
    !(i%6>=2&&g[i-1]===v&&g[i-2]===v)&&
    !(i>=12&&g[i-6]===v&&g[i-12]===v));
   g.push(choices[Math.floor(pick()*choices.length)]);
  }
  if(possible(g))return g;
 }
 throw Error("No possible Feast Match starting board");
}
function mount(api){
 const chapter=api.stage.chapter,random=rng(49000+chapter*501);
 let grid=makeGrid(5541+chapter*743),selected=null,turns=26+chapter*3,
  target=12+chapter*4,score=0,busy=false,alive=true,powers=new Set();
 api.instructions("Swap neighboring foods to match three or more. Four in a row creates a Wolf Howl that clears nine spaces!");
 api.message("Match the wolf's favorite foods. Bigger combos fill his dinner tray faster.");
 const draw=()=>{
  if(!alive)return;
  api.hud.innerHTML='<span><strong>Dinner tray: '+score+' / '+target+'</strong></span><span><strong>Moves: '+turns+'</strong></span>';
  api.play.innerHTML='<div class="fw-food-grid" role="grid" aria-label="Six-by-six food matching grid">'+
   grid.map((food,i)=>'<button type="button" class="fw-food-tile'+(selected===i?' selected':'')+
    (powers.has(i)?' power':'')+'" data-food="'+i+'" aria-label="Row '+(Math.floor(i/6)+1)+
    ', column '+(i%6+1)+': '+(food>=0?NAMES[food]:'Empty')+'">'+
    (food>=0?SVG[food]:'')+(powers.has(i)?'<span class="fw-howl">HOWL</span>':'')+
    '</button>').join('')+'</div>';
 };
 const wait=(ms)=>new Promise(r=>setTimeout(r,ms));
 async function cascade(removed,large,focus){
  let chain=0;
  while(alive&&removed.size&&chain<12){
   score+=removed.size;
   for(const i of removed){grid[i]=-1;powers.delete(i);}
   api.message((chain?"Combo x"+(chain+1)+"! ":"")+removed.size+" ingredients served!");
   draw();await wait(140);if(!alive)return;
   for(let col=0;col<6;col++){
    const keep=[];
    for(let row=5;row>=0;row--)if(grid[row*6+col]>=0)keep.push(grid[row*6+col]);
    while(keep.length<6)keep.push(Math.floor(random()*6));
    for(let row=5;row>=0;row--)grid[row*6+col]=keep[5-row];
   }
   if(large&&chain===0)powers.add(Number.isInteger(focus)?focus:Math.floor(random()*36));
   draw();await wait(150);if(!alive)return;
   const res=find(grid);removed=res.matches;large=res.runs.some(g=>g.length>=4);
   chain++;
  }
  if(!alive)return;
  if(score>=target){api.win();return;}
  if(turns<=0){api.lose("The dinner tray is not full yet. Try a new strategy, or skip this bonus.");return;}
  if(!possible(grid)&&!powers.size){
   grid=makeGrid(97000+Math.floor(random()*100000));api.message("New ingredients shuffled into the kitchen!");
  }
  busy=false;draw();
 }
 function play(index){
  if(!alive||busy)return;
  if(powers.has(index)){
   powers.delete(index);turns--;busy=true;selected=null;
   const removed=new Set();
   for(let y=Math.max(0,Math.floor(index/6)-1);y<=Math.min(5,Math.floor(index/6)+1);y++)
    for(let x=Math.max(0,index%6-1);x<=Math.min(5,index%6+1);x++)removed.add(y*6+x);
   api.sound(true);cascade(removed,false);return;
  }
  if(selected===null){selected=index;draw();return;}
  const from=selected;selected=null;
  if(!(Math.abs(from-index)===6||(Math.floor(from/6)===Math.floor(index/6)&&Math.abs(from-index)===1))){
   selected=index;api.message("Choose an adjacent food tile.");draw();return;
  }
  [grid[from],grid[index]]=[grid[index],grid[from]];
  const found=find(grid);
  if(found.matches.size===0){
   [grid[from],grid[index]]=[grid[index],grid[from]];
   api.sound(false);api.message("That swap doesn't make three. Try another.");draw();return;
  }
  turns--;busy=true;api.sound(true);
  cascade(found.matches,found.runs.some(g=>g.length>=4),index);
 }
 const click=e=>{const cell=e.target.closest("[data-food]");if(cell)play(Number(cell.dataset.food));};
 api.play.addEventListener("click",click);
 draw();
 return{destroy(){alive=false;api.play.removeEventListener("click",click);},preview:()=>({grid:grid.slice(),score,turns})};
}
root.FTWBonus.register("match",mount);
root.FTWMatchRules=Object.freeze({find,possible,makeGrid});
})(typeof window!=="undefined"?window:{});
