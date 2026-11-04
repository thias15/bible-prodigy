import pathlib
d = pathlib.Path(__file__).parent
rd = lambda n: (d / n).read_text()
shell = rd('shell.html')
r3 = ('const R3=(()=>{ try{ return (function(){\nif(window.THREE&&!THREE.GLTFLoader){\n' + rd('vendor/GLTFLoader.js') + '\n' + rd('vendor/SkeletonUtils.js') + '\n}\n' + rd('r3d_lib.js') + '\n' + rd('r3d_scenes.js') + '\n' + rd('r3d.js') +
      '\n})(); }catch(err){ console.error(err); return {ok:false}; } })();\n')
game = rd('game.js').replace('/*__R3D__*/', r3)
import subprocess
if (d / 'lang' / 'pack.js').exists():
    subprocess.run(['node', str(d / 'lang' / 'pack.js')], check=True)
import json as _j
# online-feature text for other languages (lang/<l>/O.json)
for L in ['de','es','el']:
    f = d / 'lang' / L / 'O.json'
    o = d / 'lang' / 'out' / ('online_' + L + '.js')
    (d / 'lang' / 'out').mkdir(exist_ok=True)
    if f.exists(): o.write_text('Object.assign(STR.' + L + ',' + _j.dumps(_j.loads(f.read_text()), ensure_ascii=False) + ');\n')
    elif o.exists(): o.unlink()
    f = d / 'lang' / L / 'X.json'
    o = d / 'lang' / 'out' / ('ext_' + L + '.js')
    if f.exists(): o.write_text('Object.assign(STR.' + L + ',' + _j.dumps(_j.loads(f.read_text()), ensure_ascii=False) + ');\n')
    elif o.exists(): o.unlink()
W2 = ['worlds2.js','worlds3.js','companions.js','quiz_extra.js','worlds4.js','minigames.js','worlds_order.js','lang/out/lang_es.js','lang/out/lang_el.js','online_str.js','lang/out/online_de.js','lang/out/online_es.js','lang/out/online_el.js','ext_str.js','lang/out/ext_de.js','lang/out/ext_es.js','lang/out/ext_el.js']
ONLINE = '\n'.join(rd(f) for f in ['online_net.js','online.js','online_social.js','online_live.js'])
out = shell.replace('/*__DATA__*/', rd('data.js')).replace('/*__I18N__*/', rd('i18n.js')).replace('/*__W2__*/', '\n'.join(rd(f) for f in W2 if (d / f).exists())).replace('/*__GAME__*/', game.replace('/*__EXT__*/', rd('endgame.js') + '\n' + rd('town.js')).replace('/*__ONLINE__*/', ONLINE))
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
FBCONF = (d / 'fb' / 'config.json').read_text().strip()
online_cfg = lambda extra: '<script>window.FBCONF=' + FBCONF + ';window.FBJS="fb.js";' + extra + '</script>\n'
def with_cfg(html, cfg):
    i = html.index('<div id="game">')
    return html[:i] + cfg + html[i:]
(d / 'dist' / 'index.html').write_text(with_cfg(standalone, online_cfg('')))
import shutil
shutil.copy(d / 'fb' / 'fb.js', d / 'dist' / 'fb.js')
# beta test page: same database, separate local storage, no offline cache, assets from the main folder
beta = with_cfg(standalone, online_cfg('window.FBPFX="beta-";'))
beta = beta.replace("'sol.", "'solb.").replace('<head>\n', '<head>\n<base href="../">\n', 1)
beta = beta.replace("<script>if('serviceWorker' in navigator&&location.protocol.startsWith('http'))addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));</script>\n", '')
beta = beta.replace('<title>Scrolls of Light</title>', '<title>Scrolls of Light (beta)</title>', 1)
(d / 'dist' / 'beta').mkdir(exist_ok=True)
(d / 'dist' / 'beta' / 'index.html').write_text(beta)
# automated-test page: talks to the local mock server instead of Firebase
mock = with_cfg(standalone, '<script>window.FBMOCK="http://127.0.0.1:8787";</script>\n').replace("<script>if('serviceWorker' in navigator&&location.protocol.startsWith('http'))addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));</script>\n", '')
(d / 'dist' / 'test.html').write_text(mock)
print('ok', len(out))

# owner dashboard + privacy page
adm = rd('admin.template.html').replace('/*__NET__*/', rd('online_net.js')).replace('/*__STR__*/', rd('online_str.js'))
(d / 'dist' / 'admin.html').write_text(adm.replace('/*__CFG__*/', 'window.FBCONF=' + FBCONF + ';window.FBJS="fb.js";'))
(d / 'dist' / 'admin_test.html').write_text(adm.replace('/*__CFG__*/', 'window.FBMOCK="http://127.0.0.1:8787";'))
shutil.copy(d / 'privacy.html', d / 'dist' / 'privacy.html')
