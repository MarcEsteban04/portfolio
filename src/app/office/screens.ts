// Everything drawn onto canvases in the office: the two monitors and the view
// through the window. Each function paints one frame; the scene redraws them a
// few times a second and uploads the result as a texture.

import type { WeatherKind } from "@/lib/weather";

type Context = CanvasRenderingContext2D;

const hash = (n: number) => {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
};

function clear(c: Context, color: string) {
  c.fillStyle = color;
  c.fillRect(0, 0, c.canvas.width, c.canvas.height);
}

function text(c: Context, value: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = "left") {
  c.fillStyle = color;
  c.font = `bold ${size}px ui-monospace, Menlo, monospace`;
  c.textAlign = align;
  c.textBaseline = "middle";
  c.fillText(value, x, y);
}

// ── Main monitor ───────────────────────────────────────────────────────

// A dark code editor: file tree, line numbers, highlighted code, a cursor.
// Idle, the code stays where he left it and only the cursor blinks.
export function drawEditor(c: Context, t: number, late = false, idle = false) {
  const { width: w, height: h } = c.canvas;
  clear(c, late ? "#090b10" : "#0d1117");
  c.fillStyle = "#161b22";
  c.fillRect(0, 0, w * 0.2, h);
  for (let i = 0; i < 9; i++) {
    c.fillStyle = i === 2 ? "#e6edf3" : "#6e7681";
    c.fillRect(10 + (i % 3 === 1 ? 8 : 0), 22 + i * 16, 30 + hash(i) * 30, 5);
  }
  c.fillStyle = "#1f6feb";
  c.fillRect(0, 16 + 2 * 16, 3, 14);
  c.fillStyle = "#161b22";
  c.fillRect(w * 0.2, 0, w, 14);
  c.fillStyle = "#0d1117";
  c.fillRect(w * 0.2 + 4, 2, 70, 12);
  text(c, "page.tsx", w * 0.2 + 10, 8, 8, "#e6edf3");

  const colors = ["#ff7b72", "#79c0ff", "#d2a8ff", "#7ee787", "#ffa657", "#8b949e"];
  const scroll = idle ? 48 : Math.floor(t * 1.6);
  const rows = Math.floor((h - 30) / 13);
  for (let row = 0; row < rows; row++) {
    const line = row + scroll;
    const y = 24 + row * 13;
    text(c, String(line + 1).padStart(3, " "), w * 0.2 + 18, y, 8, "#484f58", "right");
    let x = w * 0.2 + 28 + (Math.floor(hash(line) * 4) % 4) * 12;
    const words = 1 + Math.floor(hash(line + 0.5) * 4);
    for (let word = 0; word < words; word++) {
      const length = 10 + hash(line * 3 + word) * 50;
      c.fillStyle = colors[Math.floor(hash(line + word * 7) * colors.length)];
      c.fillRect(x, y - 2.5, length, 5);
      x += length + 6;
    }
  }
  if (Math.floor(t * 2) % 2 === 0) {
    c.fillStyle = "#e6edf3";
    c.fillRect(w * 0.2 + 28, 24 + (rows - 1) * 13 - 5, 2, 10);
  }
}

