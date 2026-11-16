/* Four original Feed the Wolf location soundtracks, each about a minute long in four sections (see render).
 * Castle keeps the existing original WAV soundtrack without modification.
 * Bonus stages use the same motifs with playful / rhythmic / mysterious arrangements. */
(function(root){
"use strict";
function render(world,hard,scores){
 const score=scores[world];if(!score||world<1||world>4)throw Error("Unknown chapter soundtrack");
 const sr=22050,stp=(world===1?.3:world===2?.2:world===3?.34:.26)*(hard?.87:1);
 const steps=world===4?288:world===2?320:256,n=Math.round(sr*steps*stp),buf=new Float32Array(n);
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
 /* Four different pieces. Each is in four sections played straight through (tune, tune developed, a contrasting
    middle, tune again with more around it) and ends on a short pickup into its first note; every voice wraps round
    the end of the buffer, so the tail of the last bar rings over the first and the loop has no seam.

      Wizard's Tower        D harmonic minor, slow. A bell arpeggio turns over a drone; the tune is long flute notes.
                            Middle: the tune played backwards, bells alone.
      Clockwork Citadel     F pentatonic, brisk. A walking bass ostinato; the tune lands on a 3+3+2 rhythm.
                            Middle: the tune drops to the bass and a higher voice answers it.
      Moonlit Conservatory  C lydian, slowest. Rolled harp chords under a long flute line.
                            Middle: the harp takes the second half of the tune by itself.
      Ghostlight Theatre    E harmonic minor waltz on a wheezy calliope, oom-pah-pah.
                            Middle: the tune moves down to the low pipes and the pah-pah floats above it. */
 const W=world===4?6:8,secLen=steps/4,S=score.scale,R=score.root;
 const pick=k=>score.motif[((k%16)+16)%16];
 const inScale=m=>S.includes((((m-R)%12)+12)%12);
 const third=low=>inScale(low+4)?4:3;                                   // the chord's third, whichever one the scale has
 const pickup=[];for(let o=-12;o<0;o++)if(inScale(R+o))pickup.push(o);  // scale notes just under the first note
 for(let step=0;step<steps;step++){
  const sec=Math.floor(step/secLen),beat=step%W,bar=Math.floor(step/W),low=score.bass[bar%4];
  const last=step>=steps-W,mid=sec===2;
  if(last&&step%2===0){                                                 // the pickup back into bar one
   const k=(step-(steps-W))/2,n=W/2;
   voice(R+pick(0)+pickup[pickup.length-n+k],step,stp*1.8,.15,world===1?"flute":world===2?"warm":world===3?"flute":"calliope");
  }
  if(world===1){
   if(beat===0&&!mid)voice(low,step,stp*8,.1,"flute");
   voice([low+12,low+19,low+24,low+19][step%4],step,.5,mid?.05:.07,"bell");
   if(!last&&step%4===0){
    const k=step>>2,m=mid?pick(15-k):pick(k);
    if(mid)voice(R+m+12,step,.9,.13,"bell");
    else{voice(R+m,step,stp*3.8,.2,"flute");if(sec===1)voice(R+m-12,step,stp*3.8,.07,"flute");if(sec===3&&beat===4)voice(R+m+12,step,.6,.05,"bell");}
   }
  }else if(world===2){
   if(step%2===0)voice(low+[0,7,12,7][(step>>1)%4],step,stp*1.7,.15,"warm");
   if(!last&&(beat===0||beat===3||beat===6)){
    const k=bar*3+(beat===0?0:beat===3?1:2),m=pick(k);
    if(mid){voice(R+m-12,step,stp*1.5,.21,"warm");voice(R+pick(k+2),step+1,stp*.9,.08,"gear");}
    else{voice(R+m,step,stp*1.6,.2,"warm");if(sec===1&&beat===0)voice(R+m+12,step,stp*.8,.045,"gear");if(sec===3)voice(R+m-12,step,stp*1.2,.07,"warm");}
   }
   if(beat===2||beat===6)tap(step,.035,"tock");
   if(!mid&&(beat===0||beat===4))tap(step,.075,"thump");
   if(sec===3&&beat%2===1)tap(step,.015,"tock");
  }else if(world===3){
   if(beat===0)voice(low,step,stp*7,.085,"flute");
   if(beat<4)voice(low+[12,12+third(low),19,24][beat],step,1,mid?.075:.055,"bell");
   if(!last&&step%4===0){
    const k=step>>2,m=mid?pick(8+k%8):pick(k);
    if(mid)voice(R+m+12,step,1.1,.1,"bell");
    else{voice(R+m,step,stp*3.9,.19,"flute");if(sec===3)voice(R+m-12,step,stp*3.9,.06,"flute");}
   }
   if(sec===1&&beat===6)voice(R+pick(step>>2)+12,step,.9,.045,"bell");
  }else{
   if(!last&&step%2===0){const m=pick(step>>1);voice(R+m-(mid?12:0),step,stp*1.9,mid?.2:.17,"calliope");}
   if(beat===0&&!mid)voice(low,step,stp*1.8,.17,"calliope");
   if(beat===2||beat===4){const up=mid?12:0,v=mid?.7:1;
    voice(low+12+up,step,stp*.8,.065*v,"calliope");voice(low+19+up,step,stp*.8,.05*v,"calliope");
    if(sec===3)voice(low+12+third(low),step,stp*.8,.04,"calliope");}
   if(sec===1&&beat===5&&bar%2===1&&!last)voice(R+pick((step>>1)+1)+1,step,stp*.6,.06,"calliope");   // a quick grace note into the next bar
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
