/* ===================== CC0 ANIMATED MODELS (Quaternius) ===================== */
const MODEL_BASE='models/', MODEL_FMT='glb';
const GLB={}, GLBMAP={cow:'Cow',ox:'Bull',deer:'Deer',horse:'Horse',fox:'Fox',frog:'Frog'};
const GLBH={Cow:1.05,Bull:1.12,Deer:1.15,Horse:1.4,Fox:.56,Frog:.4,Donkey:1.08,Snake:.5,Boat:.9};
function loadGLB(name){ if(GLB[name]) return GLB[name].p; const e={}; GLB[name]=e;
  e.p=new Promise(res=>{ if(!TH.GLTFLoader){ e.fail=1; res(null); return; } const ok=g=>{ e.g=g; res(g); }, bad=()=>{ e.fail=1; res(null); };
    try{ if(MODEL_FMT==='b64') fetch(MODEL_BASE+name+'.json').then(r=>r.json()).then(j=>{ const bin=Uint8Array.from(atob(j.d),c=>c.charCodeAt(0)); new TH.GLTFLoader().parse(bin.buffer,'',ok,bad); }).catch(bad);
      else new TH.GLTFLoader().load(MODEL_BASE+name+'.glb',ok,undefined,bad); }catch(err){ bad(); } }); return e.p; }
const glbReady=n=>!!(GLB[n]&&GLB[n].g);
function glbActor(name){ const e=GLB[name]; if(!e||!e.g) return null; const g=e.g; const root=new TH.Group();
  const o=TH.SkeletonUtils?TH.SkeletonUtils.clone(g.scene):g.scene.clone(true); o.updateMatrixWorld(true);
  const bb=new TH.Box3().setFromObject(o); const h=Math.max(.01,bb.max.y-bb.min.y); const s=(GLBH[name]||1)/h; o.scale.multiplyScalar(s); o.position.y=-bb.min.y*s; root.add(o);
  o.traverse(x=>{ if(x.isMesh){ x.castShadow=true; x.receiveShadow=true; x.frustumCulled=false; } });
  const mixer=g.animations.length?new TH.AnimationMixer(o):null; const clip=re=>g.animations.find(a=>re.test(a.name.split('|').pop()));
  const acts={}; if(mixer){ const m={idle:/^(Frog_|Snake_)?Idle$/,walk:/^(Snake_)?Walk$|^Frog_Jump$/,run:/^Gallop$|^Frog_Jump$|^Snake_Walk$/,eat:/^Eating$/}; for(const k in m){ const c=clip(m[k]); if(c) acts[k]=mixer.clipAction(c); } }
  let cur=null; const play=k=>{ const a=acts[k]||acts.idle; if(!a||a===cur) return; a.reset().play(); if(cur) cur.crossFadeTo(a,.25,false); cur=a; };
  play('idle'); const a={root,kind:'walk',height:GLBH[name]||1,glb:name,mixer};
  a.update=(dt,speed,t)=>{ if(a.eat&&speed<.2) play('eat'); else play(speed>3.2?'run':speed>.25?'walk':'idle'); if(mixer) mixer.update(dt*(speed>.25&&speed<3.2?Math.min(1.6,.6+speed*.3):1)); };
  return a; }
function petModel3(id){ const n=GLBMAP[id]; if(n){ if(glbReady(n)){ const a=glbActor(n); if(a) return a; } else loadGLB(n); } return buildPet(id); }
function petKey(id){ const n=GLBMAP[id]; return id+'|'+((S&&S.petStyle)||'icon')+'|'+(n&&glbReady(n)?'g':'p'); }

