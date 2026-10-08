// The share-image renderer only understands plain img tags.
/* eslint-disable @next/next/no-img-element */
import { ogImage, ogSize, publicImage } from "@/app/og";
import { profile } from "@/lib/profile";

export const alt = `${profile.name}, ${profile.role}`;
export const size = ogSize;
export const contentType = "image/png";

// The overview's preview: name, role, and the portrait from the lanyard.
export default async function Image() {
  const portrait = await publicImage("profile.webp", 400);
  return ogImage({
    eyebrow: "Available for freelance work",
    title: profile.name,
    subtitle: "Full-stack developer in Bulacan, Philippines, building web apps, business systems, Flutter apps and AI features.",
    picture: (
      <img
        alt=""
        src={portrait}
        width={380}
        height={475}
        style={{ borderRadius: 28, border: "1px solid rgba(255,255,255,0.12)", objectFit: "cover" }}
      />
    ),
    accent: "#10b981",
  });
}
