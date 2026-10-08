import { ogImage, ogSize } from "@/app/og";

export const alt = "Marc's setup";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage({
    eyebrow: "Uses",
    title: "My setup.",
    subtitle: "Ryzen 5 5600 and RX 6600, a 300Hz main monitor beside a 100Hz second one, and the tools I build with.",
    accent: "#38bdf8",
  });
}
