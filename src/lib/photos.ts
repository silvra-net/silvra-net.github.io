/**
 * Photographs, by slot.
 *
 * A slot is filled by dropping `<slot>.webp` into src/assets/photos/ and adding its credit to
 * credits.json beside it — no code change. An empty slot renders the page's own dark gradient
 * instead, so a missing photo is a quieter page, never a broken one.
 */
import credits from "../assets/photos/credits.json";

export type Slot = "work" | "europe" | "helix" | "mission" | "contact";

export interface Credit {
  author: string;
  url: string;
}

const files = import.meta.glob<string>("../assets/photos/*.{webp,jpg,jpeg,png}", {
  eager: true,
  import: "default",
});

const bySlot = new Map<string, string>();
for (const [path, url] of Object.entries(files)) {
  const name = path.split("/").pop()!.replace(/\.[^.]+$/, "");
  bySlot.set(name, url);
}

export function photoSrc(slot: Slot): string | undefined {
  return bySlot.get(slot);
}

/** Every photograph actually in use, with whoever took it — for the legal notice. */
export function photoCredits(): { slot: string; credit: Credit }[] {
  const all = credits as Record<string, Credit>;
  return Object.entries(all)
    .filter(([slot]) => bySlot.has(slot))
    .map(([slot, credit]) => ({ slot, credit }));
}
