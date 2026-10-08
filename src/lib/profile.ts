// The year I started shipping; the count of years goes up every New Year.
export const SHIPPING_SINCE = 2021;

const manilaYear = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Manila",
  year: "numeric",
});

// Whole years shipping, counted by the calendar year in the Philippines.
// Call it at render time, not at module load, so a long-running server picks
// up the new year.
export function yearsShipping(now: Date = new Date()) {
  return Number(manilaYear.format(now)) - SHIPPING_SINCE;
}

const numberWords = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
];

export function inWords(count: number) {
  return numberWords[count] ?? String(count);
}

export function summary(years: number) {
  return `Freelance web developer with ${inWords(years)} years of full-stack experience across PHP, MySQL, JavaScript, Tailwind CSS and the MERN stack. I build responsive websites, inventory systems and Java applications, and write clean, user-focused code that ships reliably.`;
}

export const profile = {
  name: "Marc Esteban",
  role: "Full-Stack Web Developer",
  location: "Bocaue, Bulacan, Philippines",
  email: "marcdelacruzesteban@gmail.com",
  github: "MarcEsteban04",
  // In international format, digits only after the plus.
  whatsapp: "+639934528204",
  teams: "marcdelacruzesteban@gmail.com",
  // Drawn from the work history below and from the repos on GitHub.
  about: [
    "I'm a full-stack developer from Bocaue, Bulacan. I take software from a blank page to production: the database schema, the API, and the screens people actually use. Mostly web apps and business systems, and more and more mobile apps and AI features.",
    "By day I'm at Acore Technology, keeping client systems running: fixing bugs, building feature requests, connecting Shopify and Zoho CRM, and looking after the Vanderlyn ERP, where I lead the bigger pieces like vendor and customer onboarding. Before that I freelanced from 2023, built an inventory and point-of-sale system for M5B Hardware that cut manual entry errors by 40%, and did IT support for the Municipality of Sta. Maria.",
    "Outside work I'm always building something. This year that's been Flutter apps on Supabase (Velora, a money companion for everyday life in the Philippines; PayPaw, a bills tracker; What's Cooking, a recipe app), Acadify, an AI study companion that turns school materials into reviewers, flashcards and quizzes, and Nexus, an offline-first Windows app that brings money, receipts, passwords and games into one place, with AES-256 encryption and AI through OpenAI or Groq.",
    "I plan before I build: most projects start with a written spec, a sprint-by-sprint roadmap and a design system, and they ship with tests. I work alongside AI tools every day, enough that I built Shipwright, a board that hands tasks to Claude Code agents and gets back pull requests I review and merge.",
  ],
};

export function getStats(years: number) {
  return [
    { value: `${years}+`, label: "Years shipping" },
    { value: "40%", label: "Fewer manual entry errors with a custom POS" },
    { value: "25%", label: "More automation with Google Gemini AI" },
  ];
}

export const experience = [
  {
    company: "Acore Technology",
    role: "Full-Stack Developer",
    period: "Present",
    points: [
      "Resolve bug reports and build feature requests across client systems.",
      "Integrate third-party platforms such as Shopify and Zoho CRM.",
      "Manage the Vanderlyn ERP for clients, handling their technical requests and ongoing enhancements.",
      "Lead larger projects with operations managers, from scoping new forms like vendor and customer onboarding to integrating them into the ERP.",
    ],
  },
  {
    company: "Freelance",
    role: "Web Developer",
    period: "Jan 2023 — 2025",
    points: [
      "Project-based web development for a range of clients, focused on tailored solutions, responsive design and efficient system implementation.",
    ],
  },
  {
    company: "Municipality of Sta. Maria, Bulacan",
    role: "IT Support",
    period: "Aug 2024 — Dec 2024",
    points: [
      "Provided technical support, computer troubleshooting and OS installation, improving system uptime and overall IT efficiency by 25%.",
    ],
  },
  {
    company: "M5B Hardware",
    role: "Full-Stack Developer",
    period: "Sep 2023 — Oct 2023",
    points: [
      "Built an inventory management system with integrated point-of-sale features.",
      "Used HTML, PHP, CSS, JavaScript and MySQL to deliver a responsive, efficient web-based solution.",
      "Improved inventory tracking and sales processing, reducing manual entry errors by 40%.",
    ],
  },
];

