/* Feed the Wolf skill games, part two: Firefly Chase, Spotlight Sneak, Garden Delivery and The Dinner Machine. */
(function(root){
"use strict";
const A=root.FTWArcade||{},W=360,H=420,TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
function rng(seed){let x=seed>>>0;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
const rr=(ctx,x,y,w,h,r)=>A.rr(ctx,x,y,w,h,r);

/* ---------- Firefly Chase (Moonlit Conservatory): steer through the dark garden with a dying lantern ---------- */
function firefly(api){
 const hard=api.hard,e=api.ease||0;
 const C={goal:hard?12:8,burn:(hard?4.1:3.1)-e*.5,gain:hard?7:9,speed:160,flee:hard?92:70,thorns:hard?7:4};
 const HEDGES=[[60,92,110,22],[214,70,22,104],[92,196,22,96],[150,246,120,22],[262,222,22,110],[40,340,96,22]];
 const rand=rng(3131+(hard?7:0)),thorns=[],flies=[];
 const free=(x,y,pad)=>!HEDGES.some(h=>x>h[0]-pad&&x<h[0]+h[2]+pad&&y>h[1]-pad&&y<h[1]+h[3]+pad);
 while(thorns.length<C.thorns){const x=30+rand()*(W-60),y=60+rand()*(H-120);if(free(x,y,24)&&Math.hypot(x-W/2,y-H+50)>90&&!thorns.some(t=>Math.hypot(t.x-x,t.y-y)<70))thorns.push({x,y});}
 const spawn=()=>{for(let k=0;k<40;k++){const x=24+rand()*(W-48),y=30+rand()*(H-70);if(Math.hypot(x-P.x,y-P.y)>130){flies.push({x,y,ph:rand()*TAU,vx:0,vy:0,born:.4});return;}}};
 const P={x:W/2,y:H-50,face:1,walk:0};
 let state="ready",fuel=100,got=0,inv=0,moving=false,dark=null,dctx=null,ox=0,oy=0,jx=0,jy=0;
 for(let i=0;i<4;i++)spawn();
 const K=A.kit(api,{label:"Firefly Chase",
  down(px,py){if(K.over)return;if(state==="ready"){state="play";api.message("Chase them down before the lantern dies!");}ox=px;oy=py;jx=jy=0;moving=true;},
  // A thumb-stick that appears wherever you touch: the wolf goes the way you push from that spot, so your hand can stay out of the way.
  move(px,py){let dx=px-ox,dy=py-oy;const d=Math.hypot(dx,dy);if(d>44){ox=px-dx/d*44;oy=py-dy/d*44;dx=px-ox;dy=py-oy;}jx=dx/44;jy=dy/44;},
  up(){moving=false;jx=jy=0;},
  update(dt,t){
   if(state!=="play")return;
   inv=Math.max(0,inv-dt);fuel-=C.burn*dt;
   if(moving&&inv<.65){
    const d=Math.hypot(jx,jy);
    if(d>.16){const s=C.speed*Math.min(1,d*1.25)*dt;P.x+=jx/d*s;P.y+=jy/d*s;P.walk+=dt*10;if(Math.abs(jx)>.1)P.face=jx>0?1:-1;}
   }
   P.x=clamp(P.x,14,W-14);P.y=clamp(P.y,26,H-10);
   for(const h of HEDGES){   // push the wolf (a circle at his feet) out of each hedge
    const cx=clamp(P.x,h[0],h[0]+h[2]),cy=clamp(P.y-8,h[1],h[1]+h[3]),dx=P.x-cx,dy=P.y-8-cy,d=Math.hypot(dx,dy);
    if(d<12){if(d>.01){P.x=cx+dx/d*12;P.y=cy+dy/d*12+8;}else P.y=h[1]+h[3]+20;}
   }
   for(const th of thorns)if(inv<=0&&Math.hypot(th.x-P.x,th.y-(P.y-10))<22){fuel-=12;inv=1;K.shake(7);K.burst(P.x,P.y-12,"#ff7b7b",9);api.sound(false);K.pop(P.x,P.y-50,"Ouch! Lantern spilled","#ffb0b0");const dx=P.x-th.x,dy=P.y-10-th.y,d=Math.hypot(dx,dy)||1;P.x+=dx/d*18;P.y+=dy/d*18;}
   for(let i=flies.length-1;i>=0;i--){
    const f=flies[i];f.born=Math.max(0,f.born-dt);f.ph+=dt;
    const dx=f.x-P.x,dy=f.y-(P.y-14),d=Math.hypot(dx,dy)||1;
    let ax=Math.cos(f.ph*1.7+i)*40,ay=Math.sin(f.ph*2.3+i*2)*40;
    if(d<72){ax+=dx/d*C.flee*3.2;ay+=dy/d*C.flee*3.2;}
    // corners are a trap for the firefly, so nudge it back toward the middle near the edges
    if(f.x<34)ax+=140;if(f.x>W-34)ax-=140;if(f.y<34)ay+=140;if(f.y>H-34)ay-=140;
    f.vx=lerp(f.vx,ax,dt*3);f.vy=lerp(f.vy,ay,dt*3);const sp=Math.hypot(f.vx,f.vy),mx=d<72?C.flee:46;if(sp>mx){f.vx*=mx/sp;f.vy*=mx/sp;}
    f.x=clamp(f.x+f.vx*dt,12,W-12);f.y=clamp(f.y+f.vy*dt,12,H-12);
    if(d<21&&f.born<=0){flies.splice(i,1);got++;fuel=Math.min(100,fuel+C.gain);K.burst(f.x,f.y,"#d9ff7a",14,130,0);K.pop(f.x,f.y-14,"+1","#e9ffb0");api.tone(700+got*40,.1);if(got<C.goal)spawn();}
   }
   if(got>=C.goal){state="done";api.message("A jar full of light!");K.burst(P.x,P.y-20,"#d9ff7a",30,190,0);K.end(true,"",1000);}
   else if(fuel<=0){fuel=0;state="done";K.end(false,"The lantern went out with "+(C.goal-got)+" left. Cut them off against a hedge instead of following behind.",900);}
  },
  draw(ctx,t){
   const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,"#1f4a3d");g.addColorStop(1,"#2f6a4c");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
   for(let i=0;i<40;i++){const x=(i*97)%W,y=(i*53)%H;ctx.strokeStyle=i%3?"#3d8460":"#2a5c45";ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+3,y-7);ctx.moveTo(x+4,y);ctx.lineTo(x+6,y-5);ctx.stroke();}
   ctx.strokeStyle="#c8b98a55";ctx.lineWidth=18;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(W/2,H);ctx.quadraticCurveTo(40,300,160,170);ctx.quadraticCurveTo(300,60,330,20);ctx.stroke();
   for(const h of HEDGES){ctx.fillStyle="#17402f";rr(ctx,h[0]-2,h[1]+3,h[2]+4,h[3]+3,9);ctx.fill();ctx.fillStyle="#2f8a58";rr(ctx,h[0],h[1],h[2],h[3],9);ctx.fill();
    for(let k=0;k<(h[2]+h[3])/16;k++){const px=h[0]+((k*37)%Math.max(1,h[2]-8))+4,py=h[1]+((k*23)%Math.max(1,h[3]-8))+4;ctx.fillStyle=k%4?"#3fa56a":"#f4b8e0";ctx.beginPath();ctx.arc(px,py,k%4?4:2.6,0,TAU);ctx.fill();}}
   for(const th of thorns){ctx.save();ctx.translate(th.x,th.y);ctx.fillStyle="#5b2a4a";ctx.strokeStyle="#2a1024";ctx.lineWidth=1.5;ctx.beginPath();for(let k=0;k<14;k++){const a=k/14*TAU,r=k%2?9:17;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle="#e0607e";ctx.beginPath();ctx.arc(0,0,4,0,TAU);ctx.fill();ctx.restore();}
   if(!(inv>0&&Math.floor(t*14)%2)){
    K.drawWolf(state==="done"&&got>=C.goal?"joy":inv>0?"scared":"idle",P.x,P.y+Math.abs(Math.sin(P.walk))*-2,42,P.face);
    const lx=P.x+P.face*17,ly=P.y-20;ctx.strokeStyle="#3a2a12";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(lx,ly-9);ctx.lineTo(lx,ly-5);ctx.stroke();ctx.fillStyle="#3a2a12";rr(ctx,lx-5,ly-5,10,12,2);ctx.fill();ctx.fillStyle=fuel>20||Math.floor(t*8)%2?"#ffe07a":"#a8743a";ctx.fillRect(lx-3,ly-3,6,8);
   }
   // night: a dark sheet with a hole cut round the lantern, smaller as it burns down
   if(!dark){dark=root.document.createElement("canvas");dark.width=W;dark.height=H;dctx=dark.getContext("2d");}
   const rad=44+fuel*1.05+Math.sin(t*9)*2;
   dctx.globalCompositeOperation="source-over";dctx.clearRect(0,0,W,H);dctx.fillStyle="rgba(6,10,32,.76)";dctx.fillRect(0,0,W,H);
   dctx.globalCompositeOperation="destination-out";const hole=dctx.createRadialGradient(P.x,P.y-18,rad*.35,P.x,P.y-18,rad);hole.addColorStop(0,"rgba(0,0,0,1)");hole.addColorStop(1,"rgba(0,0,0,0)");dctx.fillStyle=hole;dctx.beginPath();dctx.arc(P.x,P.y-18,rad,0,TAU);dctx.fill();
   ctx.drawImage(dark,0,0,W,H);
   ctx.fillStyle="#f4ecc8";ctx.beginPath();ctx.arc(318,34,15,0,TAU);ctx.fill();ctx.fillStyle="#f4ecc822";ctx.beginPath();ctx.arc(318,34,26,0,TAU);ctx.fill();
   // fireflies glow through the dark, which is how you find them
   for(const f of flies){const a=f.born>0?1-f.born/.4:1,pulse=.6+.4*Math.sin(f.ph*6);ctx.fillStyle="rgba(217,255,122,"+(.22*a*pulse)+")";ctx.beginPath();ctx.arc(f.x,f.y,13,0,TAU);ctx.fill();ctx.fillStyle="rgba(240,255,170,"+a+")";ctx.beginPath();ctx.arc(f.x,f.y,3.2,0,TAU);ctx.fill();
    ctx.strokeStyle="rgba(255,255,255,"+(.5*a)+")";ctx.lineWidth=1;const wv=Math.sin(f.ph*40)*3;ctx.beginPath();ctx.moveTo(f.x,f.y);ctx.lineTo(f.x-5,f.y-4+wv);ctx.moveTo(f.x,f.y);ctx.lineTo(f.x+5,f.y-4-wv);ctx.stroke();}
   K.drawParts();
   if(moving&&state==="play"){ctx.strokeStyle="rgba(255,255,255,.35)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(ox,oy,44,0,TAU);ctx.stroke();ctx.fillStyle="rgba(255,255,255,.4)";ctx.beginPath();ctx.arc(ox+jx*44,oy+jy*44,16,0,TAU);ctx.fill();}
   ctx.fillStyle="#0008";rr(ctx,70,10,220,8,4);ctx.fill();ctx.fillStyle=fuel<25?"#ff7b7b":"#ffe07a";rr(ctx,70,10,220*clamp(fuel/100,0,1),8,4);ctx.fill();
   K.hearts(0,"Fireflies "+got+" / "+C.goal+" · lantern "+Math.ceil(fuel)+"%");
   if(state==="ready")K.banner("Touch to start","Touch anywhere and push the way to go");
  }});
 api.instructions("Touch anywhere and push your thumb the way you want the wolf to go, like a joystick. Keep your hand in a corner. Catch the fireflies before the lantern burns out. Each one tops it up; thorns spill it.");
 api.message("They flee when he gets close. Herd them into a corner.");
 return{destroy(){K.destroy();},preview:()=>({state,got,fuel,x:P.x,y:P.y,flies:flies.map(f=>({x:f.x,y:f.y}))})};
}

/* ---------- Spotlight Sneak (Ghostlight Theatre): hold to tiptoe, let go to freeze when the light finds you ---------- */
function sneak(api){
 const hard=api.hard,e=api.ease||0;
 const C={len:hard?1750:1300,lives:(hard?3:3)+e,speed:92,time:(hard?70:62)+e*8,n:hard?9:6,sp:(hard?1.25:.95)*(1-e*.12),r:hard?50:46};
 const rand=rng(6161+(hard?4:0)),lights=[],FLOOR=H-70;
 for(let i=0;i<C.n;i++){const cx=210+(C.len-330)*(i/(C.n-1));lights.push({cx,range:70+rand()*50,sp:C.sp*(.75+rand()*.6)*(i%2?1:-1),ph:rand()*TAU,x:cx,blink:hard&&i%3===2,on:true});}
 const checks=[60];for(let x=C.len/4;x<C.len-150;x+=C.len/4)checks.push(x);
 let state="ready",x=60,lives=C.lives,left=C.time,held=false,seen=0,caught=0,walk=0,cam=0,cp=0,alarm=0;
 const lit=()=>lights.some(l=>l.on&&Math.abs(l.x-x)<C.r-8);
 const K=A.kit(api,{label:"Spotlight Sneak",
  down(){if(K.over)return;if(state==="ready"){state="play";api.message("Freeze when the light is on you!");}held=true;},
  up(){held=false;},
  update(dt,t){
   for(const l of lights){l.x=l.cx+Math.sin(t*l.sp+l.ph)*l.range;if(l.blink){const c=(t*.45+l.ph)%1;l.on=c<.62;l.warn=c>.9||c<.04;}}
   alarm=Math.max(0,alarm-dt);
   if(state!=="play")return;
   left-=dt;
   if(caught>0){caught-=dt;if(caught<=0){x=checks[cp];}return;}
   const moving=held;
   if(moving){x+=C.speed*dt;walk+=dt*11;}
   while(cp<checks.length-1&&x>=checks[cp+1]){cp++;K.pop(checks[cp],FLOOR-70,"Checkpoint","#b8f5c8");api.tone(660,.08);}
   if(moving&&lit()){seen+=dt;if(seen>.13){seen=0;lives--;caught=1.1;alarm=1.1;held=false;K.shake(10);api.sound(false);K.pop(x,FLOOR-74,"Spotted!","#ff9c9c");
     if(lives<=0){state="done";K.end(false,"The spotlight caught him moving. Lift your finger before the light reaches him; standing still, he is just another prop.",1000);}}}
   else seen=Math.max(0,seen-dt*2);
   if(x>=C.len-40&&state==="play"){state="done";api.message("Dinner, centre stage!");K.burst(C.len-cam,FLOOR-40,"#ffd76a",30,190);K.end(true,"",1100);}
   else if(left<=0&&state==="play"){state="done";K.end(false,"The show ended before he crossed. Move the instant each light swings away.",900);}
   cam=lerp(cam,clamp(x-110,0,C.len-W+40),dt*5);
  },
  draw(ctx,t){
   ctx.fillStyle="#1b0f1f";ctx.fillRect(0,0,W,H);
   // back curtain in slow parallax, then stage boards
   for(let i=-1;i<12;i++){const cx=i*44-((cam*.4)%44);ctx.fillStyle=i%2?"#5c1222":"#741a2e";ctx.fillRect(cx,0,44,FLOOR-10);}
   ctx.fillStyle="#e8b84a";ctx.fillRect(0,0,W,10);for(let i=0;i<10;i++){ctx.beginPath();ctx.arc(i*44-((cam*.4)%44)+22,10,22,0,Math.PI);ctx.fillStyle="#8a1e36";ctx.fill();}
   ctx.fillStyle="#6b4226";ctx.fillRect(0,FLOOR-10,W,H-FLOOR+10);ctx.strokeStyle="#4a2c16";ctx.lineWidth=2;for(let i=0;i<12;i++){const bx=i*40-(cam%40);ctx.beginPath();ctx.moveTo(bx,FLOOR-10);ctx.lineTo(bx-14,H);ctx.stroke();}
   ctx.fillStyle="#8a5a36";ctx.fillRect(0,FLOOR-10,W,4);
   // props he could be mistaken for, and checkpoint flags
   for(let i=0;i<9;i++){const px=140+i*(C.len/9)-cam;if(px<-60||px>W+60)continue;if(i%3===0){ctx.fillStyle="#3f6b46";ctx.beginPath();ctx.moveTo(px,FLOOR-10);ctx.lineTo(px+22,FLOOR-84);ctx.lineTo(px+44,FLOOR-10);ctx.fill();ctx.fillStyle="#5a3a1c";ctx.fillRect(px+18,FLOOR-14,8,6);}
    else if(i%3===1){ctx.fillStyle="#9a7446";ctx.strokeStyle="#5a3a1c";ctx.lineWidth=2;ctx.fillRect(px,FLOOR-44,38,34);ctx.strokeRect(px,FLOOR-44,38,34);ctx.beginPath();ctx.moveTo(px,FLOOR-44);ctx.lineTo(px+38,FLOOR-10);ctx.stroke();}
    else{ctx.fillStyle="#c9c2d8";rr(ctx,px+8,FLOOR-70,22,60,10);ctx.fill();ctx.beginPath();ctx.arc(px+19,FLOOR-76,11,0,TAU);ctx.fill();}}
   checks.forEach((c,i)=>{if(!i)return;const px=c-cam;ctx.strokeStyle="#e8d9b0";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px,FLOOR-10);ctx.lineTo(px,FLOOR-52);ctx.stroke();ctx.fillStyle=i<=cp?"#7be39a":"#8f8aa8";ctx.beginPath();ctx.moveTo(px,FLOOR-52);ctx.lineTo(px+16,FLOOR-45);ctx.lineTo(px,FLOOR-38);ctx.fill();});
   const ex=C.len-cam;ctx.fillStyle="#7b4a26";rr(ctx,ex-34,FLOOR-34,80,9,4);ctx.fill();ctx.fillRect(ex-26,FLOOR-26,7,18);ctx.fillRect(ex+32,FLOOR-26,7,18);K.drawIcon("roast",ex+6,FLOOR-52,38);
   ctx.strokeStyle="#d8d2e8";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(ex+64,FLOOR-10);ctx.lineTo(ex+64,FLOOR-70);ctx.stroke();ctx.fillStyle="rgba(255,244,200,"+(.7+.3*Math.sin(t*6))+")";ctx.beginPath();ctx.arc(ex+64,FLOOR-76,7,0,TAU);ctx.fill();
   // the wolf: tiptoeing, or frozen stiff like a statue
   const still=!held||caught>0,inLight=lit();
   if(!(caught>0&&Math.floor(t*14)%2)){
    const bob=still?0:Math.abs(Math.sin(walk))*3;
    K.drawWolf(state==="done"&&lives>0&&left>0?"joy":caught>0?"scared":still&&inLight?"scared":"idle",x-cam,FLOOR-6-bob,50,1,still?0:Math.sin(walk)*.05);
    if(still&&inLight&&caught<=0){ctx.fillStyle="#fff";ctx.font="700 11px system-ui,sans-serif";ctx.textAlign="center";ctx.fillText("…just a prop…",x-cam,FLOOR-64);}
   }
   // spotlights: a cone from the rig and a pool on the floor
   ctx.save();ctx.globalCompositeOperation="lighter";
   for(const l of lights){const lx=l.x-cam;if(lx<-90||lx>W+90)continue;
    if(!l.on){if(l.warn){ctx.fillStyle="rgba(255,240,180,.12)";ctx.beginPath();ctx.ellipse(lx,FLOOR,C.r,9,0,0,TAU);ctx.fill();}continue;}
    const hot=Math.abs(l.x-x)<C.r-8&&held;
    const g=ctx.createLinearGradient(0,0,0,FLOOR);g.addColorStop(0,hot?"rgba(255,120,120,.5)":"rgba(255,240,180,.42)");g.addColorStop(1,hot?"rgba(255,120,120,.14)":"rgba(255,240,180,.12)");
    ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(l.cx-cam-6,0);ctx.lineTo(l.cx-cam+6,0);ctx.lineTo(lx+C.r,FLOOR);ctx.lineTo(lx-C.r,FLOOR);ctx.closePath();ctx.fill();
    ctx.fillStyle=hot?"rgba(255,120,120,.4)":"rgba(255,240,180,.32)";ctx.beginPath();ctx.ellipse(lx,FLOOR,C.r,9,0,0,TAU);ctx.fill();}
   ctx.restore();
   for(const l of lights){const rx=l.cx-cam;if(rx<-20||rx>W+20)continue;ctx.fillStyle="#2a2433";rr(ctx,rx-9,0,18,14,4);ctx.fill();}
   if(alarm>0){ctx.fillStyle="rgba(255,60,60,"+(alarm*.22)+")";ctx.fillRect(0,0,W,H);}
   // front curtain edge and the row of footlights
   for(let i=0;i<9;i++){ctx.fillStyle="rgba(255,236,150,"+(.5+.4*Math.sin(t*3+i))+")";ctx.beginPath();ctx.arc(20+i*40,H-12,4,0,TAU);ctx.fill();}
   K.drawParts(cam,0);
   ctx.fillStyle="#0008";rr(ctx,70,16,220,8,4);ctx.fill();ctx.fillStyle="#ffd76a";rr(ctx,70,16,220*clamp(x/C.len,0,1),8,4);ctx.fill();
   K.hearts(lives,Math.max(0,Math.ceil(left))+"s");
   if(state==="ready")K.banner("Hold to sneak","Let go to freeze when a light is on him");
  }});
 api.instructions("Hold your finger down to tiptoe across the stage. Let go to freeze. If a spotlight catches him moving, it is back to the last flag.");
 api.message("Standing still in the light is safe. Moving in it is not.");
 return{destroy(){K.destroy();},preview:()=>({state,x,lives,cam,danger:lights.some(l=>l.on&&Math.abs(l.x-x-10)<C.r+16)})};
}

/* ---------- Garden Delivery (Moonlit Conservatory): hop dinner across paths, beetles and the lily pond ---------- */
function run(api){
 const hard=api.hard,e=api.ease||0;
 const CW=44,CH=42,COLS=8,X0=4,ROWS=10,sp=(hard?1.3:1)*(1-e*.12);
 const C={goal:hard?4:3,lives:(hard?3:3)+e};
 // row 0 is the wolf, row 9 the start. Each lane: kind, speed (px/s, sign = direction), then things in it as [x, width].
 const lane=(kind,v,gap,w,n)=>({kind,v:v*sp,span:Math.max(W+80,n*gap),items:Array.from({length:n},(_,i)=>({x:i*gap+(kind==="water"?10:30),w}))});
 const LANES=hard?[null,lane("water",-34,150,84,3),lane("water",46,170,70,3),lane("bugs",-62,150,38,3),lane("bugs",84,210,38,2),lane("water",-40,160,80,3),lane("safe",0,1,1,0),lane("bugs",-90,230,60,2),lane("bugs",58,170,38,3),null]
  :[null,lane("water",-30,150,92,3),lane("water",38,170,84,3),lane("safe",0,1,1,0),lane("bugs",-52,170,38,3),lane("bugs",64,230,38,2),lane("safe",0,1,1,0),lane("bugs",-44,180,38,3),lane("bugs",50,200,38,2),null];
 const DISH=["roast","cheese","fish","apple"];
 let state="ready",lives=C.lives,done=0,col=3.5,row=9,hop=null,inv=0,dead=0,gulp=0,sx=0,sy=0,deadKind="",T=0;
 const px=()=>X0+col*CW,py=r=>r*CH+CH/2;
 const reset=()=>{col=3.5;row=9;hop=null;};
 const wrap=(L,x)=>((x%L.span)+L.span)%L.span-60;
 function die(kind){if(inv>0||dead>0)return;lives--;dead=.8;deadKind=kind;K.shake(8);api.sound(false);K.burst(px(),py(row),kind==="splash"?"#8fd3ff":"#ff9c9c",14);K.pop(px(),py(row)-26,kind==="splash"?"Splash!":"Squashed!","#ffd0d0");
  if(lives<=0){state="done";K.end(false,kind==="splash"?"Dinner went in the pond. On water it must land on a lily pad: watch one drift in, then hop.":"A beetle got dinner. Wait at the edge of a lane and hop through the gap behind a beetle.",900);}}
 function step(dx,dy){
  if(state!=="play"||hop||dead>0)return;
  const nr=clamp(row+dy,0,9),nc=clamp(col+dx,.5,COLS-.5);if(nr===row&&nc===col)return;
  hop={fc:col,fr:row,tc:nc,tr:nr,t:0};api.tone(dy<0?620:480,.05);
 }
 const K=A.kit(api,{label:"Garden Delivery",
  down(x,y){sx=x;sy=y;if(K.over)return;if(state==="ready"){state="play";api.message("Tap to hop forward. Swipe to step sideways or back.");sx=-999;}},
  up(x,y){if(sx===-999||state!=="play")return;const dx=x-sx,dy=y-sy;if(Math.abs(dx)>20&&Math.abs(dx)>Math.abs(dy))step(dx>0?1:-1,0);else if(dy>24)step(0,1);else step(0,-1);},
  update(dt,t){
   T=t;inv=Math.max(0,inv-dt);gulp=Math.max(0,gulp-dt);
   for(const L of LANES)if(L)for(const it of L.items)it.x+=L.v*dt;
   if(state!=="play")return;
   if(dead>0){dead-=dt;if(dead<=0){reset();inv=1;}return;}
   if(hop){hop.t+=dt/.12;if(hop.t>=1){col=hop.tc;row=hop.tr;hop=null;
     if(row===0){done++;gulp=.7;K.burst(W/2,CH/2,"#ffd76a",20,160);K.pop(W/2,CH+10,"Delicious!");api.tone(880,.12);if(done>=C.goal){state="done";api.message("Every dish delivered!");K.end(true,"",1000);}else{reset();inv=.6;}}}
    return;}
   const L=LANES[row];if(!L)return;
   if(L.kind==="bugs"){for(const it of L.items)if(Math.abs(wrap(L,it.x)+it.w/2-px())<it.w/2+11){die("bug");break;}}
   else if(L.kind==="water"){const pad=L.items.find(it=>Math.abs(wrap(L,it.x)+it.w/2-px())<it.w/2-4);if(!pad)die("splash");else{col+=L.v*dt/CW;if(px()<8||px()>W-8)die("splash");}}
  },
  draw(ctx,t){
   for(let r=0;r<ROWS;r++){const L=LANES[r],y=r*CH;
    ctx.fillStyle=r===0?"#3a2c50":!L||L.kind==="safe"?(r%2?"#2f7a52":"#348558"):L.kind==="water"?"#1f5f8a":"#b9a57a";ctx.fillRect(0,y,W,CH);
    if(L&&L.kind==="water"){ctx.strokeStyle="#ffffff22";ctx.lineWidth=2;for(let k=0;k<5;k++){const wx=((k*90+t*L.v*.6)%(W+60)+W+60)%(W+60)-30;ctx.beginPath();ctx.moveTo(wx,y+12+k%2*16);ctx.quadraticCurveTo(wx+10,y+7+k%2*16,wx+20,y+12+k%2*16);ctx.stroke();}}
    if(L&&L.kind==="bugs"){ctx.strokeStyle="#00000018";ctx.lineWidth=2;ctx.setLineDash([10,12]);ctx.beginPath();ctx.moveTo(0,y+CH/2);ctx.lineTo(W,y+CH/2);ctx.stroke();ctx.setLineDash([]);}
    if(!L||L.kind==="safe"){for(let k=0;k<6;k++){const fx=(k*67+r*31)%W;ctx.fillStyle=k%2?"#f4b8e0":"#fff6c8";ctx.beginPath();ctx.arc(fx,y+10+(k*13)%22,2.4,0,TAU);ctx.fill();}}
   }
   for(let r=1;r<9;r++){const L=LANES[r];if(!L)continue;const y=r*CH+CH/2;
    for(const it of L.items){const x=wrap(L,it.x);if(x>W+10||x+it.w<-10)continue;
     if(L.kind==="water"){ctx.fillStyle="#3fae6a";ctx.strokeStyle="#1f6a3f";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x+it.w/2,y,it.w/2,15,0,.25,TAU-.25);ctx.lineTo(x+it.w/2,y);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle="#f6c9ee";ctx.beginPath();ctx.arc(x+it.w*.3,y-4,4,0,TAU);ctx.fill();}
     else{const d=L.v>0?1:-1,cx=x+it.w/2,big=it.w>50;ctx.save();ctx.translate(cx,y);ctx.scale(d,1);   // a beetle, or a snail for the wide ones
      if(big){ctx.fillStyle="#e7d3a2";rr(ctx,-28,2,56,10,5);ctx.fill();ctx.fillStyle="#b9773a";ctx.strokeStyle="#5c3a14";ctx.lineWidth=2;ctx.beginPath();ctx.arc(-4,-2,14,0,TAU);ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(-4,-2,7,0,TAU);ctx.stroke();ctx.strokeStyle="#e7d3a2";ctx.beginPath();ctx.moveTo(24,4);ctx.lineTo(28,-8);ctx.stroke();}
      else{const lg=Math.sin(t*18+it.x)*3;ctx.strokeStyle="#1a1024";ctx.lineWidth=2;for(const k of [-9,0,9]){ctx.beginPath();ctx.moveTo(k,0);ctx.lineTo(k+lg,-15);ctx.moveTo(k,0);ctx.lineTo(k-lg,15);ctx.stroke();}
       ctx.fillStyle="#7c3aed";ctx.strokeStyle="#2e1065";ctx.beginPath();ctx.ellipse(0,0,17,11,0,0,TAU);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(-14,0);ctx.lineTo(10,0);ctx.stroke();ctx.fillStyle="#2e1065";ctx.beginPath();ctx.arc(15,0,6,0,TAU);ctx.fill();ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(17,-2,1.6,0,TAU);ctx.fill();}
      ctx.restore();}
    }}
   // the wolf at his table along the top
   ctx.fillStyle="#7b4a26";rr(ctx,W/2-70,CH-12,140,9,4);ctx.fill();
   K.drawWolf(gulp>0||(state==="done"&&done>=C.goal)?"joy":"idle",W/2,CH-8,40+(gulp>0?5:0));
   for(let i=0;i<C.goal;i++){ctx.globalAlpha=i<done?1:.25;K.drawIcon(DISH[i%4],W/2-58+(i>1?i+1:i)*29+(i>1?0:0),CH-22,20);}ctx.globalAlpha=1;
   // dinner itself, on little legs
   if(state!=="done"||done<C.goal){
    let x=px(),y=py(row),lift=0;
    if(hop){const k=hop.t;x=X0+lerp(hop.fc,hop.tc,k)*CW;y=lerp(py(hop.fr),py(hop.tr),k);lift=Math.sin(k*Math.PI)*12;}
    if(dead>0){ctx.globalAlpha=dead/.8;}
    if(!(inv>0&&Math.floor(t*14)%2)){
     ctx.fillStyle="#0004";ctx.beginPath();ctx.ellipse(x,y+13,11,3.5,0,0,TAU);ctx.fill();
     const k=hop?Math.sin(hop.t*Math.PI*2)*4:Math.sin(t*6)*1;ctx.strokeStyle="#3a2412";ctx.lineWidth=3;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(x-5,y+6-lift);ctx.lineTo(x-6-k,y+13-lift);ctx.moveTo(x+5,y+6-lift);ctx.lineTo(x+6+k,y+13-lift);ctx.stroke();
     ctx.save();ctx.translate(x,y-4-lift);if(dead>0&&deadKind==="bug")ctx.scale(1.3,.35);K.drawIcon(DISH[done%4],0,0,32);ctx.restore();
    }
    ctx.globalAlpha=1;
   }
   K.drawParts();
   K.hearts(lives,"Delivered "+done+" / "+C.goal);
   if(state==="ready")K.banner("Tap to start","Tap = hop forward · swipe = sideways or back");
  }});
 api.instructions("Dinner has grown legs. Tap to hop it forward, swipe to step sideways or back. Dodge the beetles, ride the lily pads, and get every dish to the wolf.");
 api.message("On the pond you must land on a lily pad.");
 return{destroy(){K.destroy();},preview:()=>({state,done,lives,row,col,busy:!!hop||dead>0,ok:(()=>{const L=LANES[row-1];if(!L||L.kind==="safe")return true;const x=px();
   return L.kind==="bugs"?!L.items.some(it=>{const c=wrap(L,it.x+L.v*.12)+it.w/2;return Math.abs(c-x)<it.w/2+26||Math.abs(c+L.v*.5-x)<it.w/2+20;}):L.items.some(it=>Math.abs(wrap(L,it.x+L.v*.12)+it.w/2-x)<it.w/2-12);})()})};
}

/* ---------- The Dinner Machine (Clockwork Citadel): tilt the planks, drop the meatball, ring the bell, fill the bowl ---------- */
const ANGLES=[-.5,-.25,0,.25,.5],STEP=1/120,BR=9;
const LEVELS=[
 /*LEVELS-START*/
 {ball:[60,34],planks:[[78,104,84],[208,173,84],[84,245,84]],pegs:[[159,274,12]],walls:[[44,318,128,346],[316,318,186,346]],bell:[127,194,15],bowl:[157,376,54],start:[2,2,2]},   // 11 of 125 tilt sets work
 {ball:[60,34],planks:[[88,99,84],[206,172,84],[106,235,84]],pegs:[[313,285,12]],walls:[[44,318,190,346],[316,318,248,346]],bell:[196,247,15],bowl:[219,376,54],start:[2,2,2]}    // 4 of 125
 /*LEVELS-END*/
];
/* The physics is a fixed-step ball against line segments, so the same tilts always give the same run (and the tests can prove a level is solvable). */
function makeSim(level,idx){
 const segs=[],b={x:level.ball[0],y:level.ball[1],vx:0,vy:0};
 level.planks.forEach((p,i)=>{const a=ANGLES[idx[i]],dx=Math.cos(a)*p[2]/2,dy=Math.sin(a)*p[2]/2;segs.push([p[0]-dx,p[1]-dy,p[0]+dx,p[1]+dy,.3]);});
 segs.push([6,0,6,H,.4],[W-6,0,W-6,H,.4]);
 for(const w of level.walls||[])segs.push([w[0],w[1],w[2],w[3],.25]);
 const bw=level.bowl,bx=bw[0],by=bw[1],hw=bw[2]/2;
 segs.push([bx-hw,by-26,bx-hw+6,by+14,.2],[bx+hw,by-26,bx+hw-6,by+14,.2],[bx-hw+6,by+14,bx+hw-6,by+14,.1]);
 const lid=[bx-hw-4,by-28,bx+hw+4,by-28,.3];
 const S={b,t:0,rang:false,tRang:-1,open:false,end:null,still:0,hits:0};
 S.step=function(){
  if(S.end)return;
  S.t+=STEP;b.vy+=720*STEP;b.x+=b.vx*STEP;b.y+=b.vy*STEP;
  if(S.rang&&!S.open&&S.t>=S.tRang+.35)S.open=true;
  const all=S.open?segs:segs.concat([lid]);
  for(const s of all){
   const ex=s[2]-s[0],ey=s[3]-s[1],L=ex*ex+ey*ey,k=clamp(((b.x-s[0])*ex+(b.y-s[1])*ey)/L,0,1),cx=s[0]+ex*k,cy=s[1]+ey*k,dx=b.x-cx,dy=b.y-cy,d=Math.hypot(dx,dy);
   if(d<BR&&d>1e-6){const nx=dx/d,ny=dy/d;b.x=cx+nx*BR;b.y=cy+ny*BR;const vn=b.vx*nx+b.vy*ny;if(vn<0){if(vn<-60)S.hits++;b.vx-=(1+s[4])*vn*nx;b.vy-=(1+s[4])*vn*ny;const tx=-ny,ty=nx,vt=b.vx*tx+b.vy*ty;b.vx-=vt*.012*tx;b.vy-=vt*.012*ty;}}
  }
  for(const p of level.pegs){const dx=b.x-p[0],dy=b.y-p[1],d=Math.hypot(dx,dy),R=BR+p[2];if(d<R&&d>1e-6){const nx=dx/d,ny=dy/d;b.x=p[0]+nx*R;b.y=p[1]+ny*R;const vn=b.vx*nx+b.vy*ny;if(vn<0){b.vx-=1.8*vn*nx;b.vy-=1.8*vn*ny;S.hits++;S.peg=p;}}}
  if(!S.rang&&Math.hypot(b.x-level.bell[0],b.y-level.bell[1])<BR+level.bell[2]){S.rang=true;S.tRang=S.t;}
  if(S.open&&Math.abs(b.x-bx)<hw-8&&b.y>by-6&&b.y<by+14){S.end="bowl";return;}
  if(b.y>H+20){S.end="fell";return;}
  if(Math.hypot(b.vx,b.vy)<14)S.still+=STEP;else S.still=0;
  if(S.still>1||S.t>14)S.end="stuck";
 };
 return S;
}
function simulate(level,idx){const S=makeSim(level,idx);while(!S.end)S.step();return{win:S.end==="bowl",end:S.end,rang:S.rang,t:S.t};}
function chain(api){
 const hard=api.hard,e=api.ease||0,level=LEVELS[hard?1:0];
 const idx=level.start.slice(),shown=idx.map(i=>ANGLES[i]);
 const DROPS=(hard?6:8)+e*3;
 let drops=0,sim=null,acc=0,trail=[],ghost=[],bellSwing=0,spark=-1,lidA=0,state="set",fed=0,pegFlash=null,pegT=0,done=false;
 function hud(){api.hud.innerHTML='<div class="fw-arc-hud"><b>Drops left: '+(DROPS-drops)+'</b><button type="button" class="fw-pipe-test" data-drop'+(state!=="set"?' disabled':'')+'>Drop!</button></div>';}
 function drop(){if(state!=="set"||done)return;state="run";sim=makeSim(level,idx);acc=0;trail=[];spark=-1;lidA=0;bellSwing=0;api.message("There it goes...");api.tone(300,.1);hud();}
 const clickHud=ev=>{if(ev.target.closest&&ev.target.closest("[data-drop]"))drop();};
 api.hud.addEventListener("click",clickHud);
 const K=A.kit(api,{label:"The Dinner Machine",
  down(x,y){
   if(state!=="set"||done)return;
   let best=-1,bd=46;level.planks.forEach((p,i)=>{const d=Math.hypot(p[0]-x,p[1]-y);if(d<bd){bd=d;best=i;}});
   if(best<0)return;
   // tap the left half to tip it left-side-down, the right half for right-side-down
   const dir=x<level.planks[best][0]?-1:1,n=clamp(idx[best]+dir,0,4);
   if(n===idx[best]){api.tone(180,.05);return;}idx[best]=n;ghost=[];api.tone(380+n*50,.06);api.message("Tilted. Press Drop! to try it.");
  },
  update(dt,t){
   for(let i=0;i<shown.length;i++)shown[i]=lerp(shown[i],ANGLES[idx[i]],Math.min(1,dt*14));
   bellSwing=Math.max(0,bellSwing-dt);pegT=Math.max(0,pegT-dt);fed=Math.max(0,fed-dt);
   if(spark>=0)spark+=dt/.35;
   if(sim&&sim.open)lidA=Math.min(1,lidA+dt*6);
   if(state!=="run")return;
   acc+=dt;
   while(acc>=STEP&&!sim.end){
    const h0=sim.hits,r0=sim.rang;sim.step();acc-=STEP;
    if(sim.hits>h0){api.tone(240+Math.random()*120,.04);if(sim.peg){pegFlash=sim.peg;pegT=.2;sim.peg=null;K.burst(sim.b.x,sim.b.y,"#ffd8a0",5,80);}}
    if(sim.rang&&!r0){bellSwing=1;spark=0;api.tone(1320,.5);api.tone(1760,.4);K.burst(level.bell[0],level.bell[1],"#ffe07a",16,150);K.pop(level.bell[0],level.bell[1]-26,"Ding!");}
    if(trail.length===0||Math.hypot(trail[trail.length-1][0]-sim.b.x,trail[trail.length-1][1]-sim.b.y)>9)trail.push([sim.b.x,sim.b.y]);
   }
   if(sim.end){
    drops++;ghost=trail;
    if(sim.end==="bowl"){state="won";done=true;fed=1.2;api.message("Straight into the bowl!");K.burst(level.bowl[0],level.bowl[1]-10,"#ffd76a",30,190);hud();K.end(true,"",1300);return;}
    K.burst(clamp(sim.b.x,10,W-10),clamp(sim.b.y,10,H-10),"#c9884a",10);api.sound(false);
    api.message(sim.end==="fell"?"It dropped out of the machine. The dotted line shows where it went.":!sim.rang?"It stopped before ringing the bell. The lid only opens when the bell rings.":"It rang the bell but stopped short of the bowl.");
    if(drops>=DROPS){done=true;state="lost";hud();K.end(false,"Out of meatballs. Follow the dotted line from your last try and change just the plank where it went wrong.",700);return;}
    state="set";sim=null;hud();
   }
  },
  draw(ctx,t){
   const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,"#2a1c16");g.addColorStop(1,"#4a3020");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
   ctx.strokeStyle="#ffffff0c";ctx.lineWidth=1;for(let x=30;x<W;x+=30){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}for(let y=30;y<H;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
   ctx.fillStyle="#6e4a2e";ctx.fillRect(0,0,6,H);ctx.fillRect(W-6,0,6,H);
   // chute the meatball comes out of
   const bx0=level.ball[0],by0=level.ball[1];ctx.fillStyle="#8a6038";ctx.strokeStyle="#4a2c16";ctx.lineWidth=2;rr(ctx,bx0-18,0,36,by0+2,6);ctx.fill();ctx.stroke();ctx.fillStyle="#2a1c16";ctx.fillRect(bx0-11,by0-6,22,10);
   // last try, dotted
   ctx.fillStyle="#ffe9a855";for(const p of ghost){ctx.beginPath();ctx.arc(p[0],p[1],1.8,0,TAU);ctx.fill();}
   // the rope from bell to lid, with the spark that runs along it
   const bl=level.bell,bw=level.bowl,hw=bw[2]/2,hx=bw[0]+hw+4,hy=bw[1]-28;
   ctx.strokeStyle="#c9a877";ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(bl[0],bl[1]+bl[2]);ctx.lineTo(bl[0],hy-30);ctx.lineTo(hx,hy-30);ctx.lineTo(hx,hy);ctx.stroke();ctx.setLineDash([]);
   if(spark>=0&&spark<1){const pts=[[bl[0],bl[1]+bl[2]],[bl[0],hy-30],[hx,hy-30],[hx,hy]];let L=0;const ls=[];for(let i=1;i<pts.length;i++){const d=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);ls.push(d);L+=d;}let s=spark*L,i=0;while(i<ls.length-1&&s>ls[i]){s-=ls[i];i++;}const k=ls[i]?s/ls[i]:0;ctx.fillStyle="#fff2b0";ctx.beginPath();ctx.arc(lerp(pts[i][0],pts[i+1][0],k),lerp(pts[i][1],pts[i+1][1],k),5,0,TAU);ctx.fill();}
   // bell
   ctx.save();ctx.translate(bl[0],bl[1]-bl[2]);ctx.rotate(Math.sin(t*26)*bellSwing*.5);ctx.fillStyle="#e8b84a";ctx.strokeStyle="#7a5410";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-bl[2],bl[2]*1.9);ctx.quadraticCurveTo(-bl[2],0,0,0);ctx.quadraticCurveTo(bl[2],0,bl[2],bl[2]*1.9);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle="#7a5410";ctx.beginPath();ctx.arc(0,bl[2]*2,4,0,TAU);ctx.fill();ctx.restore();
   if(!(sim&&sim.rang)&&state!=="won"){ctx.fillStyle="#ffe9a8";ctx.font="700 10px system-ui,sans-serif";ctx.textAlign="center";ctx.fillText("RING ME",bl[0],bl[1]-bl[2]-6);}
   for(const w of level.walls||[]){ctx.strokeStyle="#5c3a14";ctx.lineWidth=9;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(w[0],w[1]);ctx.lineTo(w[2],w[3]);ctx.stroke();ctx.strokeStyle="#8a6038";ctx.lineWidth=5;ctx.stroke();}
   // pegs: bouncy brass drums
   for(const p of level.pegs){const f=pegFlash===p&&pegT>0;ctx.fillStyle=f?"#fff2b0":"#c98b3c";ctx.strokeStyle="#5c3a14";ctx.lineWidth=2;ctx.beginPath();ctx.arc(p[0],p[1],p[2]+(f?2:0),0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle="#5c3a14";ctx.beginPath();ctx.arc(p[0],p[1],3,0,TAU);ctx.fill();}
   // planks, with a pivot bolt and tilt arrows while you can still change them
   level.planks.forEach((p,i)=>{ctx.save();ctx.translate(p[0],p[1]);ctx.rotate(shown[i]);ctx.fillStyle="#b9773a";ctx.strokeStyle="#5c3a14";ctx.lineWidth=2;rr(ctx,-p[2]/2,-5,p[2],10,5);ctx.fill();ctx.stroke();ctx.strokeStyle="#00000022";ctx.beginPath();ctx.moveTo(-p[2]/2+8,0);ctx.lineTo(p[2]/2-8,0);ctx.stroke();ctx.restore();
    ctx.fillStyle="#f1cf8a";ctx.strokeStyle="#5c3a14";ctx.beginPath();ctx.arc(p[0],p[1],5,0,TAU);ctx.fill();ctx.stroke();
    if(state==="set"){ctx.fillStyle="rgba(255,233,168,"+(.55+.25*Math.sin(t*4+i))+")";ctx.font="700 13px system-ui,sans-serif";ctx.textAlign="center";if(idx[i]>0)ctx.fillText("▼",p[0]-p[2]/2-2,p[1]+26);if(idx[i]<4)ctx.fillText("▼",p[0]+p[2]/2+2,p[1]+26);}});
   // bowl, lid, and the wolf waiting beside it
   const lx=bw[0]-hw-4;ctx.save();ctx.translate(hx,hy);ctx.rotate(-lidA*1.9);ctx.fillStyle="#8d99b8";ctx.strokeStyle="#3a4260";ctx.lineWidth=2;rr(ctx,lx-hx,-4,hx-lx,7,3);ctx.fill();ctx.stroke();ctx.restore();
   ctx.fillStyle="#f4f1ea";ctx.strokeStyle="#6b6480";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(bw[0]-hw-3,bw[1]-26);ctx.lineTo(bw[0]-hw+7,bw[1]+18);ctx.lineTo(bw[0]+hw-7,bw[1]+18);ctx.lineTo(bw[0]+hw+3,bw[1]-26);ctx.lineTo(bw[0]+hw-5,bw[1]-26);ctx.lineTo(bw[0]+hw-11,bw[1]+10);ctx.lineTo(bw[0]-hw+11,bw[1]+10);ctx.lineTo(bw[0]-hw+5,bw[1]-26);ctx.closePath();ctx.fill();ctx.stroke();
   const wx=bw[0]>W/2?bw[0]-hw-34:bw[0]+hw+34;K.drawWolf(state==="won"?"joy":state==="lost"?"sad":"idle",wx,bw[1]+22+(fed>0?-Math.abs(Math.sin(fed*12))*6:0),50,wx<bw[0]?1:-1);
   // the meatball
   const b=sim?sim.b:{x:bx0,y:by0};if(state!=="lost"){ctx.fillStyle="#0003";ctx.beginPath();ctx.arc(b.x+1,b.y+2,BR,0,TAU);ctx.fill();ctx.fillStyle="#a8502c";ctx.strokeStyle="#5a2412";ctx.lineWidth=2;ctx.beginPath();ctx.arc(b.x,b.y,BR,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle="#d98a5a";ctx.beginPath();ctx.arc(b.x-3,b.y-3,2.6,0,TAU);ctx.fill();}
   K.drawParts();
  }});
 hud();
 api.instructions("Tap the low or high end of a plank to tilt it, then press Drop! The meatball must ring the bell, which pulls the lid off the bowl, then land in the bowl.");
 api.message("Tap a plank's left side to tip that side down, its right side to tip the other way.");
 return{destroy(){K.destroy();api.hud.removeEventListener("click",clickHud);},preview:()=>({state,drops,idx:idx.slice()})};
}
root.FTWChainRules=Object.freeze({LEVELS,ANGLES,simulate,makeSim});
if(root.FTWBonus&&A.kit){root.FTWBonus.register("firefly",firefly);root.FTWBonus.register("sneak",sneak);root.FTWBonus.register("run",run);root.FTWBonus.register("chain",chain);}
})(typeof window!=="undefined"?window:{});
