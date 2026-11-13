/** Lower-case and strip accents so "Matemática" matches "matematica". */
export function normalize(text: string) {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/**
 * True when every word of the query appears somewhere in the fields
 * (order-independent), e.g. "osn smp friday" matches "OSN Matematika SMP (Friday)".
 */
export function matchesQuery(fields: (string | null | undefined)[], query: string) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = normalize(fields.filter(Boolean).join(" "));
  return words.every((w) => haystack.includes(w));
}