/* ===================== STORY SCENES & AMBIENT LIFE ===================== */
const ROBE_C=['#7b3fa0','#2f5f86','#a8442f','#c9a35d','#4f8a5a','#e9d8a6','#8a5a3a','#3a6a8a'];
function villager(R,extra){ return Object.assign({skin:SK[Math.floor(R()*SK.length)],hair:HAIRS[Math.floor(R()*HAIRS.length)],robe:ROBE_C[Math.floor(R()*ROBE_C.length)],sash:'#e9d8a6',hs:Math.floor(R()*7),beard:R()<.3?'#3a2414':null},extra||{}); }
/* actor spec: {k:'P'|'A'|'G'|'F'|'X', id, at:[dx,dz] in tiles from anchor, path:[[dx,dz]...], sp:tiles/s, ry, s:scale, y, look, opt, anim} */
function sceneFor(id,lm){ const w=lm?lm.w:4, h=lm?lm.h:4, L=-(w/2+1.3), Rr=w/2+1.3;
  const P=(at,o)=>Object.assign({k:'P',at},o||{}), A=(id,at,o)=>Object.assign({k:'A',id,at},o||{}), G=(id,at,o)=>Object.assign({k:'G',id,at},o||{}), F=(id,at,o)=>Object.assign({k:'F',id,at},o||{}), X=(id,at,o)=>Object.assign({k:'X',id,at},o||{});
  const two=(id,g)=>[ (g?G:A)(id,[L,2.6],{path:[[L,2.6],[-1.2,.6],[L,2.6]],sp:.5}), (g?G:A)(id,[L-.8,3.2],{path:[[L-.8,3.2],[-1.6,1.1],[L-.8,3.2]],sp:.5}) ];
  switch(+id){
    case 1: return [G('Deer',[L,1.2],{ry:.6,eat:1}),G('Fox',[Rr,1.6],{ry:-.8,path:[[Rr,1.6],[Rr+1.5,3],[Rr,4],[Rr-1,2.5]],sp:.6}),A('rabbit',[L-1,2.8]),A('dove',[1.5,-1],{y:1.6,path:[[2,-2],[-2,-2],[-2,1],[2,1]],sp:1}),A('lamb',[Rr+.6,-.4])];
    case 2: return [...two('Cow',1),...two('Horse',1).map(a=>(a.at=[a.at[0]-1.5,a.at[1]+1.2],a.path=a.path.map(p=>[p[0]-1.5,p[1]+1.2]),a)),A('lion',[Rr,1.6],{ry:-1.2}),A('lion',[Rr+.9,2.1],{ry:-1.4}),A('dove',[0,-1],{y:2.4,path:[[-3,-2],[3,-2],[3,1],[-3,1]],sp:1.2})];
    case 11: return [P([L,1.2],{look:{skin:SK[2],hair:'#d8d0c4',robe:'#8a5a3a',beard:'#d8d0c4'},opt:{staff:1},ry:.4}),A('camel',[Rr,1.4],{ry:-.6}),A('camel',[Rr+1.2,2.4],{ry:-.9}),A('lamb',[L-1,3]),A('lamb',[L-.2,3.6]),A('ram',[L-1.6,3.9]),X('campfire',[L+1.5,3])];
    case 12: return [A('camel',[L-1,2],{path:[[L-4,4],[L,2],[Rr,2],[Rr+4,4]],sp:.6,pingpong:1}),A('camel',[L-2.2,2.6],{path:[[L-5.2,4.6],[L-1.2,2.6],[Rr-1.2,2.6],[Rr+2.8,4.6]],sp:.6,pingpong:1}),P([L-3,3.1],{path:[[L-6,5],[L-2,3.1],[Rr-2,3.1],[Rr+2,5]],sp:.6,pingpong:1}),F('sheaf',[Rr,.8]),F('sheaf',[Rr+.8,1.3])];
    case 3: return [X('basketRiver',[L-2,3]),P([L,1.6],{anim:'work',ry:.6}),P([L+.9,2.2],{anim:'work',ry:.3}),F('jars',[Rr,.9]),G('Snake',[Rr+1,2.2],{ry:-1.2})];
    case 4: return [X('burningbush',[L-.5,2.4]),P([L-.4,3.5],{look:{skin:SK[2],hair:'#7a5a3a',robe:'#8a6a3a',beard:'#7a5a3a'},opt:{staff:1},ry:PI-.3}),A('goat',[Rr,1.8]),A('lamb',[Rr+.8,2.6]),A('lamb',[Rr-.4,3])];
    case 5: return Array.from({length:7},(_,i)=>P([L-1+i*.01,2],{opt:{props:{hand:'staff'}},look:{skin:SK[i%SK.length],hair:'#3a2414',robe:i%2?'#e9e4d8':'#2f5f86',beard:i%2?'#3a2414':null},path:[[L-1,2.2],[Rr+1,2.2],[Rr+1,3.4],[L-1,3.4]],sp:.75,phase:i/7,hide3:1}));
    case 13: return [P([L,1.4],{anim:'work',look:{skin:SK[3],hair:'#2a1a12',robe:'#a8442f',hs:6}}),P([L-1.1,2.2],{anim:'work',look:{skin:SK[1],hair:'#7a4a2a',robe:'#c9a35d',hs:1}}),G('Cow',[Rr,1.6],{ry:-.8,eat:1}),G('Donkey',[Rr+1.3,2.5],{ry:-1.1}),F('sheaf',[L-2,.8]),F('sheaf',[L-2.6,1.4])];
    case 6: return [X('tent',[L-1,1]),X('tent',[Rr+1,1]),P([L,2.4],{look:{skin:SK[1],hair:'#7a4a2a',robe:'#a8442f'},opt:{props:{hand:'staff'}}}),A('lamb',[L-1,3.2]),A('lamb',[L-1.6,2.8]),X('stones',[0,2.6])];
    case 14: return [X('raincloud',[0,-1]),P([Rr,1.4],{look:{skin:SK[2],hair:'#5a3a1a',robe:'#7a5a3a',beard:'#5a3a1a'},opt:{staff:1},ry:-.6}),A('dove',[L,0],{y:2.2,path:[[L,0],[L-2,1],[L-1,2]],sp:.8})];
    case 15: return [X('gourd',[L,1.4]),P([L+.5,2.3],{look:{skin:SK[2],hair:'#3a2414',robe:'#4f7a8a',beard:'#3a2414'},ry:.3}),G('Donkey',[Rr,2],{path:[[Rr,2],[Rr+2,3.5],[Rr,4.5]],sp:.4,pingpong:1})];
    case 7: return [A('lion',[L,1.6],{ry:.8}),A('lion',[L-1,2.4],{ry:.5}),A('lion',[Rr,2],{ry:-.8}),G('Horse',[Rr+1.2,1],{ry:-1})];
    case 16: return [P([L,1.5],{opt:{props:{hand:'staff'}},look:{skin:SK[3],hair:'#1a1210',robe:'#2b5fb0',beard:'#1a1210'}}),P([Rr,1.5],{opt:{props:{hand:'staff'}},look:{skin:SK[2],hair:'#1a1210',robe:'#2b5fb0',beard:'#1a1210'}}),F('table',[Rr+1.6,3]),F('jars',[L-1.4,2.8]),G('Horse',[L-2,1],{ry:.8})];
    case 8: return [P([L,1.6],{opt:{staff:1},look:{skin:SK[3],hair:'#3a2414',robe:'#8a6a3a',beard:'#3a2414'}}),P([L-1,2.4],{opt:{staff:1},look:{skin:SK[1],hair:'#7a4a2a',robe:'#6a5a3a'}}),A('lamb',[L-.4,3.2]),A('lamb',[L-1.4,3.6]),A('lamb',[L+.6,3.7]),G('Donkey',[Rr,1.2],{ry:-1.2}),G('Cow',[Rr+1.3,2],{ry:-1.4}),P([0,-2.4],{look:{skin:SK[1],hair:'#e8c87a',robe:'#ffffff'},opt:{angel:1},y:2.4,anim:'float'})];
    case 9: return [X('boat',[L-2.5,5],{path:[[L-3,5.5],[L-6,7],[L-3,8.5]],sp:.25,pingpong:1}),X('boat',[Rr+3,6],{path:[[Rr+3,6.5],[Rr+6,8],[Rr+3,9]],sp:.2,pingpong:1}),P([L,1],{anim:'work'}),F('net',[L-1,1.6])];
    case 10: return [G('Donkey',[L-3,2.2],{path:[[L-5,2.6],[L,2.6]],sp:.45,pingpong:1}),...[0,1,2,3].map(i=>P([L-2+i*.9,3.6+(i%2)*.5],{anim:'wave',opt:{props:{hand:'scroll'}}})),F('palms',[Rr,1.2]),F('palms',[Rr+.8,1.8])];
    case 17: return Array.from({length:8},(_,i)=>P([L+(i%4)*.9-1,2.6+Math.floor(i/4)*.9],{anim:i%3===0?'wave':'',ry:PI*.9}));
    case 18: return [X('campfire',[L,2]),G('Snake',[L+.8,2.4],{ry:-2}),P([L-.9,2.6],{look:{skin:SK[2],hair:'#3a2414',robe:'#7a3a2a',beard:'#3a2414'},ry:.8}),P([Rr,1.6],{anim:'work'}),P([Rr+1,2.4],{anim:'work'})];
    case 'hub': return [];
  } return []; }
