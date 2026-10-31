/* ===================== SCROLLS OF LIGHT — ENGINE ===================== */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const rand = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const pick = a => a[Math.floor(Math.random()*a.length)];
const shuffle = a => { for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const sleep = ms => new Promise(r=>setTimeout(r,ms));
const esc = s => String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function shade(hex,amt){ if(!hex||hex[0]!=='#') return hex; let n=parseInt(hex.slice(1),16); let r=n>>16,g=(n>>8)&255,b=n&255;
  const f=v=>clamp(Math.round(amt<0?v*(1+amt):v+(255-v)*amt),0,255); return '#'+((1<<24)+(f(r)<<16)+(f(g)<<8)+f(b)).toString(16).slice(1); }
const KEY='scrollsOfLight.v1';
const TS=44;
const T={G:0,P:1,B:2,W:3,D:4,BR:5,L:6};

/* ===================== STATE ===================== */
let S=null, M=null;
const P={x:0,y:0,fx:0,fy:0,tx:0,ty:0,mv:false,prog:0,dir:'down',path:[],inv:0,walk:0,pend:null};
const CP={fx:0,fy:0};
let trail=[];
const keys={};
let mode='title';      // title | world | battle
let dialogOpen=false, modalOpen=false, qOpen=false;
let now=0, cw=0, ch=0, dpr=1, zoom=1;
const cv=$('#world'), ctx=cv.getContext('2d');

function newState(name,look,grade){
  const chs={}; for(let i=1;i<=10;i++) chs[i]={stage:0,kills:0,side:0,got:[]};
  return {v:1,name,look,grade,mix:{math:4,bible:4,verse:2,words:2,logic:2},shift:{math:0,bible:0,verse:0,words:0,logic:0},
    level:1,xp:0,hp:75,coins:20,items:{bread:2},armor:[],comps:{lamb:{lvl:1,xp:0}},comp:'lamb',dyes:[],cos:[],
    chs,unlocked:1,map:'hub',px:17,py:14,stats:{},recent:[],sound:true,autoRead:false,flags:{},answered:0,correct:0};
}
function save(){ if(!S) return; S.map=M?M.id:S.map; S.px=P.x; S.py=P.y; try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){} }
function loadSave(){ try{const s=localStorage.getItem(KEY); if(s){const o=JSON.parse(s); if(o&&o.v===1) return o;}}catch(e){} return null; }

/* ===================== STATS ===================== */
function gearSum(k){ return S.armor.reduce((a,id)=>a+(ARMOR[id][k]||0),0); }
const maxHP=()=>60+S.level*15+gearSum('hp');
const atkP=()=>8+S.level*3+gearSum('atk');
const defP=()=>gearSum('def');
const xpNeed=()=>30+25*S.level;
function curLook(){ return Object.assign({},S.look); }

/* ===================== SOUND ===================== */
let AC=null;
function ac(){ if(!AC){ try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){} } if(AC&&AC.state==='suspended') AC.resume(); return AC; }
function tone(f,d,type='sine',vol=.07,delay=0){ if(S&&!S.sound) return; const a=ac(); if(!a) return;
  try{const o=a.createOscillator(),g=a.createGain(); o.type=type; o.frequency.value=f; const t0=a.currentTime+delay;
  g.gain.setValueAtTime(0.0001,t0); g.gain.exponentialRampToValueAtTime(vol,t0+.015); g.gain.exponentialRampToValueAtTime(0.0001,t0+d);
  o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0+d+.05);}catch(e){} }
const SFX={
  ok:()=>[523,659,784,1047].forEach((f,i)=>tone(f,.2,'triangle',.07,i*.07)),
  bad:()=>{tone(260,.22,'triangle',.06);tone(196,.35,'triangle',.06,.13);},
  hit:()=>{tone(180,.12,'square',.04);tone(90,.18,'sine',.08,.02);},
  hurt:()=>tone(120,.25,'sawtooth',.04),
  heal:()=>[440,554,659,880].forEach((f,i)=>tone(f,.25,'sine',.06,i*.06)),
  coin:()=>{tone(988,.08,'square',.035);tone(1319,.16,'square',.035,.07);},
  lvl:()=>[523,659,784,1047,1319].forEach((f,i)=>tone(f,.3,'triangle',.07,i*.09)),
  open:()=>tone(660,.09,'triangle',.05),
  trumpet:()=>[392,392,523].forEach((f,i)=>tone(f,.25,'sawtooth',.035,i*.18)),
  win:()=>[523,659,784,659,784,1047].forEach((f,i)=>tone(f,.25,'triangle',.07,i*.12))
};

/* ===================== DRAWING: CHARACTERS ===================== */
function circ(c,x,y,r,col){c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
function ell(c,x,y,rx,ry,rot,col){c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,rot||0,0,Math.PI*2);c.fill();}
function drawPerson(c,cx,by,s,L,o={}){
  const bob=o.bob||0; const fy=by; by-=bob;
  c.save();
  ell(c,cx,fy,s*.26,s*.07,0,'rgba(0,0,0,.22)');
  if(o.wings){ ell(c,cx-s*.27,by-s*.55,s*.16,s*.32,-.5,'rgba(255,255,255,.9)'); ell(c,cx+s*.27,by-s*.55,s*.16,s*.32,.5,'rgba(255,255,255,.9)'); }
  if(o.staff){ c.strokeStyle='#6b4a22'; c.lineWidth=s*.05; c.lineCap='round'; c.beginPath(); c.moveTo(cx+s*.3,by-s*1.05); c.lineTo(cx+s*.3,by); c.stroke(); }
  const top=by-s*.62, tw=s*.19, bw=s*.29;
  c.beginPath(); c.moveTo(cx-tw,top); c.lineTo(cx+tw,top); c.lineTo(cx+bw,by); c.lineTo(cx-bw,by); c.closePath();
  if(L.robe==='rainbow'){ c.save(); c.clip(); const cols=['#d9443a','#ef9a2d','#ecd23b','#4fae4f','#3f7fd1','#7e4fb3']; const h=(by-top)/cols.length;
    cols.forEach((col,i)=>{c.fillStyle=col;c.fillRect(cx-bw,top+i*h,bw*2,h+1);}); c.restore(); }
  else { c.fillStyle=L.robe; c.fill(); }
  c.strokeStyle='rgba(0,0,0,.28)'; c.lineWidth=Math.max(1,s*.02); c.stroke();
  if(o.breast){ c.fillStyle='#c9ced8'; c.beginPath(); c.moveTo(cx-s*.17,top+s*.02); c.lineTo(cx+s*.17,top+s*.02); c.lineTo(cx+s*.14,top+s*.2); c.lineTo(cx-s*.14,top+s*.2); c.closePath(); c.fill(); c.strokeStyle='#8a90a0'; c.stroke(); }
  c.fillStyle=o.belt?'#e8b94a':(L.sash||'#e9d8a6'); c.fillRect(cx-s*.215,by-s*.4,s*.43,s*.06);
  const armCol=shade(L.robe==='rainbow'?'#3f7fd1':L.robe,-.15);
  ell(c,cx-s*.22,by-s*.43,s*.06,s*.14,.25,armCol); ell(c,cx+s*.22,by-s*.43,s*.06,s*.14,-.25,armCol);
  circ(c,cx-s*.25,by-s*.3,s*.045,L.skin); circ(c,cx+s*.25,by-s*.3,s*.045,L.skin);
  if(o.shoes){ ell(c,cx-s*.12,by-s*.01,s*.07,s*.035,0,'#8a5a2a'); ell(c,cx+s*.12,by-s*.01,s*.07,s*.035,0,'#8a5a2a'); }
  const hy=by-s*.8, hr=s*.2;
  if(L.hs===1 && !L.wrap){ c.fillStyle=L.hair; ell(c,cx-hr*.86,hy+hr*.55,hr*.34,hr*.95,.12,L.hair); ell(c,cx+hr*.86,hy+hr*.55,hr*.34,hr*.95,-.12,L.hair); }
  if(L.wrap){ c.fillStyle=shade(L.wrap,-.08); c.fillRect(cx-hr*1.12,hy-hr*.2,hr*2.24,hr*1.9); }
  circ(c,cx,hy,hr,L.skin);
  if(L.beard){ c.fillStyle=L.beard; c.beginPath(); c.arc(cx,hy+hr*.15,hr*.95,.15,Math.PI-.15); c.closePath(); c.fill(); }
  if(L.wrap){ c.fillStyle=L.wrap; c.beginPath(); c.arc(cx,hy,hr*1.12,Math.PI*1.02,Math.PI*1.98); c.closePath(); c.fill(); c.fillStyle=shade(L.wrap,-.25); c.fillRect(cx-hr*1.1,hy-hr*.18,hr*2.2,hr*.16); }
  else { c.fillStyle=L.hair; c.beginPath(); c.arc(cx,hy-hr*.05,hr*1.04,Math.PI*1.02,Math.PI*1.98); c.closePath(); c.fill();
    if(L.hs===2){ for(let i=-2;i<=2;i++) circ(c,cx+i*hr*.42,hy-hr*.78+Math.abs(i)*hr*.12,hr*.3,L.hair); }
    if(o.dir==='up'){ circ(c,cx,hy,hr*1.02,L.hair); } }
  if(o.dir!=='up'){
    c.fillStyle='#1b1208'; const ey=hy+hr*.12;
    if(o.dir==='left'){ circ(c,cx-hr*.45,ey,hr*.11,'#1b1208'); }
    else if(o.dir==='right'){ circ(c,cx+hr*.45,ey,hr*.11,'#1b1208'); }
    else { circ(c,cx-hr*.36,ey,hr*.11,'#1b1208'); circ(c,cx+hr*.36,ey,hr*.11,'#1b1208');
      if(!L.beard){ c.strokeStyle='#7a3a2a'; c.lineWidth=Math.max(1,hr*.09); c.beginPath(); c.arc(cx,hy+hr*.3,hr*.28,.3,Math.PI-.3); c.stroke(); }
      ell(c,cx-hr*.55,hy+hr*.38,hr*.14,hr*.09,0,'rgba(230,110,110,.35)'); ell(c,cx+hr*.55,hy+hr*.38,hr*.14,hr*.09,0,'rgba(230,110,110,.35)'); }
  }
  if(o.helmet){ c.fillStyle='#cfd5e0'; c.beginPath(); c.arc(cx,hy-hr*.05,hr*1.12,Math.PI*1.02,Math.PI*1.98); c.closePath(); c.fill(); c.fillStyle='#e8b94a'; c.fillRect(cx-hr*.12,hy-hr*1.45,hr*.24,hr*.45); }
  if(o.crown){ c.fillStyle='#f0c64a'; c.beginPath(); const yb=hy-hr*.8; c.moveTo(cx-hr*.7,yb); c.lineTo(cx-hr*.7,yb-hr*.55); c.lineTo(cx-hr*.35,yb-hr*.25); c.lineTo(cx,yb-hr*.7); c.lineTo(cx+hr*.35,yb-hr*.25); c.lineTo(cx+hr*.7,yb-hr*.55); c.lineTo(cx+hr*.7,yb); c.closePath(); c.fill(); }
  if(o.halo){ c.strokeStyle='#f6de98'; c.lineWidth=Math.max(1.5,s*.03); c.beginPath(); c.ellipse(cx,hy-hr*1.35,hr*.75,hr*.22,0,0,Math.PI*2); c.stroke(); }
  if(o.sword){ c.strokeStyle='#dfe6f0'; c.lineWidth=s*.04; c.lineCap='round'; c.beginPath(); c.moveTo(cx+s*.27,by-s*.33); c.lineTo(cx+s*.45,by-s*.78); c.stroke(); c.strokeStyle='#e8b94a'; c.lineWidth=s*.035; c.beginPath(); c.moveTo(cx+s*.21,by-s*.38); c.lineTo(cx+s*.35,by-s*.31); c.stroke(); }
  if(o.shield){ const sx=cx-s*.3, sy=by-s*.36; circ(c,sx,sy,s*.15,'#e8b94a'); circ(c,sx,sy,s*.12,'#3c4fa8'); c.fillStyle='#f6de98'; c.fillRect(sx-s*.015,sy-s*.08,s*.03,s*.16); c.fillRect(sx-s*.06,sy-s*.035,s*.12,s*.03); }
  c.restore();
}
function playerOpts(extra){ const a=S.armor; return Object.assign({belt:a.includes('belt'),shoes:a.includes('shoes'),breast:a.includes('breast'),shield:a.includes('shield'),helmet:a.includes('helmet'),sword:a.includes('sword'),crown:S.cos.includes('crown')&&S.flags.wearCrown!==false},extra||{}); }

function gloomBody(c,cx,cy,r,col,t){
  const g=c.createRadialGradient(cx-r*.3,cy-r*.45,r*.1,cx,cy,r*1.25); g.addColorStop(0,shade(col,.35)); g.addColorStop(.55,col); g.addColorStop(1,shade(col,-.6));
  c.fillStyle=g; c.beginPath(); c.arc(cx,cy,r,Math.PI,0);
  const n=8; for(let i=0;i<=n;i++){ const x=cx+r-(i/n)*2*r; const y=cy+r*.8+(i%2?r*.28:0)+Math.sin(t*5+i)*r*.07; c.lineTo(x,y); }
  c.closePath(); c.fill();
}
function gloomEyes(c,cx,cy,r,t,n=2,col='#fff'){
  const blink=(Math.sin(t*1.7)>0.97)?.15:1;
  const xs=n===3?[-.42,0,.42]:[-.33,.33];
  xs.forEach(f=>{ ell(c,cx+f*r,cy-r*.08,r*.17,r*.22*blink,0,col); circ(c,cx+f*r-r*.06,cy-r*.04,r*.08*blink,'#140a20'); });
  c.strokeStyle='#140a20'; c.lineWidth=Math.max(1.5,r*.07); c.lineCap='round';
  c.beginPath(); c.moveTo(cx-r*.55,cy-r*.42); c.lineTo(cx-r*.15,cy-r*.3); c.moveTo(cx+r*.55,cy-r*.42); c.lineTo(cx+r*.15,cy-r*.3); c.stroke();
}
function drawGloom(c,cx,cy,r,col,t){
  ell(c,cx,cy+r*1.15,r*.8,r*.18,0,'rgba(0,0,0,.25)');
  gloomBody(c,cx,cy+Math.sin(t*3)*r*.06,r,col,t); gloomEyes(c,cx,cy+Math.sin(t*3)*r*.06,r,t);
}
function drawBoss(c,cx,cy,r,b,t,extra){
  const k=b.kind, col=b.c; const bob=Math.sin(t*2)*r*.05; cy+=bob;
  ell(c,cx,cy+r*1.2-bob,r*.9,r*.2,0,'rgba(0,0,0,.28)');
  if(k==='serpent'){
    c.strokeStyle=shade(col,-.2); c.lineWidth=r*.42; c.lineCap='round'; c.beginPath(); c.moveTo(cx+r*.2,cy+r*.6);
    for(let i=0;i<=20;i++){ const x=cx+r*.2+i*r*.06; c.lineTo(x,cy+r*.75+Math.sin(i*.6+t*3)*r*.25); } c.stroke();
    gloomBody(c,cx,cy,r,col,t); gloomEyes(c,cx,cy,r,t,2,'#f8e36a');
    c.strokeStyle='#d0303a'; c.lineWidth=r*.06; c.beginPath(); c.moveTo(cx,cy+r*.35); c.lineTo(cx,cy+r*.62); c.lineTo(cx-r*.08,cy+r*.72); c.moveTo(cx,cy+r*.62); c.lineTo(cx+r*.08,cy+r*.72); c.stroke();
  } else if(k==='mocker'){
    gloomBody(c,cx,cy,r,col,t); gloomEyes(c,cx,cy,r,t);
    c.fillStyle='#140a20'; c.beginPath(); c.arc(cx,cy+r*.25,r*.42,0,Math.PI); c.closePath(); c.fill();
    c.fillStyle='#fff'; for(let i=0;i<5;i++) c.fillRect(cx-r*.36+i*r*.15,cy+r*.25,r*.11,r*.1);
  } else if(k==='heart'){
    gloomBody(c,cx,cy,r,col,t);
    c.fillStyle='#e8b94a'; c.beginPath(); c.moveTo(cx-r*.75,cy-r*.15); c.lineTo(cx-r*.5,cy-r*1.15); c.lineTo(cx+r*.5,cy-r*1.15); c.lineTo(cx+r*.75,cy-r*.15); c.closePath(); c.fill();
    c.fillStyle='#3c4fa8'; for(let i=0;i<4;i++) c.fillRect(cx-r*.6+i*r*.02,cy-r*.95+i*r*.22,r*1.2-i*r*.04,r*.09);
    gloomEyes(c,cx,cy,r,t,2,'#ffd27a');
    c.strokeStyle='rgba(0,0,0,.4)'; c.lineWidth=r*.04; c.beginPath(); c.moveTo(cx-r*.5,cy+r*.2); c.lineTo(cx-r*.2,cy+r*.5); c.lineTo(cx-r*.3,cy+r*.75); c.stroke();
  } else if(k==='calf'){
    const g=c.createLinearGradient(cx,cy-r,cx,cy+r); g.addColorStop(0,'#ffe58a'); g.addColorStop(1,'#b8861e');
    c.fillStyle=g; [[-.55,.45],[-.25,.5],[.25,.5],[.55,.45]].forEach(([x,y])=>c.fillRect(cx+x*r-r*.08,cy+y*r,r*.16,r*.55));
    ell(c,cx+r*.1,cy+r*.25,r*.9,r*.5,0,g); ell(c,cx-r*.75,cy-r*.25,r*.42,r*.38,0,g);
    c.strokeStyle='#ffe58a'; c.lineWidth=r*.09; c.lineCap='round'; c.beginPath(); c.moveTo(cx-r*.95,cy-r*.55); c.quadraticCurveTo(cx-r*1.15,cy-r*.95,cx-r*.95,cy-r*1.0); c.moveTo(cx-r*.55,cy-r*.55); c.quadraticCurveTo(cx-r*.4,cy-r*.95,cx-r*.6,cy-r*1.0); c.stroke();
    gloomEyes(c,cx-r*.75,cy-r*.22,r*.45,t,2,'#ff6a5a');
  } else if(k==='walls'){
    const w=r*2.6,h=r*1.9,x0=cx-w/2,y0=cy+r*1.1-h; const marches=(extra&&extra.marches)||0;
    c.fillStyle='#b49a6a'; c.fillRect(x0,y0,w,h);
    for(let i=0;i<7;i++) c.fillRect(x0+i*w/7,y0-r*.25,w/14,r*.25);
    c.strokeStyle='rgba(60,40,20,.45)'; c.lineWidth=1.5;
    for(let yy=0;yy<h;yy+=r*.25){ c.beginPath(); c.moveTo(x0,y0+yy); c.lineTo(x0+w,y0+yy); c.stroke(); for(let xx=((yy/(r*.25))%2)*r*.2;xx<w;xx+=r*.4){ c.beginPath(); c.moveTo(x0+xx,y0+yy); c.lineTo(x0+xx,y0+yy+r*.25); c.stroke(); } }
    c.fillStyle='#3a2a1a'; c.beginPath(); c.arc(cx,y0+h,r*.45,Math.PI,0); c.fill();
    gloomEyes(c,cx,y0+h*.35,r*.6,t,2,'#ffd27a');
    c.strokeStyle='#2a1a0a'; c.lineWidth=2.5; for(let i=0;i<marches;i++){ c.beginPath(); const sx=x0+((i*37)%100)/100*w, sy=y0+((i*53)%100)/100*h*.8; c.moveTo(sx,sy); c.lineTo(sx+r*.2,sy+r*.25); c.lineTo(sx+r*.05,sy+r*.45); c.stroke(); }
  } else if(k==='giant'){
    c.strokeStyle='#7a5a3a'; c.lineWidth=r*.1; c.beginPath(); c.moveTo(cx+r*.95,cy-r*1.5); c.lineTo(cx+r*.95,cy+r*1.1); c.stroke();
    c.fillStyle='#c9ced8'; c.beginPath(); c.moveTo(cx+r*.95,cy-r*1.8); c.lineTo(cx+r*1.08,cy-r*1.45); c.lineTo(cx+r*.82,cy-r*1.45); c.closePath(); c.fill();
    c.save(); c.translate(cx,cy); c.scale(1,1.4); gloomBody(c,0,0,r,col,t); c.restore();
    c.fillStyle='#b8862e'; c.beginPath(); c.arc(cx,cy-r*.75,r*.9,Math.PI*1.05,Math.PI*1.95); c.closePath(); c.fill(); c.fillRect(cx-r*.06,cy-r*1.75,r*.12,r*.3);
    gloomEyes(c,cx,cy-r*.25,r*.9,t,2,'#ffbf6a');
  } else if(k==='idol'){
    const g=c.createLinearGradient(cx-r,cy,cx+r,cy); g.addColorStop(0,'#b8861e'); g.addColorStop(.5,'#ffe58a'); g.addColorStop(1,'#b8861e');
    c.fillStyle='#8a6a3a'; c.fillRect(cx-r*.8,cy+r*.8,r*1.6,r*.4);
    c.fillStyle=g; c.beginPath(); c.moveTo(cx-r*.45,cy-r*.6); c.lineTo(cx+r*.45,cy-r*.6); c.lineTo(cx+r*.6,cy+r*.8); c.lineTo(cx-r*.6,cy+r*.8); c.closePath(); c.fill();
    circ(c,cx,cy-r*.95,r*.42,'#f0c64a'); c.fillRect(cx-r*.85,cy-r*.5,r*.4,r*.18); c.fillRect(cx+r*.45,cy-r*.5,r*.4,r*.18);
    gloomEyes(c,cx,cy-r*.92,r*.45,t,2,'#ff5a4a');
  } else if(k==='night'){
    gloomBody(c,cx,cy,r,col,t);
    for(let i=0;i<9;i++){ const a=i*2.4, d=r*(.2+((i*37)%60)/100); circ(c,cx+Math.cos(a)*d,cy+Math.sin(a)*d*.8,r*.04*(1+Math.sin(t*4+i)*.5),'#cfd8ff'); }
    gloomEyes(c,cx,cy,r,t,2,'#cfd8ff');
  } else if(k==='storm'){
    const g='#5a6478'; [[-.6,.1,.55],[0,-.25,.7],[.6,.1,.55],[-.25,.3,.5],[.3,.3,.5]].forEach(([x,y,s])=>circ(c,cx+x*r,cy+y*r,s*r,shade(g,(y+.3)*.3)));
    if(Math.sin(t*6)>.3){ c.fillStyle='#ffe26a'; c.beginPath(); c.moveTo(cx+r*.1,cy+r*.55); c.lineTo(cx-r*.2,cy+r*1.1); c.lineTo(cx+r*.02,cy+r*1.05); c.lineTo(cx-r*.15,cy+r*1.5); c.lineTo(cx+r*.3,cy+r*.9); c.lineTo(cx+r*.08,cy+r*.95); c.closePath(); c.fill(); }
    gloomEyes(c,cx,cy,r*.8,t,2,'#e6f0ff');
  } else { // doubt
    for(let i=0;i<3;i++){ c.strokeStyle=`rgba(150,110,220,${.35-i*.1})`; c.lineWidth=r*.08; c.beginPath(); c.ellipse(cx,cy,r*(1.25+i*.18+Math.sin(t*2+i)*.05),r*(1.05+i*.15),t*.3*(i%2?-1:1),0,Math.PI*1.6); c.stroke(); }
    gloomBody(c,cx,cy,r,col,t); gloomEyes(c,cx,cy,r,t,3,'#e9d6ff');
  }
}

