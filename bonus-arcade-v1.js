/* Feed the Wolf skill games, part one: the shared canvas kit, Dinner Dash, Catch the Feast and Gear Jump.
   These are played with the thumb, in real time: nothing here is decided before you touch the screen. */
(function(root){
"use strict";
const W=360,H=420,TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
function rng(seed){let x=seed>>>0;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
/* One canvas, sized for the phone, with a steady game loop, pointer input in game units, particles, pop-up text and screen shake. */
function kit(api,game){
 const doc=root.document,cv=doc.createElement("canvas"),ctx=cv.getContext("2d");
 cv.className="fw-arcade-canvas";cv.setAttribute("role","img");cv.setAttribute("aria-label",game.label||"Mini-game");
 api.play.innerHTML="";api.play.appendChild(cv);
 let scale=1,alive=true,last=0,raf=0,shake=0,time=0,ended=false;
 const parts=[],pops=[],imgs={};
 function fit(){const w=cv.clientWidth||W,d=Math.min(3,root.devicePixelRatio||1);scale=w/W;cv.width=Math.round(W*scale*d);cv.height=Math.round(H*scale*d);ctx.setTransform(cv.width/W,0,0,cv.height/H,0,0);}
 const pos=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H];};
 const down=e=>{e.preventDefault();try{cv.setPointerCapture(e.pointerId);}catch(x){}const p=pos(e);K.held=true;K.px=p[0];K.py=p[1];if(game.down)game.down(p[0],p[1]);};
 const move=e=>{const p=pos(e);K.px=p[0];K.py=p[1];if(K.held&&game.move)game.move(p[0],p[1]);};
 const up=e=>{if(!K.held)return;K.held=false;const p=pos(e);if(game.up)game.up(p[0],p[1]);};
 cv.addEventListener("pointerdown",down);cv.addEventListener("pointermove",move);cv.addEventListener("pointerup",up);cv.addEventListener("pointercancel",up);
 root.addEventListener("resize",fit);
 function frame(now){
  if(!alive)return;raf=root.requestAnimationFrame(frame);
  const dt=Math.min(.034,(now-last)/1000||0);last=now;if(doc.hidden)return;
  time+=dt;game.update(dt,time);
  for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.t-=dt;if(p.t<=0){parts.splice(i,1);continue;}p.vy+=(p.g||0)*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}
  for(let i=pops.length-1;i>=0;i--){pops[i].t-=dt;pops[i].y-=30*dt;if(pops[i].t<=0)pops.splice(i,1);}
  ctx.save();if(shake>0){shake=Math.max(0,shake-dt*22);ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);}
  game.draw(ctx,time);ctx.restore();
 }
 const K={W,H,ctx,cv,held:false,px:W/2,py:H/2,
  /* particles in game units; pass ox/oy when the game scrolls */
  burst(x,y,col,n=10,sp=120,g=260){for(let i=0;i<n;i++){const a=Math.random()*TAU,v=sp*(.3+Math.random()*.7);parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-sp*.3,g,t:.35+Math.random()*.4,col,r:1.5+Math.random()*2.5});}},
  drawParts(ox=0,oy=0){for(const p of parts){ctx.globalAlpha=Math.min(1,p.t*3);ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x-ox,p.y-oy,p.r,0,TAU);ctx.fill();}ctx.globalAlpha=1;
   ctx.textAlign="center";ctx.font="800 15px system-ui,sans-serif";for(const p of pops){ctx.globalAlpha=Math.min(1,p.t*2.5);ctx.lineWidth=3;ctx.strokeStyle="#000a";ctx.strokeText(p.text,p.x-ox,p.y-oy);ctx.fillStyle=p.col;ctx.fillText(p.text,p.x-ox,p.y-oy);}ctx.globalAlpha=1;},
  pop(x,y,text,col="#ffe9a8"){pops.push({x,y,text,col,t:.9});},
  shake(n=8){shake=Math.max(shake,n);},
  img(key,src){if(!imgs[key]&&src){const im=new root.Image();im.src=src;imgs[key]=im;}const im=imgs[key];return im&&im.complete&&im.naturalWidth?im:null;},
  wolf(mood){return api.wolf?K.img("wolf-"+mood,api.wolf(mood)):null;},
  icon(id){const t=root.FTWBonusThemes,body=t&&t.iconBody(id);return body?K.img("icon-"+id,"data:image/svg+xml;charset=utf-8,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 68 68" width="136" height="136">'+body+'</svg>')):null;},
  /* draws the player's own wolf standing on (x,y), about `h` tall */
  drawWolf(mood,x,y,h=46,flip=1,rot=0,alpha=1){const im=K.wolf(mood)||K.wolf("idle");ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.rotate(rot);ctx.scale(flip,1);
   if(im){const w=h*im.naturalWidth/im.naturalHeight;ctx.drawImage(im,-w/2,-h,w,h);}else{ctx.fillStyle="#9aa3c0";ctx.beginPath();ctx.arc(0,-h/2,h/2.4,0,TAU);ctx.fill();}ctx.restore();},
  drawIcon(id,x,y,s=30,rot=0){const im=K.icon(id);ctx.save();ctx.translate(x,y);ctx.rotate(rot);if(im)ctx.drawImage(im,-s/2,-s/2,s,s);else{ctx.fillStyle="#f4b860";ctx.beginPath();ctx.arc(0,0,s/3,0,TAU);ctx.fill();}ctx.restore();},
  hearts(n,extra){const key=n+"|"+extra;if(key===K._hud)return;K._hud=key;api.hud.innerHTML='<div class="fw-arc-hud"><span class="fw-arc-hearts" aria-label="'+n+' lives">'+"♥".repeat(Math.max(0,n))+'</span><b>'+extra+'</b></div>';},
  /* big centred caption with a dim panel: "Tap to start" and the like */
  banner(title,sub){ctx.fillStyle="rgba(10,6,20,.62)";ctx.fillRect(0,H/2-52,W,104);ctx.textAlign="center";ctx.fillStyle="#ffe9a8";ctx.font="800 24px system-ui,sans-serif";ctx.fillText(title,W/2,H/2-8);
   if(sub){ctx.fillStyle="#f6e9dc";ctx.font="600 14px system-ui,sans-serif";ctx.fillText(sub,W/2,H/2+20);}},
  /* finish after the last animation has had time to play */
  end(win,msg,delay=900){if(ended)return;ended=true;api.sound(win);root.setTimeout(()=>{if(alive){if(win)api.win();else api.lose(msg);}},delay);},
  get over(){return ended;},
  destroy(){alive=false;root.cancelAnimationFrame(raf);root.removeEventListener("resize",fit);cv.removeEventListener("pointerdown",down);cv.removeEventListener("pointermove",move);cv.removeEventListener("pointerup",up);cv.removeEventListener("pointercancel",up);}
 };
 fit();raf=root.requestAnimationFrame(t=>{last=t;frame(t);});
 if(cv.scrollIntoView)root.setTimeout(()=>{if(alive)cv.scrollIntoView({behavior:"smooth",block:"center"});},60);
 return K;
}
function rr(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
function bricks(ctx,x0,w,y0,h,off,c1,c2){ctx.fillStyle=c1;ctx.fillRect(x0,y0,w,h);ctx.strokeStyle=c2;ctx.lineWidth=1.5;ctx.beginPath();
 for(let y=y0,row=0;y<y0+h;y+=22,row++){ctx.moveTo(x0,y);ctx.lineTo(x0+w,y);for(let x=x0-((off+(row%2?24:0))%48);x<x0+w;x+=48)if(x>x0){ctx.moveTo(x,y);ctx.lineTo(x,Math.min(y0+h,y+22));}}ctx.stroke();}

/* ---------- Dinner Dash (The Castle): tap to flap through the castle hall ---------- */
function dash(api){
 const hard=api.hard,e=api.ease||0;
 const C={gates:hard?14:8,gap:(hard?132:162)+e*16,speed:(hard?138:108)-e*8,lives:(hard?2:3)+e,space:hard?178:196};
 const FLOOR=H-34,X=92,R=14;
 let state="ready",y=H/2,vy=0,lives=C.lives,passed=0,inv=0,scroll=0,tilt=0,flapT=0,tableX=null,gotRoast=0;
 const rand=rng(7171+(hard?9:0)),gates=[];
 for(let i=0;i<C.gates;i++){const prev=i?gates[i-1].c:H/2-10,c=clamp(prev+(rand()-.5)*(hard?210:170),C.gap/2+34,FLOOR-C.gap/2-24);gates.push({x:W+90+i*C.space,c,done:false,roast:true,ph:i*1.7});}
 const endX=()=>gates[gates.length-1].x+150;
 const K=kit(api,{label:"Dinner Dash",
  down(){
   if(K.over)return;
   if(state==="ready"){state="play";api.message("Tap to flap. Thread the gaps!");}
   if(state==="play"){vy=-292;flapT=.18;api.tone(520,.05);K.burst(X-12,y+8,"#cfd6ee",4,60,120);}
  },
  update(dt,t){
   if(state==="ready"){y=H/2+Math.sin(t*3)*8;return;}
   if(state==="glide"){   // through the last gate: coast down to the table
    scroll+=C.speed*dt;for(const g of gates)g.x-=C.speed*dt;tableX-=C.speed*dt;
    y=lerp(y,FLOOR-20,dt*3);tilt=lerp(tilt,0,dt*6);
    if(tableX<=X+46){state="done";K.burst(X+40,FLOOR-40,"#ffd76a",26,170);api.message("Dinner is served!");K.end(true,"",1100);}
    return;
   }
   if(state!=="play")return;
   inv=Math.max(0,inv-dt);flapT=Math.max(0,flapT-dt);
   vy+=880*dt;y+=vy*dt;scroll+=C.speed*dt;tilt=lerp(tilt,clamp(vy/520,-.5,.9),dt*10);
   if(y<R){y=R;vy=40;}
   let hit=false;
   if(y>FLOOR-R){y=FLOOR-R;hit=true;}
   for(const g of gates){
    g.x-=C.speed*dt;
    if(g.roast&&Math.abs(g.x-X)<22&&Math.abs(g.c-y)<26){g.roast=false;gotRoast++;K.pop(X,y-24,"Yum!");K.burst(g.x,g.c,"#ffb45c",8);api.tone(880,.08);}
    if(!g.done&&g.x+27<X-R){g.done=true;passed++;api.tone(660,.06);}
    if(X+R>g.x-27&&X-R<g.x+27&&(y-R<g.c-C.gap/2||y+R>g.c+C.gap/2))hit=true;
   }
   if(hit&&inv<=0){
    lives--;inv=1.3;K.shake(9);K.burst(X,y,"#ff7b7b",12);api.sound(false);
    const near=gates.find(g=>g.x>X-60)||gates[gates.length-1];vy=y>near.c?-300:120;
    if(lives<=0){state="fell";api.message("Bonk!");K.end(false,"The castle hall won that round. Short, steady taps keep him level: aim for the middle of each gap.",900);}
   }else if(hit){vy=y>H/2?-260:120;}
   if(passed>=C.gates&&state==="play"){state="glide";tableX=endX();}
  },
  draw(ctx,t){
   // hall: far wall, windows, banners, floor
   bricks(ctx,0,W,0,FLOOR,scroll*.35,"#3a3350","#2b2540");
   for(let i=0;i<4;i++){const x=((i*150-scroll*.35)%600+600)%600-80;ctx.fillStyle="#1a1830";rr(ctx,x,70,44,96,22);ctx.fill();ctx.fillStyle="#ffe9a833";ctx.beginPath();ctx.arc(x+22,104,10,0,TAU);ctx.fill();
    ctx.fillStyle=i%2?"#8a2f4a":"#3f5aa0";ctx.beginPath();ctx.moveTo(x+70,40);ctx.lineTo(x+100,40);ctx.lineTo(x+100,120);ctx.lineTo(x+85,106);ctx.lineTo(x+70,120);ctx.closePath();ctx.fill();}
   bricks(ctx,0,W,FLOOR,H-FLOOR,scroll,"#5d5174","#3d3554");ctx.fillStyle="#7a6d92";ctx.fillRect(0,FLOOR,W,4);
   for(const g of gates){
    if(g.x<-60||g.x>W+60)continue;
    const top=g.c-C.gap/2,bot=g.c+C.gap/2;
    // chandelier on a chain from the ceiling
    ctx.strokeStyle="#8d7a4a";ctx.lineWidth=4;ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(g.x,0);ctx.lineTo(g.x,top-26);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle="#c79a3c";ctx.strokeStyle="#6b4a14";ctx.lineWidth=2;rr(ctx,g.x-27,top-26,54,26,8);ctx.fill();ctx.stroke();
    for(let k=-1;k<=1;k++){ctx.fillStyle="#f4ead2";ctx.fillRect(g.x+k*17-3,top-38,6,12);ctx.fillStyle="#ffb93c";ctx.beginPath();ctx.ellipse(g.x+k*17,top-42+Math.sin(t*9+k)*1.2,3,5,0,0,TAU);ctx.fill();}
    // tower from the floor
    bricks(ctx,g.x-27,54,bot,FLOOR-bot,0,"#75698f","#4b4163");ctx.fillStyle="#8d80a8";ctx.fillRect(g.x-31,bot,62,8);
    for(let k=0;k<3;k++)ctx.fillRect(g.x-31+k*24,bot-9,14,10);
    if(g.roast)K.drawIcon("roast",g.x,g.c+Math.sin(t*3+g.ph)*4,30);
   }
   if(tableX!=null){ctx.fillStyle="#7b4a26";rr(ctx,tableX,FLOOR-30,120,10,4);ctx.fill();ctx.fillRect(tableX+10,FLOOR-22,8,22);ctx.fillRect(tableX+102,FLOOR-22,8,22);K.drawIcon("roast",tableX+38,FLOOR-46,38);K.drawIcon("cheese",tableX+84,FLOOR-44,30);}
   const mood=state==="done"?"joy":inv>0?"scared":vy<-60?"joy":"idle";
   if(!(inv>0&&Math.floor(t*14)%2&&state==="play")){
    // little cloak-wings so the flap reads
    ctx.fillStyle="#cfd6ee";ctx.beginPath();ctx.ellipse(X-14,y-2+(flapT>0?6:-6),11,5,flapT>0?.9:-.5,0,TAU);ctx.fill();
    K.drawWolf(mood,X,y+19,40,1,tilt);
   }
   K.drawParts();
   // progress along the hall
   ctx.fillStyle="#0008";rr(ctx,70,10,220,8,4);ctx.fill();ctx.fillStyle="#ffd76a";rr(ctx,70,10,220*Math.min(1,passed/C.gates),8,4);ctx.fill();
   K.hearts(lives,"Gates "+passed+" / "+C.gates);
   if(state==="ready")K.banner("Tap to start","Tap to flap · miss the chandeliers and towers");
  }});
 api.instructions("Tap to flap. Fly the wolf through the castle hall to the feast at the far end without hitting the chandeliers or towers.");
 api.message("Each tap is one flap. Small, steady taps work best.");
 return{destroy(){K.destroy();},preview:()=>({state,passed,lives,y,vy,target:(gates.find(g=>g.x+27>X-R)||{c:FLOOR-40}).c})};
}

/* ---------- Catch the Feast (Wizard's Tower): drag to catch food, dodge the potions ---------- */
function catchGame(api){
 const hard=api.hard,e=api.ease||0;
 const C={goal:hard?34:22,time:hard?52:48,lives:(hard?3:3)+e,fall:(hard?150:118)-e*10,potion:(hard?.34:.24)-e*.05,every:hard?.5:.66};
 const FOODS=["apple","cheese","fish","berries","mushroom"],GY=H-30;
 let state="ready",x=W/2,tx=W/2,lives=C.lives,got=0,left=C.time,spawn=.4,inv=0,gulp=0,sick=0,combo=0,face=1;
 const rand=rng(4242+(hard?5:0)),items=[],splats=[];
 const K=kit(api,{label:"Catch the Feast",
  down(px){if(K.over)return;if(state==="ready"){state="play";api.message("Catch the food. Dodge the potions!");}tx=px;},
  move(px){tx=px;},
  update(dt,t){
   if(state!=="play")return;
   inv=Math.max(0,inv-dt);gulp=Math.max(0,gulp-dt);sick=Math.max(0,sick-dt);left-=dt;
   const nx=clamp(x+clamp(tx-x,-760*dt,760*dt),24,W-24);if(Math.abs(nx-x)>.2)face=nx>x?1:-1;x=nx;
   spawn-=dt;
   if(spawn<=0){
    const prog=1-left/C.time;spawn=C.every*(1-prog*.3)*(.7+rand()*.6);
    const bad=rand()<C.potion,gold=!bad&&rand()<.1;
    items.push({x:26+rand()*(W-52),y:-20,vy:(C.fall+prog*60)*(gold?1.3:.85+rand()*.4),kind:bad?"potion":gold?"roast":FOODS[Math.floor(rand()*FOODS.length)],rot:rand()*TAU,spin:(rand()-.5)*4,bad,gold,sway:rand()*TAU});
   }
   for(let i=items.length-1;i>=0;i--){
    const it=items[i];it.y+=it.vy*dt;it.rot+=it.spin*dt;it.x+=Math.sin(t*2+it.sway)*14*dt;
    if(it.y>GY-52&&it.y<GY-8&&Math.abs(it.x-x)<27){
     items.splice(i,1);
     if(it.bad){combo=0;if(inv<=0){lives--;inv=1.1;sick=1;K.shake(9);K.burst(it.x,it.y,"#8b5cf6",14);api.sound(false);K.pop(x,GY-60,"Yuck!","#c9a8ff");}}
     else{const n=it.gold?3:1;got+=n;combo++;gulp=.25;K.burst(it.x,it.y,it.gold?"#ffd76a":"#ffb45c",it.gold?16:7);K.pop(x,GY-60,(it.gold?"+3 ":"+1 ")+(combo>=5?"x"+combo:""),it.gold?"#ffd76a":"#fff");api.tone(520+Math.min(combo,10)*40,.07);}
     continue;
    }
    if(it.y>GY){items.splice(i,1);if(!it.bad)combo=0;splats.push({x:it.x,t:1.2,bad:it.bad});K.burst(it.x,GY,it.bad?"#8b5cf6":"#c9884a",5,70);}
   }
   for(let i=splats.length-1;i>=0;i--){splats[i].t-=dt;if(splats[i].t<=0)splats.splice(i,1);}
   if(got>=C.goal){state="done";got=C.goal;K.burst(x,GY-40,"#ffd76a",28,180);api.message("A full belly!");K.end(true,"",1000);}
   else if(lives<=0){state="done";K.end(false,"Three potions is two too many. Watch the bottles: they are the only things with a cork.",800);}
   else if(left<=0){state="done";K.end(false,"Time ran out with "+(C.goal-got)+" still to catch. Stay under the food and let the potions drop past.",800);}
  },
  draw(ctx,t){
   // tower room: round wall, tall window with stars, shelves, floating candles
   const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,"#1b1740");g.addColorStop(1,"#35245c");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
   bricks(ctx,0,W,0,GY,0,"#00000000","#ffffff0d");
   ctx.fillStyle="#0c1030";rr(ctx,W/2-46,36,92,150,46);ctx.fill();ctx.strokeStyle="#7a63b8";ctx.lineWidth=5;ctx.stroke();
   for(let i=0;i<9;i++){ctx.fillStyle="rgba(255,255,220,"+(.4+.5*Math.abs(Math.sin(t*1.5+i)))+")";ctx.beginPath();ctx.arc(W/2-34+((i*29)%70),52+((i*47)%120),1.4,0,TAU);ctx.fill();}
   ctx.fillStyle="#f4ecc8";ctx.beginPath();ctx.arc(W/2+16,70,13,0,TAU);ctx.fill();ctx.fillStyle="#0c1030";ctx.beginPath();ctx.arc(W/2+22,66,12,0,TAU);ctx.fill();
   for(const sx of [18,W-98]){ctx.fillStyle="#5a3a2a";ctx.fillRect(sx,150,80,7);ctx.fillRect(sx,230,80,7);for(let k=0;k<4;k++){ctx.fillStyle=["#8b5cf6","#4fc3a1","#e0607e","#e8b84a"][(k+(sx>100?2:0))%4];rr(ctx,sx+6+k*18,150-18-(k%2)*5,12,18+(k%2)*5,3);ctx.fill();rr(ctx,sx+8+k*18,230-22+(k%2)*6,12,22-(k%2)*6,3);ctx.fill();}}
   for(let i=0;i<5;i++){const cx=30+i*76,cy=22+Math.sin(t*1.3+i*2)*6;ctx.fillStyle="#f4ead2";ctx.fillRect(cx-3,cy,6,14);ctx.fillStyle="#ffb93c";ctx.beginPath();ctx.ellipse(cx,cy-4,3,5.5+Math.sin(t*10+i),0,0,TAU);ctx.fill();ctx.fillStyle="#ffb93c22";ctx.beginPath();ctx.arc(cx,cy-3,14,0,TAU);ctx.fill();}
   ctx.fillStyle="#4a3766";ctx.fillRect(0,GY,W,H-GY);ctx.fillStyle="#6a5490";ctx.fillRect(0,GY,W,4);
   for(const s of splats){ctx.globalAlpha=Math.min(1,s.t);ctx.fillStyle=s.bad?"#8b5cf6":"#b98152";ctx.beginPath();ctx.ellipse(s.x,GY+3,12,3.5,0,0,TAU);ctx.fill();}ctx.globalAlpha=1;
   for(const it of items){
    if(it.gold){ctx.fillStyle="#ffd76a44";ctx.beginPath();ctx.arc(it.x,it.y,22+Math.sin(t*8)*3,0,TAU);ctx.fill();}
    if(it.bad){ctx.save();ctx.translate(it.x,it.y);ctx.rotate(Math.sin(it.rot)*.35);ctx.fillStyle="#7c3aed";ctx.strokeStyle="#2e1065";ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,5,11,0,TAU);ctx.fill();ctx.stroke();ctx.fillRect(-4,-12,8,9);ctx.strokeRect(-4,-12,8,9);ctx.fillStyle="#a16207";ctx.fillRect(-5,-16,10,5);
     ctx.fillStyle="#d8b4fe";ctx.beginPath();ctx.arc(-3,3,2.2,0,TAU);ctx.arc(4,8,1.6,0,TAU);ctx.fill();ctx.fillStyle="#c4b5fd88";ctx.beginPath();ctx.arc(Math.sin(t*5+it.sway)*3,-22-((t*20+it.sway*9)%12),2.5,0,TAU);ctx.fill();ctx.restore();}
    else K.drawIcon(it.kind,it.x,it.y,it.gold?40:32,it.rot*.3);
   }
   if(!(inv>0&&Math.floor(t*14)%2)){
    if(sick>0){ctx.fillStyle="#7c3aed55";ctx.beginPath();ctx.arc(x,GY-24,28,0,TAU);ctx.fill();}
    K.drawWolf(state==="done"&&got>=C.goal?"joy":sick>0?"sad":gulp>0?"joy":"idle",x,GY+2,52+(gulp>0?4:0),face);
   }
   K.drawParts();
   ctx.fillStyle="#0008";rr(ctx,70,10,220,8,4);ctx.fill();ctx.fillStyle=left<10?"#ff7b7b":"#9fd6ff";rr(ctx,70,10,220*clamp(left/C.time,0,1),8,4);ctx.fill();
   K.hearts(lives,"Caught "+got+" / "+C.goal);
   if(state==="ready")K.banner("Touch to start","Drag left and right · catch food, dodge potions");
  }});
 api.instructions("Drag anywhere to slide the wolf under the falling food. Catch enough before the time runs out, and let the corked potions drop past.");
 api.message("A golden roast counts for three.");
 return{destroy(){K.destroy();},preview:()=>({state,got,lives,x,items:items.map(i=>({x:i.x,y:i.y,bad:i.bad}))})};
}

