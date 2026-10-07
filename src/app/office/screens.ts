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

// A first-person shooter: town street, an enemy that drops when hit, a gun
// with recoil and muzzle flash, crosshair, hit marker and HUD.
export function drawShooter(c: Context, t: number) {
  const { width: w, height: h } = c.canvas;
  const horizon = h * 0.52;
  const sky = c.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, "#3d6ea8");
  sky.addColorStop(1, "#e8b27a");
  c.fillStyle = sky;
  c.fillRect(0, 0, w, horizon);
  const sway = Math.sin(t * 0.7) * 18;

  // Buildings on both sides, and a far skyline.
  for (let i = 0; i < 12; i++) {
    const bw = 18 + hash(i) * 26;
    const bh = 20 + hash(i + 3) * 40;
    c.fillStyle = `hsl(${210 + hash(i) * 20} 18% ${18 + hash(i + 1) * 10}%)`;
    c.fillRect(((i * 37 + sway * 0.4) % (w + 40)) - 20, horizon - bh, bw, bh);
  }
  c.fillStyle = "#5b5144";
  c.fillRect(0, horizon, w, h - horizon);
  c.strokeStyle = "rgba(255,255,255,0.12)";
  c.lineWidth = 1;
  for (let i = -6; i <= 6; i++) {
    c.beginPath();
    c.moveTo(w / 2 + sway, horizon);
    c.lineTo(w / 2 + i * 70 + sway * 3, h);
    c.stroke();
  }
  for (const side of [-1, 1]) {
    c.fillStyle = side < 0 ? "#2b2f38" : "#343a45";
    c.beginPath();
    c.moveTo(w / 2 + side * 40 + sway, horizon - 30);
    c.lineTo(w / 2 + side * w * 0.62 + sway, -10);
    c.lineTo(w / 2 + side * w * 0.62 + sway, h);
    c.lineTo(w / 2 + side * 40 + sway, horizon + 4);
    c.fill();
  }

  // The enemy steps out, takes three shots and drops, every few seconds.
  const round = 3.2;
  const cycle = (t % round) / round;
  const shots = [0.42, 0.5, 0.58];
  const firing = shots.some((s) => cycle > s && cycle < s + 0.04);
  const down = cycle > 0.62;
  const ex = w / 2 + Math.sin(Math.floor(t / round) * 2.3) * 60 + sway;
  const ey = horizon + 6;
  if (cycle > 0.12) {
    c.save();
    c.translate(ex, ey);
    if (down) c.rotate(Math.min(1, (cycle - 0.62) * 8) * 1.4);
    c.fillStyle = "#8f2a2a";
    c.fillRect(-7, -34, 14, 22);
    c.fillStyle = "#c98d5e";
    c.fillRect(-5, -44, 10, 10);
    c.fillStyle = "#2c2c2c";
    c.fillRect(-7, -12, 5, 12);
    c.fillRect(2, -12, 5, 12);
    c.restore();
  }

  // Gun, bottom right, kicking back on each shot.
  const kick = firing ? 6 : 0;
  c.fillStyle = "#1c1e22";
  c.beginPath();
  c.moveTo(w * 0.62 + kick, h);
  c.lineTo(w * 0.7 + kick, h * 0.74 + kick);
  c.lineTo(w * 0.86 + kick, h * 0.7 + kick);
  c.lineTo(w * 0.96 + kick, h);
  c.fill();
  c.fillStyle = "#2f333a";
  c.fillRect(w * 0.69 + kick, h * 0.7 + kick, w * 0.12, 8);
  c.fillStyle = "#c98d5e";
  c.fillRect(w * 0.78 + kick, h * 0.86, 22, 18);
  if (firing) {
    c.fillStyle = "#ffe08a";
    c.beginPath();
    const fx = w * 0.69 + kick;
    const fy = h * 0.71 + kick;
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 6 : 16;
      const a = (i / 10) * Math.PI * 2;
      c.lineTo(fx + Math.cos(a) * r, fy + Math.sin(a) * r);
    }
    c.fill();
  }

  // Crosshair, and a hit marker right after each shot.
  c.strokeStyle = "#ffffff";
  c.lineWidth = 2;
  const cx = w / 2;
  const cy = h / 2;
  for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    c.beginPath();
    c.moveTo(cx + dx * 4, cy + dy * 4);
    c.lineTo(cx + dx * 11, cy + dy * 11);
    c.stroke();
  }
  if (shots.some((s) => cycle > s && cycle < s + 0.08)) {
    c.strokeStyle = "#ff4d4d";
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      c.beginPath();
      c.moveTo(cx + dx * 6, cy + dy * 6);
      c.lineTo(cx + dx * 12, cy + dy * 12);
      c.stroke();
    }
  }

  // HUD: health, ammo, minimap, kill feed.
  const ammo = 30 - shots.filter((s) => cycle > s).length - (Math.floor(t / round) * 3) % 24;
  c.fillStyle = "rgba(0,0,0,0.45)";
  c.fillRect(8, h - 26, 90, 18);
  c.fillStyle = "#3ddc84";
  c.fillRect(12, h - 21, 60, 8);
  text(c, "100", 78, h - 17, 9, "#ffffff");
  text(c, `${ammo} / 90`, w - 12, h - 17, 11, "#ffffff", "right");
  c.fillStyle = "rgba(0,0,0,0.45)";
  c.beginPath();
  c.arc(26, 26, 18, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#3ddc84";
  c.fillRect(25, 25, 3, 3);
  if (!down) {
    c.fillStyle = "#ff4d4d";
    c.fillRect(30 + Math.sin(t) * 6, 16, 3, 3);
  }
  if (down) {
    c.fillStyle = "rgba(0,0,0,0.45)";
    c.fillRect(w - 120, 8, 112, 14);
    text(c, "MARC  ⌖  enemy", w - 14, 15, 8, "#ffffff", "right");
  }
}