function hubLife(m){ const out=[]; const R=rng(42); const O=12;
  out.push({k:'P',look:villager(R),path:[[3+O,8],[22+O,8]],sp:.7,pingpong:1,abs:1});
  out.push({k:'P',look:villager(R),path:[[30+O,17],[2,17]],sp:.6,pingpong:1,abs:1});
  out.push({k:'P',look:villager(R),path:[[13+O,10],[20+O,10],[20+O,15],[13+O,15]],sp:.5,abs:1});
  out.push({k:'A',id:'lamb',path:[[35+O,11],[38+O,12],[36+O,14]],sp:.35,pingpong:1,abs:1});
  out.push({k:'A',id:'lamb',path:[[36+O,12],[39+O,13]],sp:.3,pingpong:1,abs:1});
  out.push({k:'G',id:'Donkey',at:[33+O,6],abs:1,ry:-.6,eat:1});
  out.push({k:'A',id:'dove',y:2.6,path:[[16+O,9],[24+O,11],[18+O,15]],sp:1,abs:1});
  return out; }
function buildX(id,R){ const g=new TH.Group(); let upd=null;
  if(id==='campfire'){ msh(Gc(.32,.36,.12,10),mat('#5a5048'),g,0,.06,0); for(let i=0;i<4;i++){ const l=msh(Gc(.04,.05,.6,6),mat('#6b4a2a'),g,0,.15,0); l.rotation.set(PI/2,i*PI/4,0); }
    const f1=msh(Gk(.18,.5,8),mat('#ff8a2a',{emissive:'#ff5a10',emissiveIntensity:1.4,transparent:true,opacity:.9}),g,0,.36,0,false), f2=msh(Gk(.1,.32,8),mat('#ffe26a',{emissive:'#ffc020',emissiveIntensity:1.5}),g,0,.3,0,false); const Lt=new TH.PointLight(0xffa050,1.1,6,2); Lt.position.y=.8; g.add(Lt);
    upd=t=>{ f1.scale.set(1,1+Math.sin(t*11)*.18,1); f2.scale.y=1+Math.sin(t*14)*.2; Lt.intensity=1+Math.sin(t*9)*.15; }; }
  else if(id==='burningbush'){ for(let i=0;i<3;i++) msh(Gi(.42,1),mat('#4f8a3a',{flatShading:true}),g,(i-1)*.3,.4,(i%2)*.2); const fl=[]; for(let i=0;i<6;i++) fl.push(msh(Gk(.12,.5,8),mat(i%2?'#ffb03a':'#ff6a20',{emissive:i%2?'#ff9010':'#ff4a00',emissiveIntensity:1.6,transparent:true,opacity:.9}),g,Math.cos(i)*.3,.85,Math.sin(i*1.7)*.25,false));
    const glow=sprite(tx('glow'),2.4); glow.position.y=.8; glow.material.color.copy(c3('#ffb060')); g.add(glow); const Lt=new TH.PointLight(0xffa040,1.4,7,2); Lt.position.y=1; g.add(Lt); upd=t=>fl.forEach((f,i)=>f.scale.set(1,1+Math.sin(t*10+i)*.3,1)); }
  else if(id==='tent'){ msh(Gk(1,1.6,4,1,true),texMat(R()<.5?'tent':'tent2',{side:TH.DoubleSide}),g,0,.8,0).rotation.y=PI/4; }
  else if(id==='stones'){ for(let i=0;i<5;i++) msh(Gs(.09,8,6),mat('#c8c0b0',{roughness:.6}),g,(i-2)*.22,.06,(i%2)*.15).scale.set(1,.7,1); const w=msh(new TH.PlaneGeometry(2.2,.5),mat('#4f8fd0',{roughness:.15,transparent:true,opacity:.8}),g,0,.015,.3,false); w.rotation.x=-PI/2; }
  else if(id==='raincloud'){ const cm=mat('#8a94a8',{roughness:1,transparent:true,opacity:.95}); [[0,0,0,.9],[-.8,-.1,.2,.7],[.8,-.1,-.1,.75],[.3,.3,.2,.6]].forEach(([x,y,z,r])=>msh(Gs(r,12,10),cm,g,x,y,z,false)); g.position.y=5.2; const drops=[]; for(let i=0;i<24;i++) drops.push(msh(Gb(.02,.25,.02),mat('#bfe0ff',{transparent:true,opacity:.7}),g,(R()-.5)*2,0,(R()-.5)*1.2,false));
    upd=t=>drops.forEach((d,i)=>{ d.position.y=-((t*3+i*.37)%4.8); }); }
  else if(id==='gourd'){ msh(Gc(.04,.06,1.6,6),mat('#6b4a2a'),g,0,.8,0); for(let i=0;i<7;i++){ const l=msh(Gs(.32,10,8),mat('#4f9a3a',{roughness:.7}),g,Math.cos(i*.9)*.45,1.4+Math.sin(i*1.7)*.2,Math.sin(i*.9)*.35); l.scale.set(1,.25,.8); l.rotation.y=i; } msh(Gs(.12,10,8),mat('#d8b04a'),g,.2,1.1,.2).scale.set(1,1.4,1); }
  else if(id==='basketRiver'){ const b=buildFurn('mosesbasket'); b.scale.setScalar(.8); g.add(b); upd=t=>{ b.position.y=-.12+Math.sin(t*1.5)*.03; b.rotation.y=Math.sin(t*.5)*.3; }; }
  else if(id==='boat'){ if(glbReady('Boat')){ const a=glbActor('Boat'); g.add(a.root); } else { const b=buildBoatPet(); b.root.children[0].children.forEach(c=>{}); g.add(b.root); b.root.position.y=-.45; } g.position.y=-.15; upd=t=>{ g.rotation.z=Math.sin(t*1.2)*.05; }; }
  g.traverse(x=>{ if(x.isMesh&&x.castShadow!==false) x.castShadow=true; });
  return {root:g,update:upd}; }