/* ---------- Gear Jump (Clockwork Citadel): tap to leap from gear to spinning gear ---------- */
function gearGame(api){
 const hard=api.hard,e=api.ease||0;
 const C={n:hard?10:7,r:hard?29:35,spin:(hard?2.25:1.55)*(1-e*.14),lives:(hard?3:3)+e,slide:hard?34:0,guide:hard?0:2+e*3};
 const rand=rng(9090+(hard?3:0)),gears=[];
 for(let i=0;i<C.n;i++){const side=i%2?1:-1;gears.push({bx:i===0?W/2:W/2+side*(52+rand()*46),y:-i*128,r:i===0?40:i===C.n-1?44:C.r+rand()*6,w:(i%2?1:-1)*C.spin*(.85+rand()*.3),rot:rand()*TAU,ph:rand()*TAU,x:0});}
 let state="ready",on=0,ang=-Math.PI/2,lives=C.lives,cam=-H+150,fly=null,best=0,inv=0,land=0,T=0;
 const gx=g=>g.x;
 const K=kit(api,{label:"Gear Jump",
  down(){
   if(K.over)return;
   if(state==="ready"){state="play";api.message("Tap when he points at the next gear.");return;}
   if(state==="play"&&!fly){const g=gears[on];fly={x:gx(g)+Math.cos(ang)*(g.r+12),y:g.y+Math.sin(ang)*(g.r+12),dx:Math.cos(ang),dy:Math.sin(ang),from:on,t:0};api.tone(600,.06);K.burst(fly.x,fly.y,"#ffd8a0",5,70);}
  },
  update(dt,t){
   T=t;inv=Math.max(0,inv-dt);land=Math.max(0,land-dt);
   gears.forEach((g,i)=>{g.rot+=g.w*dt;g.x=g.bx+(C.slide&&i>0&&i<C.n-1?Math.sin(t*1.1+g.ph)*C.slide:0);});
   if(state!=="play"&&state!=="ready")return;
   if(!fly){ang+=gears[on].w*dt;}
   else{
    fly.t+=dt;fly.x+=fly.dx*430*dt;fly.y+=fly.dy*430*dt;
    for(let i=0;i<gears.length;i++){
     if(i===fly.from)continue;const g=gears[i],dx=fly.x-gx(g),dy=fly.y-g.y;
     if(dx*dx+dy*dy<(g.r+13)*(g.r+13)){on=i;ang=Math.atan2(dy,dx);fly=null;land=.25;K.burst(gx(g)+Math.cos(ang)*g.r,g.y+Math.sin(ang)*g.r,"#ffd76a",10);api.tone(760+i*30,.09);
      if(i>best){best=i;K.pop(gx(g),g.y-g.r-22,i===C.n-1?"Dinner!":"Nice!");}
      if(i===C.n-1){state="done";api.message("He made it to the dinner bell!");K.burst(gx(g),g.y-30,"#ffd76a",30,190);K.end(true,"",1100);}
      break;}
    }
    if(fly&&(fly.x<-30||fly.x>W+30||fly.y-cam<-40||fly.y-cam>H+40||fly.t>2)){
     const back=fly.from;fly=null;on=back;lives--;inv=1;K.shake(8);api.sound(false);ang=-Math.PI/2;
     if(lives<=0){state="done";K.end(false,"He sailed off into the works. Wait until his nose points straight at the next gear, then tap.",800);}
    }
   }
   const target=(fly?fly.y:gears[on].y)-H+170;cam=lerp(cam,Math.min(target,gears[on].y-H+170),dt*4);
  },
  draw(ctx,t){
   const g0=ctx.createLinearGradient(0,0,0,H);g0.addColorStop(0,"#2a1c16");g0.addColorStop(1,"#4a3020");ctx.fillStyle=g0;ctx.fillRect(0,0,W,H);
   // background works: slow cogs and pipes, drifting at half speed
   const drawCog=(x,y,r,rot,fill,stroke,teeth)=>{ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.beginPath();const n=teeth*2;for(let k=0;k<n;k++){const a=k/n*TAU,a2=(k+.5)/n*TAU,rr2=k%2?r:r+r*.2;ctx.lineTo(Math.cos(a)*rr2,Math.sin(a)*rr2);ctx.lineTo(Math.cos(a2)*rr2,Math.sin(a2)*rr2);}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();};
   for(let i=0;i<7;i++){const y=((i*150-cam*.45)%1050+1050)%1050-200;drawCog(i%2?60:300,y,46+(i%3)*14,t*(i%2?.25:-.2),"#5a3b2633","#00000022",10);}
   ctx.strokeStyle="#6e4a2e";ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(18,H);ctx.moveTo(W-18,0);ctx.lineTo(W-18,H);ctx.stroke();
   ctx.strokeStyle="#8a6038";ctx.lineWidth=3;for(let y=((-cam*.9)%90+90)%90-90;y<H;y+=90){ctx.beginPath();ctx.moveTo(10,y);ctx.lineTo(26,y);ctx.moveTo(W-26,y);ctx.lineTo(W-10,y);ctx.stroke();}
   // aim line on the first gears, to teach the idea
   if(!fly&&state!=="done"&&on<C.guide){const g=gears[on];ctx.strokeStyle="#ffe9a866";ctx.lineWidth=2;ctx.setLineDash([5,7]);ctx.beginPath();ctx.moveTo(gx(g)+Math.cos(ang)*(g.r+16),g.y-cam+Math.sin(ang)*(g.r+16));ctx.lineTo(gx(g)+Math.cos(ang)*190,g.y-cam+Math.sin(ang)*190);ctx.stroke();ctx.setLineDash([]);}
   gears.forEach((g,i)=>{
    const y=g.y-cam;if(y<-70||y>H+70)return;const last=i===C.n-1,x=gx(g);
    if(i===on+1&&!fly){ctx.strokeStyle="rgba(255,233,168,"+(.35+.3*Math.sin(t*5))+")";ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,g.r+g.r*.2+7,0,TAU);ctx.stroke();}
    drawCog(x,y,g.r,g.rot,last?"#e8b84a":i%2?"#c98b3c":"#b9773a","#5c3a14",last?12:9);
    ctx.strokeStyle="#5c3a14";ctx.lineWidth=4;ctx.save();ctx.translate(x,y);ctx.rotate(g.rot);for(let k=0;k<3;k++){ctx.rotate(TAU/3);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(g.r*.72,0);ctx.stroke();}ctx.restore();
    ctx.fillStyle="#5c3a14";ctx.beginPath();ctx.arc(x,y,g.r*.26,0,TAU);ctx.fill();ctx.fillStyle="#f1cf8a";ctx.beginPath();ctx.arc(x,y,g.r*.12,0,TAU);ctx.fill();
    if(last){K.drawIcon("roast",x,y-g.r-26+Math.sin(t*3)*3,40);}
   });
   // the wolf: standing out from the rim, or flying
   if(!(inv>0&&Math.floor(t*14)%2)){
    if(fly)K.drawWolf("joy",fly.x,fly.y-cam,40,1,Math.atan2(fly.dy,fly.dx)+Math.PI/2);
    else{const g=gears[on],sq=land>0?1-land*.8:1,px=gx(g)+Math.cos(ang)*(g.r+2),py=g.y-cam+Math.sin(ang)*(g.r+2);ctx.save();ctx.translate(px,py);ctx.rotate(ang+Math.PI/2);ctx.scale(1,sq);K.drawWolf(state==="done"&&lives>0?"joy":"idle",0,0,40);ctx.restore();}
   }
   K.drawParts(0,cam);
   // steam puffs for life
   for(let i=0;i<3;i++){const p=(t*.35+i/3)%1;ctx.fillStyle="rgba(255,255,255,"+(.12*(1-p))+")";ctx.beginPath();ctx.arc(30+i*150,H-p*120,10+p*18,0,TAU);ctx.fill();}
   K.hearts(lives,"Gear "+(best+1)+" / "+C.n);
   if(state==="ready")K.banner("Tap to start","Tap to leap · he flies the way his head points");
  }});
 api.instructions("The wolf rides the rim of a spinning gear. Tap to leap: he flies straight out the way his head is pointing. Climb to the roast at the top.");
 api.message("Wait for the moment, then tap once.");
 return{destroy(){K.destroy();},preview:()=>({state,on,lives,ang,flying:!!fly,aim:on<C.n-1?Math.atan2(gears[on+1].y-gears[on].y,gears[on+1].x-gears[on].x):0})};
}
root.FTWArcade=Object.freeze({kit,rr,bricks,rng,clamp,lerp,W,H});
if(root.FTWBonus){root.FTWBonus.register("dash",dash);root.FTWBonus.register("catch",catchGame);root.FTWBonus.register("gear",gearGame);}
})(typeof window!=="undefined"?window:{});
