/* Four new original Feed the Wolf location soundtracks.
 * Castle keeps the existing original WAV soundtrack without modification.
 * Bonus stages use the same motifs with playful / rhythmic / mysterious arrangements. */
(function(root){
"use strict";
function render(world,hard,scores){
 const score=scores[world];if(!score||world<1||world>4)throw Error("Unknown chapter soundtrack");
 const sr=22050,stp=(world===1?.28:world===2?.225:world===3?.32:.26)*(hard?.87:1);
 const steps=128,n=Math.round(sr*steps*stp),buf=new Float32Array(n);
 const freq=m=>440*Math.pow(2,(m-69)/12);
 const voice=(m,step,len,vol,shape)=>{
  const f=freq(m),start=Math.floor(step*stp*sr),end=Math.floor(len*sr),lenSafe=Math.max(1,end);
  for(let i=0;i<lenSafe;i++){
   const t=i/sr,ph=t*f*6.2831853;
   let wave;
   if(shape==="bell")wave=Math.sin(ph)+.31*Math.sin(ph*2.03)*Math.exp(-t*4);
   else if(shape==="gear")wave=.65*Math.sin(ph)+.35*Math.sin(ph*3);
   else if(shape==="flute")wave=Math.sin(ph)+.13*Math.sin(ph*2);
   else wave=Math.sin(ph)+.18*Math.sin(ph*2.01)+.06*Math.sin(ph*3);
   const env=Math.min(1,t/.025)*Math.pow(Math.max(0,1-t/(lenSafe/sr)),shape==="gear"?2.9:1.3);
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
 for(let step=0;step<steps;step++){
  const i=step%16,bar=Math.floor(step/8),beat=step%8,phrase=(step>>4)%4;
  const motif=score.motif[i];
  const root=score.root+motif+(phrase===2?2:phrase===3?-2:0);
  if(world===1){ // Wizard's Tower: ascending arcane bells, a long hovering drone
   if(beat%2===0)voice(root+12,step,.6,.24,"bell");
   if(beat===0)voice(score.bass[bar%4],step,stp*8,.07,"flute");
   if(beat===6)voice(root+19,step,.5,.10,"bell");
  }else if(world===2){ // Clockwork: a warm, steady machine. Low round melody, soft wooden tock, no high chimes.
   if(beat%2===0)voice(root,step,.42,.2,"warm");
   if(beat===3)voice(root-5,step,.3,.07,"warm");
   if(beat%4===0)voice(score.bass[bar%4],step,stp*4,.17,"warm");
   if(beat===2||beat===6)tap(step,.035,"tock");
   if(beat===0||beat===4)tap(step,.08,"thump");
  }else if(world===3){ // Conservatory: flowing flute-like melody and soft bell swells
   if(beat%2===0)voice(root+12,step,.9,.16,"flute");
   if(beat%4===0)voice(score.bass[bar%4],step,stp*5,.08,"bell");
   if(beat===6)voice(root+7,step,.6,.08,"bell");
  }else{ // Ghostlight Theatre: theatrical waltz, dramatic minor brass tones
   if(beat%2===0)voice(root+12,step,.46,.18,"brass");
   if(beat===0||beat===3||beat===6)voice(score.bass[bar%4],step,.55,.15,"brass");
   if(beat===2||beat===5)tap(step,.04,"clock");
   if(beat===7)voice(root+18,step,.24,.09,"bell");
  }
  if(hard){
   if(beat===3||beat===7)tap(step,.09,"thump");
   if(beat===0)voice(score.bass[bar%4]-12,step,.34,.13,"gear");
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
