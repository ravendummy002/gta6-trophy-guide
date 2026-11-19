# gta6-trophy-guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/ravendummy002/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/ravendummy002/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Leonida Trophy Atlas — an offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI. Every trophy with its official name, description and grade; a checklist saved in the browser with export and import; filters by kind and grade; a spoiler setting that hides the 28 hidden trophies until earned; a roadmap to the platinum; the one missable trophy flagged; and a guide to each trophy in our own words that cites its sources. No Rockstar logo or official artwork — the look is our own.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. The guide works with the network off: it fetches only its own `app/data/trophies.json` and makes no other request.

To build the submission output:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## How it is built

- `app/index.html` — the shell: progress card, tabs, filters, checklist and guide pane.
- `app/style.css` — the look: a deep-indigo night theme with a trophy-gold accent, system fonts only.
- `app/js/main.js` — boot and wiring; `app/js/data.js` — trophy loading, kinds and roadmap stages; `app/js/store.js` — saved progress, export and import; `app/js/filters.js` — search, kind/grade filters and the spoiler rule; `app/js/views.js` — checklist, guide detail, roadmap, missables and about pages.
- `app/data/trophies.json` — the official 55 trophies (verified 2026-11-19 against Exophase and PSNProfiles), each with a guide in our own words and cited sources.
- `screenshots/` — 4 real renders of the guide in headless Chromium (see `shots.json`).
- `main.ts` — hands the guide in: copies `app/` and `screenshots/` to `/output` and writes `dossier.json` with the vendored make.fun library.

---

<sub>Entered on [make.fun](https://make.fun/?ref=r16q3s2q&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
