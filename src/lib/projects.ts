export type Screenshot = {
  src: string;
  alt: string;
  caption: string;
};

export type Project = {
  slug: string;
  name: string;
  tagline: string;
  summary: string;
  year: string;
  platform: string;
  // Set for work done for an organisation rather than a project of my own;
  // it's listed apart from the projects.
  organization?: string;
  // Public repos link to GitHub; private ones are described in full on their page instead.
  repo: { visibility: "public"; url: string } | { visibility: "private" };
  icon: string;
  // Screenshots that already include a phone frame are shown as they are.
  framed: boolean;
  screenshotSize: { width: number; height: number };
  stack: string[];
  screenshots: Screenshot[];
  features: { title: string; body: string }[];
  details: { title: string; rows: { label: string; value: string }[] }[];
};

export const projects: Project[] = [
  {
    slug: "obsidian",
    name: "Obsidian",
    tagline: "A private vault for the things that matter.",
    summary:
      "An Android app that keeps links, photos, passwords, notes, IDs and files in one encrypted vault on the phone. There is no account, no sync and no server. The only thing that ever talks to the internet is Obsidia, an optional AI assistant that can find anything in the vault and read your files for you, without ever seeing your secrets.",
    year: "2026",
    platform: "Android · Flutter",
    repo: { visibility: "private" },
    icon: "/projects/obsidian/icon.webp",
    framed: false,
    screenshotSize: { width: 480, height: 1067 },
    stack: [
      "Flutter",
      "Dart",
      "Riverpod",
      "go_router",
      "SQLCipher",
      "ML Kit",
      "TensorFlow Lite",
      "Groq · Gemini · OpenAI",
    ],
    screenshots: [
      {
        src: "/projects/obsidian/home.webp",
        alt: "Obsidian home screen showing the vault status and spaces",
        caption: "Home: vault status, Obsidia and every space at a glance",
      },
      {
        src: "/projects/obsidian/login.webp",
        alt: "Obsidian lock screen with a PIN pad",
        caption: "Lock screen with PIN, lockout and auto-lock",
      },
      {
        src: "/projects/obsidian/obsidia.webp",
        alt: "Obsidia, the AI assistant, with suggested questions",
        caption: "Obsidia, the AI guardian",
      },
      {
        src: "/projects/obsidian/obsidia-chat.webp",
        alt: "Obsidia answering which passwords should be changed",
        caption: "Answers link straight to the items they mention",
      },
      {
        src: "/projects/obsidian/passwords.webp",
        alt: "Passwords screen with the vault health summary",
        caption: "Passwords with vault health: weak and reused logins",
      },
      {
        src: "/projects/obsidian/add.webp",
        alt: "Add to your vault sheet with links, photos, passwords, notes and file import",
        caption: "Quick add, including importing a file for Obsidia to read",
      },
    ],
    features: [
      {
        title: "Links, photos and notes",
        body: "Saved links with a note on why they matter, an encrypted photo gallery with folders and multi-select, and secure notes that stay blurred until revealed.",
      },
      {
        title: "Passwords",
        body: "Vault health flags weak and reused passwords, a built-in generator, and copied passwords wipe themselves from the clipboard after 30 seconds.",
      },
      {
        title: "ID and card wallet",
        body: "Photograph the front and back of IDs and bank cards, and Obsidia fills in the type, number, name and expiry date. Expiring cards are flagged 60 days ahead.",
      },
      {
        title: "Encrypted files",
        body: "Contracts, insurance and tax documents open right in the app: PDFs page by page, Excel and CSV as tables, Word documents as text.",
      },
      {
        title: "Obsidia, the AI guardian",
        body: "A chat assistant that knows the vault's shape but never its secrets. Ask where the Wi-Fi details are or which passwords to change, and tap the items it mentions.",
      },
      {
        title: "Import a file",
        body: "Hand Obsidia a text file, PDF or even a screenshot. It pulls out the logins, links and notes inside, and nothing is saved until you tick what to keep.",
      },
      {
        title: "Face unlock",
        body: "Unlock with a look, entirely on the phone, using ML Kit face detection and MobileFaceNet. It needs a blink, so a photo won't pass.",
      },
      {
        title: "Recently deleted and backups",
        body: "Deleted items wait 30 days before they're erased. The whole vault backs up to a single file encrypted with a password you choose.",
      },
    ],
    details: [
      {
        title: "Privacy and security",
        rows: [
          {
            label: "Database",
            value: "SQLCipher (AES-256), with a random key kept in the Android Keystore",
          },
          {
            label: "Photos and files",
            value: "Each file encrypted with AES-256-GCM under a separate Keystore key",
          },
          {
            label: "PIN",
            value: "PBKDF2-HMAC-SHA256 with a random salt; after 5 wrong tries the wait grows from 30 seconds to 15 minutes",
          },
          {
            label: "Face unlock",
            value: "Only a numeric face signature is stored, never a photo",
          },
          {
            label: "Backups",
            value: "AES-256-GCM, keyed from your backup password (PBKDF2, 310,000 rounds)",
          },
          {
            label: "AI",
            value: "Obsidia sees names, websites and dates. Passwords, usernames, card numbers and file contents are never sent",
          },
        ],
      },
      {
        title: "How it's built",
        rows: [
          {
            label: "App",
            value: "Flutter (Android first) with Riverpod and go_router, one folder per feature in four layers",
          },
          {
            label: "Storage",
            value: "SQLite via sqflite_sqlcipher with versioned migrations; flutter_secure_storage for Keystore secrets",
          },
          {
            label: "Documents",
            value: "pdfrx for PDFs, archive and xml to read Word and Excel files",
          },
          {
            label: "AI",
            value: "Streams from Groq first, then Gemini, with OpenAI as the last resort",
          },
          {
            label: "Design",
            value: "Black and white on purpose, flat with no shadows. The one splash of colour is the purple crystal Guardian mascot",
          },
        ],
      },
    ],
  },
  {
    slug: "velora",
    name: "Velora",
    tagline: "A calm, friendly money companion for everyday life in the Philippines.",
    summary:
      "A personal finance app for logging spending in seconds, paying bills on time and watching debts reach zero, with Velora the red panda cheering you on. It knows the accounts people here actually use, from GCash and Maya to SPayLater and Payoneer, and an AI assistant can log an expense from a sentence like \"spent 250 on lunch\".",
    year: "2026",
    platform: "Android · Flutter",
    repo: {
      visibility: "public",
      url: "https://github.com/MarcEsteban04/velora",
    },
    icon: "/projects/velora/icon.webp",
    framed: true,
    screenshotSize: { width: 520, height: 1124 },
    stack: [
      "Flutter",
      "Dart",
      "Riverpod",
      "Supabase",
      "PostgreSQL",
      "Edge Functions",
      "Groq · Gemini · OpenAI",
    ],
    screenshots: [
      {
        src: "/projects/velora/home-night.webp",
        alt: "Velora home screen with spending for the last seven days",
        caption: "Home: today's spending and recent activity",
      },
      {
        src: "/projects/velora/wallet.webp",
        alt: "Velora wallet with every account and balance",
        caption: "Wallet: net worth and every account",
      },
      {
        src: "/projects/velora/plan.webp",
        alt: "Velora plan screen with budgets and goals",
        caption: "Plan: budgets, bills, goals and debts",
      },
      {
        src: "/projects/velora/ask.webp",
        alt: "Ask Velora chat logging an expense from a sentence",
        caption: "Ask Velora: log or ask in plain words",
      },
      {
        src: "/projects/velora/planned.webp",
        alt: "Planned payments due over the next 30 days",
        caption: "Planned payments, never missed",
      },
      {
        src: "/projects/velora/debt.webp",
        alt: "SPayLater credit line with monthly bills",
        caption: "Debts and pay-later, bill by bill",
      },
      {
        src: "/projects/velora/reports.webp",
        alt: "Monthly report of spending, income and savings",
        caption: "Reports with colour-blind-safe charts",
      },
    ],
    features: [
      {
        title: "Log in seconds",
        body: "A calculator pad, a receipt scan, or just type \"spent 250 on lunch\".",
      },
      {
        title: "Every account",
        body: "Cash, banks, GCash, Maya, MariBank, SPayLater, BillEase, and Payoneer in dollars.",
      },
      {
        title: "Budgets that guide",
        body: "Category budgets and a \"safe to spend today\" number.",
      },
      {
        title: "Bills, never missed",
        body: "Reminders the day before they're due, pay in one tap, or let fixed ones log themselves.",
      },
      {
        title: "Debts to zero",
        body: "Credit limits, monthly bills and payoff dates for cards, loans and pay-later. Scan a screenshot to add a purchase.",
      },
      {
        title: "Goals on pace",
        body: "Save for a trip or an emergency fund, and see when you'll get there.",
      },
    ],
    details: [
      {
        title: "How it's built",
        rows: [
          {
            label: "App",
            value: "Flutter with Riverpod, features in four layers: domain, data, application and presentation",
          },
          {
            label: "Backend",
            value: "Supabase Postgres with row-level security on every table; sign-in is anonymous until you link an email",
          },
          {
            label: "AI",
            value: "Supabase Edge Functions that try Groq, then Gemini, then OpenAI. Only totals are sent",
          },
          {
            label: "Money",
            value: "Always whole numbers in cents, never floating point",
          },
          {
            label: "Tests",
            value: "Widget tests run the whole app on in-memory fakes, from onboarding to paying a bill",
          },
        ],
      },
    ],
  },
  {
    slug: "shipwright",
    name: "Shipwright",
    tagline: "Agents ship. You merge.",
    summary:
      "A task board for handing work to Claude Code agents across my repos. I write a task and pick a repo; a runner on my machine gives it a fresh git worktree and an agent works it through a pipeline of checks, from tiering and reproducing the problem to code review, tests and a live test with screenshots. Every task comes back as a pull request with the evidence for each stage, and a person always reviews and merges.",
    year: "2026",
    platform: "Web · Next.js",
    repo: { visibility: "private" },
    icon: "/projects/shipwright/icon.webp",
    framed: false,
    screenshotSize: { width: 1280, height: 800 },
    stack: [
      "Next.js",
      "React",
      "TypeScript",
      "Tailwind CSS",
      "SQLite",
      "Node.js",
      "Claude Code",
      "GitHub CLI",
      "Playwright",
    ],
    screenshots: [
      {
        src: "/projects/shipwright/board.webp",
        alt: "Shipwright task board with Backlog, Queued, Agent working and Needs you columns",
        caption: "The board: every task across every repo, with live agent progress",
      },
      {
        src: "/projects/shipwright/task.webp",
        alt: "A finished task page with its stage-by-stage ledger and pull request",
        caption: "Each task keeps a ledger: evidence for every stage the agent ran",
      },
      {
        src: "/projects/shipwright/proof.webp",
        alt: "Proof section of a task with four screenshots of the change working",
        caption: "Screenshot proof that the change works, embedded in the PR",
      },
      {
        src: "/projects/shipwright/how-it-works.webp",
        alt: "How it works page with the five steps and the rules that override everything",
        caption: "How it works: five steps, and the rules agents can't break",
      },
      {
        src: "/projects/shipwright/repos.webp",
        alt: "Repos page with connected repositories, their queues and dev servers",
        caption: "Repos: a queue, agent settings and a dev server for each",
      },
      {
        src: "/projects/shipwright/activity.webp",
        alt: "Activity feed listing recent tasks and their status across repos",
        caption: "Activity across every repo at a glance",
      },
    ],
    features: [
      {
        title: "Write a task, get a PR",
        body: "Pick a repo and say what done looks like. The task is queued by priority, an agent claims it, and it comes back as a pull request ready to review.",
      },
      {
        title: "One worktree per task",
        body: "The runner gives every task a fresh git worktree off the base branch, so agents never touch my working copy and several can run at once.",
      },
      {
        title: "A pipeline with evidence",
        body: "Set up and tier, reproduce, implement, code review, security review, tests and a live test. Each stage records a command, a file or a test name a reviewer can check.",
      },
      {
        title: "Screenshot proof",
        body: "Every task is tested for real in the running app. Shipwright won't accept a PR until screenshots of it working are attached, and they show up in the PR body.",
      },
      {
        title: "Stops when a person is needed",
        body: "Anything touching money, auth, schema or outside systems stops at a plan to approve. Questions and manual steps come back to the board instead of being guessed.",
      },
      {
        title: "Rework from review",
        body: "Send a PR back with a note, or leave comments on GitHub. The task goes to the top of the queue on the same branch, and the agent replies to each comment.",
      },
      {
        title: "Live previews",
        body: "Start any repo's dev server from the Repos page on a free port, with logs, and test a merged change before calling it done.",
      },
      {
        title: "Self-improving skills",
        body: "Agents log friction as they work. A retro run turns that log into a PR that fixes the skills or a repo's own notes.",
      },
    ],
    details: [
      {
        title: "Guardrails",
        rows: [
          {
            label: "Merging",
            value: "A person reviews, merges and deploys every PR. Merges, force-pushes and pushes to the base branch are denied at the tool level",
          },
          {
            label: "Production",
            value: "Read-only. Changes are made against local or staging data and ship through a PR",
          },
          {
            label: "Tier 2",
            value: "Money, auth and access, schema and migrations, and data that syncs to an outside system stop at a plan for approval",
          },
          {
            label: "Outcomes",
            value: "Exactly one per run: PR opened, plan for approval, needs info, already done, handed over, answered or released",
          },
        ],
      },
      {
        title: "How it's built",
        rows: [
          {
            label: "App",
            value: "Next.js and React with Tailwind CSS, bound to 127.0.0.1 so it only runs on my own machine",
          },
          {
            label: "Database",
            value: "SQLite through Node's built-in node:sqlite, with no native modules",
          },
          {
            label: "Runner",
            value: "A Node process that polls the queue, claims tasks per repo up to a parallel limit, makes worktrees and starts headless Claude Code",
          },
          {
            label: "Agents",
            value: "Claude Code skills: /shipwright runs the queue, /ship-pipeline works one task, /shipwright-retro fixes the skills",
          },
          {
            label: "CLI",
            value: "A token-protected shipwright command the agents call to record stages, outcomes and proof",
          },
          {
            label: "Screenshots",
            value: "playwright-core drives the installed Edge or Chrome; proof images go to a separate branch, never the PR's diff",
          },
        ],
      },
    ],
  },
  {
    slug: "vanderlyn",
    name: "Vanderlyn ERP",
    tagline: "ERP development and maintenance for a hotel supply business.",
    summary:
      "My day-to-day work at Acore Technology: building and maintaining the ERP that runs a supplier of hotel products, from quotes and CRM to purchase orders, sales orders, inventory and accounting sync. I've shipped over 2,300 commits to it since December 2025, working in a shared codebase where every change goes through a pull request. The screens below are recreated with made-up data; no client information is shown.",
    year: "2025–2026",
    platform: "Web · Next.js",
    organization: "Acore Technology",
    repo: { visibility: "private" },
    icon: "/projects/vanderlyn/icon.webp",
    framed: false,
    screenshotSize: { width: 1600, height: 1000 },
    stack: [
      "Next.js",
      "React",
      "TypeScript",
      "Supabase",
      "PostgreSQL",
      "MUI",
      "Tailwind CSS",
      "Puppeteer",
      "QuickBooks Online",
      "Microsoft Graph",
      "AWS S3",
      "OpenAI",
      "MCP",
      "Jest",
      "Playwright",
    ],
    screenshots: [
      {
        src: "/projects/vanderlyn/dashboard.webp",
        alt: "Company dashboard with revenue, year-to-date, a 12-month revenue trend and weekly targets (sample data)",
        caption: "The company dashboard: revenue, targets and the last 12 months at a glance",
      },
      {
        src: "/projects/vanderlyn/ask-ivan.webp",
        alt: "Ask Ivan panel answering what needs attention today with shortages, backorders and overdue balances (sample data)",
        caption: "Ask Ivan: an assistant that reads the ERP and says what needs attention",
      },
      {
        src: "/projects/vanderlyn/quotes.webp",
        alt: "Quote library with totals, filters and quotes linked to CRM deals (sample data)",
        caption: "The quote library: every quote across CRM, with value and status at a glance",
      },
      {
        src: "/projects/vanderlyn/purchase-orders.webp",
        alt: "Purchase orders with open value, overdue orders and receiving progress (sample data)",
        caption: "Purchase orders, from request to received, with progress per order",
      },
      {
        src: "/projects/vanderlyn/sales-orders.webp",
        alt: "Sales orders moving through stages from new order to shipped (sample data)",
        caption: "Sales orders moving through fulfilment stages",
      },
      {
        src: "/projects/vanderlyn/customers.webp",
        alt: "CRM customer list with accounting sync status, owners and last activity (sample data)",
        caption: "CRM customers, with their accounting sync status",
      },
      {
        src: "/projects/vanderlyn/bug-reports.webp",
        alt: "In-app bug reports and feature requests with status and priority (sample data)",
        caption: "Bug reports and feature requests, filed from inside the app",
      },
      {
        src: "/projects/vanderlyn/ai-connections.webp",
        alt: "AI connections settings with an MCP server URL for ChatGPT and Claude (sample data)",
        caption: "AI connections: the ERP's data in ChatGPT and Claude through MCP",
      },
    ],
    features: [
      {
        title: "Ask Ivan",
        body: "An assistant inside the ERP, built on OpenAI, that answers from live ERP data: what needs attention today, from stock shortages and backorders to overdue balances, with follow-ups like a chart or a weekly digest.",
      },
      {
        title: "AI connections",
        body: "An MCP server that brings the ERP's data into ChatGPT and Claude for reports and analysis. Anything that would change the ERP opens back in it for a person to approve.",
      },
      {
        title: "Quotes, end to end",
        body: "Where most of my work has gone: the quote library, quote documents generated as PDFs, sending them out for e-signature and recording the signed agreement back against the deal.",
      },
      {
        title: "CRM",
        body: "Customers, contacts, vendors and deals, plus the onboarding forms I led with operations for bringing on new vendors and customers.",
      },
      {
        title: "Purchase orders",
        body: "PO requests with notifications, purchase orders and their receiving progress, and the vendors behind them.",
      },
      {
        title: "Sales orders and inventory",
        body: "Orders through their fulfilment stages, stock levels, pricing, and consumption agreements with their own PDF reports.",
      },
      {
        title: "Documents",
        body: "Proforma invoices, quote documents and consumption reports, generated as PDFs from HTML templates.",
      },
      {
        title: "Integrations",
        body: "Keeping customers, vendors and orders in step with QuickBooks Online, along with Zoho work and day-to-day fixes to how data moves between systems.",
      },
      {
        title: "In-app bug reports",
        body: "A module where staff report bugs and request features from the page they're on, and follow them through to a fix.",
      },
      {
        title: "Tested changes",
        body: "Changes come with Jest tests alongside the code, and schema changes go through reviewed migrations rather than by hand.",
      },
    ],
    details: [
      {
        title: "My role",
        rows: [
          { label: "Position", value: "Full-Stack Developer at Acore Technology" },
          { label: "Since", value: "December 2025, ongoing" },
          { label: "Commits", value: "2,300+" },
          { label: "Workflow", value: "A shared codebase with a small team; every change goes through a pull request" },
        ],
      },
      {
        title: "How it's built",
        rows: [
          { label: "App", value: "Next.js 16 and React 19 in TypeScript, with MUI and Tailwind CSS" },
          { label: "Data", value: "Supabase (PostgreSQL), with migrations applied through pull requests and a preview database per PR" },
          { label: "Documents", value: "PDFs rendered from HTML templates with Puppeteer and react-pdf" },
          { label: "Integrations", value: "QuickBooks Online, Microsoft Graph and AWS S3" },
          { label: "AI", value: "Ask Ivan runs on OpenAI models through the AI SDK, and an MCP server connects ChatGPT and Claude" },
          { label: "Testing", value: "Jest for units and components, Playwright for the browser" },
        ],
      },
      {
        title: "About these screens",
        rows: [
          { label: "Data", value: "Every name, number and title is made up. The real ERP's client data is private and isn't shown here" },
        ],
      },
    ],
  },
];

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}
