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
];

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}
