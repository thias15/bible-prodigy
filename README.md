# Scrolls of Light

A browser game for kids ages 8–15, inspired by Prodigy, set in the stories of the Bible.
Explore 22 Bible worlds, meet the people of the story, and battle Gloomlings (little shadows
of lies, worry, pride and fear) by answering questions. Every right answer powers your attack.

**Play:** once GitHub Pages is on, the game lives at `https://thias15.github.io/bible-prodigy/`.

## What's in the game

- **22 Bible worlds plus a hub town**, in Bible order: Garden of Eden, Mountains of Ararat,
  Plains of Canaan (Abraham), Joseph's Journey, Land of Egypt, Wilderness of Sinai, Jericho,
  Oak of Ophrah (Gideon), Hills of Zorah (Samson), Fields of Ruth, Valley of Elah,
  Mount Carmel (Elijah), Road to Nineveh (Jonah), Babylon, Palace of Susa (Esther),
  Walls of Jerusalem (Nehemiah), Bethlehem (at night), Sea of Galilee, Road of Parables,
  Jerusalem, Pentecost and Paul's Voyage — connected by the Gates of Remembrance in Pilgrim's Rest.
- **A story to finish.** The Shadow of Doubt tore the Scroll of Light into twenty-two pieces.
  Each world has a guide (Eve, Noah, Abraham, Joseph, Moses, Gideon, Ruth, David, Elijah,
  Jonah, Esther, Nehemiah, Peter, Paul...), a main quest, a boss, a helper quest and a memory verse.
  Every guide asks you a story choice ("Stay with Naomi or go home?") and tells you what
  really happened.
- **Prodigy-style battles.** Five powers (Faith Strike, Prayer, Hope Shield, Courage Blast,
  Wisdom Wave) and streak bonuses. Gloomlings show what they will do next (⚡ charging means
  a big hit is coming, so raise the Hope Shield). Every boss has its own mechanic from its
  story: build the ark plank by plank, bring the plagues, break the golden calf, march around
  Jericho seven times, sling a stone at Goliath with a streak, call down fire on Mount Carmel,
  calm the storm, rebuild Jerusalem's wall, find the lost sheep, coin and son, pray until
  Paul's chains fall off, and more.
- **Keeps going after the story:** daily and weekly challenges, champion rematches of every
  boss with rare rewards, animal friends that grow stronger (★ at level 4, ★★ at level 8,
  with special moves), and a Book of Discoveries to fill.
- **Mixed questions, no typing needed:** math (grade 2 to algebra) and Bible story math
  puzzles, Bible knowledge (about 250 questions with references), "Who said it?", "Where did
  this happen?" on a map of Bible lands, putting story events in order, memory verses, words
  (vocabulary and spelling) and puzzles (patterns, odd-one-out, books of the Bible).
- **Mini-games** at signposts in four worlds (also in the Scribe's list): gather manna,
  lead the animals into the ark, rebuild Nehemiah's wall, and fish on the Sea of Galilee.
- **Real learning, not just random questions.** Missed questions come back later (spaced
  repetition: a few minutes, then 1, 3, 7 and 21 days). Memory verses are learned in steps:
  fill one word, name the book, finish the verse, then name the reference. The game nudges
  difficulty per subject, and grown-ups get a weekly report in Settings.
- **Junior (8–10) or Explorer (11–15) play style:** three answer choices and gentler foes,
  or four choices, tougher bosses and a bonus for quick answers.
- **Accessibility:** large text, an easy-read font (Lexend), ✓/✗ marks on answers so color
  isn't needed, read-aloud, and reduced motion.
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
  world (quick, tough, healer), and about 40 animal friends with different abilities.
  The animal shop opens up as you go: cheap friends at the start, rarer ones after more
  finished worlds, and some (owl, bee, turtle...) only as world rewards.
- **Two ways to see the world.** A 3D view for exploring up close (characters, animals, landmarks
  and battles in 3D) and the 2D map view for a quick overview. Switch any time with the
  View button in the top bar or in Settings (battles can be 3D or 2D separately, and there is
  a "Low detail" option for older devices). Animal friends show as their familiar icons in
  both views; 3D animal models can be turned on in Settings. Each world has its own little
  scene (animals walking to the ark, shepherds and an angel at Bethlehem, fishing boats on
  Galilee, a crowd with palm branches in Jerusalem), and beating a boss plays a short scene. Without WebGL the game simply uses the 2D map.
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

No build step, server or accounts needed. On GitHub Pages the game can be installed like an app (Add to Home Screen) and keeps working offline. `three.min.js` (three.js r128, MIT license) sits next to `index.html` so the 3D view works without any outside server. Netlify, Cloudflare Pages or itch.io (upload `index.html`) also work.

## Editing the game

`index.html` is the playable build. The readable source is in `src/`:

| File | What it holds |
|---|---|
| `src/data.js` | English content: chapters, dialogue, quests, Bible questions, verses, vocabulary, items |
| `src/i18n.js` | Interface text in both languages, plus the German content (merged over the English) |
| `src/worlds2.js` | Worlds 11–18 in both languages |
| `src/worlds3.js` | Worlds 19–22 (Gideon, Samson, Nehemiah, Parables) in both languages |
| `src/worlds_order.js` | `ORDER`, the gate sequence |
| `src/quiz_extra.js` | Order, who-said-it, map and story-math questions; story choices; map places |
| `src/companions.js` | Extra animal friends and the shop prices and unlock levels |
| `src/minigames.js` | The four mini-games |
| `src/game.js` | The engine: map generation, 2D drawing, movement, battles, question generators, menus |
| `src/r3d_lib.js` | 3D models (three.js): people and props, 29 animal friends, Gloomlings and bosses, landmarks, furniture |
| `src/r3d.js` | 3D view: world scenes, 3D battles, the house editor, thumbnails |
| `src/shell.html` | Page layout and styles |
| `src/build.py` | Combines everything into `index.html` |

To add a world, add it to `CH` (and `DE.CH`) in `src/worlds3.js` and put its id into `ORDER` in `src/worlds_order.js`
where it belongs in the story. Existing saves pick up new worlds automatically.

To add Bible questions, append rows to `BQ` in `src/data.js`:
`[chapter (0 = any), difficulty 1–3, question, correct answer, wrong, wrong, wrong, reference]`.
Add the German version at the same position in `BQ_DE` in `src/i18n.js`.
Then run `python3 src/build.py` and copy `src/dist/index.html` and `src/dist/sw.js` to the repo root (the icons, `manifest.json`, `three.min.js` and `models/` only change rarely).

## Bible text

- **English:** World English Bible (public domain), with "Yahweh" shown as "the LORD".
- **German:** short, kid-friendly retellings written for this game and labeled "nach …"
  (e.g. "nach Johannes 3,16"). They are not an official translation. Translations such as
  *Hoffnung für alle* are copyrighted and can't be republished here, so families can look up
  each reference in their own Bible.
- Music contains no copyrighted songs.

## Credits

- 3D animals (cow, ox, deer, horse, fox, frog, donkey, wolf, dog, snake, boat): [Quaternius](https://quaternius.com), CC0.
- [three.js](https://threejs.org) r128, MIT license.
