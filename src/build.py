import pathlib
d = pathlib.Path(__file__).parent
shell = (d / 'shell.html').read_text()
out = shell.replace('/*__DATA__*/', (d / 'data.js').read_text()).replace('/*__I18N__*/', (d / 'i18n.js').read_text()).replace('/*__GAME__*/', (d / 'game.js').read_text())
(d / 'dist').mkdir(exist_ok=True)
# artifact version (no doctype; skeleton added at publish)
(d / 'dist' / 'scrolls-of-light.html').write_text(out)
# standalone version for GitHub Pages
head = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<meta name="description" content="Scrolls of Light: a Bible adventure game for kids 8-15.">\n'
split = out.index('<div id="game">')
standalone = head + out[:split] + '</head>\n<body>\n' + out[split:] + '\n</body>\n</html>\n'
standalone = standalone.replace('html,body{height:100%}', 'html,body{height:100%;margin:0}')
(d / 'dist' / 'index.html').write_text(standalone)
print('ok', len(out))
