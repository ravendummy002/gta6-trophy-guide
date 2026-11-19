// Trophy data: loads app/data/trophies.json (fetched at run time from the app's
// own files, so it stays out of the first load) and holds the shared lookups:
// kind labels, grade order and points, and the roadmap stages built from the
// official descriptions.
export const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];
export const GRADE_LABELS = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
export const GRADE_POINTS = { platinum: 180, gold: 90, silver: 30, bronze: 15 };

export const KINDS = {
  story: 'Story',
  characters: 'Side characters',
  activities: 'Activities',
  collectibles: 'Collectibles',
  crime: 'Crime & heists',
  money: 'Money',
  hidden: 'Hidden moments',
  meta: 'Platinum & 100%',
};

// The roadmap: stages in the order to earn them, built from the official
// descriptions and the counts PSN tracks. Stage ids are trophy ids.
export const ROADMAP = [
  {
    title: 'Stage 1 — Play the story',
    blurb: 'Finish the campaign first: 12 trophies unlock as you play, and most of the list only opens once Jason and Lucia are both playable in Chapter 2. Keep a manual save at the start of every chapter — the game has no mission replay — and meditate at Lucia\u2019s balcony spot in Chapter 1 before that chapter ends (see Missables).',
    ids: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  },
  {
    title: 'Stage 2 — Strangers & side characters',
    blurb: 'Work through the stranger strands and the five named character strands (Andy, Kenton, Billy, Randy, Tyrone), plus Bret\u2019s hunt. These 7 trophies are all free-roam side content, so clear them while the story is fresh.',
    ids: [22, 23, 24, 25, 26, 27, 29],
  },
  {
    title: 'Stage 3 — Activities & skills',
    blurb: 'The skill trophies: gold medals at all 42 Shooting Range challenges, 250 stunts, 20 race wins, a Top Fun drone race win at every location, the fishing challenge against Cal, one arcade game, 50 challenges — and trying all 9 activity types once.',
    ids: [15, 16, 17, 18, 19, 20, 21, 32],
  },
  {
    title: 'Stage 4 — Collectibles & exploration',
    blurb: 'Sweep the map: meditate at all 18 spots, finish 3 card sets, WAiNK It at 100 locations, discover 100 vehicles and explore all 52 areas of Leonida. One road trip covers several of these at once.',
    ids: [28, 30, 31, 35, 42],
  },
  {
    title: 'Stage 5 — Crime & money',
    blurb: 'The robbery and money trophies: 5 bank vaults, an armored truck, a clean jewelry heist, one illegal operation per gang, partner robberies and the 4-star escape — then launder $250,000 of Marked Bills, spend $100,000, buy all 8 garages and register 10 vehicles.',
    ids: [33, 34, 36, 39, 40, 41, 43, 52, 53, 54, 55],
  },
  {
    title: 'Stage 6 — Hidden moments',
    blurb: 'The 10 hidden one-off trophies: the cocktail on Ocean Beach, the showroom smash, bowling at Kolt & Associates, the VCIA departure, the Rhinos, the melee drive-by and the rest. Several methods are still being confirmed by early guides — each guide below says so where that is the case.',
    ids: [37, 38, 44, 45, 46, 47, 48, 49, 50, 51],
  },
  {
    title: 'Stage 7 — The platinum',
    blurb: 'Reach 100% completion for A Long Road, using the in-game checklist to find the last story missions, robberies, operations, collectibles, races, stunts, challenges and discoveries. The platinum, Vice Got a Price!, pops the moment the 100% trophy does.',
    ids: [14, 1],
  },
];

let cache = null;

export async function loadTrophies() {
  if (cache) return cache;
  const res = await fetch('data/trophies.json');
  if (!res.ok) throw new Error('Could not load data/trophies.json');
  cache = await res.json();
  return cache;
}

export function trophyById(doc, id) {
  return doc.trophies.find((t) => t.id === id);
}

export function gradeRank(grade) {
  return GRADE_ORDER.indexOf(grade);
}

export function trophyPoints(trophy) {
  return GRADE_POINTS[trophy.grade] ?? 0;
}