function makeActor(sp,R){ let o;
  if(sp.k==='P'){ const look=sp.look?Object.assign(villager(R),sp.look):villager(R); const P3=buildPerson(look,Object.assign({},sp.opt||{})); o={root:P3.root,update:(dt,s,t)=>P3.update(dt,s,t),P:P3}; }
  else if(sp.k==='A'){ o=buildPet(sp.id); }
  else if(sp.k==='G'){ if(glbReady(sp.id)) o=glbActor(sp.id); if(!o){ loadGLB(sp.id); return null; } }
  else if(sp.k==='F'){ o={root:buildFurn(sp.id),update:null}; }
  else if(sp.k==='X'){ o=buildX(sp.id,R); const u=o.update; o.update=(dt,s,t)=>u&&u(t); }
  if(sp.s) o.root.scale.multiplyScalar(sp.s); o.eat=!!sp.eat; return o; }
function buildLife(m){ const R=rng((m.R.seed||7)*13+5); const out=[]; let specs;
  if(m.id==='hub') specs=hubLife(m);
  else { const lm=m.lms[0]; specs=sceneFor(m.id,lm).map(s=>{ const ax=(lm.x+lm.w/2), az=(lm.y+lm.h); const cv=p=>[ax+p[0],az+p[1]]; const c=Object.assign({},s); c.at=cv(s.at||s.path[0]); if(s.path) c.path=s.path.map(cv); return c; }); }
  specs.forEach((sp,i)=>{ if(sp.hide3&&chStage(m.id)>=3) return; const o=makeActor(sp,R); const pos0=sp.abs&&!sp.at?sp.path[0]:sp.at;
    if(!o){ out.push({sp,pending:1}); return; }
    o.root.position.set(pos0[0]*TL,sp.y||0,pos0[1]*TL); o.root.rotation.y=sp.ry||0; W.root.add(o.root); out.push({sp,o,seg:0,u:sp.phase?sp.phase*(sp.path?sp.path.length:1):0,dir:1,face:sp.ry||0,t0:R()*10}); });
  return out; }