// A Valorant match: a sunny Ascent-style street of arches and terracotta
// roofs, an enemy agent outlined in red who peeks from a crate and goes down
// to a three-shot tap, and the game's HUD around it.
export function drawValorant(c: Context, t: number) {
  const { width: w, height: h } = c.canvas;
  const horizon = h * 0.5;
  const sway = Math.sin(t * 0.7) * 14;

  const sky = c.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, "#7fb3e0");
  sky.addColorStop(1, "#f3d9b0");
  c.fillStyle = sky;
  c.fillRect(0, 0, w, horizon);

  // The far wall of the site, with a big arched doorway.
  const wallX = w / 2 + sway * 0.5;
  c.fillStyle = "#d9c3a0";
  c.fillRect(wallX - 90, horizon - 62, 180, 66);
  c.fillStyle = "#b5543c";
  c.fillRect(wallX - 96, horizon - 70, 192, 9);
  c.fillStyle = "#3a2f28";
  c.beginPath();
  c.moveTo(wallX - 24, horizon + 4);
  c.lineTo(wallX - 24, horizon - 30);
  c.arc(wallX, horizon - 30, 24, Math.PI, 0);
  c.lineTo(wallX + 24, horizon + 4);
  c.fill();

  // Stone ground in perspective.
  c.fillStyle = "#a89a86";
  c.fillRect(0, horizon, w, h - horizon);
  c.strokeStyle = "rgba(60,48,38,0.25)";
  c.lineWidth = 1;
  for (let i = -7; i <= 7; i++) {
    c.beginPath();
    c.moveTo(w / 2 + sway, horizon);
    c.lineTo(w / 2 + i * 64 + sway * 3, h);
    c.stroke();
  }
  for (let k = 1; k < 7; k++) {
    const y = horizon + (h - horizon) * (k / 7) ** 1.6;
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(w, y);
    c.stroke();
  }

  // Buildings down both sides: plaster walls, arches, terracotta roofs.
  for (const side of [-1, 1]) {
    c.fillStyle = side < 0 ? "#cdb38c" : "#e2cfae";
    c.beginPath();
    c.moveTo(w / 2 + side * 92 + sway, horizon - 66);
    c.lineTo(w / 2 + side * w * 0.62 + sway, -10);
    c.lineTo(w / 2 + side * w * 0.62 + sway, h);
    c.lineTo(w / 2 + side * 92 + sway, horizon + 4);
    c.fill();
    c.fillStyle = "#b5543c";
    c.beginPath();
    c.moveTo(w / 2 + side * 92 + sway, horizon - 66);
    c.lineTo(w / 2 + side * w * 0.62 + sway, -10);
    c.lineTo(w / 2 + side * w * 0.62 + sway, 12);
    c.lineTo(w / 2 + side * 92 + sway, horizon - 58);
    c.fill();
    c.fillStyle = "rgba(58,47,40,0.85)";
    for (let k = 0; k < 3; k++) {
      const near = 0.25 + k * 0.25;
      const x = w / 2 + side * (92 + near * (w * 0.62 - 92)) + sway;
      const top = horizon - 50 - near * 60;
      const width = 10 + near * 22;
      c.beginPath();
      c.moveTo(x, horizon + 4 + near * 20);
      c.lineTo(x, top);
      c.arc(x + (side * width) / 2, top, width / 2, Math.PI, 0, side > 0);
      c.lineTo(x + side * width, horizon + 4 + near * 20);
      c.fill();
    }
  }

  // Crates for cover.
  const crate = (x: number, y: number, size: number) => {
    c.fillStyle = "#8a5a32";
    c.fillRect(x, y - size, size * 1.3, size);
    c.strokeStyle = "#5c3b20";
    c.lineWidth = 2;
    c.strokeRect(x + 2, y - size + 2, size * 1.3 - 4, size - 4);
    c.beginPath();
    c.moveTo(x + 2, y - size + 2);
    c.lineTo(x + size * 1.3 - 2, y - 2);
    c.stroke();
  };

  // The enemy peeks out from behind a crate, takes three taps and drops.
  const round = 3.2;
  const index = Math.floor(t / round);
  const cycle = (t % round) / round;
  const shots = [0.42, 0.5, 0.58];
  const firing = shots.some((s) => cycle > s && cycle < s + 0.04);
  const down = cycle > 0.62;
  const ex = w / 2 + Math.sin(index * 2.3) * 55 + sway;
  const ey = horizon + 18;
  if (cycle > 0.12) {
    const peek = Math.min(1, (cycle - 0.12) * 6);
    c.save();
    c.translate(ex + (1 - peek) * 16, ey);
    if (down) c.rotate(Math.min(1, (cycle - 0.62) * 8) * 1.4);
    // Red outline first, then the agent.
    c.fillStyle = "#ff3b4e";
    c.fillRect(-9, -40, 18, 28);
    c.fillRect(-7, -52, 14, 14);
    c.fillStyle = "#2a2d36";
    c.fillRect(-7, -38, 14, 25);
    c.fillStyle = "#c98d5e";
    c.fillRect(-5, -50, 10, 10);
    c.fillStyle = "#3a6df0";
    c.fillRect(-6, -52, 12, 4);
    c.fillStyle = "#22252c";
    c.fillRect(-7, -13, 5, 13);
    c.fillRect(2, -13, 5, 13);
    c.restore();
  }
  crate(ex + 6, ey + 4, 26);
  crate(w * 0.18 + sway * 1.5, h * 0.86, 40);

  // The Vandal, bottom right, kicking on each shot.
  const kick = firing ? 6 : 0;
  c.save();
  c.translate(kick, kick);
  c.fillStyle = "#1a1b20";
  c.beginPath();
  c.moveTo(w * 0.6, h);
  c.lineTo(w * 0.68, h * 0.76);
  c.lineTo(w * 0.9, h * 0.7);
  c.lineTo(w * 0.98, h);
  c.fill();
  c.fillStyle = "#c9a227";
  c.fillRect(w * 0.7, h * 0.74, w * 0.16, 4);
  c.fillStyle = "#2c2e36";
  c.fillRect(w * 0.66, h * 0.72, w * 0.08, 7);
  c.restore();
  if (firing) {
    c.fillStyle = "#ffe08a";
    c.beginPath();
    const fx = w * 0.66 + kick;
    const fy = h * 0.725 + kick;
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 5 : 14;
      const a = (i / 10) * Math.PI * 2;
      c.lineTo(fx + Math.cos(a) * r, fy + Math.sin(a) * r);
    }
    c.fill();
  }

  // Crosshair: a small cyan cross with a dot.
  const cx = w / 2;
  const cy = h / 2;
  c.fillStyle = "#3df5d0";
  c.fillRect(cx - 1, cy - 1, 2, 2);
  for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    c.fillRect(cx + dx * 4 - (dy ? 1 : 0), cy + dy * 4 - (dx ? 1 : 0), dx ? dx * 5 : 2, dy ? dy * 5 : 2);
  }

  // Top: the score, the round timer and both teams' agents.
  const kills = index % 5;
  const ours = 7 + Math.floor(index / 5) % 6;
  const seconds = 100 - (Math.floor(t) % 100);
  c.fillStyle = "rgba(10,14,20,0.7)";
  c.fillRect(w / 2 - 40, 4, 80, 22);
  text(c, String(ours), w / 2 - 28, 15, 12, "#3df5d0", "center");
  text(c, `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`, w / 2, 15, 10, "#ffffff", "center");
  text(c, "5", w / 2 + 28, 15, 12, "#ff4655", "center");
  for (let i = 0; i < 5; i++) {
    c.fillStyle = "rgba(61,245,208,0.75)";
    c.fillRect(w / 2 - 52 - (i + 1) * 15, 7, 13, 16);
    const dead = i < kills || (i === kills && down);
    c.fillStyle = dead ? "rgba(90,90,90,0.8)" : "rgba(255,70,85,0.8)";
    c.fillRect(w / 2 + 54 + i * 15, 7, 13, 16);
  }

  // Minimap, top left.
  c.fillStyle = "rgba(10,14,20,0.6)";
  c.fillRect(6, 6, 46, 46);
  c.strokeStyle = "rgba(255,255,255,0.35)";
  c.lineWidth = 2;
  c.strokeRect(14, 14, 30, 30);
  c.beginPath();
  c.moveTo(29, 14);
  c.lineTo(29, 44);
  c.stroke();
  c.fillStyle = "#3df5d0";
  c.beginPath();
  c.moveTo(29, 33);
  c.lineTo(25, 40);
  c.lineTo(33, 40);
  c.fill();
  if (!down && cycle > 0.12) {
    c.fillStyle = "#ff4655";
    c.fillRect(27 + Math.sin(index) * 6, 18, 4, 4);
  }

  // Bottom: health and armour, abilities, ammo.
  c.fillStyle = "rgba(10,14,20,0.65)";
  c.fillRect(w / 2 - 90, h - 24, 64, 18);
  text(c, "100", w / 2 - 70, h - 15, 12, "#ffffff", "center");
  text(c, "50", w / 2 - 40, h - 15, 9, "#9fd9ff", "center");
  ["C", "Q", "E", "X"].forEach((key, i) => {
    const x = w / 2 - 18 + i * 22;
    c.fillStyle = i === 3 ? "rgba(255,214,90,0.25)" : "rgba(10,14,20,0.65)";
    c.fillRect(x, h - 26, 18, 20);
    text(c, key, x + 9, h - 16, 8, i === 3 ? "#ffd65a" : "#d8dde6", "center");
  });
  const ammo = 25 - shots.filter((s) => cycle > s).length;
  text(c, String(ammo), w - 40, h - 16, 14, "#ffffff", "right");
  text(c, "/ 75", w - 10, h - 15, 8, "#b5bac1", "right");

  // Kill feed, and the kill banner.
  if (down) {
    c.fillStyle = "rgba(10,14,20,0.65)";
    c.fillRect(w - 126, 30, 120, 14);
    text(c, "MARC", w - 120, 37, 8, "#3df5d0");
    text(c, "VANDAL ✕", w - 80, 37, 7, "#ffffff");
    text(c, "ENEMY", w - 10, 37, 8, "#ff4655", "right");
    const pop = Math.min(1, (cycle - 0.62) * 10);
    c.globalAlpha = pop;
    c.strokeStyle = "#ffd65a";
    c.lineWidth = 2;
    c.beginPath();
    c.arc(w / 2, h * 0.7, 10 + pop * 4, 0, Math.PI * 2);
    c.stroke();
    text(c, kills + 1 >= 5 ? "ACE" : `${kills + 1}`, w / 2, h * 0.7, 9, "#ffd65a", "center");
    c.globalAlpha = 1;
  }
}

