import {
  siAstro,
  siBootstrap,
  siClaude,
  siCss,
  siCursor,
  siExpress,
  siFlutter,
  siGooglegemini,
  siHtml5,
  siJavascript,
  siJsonwebtokens,
  siMongodb,
  siMysql,
  siNextdotjs,
  siNodedotjs,
  siPhp,
  siReact,
  siSqlite,
  siSupabase,
  siTailwindcss,
  siThreedotjs,
  siTypescript,
  siVercel,
  type SimpleIcon,
} from "simple-icons";
import { Icon, type IconName } from "@/app/ui/icons";

// OpenAI's mark (for OpenAI and Codex), which simple-icons no longer carries.
const openai = {
  hex: "000000",
  path: "M22.28 9.82a5.98 5.98 0 0 0-.52-4.91 6.05 6.05 0 0 0-6.51-2.9A6.07 6.07 0 0 0 4.98 4.18a5.98 5.98 0 0 0-4 2.9 6.05 6.05 0 0 0 .74 7.1 5.98 5.98 0 0 0 .51 4.91 6.05 6.05 0 0 0 6.52 2.9A5.98 5.98 0 0 0 13.26 24a6.06 6.06 0 0 0 5.77-4.21 5.99 5.99 0 0 0 4-2.9 6.06 6.06 0 0 0-.75-7.07zm-9.02 12.61a4.48 4.48 0 0 1-2.88-1.04l.14-.08 4.78-2.76a.79.79 0 0 0 .39-.68v-6.74l2.02 1.17a.07.07 0 0 1 .04.05v5.58a4.5 4.5 0 0 1-4.49 4.5zm-9.66-4.13a4.47 4.47 0 0 1-.53-3.01l.14.09 4.78 2.76a.77.77 0 0 0 .78 0l5.84-3.37v2.33a.08.08 0 0 1-.03.06L9.74 19.95a4.5 4.5 0 0 1-6.14-1.65zM2.34 7.9a4.49 4.49 0 0 1 2.37-1.98v5.68a.77.77 0 0 0 .39.68l5.81 3.35-2.02 1.17a.08.08 0 0 1-.07 0l-4.83-2.79A4.5 4.5 0 0 1 2.34 7.87zm16.6 3.86L13.1 8.36l2.02-1.16a.08.08 0 0 1 .07 0l4.83 2.79a4.49 4.49 0 0 1-.68 8.1v-5.68a.79.79 0 0 0-.4-.67zm2.01-3.03l-.14-.09-4.77-2.78a.78.78 0 0 0-.79 0L9.41 9.23V6.9a.07.07 0 0 1 .03-.06l4.83-2.79a4.5 4.5 0 0 1 6.68 4.66zM8.31 12.86l-2.02-1.16a.08.08 0 0 1-.04-.06V6.07a4.5 4.5 0 0 1 7.38-3.45l-.14.08L8.7 5.46a.79.79 0 0 0-.39.68zm1.1-2.37l2.6-1.5 2.61 1.5v3l-2.6 1.5-2.61-1.5z",
};

// Groq's "g" mark, in its orange; simple-icons doesn't carry it either.
const groq = {
  hex: "F55036",
  path: "M12.04 2C8.18 1.97 5.04 5 5 8.78c-.04 3.78 3.06 6.87 6.91 6.91h2.42v-2.57h-2.29c-2.41.03-4.38-1.87-4.41-4.23-.03-2.36 1.9-4.3 4.31-4.33h.1c2.41 0 4.36 1.92 4.37 4.28v6.31c0 2.34-1.95 4.25-4.33 4.28a4.38 4.38 0 0 1-3.03-1.25l-1.85 1.82A7 7 0 0 0 12.03 22h.09c3.8-.06 6.86-3.08 6.88-6.82v-6.5C18.91 4.96 15.82 2 12.04 2z",
};

type Mark = Pick<SimpleIcon, "hex" | "path">;

// Each skill's own logo, or a plain line icon for the ones that aren't a
// product (APIs, SEO and so on).
const logos: Record<string, Mark | IconName> = {
  HTML: siHtml5,
  CSS: siCss,
  JavaScript: siJavascript,
  TypeScript: siTypescript,
  React: siReact,
  "Next.js": siNextdotjs,
  Astro: siAstro,
  "Three.js": siThreedotjs,
  "Tailwind CSS": siTailwindcss,
  Bootstrap: siBootstrap,
  Flutter: siFlutter,
  "Node.js": siNodedotjs,
  Express: siExpress,
  PHP: siPhp,
  "RESTful APIs": "server",
  "JWT Authentication": siJsonwebtokens,
  MySQL: siMysql,
  MongoDB: siMongodb,
  Supabase: siSupabase,
  SQLite: siSqlite,
  LLMs: "sparkles",
  Claude: siClaude,
  "Google Gemini AI": siGooglegemini,
  OpenAI: openai,
  Groq: groq,
  "Claude Code": siClaude,
  Codex: openai,
  Cursor: siCursor,
  Gemini: siGooglegemini,
  Vercel: siVercel,
  SEO: "search",
  "Responsive design": "smartphone",
};

// Near-black logos (Next.js, Vercel, Cursor…) would vanish on the dark
// theme, so they take the text colour instead, as their brands do on dark
// backgrounds.
function isDark(hex: string) {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.12;
}

export function SkillIcon({ name, className = "size-3.5" }: { name: string; className?: string }) {
  const logo = logos[name];
  if (!logo) return null;
  if (typeof logo === "string") return <Icon name={logo} className={`${className} shrink-0 text-zinc-400`} />;
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={`${className} shrink-0 ${isDark(logo.hex) ? "text-zinc-100" : ""}`}
      fill={isDark(logo.hex) ? "currentColor" : `#${logo.hex}`}
    >
      <path d={logo.path} />
    </svg>
  );
}
