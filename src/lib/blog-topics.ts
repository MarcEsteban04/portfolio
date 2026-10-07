// What the blog writes about on the days that aren't build logs: evergreen
// topics for developers, picked in order and never repeated until they've
// all been used. Add more at the end; ids must stay unique.

export const categories = ["AI", "Web development", "Mobile", "Databases", "Developer life", "Freelancing", "Technology", "Build log"] as const;
export type Category = (typeof categories)[number];

export type Topic = { id: string; category: Exclude<Category, "Build log">; idea: string };

export const topics: Topic[] = [
  { id: "ai-pair", category: "AI", idea: "How I actually use Claude, Codex and Gemini day to day as a solo developer, and where each one fits" },
  { id: "next-server-components", category: "Web development", idea: "Server Components in Next.js explained for someone coming from plain React" },
  { id: "flutter-or-web", category: "Mobile", idea: "When a small business needs a Flutter app and when a good website is enough" },
  { id: "supabase-rls", category: "Databases", idea: "Row-level security in Supabase: what it is and the mistakes that leave data open" },
  { id: "pricing-projects", category: "Freelancing", idea: "How to scope and price a website project so neither side gets surprised" },
  { id: "ai-review", category: "AI", idea: "Reviewing AI-written code: a checklist for catching the subtle bugs" },
  { id: "sqlite-everywhere", category: "Databases", idea: "Why SQLite is a serious choice for apps, not just a toy database" },
  { id: "dev-burnout", category: "Developer life", idea: "Keeping a steady pace as a developer without burning out" },
  { id: "vercel-deploys", category: "Web development", idea: "Preview deployments on Vercel and why every pull request should get one" },
  { id: "prompting-for-code", category: "AI", idea: "Writing prompts that get useful code: context, constraints and examples" },
  { id: "pos-lessons", category: "Technology", idea: "What building inventory and point-of-sale systems teaches you about real-world software" },
  { id: "offline-first", category: "Mobile", idea: "Offline-first mobile apps: keeping data safe when the signal drops" },
  { id: "client-communication", category: "Freelancing", idea: "Talking to non-technical clients without jargon, and getting better feedback" },
  { id: "accessibility-basics", category: "Web development", idea: "Accessibility basics every website should get right before launch" },
  { id: "ai-agents", category: "AI", idea: "AI coding agents: what they are good at, and what still needs a human" },
  { id: "learning-new-stack", category: "Developer life", idea: "How I learn a new framework quickly without getting lost in tutorials" },
  { id: "postgres-indexes", category: "Databases", idea: "Database indexes in plain terms: when they help and when they hurt" },
  { id: "web-performance", category: "Web development", idea: "Making a website feel fast: the few changes that matter most" },
  { id: "privacy-by-design", category: "Technology", idea: "Building privacy in from the start: keeping secrets and personal data safe in apps" },
  { id: "ai-in-small-business", category: "AI", idea: "Practical ways small businesses in the Philippines can use AI without big budgets" },
  { id: "git-habits", category: "Developer life", idea: "Small git habits that save hours: commits, branches and messages" },
  { id: "flutter-state", category: "Mobile", idea: "Managing state in Flutter apps without overcomplicating it" },
  { id: "freelance-first-client", category: "Freelancing", idea: "Landing your first freelance clients as a developer in the Philippines" },
  { id: "typescript-wins", category: "Web development", idea: "The TypeScript features that prevent the most real bugs" },
  { id: "testing-what-matters", category: "Developer life", idea: "Testing what matters: where tests pay off in a small project" },
  { id: "realtime-features", category: "Technology", idea: "Adding real-time features like live counts and chat, and the costs to watch" },
  { id: "ai-limits", category: "AI", idea: "Where AI models still get things wrong, and how to design around it" },
  { id: "backups", category: "Databases", idea: "Backups nobody thinks about until they need them" },
  { id: "design-for-devs", category: "Web development", idea: "Design basics for developers: spacing, type and contrast" },
  { id: "maintenance-contracts", category: "Freelancing", idea: "Why maintenance matters after launch, and how to offer it" },
];

// The next topic to write about: the first one not used yet, starting over
// once every topic has had a post.
export function nextTopic(used: string[]) {
  const done = new Set(used);
  const fresh = topics.find((topic) => !done.has(topic.id));
  if (fresh) return fresh;
  const counts = new Map<string, number>();
  for (const id of used) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...topics].sort((a, b) => (counts.get(a.id) ?? 0) - (counts.get(b.id) ?? 0))[0];
}
