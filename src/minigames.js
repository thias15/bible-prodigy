/* Scrolls of Light - mini-games (manna, ark, wall, fish)
   Self-contained, no dependencies. Exposes window.MG = { start(id, opts) }. */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ text */
  var TXT = {
    en: {
      _: { start: 'Tap to start', cont: 'Continue', exit: 'Exit game', time: 'Time', r3: 'Wonderful!', r2: 'Well done!', r1: 'Good job!', r0: 'Nice try!', left: 'left', right: 'right' },
      manna: {
        title: 'Manna from Heaven', ref: 'Exodus 16', hud: 'Manna',
        text: 'Every morning God sent bread from heaven! Move the basket and catch the falling manna. Gather enough for today: {n} pieces. Golden manna counts double.',
        hint: 'Drag, or use ← → keys. Extra manna just melts in the sun!',
        enough: 'Enough for today!', melt: 'melts',
        fact: 'God gave manna every morning – enough for each day – for 40 years! (Exodus 16:35)'
      },
      ark: {
        title: 'Two by Two', ref: 'Genesis 7', hud: 'Points',
        text: 'The animals came to Noah two by two. Turn over two cards to find matching pairs and lead them into the ark!',
        hint: 'Tap two cards at a time.',
        pair: 'Into the ark!', again: 'Try again', bonus: 'Memory bonus +{n}', all: 'Everyone is safe!',
        fact: 'After the flood God put a rainbow in the sky as a sign of his promise. (Genesis 9:13)'
      },
      wall: {
        title: 'Rebuild the Wall', ref: 'Nehemiah 4', hud: 'Rows',
        text: 'Nehemiah and the people rebuilt the wall of Jerusalem. Drop each stone right on top of the wall. Build {n} rows!',
        hint: 'Tap, click or press Space to drop.',
        perfect: 'Perfect!', oops: 'Oops! Try again', done: 'The wall is finished!',
        mockWho: 'Sanballat', mock: 'You can’t build that!',
        replyWho: 'Nehemiah', reply: '“The God of heaven will help us!” (Neh 2:20)',
        fact: 'The wall of Jerusalem was finished in just 52 days! (Nehemiah 6:15)'
      },
      fish: {
        title: 'Cast the Net', ref: 'John 21', hud: 'Fish',
        text: 'The disciples fished all night and caught nothing. Tap the water to drop your net and catch fish. Listen to Jesus on the shore!',
        hint: 'Tap or click on the water.',
        nothing: 'Nothing…', voice: 'Cast the net on the right side of the boat!', who: 'Jesus',
        fact: 'In John 21 they caught 153 fish – and the net did not break!'
      }
    },
    de: {
      _: { start: 'Tippen zum Starten', cont: 'Weiter', exit: 'Spiel beenden', time: 'Zeit', r3: 'Wunderbar!', r2: 'Gut gemacht!', r1: 'Guter Anfang!', r0: 'Netter Versuch!', left: 'links', right: 'rechts' },
      manna: {
        title: 'Manna vom Himmel', ref: '2. Mose 16', hud: 'Manna',
        text: 'Jeden Morgen schickte Gott Brot vom Himmel! Bewege den Korb und fange das Manna. Sammle genug für heute: {n} Stück. Goldenes Manna zählt doppelt.',
        hint: 'Ziehen oder ← → Tasten. Übriges Manna schmilzt einfach in der Sonne!',
        enough: 'Genug für heute!', melt: 'schmilzt',
        fact: 'Gott gab jeden Morgen Manna – genug für jeden Tag – 40 Jahre lang! (2. Mose 16,35)'
      },
      ark: {
        title: 'Immer zu zweit', ref: '1. Mose 7', hud: 'Punkte',
        text: 'Die Tiere kamen paarweise zu Noah. Decke zwei Karten auf, finde die passenden Paare und führe sie in die Arche!',
        hint: 'Tippe immer zwei Karten an.',
        pair: 'Ab in die Arche!', again: 'Nochmal', bonus: 'Gedächtnis-Bonus +{n}', all: 'Alle sind in Sicherheit!',
        fact: 'Nach der Flut setzte Gott einen Regenbogen in die Wolken – als Zeichen seines Versprechens. (1. Mose 9,13)'
      },
      wall: {
        title: 'Baut die Mauer', ref: 'Nehemia 4', hud: 'Reihen',
        text: 'Nehemia und das Volk bauten die Mauer Jerusalems wieder auf. Lass jeden Stein genau auf die Mauer fallen. Baue {n} Reihen!',
        hint: 'Tippen, klicken oder Leertaste.',
        perfect: 'Perfekt!', oops: 'Hoppla! Nochmal', done: 'Die Mauer ist fertig!',
        mockWho: 'Sanballat', mock: 'Das schafft ihr nie!',
        replyWho: 'Nehemia', reply: '„Der Gott des Himmels wird es uns gelingen lassen!“ (Neh 2,20)',
        fact: 'Die Mauer Jerusalems war in nur 52 Tagen fertig! (Nehemia 6,15)'
      },
      fish: {
        title: 'Werft das Netz aus', ref: 'Johannes 21', hud: 'Fische',
        text: 'Die Jünger fischten die ganze Nacht und fingen nichts. Tippe aufs Wasser, um das Netz auszuwerfen. Hör auf Jesus am Ufer!',
        hint: 'Tippe oder klicke aufs Wasser.',
        nothing: 'Nichts…', voice: 'Werft das Netz auf der rechten Seite des Bootes aus!', who: 'Jesus',
        fact: 'In Johannes 21 fingen sie 153 Fische – und das Netz zerriss nicht!'
      }
    }
  };
  var ICONS = { manna: '🍞', ark: '🌈', wall: '🧱', fish: '🐟' };

  /* --------------------------------------------------------------- helpers */
  var EMOJI_FONT = '"Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif';
  var UI_FONT = "'Nunito','Trebuchet MS',sans-serif";
  var TITLE_FONT = "'Uncial Antiqua',Georgia,serif";
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function hash(a, b) { var h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
  }
  function wrap(c, text, maxW) {
    var words = String(text).split(' '), lines = [], cur = '';
    for (var i = 0; i < words.length; i++) {
      var test = cur ? cur + ' ' + words[i] : words[i];
      if (c.measureText(test).width > maxW && cur) { lines.push(cur); cur = words[i]; } else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  }
  function emoji(c, ch, x, y, size, alpha) {
    c.save(); if (alpha != null) c.globalAlpha *= alpha;
    c.fillStyle = '#000'; c.font = Math.round(size) + 'px ' + EMOJI_FONT; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(ch, x, y + size * 0.05); c.restore();
  }
  /* speech bubble; returns its height. align: 'left'|'center' with x = left edge or center */
  function bubble(c, x, y, maxW, who, text, style, alpha, tailX) {
    var fs = clamp(maxW * 0.055, 13, 17), pad = fs * 0.8;
    c.save(); c.globalAlpha *= alpha;
    c.font = '800 ' + fs + 'px ' + UI_FONT;
    var lines = wrap(c, text, maxW - pad * 2);
    var w = 0; for (var i = 0; i < lines.length; i++) w = Math.max(w, c.measureText(lines[i]).width);
    c.font = '900 ' + (fs * 0.78) + 'px ' + UI_FONT;
    if (who) w = Math.max(w, c.measureText(who).width);
    w = Math.min(maxW, w + pad * 2);
    var lh = fs * 1.25, h = pad * 2 + lines.length * lh + (who ? fs * 0.95 : 0);
    var bx = x - w / 2;
    bx = clamp(bx, 8, c.canvas.__cssW - w - 8);
    c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 10; c.shadowOffsetY = 3;
    c.fillStyle = style.bg; rr(c, bx, y, w, h, 14); c.fill();
    if (tailX != null) {
      c.beginPath(); var tx = clamp(tailX, bx + 16, bx + w - 16);
      c.moveTo(tx - 9, y + 1); c.lineTo(tx, y - 11); c.lineTo(tx + 9, y + 1); c.closePath(); c.fill();
    }
    c.shadowColor = 'transparent';
    if (style.border) { c.strokeStyle = style.border; c.lineWidth = 2; rr(c, bx, y, w, h, 14); c.stroke(); }
    c.textAlign = 'left'; c.textBaseline = 'top';
    var ty = y + pad;
    if (who) { c.fillStyle = style.who; c.fillText(who, bx + pad, ty); ty += fs * 0.95; }
    c.font = '800 ' + fs + 'px ' + UI_FONT; c.fillStyle = style.fg;
    for (i = 0; i < lines.length; i++) c.fillText(lines[i], bx + pad, ty + i * lh);
    c.restore();
    return h;
  }
  function sparkPath(c, x, y, r) {
    c.beginPath();
    for (var i = 0; i < 8; i++) {
      var a = i * Math.PI / 4, rad = i % 2 ? r * 0.35 : r;
      c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
    }
    c.closePath();
  }

  /* ------------------------------------------------------------------- CSS */
  var CSS = [
    '.mg-ov{position:absolute;left:0;top:0;right:0;bottom:0;z-index:9000;overflow:hidden;background:#0e1534;touch-action:none;overscroll-behavior:contain;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;font-family:' + UI_FONT + ';color:#f6ecd4}',
    '.mg-ov canvas{position:absolute;left:0;top:0;display:block;touch-action:none}',
    '.mg-hud{position:absolute;left:0;right:0;top:0;height:66px;display:flex;align-items:center;gap:8px;padding:0 72px 0 12px;pointer-events:none;z-index:3}',
    '.mg-pill{background:rgba(14,21,52,.78);border:2px solid rgba(232,185,74,.8);border-radius:999px;padding:6px 14px;font-weight:900;font-size:17px;color:#f6de98;box-shadow:0 3px 10px rgba(0,0,0,.35);white-space:nowrap;transition:transform .15s}',
    '.mg-pill.bump{transform:scale(1.12)}',
    '.mg-time.low{color:#ffc2a8;border-color:#ff9a78}',
    '.mg-x{position:absolute;top:10px;right:10px;width:48px;height:48px;border-radius:50%;border:2px solid #e8b94a;background:rgba(14,21,52,.85);color:#f6de98;font:900 22px/1 ' + UI_FONT + ';cursor:pointer;z-index:6;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,.4);padding:0}',
    '.mg-x:hover{background:#1d2b66}.mg-x:focus-visible{outline:3px solid #f6de98;outline-offset:2px}',
    '.mg-veil{position:absolute;left:0;top:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;padding:70px 16px 16px;box-sizing:border-box;background:rgba(8,12,32,.55);z-index:5;cursor:pointer}',
    '.mg-card{box-sizing:border-box;background:linear-gradient(#fbf4e2,#f1e2bf);color:#1d2b66;border:3px solid #e8b94a;border-radius:22px;box-shadow:0 14px 40px rgba(0,0,0,.5),inset 0 0 0 2px rgba(255,255,255,.55);max-width:400px;width:100%;max-height:100%;overflow:auto;padding:18px 22px 20px;text-align:center;animation:mgPop .35s ease-out;cursor:default}',
    '.mg-ico{font-size:50px;line-height:1.1;font-family:' + EMOJI_FONT + '}',
    '.mg-title{font-family:' + TITLE_FONT + ';font-size:26px;line-height:1.15;margin:6px 0 8px;color:#1d2b66}',
    '.mg-ref{display:inline-block;background:#1d2b66;color:#f6de98;border-radius:999px;padding:3px 12px;font-size:13px;font-weight:900;letter-spacing:.03em}',
    '.mg-txt{font-size:16px;line-height:1.42;margin:12px 0 8px;font-weight:600}',
    '.mg-hint{font-size:14px;color:#6b5418;font-weight:800;margin-bottom:16px;line-height:1.35}',
    '.mg-btn{font:900 19px ' + UI_FONT + ';color:#1d2b66;background:linear-gradient(#f9e6aa,#e8b94a);border:none;border-radius:999px;padding:12px 32px;min-height:50px;cursor:pointer;box-shadow:0 4px 0 #a97d1e,0 8px 16px rgba(0,0,0,.25)}',
    '.mg-btn:active{transform:translateY(2px);box-shadow:0 2px 0 #a97d1e}.mg-btn:focus-visible{outline:3px solid #1d2b66;outline-offset:3px}',
    '.mg-stars{font-size:46px;letter-spacing:4px;margin:2px 0 4px;line-height:1.1}',
    '.mg-star{display:inline-block;color:#d5cab0}.mg-star.on{color:#e8b94a;text-shadow:0 2px 0 #a97d1e,0 0 14px rgba(232,185,74,.7);animation:mgStar .5s backwards}',
    '.mg-sc{font-size:20px;font-weight:900;margin:2px 0}',
    '.mg-fact{background:rgba(29,43,102,.08);border:1px dashed rgba(29,43,102,.3);border-radius:14px;padding:10px 12px;font-size:15px;line-height:1.4;font-weight:700;margin:10px 0 16px}',
    '@keyframes mgPop{from{transform:scale(.85);opacity:0}to{transform:scale(1);opacity:1}}',
    '@keyframes mgStar{0%{transform:scale(0) rotate(-40deg)}70%{transform:scale(1.25)}100%{transform:scale(1)}}',
    '@media (max-height:560px){.mg-card{padding:12px 18px 14px}.mg-ico{font-size:34px}.mg-title{font-size:21px;margin:2px 0 6px}.mg-txt{font-size:14px;margin:8px 0 4px}.mg-hint{font-size:13px;margin-bottom:10px}.mg-stars{font-size:36px}.mg-fact{font-size:14px;margin:6px 0 10px;padding:7px 10px}.mg-btn{min-height:46px;padding:10px 28px}}',
    '@media (max-height:440px){.mg-veil{padding:10px 72px}.mg-card{max-width:560px;padding:10px 18px 12px}.mg-ico{display:none}.mg-txt{font-size:13.5px;line-height:1.35}.mg-stars{font-size:30px}.mg-title{font-size:20px}}',
    '@media (max-width:380px){.mg-pill{font-size:15px;padding:5px 11px}}',
    '@media (prefers-reduced-motion:reduce){.mg-card,.mg-star.on{animation:none}.mg-pill{transition:none}}'
  ].join('\n');
  function injectStyle() {
    if (document.getElementById('mg-style')) return;
    var s = document.createElement('style'); s.id = 'mg-style'; s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }

  /* ----------------------------------------------------------------- shell */
  var GAMES = {};
  var active = null;

  function start(id, opts) {
    opts = opts || {};
    var onDone = typeof opts.onDone === 'function' ? opts.onDone : function () {};
    if (!GAMES[id]) { setTimeout(function () { onDone({ id: id, score: 0, max: 1, stars: 0, quit: true }); }, 0); return; }
    if (active) active(true);
    injectStyle();
    var host = opts.host || document.body;
    var lang = opts.lang; if (!TXT[lang] && window.MGX && window.MGX[lang]) TXT[lang] = window.MGX[lang]; if (!TXT[lang]) lang = 'en';
    var reduced = false;
    try { reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) {}

    var D = TXT[lang], G = D[id];
    function tx(key, vars) {
      var s = G[key] != null ? G[key] : D._[key] != null ? D._[key] : key;
      if (vars) for (var k in vars) s = s.replace('{' + k + '}', vars[k]);
      return s;
    }

    var ov = el('div', 'mg-ov');
    ov.setAttribute('role', 'application'); ov.setAttribute('aria-label', G.title);
    var cv = document.createElement('canvas');
    var ctx = cv.getContext('2d');
    var hud = el('div', 'mg-hud');
    var pScore = el('div', 'mg-pill'), pTime = el('div', 'mg-pill mg-time');
    hud.appendChild(pScore); hud.appendChild(pTime);
    var xb = el('button', 'mg-x', '✕');
    xb.type = 'button'; xb.setAttribute('aria-label', D._.exit); xb.title = D._.exit;
    ov.appendChild(cv); ov.appendChild(hud); ov.appendChild(xb);
    host.appendChild(ov);

    var W = 1, H = 1, dpr = 1, state = 'intro', raf = 0, last = 0, done = false;
    var playT = 0, timeLeft = 0, endTimer = -1, parts = [], pops = [], lastHud = '', lastSec = -1;
    function sfx(n) { try { if (opts.sfx && typeof opts.sfx[n] === 'function') opts.sfx[n](); } catch (e) {} }

    var A = {
      W: 1, H: 1, junior: !!opts.junior, lang: lang, reduced: reduced, tx: tx, sfx: sfx,
      time: function () { return playT; },
      playing: function () { return state === 'play'; },
      burst: function (x, y, n, colors, spread) {
        n = Math.max(1, Math.round(n * (reduced ? 0.3 : 1)));
        colors = colors || ['#f6de98', '#e8b94a', '#ffffff'];
        spread = spread || 1;
        for (var i = 0; i < n; i++) {
          var a = rand(0, Math.PI * 2), sp = rand(60, 220) * spread;
          parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, life: rand(0.5, 0.9), max: 0.9, c: colors[i % colors.length], s: rand(3, 7), spark: Math.random() < 0.6 });
        }
      },
      pop: function (x, y, text, color, size) { pops.push({ x: x, y: y, t: text, c: color || '#f6de98', s: size || 22, life: 1.1 }); },
      end: function (delay) { if (state === 'play' && endTimer < 0) endTimer = delay || 0.01; }
    };
    var g = GAMES[id](A);
    var duration = opts.debugFast ? 3 : g.duration;
    timeLeft = duration;

    function resize() {
      var r = host.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width || host.clientWidth || window.innerWidth));
      H = Math.max(1, Math.round(r.height || host.clientHeight || window.innerHeight));
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      cv.__cssW = W; cv.__cssH = H;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      A.W = W; A.H = H;
      if (g.resize) g.resize(W, H);
    }

    function updHud(force) {
      var s = g.hud();
      if (s !== lastHud || force) {
        if (lastHud && !reduced) { pScore.classList.add('bump'); setTimeout(function () { pScore.classList.remove('bump'); }, 160); }
        lastHud = s; pScore.textContent = s;
      }
      var sec = Math.max(0, Math.ceil(timeLeft));
      if (sec !== lastSec || force) { lastSec = sec; pTime.textContent = '⏳ ' + sec; pTime.classList.toggle('low', sec <= 5 && state === 'play'); }
    }

    function frame(ts) {
      raf = requestAnimationFrame(frame);
      var rdt = last ? Math.min(0.25, Math.max(0, (ts - last) / 1000)) : 0; last = ts;
      var dt = Math.min(0.05, rdt);
      var playing = state === 'play';
      if (playing) {
        playT += rdt; timeLeft = Math.max(0, duration - playT);
        if (endTimer >= 0) { endTimer -= dt; if (endTimer <= 0) { endTimer = -1; finishPlay(); } }
        else if (timeLeft <= 0) finishPlay();
      }
      g.update(dt, state === 'play');
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i]; p.life -= dt; if (p.life <= 0) { parts.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; p.vx *= 0.98;
      }
      for (i = pops.length - 1; i >= 0; i--) { pops[i].life -= dt; pops[i].y -= 34 * dt; if (pops[i].life <= 0) pops.splice(i, 1); }
      ctx.save();
      g.draw(ctx, W, H);
      ctx.restore();
      for (i = 0; i < parts.length; i++) {
        p = parts[i]; ctx.globalAlpha = clamp(p.life / p.max * 1.4, 0, 1); ctx.fillStyle = p.c;
        if (p.spark) { sparkPath(ctx, p.x, p.y, p.s * 1.4); ctx.fill(); }
        else { ctx.beginPath(); ctx.arc(p.x, p.y, p.s * 0.6, 0, 7); ctx.fill(); }
      }
      ctx.globalAlpha = 1;
      for (i = 0; i < pops.length; i++) {
        var q = pops[i];
        ctx.globalAlpha = clamp(q.life * 2, 0, 1);
        ctx.font = '900 ' + q.s + 'px ' + UI_FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(14,21,52,.85)'; ctx.lineJoin = 'round';
        ctx.strokeText(q.t, q.x, q.y); ctx.fillStyle = q.c; ctx.fillText(q.t, q.x, q.y);
      }
      ctx.globalAlpha = 1;
      updHud();
    }

    /* cards */
    var veil = null;
    function showVeil(card, onClick) {
      if (veil) veil.remove();
      veil = el('div', 'mg-veil'); veil.appendChild(card); ov.appendChild(veil);
      if (onClick) veil.addEventListener('click', onClick);
    }
    function intro() {
      var c = el('div', 'mg-card');
      c.innerHTML = '<div class="mg-ico">' + ICONS[id] + '</div>' +
        '<div class="mg-title">' + esc(G.title) + '</div>' +
        '<span class="mg-ref">' + esc(G.ref) + '</span>' +
        '<div class="mg-txt">' + esc(tx('text', g.vars || {})) + '</div>' +
        '<div class="mg-hint">' + esc(G.hint) + '</div>' +
        '<button type="button" class="mg-btn">' + esc(D._.start) + ' ▶</button>';
      showVeil(c, begin);
    }
    function begin() {
      if (state !== 'intro') return;
      state = 'play'; if (veil) { veil.remove(); veil = null; }
      if (g.begin) g.begin();
      updHud(true);
    }
    function starsFor(score, max) {
      var r = max > 0 ? score / max : 0;
      return r >= 0.85 ? 3 : r >= 0.55 ? 2 : r >= 0.25 ? 1 : 0;
    }
    function finishPlay() {
      if (state !== 'play') return;
      state = 'end'; timeLeft = Math.max(0, duration - playT); updHud(true);
      if (g.finish) g.finish();
      var sc = g.score(), mx = g.max, st = starsFor(sc, mx);
      if (st >= 2) sfx('win');
      var stars = '';
      for (var i = 0; i < 3; i++) stars += '<span class="mg-star' + (i < st ? ' on' : '') + '" style="animation-delay:' + (0.15 + i * 0.18) + 's">★</span>';
      var c = el('div', 'mg-card');
      c.innerHTML = '<div class="mg-title">' + esc(D._['r' + st]) + '</div>' +
        '<div class="mg-stars" aria-label="' + st + ' / 3">' + stars + '</div>' +
        '<div class="mg-sc">' + esc(G.hud) + ': ' + sc + (sc <= mx ? ' / ' + mx : ' \uD83C\uDF89') + '</div>' +
        '<div class="mg-fact">' + esc(G.fact) + '</div>' +
        '<button type="button" class="mg-btn">' + esc(D._.cont) + ' ▶</button>';
      showVeil(c, null);
      var b = c.querySelector('.mg-btn');
      b.addEventListener('click', function () { finish(false); });
    }
    function finish(quit) {
      if (done) return; done = true;
      if (active === finish) active = null;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('keyup', onKeyUp, true);
      window.removeEventListener('resize', resize);
      if (ro) try { ro.disconnect(); } catch (e) {}
      ov.removeEventListener('touchmove', stopTouch);
      if (ov.parentNode) ov.parentNode.removeChild(ov);
      var sc = g.score(), mx = g.max;
      var res = { id: id, score: sc, max: mx, stars: quit ? 0 : starsFor(sc, mx), quit: !!quit };
      try { onDone(res); } catch (e) { setTimeout(function () { throw e; }, 0); }
    }
    active = finish;

    /* input */
    function pos(e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    cv.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      if (state !== 'play') return;
      try { cv.setPointerCapture(e.pointerId); } catch (er) {}
      var p = pos(e); if (g.down) g.down(p.x, p.y);
    });
    cv.addEventListener('pointermove', function (e) { if (state !== 'play') return; var p = pos(e); if (g.move) g.move(p.x, p.y, e.buttons > 0 || e.pointerType !== 'mouse'); });
    cv.addEventListener('pointerup', function (e) { if (state !== 'play') return; var p = pos(e); if (g.up) g.up(p.x, p.y); });
    cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    function stopTouch(e) { if (e.cancelable) e.preventDefault(); }
    ov.addEventListener('touchmove', stopTouch, { passive: false });
    xb.addEventListener('click', function (e) { e.stopPropagation(); finish(state !== 'end'); });
    var KEYS = { ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1, ' ': 1, Spacebar: 1 };
    function onKey(e) {
      if (done) return;
      if (e.key === 'Escape') { e.preventDefault(); finish(state !== 'end'); return; }
      if (state === 'intro' && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); begin(); return; }
      if (state === 'end') { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (veil && veil.querySelector('.mg-btn')) finish(false); } return; }
      if (KEYS[e.key]) e.preventDefault();
      if (state === 'play' && g.key) g.key(e.key, true, e.repeat);
    }
    function onKeyUp(e) { if (!done && state === 'play' && g.key) g.key(e.key, false); }
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('keyup', onKeyUp, true);
    window.addEventListener('resize', resize);
    var ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { resize(); }); ro.observe(host); }

    resize();
    updHud(true);
    intro();
    raf = requestAnimationFrame(frame);
  }

  /* ================================================================ MANNA */
  GAMES.manna = function (A) {
    var J = A.junior, target = J ? 15 : 20;
    var W = 1, H = 1, groundY, bw, bh, rimY, bx = null, tx = null, R;
    var items = [], spawnT = 0.3, caught = 0, reached = false, reachedT = 0, keys = { l: 0, r: 0 }, t = 0;
    var sky = [], tents = [], dew = [];
    for (var i = 0; i < 40; i++) sky.push({ x: Math.random(), y: Math.random() * 0.45, s: rand(0.6, 1.8), p: rand(0, 6) });
    function resize(w, h) {
      W = w; H = h;
      groundY = H - clamp(H * 0.13, 54, 96);
      bw = clamp(W * (J ? 0.3 : 0.24), 90, J ? 180 : 150);
      bh = bw * 0.42;
      rimY = groundY - bh * 0.8;
      R = clamp(Math.min(W, H) * 0.036, 12, 19);
      if (bx == null) bx = tx = W / 2;
      bx = clamp(bx, bw / 2, W - bw / 2); tx = clamp(tx, bw / 2, W - bw / 2);
      tents = []; var n = Math.max(4, Math.floor(W / 80));
      for (var i = 0; i < n; i++) tents.push({ x: (i + rand(0.15, 0.85)) / n * W, s: rand(10, 18), c: Math.random() < 0.5 ? '#7e5236' : '#94643f' });
      dew = []; for (i = 0; i < Math.floor(W / 14); i++) dew.push({ x: rand(0, W), y: rand(groundY + 10, H - 6), p: rand(0, 6) });
    }
    function spawn() {
      var gold = Math.random() < (J ? 0.15 : 0.12);
      items.push({ x: rand(R + 12, W - R - 12), y: -R * 2, r: gold ? R * 1.15 : R * rand(0.9, 1.05), vy: H * (J ? 0.16 : 0.23) * rand(0.85, 1.15) * (1 + A.time() / 90),
        gold: gold, ph: rand(0, 6.28), st: 'fall', life: 1 });
    }
    function update(dt, playing) {
      t += dt;
      var sp = W * (J ? 0.9 : 1.15);
      if (keys.l || keys.r) tx = clamp(tx + (keys.r - keys.l) * sp * dt, bw / 2, W - bw / 2);
      bx += (tx - bx) * Math.min(1, dt * 16);
      if (playing) { spawnT -= dt; if (spawnT <= 0) { spawnT = (J ? 0.9 : 0.68) * rand(0.75, 1.25); spawn(); } }
      if (reached) reachedT += dt;
      for (var i = items.length - 1; i >= 0; i--) {
        var m = items[i];
        if (m.st === 'fall') {
          m.y += m.vy * dt; m.x += Math.sin(t * 2.2 + m.ph) * 14 * dt;
          if (m.y + m.r >= rimY && m.y - m.r < rimY + bh * 0.35 && Math.abs(m.x - bx) < bw / 2 - m.r * 0.1 && playing) {
            items.splice(i, 1); catchIt(m); continue;
          }
          if (m.y >= groundY + 4) { m.st = 'ground'; m.y = groundY + rand(4, 16); }
        } else { m.life -= dt * 0.6; if (m.life <= 0) items.splice(i, 1); }
      }
    }
    function catchIt(m) {
      if (!reached) {
        var v = m.gold ? 2 : 1;
        caught = Math.min(target, caught + v);
        A.sfx('coin');
        A.burst(m.x, rimY, m.gold ? 12 : 6, m.gold ? ['#f6de98', '#e8b94a', '#fff'] : ['#ffffff', '#f6ecd4', '#f6de98']);
        A.pop(m.x, rimY - 24, '+' + v, m.gold ? '#f6de98' : '#ffffff');
        if (caught >= target) { reached = true; A.sfx('win'); A.burst(bx, rimY - 20, 30); A.end(2.6); }
      } else {
        A.pop(m.x, rimY - 20, '☀ ' + A.tx('melt'), '#ffd6a0', 16);
        A.burst(m.x, rimY, 4, ['#cfe6ff', '#ffffff'], 0.5);
      }
    }
    function drawManna(c, x, y, r, gold, a) {
      c.save(); c.globalAlpha = a;
      if (gold) {
        var gl = c.createRadialGradient(x, y, 0, x, y, r * 2.4);
        gl.addColorStop(0, 'rgba(246,222,152,.55)'); gl.addColorStop(1, 'rgba(246,222,152,0)');
        c.fillStyle = gl; c.beginPath(); c.arc(x, y, r * 2.4, 0, 7); c.fill();
      }
      c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowBlur = 6; c.shadowOffsetY = 2;
      var g = c.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
      if (gold) { g.addColorStop(0, '#fffbe8'); g.addColorStop(0.6, '#f6de98'); g.addColorStop(1, '#d9a63a'); }
      else { g.addColorStop(0, '#ffffff'); g.addColorStop(0.7, '#f7f1e1'); g.addColorStop(1, '#ddd0b0'); }
      c.fillStyle = g; c.beginPath(); c.ellipse(x, y, r, r * 0.82, 0, 0, 7); c.fill();
      c.shadowColor = 'transparent';
      c.strokeStyle = gold ? 'rgba(170,120,30,.45)' : 'rgba(200,180,130,.55)'; c.lineWidth = Math.max(1, r * 0.1);
      c.beginPath(); c.ellipse(x, y, r * 0.62, r * 0.5, 0, 0, 7); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.ellipse(x - r * 0.35, y - r * 0.32, r * 0.22, r * 0.12, -0.5, 0, 7); c.fill();
      c.restore();
    }
    function draw(c) {
      var g = c.createLinearGradient(0, 0, 0, groundY);
      g.addColorStop(0, '#0e1534'); g.addColorStop(0.42, '#1d2b66'); g.addColorStop(0.78, '#7b5f9c'); g.addColorStop(1, '#f2b67c');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      for (var i = 0; i < sky.length; i++) {
        var s = sky[i]; c.globalAlpha = (0.35 + 0.35 * Math.sin(t * 1.5 + s.p)) * (1 - s.y * 1.6);
        c.fillStyle = '#f6ecd4'; c.beginPath(); c.arc(s.x * W, s.y * H, s.s, 0, 7); c.fill();
      }
      c.globalAlpha = 1;
      var sun = c.createRadialGradient(W * 0.7, groundY, 0, W * 0.7, groundY, Math.max(W, H) * 0.6);
      sun.addColorStop(0, 'rgba(255,220,160,.6)'); sun.addColorStop(1, 'rgba(255,220,160,0)');
      c.fillStyle = sun; c.fillRect(0, 0, W, groundY);
      /* far dune with tents */
      var fy = groundY - clamp(H * 0.05, 18, 40);
      c.fillStyle = '#c98f5f'; c.beginPath(); c.moveTo(0, groundY);
      c.lineTo(0, fy + 8); c.quadraticCurveTo(W * 0.25, fy - 14, W * 0.5, fy + 2); c.quadraticCurveTo(W * 0.75, fy + 14, W, fy - 4); c.lineTo(W, groundY + 14); c.lineTo(0, groundY + 14); c.fill();
      for (i = 0; i < tents.length; i++) {
        var tt = tents[i], ty = fy + 6 + Math.sin(tt.x / W * 6) * 4;
        c.fillStyle = tt.c; c.beginPath(); c.moveTo(tt.x - tt.s, ty + 4); c.lineTo(tt.x, ty - tt.s * 0.9); c.lineTo(tt.x + tt.s, ty + 4); c.fill();
        c.fillStyle = 'rgba(40,20,10,.5)'; c.beginPath(); c.moveTo(tt.x - tt.s * 0.18, ty + 4); c.lineTo(tt.x, ty - tt.s * 0.35); c.lineTo(tt.x + tt.s * 0.18, ty + 4); c.fill();
      }
      /* ground */
      var gg = c.createLinearGradient(0, groundY, 0, H);
      gg.addColorStop(0, '#e9c48a'); gg.addColorStop(1, '#c48f55');
      c.fillStyle = gg; c.beginPath(); c.moveTo(0, groundY + 6); c.quadraticCurveTo(W * 0.3, groundY - 6, W * 0.6, groundY + 2); c.quadraticCurveTo(W * 0.85, groundY + 8, W, groundY - 2); c.lineTo(W, H); c.lineTo(0, H); c.fill();
      for (i = 0; i < dew.length; i++) { var d = dew[i]; c.globalAlpha = 0.3 + 0.3 * Math.sin(t * 2 + d.p); c.fillStyle = '#fffaf0'; c.fillRect(d.x, d.y, 2, 2); }
      c.globalAlpha = 1;
      /* landed manna (behind basket) */
      for (i = 0; i < items.length; i++) if (items[i].st === 'ground') drawManna(c, items[i].x, items[i].y, items[i].r * 0.85, items[i].gold, clamp(items[i].life, 0, 1) * 0.9);
      /* basket */
      var x0 = bx - bw / 2;
      c.fillStyle = 'rgba(60,35,15,.3)'; c.beginPath(); c.ellipse(bx, rimY + bh + 2, bw * 0.48, bh * 0.16, 0, 0, 7); c.fill();
      var bg = c.createLinearGradient(0, rimY, 0, rimY + bh);
      bg.addColorStop(0, '#c58a46'); bg.addColorStop(1, '#7b4d22');
      c.fillStyle = bg; c.beginPath(); c.moveTo(x0, rimY); c.lineTo(x0 + bw, rimY); c.lineTo(x0 + bw * 0.88, rimY + bh); c.lineTo(x0 + bw * 0.12, rimY + bh); c.closePath(); c.fill();
      c.save(); c.clip();
      c.strokeStyle = 'rgba(70,40,15,.45)'; c.lineWidth = 2;
      for (i = 1; i < 4; i++) { c.beginPath(); c.moveTo(x0, rimY + bh * i / 4); c.lineTo(x0 + bw, rimY + bh * i / 4); c.stroke(); }
      c.strokeStyle = 'rgba(255,220,160,.25)';
      for (i = 0; i < 12; i++) { var vx = x0 + bw * (i + 0.5) / 12; c.beginPath(); c.moveTo(vx, rimY); c.lineTo(bx + (vx - bx) * 0.78, rimY + bh); c.stroke(); }
      c.restore();
      /* pile of manna */
      var fill = caught / target;
      if (fill > 0) {
        var ph = bh * 0.55 * fill;
        c.save(); c.beginPath(); c.rect(x0, rimY - ph - 20, bw, ph + 22); c.clip();
        c.fillStyle = '#f7f0dc'; c.beginPath(); c.moveTo(x0 + 6, rimY + 2); c.quadraticCurveTo(bx, rimY - ph * 2, x0 + bw - 6, rimY + 2); c.fill();
        c.fillStyle = 'rgba(200,180,130,.6)';
        for (i = 0; i < Math.min(caught, 14); i++) { var px = x0 + bw * (0.18 + 0.64 * hash(i, 3)); var top = rimY - ph * 2 * (1 - Math.pow((px - bx) / (bw / 2), 2)) * 0.5; c.beginPath(); c.arc(px, lerp(rimY, top, hash(i, 7) * 0.8) + 3, 2.2, 0, 7); c.fill(); }
        c.restore();
      }
      var rg = c.createLinearGradient(0, rimY - 6, 0, rimY + 8);
      rg.addColorStop(0, '#e0a865'); rg.addColorStop(1, '#8e5a28');
      c.fillStyle = rg; rr(c, x0 - 5, rimY - 5, bw + 10, 12, 6); c.fill();
      c.fillStyle = 'rgba(255,240,200,.35)'; rr(c, x0, rimY - 4, bw, 3, 2); c.fill();
      /* falling manna */
      for (i = 0; i < items.length; i++) if (items[i].st === 'fall') drawManna(c, items[i].x, items[i].y, items[i].r, items[i].gold, 1);
      /* progress bar under HUD */
      var pw = Math.min(W - 32, 360), px0 = (W - pw) / 2, py = 72;
      c.fillStyle = 'rgba(14,21,52,.6)'; rr(c, px0, py, pw, 10, 5); c.fill();
      var pg = c.createLinearGradient(px0, 0, px0 + pw, 0); pg.addColorStop(0, '#f6de98'); pg.addColorStop(1, '#e8b94a');
      c.fillStyle = pg; rr(c, px0, py, Math.max(10, pw * fill), 10, 5); c.fill();
      if (reached) {
        var a = clamp(reachedT * 3, 0, 1), sc = 0.8 + 0.2 * ease(a);
        c.save(); c.globalAlpha = a; c.translate(W / 2, H * 0.36); c.scale(sc, sc);
        c.font = (Math.min(W * 0.075, 34)) + 'px ' + TITLE_FONT; c.textAlign = 'center'; c.textBaseline = 'middle';
        var tw = c.measureText(A.tx('enough')).width + 40;
        c.fillStyle = 'rgba(246,236,212,.95)'; c.strokeStyle = '#e8b94a'; c.lineWidth = 3;
        rr(c, -tw / 2, -32, tw, 64, 18); c.fill(); c.stroke();
        c.fillStyle = '#1d2b66'; c.fillText(A.tx('enough'), 0, 2);
        c.restore();
      }
    }
    return {
      duration: 40, max: target, vars: { n: target },
      score: function () { return caught; },
      hud: function () { return A.tx('hud') + ' ' + caught + ' / ' + target; },
      resize: resize, update: update, draw: draw,
      down: function (x) { tx = clamp(x, bw / 2, W - bw / 2); },
      move: function (x, y, pressed) { if (pressed) tx = clamp(x, bw / 2, W - bw / 2); },
      key: function (k, down) {
        if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.l = down ? 1 : 0;
        if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.r = down ? 1 : 0;
      }
    };
  };

  /* ================================================================== ARK */
  GAMES.ark = function (A) {
    var J = A.junior, N = J ? 8 : 12, P = N / 2;
    var POOL = ['🦁', '🐑', '🐘', '🦒', '🐪', '🐎', '🐢', '🐇', '🦓', '🐄', '🦘', '🐧'];
    var animals = shuffle(POOL.slice()).slice(0, P);
    var deck = shuffle(animals.concat(animals));
    var cards = deck.map(function (a, i) { return { a: a, i: i, f: 0, face: false, matched: false, fly: -1, gone: false, shake: 0, x: 0, y: 0, w: 10, h: 10 }; });
    var W = 1, H = 1, arkTop = 68, arkH = 100, aw = 200, open = [], lock = 0, pairs = 0, mistakes = 0, bonus = 0, aboard = [], t = 0, pending = null, allDone = false, allT = 0;
    var rain = []; for (var i = 0; i < 50; i++) rain.push({ x: Math.random(), y: Math.random(), s: rand(0.6, 1.2) });
    function layout() {
      arkH = clamp(H * 0.17, 72, 140); aw = Math.min(W * 0.66, arkH * 2.9);
      var gap = clamp(W * 0.025, 8, 14), top = arkTop + arkH + 14, ah = H - top - 14, awd = W - 28, best = null;
      for (var cols = 2; cols <= 6; cols++) {
        var rows = Math.ceil(N / cols);
        if (cols * rows !== N) continue;
        var w = Math.min((awd - gap * (cols - 1)) / cols, (ah - gap * (rows - 1)) / rows / 1.25);
        if (!best || w > best.w) best = { w: w, cols: cols, rows: rows };
      }
      var cw = Math.min(best.w, 140), chh = cw * 1.25;
      var gw = best.cols * cw + (best.cols - 1) * gap, gh = best.rows * chh + (best.rows - 1) * gap;
      var x0 = (W - gw) / 2, y0 = top + (ah - gh) / 2;
      cards.forEach(function (c, i) { c.w = cw; c.h = chh; c.x = x0 + (i % best.cols) * (cw + gap); c.y = y0 + Math.floor(i / best.cols) * (chh + gap); });
    }
    function door() { return { x: W / 2, y: arkTop + arkH * 0.62 }; }
    function update(dt) {
      t += dt;
      if (lock > 0) { lock -= dt; if (lock <= 0 && pending) { pending(); pending = null; } }
      if (allDone) allT += dt;
      for (var i = 0; i < cards.length; i++) {
        var c = cards[i], target = c.face ? 1 : 0;
        c.f += clamp(target - c.f, -dt * 6, dt * 6);
        if (c.shake > 0) c.shake = Math.max(0, c.shake - dt);
        if (c.fly >= 0 && !c.gone) {
          c.fly += dt / 0.85;
          if (c.fly >= 1) {
            c.gone = true;
            if (aboard.indexOf(c.a) < 0) { aboard.push(c.a); var d = door(); A.burst(d.x, d.y, 14); }
          }
        }
      }
    }
    function down(x, y) {
      if (lock > 0 || open.length >= 2) return;
      for (var i = 0; i < cards.length; i++) {
        var c = cards[i];
        if (c.matched || c.face) continue;
        if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) {
          c.face = true; open.push(c);
          if (open.length === 2) check();
          return;
        }
      }
    }
    function check() {
      var a = open[0], b = open[1];
      if (a.a === b.a) {
        a.matched = b.matched = true; pairs++;
        A.sfx('ok');
        A.pop((a.x + b.x) / 2 + a.w / 2, Math.min(a.y, b.y), A.tx('pair'), '#f6de98', 18);
        lock = 0.45;
        pending = function () {
          a.fly = 0; b.fly = 0; open = [];
          if (pairs === P) {
            bonus = Math.max(0, P * 5 - mistakes * 2);
            allDone = true;
            setTimeout(function () { A.pop(W / 2, H * 0.5, A.tx('bonus', { n: bonus }), '#f6de98', 22); }, 700);
            A.end(2.4);
          }
        };
      } else {
        mistakes++; lock = 0.95;
        pending = function () { a.face = b.face = false; a.shake = b.shake = 0.35; open = []; A.sfx('bad'); };
      }
    }
    function drawCard(c, cd) {
      var cx = cd.x + cd.w / 2, cy = cd.y + cd.h / 2, sx = Math.abs(Math.cos(cd.f * Math.PI)), face = cd.f > 0.5;
      var ox = cd.shake > 0 ? Math.sin(cd.shake * 50) * 5 : 0, sc = 1, fx = cx, fy = cy, alpha = 1;
      if (cd.fly >= 0) {
        var d = door(), k = ease(clamp(cd.fly, 0, 1));
        fx = lerp(cx, d.x, k); fy = lerp(cy, d.y, k) - Math.sin(k * Math.PI) * 50; sc = lerp(1, 0.22, k); alpha = 1 - clamp((cd.fly - 0.75) * 4, 0, 1);
      }
      /* empty slot */
      if (cd.matched) {
        c.save(); c.setLineDash([6, 6]); c.strokeStyle = 'rgba(246,222,152,.3)'; c.lineWidth = 2; rr(c, cd.x + 3, cd.y + 3, cd.w - 6, cd.h - 6, 12); c.stroke(); c.restore();
        if (cd.gone) return;
      }
      c.save(); c.globalAlpha = alpha; c.translate(fx + ox, fy); c.scale(Math.max(0.04, sx) * sc, sc);
      var w = cd.w, h = cd.h, r = Math.min(14, w * 0.14);
      c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 10; c.shadowOffsetY = 4;
      if (face) {
        var g = c.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, '#fffaf0'); g.addColorStop(1, '#f1e2bf');
        c.fillStyle = g; rr(c, -w / 2, -h / 2, w, h, r); c.fill(); c.shadowColor = 'transparent';
        c.strokeStyle = cd.matched ? '#e8b94a' : '#d3b77a'; c.lineWidth = cd.matched ? 4 : 2; rr(c, -w / 2 + 1, -h / 2 + 1, w - 2, h - 2, r); c.stroke();
        if (cd.matched) { c.fillStyle = 'rgba(246,222,152,.35)'; rr(c, -w / 2, -h / 2, w, h, r); c.fill(); }
        emoji(c, cd.a, 0, 0, w * 0.58);
      } else {
        var g2 = c.createLinearGradient(0, -h / 2, 0, h / 2); g2.addColorStop(0, '#2a3c86'); g2.addColorStop(1, '#16214f');
        c.fillStyle = g2; rr(c, -w / 2, -h / 2, w, h, r); c.fill(); c.shadowColor = 'transparent';
        c.strokeStyle = '#e8b94a'; c.lineWidth = 3; rr(c, -w / 2 + 1.5, -h / 2 + 1.5, w - 3, h - 3, r); c.stroke();
        c.strokeStyle = 'rgba(232,185,74,.4)'; c.lineWidth = 1; rr(c, -w / 2 + 7, -h / 2 + 7, w - 14, h - 14, r * 0.6); c.stroke();
        c.fillStyle = 'rgba(246,222,152,.85)'; sparkPath(c, 0, 0, w * 0.2); c.fill();
        c.fillStyle = 'rgba(246,222,152,.35)'; sparkPath(c, -w * 0.25, -h * 0.28, w * 0.07); c.fill(); sparkPath(c, w * 0.25, h * 0.28, w * 0.07); c.fill();
      }
      c.restore();
    }
    function drawArk(c) {
      var ax = W / 2, top = arkTop, h = arkH;
      var hy = top + h * 0.66, hb = top + h * 0.95, houseTop = top + h * 0.26, hw = aw * 0.56;
      if (allDone) {
        var ra = clamp(allT * 1.5, 0, 1) * 0.75, cols = ['#ff6b6b', '#ffb84d', '#ffe66b', '#7be08a', '#6bb8ff', '#9b7bff'];
        c.save(); c.globalAlpha = ra; c.lineWidth = Math.max(4, h * 0.06);
        for (var i = 0; i < cols.length; i++) { c.strokeStyle = cols[i]; c.beginPath(); c.arc(ax, hb - h * 0.04, aw * 0.75 - i * c.lineWidth, Math.PI, 0); c.stroke(); }
        c.restore();
      }
      /* water */
      c.fillStyle = 'rgba(80,140,210,.35)';
      c.beginPath(); c.moveTo(0, hb); for (var x = 0; x <= W; x += 10) c.lineTo(x, hb - h * 0.08 + Math.sin(x / 26 + t * 2) * 3); c.lineTo(W, hb + 8); c.lineTo(0, hb + 8); c.fill();
      /* roof */
      c.fillStyle = '#6b3f1d'; c.beginPath(); c.moveTo(ax - hw / 2 - h * 0.08, houseTop + 2); c.lineTo(ax, top + h * 0.02); c.lineTo(ax + hw / 2 + h * 0.08, houseTop + 2); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,220,160,.25)'; c.fillRect(ax - hw / 2 - h * 0.08, houseTop - 1, hw + h * 0.16, 3);
      /* house */
      var hg = c.createLinearGradient(0, houseTop, 0, hy); hg.addColorStop(0, '#b57a43'); hg.addColorStop(1, '#8c5a2c');
      c.fillStyle = hg; c.fillRect(ax - hw / 2, houseTop, hw, hy - houseTop);
      /* windows with animals */
      var dw = aw * 0.1, side = (hw - dw) / 2, per = P / 2, slot = side / per, wy = houseTop + (hy - houseTop) * 0.45, ws = Math.min(slot * 0.78, (hy - houseTop) * 0.62);
      for (i = 0; i < P; i++) {
        var left = i < per, k = left ? i : i - per;
        var wx = left ? ax - hw / 2 + slot * (k + 0.5) : ax + dw / 2 + slot * (k + 0.5);
        c.fillStyle = '#3a2210'; rr(c, wx - ws / 2, wy - ws / 2, ws, ws, 4); c.fill();
        if (aboard[i]) { c.fillStyle = 'rgba(255,220,140,.45)'; rr(c, wx - ws / 2, wy - ws / 2, ws, ws, 4); c.fill(); emoji(c, aboard[i], wx, wy, ws * 0.82); }
      }
      /* door */
      c.fillStyle = '#2e1a0b'; rr(c, ax - dw / 2, hy - (hy - houseTop) * 0.8, dw, (hy - houseTop) * 0.8 + 2, 4); c.fill();
      c.fillStyle = 'rgba(246,222,152,' + (0.25 + 0.15 * Math.sin(t * 3)) + ')'; rr(c, ax - dw / 2 + 3, hy - (hy - houseTop) * 0.8 + 3, dw - 6, (hy - houseTop) * 0.8 - 3, 3); c.fill();
      /* hull */
      var g = c.createLinearGradient(0, hy, 0, hb); g.addColorStop(0, '#9b6334'); g.addColorStop(1, '#5c3517');
      c.fillStyle = g; c.beginPath(); c.moveTo(ax - aw / 2, hy - h * 0.04); c.lineTo(ax + aw / 2, hy - h * 0.04);
      c.quadraticCurveTo(ax + aw * 0.42, hb, ax + aw * 0.3, hb); c.lineTo(ax - aw * 0.3, hb); c.quadraticCurveTo(ax - aw * 0.42, hb, ax - aw / 2, hy - h * 0.04); c.closePath(); c.fill();
      c.save(); c.clip(); c.strokeStyle = 'rgba(40,20,5,.35)'; c.lineWidth = 1.5;
      for (i = 1; i < 4; i++) { var ly = lerp(hy, hb, i / 4); c.beginPath(); c.moveTo(ax - aw / 2, ly); c.lineTo(ax + aw / 2, ly); c.stroke(); }
      c.restore();
      c.fillStyle = '#c99358'; c.fillRect(ax - aw / 2, hy - h * 0.05, aw, 3);
      /* front water */
      var fw = c.createLinearGradient(0, hb - h * 0.06, 0, hb + h * 0.5); fw.addColorStop(0, 'rgba(70,130,200,.6)'); fw.addColorStop(1, 'rgba(70,130,200,0)');
      c.fillStyle = fw;
      c.beginPath(); c.moveTo(0, hb + h * 0.5); for (x = 0; x <= W; x += 10) c.lineTo(x, hb - h * 0.04 + Math.sin(x / 20 - t * 2.4) * 3); c.lineTo(W, hb + h * 0.5); c.fill();
    }
    function draw(c) {
      var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0e1534'); g.addColorStop(0.5, '#1d2b66'); g.addColorStop(1, '#13204f');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      /* soft clouds */
      c.fillStyle = 'rgba(160,175,220,.08)';
      for (var i = 0; i < 5; i++) { var cx = ((i * 0.27 + t * 0.01) % 1.2 - 0.1) * W; c.beginPath(); c.ellipse(cx, 60 + i * 18, W * 0.18, 22, 0, 0, 7); c.fill(); }
      if (!A.reduced && !allDone) {
        c.strokeStyle = 'rgba(180,200,255,.18)'; c.lineWidth = 1.2; c.beginPath();
        for (i = 0; i < rain.length; i++) { var r = rain[i], ry = ((r.y + t * 0.5 * r.s) % 1) * H, rx = r.x * W; c.moveTo(rx, ry); c.lineTo(rx - 3, ry + 12); }
        c.stroke();
      }
      drawArk(c);
      var flying = [];
      for (i = 0; i < cards.length; i++) { if (cards[i].fly >= 0 && !cards[i].gone) flying.push(cards[i]); else drawCard(c, cards[i]); }
      for (i = 0; i < flying.length; i++) drawCard(c, flying[i]);
      if (allDone && allT > 0.9) {
        var a = clamp((allT - 0.9) * 3, 0, 1);
        c.save(); c.globalAlpha = a; c.font = Math.min(W * 0.07, 30) + 'px ' + TITLE_FONT; c.textAlign = 'center'; c.textBaseline = 'middle';
        var tw = c.measureText(A.tx('all')).width + 36; c.fillStyle = 'rgba(246,236,212,.95)'; c.strokeStyle = '#e8b94a'; c.lineWidth = 3;
        rr(c, W / 2 - tw / 2, H * 0.58 - 28, tw, 56, 16); c.fill(); c.stroke(); c.fillStyle = '#1d2b66'; c.fillText(A.tx('all'), W / 2, H * 0.58 + 2); c.restore();
      }
    }
    return {
      duration: 45, max: P * 15,
      score: function () { return pairs * 10 + bonus; },
      hud: function () { return A.tx('hud') + ' ' + (pairs * 10 + bonus) + '  ·  ' + pairs + '/' + P + ' 🐾'; },
      resize: function (w, h) { W = w; H = h; layout(); }, update: update, draw: draw, down: down
    };
  };

  /* ================================================================= WALL */
  GAMES.wall = function (A) {
    var J = A.junior, N = J ? 8 : 12;
    var W = 1, H = 1, groundY, rh, fh, w0, minW, tol, speed;
    var base = null, rows = [], mov = null, falling = [], camY = 0, t = 0, finished = false, finT = 0, misses = 0;
    var talk = { next: 6, ph: 0, tm: 0 };
    var city = [];
    function resize(w, h) {
      var first = !base;
      var oldW = W, oldW0 = w0; W = w; H = h;
      groundY = H - clamp(H * 0.1, 40, 80); rh = clamp(H * 0.05, 24, 38); fh = rh * 1.3;
      w0 = clamp(W * (J ? 0.6 : 0.5), 150, J ? 340 : 300); minW = J ? 50 : 32; tol = J ? 15 : 8;
      speed = J ? clamp(W * 0.34, 120, 210) : clamp(W * 0.5, 170, 320);
      if (first) { base = { x: W / 2 - (w0 + 24) / 2, w: w0 + 24 }; newStone(); }
      else if (oldW !== W || oldW0 !== w0) {
        var k = w0 / oldW0, fix = function (o) { var c = W / 2 + (o.x + o.w / 2 - oldW / 2) * k; o.w *= k; o.x = c - o.w / 2; };
        fix(base); rows.forEach(fix); falling = [];
        if (mov) { mov.w *= k; mov.x = clamp(mov.x, lo(), hi() - mov.w); mov.sp = speed * (1 + rows.length * 0.04); }
      }
      city = []; var n = Math.ceil(W / 46);
      for (var i = 0; i < n; i++) city.push({ x: i * 46 + rand(-6, 6), w: rand(26, 44), h: rand(20, 60), dome: Math.random() < 0.3, tower: Math.random() < 0.25 });
    }
    function lo() { return Math.max(6, W / 2 - w0 * 1.2); }
    function hi() { return Math.min(W - 6, W / 2 + w0 * 1.2); }
    function top() { return rows.length ? rows[rows.length - 1] : base; }
    function rowY(i) { return groundY - fh - (i + 1) * rh; } /* world top of row i */
    function newStone() {
      var tp = top(), w = Math.max(rows.length ? tp.w : w0, minW);
      var fromLeft = rows.length % 2 === 0;
      mov = { x: fromLeft ? lo() : hi() - w, w: w, dir: fromLeft ? 1 : -1, sp: speed * (1 + rows.length * 0.04) };
    }
    function drop() {
      if (!mov || finished) return;
      var tp = top(), m = mov, y = rowY(rows.length);
      mov = null;
      var row;
      if (Math.abs(m.x - tp.x) <= tol && rows.length) {
        var nw = Math.min(tp.w + (J ? 16 : 10), w0); row = { x: tp.x - (nw - tp.w) / 2, w: nw };
        A.pop(row.x + row.w / 2, y + camY - 16, A.tx('perfect'), '#f6de98', 20); A.sfx('ok');
        A.burst(row.x + row.w / 2, y + camY + rh / 2, 16);
      } else if (!rows.length && Math.abs((m.x + m.w / 2) - (tp.x + tp.w / 2)) <= tol + 12) {
        row = { x: tp.x + (tp.w - m.w) / 2, w: m.w }; A.pop(row.x + row.w / 2, y + camY - 16, A.tx('perfect'), '#f6de98', 20); A.sfx('ok'); A.burst(row.x + row.w / 2, y + camY + rh / 2, 16);
      } else {
        var l = Math.max(m.x, tp.x), r = Math.min(m.x + m.w, tp.x + tp.w);
        if (r - l <= 2) {
          falling.push({ x: m.x, y: y, w: m.w, vy: 0, rot: 0, vr: m.dir * 1.5, a: 1 });
          misses++; A.sfx('bad'); A.pop(W / 2, y + camY - 16, A.tx('oops'), '#ffd0b8', 20);
          newStone(); return;
        }
        row = { x: l, w: r - l };
        if (m.x < l) falling.push({ x: m.x, y: y, w: l - m.x, vy: 0, rot: 0, vr: -1.6, a: 1 });
        if (m.x + m.w > r) falling.push({ x: r, y: y, w: m.x + m.w - r, vy: 0, rot: 0, vr: 1.6, a: 1 });
        A.sfx('coin'); A.burst(row.x + row.w / 2, y + camY + rh / 2, 6, ['#f6de98', '#ecd09a', '#fff']);
      }
      row.settle = 1; rows.push(row);
      if (rows.length >= N) { finished = true; A.sfx('win'); A.burst(W / 2, y + camY, 40); A.end(1.8); }
      else newStone();
    }
    function update(dt, playing) {
      t += dt;
      if (finished) finT += dt;
      if (mov && playing) {
        mov.x += mov.dir * mov.sp * dt;
        if (mov.x < lo()) { mov.x = lo(); mov.dir = 1; }
        if (mov.x + mov.w > hi()) { mov.x = hi() - mov.w; mov.dir = -1; }
      }
      for (var i = falling.length - 1; i >= 0; i--) {
        var f = falling[i]; f.vy += 900 * dt; f.y += f.vy * dt; f.rot += f.vr * dt; f.a -= dt * 0.8;
        if (f.a <= 0 || f.y + camY > H + 80) falling.splice(i, 1);
      }
      for (i = 0; i < rows.length; i++) if (rows[i].settle > 0) rows[i].settle = Math.max(0, rows[i].settle - dt * 9);
      var ty = rowY(rows.length) - rh * 0.9;
      var want = Math.max(0, H * (H < 520 ? 0.52 : 0.44) - ty);
      camY += (want - camY) * Math.min(1, dt * 4);
      if (playing && !finished) {
        talk.tm += dt;
        if (talk.ph === 0 && A.time() >= talk.next) { talk.ph = 1; talk.tm = 0; }
        else if (talk.ph === 1 && talk.tm > 2.4) { talk.ph = 2; talk.tm = 0; A.sfx('ok'); }
        else if (talk.ph === 2 && talk.tm > 2.8) { talk.ph = 0; talk.next = A.time() + 9; }
      } else if (finished) talk.ph = 0;
    }
    function stoneRow(c, x, y, w, h, seed, dark, alpha) {
      if (w <= 0) return;
      c.save(); if (alpha != null) c.globalAlpha = alpha;
      var g = c.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, dark ? '#b8946a' : '#f0d49e'); g.addColorStop(1, dark ? '#86663f' : '#c7a06a');
      c.fillStyle = g; rr(c, x, y, w, h, 3); c.fill();
      c.clip();
      var bw = h * 1.7, off = (seed % 2) * bw / 2, s = Math.floor((x - off) / bw) * bw + off;
      for (var bx = s; bx < x + w; bx += bw) {
        var hv = hash(seed, Math.round(bx));
        c.fillStyle = hv < 0.5 ? 'rgba(255,255,255,' + (hv * 0.18) + ')' : 'rgba(110,70,30,' + ((hv - 0.5) * 0.22) + ')';
        c.fillRect(bx, y, bw, h);
        c.fillStyle = 'rgba(90,60,30,.5)'; c.fillRect(bx - 1, y + 2, 2, h - 4);
      }
      c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x, y, w, 2);
      c.fillStyle = 'rgba(70,45,20,.5)'; c.fillRect(x, y + h - 2, w, 2);
      c.restore();
    }
    function draw(c) {
      var sk = c.createLinearGradient(0, 0, 0, H);
      sk.addColorStop(0, '#0e1534'); sk.addColorStop(0.45, '#1d2b66'); sk.addColorStop(0.8, '#8a5f8f'); sk.addColorStop(1, '#f0a86a');
      c.fillStyle = sk; c.fillRect(0, 0, W, H);
      /* sun */
      var sy = groundY + camY * 0.15 - H * 0.12;
      var sg = c.createRadialGradient(W * 0.25, sy, 0, W * 0.25, sy, H * 0.35); sg.addColorStop(0, 'rgba(255,230,170,.7)'); sg.addColorStop(0.15, 'rgba(255,210,140,.35)'); sg.addColorStop(1, 'rgba(255,210,140,0)');
      c.fillStyle = sg; c.fillRect(0, 0, W, H);
      /* city silhouette */
      var cyb = groundY + camY * 0.3;
      c.fillStyle = 'rgba(40,30,70,.55)';
      c.beginPath(); c.moveTo(0, cyb); c.quadraticCurveTo(W * 0.3, cyb - 40, W * 0.6, cyb - 18); c.quadraticCurveTo(W * 0.85, cyb - 6, W, cyb - 30); c.lineTo(W, H); c.lineTo(0, H); c.fill();
      c.fillStyle = 'rgba(30,22,58,.7)';
      for (var i = 0; i < city.length; i++) {
        var b = city[i], by = cyb - 14 - b.h;
        c.fillRect(b.x, by, b.w, b.h + 20);
        if (b.dome) { c.beginPath(); c.arc(b.x + b.w / 2, by, b.w * 0.4, Math.PI, 0); c.fill(); }
        if (b.tower) c.fillRect(b.x + b.w * 0.3, by - b.h * 0.5, b.w * 0.4, b.h * 0.5);
      }
      /* ground */
      var gy = groundY + camY;
      if (gy < H) {
        var gg = c.createLinearGradient(0, gy, 0, H); gg.addColorStop(0, '#8a6a3c'); gg.addColorStop(1, '#5b4223');
        c.fillStyle = gg; c.fillRect(0, gy, W, H - gy + 2);
        c.fillStyle = '#a07c48'; c.fillRect(0, gy, W, 4);
        /* rubble */
        for (i = 0; i < 6; i++) { var rx = (i < 3 ? base.x - 26 - i * 22 : base.x + base.w + 10 + (i - 3) * 22); c.fillStyle = i % 2 ? '#b8946a' : '#9c7a50'; rr(c, rx, gy - 9 + (i % 2) * 3, 16, 10, 3); c.fill(); }
      }
      /* foundation */
      stoneRow(c, base.x, groundY - fh + camY, base.w, fh, 7, true);
      /* rows */
      for (i = 0; i < rows.length; i++) {
        var r = rows[i], yy = rowY(i) + camY - r.settle * rh * 0.8;
        if (yy > H + 10) continue;
        stoneRow(c, r.x, yy, r.w, rh, i, false);
      }
      /* falling bits */
      for (i = 0; i < falling.length; i++) {
        var f = falling[i];
        c.save(); c.translate(f.x + f.w / 2, f.y + camY + rh / 2); c.rotate(f.rot); stoneRow(c, -f.w / 2, -rh / 2, f.w, rh, 3, false, clamp(f.a, 0, 1)); c.restore();
      }
      /* moving stone */
      if (mov && !finished) {
        var my = rowY(rows.length) + camY - rh * 0.9, tp = top(), ty = (rows.length ? rowY(rows.length - 1) : groundY - fh) + camY;
        c.save(); c.setLineDash([4, 6]); c.strokeStyle = 'rgba(246,222,152,.45)'; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(mov.x, my + rh); c.lineTo(mov.x, ty); c.moveTo(mov.x + mov.w, my + rh); c.lineTo(mov.x + mov.w, ty); c.stroke(); c.restore();
        c.save(); c.shadowColor = 'rgba(246,222,152,.8)'; c.shadowBlur = 14; c.fillStyle = 'rgba(246,222,152,.3)'; rr(c, mov.x - 2, my - 2, mov.w + 4, rh + 4, 5); c.fill(); c.restore();
        stoneRow(c, mov.x, my, mov.w, rh, rows.length, false);
      }
      /* progress ticks */
      var tick = 74;
      c.font = '900 13px ' + UI_FONT; c.textAlign = 'left'; c.textBaseline = 'middle';
      /* banter */
      if (talk.ph) {
        var bw = Math.min(W - 32, 340), a = clamp(talk.tm * 5, 0, 1);
        if (talk.ph === 1 && H < 520) {
          bubble(c, W / 2, 72, bw, '\u2601 ' + A.tx('mockWho') + ':', A.tx('mock'), { bg: 'rgba(60,64,86,.95)', fg: '#eceaf5', who: '#b9b6d6' }, a);
        } else if (talk.ph === 1) {
          /* gloomy cloud */
          var cx = W / 2, cy = tick + 18;
          c.save(); c.globalAlpha = a * 0.9; c.fillStyle = '#4a4f66';
          c.beginPath(); c.arc(cx - 34, cy + 6, 16, 0, 7); c.arc(cx - 12, cy - 4, 22, 0, 7); c.arc(cx + 16, cy, 18, 0, 7); c.arc(cx + 36, cy + 8, 13, 0, 7); c.fill();
          c.strokeStyle = '#d9d6f0'; c.lineWidth = 2.5; c.lineCap = 'round';
          c.beginPath(); c.arc(cx - 14, cy + 2, 3, 0, 7); c.moveTo(cx + 13, cy + 2); c.arc(cx + 10, cy + 2, 3, 0, 7); c.stroke();
          c.beginPath(); c.arc(cx - 2, cy + 18, 7, 1.15 * Math.PI, 1.85 * Math.PI); c.stroke();
          if (!A.reduced) { c.strokeStyle = 'rgba(160,170,210,.6)'; c.lineWidth = 1.5; for (var dd = 0; dd < 4; dd++) { var dy = (talk.tm * 40 + dd * 9) % 26; c.beginPath(); c.moveTo(cx - 30 + dd * 20, cy + 24 + dy); c.lineTo(cx - 32 + dd * 20, cy + 30 + dy); c.stroke(); } }
          c.restore();
          bubble(c, W / 2, cy + 40, bw, A.tx('mockWho') + ':', A.tx('mock'), { bg: 'rgba(60,64,86,.95)', fg: '#eceaf5', who: '#b9b6d6' }, a, W / 2);
        } else {
          bubble(c, W / 2, H < 520 ? 72 : tick + 8, bw, A.tx('replyWho') + ':', A.tx('reply'), { bg: 'rgba(246,236,212,.97)', fg: '#1d2b66', who: '#9a6d12', border: '#e8b94a' }, a);
        }
      }
      if (finished && finT > 0.3) {
        var fa = clamp((finT - 0.3) * 3, 0, 1);
        c.save(); c.globalAlpha = fa; c.font = Math.min(W * 0.07, 30) + 'px ' + TITLE_FONT; c.textAlign = 'center'; c.textBaseline = 'middle';
        var tw = c.measureText(A.tx('done')).width + 36; c.fillStyle = 'rgba(246,236,212,.95)'; c.strokeStyle = '#e8b94a'; c.lineWidth = 3;
        rr(c, W / 2 - tw / 2, H * 0.2 - 28, tw, 56, 16); c.fill(); c.stroke(); c.fillStyle = '#1d2b66'; c.fillText(A.tx('done'), W / 2, H * 0.2 + 2); c.restore();
      }
    }
    return {
      duration: 45, max: N, vars: { n: N },
      score: function () { return Math.min(rows.length, N); },
      hud: function () { return A.tx('hud') + ' ' + rows.length + ' / ' + N; },
      resize: resize, update: update, draw: draw,
      down: function () { drop(); },
      key: function (k, down, rep) { if (down && !rep && (k === ' ' || k === 'Spacebar' || k === 'Enter' || k === 'ArrowDown')) drop(); }
    };
  };

  /* ================================================================= FISH */
  GAMES.fish = function (A) {
    var J = A.junior, MAX = J ? 25 : 40;
    var W = 1, H = 1, waterY, R, boatW, t = 0, phase = 0, casts = 0, caught = 0, fish = [], flyers = [], net = null, voice = -1, spawnT = 0, voiceAt = -1, hintT = 0;
    var COLS = ['#9fd0ff', '#c4dbe9', '#ffd27a', '#a5e6cf', '#cbb9ff', '#ffb59a'];
    function resize(w, h) {
      var oH = H, oWy = waterY;
      W = w; H = h;
      waterY = Math.round(clamp(H * 0.3, 150, 300));
      if (oWy && oH > oWy) fish.forEach(function (f) { f.y = waterY + (f.y - oWy) / (oH - oWy) * (H - waterY); });
      R = clamp(Math.min(W, H) * (J ? 0.16 : 0.13), 50, J ? 120 : 100);
      boatW = clamp(W * 0.3, 110, 200);
      fish.forEach(function (f) { f.y = clamp(f.y, waterY + 40, H - 24); var rg = region(f.side); f.x0 = rg[0]; f.x1 = rg[1]; f.x = clamp(f.x, f.x0, f.x1); });
    }
    function region(side) { return side === 'r' ? [W / 2 + 10, W - 4] : [4, W / 2 - 10]; }
    function addFish(side, fade) {
      var rg = region(side), s = clamp(Math.min(W, H) * rand(0.028, 0.04), 11, 20);
      fish.push({ side: side, x0: rg[0], x1: rg[1], x: rand(rg[0] + s * 2, rg[1] - s * 2), y: rand(waterY + 50, H - 26), s: s, vx: (Math.random() < 0.5 ? -1 : 1) * rand(30, 70) * (J ? 0.75 : 1), ph: rand(0, 6), c: COLS[Math.floor(Math.random() * COLS.length)], a: fade ? 0 : 1, dir: 1 });
    }
    function count(side) { var n = 0; for (var i = 0; i < fish.length; i++) if (fish[i].side === side) n++; return n; }
    function update(dt, playing) {
      t += dt;
      if (playing) {
        if (phase === 0 && voiceAt < 0 && (casts >= 2 || A.time() >= 6)) voiceAt = A.time() + 0.6;
        if (phase === 0 && voiceAt >= 0 && A.time() >= voiceAt) {
          phase = 1; voice = 0; A.sfx('ok');
          for (var k = 0; k < 7; k++) addFish('r', true);
        }
        spawnT -= dt;
        if (spawnT <= 0) {
          spawnT = phase ? 0.35 : 2.5;
          if (phase === 0) { if (count('l') + count('r') < 1) addFish(Math.random() < 0.7 ? 'l' : 'r', true); }
          else {
            if (count('r') < (J ? 11 : 13)) addFish('r', true);
            if (count('l') < 1 && Math.random() < 0.3) addFish('l', true);
          }
        }
      }
      if (voice >= 0) { voice += dt; if (voice > 4.2) voice = -1; }
      if (phase === 1) hintT += dt;
      for (var i = 0; i < fish.length; i++) {
        var f = fish[i];
        f.a = Math.min(1, f.a + dt * 1.5);
        f.x += f.vx * dt; f.y += Math.sin(t * 1.6 + f.ph) * 10 * dt;
        if (f.x < f.x0 + f.s * 1.5) { f.x = f.x0 + f.s * 1.5; f.vx = Math.abs(f.vx); }
        if (f.x > f.x1 - f.s * 1.5) { f.x = f.x1 - f.s * 1.5; f.vx = -Math.abs(f.vx); }
        f.dir += clamp((f.vx > 0 ? 1 : -1) - f.dir, -dt * 6, dt * 6);
      }
      if (net) {
        net.t += dt;
        if (net.t >= 0.32 && !net.done) {
          net.done = true; var n = 0;
          for (i = fish.length - 1; i >= 0; i--) {
            f = fish[i];
            var dx = f.x - net.x, dy = f.y - net.y;
            if (dx * dx + dy * dy <= (R + f.s * 0.6) * (R + f.s * 0.6)) { fish.splice(i, 1); flyers.push({ f: f, sx: f.x, sy: f.y, k: 0 }); n++; }
          }
          caught += n; net.n = n;
          if (n > 0) { A.sfx('coin'); A.pop(net.x, net.y - R * 0.4, '+' + n, '#f6de98', 18 + Math.min(n, 5) * 3); A.burst(net.x, net.y, 6 + n * 3, ['#cfe9ff', '#ffffff', '#f6de98']); }
          else { A.pop(net.x, net.y, A.tx('nothing'), '#cfe0ff', 17); }
        }
        if (net.t > 0.7) net = null;
      }
      for (i = flyers.length - 1; i >= 0; i--) { flyers[i].k += dt / 0.6; if (flyers[i].k >= 1) flyers.splice(i, 1); }
    }
    function down(x, y) {
      if (net) return;
      y = Math.max(y, waterY + 16);
      net = { x: x, y: y, t: 0, done: false, n: 0 }; casts++;
    }
    function drawFish(c, f, x, y, sc, a) {
      var s = f.s * sc;
      c.save(); c.globalAlpha = a; c.translate(x, y); c.scale(f.dir < 0 ? -Math.max(0.15, -f.dir) : Math.max(0.15, f.dir), 1);
      var wag = Math.sin(t * 10 + f.ph) * 0.25;
      c.fillStyle = 'rgba(0,10,40,.25)'; c.beginPath(); c.ellipse(2, s * 0.65, s, s * 0.22, 0, 0, 7); c.fill();
      c.fillStyle = f.c; c.globalAlpha = a * 0.85;
      c.beginPath(); c.moveTo(-s * 0.8, 0); c.lineTo(-s * 1.5, -s * 0.55 + wag * s); c.lineTo(-s * 1.35, wag * s * 0.5); c.lineTo(-s * 1.5, s * 0.55 + wag * s); c.closePath(); c.fill();
      c.globalAlpha = a;
      var g = c.createLinearGradient(0, -s * 0.5, 0, s * 0.5); g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, f.c); g.addColorStop(1, '#3b5c9a');
      c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, s, s * 0.52, 0, 0, 7); c.fill();
      c.fillStyle = f.c; c.beginPath(); c.moveTo(-s * 0.3, -s * 0.45); c.quadraticCurveTo(0, -s * 0.95, s * 0.3, -s * 0.45); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(s * 0.55, -s * 0.1, s * 0.15, 0, 7); c.fill();
      c.fillStyle = '#14203f'; c.beginPath(); c.arc(s * 0.59, -s * 0.1, s * 0.08, 0, 7); c.fill();
      c.restore();
    }
    function draw(c) {
      /* dawn sky */
      var sk = c.createLinearGradient(0, 0, 0, waterY);
      sk.addColorStop(0, '#0e1534'); sk.addColorStop(0.55, '#2c3a7a'); sk.addColorStop(1, '#f2b88a');
      c.fillStyle = sk; c.fillRect(0, 0, W, waterY);
      var sg = c.createRadialGradient(W * 0.3, waterY, 0, W * 0.3, waterY, W * 0.5); sg.addColorStop(0, 'rgba(255,225,170,.8)'); sg.addColorStop(1, 'rgba(255,225,170,0)');
      c.fillStyle = sg; c.fillRect(0, 0, W, waterY);
      /* hills + shore */
      c.fillStyle = '#4b3f6e'; c.beginPath(); c.moveTo(0, waterY - 14); c.quadraticCurveTo(W * 0.2, waterY - 46, W * 0.45, waterY - 22); c.quadraticCurveTo(W * 0.7, waterY - 4, W, waterY - 38); c.lineTo(W, waterY); c.lineTo(0, waterY); c.fill();
      c.fillStyle = '#d9b07a'; c.fillRect(0, waterY - 8, W, 9);
      /* Jesus on the shore with a fire of coals */
      var jx = W * 0.8, jh = clamp(H * 0.075, 34, 56), jy = waterY - 6;
      var halo = c.createRadialGradient(jx, jy - jh * 0.6, 0, jx, jy - jh * 0.6, jh * 1.1); halo.addColorStop(0, 'rgba(255,240,190,.75)'); halo.addColorStop(1, 'rgba(255,240,190,0)');
      c.fillStyle = halo; c.beginPath(); c.arc(jx, jy - jh * 0.6, jh * 1.1, 0, 7); c.fill();
      c.fillStyle = '#f6f0e2'; c.beginPath(); c.moveTo(jx - jh * 0.22, jy - jh * 0.72); c.lineTo(jx + jh * 0.22, jy - jh * 0.72); c.lineTo(jx + jh * 0.3, jy); c.lineTo(jx - jh * 0.3, jy); c.closePath(); c.fill();
      c.fillStyle = '#b5523b'; c.beginPath(); c.moveTo(jx + jh * 0.06, jy - jh * 0.72); c.lineTo(jx + jh * 0.2, jy - jh * 0.72); c.lineTo(jx + jh * 0.14, jy); c.lineTo(jx + jh * 0.02, jy); c.closePath(); c.fill();
      c.fillStyle = '#e2b48a'; c.beginPath(); c.arc(jx, jy - jh * 0.84, jh * 0.14, 0, 7); c.fill();
      c.fillStyle = '#5a3a22'; c.beginPath(); c.arc(jx, jy - jh * 0.88, jh * 0.15, Math.PI, 0); c.fill(); c.fillRect(jx - jh * 0.15, jy - jh * 0.88, jh * 0.06, jh * 0.18); c.fillRect(jx + jh * 0.09, jy - jh * 0.88, jh * 0.06, jh * 0.18);
      var fx = jx - jh * 0.75, fl = 1 + Math.sin(t * 12) * 0.12;
      c.fillStyle = '#5a3a22'; c.fillRect(fx - 9, jy - 3, 18, 4);
      c.fillStyle = '#ff9a3c'; c.beginPath(); c.moveTo(fx - 7, jy - 3); c.quadraticCurveTo(fx, jy - 20 * fl, fx + 7, jy - 3); c.fill();
      c.fillStyle = '#ffe07a'; c.beginPath(); c.moveTo(fx - 3, jy - 3); c.quadraticCurveTo(fx, jy - 11 * fl, fx + 3, jy - 3); c.fill();
      /* water */
      var wg = c.createLinearGradient(0, waterY, 0, H);
      wg.addColorStop(0, '#3d6fb0'); wg.addColorStop(0.35, '#1f4a8a'); wg.addColorStop(1, '#0e1f4c');
      c.fillStyle = wg; c.fillRect(0, waterY, W, H - waterY);
      /* golden glow on right side after the call */
      if (phase === 1) {
        var pulse = 0.12 + 0.06 * Math.sin(t * 3);
        var rg = c.createLinearGradient(W / 2, 0, W, 0); rg.addColorStop(0, 'rgba(246,222,152,0)'); rg.addColorStop(1, 'rgba(246,222,152,' + pulse + ')');
        c.fillStyle = rg; c.fillRect(W / 2, waterY, W / 2, H - waterY);
      }
      c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1.5;
      for (var i = 0; i < 14; i++) {
        var yy = waterY + 20 + ((i * 53) % Math.max(1, H - waterY - 20)), xx = ((i * 137 + t * 12 * (i % 2 ? 1 : -1)) % (W + 80)) - 40;
        c.beginPath(); c.moveTo(xx, yy); c.quadraticCurveTo(xx + 15, yy - 4, xx + 30, yy); c.stroke();
      }
      /* dividing line */
      c.save(); c.setLineDash([6, 10]); c.strokeStyle = 'rgba(246,236,212,.18)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(W / 2, waterY + 34); c.lineTo(W / 2, H - 30); c.stroke(); c.restore();
      c.font = '800 14px ' + UI_FONT; c.textBaseline = 'middle';
      c.fillStyle = 'rgba(246,236,212,.45)'; c.textAlign = 'right'; c.fillText('◀ ' + A.tx('left'), W / 2 - 12, H - 16);
      c.fillStyle = phase ? 'rgba(246,222,152,' + (0.7 + 0.3 * Math.sin(t * 4)) + ')' : 'rgba(246,236,212,.45)'; c.textAlign = 'left'; c.fillText(A.tx('right') + ' ▶', W / 2 + 12, H - 16);
      /* fish */
      for (i = 0; i < fish.length; i++) drawFish(c, fish[i], fish[i].x, fish[i].y, 1, fish[i].a * 0.95);
      /* net */
      if (net) {
        var k = net.t < 0.32 ? ease(net.t / 0.32) : 1, lift = net.t > 0.32 ? ease(clamp((net.t - 0.32) / 0.38, 0, 1)) : 0;
        var nr = R * (0.35 + 0.65 * k) * (1 - lift * 0.55), ny = net.y - lift * 40, na = 1 - lift * 0.8;
        c.save(); c.globalAlpha = na;
        c.strokeStyle = 'rgba(246,236,212,.5)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(W / 2, waterY + 6); c.lineTo(net.x, ny - nr); c.stroke();
        c.fillStyle = 'rgba(246,236,212,.08)'; c.beginPath(); c.arc(net.x, ny, nr, 0, 7); c.fill();
        c.save(); c.beginPath(); c.arc(net.x, ny, nr, 0, 7); c.clip();
        c.strokeStyle = 'rgba(246,236,212,.55)'; c.lineWidth = 1.2; c.beginPath();
        var step = Math.max(9, nr / 5);
        for (var d = -nr * 2; d <= nr * 2; d += step) { c.moveTo(net.x + d - nr, ny - nr); c.lineTo(net.x + d + nr, ny + nr); c.moveTo(net.x + d + nr, ny - nr); c.lineTo(net.x + d - nr, ny + nr); }
        c.stroke(); c.restore();
        c.strokeStyle = '#c99358'; c.lineWidth = 3.5; c.beginPath(); c.arc(net.x, ny, nr, 0, 7); c.stroke();
        c.fillStyle = '#e8b94a';
        for (i = 0; i < 8; i++) { var aa = i * Math.PI / 4 + 0.2; c.beginPath(); c.arc(net.x + Math.cos(aa) * nr, ny + Math.sin(aa) * nr, 3.5, 0, 7); c.fill(); }
        c.restore();
      }
      /* caught fish flying into the boat */
      for (i = 0; i < flyers.length; i++) {
        var fl2 = flyers[i], e = ease(fl2.k);
        drawFish(c, fl2.f, lerp(fl2.sx, W / 2, e), lerp(fl2.sy, waterY + 4, e) - Math.sin(e * Math.PI) * 40, 1 - e * 0.5, 1 - clamp((fl2.k - 0.8) * 5, 0, 1));
      }
      /* boat */
      var bx = W / 2, by = waterY + 10, bw = boatW, bh = bw * 0.22;
      c.strokeStyle = '#4a2c12'; c.lineWidth = 3; c.beginPath(); c.moveTo(bx, by - bh * 0.2); c.lineTo(bx, by - bw * 0.5); c.stroke();
      c.fillStyle = '#efe3c6'; c.beginPath(); c.moveTo(bx + 2, by - bw * 0.48); c.quadraticCurveTo(bx + bw * 0.2, by - bw * 0.3, bx + 2, by - bh * 0.5); c.fill();
      var hg = c.createLinearGradient(0, by - bh * 0.3, 0, by + bh); hg.addColorStop(0, '#a76a35'); hg.addColorStop(1, '#5d3616');
      c.fillStyle = hg; c.beginPath(); c.moveTo(bx - bw / 2, by - bh * 0.3); c.lineTo(bx + bw / 2, by - bh * 0.3); c.quadraticCurveTo(bx + bw * 0.4, by + bh, bx + bw * 0.25, by + bh); c.lineTo(bx - bw * 0.25, by + bh); c.quadraticCurveTo(bx - bw * 0.4, by + bh, bx - bw / 2, by - bh * 0.3); c.fill();
      c.fillStyle = '#d4a067'; c.fillRect(bx - bw / 2, by - bh * 0.32, bw, 3);
      /* disciples heads */
      c.fillStyle = '#d9a77c';
      c.beginPath(); c.arc(bx - bw * 0.25, by - bh * 0.55, bh * 0.28, 0, 7); c.arc(bx + bw * 0.24, by - bh * 0.55, bh * 0.28, 0, 7); c.fill();
      c.fillStyle = '#6b3d1f'; c.beginPath(); c.arc(bx - bw * 0.25, by - bh * 0.62, bh * 0.28, Math.PI, 0); c.arc(bx + bw * 0.24, by - bh * 0.62, bh * 0.28, Math.PI, 0); c.fill();
      c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(bx - bw * 0.55, by + bh * 0.95, bw * 1.1, 2);
      /* the voice from the shore */
      if (voice >= 0) {
        var va = Math.min(1, voice * 4) * (voice > 3.8 ? (4.2 - voice) / 0.4 : 1);
        bubble(c, W * 0.72, waterY + 22, Math.min(W * 0.62, 320), A.tx('who') + ':', A.tx('voice'), { bg: 'rgba(246,236,212,.97)', fg: '#1d2b66', who: '#9a6d12', border: '#e8b94a' }, va, jx);
      } else if (phase === 1 && hintT < 9 && !A.reduced) {
        var ax = W * 0.75 + Math.sin(t * 5) * 6, ay = waterY + 54;
        c.fillStyle = 'rgba(246,222,152,.8)'; c.beginPath(); c.moveTo(ax + 14, ay); c.lineTo(ax - 4, ay - 11); c.lineTo(ax - 4, ay + 11); c.fill();
        c.fillRect(ax - 22, ay - 4, 18, 8);
      }
    }
    return {
      duration: 40, max: MAX,
      score: function () { return caught; },
      hud: function () { return '🐟 ' + A.tx('hud') + ' ' + caught; },
      resize: resize, update: update, draw: draw, down: down
    };
  };

  window.MG = { start: start };
})();
