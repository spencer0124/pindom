import { ticketRepository } from '@/lib/repositories';

/**
 * The places this user has already verified.
 *
 * Not a field on `Place` — a place is the same document for everyone, and
 * whether *you* have stood there is a fact about your tickets. A ticket only
 * exists as the outcome of an accepted verification (see the trust boundary in
 * docs/explanation/architecture.md), so the set of place ids across your
 * tickets is exactly the set of places you have proven you visited.
 *
 * 보관함 tickets count. `listVault` returns the same user's private tickets, and
 * visibility decides who can see the photo, not whether the visit happened.
 *
 * A failure resolves to an empty set rather than propagating: not knowing which
 * pins are verified degrades 지도 from "coloured pins" to "uncoloured pins",
 * which is worth far less than failing the screen.
 */
export async function readVisitedPlaceIds(): Promise<string[]> {
  const [mine, vault] = await Promise.all([
    ticketRepository.listMine(),
    ticketRepository.listVault(),
  ]);

  const ids = new Set<string>();
  if (mine.ok) mine.data.forEach((t) => ids.add(t.placeId));
  if (vault.ok) vault.data.forEach((t) => ids.add(t.placeId));
  return [...ids];
}