export const skills = [
  {
    group: "Frontend",
    items: [
      "HTML",
      "CSS",
      "JavaScript",
      "TypeScript",
      "React",
      "Next.js",
      "Astro",
      "Three.js",
      "Tailwind CSS",
      "Bootstrap",
      "Flutter",
    ],
  },
  {
    group: "Backend",
    items: ["Node.js", "Express", "PHP", "RESTful APIs", "JWT Authentication"],
  },
  {
    group: "Data",
    items: ["MySQL", "MongoDB", "Supabase", "SQLite"],
  },
  {
    group: "AI",
    items: ["LLMs", "Claude", "OpenAI", "Google Gemini AI", "Groq"],
  },
  {
    group: "Tools",
    items: ["Claude Code", "Codex", "Cursor", "Gemini", "Vercel"],
  },
  {
    group: "Practice",
    items: ["SEO", "Responsive design"],
  },
];

export const education = {
  school: "ACLC College of Sta. Maria",
  degree: "Bachelor of Science in Computer Science",
  period: "2021 — 2025",
  detail: "GPA 3.60 / 4.0",
  award: {
    year: "2025",
    title: "Recognition for technical mastery in server-side programming and integration",
  },
};

export const languages = ["English (Fluent)", "Filipino / Tagalog (Native)"];

export const services = [
  {
    title: "Business websites",
    detail: "Responsive, SEO-ready sites for small businesses.",
  },
  {
    title: "Inventory and POS systems",
    detail: "Like the one that cut manual entry errors by 40%.",
  },
  {
    title: "Full-stack web apps",
    detail: "React, Node.js, PHP and MySQL, from schema to interface.",
  },
  {
    title: "Integrations",
    detail: "Shopify, Zoho CRM and AI features with Google Gemini.",
  },
];

// The tools front and centre on the home page (and the ones the blog writes from).
export const coreStack = ["Next.js", "Supabase", "React", "Flutter", "SQLite", "Vercel", "Claude", "Codex", "Gemini"];

// Every way to reach Marc, each with a link that opens it and, where it
// helps, the value to copy.
export type ContactKind = "github" | "gmail" | "whatsapp" | "teams";

export function formatPhone(international: string) {
  // +63 993 452 8204
  const digits = international.replace(/\D/g, "");
  return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
}

export const contacts: { kind: ContactKind; label: string; value: string; href: string; copy?: string }[] = [
  {
    kind: "github",
    label: "GitHub",
    value: `@${profile.github}`,
    href: `https://github.com/${profile.github}`,
  },
  {
    kind: "gmail",
    label: "Gmail",
    value: profile.email,
    href: `mailto:${profile.email}`,
    copy: profile.email,
  },
  {
    kind: "whatsapp",
    label: "WhatsApp",
    value: formatPhone(profile.whatsapp),
    href: `https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`,
    copy: profile.whatsapp,
  },
  {
    kind: "teams",
    label: "Microsoft Teams",
    value: profile.teams,
    href: `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(profile.teams)}`,
    copy: profile.teams,
  },
];

// Quick facts under the About text.
export const aboutFacts = [
  { label: "Based in", value: "Bocaue, Bulacan · GMT+8" },
  { label: "Working at", value: "Acore Technology, Full-Stack Developer" },
  { label: "Studied", value: "BS Computer Science, ACLC College of Sta. Maria (2021–2025, GPA 3.60)" },
  { label: "Building for clients since", value: "2023" },
  { label: "Also built", value: "A Node, Express and PostgreSQL inventory API; a FastAPI and Vue 3 shift planner on Google Cloud" },
  { label: "Speaks", value: "English and Filipino" },
];
