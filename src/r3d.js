/* ===================== 3D VIEW: renderer, world, battles, house ===================== */
const glc=document.getElementById('gl');
let RD=null;
try{ RD=new TH.WebGLRenderer({canvas:glc,antialias:true,powerPreference:'high-performance'}); }catch(e){ RD=null; }
if(!RD||!RD.getContext()) return {ok:false};
RD.outputEncoding=TH.sRGBEncoding; RD.toneMapping=TH.ACESFilmicToneMapping; RD.toneMappingExposure=1.06;
RD.shadowMap.enabled=true; RD.shadowMap.type=TH.PCFSoftShadowMap;
const cam=new TH.PerspectiveCamera(40,1,.1,320);
const ray=new TH.Raycaster(); ray.camera=cam; const ndc=new TH.Vector2(), V=new TH.Vector3(), V2=new TH.Vector3();
let gw=0, gh=0, curQ3='', zoomW=1, zoomH=1, lastT=0;
const X3=x=>(x+.5)*TL, Z3=y=>(y+.5)*TL;
const quality=()=>(S&&S.gfx)||'high';
function applyQuality(){ const q=quality(); if(q===curQ3) return; curQ3=q;
  RD.setPixelRatio(Math.min(window.devicePixelRatio||1, q==='low'?1:(isTouch?1.6:2))); RD.shadowMap.enabled=q!=='low'; gw=0;
  MATS.forEach(m=>m.needsUpdate=true); [W.scene,BT&&BT.scene,HS&&HS.scene].forEach(sc=>sc&&sc.traverse(o=>{ if(o.material) (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true); })); }
function fit(){ const w=glc.clientWidth||innerWidth, h=glc.clientHeight||innerHeight; if(w===gw&&h===gh) return; gw=w; gh=h; RD.setSize(w,h,false); cam.aspect=w/h; cam.updateProjectionMatrix(); }
function frameDt(tm){ const dt=Math.min(.05,Math.max(0,tm-(lastT||tm))); lastT=tm; return dt; }
function disposeTree(o){ o.traverse(x=>{ if(x.geometry&&!(x.geometry.userData&&x.geometry.userData.cached)) x.geometry.dispose();
  if(x.material){ (Array.isArray(x.material)?x.material:[x.material]).forEach(m=>{ if(m.userData&&m.userData.cached) return; if(m.map&&!(m.map.userData&&m.map.userData.cached)) m.map.dispose(); m.dispose(); }); }
  if(x.dispose&&x.isInstancedMesh) x.dispose(); }); }
