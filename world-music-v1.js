/* Four original Feed the Wolf location soundtracks, each about a minute long in four sections (see render).
 * Castle keeps the existing original WAV soundtrack without modification.
 * Bonus stages use the same motifs with playful / rhythmic / mysterious arrangements. */
(function(root){
"use strict";
function render(world,hard,scores){
 const score=scores[world];if(!score||world<1||world>4)throw Error("Unknown chapter soundtrack");
 const sr=22050,stp=(world===1?.28:world===2?.225:world===3?.32:.26)*(hard?.87:1);
 const steps=world===4?288:256,n=Math.round(sr*steps*stp),buf=new Float32Array(n);
 const freq=m=>440*Math.pow(2,(m-69)/12);
 let lcg=20261115;
 const voice=(m,step,len,vol,shape)=>{
  // no two calliope pipes are quite in tune: each note sits up to 12 cents off
  const f=freq(m)*(shape==="calliope"?Math.pow(2,(((step*7919+m*104729)%25)-12)/1200):1),start=Math.floor(step*stp*sr),end=Math.floor(len*sr),lenSafe=Math.max(1,end);
  for(let i=0;i<lenSafe;i++){
   const t=i/sr,ph=t*f*6.2831853;
   let wave;
   if(shape==="calliope"){   // steam organ: a breathy whistle, a little wobble, a puff of air as each pipe opens
    const wob=ph+1.6*Math.sin(t*34.5);
    lcg=(Math.imul(lcg,1664525)+1013904223)>>>0;
    wave=Math.sin(wob)+.24*Math.sin(wob*2)+.09*Math.sin(wob*3)+(lcg/2147483648-1)*.5*Math.exp(-t*26);
   }else if(shape==="bell")wave=Math.sin(ph)+.31*Math.sin(ph*2.03)*Math.exp(-t*4);
   else if(shape==="gear")wave=.65*Math.sin(ph)+.35*Math.sin(ph*3);
   else if(shape==="flute")wave=Math.sin(ph)+.13*Math.sin(ph*2);
   else wave=Math.sin(ph)+.18*Math.sin(ph*2.01)+.06*Math.sin(ph*3);
   const env=Math.min(1,t/.025)*Math.pow(Math.max(0,1-t/(lenSafe/sr)),shape==="gear"?2.9:shape==="calliope"?.28:1.3);
   buf[(start+i)%n]+=wave*vol*env;
  }
 };
 const tap=(step,vol,type)=>{
  const start=Math.floor(step*stp*sr),duration=Math.round(sr*.065);
  for(let i=0;i<duration;i++){
   const t=i/sr,noise=Math.sin(6.2831853*(type==="clock"?1750:type==="tock"?380:70)*t);
   const decay=Math.exp(-t*(type==="clock"?70:type==="tock"?48:27));
   buf[(start+i)%n]+=noise*decay*vol;
  }
 };
 /* Each track is four sections played without a break, so the tune develops instead of circling:
      A   the location's motif, plain
      A'  the motif again with a harmony line under it and passing notes between
      B   a bridge: the motif turned upside down, a fourth higher, thinner and quieter
      A"  the motif once more over a slow counter-melody (its own notes backwards)
    The last bar climbs back up to the first note, and because every voice wraps round the end of the buffer,
    notes still ringing at the end ring over the start: there is no gap or first-beat thump to give the loop away. */
 const W=world===4?6:8,secLen=steps/4;
 const lead=world===1?"bell":world===2?"warm":world===3?"flute":"calliope";
 const pad=world===1?"flute":world===2?"warm":world===3?"bell":"calliope";
 const mel=(m,step,len,vol)=>voice(m,step,len,vol,lead);
 for(let step=0;step<steps;step++){
  const sec=Math.floor(step/secLen),i=step%16,beat=step%W,bar=Math.floor(step/W),last=step>=steps-W;
  const bridge=sec===2,lift=bridge?5:0;
  const m=bridge?-score.motif[i]:score.motif[i];
  const root=score.root+lift+m,low=score.bass[bar%4]+lift;
  const noteLen=world===1?.62:world===2?.42:world===3?.92:stp*1.9;
  const melVol=(world===2?.2:world===3?.18:world===4?.17:.23)*(bridge?.72:1);
  // --- melody ---
  if(last){ // turnaround: a short climb that lands on the first note of the tune
   const climb=[-5,-3,-2,0,2,3,5,7];
   if(world!==4||step%2===0)mel(score.root+score.motif[0]+climb[Math.min(7,Math.floor((step-(steps-W))/W*8))]-(world===4?0:0),step,stp*1.4,melVol*.8);
  }else if(step%2===0){
   mel(root,step,noteLen,melVol);
   if(sec===1)voice(root-(m%7===0?5:3)-12+(world===2?12:0),step,noteLen,melVol*.38,pad);       // harmony a third or fourth below
  }else if(sec===1&&beat===W-1){
   mel(score.root+lift+score.motif[(i+1)%16]-2,step,stp*.9,melVol*.4);                          // passing note into the next beat
  }
  if(sec===3&&step%4===0&&!last)voice(score.root+score.motif[15-((step>>2)%16)]-12,step,stp*3.6,melVol*.42,pad);   // counter-melody
  // --- each location's own accompaniment ---
  if(world===1){        // Wizard's Tower: a long hovering drone under the bells, a high answer at the end of each bar
   if(beat===0)voice(low,step,stp*8,.09,"flute");
   if(beat===6&&!bridge)voice(root+7,step,.5,.09,"bell");
   if(sec>=1&&beat===4)voice(low+7,step,stp*4,.045,"flute");
  }else if(world===2){  // Clockwork Citadel: a warm steady machine, soft wooden tock, bass that walks in the later sections
   if(beat%4===0)voice(low,step,stp*4,.17,"warm");
   if(sec>=1&&beat===6)voice(low+7,step,stp*2,.09,"warm");
   if(beat===2||beat===6)tap(step,.035,"tock");
   if(!bridge&&(beat===0||beat===4))tap(step,.08,"thump");
   if(sec===3&&beat%2===1)tap(step,.016,"tock");
  }else if(world===3){  // Moonlit Conservatory: slow bell swells under the flute, a second swell joining later
   if(beat%4===0)voice(low,step,stp*5,.09,"bell");
   if(beat===6)voice(root-5,step,.6,.08,"bell");
   if(sec>=1&&beat===2)voice(low+12,step,stp*4,.04,"bell");
  }else{                // Ghostlight Theatre: calliope waltz, oom-pah-pah, with a fuller chord once the tune comes back
   if(beat===0)voice(low,step,stp*1.8,.17,"calliope");
   if(beat===2||beat===4){voice(low+12,step,stp*.8,.065,"calliope");voice(low+19,step,stp*.8,.05,"calliope");if(sec===3)voice(low+15,step,stp*.8,.04,"calliope");}
   if(beat===5&&bar%4===3&&!last)voice(root+3,step,stp*.9,.07,"calliope");
  }
  if(hard){
   if(beat===3||beat===W-1)tap(step,.09,"thump");
   if(beat===0)voice(low-12,step,.34,.13,world===4?"calliope":"gear");
  }
 }
 let peak=0;for(let i=0;i<buf.length;i++)peak=Math.max(peak,Math.abs(buf[i]));
 const amp=1.55/Math.max(1,peak);
 const dv=new DataView(new ArrayBuffer(44+buf.length*2));
 const ascii=(pos,s)=>{for(let i=0;i<s.length;i++)dv.setUint8(pos+i,s.charCodeAt(i));};
 ascii(0,"RIFF");dv.setUint32(4,36+n*2,true);
 ascii(8,"WAVEfmt ");dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,1,true);
 dv.setUint32(24,sr,true);dv.setUint32(28,sr*2,true);dv.setUint16(32,2,true);dv.setUint16(34,16,true);
 ascii(36,"data");dv.setUint32(40,n*2,true);
 for(let i=0;i<n;i++)dv.setInt16(44+i*2,Math.round(Math.tanh(buf[i]*amp)*27000),true);
 return dv;
}
root.FTWWorldMusic=Object.freeze({render});
})(typeof window!=="undefined"?window:{});