function updLife(dt,tm){ if(!W.life) return;
  W.life.forEach(a=>{ if(a.pending){ if(a.sp.k==='G'&&glbReady(a.sp.id)){ const o=makeActor(a.sp,rng(3)); if(o){ const p=a.sp.at||a.sp.path[0]; o.root.position.set(p[0]*TL,a.sp.y||0,p[1]*TL); o.root.rotation.y=a.sp.ry||0; W.root.add(o.root); Object.assign(a,{o,pending:0,seg:0,u:0,dir:1,face:a.sp.ry||0,t0:0}); } } return; }
    const sp=a.sp, r=a.o.root; let speed=0;
    if(sp.path&&sp.path.length>1){ const n=sp.path.length; const loop=!sp.pingpong; const segs=loop?n:n-1;
      a.u+=dt*(sp.sp||.5)/Math.max(.2,segDist(sp.path,a.seg,loop))*a.dir;
      while(a.u>=1){ a.u-=1; a.seg+=1; if(a.seg>=segs){ if(loop) a.seg=0; else { a.seg=segs-1; a.u=1-a.u; a.dir=-1; } } }
      while(a.u<0){ a.u+=1; a.seg-=1; if(a.seg<0){ a.seg=0; a.u=1-a.u; a.dir=1; } }
      const p0=sp.path[a.seg], p1=sp.path[(a.seg+1)%n]; const x=lp(p0[0],p1[0],cl(a.u,0,1)), z=lp(p0[1],p1[1],cl(a.u,0,1));
      const nx=x*TL, nz=z*TL; const dx=nx-r.position.x, dz=nz-r.position.z; const d=Math.hypot(dx,dz); speed=dt>0?d/dt:0; if(d>1e-4){ const want=Math.atan2(dx,dz); a.face+=angTo(a.face,want)*Math.min(1,dt*6); r.rotation.y=a.face; }
      r.position.x=nx; r.position.z=nz; }
    if(sp.anim==='float') r.position.y=(sp.y||0)+Math.sin(tm*1.5+a.t0)*.15;
    if(sp.anim==='work'&&a.o.P){ a.o.P.torso.rotation.x=.35+Math.sin(tm*2+a.t0)*.25; }
    if(sp.anim==='wave'&&a.o.P){ a.o.P.override=true; a.o.P.arms[1].rotation.x=-2.6+Math.sin(tm*5+a.t0)*.35; a.o.P.arms[1].rotation.z=-.3; }
    if(a.o.update) a.o.update(dt,speed,tm+a.t0); }); }