const EMO=new Map(); function emo(e){ if(!EMO.has(e)){ const t=emojiTex(e); t.userData={cached:true}; EMO.set(e,t); } return EMO.get(e); }
const MARK={}; function markTex(ch){ if(MARK[ch]) return MARK[ch]; const T2=ctex(128,128,(g,w,h)=>{ g.fillStyle=ch==='!'?'#e8b94a':'#7cc4ff'; g.beginPath(); g.arc(64,64,54,0,TAU); g.fill(); g.lineWidth=8; g.strokeStyle='#fff6d8'; g.stroke(); g.fillStyle='#1d1406'; g.font='900 78px Nunito, sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(ch,64,70); }); T2.userData={cached:true}; return MARK[ch]=T2; }
function topSprite(tex,h,aspect){ const s=sprite(tex,h,aspect); s.material.depthTest=false; s.renderOrder=20; return s; }
function chStage(id){ const c=S&&S.chs[id]; return c?c.stage:0; }
function skyTex(top,mid,bot){ return ctex(4,256,(g,w,h)=>{ const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,top); gr.addColorStop(.55,mid); gr.addColorStop(1,bot); g.fillStyle=gr; g.fillRect(0,0,w,h); }); }
function atmos(R,chId){ const th=R.th, night=!!R.night, lit=night&&chStage(chId)>=3;
  if(night) return {top:'#060a22',mid:lit?'#24306a':'#1b2450',bot:lit?'#4a4a7a':'#34386a',fog:lit?'#2a3060':'#1b2450',hs:lit?'#8ea0e0':'#6a7ac0',hg:'#2a2a3a',hi:lit?.55:.38,sc:lit?'#ffe9c0':'#a8b8ff',si:lit?.75:.45,night:1};
  return {top:hexMix(th.sky,'#2f6fc8',.5),mid:th.sky,bot:hexMix(th.sky,'#ffffff',.55),fog:hexMix(th.sky,'#ffffff',.35),hs:hexMix(th.sky,'#ffffff',.4),hg:hexMul(th.g,.7),hi:.78,sc:'#fff1d6',si:1.55,night:0}; }

/* ===================== WORLD ===================== */
const W={m:null,scene:new TH.Scene(),root:null,ents:new Map(),foes:new Map(),items:[],dyn:[],anim:[],player:null,psig:'',pet:null,petId:'',ground:null,waterTex:null,
  ppos:new TH.Vector3(),pface:0,petPos:new TH.Vector3(),petFace:0,camPos:new TH.Vector3(),camLook:new TH.Vector3(),night:0,atKey:'',snap:true,lantern:null,sky:null};
W.hemi=new TH.HemisphereLight(0xffffff,0x887755,.8); W.scene.add(W.hemi);
W.sun=new TH.DirectionalLight(0xffffff,1.5); W.sun.castShadow=true; W.sun.shadow.mapSize.set(isTouch?1024:2048,isTouch?1024:2048);
Object.assign(W.sun.shadow.camera,{left:-15,right:15,top:15,bottom:-15,near:1,far:70}); W.sun.shadow.bias=-.0004; W.sun.shadow.normalBias=.03; W.scene.add(W.sun,W.sun.target);
W.lantern=new TH.PointLight(0xffc878,0,9,1.6); W.scene.add(W.lantern);
function setAtmos(R,chId){ const a=atmos(R,chId); const key=JSON.stringify(a); if(key===W.atKey) return; W.atKey=key; W.night=a.night;
  if(W.sky) W.sky.dispose(); W.sky=skyTex(a.top,a.mid,a.bot); W.scene.background=W.sky; W.scene.fog=new TH.Fog(c3(a.fog).getHex(),30,78);
  W.hemi.color.copy(c3(a.hs)); W.hemi.groundColor.copy(c3(a.hg)); W.hemi.intensity=a.hi; W.sun.color.copy(c3(a.sc)); W.sun.intensity=a.si; W.lantern.intensity=a.night?1.3:0; }
function clearWorld(){ if(W.root){ W.scene.remove(W.root); disposeTree(W.root); } W.root=null; W.ents.clear(); W.foes.clear(); W.items=[]; W.dyn=[]; W.anim=[]; W.lmRoots=[]; W.player=null; W.psig=''; W.pet=null; W.petId=''; W.ground=null; W.m=null; W.byTile=null; W.fade=null; W.life=null; CUT=null; }
const isWet=v=>v===T.W||v===T.BR;
function paintGround(m,th,P){
  const Wt=m.W, Ht=m.H, R=rng(m.R.seed*7+3);
  return ctex(Wt*P,Ht*P,(g,w,h)=>{
    g.fillStyle=th.g; g.fillRect(0,0,w,h);
    for(let i=0;i<Wt*Ht/5;i++){ const x=R()*w,y=R()*h,r=P*(1+R()*3.5); const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,R()<.5?hexMix(th.g2,'#000000',.12)+'88':hexMix(th.g,'#ffffff',.1)+'55'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(x-r,y-r,r*2,r*2); }
    const sh=[hexMul(th.g,.82),hexMul(th.g,1.08),th.g2,hexMul(th.g2,.9),hexMix(th.g,'#fff8d0',.1)];
    for(let i=0;i<Wt*Ht*26;i++){ g.fillStyle=sh[(R()*sh.length)|0]; g.globalAlpha=.3+R()*.4; g.fillRect(R()*w,R()*h,1+R()*1.6*P/32,(2+R()*3)*P/32); }
    g.globalAlpha=1;
    const sand=hexMix(th.p,th.g,.35);
    for(let y=0;y<Ht;y++) for(let x=0;x<Wt;x++) if(isWet(m.get(x,y))){ g.fillStyle=sand; g.fillRect(x*P-P*.15,y*P-P*.15,P*1.3,P*1.3); }
    const isP=(x,y)=>{ const v=m.get(x,y); return v===T.P||v===T.BR; };
    const pass=(col,r,wd,alpha)=>{ g.fillStyle=col; g.globalAlpha=alpha; for(let y=0;y<Ht;y++) for(let x=0;x<Wt;x++){ if(m.get(x,y)!==T.P) continue; const cx=(x+.5)*P, cy=(y+.5)*P;
        g.beginPath(); g.arc(cx,cy,r*P,0,TAU); g.fill(); if(isP(x+1,y)) g.fillRect(cx,cy-wd*P/2,P,wd*P); if(isP(x,y+1)) g.fillRect(cx-wd*P/2,cy,wd*P,P); } g.globalAlpha=1; };
    pass(hexMul(th.p,.75),.66,1.32,.45); pass(th.p,.54,1.08,1);
    const pc=[hexMul(th.p,.88),hexMix(th.p,'#ffffff',.25),hexMul(th.p,.8)];
    for(let y=0;y<Ht;y++) for(let x=0;x<Wt;x++){ if(m.get(x,y)!==T.P) continue; for(let k=0;k<10;k++){ g.fillStyle=pc[k%3]; g.globalAlpha=.6; const s=1+R()*2.2*P/32; g.fillRect((x+.15+R()*.7)*P,(y+.15+R()*.7)*P,s,s); } }
    g.globalAlpha=1;
    if(th.deco==='flower'){ const fc=['#fff6c8','#f7c6dc','#ffe066','#c7b4ff','#ffffff']; for(let i=0;i<Wt*Ht*.9;i++){ const x=R()*Wt, y=R()*Ht; if(m.get(x|0,y|0)!==T.G&&m.get(x|0,y|0)!==T.D) continue; g.fillStyle=fc[(R()*5)|0]; g.beginPath(); g.arc(x*P,y*P,P*(.04+R()*.04),0,TAU); g.fill(); } }
  }); }
function buildTerrain(m,th,root){
  const Wt=m.W, Ht=m.H, seg=2;
  const geoT=new TH.PlaneGeometry(Wt*TL,Ht*TL,Wt*seg,Ht*seg); geoT.rotateX(-PI/2); geoT.translate(Wt*TL/2,0,Ht*TL/2);
  const pa=geoT.attributes.position;
  for(let i=0;i<pa.count;i++){ const x=pa.getX(i)/TL, z=pa.getZ(i)/TL; let w=0;
    for(const dx of [-.49,.49]) for(const dz of [-.49,.49]){ const tx=Math.floor(x+dx), tz=Math.floor(z+dz); if(tx>=0&&tz>=0&&tx<Wt&&tz<Ht&&isWet(m.get(tx,tz))) w++; }
    let y=w===4?-.55:-.42*w/4; const edge=Math.min(x,z,Wt-x,Ht-z); if(edge<1.6&&!w) y+=(1.6-edge)*.18*(1+Math.sin(x*1.7+z*2.3)*.4); pa.setY(i,y); }
  geoT.computeVertexNormals();
  const P=Math.max(12,Math.min(32,Math.floor(4096/Math.max(Wt,Ht))));
  const tex=paintGround(m,th,P); tex.anisotropy=Math.min(8,RD.capabilities.getMaxAnisotropy());
  const g=msh(geoT,new TH.MeshStandardMaterial({map:tex,roughness:.96}),root,0,0,0,false); W.ground=g;
  const outer=mat(hexMul(th.g,.86),{roughness:1}); const pad=70, MW=Wt*TL, MH=Ht*TL;
  const frame=(x,z,w,d)=>{ const p=msh(new TH.PlaneGeometry(w,d),outer,root,x,-.02,z,false); p.rotation.x=-PI/2; };
  frame(-pad/2,MH/2,pad,MH+pad*2); frame(MW+pad/2,MH/2,pad,MH+pad*2); frame(MW/2,-pad/2,MW,pad); if(!m.R.sea) frame(MW/2,MH+pad/2,MW,pad);
  let hasW=false; for(let i=0;i<Wt*Ht;i++) if(isWet(m.t[i])){ hasW=true; break; }
  if(hasW||m.R.sea){ const wc=th.w||'#3f8fd0';
    const wt=ctex(256,256,(c,w,h)=>{ c.fillStyle=wc; c.fillRect(0,0,w,h); c.strokeStyle=hexMix(wc,'#ffffff',.45); c.lineWidth=2; c.globalAlpha=.55; for(let i=0;i<26;i++){ const x=Math.random()*w, y=Math.random()*h, l=12+Math.random()*26; c.beginPath(); c.moveTo(x,y); c.quadraticCurveTo(x+l/2,y-4,x+l,y); c.stroke(); } },[Wt/3,Ht/3]);
    W.waterTex=wt; const wm=new TH.MeshStandardMaterial({map:wt,roughness:.12,metalness:.08,transparent:true,opacity:.9});
    const ex=m.R.sea?pad:0; const wp=msh(new TH.PlaneGeometry(MW+ex*2,MH+ex*2),wm,root,MW/2,-.16,MH/2+ex/2,false); wp.rotation.x=-PI/2; wp.receiveShadow=true; } else W.waterTex=null;
  // bridges
  const plank=texMat('wood',{roughness:.8}), post=mat('#6b4a2a');
  for(let y=0;y<Ht;y++) for(let x=0;x<Wt;x++){ if(m.get(x,y)!==T.BR) continue;
    const nb=(dx,dy)=>{ const v=m.get(x+dx,y+dy); return v===T.BR?2:(!isWet(v)?1:0); }; const along=nb(-1,0)+nb(1,0)>nb(0,-1)+nb(0,1);
    const b=new TH.Group(); b.position.set(X3(x),0,Z3(y)); if(along) b.rotation.y=PI/2; root.add(b);
    msh(Gb(TL*.82,.09,TL*1.02),plank,b,0,.02,0,false); for(const s of [-1,1]){ msh(Gb(.06,.09,TL*1.02),post,b,s*TL*.41,.3,0); msh(Gb(.08,.42,.08),post,b,s*TL*.41,.12,TL*.42); msh(Gb(.08,.42,.08),post,b,s*TL*.41,.12,-TL*.42); } }
}
function buildScenery(m,th,root){
  const Bk=new Bucket(), Dk=new Bucket(); const Wt=m.W, Ht=m.H, seed=m.R.seed;
  const deco=th.deco, green=['grass','flower','wheat'].includes(deco);
  for(let y=0;y<Ht;y++) for(let x=0;x<Wt;x++){ const v=m.get(x,y), h=hash(x+seed,y);
    Bk.tk=y*Wt+x;
    if(v===T.B){ const kind=th.obs[Math.floor(h*th.obs.length)]; const j=(kind==='brick'||kind==='house')?0:.14; placeObstacle(Bk,kind,X3(x)+(hash(x,y+seed)-.5)*j*2,Z3(y)+(hash(y,x+seed)-.5)*j*2,h); }
    else if(v===T.D) placeDeco(Dk,deco,X3(x),Z3(y),h);
    else if(v===T.G){ const r=hash(x*3+seed,y*7); if(green&&r<.14) placeDeco(Dk,'grass',X3(x),Z3(y),r*7%1); else if(!green&&r<.06) placeDeco(Dk,'pebble',X3(x),Z3(y),r*5%1); } }
  Bk.tk=null; Bk.byTile=W.byTile=new Map(); W.fade=new Map();
  // outskirts: trees beyond the border and distant hills
  const R=rng(seed+5), outs=th.obs.filter(k=>k!=='brick'&&k!=='house'&&k!=='cactus'); if(!outs.length) outs.push('rock');
  for(let y=-7;y<Ht+7;y++) for(let x=-7;x<Wt+7;x++){ if(x>=0&&y>=0&&x<Wt&&y<Ht) continue; if(m.R.sea&&y>=Ht-2) continue; if(R()<.42){ const h=R(); placeObstacle(Bk,outs[Math.floor(h*outs.length)],X3(x)+(R()-.5)*.6,Z3(y)+(R()-.5)*.6,h); } }
  Bk.build(root); Dk.build(root,true);
  const hm=mat(hexMul(th.g2,.78),{roughness:1,flatShading:true}); const MW=Wt*TL, MH=Ht*TL;
  for(let i=0;i<34;i++){ const a=i/34*TAU+R()*.1; const rx=MW/2+Math.cos(a)*(MW/2+18+R()*16), rz=MH/2+Math.sin(a)*(MH/2+16+R()*14); if(m.R.sea&&rz>MH) continue; const hh=msh(Gi(1,1),hm,root,rx,-1,rz,false); hh.scale.set(9+R()*9,4+R()*5,8+R()*8); }
}
const FM=new TH.Matrix4(), FS=new TH.Matrix4(), FT=new TH.Matrix4();
function setTileF(tk,f){ const L=W.byTile.get(tk); if(!L) return; const x=(tk%W.m.W+.5)*TL, z=(Math.floor(tk/W.m.W)+.5)*TL; const ims=new Set();
  FS.makeScale(f,f,f); FT.makeTranslation(x,0,z); FM.multiplyMatrices(FT,FS); FT.makeTranslation(-x,0,-z); FM.multiply(FT);
  L.forEach(o=>{ FS.multiplyMatrices(FM,o.m); o.im.setMatrixAt(o.i,FS); ims.add(o.im); }); ims.forEach(im=>im.instanceMatrix.needsUpdate=true); }
function updFade(dt){ if(!W.byTile) return; const px=Math.round(P.fx), py=Math.round(P.fy), Wt=W.m.W; const want=new Set();
  for(let dy=1;dy<=3;dy++) for(let dx=-(dy<3?2:1);dx<=(dy<3?2:1);dx++){ const x=px+dx, y=py+dy; if(x>=0&&y>=0&&x<Wt&&y<W.m.H&&W.byTile.has(y*Wt+x)) want.add(y*Wt+x); }
  want.forEach(k=>{ if(!W.fade.has(k)) W.fade.set(k,1); });
  W.fade.forEach((f,k)=>{ const tgt=want.has(k)?.08:1; const nf=Math.abs(tgt-f)<.02?tgt:dmp(f,tgt,10,dt); if(nf!==f){ setTileF(k,nf); } if(nf===1&&!want.has(k)) W.fade.delete(k); else W.fade.set(k,nf); }); }
function lmCtx(){ const id=W.m&&W.m.id; return {stage:()=>id==='hub'?0:chStage(id),sign:k=>t(k)}; }
function buildWorld(m){
  clearWorld(); W.m=m; const R=m.R, th=R.th, root=new TH.Group(); W.root=root; W.scene.add(root);
  setAtmos(R,m.id); buildTerrain(m,th,root); buildScenery(m,th,root);
  m.lms.forEach(lm=>{ const o=buildLandmark(lm,lmCtx()); root.add(o.root); W.lmRoots.push(o.root); const d={lm,o,key:chStage(m.id)}; if(lm.dyn||lm.k==='ark') W.dyn.push(d); if(o.update) W.anim.push(d); });
  (m.items||[]).forEach(it=>{ const g=new TH.Group(); g.position.set(X3(it.x),0,Z3(it.y)); const glow=sprite(tx('glow'),1.3); glow.material.opacity=.75; glow.position.y=.55; g.add(glow); const s=sprite(emo(it.e),.62); s.position.y=.6; g.add(s); const ring=msh(geo('itring',()=>new TH.RingGeometry(.28,.36,28)),basic('#fff2b0',{transparent:true,opacity:.6,depthWrite:false}),g,0,.03,0,false); ring.rotation.x=-PI/2; root.add(g); W.items.push({it,g,s}); });
  W.life=buildLife(m);
  W.snap=true;
}
function rebuildDyn(d){ W.root.remove(d.o.root); W.lmRoots=W.lmRoots.filter(r=>r!==d.o.root); disposeTree(d.o.root); d.o=buildLandmark(d.lm,lmCtx()); W.root.add(d.o.root); W.lmRoots.push(d.o.root); d.key=chStage(W.m.id); }

/* ---- entities ---- */
function gateState(e){ return !isOpen(e.ch)?'locked':(chStage(e.ch)>=4?'done':'open'); }
function entKey(e){ if(e.kind==='gate') return 'g'+gateState(e)+LANG; if(e.kind==='npc') return 'n'+e.name; return e.kind; }
function makeEnt(e){
  const o={key:entKey(e),root:new TH.Group()}; const r=o.root;
  if(e.kind==='npc'){ o.P=buildPerson(e.look,{staff:e.staff,angel:e.angel}); r.add(o.P.root); r.position.set(X3(e.x),0,Z3(e.y)); o.face=0; o.t0=e.x*1.7+e.y;
    o.mark=topSprite(markTex('!'),.5); o.mark.position.y=2.15; o.mark.visible=false; r.add(o.mark);
    const L=labelTex(e.name); o.label=topSprite(L.tex,.3,L.aspect); o.label.position.y=e.angel?1.95:1.78; o.label.visible=false; r.add(o.label); }
  else if(e.kind==='gate'){ const st=gateState(e); const sky=CH[e.ch].th.sky; const gt=buildGate(POS(e.ch),st,sky+'33'); o.upd=gt.update; r.add(gt.root); r.position.set((e.x+1)*TL,0,(e.y+.6)*TL);
    const L=labelTex(`${POS(e.ch)} · ${CH[e.ch].name}`,{fg:st==='locked'?'#aab4da':'#f6de98'}); o.label=topSprite(L.tex,.27,L.aspect); o.label.position.y=3.85; o.label.visible=false; r.add(o.label); }
  else if(e.kind==='exit'){ const ex=buildExit(); o.upd=ex.update; r.add(ex.root); r.rotation.y=PI/2.7; r.position.set(X3(e.x)-.1,0,Z3(e.y)); }
  else if(e.kind==='boss'){ const b=CH[M.id].boss; o.G=buildBoss3(b.kind,b.c); o.G.root.scale.setScalar(1.15); r.add(o.G.root); r.position.set(X3(e.x),0,Z3(e.y)); if(o.G.setMarches) o.G.setMarches(0);
    const L=labelTex(b.name,{fg:'#ffb8a8'}); o.label=topSprite(L.tex,.34,L.aspect); o.label.position.y=2.6; r.add(o.label); }
  else return null;
  r.traverse(x=>{ if(x.isMesh) x.userData.ent=e; });
  return o;
}
function syncEnts(dt,tm){
  const seen=new Set(); const px=P.fx, py=P.fy;
  for(const e of M.ents){ let o=W.ents.get(e); const key=entKey(e);
    if(o===undefined||(o&&o.key!==key)){ if(o){ W.root.remove(o.root); disposeTree(o.root); } o=makeEnt(e); W.ents.set(e,o); if(o) W.root.add(o.root); }
    seen.add(e); if(!o) continue;
    const d=Math.abs(e.x-px)+Math.abs(e.y-py);
    if(e.kind==='npc'){ if(d<4.5){ const a=Math.atan2(X3(px)-X3(e.x),Z3(py)-Z3(e.y)); o.face+=angTo(o.face,a)*Math.min(1,dt*4); } else o.face+=angTo(o.face,0)*Math.min(1,dt*2); o.P.root.rotation.y=o.face; o.P.update(dt,0,tm+o.t0);
      const mk2=npcMark(e); o.mark.visible=!!mk2; if(mk2){ if(o.mark.material.map!==markTex(mk2)){ o.mark.material.map=markTex(mk2); } o.mark.position.y=2.15+Math.sin(tm*4)*.06; }
      o.label.visible=d<6&&!(P.x===e.x&&P.y===e.y+1); }
    else if(e.kind==='gate'){ if(o.upd) o.upd(tm); o.label.visible=d<5; }
    else if(e.kind==='exit'){ if(o.upd) o.upd(tm); }
    else if(e.kind==='boss'){ o.G.update(dt,tm); const a=Math.atan2(X3(px)-X3(e.x),Z3(py)-Z3(e.y)); o.G.root.rotation.y+=angTo(o.G.root.rotation.y,a)*Math.min(1,dt*3); o.label.visible=d<7; }
  }
  for(const [e,o] of W.ents) if(!seen.has(e)){ if(o){ W.root.remove(o.root); disposeTree(o.root); } W.ents.delete(e); }
}
function syncFoes(dt,tm){
  const seen=new Set(); const fl=CH[M.id]&&CH[M.id].foes;
  for(const f of M.foes){ let o=W.foes.get(f); if(!o){ const ft=fl[f.type]||fl[0]; o=buildFoe(ft.shape,ft.c); o.root.scale.setScalar(.6); o.face=0; o.root.traverse(x=>{ if(x.isMesh) x.userData.foe=f; }); W.root.add(o.root); W.foes.set(f,o); }
    seen.add(f); o.root.position.set(X3(f.fx),0,Z3(f.fy)); const a=Math.atan2(X3(P.fx)-X3(f.fx),Z3(P.fy)-Z3(f.fy)); o.face+=angTo(o.face,a)*Math.min(1,dt*5); o.root.rotation.y=o.face; o.update(dt,tm+f.seed); }
  for(const [f,o] of W.foes) if(!seen.has(f)){ W.root.remove(o.root); disposeTree(o.root); W.foes.delete(f); }
}
function petIcon(id){ const g=new TH.Group(); const c=COMPS[id]; const glow=sprite(tx('glow'),1.5); glow.material.opacity=.55; glow.position.y=.6; g.add(glow);
  const sp=sprite(emo(c?c.e:'🐑'),1.0); sp.position.y=.6; g.add(sp);
  const sh=msh(geo('pshadow',()=>new TH.CircleGeometry(.34,24)),basic('#000000',{transparent:true,opacity:.22,depthWrite:false}),g,0,.02,0,false); sh.rotation.x=-PI/2;
  const ring=msh(geo('pring',()=>new TH.RingGeometry(.36,.42,32)),basic('#f6de98',{transparent:true,opacity:.75,depthWrite:false}),g,0,.03,0,false); ring.rotation.x=-PI/2;
  const o={root:g,kind:'icon',height:1.15,ph:0}; o.update=(dt,speed,t)=>{ o.ph+=dt*(speed>.3?12:3); sp.position.y=.6+Math.abs(Math.sin(o.ph))*(speed>.3?.12:.05); sp.material.rotation=speed>.3?Math.sin(o.ph)*.08:0; }; return o; }
const petModel=id=>(S&&S.petStyle==='3d')?petModel3(id):petIcon(id);
function playerSig(){ return JSON.stringify([S.look,S.props,S.armor]); }
function personOpts(extra){ return Object.assign({props:Object.assign({},S.props||{}),armor:S.armor},extra||{}); }
const DIRANG={down:0,up:PI,left:-PI/2,right:PI/2};
function renderWorld(tm){
  const dt=frameDt(tm); applyQuality(); fit();
  if(W.m!==M) buildWorld(M);
  const R=M.R; setAtmos(R,M.id);
  W.dyn.forEach(d=>{ if(d.key!==chStage(M.id)) rebuildDyn(d); });
  W.anim.forEach(d=>d.o.update&&d.o.update(tm));
  if(W.waterTex){ W.waterTex.offset.x=(tm*.012)%1; W.waterTex.offset.y=(tm*.007)%1; }
  // player
  const sig=playerSig(); if(sig!==W.psig){ const old=W.player; W.player=buildPerson(S.look,personOpts({light:false})); W.root.add(W.player.root); if(old){ W.root.remove(old.root); disposeTree(old.root); } W.psig=sig; }
  const px3=X3(P.fx), pz3=Z3(P.fy); const ox=W.ppos.x, oz=W.ppos.z;
  if(W.snap){ W.ppos.set(px3,0,pz3); W.pface=DIRANG[P.dir]||0; } else { W.ppos.x=dmp(W.ppos.x,px3,15,dt); W.ppos.z=dmp(W.ppos.z,pz3,15,dt); }
  const spd=dt>0?Math.hypot(W.ppos.x-ox,W.ppos.z-oz)/dt:0;
  W.pface+=angTo(W.pface,P.ang!=null?P.ang:(DIRANG[P.dir]||0))*Math.min(1,dt*13);
  const pl=W.player; pl.root.position.copy(W.ppos); pl.root.rotation.y=W.pface; pl.update(dt,W.snap?0:Math.min(spd,6)*.62,tm); pl.root.visible=!(P.blink&&P.inv>0&&Math.floor(tm*12)%2&&mode==='world');
  if(W.night){ W.lantern.position.set(W.ppos.x,1.6,W.ppos.z+.3); }
  // pet
  const pkey=petKey(S.comp); if(pkey!==W.petId){ const old=W.pet; W.pet=petModel(S.comp); W.petId=pkey; W.root.add(W.pet.root); if(old){ W.petPos.copy(old.root.position); W.root.remove(old.root); disposeTree(old.root); } else W.petPos.set(X3(CP.fx),0,Z3(CP.fy)); }
  if(W.pet){ const ptx=X3(CP.fx), ptz=Z3(CP.fy); const px0=W.petPos.x, pz0=W.petPos.z;
    if(W.snap) W.petPos.set(ptx,0,ptz); else { W.petPos.x=dmp(W.petPos.x,ptx,7,dt); W.petPos.z=dmp(W.petPos.z,ptz,7,dt); }
    const dx=W.petPos.x-W.ppos.x, dz=W.petPos.z-W.ppos.z, dd=Math.hypot(dx,dz); if(dd<.75&&dd>1e-4){ W.petPos.x=W.ppos.x+dx/dd*.75; W.petPos.z=W.ppos.z+dz/dd*.75; }
    const mvx=W.petPos.x-px0, mvz=W.petPos.z-pz0, ps=dt>0?Math.hypot(mvx,mvz)/dt:0;
    const want=ps>.3?Math.atan2(mvx,mvz):Math.atan2(W.ppos.x-W.petPos.x,W.ppos.z-W.petPos.z); W.petFace+=angTo(W.petFace,want)*Math.min(1,dt*7);
    { const cs=S.comps[S.comp]; const tier=cs?(cs.lvl>=8?2:cs.lvl>=4?1:0):0; W.pet.root.scale.setScalar(1+tier*.12); } W.pet.root.position.copy(W.petPos); W.pet.root.rotation.y=W.petFace; W.pet.update(dt,ps,tm); }
  syncEnts(dt,tm); syncFoes(dt,tm); updFade(dt); updLife(dt,tm);
  const c=M.id!=='hub'&&S.chs[M.id];
  W.items.forEach(o=>{ const vis=!!c&&c.side===1&&!c.got.includes(o.it.idx); o.g.visible=vis; if(vis){ o.s.position.y=.62+Math.sin(tm*3+o.it.idx)*.08; } });
  // camera
  const a=gw/gh, k=(a<1?Math.min(1.75,1.08/a):1)*zoomW;
  const look=V.set(W.ppos.x,.9,W.ppos.z); const cpos=V2.set(look.x,look.y+6.4*k+.4,look.z+8.2*k);
  if(CUT&&cutCam(dt)){} else if(W.snap){ W.camLook.copy(look); W.camPos.copy(cpos); W.snap=false; } else { W.camLook.lerp(look,1-Math.exp(-dt*7)); W.camPos.lerp(cpos,1-Math.exp(-dt*5)); }
  cam.clearViewOffset(); cam.position.copy(W.camPos); cam.lookAt(W.camLook);
  const sh=Math.max(15,13*k); const sc=W.sun.shadow.camera; if(sc.right!==sh){ sc.left=-sh; sc.right=sh; sc.top=sh; sc.bottom=-sh; sc.updateProjectionMatrix(); }
  W.sun.position.set(W.camLook.x+7,15,W.camLook.z+4); W.sun.target.position.set(W.camLook.x,0,W.camLook.z-2); W.sun.target.updateMatrixWorld();
  RD.render(W.scene,cam);
}
function screenOf(x,y,z){ V.set(x,y,z).project(cam); return [(V.x+1)/2*gw,(1-V.y)/2*gh,V.z]; }
function pick(cx,cy){
  if(!W.root) return null; const r=glc.getBoundingClientRect(); const x=cx-r.left, y=cy-r.top;
  ndc.set(x/gw*2-1,-(y/gh)*2+1); ray.setFromCamera(ndc,cam);
  const objs=[]; W.ents.forEach(o=>{ if(o) objs.push(o.root); }); W.foes.forEach(o=>objs.push(o.root));
  const hits=ray.intersectObjects(objs,true).filter(h=>h.object.isMesh);
  for(const h of hits){ if(h.object.userData.foe) return {foe:h.object.userData.foe}; if(h.object.userData.ent) return {ent:h.object.userData.ent}; }
  let best=null, bd=isTouch?52:40;
  for(const f of M.foes){ const [sx,sy]=screenOf(X3(f.fx),.55,Z3(f.fy)); const d=Math.hypot(sx-x,sy-y); if(d<bd){ bd=d; best={foe:f}; } }
  for(const e of M.ents){ if(e.kind==='home') continue; const w=e.w||1,h=e.h||1; const [sx,sy]=screenOf((e.x+w/2)*TL,e.kind==='gate'?1.3:.9,(e.y+h/2)*TL); const d=Math.hypot(sx-x,sy-y)*(e.kind==='gate'?.6:1); if(d<bd){ bd=d; best={ent:e}; } }
  if(best) return best;
  const lh=ray.intersectObjects(W.lmRoots||[],true).find(h=>h.object.isMesh);
  if(lh){ const p=lh.point; const tx=Math.floor(p.x/TL), ty=Math.floor(p.z/TL); const e=entAt(M,tx,ty); if(e) return {ent:e}; }
  const gh2=W.ground&&ray.intersectObject(W.ground)[0];
  if(gh2){ const tx=Math.floor(gh2.point.x/TL), ty=Math.floor(gh2.point.z/TL); const e=entAt(M,tx,ty); if(e) return {ent:e}; return {tile:{x:tx,y:ty}}; }
  return null;
}

/* ===================== THUMBNAILS ===================== */
let TR=null, TSc=null, TC=null; const THUMB={};
function thumbSetup(){ const c=document.createElement('canvas'); TR=new TH.WebGLRenderer({canvas:c,antialias:true,alpha:true,preserveDrawingBuffer:true}); TR.setPixelRatio(1); TR.setSize(160,160); TR.outputEncoding=TH.sRGBEncoding; TR.toneMapping=TH.ACESFilmicToneMapping; TR.toneMappingExposure=1.1;
  TSc=new TH.Scene(); TSc.add(new TH.HemisphereLight(0xffffff,0x8a7a6a,.85)); const d=new TH.DirectionalLight(0xfff2e0,1.25); d.position.set(2,4,5); TSc.add(d); TC=new TH.PerspectiveCamera(30,1,.05,60); }
function shot(obj,o={}){ if(!TR) thumbSetup(); const sz=o.size||160; TR.setSize(sz,sz); TSc.add(obj); obj.updateMatrixWorld(true);
  const box=new TH.Box3().setFromObject(obj); const c=box.getCenter(new TH.Vector3()), s=box.getSize(new TH.Vector3()); const r=Math.max(s.x,s.y,s.z)*(o.k||1);
  const dir=new TH.Vector3(o.dx??.9,o.dy??.7,1.3).normalize(); TC.position.copy(c).addScaledVector(dir,r*2.05); TC.lookAt(c); TR.render(TSc,TC); const url=TR.domElement.toDataURL(); TSc.remove(obj); disposeTree(obj); return url; }
function thumbPet(id){ const k='p'+id; if(THUMB[k]) return THUMB[k]; const o=buildPet(id); o.update(0,0,1.2); o.root.rotation.y=.6; return THUMB[k]=shot(o.root,{dx:.5,dy:.35}); }
function thumbFurn(id){ const k='f'+id; if(THUMB[k]) return THUMB[k]; return THUMB[k]=shot(buildFurn(id)); }
function thumbProp(slot,id){ const k='r'+slot+id; if(THUMB[k]) return THUMB[k]; const Pp={head:new TH.Group(),hands:[new TH.Group(),new TH.Group()],torso:new TH.Group()}; const root=new TH.Group(); [Pp.head,Pp.hands[1],Pp.torso].forEach(g=>root.add(g)); addProps(Pp,{[slot]:id},{}); if(slot==='back') root.rotation.y=2.6; return THUMB[k]=shot(root,{dx:.6,dy:.5}); }
function avatar(look,opts,size){ if(!TR) thumbSetup(); const p=buildPerson(look,opts||{}); p.root.rotation.y=.35; const sz=size||220; TR.setSize(sz,sz); TSc.add(p.root); p.root.updateMatrixWorld(true);
  const full=opts&&opts.full; if(full){ TC.position.set(.55,1.05,3.2); TC.lookAt(0,.78,0); } else { TC.position.set(.2,1.2,1.3); TC.lookAt(0,1.08,0); }
  TR.render(TSc,TC); const url=TR.domElement.toDataURL(); TSc.remove(p.root); disposeTree(p.root); return url; }

/* ===================== BATTLE ===================== */
let BT=null;
function tween(dur,fn){ return new Promise(res=>{ if(!BT){ fn(1); res(); return; } BT.tw.push({t:0,dur,fn,res}); }); }
const BOSS_SCALE={walls:1,tower:1,idol:1.1,calf:1.1,scroll:1.05,altar:1.1,storm:1.15,whirl:1.05};
function battleStart(){
  if(!B) return; const R=CH[B.ch], th=R.th, sc=new TH.Scene(); const a=atmos(R,B.ch);
  BT={scene:sc,units:new Map(),tw:[],shake:0,orbs:[],sky:skyTex(a.top,a.mid,a.bot)};
  sc.background=BT.sky; sc.fog=new TH.Fog(c3(a.fog).getHex(),16,52);
  sc.add(new TH.HemisphereLight(c3(a.hs).getHex(),c3(a.hg).getHex(),a.hi+.05));
  const sun=new TH.DirectionalLight(c3(a.sc).getHex(),a.si); sun.position.set(3,9,6); sun.castShadow=true; sun.shadow.mapSize.set(1024,1024); Object.assign(sun.shadow.camera,{left:-7,right:7,top:7,bottom:-7}); sun.shadow.normalBias=.03; sc.add(sun);
  const gt=ctex(512,512,(g,w,h)=>{ g.fillStyle=th.g; g.fillRect(0,0,w,h); const sh=[hexMul(th.g,.85),hexMul(th.g,1.1),th.g2]; for(let i=0;i<9000;i++){ g.fillStyle=sh[i%3]; g.globalAlpha=.35+Math.random()*.4; g.fillRect(Math.random()*w,Math.random()*h,1.5,3+Math.random()*3); } },[8,8]);
  const gr=msh(new TH.PlaneGeometry(120,120),new TH.MeshStandardMaterial({map:gt,roughness:.96}),sc,0,-.02,0,false); gr.rotation.x=-PI/2;
  msh(Gc(4.3,4.6,.3,48),texMat('stone',{roughness:.9}),sc,0,0,0);
  const ring=msh(geo('bring',()=>new TH.RingGeometry(3.7,3.95,64)),basic('#f6de98',{transparent:true,opacity:.55}),sc,0,.16,0,false); ring.rotation.x=-PI/2;
  const Bk=new Bucket(); const R2=rng(B.ch*31+7);
  for(let i=0;i<22;i++){ const ang=PI+.12+i/21*(PI-.24), rad=8+R2()*9; const kind=th.obs[Math.floor(R2()*th.obs.length)]; placeObstacle(Bk,kind,Math.cos(ang)*rad,Math.sin(ang)*rad-2,R2()); }
  for(let i=0;i<9;i++){ const ang=PI+.1+i/8*(PI-.2); placeObstacle(Bk,'rock',Math.cos(ang)*5.3,Math.sin(ang)*5.3,R2()); }
  Bk.build(sc);
  for(let i=0;i<10;i++){ const ang=PI+i/9*PI; const hh=msh(Gi(1,1),mat(hexMul(th.g2,.8),{flatShading:true,roughness:1}),sc,Math.cos(ang)*34,-1,Math.sin(ang)*30-6,false); hh.scale.set(10,4+R2()*4,8); }
  if(a.night) for(let i=0;i<60;i++){ const s=msh(Gs(.08,6,4),basic('#ffffff'),sc,(R2()-.5)*80,8+R2()*18,-30-R2()*10,false); }
  // units
  fit(); const port=gw<gh*1.05, XK=port?.62:1;
  const add=(el,obj,kind,x,z,ry,extra)=>{ x*=XK; obj.root.position.set(x,.15,z); obj.root.rotation.y=ry; sc.add(obj.root); obj.root.updateMatrixWorld(true); const bb=new TH.Box3().setFromObject(obj.root);
    const u=Object.assign({el,obj,kind,home:new TH.Vector3(x,.15,z),off:new TH.Vector3(),h:Math.max(.6,bb.max.y-.15),shake:0,flash:0,scale:obj.root.scale.x},extra||{}); BT.units.set(el,u); return u; };
  const pl=buildPerson(S.look,personOpts()); BT.player=add($('#bPlayer'),pl,'player',-2.1,0,PI/2-.55,{dir:1});
  const pet=petModel(S.comp); if(pet.kind==='icon') pet.root.scale.setScalar(port?1.0:1.35); BT.pet=add($('#bComp'),pet,'pet',port?-2.6:-2.95,port?1.7:1.15,PI/2-.4,{dir:1});
  const n=B.foes.length; const POSN=B.boss?[[2.5,-.1]]:n===1?[[2.2,0]]:n===2?[[1.9,-.9],[2.7,1.0]]:[[1.8,1.25],[2.35,-.8],[3.4,.45]];
  B.foes.forEach((f,i)=>{ let G; if(f.boss){ G=buildBoss3(f.boss.kind,f.boss.c); G.root.scale.setScalar(BOSS_SCALE[f.boss.kind]||1.55); } else { G=buildFoe(f.shape,f.c); G.root.scale.setScalar(.95); }
    const [x,z]=POSN[i]||[2+i,0]; const u=add(f.el,G,'foe',x,z,-PI/2+.55,{dir:-1,f}); f.r3=u; });
  BT.target=msh(geo('tring',()=>new TH.RingGeometry(.62,.76,40)),basic('#f6de98',{transparent:true,opacity:.85,depthWrite:false}),sc,0,.17,0,false); BT.target.rotation.x=-PI/2;
  BT.bubble=msh(Gs(.95,24,16),new TH.MeshStandardMaterial({color:c3('#9fd8ff'),transparent:true,opacity:.22,roughness:.1,emissive:c3('#3a7ab0'),depthWrite:false}),sc,0,-9,0,false);
  BT.guard=msh(Gs(.7,20,14),new TH.MeshStandardMaterial({color:c3('#ffe9a0'),transparent:true,opacity:.2,roughness:.1,emissive:c3('#a07a20'),depthWrite:false}),sc,0,-9,0,false);
  BT.ice=[]; BT.sparks=[]; for(let i=0;i<18;i++) BT.sparks.push(msh(Gs(.05,6,4),new TH.MeshBasicMaterial({color:c3('#9fe08f'),transparent:true}),sc,0,-9,0,false));
  $('#battle').classList.add('b3d');
}
function unitOf(el){ return BT&&BT.units.get(el); }
function uCenter(u){ return u.obj.root.position.clone().add(new TH.Vector3(0,u.h*.55*(u.kind==='pet'&&u.obj.kind!=='walk'?1:1),0)); }
function battleAnim(el,cls){ const u=unitOf(el); if(!u) return false;
  if(cls==='shake'){ u.shake=.4; u.flash=1; BT.shake=Math.max(BT.shake,u.kind==='foe'?.12:.2); }
  else if(cls==='lunge-r'||cls==='lunge-l'){ tween(.42,k=>{ u.off.x=Math.sin(k*PI)*.95*u.dir; u.off.y=Math.sin(k*PI)*.18; if(k>=1) u.off.set(0,0,0); });
    if(u.kind==='player'){ const A=u.obj.arms[1]; u.obj.override=true; tween(.42,k=>{ A.rotation.x=-2.3*Math.sin(k*PI); if(k>=1){ u.obj.override=false; } }); } }
  return true; }
function battleBolt(fromEl,toEl,color){ const a=unitOf(fromEl), b=unitOf(toEl); if(!a||!b) return null;
  const col=color||'#ffe9a0'; const orb=new TH.Group(); msh(Gs(.15,14,10),basic('#ffffff'),orb,0,0,0,false); const halo=sprite(tx('glow'),1.1); halo.material.color.copy(c3(col)); orb.add(halo); const L=new TH.PointLight(c3(col).getHex(),2.2,5,2); orb.add(L); BT.scene.add(orb);
  if(a.kind==='player'){ const A=a.obj.arms[1]; a.obj.override=true; tween(.5,k=>{ A.rotation.x=-2.4*Math.sin(Math.min(1,k*1.6)*PI/2)*(k>.8?(1-k)*5:1); if(k>=1) a.obj.override=false; }); }
  const from=a.obj.root.position.clone().add(new TH.Vector3(.35*a.dir,a.h*.72,0)), to=uCenter(b);
  return tween(.44,k=>{ orb.position.lerpVectors(from,to,k); orb.position.y+=Math.sin(k*PI)*.9; orb.scale.setScalar(1+k*.5); if(k>=1){ BT&&BT.scene.remove(orb); disposeTree(orb); } }); }
function battleSpark(el,color){ const u=unitOf(el); if(!u) return; const p=u.obj.root.position; BT.sparks.forEach(s=>s.material.color.copy(c3(color||'#9fe08f')));
  tween(1.1,k=>{ BT.sparks.forEach((s,i)=>{ const ang=i/BT.sparks.length*TAU+k*3; const r=.65*(1-k*.4); s.position.set(p.x+Math.cos(ang)*r,.3+k*1.9+(i%3)*.2,p.z+Math.sin(ang)*r); s.material.opacity=1-k; }); if(k>=1) BT.sparks.forEach(s=>s.position.y=-9); }); }
function renderBattle(tm){
  const dt=frameDt(tm); applyQuality(); fit(); if(!BT||!B) return;
  for(let i=BT.tw.length-1;i>=0;i--){ const w=BT.tw[i]; w.t+=dt; const k=Math.min(1,w.t/w.dur); w.fn(k); if(k>=1){ BT.tw.splice(i,1); w.res(); } }
  const panel=$('#bpanel').offsetHeight||0; const ah=Math.max(120,gh-panel); const a=gw/ah;
  const d=Math.max(7.6,3.4*gh/(.728*ah),5.0*gh/(.728*gw)); BT.shake=Math.max(0,BT.shake-dt); const sx=BT.shake>0?(Math.random()-.5)*BT.shake:0;
  cam.setViewOffset(gw,gh,0,panel/2,gw,gh); cam.position.set(Math.sin(tm*.25)*.5+sx,2.4+(d-7.6)*.24,d); cam.lookAt(0,1.0+(d-7.6)*.05,0);
  const gr=$('#game').getBoundingClientRect(), cr=glc.getBoundingClientRect(); const ox=cr.left-gr.left, oy=cr.top-gr.top;
  BT.units.forEach(u=>{ const r=u.obj.root; let sh=0; if(u.shake>0){ u.shake=Math.max(0,u.shake-dt); sh=Math.sin(tm*60)*.12*u.shake/.4; }
    r.position.copy(u.home).add(u.off); r.position.x+=sh;
    if(u.kind==='player') u.obj.update(dt,0,tm); else if(u.kind==='pet') u.obj.update(dt,0,tm); else u.obj.update(dt,tm);
    if(u.f){ if(u.obj.setMarches) u.obj.setMarches(u.f.marches||0);
      if(u.flash>0&&u.obj.mat&&u.obj.mat.emissive){ u.flash=Math.max(0,u.flash-dt*3); u.obj.mat.emissive.copy(c3(hexMul(u.f.c,.35))).lerp(c3('#ffffff'),u.flash); }
      if(u.f.hp<=0&&!u.dead){ u.dead=1; const s0=r.scale.x; tween(.8,k=>{ r.scale.setScalar(s0*Math.max(.001,1-k)); u.off.y=k*1.3; if(k>=1) r.visible=false; }); } }
    // position the DOM overlay over the model
    const [fx,fy]=screenOf(r.position.x,r.position.y,r.position.z), [,hy]=screenOf(r.position.x,r.position.y+u.h,r.position.z);
    const hpx=Math.max(36,fy-hy); const el=u.el; el.style.left=(fx+ox)+'px'; el.style.top=(fy+oy)+'px';
    const cv2=u.kind==='pet'?el.querySelector('.compE'):el.querySelector('canvas'); if(cv2){ cv2.style.width=Math.round(hpx*(u.kind==='foe'&&u.f.boss?.9:.7))+'px'; cv2.style.height=Math.round(hpx)+'px'; } });
  const tg=B.foes[B.target]; if(tg&&tg.r3&&tg.hp>0){ BT.target.visible=true; BT.target.position.set(tg.r3.obj.root.position.x,.17,tg.r3.obj.root.position.z); const s=tg.boss?1.6:1; BT.target.scale.set(s,s,1); BT.target.material.opacity=.55+Math.sin(tm*5)*.3; } else BT.target.visible=false;
  if(B.shield>0){ const p=BT.player.obj.root.position; BT.bubble.position.set(p.x,.85,p.z); BT.bubble.scale.setScalar(1+Math.sin(tm*4)*.03); } else BT.bubble.position.y=-9;
  if(B.compShield>0){ const p=BT.pet.obj.root.position; BT.guard.position.set(p.x,.5,p.z); } else BT.guard.position.y=-9;
  B.foes.forEach(f=>{ if(!f.r3) return; if(f.stun&&!f.r3.ice){ f.r3.ice=msh(Gs(.85,20,14),new TH.MeshStandardMaterial({color:c3('#cfeaff'),transparent:true,opacity:.35,roughness:.05,metalness:.2,depthWrite:false}),BT.scene,0,0,0,false); }
    if(f.r3.ice){ if(!f.stun||f.hp<=0){ BT.scene.remove(f.r3.ice); f.r3.ice=null; } else { const p=f.r3.obj.root.position; f.r3.ice.position.set(p.x,.75,p.z); } } });
  RD.render(BT.scene,cam);
}
function battleEnd(){ $('#battle').classList.remove('b3d'); if(!BT) return; BT.tw.forEach(w=>w.res()); disposeTree(BT.scene); if(BT.sky) BT.sky.dispose(); BT=null; cam.clearViewOffset();
  ['#bPlayer','#bComp'].forEach(s=>{ const el=$(s); el.style.left=el.style.top=''; }); const ce=$('#bComp .compE'); if(ce){ ce.style.width=ce.style.height=''; } }

/* ===================== HOUSE ===================== */
let HS=null; const HN=8;
function hdims(id,rot){ const f=FURN[id]; return rot%2?[f.d,f.w]:[f.w,f.d]; }
function houseData(){ if(!S.house) S.house={items:[],inv:{},got:[]}; return S.house; }
function houseOpen(){
  const hd=houseData(); const sc=new TH.Scene(); HS={scene:sc,grid:new Array(HN*HN).fill(null),rugs:new Array(HN*HN).fill(null),items:[],sel:null,ghost:null,placing:null};
  sc.background=c3('#141a38'); sc.add(new TH.HemisphereLight(c3('#fff1dc').getHex(),c3('#7a5a3a').getHex(),.6));
  const fill=new TH.DirectionalLight(c3('#ffe9cc').getHex(),.35); fill.position.set(6,8,8); sc.add(fill);
  const sun=new TH.DirectionalLight(c3('#fff3d6').getHex(),2.0); sun.position.set(5,7.5,-9); sun.target.position.set(.8,0,.5); sc.add(sun,sun.target); sun.castShadow=true; sun.shadow.mapSize.set(1024,1024); Object.assign(sun.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:1,far:32}); sun.shadow.bias=-.0005; sun.shadow.normalBias=.02;
  const h=HN/2; const fl=texMat('planks',{roughness:.7}); const floor=msh(new TH.PlaneGeometry(HN,HN),fl,sc,0,0,0,false); floor.rotation.x=-PI/2; HS.floor=floor;
  msh(Gb(HN+.4,.3,HN+.4),mat('#3a2a1e'),sc,0,-.16,0,false);
  const wall=texMat('plaster',{roughness:.95}), wain=mat('#9a6a3e',{roughness:.8}), fr=mat('#6b4a2a');
  const WH=3.1, wx0=.6, wx1=2.0, wy0=1.0, wy1=2.2;
  [[-h,wx0,0,WH],[wx1,h,0,WH],[wx0,wx1,0,wy0],[wx0,wx1,wy1,WH]].forEach(([x0,x1,y0,y1])=>msh(new TH.BoxGeometry(x1-x0,y1-y0,.25),wall,sc,(x0+x1)/2,(y0+y1)/2,-h-.125));
  msh(new TH.BoxGeometry(HN,.6,.06),wain,sc,0,.3,-h+.03); msh(new TH.BoxGeometry(.25,WH,HN+.25),wall,sc,-h-.125,WH/2,-.125); msh(new TH.BoxGeometry(.06,.6,HN),wain,sc,-h+.03,.3,0);
  msh(new TH.BoxGeometry(wx1-wx0+.2,.1,.35),fr,sc,(wx0+wx1)/2,wy0-.05,-h); msh(new TH.BoxGeometry(wx1-wx0+.2,.1,.35),fr,sc,(wx0+wx1)/2,wy1+.05,-h); for(const x of [wx0,wx1,(wx0+wx1)/2]) msh(new TH.BoxGeometry(.08,wy1-wy0,.3),fr,sc,x,(wy0+wy1)/2,-h);
  const skyp=new TH.Mesh(new TH.PlaneGeometry(5,3.4),new TH.MeshBasicMaterial({map:tx('sky')})); skyp.position.set(1.3,1.6,-h-1.3); sc.add(skyp);
  for(let i=0;i<3;i++) msh(Gs(1.2,16,8),mat('#7fae5a'),sc,.5+i*1.1,.6,-h-1.1,false).scale.set(1,.5,.2);
  const beam=new TH.Mesh(new TH.PlaneGeometry(1.4,4.4),new TH.MeshBasicMaterial({color:c3('#fff2c8'),transparent:true,opacity:.1,depthWrite:false,blending:TH.AdditiveBlending,side:TH.DoubleSide})); beam.position.set(1.5,1.3,-2.1); beam.rotation.set(-.85,.15,0); sc.add(beam);
  msh(new TH.BoxGeometry(.1,2.1,1.1),texMat('wood'),sc,-h+.02,1.05,2.2); msh(new TH.BoxGeometry(.12,.08,1.3),fr,sc,-h+.02,2.14,2.2);
  const shelfM=wain; msh(new TH.BoxGeometry(2.2,.06,.3),shelfM,sc,-2,2.1,-h+.15); for(let i=0;i<4;i++) msh(jarGeo(),mat('#b8693a'),sc,-2.8+i*.5,2.13,-h+.15).scale.setScalar(.45);
  HS.ring=new TH.Mesh(new TH.RingGeometry(.55,.66,40),new TH.MeshBasicMaterial({color:c3('#f6de98'),transparent:true,opacity:.9,depthWrite:false})); HS.ring.rotation.x=-PI/2; HS.ring.position.y=.02; HS.ring.visible=false; sc.add(HS.ring);
  HS.cell=new TH.Mesh(new TH.PlaneGeometry(1,1),new TH.MeshBasicMaterial({color:0x7cff8a,transparent:true,opacity:.3,depthWrite:false})); HS.cell.rotation.x=-PI/2; HS.cell.position.y=.015; HS.cell.visible=false; sc.add(HS.cell);
  if(!hd.items.length&&!hd.init){ hd.init=1; [['rug',3,3,0],['bed',0,0,0],['table',3,3,0],['stool',3,4,0],['stool',4,4,0],['lamp',1,0,0],['plant',7,0,0],['jars',7,7,0]].forEach(([id,x,z,r])=>hd.items.push({id,x,z,rot:r})); }
  hd.items=hd.items.filter(it=>FURN[it.id]); const keep=[]; hd.items.forEach(it=>{ if(placeItem(it.id,it.x,it.z,it.rot,true)) keep.push(it); else hd.inv[it.id]=(hd.inv[it.id]||0)+1; }); hd.items=keep;
  zoomH=1; $('#hbar').hidden=false; renderInv(); selectItem(null);
}
function houseSave(){ const hd=houseData(); hd.items=HS.items.map(i=>({id:i.id,x:i.x,z:i.z,rot:i.rot})); save(); }
function houseClose(){ if(!HS) return; cancelPlace(true); houseSave(); disposeTree(HS.scene); HS=null; $('#hbar').hidden=true; }
function canPlace(id,x,z,rot,ignore){ const [w,d]=hdims(id,rot); if(x<0||z<0||x+w>HN||z+d>HN) return false; const Lr=FURN[id].floor?HS.rugs:HS.grid; for(let i=x;i<x+w;i++) for(let j=z;j<z+d;j++){ const o=Lr[j*HN+i]; if(o&&o!==ignore) return false; } return true; }
function occupy(it,v){ const [w,d]=hdims(it.id,it.rot); const Lr=FURN[it.id].floor?HS.rugs:HS.grid; for(let i=it.x;i<it.x+w;i++) for(let j=it.z;j<it.z+d;j++) Lr[j*HN+i]=v?it:null; }
function placeItem(id,x,z,rot,init){ if(!canPlace(id,x,z,rot)) return null; const g=buildFurn(id); const it={id,x,z,rot,g}; posItem(it); HS.scene.add(g); HS.items.push(it); occupy(it,true); if(!init){ SFX.coin(); toast(t('house.placed')); } return it; }
function posItem(it){ const [w,d]=hdims(it.id,it.rot); it.g.position.set(it.x+w/2-HN/2,0,it.z+d/2-HN/2); it.g.rotation.y=-it.rot*PI/2; }
function furnName(id){ return t('furn.'+id); }
function renderInv(){ const el=$('#inv'); if(!el||!HS) return; el.innerHTML=''; const hd=houseData();
  const ids=Object.keys(FURN).filter(id=>(!FURN[id].ch&&!FURN[id].earned)||hd.got.includes(id)||(hd.inv[id]||0)>0||HS.items.some(i=>i.id===id));
  const locked=Object.keys(FURN).filter(id=>FURN[id].ch&&!ids.includes(id));
  [...ids,...locked].forEach(id=>{ const f=FURN[id], n=hd.inv[id]||0; const b=document.createElement('button'); b.className='card'+(HS.placing&&HS.placing.id===id?' on':'');
    const lockedT=f.ch&&!ids.includes(id);
    b.innerHTML=`<img alt="" data-th="f:${id}" src="${THUMB['f'+id]||''}">${esc(furnName(id))}${lockedT?`<span class="tag">${esc(t('house.locked',CH[f.ch].name))}</span>`:(f.ch||f.earned)?`<span class="tag ok">${esc(t('house.found',n))}</span>`:n?`<span class="tag ok">${esc(t('house.have',n))}</span>`:`<span class="pr"><span class="coin"></span>${f.price}</span>`}`;
    if(lockedT||((f.ch||f.earned)&&!n)) b.disabled=true;
    b.onclick=()=>{ if(!n){ if(f.ch||f.earned) return; if(S.coins<f.price){ toast(t('ward.need',f.price-S.coins)); return; } S.coins-=f.price; hd.inv[id]=1; SFX.coin(); updHUD(); save(); toast(t('house.bought',furnName(id))); } startPlace(id,0); };
    el.appendChild(b); });
  lazyThumbs(el); tools(); }
function tools(){ const tb=$('#htools'); if(!tb||!HS) return;
  if(HS.placing){ tb.innerHTML=`<span class="htip">${esc(t('house.tipPlace'))}</span><button class="tb" id="tRot">${esc(t('house.rotate'))}</button><button class="tb warn" id="tCan">${esc(t('house.cancel'))}</button>`; $('#tRot').onclick=()=>{ HS.placing.rot=(HS.placing.rot+1)%4; HS.ghost.rotation.y=-HS.placing.rot*PI/2; houseMove(HS.lastX,HS.lastY); }; $('#tCan').onclick=()=>cancelPlace(); }
  else if(HS.sel){ const pr=FURN[HS.sel.id].price; tb.innerHTML=`<b class="hsel">${esc(furnName(HS.sel.id))}</b><button class="tb" id="tRot">${esc(t('house.rotate'))}</button><button class="tb" id="tMove">${esc(t('house.move'))}</button><button class="tb warn" id="tStore">${esc(t('house.store'))}</button>${pr?`<button class="tb warn" id="tSell">${esc(t('house.sell',Math.floor(pr/2)))}</button>`:''}`;
    const sb=$('#tSell'); if(sb) sb.onclick=()=>{ const it=HS.sel; selectItem(null); removeItem(it); const hd=houseData(); hd.inv[it.id]=Math.max(0,(hd.inv[it.id]||1)-1); if(!hd.inv[it.id]) delete hd.inv[it.id]; S.coins+=Math.floor(pr/2); SFX.coin(); updHUD(); renderInv(); houseSave(); toast(t('house.sold',furnName(it.id),Math.floor(pr/2))); };
    $('#tRot').onclick=rotateSel; $('#tMove').onclick=()=>{ const it=HS.sel; selectItem(null); removeItem(it); startPlace(it.id,it.rot); };
    $('#tStore').onclick=()=>{ const it=HS.sel; selectItem(null); removeItem(it); renderInv(); toast(t('house.stored',furnName(it.id))); houseSave(); }; }
  else tb.innerHTML=`<span class="htip">${esc(t('house.tipIdle'))}</span>`; }
function removeItem(it){ occupy(it,false); HS.scene.remove(it.g); disposeTree(it.g); HS.items.splice(HS.items.indexOf(it),1); const hd=houseData(); hd.inv[it.id]=(hd.inv[it.id]||0)+1; }
function rotateSel(){ const it=HS.sel; if(!it) return; occupy(it,false); const nr=(it.rot+1)%4; if(canPlace(it.id,it.x,it.z,nr)) it.rot=nr; else toast(t('house.noturn')); occupy(it,true); posItem(it); selectItem(it); houseSave(); }
function startPlace(id,rot){ cancelPlace(true); HS.placing={id,rot:rot||0}; const g=buildFurn(id); g.traverse(o=>{ if(o.isMesh){ o.material=o.material.clone(); o.material.userData={}; o.material.transparent=true; o.material.opacity=.6; o.castShadow=false; } if(o.isLight) o.intensity=0; }); HS.ghost=g; g.rotation.y=-HS.placing.rot*PI/2; g.visible=false; HS.scene.add(g); renderInv(); if(HS.lastX!=null&&!isTouch) houseMove(HS.lastX,HS.lastY); }
function cancelPlace(silent){ if(!HS) return; if(HS.ghost){ HS.scene.remove(HS.ghost); disposeTree(HS.ghost); HS.ghost=null; } HS.placing=null; HS.cell.visible=false; if(!silent) renderInv(); }
function floorAt(x,y){ const r=glc.getBoundingClientRect(); ndc.set((x-r.left)/gw*2-1,-((y-r.top)/gh)*2+1); ray.setFromCamera(ndc,cam); const hit=ray.intersectObject(HS.floor)[0]; return hit?hit.point:null; }
function houseMove(x,y){ if(!HS) return; HS.lastX=x; HS.lastY=y; if(!HS.placing||x==null) return; const p=floorAt(x,y); if(!p){ HS.ghost.visible=false; HS.cell.visible=false; return; }
  const {id,rot}=HS.placing; const [w,d]=hdims(id,rot); const cx=cl(Math.round(p.x+HN/2-w/2),0,HN-w), cz=cl(Math.round(p.z+HN/2-d/2),0,HN-d); HS.placing.x=cx; HS.placing.z=cz;
  const ok=canPlace(id,cx,cz,rot); HS.ghost.visible=true; HS.ghost.position.set(cx+w/2-HN/2,0,cz+d/2-HN/2); HS.cell.visible=true; HS.cell.scale.set(w,d,1); HS.cell.position.set(HS.ghost.position.x,.015,HS.ghost.position.z); HS.cell.material.color.set(ok?0x7cff8a:0xff6a5a); HS.placing.ok=ok; }
function houseTap(x,y){ if(!HS) return;
  if(HS.placing){ houseMove(x,y); const Pl=HS.placing; if(Pl.ok&&Pl.x!=null){ const it=placeItem(Pl.id,Pl.x,Pl.z,Pl.rot); if(it){ const hd=houseData(); hd.inv[Pl.id]=Math.max(0,(hd.inv[Pl.id]||0)-1); if(!hd.inv[Pl.id]) delete hd.inv[Pl.id]; cancelPlace(true); renderInv(); houseSave(); } } else if(Pl.x!=null) toast(t('house.taken')); return; }
  const r=glc.getBoundingClientRect(); ndc.set((x-r.left)/gw*2-1,-((y-r.top)/gh)*2+1); ray.setFromCamera(ndc,cam); const objs=HS.items.map(i=>i.g);
  const hits=ray.intersectObjects(objs,true); let found=null; for(const h of hits){ let o=h.object; while(o.parent&&!objs.includes(o)) o=o.parent; const it=HS.items.find(i=>i.g===o); if(it&&(!FURN[it.id].floor||!found)){ if(!FURN[it.id].floor){ found=it; break; } found=found||it; } }
  selectItem(found); }
function selectItem(it){ if(!HS) return; HS.sel=it; if(it){ const [w,d]=hdims(it.id,it.rot); HS.ring.visible=true; HS.ring.position.set(it.g.position.x,.025,it.g.position.z); const s=Math.max(w,d)*.85; HS.ring.scale.set(s,s,1); } else HS.ring.visible=false; tools(); }
function renderHouse(tm){ const dt=frameDt(tm); applyQuality(); fit(); if(!HS) return;
  const bar=$('#hbar').offsetHeight||170; const ah=Math.max(100,gh-bar), a=gw/ah; const k=(a<1.2?Math.min(2.9,1.3/a):1)*Math.max(1,560/ah)*zoomH;
  cam.setViewOffset(gw,gh,0,bar/2-10,gw,gh); cam.position.set(6.6*k,7.9*k,9.2*k); cam.lookAt(-.2,.4,-.2);
  HS.items.forEach(i=>{ const f=i.g.userData.flame; if(f) f.scale.y=1+Math.sin(tm*14+i.x)*.2; }); if(HS.ring.visible) HS.ring.material.opacity=.6+Math.sin(tm*5)*.3;
  RD.render(HS.scene,cam); }

/* ---- lazy thumbnails for menus ---- */
function lazyThumbs(root){ const imgs=[...root.querySelectorAll('img[data-th]')].filter(i=>!i.getAttribute('src')); let i=0;
  const step=()=>{ const t0=performance.now(); while(i<imgs.length&&performance.now()-t0<14){ const im=imgs[i++]; if(!im.isConnected) continue; const [k,a,b]=im.dataset.th.split(':'); try{ im.src=k==='f'?thumbFurn(a):k==='p'?thumbPet(a):thumbProp(a,b); }catch(e){ console.error(e); } } if(i<imgs.length) requestAnimationFrame(step); };
  requestAnimationFrame(step); }

return {ok:true, canvas:glc, renderWorld, renderBattle, renderHouse, pick, battleStart, battleEnd, battleAnim, battleBolt, battleSpark,
  houseOpen, houseClose, houseMove, houseTap, get houseOn(){ return !!HS; }, get placing(){ return !!(HS&&HS.placing); }, cancelPlace, thumbPet, thumbFurn, thumbProp, avatar, lazyThumbs,
  zoom(f,which){ if(which==='house') zoomH=cl(zoomH*f,.6,1.5); else zoomW=cl(zoomW*f,.55,1.6); }, get zoomW(){ return zoomW; }, snap(){ W.snap=true; },
  FURN, PROP_LIST, PROP_PRICE, PETB, cutscene, portrait, get cutting(){ return !!CUT; }, loadGLB };
