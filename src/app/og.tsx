// The share-image renderer only understands plain img tags.
/* eslint-disable @next/next/no-img-element */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { profile } from "@/lib/profile";
import { siteUrl } from "@/lib/site";

// The share preview every page uses (1200×630, the size Facebook, LinkedIn,
// Messenger, Slack and X all crop well): the page's title and a line about
// it on the left, an optional picture on the right, and who it's by along
// the bottom, on the site's dark background.

export const ogSize = { width: 1200, height: 630 };

const fontDir = join(process.cwd(), "node_modules/geist/dist/fonts/geist-sans");
const fonts = Promise.all(
  (
    [
      ["Geist-Regular.ttf", 400],
      ["Geist-Medium.ttf", 500],
      ["Geist-SemiBold.ttf", 600],
    ] as const
  ).map(async ([file, weight]) => ({
    name: "Geist",
    data: await readFile(join(fontDir, file)),
    weight,
    style: "normal" as const,
  })),
);

// Images in public/ as PNG data URLs (the renderer doesn't read WebP).
export async function publicImage(path: string, width: number) {
  const png = await sharp(join(process.cwd(), "public", path)).resize({ width }).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

export async function ogImage({
  eyebrow,
  title,
  subtitle,
  icon,
  picture,
  accent = "#a1a1aa",
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon?: string;
  picture?: React.ReactNode;
  accent?: string;
}) {
  const avatar = await publicImage("profile.webp", 96);
  const host = new URL(siteUrl).host;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: `radial-gradient(90% 90% at 85% 10%, ${accent}33, transparent 60%), #07080a`,
          color: "#fafafa",
          fontFamily: "Geist",
          padding: 64,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {icon && <img alt="" src={icon} width={56} height={56} style={{ borderRadius: 14 }} />}
            <div style={{ fontSize: 22, letterSpacing: 3, textTransform: "uppercase", color: "#a1a1aa" }}>{eyebrow}</div>
          </div>
          <div style={{ fontSize: picture ? (title.length > 12 ? 60 : 72) : title.length > 26 ? 60 : 76, fontWeight: 600, letterSpacing: -2, lineHeight: 1.05, marginTop: 28 }}>
            {title}
          </div>
          <div style={{ fontSize: 30, color: "#a1a1aa", lineHeight: 1.35, marginTop: 22, maxWidth: picture ? 560 : 980 }}>{subtitle}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: "auto" }}>
            <img alt="" src={avatar} width={56} height={56} style={{ borderRadius: 14 }} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 24, fontWeight: 500 }}>{profile.name}</div>
              <div style={{ fontSize: 20, color: "#71717a" }}>{`${profile.role} · ${host}`}</div>
            </div>
          </div>
        </div>
        {picture && <div style={{ display: "flex", alignItems: "center", marginLeft: 40 }}>{picture}</div>}
      </div>
    ),
    { ...ogSize, fonts: await fonts },
  );
}