function segDist(path,i,loop){ const n=path.length; const a=path[i], b=path[(i+1)%n]; return Math.hypot(b[0]-a[0],b[1]-a[1]); }

/* ===================== CUTSCENES ===================== */
let CUT=null;
function cutscene(chId){ if(!W.m||W.m.id!==chId) return; const lm=W.m.lms[0]; if(!lm) return;
  const cx=(lm.x+lm.w/2)*TL, cz=(lm.y+lm.h/2)*TL;
  CUT={t:0,dur:5.2,cx,cz,r:Math.max(7,lm.w*TL*1.25),h:Math.max(4,lm.h*TL*.9),ch:chId,from:W.camPos.clone(),fromL:W.camLook.clone(),parts:[]};
  const pm=new TH.MeshBasicMaterial({color:c3('#fff2b0'),transparent:true,depthWrite:false,blending:TH.AdditiveBlending});
  for(let i=0;i<60;i++){ const s=msh(Gs(.07,6,4),pm,W.root,cx+(Math.random()-.5)*lm.w*TL,Math.random()*.5,cz+(Math.random()-.5)*lm.h*TL,false); s.userData.v=.8+Math.random()*1.6; CUT.parts.push(s); }
  if(chId===5){ for(let i=0;i<26;i++){ const b=msh(Gb(.5,.35,.45),texMat('stone',{roughness:.9}),W.root,cx+(Math.random()-.5)*lm.w*TL*.9,3+Math.random()*3,cz+(Math.random()-.5)*1.2,true); b.userData.fall={v:0,r:Math.random()*4-2,ground:.18+Math.random()*.2}; CUT.parts.push(b); } }
  CUT.pm=pm; return true; }
