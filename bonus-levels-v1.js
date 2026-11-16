/* Feed the Wolf bonus arcade: ten mini-games, each met once, two per location.
   Original 100 pull-the-pin definitions, save indices and rewards are unchanged. */
(function(root){
"use strict";
const chapters=["The Castle","The Wizard's Tower","Clockwork Citadel","Moonlit Conservatory","Ghostlight Theatre"];
/* Each location has one mini-game after its 5th puzzle and one after its 13th. kind: what it asks of the player. */
const LINEUP=[
 [{mode:"match",title:"The Larder Shuffle",tier:0},{mode:"dash",title:"Dinner Dash"}],
 [{mode:"pipes",title:"Potion Plumbing",tier:1},{mode:"catch",title:"Catch the Feast"}],
 [{mode:"chain",title:"The Dinner Machine"},{mode:"gear",title:"Gear Jump"}],
 [{mode:"firefly",title:"Firefly Chase"},{mode:"run",title:"Garden Delivery"}],
 [{mode:"hidden",title:"The Final Prop",tier:2},{mode:"sneak",title:"Spotlight Sneak"}]];
const modes=["match","pipes","hidden","dash","catch","gear","firefly","sneak","chain","run"];
const modesTitle={match:"Feast Match",pipes:"Pantry Panic",hidden:"Dinner Detective",dash:"Reflexes",catch:"Catch and dodge",gear:"Timing",firefly:"Steering",sneak:"Stealth",chain:"Chain reaction",run:"Quick thinking"};
const bubble={match:"roast",pipes:"mushroom",hidden:"key",dash:"roast",catch:"apple",gear:"gear",firefly:"lantern",sneak:"mask",chain:"cheese",run:"flower"};
/* How the tune is played under each game: quick for the reflex games, steady for the thinking ones, slow for searching. */
const pace={match:"match",dash:"match",catch:"match",gear:"match",run:"match",pipes:"pipes",chain:"pipes",sneak:"pipes",hidden:"hidden",firefly:"hidden"};
const REWARDS=[10,11,12,13,13,14,14,15,16,17];   // 135 gems in all, the same as the fifteen stages they replace
const stages=[],bonus=[];
for(let i=0;i<100;i++){
 stages.push({number:stages.length+1,type:"puzzle",puzzleIndex:i,chapter:Math.floor(i/20)});
 const kind=[4,12].indexOf(i%20);
 if(kind!==-1){
  const chapter=Math.floor(i/20),g=LINEUP[chapter][kind];
  const stage={number:stages.length+1,type:"bonus",mode:g.mode,
   chapter,tier:g.tier==null?chapter:g.tier,bonusIndex:bonus.length,afterPuzzleIndex:i,title:g.title,reward:REWARDS[bonus.length]};
  stages.push(stage);bonus.push(stage);
 }
}
const TOTAL=stages.length;
const hardReward=stage=>Math.round(stage.reward*1.5);   // Hard Mode mini-games pay half as much again, on top of the normal win
/* Saves made when there were 115 stages (three mini-games per location, numbered differently). Returns where that player
   should now stand and the gems they had already won from the old mini-games, so nothing they earned is lost. */
function legacy(oldStage,oldResults){
 const old=[];
 for(let i=0;i<100;i++){old.push({puzzleIndex:i});if([4,11,18].includes(i%20))old.push({after:i,reward:5+Math.floor(i/20)*2});}
 let gems=0;
 for(const k in (oldResults||{})){const st=old[Number(k)-1];if(st&&st.reward&&oldResults[k]==="win")gems+=st.reward;}
 const at=old[oldStage-1];let stage=1;
 if(at){const idx=at.puzzleIndex!=null?at.puzzleIndex:Math.min(99,at.after+1);stage=stages.find(x=>x.type==="puzzle"&&x.puzzleIndex===idx).number;}
 return{stage,gems};
}
function at(number){return Number.isInteger(number)?stages[number-1]||null:null;}
function puzzleStage(index){return stages.find(s=>s.type==="puzzle"&&s.puzzleIndex===index)||null;}
const registered={};
function register(mode,factory){if(!modes.includes(mode)||typeof factory!=="function")throw Error("Invalid bonus game");registered[mode]=factory;}
/* Original motifs: the Castle keeps its existing soundtrack, while four new
   chapter motifs are reused (with different rhythms) in the optional bonus games. */
const worldScores=[
 {name:"Castle",root:69,bass:[45,43,45,40],motif:[0,3,7,4,3,2,0,7,3,2,0,-2,0,2,3,0],color:"triangle"},
 // Four different pieces, not one tune recoloured: each has its own key, scale, bass line, tempo and rhythm (see world-music-v1.js).
 {name:"Wizard's Tower",      root:62,scale:[0,2,3,5,7,8,11],bass:[50,46,43,45],motif:[0,7,12,15,14,12,8,7,0,5,8,12,11,8,7,2],color:"sine"},      // D harmonic minor, slow and spellbound
 {name:"Clockwork Citadel",   root:65,scale:[0,2,4,7,9],     bass:[53,50,46,48],motif:[0,4,7,4,9,7,4,2,0,4,7,12,9,7,4,7],color:"triangle"},     // F pentatonic, a busy little march
 {name:"Moonlit Conservatory",root:60,scale:[0,2,4,6,7,9,11],bass:[48,50,45,43],motif:[0,4,7,11,9,7,6,4,2,6,9,11,14,11,9,7],color:"sine"},     // C lydian, a slow lullaby
 {name:"Ghostlight Theatre",  root:64,scale:[0,2,3,5,7,8,11],bass:[52,45,50,47],motif:[0,3,7,3,8,7,3,2,0,3,7,12,11,8,7,-1],color:"triangle"}    // E harmonic minor, a carnival waltz
];
const midiHz=m=>440*Math.pow(2,(m-69)/12);
class Music{
 constructor(){this.ctx=null;this.interval=null;this.step=0;this.enabled=false;}
 start(mode,chapter,enabled){
  this.stop();this.mode=mode;this.chapter=chapter;this.step=0;this.enabled=!!enabled;
  if(!this.enabled)return;
  this.pace=pace[mode]||"hidden";
  try{
   const AC=root.AudioContext||root.webkitAudioContext;if(!AC)return;
   // Reuse one AudioContext across bonus stages. Repeated close/new cycles lose audio on iOS.
   if(!this.ctx||this.ctx.state==="closed")this.ctx=new AC();
   if(this.ctx.state!=="running"){const p=this.ctx.resume();if(p?.catch)p.catch(()=>{});}
   this.tick();
   this.interval=setInterval(()=>this.tick(),this.pace==="match"?205:this.pace==="pipes"?255:330);
  }catch(e){this.stop();}
 }
 /* iOS suspends (or "interrupts") Web Audio when you leave the app, and will only let it start again from inside a tap.
    So every tap in a mini-game calls this: resume the context if it has stopped, and build a fresh one if it will not. */
 wake(){
  if(!this.enabled||!this.interval)return;
  const AC=root.AudioContext||root.webkitAudioContext;if(!AC)return;
  const fresh=()=>{try{this.ctx=new AC();if(this.ctx.state!=="running")this.ctx.resume().catch(()=>{});}catch(e){this.ctx=null;}};
  const c=this.ctx;
  if(!c||c.state==="closed"){fresh();return;}
  if(c.state==="running")return;
  let p;try{p=c.resume();}catch(e){p=null;}
  const check=()=>{if(this.ctx===c&&c.state!=="running"){try{c.close();}catch(e){}fresh();}};
  if(p&&p.then)p.then(check,check);else check();
 }
 note(freq,duration=.15,shape="triangle",volume=.025){
  if(!this.ctx||!this.enabled||this.ctx.state!=="running")return;
  try{
   const c=this.ctx,t=c.currentTime,o=c.createOscillator(),g=c.createGain();
   o.type=shape;o.frequency.setValueAtTime(freq,t);
   g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(volume,t+.018);
   g.gain.exponentialRampToValueAtTime(.001,t+duration);
   o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+duration+.025);
  }catch(e){}
 }
 tick(){
  const i=this.step++%16,score=worldScores[this.chapter];
  const root=score.root+score.motif[i];
  if(this.chapter===4){   // Ghostlight Theatre: the same tune on a soft calliope (a whistle plus a quiet octave, slightly flat)
   const pipe=(m,d,v)=>{this.note(midiHz(m)*.994,d,"sine",v);this.note(midiHz(m+12)*1.004,d,"sine",v*.22);};
   const gap=this.pace==="hidden"?4:2;
   if(i%gap===0)pipe(root,this.pace==="hidden"?.6:.3,.03);
   if(i%4===0)pipe(score.bass[(i>>2)%4],.34,.03);
   if(i%4===2)pipe(score.bass[(i>>2)%4]+12,.14,.012);
   return;
  }
  // Each bonus is a subtle arrangement of its own chapter tune, not a new song.
  if(this.pace==="match"){
   this.note(midiHz(root),.18,score.color,.036);   // an octave lower than first written: the high version was shrill on a phone speaker
   if(i%4===0)this.note(midiHz(score.bass[(i>>2)%4]),.3,"triangle",.035);
   if(i%4===2)this.note(294,.04,"sine",.012);
  }else if(this.pace==="pipes"){
   if(i%2===0)this.note(midiHz(root),.21,score.color,.031);
   if(i%4===2)this.note(196,.06,"sine",.02);   // a low soft tock, not a high tick
   if(i%4===0)this.note(midiHz(score.bass[(i>>2)%4]),.25,"triangle",.033);
  }else{
   if(i%2===0)this.note(midiHz(root),.53,"sine",.023);
   if(i%4===0)this.note(midiHz(score.bass[(i>>2)%4]),.64,"triangle",.016);
   if(i===7||i===15)this.note(midiHz(root-5),.62,"sine",.014);
  }
 }
 fx(ok){
  if(!this.ctx)return;
  this.note(ok?660:230,ok?.22:.14,"sine",.045);
  if(ok)setTimeout(()=>this.note(880,.22,"sine",.035),85);
 }
 stop(){
  if(this.interval)clearInterval(this.interval);this.interval=null;
  this.enabled=false;
  // Do not close the context between stages; subsequent stages reuse the same iOS audio session.
 }
}
class Controller{
 constructor(node,cb){this.node=node;this.cb=cb;this.music=new Music();this.stage=null;this.mode=null;this.losses={};
  for(const type of ["pointerdown","touchend","click"])this.node.addEventListener(type,()=>this.music.wake(),true);
  this.node.addEventListener("click",e=>{
   const b=e.target.closest("[data-bonus-action]");if(!b)return;
   const a=b.dataset.bonusAction;
   if(a==="skip")this.cb.finish(this.stage,false);
   else if(a==="back")this.cb.back(this.stage);
   else if(a==="next"){if(this.cb.next&&(!this.cb.canNext||this.cb.canNext(this.stage)))this.cb.next(this.stage);}
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
  const themes=root.FTWBonusThemes,hard=!!(this.cb.hard&&this.cb.hard());
  // Hard Mode plays a tougher version. Lose three times running and the game quietly eases off, so nobody is stuck on a reflex test.
  const lost=this.losses[stage.number]||0,ease=Math.max(0,lost-2);
  this.node.innerHTML='<div class="fw-bonus fw-world-'+stage.chapter+' fw-'+stage.mode+(themes?' fw-themed':'')+'">'+
   (themes?'<div class="fw-banner" aria-hidden="true">'+themes.banner(stage.chapter)+'</div>':'')+
   (themes&&this.cb.wolf?'<img class="fw-bonus-wolf" id="fw-bonus-wolf" alt="" src="'+this.cb.wolf("idle")+'"><div class="fw-wolf-bubble" aria-hidden="true">'+(themes.icon(bubble[stage.mode])||themes.icon("roast"))+'</div>':'')+
   '<div class="fw-bonus-nav"><button type="button" data-bonus-action="back" aria-label="Previous level"'+(stage.number<=1?' disabled':'')+'>\u2039</button>'+
   '<button type="button" data-bonus-action="next" aria-label="Next level"'+(this.cb.canNext&&!this.cb.canNext(stage)?' disabled':'')+'>\u203A</button></div>'+
   '<header class="fw-bonus-header"><div><p class="fw-bonus-kicker">BONUS LEVEL '+stage.number+
   ' OF '+TOTAL+' · '+chapters[stage.chapter]+(hard?' · HARD':'')+'</p><h1>'+stage.title+'</h1><p>'+
   modesTitle[stage.mode]+'</p></div><div class="fw-bonus-reward">✦ +'+(hard?hardReward(stage):stage.reward)+' gems</div></header>'+
   '<p class="fw-bonus-instructions" id="fw-bonus-instructions"></p>'+
   '<div class="fw-bonus-hud" id="fw-bonus-hud"></div>'+
   '<div class="fw-bonus-play" id="fw-bonus-play"></div>'+
   '<p class="fw-bonus-message" id="fw-bonus-message" role="status" aria-live="polite"></p>'+
   '<footer class="fw-bonus-actions">'+
   '<button type="button" data-bonus-action="retry">Restart</button>'+
   '<button type="button" data-bonus-action="music">Music: '+(this.cb.musicEnabled()?"On":"Off")+'</button>'+
   '<button type="button" class="fw-bonus-skip" data-bonus-action="skip">Skip mini-game</button></footer>'+
   '<div class="fw-bonus-overlay" id="fw-bonus-overlay" hidden></div></div>';
  const opts={stage:Object.assign({},stage,{tier:Math.min(4,stage.tier+(hard?2:0))}),hard,ease,play:this.node.querySelector("#fw-bonus-play"),hud:this.node.querySelector("#fw-bonus-hud"),
   message:(t)=>{const el=this.node.querySelector("#fw-bonus-message");if(el)el.textContent=t;},
   instructions:(t)=>{this.node.querySelector("#fw-bonus-instructions").textContent=t;},
   win:()=>{this.losses[stage.number]=0;this.won();},lose:(msg)=>{this.losses[stage.number]=(this.losses[stage.number]||0)+1;this.lost(msg);},sound:(ok)=>{this.music.fx(ok);this.react(ok?"joy":"scared",ok?900:700);},
   wolf:this.cb.wolf||null,
   tone:(f,d=.12)=>this.music.note(f,d)};
  this.mode=registered[stage.mode](opts);
  this.music.start(stage.mode,stage.chapter,this.cb.musicEnabled());
 }
 /* The player's own wolf watches from the banner and reacts to how the game is going. */
 react(mood,ms){
  const el=this.node.querySelector("#fw-bonus-wolf");if(!el||!this.cb.wolf)return;
  clearTimeout(this.moodTimer);el.src=this.cb.wolf(mood);el.classList.remove("fw-hop");void el.offsetWidth;if(mood==="joy")el.classList.add("fw-hop");
  if(ms)this.moodTimer=setTimeout(()=>{const e=this.node.querySelector("#fw-bonus-wolf");if(e)e.src=this.cb.wolf("idle");},ms);
 }
 stop(){clearTimeout(this.moodTimer);if(this.mode?.destroy)this.mode.destroy();this.mode=null;this.music.stop();}
 close(){this.stop();this.stage=null;this.node.innerHTML="";}
 won(){
  const overlay=this.node.querySelector("#fw-bonus-overlay");
  if(!overlay||!overlay.hidden)return;
  this.music.fx(true);this.react("joy",0);
  overlay.hidden=false;
  overlay.innerHTML='<div class="fw-bonus-end"><span>✦ ✦ ✦</span><h2>Dinner saved!</h2>'+
   '<p>Bonus level '+this.stage.number+' complete. Earn <b>+'+(this.cb.hard&&this.cb.hard()?hardReward(this.stage):this.stage.reward)+
   ' gems</b> for your Store.</p><button type="button" data-bonus-action="continue">'+
   'Continue to Level '+Math.min(TOTAL,this.stage.number+1)+'</button></div>';
 }
 lost(message){
  const overlay=this.node.querySelector("#fw-bonus-overlay");
  if(!overlay||!overlay.hidden)return;
  this.react("sad",0);
  overlay.hidden=false;
  overlay.innerHTML='<div class="fw-bonus-end"><h2>One more try?</h2><p>'+
   (message||"Give it another shot, or skip it.")+((this.losses[this.stage.number]||0)>=3?" It will go a little easier on you this time.":"")+'</p>'+
   '<button type="button" data-bonus-action="retry">Try again</button>'+
   '<button type="button" data-bonus-action="skip">Skip this stage</button></div>';
 }
}
root.FTWBonus=Object.freeze({stages,bonus,chapters,worldScores,at,puzzleStage,register,legacy,TOTAL,hardReward,mount:(node,cb)=>new Controller(node,cb)});
})(typeof window!=="undefined"?window:{});
