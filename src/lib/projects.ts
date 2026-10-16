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
  // A short film of the app in use, shown above the screens.
  video?: { src: string; poster: string; title: string; description: string };
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
    video: {
      src: "/projects/obsidian/ad.mp4",
      poster: "/projects/obsidian/ad-poster.webp",
      title: "See it in action",
      description: "A narrated one-minute tour, recorded from the real app",
    },
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
    video: {
      src: "/projects/velora/ad.mp4",
      poster: "/projects/velora/ad-poster.webp",
      title: "See it in action",
      description: "A one-minute tour, recorded from the real app",
    },
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
    slug: "prism",
    name: "Prism",
    tagline: "A team's engineering work, refracted for whoever needs it.",
    summary:
      "A local tool for the engineering team I work in. It turns a week of pull requests into plain-language huddle notes, writes a developer's end-of-day update from their commits, answers questions about the ERP's bug tracker by having Claude Code read the codebase, and turns a bug report into a reviewed pull request. One rule runs through all of it: counting is code, wording is Claude.",
    year: "2026",
    platform: "Web · Next.js",
    repo: { visibility: "private" },
    icon: "/projects/prism/icon.webp",
    framed: false,
    screenshotSize: { width: 1280, height: 800 },
    stack: [
      "Next.js",
      "React",
      "TypeScript",
      "Tailwind CSS",
      "Claude Agent SDK",
      "Supabase",
      "GitHub CLI",
    ],
    screenshots: [
      {
        src: "/projects/prism/dashboard.webp",
        alt: "Prism dashboard with the week's throughput, coverage and work mix",
        caption: "Dashboard: the week's throughput, coverage and work mix",
      },
      {
        src: "/projects/prism/draft.webp",
        alt: "Huddle notes drafted under sprint headings, with the Slack text beside them",
        caption: "Huddle notes in plain language, with the Slack text beside them",
      },
      {
        src: "/projects/prism/insights.webp",
        alt: "Who shipped what, reported-to-fixed links, past weeks and the note headings",
        caption: "Who shipped what, past weeks, and headings that keep up with the work",
      },
      {
        src: "/projects/prism/eod.webp",
        alt: "Daily EOD written from a day of commits, ready to paste",
        caption: "Daily EOD: a day of commits, written for the people who use the software",
      },
      {
        src: "/projects/prism/builder.webp",
        alt: "AI builder showing an assessed report and the pull request it opened",
        caption: "AI builder: a bug report turned into a pull request",
      },
      {
        src: "/projects/prism/bugs.webp",
        alt: "Bugs and features tracker with an answer from Claude Code citing the files it read",
        caption: "Bugs & features, with Claude Code reading the codebase to answer",
      },
    ],
    features: [
      {
        title: "Weekly huddle notes",
        body: "Every merged and open pull request in the window, counted as bugs and features, then grouped by Claude under the team's headings in plain language and copied for Slack.",
      },
      {
        title: "Counting is code, wording is Claude",
        body: "Every number comes from plain TypeScript, never the model, so the same week always gives the same totals. Claude only groups and rewrites.",
      },
      {
        title: "Carryover, checked",
        body: "Last week's notes are read against this week's pull requests: done, still going, or ask a person. It won't guess about work that left no commit.",
      },
      {
        title: "Daily EOD",
        body: "One person's day of commits, rewritten for the people who use the software. Nothing is dropped silently: internal commits are listed as set aside.",
      },
      {
        title: "Bugs & features",
        body: "The ERP's own tracker, read-only: what's outstanding, dormant or never touched, and an assistant that reads the code to answer and lists every file it opened.",
      },
      {
        title: "AI builder",
        body: "Pick a report. A read-only assessment decides whether the change is contained and asks specific questions when it isn't sure, then builds it and opens a PR once the checks pass.",
      },
      {
        title: "Headings that keep up",
        body: "Pull requests that fit no heading are clustered into proposed new ones. A person accepts them, so the notes never quietly leave out half the week.",
      },
      {
        title: "A memory of past weeks",
        body: "Every week is archived as sent, so it can show the trend against last week and notice an item that's been said four Tuesdays running.",
      },
    ],
    details: [
      {
        title: "Guardrails",
        rows: [
          {
            label: "The tracker",
            value: "Read-only by construction: anything but a read is refused before it leaves the process, and there is no write function to call",
          },
          {
            label: "Git",
            value: "The agent never runs git. Branches, commits, pushes and the PR come from code with fixed arguments, and only its own branches are pushed",
          },
          {
            label: "Builds",
            value: "Edits happen in a throwaway worktree with no shell, and a PR opens only when type-check and lint on the changed files pass",
          },
          {
            label: "Migrations",
            value: "Proposed as SQL and approved by a person before anything is branched",
          },
        ],
      },
      {
        title: "How it's built",
        rows: [
          {
            label: "App",
            value: "Next.js and React with Tailwind CSS, run on localhost only",
          },
          {
            label: "AI",
            value: "The Claude Agent SDK on the existing Claude Code login, with a schema for every structured answer",
          },
          {
            label: "Data",
            value: "Pull requests and commits through the GitHub CLI, the app's own state in Supabase, and the ERP's tracker read-only",
          },
          {
            label: "Screenshots",
            value: "Shown with made-up data; the real repositories and tracker are private",
          },
        ],
      },
    ],
  },
  {
    slug: "careerly",
    name: "Careerly",
    tagline: "A personal career workspace for the Philippine job market.",
    summary:
      "An Android app for job hunting in the Philippines. It finds jobs from LinkedIn, Indeed, JobStreet and more, ranks each one against your resume with a reason, tracks every application on a board, keeps interviews and follow-ups on an agenda, and puts ten AI tools a tap away, from a career coach to an ATS check and a salary negotiation plan.",
    year: "2026",
    platform: "Android · Flutter",
    repo: {
      visibility: "public",
      url: "https://github.com/MarcEsteban04/Careerly",
    },
    icon: "/projects/careerly/icon.webp",
    framed: false,
    screenshotSize: { width: 520, height: 1125 },
    stack: [
      "Flutter",
      "Dart",
      "Material 3",
      "Supabase",
      "Gemini · Groq · OpenAI",
      "JSearch · Jooble",
      "pdf · pdfrx",
    ],
    screenshots: [
      {
        src: "/projects/careerly/home.webp",
        alt: "Careerly home with the next interview, weekly momentum and the pipeline",
        caption: "Home: what's next, weekly momentum and your pipeline",
      },
      {
        src: "/projects/careerly/discover.webp",
        alt: "Discover with jobs in the Philippines ranked by match score",
        caption: "Discover: jobs ranked against your resume, with the reason",
      },
      {
        src: "/projects/careerly/job-detail.webp",
        alt: "A job's detail page with its match score and company research",
        caption: "Every job: match, requirements and a company brief",
      },
      {
        src: "/projects/careerly/jobs.webp",
        alt: "Tracked jobs with filters, statuses and follow-up dates",
        caption: "The tracker: every application, list or kanban",
      },
      {
        src: "/projects/careerly/studio.webp",
        alt: "Studio with the career coach and ten AI tools",
        caption: "Studio: ten AI tools for every step of the search",
      },
      {
        src: "/projects/careerly/career-coach.webp",
        alt: "Career coach chat planning the week from the user's applications",
        caption: "A career coach that knows your resume, jobs and agenda",
      },
      {
        src: "/projects/careerly/agenda.webp",
        alt: "Agenda with interviews, follow-ups and deadlines on a week strip",
        caption: "Agenda: interviews, follow-ups and deadlines, with reminders",
      },
      {
        src: "/projects/careerly/goals.webp",
        alt: "Weekly and monthly goals with progress rings",
        caption: "Goals with progress rings",
      },
      {
        src: "/projects/careerly/home-dark.webp",
        alt: "Careerly home in dark mode",
        caption: "Light and dark themes",
      },
    ],
    features: [
      {
        title: "Jobs that fit",
        body: "Searches JSearch (LinkedIn, Indeed, JobStreet and more) and Jooble, in the Philippines, remote or abroad. Each result is scored against your profile and resume, with why it fits and a warning when a post looks like a scam.",
      },
      {
        title: "Daily job alerts",
        body: "A background check runs your saved searches every day and sends a notification when new matches appear.",
      },
      {
        title: "Bring any job in",
        body: "Share a post from any app or paste a link, and it becomes a tracked job. Careerly only opens the page you share and never scrapes.",
      },
      {
        title: "Every application, tracked",
        body: "A list or a kanban board with search, filters, bulk actions and drag-and-drop between stages. Each application keeps its timeline, notes and agenda items.",
      },
      {
        title: "Agenda and goals",
        body: "Interviews, follow-ups and deadlines on a week strip with reminders on your phone, and weekly or monthly targets with progress rings.",
      },
      {
        title: "A career coach",
        body: "A chat that knows your profile, resume, tracked jobs, agenda and goals, with suggested follow-up questions and voice input.",
      },
      {
        title: "Ten AI tools",
        body: "Enhance your resume without inventing experience, write a cover letter, prepare and practise an interview, run an ATS check, plan a salary negotiation and research the company.",
      },
      {
        title: "Apply faster",
        body: "An in-app browser fills application forms from your details, saved answers and AI drafts, and you review every field before anything is submitted. Email applications open with your resume PDF attached.",
      },
    ],
    details: [
      {
        title: "How it's built",
        rows: [
          {
            label: "App",
            value: "Flutter and Material 3, with a shared design system in light and dark",
          },
          {
            label: "Backend",
            value: "Supabase: Auth, Postgres with row-level security, and Storage for profile photos",
          },
          {
            label: "AI",
            value: "One chain for every feature: Gemini, then Groq, then OpenAI, falling back automatically when a provider fails or times out",
          },
          {
            label: "Job data",
            value: "JSearch and Jooble, with AI web search as the backup",
          },
          {
            label: "On the phone",
            value: "Reminders, daily background job alerts, a biometric app lock and voice input",
          },
          {
            label: "Documents",
            value: "Resumes exported as PDFs in four layouts, and PDFs read and previewed in the app",
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
