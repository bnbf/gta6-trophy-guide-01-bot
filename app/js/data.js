// Loads the official trophy list (app/data/trophies.json) and names the
// roadmap stages. The list itself is the source of truth: names,
// descriptions and grades are PlayStation's, as Exophase and PSNProfiles
// published them; kind, missable and stage are this guide's reading of
// those descriptions.
export const SOURCE_URLS_FALLBACK = {
  exophase: 'https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/',
  psnprofiles: 'https://psnprofiles.com/trophies/43531-grand-theft-auto-vi',
};

export const STAGES = [
  { n: 1, title: 'Play the story', blurb: 'Chapters 1–4, the opening mission and the final mission, plus the named story missions. Every one of these is automatic — finish the mission and the trophy pops. Nothing to grind here, just play.' },
  { n: 2, title: 'Missable moments — do them when they come', blurb: 'Seven trophies whose descriptions read like one-time moments. Each guide says why it is flagged and what is still unconfirmed. Take the moment when the game offers it; it may not come back.' },
  { n: 3, title: 'Strangers & side missions', blurb: 'The stranger strands across Leonida: eight complete strands, the final missions for Andy, Kenton, Billy, Randy and Tyrone, and Bret’s hunt. Follow the “?” markers and finish each strand to its end.' },
  { n: 4, title: 'Activities & skills', blurb: 'The things you do between missions: the shooting range, stunts, races, fishing, the arcade, bowling and meditation. Most of these climb on their own while you play; the range and the races are worth doing deliberately.' },
  { n: 5, title: 'Collectibles & the world', blurb: 'Cards, WAiNK It spots, vehicles, areas, garages, vaults and gang operations. The long sweeps — best done after the story, map area by area, with the counters in this guide as your checklist.' },
  { n: 6, title: 'Money, cleanup & 100%', blurb: 'The last grinds: 50 challenges, laundering $250,000 of Marked Bills, spending $100,000 — then A Long Road, 100% completion, and the platinum itself.' },
];

export const KIND_LABELS = {
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
};

export async function loadTrophies() {
  const res = await fetch('data/trophies.json');
  if (!res.ok) throw new Error('could not load data/trophies.json');
  const doc = await res.json();
  return doc;
}

export function trophyById(doc, id) {
  return doc.trophies.find((t) => t.id === id);
}

export function nextUp(doc, earned) {
  const open = doc.trophies.filter((t) => !earned.has(t.name));
  open.sort((a, b) => (a.stage - b.stage) || (a.id - b.id));
  return open[0] ?? null;
}
