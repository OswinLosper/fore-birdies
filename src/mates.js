// Your mates and crews, matched to the names typed on a round's card.
// Names are compared trimmed and ignoring case, the same way stats matches mates.

export const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

export const mateNamed = (mates, name) => mates.find((m) => sameName(m.name, name)) || null;

// Why a mate can't have this name, or '' if it's free. Stats tells people apart by name, so
// two Lees would count as one. The mate being edited (selfId) can keep its own name.
export function nameTaken(mates, name, you, selfId) {
  if (you && sameName(name, you)) return 'That’s your name. Add something to tell you apart, like ' + name.trim() + ' S.';
  const other = mates.find((m) => m.id !== selfId && sameName(m.name, name));
  return other ? 'You already have a ' + other.name + '. Add something to tell them apart, like ' + name.trim() + ' S.' : '';
}

// Why a round's card can't tee off with these names, or '' if they're all different.
// Two players with the same name would count as one in stats.
export function cardNamesClash(players) {
  const named = players.map((p) => p.trim()).filter(Boolean);
  const twice = named.find((p, i) => named.findLastIndex((x) => sameName(x, p)) !== i);
  return twice ? 'Two players are called ' + twice + '. Add something to tell them apart, like ' + twice + ' S.' : '';
}

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
