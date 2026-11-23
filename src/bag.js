// Your golf bag: which clubs you carry and how far you usually hit each one, in metres.
// bag = { driver: { on: true, m: 210 }, ... }. Clubs you never touched aren't in it.

export const CLUBS = [
  ['driver', 'Driver'], ['3w', '3 wood'], ['5w', '5 wood'], ['7w', '7 wood'],
  ['3h', '3 hybrid'], ['4h', '4 hybrid'], ['5h', '5 hybrid'],
  ['4i', '4 iron'], ['5i', '5 iron'], ['6i', '6 iron'], ['7i', '7 iron'], ['8i', '8 iron'], ['9i', '9 iron'],
  ['pw', 'Pitching wedge'], ['gw', 'Gap wedge'], ['sw', 'Sand wedge'], ['lw', 'Lob wedge'],
];
export const CLUB_NAMES = Object.fromEntries(CLUBS);
export const MAX_CLUBS = 14;

// Clubs in the bag with a distance, longest first.
export function hitting(bag) {
  return CLUBS.filter(([k]) => bag?.[k]?.on && bag[k].m > 0)
    .map(([k, name]) => ({ k, name, m: bag[k].m }))
    .sort((a, b) => b.m - a.m);
}

// The club for a distance in metres: the one whose usual distance is closest, and the next one
// on the other side of the distance, to show what else would do. Null with no distances saved.
export function pickClub(bag, metres) {
  const clubs = hitting(bag);
  if (!clubs.length) return null;
  const best = clubs.reduce((a, c) => (Math.abs(c.m - metres) < Math.abs(a.m - metres) ? c : a));
  const i = clubs.indexOf(best);
  const other = best.m > metres ? clubs[i + 1] : clubs[i - 1];
  return {
    club: best,
    other: other || null,
    // Further than the longest club goes, or shorter than the shortest.
    tooFar: metres > clubs[0].m + 10,
    tooShort: metres < clubs[clubs.length - 1].m - 10,
  };
}
