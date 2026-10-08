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
  about: [
    "I take projects from a blank page to production: the database schema, the API, and the interface people actually use. Most of my work is for small businesses and clients who need software that fits how they already operate.",
    "Recent work includes an inventory and point-of-sale system that cut manual entry errors by 40%, and a Google Gemini AI integration that raised automation by 25%.",
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
    items: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Tailwind CSS", "Bootstrap"],
  },
  {
    group: "Backend",
    items: ["Node.js", "Express", "PHP", "RESTful APIs", "JWT Authentication"],
  },
  {
    group: "Data",
    items: ["MySQL", "MongoDB"],
  },
  {
    group: "Practice",
    items: ["SEO", "Responsive design", "Google Gemini AI"],
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