// The screen when the PC is asleep or off.
export function drawStandby(c: Context) {
  clear(c, "#030304");
}

// ── Side monitor ───────────────────────────────────────────────────────

// A browser preview of the site being worked on.
export function drawPreview(c: Context, t: number) {
  const { width: w, height: h } = c.canvas;
  clear(c, "#f4f4f2");
  c.fillStyle = "#e4e4e1";
  c.fillRect(0, 0, w, 14);
  for (const [i, color] of ["#ff5f57", "#febc2e", "#28c840"].entries()) {
    c.fillStyle = color;
    c.beginPath();
    c.arc(9 + i * 9, 7, 3, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = "#111";
  c.fillRect(14, 28, w * 0.5, 10);
  c.fillStyle = "#777";
  c.fillRect(14, 44, w * 0.7, 5);
  c.fillRect(14, 54, w * 0.6, 5);
  c.fillStyle = "#111";
  c.fillRect(14, 66, 46, 12);
  for (let i = 0; i < 3; i++) {
    c.fillStyle = ["#c7d2fe", "#fde68a", "#bbf7d0"][i];
    c.fillRect(14 + i * ((w - 28) / 3), 92, (w - 28) / 3 - 8, h - 104);
  }
  if (Math.floor(t) % 4 === 0) {
    c.fillStyle = "rgba(31,111,235,0.25)";
    c.fillRect(12, 26, w * 0.5 + 4, 14);
  }
}

// A terminal running the dev server.
export function drawTerminal(c: Context, t: number) {
  const { width: w, height: h } = c.canvas;
  clear(c, "#0b0e14");
  const lines = [
    ["#7ee787", "▲ Next.js ready"],
    ["#8b949e", "○ Compiling /desk ..."],
    ["#7ee787", "✓ Compiled in 412ms"],
    ["#8b949e", "GET /desk 200"],
    ["#79c0ff", "✓ 38 tests passed"],
  ];
  const shown = Math.min(lines.length, 1 + Math.floor(t * 0.8) % (lines.length + 2));
  lines.slice(0, shown).forEach(([color, value], i) => text(c, value, 10, 16 + i * 16, 9, color));
  if (Math.floor(t * 2) % 2 === 0) {
    c.fillStyle = "#e6edf3";
    c.fillRect(10, 16 + shown * 16 - 5, 6, 10);
  }
  void w;
  void h;
}

// Team comms on the side screen while he plays.
const callouts = [
  ["Jett", "#7ee787", "two B main, one lurking"],
  ["Sage", "#79c0ff", "rotating to A, wall's ready"],
  ["Marc", "#3df5d0", "planting, cover me"],
  ["Omen", "#d2a8ff", "smokes are up"],
  ["Reyna", "#ff8fb1", "nice one Marc!!"],
  ["Jett", "#7ee787", "spike down A site"],
  ["Sage", "#79c0ff", "I can res you"],
  ["Marc", "#3df5d0", "last one is heaven"],
];

export function drawChat(c: Context, t: number) {
  const { height: h } = c.canvas;
  clear(c, "#1e1f22");
  c.fillStyle = "#2b2d31";
  c.fillRect(0, 0, 40, h);
  for (let i = 0; i < 4; i++) {
    c.fillStyle = ["#ff4655", "#3ba55d", "#faa61a", "#5865f2"][i];
    c.beginPath();
    c.arc(20, 18 + i * 28, 10, 0, Math.PI * 2);
    c.fill();
  }
  text(c, "# team-valorant", 50, 12, 9, "#f2f3f5");
  const offset = Math.floor(t * 0.5);
  for (let row = 0; row < 6; row++) {
    const [name, color, line] = callouts[(row + offset) % callouts.length];
    const y = 32 + row * 21;
    text(c, name, 50, y, 9, color);
    text(c, line, 50, y + 10, 8, "#b5bac1");
  }
}

// ── Window ─────────────────────────────────────────────────────────────

// Sky, sun or moon, stars, and a row of houses whose windows light up at
// night. `light` is 0 at night and 1 in full day.
// How grey the sky gets in each kind of weather.
const overcast: Record<WeatherKind, number> = { clear: 0, cloudy: 0.45, rain: 0.7, storm: 0.85 };

export function drawWindowView(c: Context, light: number, weather: WeatherKind = "clear", t = 0, flash = 0) {
  const { width: w, height: h } = c.canvas;
  const mix = (a: number[], b: number[]) =>
    a.map((v, i) => Math.round(v + (b[i] - v) * light));
  const grey = overcast[weather];
  const toGrey = (rgb: number[], target: number) => rgb.map((v) => Math.round(v + (target * (0.35 + light * 0.65) - v) * grey));
  const top = toGrey(mix([8, 16, 40], [96, 165, 235]), 120);
  const bottom = toGrey(mix([24, 34, 70], [200, 228, 250]), 165);
  const dusk = light > 0.05 && light < 0.7 ? (1 - Math.abs(light - 0.35) / 0.35) * 0.6 : 0;
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, `rgb(${top.join(",")})`);
  g.addColorStop(0.75, `rgb(${bottom.join(",")})`);
  g.addColorStop(1, `rgba(242,164,107,${dusk})`);
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);

  if (light < 0.35 && grey < 0.5) {
    c.fillStyle = "#ffffff";
    for (let i = 0; i < 26; i++) {
      c.globalAlpha = (1 - light / 0.35) * (0.4 + hash(i) * 0.6);
      c.fillRect(hash(i + 1) * w, hash(i + 2) * h * 0.6, 2, 2);
    }
    c.globalAlpha = 1;
  }
  if (grey < 0.6) {
    c.globalAlpha = 1 - grey;
    c.fillStyle = light > 0.5 ? "#fff3b0" : "#f2f0d0";
    c.beginPath();
    c.arc(w * 0.72, h * (0.28 - light * 0.08), light > 0.5 ? 16 : 13, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 1;
  }

  // Clouds drifting by, more and darker the worse it gets.
  if (grey > 0) {
    const shade = Math.round((60 + light * 150) * (1 - grey * 0.35));
    c.fillStyle = `rgba(${shade},${shade + 4},${shade + 10},${0.55 + grey * 0.4})`;
    const count = Math.round(3 + grey * 6);
    for (let i = 0; i < count; i++) {
      const cw = 60 + hash(i + 20) * 70;
      const cx = ((hash(i + 30) * (w + cw) + t * (4 + hash(i) * 6)) % (w + cw * 2)) - cw;
      const cy = 14 + hash(i + 40) * h * 0.35;
      for (let k = 0; k < 4; k++) {
        c.beginPath();
        c.ellipse(cx + k * cw * 0.22, cy + Math.sin(k * 2.1) * 5, cw * 0.24, 12 + hash(i + k) * 8, 0, 0, Math.PI * 2);
        c.fill();
      }
    }
  }

  // Houses and a church tower, darker at night with lit windows.
  const roof = mix([22, 26, 40], [92, 104, 124]);
  const wall = mix([30, 34, 50], [140, 150, 165]);
  let x = -6;
  let i = 0;
  while (x < w) {
    const bw = 30 + hash(i) * 34;
    const bh = 26 + hash(i + 9) * 36 + (i === 3 ? 30 : 0);
    const y = h - bh;
    c.fillStyle = `rgb(${wall.join(",")})`;
    c.fillRect(x, y, bw, bh);
    c.fillStyle = `rgb(${roof.join(",")})`;
    c.beginPath();
    c.moveTo(x - 3, y);
    c.lineTo(x + bw / 2, y - 12);
    c.lineTo(x + bw + 3, y);
    c.fill();
    for (let wy = y + 8; wy < h - 6; wy += 12) {
      for (let wx = x + 5; wx < x + bw - 8; wx += 10) {
        const lit = light < 0.4 && hash(wx * 3 + wy) > 0.45;
        c.fillStyle = lit ? "#ffd27a" : `rgba(0,0,0,${0.15 + light * 0.1})`;
        c.fillRect(wx, wy, 5, 6);
      }
    }
    x += bw + 4;
    i++;
  }

  // Rain streaks, slanting in the wind, and lightning.
  if (weather === "rain" || weather === "storm") {
    c.strokeStyle = `rgba(200,215,235,${0.35 + light * 0.2})`;
    c.lineWidth = 1;
    const drops = weather === "storm" ? 90 : 60;
    c.beginPath();
    for (let i = 0; i < drops; i++) {
      const speed = 160 + hash(i + 50) * 80;
      const y = ((hash(i + 60) * h + t * speed) % (h + 20)) - 20;
      const x0 = ((hash(i + 70) * w + y * 0.25) % w);
      c.moveTo(x0, y);
      c.lineTo(x0 - 4, y + 14);
    }
    c.stroke();
  }
  if (flash > 0) {
    c.fillStyle = `rgba(235,240,255,${flash * 0.85})`;
    c.fillRect(0, 0, w, h);
  }
}

// The poster on the wall.
export function drawPoster(c: Context) {
  const { width: w, height: h } = c.canvas;
  clear(c, "#111318");
  c.strokeStyle = "#34d399";
  c.lineWidth = 3;
  c.strokeRect(8, 8, w - 16, h - 16);
  text(c, "SHIP", w / 2, h * 0.38, 30, "#f4f4f5", "center");
  text(c, "IT.", w / 2, h * 0.6, 30, "#34d399", "center");
  text(c, "git push origin main", w / 2, h * 0.82, 8, "#71717a", "center");
}

// ── Anime at meal times ────────────────────────────────────────────────

// An episode of a made-up anime, "Sakura Signal": a rooftop at sunset with
// cherry blossoms, a fight full of speed lines, then ramen at a night stall,
// each with subtitles. Returns the scene's main colour, which tints the room.
const animeScenes = [
  { glow: "#ff9ec4", lines: ["Promise me we'll meet here again.", "…even if the whole city forgets us."] },
  { glow: "#6fb8ff", lines: ["I'm not done yet!!", "This is the power of everyone who believed in me!"] },
  { glow: "#ffb35c", lines: ["Itadakimasu!", "…it's even better than last time."] },
];

// A character in silhouette: spiky hair, a scarf blowing in the wind.
function hero(c: Context, x: number, y: number, scale: number, t: number, color = "#1a1426") {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  c.fillStyle = color;
  c.fillRect(-7, -38, 14, 30);
  c.fillRect(-7, -8, 5, 18);
  c.fillRect(2, -8, 5, 18);
  c.beginPath();
  c.arc(0, -46, 9, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = Math.PI + (i / 5) * Math.PI;
    c.lineTo(Math.cos(a) * 9, -48 + Math.sin(a) * 9);
    c.lineTo(Math.cos(a + 0.3) * 16, -50 + Math.sin(a + 0.3) * 15);
  }
  c.fill();
  c.fillStyle = "#e5484d";
  c.beginPath();
  c.moveTo(-6, -38);
  c.quadraticCurveTo(-22, -36 + Math.sin(t * 6) * 4, -34, -30 + Math.sin(t * 6 + 1) * 6);
  c.lineTo(-30, -26 + Math.sin(t * 6 + 1) * 6);
  c.quadraticCurveTo(-18, -32, -6, -33);
  c.fill();
  c.restore();
}

export function drawAnime(c: Context, t: number) {
  const { width: w, height: h } = c.canvas;
  const sceneLength = 9;
  const index = Math.floor(t / sceneLength) % animeScenes.length;
  const local = t % sceneLength;
  const bar = 26;
  const top = bar;
  const bottom = h - bar;
  const view = bottom - top;
  clear(c, "#000");
  c.save();
  c.beginPath();
  c.rect(0, top, w, view);
  c.clip();

  if (index === 0) {
    // School rooftop at sunset, blossoms drifting across.
    const sky = c.createLinearGradient(0, top, 0, bottom);
    sky.addColorStop(0, "#5b3a8c");
    sky.addColorStop(0.5, "#f08aa6");
    sky.addColorStop(1, "#ffd39a");
    c.fillStyle = sky;
    c.fillRect(0, top, w, view);
    c.fillStyle = "rgba(255,240,210,0.9)";
    c.beginPath();
    c.arc(w * 0.7, top + view * 0.62, 30, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#2a1f3d";
    for (let i = 0; i < 9; i++) c.fillRect(i * 48 - 10, bottom - 40 - hash(i) * 40, 40, 80);
    c.fillStyle = "#3b2d52";
    c.fillRect(0, bottom - 22, w, 22);
    c.strokeStyle = "#3b2d52";
    c.lineWidth = 2;
    for (let x = 0; x < w; x += 14) {
      c.beginPath();
      c.moveTo(x, bottom - 22);
      c.lineTo(x, bottom - 50);
      c.stroke();
    }
    c.fillRect(0, bottom - 52, w, 3);
    hero(c, w * 0.3, bottom - 22, 1.1, t);
    hero(c, w * 0.42, bottom - 22, 1.0, t + 2, "#241a33");
    c.fillStyle = "#ffc1d6";
    for (let i = 0; i < 36; i++) {
      const x = (((hash(i) * w - t * (20 + hash(i + 2) * 30)) % w) + w) % w;
      const y = top + ((hash(i + 5) * view + t * (12 + hash(i + 7) * 14)) % view);
      c.beginPath();
      c.ellipse(x, y, 3, 1.6, t + i, 0, Math.PI * 2);
      c.fill();
    }
  } else if (index === 1) {
    // The big fight: speed lines, an aura and an impact flash.
    c.fillStyle = "#0d1a3a";
    c.fillRect(0, top, w, view);
    const cx = w / 2;
    const cy = top + view * 0.55;
    c.strokeStyle = "rgba(160,205,255,0.5)";
    c.lineWidth = 2;
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2 + hash(i) * 0.1;
      const r0 = 50 + hash(i + Math.floor(t * 12)) * 40;
      c.beginPath();
      c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      c.lineTo(cx + Math.cos(a) * 320, cy + Math.sin(a) * 320);
      c.stroke();
    }
    const aura = c.createRadialGradient(cx, cy, 4, cx, cy, 70);
    aura.addColorStop(0, "rgba(140,220,255,0.95)");
    aura.addColorStop(1, "rgba(60,120,255,0)");
    c.fillStyle = aura;
    c.beginPath();
    c.arc(cx, cy, 70 + Math.sin(t * 20) * 4, 0, Math.PI * 2);
    c.fill();
    hero(c, cx, cy + 34, 1.4, t, "#0a0f1f");
    // A slash across the frame, and a white impact frame.
    const slash = (local * 1.5) % 3;
    if (slash < 0.4) {
      c.strokeStyle = "rgba(255,255,255,0.9)";
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(w * 0.1, top + view * 0.2 + slash * 80);
      c.lineTo(w * 0.9, top + view * 0.8 - slash * 40);
      c.stroke();
    }
    if (slash > 0.4 && slash < 0.5) {
      c.fillStyle = "rgba(255,255,255,0.85)";
      c.fillRect(0, top, w, view);
    }
  } else {
    // Ramen at a night stall: lanterns, steam, two friends at the counter.
    c.fillStyle = "#151a33";
    c.fillRect(0, top, w, view);
    c.fillStyle = "#2a1f2f";
    c.fillRect(w * 0.15, top + view * 0.25, w * 0.7, view * 0.75);
    c.fillStyle = "#b5543c";
    c.fillRect(w * 0.12, top + view * 0.2, w * 0.76, 14);
    for (let i = 0; i < 4; i++) {
      const x = w * 0.22 + i * w * 0.19;
      const glow = c.createRadialGradient(x, top + view * 0.38, 2, x, top + view * 0.38, 26);
      glow.addColorStop(0, "rgba(255,120,80,0.9)");
      glow.addColorStop(1, "rgba(255,120,80,0)");
      c.fillStyle = glow;
      c.fillRect(x - 26, top + view * 0.38 - 26, 52, 52);
      c.fillStyle = "#e5484d";
      c.beginPath();
      c.ellipse(x, top + view * 0.38, 8, 11, 0, 0, Math.PI * 2);
      c.fill();
    }
    // The friends sit behind the counter.
    hero(c, w * 0.4, bottom - 24, 0.9, t, "#0d0a14");
    hero(c, w * 0.58, bottom - 24, 0.9, t + 1, "#0d0a14");
    c.fillStyle = "#6b4a2b";
    c.fillRect(w * 0.12, bottom - 34, w * 0.76, 34);
    for (const x of [w * 0.44, w * 0.62]) {
      c.fillStyle = "#f2efe8";
      c.beginPath();
      c.ellipse(x, bottom - 36, 12, 5, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "rgba(255,255,255,0.35)";
      c.lineWidth = 2;
      for (let k = 0; k < 3; k++) {
        c.beginPath();
        c.moveTo(x - 6 + k * 6, bottom - 42);
        c.bezierCurveTo(x - 10 + k * 6, bottom - 52, x + k * 6, bottom - 58, x - 4 + k * 6, bottom - 66 - Math.sin(t * 3 + k) * 4);
        c.stroke();
      }
    }
  }
  c.restore();

  // Episode title card at the start of each scene, then subtitles.
  const scene = animeScenes[index];
  if (local < 1.6) {
    c.fillStyle = "rgba(0,0,0,0.55)";
    c.fillRect(0, top + view / 2 - 20, w, 40);
    text(c, `EPISODE ${12 + index}`, w / 2, top + view / 2 - 6, 9, "#ffc1d6", "center");
    c.fillStyle = "#ffffff";
    c.font = "600 14px system-ui, sans-serif";
    c.textAlign = "center";
    c.fillText(["The Last Spring", "Signal Fire", "One More Bowl"][index], w / 2, top + view / 2 + 10);
  }
  const line = scene.lines[local < sceneLength / 2 ? 0 : 1];
  c.fillStyle = "#f2f2f2";
  c.font = "600 13px system-ui, sans-serif";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(line, w / 2, h - bar / 2);
  const fade = Math.max(0, 1 - local / 0.5, 1 - (sceneLength - local) / 0.5);
  if (fade > 0) {
    c.fillStyle = `rgba(0,0,0,${fade})`;
    c.fillRect(0, top, w, view);
  }
  return scene.glow;
}

// The side screen during the episode: what's playing.
export function drawNowPlaying(c: Context, t: number) {
  const { width: w, height: h } = c.canvas;
  clear(c, "#0c0c10");
  const art = c.createLinearGradient(0, 0, 70, 90);
  art.addColorStop(0, "#f08aa6");
  art.addColorStop(1, "#5b3a8c");
  c.fillStyle = art;
  c.fillRect(14, 14, 54, 74);
  c.fillStyle = "#ffc1d6";
  for (let i = 0; i < 6; i++) c.fillRect(18 + hash(i) * 44, 18 + hash(i + 3) * 60, 3, 2);
  text(c, "NOW WATCHING", 80, 20, 9, "#8a8f9c");
  text(c, "Sakura Signal", 80, 40, 15, "#f2f2f2");
  text(c, "Season 2 · Episode 12", 80, 58, 9, "#c9ccd4");
  text(c, "Anime · Sub", 80, 72, 9, "#8a8f9c");
  c.fillStyle = "#2a2d36";
  c.fillRect(14, h - 34, w - 28, 4);
  c.fillStyle = "#ff8fb1";
  c.fillRect(14, h - 34, (0.3 + ((t / 1440) % 0.6)) * (w - 28), 4);
  text(c, "▶  14:08 / 23:40", 14, h - 18, 9, "#c9ccd4");
  text(c, "🍚 Meal break", w - 14, h - 18, 9, "#c9ccd4", "right");
}
