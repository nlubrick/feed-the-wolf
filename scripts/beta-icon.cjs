"use strict";
// Overlay a clear BETA label on the game's existing 180x180 iPhone touch icon.
// PNG-only because Safari home-screen icons do not reliably use SVG manifest icons.
// Supports 8-bit non-interlaced RGB PNG, which is what the existing touch icon is.
const zlib=require("node:zlib");
const SIGNATURE=Buffer.from("89504e470d0a1a0a","hex");
const glyph={
 B:["11110","10001","10001","11110","10001","10001","11110"],
 E:["11111","10000","10000","11110","10000","10000","11111"],
 T:["11111","00100","00100","00100","00100","00100","00100"],
 A:["01110","10001","10001","11111","10001","10001","10001"]
};
function crc32(buf){
 let crc=0xffffffff;
 for(const byte of buf){
  crc^=byte;
  for(let k=0;k<8;k++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);
 }
 return (crc^0xffffffff)>>>0;
}
function chunk(type,body){
 const id=Buffer.from(type,"ascii"),head=Buffer.alloc(4),tail=Buffer.alloc(4);
 head.writeUInt32BE(body.length);
 tail.writeUInt32BE(crc32(Buffer.concat([id,body])));
 return Buffer.concat([head,id,body,tail]);
}
function badgePng(png){
 if(!png.subarray(0,8).equals(SIGNATURE))throw new Error("Beta icon source is not PNG");
 let offset=8,w=0,h=0,depth=0,color=0,interlace=0;
 const data=[];
 while(offset+12<=png.length){
  const n=png.readUInt32BE(offset),type=png.toString("ascii",offset+4,offset+8);
  if(offset+12+n>png.length)throw new Error("Truncated beta icon PNG");
  const bytes=png.subarray(offset+8,offset+8+n);
  if(type==="IHDR"){w=bytes.readUInt32BE(0);h=bytes.readUInt32BE(4);depth=bytes[8];color=bytes[9];interlace=bytes[12];}
  if(type==="IDAT")data.push(bytes);
  offset+=n+12;
  if(type==="IEND")break;
 }
 if(w!==180||h!==180||depth!==8||color!==2||interlace!==0)
  throw new Error("Touch icon PNG format changed; need an updated image converter");
 const row=w*3,filtered=zlib.inflateSync(Buffer.concat(data)),rgb=Buffer.alloc(row*h);
 let pos=0,prev=Buffer.alloc(row);
 for(let y=0;y<h;y++){
  const type=filtered[pos++],cur=Buffer.alloc(row);
  if(type>4)throw new Error("Unknown PNG row filter");
  for(let x=0;x<row;x++){
   const value=filtered[pos++],left=x>=3?cur[x-3]:0,up=prev[x],ul=x>=3?prev[x-3]:0;
   let predictor=0;
   if(type===1)predictor=left;
   if(type===2)predictor=up;
   if(type===3)predictor=Math.floor((left+up)/2);
   if(type===4){
    const p=left+up-ul,pa=Math.abs(p-left),pb=Math.abs(p-up),pc=Math.abs(p-ul);
    predictor=pa<=pb&&pa<=pc?left:pb<=pc?up:ul;
   }
   cur[x]=(value+predictor)&255;
  }
  cur.copy(rgb,y*row);prev=cur;
 }
 function pixel(x,y,r,g,b){
  if(x<0||x>=w||y<0||y>=h)return;
  const i=(y*w+x)*3;rgb[i]=r;rgb[i+1]=g;rgb[i+2]=b;
 }
 // Purple border, golden background, thick dark BETA text.
 const bx=66,by=132,bw=110,bh=42,radius=11;
 for(let y=by;y<by+bh;y++)for(let x=bx;x<bx+bw;x++){
  const dx=x<bx+radius?bx+radius-x:x>=bx+bw-radius?x-(bx+bw-radius-1):0;
  const dy=y<by+radius?by+radius-y:y>=by+bh-radius?y-(by+bh-radius-1):0;
  if(dx*dx+dy*dy>radius*radius)continue;
  const border=x<bx+3||x>=bx+bw-3||y<by+3||y>=by+bh-3;
  pixel(x,y,...(border?[31,17,59]:[253,211,112]));
 }
 const scale=4,word="BETA",startX=76,startY=139;
 for(let i=0;i<word.length;i++){
  const rows=glyph[word[i]];
  for(let yy=0;yy<7;yy++)for(let xx=0;xx<5;xx++)if(rows[yy][xx]==="1")
   for(let a=0;a<scale;a++)for(let b=0;b<scale;b++)
    pixel(startX+i*24+xx*scale+a,startY+yy*scale+b,35,22,53);
 }
 const scan=Buffer.alloc(h*(row+1));
 for(let y=0;y<h;y++)rgb.copy(scan,y*(row+1)+1,y*row,(y+1)*row);
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);
 ihdr[8]=8;ihdr[9]=2;
 return Buffer.concat([SIGNATURE,chunk("IHDR",ihdr),chunk("IDAT",zlib.deflateSync(scan)),chunk("IEND",Buffer.alloc(0))]);
}
module.exports={badgePng};
