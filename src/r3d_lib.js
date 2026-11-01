/* ===================== 3D LIBRARY (runs inside R3 scope; THREE r128) ===================== */
const OK3=(()=>{ if(!window.THREE) return false; try{ const c=document.createElement('canvas'); return !!(c.getContext('webgl')||c.getContext('experimental-webgl')); }catch(e){ return false; } })();
if(!OK3) return {ok:false};
const TH=window.THREE, PI=Math.PI, TAU=PI*2;
const TL=1.3; // one map tile in 3D units
const c3=h=>new TH.Color(h).convertSRGBToLinear();
const cl=(v,a,b)=>Math.max(a,Math.min(b,v));
const lp=(a,b,k)=>a+(b-a)*k;
const dmp=(a,b,l,dt)=>lp(a,b,1-Math.exp(-l*dt));
const angTo=(a,b)=>{ let d=b-a; while(d>PI) d-=TAU; while(d<-PI) d+=TAU; return d; };
const MATS=new Map(), GEOS=new Map();
function mat(hex,o={}){ const key=hex+'|'+JSON.stringify(o); if(!o.unique&&MATS.has(key)) return MATS.get(key);
  const {emissive,unique,map,...rest}=o; const m=new TH.MeshStandardMaterial(Object.assign({roughness:.82,metalness:0},rest)); m.color.copy(c3(hex)); if(emissive) m.emissive.copy(c3(emissive)); if(map) m.map=map;
  if(!unique){ m.userData.cached=true; MATS.set(key,m); } return m; }
