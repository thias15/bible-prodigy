# Scrolls of Light

A browser game for kids ages 8–15, inspired by Prodigy, set in the stories of the Bible.
Explore ten Bible worlds, meet the people of the story, and battle Gloomlings (little shadows
of lies, worry, pride and fear) by answering questions. Every right answer powers your attack.

**Play:** once GitHub Pages is on, the game lives at `https://thias15.github.io/bible-prodigy/`.

## What's in the game

- **18 Bible worlds plus a hub town**, in Bible order: Garden of Eden, Mountains of Ararat,
  Plains of Canaan (Abraham), Joseph's Journey, Land of Egypt, Wilderness of Sinai, Jericho,
  Fields of Ruth, Valley of Elah, Mount Carmel (Elijah), Road to Nineveh (Jonah), Babylon,
  Palace of Susa (Esther), Bethlehem (at night), Sea of Galilee, Jerusalem, Pentecost and
  Paul's Voyage — connected by the Gates of Remembrance in Pilgrim's Rest.
- **A story to finish.** The Shadow of Doubt tore the Scroll of Light into eighteen pieces.
  Each world has a guide (Eve, Noah, Abraham, Joseph, Moses, Ruth, David, Elijah, Jonah,
  Esther, Peter, Paul...), a main quest, a boss, a helper quest and a memory verse.
- **Prodigy-style battles.** Five powers (Faith Strike, Prayer, Hope Shield, Courage Blast,
  Wisdom Wave), streak bonuses, and special bosses — the Walls of Jericho fall after 7 laps
  (7 right answers).
- **Mixed questions:** math (grade 2 to algebra), Bible knowledge (about 200 questions with
  references), memory verses, words (vocabulary and spelling) and puzzles (patterns,
  odd-one-out, books of the Bible).
- **Adapts to the player.** Set an age at the start; the game nudges difficulty up or down
  per subject based on recent answers.
- **Progression:** levels, the Armor of God (Ephesians 6), animal companions that fight
  alongside you, robe dyes, a shop, practice mode and a verse library.
- **For grown-ups (⚙ Settings):** challenge level, subject mix sliders, read-aloud,
  per-subject scores, and a save code to move progress between devices.
- **English and German.** Switch on the title screen or in Settings. Everything is translated:
  story, quests, all Bible questions, menus and math word problems.
- **Original soundtrack** in a modern worship style, generated live in the browser: a theme
  for each world, a battle anthem and a boss theme, plus the public-domain melodies
  *Stille Nacht / Silent Night* (Bethlehem) and *Ode to Joy* ("Joyful, Joyful", the finale).
- **Read-aloud** for questions and dialogue, using the most natural voice on the device,
  with a voice picker and test button in Settings.
- **Variety:** seven hairstyles (including braids, afro and headscarf), three enemy types per
  world (quick, tough, healer), and over 20 animal friends with different abilities.
- **Two ways to see the world.** A 3D view for exploring up close (characters, animals, landmarks
  and battles in 3D) and the 2D map view for a quick overview. Switch any time with the
  View button in the top bar or in Settings (battles can be 3D or 2D separately, and there is
  a "Low detail" option for older devices). Animal friends show as their familiar icons in
  both views; 3D animal models can be turned on in Settings. Without WebGL the game simply uses the 2D map.
- **Your own house** in Pilgrim's Rest: buy furniture from the house menu and place, turn or
  move it. Every finished world adds a treasure (Noah's ark model, David's harp, the manger...).
- **Wardrobe:** hair, skin and robe colors plus props to buy (headband, flower crown, olive
  wreath, shepherd staff, lantern, scroll, satchel, cape, bedroll). The Crown of Life is earned
  at the end of the journey.
- Works with keyboard (arrows/WASD + Space), mouse (click to walk, wheel to zoom) and touch
  (drag anywhere for a joystick, tap to walk or talk, pinch to zoom).

## How saving works

- Progress saves automatically in the browser's local storage, which survives closing
  the tab or restarting the device. It is **not** synced between devices or browsers.
- Up to **4 players** per device, each with their own progress.
- The game asks the browser to keep its storage permanently.
- Settings → **Download backup file** saves a small `.json` file; **Restore from backup file**
  loads it on any device. A copyable save code works too. The game reminds players to
  back up after finishing a gate.
- Saves can be lost if someone clears browsing data or plays in a private window, so backups
  matter. (True cloud saves would need a server and accounts, which this free static version avoids.)

## Hosting on GitHub Pages (free)

1. Push this repository (it already contains `index.html` at the root).
2. On GitHub open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, and save.
4. After a minute the game is live at `https://thias15.github.io/bible-prodigy/`.

No build step, server or accounts needed. `three.min.js` (three.js r128, MIT license) sits next to `index.html` so the 3D view works without any outside server. Netlify, Cloudflare Pages or itch.io (upload `index.html`) also work.

## Editing the game

`index.html` is the playable build. The readable source is in `src/`:

| File | What it holds |
|---|---|
| `src/data.js` | English content: chapters, dialogue, quests, Bible questions, verses, vocabulary, items |
| `src/i18n.js` | Interface text in both languages, plus the German content (merged over the English) |
| `src/worlds2.js` | Worlds 11–18 in both languages, and `ORDER`, the gate sequence |
| `src/game.js` | The engine: map generation, 2D drawing, movement, battles, question generators, menus |
| `src/r3d_lib.js` | 3D models (three.js): people and props, 29 animal friends, Gloomlings and bosses, landmarks, furniture |
| `src/r3d.js` | 3D view: world scenes, 3D battles, the house editor, thumbnails |
| `src/shell.html` | Page layout and styles |
| `src/build.py` | Combines everything into `index.html` |

To add a world, add it to `CH` (and `DE.CH`) in `src/worlds2.js` and put its id into `ORDER`
where it belongs in the story. Existing saves pick up new worlds automatically.

To add Bible questions, append rows to `BQ` in `src/data.js`:
`[chapter (0 = any), difficulty 1–3, question, correct answer, wrong, wrong, wrong, reference]`.
Add the German version at the same position in `BQ_DE` in `src/i18n.js`.
Then run `python3 src/build.py` and copy `src/dist/index.html` to the repo root.

## Bible text

- **English:** World English Bible (public domain), with "Yahweh" shown as "the LORD".
- **German:** short, kid-friendly retellings written for this game and labeled "nach …"
  (e.g. "nach Johannes 3,16"). They are not an official translation. Translations such as
  *Hoffnung für alle* are copyrighted and can't be republished here, so families can look up
  each reference in their own Bible.
- Music contains no copyrighted songs.