/* ===================== DRAWING: TILES ===================== */
function hash(x,y){ let h=x*374761393+y*668265263; h=(h^(h>>>13))*1274126177; return ((h^(h>>>16))>>>0)/4294967296; }
function drawObstacle(c,kind,x,y,s,h){
  const cx=x+s/2, by=y+s;
  ell(c,cx,by-s*.08,s*.38,s*.12,0,'rgba(0,0,0,.18)');
  if(kind==='tree'||kind==='fruit'){
    c.fillStyle='#6b4423'; c.fillRect(cx-s*.08,by-s*.45,s*.16,s*.4);
    const g1=shade('#3f8a3a',h*.2-.1); circ(c,cx,by-s*.62,s*.36,g1); circ(c,cx-s*.2,by-s*.5,s*.24,shade(g1,-.1)); circ(c,cx+s*.2,by-s*.52,s*.24,shade(g1,-.05)); circ(c,cx-s*.08,by-s*.75,s*.18,shade(g1,.15));
    if(kind==='fruit'){ [[-.15,-.6],[.12,-.7],[.2,-.48],[-.22,-.45]].forEach(([a,b])=>circ(c,cx+a*s,by+b*s,s*.055,h>.5?'#e04a3a':'#f0b03a')); }
  } else if(kind==='olive'){
    c.strokeStyle='#7a6a55'; c.lineWidth=s*.1; c.beginPath(); c.moveTo(cx,by-s*.08); c.quadraticCurveTo(cx-s*.12,by-s*.3,cx+s*.03,by-s*.48); c.stroke();
    const g='#7f9a6a'; circ(c,cx,by-s*.6,s*.3,g); circ(c,cx-s*.2,by-s*.52,s*.2,shade(g,-.12)); circ(c,cx+s*.2,by-s*.55,s*.2,shade(g,.08));
  } else if(kind==='pine'){
    c.fillStyle='#5a3a1e'; c.fillRect(cx-s*.06,by-s*.25,s*.12,s*.2);
    for(let i=0;i<3;i++){ c.fillStyle=shade('#2f6a45',i*.08); c.beginPath(); c.moveTo(cx,by-s*(1.0-i*.18)); c.lineTo(cx+s*(.26+i*.07),by-s*(.45-i*.07)-s*.0); c.lineTo(cx-s*(.26+i*.07),by-s*(.45-i*.07)); c.closePath(); c.fill(); }
  } else if(kind==='palm'){
    c.strokeStyle='#8a6a3a'; c.lineWidth=s*.09; c.beginPath(); c.moveTo(cx,by-s*.08); c.quadraticCurveTo(cx+s*.12,by-s*.45,cx+s*.02,by-s*.8); c.stroke();
    c.strokeStyle='#4a9a3a'; c.lineWidth=s*.08; c.lineCap='round';
    [[-.4,-.65],[.4,-.65],[-.3,-.98],[.32,-.96],[0,-1.05]].forEach(([a,b])=>{ c.beginPath(); c.moveTo(cx+s*.02,by-s*.8); c.quadraticCurveTo(cx+a*s*.6,by+b*s-s*.12,cx+a*s,by+b*s+s*.1); c.stroke(); });
  } else if(kind==='rock'){
    const g=shade('#8f8a80',h*.2-.1); c.fillStyle=g; c.beginPath(); c.moveTo(cx-s*.36,by-s*.1); c.lineTo(cx-s*.28,by-s*.48); c.lineTo(cx,by-s*.6); c.lineTo(cx+s*.3,by-s*.45); c.lineTo(cx+s*.38,by-s*.1); c.closePath(); c.fill();
    c.fillStyle=shade(g,.25); c.beginPath(); c.moveTo(cx-s*.24,by-s*.44); c.lineTo(cx,by-s*.56); c.lineTo(cx+s*.05,by-s*.35); c.closePath(); c.fill();
  } else if(kind==='cactus'){
    c.fillStyle='#4f9a4a'; c.fillRect(cx-s*.08,by-s*.75,s*.16,s*.7); c.fillRect(cx-s*.28,by-s*.5,s*.12,s*.25); c.fillRect(cx-s*.28,by-s*.3,s*.22,s*.08); c.fillRect(cx+s*.16,by-s*.6,s*.12,s*.25); c.fillRect(cx+s*.06,by-s*.4,s*.22,s*.08);
  } else if(kind==='bush'){
    const g=shade('#4f9a4a',h*.15); circ(c,cx-s*.15,by-s*.25,s*.2,shade(g,-.1)); circ(c,cx+s*.15,by-s*.25,s*.2,g); circ(c,cx,by-s*.38,s*.22,shade(g,.1));
  } else if(kind==='brick'){
    c.fillStyle='#c9965a'; c.fillRect(x+s*.08,by-s*.75,s*.84,s*.7); c.strokeStyle='rgba(90,50,20,.5)'; c.lineWidth=1;
    for(let r=0;r<4;r++){ c.beginPath(); c.moveTo(x+s*.08,by-s*.75+r*s*.175); c.lineTo(x+s*.92,by-s*.75+r*s*.175); c.stroke(); }
    c.fillStyle='#d9a96a'; c.fillRect(x+s*.08,by-s*.8,s*.84,s*.08);
  } else if(kind==='house'){
    c.fillStyle='#e9dcc0'; c.fillRect(x+s*.06,by-s*.82,s*.88,s*.78); c.fillStyle='#cbb894'; c.fillRect(x+s*.02,by-s*.88,s*.96,s*.1);
    c.fillStyle='#6b4a2a'; c.fillRect(cx-s*.1,by-s*.38,s*.2,s*.34); c.fillStyle='#3a2a1a'; c.fillRect(x+s*.18,by-s*.68,s*.14,s*.14);
  }
}
function drawDeco(c,kind,x,y,s,h){
  if(kind==='flower'){ const cols=['#f5d04a','#f07aa8','#ffffff','#b48af0']; for(let i=0;i<3;i++){ const fx=x+s*(.2+((h*7+i*.37)%1)*.6), fy=y+s*(.25+((h*13+i*.53)%1)*.55); circ(c,fx,fy,s*.06,cols[(i+Math.floor(h*4))%4]); circ(c,fx,fy,s*.025,'#f0a020'); } }
  else if(kind==='grass'){ c.strokeStyle='rgba(30,70,20,.45)'; c.lineWidth=1.5; for(let i=0;i<3;i++){ const gx=x+s*(.2+i*.28), gy=y+s*(.4+((h*9+i*.3)%1)*.4); c.beginPath(); c.moveTo(gx,gy); c.lineTo(gx-3,gy-7); c.moveTo(gx,gy); c.lineTo(gx+3,gy-7); c.stroke(); } }
  else if(kind==='pebble'){ for(let i=0;i<3;i++) ell(c,x+s*(.2+((h*5+i*.31)%1)*.6),y+s*(.3+((h*11+i*.47)%1)*.5),s*.06,s*.04,0,'rgba(90,70,50,.35)'); }
  else if(kind==='reed'){ c.strokeStyle='#6f8a3a'; c.lineWidth=2; for(let i=0;i<4;i++){ const gx=x+s*(.25+i*.17); c.beginPath(); c.moveTo(gx,y+s*.85); c.lineTo(gx+(i%2?2:-2),y+s*.35); c.stroke(); } ell(c,x+s*.42,y+s*.35,s*.04,s*.1,0,'#7a5a2a'); }
}

