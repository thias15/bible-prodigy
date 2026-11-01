import pathlib
d = pathlib.Path(__file__).parent
rd = lambda n: (d / n).read_text()
shell = rd('shell.html')
r3 = ('const R3=(()=>{ try{ return (function(){\nif(window.THREE&&!THREE.GLTFLoader){\n' + rd('vendor/GLTFLoader.js') + '\n' + rd('vendor/SkeletonUtils.js') + '\n}\n' + rd('r3d_lib.js') + '\n' + rd('r3d_scenes.js') + '\n' + rd('r3d.js') +
      '\n})(); }catch(err){ console.error(err); return {ok:false}; } })();\n')
game = rd('game.js').replace('/*__R3D__*/', r3)
out = shell.replace('/*__DATA__*/', rd('data.js')).replace('/*__I18N__*/', rd('i18n.js')).replace('/*__W2__*/', '\n'.join(rd(f) for f in ['worlds2.js','worlds3.js','companions.js','quiz_extra.js','minigames.js','worlds_order.js'] if (d / f).exists())).replace('/*__GAME__*/', game)
(d / 'dist').mkdir(exist_ok=True)
# artifact version (no doctype; skeleton added at publish); three.js from cdnjs
(d / 'dist' / 'scrolls-of-light.html').write_text(out.replace("MODEL_FMT='glb'","MODEL_FMT='b64'"))
import base64, json
(d / 'dist' / 'models_b64').mkdir(exist_ok=True)
for f in (d / 'dist' / 'models').glob('*.glb'):
    (d / 'dist' / 'models_b64' / (f.stem + '.json')).write_text(json.dumps({'d': base64.b64encode(f.read_bytes()).decode()}))
# standalone version for GitHub Pages; three.js served from the repo next to index.html
head = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<meta name="description" content="Scrolls of Light: a Bible adventure game for kids 8-15.">\n'
split = out.index('<div id="game">')
standalone = head + out[:split] + '</head>\n<body>\n' + out[split:] + '\n</body>\n</html>\n'
standalone = standalone.replace('html,body{height:100%}', 'html,body{height:100%;margin:0}')
standalone = standalone.replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', 'three.min.js')
import hashlib
ver = hashlib.sha1(standalone.encode()).hexdigest()[:10]
pwa = ('<link rel="manifest" href="manifest.json">\n<meta name="theme-color" content="#1d2b66">\n<link rel="apple-touch-icon" href="apple-touch-icon.png">\n'
       '<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n')
standalone = standalone.replace('<title>Scrolls of Light</title>', '<title>Scrolls of Light</title>\n' + pwa, 1)
standalone = standalone.replace('</body>', "<script>if('serviceWorker' in navigator&&location.protocol.startsWith('http'))addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));</script>\n</body>", 1)
sw = (d / 'sw.template.js').read_text().replace('__VER__', ver)
(d / 'dist' / 'sw.js').write_text(sw)
(d / 'dist' / 'index.html').write_text(standalone)
print('ok', len(out))
