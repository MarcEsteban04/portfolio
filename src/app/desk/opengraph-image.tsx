import { ogImage, ogSize } from "@/app/og";

export const alt = "Marc's 3D office";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage({
    eyebrow: "Live from my desk",
    title: "Step into my office.",
    subtitle: "A 3D room that follows my day in Philippine time: coding, coffee, gaming and sleep, two cats, and plenty to click.",
    accent: "#ff00aa",
  });
}
