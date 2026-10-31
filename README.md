# Scrolls of Light

A browser game for kids ages 8–15, inspired by Prodigy, set in the stories of the Bible.
Explore ten Bible worlds, meet the people of the story, and battle Gloomlings (little shadows
of lies, worry, pride and fear) by answering questions. Every right answer powers your attack.

**Play:** once GitHub Pages is on, the game lives at `https://thias15.github.io/bible-prodigy/`.

## What's in the game

- **Ten chapters plus a hub town.** Garden of Eden, Mountains of Ararat, Egypt, Sinai,
  Jericho, Valley of Elah, Babylon, Bethlehem (at night), Sea of Galilee and Jerusalem,
  connected by the Gates of Remembrance in Pilgrim's Rest.
- **A story to finish.** The Shadow of Doubt tore the Scroll of Light into ten pieces.
  Each chapter has a guide (Eve, Noah, Moses, Joshua, David, Daniel, Peter...), a main quest,
  a boss, a helper side quest and a memory verse. It ends with the empty tomb.
- **Prodigy-style battles.** Five powers (Faith Strike, Prayer, Hope Shield, Courage Blast,
  Wisdom Wave), streak bonuses, and special bosses — the Walls of Jericho fall after 7 laps
  (7 right answers).
- **Mixed questions:** math (grade 2 to algebra), Bible knowledge (about 140 questions with
  references), memory verses (KJV), words (vocabulary and spelling) and puzzles (patterns,
  odd-one-out, books of the Bible).
- **Adapts to the player.** Set an age at the start; the game nudges difficulty up or down
  per subject based on recent answers.
- **Progression:** levels, the Armor of God (Ephesians 6), animal companions that fight
  alongside you, robe dyes, a shop, practice mode and a verse library.
- **For grown-ups (⚙ Settings):** challenge level, subject mix sliders, read-aloud,
  per-subject scores, and a save code to move progress between devices.
- Works with keyboard (arrows/WASD + Space), mouse (click to walk) and touch (tap or D-pad).
  Progress saves automatically in the browser.

## Hosting on GitHub Pages (free)

1. Push this repository (it already contains `index.html` at the root).
2. On GitHub open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, and save.
4. After a minute the game is live at `https://thias15.github.io/bible-prodigy/`.

No build step, server or accounts needed. Netlify, Cloudflare Pages or itch.io (upload `index.html`) also work.

## Editing the game

`index.html` is the playable build. The readable source is in `src/`:

| File | What it holds |
|---|---|
| `src/data.js` | All content: chapters, dialogue, quests, Bible questions, verses, vocabulary, items |
| `src/game.js` | The engine: map generation, drawing, movement, battles, question generators, menus |
| `src/shell.html` | Page layout and styles |
| `src/build.py` | Combines the three into `index.html` |

To add Bible questions, append rows to `BQ` in `src/data.js`:
`[chapter (0 = any), difficulty 1–3, question, correct answer, wrong, wrong, wrong, reference]`.
Then run `python3 src/build.py` and copy `src/dist/index.html` to the repo root.

Scripture quotations are from the King James Version (public domain).
