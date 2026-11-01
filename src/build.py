import pathlib
d = pathlib.Path(__file__).parent
rd = lambda n: (d / n).read_text()
shell = rd('shell.html')
r3 = ('const R3=(()=>{ try{ return (function(){\n' + rd('r3d_lib.js') + '\n' + rd('r3d.js') +
      '\n})(); }catch(err){ console.error(err); return {ok:false}; } })();\n')
game = rd('game.js').replace('/*__R3D__*/', r3)
out = shell.replace('/*__DATA__*/', rd('data.js')).replace('/*__I18N__*/', rd('i18n.js')).replace('/*__W2__*/', rd('worlds2.js')).replace('/*__GAME__*/', game)
(d / 'dist').mkdir(exist_ok=True)
# artifact version (no doctype; skeleton added at publish); three.js from cdnjs
(d / 'dist' / 'scrolls-of-light.html').write_text(out)
# standalone version for GitHub Pages; three.js served from the repo next to index.html
head = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<meta name="description" content="Scrolls of Light: a Bible adventure game for kids 8-15.">\n'
split = out.index('<div id="game">')
standalone = head + out[:split] + '</head>\n<body>\n' + out[split:] + '\n</body>\n</html>\n'
standalone = standalone.replace('html,body{height:100%}', 'html,body{height:100%;margin:0}')
standalone = standalone.replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', 'three.min.js')
(d / 'dist' / 'index.html').write_text(standalone)
print('ok', len(out))