function cutCam(dt){ const C=CUT; const nowT=performance.now()/1000; if(C.last==null) C.last=nowT; C.t+=Math.min(.1,nowT-C.last); C.last=nowT; const k=C.t/C.dur; const ease=x=>x<0?0:x>1?1:x*x*(3-2*x);
  const a=-.5+k*1.0; const tp=V.set(C.cx+Math.sin(a)*C.r,C.h+2.5,C.cz+Math.cos(a)*C.r), tl=V2.set(C.cx,C.h*.45,C.cz);
  const inK=ease(C.t/.9), outK=ease((C.dur-C.t)/1.0), w=Math.min(inK,outK);
  W.camPos.copy(C.from).lerp(tp,w); W.camLook.copy(C.fromL).lerp(tl,w);
  C.parts.forEach(p=>{ if(p.userData.fall){ const f=p.userData.fall; if(p.position.y>f.ground){ f.v+=dt*9; p.position.y=Math.max(f.ground,p.position.y-f.v*dt); p.rotation.x+=f.r*dt; p.rotation.z+=f.r*dt*.7; } } else { p.position.y+=p.userData.v*dt; p.material.opacity=Math.max(0,1-k*1.1); } });
  if(C.t>=C.dur){ C.parts.forEach(p=>{ if(!p.userData.fall){ W.root.remove(p); } }); if(C.pm) C.pm.dispose(); CUT=null; return false; }
  return true; }

/* ===================== PORTRAITS ===================== */
const PORT=new Map();
function portrait(look,opts){ const key=JSON.stringify([look,opts]); if(PORT.has(key)) return PORT.get(key); if(!TR) thumbSetup();
  const p=buildPerson(look,opts||{}); TR.setSize(168,192); TSc.add(p.root); p.root.updateMatrixWorld(true); TC.aspect=168/192; TC.updateProjectionMatrix();
  TC.position.set(.12,1.2,1.55); TC.lookAt(0,1.0,0); TR.render(TSc,TC); const url=TR.domElement.toDataURL(); TSc.remove(p.root); disposeTree(p.root); TC.aspect=1; TC.updateProjectionMatrix();
  if(PORT.size>60) PORT.delete(PORT.keys().next().value); PORT.set(key,url); return url; }