/* ===================== LANDMARKS ===================== */
function drawLandmark(c,lm,s,t){
  const X=lm.x*s, Y=lm.y*s, W=lm.w*s, H=lm.h*s, cx=X+W/2, by=Y+H;
  const k=lm.k;
  ell(c,cx,by-s*.15,W*.52,s*.4,0,'rgba(0,0,0,.18)');
  if(k==='lifeTree'){
    c.fillStyle='#6b4423'; c.beginPath(); c.moveTo(cx-s*.5,by-s*.1); c.quadraticCurveTo(cx-s*.25,by-H*.45,cx-s*.35,by-H*.6); c.lineTo(cx+s*.35,by-H*.6); c.quadraticCurveTo(cx+s*.25,by-H*.45,cx+s*.5,by-s*.1); c.closePath(); c.fill();
    [[0,-.75,.42],[-.28,-.6,.3],[.28,-.62,.3],[-.15,-.92,.28],[.18,-.9,.27]].forEach(([a,b,r],i)=>circ(c,cx+a*W,by+b*H,r*W,shade('#3f9a3a',i*.05-.05)));
    for(let i=0;i<9;i++){ const a=i*2.1; circ(c,cx+Math.cos(a)*W*.3,by-H*.75+Math.sin(a)*H*.18,s*.13,'#ffd34a'); circ(c,cx+Math.cos(a)*W*.3,by-H*.75+Math.sin(a)*H*.18,s*.05,'#fff6c0'); }
  } else if(k==='ark'){
    c.fillStyle='#7a4f28'; c.beginPath(); c.moveTo(X,Y+H*.35); c.lineTo(X+W,Y+H*.35); c.lineTo(X+W*.9,by-s*.2); c.lineTo(X+W*.1,by-s*.2); c.closePath(); c.fill();
    c.strokeStyle='rgba(40,20,5,.5)'; c.lineWidth=2; for(let i=1;i<4;i++){ c.beginPath(); c.moveTo(X+W*.03*i,Y+H*.35+i*H*.13); c.lineTo(X+W-W*.03*i,Y+H*.35+i*H*.13); c.stroke(); }
    c.fillStyle='#9a6a38'; c.fillRect(X+W*.25,Y+H*.05,W*.5,H*.32); c.fillStyle='#5a3a1a'; c.beginPath(); c.moveTo(X+W*.2,Y+H*.08); c.lineTo(cx,Y-H*.18); c.lineTo(X+W*.8,Y+H*.08); c.closePath(); c.fill();
    c.fillStyle='#2a1a0a'; for(let i=0;i<4;i++) c.fillRect(X+W*.3+i*W*.12,Y+H*.15,W*.06,H*.1);
  } else if(k==='pyramid'){
    const g=c.createLinearGradient(X,0,X+W,0); g.addColorStop(0,'#f0d494'); g.addColorStop(.5,'#e0bb70'); g.addColorStop(.51,'#c79f58'); g.addColorStop(1,'#b58c48');
    c.fillStyle=g; c.beginPath(); c.moveTo(X,by); c.lineTo(cx,Y-H*.3); c.lineTo(X+W,by); c.closePath(); c.fill();
    c.strokeStyle='rgba(120,80,30,.35)'; c.lineWidth=1.5; for(let i=1;i<7;i++){ const yy=by-i*(H*1.3)/7, hw=(W/2)*(1-i/7); c.beginPath(); c.moveTo(cx-hw,yy); c.lineTo(cx+hw,yy); c.stroke(); }
    c.fillStyle='#4a3218'; c.fillRect(cx-s*.35,by-s*.9,s*.7,s*.9);
  } else if(k==='mountain'){
    c.fillStyle='#8a7258'; c.beginPath(); c.moveTo(X,by); c.lineTo(X+W*.42,Y-H*.1); c.lineTo(X+W*.58,Y+H*.05); c.lineTo(X+W,by); c.closePath(); c.fill();
    c.fillStyle='#a58c6c'; c.beginPath(); c.moveTo(X,by); c.lineTo(X+W*.42,Y-H*.1); c.lineTo(X+W*.38,by); c.closePath(); c.fill();
    const fl=.7+Math.sin(t*5)*.15; c.fillStyle=`rgba(255,170,60,${fl*.6})`; circ(c,X+W*.45,Y,s*.9,`rgba(255,180,70,${fl*.35})`);
    c.fillStyle='rgba(235,235,245,.85)'; [[-.3,0,.7],[0,-.2,.9],[.35,0,.7]].forEach(([a,b,r])=>circ(c,X+W*.45+a*s*2,Y-s*.7+b*s,r*s,'rgba(230,232,245,.8)'));
  } else if(k==='walls'){
    const fallen=S&&S.chs[5].stage>=3;
    if(!fallen){
      c.fillStyle='#b49a6a'; c.fillRect(X,Y+H*.2,W,H*.8); c.fillStyle='#c4aa7a'; for(let i=0;i<W/s;i++) c.fillRect(X+i*s,Y+H*.1,s*.5,H*.12);
      c.fillStyle='#a48a5a'; c.fillRect(X-s*.2,Y,s*1.4,H); c.fillRect(X+W-s*1.2,Y,s*1.4,H);
      c.fillStyle='#e8dcc0'; for(let i=0;i<5;i++) c.fillRect(X+s*1.5+i*s*1.3,Y+H*.4,s*.6,s*.5);
      c.fillStyle='#c0302b'; c.fillRect(X+W*.3,Y+H*.42,s*.1,s*.7);
      c.fillStyle='#3a2a1a'; c.beginPath(); c.arc(cx,by,s*.9,Math.PI,0); c.fill();
      c.strokeStyle='rgba(60,40,20,.3)'; c.lineWidth=1; for(let yy=Y+H*.3;yy<by;yy+=s*.35){ c.beginPath(); c.moveTo(X,yy); c.lineTo(X+W,yy); c.stroke(); }
    } else {
      for(let i=0;i<40;i++){ const h=hash(i,77); ell(c,X+h*W,by-((h*13)%1)*H*.6,s*(.2+((h*7)%1)*.3),s*(.12+((h*5)%1)*.15),h*3,shade('#b49a6a',((h*11)%1)*.3-.15)); }
    }
  } else if(k==='camp'){
    for(let i=0;i<3;i++){ const tx=X+s*.5+i*W/3, tw=W/3-s*.3; c.fillStyle=i===1?'#8a3a3a':'#a58c6c'; c.beginPath(); c.moveTo(tx,by); c.lineTo(tx+tw/2,Y); c.lineTo(tx+tw,by); c.closePath(); c.fill(); c.fillStyle='#2a1a0a'; c.beginPath(); c.moveTo(tx+tw*.4,by); c.lineTo(tx+tw/2,by-H*.4); c.lineTo(tx+tw*.6,by); c.fill(); c.strokeStyle='#5a3a1a'; c.lineWidth=2; c.beginPath(); c.moveTo(tx+tw/2,Y); c.lineTo(tx+tw/2,Y-s*.5); c.stroke(); c.fillStyle='#5a4a8a'; c.fillRect(tx+tw/2,Y-s*.5,s*.4,s*.25); }
  } else if(k==='ziggurat'){
    for(let i=0;i<5;i++){ const ww=W*(1-i*.17), hh=H/5; c.fillStyle=shade('#c9965a',i*.06); c.fillRect(cx-ww/2,by-(i+1)*hh,ww,hh); c.fillStyle='rgba(90,50,20,.25)'; c.fillRect(cx-ww/2,by-(i+1)*hh,ww,3); }
    c.fillStyle='#b07a40'; c.fillRect(cx-s*.4,by-H,s*.8,H);
  } else if(k==='stable'){
    const glow=S&&S.chs[8].stage>=3;
    c.fillStyle='#7a5a3a'; c.fillRect(X+s*.2,Y+H*.35,W-s*.4,H*.65); c.fillStyle='#5a3a1e'; c.beginPath(); c.moveTo(X-s*.1,Y+H*.4); c.lineTo(cx,Y+H*.05); c.lineTo(X+W+s*.1,Y+H*.4); c.closePath(); c.fill();
    c.fillStyle=glow?'#ffe9a0':'#2a1a0a'; c.fillRect(cx-s*.9,Y+H*.55,s*1.8,H*.45);
    c.fillStyle='#d9b25b'; c.fillRect(cx-s*.6,by-s*.45,s*1.2,s*.35);
    const sy=Y-H*.55, sr=s*(glow?.55:.25)*(1+Math.sin(t*3)*.08);
    if(glow){ c.strokeStyle='rgba(255,240,180,.35)'; c.lineWidth=3; for(let i=0;i<8;i++){ const a=i*Math.PI/4+t*.2; c.beginPath(); c.moveTo(cx,sy); c.lineTo(cx+Math.cos(a)*s*2.5,sy+Math.sin(a)*s*2.5); c.stroke(); } c.strokeStyle='rgba(255,240,180,.25)'; c.lineWidth=6; c.beginPath(); c.moveTo(cx,sy); c.lineTo(cx,Y+H*.3); c.stroke(); }
    star(c,cx,sy,sr,glow?'#fff6c0':'#8a90b0');
  } else if(k==='boat'){
    c.fillStyle='#7a4f28'; c.beginPath(); c.moveTo(X,Y+H*.45); c.lineTo(X+W,Y+H*.45); c.lineTo(X+W*.82,by); c.lineTo(X+W*.18,by); c.closePath(); c.fill();
    c.strokeStyle='#5a3a1a'; c.lineWidth=3; c.beginPath(); c.moveTo(cx,Y+H*.45); c.lineTo(cx,Y-H*1.2); c.stroke();
    c.fillStyle='#efe6cf'; c.beginPath(); c.moveTo(cx+2,Y-H*1.1); c.quadraticCurveTo(cx+W*.45,Y-H*.4,cx+2,Y+H*.3); c.closePath(); c.fill();
  } else if(k==='tomb'){
    const open=S&&S.chs[10].stage>=3;
    c.fillStyle='#9a9080'; c.beginPath(); c.moveTo(X,by); c.quadraticCurveTo(X,Y,cx,Y); c.quadraticCurveTo(X+W,Y,X+W,by); c.closePath(); c.fill();
    c.fillStyle='#7a7064'; c.beginPath(); c.moveTo(X+W*.6,by); c.quadraticCurveTo(X+W,Y+H*.1,X+W,by); c.fill();
    c.fillStyle=open?'#fff1b8':'#1a140e'; c.beginPath(); c.arc(cx,by,s*.95,Math.PI,0); c.fill();
    if(open){ c.fillStyle='rgba(255,240,180,.25)'; circ(c,cx,by-s*.4,s*2.2,'rgba(255,240,180,.18)'); }
    const sx=open?X+W+s*.3:cx; circ(c,sx,by-s*.85,s*1.0,'#b0a690'); circ(c,sx,by-s*.85,s*.7,'#a0967f');
    c.fillStyle='#5f8a3a'; for(let i=0;i<6;i++) ell(c,X+i*W/5,by-s*.05,s*.3,s*.12,0,'#5f8a3a');
  } else if(k==='fountain'){
    circ(c,cx,cy(lm,s),W*.48,'#b9ab8a'); circ(c,cx,cy(lm,s),W*.4,'#4f9ad8'); circ(c,cx,cy(lm,s),s*.35,'#c9bb9a');
    for(let i=0;i<6;i++){ const a=i*Math.PI/3+t; circ(c,cx+Math.cos(a)*s*.6,cy(lm,s)+Math.sin(a)*s*.5-s*.2,s*.08,'rgba(220,240,255,.8)'); }
    circ(c,cx,cy(lm,s)-s*.5,s*.16,'rgba(220,240,255,.9)');
  } else if(k==='house'||k==='barn'||k==='tent'){
    if(k==='tent'){ c.fillStyle='#2f6f8a'; c.beginPath(); c.moveTo(X,by); c.lineTo(cx,Y); c.lineTo(X+W,by); c.closePath(); c.fill(); c.fillStyle='#e9d8a6'; for(let i=0;i<3;i++){ c.beginPath(); c.moveTo(cx,Y); c.lineTo(X+W*(.2+i*.3),by); c.lineTo(X+W*(.28+i*.3),by); c.closePath(); c.fill(); } c.fillStyle='#1a140e'; c.beginPath(); c.moveTo(cx-s*.5,by); c.lineTo(cx,by-H*.5); c.lineTo(cx+s*.5,by); c.fill(); }
    else { c.fillStyle=k==='barn'?'#8a5a3a':'#e9dcc0'; c.fillRect(X+s*.1,Y+H*.3,W-s*.2,H*.7); c.fillStyle=k==='barn'?'#5a3a1e':'#c9b48a'; if(k==='barn'){ c.beginPath(); c.moveTo(X-s*.1,Y+H*.35); c.lineTo(cx,Y); c.lineTo(X+W+s*.1,Y+H*.35); c.closePath(); c.fill(); } else c.fillRect(X,Y+H*.22,W,H*.12);
      c.fillStyle='#5a3a1e'; c.fillRect(cx-s*.4,by-H*.45,s*.8,H*.45);
      if(lm.awn){ for(let i=0;i<6;i++){ c.fillStyle=i%2?'#f1efe8':lm.awn; c.fillRect(X+s*.3+i*(W-s*.6)/6,Y+H*.36,(W-s*.6)/6,s*.35); } }
      c.fillStyle='#3a2a1a'; c.fillRect(X+s*.4,Y+H*.5,s*.5,s*.4); c.fillRect(X+W-s*.9,Y+H*.5,s*.5,s*.4); }
    if(lm.sign){ c.font=`800 ${s*.34}px Nunito, sans-serif`; c.textAlign='center'; const tw=c.measureText(lm.sign).width+s*.4; c.fillStyle='#5a3a1e'; c.fillRect(cx-tw/2,Y-s*.35,tw,s*.5); c.fillStyle='#f6de98'; c.fillText(lm.sign,cx,Y+s*.03); }
  }
}
function cy(lm,s){ return lm.y*s+lm.h*s/2; }
function star(c,x,y,r,col){ c.fillStyle=col; c.beginPath(); for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5, rr=i%2?r*.45:r; c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr); } c.closePath(); c.fill(); }
function drawGate(c,g,s,t){
  const X=g.x*s, Y=g.y*s, W=2*s, H=2*s, open=g.ch<=S.unlocked, done=S.chs[g.ch].stage>=4;
  c.fillStyle='#a8a090'; c.fillRect(X,Y+s*.2,s*.45,H-s*.2); c.fillRect(X+W-s*.45,Y+s*.2,s*.45,H-s*.2);
  c.beginPath(); c.arc(X+W/2,Y+s*.75,W/2,Math.PI,0); c.lineTo(X+W-s*.45,Y+s*.75); c.arc(X+W/2,Y+s*.75,W/2-s*.45,0,Math.PI,true); c.closePath(); c.fill();
  const th=CH[g.ch].th;
  if(open){ const gr=c.createRadialGradient(X+W/2,Y+s*1.2,2,X+W/2,Y+s*1.2,s*.9); gr.addColorStop(0,'#fff6d0'); gr.addColorStop(.5,th.sky); gr.addColorStop(1,th.g); c.fillStyle=gr; }
  else c.fillStyle='#1a1f36';
  c.beginPath(); c.arc(X+W/2,Y+s*.75,W/2-s*.45,Math.PI,0); c.lineTo(X+W-s*.45,Y+H); c.lineTo(X+s*.45,Y+H); c.closePath(); c.fill();
  if(open){ for(let i=0;i<3;i++){ const a=t*2+i*2.1; circ(c,X+W/2+Math.cos(a)*s*.3,Y+s*1.2+Math.sin(a)*s*.4,s*.05,'rgba(255,255,255,.8)'); } }
  else { c.fillStyle='#8a8070'; c.fillRect(X+W/2-s*.18,Y+s*1.1,s*.36,s*.3); c.strokeStyle='#8a8070'; c.lineWidth=s*.07; c.beginPath(); c.arc(X+W/2,Y+s*1.1,s*.13,Math.PI,0); c.stroke(); }
  c.font=`900 ${s*.4}px Nunito, sans-serif`; c.textAlign='center'; c.fillStyle=done?'#f6de98':'#2a2016'; circ(c,X+W/2,Y+s*.05,s*.28,done?'#7a5a12':'#e9dcc0'); c.fillText(g.ch,X+W/2,Y+s*.19);
}

/* ===================== MAP GENERATION ===================== */
function isBlocked(v){ return v===T.B||v===T.W||v===T.L; }
function buildMap(id){
  const R = id==='hub'?HUB:CH[id]; const W=R.w,H=R.h, rnd=mulberry32(R.seed);
  const t=new Uint8Array(W*H);
  const inb=(x,y)=>x>=0&&y>=0&&x<W&&y<H;
  const get=(x,y)=>inb(x,y)?t[y*W+x]:T.B, set=(x,y,v)=>{ if(inb(x,y)) t[y*W+x]=v; };
  const m={id,W,H,t,R,th:R.th,ents:[],foes:[],lms:[],items:[],get,set};
  const blob=(cx,cy,r,v)=>{ for(let y=Math.floor(cy-r-1);y<=cy+r+1;y++) for(let x=Math.floor(cx-r-1);x<=cx+r+1;x++){ const d=(x-cx)**2+(y-cy)**2; if(d<=r*r*(.6+rnd()*.5)) set(x,y,v);} };
  const rect=(x,y,w,h,v)=>{ for(let j=y;j<y+h;j++) for(let i=x;i<x+w;i++) set(i,j,v); };
  if(id==='hub'){
    for(let i=0;i<W*H;i++) t[i]=T.G;
    for(let i=0;i<W*H;i++){ const x=i%W,y=(i/W)|0; if(rnd()<.12) t[i]=T.D; if(x<2||y<2||x>=W-2||y>=H-2) t[i]=T.B; }
    rect(3,8,W-6,1,T.P); rect(3,17,W-6,1,T.P); rect(16,8,2,10,T.P); rect(13,10,8,6,T.P);
    for(let x=4;x<W-4;x+=3) set(x,20,T.D);
    [[6,13],[9,11],[25,12],[28,14],[11,15],[23,15]].forEach(([x,y])=>set(x,y,T.B));
    const lm=(k,x,y,w,h,o)=>{ const L=Object.assign({k,x,y,w,h},o||{}); m.lms.push(L); rect(x,y,w,h,T.L); return L; };
    lm('house',3,3,6,4,{sign:"Lydia's Goods",awn:'#7b3fa0'});
    lm('tent',12,3,5,4,{sign:'Scribe'});
    lm('barn',24,3,6,4,{sign:'Stable'});
    lm('fountain',16,11,2,2);
    for(let i=0;i<10;i++){ const gx=2+i*3, gy=18; rect(gx,gy,2,2,T.L); m.ents.push({kind:'gate',x:gx,y:gy,w:2,h:2,ch:i+1}); }
    rect(2,20,W-4,1,T.G);
    const npc=(role,x,y,def,extra)=>m.ents.push(Object.assign({kind:'npc',role,x,y,name:def.name,look:def.look},extra||{}));
    npc('elder',15,14,SIMEON); npc('shop',6,7+0,HUBNPC.lydia); npc('scribe',14,7,HUBNPC.ezra); npc('stable',27,7,HUBNPC.jesse);
    npc('flavor',22,12,HUBNPC.timothy,{lines:["My grandma Lois taught me the Scriptures since I was little!","Tip: Use the arrow keys or WASD to walk — or just tap where you want to go."]});
    npc('flavor',9,14,HUBNPC.lois,{lines:["Every gate holds a story. Walk in, listen well, and you'll learn something wonderful.","If you get tired, Ezra the Scribe lets you practice questions to earn shekels."]});
    m.spawn={x:17,y:14};
  } else {
    for(let i=0;i<W*H;i++) t[i]=T.G;
    if(R.river){ if(R.river.d==='v'){ let x=Math.floor(W*R.river.at); for(let y=0;y<H;y++){ for(let k=0;k<3;k++) set(x+k,y,T.W); if(rnd()<.3) x=clamp(x+(rnd()<.5?-1:1),6,W-8);} }
      else { let y=Math.floor(H*R.river.at); for(let x=0;x<W;x++){ for(let k=0;k<3;k++) set(x,y+k,T.W); if(rnd()<.3) y=clamp(y+(rnd()<.5?-1:1),5,H-7);} } }
    if(R.lake){ const lx=W*.52, ly=H*.42; for(let y=0;y<H;y++) for(let x=0;x<W;x++){ const d=((x-lx)/(W*.2))**2+((y-ly)/(H*.24))**2; if(d<1+(hash(x,y)-.5)*.25) set(x,y,T.W);} }
    for(let i=0;i<R.ponds;i++) blob(4+rnd()*(W-8),4+rnd()*(H-8),1.5+rnd()*2,T.W);
    for(let i=0;i<R.dense;i++) blob(3+rnd()*(W-6),3+rnd()*(H-6),.8+rnd()*2.3,T.B);
    for(let i=0;i<W*H;i++){ if(t[i]===T.G){ const r=rnd(); if(r<.05) t[i]=T.B; else if(r<.15) t[i]=T.D; } }
    for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(x<2||y<2||x>=W-2||y>=H-2) set(x,y,T.B);
    const sp={x:3,y:H>>1}; m.spawn=sp;
    for(let y=sp.y-3;y<=sp.y+3;y++) for(let x=2;x<=8;x++) set(x,y,T.G);
    const L=R.lm, lw=L.w, lh=L.h, lx=Math.floor(W*L.x-lw/2), ly=Math.floor(H*L.y);
    if(L.k!=='boat'){ for(let y=ly-1;y<=ly+lh+2;y++) for(let x=lx-2;x<=lx+lw+1;x++) if(get(x,y)!==T.W||y>=ly) set(x,y,T.G); }
    rect(lx,ly,lw,lh,T.L); const LM={k:L.k,x:lx,y:ly,w:lw,h:lh,dyn:['walls','stable','tomb'].includes(L.k)}; m.lms.push(LM);
    const front={x:lx+Math.floor(lw/2),y:ly+lh};
    const bossPos={x:front.x,y:front.y+(L.k==='boat'?1:0)};
    m.bossPos=bossPos;
    m.ents.push({kind:'exit',x:2,y:sp.y});
    const guidePos={x:7,y:sp.y-2};
    const sidePos={x:Math.round(W*.3),y:Math.round(H*.8)};
    const flavPos=[{x:Math.round(W*.42),y:Math.round(H*.2)},{x:Math.round(W*.8),y:Math.round(H*.72)}];
    const carve=(ax,ay,bx,by)=>{ let x=ax,y=ay,g=0;
      const paint=(px,py)=>{ if(px<2||py<2||px>=W-2||py>=H-2) return; const v=get(px,py); if(v===T.L) return; set(px,py,v===T.W||v===T.BR?T.BR:T.P); };
      paint(x,y);
      while((x!==bx||y!==by)&&g++<3000){ const dx=Math.sign(bx-x), dy=Math.sign(by-y);
        let hz= dx!==0&&(dy===0||rnd()<.5); let nx=x+(hz?dx:0), ny=y+(hz?0:dy);
        if(get(nx,ny)===T.L){ hz=!hz; nx=x+(hz?dx:0); ny=y+(hz?0:dy); if((hz&&dx===0)||(!hz&&dy===0)||get(nx,ny)===T.L){ nx=x; ny=y+1; if(get(nx,ny)===T.L){nx=x+1;ny=y;} } }
        x=clamp(nx,2,W-3); y=clamp(ny,2,H-3); paint(x,y); } };
    const targets=[guidePos,sidePos,...flavPos,{x:bossPos.x,y:bossPos.y+1}];
    targets.forEach(p=>{ const mid={x:clamp(Math.round((sp.x+p.x)/2+(rnd()-.5)*10),3,W-4),y:clamp(Math.round((sp.y+p.y)/2+(rnd()-.5)*8),3,H-4)};
      if(get(mid.x,mid.y)===T.L) mid.y=clamp(ly+lh+2,3,H-4); carve(sp.x,sp.y,mid.x,mid.y); carve(mid.x,mid.y,p.x,p.y); });
    if(L.k==='boat'){ for(let y=front.y;y<=front.y+12&&y<H-2;y++){ const v=get(front.x,y); if(v===T.W||v===T.BR) set(front.x,y,T.BR); else { set(front.x,y,T.P); break; } } }
    else set(bossPos.x,bossPos.y,T.P);
    [guidePos,sidePos,...flavPos].forEach(p=>{ if(isBlocked(get(p.x,p.y))) set(p.x,p.y,T.G); });
    m.ents.push({kind:'npc',role:'guide',x:guidePos.x,y:guidePos.y,name:R.guide.name,look:R.guide.look,staff:R.guide.staff});
    m.ents.push({kind:'npc',role:'side',x:sidePos.x,y:sidePos.y,name:R.side.name,look:R.side.look});
    R.flav.forEach((f,i)=>m.ents.push({kind:'npc',role:'flavor',x:flavPos[i].x,y:flavPos[i].y,name:f.name,look:f.look,angel:f.angel,lines:f.lines}));
    const reach=bfsAll(m,sp.x,sp.y);
    const cands=[]; reach.forEach(k=>{ const x=k%W,y=(k/W)|0; if(Math.abs(x-sp.x)+Math.abs(y-sp.y)>9 && (t[k]===T.G||t[k]===T.D)) cands.push(k); });
    const ir=mulberry32(R.seed+99); const chosen=[];
    for(let i=0;i<R.side.items.length&&cands.length;i++){ let k,tries=0; do{ k=cands[Math.floor(ir()*cands.length)]; tries++; }while(tries<60 && chosen.some(c=>Math.abs(c%W-k%W)+Math.abs(((c/W)|0)-((k/W)|0))<6)); chosen.push(k); m.items.push({idx:i,x:k%W,y:(k/W)|0,e:R.side.items[i]}); }
    m.reach=cands;
  }
  return m;
}
function bfsAll(m,sx,sy){ const W=m.W, seen=new Set([sy*W+sx]), q=[[sx,sy]];
  while(q.length){ const [x,y]=q.shift(); [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{ const nx=x+dx,ny=y+dy,k=ny*W+nx; if(!seen.has(k)&&!isBlocked(m.get(nx,ny))&&!entAt(m,nx,ny)){ seen.add(k); q.push([nx,ny]); } }); }
  return seen; }
function entAt(m,x,y){ for(const e of m.ents){ const w=e.w||1,h=e.h||1; if(x>=e.x&&x<e.x+w&&y>=e.y&&y<e.y+h) return e; } return null; }
function walkable(x,y){ return !isBlocked(M.get(x,y)) && !entAt(M,x,y); }