// A video playing while eating.
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

// Team chat beside the game.
export function drawChat(c: Context, t: number) {
  const { width: w, height: h } = c.canvas;
  clear(c, "#1e1f22");
  c.fillStyle = "#2b2d31";
  c.fillRect(0, 0, 40, h);
  for (let i = 0; i < 4; i++) {
    c.fillStyle = ["#5865f2", "#3ba55d", "#faa61a", "#ed4245"][i];
    c.beginPath();
    c.arc(20, 18 + i * 28, 10, 0, Math.PI * 2);
    c.fill();
  }
  const names = ["#f47fff", "#7ee787", "#79c0ff", "#ffa657"];
  const offset = Math.floor(t * 0.6);
  for (let row = 0; row < 7; row++) {
    const k = row + offset;
    c.fillStyle = names[k % names.length];
    c.fillRect(50, 12 + row * 20, 26, 5);
    c.fillStyle = "#b5bac1";
    c.fillRect(80, 12 + row * 20, 20 + hash(k) * (w - 110), 5);
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

// ── Movie night ────────────────────────────────────────────────────────

// A short looping film for meal times: three scenes in widescreen with
// subtitles. Returns the scene's main colour, which tints the room.
const movieScenes = [
  { glow: "#ff9a5c", lines: ["We made it. Look at that view.", "Same time next year?"] },
  { glow: "#5c8cff", lines: ["Left at the bridge. Go, go!", "We lost them… I think."] },
  { glow: "#b48cff", lines: ["Engines at ninety percent.", "Home is that small blue dot."] },
];

export function drawMovie(c: Context, t: number) {
  const { width: w, height: h } = c.canvas;
  const sceneLength = 9;
  const index = Math.floor(t / sceneLength) % movieScenes.length;
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
    // Sunset over the sea, two friends on a cliff.
    const sky = c.createLinearGradient(0, top, 0, bottom);
    sky.addColorStop(0, "#3b1d4a");
    sky.addColorStop(0.55, "#e2703a");
    sky.addColorStop(1, "#f6c27a");
    c.fillStyle = sky;
    c.fillRect(0, top, w, view);
    c.fillStyle = "#ffe2a8";
    c.beginPath();
    c.arc(w * 0.62, top + view * 0.62 + local * 1.5, 26, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#2a3d66";
    c.fillRect(0, top + view * 0.68, w, view);
    c.strokeStyle = "rgba(255,214,160,0.55)";
    c.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const y = top + view * 0.72 + i * 9;
      const x = ((t * 18 + i * 53) % (w + 80)) - 40;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + 40, y);
      c.stroke();
    }
    c.fillStyle = "#14101c";
    c.beginPath();
    c.moveTo(0, bottom);
    c.lineTo(0, top + view * 0.55);
    c.lineTo(w * 0.3, top + view * 0.6);
    c.lineTo(w * 0.36, bottom);
    c.fill();
    for (const [x, height] of [[w * 0.16, 30], [w * 0.21, 26]]) {
      c.fillRect(x - 4, top + view * 0.57 - height, 8, height);
      c.beginPath();
      c.arc(x, top + view * 0.57 - height - 5, 6, 0, Math.PI * 2);
      c.fill();
    }
  } else if (index === 1) {
    // A night chase through the city.
    c.fillStyle = "#0b1230";
    c.fillRect(0, top, w, view);
    for (const [speed, shade, base] of [[20, "#18224a", 0.35], [55, "#0e1533", 0.2]] as const) {
      c.fillStyle = shade;
      for (let i = 0; i < 12; i++) {
        const width = 34 + ((i * 37) % 30);
        const x = ((i * 60 - t * speed) % (w + 120) + w + 120) % (w + 120) - 60;
        const height = view * (base + ((i * 13) % 7) / 18);
        c.fillRect(x, bottom - 30 - height, width, height);
        c.fillStyle = "rgba(255,214,120,0.6)";
        for (let k = 0; k < 4; k++) c.fillRect(x + 6 + (k % 2) * 14, bottom - 30 - height + 10 + k * 14, 5, 6);
        c.fillStyle = shade;
      }
    }
    c.fillStyle = "#05070f";
    c.fillRect(0, bottom - 30, w, 30);
    const carX = w * 0.35 + Math.sin(t * 2) * 12;
    c.fillStyle = "#c8323c";
    c.fillRect(carX, bottom - 44, 70, 16);
    c.fillRect(carX + 14, bottom - 56, 40, 14);
    c.fillStyle = "#111";
    for (const x of [carX + 14, carX + 56]) {
      c.beginPath();
      c.arc(x, bottom - 28, 7, 0, Math.PI * 2);
      c.fill();
    }
    const beam = c.createLinearGradient(carX + 70, 0, carX + 200, 0);
    beam.addColorStop(0, "rgba(255,240,200,0.55)");
    beam.addColorStop(1, "rgba(255,240,200,0)");
    c.fillStyle = beam;
    c.beginPath();
    c.moveTo(carX + 70, bottom - 40);
    c.lineTo(carX + 210, bottom - 60);
    c.lineTo(carX + 210, bottom - 18);
    c.fill();
  } else {
    // Out in space, heading home.
    c.fillStyle = "#06040f";
    c.fillRect(0, top, w, view);
    for (let i = 0; i < 70; i++) {
      const x = (((hash(i) * w - t * (10 + hash(i + 9) * 50)) % w) + w) % w;
      const y = top + hash(i + 3) * view;
      c.fillStyle = `rgba(255,255,255,${0.3 + hash(i + 5) * 0.7})`;
      c.fillRect(x, y, 1.5, 1.5);
    }
    const planet = c.createRadialGradient(w * 0.75, top + view * 0.4, 4, w * 0.75, top + view * 0.45, 46);
    planet.addColorStop(0, "#9fd0ff");
    planet.addColorStop(1, "#1d3f8a");
    c.fillStyle = planet;
    c.beginPath();
    c.arc(w * 0.75, top + view * 0.45, 40, 0, Math.PI * 2);
    c.fill();
    const shipX = w * 0.25 + local * 6;
    const shipY = top + view * 0.55 + Math.sin(t * 1.5) * 6;
    c.fillStyle = "#d9dde6";
    c.beginPath();
    c.moveTo(shipX + 34, shipY);
    c.lineTo(shipX - 16, shipY - 10);
    c.lineTo(shipX - 16, shipY + 10);
    c.fill();
    c.fillStyle = `rgba(180,140,255,${0.6 + Math.sin(t * 20) * 0.3})`;
    c.fillRect(shipX - 28, shipY - 4, 12, 8);
  }
  c.restore();

  // Subtitles in the bottom bar, two lines per scene.
  const scene = movieScenes[index];
  const line = scene.lines[local < sceneLength / 2 ? 0 : 1];
  c.fillStyle = "#f2f2f2";
  c.font = "600 13px system-ui, sans-serif";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(line, w / 2, h - bar / 2);
  // Fade between scenes.
  const fade = Math.max(0, 1 - local / 0.6, 1 - (sceneLength - local) / 0.6);
  if (fade > 0) {
    c.fillStyle = `rgba(0,0,0,${fade})`;
    c.fillRect(0, top, w, view);
  }
  return scene.glow;
}

// The side screen during the movie: what's playing.
export function drawNowPlaying(c: Context, t: number) {
  const { width: w, height: h } = c.canvas;
  clear(c, "#0c0c10");
  text(c, "NOW PLAYING", 14, 20, 9, "#8a8f9c");
  text(c, "Small Blue Dot", 14, 42, 16, "#f2f2f2");
  text(c, "2026 · Adventure · 2h 01m", 14, 62, 9, "#8a8f9c");
  c.fillStyle = "#2a2d36";
  c.fillRect(14, h - 34, w - 28, 4);
  c.fillStyle = "#e5484d";
  c.fillRect(14, h - 34, (0.42 + ((t / 7260) % 0.5)) * (w - 28), 4);
  text(c, "▶  52:14", 14, h - 18, 9, "#c9ccd4");
  text(c, "🍚 Meal break", w - 14, h - 18, 9, "#c9ccd4", "right");
}

