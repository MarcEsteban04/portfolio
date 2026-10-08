// What I build on: the desk, the PC, what's in my hands and the software.
// Hardware has a drawing (`art`, see gear-art.tsx); software shows its logo
// (`logo`, see skill-icons.tsx) or a line icon (`icon`).

export type UseItem = { name: string; detail: string; art?: string; logo?: string; icon?: string };

export const setup: { group: string; items: UseItem[] }[] = [
  {
    group: "Monitors",
    items: [
      { name: 'Titan Army 27" 300Hz', detail: "Main monitor", art: "monitor-main" },
      { name: 'NVISION 24" 100Hz', detail: "Second monitor", art: "monitor-second" },
    ],
  },
  {
    group: "PC",
    items: [
      { name: "AMD Ryzen 5 5600", detail: "CPU · 6 cores, 12 threads", art: "cpu" },
      { name: "AMD Radeon RX 6600", detail: "Graphics · 8GB", art: "gpu" },
      { name: "16GB DDR4 3200MHz", detail: "Memory", art: "ram" },
      { name: "Windows 11 Pro", detail: "Operating system", art: "os" },
    ],
  },
  {
    group: "Peripherals",
    items: [
      { name: "Attack Shark X66", detail: "Wireless mechanical keyboard", art: "keyboard" },
      { name: "Attack Shark X11", detail: "Wireless gaming mouse", art: "mouse" },
    ],
  },
  {
    group: "Software",
    items: [
      { name: "VS Code", detail: "Editor", icon: "code" },
      { name: "Cursor", detail: "AI editor", logo: "Cursor" },
      { name: "Claude Code", detail: "Agentic coding in the terminal", logo: "Claude Code" },
      { name: "Codex", detail: "OpenAI's coding agent", logo: "Codex" },
      { name: "Gemini", detail: "Google's AI assistant", logo: "Gemini" },
      { name: "Git & GitHub", detail: "Version control and code review", logo: "GitHub" },
      { name: "Vercel", detail: "Hosting and deploys", logo: "Vercel" },
      { name: "Supabase", detail: "Postgres, auth and storage", logo: "Supabase" },
    ],
  },
];