function buildCache(m){
  const cs=Math.min(window.devicePixelRatio||1,1.5);
  const can=document.createElement('canvas'); can.width=Math.ceil(m.W*TS*cs); can.height=Math.ceil(m.H*TS*cs);
  const c=can.getContext('2d'); c.scale(cs,cs); const th=m.th;
  for(let y=0;y<m.H;y++) for(let x=0;x<m.W;x++){ const v=m.get(x,y), X=x*TS, Y=y*TS, h=hash(x+m.R.seed,y);
    if(v===T.W||v===T.BR){ c.fillStyle=th.w; c.fillRect(X,Y,TS+1,TS+1);
      const shore=(dx,dy)=>{ const n=m.get(x+dx,y+dy); return n!==T.W&&n!==T.BR; };
      c.fillStyle=shade(th.g,.25); if(shore(0,-1)) c.fillRect(X,Y,TS,4); if(shore(0,1)) c.fillRect(X,Y+TS-4,TS,4); if(shore(-1,0)) c.fillRect(X,Y,4,TS); if(shore(1,0)) c.fillRect(X+TS-4,Y,4,TS);
      if(v===T.BR){ c.fillStyle='#9a6a38'; c.fillRect(X+4,Y,TS-8,TS); c.fillStyle='#7a4f28'; for(let i=0;i<4;i++) c.fillRect(X+4,Y+i*TS/4,TS-8,2); }
    } else {
      c.fillStyle=h<.5?th.g:th.g2; c.fillRect(X,Y,TS+1,TS+1);
      if(h>.85){ c.fillStyle='rgba(255,255,255,.05)'; c.fillRect(X+h*20,Y+h*10,6,3); }
      if(v===T.P){ c.fillStyle=th.p; c.beginPath(); c.roundRect?c.roundRect(X+1,Y+1,TS-2,TS-2,8):c.rect(X+1,Y+1,TS-2,TS-2); c.fill();
        const n=(dx,dy)=>{ const q=m.get(x+dx,y+dy); return q===T.P||q===T.BR; }; c.fillStyle=th.p;
        if(n(1,0)) c.fillRect(X+TS/2,Y+1,TS/2+1,TS-2); if(n(-1,0)) c.fillRect(X,Y+1,TS/2,TS-2); if(n(0,1)) c.fillRect(X+1,Y+TS/2,TS-2,TS/2+1); if(n(0,-1)) c.fillRect(X+1,Y,TS-2,TS/2);
        ell(c,X+h*TS,Y+((h*7)%1)*TS,3,2,0,'rgba(0,0,0,.08)'); }
      if(v===T.D) drawDeco(c,th.deco,X,Y,TS,h);
    } }
  for(let y=0;y<m.H;y++) for(let x=0;x<m.W;x++) if(m.get(x,y)===T.B){ const h=hash(x+m.R.seed,y); drawObstacle(c,th.obs[Math.floor(h*th.obs.length)],x*TS,y*TS,TS,h); }
  m.lms.forEach(l=>{ if(!l.dyn&&l.k!=='fountain') drawLandmark(c,l,TS,0); });
  m.cache=can; m.cs=cs;
}

/* ===================== WORLD ENTRY ===================== */
function enterMap(id,spawn){
  M=buildMap(id); buildCache(M);
  const sp=spawn||M.spawn; P.x=P.tx=sp.x; P.y=P.ty=sp.y; P.fx=P.x; P.fy=P.y; P.mv=false; P.path=[]; P.pend=null; P.inv=1.2;
  CP.fx=P.x-1; CP.fy=P.y; trail=[];
  if(id!=='hub'){ const c=S.chs[id]; for(let i=0;i<9+Math.floor(id/2);i++) spawnFoe(true); if(c.stage===2) addBoss(); }
  M.respawn=0;
  const R=M.R; banner(R.name, id==='hub'?R.sub:R.book);
  S.map=id; save(); updHUD();
}
function addBoss(){ if(M.ents.some(e=>e.kind==='boss')) return; const b=M.bossPos; M.ents.push({kind:'boss',x:b.x,y:b.y}); }
function spawnFoe(init){
  const c=CH[M.id]; if(!M.reach||!M.reach.length) return;
  for(let tries=0;tries<40;tries++){ const k=pick(M.reach); const x=k%M.W,y=(k/M.W)|0;
    if(Math.abs(x-P.x)+Math.abs(y-P.y)<(init?10:8)) continue; if(M.foes.some(f=>f.x===x&&f.y===y)) continue;
    if(M.ents.some(e=>Math.abs(e.x-x)<=2&&Math.abs(e.y-y)<=2)) continue;
    M.foes.push({x,y,fx:x,fy:y,tx:x,ty:y,hx:x,hy:y,mv:false,prog:0,tm:Math.random()*2,seed:Math.random()*10,c:c.foe.c}); return; }
}

