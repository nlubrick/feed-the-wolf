/* Dinner Detective: five illustrated seek-and-find stages, one per location. */
(function(root){
"use strict";
const shapes=[
{id:"roast",name:"Roast",shape:'<ellipse cx="31" cy="38" rx="24" ry="17" fill="#b6532d" stroke="#682917" stroke-width="3"/><path d="M14 33 Q30 16 49 35" stroke="#f8aa59" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M49 34 L58 15" stroke="#fff4dd" stroke-width="7" fill="none"/><circle cx="58" cy="13" r="5" fill="#fff4dd"/>'},
{id:"cheese",name:"Cheese",shape:'<path d="M10 28 L48 12 L57 50 L11 54Z" fill="#f5b941" stroke="#b56a23" stroke-width="3"/><path d="M10 28 L37 35 L57 50 L48 12Z" fill="#ffe790"/><circle cx="34" cy="43" r="4" fill="#db8c2f"/><circle cx="47" cy="37" r="3" fill="#e6a43c"/>'},
{id:"apple",name:"Apple",shape:'<path d="M30 17 C12 8 6 25 14 45 Q24 61 37 54 Q54 60 57 35 Q56 14 39 17Z" fill="#ec594d" stroke="#a32a2e" stroke-width="3"/><path d="M32 20 Q34 10 38 8" stroke="#74522f" stroke-width="4" fill="none"/><path d="M34 15 Q51 -4 57 11 Q47 18 34 15Z" fill="#69ae54"/>'},
{id:"fish",name:"Fish",shape:'<path d="M8 33 Q22 8 48 25 L58 15 L58 50 L48 40 Q22 58 8 33Z" fill="#65bed2" stroke="#276e83" stroke-width="3"/><circle cx="19" cy="31" r="3" fill="#234252"/><path d="M28 25 L35 13 L41 24" fill="#399baa" stroke="#276e83" stroke-width="2"/>'},
{id:"mushroom",name:"Mushroom",shape:'<path d="M9 34 C8 11 58 8 56 34 Q47 41 36 35 L36 50 Q30 61 24 50 L24 35 Q17 39 9 34Z" fill="#dbaf83" stroke="#956047" stroke-width="3"/><path d="M11 31 Q15 8 34 15 Q48 12 54 31Z" fill="#d25d6b"/><circle cx="19" cy="25" r="4" fill="#ffe6cc"/><circle cx="42" cy="24" r="4" fill="#ffe6cc"/>'},
{id:"berries",name:"Berries",shape:'<circle cx="30" cy="38" r="18" fill="#9861c9" stroke="#583487" stroke-width="3"/><circle cx="19" cy="31" r="8" fill="#b88fe8"/><circle cx="40" cy="37" r="8" fill="#7e4cae"/><path d="M30 20 Q28 6 36 8 M29 17 Q17 9 14 15" stroke="#6aaf61" stroke-width="4" fill="none"/>'},
{id:"key",name:"Brass key",shape:'<circle cx="19" cy="21" r="11" fill="none" stroke="#f0ce71" stroke-width="8"/><path d="M27 29 L52 53 M44 45 L50 38 M49 50 L55 43" fill="none" stroke="#b78039" stroke-width="7" stroke-linecap="round"/>'},
{id:"gear",name:"Cogwheel",shape:'<path d="M26 4 H38 L41 15 L49 18 L56 12 L62 23 L54 31 L53 40 L61 47 L54 57 L43 53 L37 60 H25 L21 51 L12 48 L5 54 L2 42 L10 35 L9 26 L2 20 L10 10 L20 16Z" fill="#c79b6d" stroke="#75533c" stroke-width="3"/><circle cx="32" cy="33" r="12" fill="#34263e" stroke="#ead2a7" stroke-width="3"/>'},
{id:"flower",name:"Moon flower",shape:'<path d="M30 57 L32 25" stroke="#629a59" stroke-width="6"/><path d="M32 40 Q15 26 15 44 Q27 48 32 40Z" fill="#7cc782"/><g fill="#b99de7" stroke="#785ba9" stroke-width="2"><ellipse cx="32" cy="14" rx="8" ry="13"/><ellipse cx="32" cy="14" rx="8" ry="13" transform="rotate(72 32 25)"/><ellipse cx="32" cy="14" rx="8" ry="13" transform="rotate(144 32 25)"/><ellipse cx="32" cy="14" rx="8" ry="13" transform="rotate(216 32 25)"/><ellipse cx="32" cy="14" rx="8" ry="13" transform="rotate(288 32 25)"/></g><circle cx="32" cy="25" r="7" fill="#ffe498"/>'},
{id:"scroll",name:"Recipe scroll",shape:'<path d="M12 10 Q8 15 14 21 L14 49 Q18 61 30 55 L51 55 L51 14 Q47 7 41 9Z" fill="#f2deb3" stroke="#967f5e" stroke-width="3"/><path d="M19 25 H43 M19 32 H39 M19 39 H45 M19 46 H34" stroke="#9a8155" stroke-width="2"/><circle cx="17" cy="12" r="6" fill="#d0a976"/>'},
{id:"lantern",name:"Lantern",shape:'<path d="M24 15 Q21 0 33 2 Q46 3 41 15" fill="none" stroke="#cda05c" stroke-width="4"/><path d="M22 19 L42 19 L51 51 L13 51Z" fill="#ffce79" fill-opacity=".7" stroke="#ae8145" stroke-width="4"/><path d="M22 25 H42 M14 52 H50" stroke="#e9b864" stroke-width="5"/><path d="M33 45 Q22 37 32 25 Q40 34 33 45" fill="#fff2ae"/>'},
{id:"mask",name:"Theatre mask",shape:'<path d="M9 15 Q32 2 55 15 L51 45 Q32 60 18 46Z" fill="#e7dbf1" stroke="#886daf" stroke-width="3"/><ellipse cx="23" cy="29" rx="8" ry="5" fill="#32274b"/><ellipse cx="43" cy="29" rx="8" ry="5" fill="#32274b"/><path d="M23 42 Q32 51 42 42" fill="none" stroke="#886daf" stroke-width="3"/>'}
];
/* What to find in each location: four things in the Castle, eight in the Theatre. */
const targets=[
["roast","cheese","key","apple"],
["scroll","berries","mushroom","key","fish"],
["gear","fish","lantern","cheese","mask","apple"],
["flower","apple","berries","scroll","gear","roast","key"],
["mask","lantern","roast","flower","mushroom","cheese","scroll","fish"]];
/* Seconds on the clock, and how well things are hidden (0 = plain sight, 4 = small, faded, tucked behind clutter). */
const SECONDS=[100,90,80,75,70],MISS_COST=5,HINT_COST=10;
const coords=[[85,110],[198,148],[345,100],[543,143],[111,274],[249,294],[414,246],[555,313],[334,327],[471,360],[619,235],[175,366]];
const palettes=[
["#393258","#5d4e79","#a98263","#eaba88"],
["#212954","#4a3d7c","#976982","#9a95de"],
["#382c35","#6b4f3d","#bb8856","#ebc783"],
["#21473f","#356e5f","#73b49a","#e3efc6"],
["#241a3a","#55345a","#b98191","#e9c49b"]];
function scene(chapter,found){
 const [wall,edge,wood,light]=palettes[chapter];
 const room=root.FTWBonusThemes?root.FTWBonusThemes.room(chapter):null;
 const clutter=room&&root.FTWBonusThemes.clutter?root.FTWBonusThemes.clutter(chapter):{back:"",front:""};
 let s=room?'<svg class="fw-detective-scene fw-camo-'+chapter+'" viewBox="0 0 700 460" role="group" aria-label="Illustrated room with hidden objects" xmlns="http://www.w3.org/2000/svg">'+
  (room.photo?'<image href="'+room.photo+'" width="700" height="460" preserveAspectRatio="xMidYMid slice"/>':room.art())+clutter.back:'<svg class="fw-detective-scene" viewBox="0 0 700 460" role="group" aria-label="Illustrated room with hidden objects" xmlns="http://www.w3.org/2000/svg">'+
 '<defs><linearGradient id="fwwall" x2="0" y2="1"><stop stop-color="'+edge+'"/><stop offset="1" stop-color="'+wall+'"/></linearGradient></defs>'+
 '<rect width="700" height="460" rx="22" fill="url(#fwwall)"/>'+
 '<path d="M24 0V460 M120 0V460 M245 0V460 M372 0V460 M497 0V460 M625 0V460" stroke="#fff" stroke-opacity=".07" stroke-width="4"/>'+
 '<path d="M10 88H690 M10 187H690" stroke="#fff" stroke-opacity=".07" stroke-width="6"/>'+
 '<path d="M461 69 Q461 -5 545 -5 Q630 -5 630 69 V203 H461Z" fill="#1a2335" stroke="'+wood+'" stroke-width="10"/>'+
 '<path d="M467 174 L626 8 M468 81 L622 194" stroke="#a0a6b8" stroke-opacity=".4" stroke-width="7"/>'+
 '<ellipse cx="545" cy="59" rx="27" ry="31" fill="'+light+'" opacity=".82"/>'+
 '<rect x="33" y="183" width="612" height="16" rx="6" fill="'+wood+'" stroke="#5b3c33" stroke-width="5"/>'+
 '<rect x="35" y="328" width="610" height="18" rx="5" fill="'+wood+'" stroke="#5b3c33" stroke-width="5"/>'+
 '<rect x="43" y="343" width="22" height="102" rx="5" fill="'+wood+'"/>'+
 '<rect x="614" y="343" width="23" height="102" rx="5" fill="'+wood+'"/>'+
 '<path d="M12 428 Q250 405 421 428 Q570 413 692 427 V460 H12Z" fill="#191324" opacity=".4"/>'+
 '<rect x="88" y="74" width="111" height="85" rx="14" fill="#11182c" opacity=".33" stroke="#fff" stroke-opacity=".2" stroke-width="6"/>'+
 '<path d="M115 74 Q138 41 164 74" fill="none" stroke="'+light+'" stroke-width="7"/>'+
 '<path d="M335 212V303 M330 215 Q352 205 369 221 L385 272 H314Z" fill="'+light+'" opacity=".53"/>'+
 '<ellipse cx="349" cy="309" rx="36" ry="9" fill="#20151d" opacity=".5"/>'+
 '<g fill="'+light+'" fill-opacity=".26"><circle cx="59" cy="35" r="6"/><circle cx="251" cy="54" r="7"/><circle cx="641" cy="350" r="5"/></g>';
 shapes.forEach((item,i)=>{
  // Each location has its own room, and things sit on that room's shelves, tables and floor.
  const pt=room?room.spots[(i*5+chapter*3)%12]:coords[i],x=room?pt[0]:pt[0]+(chapter%2?(i%2?10:-10):0),y=pt[1];
  const complete=found.has(item.id);
  s+='<g class="fw-detective-item'+(complete?' found':'')+'" role="button" tabindex="0"'+
   ' data-object="'+item.id+'" aria-label="'+item.name+(complete?' found':'')+'" '+
   'transform="translate('+x+' '+y+')">'+
   '<circle r="'+(room?30:39)+'" fill="transparent" class="fw-detective-hit"/>'+
   '<g class="fw-detective-art" transform="'+(room?'translate(0 '+(27-27*(.95-chapter*.03)).toFixed(1)+') rotate('+(((i*37+chapter*53)%50)-25)+') scale('+(.95-chapter*.03).toFixed(2)+') ':'')+'translate(-27 -27) scale(.85)">'+((root.FTWBonusThemes&&root.FTWBonusThemes.iconBody(item.id))||item.shape)+'</g>'+
   (complete?'<circle r="32" fill="none" stroke="#9bf6ba" stroke-width="5" stroke-dasharray="6 5"/>':'')+
   '</g>';
 });
 return s+(clutter.front?'<g pointer-events="none">'+clutter.front+'</g>':'')+'</svg>';
}
function mount(api){
 const c=api.stage.chapter,find=targets[c],found=new Set();
 let wrong=0,alive=true,left=SECONDS[c],over=false;
 api.instructions("Find everything on the list before the clock runs out. Things are tucked in among the clutter. A wrong tap costs "+MISS_COST+" seconds.");
 api.message("The wolf has lost "+find.length+" things in this room. Look closely!");
 const clock=()=>{const el=api.hud.querySelector("[data-clock]");if(el){el.textContent=Math.max(0,Math.ceil(left))+"s";el.classList.toggle("low",left<=15);}};
 const timer=setInterval(()=>{if(!alive||over)return;left-=.25;clock();if(left<=0){over=true;api.sound(false);api.lose("Time ran out with "+(find.length-found.size)+" still hidden. Swipe the room from end to end, and check behind the jars and boxes.");}},250);
 function miss(text){wrong++;left-=MISS_COST;clock();api.message(text);api.sound(false);const sc=api.play.querySelector("svg");if(sc){sc.classList.remove("fw-miss");void sc.getBoundingClientRect();sc.classList.add("fw-miss");}}
 function draw(){
  if(!alive)return;
  api.hud.innerHTML='<div class="fw-detective-list"><b class="fw-detective-clock" data-clock></b> '+find.map(id=>{
   const obj=shapes.find(o=>o.id===id);
   return '<span class="'+(found.has(id)?' done':'')+'">'+obj.name+(found.has(id)?' ✓':'')+'</span>';
  }).join('')+'<button type="button" class="fw-detective-hint" data-hint>Hint \u2212'+HINT_COST+'s</button></div>';
  const old=api.play.querySelector?api.play.querySelector(".fw-detective-pan"):null,at=old?old.scrollLeft:-1;
  api.play.innerHTML='<p class="fw-pan-tip">\u2194 Swipe sideways to look around the room</p><div class="fw-detective-pan">'+scene(c,found)+'</div>';clock();
  const pan=api.play.querySelector?api.play.querySelector(".fw-detective-pan"):null;      // keep the view where it was; start in the middle
  if(pan)pan.scrollLeft=at>=0?at:Math.max(0,(pan.scrollWidth-pan.clientWidth)/2);
 }
 function choose(id){
  if(!alive||over||found.has(id))return;
  const obj=shapes.find(o=>o.id===id);if(!obj)return;
  if(!find.includes(id)){miss("That's the "+obj.name.toLowerCase()+". Not on the list: "+MISS_COST+" seconds lost.");return;}
  found.add(id);api.sound(true);
  api.message("Found the "+obj.name.toLowerCase()+"! "+(find.length-found.size)+" more to go.");
  draw();
  if(found.size===find.length){over=true;api.win();}
 }
 function hint(){
  if(!alive||over)return;
  const id=find.find(t=>!found.has(t)),el=id&&api.play.querySelector('[data-object="'+id+'"]');if(!el)return;
  if(el.scrollIntoView)el.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"});
  left-=HINT_COST;clock();el.classList.add("fw-hinted");api.tone(880,.2);
  api.message("Look where it is glowing. "+HINT_COST+" seconds spent.");
  setTimeout(()=>el.classList.remove("fw-hinted"),1800);
 }
 function click(e){
  const item=e.target.closest("[data-object]");
  if(e.target.closest("[data-hint]")){hint();return;}
  if(item)choose(item.dataset.object);
  else if(!over&&e.target.closest(".fw-detective-scene"))miss("Nothing there. "+MISS_COST+" seconds lost.");
 }
 function key(e){
  if(e.key!=="Enter"&&e.key!==" ")return;
  const item=e.target.closest("[data-object]");if(!item)return;
  e.preventDefault();choose(item.dataset.object);
 }
 api.play.addEventListener("click",click);api.play.addEventListener("keydown",key);api.hud.addEventListener("click",click);
 draw();
 return{destroy(){alive=false;clearInterval(timer);api.hud.removeEventListener("click",click);api.play.removeEventListener("click",click);api.play.removeEventListener("keydown",key);},
  preview:()=>({targets:find.slice(),found:Array.from(found),wrong,left})};
}
root.FTWBonus.register("hidden",mount);
root.FTWHiddenRules=Object.freeze({shapes,targets,scene,SECONDS,MISS_COST});
})(typeof window!=="undefined"?window:{});
