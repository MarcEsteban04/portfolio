// Things to find in the 3D office (/desk). Most happen when a visitor clicks
// something; a few only happen if they hang around long enough to see them.
// Labels are written for after they've been found, so they give nothing away
// beforehand (the tracker only shows how many are left).

export const discoveries = [
  { id: "pc", label: "Pulled the plug on the PC" },
  { id: "rage", label: "Made him lose it" },
  { id: "lamp", label: "Flicked the lamp" },
  { id: "wave", label: "Got a wave" },
  { id: "poked", label: "Poked him one too many times" },
  { id: "chair", label: "Took him for a spin" },
  { id: "clock", label: "Set off the alarm" },
  { id: "jolt", label: "Woke him up in the middle of the night" },
  { id: "mug", label: "Made him take a sip" },
  { id: "plant", label: "Watered the plant" },
  { id: "overwater", label: "Overwatered the plant" },
  { id: "speaker", label: "Put some music on" },
  { id: "poster", label: "Knocked the poster crooked" },
  { id: "bed", label: "Touched the freshly made bed" },
  { id: "bear", label: "Met Mr. Bear" },
  { id: "pet", label: "Pet a cat" },
  { id: "bite", label: "Pushed a cat too far" },
  { id: "phone", label: "Sent him a message" },
  { id: "aircon", label: "Switched off the AC" },
  { id: "fridge", label: "Opened the fridge" },
  { id: "book", label: "Pulled a book off the shelf" },
  { id: "board", label: "Read the cork board" },
  { id: "ps5", label: "Switched to the PS5" },
  { id: "mainlight", label: "Flipped the main light" },
  { id: "curtain", label: "Drew the curtains" },
  { id: "laser", label: "Played laser pointer with the cats" },
  { id: "treats", label: "Gave the cats treats" },
  { id: "refill", label: "Saw him go for a coffee refill" },
  { id: "lap", label: "Saw a cat come to his lap" },
  { id: "play", label: "Caught the cats playing" },
  { id: "can", label: "Saw Tilapya knock the can off" },
] as const;

export type Discovery = (typeof discoveries)[number]["id"];

const known = new Set<string>(discoveries.map((entry) => entry.id));

// What a visitor has found so far, read back from storage: unknown or
// repeated ids are dropped, in case the list changes.
export function parseFound(raw: string | null): Discovery[] {
  try {
    const list: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(list)) return [];
    return [...new Set(list)].filter((id): id is Discovery => typeof id === "string" && known.has(id));
  } catch {
    return [];
  }
}
