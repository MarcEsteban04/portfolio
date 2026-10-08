// The share-image renderer only understands plain img tags.
/* eslint-disable @next/next/no-img-element */
import { ogImage, ogSize, publicImage } from "@/app/og";
import { getProject, projects } from "@/lib/projects";

export const alt = "Project case study";
export const size = ogSize;
export const contentType = "image/png";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

// Each project's colour, as on its card.
const accents: Record<string, string> = {
  obsidian: "#8b5cf6",
  velora: "#f97316",
  shipwright: "#818cf8",
  vanderlyn: "#c7a46b",
};

// A case study's preview: its icon, name and tagline, beside its screens
// (two phones side by side, or one browser window).
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug)!;
  const portrait = project.screenshotSize.height > project.screenshotSize.width;
  const shots = await Promise.all(
    project.screenshots.slice(0, portrait ? 2 : 1).map((shot) => publicImage(shot.src.slice(1), portrait ? 240 : 620)),
  );
  const picture = portrait ? (
    <div style={{ display: "flex", gap: 18 }}>
      {shots.map((src, i) => (
        <img
          alt=""
          key={src}
          src={src}
          width={190}
          height={Math.round((190 * project.screenshotSize.height) / project.screenshotSize.width)}
          style={{ borderRadius: 22, marginTop: i ? 40 : 0 }}
        />
      ))}
    </div>
  ) : (
    <img
      alt=""
      src={shots[0]}
      width={540}
      height={Math.round((540 * project.screenshotSize.height) / project.screenshotSize.width)}
      style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)" }}
    />
  );
  return ogImage({
    eyebrow: project.organization ? `Work · ${project.organization}` : `${project.platform} · ${project.year}`,
    title: project.name,
    subtitle: project.tagline,
    icon: await publicImage(project.icon.slice(1), 112),
    picture,
    accent: accents[slug],
  });
}