function basic(hex,o={}){ const key='B'+hex+JSON.stringify(o); if(MATS.has(key)) return MATS.get(key); const m=new TH.MeshBasicMaterial(Object.assign({},o)); m.color.copy(c3(hex)); m.userData.cached=true; MATS.set(key,m); return m; }
function geo(key,fn){ let g=GEOS.get(key); if(!g){ g=fn(); g.userData.cached=true; GEOS.set(key,g); } return g; }
const Gs=(r,w=16,h=12)=>geo(`s${r}_${w}_${h}`,()=>new TH.SphereGeometry(r,w,h));
const Gc=(rt,rb,h,s=12,open=false)=>geo(`c${rt}_${rb}_${h}_${s}_${open}`,()=>new TH.CylinderGeometry(rt,rb,h,s,1,open));
const Gb=(x,y,z)=>geo(`b${x}_${y}_${z}`,()=>new TH.BoxGeometry(x,y,z));
const Gk=(r,h,s=10)=>geo(`k${r}_${h}_${s}`,()=>new TH.ConeGeometry(r,h,s));
const Gt=(R,r,rs=8,ts=24,arc=TAU)=>geo(`t${R}_${r}_${rs}_${ts}_${arc}`,()=>new TH.TorusGeometry(R,r,rs,ts,arc));
const Gi=(r,d=1)=>geo(`i${r}_${d}`,()=>new TH.IcosahedronGeometry(r,d));
function msh(g,m,parent,x=0,y=0,z=0,cast=true){ const o=new TH.Mesh(g,m); o.position.set(x,y,z); o.castShadow=cast; o.receiveShadow=true; if(parent) parent.add(o); return o; }
function ctex(w,h,draw,rep){ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); const t=new TH.CanvasTexture(c); t.encoding=TH.sRGBEncoding; t.anisotropy=4; if(rep){ t.wrapS=t.wrapT=TH.RepeatWrapping; t.repeat.set(rep[0],rep[1]); } return t; }
function hexMul(h,f){ const c=new TH.Color(h); c.multiplyScalar(f); return '#'+c.getHexString(); }
function hexMix(a,b,k){ const c=new TH.Color(a).lerp(new TH.Color(b),k); return '#'+c.getHexString(); }
function rng(seed){ let a=seed|0; return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function bumpy(r,detail,amp,freq){ return geo(`bump${r}_${detail}_${amp}_${freq}`,()=>{ const g=new TH.IcosahedronGeometry(r,detail); const pa=g.attributes.position, v=new TH.Vector3();
  for(let i=0;i<pa.count;i++){ v.fromBufferAttribute(pa,i); v.multiplyScalar(1+amp*Math.sin(v.x*freq)*Math.sin(v.y*freq*1.13)*Math.sin(v.z*freq*.91)); pa.setXYZ(i,v.x,v.y,v.z); } g.computeVertexNormals(); return g; }); }
function lathe(key,pts,seg=20){ return geo('L'+key,()=>new TH.LatheGeometry(pts.map(([x,y])=>new TH.Vector2(x,y)),seg)); }
function emojiTex(e,size=128){ return ctex(size,size,(g,w,h)=>{ g.font=`${Math.round(size*.78)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif`; g.textAlign='center'; g.textBaseline='middle'; g.fillText(e,w/2,h/2+size*.04); }); }
function labelTex(text,o={}){ const fs=o.fs||40, pad=14; const c=document.createElement('canvas'); const g=c.getContext('2d'); g.font=`800 ${fs}px Nunito, "Trebuchet MS", sans-serif`; const w=Math.ceil(g.measureText(text).width)+pad*2, h=fs+pad*1.2; c.width=w; c.height=h;
  const g2=c.getContext('2d'); g2.fillStyle=o.bg||'rgba(14,21,52,.82)'; const r=h/2; g2.beginPath(); g2.moveTo(r,0); g2.lineTo(w-r,0); g2.arc(w-r,r,r,-PI/2,PI/2); g2.lineTo(r,h); g2.arc(r,r,r,PI/2,PI*1.5); g2.fill();
  g2.font=`800 ${fs}px Nunito, "Trebuchet MS", sans-serif`; g2.fillStyle=o.fg||'#f6de98'; g2.textAlign='center'; g2.textBaseline='middle'; g2.fillText(text,w/2,h/2+2); const t=new TH.CanvasTexture(c); t.encoding=TH.sRGBEncoding; return {tex:t,aspect:w/h}; }
function sprite(tex,h,aspect=1){ const s=new TH.Sprite(new TH.SpriteMaterial({map:tex,transparent:true,depthWrite:false})); s.scale.set(h*aspect,h,1); return s; }

/* ---------- shared textures ---------- */
function noiseFill(g,w,h,base,cols,n,sz){ g.fillStyle=base; g.fillRect(0,0,w,h); for(let i=0;i<n;i++){ g.fillStyle=cols[(Math.random()*cols.length)|0]; g.globalAlpha=.25+Math.random()*.35; const s=sz*(.5+Math.random()); g.fillRect(Math.random()*w,Math.random()*h,s,s*.7); } g.globalAlpha=1; }
const TX={};
function tx(k){ if(TX[k]) return TX[k];
  const D={
    plaster:()=>ctex(256,256,(g,w,h)=>noiseFill(g,w,h,'#ece0c6',['#e2d4b6','#f4ead4','#d9c9a8','#efe3cb'],2200,5),[2,2]),
    stone:()=>ctex(256,256,(g,w,h)=>{ noiseFill(g,w,h,'#cbbd9e',['#b9aa8a','#d6c9ab','#a89a7c'],1800,6); g.strokeStyle='rgba(90,75,55,.45)'; g.lineWidth=3; for(let y=0;y<h;y+=42){ g.beginPath(); g.moveTo(0,y); g.lineTo(w,y); g.stroke(); for(let x=(y/42%2)*40;x<w;x+=80){ g.beginPath(); g.moveTo(x,y); g.lineTo(x,y+42); g.stroke(); } } },[1,1]),
    brick:()=>ctex(256,256,(g,w,h)=>{ noiseFill(g,w,h,'#c9965a',['#b8844a','#d6a66a','#a87a48'],1500,6); g.strokeStyle='rgba(90,50,20,.55)'; g.lineWidth=4; for(let y=0;y<h;y+=32){ g.beginPath(); g.moveTo(0,y); g.lineTo(w,y); g.stroke(); for(let x=(y/32%2)*32;x<w;x+=64){ g.beginPath(); g.moveTo(x,y); g.lineTo(x,y+32); g.stroke(); } } },[1,1]),
    wood:()=>ctex(256,256,(g,w,h)=>{ g.fillStyle='#8a5a32'; g.fillRect(0,0,w,h); for(let x=0;x<w;x+=32){ g.fillStyle=`hsl(26,${38+Math.random()*10}%,${30+Math.random()*10}%)`; g.fillRect(x+1,0,30,h); g.strokeStyle='rgba(40,20,5,.25)'; for(let k=0;k<5;k++){ g.beginPath(); const xx=x+4+Math.random()*24; g.moveTo(xx,0); g.bezierCurveTo(xx+4,h*.3,xx-4,h*.6,xx+2,h); g.stroke(); } g.fillStyle='rgba(30,15,5,.55)'; g.fillRect(x,0,2,h); } }),
    planks:()=>ctex(512,512,(g,w,h)=>{ g.fillStyle='#9a6a3e'; g.fillRect(0,0,w,h); const bw=64; for(let x=0;x<w;x+=bw){ let y=-Math.random()*200; while(y<h){ const L=150+Math.random()*180; g.fillStyle=`hsl(${24+Math.random()*8},${40+Math.random()*12}%,${34+Math.random()*12}%)`; g.fillRect(x+1,y+1,bw-2,L-2); g.strokeStyle='rgba(50,25,8,.18)'; for(let k=0;k<4;k++){ g.beginPath(); const yy=y+10+Math.random()*(L-20); g.moveTo(x+3,yy); g.bezierCurveTo(x+bw*.3,yy+6,x+bw*.6,yy-6,x+bw-3,yy+2); g.stroke(); } g.fillStyle='rgba(30,15,5,.6)'; g.fillRect(x,y,bw,2); y+=L; } g.fillStyle='rgba(30,15,5,.55)'; g.fillRect(x,0,2,h); } },[2,2]),
    tent:()=>ctex(256,256,(g,w,h)=>{ for(let i=0;i<10;i++){ g.fillStyle=['#2f5f86','#e9d8a6','#a8442f','#e9d8a6','#2f5f86'][i%5]; g.fillRect(i*w/10,0,w/10+1,h); } }),
    tent2:()=>ctex(256,256,(g,w,h)=>{ for(let i=0;i<8;i++){ g.fillStyle=['#8a3a3a','#e9d8a6','#5a4a8a','#e9d8a6'][i%4]; g.fillRect(i*w/8,0,w/8+1,h); } }),
    rug:()=>ctex(256,256,(g,w,h)=>{ g.fillStyle='#9c2f2a'; g.fillRect(0,0,w,h); g.strokeStyle='#e8b94a'; g.lineWidth=10; g.strokeRect(14,14,w-28,h-28); g.lineWidth=4; g.strokeStyle='#f1e6c6'; g.strokeRect(30,30,w-60,h-60); g.fillStyle='#2f4f86'; g.save(); g.translate(w/2,h/2); for(let i=0;i<4;i++){ g.rotate(PI/2); g.beginPath(); g.moveTo(0,-70); g.lineTo(26,-36); g.lineTo(0,-10); g.lineTo(-26,-36); g.closePath(); g.fill(); } g.fillStyle='#e8b94a'; g.beginPath(); g.arc(0,0,14,0,TAU); g.fill(); g.restore(); }),
    blanket:()=>ctex(128,128,(g,w,h)=>{ g.fillStyle='#3c5fa8'; g.fillRect(0,0,w,h); for(let y=0;y<h;y+=16){ g.fillStyle=y%32?'#e9d8a6':'#a8442f'; g.fillRect(0,y,w,5); } }),
    rainbow:()=>ctex(64,256,(g,w,h)=>{ ['#d9443a','#ef9a2d','#ecd23b','#4fae4f','#3f7fd1','#7e4fb3'].forEach((c,i)=>{ g.fillStyle=c; g.fillRect(0,i*h/6,w,h/6+1); }); }),
    nemes:()=>ctex(64,256,(g,w,h)=>{ for(let i=0;i<16;i++){ g.fillStyle=i%2?'#e8b94a':'#2f4fa8'; g.fillRect(0,i*h/16,w,h/16+1); } }),
    shell:()=>ctex(256,256,(g,w,h)=>{ g.fillStyle='#6f7a3a'; g.fillRect(0,0,w,h); g.strokeStyle='#3f4a1e'; g.lineWidth=6; const r=34; for(let y=0;y<h+r;y+=r*1.5) for(let x=0;x<w+r;x+=r*1.73){ const ox=(Math.round(y/(r*1.5))%2)*r*.87; g.beginPath(); for(let k=0;k<6;k++){ const a=k/6*TAU+PI/6; g.lineTo(x+ox+Math.cos(a)*r,y+Math.sin(a)*r); } g.closePath(); g.stroke(); } }),
    writing:()=>ctex(256,320,(g,w,h)=>{ g.fillStyle='#efe2bf'; g.fillRect(0,0,w,h); g.fillStyle='rgba(70,40,30,.7)'; for(let y=30;y<h-30;y+=22){ let x=24; while(x<w-30){ const l=10+Math.random()*30; g.fillRect(x,y,l,5); x+=l+8; } } }),
    sky:()=>ctex(4,512,(g,w,h)=>{ const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#4f93dd'); gr.addColorStop(.45,'#93c6f0'); gr.addColorStop(.72,'#d9ebf3'); gr.addColorStop(1,'#f1e6c6'); g.fillStyle=gr; g.fillRect(0,0,w,h); }),
    glow:()=>ctex(128,128,(g,w,h)=>{ const gr=g.createRadialGradient(64,64,0,64,64,64); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(.35,'rgba(255,240,190,.6)'); gr.addColorStop(1,'rgba(255,220,140,0)'); g.fillStyle=gr; g.fillRect(0,0,w,h); }),
    spots:()=>ctex(256,256,(g,w,h)=>{ g.fillStyle='#f6f2ea'; g.fillRect(0,0,w,h); g.fillStyle='#2a2420'; for(let i=0;i<9;i++){ g.beginPath(); g.ellipse(Math.random()*w,Math.random()*h,18+Math.random()*26,14+Math.random()*20,Math.random()*3,0,TAU); g.fill(); } }),
    leopard:()=>ctex(256,256,(g,w,h)=>{ g.fillStyle='#e8b45a'; g.fillRect(0,0,w,h); for(let i=0;i<70;i++){ const x=Math.random()*w,y=Math.random()*h; g.strokeStyle='#4a2e14'; g.lineWidth=4; g.beginPath(); g.arc(x,y,6+Math.random()*3,0,TAU*.8); g.stroke(); } }),
    deer:()=>ctex(256,256,(g,w,h)=>{ g.fillStyle='#b9824a'; g.fillRect(0,0,w,h); g.fillStyle='#f2e2c6'; for(let i=0;i<26;i++){ g.beginPath(); g.arc(Math.random()*w,Math.random()*h*.6,5+Math.random()*4,0,TAU); g.fill(); } })
  };
  TX[k]=D[k](); TX[k].userData={cached:true}; return TX[k]; }
const texMat=(k,o={})=>{ const key='T'+k+JSON.stringify(o); if(MATS.has(key)) return MATS.get(key); const m=new TH.MeshStandardMaterial(Object.assign({map:tx(k),roughness:.85},o)); m.userData.cached=true; MATS.set(key,m); return m; };

/* ===================== PEOPLE ===================== */
function robeGeo(){ return geo('robe',()=>{ const pts=[[0,.15],[.275,.15],[.295,.175],[.275,.3],[.24,.46],[.21,.6],[.195,.7],[.175,.79],[.13,.86],[.07,.895],[0,.9]].map(([x,y])=>new TH.Vector2(x,y));
  const g=new TH.LatheGeometry(pts,40); const pa=g.attributes.position; for(let i=0;i<pa.count;i++){ const x=pa.getX(i), y=pa.getY(i), z=pa.getZ(i); const a=Math.atan2(z,x); const f=1+.05*Math.sin(a*9)*Math.max(0,(.62-y)/.47); pa.setX(i,x*f); pa.setZ(i,z*f); } g.computeVertexNormals(); return g; }); }
function personHair(head,L,hairM){
  const hs=L.hs||0; const scarf=L.wrap||(hs===6?hexMix(L.robe==='rainbow'?'#e9d8a6':L.robe,'#ffffff',.45):null);
  if(scarf){ const sm=mat(scarf,{roughness:.85}); const cap=msh(geo('scap',()=>new TH.SphereGeometry(.226,28,14,0,TAU,0,PI*.56)),sm,head,0,.012,-.01); cap.rotation.x=-.32;
    msh(geo('sdrape',()=>new TH.CylinderGeometry(.226,.27,.48,24,1,true,PI*.27,PI*1.46)),mat(scarf,{roughness:.85,side:TH.DoubleSide}),head,0,-.2,-.02);
    const band=msh(Gt(.215,.018,8,28),mat(hexMul(scarf,.75)),head,0,.09,.02); band.rotation.x=PI/2-.32; return; }
  if(hs===5){ const af=msh(bumpy(.3,3,.06,40),hairM,head,0,.07,-.05); af.scale.set(1,.95,.95); return; }
  const cap=msh(geo('hcap',()=>new TH.SphereGeometry(.214,28,14,0,TAU,0,PI*.53)),hairM,head,0,.012,-.008); cap.rotation.x=-.36;
  const fringe=(n,yy,zz)=>{ for(let i=-2;i<=2;i++){ const f=msh(Gs(.06,10,8),hairM,head,i*.055,yy-Math.abs(i)*.012,zz-Math.abs(i)*.02); f.scale.set(1.2,.6,.7); f.rotation.z=i*.2; } };
  if(hs===0) fringe(5,.13,.15);
  if(hs===1){ msh(geo('hlong',()=>new TH.CylinderGeometry(.214,.25,.45,24,1,true,PI*.3,PI*1.4)),mat(L.hair,{roughness:.6,side:TH.DoubleSide}),head,0,-.17,-.01); fringe(5,.14,.14); }
  if(hs===2){ for(let i=0;i<22;i++){ const th=(i/22)*TAU*2.3, ph=.15+(i%7)/7*1.2, r=.215; msh(Gs(.058,10,8),hairM,head,Math.sin(ph)*Math.cos(th)*r,Math.cos(ph)*r*.95+.01,Math.sin(ph)*Math.sin(th)*r*.9-.03); } }
  if(hs===3){ for(const sx of [-1,1]){ for(let i=0;i<6;i++) msh(Gs(+(0.046-i*.003).toFixed(3),10,8),hairM,head,sx*(.17+i*.004),-.06-i*.07,.02+i*.012); const tt=msh(Gt(.03,.012,6,12),mat('#e05a7a'),head,sx*.19,-.5,.09); tt.rotation.y=PI/2; } fringe(5,.135,.15); }
  if(hs===4){ msh(Gs(.1,14,10),hairM,head,0,.18,-.13); const b=msh(Gt(.07,.014,6,16),mat('#e8b94a'),head,0,.14,-.1); b.rotation.x=1; }
}
function buildPerson(L,o={}){
  // o: {props:{head,hand,back}, armor:[...], crown, angel, staff, light}
  const root=new TH.Group(), body=new TH.Group(); root.add(body);
  const robeHex=L.robe==='rainbow'?'#ffffff':L.robe;
  const skin=mat(L.skin,{roughness:.55}), skinD=mat(hexMul(L.skin,.86),{roughness:.6});
  const robe=L.robe==='rainbow'?texMat('rainbow',{roughness:.88}):mat(robeHex,{roughness:.88}); const robeD=mat(hexMul(L.robe==='rainbow'?'#3f7fd1':robeHex,.72),{roughness:.9});
  const hairM=mat(L.hair||'#3a2414',{roughness:.6}); const armor=o.armor||[];
  const sashM=armor.includes('belt')?mat('#e8b94a',{roughness:.35,metalness:.7}):mat(L.sash||'#e9d8a6',{roughness:.75});
  const shoeM=armor.includes('shoes')?mat('#b88a3a',{roughness:.5,metalness:.3}):mat('#7a4a26',{roughness:.8});
  const legs=[];
  for(const sx of [-1,1]){ const Lg=new TH.Group(); Lg.position.set(sx*.09,0,0); body.add(Lg); const f=msh(Gs(.072,14,10),shoeM,Lg,0,.04,.035); f.scale.set(1,.55,1.55); msh(Gc(.042,.048,.14,10),skin,Lg,0,.12,0); legs.push(Lg); }
  const torso=new TH.Group(); body.add(torso);
  msh(robeGeo(),robe,torso);
  const hem=msh(Gt(.282,.016,6,40),sashM,torso,0,.19,0); hem.rotation.x=PI/2;
  const sash=msh(Gt(.214,.03,8,36),sashM,torso,0,.56,0); sash.rotation.x=PI/2;
  const knot=msh(Gb(.06,.17,.025),sashM,torso,.09,.46,.2); knot.rotation.z=.15;
  msh(Gc(.052,.06,.09,12),skin,torso,0,.93,0);
  const collar=msh(Gt(.075,.02,8,20),robeD,torso,0,.89,0); collar.rotation.x=PI/2;
  if(armor.includes('breast')){ const bp=msh(geo('bplate',()=>new TH.SphereGeometry(.2,20,12,PI*.15,PI*.7,PI*.28,PI*.36)),mat('#c9ced8',{roughness:.3,metalness:.8,side:TH.DoubleSide}),torso,0,.6,0); bp.scale.set(1.05,1.1,1.1); bp.rotation.y=PI*-.0; }
  const arms=[], hands=[];
  for(const sx of [-1,1]){ const A=new TH.Group(); A.position.set(sx*.185,.82,0); A.rotation.z=sx*.16; torso.add(A);
    msh(Gc(.052,.08,.31,14),robe,A,0,-.155,0); const cuff=msh(Gt(.072,.012,6,16),robeD,A,0,-.3,0); cuff.rotation.x=PI/2;
    const H=new TH.Group(); H.position.set(0,-.335,0); A.add(H); msh(Gs(.05,12,10),skin,H); arms.push(A); hands.push(H); }
  const head=new TH.Group(); head.position.set(0,1.12,0); torso.add(head);
  const sk=msh(Gs(.2,28,20),skin,head); sk.scale.set(1,.98,.96);
  for(const sx of [-1,1]){ const e=msh(Gs(.045,10,8),skinD,head,sx*.193,-.005,0); e.scale.set(.55,1,.8); }
  const eyes=new TH.Group(); head.add(eyes);
  const white=mat('#fbfbf6',{roughness:.3}), iris=mat(L.eye||'#4a2c16',{roughness:.3}), pupil=mat('#0d0805',{roughness:.2}), hl=basic('#ffffff');
  for(const sx of [-1,1]){ const w=msh(Gs(.043,14,10),white,eyes,sx*.074,.008,.168,false); w.scale.set(1,1.25,.55); const ir=msh(Gs(.029,14,10),iris,eyes,sx*.072,.004,.186,false); ir.scale.set(1,1.15,.45); const pu=msh(Gs(.015,10,8),pupil,eyes,sx*.072,.004,.195,false); pu.scale.set(1,1.1,.4); msh(Gs(.0075,6,4),hl,eyes,sx*.072+.011,.018,.199,false); }
  for(const sx of [-1,1]){ const b=msh(Gb(.062,.014,.02),hairM,head,sx*.074,.078,.18,false); b.rotation.z=-sx*.12; }
  const nose=msh(Gs(.024,10,8),skinD,head,0,-.028,.196,false); nose.scale.set(1,.8,.8);
  if(!L.beard){ const mo=msh(Gt(.034,.0085,6,16,PI),mat('#9a3a2a',{roughness:.5}),head,0,-.083,.181,false); mo.rotation.z=PI; }
  const blushM=geo?MATS.get('blush')||(()=>{ const m=new TH.MeshBasicMaterial({color:c3('#f08a8a'),transparent:true,opacity:.32,depthWrite:false}); m.userData.cached=true; MATS.set('blush',m); return m; })():null;
  for(const sx of [-1,1]){ const b=msh(geo('blushc',()=>new TH.CircleGeometry(.033,14)),blushM,head,sx*.115,-.042,.165,false); b.rotation.y=sx*.55; }
  if(armor.includes('helmet')){ const hm=msh(geo('helm',()=>new TH.SphereGeometry(.232,24,12,0,TAU,0,PI*.5)),mat('#cfd5e0',{roughness:.3,metalness:.8}),head,0,.02,-.01); hm.rotation.x=-.25; msh(Gb(.04,.12,.26),mat('#e8b94a',{roughness:.3,metalness:.8}),head,0,.24,-.03); }
  else personHair(head,L,hairM);
  if(L.beard){ const bm=mat(L.beard,{roughness:.7}); const bd=msh(geo('beard',()=>new TH.SphereGeometry(.165,18,12,0,TAU,PI*.46,PI*.54)),bm,head,0,-.03,.045); bd.scale.set(1.05,1.3,.95); msh(Gt(.045,.016,6,12,PI),bm,head,0,-.07,.185,false); }
  if(o.angel){ const wm=mat('#ffffff',{roughness:.6,side:TH.DoubleSide}); for(const sx of [-1,1]){ const w=msh(Gs(.3,16,10),wm,torso,sx*.24,.72,-.18); w.scale.set(.45,1,.12); w.rotation.set(.2,sx*-.5,sx*.35); }
    const halo=msh(Gt(.15,.018,8,28),new TH.MeshBasicMaterial({color:c3('#ffe9a0')}),head,0,.33,0,false); halo.rotation.x=PI/2; }
  const props=Object.assign({},o.props||{}); if(o.crown) props.head='crown'; if(o.staff&&!props.hand) props.hand='staff';
  addProps({head,hands,torso},props,o);
  if(armor.includes('shield')&&props.back!=='shield'){ addProps({head,hands,torso},{back:'shield'},o); }
  if(armor.includes('sword')){ const sw=new TH.Group(); sw.position.set(-.21,.48,.06); sw.rotation.set(.1,0,.25); torso.add(sw); msh(Gb(.035,.42,.02),mat('#dfe6f0',{roughness:.2,metalness:.9,emissive:'#3a4a6a'}),sw,0,-.12,0); msh(Gb(.13,.03,.04),mat('#e8b94a',{roughness:.3,metalness:.8}),sw,0,.1,0); msh(Gc(.018,.018,.1,6),mat('#6b4a2a'),sw,0,.16,0); }
  const P={root,body,torso,head,eyes,legs,arms,hands,ph:0,blinkT:2+Math.random()*3,holding:!!props.hand};
  P.update=(dt,speed,t)=>{ const mv=Math.min(1,speed/2.6); P.ph+=dt*(4+speed*3.1); const s=Math.sin(P.ph);
    legs[0].position.z=s*.09*mv; legs[1].position.z=-s*.09*mv; legs[0].position.y=Math.max(0,s)*.035*mv; legs[1].position.y=Math.max(0,-s)*.035*mv;
    if(!P.override){ arms[0].rotation.x=-s*.55*mv; arms[1].rotation.x=P.holding?s*.18*mv-.25:s*.55*mv; }
    torso.position.y=Math.abs(s)*.028*mv+Math.sin(t*2.1)*.004*(1-mv); torso.rotation.z=s*.025*mv; head.rotation.z=Math.sin(t*.9+P.blinkT)*.03*(1-mv);
    P.blinkT-=dt; if(P.blinkT<0){ eyes.scale.y=.12; if(P.blinkT<-.11){ eyes.scale.y=1; P.blinkT=2.2+Math.random()*3.5; } } };
  root.traverse(x=>{ if(x.isMesh&&x.castShadow!==false) x.castShadow=true; });
  return P;
}
const PROP_LIST={head:['headband','flowers','wreath','crown'],hand:['staff','lantern','scroll'],back:['satchel','cape','bedroll']};
const PROP_PRICE={headband:30,flowers:45,wreath:70,crown:0,staff:60,lantern:80,scroll:35,satchel:50,cape:90,bedroll:40};
function addProps(P,props,o={}){
  const gold=mat('#e8b94a',{roughness:.3,metalness:.85}), wood=mat('#7a5230',{roughness:.7}), leather=mat('#8a5a2e',{roughness:.75});
  const {head,hands,torso}=P;
  if(props.head==='crown'){ const g=new TH.Group(); g.position.set(0,.17,-.01); g.rotation.x=-.25; head.add(g); msh(Gc(.165,.17,.06,22,true),mat('#e8b94a',{roughness:.3,metalness:.85,side:TH.DoubleSide}),g); for(let i=0;i<8;i++){ const a=i/8*TAU; msh(Gk(.026,.08,6),gold,g,Math.sin(a)*.165,.065,Math.cos(a)*.165); if(i%2===0) msh(Gs(.018,8,6),mat('#c0302b',{roughness:.2,metalness:.3}),g,Math.sin(a)*.17,0,Math.cos(a)*.17); } }
  if(props.head==='flowers'){ const g=new TH.Group(); g.position.set(0,.15,-.01); g.rotation.x=-.3; head.add(g); const v=msh(Gt(.19,.013,6,30),mat('#4f8a3a'),g); v.rotation.x=PI/2; const fc=['#f7c6dc','#fff6c8','#c7b4ff','#ffffff','#f08ab0']; for(let i=0;i<11;i++){ const a=i/11*TAU; const f=msh(Gs(.03,10,8),mat(fc[i%5],{roughness:.5}),g,Math.sin(a)*.19,.01,Math.cos(a)*.19); msh(Gs(.012,6,4),mat('#f0b030'),f,0,.022,0,false); } }
  if(props.head==='wreath'){ const g=new TH.Group(); g.position.set(0,.14,-.01); g.rotation.x=-.3; head.add(g); const v=msh(Gt(.195,.012,6,30),mat('#6f8a3a'),g); v.rotation.x=PI/2; const lm=mat('#7f9a5a',{roughness:.7}); for(let i=0;i<18;i++){ const a=i/18*TAU; const l=msh(Gs(.035,8,6),lm,g,Math.sin(a)*.2,.012,Math.cos(a)*.2); l.scale.set(.5,.3,1.1); l.rotation.y=a+.6; } }
  if(props.head==='headband'){ const b=msh(Gt(.212,.022,8,30),mat('#b0533a',{roughness:.8}),head,0,.08,.01); b.rotation.x=PI/2-.3; const k=msh(Gb(.05,.12,.02),mat('#b0533a'),head,.06,-.02,-.2); k.rotation.z=.4; }
  const H=hands[1];
  if(props.hand==='staff'){ const g=new TH.Group(); g.rotation.z=-.16; H.add(g); msh(Gc(.02,.025,1.45,8),wood,g,0,.28,0); const cr=msh(Gt(.08,.02,8,16,PI*1.25),wood,g,.08,1.0,0); cr.rotation.z=-.2; }
  if(props.hand==='lantern'){ const g=new TH.Group(); g.position.y=-.06; g.rotation.z=-.16; H.add(g); const m=mat('#4a3a2a',{roughness:.5,metalness:.5}); msh(Gb(.1,.015,.1),m,g,0,-.05,0); msh(Gb(.1,.015,.1),m,g,0,-.19,0); msh(Gb(.085,.13,.085),mat('#ffe6a0',{emissive:'#ffb040',emissiveIntensity:1.6,roughness:.3}),g,0,-.12,0,false); msh(Gt(.03,.006,6,12),m,g,0,-.02,0); if(o.light){ const Lt=new TH.PointLight(0xffc070,.9,5,2); Lt.position.set(0,-.12,0); g.add(Lt); } }
  if(props.hand==='scroll'){ const g=new TH.Group(); g.position.set(0,-.02,.04); g.rotation.set(0,0,PI/2-.2); H.add(g); msh(Gc(.03,.03,.22,12),mat('#efe2bf'),g); for(const s of [-1,1]) msh(Gc(.018,.018,.05,8),wood,g,0,s*.13,0); }
  if(props.back==='satchel'){ const s=msh(Gb(.16,.15,.07),leather,torso,.235,.46,.06); s.rotation.y=-.6; msh(Gb(.165,.06,.075),mat('#6a4224'),s,0,.05,0); for(const z of [1,-1]){ const st=msh(Gb(.035,.5,.012),leather,torso,.03,.7,z*.188); st.rotation.z=-.62; st.rotation.x=z*-.12; } }
  if(props.back==='cape'){ msh(geo('cape',()=>new TH.CylinderGeometry(.2,.33,.68,22,1,true,PI*.62,PI*.76)),mat('#a8261f',{roughness:.9,side:TH.DoubleSide}),torso,0,.52,-.02); for(const s of [-1,1]) msh(Gs(.022,8,6),gold,torso,s*.12,.85,.07); }
  if(props.back==='bedroll'){ const r=msh(Gc(.09,.09,.46,16),texMat('blanket',{roughness:.95}),torso,0,.88,-.2); r.rotation.z=PI/2; for(const x of [-.14,.14]){ const b=msh(Gt(.093,.012,6,16),leather,torso,x,.88,-.2); b.rotation.y=PI/2; } for(const z of [1,-1]){ const st=msh(Gb(.035,.5,.012),leather,torso,.03,.7,z*.188); st.rotation.z=.62; st.rotation.x=z*-.12; } }
  if(props.back==='shield'){ const g=new TH.Group(); g.position.set(0,.6,-.24); torso.add(g); const d=msh(Gc(.2,.2,.04,26),mat('#3c4fa8',{roughness:.5}),g); d.rotation.x=PI/2; msh(Gt(.2,.018,8,26),gold,g); msh(Gb(.03,.24,.02),gold,g,0,0,-.025); msh(Gb(.16,.03,.02),gold,g,0,.04,-.025); }
}

/* ===================== ANIMAL FRIENDS ===================== */
function eyes3(head,x,y,z,r,side){ const blk=mat('#120a06',{roughness:.15}), hl=basic('#ffffff');
  for(const s of [-1,1]){ const e=msh(Gs(r,12,10),blk,head,s*x,y,z,false); if(side) e.scale.set(.7,1,1); msh(Gs(+(r*.3).toFixed(4),6,4),hl,head,s*x+(side?s*r*.35:r*.25),y+r*.38,z+r*.55,false); } }
function legs4(g,pos,len,r,m,hoof){ return pos.map(([x,z])=>{ const Lg=new TH.Group(); Lg.position.set(x,len,z); g.add(Lg); msh(Gc(+(r*1.3).toFixed(4),+(r*.9).toFixed(4),len,10),m,Lg,0,-len/2,0); if(hoof) msh(Gc(+(r*.95).toFixed(4),+(r*1.05).toFixed(4),+(len*.14).toFixed(4),10),hoof,Lg,0,-len+len*.07,0); else { const p=msh(Gs(+(r*1.25).toFixed(4),10,8),m,Lg,0,-len+r*.6,r*.4); p.scale.set(1,.7,1.3); } return Lg; }); }
function walker(o,legs,body,{rate=4,swing=.55,bob=.025,extra}={}){ o.update=(dt,speed,t)=>{ o.ph=(o.ph||0)+dt*speed*rate; const mv=Math.min(1,speed/2); const s=Math.sin(o.ph); legs.forEach((L,i)=>L.rotation.x=s*((i===0||i===3)?1:-1)*swing*mv); body.position.y=Math.abs(s)*bob*mv; if(extra) extra(dt,speed,t,mv,s); }; return o; }
function quad(q){
  const g=new TH.Group(), body=new TH.Group(); g.add(body);
  const fur=q.tex?texMat(q.tex,{roughness:.9}):mat(q.fur,{roughness:q.rough||.85,emissive:q.em||undefined});
  const furL=mat(q.belly||q.fur,{roughness:.88}); const legM=mat(q.legCol||q.fur,{roughness:.85});
  const Lb=q.len||.36, R=q.r||.2, Wd=q.w||R, legH=q.leg||.32, legR=q.legR||.045; const by=legH+R*.72;
  const b=msh(q.wool?bumpy(1,3,.07,15):Gs(1,22,14),q.wool?mat('#f6f1e6',{roughness:1}):fur,body,0,by,0); b.scale.set(Wd,R,Lb);
  if(q.belly&&!q.wool) msh(Gs(1,16,10),furL,body,0,by-R*.18,Lb*.05).scale.set(Wd*.82,R*.72,Lb*.82);
  if(q.hump){ msh(Gs(1,16,12),fur,body,0,by+R*.75,-.02).scale.set(Wd*.75,R*.8,Lb*.45); }
  const legs=legs4(g,[[-Wd*.55,Lb*.58],[Wd*.55,Lb*.58],[-Wd*.55,-Lb*.58],[Wd*.55,-Lb*.58]],legH,legR,legM,q.hoof?mat(q.hoof,{roughness:.5}):null);
  const hr=q.head||.13; const head=new TH.Group(); head.position.set(0,by+R*.55+(q.neck||0),Lb*.92+hr*.2); head.rotation.x=q.tilt||0; body.add(head);
  if(q.neck){ const nk=msh(Gc(hr*.55,hr*.75,q.neck+R*.4,10),fur,body,0,by+R*.35+q.neck/2,Lb*.8); nk.rotation.x=.45; }
  const hd=msh(Gs(hr,18,14),q.headCol?mat(q.headCol,{roughness:.8}):fur,head); hd.scale.set(.95,.95,1.1);
  const sn=q.snout||.8; if(sn>0){ const s=msh(Gs(hr*.62,14,10),mat(q.snoutCol||q.belly||q.fur,{roughness:.8}),head,0,-hr*.3,hr*.72); s.scale.set(.9,.72,sn); msh(Gs(hr*.16,8,6),mat(q.nose||'#2a1a12',{roughness:.4}),head,0,-hr*.18,hr*(.72+sn*.58),false).scale.set(1.3,.8,.8); }
  eyes3(head,hr*.5,hr*.2,hr*.68,hr*.21,!!q.sideEyes);
  const E=q.ears||'pointy', ec=mat(q.earCol||q.fur,{roughness:.85}), ei=mat(q.earIn||'#d89a9a',{roughness:.8});
  for(const sx of [-1,1]){
    if(E==='pointy'){ const e=msh(Gk(hr*.32,hr*.8,8),ec,head,sx*hr*.55,hr*.85,-hr*.1); e.rotation.z=-sx*.25; msh(Gk(hr*.2,hr*.55,8),ei,e,0,-.005,hr*.08,false); }
    if(E==='small'){ const e=msh(Gk(hr*.22,hr*.5,8),ec,head,sx*hr*.42,hr*.9,-hr*.25); e.rotation.z=-sx*.15; }
    if(E==='round'){ msh(Gs(hr*.32,10,8),ec,head,sx*hr*.7,hr*.75,-hr*.15).scale.set(1,1,.5); }
    if(E==='floppy'||E==='cow'){ const e=msh(Gs(hr*.42,10,8),ec,head,sx*hr*1.05,hr*.25,-hr*.1); e.scale.set(1,.3,.5); e.rotation.z=sx*(E==='cow'?-.1:-.5); }
    if(E==='long'){ const e=msh(Gs(hr*.3,10,8),ec,head,sx*hr*.35,hr*1.5,-hr*.2); e.scale.set(.6,2.1,.4); e.rotation.z=-sx*.12; msh(Gs(hr*.22,10,8),ei,e,0,0,hr*.12,false).scale.set(.5,.9,.3); }
  }
  const H=q.horns, hm=mat(q.hornCol||'#e9dcc0',{roughness:.6});
  if(H==='curl') for(const sx of [-1,1]){ const h=msh(Gt(hr*.42,hr*.14,8,18,PI*1.6),hm,head,sx*hr*.68,hr*.5,-hr*.2); h.rotation.set(0,sx*PI/2,sx*.6); }
  if(H==='small') for(const sx of [-1,1]){ const h=msh(Gk(hr*.12,hr*.55,6),hm,head,sx*hr*.35,hr*1.05,-hr*.2); h.rotation.set(-.35,0,-sx*.25); }
  if(H==='ox') for(const sx of [-1,1]){ const h=msh(Gt(hr*.6,hr*.1,8,14,PI*.6),hm,head,sx*hr*.9,hr*.6,-hr*.15); h.rotation.set(0,0,sx>0?-.2:PI+.2); }
  if(H==='antler') for(const sx of [-1,1]){ const a=new TH.Group(); a.position.set(sx*hr*.4,hr*.9,-hr*.15); a.rotation.z=-sx*.35; head.add(a); msh(Gc(hr*.06,hr*.08,hr*1.4,6),hm,a,0,hr*.7,0); for(let k=0;k<3;k++){ const tine=msh(Gc(hr*.04,hr*.05,hr*.6,6),hm,a,sx*hr*.18,hr*(.5+k*.35),0); tine.rotation.z=-sx*.8; } }
  if(q.beard) msh(Gk(hr*.18,hr*.6,8),mat(q.beard),head,0,-hr*.75,hr*.55).rotation.x=PI;
  if(q.mane==='flame'){ const fm=mat('#ff8a2a',{emissive:'#ff5a10',emissiveIntensity:1.2,roughness:.6}); for(let i=0;i<6;i++){ const f=msh(Gk(.05,.2,6),fm,body,0,by+R*.55+i*.035,Lb*(.85-i*.12),false); f.rotation.x=-.6; } }
  if(q.mane==='horse'){ for(let i=0;i<6;i++){ const f=msh(Gb(.03,.12,.06),mat(q.maneCol||'#3a2414'),body,0,by+R*.62+i*.03,Lb*(.85-i*.11),false); f.rotation.x=-.4; } }
  const tail=new TH.Group(); tail.position.set(0,by+R*.3,-Lb); body.add(tail); const T=q.tail||'short';
  if(T==='short') msh(Gs(R*.25,10,8),q.wool?mat('#f6f1e6',{roughness:1}):fur,tail,0,0,-.02);
  if(T==='tuft'){ const tt=msh(Gc(.015,.012,.32,6),fur,tail,0,-.08,-.1); tt.rotation.x=-.7; msh(Gs(.045,8,6),mat(q.tuft||hexMul(q.fur,.6)),tail,0,-.18,-.22); }
  if(T==='bushy'){ const tt=msh(Gs(1,14,10),fur,tail,0,.02,-.18); tt.scale.set(.09,.09,.24); tt.rotation.x=.4; msh(Gs(.07,10,8),mat('#f6f2ea'),tail,0,.11,-.38); }
  if(T==='flame'){ const fm=mat('#ff8a2a',{emissive:'#ff5a10',emissiveIntensity:1.2}); for(let i=0;i<3;i++){ const f=msh(Gk(.06-i*.012,.3,6),fm,tail,0,-.05,-.12-i*.04,false); f.rotation.x=-1.9+i*.2; } }
  if(T==='thin'){ const tt=msh(Gc(.008,.006,.4,5),mat(q.tailCol||q.fur),tail,0,-.05,-.18); tt.rotation.x=-1.2; }
  if(q.spots){ /* textures handle spots */ }
  if(q.scale) g.scale.setScalar(q.scale);
  const o={root:g,kind:'walk',height:(by+R+hr*2)*(q.scale||1)};
  return walker(o,legs,body,{rate:q.rate||4,swing:q.swing||.55,extra:(dt,sp,t,mv)=>{ tail.rotation.y=Math.sin(t*(T==='bushy'?3:8))*.35; head.rotation.y=Math.sin(t*.7)*.14*(1-mv); }});
}
function buildLamb(){
  const g=new TH.Group(), body=new TH.Group(); g.add(body);
  const wool=mat('#f6f1e6',{roughness:1}), face=mat('#2e2622',{roughness:.7}), faceL=mat('#3d332d',{roughness:.7}), leg=mat('#2e2622',{roughness:.75}), hoof=mat('#14100c',{roughness:.5}), pink=mat('#c98a8a',{roughness:.6});
  msh(bumpy(1,3,.07,15),wool,body,0,.5,0).scale.set(.27,.24,.38); for(let i=0;i<10;i++){ const a=i/10*TAU; msh(Gs(.11,10,8),wool,body,Math.cos(a)*.2,.56+Math.sin(i*1.7)*.07,Math.sin(a)*.3); }
  msh(bumpy(1,2,.08,14),wool,body,0,.63,.2).scale.set(.19,.17,.17);
  const legs=legs4(g,[[-.13,.2],[.13,.2],[-.13,-.21],[.13,-.21]],.36,.034,leg,hoof);
  const head=new TH.Group(); head.position.set(0,.72,.36); head.rotation.x=.25; body.add(head);
  msh(Gs(.11,18,14),face,head).scale.set(.85,.95,1.15);
  msh(Gs(.075,14,10),faceL,head,0,-.05,.1).scale.set(.9,.75,1);
  for(const s of [-1,1]) msh(Gs(.018,8,6),pink,head,s*.022,-.04,.172,false);
  msh(bumpy(1,2,.1,16),wool,head,0,.09,-.03).scale.set(.1,.07,.1);
  for(const s of [-1,1]){ const e=new TH.Group(); e.position.set(s*.1,.03,-.02); e.rotation.z=s*-.45; head.add(e); msh(Gs(.07,10,8),face,e,s*.06,0,0).scale.set(1,.32,.5); msh(Gs(.055,8,6),pink,e,s*.065,-.008,.012,false).scale.set(.85,.15,.35); }
  eyes3(head,.068,.025,.05,.022,true);
  const tail=msh(bumpy(1,1,.1,12),wool,body,0,.58,-.4); tail.scale.set(.07,.08,.06);
  return walker({root:g,kind:'walk',height:.85},legs,body,{rate:4.2,swing:.6,bob:.03,extra:(dt,sp,t,mv)=>{ head.rotation.x=.25+Math.sin(t*1.4)*.06*(1-mv); head.rotation.y=Math.sin(t*.7)*.15*(1-mv); tail.rotation.y=Math.sin(t*9)*.3; }});
}
function buildCamel(){
  const g=new TH.Group(), body=new TH.Group(); g.add(body);
  const fur=mat('#cfa66a',{roughness:.9}), furD=mat('#a8804a',{roughness:.9}), dark=mat('#3a2a1a');
  msh(Gs(1,22,14),fur,body,0,.78,0).scale.set(.25,.24,.42);
  msh(Gs(1,18,12),fur,body,0,1.0,-.04).scale.set(.2,.24,.24);
  msh(bumpy(1,1,.15,10),furD,body,0,1.2,-.04).scale.set(.06,.04,.08);
  const legs=legs4(g,[[-.14,.26],[.14,.26],[-.14,-.26],[.14,-.26]],.6,.06,fur,dark);
  const neck=new TH.Group(); neck.position.set(0,.86,.34); body.add(neck); msh(Gc(.075,.1,.5,12),fur,neck,0,.2,.1).rotation.x=.6; msh(Gs(.09,10,8),fur,neck,0,.42,.2);
  const head=new TH.Group(); head.position.set(0,.44,.24); neck.add(head);
  msh(Gs(.1,16,12),fur,head,0,0,.06).scale.set(.95,.9,1.6); msh(Gs(.06,12,10),furD,head,0,-.025,.19).scale.set(1,.7,.8);
  for(const s of [-1,1]) msh(Gs(.03,8,6),fur,head,s*.065,.07,-.03).scale.set(.6,1.2,.5);
  eyes3(head,.065,.035,.08,.024,true);
  const tail=msh(Gc(.015,.01,.25,6),furD,body,0,.72,-.42); tail.rotation.x=.3;
  g.scale.setScalar(.82);
  return walker({root:g,kind:'walk',height:1.25},legs,body,{rate:2.6,swing:.45,bob:.03,extra:(dt,sp,t,mv,s)=>{ neck.rotation.x=Math.sin(t*.8)*.05+s*.05*mv; tail.rotation.z=Math.sin(t*1.5)*.3; }});
}
function buildLion(){
  const g=new TH.Group(), body=new TH.Group(); g.add(body);
  const fur=mat('#d9a85a',{roughness:.85}), furL=mat('#f0d4a0',{roughness:.85}), mane=mat('#a85a22',{roughness:.95}), nose=mat('#5a3020',{roughness:.5});
  msh(Gs(1,22,14),fur,body,0,.46,-.02).scale.set(.22,.2,.36); msh(Gs(1,14,10),furL,body,0,.4,.05).scale.set(.17,.14,.28);
  const legs=legs4(g,[[-.13,.22],[.13,.22],[-.13,-.22],[.13,-.22]],.32,.052,fur,null);
  const head=new TH.Group(); head.position.set(0,.68,.33); body.add(head);
  msh(bumpy(1,3,.12,14),mane,head,0,0,-.04).scale.set(.24,.24,.18);
  msh(Gs(.15,18,14),fur,head,0,0,.06).scale.set(1,.95,.95);
  msh(Gs(.08,14,10),furL,head,0,-.05,.17).scale.set(1.1,.75,.8);
  msh(Gs(.03,8,6),nose,head,0,-.02,.235,false).scale.set(1.3,.8,.8);
  for(const s of [-1,1]) msh(Gs(.045,10,8),fur,head,s*.11,.13,.02).scale.set(1,1,.5);
  eyes3(head,.06,.04,.18,.022,false);
  const tail=new TH.Group(); tail.position.set(0,.52,-.36); body.add(tail); msh(Gc(.018,.014,.36,6),fur,tail,0,-.1,-.12).rotation.x=-.9; msh(bumpy(1,1,.1,10),mane,tail,0,-.22,-.27).scale.setScalar(.05);
  return walker({root:g,kind:'walk',height:1},legs,body,{rate:3.6,extra:(dt,sp,t,mv)=>{ tail.rotation.z=Math.sin(t*2)*.4; head.rotation.y=Math.sin(t*.6)*.12*(1-mv); }});
}
function buildBear(){
  const g=new TH.Group(), body=new TH.Group(); g.add(body);
  const fur=mat('#7a5230',{roughness:.95}), furL=mat('#c9a37a',{roughness:.9}), nose=mat('#1a120c',{roughness:.4});
  msh(bumpy(1,3,.03,18),fur,body,0,.36,0).scale.set(.24,.23,.3);
  const legs=legs4(g,[[-.13,.15],[.13,.15],[-.13,-.15],[.13,-.15]],.2,.07,fur,null);
  const head=new TH.Group(); head.position.set(0,.55,.26); body.add(head);
  msh(bumpy(1,3,.03,18),fur,head).scale.setScalar(.17);
  msh(Gs(.075,12,10),furL,head,0,-.04,.14).scale.set(1,.8,.9);
  msh(Gs(.028,8,6),nose,head,0,-.01,.205,false).scale.set(1.3,.9,.8);
  for(const s of [-1,1]){ msh(Gs(.055,10,8),fur,head,s*.12,.12,-.02).scale.set(1,1,.6); msh(Gs(.03,8,6),furL,head,s*.12,.12,.01,false).scale.set(1,1,.4); }
  eyes3(head,.065,.04,.14,.02,false);
  return walker({root:g,kind:'walk',height:.8},legs,body,{rate:4.4,swing:.5,bob:.02,extra:(dt,sp,t,mv,s)=>{ body.rotation.z=s*.06*mv; head.rotation.z=Math.sin(t*1.2)*.08*(1-mv); }});
}
function buildFrog(){
  const g=new TH.Group(), body=new TH.Group(); g.add(body);
  const gr=mat('#58a845',{roughness:.45}), grD=mat('#3f8a34',{roughness:.5}), bel=mat('#d8ecb0',{roughness:.6}), wh=mat('#fbfbf6',{roughness:.3});
  const b=msh(Gs(1,22,14),gr,body,0,.16,0); b.scale.set(.2,.14,.22); msh(Gs(1,14,10),bel,body,0,.13,.05).scale.set(.16,.1,.18);
  for(const s of [-1,1]){ msh(Gs(.075,12,10),gr,body,s*.09,.28,.1); msh(Gs(.05,10,8),wh,body,s*.095,.3,.14,false); msh(Gs(.03,8,6),mat('#120a06',{roughness:.15}),body,s*.1,.305,.18,false); msh(Gs(.009,6,4),basic('#ffffff'),body,s*.1+.008,.318,.205,false); }
  const sm=msh(Gt(.09,.008,6,18,PI*.8),grD,body,0,.17,.18,false); sm.rotation.z=PI+PI*.1;
  const back=[-1,1].map(s=>{ const L=msh(Gs(1,10,8),gr,body,s*.17,.08,-.1); L.scale.set(.07,.06,.14); msh(Gs(1,8,6),grD,body,s*.2,.02,.02).scale.set(.06,.015,.08); return L; });
  for(const s of [-1,1]) msh(Gc(.02,.022,.1,6),gr,body,s*.12,.06,.15).rotation.z=s*.3;
  g.scale.setScalar(1.45);
  const o={root:g,kind:'hop',height:.5};
  o.update=(dt,speed,t)=>{ if(speed>.2){ o.ph=(o.ph||0)+dt*7; const h=Math.max(0,Math.sin(o.ph)); body.position.y=h*.22; body.rotation.x=-h*.25; back.forEach(L=>L.scale.z=.14+h*.08); } else { body.position.y=0; body.rotation.x=0; b.scale.y=.14+Math.sin(t*3)*.008; } };
  return o;
}
function buildRabbit(){
  const g=new TH.Group(), body=new TH.Group(); g.add(body);
  const fur=mat('#d9cbb8',{roughness:.95}), wh=mat('#f8f4ec',{roughness:.95}), pink=mat('#e8a0a8');
  msh(Gs(1,18,12),fur,body,0,.2,-.02).scale.set(.15,.15,.2); msh(Gs(1,12,10),wh,body,0,.17,.06).scale.set(.1,.1,.12);
  const head=new TH.Group(); head.position.set(0,.36,.14); body.add(head); msh(Gs(.1,16,12),fur,head).scale.set(.95,.95,1.05);
  msh(Gs(.04,8,6),wh,head,0,-.04,.08); msh(Gs(.014,6,4),pink,head,0,-.015,.105,false);
  const ears=[-1,1].map(s=>{ const e=new TH.Group(); e.position.set(s*.04,.08,-.02); head.add(e); const m=msh(Gs(.04,10,8),fur,e,0,.12,0); m.scale.set(.75,3,.45); msh(Gs(.03,8,6),pink,e,0,.12,.012,false).scale.set(.55,2.6,.25); return e; });
  eyes3(head,.055,.02,.06,.017,true);
  msh(Gs(.05,10,8),wh,body,0,.22,-.22); for(const s of [-1,1]){ msh(Gs(1,10,8),fur,body,s*.1,.07,-.06).scale.set(.05,.06,.11); msh(Gs(.03,8,6),fur,body,s*.06,.05,.12); }
  g.scale.setScalar(1.55);
  const o={root:g,kind:'hop',height:.85};
  o.update=(dt,speed,t)=>{ if(speed>.2){ o.ph=(o.ph||0)+dt*9; const h=Math.max(0,Math.sin(o.ph)); body.position.y=h*.16; body.rotation.x=-h*.2; } else { body.position.y=0; head.rotation.x=Math.sin(t*6)>.95?.08:0; } ears.forEach((e,i)=>e.rotation.z=Math.sin(t*2+i)*.12); };
  return o;
}
function buildMouse(){
  const g=new TH.Group(), body=new TH.Group(); g.add(body);
  const fur=mat('#9a9088',{roughness:.95}), pink=mat('#f0b0b0'), wh=mat('#e8e2da');
  msh(Gs(1,16,12),fur,body,0,.12,0).scale.set(.1,.09,.16);
  const head=new TH.Group(); head.position.set(0,.15,.15); body.add(head); msh(Gs(.07,14,10),fur,head).scale.set(1,.9,1.3); msh(Gs(.016,6,4),pink,head,0,-.01,.1,false);
  for(const s of [-1,1]){ msh(Gs(.05,12,8),fur,head,s*.06,.07,-.02).scale.set(1,1,.35); msh(Gs(.035,10,6),pink,head,s*.06,.07,-.005,false).scale.set(1,1,.2); for(const k of [-1,1]){ const w=msh(Gc(.002,.002,.12,3),wh,head,s*.06,-.005+k*.01,.07,false); w.rotation.z=PI/2+k*.15; } }
  eyes3(head,.04,.02,.06,.014,true);
  const tail=msh(geo('mtail',()=>new TH.TorusGeometry(.12,.008,5,16,PI*.9)),pink,body,0,.12,-.24); tail.rotation.y=PI/2;
  const legs=legs4(g,[[-.05,.08],[.05,.08],[-.05,-.08],[.05,-.08]],.06,.018,pink,null);
  g.scale.setScalar(1.9);
  return walker({root:g,kind:'walk',height:.5},legs,body,{rate:9,swing:.7,bob:.01,extra:(dt,sp,t)=>{ tail.rotation.z=Math.sin(t*3)*.2; head.rotation.y=Math.sin(t*2.3)*.15; }});
}
function wingGeo(){ return geo('wing2',()=>{ const sh=new TH.Shape(); sh.moveTo(0,.12); sh.bezierCurveTo(.35,.22,.75,.2,1,.06); sh.lineTo(.92,-.02); sh.lineTo(.98,-.1); sh.lineTo(.84,-.1); sh.lineTo(.86,-.2); sh.lineTo(.7,-.17); sh.lineTo(.68,-.27); sh.lineTo(.52,-.2); sh.lineTo(.46,-.28); sh.lineTo(.3,-.16); sh.bezierCurveTo(.15,-.12,0,-.1,0,-.1); sh.closePath();
  const g=new TH.ExtrudeGeometry(sh,{depth:.035,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:1}); g.translate(0,0,-.017); g.rotateX(PI/2); return g; }); }
function bird(q){
  const g=new TH.Group(), body=new TH.Group(); g.add(body);
  const bm=mat(q.body,{roughness:.7}), wm=mat(q.wing||q.body,{roughness:.75}), hm=mat(q.headCol||q.body,{roughness:.7}), beak=mat(q.beak||'#e8a04a',{roughness:.5});
  const S=q.size||.12; msh(Gs(S,18,12),bm,body).scale.set(1,q.round?1.05:.95,q.round?1.1:1.45);
  if(q.belly) msh(Gs(S*.9,14,10),mat(q.belly,{roughness:.75}),body,0,-S*.1,S*.25).scale.set(.85,.85,1.1);
  const head=new TH.Group(); head.position.set(0,S*(q.round?.75:.85),S*(q.round?.55:1.2)); body.add(head);
  const hr=S*(q.round?.7:.62); msh(Gs(hr,14,12),hm,head);
  const bk=msh(Gk(hr*.28,hr*(q.hook?.6:.75),8),beak,head,0,-hr*.1,hr*1.05); bk.rotation.x=PI/2+(q.hook?.5:0);
  if(q.face) msh(Gs(hr*.85,14,10),mat(q.face),head,0,0,hr*.35).scale.set(1,1,.45);
  eyes3(head,hr*(q.bigEyes?.38:.62),hr*.22,hr*(q.bigEyes?.85:.55),hr*(q.bigEyes?.3:.2),!q.bigEyes);
  if(q.bigEyes) for(const s of [-1,1]) msh(Gs(hr*.38,12,10),mat('#f0c030',{roughness:.3}),head,s*hr*.38,hr*.22,hr*.75,false).scale.set(1,1,.4);
  if(q.tufts) for(const s of [-1,1]){ const t=msh(Gk(hr*.2,hr*.6,6),hm,head,s*hr*.55,hr*.85,0); t.rotation.z=-s*.4; }
  if(q.comb){ for(let i=0;i<3;i++) msh(Gs(hr*.22,8,6),mat('#d0302a',{roughness:.5}),head,0,hr*(.95+(i===1?.12:0)),hr*(.3-i*.3)); msh(Gs(hr*.2,8,6),mat('#d0302a'),head,0,-hr*.55,hr*.75).scale.set(.7,1.3,.7); }
  const wings=[-1,1].map(s=>{ const W=new TH.Group(); W.position.set(s*S*.55,S*.35,-S*.1); body.add(W); const k=S*2.6*(q.wingK||1); const w=msh(wingGeo(),mat(q.wing||q.body,{roughness:.75,side:TH.DoubleSide}),W,0,0,0); w.scale.set(s*k,k,k); w.rotation.y=s*.12; return W; });
  const tail=new TH.Group(); tail.position.set(0,S*.1,-S*1.3); body.add(tail);
  if(q.tail==='fan'){ const t=msh(Gk(S*.7,S*1.8,10),mat(q.tailCol||q.body),tail,0,0,-S*.6); t.rotation.x=-PI/2-.2; t.scale.set(1,1,.25); }
  if(q.tail==='rooster'){ const cs=['#2a5a3a','#a8442f','#1a2a3a','#c06a2a','#2a5a3a']; for(let i=0;i<5;i++){ const f=msh(geo('rtail',()=>new TH.TorusGeometry(S*1.1,S*.12,6,14,PI*.9)),mat(cs[i],{roughness:.4,metalness:.2}),tail,(i-2)*S*.18,S*.8,0); f.rotation.set(0,PI/2,0); f.scale.setScalar(1-i%2*.15); } }
  if(q.tail==='peacock'){ const fan=new TH.Group(); fan.position.set(0,S*.6,0); fan.rotation.x=-.25; tail.add(fan); const fm=mat('#2f8a6a',{roughness:.5,metalness:.2,side:TH.DoubleSide}), eye=mat('#1a3a8a',{emissive:'#102050'}), eye2=mat('#e8c84a'); for(let i=0;i<13;i++){ const a=-PI*.45+i/12*PI*.9; const f=new TH.Group(); f.rotation.z=a; fan.add(f); const p=msh(Gs(S,10,8),fm,f,0,S*2.4,0); p.scale.set(.42,2.2,.08); msh(Gs(S*.32,10,8),eye2,f,0,S*4,.02,false).scale.set(1,1.2,.3); msh(Gs(S*.2,10,8),eye,f,0,S*4,.04,false).scale.set(1,1.2,.3); } }
  const legsG=[]; if(!q.flies){ for(const s of [-1,1]){ const Lg=new TH.Group(); Lg.position.set(s*S*.35,-S*.6,0); body.add(Lg); msh(Gc(S*.06,S*.06,S*1.2,6),mat(q.legCol||'#e8a04a'),Lg,0,-S*.6,0); msh(Gb(S*.35,S*.06,S*.5),mat(q.legCol||'#e8a04a'),Lg,0,-S*1.2,S*.1); legsG.push(Lg); } }
  const bodyY=q.flies?0:S*2.4; body.position.y=bodyY; if(!q.flies) wings.forEach((w,i)=>{ const sd=i?1:-1; w.rotation.y=sd*1.35; w.rotation.z=sd*-.15; w.scale.setScalar(.75); });
  if(q.scale) g.scale.setScalar(q.scale);
  const o={root:g,kind:q.flies?'fly':'walk',height:(q.flies?.4:bodyY+S*2)*(q.scale||1)};
  o.update=(dt,speed,t)=>{ if(q.flies){ const f=Math.sin(t*(speed>.2?16:5)); const amp=speed>.2?.65:.25; wings[0].rotation.z=.3+f*amp; wings[1].rotation.z=-.3-f*amp; body.position.y=.12+Math.sin(t*2.2)*.06; body.rotation.x=speed>.2?.2:0; }
    else { o.ph=(o.ph||0)+dt*speed*7; const s=Math.sin(o.ph), mv=Math.min(1,speed/2); legsG.forEach((Lg,i)=>Lg.rotation.x=(i?s:-s)*.6*mv); body.position.y=bodyY+Math.abs(s)*S*.15*mv; head.position.z=S*1.2+Math.sin(o.ph*2)*S*.15*mv; wings.forEach((w,i)=>w.rotation.z=(i?-1:1)*(.15+Math.max(0,Math.sin(t*3))*.08)); }
    head.rotation.y=Math.sin(t*1.1)*.3; };
  return o;
}
function buildDove(){ const o=bird({body:'#fbfbf8',wing:'#dfe4ea',beak:'#e8a04a',flies:true,size:.12,tail:'fan',scale:1.5}); const sp=new TH.Group(); o.root.children[0].children[1].add(sp); sp.position.set(0,-.03,.095); msh(Gc(.004,.004,.12,4),mat('#6b5a3a'),sp,.03,0,0).rotation.z=PI/2; for(let i=0;i<3;i++) msh(Gs(.018,8,6),mat('#7f9a5a'),sp,.06+i*.02,-.012*(i%2?1:-1),0,false).scale.set(1.6,.5,.7); return o; }
function buildTurtle(){
  const g=new TH.Group(), body=new TH.Group(); g.add(body);
  const sk=mat('#8aa858',{roughness:.7});
  const sh=msh(geo('tshell',()=>new TH.SphereGeometry(.26,24,12,0,TAU,0,PI/2)),texMat('shell',{roughness:.6}),body,0,.1,0); sh.scale.set(1,.75,1.2);
  msh(Gc(.27,.27,.04,24),mat('#c9b46a'),body,0,.1,0).scale.set(1,1,1.2);
  const head=new TH.Group(); head.position.set(0,.14,.34); body.add(head); msh(Gs(.08,14,10),sk,head).scale.set(1,.9,1.2); eyes3(head,.045,.03,.06,.015,true); msh(Gt(.03,.006,5,10,PI),mat('#3a4a1e'),head,0,-.02,.085,false).rotation.z=PI;
  const legs=legs4(g,[[-.17,.18],[.17,.18],[-.17,-.18],[.17,-.18]],.1,.05,sk,null);
  msh(Gk(.03,.1,6),sk,body,0,.1,-.34).rotation.x=-PI/2;
  g.scale.setScalar(1.35);
  return walker({root:g,kind:'walk',height:.45},legs,body,{rate:3,swing:.4,bob:.01,extra:(dt,sp,t)=>{ head.position.z=.34+Math.sin(t*1.2)*.02; }});
}
function buildBee(){
  const g=new TH.Group(), body=new TH.Group(); g.add(body);
  const y=mat('#f2c230',{roughness:.5}), k=mat('#2a1e10',{roughness:.6});
  msh(Gs(1,18,12),y,body).scale.set(.12,.12,.17);
  for(const z of [-.07,.02]) msh(Gt(.115,.025,6,20),k,body,0,0,z).scale.set(1,1,1);
  msh(Gk(.02,.06,6),k,body,0,0,-.19).rotation.x=-PI/2;
  const head=new TH.Group(); head.position.set(0,.02,.17); body.add(head); msh(Gs(.08,14,10),k,head); eyes3(head,.04,.02,.06,.02,false);
  for(const s of [-1,1]){ const a=msh(Gc(.004,.004,.08,4),k,head,s*.03,.08,.02); a.rotation.z=-s*.4; msh(Gs(.01,6,4),k,head,s*.05,.12,.02); }
  const wm=new TH.MeshStandardMaterial({color:c3('#e8f4ff'),transparent:true,opacity:.55,roughness:.2,side:TH.DoubleSide});
  const wings=[-1,1].map(s=>{ const W=new TH.Group(); W.position.set(s*.05,.1,0); body.add(W); msh(geo('bwing',()=>new TH.CircleGeometry(.09,14)),wm,W,s*.07,0,0,false).scale.set(1,.55,1); return W; });
  wings.forEach(W=>W.children[0].rotation.x=-PI/2);
  g.scale.setScalar(1.7);
  const o={root:g,kind:'fly',height:.45}; o.update=(dt,sp,t)=>{ const f=Math.sin(t*40); wings[0].rotation.z=f*.6; wings[1].rotation.z=-f*.6; body.position.y=.1+Math.sin(t*3)*.05; body.position.x=Math.sin(t*1.7)*.05; }; return o;
}
function buildWorm(){
  const g=new TH.Group(), body=new TH.Group(); g.add(body);
  const gr=mat('#7ac04a',{roughness:.5}), gd=mat('#5aa03a',{roughness:.5});
  const segs=[]; for(let i=0;i<6;i++) segs.push(msh(Gs(.075-i*.006,12,10),i%2?gd:gr,body,0,.07,-i*.1));
  const head=new TH.Group(); head.position.set(0,.11,.09); body.add(head); msh(Gs(.085,14,10),gr,head); eyes3(head,.035,.02,.065,.018,false);
  for(const s of [-1,1]){ const a=msh(Gc(.005,.005,.1,4),mat('#3a2a1a'),head,s*.03,.1,0); a.rotation.z=-s*.3; msh(Gs(.014,6,4),mat('#e05a7a'),head,s*.045,.15,0); }
  g.scale.setScalar(1.8);
  const o={root:g,kind:'walk',height:.4}; o.update=(dt,sp,t)=>{ const k=sp>.2?8:2; segs.forEach((s,i)=>s.position.y=.07+Math.max(0,Math.sin(t*k-i*.9))*.04); head.position.y=.11+Math.sin(t*k+.9)*.02; }; return o;
}
function bubble(inner,h){ const g=new TH.Group(); const b=msh(Gs(.32,24,16),new TH.MeshStandardMaterial({color:c3('#bfe6ff'),transparent:true,opacity:.22,roughness:.05,metalness:.1,depthWrite:false}),g,0,0,0,false); g.add(inner); const hl=msh(Gs(.06,8,6),basic('#ffffff'),g,-.12,.16,.22,false); return g; }
function buildFish(){
  const f=new TH.Group(); const or=mat('#f08a2a',{roughness:.4}), fin=mat('#f6b060',{roughness:.4,side:TH.DoubleSide});
  msh(Gs(1,16,12),or,f).scale.set(.07,.1,.15); const tl=msh(Gk(.08,.12,8),fin,f,0,0,-.17); tl.rotation.x=PI/2; tl.scale.set(.25,1,1); msh(Gk(.04,.08,6),fin,f,0,.1,-.02).scale.set(.2,1,1); eyes3(f,.05,.02,.1,.016,true);
  const g=new TH.Group(); const b=bubble(f); g.add(b); g.scale.setScalar(1.35);
  const o={root:g,kind:'float',height:1.1}; o.update=(dt,sp,t)=>{ b.position.y=.65+Math.sin(t*2)*.08; f.rotation.y=Math.sin(t*1.5)*.6; tl.rotation.y=Math.sin(t*8)*.4; }; return o; }
function buildWhale(){
  const w=new TH.Group(); const bl=mat('#3f78c8',{roughness:.45}), wh=mat('#e8f0f8',{roughness:.5});
  msh(Gs(1,18,12),bl,w).scale.set(.13,.11,.2); msh(Gs(1,14,10),wh,w,0,-.035,.02).scale.set(.1,.07,.17);
  const tl=new TH.Group(); tl.position.set(0,.02,-.2); w.add(tl); for(const s of [-1,1]) msh(Gs(1,10,8),bl,tl,s*.06,0,-.04).scale.set(.07,.015,.04);
  eyes3(w,.08,.01,.12,.016,true); const spout=[]; for(let i=0;i<5;i++) spout.push(msh(Gs(.02,6,4),mat('#cfeaff',{transparent:true,opacity:.8}),w,0,.13,0,false));
  const g=new TH.Group(); const b=bubble(w); g.add(b); g.scale.setScalar(1.45);
  const o={root:g,kind:'float',height:1.15}; o.update=(dt,sp,t)=>{ b.position.y=.68+Math.sin(t*1.6)*.08; w.rotation.y=Math.sin(t*.9)*.5; tl.rotation.x=Math.sin(t*4)*.3; spout.forEach((s,i)=>{ const p=((t*.8+i/5)%1); s.position.set(Math.sin(i*2.4)*p*.05,.12+p*.16,Math.cos(i*2.4)*p*.05); s.scale.setScalar(1-p*.5); }); }; return o; }
function starGeo(r1,r2,depth){ return geo(`star${r1}_${r2}_${depth}`,()=>{ const s=new TH.Shape(); for(let i=0;i<10;i++){ const a=PI/2+i*PI/5, r=i%2?r2:r1; const x=Math.cos(a)*r, y=Math.sin(a)*r; if(i) s.lineTo(x,y); else s.moveTo(x,y); } s.closePath(); const g=new TH.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelThickness:depth*.4,bevelSize:r2*.15,bevelSegments:2}); g.center(); return g; }); }
function buildStar(shooting){
  const g=new TH.Group(); const st=new TH.Group(); g.add(st);
  msh(starGeo(.2,.09,.06),mat('#ffd84a',{emissive:'#ffb020',emissiveIntensity:1.1,roughness:.3,metalness:.3}),st,0,0,0,false);
  eyes3(st,.045,.02,.06,.018,false); const sm=msh(Gt(.03,.006,5,10,PI),mat('#7a4a10'),st,0,-.035,.06,false); sm.rotation.z=PI;
  const glow=sprite(tx('glow'),.9); st.add(glow);
  const trail=[]; if(shooting) for(let i=0;i<8;i++) trail.push(msh(Gs(.04-i*.004,6,4),mat('#ffe9a0',{emissive:'#ffd060',emissiveIntensity:1,transparent:true,opacity:1-i*.11}),g,0,0,0,false));
  const o={root:g,kind:'float',height:1.1}; const hist=[];
  o.update=(dt,sp,t)=>{ st.position.y=.75+Math.sin(t*2)*.1; st.rotation.y=Math.sin(t*1.4)*.45; st.rotation.z=Math.sin(t*.9)*.12; if(shooting){ const wp=st.getWorldPosition(new TH.Vector3()); hist.unshift(wp); if(hist.length>40) hist.pop(); trail.forEach((m,i)=>{ const h=hist[Math.min(hist.length-1,(i+1)*4)]; if(h){ m.position.copy(g.worldToLocal(h.clone())); m.position.y-= .0; } }); } };
  return o; }
function buildFlame(){
  const g=new TH.Group(), f=new TH.Group(); g.add(f);
  const outer=msh(Gk(.18,.5,12),mat('#ff7a20',{emissive:'#ff4a00',emissiveIntensity:1.2,transparent:true,opacity:.9}),f,0,.25,0,false);
  const mid=msh(Gk(.12,.36,12),mat('#ffc040',{emissive:'#ffa000',emissiveIntensity:1.3}),f,0,.19,.03,false);
  const core=msh(Gs(.08,10,8),mat('#fff3c0',{emissive:'#fff0a0',emissiveIntensity:1.5}),f,0,.08,.05,false);
  const tongues=[-1,1].map(sx=>{ const tg=msh(Gk(.08,.26,10),mat('#ff9a30',{emissive:'#ff6a10',emissiveIntensity:1.3,transparent:true,opacity:.92}),f,sx*.11,.15,.02,false); tg.rotation.z=-sx*.35; return tg; });
  eyes3(f,.05,.12,.13,.026,false);
  const glow=sprite(tx('glow'),1.1); glow.position.y=.2; f.add(glow);
  const o={root:g,kind:'float',height:1.2}; o.update=(dt,sp,t)=>{ f.position.y=.55+Math.sin(t*2.3)*.06; outer.scale.set(1+Math.sin(t*9)*.08,1+Math.sin(t*11)*.1,1); mid.scale.y=1+Math.sin(t*13)*.12; tongues.forEach((tg,i)=>tg.scale.y=1+Math.sin(t*11+i*2)*.2); f.rotation.y=Math.sin(t)*.3; }; return o; }
function buildBoatPet(){
  const g=new TH.Group(), b=new TH.Group(); g.add(b);
  const hull=msh(geo('bhull',()=>{ const s=new TH.Shape(); s.moveTo(-.32,0); s.quadraticCurveTo(0,-.16,.32,0); s.lineTo(.36,.08); s.lineTo(-.36,.08); s.closePath(); const gg=new TH.ExtrudeGeometry(s,{depth:.2,bevelEnabled:false}); gg.translate(0,0,-.1); gg.rotateY(PI/2); return gg; }),texMat('wood',{roughness:.7}),b,0,0,0);
  msh(Gc(.012,.012,.55,6),mat('#5a3a1a'),b,0,.33,0); const sail=msh(geo('bsail',()=>{ const s=new TH.Shape(); s.moveTo(0,0); s.lineTo(0,.45); s.lineTo(.26,.02); s.closePath(); return new TH.ShapeGeometry(s); }),mat('#f6f0e2',{side:TH.DoubleSide,roughness:.9}),b,0,.1,.01); sail.rotation.y=PI/2;
  eyes3(b,.05,.04,.33,.018,false);
  const o={root:g,kind:'float',height:1}; o.update=(dt,sp,t)=>{ b.position.y=.45+Math.sin(t*1.8)*.08; b.rotation.z=Math.sin(t*1.3)*.12; b.rotation.x=Math.sin(t*1.1)*.06; }; return o; }
function buildBug(q){ const g=new TH.Group(), body=new TH.Group(); g.add(body); const m=mat(q.c,{roughness:.45}), d=mat(q.c2||hexMul(q.c,.6),{roughness:.5});
  const parts=q.ant?[[0,.1,-.14,.09],[0,.1,0,.06],[0,.12,.12,.08]]:[[0,.12,-.1,.11],[0,.13,.06,.08]]; parts.forEach(([x,y,z,r],i)=>{ const b=msh(Gs(r,12,10),i%2?d:m,body,x,y,z); if(!q.ant&&i===0) b.scale.set(.8,.8,1.6); });
  const head=new TH.Group(); head.position.set(0,.14,q.ant?.2:.16); body.add(head); msh(Gs(.07,12,10),m,head); eyes3(head,.035,.02,.05,.018,false);
  for(const s2 of [-1,1]){ const a=msh(Gc(.005,.005,.14,4),d,head,s2*.03,.08,.03); a.rotation.z=-s2*.5; a.rotation.x=.4; }
  const legs=[]; for(let i=0;i<3;i++) for(const s2 of [-1,1]){ const L2=msh(Gc(.008,.006,q.ant?.14:.2,4),d,body,s2*.08,.06,-.06+i*.07); L2.rotation.z=s2*(q.ant?1:.6); legs.push(L2); }
  if(!q.ant) for(const s2 of [-1,1]){ const hl=msh(Gc(.012,.008,.3,5),d,body,s2*.07,.2,-.08); hl.rotation.set(-.9,0,s2*.3); }
  g.scale.setScalar(q.s||2); const o={root:g,kind:q.ant?'walk':'hop',height:.4};
  o.update=(dt,sp,t)=>{ if(sp>.2){ o.ph=(o.ph||0)+dt*(q.ant?18:9); legs.forEach((l,i)=>l.rotation.x=Math.sin(o.ph+i)*.5); if(!q.ant) body.position.y=Math.max(0,Math.sin(o.ph*.5))*.12; } else { body.position.y=0; head.rotation.y=Math.sin(t*2)*.2; } }; return o; }
function buildButterfly(){ const g=new TH.Group(), b=new TH.Group(); g.add(b); const wm=new TH.MeshStandardMaterial({map:ctex(128,128,(c,w,h)=>{ const gr=c.createRadialGradient(30,64,5,40,64,80); gr.addColorStop(0,'#ffd34a'); gr.addColorStop(.6,'#f07a2a'); gr.addColorStop(1,'#3a1a10'); c.fillStyle=gr; c.beginPath(); c.ellipse(64,50,58,46,0,0,TAU); c.fill(); c.beginPath(); c.ellipse(50,100,36,26,0,0,TAU); c.fill(); c.fillStyle='#fff6d8'; for(const [x,y] of [[90,40],[100,60],[70,105]]){ c.beginPath(); c.arc(x,y,6,0,TAU); c.fill(); } }),transparent:true,side:TH.DoubleSide,alphaTest:.3,roughness:.6});
  msh(Gc(.015,.02,.22,6),mat('#2a1a10'),b,0,0,0).rotation.x=PI/2; const head=new TH.Group(); head.position.z=.12; b.add(head); msh(Gs(.03,8,6),mat('#2a1a10'),head); eyes3(head,.015,.01,.02,.01,false);
  const wings=[-1,1].map(s2=>{ const W=new TH.Group(); b.add(W); const p=msh(new TH.PlaneGeometry(.3,.3),wm,W,s2*.15,0,0,false); p.rotation.x=-PI/2; if(s2<0) p.scale.x=-1; return W; });
  g.scale.setScalar(1.6); const o={root:g,kind:'fly',height:.8}; o.update=(dt,sp,t)=>{ const f=Math.sin(t*(sp>.2?14:6)); wings[0].rotation.z=-.2-f*.9; wings[1].rotation.z=.2+f*.9; b.position.y=.7+Math.sin(t*2)*.12; b.rotation.z=Math.sin(t*1.3)*.1; }; return o; }
const PETB={
  lamb:buildLamb, camel:buildCamel, lion:buildLion, bear:buildBear, frog:buildFrog, rabbit:buildRabbit, mouse:buildMouse, dove:buildDove, turtle:buildTurtle, bee:buildBee, worm:buildWorm, fish:buildFish, whale:buildWhale, flame:buildFlame, boat:buildBoatPet,
  star:()=>buildStar(false), stars:()=>buildStar(true),
  ram:()=>quad({wool:1,fur:'#f2ece0',len:.36,r:.25,leg:.25,legR:.048,legCol:'#e8dccb',hoof:'#3a2a20',head:.15,headCol:'#efe4d2',snoutCol:'#e6d4bc',ears:'floppy',earCol:'#efe4d2',horns:'curl',hornCol:'#c9b48a',tail:'short',scale:1.05}),
  goat:()=>quad({fur:'#e8e2d8',belly:'#f6f2ea',len:.32,r:.2,leg:.28,legR:.045,hoof:'#3a2a20',head:.14,snout:1,ears:'floppy',horns:'small',hornCol:'#8a7a62',beard:'#d8d0c4',tail:'short',neck:.06,scale:1.05}),
  ox:()=>quad({fur:'#8a5a32',belly:'#a87848',len:.44,r:.28,w:.27,leg:.26,legR:.07,hoof:'#2a1a10',head:.19,snout:.9,snoutCol:'#c9a37a',nose:'#3a2a20',ears:'cow',horns:'ox',hornCol:'#efe4d0',tail:'tuft',scale:1.05}),
  cow:()=>quad({tex:'spots',fur:'#f6f2ea',belly:'#f6f2ea',len:.42,r:.26,w:.25,leg:.26,legR:.065,hoof:'#2a1a10',head:.18,headCol:'#f6f2ea',snout:.9,snoutCol:'#f2c0c0',nose:'#c08080',ears:'cow',horns:'small',hornCol:'#efe4d0',tail:'tuft',tuft:'#2a2420'}),
  deer:()=>quad({tex:'deer',fur:'#b9824a',belly:'#f2e2c6',len:.34,r:.2,leg:.38,legR:.042,hoof:'#2a1a10',head:.15,headCol:'#b9824a',snout:1,snoutCol:'#e8d4b4',ears:'pointy',earIn:'#f2e2c6',horns:'antler',hornCol:'#d8c4a0',tail:'short',neck:.1,scale:1}),
  fox:()=>quad({fur:'#e0782a',belly:'#f6f0e6',len:.3,r:.16,leg:.22,legR:.04,legCol:'#3a2418',head:.12,snout:1.3,snoutCol:'#f6f0e6',nose:'#1a120c',ears:'pointy',earIn:'#2a1a12',tail:'bushy',scale:1.2}),
  horse:()=>quad({fur:'#c8603a',belly:'#e08a5a',len:.46,r:.24,leg:.42,legR:.058,hoof:'#3a2010',head:.15,snout:1.7,snoutCol:'#a84a2a',nose:'#3a1a10',ears:'small',earIn:'#5a2010',mane:'flame',tail:'flame',neck:.2,tilt:.35,rate:3.2}),
  sparrow:()=>bird({body:'#9a7a52',wing:'#7a5a3a',headCol:'#8a6a4a',belly:'#e8dcc8',beak:'#5a4a3a',flies:true,size:.1,tail:'fan',tailCol:'#6a4a2a',scale:1.7}),
  owl:()=>bird({body:'#9a7048',wing:'#7a5032',face:'#e8d4b0',beak:'#d8a040',hook:1,flies:true,size:.14,round:1,bigEyes:1,tufts:1,tail:'fan',scale:1.5}),
  eagle:()=>bird({body:'#5a3a22',wing:'#4a2e1a',headCol:'#f6f2ea',beak:'#f0c030',hook:1,flies:true,size:.15,wingK:1.5,tail:'fan',tailCol:'#f6f2ea',scale:1.45}),
  rooster:()=>bird({body:'#e8d8c0',wing:'#c06a2a',headCol:'#e8d8c0',beak:'#e8b030',comb:1,size:.13,tail:'rooster',legCol:'#e8b030',scale:1.4}),
  peacock:()=>bird({body:'#1f5fb0',wing:'#2a6a8a',headCol:'#1f5fb0',beak:'#d8c8a0',size:.12,tail:'peacock',legCol:'#8a8a8a',scale:1.5}),
  chick:()=>bird({body:'#ffd84a',wing:'#f6c030',headCol:'#ffd84a',beak:'#f08a2a',size:.1,round:1,legCol:'#f08a2a',scale:1.5}),
  hen:()=>bird({body:'#c8823a',wing:'#a8622a',headCol:'#c8823a',beak:'#e8b030',comb:1,size:.14,round:1,legCol:'#e8b030',scale:1.4}),
  raven:()=>bird({body:'#1e1e2a',wing:'#2a2a3a',headCol:'#1e1e2a',beak:'#3a3a3a',flies:true,size:.12,tail:'fan',tailCol:'#1a1a24',scale:1.6}),
  ant:()=>buildBug({c:'#5a2a1a',c2:'#3a1a10',ant:1,s:2.4}),
  locust:()=>buildBug({c:'#8aa83a',c2:'#5a7a2a',s:2.2}),
  butterfly:buildButterfly,
  leopard:()=>quad({tex:'leopard',fur:'#e8b45a',belly:'#f6e6c0',len:.36,r:.17,leg:.28,legR:.045,head:.14,snout:1,snoutCol:'#f6e6c0',nose:'#3a1a10',ears:'round',tail:'thin',tailCol:'#c8943a',scale:1.15}),
  hippo:()=>quad({fur:'#8a8aa0',belly:'#b8a0a8',len:.46,r:.3,w:.3,leg:.18,legR:.08,head:.2,snout:1.1,snoutCol:'#a8909a',nose:'#5a4a5a',ears:'round',tail:'short',scale:1.05}),
  donkey:()=>quad({fur:'#8a8a8a',belly:'#d8d0c8',len:.38,r:.2,leg:.36,legR:.045,hoof:'#2a2420',head:.14,snout:1.4,snoutCol:'#d8d0c8',nose:'#2a2420',ears:'long',earIn:'#5a5050',mane:'horse',maneCol:'#3a3430',tail:'tuft',neck:.12,tilt:.3}),
  wolf:()=>quad({fur:'#8a8a90',belly:'#e8e8ea',len:.34,r:.17,leg:.3,legR:.04,head:.13,snout:1.4,snoutCol:'#e8e8ea',nose:'#1a1a1a',ears:'pointy',earIn:'#5a5a5a',tail:'bushy',scale:1.2}),
  puppy:()=>quad({fur:'#d89a5a',belly:'#f6ecd8',len:.26,r:.15,leg:.2,legR:.04,head:.13,snout:1,snoutCol:'#f6ecd8',nose:'#1a120c',ears:'floppy',earCol:'#a86a3a',tail:'short',scale:1.25})
};
function buildPet(id){ const f=PETB[id]||PETB.lamb; const o=f(); o.id=id; o.root.traverse(x=>{ if(x.isMesh&&x.castShadow!==false) x.castShadow=true; }); return o; }

/* ===================== GLOOMLINGS ===================== */
function gloomCore(color,o={}){
  const g=new TH.Group(), inner=new TH.Group(); g.add(inner);
  const m=new TH.MeshStandardMaterial({color:c3(color),emissive:c3(hexMul(color,.35)),roughness:.35,metalness:.05,side:TH.DoubleSide});
  const top=msh(geo('gtop',()=>new TH.SphereGeometry(.45,28,14,0,TAU,0,PI/2)),m,inner,0,.6,0);
  const sk=new TH.CylinderGeometry(.45,.52,.42,36,3,true); const base=sk.attributes.position.array.slice(); msh(sk,m,inner,0,.39,0);
  const white=mat('#fbfbf6',{roughness:.25}), pup=mat('#120820',{roughness:.2});
  const eyes=new TH.Group(); eyes.position.set(0,.66,.37); inner.add(eyes);
  const n=o.eyes||2;
  if(n===1){ const w=msh(Gs(.2,18,14),white,eyes,0,0,0,false); w.scale.set(1,1.1,.6); msh(Gs(.1,14,10),pup,eyes,0,-.01,.08,false).scale.set(1,1.1,.5); msh(Gs(.025,6,4),basic('#ffffff'),eyes,.04,.04,.13,false); const br=msh(Gb(.34,.04,.04),pup,eyes,0,.24,.04,false); br.rotation.z=.1; }
  else { const xs=n===3?[-.2,0,.2]:[-.14,.14]; xs.forEach((x,i)=>{ const w=msh(Gs(.085,14,10),white,eyes,x,n===3&&i===1?.08:0,0,false); w.scale.set(1,1.25,.6); if(o.eyeCol) w.material=mat(o.eyeCol,{roughness:.25,emissive:o.eyeCol,emissiveIntensity:.25}); msh(Gs(.042,10,8),pup,eyes,x-.01,(n===3&&i===1?.08:0)-.01,.04,false).scale.set(1,1.1,.5); msh(Gs(.012,6,4),basic('#ffffff'),eyes,x+.005,(n===3&&i===1?.08:0)+.02,.065,false); });
    for(const s of [-1,1]){ const br=msh(Gb(.13,.028,.03),pup,eyes,s*.15,.12,.03,false); br.rotation.z=s*-.4; } }
  if(!o.noMouth){ const mo=msh(Gt(.06,.012,6,14,PI),pup,inner,0,.47,.42,false); }
  return {root:g,inner,eyes,mat:m,sk,base,t0:Math.random()*10};
}
function gloomTick(G,t){ const pa=G.sk.attributes.position; for(let i=0;i<pa.count;i++){ const by=G.base[i*3+1]; if(by<-.2){ const x=G.base[i*3], z=G.base[i*3+2]; const a=Math.atan2(z,x); pa.setY(i,by+Math.sin(a*7+t*4)*.05-Math.abs(Math.sin(a*14))*.07); } } pa.needsUpdate=true; G.eyes.scale.y=(Math.sin(t*1.7+G.t0)>.985)?.15:1; }
function buildFoe(shape,color){
  const G=gloomCore(color,{eyes:shape==='eye'?1:2}); const I=G.inner;
  if(shape==='horned') for(const s of [-1,1]){ const h=msh(Gk(.08,.32,8),mat('#efe4d0',{roughness:.5}),I,s*.24,1.02,0); h.rotation.z=-s*.45; }
  if(shape==='spiky'){ const sm=mat(hexMul(color,.6),{roughness:.4}); for(let i=0;i<9;i++){ const a=-PI*.45+i/8*PI*.9; const sp=msh(Gk(.07,.26,6),sm,I,Math.sin(a)*.42,.62+Math.cos(a)*.42,-.05); sp.rotation.z=-a; } }
  if(shape==='drip'){ for(let i=0;i<5;i++){ const a=i/5*TAU+.3; const d=msh(Gs(.06,8,6),G.mat,I,Math.cos(a)*.42,.12-(i%2)*.06,Math.sin(a)*.42); d.scale.set(1,1.8,1); } }
  if(shape==='wisp'){ const tip=msh(Gk(.3,.5,16),G.mat,I,0,1.2,-.04); tip.rotation.x=-.25; const glow=sprite(tx('glow'),1.6); glow.position.y=.7; glow.material.opacity=.35; I.add(glow); }
  if(shape==='eye'){ for(let i=0;i<4;i++){ const a=i/4*TAU+.4; const d=msh(Gs(.07,8,6),G.mat,I,Math.cos(a)*.3,.14,Math.sin(a)*.3); d.scale.set(1,2.2,1); } }
  const motes=[]; for(let i=0;i<3;i++) motes.push(msh(Gs(.04,6,4),mat(hexMul(color,.5),{emissive:color,emissiveIntensity:.5,transparent:true,opacity:.7}),G.root,0,0,0,false));
  G.update=(dt,t)=>{ I.position.y=.12+Math.sin(t*2.2+G.t0)*.07; gloomTick(G,t+G.t0); motes.forEach((m,i)=>{ const a=t*.9+i*2.1+G.t0; m.position.set(Math.cos(a)*.7,.6+Math.sin(t*1.7+i)*.25,Math.sin(a)*.7); }); };
  G.root.traverse(x=>{ if(x.isMesh&&x.castShadow!==false) x.castShadow=true; });
  return G;
}
function buildBoss3(kind,color){
  let G;
  const gold=mat('#e8b94a',{roughness:.3,metalness:.85}), stone=texMat('stone',{roughness:.9});
  const simple=(o)=>{ G=gloomCore(color,o); G.update=(dt,t)=>{ G.inner.position.y=.12+Math.sin(t*1.8)*.06; gloomTick(G,t); }; return G; };
  if(kind==='serpent'){ simple({eyeCol:'#f8e36a'}); const pts=[]; for(let i=0;i<40;i++){ const a=i*.35; pts.push(new TH.Vector3(Math.cos(a)*(.45+i*.006),.12+i*.004,Math.sin(a)*(.45+i*.006)-.35)); } const tube=msh(new TH.TubeGeometry(new TH.CatmullRomCurve3(pts),80,.08,8,false),mat(hexMul(color,.8),{roughness:.4}),G.root,0,0,0); const tg=msh(Gb(.02,.02,.16),mat('#d0302a'),G.inner,0,.42,.48); }
  else if(kind==='mocker'){ simple({noMouth:1}); msh(geo('grin',()=>new TH.CircleGeometry(.2,20,PI,PI)),mat('#140a20',{side:TH.DoubleSide}),G.inner,0,.48,.43,false); for(let i=0;i<5;i++) msh(Gb(.05,.04,.02),mat('#ffffff'),G.inner,-.12+i*.06,.465,.445,false); }
  else if(kind==='heart'){ simple({eyeCol:'#ffd27a'}); const n=msh(geo('nemes',()=>new TH.CylinderGeometry(.3,.55,.55,4,1,true)),new TH.MeshStandardMaterial({map:tx('nemes'),roughness:.5,side:TH.DoubleSide}),G.inner,0,.85,-.05); n.rotation.y=PI/4; msh(Gc(.1,.12,.18,10),gold,G.inner,0,1.15,0); }
  else if(kind==='calf'){ G={root:new TH.Group()}; const I=new TH.Group(); G.root.add(I); G.inner=I; const cm=mat('#f0c64a',{roughness:.25,metalness:.9,emissive:'#5a3a00'}); msh(Gb(1.1,.25,.7),stone,I,0,.12,0); const body=msh(Gs(1,20,14),cm,I,0,.85,0); body.scale.set(.32,.3,.5); for(const [x,z] of [[-.18,.3],[.18,.3],[-.18,-.3],[.18,-.3]]) msh(Gc(.06,.05,.45,8),cm,I,x,.45,z); const hd=msh(Gs(.2,16,12),cm,I,0,1.12,.48); for(const s of [-1,1]){ const h=msh(Gt(.12,.03,6,12,PI*.8),cm,I,s*.16,1.3,.42); h.rotation.set(0,PI/2,s>0?-.3:PI+.3); } for(const s of [-1,1]) msh(Gs(.04,8,6),mat('#ff4a3a',{emissive:'#ff2a1a',emissiveIntensity:1.5}),I,s*.08,1.15,.66,false); G.mat=cm; G.update=(dt,t)=>{ I.rotation.y=Math.sin(t*.6)*.15; }; }
  else if(kind==='walls'){ G={root:new TH.Group(),cracks:[]}; const I=new TH.Group(); G.root.add(I); G.inner=I; const wm=texMat('stone',{roughness:.95}); msh(Gb(2,1.6,.6),wm,I,0,.8,0); for(let i=0;i<5;i++) msh(Gb(.28,.28,.6),wm,I,-.8+i*.4,1.74,0); msh(geo('wdoor',()=>new TH.CircleGeometry(.35,16,0,PI)),mat('#2a1a10'),I,0,0,.31,false); const E=new TH.Group(); E.position.set(0,1.05,.31); I.add(E); for(const s of [-1,1]){ msh(Gs(.12,14,10),mat('#ffd27a',{emissive:'#ffb040',emissiveIntensity:.6}),E,s*.3,0,0,false).scale.set(1,1.2,.4); msh(Gs(.06,10,8),mat('#120820'),E,s*.3,0,.04,false).scale.set(1,1,.4); const b=msh(Gb(.24,.05,.04),mat('#3a2a1a'),E,s*.3,.2,.02,false); b.rotation.z=s*-.4; } G.eyes=E;
    const cm=mat('#2a1a0a'); for(let i=0;i<7;i++){ const c=new TH.Group(); c.visible=false; c.position.set(-.85+((i*37)%100)/100*1.7,.3+((i*53)%100)/100*1.2,.31); I.add(c); for(let k=0;k<3;k++){ const s=msh(Gb(.03,.18,.01),cm,c,k*.04,-k*.12,0,false); s.rotation.z=(k%2?.6:-.5); } G.cracks.push(c); }
    G.update=(dt,t)=>{ G.eyes.scale.y=(Math.sin(t*1.3)>.98)?.15:1; }; G.setMarches=n=>G.cracks.forEach((c,i)=>c.visible=i<n); }
  else if(kind==='giant'){ simple({eyeCol:'#ffbf6a'}); G.inner.scale.set(1,1.45,1); const hm=msh(geo('ghelm',()=>new TH.SphereGeometry(.48,20,10,0,TAU,0,PI*.45)),mat('#b8862e',{roughness:.3,metalness:.8}),G.inner,0,.62,0); msh(Gb(.06,.25,.06),mat('#b8862e',{metalness:.8,roughness:.3}),G.inner,0,1.1,0); const sp=new TH.Group(); sp.position.set(.6,.8,.1); G.inner.add(sp); msh(Gc(.025,.025,1.6,6),mat('#7a5a3a'),sp); msh(Gk(.06,.22,6),mat('#c9ced8',{metalness:.9,roughness:.2}),sp,0,.9,0); }
  else if(kind==='idol'){ G={root:new TH.Group()}; const I=new TH.Group(); G.root.add(I); G.inner=I; const gm=mat('#f0c64a',{roughness:.25,metalness:.9,emissive:'#4a3000'}); msh(Gb(.9,.3,.9),stone,I,0,.15,0); msh(lathe('idolb',[[0,0],[.3,0],[.36,.9],[.24,1.1],[0,1.1]]),gm,I,0,.3,0); msh(Gs(.22,16,12),gm,I,0,1.62,0); for(const s of [-1,1]){ const a=msh(Gc(.06,.06,.5,8),gm,I,s*.33,1.15,.1); a.rotation.z=s*.6; } for(const s of [-1,1]) msh(Gs(.04,8,6),mat('#ff4a3a',{emissive:'#ff2a1a',emissiveIntensity:1.5}),I,s*.08,1.65,.2,false); msh(Gc(.24,.22,.12,16),gm,I,0,1.86,0); G.mat=gm; G.update=(dt,t)=>{}; }
  else if(kind==='night'){ simple({eyeCol:'#cfd8ff'}); const pts=[]; for(let i=0;i<14;i++){ const a=i*2.4, d=.15+((i*37)%60)/200; pts.push(msh(Gs(.02,6,4),mat('#ffffff',{emissive:'#cfd8ff',emissiveIntensity:1.5}),G.inner,Math.cos(a)*d,.55+Math.sin(i*1.3)*.15,Math.sin(a)*d+.35,false)); } const u=G.update; G.update=(dt,t)=>{ u(dt,t); pts.forEach((p,i)=>p.scale.setScalar(.6+Math.abs(Math.sin(t*3+i)))); }; }
  else if(kind==='storm'){ G={root:new TH.Group()}; const I=new TH.Group(); G.root.add(I); G.inner=I; const cm=mat('#5a6478',{roughness:.9}); [[-.45,.9,0,.4],[0,1.05,0,.5],[.45,.9,0,.4],[-.2,.75,.15,.35],[.25,.75,.15,.35]].forEach(([x,y,z,r])=>msh(Gs(r,14,10),cm,I,x,y,z)); const E=new TH.Group(); E.position.set(0,.95,.45); I.add(E); for(const s of [-1,1]){ msh(Gs(.08,10,8),mat('#e6f0ff',{emissive:'#a0c0ff',emissiveIntensity:.6}),E,s*.15,0,0,false).scale.set(1,1.2,.5); } G.eyes=E;
    const bolt=new TH.Group(); I.add(bolt); const bm=mat('#ffe26a',{emissive:'#ffd020',emissiveIntensity:2}); let y=.6; for(let i=0;i<4;i++){ const s=msh(Gb(.04,.22,.04),bm,bolt,(i%2?.06:-.06),y-.1,0,false); s.rotation.z=(i%2?.5:-.5); y-=.2; } G.update=(dt,t)=>{ bolt.visible=Math.sin(t*6)>.3; I.position.y=Math.sin(t*1.5)*.06; }; }
  else if(kind==='doubt'){ simple({eyes:3,eyeCol:'#e9d6ff'}); const rings=[0,1,2].map(i=>{ const r=msh(Gt(.7+i*.15,.025,6,40,PI*1.6),mat('#9670dc',{emissive:'#6a40b0',emissiveIntensity:.6,transparent:true,opacity:.7}),G.root,0,.6,0,false); r.rotation.x=PI/2+i*.3; return r; }); const u=G.update; G.update=(dt,t)=>{ u(dt,t); rings.forEach((r,i)=>r.rotation.z=t*(i%2?-1:1)*(.6+i*.2)); }; }
  else if(kind==='tower'){ G={root:new TH.Group()}; const I=new TH.Group(); G.root.add(I); G.inner=I; const bm=texMat('brick'); for(let i=0;i<5;i++){ const w=1.4-i*.24; msh(Gb(w,.42,w),bm,I,0,.21+i*.42,0); } const E=new TH.Group(); E.position.set(0,.75,.71); I.add(E); for(const s of [-1,1]){ msh(Gs(.09,10,8),mat('#ffcf6a',{emissive:'#ffa030',emissiveIntensity:.6}),E,s*.2,0,0,false).scale.set(1,1.2,.4); msh(Gs(.045,8,6),mat('#120820'),E,s*.2,0,.03,false); } G.eyes=E; G.update=(dt,t)=>{ E.scale.y=(Math.sin(t*1.5)>.98)?.15:1; }; }
  else if(kind==='jealous'){ simple({eyeCol:'#9fe85a'}); }
  else if(kind==='famine'){ simple({eyeCol:'#cfd8ff'}); for(let i=0;i<6;i++){ const a=i/6*TAU; const s=msh(Gc(.012,.012,.6,4),mat('#9a8a5a'),G.root,Math.cos(a)*.75,.3,Math.sin(a)*.75); s.rotation.z=.3; s.rotation.y=a; } }
  else if(kind==='altar'){ G={root:new TH.Group()}; const I=new TH.Group(); G.root.add(I); G.inner=I; for(let i=0;i<12;i++){ msh(Gb(.34,.2,.34),stone,I,-.54+(i%4)*.36,.1+Math.floor(i/4)*.2,-.18+((i>>2)%2)*.0); } const F=new TH.Group(); F.position.y=.7; I.add(F); const fo=msh(Gk(.45,1.1,12),mat('#e0402a',{emissive:'#c02010',emissiveIntensity:1.2,transparent:true,opacity:.9}),F,0,.5,0,false); const fi=msh(Gk(.28,.7,12),mat('#ff9a30',{emissive:'#ff7a10',emissiveIntensity:1.3}),F,0,.35,.05,false); const E=new TH.Group(); E.position.set(0,.45,.28); F.add(E); for(const s of [-1,1]) msh(Gs(.07,10,8),mat('#ffe26a',{emissive:'#ffd020',emissiveIntensity:1}),E,s*.12,0,0,false).scale.set(1,1.2,.5); G.update=(dt,t)=>{ fo.scale.set(1+Math.sin(t*8)*.06,1+Math.sin(t*10)*.1,1); fi.scale.y=1+Math.sin(t*12)*.12; }; }
  else if(kind==='whirl'){ G={root:new TH.Group()}; const I=new TH.Group(); G.root.add(I); G.inner=I; const rings=[]; for(let i=0;i<5;i++){ rings.push(msh(Gt(1.0-i*.17,.07,8,40,PI*1.5),mat(['#2a5a8a','#3a7ab0','#5a9ad0','#8ac0e8','#cfe6ff'][i],{roughness:.2,metalness:.2,transparent:true,opacity:.85}),I,0,.2+i*.2,0,false)); rings[i].rotation.x=PI/2; } const core=msh(Gs(.32,16,12),mat(color,{emissive:hexMul(color,.4)}),I,0,.9,0); const E=new TH.Group(); E.position.set(0,.95,.28); I.add(E); for(const s of [-1,1]){ msh(Gs(.07,10,8),mat('#e6f0ff'),E,s*.12,0,0,false).scale.set(1,1.2,.5); msh(Gs(.035,8,6),mat('#120820'),E,s*.12,0,.03,false); } G.update=(dt,t)=>rings.forEach((r,i)=>r.rotation.z=t*(1.5+i*.4)); }
  else if(kind==='scroll'){ G={root:new TH.Group()}; const I=new TH.Group(); G.root.add(I); G.inner=I; msh(Gb(1.3,1.6,.04),new TH.MeshStandardMaterial({map:tx('writing'),roughness:.9}),I,0,1,0); for(const y of [.18,1.82]){ const r=msh(Gc(.1,.1,1.5,16),mat('#b8a070'),I,0,y,0); r.rotation.z=PI/2; } msh(Gs(.13,12,10),mat('#a0201a',{roughness:.4}),I,.4,.45,.04).scale.set(1,1,.3); const E=new TH.Group(); E.position.set(0,1.25,.04); I.add(E); for(const s of [-1,1]){ msh(Gs(.1,12,10),mat('#ff6a5a',{emissive:'#d02010',emissiveIntensity:.5}),E,s*.22,0,0,false).scale.set(1,1.1,.3); msh(Gs(.05,8,6),mat('#120820'),E,s*.22,0,.02,false).scale.set(1,1,.3); } G.update=(dt,t)=>{ I.position.y=Math.sin(t*1.4)*.05; I.rotation.z=Math.sin(t*.9)*.04; }; }
  else if(kind==='mute'){ simple({noMouth:1,eyeCol:'#dfe6f0'}); const lm=mat('#dfe6f0'); msh(Gb(.4,.02,.02),lm,G.inner,0,.46,.43,false); for(let i=0;i<6;i++) msh(Gb(.015,.1,.02),lm,G.inner,-.17+i*.068,.46,.44,false); }
  else if(kind==='chains'){ simple({eyeCol:'#ffd27a'}); const cm=mat('#b8bcc8',{roughness:.3,metalness:.85}); for(let k=0;k<2;k++) for(let i=0;i<9;i++){ const a=i/9*PI+(k?PI*.1:0); const l=msh(Gt(.07,.018,6,12),cm,G.inner,Math.cos(a)*(.48),.35+i*.07+(k?.15:0),Math.sin(a)*(.48)*(k?-1:1)+.05,false); l.rotation.set(i%2?PI/2:0,a,0); } }
  else if(kind==='horde'){ simple({eyeCol:'#ffcf6a'}); const extra=[[-.85,.1,.6],[.85,.1,.6],[-.45,.3,-.5],[.5,.25,-.55]].map(([x,z,zz])=>{ const H2=gloomCore(hexMul(color,.75),{eyeCol:'#ffcf6a'}); H2.root.scale.setScalar(.6); H2.root.position.set(x,0,z+zz*.4); G.root.add(H2.root); return H2; }); const u=G.update; G.update=(dt,t)=>{ u(dt,t); extra.forEach((H2,i)=>{ H2.inner.position.y=.1+Math.sin(t*2+i)*.06; gloomTick(H2,t+i); }); }; }
  else if(kind==='pride'){ simple({eyeCol:'#ffd27a'}); G.inner.scale.set(1.15,1.2,1.15); const cr=new TH.Group(); cr.position.y=1.08; G.inner.add(cr); msh(Gc(.3,.32,.14,16,true),mat('#f0c64a',{roughness:.3,metalness:.85,side:TH.DoubleSide}),cr); for(let i=0;i<7;i++){ const a=i/7*TAU; msh(Gk(.05,.16,6),gold,cr,Math.sin(a)*.3,.13,Math.cos(a)*.3); } for(const sx of [-1,1]){ const br=msh(Gc(.05,.035,.7,6),mat(hexMul(color,.6)),G.inner,sx*.45,.5,-.1); br.rotation.z=sx*.25; } }
  else if(kind==='rubble'){ G={root:new TH.Group()}; const I=new TH.Group(); G.root.add(I); G.inner=I; const R0=rng(9); for(let i=0;i<14;i++){ const b=msh(Gb(.45,.3,.4),stone,I,(R0()-.5)*1.4,.15+Math.floor(i/5)*.28,(R0()-.5)*.8); b.rotation.y=R0(); } const C=gloomCore(color,{eyeCol:'#dfe6f0'}); C.root.scale.setScalar(.75); C.root.position.y=.75; I.add(C.root); G.mat=C.mat; G.update=(dt,t)=>{ C.inner.position.y=.1+Math.sin(t*1.6)*.05; gloomTick(C,t); }; }
  else if(kind==='lost'){ simple({eyeCol:'#cfe3ff'}); const fog=[]; for(let i=0;i<5;i++){ const f=msh(Gs(.45,12,8),mat('#c8d0e0',{transparent:true,opacity:.35,depthWrite:false}),G.root,0,.2,0,false); f.scale.set(1.4,.35,1); fog.push(f); } const q=sprite(labelTex('?',{fs:80,bg:'rgba(0,0,0,0)',fg:'#f6de98'}).tex,.6); q.position.set(.6,1.3,0); G.root.add(q); const u=G.update; G.update=(dt,t)=>{ u(dt,t); fog.forEach((f,i)=>f.position.set(Math.cos(t*.5+i*1.3)*.7,.15+i*.05,Math.sin(t*.5+i*1.3)*.5)); q.position.y=1.3+Math.sin(t*2)*.08; }; }
  else simple({});
  if(!G.update) G.update=()=>{};
  G.root.traverse(x=>{ if(x.isMesh&&x.castShadow!==false) x.castShadow=true; });
  return G;
}

/* ===================== MAP PIECES: obstacles & deco (instanced buckets) ===================== */
function Bucket(){ this.map=new Map(); }
Bucket.prototype.add=function(key,geoF,matF,it){ if(this.tk!=null) it.tk=this.tk; let b=this.map.get(key); if(!b){ b={geo:geoF(),mat:matF(),list:[],cast:true}; this.map.set(key,b); } b.list.push(it); return b; };
Bucket.prototype.build=function(parent,noCast){ const m4=new TH.Matrix4(), q=new TH.Quaternion(), p=new TH.Vector3(), s=new TH.Vector3(), e=new TH.Euler(0,0,0,'YXZ');
  this.map.forEach((b,key)=>{ if(!b.list.length) return; const im=new TH.InstancedMesh(b.geo,b.mat,b.list.length);
    b.list.forEach((it,i)=>{ p.set(it.x,it.y||0,it.z); e.set(it.rx||0,it.ry||0,it.rz||0,'YXZ'); q.setFromEuler(e); const sc=it.s||1; s.set(it.sx||sc,it.sy||sc,it.sz||sc); m4.compose(p,q,s); im.setMatrixAt(i,m4); if(it.c) im.setColorAt(i,c3(it.c)); if(it.tk!=null&&this.byTile){ let L=this.byTile.get(it.tk); if(!L) this.byTile.set(it.tk,L=[]); L.push({im,i,m:m4.clone(),cx:it.cx,cz:it.cz}); } });
    if(im.instanceColor) im.instanceColor.needsUpdate=true; im.castShadow=!noCast&&b.cast!==false&&!b.noCast; im.receiveShadow=true; parent.add(im); }); };
const WHITE=()=>mat('#ffffff',{roughness:.9,flatShading:true});
const WHITE_S=()=>mat('#ffffff',{roughness:.85});
function frondGeo(){ return geo('frond',()=>{ const g=new TH.PlaneGeometry(.38,1.6,1,6); g.translate(0,.8,0); const p=g.attributes.position; for(let i=0;i<p.count;i++){ const y=p.getY(i), t=y/1.6; p.setX(i,p.getX(i)*(Math.sin(PI*Math.min(1,t*1.05))*.9+.1)); p.setZ(i,-t*t*.65); } g.computeVertexNormals(); return g; }); }
function placeObstacle(Bk,kind,x,z,h,variant){
  const R=rng(Math.floor(h*1e9)); const rr=(a,b)=>a+R()*(b-a); const ry=R()*TAU;
  const leaf=['#3f8a3a','#4a9a42','#38803a','#56a046'], olive=['#7f9a5a','#8aa364','#6f8a4e','#93a86e'];
  if(kind==='tree'||kind==='fruit'){ const s=rr(.85,1.15); Bk.add('trunk',()=>Gc(.12,.18,1,7),()=>mat('#6b4423',{roughness:.95,flatShading:true}),{x,y:.5*s,z,s,ry});
    for(let i=0;i<4;i++){ const a=i/4*TAU+ry; Bk.add('canopy',()=>Gi(1,1),WHITE,{x:x+Math.cos(a)*.3*(i?1:0),y:(1.35+R()*.35)*s,z:z+Math.sin(a)*.3*(i?1:0),s:rr(.45,.65)*s,c:leaf[(i+(h*10|0))%4],ry:R()*3}); }
    if(kind==='fruit') for(let i=0;i<5;i++){ const a=R()*TAU; Bk.add('fruit',()=>Gs(1,8,6),()=>mat('#ffffff',{roughness:.5}),{x:x+Math.cos(a)*.5*s,y:(1.15+R()*.5)*s,z:z+Math.sin(a)*.5*s,s:.075,c:h>.5?'#e04a3a':'#f0b03a'}); } }
  else if(kind==='olive'){ const s=rr(.85,1.1); Bk.add('trunkO',()=>Gc(.1,.17,1,6),()=>mat('#8a7a62',{roughness:.95,flatShading:true}),{x,y:.45*s,z,s,ry,rz:rr(-.2,.2)}); for(let i=0;i<3;i++){ const a=i/3*TAU+ry; Bk.add('canopy',()=>Gi(1,1),WHITE,{x:x+Math.cos(a)*.28,y:(1.15+R()*.3)*s,z:z+Math.sin(a)*.28,s:rr(.38,.55)*s,c:olive[i%4],ry:R()*3}); } }
  else if(kind==='pine'){ const s=rr(.85,1.2); Bk.add('trunkP',()=>Gc(.08,.12,.6,6),()=>mat('#5a3a1e',{roughness:.95}),{x,y:.3,z}); for(let i=0;i<3;i++) Bk.add('pine',()=>Gk(1,1,8),WHITE,{x,y:(.75+i*.45)*s,z,sx:(.62-i*.14)*s,sy:.9*s,sz:(.62-i*.14)*s,c:['#2f6a45','#356f4a','#2a5f3f'][i],ry}); }
  else if(kind==='palm'){ const ht=rr(2.1,2.9), lean=rr(-.18,.18); Bk.add('palmT',()=>Gc(.09,.14,1,7),()=>mat('#9a7a52',{roughness:.95,flatShading:true}),{x:x-Math.sin(lean)*ht/2,y:ht/2,z,sy:ht,rz:lean}); const tx_=x-Math.sin(lean)*ht; for(let j=0;j<7;j++) Bk.add('frond',frondGeo,()=>mat('#ffffff',{roughness:.85,side:TH.DoubleSide}),{x:tx_,y:ht,z,ry:j/7*TAU+R()*.3,rx:-1.1+rr(-.15,.15),s:rr(.85,1.1),c:['#4f9a3a','#5aa846','#43893a'][j%3]}); for(let j=0;j<3;j++) Bk.add('coco',()=>Gs(1,8,6),()=>mat('#6b4a2a'),{x:tx_+rr(-.1,.1),y:ht-.12,z:z+rr(-.1,.1),s:.07}); }
  else if(kind==='rock'){ const n=1+(R()<.4?1:0); for(let i=0;i<n;i++) Bk.add('rock',()=>new TH.DodecahedronGeometry(1,0),()=>mat('#ffffff',{roughness:.95,flatShading:true}),{x:x+rr(-.2,.2),y:.15,z:z+rr(-.2,.2),s:rr(.3,.5)*(i?.6:1),sy:rr(.5,.8)*(i?.6:1),ry:R()*TAU,c:['#a59c8c','#b8ad98','#958c7c','#c2b8a4'][(h*7|0)%4]}); }
  else if(kind==='cactus'){ const s=rr(.8,1.1); Bk.add('cactus',()=>Gc(.12,.13,1.3,8),()=>mat('#4f9a4a',{roughness:.7}),{x,y:.65*s,z,s}); Bk.add('cactusTop',()=>Gs(1,8,6),()=>mat('#4f9a4a',{roughness:.7}),{x,y:1.3*s,z,s:.12*s}); for(const sd of [-1,1]){ Bk.add('cactus',()=>Gc(.12,.13,1.3,8),()=>mat('#4f9a4a',{roughness:.7}),{x:x+sd*.25*s,y:.85*s,z,sx:.6*s,sy:.35*s,sz:.6*s}); Bk.add('cactus',()=>Gc(.12,.13,1.3,8),()=>mat('#4f9a4a',{roughness:.7}),{x:x+sd*.14*s,y:.65*s,z,sx:.6*s,sy:.18*s,sz:.6*s,rz:PI/2}); } }
  else if(kind==='bush'){ for(let i=0;i<3;i++) Bk.add('bush',()=>Gi(1,1),WHITE,{x:x+rr(-.25,.25),y:.3,z:z+rr(-.25,.25),s:rr(.3,.45),sy:rr(.28,.38),c:['#4f9a4a','#5aa850','#468a40','#6aae52'][i]}); }
  else if(kind==='brick'){ Bk.add('brick',()=>Gb(TL*.98,1.05,TL*.98),()=>texMat('brick',{roughness:.95}),{x,y:.52,z}); Bk.add('brickTop',()=>Gb(TL,.08,TL),()=>mat('#d9a96a',{roughness:.9}),{x,y:1.08,z}); }
  else if(kind==='house'){ const hh=rr(1.1,1.6); Bk.add('hut',()=>Gb(TL*.92,1,TL*.92),()=>texMat('plaster',{roughness:.95}),{x,y:hh/2,z,sy:hh}); Bk.add('hutTop',()=>Gb(TL,.1,TL),()=>mat('#cbb894'),{x,y:hh+.05,z}); Bk.add('hutDoor',()=>Gb(.32,.62,.04),()=>mat('#5a3a1e'),{x,y:.31,z:z+TL*.47}); Bk.add('hutWin',()=>Gb(.22,.2,.04),()=>mat('#2a1e14'),{x:x+.3,y:hh*.66,z:z+TL*.47}); }
}
function placeDeco(Bk,kind,x,z,h){
  const R=rng(Math.floor(h*1e9)+7); const rr=(a,b)=>a+R()*(b-a);
  if(kind==='flower'){ const cs=['#f5d04a','#f07aa8','#ffffff','#b48af0','#ff9a6a']; for(let i=0;i<4;i++){ const xx=x+rr(-.45,.45), zz=z+rr(-.45,.45); Bk.add('stem',()=>Gc(.008,.01,.22,4),()=>mat('#4f8a3a'),{x:xx,y:.11,z:zz}); Bk.add('bloom',()=>Gs(1,8,6),()=>mat('#ffffff',{roughness:.6}),{x:xx,y:.23,z:zz,s:.055,c:cs[(i+(h*10|0))%5]}); } }
  else if(kind==='grass'){ for(let i=0;i<5;i++) Bk.add('tuft',()=>Gk(.05,.28,3),()=>mat('#ffffff',{roughness:1}),{x:x+rr(-.5,.5),y:.12,z:z+rr(-.5,.5),s:rr(.8,1.3),sy:rr(.9,1.6),ry:R()*3,c:['#4f8a3a','#5f9a44','#3f7a30'][i%3]}); }
  else if(kind==='pebble'){ for(let i=0;i<4;i++) Bk.add('pebble',()=>new TH.DodecahedronGeometry(1,0),()=>mat('#ffffff',{roughness:.95,flatShading:true}),{x:x+rr(-.45,.45),y:.03,z:z+rr(-.45,.45),s:rr(.05,.1),sy:rr(.03,.05),ry:R()*3,c:['#a59c8c','#8a7a62','#c2b8a4'][i%3]}); }
  else if(kind==='reed'){ for(let i=0;i<5;i++){ const xx=x+rr(-.4,.4), zz=z+rr(-.4,.4), hh=rr(.5,.8); Bk.add('reed',()=>Gc(.012,.016,1,4),()=>mat('#6f8a3a'),{x:xx,y:hh/2,z:zz,sy:hh,rz:rr(-.1,.1)}); if(i%2) Bk.add('cattail',()=>Gc(.03,.03,.14,6),()=>mat('#7a5a2a'),{x:xx,y:hh-.05,z:zz}); } }
  else if(kind==='wheat'){ for(let i=0;i<7;i++){ const xx=x+rr(-.45,.45), zz=z+rr(-.45,.45), hh=rr(.45,.65); Bk.add('stalk',()=>Gc(.008,.01,1,4),()=>mat('#c9a24a'),{x:xx,y:hh/2,z:zz,sy:hh,rz:rr(-.12,.12)}); Bk.add('ear',()=>Gs(1,6,6),()=>mat('#e0bf5a',{roughness:.9}),{x:xx,y:hh,z:zz,sx:.03,sy:.08,sz:.03}); } }
}

/* ===================== LANDMARKS ===================== */
function signMesh(text,w,h,bg='#5a3a1e'){ const T=ctex(512,128,(g,W,H)=>{ g.fillStyle=bg; g.fillRect(0,0,W,H); g.strokeStyle='#e8b94a'; g.lineWidth=8; g.strokeRect(6,6,W-12,H-12); g.fillStyle='#f6de98'; g.font='60px "Uncial Antiqua", Georgia, serif'; g.textAlign='center'; g.textBaseline='middle'; let fs=60; while(g.measureText(text).width>W-40&&fs>20){ fs-=4; g.font=`${fs}px "Uncial Antiqua", Georgia, serif`; } g.fillText(text,W/2,H/2+4); }); return new TH.Mesh(new TH.PlaneGeometry(w,h),new TH.MeshStandardMaterial({map:T,roughness:.8})); }
function jarGeo(){ return lathe('jar',[[0,0],[.12,.01],[.2,.12],[.22,.28],[.17,.42],[.09,.5],[.08,.58],[.11,.6],[0,.6]],18); }
function buildLandmark(lm,ctx){
  // ctx: {stage(chId), t, sign(key)} ; returns {root, update?}
  const W=lm.w*TL, D=lm.h*TL, g=new TH.Group(); g.position.set((lm.x+lm.w/2)*TL,0,(lm.y+lm.h/2)*TL);
  const k=lm.k, stone=texMat('stone',{roughness:.9}), plaster=texMat('plaster',{roughness:.95}), wood=texMat('wood',{roughness:.8}), gold=mat('#e8b94a',{roughness:.3,metalness:.85});
  let upd=null;
  const front=D/2;
  if(k==='lifeTree'){ const tr=msh(Gc(.35,.6,2.6,9),mat('#6b4423',{roughness:.95,flatShading:true}),g,0,1.3,0); tr.rotation.y=.4; for(let i=0;i<4;i++){ const r=msh(Gc(.12,.2,1.4,6),mat('#6b4423',{flatShading:true}),g,Math.cos(i*1.6)*.5,.3,Math.sin(i*1.6)*.5); r.rotation.z=Math.cos(i*1.6)*.9; r.rotation.x=-Math.sin(i*1.6)*.9; }
    [[0,3.2,0,1.5],[-1,2.8,.3,1.1],[1,2.9,-.2,1.1],[.3,3.6,-.6,1],[-.5,3.5,.7,.9]].forEach(([x,y,z,r],i)=>msh(Gi(r,2),mat(['#3f9a3a','#4aa846','#38903a'][i%3],{flatShading:true,roughness:.85}),g,x,y,z));
    const fr=mat('#ffd34a',{emissive:'#ffb020',emissiveIntensity:1,roughness:.3}); for(let i=0;i<12;i++){ const a=i*2.1; msh(Gs(.13,10,8),fr,g,Math.cos(a)*1.3,2.7+Math.sin(i*1.7)*.6,Math.sin(a)*1.1,false); } const L=new TH.PointLight(0xffd070,1,7,2); L.position.set(0,2.6,1); g.add(L); }
  else if(k==='ark'){ const hull=new TH.Group(); g.add(hull); hull.position.y=.2; const hs=msh(Gb(W*.95,1.5,D*.62),wood,hull,0,1,0); const bow=msh(Gk(D*.31,1.4,4),wood,hull,W*.5,1,0); bow.rotation.z=-PI/2; bow.rotation.x=PI/4; bow.scale.set(1,1,.9); const st=msh(Gk(D*.31,1.2,4),wood,hull,-W*.5,1,0); st.rotation.z=PI/2; st.rotation.x=PI/4;
    msh(Gb(W*.6,1,D*.42),texMat('wood',{color:c3('#c9a070')}),hull,0,2.2,0); const roof=msh(Gc(D*.3,D*.3,W*.65,3),mat('#5a3a1a',{flatShading:true}),hull,0,2.95,0); roof.rotation.z=PI/2; roof.scale.set(1,1,.7);
    for(let i=0;i<5;i++) msh(Gb(.3,.25,.05),mat('#2a1a0a'),hull,-W*.24+i*W*.12,2.3,D*.215,false); const ramp=msh(Gb(1,.08,2.2),wood,g,W*.15,.55,front+.4); ramp.rotation.x=.45;
    if(ctx.stage(2)>=3){ const cols=['#d9443a','#ef9a2d','#ecd23b','#4fae4f','#3f7fd1','#7e4fb3']; cols.forEach((c,i)=>{ const r=msh(new TH.TorusGeometry(W*.65-i*.18,.09,6,40,PI),new TH.MeshBasicMaterial({color:c3(c),transparent:true,opacity:.75}),g,0,0,-D*.9,false); }); } }
  else if(k==='pyramid'){ const p=msh(Gk(W*.62,D*1.4,4),texMat('stone',{color:c3('#f0d494'),roughness:.9}),g,0,D*.7,0); p.rotation.y=PI/4; p.material.flatShading=true; msh(Gb(.9,1.3,.4),mat('#3a2610'),g,0,.65,front-.1); }
  else if(k==='mountain'){ const m=msh(geo('mtn'+W,()=>{ const gg=new TH.ConeGeometry(W*.55,D*1.5,9,4); const pa=gg.attributes.position; for(let i=0;i<pa.count;i++){ const y=pa.getY(i); if(y<D*.7){ pa.setX(i,pa.getX(i)*(1+Math.sin(i*1.7)*.12)); pa.setZ(i,pa.getZ(i)*(1+Math.cos(i*2.1)*.12)); } } gg.computeVertexNormals(); return gg; }),mat('#9a8268',{roughness:1,flatShading:true}),g,0,D*.72,-.3);
    const cm=mat('#eceef6',{roughness:1,transparent:true,opacity:.85}); for(let i=0;i<7;i++){ const a=i/7*TAU; msh(Gs(.8,10,8),cm,g,Math.cos(a)*1.4,D*1.35+Math.sin(i)*.2,Math.sin(a)*1.2-.3,false); } const fire=sprite(tx('glow'),3); fire.position.set(0,D*1.5,-.3); fire.material.color.set(c3('#ff9a40')); g.add(fire); const L=new TH.PointLight(0xff9040,1.2,10,2); L.position.set(0,D*1.4,0); g.add(L); upd=t=>{ fire.material.opacity=.7+Math.sin(t*5)*.2; }; }
  else if(k==='walls'){ if(ctx.stage(5)>=3){ const R=rng(77); for(let i=0;i<45;i++){ const b=msh(Gb(rr(R,.4,.9),rr(R,.3,.6),rr(R,.4,.8)),stone,g,(R()-.5)*W,.2+R()*.4,(R()-.5)*D*.8); b.rotation.set(R()*.6,R()*3,R()*.6); } }
    else { msh(Gb(W,2.6,1),stone,g,0,1.3,-D*.2); for(let i=0;i<Math.floor(W/.7);i++) msh(Gb(.4,.4,1),stone,g,-W/2+.3+i*.7,2.8,-D*.2); for(const s of [-1,1]){ msh(Gc(.9,1,3.6,10),stone,g,s*(W/2-.6),1.8,-D*.15); msh(Gk(1.05,.9,10),mat('#a48a5a'),g,s*(W/2-.6),4.05,-D*.15); }
      msh(geo('jdoor',()=>new TH.CircleGeometry(.9,18,0,PI)),mat('#2a1a10'),g,0,0,-D*.2+.51,false); msh(Gb(1.8,1,.05),mat('#2a1a10'),g,0,.0,-D*.2+.51,false); for(let i=0;i<4;i++) msh(Gb(.4,.45,.06),mat('#e8dcc0'),g,-W*.32+i*W*.21,1.7,-D*.2+.52,false);
      const cord=msh(Gc(.02,.02,1.3,4),mat('#c0302b'),g,-W*.32,1.1,-D*.2+.56,false); } }
  else if(k==='camp'){ for(let i=0;i<3;i++){ const x=-W/3+i*W/3; const t=msh(Gk(W/7,2.2,4),texMat(i===1?'tent2':'tent',{side:TH.DoubleSide}),g,x,1.1,0); t.rotation.y=PI/4; msh(Gc(.03,.03,.9,4),mat('#5a3a1e'),g,x,2.6,0); msh(Gb(.4,.24,.02),mat(['#5a4a8a','#8a3a3a','#3a6a3a'][i]),g,x+.2,2.95,0,false); }
    msh(Gc(.3,.35,.15,8),mat('#5a5048'),g,0,.07,front*.8); const fire=msh(Gk(.18,.45,8),mat('#ff8a2a',{emissive:'#ff5a10',emissiveIntensity:1.4}),g,0,.35,front*.8,false); upd=t=>{ fire.scale.y=1+Math.sin(t*10)*.15; }; }
  else if(k==='ziggurat'){ for(let i=0;i<5;i++){ const s=1-i*.17; msh(Gb(W*s,D*.24,D*s),texMat('brick'),g,0,D*.12+i*D*.24,-.2); } msh(Gb(1,D*1.2,D*.7),texMat('brick'),g,0,D*.45,front*.4).rotation.x=.75; msh(Gb(1.2,.9,1.2),mat('#2f5fa8',{roughness:.5}),g,0,D*1.2+.45,-.2); }
  else if(k==='stable'){ const glow=ctx.stage(8)>=3; msh(Gb(W*.85,1.9,D*.7),wood,g,0,.95,-.1); const roof=msh(Gc(D*.55,D*.55,W*.95,3),mat('#5a3a1e',{flatShading:true}),g,0,2.15,-.1); roof.rotation.z=PI/2; roof.scale.set(1,1,.6);
    msh(Gb(1.8,1.3,.1),mat(glow?'#ffe9a0':'#2a1a0e',{emissive:glow?'#ffcf60':'#000000',emissiveIntensity:glow?.8:0}),g,0,.65,D*.25+.06); const man=msh(Gb(.9,.35,.45),wood,g,0,.35,D*.4); msh(Gb(.8,.12,.35),mat('#e0bf5a'),g,0,.55,D*.4);
    const st=new TH.Group(); st.position.set(0,3.6,0); g.add(st); msh(starGeo(glow?.45:.25,glow?.18:.1,.08),mat(glow?'#fff6c8':'#8a90b0',{emissive:glow?'#ffe08a':'#202430',emissiveIntensity:glow?1.6:.4}),st,0,0,0,false); if(glow){ const gl=sprite(tx('glow'),3.2); st.add(gl); const beam=msh(Gc(.12,.5,3.2,12,true),new TH.MeshBasicMaterial({color:c3('#fff2c8'),transparent:true,opacity:.18,depthWrite:false,blending:TH.AdditiveBlending,side:TH.DoubleSide}),g,0,1.95,D*.2,false); const L=new TH.PointLight(0xffe0a0,1.4,10,2); L.position.set(0,2.5,D*.4); g.add(L); }
    upd=t=>{ st.rotation.y=t*.5; st.position.y=3.6+Math.sin(t*1.5)*.08; }; }
  else if(k==='boat'){ const b=new TH.Group(); g.add(b); b.position.y=-.08; msh(Gb(W*.85,.5,D*.6),wood,b,0,.1,0); for(const s of [-1,1]){ const e=msh(Gk(D*.3,1,4),wood,b,s*W*.48,.1,0); e.rotation.z=-s*PI/2; e.rotation.x=PI/4; e.scale.set(1,1,.8); } msh(Gc(.05,.05,3,6),mat('#5a3a1a'),b,0,1.6,0); const sail=msh(geo('sail2',()=>{ const s=new TH.Shape(); s.moveTo(0,0); s.lineTo(0,2.4); s.lineTo(1.5,.1); s.closePath(); return new TH.ShapeGeometry(s); }),mat('#efe6cf',{side:TH.DoubleSide,roughness:.9}),b,.03,.5,0); upd=t=>{ b.rotation.z=Math.sin(t*1.2)*.04; b.position.y=-.08+Math.sin(t*1.6)*.05; }; }
  else if(k==='tomb'){ const open=ctx.stage(10)>=3; const hill=msh(geo('tombhill'+W,()=>new TH.SphereGeometry(W*.5,24,14,0,TAU,0,PI/2)),mat('#9a9080',{roughness:1,flatShading:true}),g,0,0,-.3); hill.scale.set(1,D*.85/(W*.5),.8); msh(geo('tdoor',()=>new TH.CircleGeometry(.85,18,0,PI)),mat(open?'#fff1b8':'#1a140e',{emissive:open?'#ffe08a':'#000000',emissiveIntensity:open?.9:0}),g,0,0,W*.39,false);
    const stn=msh(Gc(.95,.95,.35,24),mat('#b0a690',{roughness:.95}),g,open?1.9:0,.95,W*.41+(open?.1:.05)); stn.rotation.x=PI/2; for(let i=0;i<6;i++) msh(Gi(.3,1),mat('#5f8a3a',{flatShading:true}),g,-W*.45+i*W*.18,.1,W*.35); if(open){ const L=new TH.PointLight(0xffe8b0,1.2,8,2); L.position.set(0,.9,W*.45); g.add(L); } }
  else if(k==='fountain'){ msh(Gc(D*.85,D*.92,.5,36),stone,g,0,.25,0); const rim=msh(Gt(D*.85,.12,10,44),mat('#d8ccae',{roughness:.85}),g,0,.52,0); rim.rotation.x=PI/2; msh(Gc(D*.8,D*.8,.05,36),new TH.MeshStandardMaterial({color:c3('#3f98d8'),roughness:.08,metalness:.15,transparent:true,opacity:.88}),g,0,.47,0,false); msh(Gc(.2,.3,1,14),stone,g,0,.95,0); msh(geo('fbowl',()=>new TH.SphereGeometry(.55,20,10,0,TAU,PI/2,PI/2)),mat('#d8ccae',{side:TH.DoubleSide}),g,0,1.5,0); msh(Gs(.13,12,10),gold,g,0,1.68,0);
    const drops=[]; for(let i=0;i<20;i++) drops.push(msh(Gs(.04,6,4),mat('#cfeaff',{transparent:true,opacity:.85}),g,0,0,0,false)); upd=t=>drops.forEach((d,i)=>{ const a=i/20*TAU, p=((t*.55+i*.137)%1); const r=.15+p*.95; d.position.set(Math.cos(a)*r,Math.max(.5,1.5+p*.45-p*p*1.5),Math.sin(a)*r); }); }
  else if(k==='house'||k==='home'){ const isHome=k==='home'; const FZ=D*.375-.1+.04; msh(Gb(W*.8,2.5,D*.75),plaster,g,0,1.25,-.1); msh(Gb(W*.86,.2,D*.82),mat('#cbb894'),g,0,2.6,-.1); for(const x of [-1,1]) for(const z of [-1,1]) msh(Gb(.22,.28,.22),mat('#d9c9a2'),g,x*W*.41,2.84,-.1+z*D*.39);
    msh(Gb(.9,1.6,.1),wood,g,0,.8,FZ); msh(Gb(1.2,.12,.18),mat('#8a6a3a'),g,0,1.66,FZ+.02); for(const x of [-1,1]){ msh(Gb(.7,.6,.08),mat('#2a1e14'),g,x*W*.25,1.45,FZ); msh(Gb(.8,.08,.14),mat('#8a6a3a'),g,x*W*.25,1.12,FZ+.04); }
    const aw=msh(Gb(W*.75,.05,1.2),new TH.MeshStandardMaterial({map:ctex(256,64,(c,w,h)=>{ for(let i=0;i<8;i++){ c.fillStyle=i%2?'#f1ead8':(lm.awn||(isHome?'#2f8f8a':'#7b3fa0')); c.fillRect(i*w/8,0,w/8+1,h); } }),roughness:.9}),g,0,2.05,FZ+.55); aw.rotation.x=.3;
    if(lm.sign||isHome){ const s=signMesh(ctx.sign(lm.sign||'sign.home'),2.2,.55); s.position.set(0,2.4,FZ+.03); g.add(s); }
    const R=rng(lm.x*7); const cr=wood; for(let i=0;i<3;i++){ const s=.4+R()*.2; msh(Gb(s,s,s),cr,g,(R()-.5)*W*.7,s/2,D*.42+R()*.2).rotation.y=R(); } for(let i=0;i<2;i++) msh(jarGeo(),mat('#b8693a',{roughness:.85}),g,W*.3+i*.3,0,D*.45).scale.setScalar(.9);
    if(isHome){ for(let i=0;i<4;i++) msh(Gi(.25,1),mat(['#5aa850','#6aae52'][i%2],{flatShading:true}),g,-W*.35+i*.25,.15,D*.42); const L=new TH.PointLight(0xffd090,.6,4,2); L.position.set(0,1.5,D*.5); g.add(L); } }
  else if(k==='barn'){ msh(Gb(W*.8,2.2,D*.75),wood,g,0,1.1,-.1); const FB=D*.375-.1+.04; const roof=msh(Gc(D*.55,D*.55,W*.86,3),mat('#7a3a2a',{flatShading:true}),g,0,2.55,-.1); roof.rotation.z=PI/2; roof.scale.set(1,1,.65); msh(Gb(1.5,1.6,.1),mat('#2a1a0e'),g,0,.8,D*.275); if(lm.sign){ const s=signMesh(ctx.sign(lm.sign),1.7,.45,'#3a2a18'); s.position.set(0,1.95,D*.275+.07); g.add(s); }
    for(let i=0;i<3;i++){ const h=msh(Gc(.35,.35,.6,14),mat('#e0bf5a',{roughness:1}),g,W*.3+i*.1,.35,D*.42-i*.3); h.rotation.z=PI/2; } for(let i=0;i<6;i++) msh(Gb(.1,.8,.1),mat('#6b4a2a'),g,-W*.4+i*.5,.4,D*.48); msh(Gb(2.6,.08,.06),mat('#6b4a2a'),g,-W*.4+1.25,.62,D*.48); }
  else if(k==='tent'){ const t=msh(Gk(Math.min(W,D)*.45,2.6,8,1,true),texMat('tent',{side:TH.DoubleSide}),g,0,1.3,0); msh(Gc(.04,.04,3,6),mat('#6b4a2a'),g,0,1.5,0); const door=msh(new TH.PlaneGeometry(1,1.4),mat('#1a120c',{side:TH.DoubleSide}),g,0,.7,Math.min(W,D)*.3,false); door.rotation.x=-.22; if(lm.sign){ const s=signMesh(ctx.sign(lm.sign),1.5,.4,'#2f5f86'); s.position.set(0,2.0,Math.min(W,D)*.22); s.rotation.x=-.35; g.add(s); } }
  else if(k==='granary'){ for(let i=0;i<3;i++){ const x=-W/3+i*W/3; msh(Gc(.85,.9,2,16),plaster,g,x,1,0); msh(geo('gdome',()=>new TH.SphereGeometry(.88,16,8,0,TAU,0,PI/2)),mat('#d9b878'),g,x,2,0); msh(Gb(.5,.8,.1),mat('#3a2a1a'),g,x,.4,.87); } for(let i=0;i<5;i++) msh(Gs(.3,10,8),mat('#c9a35d',{roughness:1}),g,-W*.4+i*.6,.15,front*.85).scale.set(1,.6,1); }
  else if(k==='haystacks'){ for(let i=0;i<4;i++){ const x=-W*.38+i*W*.25; msh(lathe('hay',[[0,0],[.65,0],[.62,.5],[.45,1.1],[.15,1.5],[0,1.55]],14),mat('#e0bf5a',{roughness:1}),g,x,0,(i%2)*.4-.2); } const cart=new TH.Group(); cart.position.set(W*.35,0,front*.7); g.add(cart); msh(Gb(1,.3,.6),wood,cart,0,.45,0); for(const s of [-1,1]){ const w=msh(Gc(.25,.25,.06,14),mat('#5a3a1e'),cart,-.2,.25,s*.33); w.rotation.x=PI/2; } }
  else if(k==='altar'){ const lit=ctx.stage(14)>=3; const rock=msh(Gk(W*.55,D*1.3,8),mat('#7a6a55',{roughness:1,flatShading:true}),g,0,D*.6,-D*.35); for(let i=0;i<12;i++) msh(Gb(.4,.28,.4),stone,g,-.66+(i%4)*.44,.14+Math.floor(i/4)*.28,front*.25+((i>>2)%2)*.0); for(let i=0;i<4;i++) msh(Gb(1.6,.1,.12),mat('#6b4a2a'),g,0,.92,front*.25-.3+i*.2);
    if(lit){ const fs=[]; for(let i=0;i<5;i++) fs.push(msh(Gk(.22,.9,8),mat(i%2?'#ffb03a':'#ffe26a',{emissive:i%2?'#ff7a10':'#ffc020',emissiveIntensity:1.5}),g,-.6+i*.3,1.4,front*.25,false)); const L=new TH.PointLight(0xffa040,1.6,9,2); L.position.set(0,1.8,front*.3); g.add(L); upd=t=>fs.forEach((f,i)=>f.scale.set(1,1+Math.sin(t*10+i)*.2,1)); }
    const tr=msh(Gc(.08,.08,1.2,6),mat('#6b4a2a'),g,W*.4,.6,front*.4); }
  else if(k==='gatehouse'){ msh(Gb(W,3,1.2),texMat('brick'),g,0,1.5,-D*.25); for(const s of [-1,1]) msh(Gb(1.5,3.8,1.5),texMat('brick'),g,s*(W/2-.6),1.9,-D*.25); msh(Gb(W*.7,.4,.1),mat('#2f5fa8',{roughness:.4}),g,0,2.3,-D*.25+.62); for(let i=0;i<6;i++) msh(Gs(.12,10,8),gold,g,-W*.3+i*W*.12,2.3,-D*.25+.68,false); msh(geo('gdoor',()=>new TH.CircleGeometry(1.1,18,0,PI)),mat('#2a1a10'),g,0,1.1,-D*.25+.61,false); msh(Gb(2.2,1.1,.05),mat('#2a1a10'),g,0,.55,-D*.25+.61,false); }
  else if(k==='palace'){ msh(Gb(W*.85,.4,D*.8),mat('#e8dcc4'),g,0,.2,0); msh(Gb(W*.78,2.6,D*.6),mat('#efe6d0'),g,0,1.7,-.2); const roof=msh(Gk(W*.55,1.4,4),mat('#2b5fb0',{roughness:.5}),g,0,3.7,-.2); roof.rotation.y=PI/4; roof.scale.z=.7; msh(Gb(W*.8,.15,D*.62),gold,g,0,3,-.2); for(let i=0;i<7;i++){ const x=-W*.36+i*W*.12; msh(Gc(.14,.16,2.6,12),mat('#d8ccb0'),g,x,1.7,D*.15); msh(Gb(.4,.12,.4),gold,g,x,3,D*.15); } msh(Gb(1.1,1.8,.1),mat('#5a3a1e'),g,0,1.3,D*.11); msh(Gs(.25,12,10),gold,g,0,3.25,D*.12); }
  else if(k==='upperRoom'){ const lit=ctx.stage(17)>=3; msh(Gb(W*.8,3.4,D*.7),plaster,g,0,1.7,-.1); msh(Gb(W*.86,.2,D*.76),mat('#cbb894'),g,0,3.45,-.1); msh(Gb(W*.82,.12,.12),mat('#cbb894'),g,0,1.75,D*.26); for(let i=0;i<3;i++) msh(Gb(.5,.5,.08),mat(lit?'#ffe9a0':'#2a1e14',{emissive:lit?'#ffc860':'#000000',emissiveIntensity:lit?.9:0}),g,-W*.25+i*W*.25,2.5,D*.25+.05,false); msh(Gb(.8,1.5,.1),wood,g,0,.75,D*.25+.05);
    for(let i=0;i<6;i++) msh(Gb(.5,.15,.4),mat('#b8a47a'),g,W*.45,.15+i*.28,D*.2-i*.32); if(lit){ const fs=[]; for(let i=0;i<4;i++){ const f=msh(Gk(.18,.55,8),mat('#ff9a3a',{emissive:'#ff6a10',emissiveIntensity:1.5}),g,-W*.3+i*W*.2,3.9,-.1,false); fs.push(f); } const L=new TH.PointLight(0xffa050,1.3,9,2); L.position.set(0,4,0); g.add(L); upd=t=>fs.forEach((f,i)=>f.scale.set(1,1+Math.sin(t*9+i)*.2,1)); } }
  else if(k==='wreck'){ const b=new TH.Group(); b.rotation.set(-.12,.3,-.18); b.position.y=.1; g.add(b); msh(Gb(W*.75,1,D*.55),wood,b,0,.4,0); const e=msh(Gk(D*.27,1.4,4),wood,b,W*.42,.4,0); e.rotation.z=-PI/2; e.rotation.x=PI/4; msh(Gb(1,.9,.1),mat('#1a120a'),b,-.3,.4,D*.28,false); const m=msh(Gc(.06,.06,2.6,6),mat('#5a3a1a'),b,-.6,1.6,0); m.rotation.z=.4; const sail=msh(new TH.PlaneGeometry(1.4,1.2),mat('#e6dcc4',{side:TH.DoubleSide,roughness:.9}),b,-.9,2.1,.05); sail.rotation.z=.6; for(let i=0;i<6;i++){ const p=msh(Gb(.8,.08,.25),wood,g,(i-3)*.7,.05,front+.4+(i%2)*.3); p.rotation.y=i; } }
  else if(k==='oak'){ const tr=msh(Gc(.4,.65,2.4,9),mat('#5a3a1e',{roughness:.95,flatShading:true}),g,-W*.15,1.2,-.2); [[-W*.15,3,-.2,1.6],[-W*.15-1,2.6,.3,1.1],[-W*.15+1,2.7,-.4,1.2],[-W*.15+.2,3.6,-.8,1]].forEach(([x,y,z,r],i)=>msh(Gi(r,2),mat(['#3f7a3a','#4a8a42','#38703a'][i%3],{flatShading:true}),g,x,y,z));
    const wp=new TH.Group(); wp.position.set(W*.28,0,.3); g.add(wp); msh(Gc(.85,.95,.6,14),stone,wp,0,.3,0); msh(Gc(.7,.7,.06,14),mat('#6a2a4a',{roughness:.4}),wp,0,.58,0,false); msh(Gb(.9,.08,.9),mat('#e8dcc0',{roughness:1}),g,-W*.15+1.6,.04,D*.35); }
  else if(k==='temple'){ msh(Gb(W*.9,.4,D*.85),stone,g,0,.2,-.1); msh(Gb(W*.72,2.8,D*.5),mat('#d8ccb0'),g,0,1.8,-.4); const roof=msh(Gk(W*.55,1.3,4),mat('#a89870',{flatShading:true}),g,0,3.85,-.4); roof.rotation.y=PI/4; roof.scale.z=.65;
    for(const sx of [-1,1]){ msh(Gc(.32,.38,3,14),mat('#efe6d0'),g,sx*W*.16,1.9,D*.18); msh(Gb(.9,.18,.9),mat('#d8ccb0'),g,sx*W*.16,3.45,D*.18); msh(Gb(.9,.18,.9),mat('#d8ccb0'),g,sx*W*.16,.5,D*.18); }
    msh(Gb(W*.5,.3,.9),mat('#d8ccb0'),g,0,3.6,D*.18); msh(Gb(1.1,1.8,.1),mat('#2a1a10'),g,0,1.3,D*.0); }
  else if(k==='citywall'){ const bm=texMat('stone',{roughness:.95}); for(const sx of [-1,1]){ msh(Gb(W*.36,2.6,1),bm,g,sx*W*.32,1.3,-D*.2); for(let i=0;i<3;i++) msh(Gb(.4,.4,1),bm,g,sx*(W*.18+i*W*.1),2.8,-D*.2); }
    for(let i=0;i<5;i++) msh(Gb(.55,.38,.5),bm,g,-.6+(i%3)*.6,.2+Math.floor(i/3)*.38,-D*.2); for(const x of [-.9,.9]) msh(Gc(.05,.05,3,6),mat('#6b4a2a'),g,x,1.5,-D*.2+.6); msh(Gb(2,.06,.08),mat('#6b4a2a'),g,0,1.6,-D*.2+.6); msh(Gb(2,.06,.08),mat('#6b4a2a'),g,0,2.6,-D*.2+.6);
    for(let i=0;i<6;i++) msh(Gb(.45,.3,.4),bm,g,W*.15+(i%3)*.5,.15+Math.floor(i/3)*.3,D*.25); }
  else if(k==='farmhouse'){ msh(Gb(W*.5,2.2,D*.6),plaster,g,-W*.12,1.1,-.2); const rf=msh(Gc(D*.45,D*.45,W*.56,3),mat('#8a5a3a',{flatShading:true}),g,-W*.12,2.45,-.2); rf.rotation.z=PI/2; rf.scale.set(1,1,.6); msh(Gb(.8,1.5,.1),texMat('wood'),g,-W*.12,.75,D*.1+.05);
    for(let i=0;i<7;i++) msh(Gb(.08,.7,.08),mat('#7a5a3a'),g,W*.18+i*.45,.35,D*.35); msh(Gb(3,.07,.06),mat('#7a5a3a'),g,W*.18+1.35,.55,D*.35); for(let i=0;i<6;i++) msh(Gs(.3,10,8),mat('#c9a35d',{roughness:1}),g,W*.25+(i%3)*.7,.15,-D*.15+Math.floor(i/3)*.7).scale.set(1,.5,1); }
  g.traverse(x=>{ if(x.isMesh&&x.castShadow!==false) x.castShadow=true; });
  return {root:g,update:upd};
}
function rr(R,a,b){ return a+R()*(b-a); }
function buildGate(n,state,skyCol){
  const g=new TH.Group(); const st=texMat('stone',{roughness:.9});
  for(const s of [-1,1]){ msh(Gb(.45,2.4,.55),st,g,s*.95,1.2,0); msh(Gb(.62,.24,.72),mat('#cfc3a6'),g,s*.95,.12,0); }
  const arch=msh(Gt(.95,.24,10,20,PI),st,g,0,2.4,0); arch.scale.z=1.1;
  const pl=ctex(128,128,(c,w,h)=>{ c.fillStyle=state==='done'?'#e8b94a':state==='open'?'#e9dcc0':'#9a9080'; c.beginPath(); c.arc(64,64,62,0,TAU); c.fill(); c.strokeStyle='#8a6a3a'; c.lineWidth=8; c.stroke(); c.fillStyle=state==='done'?'#5a3d08':'#3a2a1a'; c.font='900 70px Nunito, sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(n,64,68); });
  msh(new TH.CircleGeometry(.3,24),new TH.MeshStandardMaterial({map:pl,roughness:.6,metalness:state==='done'?.5:0}),g,0,3.42,.29,false);
  let upd=null;
  if(state!=='locked'){ const pm=new TH.MeshBasicMaterial({map:ctex(128,256,(c,w,h)=>{ const gr=c.createRadialGradient(w/2,h*.62,4,w/2,h*.62,h*.6); gr.addColorStop(0,'rgba(255,250,220,1)'); gr.addColorStop(.35,'rgba(255,225,150,.85)'); gr.addColorStop(1,skyCol||'rgba(120,200,255,.2)'); c.fillStyle=gr; c.fillRect(0,0,w,h); }),transparent:true,side:TH.DoubleSide,depthWrite:false,blending:TH.AdditiveBlending});
    msh(new TH.PlaneGeometry(1.45,2.4),pm,g,0,1.2,0,false); msh(new TH.CircleGeometry(.72,24,0,PI),pm,g,0,2.4,0,false);
    const sp=[]; for(let i=0;i<10;i++) sp.push(msh(Gs(.03,6,4),basic('#ffffff'),g,0,0,0,false)); upd=t=>{ pm.opacity=.75+Math.sin(t*2+n)*.2; sp.forEach((s,i)=>{ const p=((t*.3+i/10)%1); s.position.set(Math.sin(i*2.3+t)*.5,.2+p*2.6,.05); }); }; }
  else { msh(Gb(1.45,2.4,.12),mat('#3a3a4a',{roughness:.7}),g,0,1.2,0); msh(new TH.CircleGeometry(.72,24,0,PI),mat('#3a3a4a',{side:TH.DoubleSide}),g,0,2.4,0); const lm=mat('#8a8070',{roughness:.5,metalness:.4}); msh(Gb(.4,.32,.12),lm,g,0,1.2,.1); msh(Gt(.13,.04,6,12,PI),lm,g,0,1.36,.1); }
  g.traverse(x=>{ if(x.isMesh&&x.castShadow!==false) x.castShadow=true; });
  return {root:g,update:upd};
}
function buildExit(){ const g=new TH.Group(); const st=texMat('stone',{roughness:.9}); for(const s of [-1,1]) msh(Gb(.22,1.9,.3),st,g,s*.5,.95,0); msh(Gb(1.25,.24,.36),st,g,0,1.95,0); const pm=new TH.MeshBasicMaterial({color:c3('#fff0c0'),transparent:true,opacity:.6,depthWrite:false,blending:TH.AdditiveBlending,side:TH.DoubleSide}); msh(new TH.PlaneGeometry(.78,1.8),pm,g,0,.92,0,false); return {root:g,update:t=>{ pm.opacity=.45+Math.sin(t*3)*.2; }}; }

/* ===================== HOUSE FURNITURE & TREASURES ===================== */
const FURN={
  bed:{w:1,d:2,price:90},table:{w:2,d:1,price:50},stool:{w:1,d:1,price:15},bench:{w:2,d:1,price:35},rug:{w:2,d:2,price:60,floor:1},lamp:{w:1,d:1,price:40},plant:{w:1,d:1,price:30},shelf:{w:1,d:1,price:55},jars:{w:1,d:1,price:25},chest:{w:1,d:1,price:45},basket:{w:1,d:1,price:20},
  lifesap:{w:1,d:1,ch:1},ark:{w:1,d:1,ch:2},starglobe:{w:1,d:1,ch:11},coat:{w:1,d:1,ch:12},mosesbasket:{w:1,d:1,ch:3},tablets:{w:1,d:1,ch:4},shofar:{w:1,d:1,ch:5},sheaf:{w:1,d:1,ch:13},harp:{w:1,d:1,ch:6},oiljar:{w:1,d:1,ch:14},fishstatue:{w:1,d:1,ch:15},lionstatue:{w:1,d:1,ch:7},scepter:{w:1,d:1,ch:16},manger:{w:2,d:1,ch:8},net:{w:1,d:1,ch:9},palms:{w:1,d:1,ch:10},flamelamp:{w:1,d:1,ch:17},anchor:{w:1,d:1,ch:18},gideonjar:{w:1,d:1,ch:19},honeycomb:{w:1,d:1,ch:20},trowel:{w:1,d:1,ch:21},lostcoin:{w:1,d:1,ch:22},trophy:{w:1,d:1,earned:1}
};
function pedestal(g,h=.5,col='#8a6a4a'){ msh(Gb(.62,h,.62),texMat('wood',{color:c3(col)}),g,0,h/2,0); return h; }
function buildFurn(id){
  const g=new TH.Group(); const wood=texMat('wood',{roughness:.75}), dk=mat('#5a3a1e',{roughness:.7}), clay=mat('#b8693a',{roughness:.85}), cream=mat('#efe2bf',{roughness:.9}), gold=mat('#e8b94a',{roughness:.3,metalness:.85}), stoneM=texMat('stone');
  if(id==='bed'){ msh(Gb(.92,.3,1.9),wood,g,0,.2,0); msh(Gb(.84,.16,1.78),cream,g,0,.42,0); msh(Gb(.88,.09,1.2),texMat('blanket',{roughness:.95}),g,0,.52,.28); msh(Gs(.25,14,10),mat('#f6f0e2',{roughness:1}),g,0,.56,-.64).scale.set(1.4,.4,.75); msh(Gb(.95,.75,.08),wood,g,0,.45,-.93); for(const x of [-.43,.43]) for(const z of [-.9,.9]) msh(Gb(.08,.2,.08),dk,g,x,.05,z); }
  if(id==='table'){ msh(Gb(1.8,.08,.82),wood,g,0,.72,0); for(const x of [-.8,.8]) for(const z of [-.32,.32]) msh(Gc(.04,.045,.7,8),dk,g,x,.35,z); msh(Gs(.13,12,10),mat('#c98a4a',{roughness:.9}),g,-.4,.8,0).scale.set(1.3,.6,.9); msh(jarGeo(),clay,g,.45,.76,.05).scale.setScalar(.45); msh(Gc(.16,.12,.05,16),mat('#d8c8a6'),g,0,.78,.1); }
  if(id==='stool'){ msh(Gc(.22,.22,.06,18),wood,g,0,.45,0); for(let i=0;i<3;i++){ const a=i/3*TAU; const l=msh(Gc(.025,.03,.46,6),dk,g,Math.cos(a)*.14,.22,Math.sin(a)*.14); l.rotation.set(Math.sin(a)*.15,0,-Math.cos(a)*.15); } }
  if(id==='bench'){ msh(Gb(1.8,.08,.4),wood,g,0,.45,0); for(const x of [-.75,.75]) msh(Gb(.08,.42,.36),dk,g,x,.21,0); msh(Gb(1.8,.35,.06),wood,g,0,.7,-.18); }
  if(id==='rug'){ const r=msh(new TH.PlaneGeometry(1.9,1.9),texMat('rug',{roughness:1}),g,0,.012,0,false); r.rotation.x=-PI/2; }
  if(id==='lamp'){ msh(Gc(.16,.2,.06,14),dk,g,0,.03,0); msh(Gc(.03,.03,1.1,8),dk,g,0,.58,0); msh(Gc(.14,.1,.05,14),dk,g,0,1.13,0); msh(Gs(.09,12,10),clay,g,0,1.2,0).scale.set(1.2,.6,1); const fl=msh(Gk(.03,.1,8),basic('#ffd27a'),g,.08,1.29,0,false); const L=new TH.PointLight(0xffb760,1.1,5,2); L.position.set(.08,1.35,0); g.add(L); g.userData.flame=fl; }
  if(id==='plant'){ msh(lathe('pot',[[0,0],[.16,0],[.21,.3],[.23,.34],[0,.34]],18),clay,g); msh(Gc(.03,.05,.6,6),mat('#8a7a62',{flatShading:true}),g,0,.6,0).rotation.z=.1; [[0,1.0,0,.32],[.17,.92,.05,.22],[-.15,.95,-.04,.24]].forEach(([x,y,z,s])=>msh(Gi(s,1),mat('#7f9a5a',{flatShading:true}),g,x,y,z)); }
  if(id==='shelf'){ msh(Gb(.9,1.8,.04),wood,g,0,.9,-.3); for(const x of [-.43,.43]) msh(Gb(.05,1.8,.38),wood,g,x,.9,-.12); for(let i=0;i<4;i++) msh(Gb(.85,.04,.36),wood,g,0,.05+i*.55,-.12); for(let s=0;s<3;s++) for(let i=0;i<4;i++){ const sc=msh(Gc(.045,.045,.3,10),cream,g,-.28+i*.19,.17+s*.55,-.12); sc.rotation.x=PI/2; } }
  if(id==='jars'){ [[-.18,-.1,1],[.18,.05,.85],[0,.22,.7]].forEach(([x,z,s])=>msh(jarGeo(),clay,g,x,0,z).scale.setScalar(s)); }
  if(id==='chest'){ msh(Gb(.8,.42,.5),wood,g,0,.21,0); const lid=msh(geo('lid',()=>new TH.CylinderGeometry(.25,.25,.8,16,1,false,0,PI)),wood,g,0,.42,0); lid.rotation.set(0,PI/2,PI/2); lid.scale.set(1,1,.9); for(const x of [-.3,.3]) msh(Gb(.05,.44,.52),gold,g,x,.22,0); msh(Gb(.1,.12,.03),gold,g,0,.34,.26); }
  if(id==='basket'){ msh(lathe('bask',[[0,0],[.22,0],[.28,.28],[.27,.3],[0,.3]],16),mat('#c9a05a',{roughness:1}),g); const h=msh(Gt(.22,.015,6,16,PI),mat('#9a7a3a'),g,0,.3,0); for(let i=0;i<3;i++) msh(Gs(.09,10,8),mat('#c98a4a'),g,-.1+i*.1,.32,(i%2)*.06).scale.set(1.3,.6,.9); }
  if(id==='lifesap'){ msh(lathe('pot',[[0,0],[.16,0],[.21,.3],[.23,.34],[0,.34]],18),clay,g); msh(Gc(.04,.06,.7,6),mat('#6b4423',{flatShading:true}),g,0,.65,0); [[0,1.1,0,.35],[.2,1,.05,.24],[-.18,1.02,-.05,.26]].forEach(([x,y,z,s])=>msh(Gi(s,1),mat('#3f9a3a',{flatShading:true}),g,x,y,z)); for(let i=0;i<6;i++) msh(Gs(.05,8,6),mat('#ffd34a',{emissive:'#ffb020',emissiveIntensity:1}),g,Math.cos(i)*.3,1.05+Math.sin(i*2)*.15,Math.sin(i)*.25,false); }
  if(id==='ark'){ const h=pedestal(g,.35); const a=new TH.Group(); a.position.y=h+.05; g.add(a); msh(Gb(.7,.16,.3),wood,a,0,.08,0); msh(Gb(.4,.14,.22),mat('#9a6a38'),a,0,.22,0); const rf=msh(Gc(.14,.14,.42,3),mat('#5a3a1e',{flatShading:true}),a,0,.34,0); rf.rotation.z=PI/2; rf.scale.set(1,1,.6); [['#e9d8a6',-.25],['#7a5a3a',.25]].forEach(([c,x])=>msh(Gs(.04,8,6),mat(c),a,x,.2,.1)); }
  if(id==='starglobe'){ const h=pedestal(g,.5); msh(Gs(.28,24,16),mat('#1d2b66',{roughness:.3,metalness:.3}),g,0,h+.3,0); for(let i=0;i<14;i++){ const v=new TH.Vector3(Math.sin(i*2.3),Math.cos(i*1.7),Math.sin(i*1.1+1)).normalize().multiplyScalar(.285); msh(Gs(.018,6,4),mat('#ffe08a',{emissive:'#ffd060',emissiveIntensity:1.5}),g,v.x,h+.3+v.y,v.z,false); } msh(Gt(.32,.015,6,30),gold,g,0,h+.3,0).rotation.x=.4; }
  if(id==='coat'){ msh(Gc(.18,.22,.05,14),dk,g,0,.03,0); msh(Gc(.025,.025,1.3,8),dk,g,0,.68,0); msh(Gb(.6,.04,.04),dk,g,0,1.28,0); const r=msh(robeGeo(),texMat('rainbow',{roughness:.9}),g,0,.25,0); r.scale.set(1.1,1.15,.7); }
  if(id==='mosesbasket'){ msh(Gs(.32,18,10,0,TAU,PI/2,PI/2),mat('#c9a05a',{roughness:1,side:TH.DoubleSide}),g,0,.3,0).scale.set(1,.8,1.6); msh(Gs(.28,14,8),texMat('blanket'),g,0,.27,.05).scale.set(1,.3,1.4); msh(Gt(.32,.03,6,24),mat('#a8804a'),g,0,.3,0).scale.set(1,1.6,1); }
  if(id==='tablets'){ const h=pedestal(g,.3,'#7a6a5a'); for(const s of [-1,1]){ const t=msh(Gb(.26,.5,.06),stoneM,g,s*.15,h+.25,0); t.rotation.z=-s*.05; msh(Gs(.13,12,8,0,PI),stoneM,g,s*.15,h+.5,0).rotation.z=0; } }
  if(id==='shofar'){ const h=pedestal(g,.5); const hn=msh(new TH.TubeGeometry(new TH.CatmullRomCurve3([new TH.Vector3(-.3,0,0),new TH.Vector3(-.1,.08,0),new TH.Vector3(.15,.05,0),new TH.Vector3(.3,.22,0)]),20,.04,8),mat('#d8c8a0',{roughness:.5}),g,0,h+.1,0); msh(Gc(.08,.05,.08,10),mat('#d8c8a0'),g,.32,h+.34,0).rotation.z=-.6; }
  if(id==='sheaf'){ for(let i=0;i<14;i++){ const a=i/14*TAU; const s=msh(Gc(.01,.012,.9,4),mat('#c9a24a'),g,Math.cos(a)*.08,.45,Math.sin(a)*.08); s.rotation.set(Math.sin(a)*.15,0,-Math.cos(a)*.15); msh(Gs(1,6,6),mat('#e0bf5a'),g,Math.cos(a)*.15,.92,Math.sin(a)*.15,false).scale.set(.03,.09,.03); } msh(Gt(.09,.02,6,14),mat('#8a6a3a'),g,0,.4,0).rotation.x=PI/2; }
  if(id==='harp'){ msh(Gb(.5,.08,.3),dk,g,0,.04,0); msh(Gt(.42,.035,8,18,PI*.95),wood,g,0,.5,0).rotation.z=.08; msh(Gc(.03,.03,.82,8),wood,g,-.4,.45,0); for(let i=0;i<7;i++){ const x=-.3+i*.1, h=.25+Math.sin((i+1)/8*PI)*.45; msh(Gc(.004,.004,h,4),gold,g,x,.1+h/2,0,false); } }
  if(id==='oiljar'){ msh(jarGeo(),clay,g).scale.setScalar(1.3); msh(Gc(.1,.1,.02,12),mat('#ffd060',{emissive:'#ffb020',emissiveIntensity:1.2}),g,0,.77,0,false); const s=sprite(tx('glow'),.7); s.position.y=.82; g.add(s); }
  if(id==='fishstatue'){ const h=pedestal(g,.35,'#5a6a7a'); const f=new TH.Group(); f.position.y=h+.32; f.rotation.z=.3; g.add(f); const bm=mat('#3f78c8',{roughness:.35,metalness:.3}); msh(Gs(1,16,12),bm,f).scale.set(.15,.2,.32); const tl=msh(Gk(.16,.25,8),bm,f,0,0,-.38); tl.rotation.x=PI/2; tl.scale.set(.25,1,1); eyes3(f,.11,.05,.2,.03,true); }
  if(id==='lionstatue'){ const h=pedestal(g,.3,'#9a9080'); const L=buildLion(); L.root.scale.setScalar(.75); L.root.position.y=h; L.root.traverse(x=>{ if(x.isMesh) x.material=mat('#e8b94a',{roughness:.3,metalness:.8}); }); g.add(L.root); }
  if(id==='scepter'){ const h=pedestal(g,.45,'#2b5fb0'); const s=msh(Gc(.02,.025,.8,8),gold,g,0,h+.4,0); s.rotation.z=.2; msh(Gs(.07,12,10),gold,g,-.08,h+.8,0); msh(Gs(.04,8,6),mat('#c0302b',{roughness:.2}),g,-.08,h+.88,0); }
  if(id==='manger'){ msh(Gb(1.6,.45,.6),wood,g,0,.4,0); for(const x of [-.7,.7]) for(const z of [-.25,.25]){ const l=msh(Gb(.08,.5,.08),dk,g,x,.18,z); l.rotation.z=x>0?.2:-.2; } msh(Gb(1.5,.15,.5),mat('#e0bf5a',{roughness:1}),g,0,.65,0); const st=msh(starGeo(.16,.07,.04),mat('#fff6c8',{emissive:'#ffe08a',emissiveIntensity:1.4}),g,0,1.2,0,false); }
  if(id==='net'){ msh(Gb(.06,1.3,.06),dk,g,-.4,.65,0); msh(Gb(.06,1.3,.06),dk,g,.4,.65,0); msh(Gb(.9,.06,.06),dk,g,0,1.28,0); const nm=new TH.MeshStandardMaterial({map:ctex(128,128,(c,w,h)=>{ c.strokeStyle='#d8c8a0'; c.lineWidth=3; for(let i=0;i<w;i+=14){ c.beginPath(); c.moveTo(i,0); c.lineTo(i,h); c.stroke(); c.beginPath(); c.moveTo(0,i); c.lineTo(w,i); c.stroke(); } }),transparent:true,side:TH.DoubleSide,alphaTest:.3}); msh(new TH.PlaneGeometry(.78,1),nm,g,0,.75,0,false); for(let i=0;i<3;i++) msh(Gs(1,10,8),mat('#9ab0c8',{roughness:.3,metalness:.4}),g,-.2+i*.2,.5+i*.15,.03).scale.set(.04,.06,.12); }
  if(id==='palms'){ msh(jarGeo(),mat('#2f6f8a',{roughness:.5}),g).scale.setScalar(1.1); for(let i=0;i<5;i++){ const f=msh(frondGeo(),mat('#4f9a3a',{side:TH.DoubleSide}),g,0,.6,0); f.rotation.set(-.35,i/5*TAU,0); f.scale.setScalar(.65); } }
  if(id==='flamelamp'){ msh(Gc(.16,.2,.06,14),gold,g,0,.03,0); msh(Gc(.03,.03,.9,8),gold,g,0,.48,0); msh(Gs(.1,12,10),gold,g,0,.97,0).scale.set(1.2,.6,1); const f=msh(Gk(.07,.22,8),mat('#ff9a3a',{emissive:'#ff6a10',emissiveIntensity:1.6}),g,0,1.12,0,false); const L=new TH.PointLight(0xff9a50,.9,4,2); L.position.set(0,1.15,0); g.add(L); g.userData.flame=f; }
  if(id==='gideonjar'){ msh(jarGeo(),clay,g).scale.setScalar(1.1); const f=msh(Gk(.08,.26,8),mat('#ff9a3a',{emissive:'#ff6a10',emissiveIntensity:1.6}),g,0,.8,0,false); msh(Gc(.015,.02,.5,6),mat('#6b4a2a'),g,.25,.5,0).rotation.z=-.3; msh(Gs(.12,10,8),mat('#d8c8a0'),g,.38,.75,0).scale.set(1,1.5,1); g.userData.flame=f; }
  if(id==='honeycomb'){ const h=pedestal(g,.35,'#8a6a3a'); const hm=mat('#f0b030',{roughness:.3,emissive:'#5a3a00'}); for(let i=0;i<7;i++){ const a=i/6*TAU; const cc=msh(Gc(.11,.11,.16,6),hm,g,i?Math.cos(a)*.2:0,h+.1,i?Math.sin(a)*.2:0); } msh(Gs(.06,8,6),mat('#f2c230'),g,.1,h+.32,.05).scale.set(1,1,1.4); }
  if(id==='trowel'){ const h=pedestal(g,.3,'#7a6a5a'); for(let i=0;i<4;i++) msh(Gb(.28,.14,.18),stoneM,g,-.08+(i%2)*.18,h+.07+Math.floor(i/2)*.14,0); const tw=new TH.Group(); tw.position.set(.15,h+.4,.12); tw.rotation.z=-.6; g.add(tw); msh(Gb(.18,.01,.12),mat('#b8bcc8',{metalness:.8,roughness:.3}),tw); msh(Gc(.02,.02,.16,6),mat('#6b4a2a'),tw,-.14,.03,0).rotation.z=PI/2; }
  if(id==='lostcoin'){ const h=pedestal(g,.45,'#5a3a6a'); const c2=msh(Gc(.16,.16,.035,24),mat('#e8b94a',{roughness:.25,metalness:.9}),g,0,h+.22,0); c2.rotation.x=PI/2; const s2=sprite(tx('glow'),.7); s2.position.y=h+.22; g.add(s2); g.userData.coin=c2; }
  if(id==='trophy'){ const h=pedestal(g,.35,'#3a2a5a'); const gm=mat('#f0c64a',{roughness:.2,metalness:.9}); msh(lathe('cup',[[0,0],[.14,0],[.14,.03],[.04,.06],[.035,.22],[.06,.26],[.17,.36],[.19,.52],[0,.52]],22),gm,g,0,h,0); for(const s2 of [-1,1]){ const hd=msh(Gt(.07,.015,6,12,PI),gm,g,s2*.19,h+.42,0); hd.rotation.z=s2>0?-PI/2:PI/2; } msh(starGeo(.06,.025,.02),mat('#fff6c8',{emissive:'#ffe08a',emissiveIntensity:1}),g,0,h+.3,.12,false); }
  if(id==='anchor'){ const h=pedestal(g,.2,'#5a6a7a'); const am=mat('#5a6070',{roughness:.4,metalness:.8}); msh(Gc(.03,.03,.9,8),am,g,0,h+.45,0); msh(Gt(.07,.02,6,14),am,g,0,h+.94,0); msh(Gb(.4,.04,.04),am,g,0,h+.75,0); msh(Gt(.3,.035,8,20,PI),am,g,0,h+.3,0).rotation.z=PI; }
  g.traverse(o=>{ if(o.isMesh&&id!=='rug'&&o.castShadow!==false){ o.castShadow=true; o.receiveShadow=true; } });
  return g;
}
