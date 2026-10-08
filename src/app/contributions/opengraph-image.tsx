import { ogImage, ogSize } from "@/app/og";

export const alt = "Marc's GitHub contributions";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return ogImage({
    eyebrow: "GitHub · @MarcEsteban04",
    title: "A year of contributions.",
    subtitle: "The full calendar, streaks, busiest days and the repositories behind them.",
    accent: "#22c55e",
  });
}
