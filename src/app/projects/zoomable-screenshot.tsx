"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { ProjectScreenshot } from "@/app/projects/project-parts";
import type { Project, Screenshot } from "@/lib/projects";

// A screenshot that opens enlarged in a modal <dialog>, which gives us Escape to close,
// the top layer and inert page content for free.
export function ZoomableScreenshot({
  project,
  shot,
  sizes,
}: {
  project: Pick<Project, "framed" | "screenshotSize">;
  shot: Screenshot;
  sizes: string;
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const captionId = useId();
  const { width, height } = project.screenshotSize;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-label={`Enlarge screenshot: ${shot.alt}`}
        onClick={() => {
          setOpen(true);
          dialogRef.current?.showModal();
        }}
        className="block w-full cursor-zoom-in rounded-[1.25rem] transition-transform duration-300 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        <ProjectScreenshot project={project} shot={shot} sizes={sizes} />
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={captionId}
        onClose={() => {
          setOpen(false);
          triggerRef.current?.focus();
        }}
        onClick={(event) => {
          // Anything outside the image and its caption counts as the backdrop.
          if (!(event.target as Element).closest("img, figcaption")) {
            dialogRef.current?.close();
          }
        }}
        className="m-0 h-dvh max-h-none w-screen max-w-none cursor-zoom-out border-0 bg-transparent p-0 text-foreground backdrop:bg-black/85 backdrop:backdrop-blur-sm"
      >
        {open && (
          <figure className="flex h-full flex-col items-center justify-center px-4 py-16 sm:px-8">
            <Image
              src={shot.src}
              alt={shot.alt}
              width={width}
              height={height}
              sizes="100vw"
              // Fit inside the viewport, leaving room for the caption and close button.
              style={{
                width: `min(100%, calc((100dvh - 10rem) * ${width} / ${height}))`,
              }}
              className={
                project.framed
                  ? "h-auto cursor-default"
                  : "h-auto cursor-default rounded-[1.25rem] ring-1 ring-white/10"
              }
            />
            <figcaption
              id={captionId}
              className="mt-4 max-w-2xl cursor-default text-center text-sm leading-relaxed text-zinc-300"
            >
              {shot.caption}
            </figcaption>
          </figure>
        )}
        <button
          type="button"
          autoFocus
          aria-label="Close"
          onClick={() => dialogRef.current?.close()}
          className="fixed top-4 right-4 inline-flex size-10 items-center justify-center rounded-full border border-white/15 bg-black/60 text-lg text-zinc-200 transition-colors hover:border-white/40 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:top-6 sm:right-6"
        >
          <span aria-hidden>✕</span>
        </button>
      </dialog>
    </>
  );
}
