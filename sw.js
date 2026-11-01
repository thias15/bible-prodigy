/* Scrolls of Light: offline cache. Core files are cached on install; 3D animal models as they are first used. */
const CACHE='sol-798b9a1a5b';
const CORE=['./','index.html','three.min.js','manifest.json','icon-192.png','icon-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{ const r=e.request; if(r.method!=='GET') return; const u=new URL(r.url);
  if(u.origin!==location.origin){ e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{ if(res.ok&&/fonts\.(googleapis|gstatic)\.com/.test(u.host)){ const cp=res.clone(); caches.open(CACHE).then(c=>c.put(r,cp)); } return res; }))); return; }
  const isPage=r.mode==='navigate'||u.pathname.endsWith('/')||u.pathname.endsWith('index.html');
  if(isPage){ e.respondWith(fetch(r).then(res=>{ const cp=res.clone(); caches.open(CACHE).then(c=>c.put('index.html',cp)); return res; }).catch(()=>caches.match('index.html'))); return; }
  e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{ if(res.ok){ const cp=res.clone(); caches.open(CACHE).then(c=>c.put(r,cp)); } return res; }))); });
