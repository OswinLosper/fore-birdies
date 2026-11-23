// Your mates and crews, matched to the names typed on a round's card.
// Names are compared trimmed and ignoring case, the same way stats matches mates.

export const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

export const mateNamed = (mates, name) => mates.find((m) => sameName(m.name, name)) || null;

// The crew's members as mates, in the crew's order, skipping any that were removed.
export const crewMates = (crew, mates) => crew.members.map((id) => mates.find((m) => m.id === id)).filter(Boolean);

// "AB" for a crew's badge.
export const initials = (name) => name.trim().split(/[\s-]+/).map((w) => w[0] || '').join('').slice(0, 2).toUpperCase();

// Players on a round you started who aren't you and aren't one of your mates yet.
export function strangers(round, mates, user) {
  const seen = new Set();
  return round.players.map((name, p) => ({ p, name: name.trim(), hcp: round.hcps?.[p] || 0 }))
    .filter((x) => {
      const key = x.name.toLowerCase();
      if (!x.name || seen.has(key) || sameName(x.name, user.name) || round.claims[user.uid] === x.p || mateNamed(mates, x.name)) return false;
      seen.add(key);
      return true;
    });
}
