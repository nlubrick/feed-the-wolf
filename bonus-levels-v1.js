/* Feed the Wolf bonus arcade: 15 inserted stages with independent game modes.
   Original 100 pull-the-pin definitions, save indices and rewards are unchanged. */
(function(root){
"use strict";
const chapters=["The Castle","The Wizard's Tower","Clockwork Citadel","Moonlit Conservatory","Ghostlight Theatre"];
const modes=["match","pipes","hidden"];
const modesTitle={match:"Feast Match",pipes:"Pantry Panic",hidden:"Dinner Detective"};
const titles=[
["The Larder Shuffle","Copper Pipes","The Missing Feast"],
["Enchanted Ingredients","Potion Plumbing","The Vanished Recipe"],
["Clockwork Snacks","Factory Feedline","The Hidden Gear"],
["Moonlit Harvest","Garden Irrigation","The Secret Bouquet"],
["Curtain Call Combo","Backstage Flow","The Final Prop"]];
const stages=[],bonus=[];
for(let i=0;i<100;i++){
 stages.push({number:stages.length+1,type:"puzzle",puzzleIndex:i,chapter:Math.floor(i/20)});
 const kind=[4,11,18].indexOf(i%20);
 if(kind!==-1){
  const chapter=Math.floor(i/20);
  const stage={number:stages.length+1,type:"bonus",mode:modes[kind],
   chapter,bonusIndex:bonus.length,afterPuzzleIndex:i,title:titles[chapter][kind],reward:5+chapter*2};
  stages.push(stage);bonus.push(stage);
 }
}
function at(number){return Number.isInteger(number)?stages[number-1]||null:null;}
function puzzleStage(index){return stages.find(s=>s.type==="puzzle"&&s.puzzleIndex===index)||null;}
const registered={};
function register(mode,factory){if(!modes.includes(mode)||typeof factory!=="function")throw Error("Invalid bonus game");registered[mode]=factory;}
class Music{
 constructor(){this.ctx=null;this.interval=null;this.step=0;this.enabled=false;}
 start(mode,chapter,enabled){
  this.stop();this.mode=mode;this.chapter=chapter;this.step=0;this.enabled=!!enabled;
  if(!this.enabled)return;
  try{
   const AC=root.AudioContext||root.webkitAudioContext;if(!AC)return;
   this.ctx=new AC();if(this.ctx.state==="suspended")this.ctx.resume().catch(()=>{});
   this.tick();
   this.interval=setInterval(()=>this.tick(),mode==="match"?205:mode==="pipes"?255:330);
  }catch(e){this.stop();}
 }
 note(freq,duration=.15,shape="triangle",volume=.025){
  if(!this.ctx||!this.enabled)return;
  try{
   const c=this.ctx,t=c.currentTime,o=c.createOscillator(),g=c.createGain();
   o.type=shape;o.frequency.setValueAtTime(freq,t);
   g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(volume,t+.018);
   g.gain.exponentialRampToValueAtTime(.001,t+duration);
   o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+duration+.025);
  }catch(e){}
 }
 tick(){
  const i=this.step++%16,shift=this.chapter*2;
  if(this.mode==="match"){
   const riff=[0,4,7,12,9,7,4,7,0,5,9,12,9,5,7,4];
   this.note(330*Math.pow(2,(riff[i]+shift)/12),.19,"triangle",.028);
   if(i%4===0)this.note(165*Math.pow(2,shift/12),.28,"sine",.036);
  }else if(this.mode==="pipes"){
   this.note(i%2?660:900,.055,"square",i%4===0?.012:.006);
   if(i%4===0)this.note(110*Math.pow(2,shift/12),.19,"triangle",.036);
   if(i===7||i===15)this.note(230*Math.pow(2,shift/12),.13,"sawtooth",.017);
  }else{
   const riff=[0,7,3,10,5,12,7,3,0,5,10,14,10,5,3,7];
   this.note(247*Math.pow(2,(riff[i]+shift)/12),.44,"sine",.025);
   if(i%4===0)this.note(124*Math.pow(2,shift/12),.65,"triangle",.012);
  }
 }
 fx(ok){
  if(!this.ctx)return;
  this.note(ok?660:230,ok?.22:.14,"sine",.045);
  if(ok)setTimeout(()=>this.note(880,.22,"sine",.035),85);
 }
 stop(){
  if(this.interval)clearInterval(this.interval);this.interval=null;
  const c=this.ctx;this.ctx=null;if(c)try{c.close()}catch(e){}
 }
}
class Controller{
 constructor(node,cb){this.node=node;this.cb=cb;this.music=new Music();this.stage=null;this.mode=null;
  this.node.addEventListener("click",e=>{
   const b=e.target.closest("[data-bonus-action]");if(!b)return;
   const a=b.dataset.bonusAction;
   if(a==="skip")this.cb.finish(this.stage,false);
   else if(a==="back")this.cb.back(this.stage);
   else if(a==="retry")this.start(this.stage);
   else if(a==="continue")this.cb.finish(this.stage,true);
   else if(a==="music"){
    this.cb.toggleMusic();b.textContent="Music: "+(this.cb.musicEnabled()?"On":"Off");
    this.music.start(this.stage.mode,this.stage.chapter,this.cb.musicEnabled());
   }
  });
 }
 start(stage){
  if(!stage||stage.type!=="bonus"||!registered[stage.mode])throw Error("Bonus level not available");
  this.stop();this.stage=stage;
  this.node.innerHTML='<div class="fw-bonus fw-world-'+stage.chapter+' fw-'+stage.mode+'">'+
   '<header class="fw-bonus-header"><div><p class="fw-bonus-kicker">BONUS LEVEL '+stage.number+
   ' OF 115 · '+chapters[stage.chapter]+'</p><h1>'+stage.title+'</h1><p>'+
   modesTitle[stage.mode]+'</p></div><div class="fw-bonus-reward">✦ +'+stage.reward+' gems</div></header>'+
   '<p class="fw-bonus-instructions" id="fw-bonus-instructions"></p>'+
   '<div class="fw-bonus-hud" id="fw-bonus-hud"></div>'+
   '<div class="fw-bonus-play" id="fw-bonus-play"></div>'+
   '<p class="fw-bonus-message" id="fw-bonus-message" role="status" aria-live="polite"></p>'+
   '<footer class="fw-bonus-actions">'+
   '<button type="button" data-bonus-action="back">Previous</button>'+
   '<button type="button" data-bonus-action="retry">Restart</button>'+
   '<button type="button" data-bonus-action="music">Music: '+(this.cb.musicEnabled()?"On":"Off")+'</button>'+
   '<button type="button" class="fw-bonus-skip" data-bonus-action="skip">Skip mini-game</button></footer>'+
   '<div class="fw-bonus-overlay" id="fw-bonus-overlay" hidden></div></div>';
  const opts={stage,play:this.node.querySelector("#fw-bonus-play"),hud:this.node.querySelector("#fw-bonus-hud"),
   message:(t)=>{const el=this.node.querySelector("#fw-bonus-message");if(el)el.textContent=t;},
   instructions:(t)=>{this.node.querySelector("#fw-bonus-instructions").textContent=t;},
   win:()=>this.won(),lose:(msg)=>this.lost(msg),sound:(ok)=>this.music.fx(ok),
   tone:(f,d=.12)=>this.music.note(f,d)};
  this.mode=registered[stage.mode](opts);
  this.music.start(stage.mode,stage.chapter,this.cb.musicEnabled());
 }
 stop(){if(this.mode?.destroy)this.mode.destroy();this.mode=null;this.music.stop();}
 close(){this.stop();this.stage=null;this.node.innerHTML="";}
 won(){
  const overlay=this.node.querySelector("#fw-bonus-overlay");
  if(!overlay||!overlay.hidden)return;
  this.music.fx(true);
  overlay.hidden=false;
  overlay.innerHTML='<div class="fw-bonus-end"><span>✦ ✦ ✦</span><h2>Dinner saved!</h2>'+
   '<p>Bonus level '+this.stage.number+' complete. Earn <b>+'+this.stage.reward+
   ' gems</b> for your Store.</p><button type="button" data-bonus-action="continue">'+
   'Continue to Level '+Math.min(115,this.stage.number+1)+'</button></div>';
 }
 lost(message){
  const overlay=this.node.querySelector("#fw-bonus-overlay");
  if(!overlay||!overlay.hidden)return;
  overlay.hidden=false;
  overlay.innerHTML='<div class="fw-bonus-end"><h2>One more try?</h2><p>'+
   (message||"Give the puzzle another shot, or skip it.")+'</p>'+
   '<button type="button" data-bonus-action="retry">Try again</button>'+
   '<button type="button" data-bonus-action="skip">Skip this stage</button></div>';
 }
}
root.FTWBonus=Object.freeze({stages,bonus,chapters,at,puzzleStage,register,mount:(node,cb)=>new Controller(node,cb)});
})(typeof window!=="undefined"?window:{});
