import Image from "next/image";
import type { Project, Screenshot } from "@/lib/projects";

export function ProjectScreenshot({
  project,
  shot,
  sizes,
}: {
  project: Project;
  shot: Screenshot;
  sizes: string;
}) {
  return (
    <Image
      src={shot.src}
      alt={shot.alt}
      width={project.screenshotSize.width}
      height={project.screenshotSize.height}
      sizes={sizes}
      className={
        project.framed
          ? "h-auto w-full"
          : "h-auto w-full rounded-[1.25rem] ring-1 ring-white/10"
      }
    />
  );
}

export function RepoLink({ project }: { project: Project }) {
  if (project.repo.visibility === "private") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 font-mono text-xs text-zinc-400">
        <span aria-hidden className="size-1.5 rounded-full bg-zinc-500" />
        Private repository
      </span>
    );
  }

  return (
    <a
      href={project.repo.url}
      target="_blank"
      rel="noreferrer"
      className="group inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
    >
      Source on GitHub
      <span
        aria-hidden
        className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
      >
        ↗
      </span>
    </a>
  );
}