/* ===================== INPUT ===================== */
const DIRS={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
const KEYMAP={ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
addEventListener('keydown',e=>{
  if(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT')) return;
  if(KEYMAP[e.code]){ keys[KEYMAP[e.code]]=true; P.path=[]; P.pend=null; e.preventDefault(); }
  if(e.code==='Space'||e.code==='Enter'){ e.preventDefault(); if(qOpen){ const g=$('#qGo'); if(!g.hidden) g.click(); return; } if(dialogOpen){ advDialog(); return; } if(mode==='world'&&!modalOpen) doAct(); }
  if(e.code==='Escape'&&modalOpen) closeModal();
  if(qOpen&&/^Digit[1-4]$/.test(e.code)){ const b=$('#qChoices').children[+e.code.slice(5)-1]; if(b&&!b.disabled) b.click(); }
});
addEventListener('keyup',e=>{ if(KEYMAP[e.code]) keys[KEYMAP[e.code]]=false; });
addEventListener('blur',()=>{ for(const k in keys) keys[k]=false; });
document.querySelectorAll('#dpad button').forEach(b=>{ const d=b.dataset.d;
  const on=e=>{ e.preventDefault(); keys[d]=true; P.path=[]; P.pend=null; ac(); }, off=e=>{ e.preventDefault(); keys[d]=false; };
  b.addEventListener('pointerdown',on); b.addEventListener('pointerup',off); b.addEventListener('pointerleave',off); b.addEventListener('pointercancel',off); });
cv.addEventListener('pointerdown',e=>{
  ac(); if(mode!=='world'||dialogOpen||modalOpen) return;
  const r=cv.getBoundingClientRect(); const wx=(e.clientX-r.left)/zoom+cam.x, wy=(e.clientY-r.top)/zoom+cam.y;
  const tx=Math.floor(wx/TS), ty=Math.floor(wy/TS);
  const foe=M.foes.find(f=>Math.abs(f.fx-wx/TS+.5)<.7&&Math.abs(f.fy-wy/TS+.5)<.7);
  if(foe){ P.path=pathTo(t=>Math.abs(t.x-foe.x)+Math.abs(t.y-foe.y)<=1); return; }
  const ent=entAt(M,tx,ty);
  if(ent){ if(nearEnt(ent)){ interact(ent); return; } P.path=pathTo(t=>adjTo(t.x,t.y,ent)); P.pend=ent; return; }
  if(walkable(tx,ty)){ P.path=pathTo(t=>t.x===tx&&t.y===ty); P.pend=null; }
});
function adjTo(x,y,e){ const w=e.w||1,h=e.h||1; return x>=e.x-1&&x<=e.x+w&&y>=e.y-1&&y<=e.y+h&&!(x>=e.x&&x<e.x+w&&y>=e.y&&y<e.y+h) && (x>=e.x&&x<e.x+w || y>=e.y&&y<e.y+h); }
function nearEnt(e){ return adjTo(P.x,P.y,e); }
function pathTo(goal){
  const W=M.W, start={x:P.x,y:P.y}; if(goal(start)) return [];
  const prev=new Map(), q=[start]; prev.set(start.y*W+start.x,null); let found=null, n=0;
  while(q.length&&n++<6000){ const c=q.shift(); for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=c.x+dx, ny=c.y+dy, k=ny*W+nx; if(prev.has(k)||!walkable(nx,ny)) continue; prev.set(k,c); const nn={x:nx,y:ny}; if(goal(nn)){found=nn;break;} q.push(nn); } if(found) break; }
  if(!found) return []; const path=[]; let cur=found; while(cur&&!(cur.x===start.x&&cur.y===start.y)){ path.unshift(cur); cur=prev.get(cur.y*W+cur.x); } return path;
}

/* ===================== UPDATE ===================== */
let cam={x:0,y:0};
const SPEED=5.2;
function update(dt){
  if(mode!=='world'||dialogOpen||modalOpen||qOpen) return;
  P.inv=Math.max(0,P.inv-dt);
  if(!P.mv){
    let d=null; for(const k of ['up','down','left','right']) if(keys[k]){ d=k; break; }
    let nx,ny;
    if(d){ P.dir=d; nx=P.x+DIRS[d][0]; ny=P.y+DIRS[d][1]; }
    else if(P.path.length){ const nxt=P.path[0]; nx=nxt.x; ny=nxt.y; const dx=nx-P.x, dy=ny-P.y; P.dir=dx>0?'right':dx<0?'left':dy>0?'down':'up'; if(!walkable(nx,ny)){ P.path=[]; nx=undefined; } else P.path.shift(); }
    if(nx!==undefined&&walkable(nx,ny)){ P.tx=nx; P.ty=ny; P.mv=true; P.prog=0; trail.push({x:P.x,y:P.y}); if(trail.length>3) trail.shift(); }
    else if(!P.path.length&&P.pend){ if(nearEnt(P.pend)) interact(P.pend); P.pend=null; }
  }
  if(P.mv){ P.prog+=dt*SPEED; P.walk+=dt*10; if(P.prog>=1){ P.x=P.tx; P.y=P.ty; P.mv=false; P.prog=0; onStep(); } P.fx=P.x+(P.tx-P.x)*(P.mv?P.prog:0); P.fy=P.y+(P.ty-P.y)*(P.mv?P.prog:0); }
  else { P.fx=P.x; P.fy=P.y; }
  const tgt=trail.length?trail[trail.length-1]:{x:P.x-1,y:P.y};
  CP.fx+=(tgt.x-CP.fx)*Math.min(1,dt*6); CP.fy+=(tgt.y-CP.fy)*Math.min(1,dt*6);
  if(M.id!=='hub'){
    M.foes.forEach(f=>{
      if(!f.mv){ f.tm-=dt; if(f.tm<=0){ f.tm=.7+Math.random()*1.4;
          const dpx=P.x-f.x, dpy=P.y-f.y, near=Math.abs(dpx)+Math.abs(dpy)<5&&P.inv<=0;
          let opts=[[1,0],[-1,0],[0,1],[0,-1]]; if(near&&Math.random()<.6) opts=[[Math.sign(dpx),0],[0,Math.sign(dpy)]].filter(o=>o[0]||o[1]); else shuffle(opts);
          for(const [dx,dy] of opts){ const nx=f.x+dx, ny=f.y+dy; if(walkable(nx,ny)&&Math.abs(nx-f.hx)+Math.abs(ny-f.hy)<=6&&!M.foes.some(o=>o!==f&&o.x===nx&&o.y===ny)&&Math.abs(nx-M.spawn.x)+Math.abs(ny-M.spawn.y)>4){ f.tx=nx; f.ty=ny; f.mv=true; f.prog=0; break; } } } }
      else { f.prog+=dt*2.6; if(f.prog>=1){ f.x=f.tx; f.y=f.ty; f.mv=false; } f.fx=f.x+(f.tx-f.x)*(f.mv?f.prog:0); f.fy=f.y+(f.ty-f.y)*(f.mv?f.prog:0); }
      if(P.inv<=0&&mode==='world'&&Math.hypot(f.fx-P.fx,f.fy-P.fy)<.8){ startBattle(f,false); }
    });
    M.respawn+=dt; if(M.respawn>25){ M.respawn=0; if(M.foes.length<6+Math.floor(M.id/2)) spawnFoe(false); }
  }
  updAct();
}
function onStep(){
  const it=M.items&&M.items.find(i=>i.x===P.x&&i.y===P.y);
  if(it){ const c=S.chs[M.id]; if(c.side===1&&!c.got.includes(it.idx)){ c.got.push(it.idx); SFX.coin(); const tot=CH[M.id].side.items.length;
      toast(`Found ${it.e}  (${c.got.length}/${tot})`); if(c.got.length>=tot) toast(`Return to ${CH[M.id].side.name}!`); save(); updTrack(); } }
}
let actEnt=null;
function updAct(){
  let best=null; if(!P.mv) for(const e of M.ents){ if(nearEnt(e)){ best=e; break; } }
  if(best!==actEnt){ actEnt=best; const b=$('#act');
    if(!best) b.hidden=true;
    else { b.hidden=false; b.textContent= best.kind==='gate'?(best.ch<=S.unlocked?`Enter Gate ${best.ch}: ${CH[best.ch].name}`:`Gate ${best.ch} is locked`)
      : best.kind==='exit'?"Return to Pilgrim's Rest" : best.kind==='boss'?`Face the ${CH[M.id].boss.name}!` : `Talk to ${best.name}`; } }
}
$('#act').addEventListener('click',()=>{ ac(); doAct(); });
function doAct(){ if(actEnt) interact(actEnt); }

/* ===================== RENDER ===================== */
function resize(){ dpr=Math.min(window.devicePixelRatio||1,2); cw=cv.clientWidth; ch=cv.clientHeight; cv.width=Math.round(cw*dpr); cv.height=Math.round(ch*dpr); zoom=clamp(Math.min(cw,ch)/560,.62,1.25); }
addEventListener('resize',resize);
let titleMotes=[];
function renderTitle(t){
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const g=ctx.createLinearGradient(0,0,0,ch); g.addColorStop(0,'#0b1230'); g.addColorStop(.6,'#1d2b66'); g.addColorStop(1,'#3a3a6a'); ctx.fillStyle=g; ctx.fillRect(0,0,cw,ch);
  for(let i=0;i<70;i++){ const h=hash(i,3); circ(ctx,h*cw,((h*31)%1)*ch*.6,1+((h*7)%1)*1.4,`rgba(255,255,255,${.3+.5*Math.abs(Math.sin(t*1.5+i))})`); }
  if(titleMotes.length<50) titleMotes.push({x:Math.random()*cw,y:ch+10,v:20+Math.random()*30,r:1+Math.random()*2.5,p:Math.random()*6});
  titleMotes.forEach(m=>{ m.y-=m.v/60; m.x+=Math.sin(t+m.p)*.3; circ(ctx,m.x,m.y,m.r,'rgba(246,222,152,.7)'); }); titleMotes=titleMotes.filter(m=>m.y>-10);
  ctx.fillStyle='#141a3c'; ctx.beginPath(); ctx.moveTo(0,ch); for(let x=0;x<=cw;x+=20) ctx.lineTo(x,ch*.8-Math.sin(x*.006)*40-Math.sin(x*.017)*14); ctx.lineTo(cw,ch); ctx.fill();
  ctx.fillStyle='#0d1230'; ctx.beginPath(); ctx.moveTo(0,ch); for(let x=0;x<=cw;x+=20) ctx.lineTo(x,ch*.88-Math.sin(x*.009+2)*30); ctx.lineTo(cw,ch); ctx.fill();
}
function render(t){
  if(mode==='title'||!M){ renderTitle(t); return; }
  if(mode==='battle'){ renderBattle(t); return; }
  ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle='#0e1534'; ctx.fillRect(0,0,cv.width,cv.height);
  const vw=cw/zoom, vh=ch/zoom, mw=M.W*TS, mh=M.H*TS;
  cam.x = mw<vw ? (mw-vw)/2 : clamp(P.fx*TS+TS/2-vw/2,0,mw-vw);
  cam.y = mh<vh ? (mh-vh)/2 : clamp(P.fy*TS+TS/2-vh/2,0,mh-vh);
  const s=dpr*zoom; ctx.setTransform(s,0,0,s,-cam.x*s,-cam.y*s);
  ctx.drawImage(M.cache,0,0,M.cache.width,M.cache.height,0,0,M.W*TS,M.H*TS);
  const x0=Math.max(0,Math.floor(cam.x/TS)), y0=Math.max(0,Math.floor(cam.y/TS)), x1=Math.min(M.W,Math.ceil((cam.x+vw)/TS)+1), y1=Math.min(M.H,Math.ceil((cam.y+vh)/TS)+1);
  ctx.strokeStyle='rgba(255,255,255,.35)'; ctx.lineWidth=1.5;
  for(let y=y0;y<y1;y++) for(let x=x0;x<x1;x++) if(M.get(x,y)===T.W){ const h=hash(x,y); const o=Math.sin(t*1.5+h*6)*4; ctx.beginPath(); ctx.moveTo(x*TS+8+o,y*TS+TS*h*.6+10); ctx.quadraticCurveTo(x*TS+14+o,y*TS+TS*h*.6+6,x*TS+20+o,y*TS+TS*h*.6+10); ctx.stroke(); }
  const draws=[];
  M.lms.forEach(l=>{ if(l.dyn||l.k==='fountain') draws.push({y:l.y+l.h,f:()=>drawLandmark(ctx,l,TS,t)}); });
  M.ents.forEach(e=>{
    if(e.kind==='gate') draws.push({y:e.y+2,f:()=>drawGate(ctx,e,TS,t)});
    else if(e.kind==='exit') draws.push({y:e.y+1,f:()=>drawExit(ctx,e,t)});
    else if(e.kind==='boss') draws.push({y:e.y+1,f:()=>drawBoss(ctx,e.x*TS+TS/2,e.y*TS+TS*.1,TS*.62,CH[M.id].boss,t,{marches:0})});
    else if(e.kind==='npc') draws.push({y:e.y+1,f:()=>drawNPC(e,t)});
  });
  if(M.items){ const c=S.chs[M.id]; if(c&&c.side===1) M.items.forEach(it=>{ if(!c.got.includes(it.idx)) draws.push({y:it.y+.5,f:()=>{ const X=it.x*TS+TS/2, Y=it.y*TS+TS/2+Math.sin(t*3+it.idx)*3; circ(ctx,X,Y,TS*.34,'rgba(255,236,160,.35)'); circ(ctx,X,Y,TS*.22,'rgba(255,246,200,.45)'); ctx.font=`${TS*.5}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(it.e,X,Y); ctx.textBaseline='alphabetic'; }}); }); }
  M.foes.forEach(f=>draws.push({y:f.fy+1,f:()=>drawGloom(ctx,f.fx*TS+TS/2,f.fy*TS+TS*.42,TS*.32,f.c,t+f.seed)}));
  const comp=COMPS[S.comp]; if(comp) draws.push({y:CP.fy+.95,f:()=>{ ctx.font=`${TS*.58}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ell(ctx,CP.fx*TS+TS/2,CP.fy*TS+TS*.85,TS*.18,TS*.06,0,'rgba(0,0,0,.2)'); ctx.fillText(comp.e,CP.fx*TS+TS/2,CP.fy*TS+TS*.55+Math.sin(t*6)*2); ctx.textBaseline='alphabetic'; }});
  draws.push({y:P.fy+1.01,f:()=>{ const flick=P.inv>0&&Math.floor(t*12)%2; if(flick) ctx.globalAlpha=.5; drawPerson(ctx,P.fx*TS+TS/2,P.fy*TS+TS*.95,TS*1.05,S.look,playerOpts({dir:P.dir,bob:P.mv?Math.abs(Math.sin(P.walk))*3:0})); ctx.globalAlpha=1; }});
  draws.sort((a,b)=>a.y-b.y).forEach(d=>d.f());
  if(M.R.night){ ctx.setTransform(dpr,0,0,dpr,0,0); const px=(P.fx*TS+TS/2-cam.x)*zoom, py=(P.fy*TS+TS/2-cam.y)*zoom; const done=S.chs[8].stage>=3;
    const g=ctx.createRadialGradient(px,py,40*zoom,px,py,Math.max(cw,ch)*.75); g.addColorStop(0,'rgba(8,10,40,0)'); g.addColorStop(1,`rgba(8,10,40,${done?.35:.62})`); ctx.fillStyle=g; ctx.fillRect(0,0,cw,ch);
    for(let i=0;i<40;i++){ const h=hash(i,9); circ(ctx,h*cw,((h*17)%1)*ch*.35,1+((h*3)%1),`rgba(255,255,240,${.2+.4*Math.abs(Math.sin(t+i))})`); } }
}
function drawExit(c,e,t){ const X=e.x*TS, Y=e.y*TS; c.fillStyle='#a8a090'; c.fillRect(X+2,Y-TS*.6,TS*.22,TS*1.55); c.fillRect(X+TS-TS*.24,Y-TS*.6,TS*.22,TS*1.55); c.fillRect(X,Y-TS*.75,TS,TS*.22);
  const g=c.createLinearGradient(X,Y,X+TS,Y); g.addColorStop(0,'rgba(255,240,180,.2)'); g.addColorStop(.5,`rgba(255,240,180,${.5+Math.sin(t*3)*.2})`); g.addColorStop(1,'rgba(255,240,180,.2)'); c.fillStyle=g; c.fillRect(X+TS*.24,Y-TS*.53,TS*.52,TS*1.45); }
function drawNPC(e,t){
  const X=e.x*TS+TS/2, Y=e.y*TS+TS*.95;
  drawPerson(ctx,X,Y,TS*1.05,e.look,{dir:'down',bob:Math.abs(Math.sin(t*1.2+e.x))*1.2,staff:e.staff,wings:e.angel,halo:e.angel});
  const mark=npcMark(e);
  if(mark){ const my=Y-TS*1.25+Math.sin(t*4)*3; circ(ctx,X,my,TS*.2,mark==='!'?'#e8b94a':'#7cc4ff'); ctx.fillStyle='#1d1406'; ctx.font=`900 ${TS*.3}px Nunito, sans-serif`; ctx.textAlign='center'; ctx.fillText(mark,X,my+TS*.11); }
  const d=Math.abs(e.x-P.x)+Math.abs(e.y-P.y);
  if(d<6){ ctx.font=`800 ${TS*.27}px Nunito, sans-serif`; ctx.textAlign='center'; const w=ctx.measureText(e.name).width+10; ctx.fillStyle='rgba(14,21,52,.8)'; ctx.fillRect(X-w/2,Y+2,w,TS*.34); ctx.fillStyle='#f6de98'; ctx.fillText(e.name,X,Y+TS*.27); }
}
function npcMark(e){
  if(e.role==='elder'){ if(!S.flags.met) return '!'; if(S.chs[10].stage>=4&&!S.flags.ending) return '!'; return null; }
  if(e.role==='stable'&&!S.flags.met) return null;
  if(M.id==='hub') return null;
  const c=S.chs[M.id];
  if(e.role==='guide'){ if(c.stage===0||c.stage===3) return '!'; return null; }
  if(e.role==='side'){ if(c.side===0) return '!'; if(c.side===1&&c.got.length>=CH[M.id].side.items.length) return '?'; }
  return null;
}

/* ===================== MAIN LOOP ===================== */
let last=performance.now();
function loop(ts){ const dt=Math.min(.05,(ts-last)/1000); last=ts; now=ts/1000; try{ update(dt); render(now); }catch(err){ console.error(err); } requestAnimationFrame(loop); }

/* ===================== UI HELPERS ===================== */
function toast(msg,big){ const d=document.createElement('div'); d.className='toast'+(big?' big':''); d.textContent=msg; $('#toasts').appendChild(d); setTimeout(()=>{ d.style.transition='opacity .4s'; d.style.opacity='0'; setTimeout(()=>d.remove(),400); },big?3200:2300); }
let bannerT=0;
function banner(t,s){ $('#bnT').textContent=t; $('#bnS').textContent=s||''; const b=$('#banner'); b.classList.add('show'); clearTimeout(bannerT); bannerT=setTimeout(()=>b.classList.remove('show'),2600); }
function updHUD(){ if(!S) return; const mh=maxHP(); S.hp=clamp(S.hp,0,mh);
  $('#hName').textContent=S.name; $('#hLv').textContent=S.level; $('#hHp').style.width=(S.hp/mh*100)+'%'; $('#hHpT').textContent=`${Math.ceil(S.hp)} / ${mh}`;
  $('#hXp').style.width=(S.xp/xpNeed()*100)+'%'; $('#hCoins').textContent=S.coins; updTrack(); }
function updTrack(){ const el=$('#track'); if(!S||mode!=='world'||!M){ el.hidden=true; return; } el.hidden=false; el.innerHTML='<b>Quest</b>'+esc(questText()); }
function questText(){
  if(M.id==='hub'){ if(!S.flags.met) return 'Talk to Simeon by the fountain.'; if(S.chs[10].stage>=4&&!S.flags.ending) return 'Bring the last Scroll piece to Simeon!';
    const n=nextOpen(); return n?`Enter Gate ${n}: ${CH[n].name}`:'The Scroll is whole! Explore any gate.'; }
  const c=S.chs[M.id], R=CH[M.id];
  let s = c.stage===0?`Talk to ${R.guide.name}.` : c.stage===1?`Defeat ${R.foe.name}s: ${c.kills}/${R.kills}` : c.stage===2?`Face the ${R.boss.name} at the ${R.boss.where}!` : c.stage===3?`Return to ${R.guide.name}.`:'Chapter complete!';
  if(c.side===1) s+=` · ${R.side.what}: ${c.got.length}/${R.side.items.length}`;
  return s;
}
function nextOpen(){ for(let i=1;i<=10;i++) if(S.chs[i].stage<4&&i<=S.unlocked) return i; return null; }

/* ---- dialog ---- */
let dQ=[], dDone=null, dTyping=false, dFull='', dIdx=0, dTimer=0;
function talk(lines,done){ dQ=lines.slice(); dDone=done||null; dialogOpen=true; $('#dialog').hidden=false; $('#act').hidden=true; actEnt=null; showLine(); }
function showLine(){ const l=dQ.shift(); const who=l.who||{name:'',look:null};
  $('#dName').textContent=who.name; const pc=$('#dPort'), c=pc.getContext('2d'); c.clearRect(0,0,pc.width,pc.height);
  if(who.scroll){ drawScrollIcon(c,84,96); } else if(who.look) drawPerson(c,84,230,190,who.look,Object.assign({dir:'down',halo:who.angel,wings:who.angel},who.opts||{}));
  dFull=l.text; dIdx=0; dTyping=true; $('#dText').textContent=''; clearInterval(dTimer);
  dTimer=setInterval(()=>{ dIdx+=2; $('#dText').textContent=dFull.slice(0,dIdx); if(dIdx>=dFull.length){ dTyping=false; clearInterval(dTimer);} },18); }
function advDialog(){ if(dTyping){ dTyping=false; clearInterval(dTimer); $('#dText').textContent=dFull; return; }
  if(dQ.length) showLine(); else { dialogOpen=false; $('#dialog').hidden=true; const d=dDone; dDone=null; if(d) d(); } }
$('#dialog').addEventListener('click',()=>{ ac(); advDialog(); });
function drawScrollIcon(c,x,y){ c.fillStyle='#e9d8a6'; c.fillRect(x-45,y-50,90,100); c.fillStyle='#c9a95c'; c.fillRect(x-55,y-60,110,16); c.fillRect(x-55,y+44,110,16); c.fillStyle='#8a6a2a'; for(let i=0;i<5;i++) c.fillRect(x-32,y-30+i*15,64-(i%2)*18,4); }
const L=(who,text)=>({who,text});
const NARR={name:'The Scroll',scroll:1};

/* ---- modal ---- */
function openModal(title,html,mount){ modalOpen=true; $('#mT').textContent=title; $('#mB').innerHTML=html; $('#modal').hidden=false; $('#act').hidden=true; actEnt=null; SFX.open(); if(mount) mount($('#mB')); }
function closeModal(){ modalOpen=false; $('#modal').hidden=true; updHUD(); }
$('#mX').addEventListener('click',closeModal);
$('#modal').addEventListener('click',e=>{ if(e.target.id==='modal') closeModal(); });

/* ===================== INTERACTIONS ===================== */
function interact(e){
  ac(); P.path=[]; P.pend=null; keys.up=keys.down=keys.left=keys.right=false;
  if(e.kind==='gate'){ if(e.ch>S.unlocked){ toast(`Finish Gate ${e.ch-1} to open this gate.`); return; } flash(); enterMap(e.ch); return; }
  if(e.kind==='exit'){ flash(); const g={x:2+(M.id-1)*3,y:17}; enterMap('hub',g); return; }
  if(e.kind==='boss'){ const b=CH[M.id].boss; talk([L(CH[M.id].guide,`${b.name}! ${CH[M.id].hint}`)],()=>startBattle(null,true)); return; }
  if(e.kind!=='npc') return;
  const who={name:e.name,look:e.look,angel:e.angel,opts:{staff:e.staff}};
  if(e.role==='flavor'){ talk(e.lines.map(t=>L(who,t))); return; }
  if(e.role==='elder') return elderTalk(who);
  if(e.role==='shop') return talk([L(who,"Welcome, pilgrim! I sell purple cloth and good food for the road.")],openShop);
  if(e.role==='stable'){ if(!S.flags.met){ talk([L(who,"Simeon by the fountain wants to see you first, young one.")]); return; } return talk([L(who,"Animal friends travel with you and help in every battle. Pick who comes along!")],openStable); }
  if(e.role==='scribe') return talk([L(who,"Practice makes wise! Answer my questions to earn shekels, or read the verses you have collected.")],openScribe);
  const id=M.id, c=S.chs[id], R=CH[id];
  if(e.role==='guide'){
    if(c.stage===0){ talk(R.intro.map(t=>L(who,t)),()=>{ c.stage=1; save(); updTrack(); toast(`Quest: defeat ${R.kills} ${R.foe.name}s`); }); }
    else if(c.stage===1){ talk([L(who,`${R.foe.name}s are ${R.foe.what}. You've stopped ${c.kills} of ${R.kills}. Keep going!`)]); }
    else if(c.stage===2){ talk([L(who,R.hint)]); }
    else if(c.stage===3){ talk(R.outro.map(t=>L(who,t)),()=>completeChapter(id)); }
    else talk([L(who,R.post)]);
    return;
  }
  if(e.role==='side'){ const sd=R.side;
    if(c.side===0) talk([L(who,sd.ask)],()=>{ c.side=1; save(); updTrack(); toast(`Find ${sd.items.length} ${sd.what}. Look for the glowing spots!`); });
    else if(c.side===1&&c.got.length>=sd.items.length) talk([L(who,sd.thanks)],()=>{ c.side=2; S.coins+=sd.reward.coins; addItem(sd.reward.item,1); SFX.coin(); toast(`+${sd.reward.coins} shekels and ${ITEMS[sd.reward.item].e} ${ITEMS[sd.reward.item].name}`); save(); updHUD(); });
    else if(c.side===1) talk([L(who,`Still looking for my ${sd.what}? You've found ${c.got.length} of ${sd.items.length}. Look for little glowing spots!`)]);
    else talk([L(who,'Thank you again, friend! God bless your journey.')]);
  }
}
function elderTalk(who){
  if(!S.flags.met){ talk([
    L(who,"Ah, a pilgrim at last! I am Simeon. I have waited many years to see God's promises come true."),
    L(who,"The Scroll of Light tells the great story of God's love — from creation all the way to the empty tomb."),
    L(who,"But the Shadow of Doubt tore it into ten pieces and hid them in the stories of the Bible."),
    L(who,"These Gates of Remembrance lead into those stories. Answer wisely, be brave, and bring the pieces home."),
    L(who,"Gate 1, the Garden of Eden, is open. And look — Jesse's little lamb has decided to follow you. God be with you!")
  ],()=>{ S.flags.met=1; save(); updTrack(); toast('🐑 The Lamb joined you!'); }); return; }
  if(S.chs[10].stage>=4&&!S.flags.ending){ return ending(who); }
  const n=S.fragsCount=Object.values(S.chs).filter(c=>c.stage>=4).length, nx=nextOpen();
  talk([L(who, n>=10?"The Scroll is whole! Keep visiting the gates — every story still has more to teach.":`You have restored ${n} of 10 Scroll pieces. ${nx?`Gate ${nx}, ${CH[nx].name}, is waiting for you.`:''}`)]);
}
function completeChapter(id){
  const c=S.chs[id], R=CH[id]; c.stage=4; S.unlocked=Math.max(S.unlocked,Math.min(10,id+1));
  const rw=R.reward; const got=[];
  if(rw.armor&&!S.armor.includes(rw.armor)){ S.armor.push(rw.armor); got.push(ARMOR[rw.armor].name); }
  if(rw.comp&&!S.comps[rw.comp]){ S.comps[rw.comp]={lvl:Math.max(1,S.level-2),xp:0}; got.push(COMPS[rw.comp].e+' '+COMPS[rw.comp].name); }
  if(rw.cosmetic==='crown'&&!S.cos.includes('crown')){ S.cos.push('crown'); }
  S.coins+=50+id*10; SFX.win(); S.hp=maxHP();
  toast(`Scroll piece ${id} restored!`,true); got.forEach(g=>setTimeout(()=>toast('Received: '+g),600));
  setTimeout(()=>toast(`Verse unlocked: ${R.verse.r}`),1200);
  save(); updHUD();
}
function ending(who){
  talk([L(who,"The tenth piece! Let me see... yes. The Scroll of Light is whole again!"),
    L(who,"From the garden to the empty tomb, every piece points to one great truth: God loves you, and Jesus came to rescue the world."),
    L(who,"'For God so loved the world, that he gave his only begotten Son.' That's the heart of the whole Scroll."),
    L(who,"You were brave and wise, pilgrim. Here is a crown — a reminder of the crown of life promised to the faithful (James 1:12)."),
    L(who,"The gates will stay open. Keep exploring, keep learning, and keep shining!")],()=>{
      S.flags.ending=1; if(!S.cos.includes('crown')) S.cos.push('crown'); save(); SFX.win();
      openModal('The Scroll is Restored',`<div class="fragrow">${Array.from({length:10},(_,i)=>`<div class="frag got">${i+1}</div>`).join('')}</div>
        <p class="verse">For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.<cite>John 3:16</cite></p>
        <p>You answered <b>${S.correct}</b> questions correctly and reached level <b>${S.level}</b>. Well done, good and faithful pilgrim!</p>
        <p style="color:var(--muted)">Grown-ups can raise the difficulty in Settings for an extra challenge.</p>`); });
}
function flash(){ const f=document.createElement('div'); f.className='flash'; $('#game').appendChild(f); setTimeout(()=>f.remove(),500); }
function addItem(id,n){ S.items[id]=(S.items[id]||0)+n; }

/* ===================== QUESTIONS ===================== */
const CATS={math:'Math',bible:'Bible',verse:'Memory Verse',words:'Words',logic:'Puzzle'};
function effGrade(cat){ return clamp(S.grade+(S.shift[cat]||0),2,10); }
function pickCat(){ const m=S.mix, tot=Object.values(m).reduce((a,b)=>a+b,0); if(tot<=0) return 'bible'; let r=Math.random()*tot; for(const k in m){ r-=m[k]; if(r<0) return k; } return 'math'; }
function numChoices(ans,extra){ const set=new Set(); const c=[ans+1,ans-1,ans+2,ans-2,ans+10,ans-10,ans*2,Math.round(ans/2),ans+5,ans-3].concat(extra||[]);
  shuffle(c).forEach(v=>{ if(set.size<3&&v!==ans&&Number.isFinite(v)&&(ans<0||v>=0)) set.add(v); }); let k=3; while(set.size<3){ set.add(ans+k); k+=1; } return [...set]; }
const fmt=n=>{ if(typeof n!=='number') return n; const s=Math.abs(n)>=10000?n.toLocaleString('en-US'):String(n); return n<0?s.replace('-','−'):s; };
const paren=n=>n<0?`(${fmt(n)})`:fmt(n);
function genMath(){
  const g=effGrade('math'); let types;
  if(g<=2) types=['add1','sub1','mul1','word'];
  else if(g===3) types=['add','sub','mul','word','word'];
  else if(g===4) types=['mul','div','add3','frac','word'];
  else if(g===5) types=['mul2','div','frac','fadd','dec','word'];
  else if(g===6) types=['pct','ops','neg','dec','word2','area'];
  else if(g===7) types=['pct','ops','neg','eq1','area','word2','eq2'];
  else if(g===8) types=['eq2','exp','sqrt','pyth','pct2','neg','word2'];
  else types=['eq2','eqb','exp','sqrt','pyth','slope','pct2'];
  const ty=pick(types); let q,a,ex,extra=[];
  switch(ty){
    case 'add1':{const x=rand(5,60),y=rand(3,39);q=`${x} + ${y} = ?`;a=x+y;ex=`${x} + ${y} = ${a}`;break;}
    case 'sub1':{const x=rand(20,99),y=rand(3,x-5);q=`${x} − ${y} = ?`;a=x-y;ex=`${x} − ${y} = ${a}`;break;}
    case 'mul1':{const x=pick([2,5,10,3]),y=rand(2,10);q=`${x} × ${y} = ?`;a=x*y;ex=`${x} groups of ${y} make ${a}`;break;}
    case 'add':{const x=rand(100,699),y=rand(50,299);q=`${x} + ${y} = ?`;a=x+y;ex=`${x} + ${y} = ${a}`;extra=[a+100,a-100];break;}
    case 'sub':{const x=rand(200,999),y=rand(50,x-50);q=`${x} − ${y} = ?`;a=x-y;ex=`${x} − ${y} = ${a}`;extra=[a+100,a-100];break;}
    case 'mul':{const x=rand(2,12),y=rand(2,12);q=`${x} × ${y} = ?`;a=x*y;ex=`${x} × ${y} = ${a}`;extra=[x*(y+1),(x+1)*y,x+y];break;}
    case 'div':{const y=rand(2,12),z=rand(2,12),x=y*z;q=`${x} ÷ ${y} = ?`;a=z;ex=`${y} × ${z} = ${x}, so ${x} ÷ ${y} = ${z}`;break;}
    case 'add3':{const x=rand(1000,6999),y=rand(100,2999);q=`${fmt(x)} + ${fmt(y)} = ?`;a=x+y;ex=`${x} + ${y} = ${a}`;extra=[a+1000,a-100,a+100];break;}
    case 'mul2':{const x=rand(11,49),y=rand(3,25);q=`${x} × ${y} = ?`;a=x*y;ex=`${x} × ${y} = ${a}`;extra=[a+x,a-y,a+10];break;}
    case 'frac':{const d=pick([2,3,4,5,10]),n=rand(1,d-1),k=rand(2,12),w=d*k;q=`What is ${n}/${d} of ${w}?`;a=n*k;ex=`${w} ÷ ${d} = ${k}, and ${k} × ${n} = ${a}`;extra=[k,w-a];break;}
    case 'fadd':{const d=pick([5,7,8,9,11,12]),x=rand(1,Math.floor(d/2)),y=rand(1,d-x-1);const ans=`${x+y}/${d}`;return mk('math',`${x}/${d} + ${y}/${d} = ?`,ans,[`${x+y}/${2*d}`,`${x+y+1}/${d}`,`${x*y}/${d}`].filter(v=>v!==ans),`Same bottom number, so add the tops: ${x} + ${y} = ${x+y}. Answer: ${ans}`);}
    case 'dec':{const x=rand(10,99)/10,y=rand(10,199)/100;const s=+(x+y).toFixed(2);return mk('math',`${x} + ${y} = ?`,String(s),[String(+(s+.1).toFixed(2)),String(+(s-.1).toFixed(2)),String(+(x*10+y).toFixed(2)) ].filter((v,i,ar)=>v!==String(s)&&ar.indexOf(v)===i),`Line up the decimal points: ${x} + ${y} = ${s}`);}
    case 'pct':{const p=pick([10,20,25,50,75]),n=pick([20,40,60,80,100,120,200,400]);q=`What is ${p}% of ${n}?`;a=n*p/100;ex=`${p}% means ${p} out of 100. ${n} × ${p}/100 = ${a}`;extra=[n-a,a*2];break;}
    case 'pct2':{const p=pick([15,20,25,30,40]),n=pick([40,60,80,120,160,200,240]);const off=n*p/100;if(!Number.isInteger(off)){a=n/2;q=`What is 50% of ${n}?`;ex=`Half of ${n} is ${a}`;break;}q=`A tent costs ${n} shekels. It is ${p}% off. What is the sale price?`;a=n-off;ex=`${p}% of ${n} is ${off}. ${n} − ${off} = ${a}`;extra=[off,n+off];break;}
    case 'ops':{const x=rand(2,20),y=rand(2,9),z=rand(2,9);q=`${x} + ${y} × ${z} = ?`;a=x+y*z;ex=`Multiply first: ${y} × ${z} = ${y*z}. Then ${x} + ${y*z} = ${a}`;extra=[(x+y)*z];break;}
    case 'neg':{const x=rand(-20,20),y=rand(-20,20);if(Math.random()<.5){q=`${fmt(x)} + ${paren(y)} = ?`;a=x+y;}else{q=`${fmt(x)} − ${paren(y)} = ?`;a=x-y;}ex=`${q.replace('= ?','')}= ${fmt(a)}`;extra=[-a,x-y===a?x+y:x-y];return mk('math',q,fmt(a),numChoices(a,extra).map(fmt),ex);}
    case 'eq1':{const x=rand(2,15),k=rand(2,20);if(Math.random()<.5){q=`x + ${k} = ${x+k}. What is x?`;ex=`Subtract ${k} from both sides: x = ${x}`;}else{const m=rand(2,9);q=`${m}x = ${m*x}. What is x?`;ex=`Divide both sides by ${m}: x = ${x}`;}a=x;break;}
    case 'eq2':{const m=rand(2,9),x=rand(-5,12),b=rand(1,20);q=`${m}x + ${b} = ${m*x+b}. What is x?`;a=x;ex=`Subtract ${b}: ${m}x = ${m*x}. Divide by ${m}: x = ${x}`;return mk('math',q,fmt(a),numChoices(a,[-a]).map(fmt),ex);}
    case 'eqb':{const x=rand(-6,10),a1=rand(3,9),c1=rand(1,a1-1),b1=rand(-10,10),d1=a1*x+b1-c1*x;q=`${a1}x ${b1<0?'−':'+'} ${Math.abs(b1)} = ${c1}x ${d1<0?'−':'+'} ${Math.abs(d1)}. What is x?`;a=x;ex=`Move x terms together: ${a1-c1}x = ${d1-b1}, so x = ${x}`;return mk('math',q,fmt(a),numChoices(a,[-a]).map(fmt),ex);}
    case 'exp':{const b=rand(2,6),e=b<=3?rand(2,5):rand(2,3);q=`${b}${['','','²','³','⁴','⁵'][e]} = ?`;a=b**e;ex=`${Array(e).fill(b).join(' × ')} = ${a}`;extra=[b*e,b**(e-1)];break;}
    case 'sqrt':{const r=rand(4,20);q=`√${r*r} = ?`;a=r;ex=`${r} × ${r} = ${r*r}`;extra=[r*r/2|0];break;}
    case 'pyth':{const tr=pick([[3,4,5],[5,12,13],[8,15,17],[6,8,10],[9,12,15],[7,24,25]]);q=`A right triangle has legs ${tr[0]} and ${tr[1]}. How long is the hypotenuse?`;a=tr[2];ex=`${tr[0]}² + ${tr[1]}² = ${tr[0]**2+tr[1]**2} = ${tr[2]}², so it is ${tr[2]}`;extra=[tr[0]+tr[1]];break;}
    case 'slope':{const x1=rand(-5,3),y1=rand(-5,5),m=rand(-4,4)||2,dx=rand(1,4),x2=x1+dx,y2=y1+m*dx;q=`What is the slope of the line through (${x1}, ${y1}) and (${x2}, ${y2})?`;a=m;ex=`Rise over run: (${y2} − ${paren(y1)}) ÷ (${x2} − ${paren(x1)}) = ${m*dx} ÷ ${dx} = ${m}`;return mk('math',q,fmt(a),numChoices(a,[-a]).map(fmt),ex);}
    case 'area':{const l=rand(3,15),w=rand(2,12);if(Math.random()<.5){q=`A garden is ${l} m long and ${w} m wide. What is its area in square meters?`;a=l*w;ex=`Area = length × width = ${l} × ${w} = ${a}`;extra=[2*(l+w)];}else{q=`A sheep pen is ${l} m long and ${w} m wide. How much fence goes all the way around?`;a=2*(l+w);ex=`Perimeter = ${l} + ${w} + ${l} + ${w} = ${a}`;extra=[l*w,l+w];}break;}
    case 'word':{const W=[
      ()=>{const n=rand(3,12);return[`Noah led ${n} pairs of animals onto the ark. How many animals is that?`,2*n,`${n} pairs × 2 = ${2*n}`];},
      ()=>{const x=rand(5,30),y=rand(2,15);return[`David had ${x} sheep. Then ${y} lambs were born. How many sheep now?`,x+y,`${x} + ${y} = ${x+y}`];},
      ()=>{const x=rand(1,11);return[`Jesus had 12 disciples. If ${x} went fishing, how many stayed on shore?`,12-x,`12 − ${x} = ${12-x}`];},
      ()=>{const x=rand(5,40),y=rand(5,40);return[`Peter caught ${x} fish and Andrew caught ${y}. How many fish altogether?`,x+y,`${x} + ${y} = ${x+y}`];},
      ()=>{const k=rand(2,8),b=rand(2,6);return[`${k*b} loaves are shared equally by ${b} families. How many loaves does each family get?`,k,`${k*b} ÷ ${b} = ${k}`];},
      ()=>[`Israel marched around Jericho once a day for 6 days, then 7 times on day 7. How many laps in all?`,13,`6 + 7 = 13`],
      ()=>[`A shepherd had 100 sheep and one wandered away. How many were left?`,99,`100 − 1 = 99`],
      ()=>{const x=rand(3,9);return[`Joseph stored ${x} barns of grain each year for 7 years. How many barns of grain?`,7*x,`7 × ${x} = ${7*x}`];}];
      const [qq,aa,ee]=pick(W)();q=qq;a=aa;ex=ee;break;}
    case 'word2':{const W=[
      ()=>[`The ark was 300 cubits long and 50 cubits wide. What was the area of its floor?`,15000,`300 × 50 = 15,000 square cubits (Genesis 6:15)`],
      ()=>[`Solomon's temple was 60 cubits long and 20 cubits wide. What was its area?`,1200,`60 × 20 = 1,200 square cubits (1 Kings 6:2)`],
      ()=>[`Methuselah lived 969 years and Noah lived 950 years. How many more years did Methuselah live?`,19,`969 − 950 = 19 (Genesis 5:27; 9:29)`],
      ()=>{const d=rand(12,30),k=rand(5,15);return[`The wise men traveled ${d} km a day for ${k} days. How far did they go?`,d*k,`${d} × ${k} = ${d*k} km`];},
      ()=>{const n=rand(4,9),c=rand(12,25);return[`Nehemiah's builders repaired ${c} meters of wall each day for ${n} days. How many meters in all?`,c*n,`${c} × ${n} = ${c*n}`];},
      ()=>[`5,000 people were fed, and 12 baskets were left over. If each basket held 25 pieces, how many pieces were left?`,300,`12 × 25 = 300`]];
      const [qq,aa,ee]=pick(W)();q=qq;a=aa;ex=ee;break;}
  }
  return mk('math',q,fmt(a),numChoices(a,extra).map(fmt),ex);
}
function mk(cat,text,ans,wrongs,explain,o){ const ws=[...new Set(wrongs.map(String))].filter(w=>w!==String(ans)).slice(0,3); const choices=shuffle([String(ans),...ws]);
  return Object.assign({cat,text,choices,answer:choices.indexOf(String(ans)),explain,id:cat+':'+text},o||{}); }
function bibleDiff(){ const g=effGrade('bible'); return g<=4?[1,1]:g<=6?[1,2]:g<=8?[1,3]:[2,3]; }
function genBible(ch){
  if(Math.random()<.18) return genBooks();
  const [lo,hi]=bibleDiff(); let pool=BQ.filter(q=>q[1]>=lo&&q[1]<=hi);
  const local=pool.filter(q=>q[0]===ch);
  if(ch&&local.length&&Math.random()<.65) pool=local; else { const opened=pool.filter(q=>q[0]===0||q[0]<=S.unlocked); if(opened.length) pool=opened; }
  const fresh=pool.filter(q=>!S.recent.includes('bible:'+q[2])); const q=pick(fresh.length?fresh:pool);
  return mk('bible',q[2],q[3],[q[4],q[5],q[6]],`${q[3]} — ${q[7]}`,{ref:q[7]});
}
function genBooks(){
  const g=effGrade('bible');
  if(g<=4){ const b=pick(BOOKS), ot=BOOKS.indexOf(b)<39; return mk('bible',`Is the book of ${b} in the Old Testament or the New Testament?`,ot?'Old Testament':'New Testament',[ot?'New Testament':'Old Testament'],`${b} is in the ${ot?'Old':'New'} Testament.`); }
  if(g>=8&&Math.random()<.5){ const i=rand(0,BOOKS.length-2), a=BOOKS[i+1]; const w=shuffle(BOOKS.filter((_,j)=>j!==i+1&&j!==i&&Math.abs(j-i)<8)).slice(0,3); return mk('bible',`Which book comes right after ${BOOKS[i]}?`,a,w,`${BOOKS[i]} is followed by ${a}.`); }
  const idx=shuffle([...Array(BOOKS.length).keys()]).slice(0,4); const first=Math.min(...idx);
  return mk('bible','Which of these books comes FIRST in the Bible?',BOOKS[first],idx.filter(i=>i!==first).map(i=>BOOKS[i]),`${BOOKS[first]} is book number ${first+1} of 66.`);
}
function genVerse(ch){
  let pool=VQ.filter(v=>v[0]===0||v[0]<=S.unlocked); const local=pool.filter(v=>v[0]===ch); if(ch&&local.length&&Math.random()<.6) pool=local;
  const fresh=pool.filter(v=>!S.recent.includes('verse:'+v[1])); const v=pick(fresh.length?fresh:pool);
  if(effGrade('verse')>=7&&Math.random()<.3){ const full=v[1].replace('___',v[2]); const book=v[6].replace(/\s[\d:,\-–\s]+.*$/,''); const others=shuffle(['Genesis','Exodus','Psalm','Proverbs','Isaiah','Matthew','Luke','John','Romans','Joshua','Daniel'].filter(b=>!book.includes(b)&&!b.includes(book))).slice(0,3);
    return mk('verse',`Which book is this verse from?<span class="vref" style="font-style:italic">"${esc(full)}"</span>`,book,others,`${v[6]}`,{html:1,verseq:1,say:`Which book is this verse from? ${full}`}); }
  return mk('verse',esc(v[1]).replace('___','<span class="blank">?</span>')+`<span class="vref">— ${esc(v[6])} (KJV)</span>`,v[2],[v[3],v[4],v[5]],`"${v[1].replace('___',v[2])}" — ${v[6]}`,{html:1,verseq:1,say:v[1].replace('___','blank')});
}
function misspell(w){
  const out=new Set(), vow='aeiou'; let tries=0;
  while(out.size<3&&tries++<60){ let s=w.split(''); const r=Math.random(); const i=rand(1,Math.max(1,s.length-2));
    if(r<.25&&s.length>4){ [s[i],s[i+1]]=[s[i+1],s[i]]; }
    else if(r<.45){ if(s[i]===s[i+1]) s.splice(i,1); else if(!vow.includes(s[i].toLowerCase())) s.splice(i,0,s[i]); else continue; }
    else if(r<.75){ const vi=s.map((c,j)=>vow.includes(c)&&j>0?j:-1).filter(j=>j>0); if(!vi.length) continue; const j=pick(vi); s[j]=pick(vow.replace(s[j],'').split('')); }
    else if(r<.85){ const t=s.join(''); const n=t.includes('ie')?t.replace('ie','ei'):t.includes('ei')?t.replace('ei','ie'):null; if(!n) continue; s=n.split(''); }
    else if(s.length>5){ s.splice(i,1); } else continue;
    const v=s.join(''); if(v!==w) out.add(v); }
  return [...out];
}
function genWords(){
  const g=effGrade('words'), dmax=g<=4?1:g<=6?2:3, dmin=g>=8?2:1; const r=Math.random();
  if(r<.4){ const pool=SPELL.filter(s=>s[1]<=dmax&&s[1]>=Math.min(dmin,dmax)); const w=pick(pool)[0]; const m=misspell(w); if(m.length>=2) return mk('words','Which word is spelled correctly?',w,m,`The correct spelling is "${w}".`); }
  const pool=VOCAB.filter(v=>v[2]<=dmax&&v[2]>=Math.min(dmin,dmax)); const v=pick(pool); const others=shuffle(VOCAB.filter(o=>o!==v)).slice(0,3);
  if(Math.random()<.5) return mk('words',`What does "${v[0]}" mean?`,v[1],others.map(o=>o[1]),`"${v[0]}" means ${v[1]}.`);
  return mk('words',`Which word means "${v[1]}"?`,v[0],others.map(o=>o[0]),`"${v[0]}" means ${v[1]}.`);
}
function genLogic(){
  const g=effGrade('logic'); const r=Math.random();
  if(r<.35){ const keys=Object.keys(GROUPS); const A=pick(keys); let B=pick(keys.filter(k=>k!==A)); const three=shuffle(GROUPS[A].slice()).slice(0,3), odd=pick(GROUPS[B]);
    return mk('logic','Which one does NOT belong with the others?',odd,three,`${three.join(', ')} are ${A}. ${odd} is from the ${B}.`.replace('the women','women'),{choicesFixed:1}); }
  const types=['ar']; if(g>=4) types.push('ar2'); if(g>=5) types.push('geo'); if(g>=6) types.push('sq','alt'); if(g>=7) types.push('fib');
  const ty=pick(types); let seq=[],a,ex;
  if(ty==='ar'||ty==='ar2'){ const s=rand(1,30), d=ty==='ar'?rand(2,9):rand(-9,15)||3; for(let i=0;i<5;i++) seq.push(s+d*i); a=s+d*5; ex=`Each number ${d>0?'adds':'subtracts'} ${Math.abs(d)}.`; }
  else if(ty==='geo'){ const s=rand(1,5), m=pick([2,3]); for(let i=0;i<4;i++) seq.push(s*m**i); a=s*m**4; ex=`Each number is multiplied by ${m}.`; }
  else if(ty==='sq'){ const s=rand(1,8); for(let i=0;i<4;i++) seq.push((s+i)**2); a=(s+4)**2; ex=`These are square numbers: ${s}², ${s+1}², ${s+2}²...`; }
  else if(ty==='alt'){ const s=rand(5,20), p=rand(3,9), q=rand(1,p-1); let v=s; for(let i=0;i<6;i++){ seq.push(v); v+= i%2?-q:p; } a=v; ex=`The pattern is +${p}, −${q}, +${p}, −${q}...`; }
  else { let x=rand(1,4), y=rand(1,5); seq=[x,y]; for(let i=0;i<4;i++) seq.push(seq[seq.length-1]+seq[seq.length-2]); a=seq[seq.length-1]+seq[seq.length-2]; ex='Each number is the sum of the two before it.'; }
  return mk('logic',`What comes next?  ${seq.map(fmt).join(',  ')},  ?`,fmt(a),numChoices(a).map(fmt),ex);
}
function makeQuestion(ch,catForce){
  let q=null;
  for(let i=0;i<6;i++){ const cat=catForce||pickCat();
    q= cat==='math'?genMath(): cat==='bible'?genBible(ch): cat==='verse'?genVerse(ch): cat==='words'?genWords(): genLogic();
    if(q.choices.length>=2&&!S.recent.includes(q.id)) break; }
  S.recent.push(q.id); if(S.recent.length>40) S.recent.shift(); return q;
}
function record(cat,ok){
  const st=S.stats[cat]=S.stats[cat]||{r:0,t:0,h:[]}; st.t++; if(ok) st.r++; st.h.push(ok?1:0); S.answered++; if(ok) S.correct++;
  if(st.h.length>=6){ const acc=st.h.reduce((a,b)=>a+b,0)/st.h.length; if(acc>=.85){ S.shift[cat]=Math.min(2,(S.shift[cat]||0)+1); st.h=[]; } else if(acc<.5){ S.shift[cat]=Math.max(-2,(S.shift[cat]||0)-1); st.h=[]; } else st.h.shift(); }
}
let qResolve=null;
function ask(q){
  return new Promise(res=>{
    qOpen=true; qResolve=res; $('#qcard').hidden=false; $('#qCat').textContent=CATS[q.cat];
    const qt=$('#qText'); qt.className=q.verseq?'verseq':''; if(q.html) qt.innerHTML=q.text; else qt.textContent=q.text;
    const fb=$('#qFb'); fb.className=''; fb.innerHTML=''; $('#qGo').hidden=true;
    const box=$('#qChoices'); box.innerHTML='';
    q.choices.forEach((c,i)=>{ const b=document.createElement('button'); b.innerHTML=`<span class="k">${i+1}</span><span>${esc(c)}</span>`;
      b.addEventListener('click',()=>{ [...box.children].forEach(x=>x.disabled=true); const ok=i===q.answer; record(q.cat,ok);
        box.children[q.answer].classList.add('right'); if(!ok) b.classList.add('wrong');
        if(ok){ SFX.ok(); fb.className='ok'; fb.innerHTML=pick(['Correct!','Well done!','That\'s right!','Excellent!','Yes!'])+(q.cat==='bible'&&q.ref?`<small>${esc(q.ref)}</small>`:''); setTimeout(()=>finishQ(true),q.cat==='bible'?1100:800); }
        else { SFX.bad(); fb.className='no'; fb.innerHTML=`Not quite. The answer is "${esc(q.choices[q.answer])}".<small>${esc(q.explain)}</small>`; $('#qGo').hidden=false; $('#qGo').onclick=()=>finishQ(false); $('#qGo').focus(); }
      }); box.appendChild(b); });
    $('#qSay').onclick=()=>speak(q);
    if(S.autoRead) speak(q);
  });
}
function finishQ(ok){ if(!qOpen) return; qOpen=false; $('#qcard').hidden=true; try{speechSynthesis.cancel();}catch(e){} const r=qResolve; qResolve=null; save(); if(r) r(ok); }
function speak(q){ try{ speechSynthesis.cancel(); const txt=(q.say||q.text.replace(/<[^>]+>/g,' ')).replace(/×/g,' times ').replace(/÷/g,' divided by ').replace(/−/g,' minus ').replace(/√/g,'square root of ').replace(/²/g,' squared').replace(/³/g,' cubed');
  const u=new SpeechSynthesisUtterance(txt+'. '+q.choices.map((c,i)=>`${i+1}: ${c}`).join('. ')); u.rate=.95; speechSynthesis.speak(u);}catch(e){ toast('Read aloud is not available here.'); } }

/* ===================== BATTLE ===================== */
let B=null;
function makeFoe(chId,boss){
  const R=CH[chId]; const base=18+chId*10;
  if(boss){ const hp=Math.round(base*3.2+chId*12); return {name:R.boss.name,boss:R.boss,c:R.boss.c,hp,max:hp,atk:4+chId*2.6,marches:R.boss.marches?0:null}; }
  const hp=base+rand(0,chId*3); return {name:R.foe.name,c:R.foe.c,hp,max:hp,atk:3+chId*2.2};
}
function startBattle(foeEnt,boss){
  if(mode==='battle') return; ac();
  const chId=M.id; mode='battle'; P.path=[]; P.pend=null; keys.up=keys.down=keys.left=keys.right=false;
  const R=CH[chId]; let foes;
  if(boss) foes=[makeFoe(chId,true)];
  else { let n=1; if(R.foeMax>=2&&Math.random()<.45) n=2; if(R.foeMax>=3&&Math.random()<.25) n=3; foes=Array.from({length:n},()=>makeFoe(chId,false)); }
  B={ch:chId,boss,foes,ent:foeEnt,shield:0,compShield:0,streak:0,target:0,busy:false,t:0};
  const bt=$('#battle'); bt.style.setProperty('--bsky',R.night?'#1b2450':R.th.sky); bt.style.setProperty('--bground',R.th.g); bt.style.setProperty('--bground2',R.th.g2);
  $('#bWho').textContent=boss?R.boss.name:(foes.length>1?`${foes.length} ${R.foe.name}s appear!`:`A ${R.foe.name} appears!`);
  const pc=$('#bPC'), sz=battleSize(); pc.width=sz.pw*dpr; pc.height=sz.ph*dpr; pc.style.width=sz.pw+'px'; pc.style.height=sz.ph+'px';
  $('#bPName').textContent=S.name; const comp=COMPS[S.comp]; $('#bCompE').textContent=comp?comp.e:''; $('#bCompE').style.fontSize=(sz.pw*.36)+'px';
  const fz=$('#bFoes'); fz.innerHTML='';
  foes.forEach((f,i)=>{ const u=document.createElement('div'); u.className='unit foe'+(i===0?' target':''); u.dataset.i=i;
    const fs=boss?sz.bs:sz.fs; u.innerHTML=`<div class="fh"><div>${esc(f.name)}</div><div class="bar hp"><i style="width:100%"></i></div></div><canvas width="${fs*dpr}" height="${fs*dpr}" style="width:${fs}px;height:${fs}px"></canvas>`;
    u.addEventListener('click',()=>{ if(f.hp>0){ B.target=i; [...fz.children].forEach(c=>c.classList.toggle('target',c===u)); } }); fz.appendChild(u); f.el=u; f.cv=u.querySelector('canvas'); f.fs=fs; });
  $('#battle').hidden=false; $('#act').hidden=true; $('#track').hidden=true; $('#hud').hidden=true; $('#dpad').hidden=true; flash();
  if(boss&&R.boss.marches) msg(`March around the walls! Each right answer is one lap. ${R.boss.marches} laps to go.`);
  else msg(boss?'Choose a power. Answer correctly to make it work!':'Choose a power, then answer the question!');
  updBattle(); battleLoop();
}
function battleSize(){ const w=innerWidth, h=innerHeight; const k=clamp(Math.min(w/900,h/700),.55,1.1); return {pw:Math.round(120*k),ph:Math.round(150*k),fs:Math.round(120*k),bs:Math.round(220*k)}; }
function msg(t){ $('#bMsg').textContent=t; }
function renderBattle(t){
  ctx.setTransform(dpr,0,0,dpr,0,0); ctx.fillStyle='#0e1534'; ctx.fillRect(0,0,cw,ch);
  if(!B) return;
  const pc=$('#bPC'), c=pc.getContext('2d'); c.setTransform(dpr,0,0,dpr,0,0); c.clearRect(0,0,pc.width,pc.height); const sz=battleSize();
  drawPerson(c,sz.pw/2,sz.ph*.97,sz.ph*.82,S.look,playerOpts({dir:'right',bob:Math.abs(Math.sin(t*2))*2}));
  B.foes.forEach(f=>{ if(!f.cv) return; const fc=f.cv.getContext('2d'); fc.setTransform(dpr,0,0,dpr,0,0); fc.clearRect(0,0,f.fs,f.fs);
    if(f.boss) drawBoss(fc,f.fs/2,f.fs*.45,f.fs*.3,f.boss,t,{marches:f.marches||0}); else drawGloom(fc,f.fs/2,f.fs*.45,f.fs*.3,f.c,t+f.max); });
}
function updBattle(){ const mh=maxHP(); $('#bHp').style.width=(S.hp/mh*100)+'%'; $('#bHpT').textContent=`${Math.ceil(S.hp)} / ${mh}`;
  $('#bStreak').textContent=B.streak>=3?`✦ Spirit Streak ×${B.streak}`:B.streak?`Streak ${B.streak}`:'';
  $('#bShield').textContent=B.shield?`Hope Shield (${B.shield})`:'';
  B.foes.forEach(f=>{ f.el.querySelector('.bar i').style.width=Math.max(0,f.hp/f.max*100)+'%'; if(f.hp<=0) f.el.classList.add('dead'); });
  if(B.foes[B.target]&&B.foes[B.target].hp<=0){ const i=B.foes.findIndex(f=>f.hp>0); if(i>=0){ B.target=i; B.foes.forEach((f,j)=>f.el.classList.toggle('target',j===i)); } }
}
function waitAction(){
  return new Promise(res=>{
    const box=$('#bSpells'); box.innerHTML='';
    SPELLS.forEach(sp=>{ const b=document.createElement('button'); b.className='spell'; const locked=S.level<sp.lv;
      b.innerHTML=`<b>${sp.name}</b><small>${locked?`Unlocks at level ${sp.lv}`:sp.desc}</small>`; b.disabled=locked; if(locked) b.style.opacity=.45;
      b.onclick=()=>res({t:'spell',id:sp.id}); box.appendChild(b); });
    const inv=Object.entries(S.items).filter(([k,n])=>n>0);
    const bb=document.createElement('button'); bb.className='spell alt'; bb.innerHTML=`<b>Food</b><small>${inv.length?inv.map(([k,n])=>ITEMS[k].e+'×'+n).join(' '):'Bag is empty'}</small>`; bb.disabled=!inv.length;
    bb.onclick=()=>{ box.innerHTML=''; inv.forEach(([k,n])=>{ const b=document.createElement('button'); b.className='spell'; b.innerHTML=`<b>${ITEMS[k].e} ${ITEMS[k].name} ×${n}</b><small>${ITEMS[k].desc}</small>`; b.onclick=()=>res({t:'item',id:k}); box.appendChild(b); });
      const back=document.createElement('button'); back.className='spell alt'; back.innerHTML='<b>Back</b><small>Choose a power</small>'; back.onclick=()=>{ waitAction().then(res); }; box.appendChild(back); };
    box.appendChild(bb);
    if(!B.boss){ const fl=document.createElement('button'); fl.className='spell alt'; fl.innerHTML='<b>Run away</b><small>Leave this battle</small>'; fl.onclick=()=>res({t:'flee'}); box.appendChild(fl); }
  });
}
function floatText(el,text,cls){ const r=el.getBoundingClientRect(), g=$('#game').getBoundingClientRect(); const d=document.createElement('div'); d.className='float '+cls; d.textContent=text; d.style.left=(r.left-g.left+r.width/2-20)+'px'; d.style.top=(r.top-g.top+r.height*.25)+'px'; $('#game').appendChild(d); setTimeout(()=>d.remove(),1100); }
async function bolt(fromEl,toEl,color){ const a=fromEl.getBoundingClientRect(), b=toEl.getBoundingClientRect(), g=$('#game').getBoundingClientRect(); const d=document.createElement('div'); d.className='bolt'; if(color) d.style.background=`radial-gradient(#fff,${color} 40%,rgba(0,0,0,0) 70%)`; $('#game').appendChild(d);
  const x0=a.left-g.left+a.width*.6, y0=a.top-g.top+a.height*.4, x1=b.left-g.left+b.width/2-13, y1=b.top-g.top+b.height*.55;
  try{ await d.animate([{transform:`translate(${x0}px,${y0}px) scale(.5)`},{transform:`translate(${(x0+x1)/2}px,${Math.min(y0,y1)-60}px) scale(1.2)`},{transform:`translate(${x1}px,${y1}px) scale(1)`}],{duration:420,easing:'ease-in'}).finished; }catch(e){ await sleep(420); }
  d.remove(); }
function anim(el,cls){ el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(()=>el.classList.remove(cls),450); }
async function hitFoe(f,dmg){ if(f.hp<=0) return; if(f.marches!==null&&f.marches!==undefined){ f.marches++; dmg=Math.ceil(f.max/f.boss.marches); SFX.trumpet(); floatText(f.el,`Lap ${f.marches} of ${f.boss.marches}!`,'info'); }
  f.hp=Math.max(0,f.hp-dmg); anim(f.el,'shake'); SFX.hit(); floatText(f.el,'−'+dmg,'dmg'); updBattle(); await sleep(350); }
async function battleLoop(){
  while(true){
    const act=await waitAction(); $('#bSpells').innerHTML=''; const pl=$('#bPlayer');
    if(act.t==='flee'){ msg('You slipped away safely.'); await sleep(600); endBattle('flee'); return; }
    if(act.t==='item'){ const it=ITEMS[act.id]; S.items[act.id]--; const h=Math.min(maxHP()-S.hp,it.heal); S.hp+=h; SFX.heal(); floatText(pl,'+'+Math.round(h),'heal'); msg(`You ate the ${it.name}.`); updBattle(); await sleep(600); }
    else {
      const sp=SPELLS.find(s=>s.id===act.id); const q=makeQuestion(B.ch);
      msg(`${sp.name}: answer to power it up!`);
      const ok=await ask(q);
      if(ok){ B.streak++; const mult=(B.streak>=3?1.5:1)*(.9+Math.random()*.2); const alive=B.foes.filter(f=>f.hp>0);
        if(B.streak===3) toast('✦ Spirit Streak! Attacks are stronger!');
        if(sp.id==='faith'||sp.id==='courage'){ const f=B.foes[B.target].hp>0?B.foes[B.target]:alive[0]; anim(pl,'lunge-r'); await bolt(pl,f.el); await hitFoe(f,Math.round(atkP()*(sp.id==='courage'?1.7:1)*mult)); msg(`${sp.name} hits!`); }
        else if(sp.id==='wisdom'){ anim(pl,'lunge-r'); for(const f of alive){ bolt(pl,f.el,'#9fd0ff'); } await sleep(420); for(const f of alive) await hitFoe(f,Math.round(atkP()*.85*mult)); msg('Wisdom Wave washes over every foe!'); }
        else if(sp.id==='pray'){ const h=Math.min(maxHP()-S.hp,Math.round(maxHP()*.35*(B.streak>=3?1.3:1))); S.hp+=h; SFX.heal(); floatText(pl,'+'+h,'heal'); msg('Your prayer brings fresh strength.'); updBattle(); await sleep(500); }
        else if(sp.id==='hope'){ B.shield=2; SFX.heal(); floatText(pl,'Shielded!','info'); msg('Hope surrounds you like a shield.'); updBattle(); await sleep(500); }
      } else { B.streak=0; msg(`${sp.name} fizzled... but keep trying!`); updBattle(); await sleep(400); }
    }
    if(B.foes.every(f=>f.hp<=0)){ await sleep(400); return victory(); }
    const comp=COMPS[S.comp], cs=S.comps[S.comp];
    if(comp&&cs){ const ce=$('#bComp'); const pw=Math.round(comp.p*(1+(cs.lvl-1)*.28));
      if(comp.type==='attack'||comp.type==='all'){ const ts=comp.type==='all'?B.foes.filter(f=>f.hp>0):[B.foes[B.target].hp>0?B.foes[B.target]:B.foes.find(f=>f.hp>0)];
        anim(ce,'lunge-r'); for(const f of ts){ if(f.marches!=null){ floatText(f.el,'The walls are too strong!','info'); continue; } f.hp=Math.max(0,f.hp-pw); floatText(f.el,'−'+pw,'dmg'); anim(f.el,'shake'); } SFX.hit(); updBattle(); await sleep(450); }
      else if(comp.type==='heal'&&S.hp<maxHP()){ const h=Math.min(maxHP()-S.hp,pw); S.hp+=h; floatText(pl,'+'+h,'heal'); updBattle(); await sleep(400); }
      else if(comp.type==='shield'){ B.compShield=1; floatText(ce,'Guarding!','info'); await sleep(350); } }
    if(B.foes.every(f=>f.hp<=0)){ await sleep(400); return victory(); }
    for(const f of B.foes.filter(f=>f.hp>0)){
      anim(f.el,'lunge-l'); await sleep(200);
      let d=f.atk*(.8+Math.random()*.4)-defP(); if(f.marches!=null) d*=.6; if(B.shield>0) d*=.25; if(B.compShield){ d*=1-COMPS.camel.p/100; B.compShield=0; }
      d=Math.max(1,Math.round(d)); S.hp=Math.max(0,S.hp-d); anim(pl,'shake'); SFX.hurt(); floatText(pl,'−'+d,'hurt'); updBattle(); await sleep(380);
      if(S.hp<=0) break; }
    if(B.shield>0){ B.shield--; updBattle(); }
    if(S.hp<=0){ await sleep(400); return defeat(); }
    msg('Your turn! Choose a power.');
  }
}
function victory(){
  const chId=B.ch, R=CH[chId], n=B.foes.length; let xp=0, coins=0;
  if(B.boss){ xp=(14+chId*7)*5; coins=(6+chId*4)*5; } else { xp=n*(10+chId*6); coins=n*(5+chId*3); }
  S.coins+=coins; const lv=gainXP(xp); const cs=S.comps[S.comp]; let compLv=false;
  if(cs){ cs.xp+=Math.round(xp/2); while(cs.xp>=40+cs.lvl*30){ cs.xp-=40+cs.lvl*30; cs.lvl++; compLv=true; } }
  let drop=null; if(!B.boss&&Math.random()<.22){ drop=pick(['bread','bread','fish']); addItem(drop,1); }
  const c=S.chs[chId]; let note='';
  if(B.boss){ c.stage=3; M.ents=M.ents.filter(e=>e.kind!=='boss'); note=`The ${R.boss.name} is defeated! Return to ${R.guide.name}.`; if(R.lm.k==='walls'||R.lm.k==='tomb'||R.lm.k==='stable') {} }
  else if(c.stage===1){ c.kills+=n; if(c.kills>=R.kills){ c.kills=R.kills; c.stage=2; addBoss(); note=`The ${R.boss.name} has appeared at the ${R.boss.where}!`; } }
  if(B.ent) M.foes=M.foes.filter(f=>f!==B.ent);
  SFX.win(); save();
  const lines=[`+${xp} XP`,`+${coins} shekels`]; if(drop) lines.push(`Found ${ITEMS[drop].e} ${ITEMS[drop].name}`); if(lv) lines.push(`Level up! You are now level ${S.level}.`); if(compLv) lines.push(`${COMPS[S.comp].name} grew to level ${cs.lvl}!`);
  const newSp=SPELLS.find(s=>s.lv===S.level&&lv); if(newSp) lines.push(`New power learned: ${newSp.name}!`);
  resultPanel(B.boss?'Victory!':'Victory!',lines,note);
}
function gainXP(x){ S.xp+=x; let up=false; while(S.xp>=xpNeed()){ S.xp-=xpNeed(); S.level++; up=true; } if(up){ S.hp=maxHP(); SFX.lvl(); } return up; }
function defeat(){
  S.hp=maxHP(); S.coins=Math.max(0,S.coins-Math.min(10,Math.floor(S.coins*.1)));
  resultPanel('Knocked down...',['You are carried back to safety and fully healed.','"It is of the LORD\'s mercies that we are not consumed... they are new every morning." — Lamentations 3:22-23'],'Try again — every question you miss helps you learn!',true);
}
function resultPanel(title,lines,note,lost){
  const box=$('#bSpells'); box.innerHTML='';
  msg(title+(note?' '+note:''));
  const d=document.createElement('div'); d.style.gridColumn='1/-1'; d.innerHTML=`<div style="font-family:var(--f-display);font-size:1.5rem;color:var(--gold-soft)">${esc(title)}</div>${lines.map(l=>`<div style="font-weight:800">${esc(l)}</div>`).join('')}${note?`<div style="margin-top:6px;color:var(--sky);font-weight:800">${esc(note)}</div>`:''}`;
  const b=document.createElement('button'); b.className='btn gold'; b.textContent='Continue'; b.style.gridColumn='1/-1'; b.onclick=()=>endBattle(lost?'lose':'win');
  box.appendChild(d); box.appendChild(b); $('#bMsg').textContent=''; setTimeout(()=>b.focus(),50);
}
function endBattle(how){
  $('#battle').hidden=true; mode='world'; $('#hud').hidden=false; if(isTouch) $('#dpad').hidden=false;
  if(how==='lose'){ enterMap(M.id); }
  else if(how==='flee'){ P.inv=2.5; }
  else { P.inv=1.5; }
  B=null; actEnt=null; save(); updHUD();
}

/* ===================== MENUS ===================== */
function coinHTML(n){ return `<span class="price"><span class="coin"></span>${n}</span>`; }
function openShop(){
  const render=b=>{ b.innerHTML=`<div class="sect">Food for the road</div>`+Object.entries(ITEMS).map(([k,it])=>`<div class="row"><div class="big">${it.e}</div><div class="grow"><h4>${it.name} <span class="tag">have ${S.items[k]||0}</span></h4><p>${it.desc}</p></div>${coinHTML(it.price)}<button class="btn sm" data-buy="${k}" ${S.coins<it.price?'disabled':''}>Buy</button></div>`).join('')
    +`<div class="sect">Robe dyes</div>`+Object.entries(DYES).map(([k,d])=>{ const own=S.dyes.includes(k); return `<div class="row"><div class="big"><span style="display:inline-block;width:30px;height:30px;border-radius:50%;background:${d.c==='rainbow'?'conic-gradient(#d9443a,#ef9a2d,#ecd23b,#4fae4f,#3f7fd1,#7e4fb3,#d9443a)':d.c};border:2px solid var(--gold)"></span></div><div class="grow"><h4>${d.name}</h4><p>${esc(d.note)}</p></div>${own?'<span class="tag ok">Owned</span>':coinHTML(d.price)+`<button class="btn sm" data-dye="${k}" ${S.coins<d.price?'disabled':''}>Buy</button>`}</div>`; }).join('')
    +`<p style="color:var(--muted);font-size:.85rem">You have ${S.coins} shekels. Wear dyes from your Bag.</p>`;
    b.querySelectorAll('[data-buy]').forEach(x=>x.onclick=()=>{ const it=ITEMS[x.dataset.buy]; if(S.coins>=it.price){ S.coins-=it.price; addItem(x.dataset.buy,1); SFX.coin(); save(); updHUD(); render(b);} });
    b.querySelectorAll('[data-dye]').forEach(x=>x.onclick=()=>{ const d=DYES[x.dataset.dye]; if(S.coins>=d.price){ S.coins-=d.price; S.dyes.push(x.dataset.dye); S.look.robe=d.c; SFX.coin(); toast(`You're wearing ${d.name}!`); save(); updHUD(); render(b);} }); };
  openModal("Lydia's Goods",'',render);
}
function openStable(){
  const render=b=>{ b.innerHTML=`<div class="sect">Your animal friends</div>`+Object.entries(S.comps).map(([k,v])=>{ const c=COMPS[k]; return `<div class="row"><div class="big">${c.e}</div><div class="grow"><h4>${c.name} <span class="tag">Lv ${v.lvl}</span> ${S.comp===k?'<span class="tag ok">With you</span>':''}</h4><p>${esc(c.desc)}</p></div>${S.comp===k?'':`<button class="btn sm" data-pick="${k}">Bring along</button>`}</div>`; }).join('')
    +`<div class="sect">Animals needing a home</div>`+Object.entries(COMPS).filter(([k,c])=>c.price&&!S.comps[k]).map(([k,c])=>`<div class="row"><div class="big">${c.e}</div><div class="grow"><h4>${c.name}</h4><p>${esc(c.desc)}</p></div>${coinHTML(c.price)}<button class="btn sm" data-adopt="${k}" ${S.coins<c.price?'disabled':''}>Adopt</button></div>`).join('')
    +`<p style="color:var(--muted);font-size:.85rem">More friends join you as you complete each gate.</p>`;
    b.querySelectorAll('[data-pick]').forEach(x=>x.onclick=()=>{ S.comp=x.dataset.pick; save(); render(b); });
    b.querySelectorAll('[data-adopt]').forEach(x=>x.onclick=()=>{ const k=x.dataset.adopt, c=COMPS[k]; if(S.coins>=c.price){ S.coins-=c.price; S.comps[k]={lvl:Math.max(1,S.level-2),xp:0}; S.comp=k; SFX.coin(); toast(`${c.e} ${c.name} joined you!`); save(); updHUD(); render(b);} }); };
  openModal('Animal Friends','',render);
}
$('#bFriends').onclick=()=>{ ac(); if(!modalOpen&&!dialogOpen) openStable(); };
function openScribe(){
  openModal("Ezra's Scrolls",`<div class="sect">Practice Scroll</div><p>Answer 10 questions. Earn 3 shekels for every right answer.</p>
    <div class="grid2" id="pCats">${['mixed','math','bible','verse','words','logic'].map(k=>`<button class="chip" data-pc="${k}"><h4>${k==='mixed'?'Mixed':CATS[k]}</h4><p>${k==='mixed'?'A bit of everything':'Only '+CATS[k].toLowerCase()+' questions'}</p></button>`).join('')}</div>
    <div class="sect">Verse library</div>${verseLib()}`,b=>{ b.querySelectorAll('[data-pc]').forEach(x=>x.onclick=()=>practice(x.dataset.pc)); });
}
function verseLib(){ const vs=Object.keys(CH).filter(i=>S.chs[i].stage>=4).map(i=>CH[i].verse); if(!vs.length) return '<p style="color:var(--muted)">Complete a gate to unlock its memory verse.</p>';
  return vs.map(v=>`<p class="verse">${esc(v.t)}<cite>${esc(v.r)} (KJV)</cite></p>`).join(''); }
async function practice(cat){
  closeModal(); let right=0; const chId=0;
  for(let i=0;i<10;i++){ const q=makeQuestion(chId,cat==='mixed'?null:cat); $('#qCat').textContent=''; const ok=await ask(q); if(ok){ right++; S.coins+=3; } }
  updHUD(); save();
  openModal('Practice complete',`<p style="font-size:1.2rem;font-weight:800">${right} out of 10 correct!</p><p>You earned ${coinHTML(right*3)} shekels.</p><p class="verse">Study to shew thyself approved unto God.<cite>2 Timothy 2:15</cite></p><button class="btn gold" id="pAgain">Practice again</button>`,b=>{ b.querySelector('#pAgain').onclick=()=>practice(cat); });
}
$('#bBag').onclick=()=>{ ac(); if(modalOpen||dialogOpen) return;
  const render=b=>{ const inv=Object.entries(S.items).filter(([k,n])=>n>0);
    b.innerHTML=`<div class="sect">Food</div>`+(inv.length?inv.map(([k,n])=>`<div class="row"><div class="big">${ITEMS[k].e}</div><div class="grow"><h4>${ITEMS[k].name} ×${n}</h4><p>${ITEMS[k].desc}</p></div><button class="btn sm" data-eat="${k}" ${S.hp>=maxHP()?'disabled':''}>Eat</button></div>`).join(''):'<p style="color:var(--muted)">Your bag is empty. Lydia sells food in Pilgrim\'s Rest.</p>')
    +`<div class="sect">Armor of God</div><p style="margin:0 0 6px;color:var(--muted);font-size:.85rem">"Put on the whole armour of God" — Ephesians 6:11. Earn each piece by finishing gates.</p>`
    +Object.entries(ARMOR).map(([k,a])=>{ const own=S.armor.includes(k); const st=[a.def?`+${a.def} defense`:'',a.hp?`+${a.hp} health`:'',a.atk?`+${a.atk} attack`:''].filter(Boolean).join(', '); return `<div class="row" style="opacity:${own?1:.45}"><div class="big">${own?'🛡️':'🔒'}</div><div class="grow"><h4>${a.name}</h4><p>${st} · ${a.ref}</p></div>${own?'<span class="tag ok">Worn</span>':''}</div>`; }).join('')
    +`<div class="sect">Robes</div><div class="sw" id="wRobes">${[...ROBES.map(c=>({c,n:'Traveler'})),...S.dyes.map(k=>({c:DYES[k].c,n:DYES[k].name}))].map(r=>`<button title="${esc(r.n)}" data-robe="${r.c}" class="${S.look.robe===r.c?'on':''}" style="background:${r.c==='rainbow'?'conic-gradient(#d9443a,#ef9a2d,#ecd23b,#4fae4f,#3f7fd1,#7e4fb3,#d9443a)':r.c}"></button>`).join('')}</div>`
    +(S.cos.includes('crown')?`<div class="row"><div class="big">👑</div><div class="grow"><h4>Crown of Life</h4><p>James 1:12</p></div><button class="btn sm" id="wCrown">${S.flags.wearCrown===false?'Wear':'Take off'}</button></div>`:'');
    b.querySelectorAll('[data-eat]').forEach(x=>x.onclick=()=>{ const k=x.dataset.eat; S.items[k]--; S.hp=Math.min(maxHP(),S.hp+ITEMS[k].heal); SFX.heal(); save(); updHUD(); render(b); });
    b.querySelectorAll('[data-robe]').forEach(x=>x.onclick=()=>{ S.look.robe=x.dataset.robe; save(); render(b); });
    const cr=b.querySelector('#wCrown'); if(cr) cr.onclick=()=>{ S.flags.wearCrown=S.flags.wearCrown===false; save(); render(b); }; };
  openModal('Your Bag','',render); };
$('#bQuest').onclick=()=>{ ac(); if(modalOpen||dialogOpen) return;
  let h=''; for(let i=1;i<=Math.min(10,S.unlocked);i++){ const c=S.chs[i], R=CH[i];
    const main=c.stage>=4?'<span class="tag ok">Complete</span>':c.stage===0?`Talk to ${R.guide.name}`:c.stage===1?`Defeat ${R.foe.name}s (${c.kills}/${R.kills})`:c.stage===2?`Face the ${R.boss.name}`:`Return to ${R.guide.name}`;
    const side=c.side===2?'<span class="tag ok">Done</span>':c.side===1?`${R.side.what} (${c.got.length}/${R.side.items.length})`:`Talk to ${R.side.name}`;
    h+=`<div class="row"><div class="big" style="font-family:var(--f-display);color:var(--gold)">${i}</div><div class="grow"><h4>${R.name} <span class="tag">${R.book}</span></h4><p>Main: ${main}</p><p>Helper quest: ${side}</p></div></div>`; }
  openModal('Quest Scroll',h+`<div class="sect">Memory verses</div>${verseLib()}`); };
$('#bMap').onclick=()=>{ ac(); if(modalOpen||dialogOpen) return;
  const frags=Array.from({length:10},(_,i)=>`<div class="frag ${S.chs[i+1].stage>=4?'got':''}">${i+1}</div>`).join('');
  let h=`<p style="margin-top:0">Scroll pieces restored:</p><div class="fragrow">${frags}</div><div class="sect">Travel</div><div class="row"><div class="big">🏛️</div><div class="grow"><h4>Pilgrim's Rest</h4><p>Shop, stable, scribe and the Gates</p></div><button class="btn sm" data-go="hub">Go</button></div>`;
  for(let i=1;i<=10;i++){ const open=i<=S.unlocked; h+=`<div class="row" style="opacity:${open?1:.45}"><div class="big" style="font-family:var(--f-display);color:var(--gold)">${i}</div><div class="grow"><h4>${CH[i].name}</h4><p>${CH[i].book}</p></div>${open?`<button class="btn sm" data-go="${i}">Go</button>`:'<span class="tag">Locked</span>'}</div>`; }
  openModal('World Scroll',h,b=>b.querySelectorAll('[data-go]').forEach(x=>x.onclick=()=>{ const g=x.dataset.go; closeModal(); flash(); if(g==='hub') enterMap('hub'); else enterMap(+g); })); };
const GRADES={2:'Ages 7–8',3:'Ages 8–9',4:'Ages 9–10',5:'Ages 10–11',6:'Ages 11–12',7:'Ages 12–13',8:'Ages 13–14',9:'Ages 14–15',10:'Ages 15+'};
$('#bSet').onclick=()=>{ ac(); if(modalOpen||dialogOpen) return;
  const st=Object.keys(CATS).map(k=>{ const s=S.stats[k]||{r:0,t:0}; return `<span>${CATS[k]}</span><span>${s.r}/${s.t}</span><span>${s.t?Math.round(s.r/s.t*100)+'%':'—'}</span>`; }).join('');
  openModal('Settings',`<div class="sect">For grown-ups</div>
    <label class="f" for="sGrade">Challenge level</label><select id="sGrade">${Object.entries(GRADES).map(([g,l])=>`<option value="${g}" ${+g===S.grade?'selected':''}>${l} (grade ${g})</option>`).join('')}</select>
    <p style="font-size:.82rem;color:var(--muted)">The game also adjusts itself: a long run of right answers makes questions a little harder, and a run of misses makes them easier.</p>
    <label class="f">Question mix</label>${Object.keys(CATS).map(k=>`<div class="mixrow"><span>${CATS[k]}</span><input type="range" min="0" max="5" id="mx_${k}" value="${S.mix[k]}"><b id="mv_${k}">${S.mix[k]}</b></div>`).join('')}
    <div class="sect">Sound &amp; reading</div>
    <div class="row"><div class="grow"><h4>Sound effects</h4></div><button class="btn sm" id="sSnd">${S.sound?'On':'Off'}</button></div>
    <div class="row"><div class="grow"><h4>Read every question aloud</h4><p>Great for younger readers</p></div><button class="btn sm" id="sRead">${S.autoRead?'On':'Off'}</button></div>
    <div class="sect">Progress</div><div class="stat"><b>Subject</b><b>Right</b><b>Score</b>${st}</div>
    <div class="sect">Move your save</div><p style="font-size:.85rem;color:var(--muted);margin-top:0">Progress saves in this browser. To play on another device, copy this code and paste it there.</p>
    <textarea id="sCode" readonly></textarea><div style="display:flex;gap:8px;margin:6px 0 10px;flex-wrap:wrap"><button class="btn sm" id="sCopy">Copy code</button></div>
    <textarea id="sIn" placeholder="Paste a save code here"></textarea><div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap"><button class="btn sm" id="sLoad">Load code</button><span id="sLoadMsg" style="font-weight:800"></span></div>
    <div class="sect">Start over</div><button class="btn sm ghost" id="sReset">Erase this journey</button><div id="sResetC"></div>`,b=>{
      b.querySelector('#sGrade').onchange=e=>{ S.grade=+e.target.value; S.shift={math:0,bible:0,verse:0,words:0,logic:0}; save(); };
      Object.keys(CATS).forEach(k=>{ const r=b.querySelector('#mx_'+k); r.oninput=()=>{ S.mix[k]=+r.value; b.querySelector('#mv_'+k).textContent=r.value; if(Object.values(S.mix).every(v=>v===0)){ S.mix.bible=1; } save(); }; });
      b.querySelector('#sSnd').onclick=e=>{ S.sound=!S.sound; e.target.textContent=S.sound?'On':'Off'; save(); };
      b.querySelector('#sRead').onclick=e=>{ S.autoRead=!S.autoRead; e.target.textContent=S.autoRead?'On':'Off'; save(); };
      const code=b.querySelector('#sCode'); try{ code.value=btoa(unescape(encodeURIComponent(JSON.stringify(S)))); }catch(e){}
      b.querySelector('#sCopy').onclick=()=>{ code.select(); try{ navigator.clipboard.writeText(code.value).then(()=>toast('Save code copied'),()=>toast('Select the code and copy it')); }catch(e){ toast('Select the code and copy it'); } };
      b.querySelector('#sLoad').onclick=()=>{ try{ const o=JSON.parse(decodeURIComponent(escape(atob(b.querySelector('#sIn').value.trim())))); if(!o||o.v!==1) throw 0; S=o; save(); closeModal(); enterMap(S.map==='hub'?'hub':+S.map,{x:S.px,y:S.py}); toast('Journey loaded!'); }catch(e){ b.querySelector('#sLoadMsg').textContent='That code did not work. Check that you copied all of it.'; } };
      b.querySelector('#sReset').onclick=()=>{ b.querySelector('#sResetC').innerHTML='<p style="font-weight:800">This erases all progress in this browser. Are you sure?</p><button class="btn sm" id="sYes" style="border-color:var(--rose)">Yes, erase it</button> <button class="btn sm ghost" id="sNo">Keep my journey</button>';
        b.querySelector('#sYes').onclick=()=>{ try{localStorage.removeItem(KEY);}catch(e){} location.reload(); }; b.querySelector('#sNo').onclick=()=>{ b.querySelector('#sResetC').innerHTML=''; }; };
    }); };

/* ===================== TITLE & CREATION ===================== */
const isTouch=('ontouchstart' in window)||navigator.maxTouchPoints>0;
const draft={name:'',look:{skin:SK[1],hair:HAIRS[1],robe:ROBES[0],sash:'#e9d8a6',hs:0},grade:5};
function swatches(id,arr,key){ const el=$(id); el.innerHTML=''; arr.forEach(c=>{ const b=document.createElement('button'); b.style.background=c; b.setAttribute('aria-label',c); if(draft.look[key]===c) b.className='on'; b.onclick=()=>{ draft.look[key]=c; swatches(id,arr,key); drawPrev(); }; el.appendChild(b); }); }
function txtSw(id,opts,get,set){ const el=$(id); el.innerHTML=''; opts.forEach(([v,l])=>{ const b=document.createElement('button'); b.textContent=l; if(get()===v) b.className='on'; b.onclick=()=>{ set(v); txtSw(id,opts,get,set); drawPrev(); }; el.appendChild(b); }); }
function drawPrev(){ const c=$('#cPrev').getContext('2d'); c.clearRect(0,0,400,480); drawPerson(c,200,450,420,draft.look,{dir:'down'}); }
function showCreate(){ $('#tMain').hidden=true; $('#create').hidden=false;
  swatches('#cSkin',SK,'skin'); swatches('#cHair',HAIRS,'hair'); swatches('#cRobe',ROBES,'robe');
  txtSw('#cHs',[[0,'Short'],[1,'Long'],[2,'Curly']],()=>draft.look.hs,v=>draft.look.hs=v);
  txtSw('#cAge',[[3,'8–9'],[5,'10–11'],[7,'12–13'],[9,'14–15']],()=>draft.grade,v=>draft.grade=v);
  drawPrev(); setTimeout(()=>$('#cName').focus(),50); }
$('#tNew').onclick=()=>{ ac(); showCreate(); };
$('#cBack').onclick=()=>{ $('#create').hidden=true; $('#tMain').hidden=false; };
$('#cGo').onclick=()=>{ ac(); const nm=($('#cName').value||'').trim().slice(0,14)||'Pilgrim';
  S=newState(nm,Object.assign({},draft.look),draft.grade); $('#title').hidden=true; mode='world';
  enterMap('hub'); showWorldUI();
  talk(STORY_INTRO.map(t=>L(NARR,t)).concat([L(NARR,`Welcome, ${nm}. Your journey begins in Pilgrim's Rest. Find Simeon by the fountain.`)]),()=>save()); };
$('#tCont').onclick=()=>{ ac(); const s=loadSave(); if(!s) return; S=s; S.hp=Math.max(1,S.hp); $('#title').hidden=true; mode='world';
  const id=S.map==='hub'?'hub':+S.map; enterMap(id,{x:S.px,y:S.py}); if(!walkable(P.x,P.y)) enterMap(id); showWorldUI(); toast(`Welcome back, ${S.name}!`); };
function showWorldUI(){ $('#hud').hidden=false; if(isTouch) $('#dpad').hidden=false; updHUD(); }

/* ===================== BOOT ===================== */
resize();
if(loadSave()) $('#tCont').hidden=false;
requestAnimationFrame(loop);
window.__sol={get S(){return S;},get M(){return M;},get P(){return P;},enterMap,startBattle,makeQuestion,genMath,genBible,genVerse,genWords,genLogic,get mode(){return mode;}};
})();
