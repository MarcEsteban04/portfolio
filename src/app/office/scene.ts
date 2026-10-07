// A low-poly isometric office with a blocky Marc in it, built entirely from
// shapes in code (no downloaded models). The React side creates it once and
// then only calls the setters below.
//
// Coordinates: y is up, the back wall is at z = -3 and the left wall at
// x = -3; the camera looks in from the front right.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  drawAnime,
  drawChat,
  drawConsoleGame,
  drawPolaroidPhoto,
  drawEditor,
  drawNowPlaying,
  drawPoster,
  drawPreview,
  drawStandby,
  drawTerminal,
  drawValorant,
  drawWindowView,
} from "@/app/office/screens";
import { createCat, LITTER, mochi, tilapya, type CatMode } from "@/app/office/cat";
import { createSound } from "@/app/office/sound";
import { shelfBooks } from "@/app/office/shelf";
import { box, canvasTexture, cylinder, mat, puffTexture, pulse, rounded, smooth } from "@/app/office/shapes";
import type { Discovery } from "@/lib/discoveries";
import type { Activity } from "@/lib/office";
import type { WeatherKind } from "@/lib/weather";

export type OfficeScene = {
  setActivity(activity: Activity): void;
  setDaylight(amount: number): void;
  setClock(minutesAfterMidnight: number): void;
  setSunglasses(on: boolean): void;
  setWeather(kind: WeatherKind, temperature: number | null): void;
  setSound(on: boolean): void;
  // Christmas decorations, for the "-ber" months.
  setFestive(on: boolean): void;
  // Glides the camera to a preset view; "cats" follows a cat (press again
  // for the other one).
  setView(view: OfficeView): void;
  // Marc reacts to a visitor having found everything.
  celebrate(): void;
  // The latest visitor notes for the cork board; `fresh` is one just pinned,
  // which Marc reads out.
  setNotes(notes: BoardNote[], fresh?: BoardNote): void;
  setRunning(running: boolean): void;
  dispose(): void;
};

const palette = {
  floor: "#6b4f3a",
  plank: "#5c4332",
  wall: "#3d4456",
  trim: "#2e3443",
  rug: "#2f5d62",
  deskTop: "#1b1d22",
  deskLeg: "#2a2d34",
  metal: "#24272e",
  chairBody: "#1a1c21",
  chairAccent: "#b3242f",
  chairTrim: "#1f8a8a",
  pillow: "#f4f1ea",
  skin: "#c98d5e",
  skinShade: "#b47a4f",
  hair: "#121212",
  barong: "#efe7d4",
  barongLine: "#ddd2b8",
  sash: "#9b2335",
  sashTrim: "#1f8a8a",
  gold: "#e0a83a",
  pants: "#2b2f3a",
  shoe: "#161616",
  plant: "#3f8f5a",
  pot: "#b5643c",
  // Navy, so it stands out against the cream barong.
  mug: "#1f3b57",
  mugStripe: "#f4f1ea",
  coffee: "#3b2416",
  plate: "#f4f2ee",
  rice: "#fbfaf6",
  adobo: "#6b3a1f",
  egg: "#f7c948",
  water: "#a9d4f5",
  wood: "#8a6242",
  woodDark: "#5e4230",
  fabric: "#55657a",
  sheet: "#f3f1ec",
  duvet: "#2f4f7f",
  duvetStripe: "#d9e2f0",
  throw: "#d9a441",
  accentPillow: "#c0563f",
  bear: "#9a6a45",
  books: ["#c0563f", "#3e6fb0", "#d9a441", "#4f9a6a", "#8a5bb0"],
};

// Arm poses for the right arm, solved offline against Marc's proportions so
// the mug's rim and the spoon really reach his mouth: shoulder x, y, z, elbow,
// then the hand's tilt (on top of staying level) and its yaw.
type ArmPose = [number, number, number, number, number, number];
const MUG_HOLD: ArmPose = [0.46, 0.47, -0.04, 1.57, 0.08, 0];
const MUG_SIP: ArmPose = [1.82, 0.34, -0.41, 1.32, 0.97, 0];
const SPOON_SCOOP: ArmPose = [0.98, 0.41, -0.11, 0.83, 0.13, 0.43];
const SPOON_BITE: ArmPose = [1.37, -0.12, -0.52, 1.71, 0.05, 0.5];
// Palm flat on the mouse, at the left and right of its travel: leaning in
// for a game, sitting up for code.
const MOUSE_GAME: [ArmPose, ArmPose] = [
  [0.756, -0.259, 0.24, 1.27, 0, -0.587],
  [1.008, -0.331, 0.488, 0.886, 0, -0.191],
];
const MOUSE_CODE: [ArmPose, ArmPose] = [
  [0.856, -0.237, 0.299, 0.915, 0, 0.014],
  [1.009, -0.281, 0.418, 0.677, 0, 0.002],
];
// Right arm, with the chair rolled toward the PC: palm on the phone lying in
// front of it, and holding it up to read, screen toward his face.
const PHONE_GRAB: ArmPose = [0.691, -0.359, 0.332, 1.086, 0, 0.316];
const PHONE_READ: ArmPose = [1.18, 0.166, -0.743, 1.314, -0.588, -0.616];
const PHONE_ROLL = 0.5;
// Holding the PS5 controller in both hands at the chest.
const PAD_RIGHT: ArmPose = [0.598, 0.752, -0.046, 1.496, 0.258, -0.334];
const PAD_LEFT: ArmPose = [0.598, -0.752, 0.046, 1.496, 0.258, 0.334];
// Reaching the lamp's switch: rolled left along the desk, leaning in, the
// left palm flat on the button on the lamp's base.
const LAMP_ROLL = -0.745;
const LAMP_LEAN: [number, number, number] = [-0.177, 0, 0.29];
const LAMP_PRESS: ArmPose = [1.554, -0.249, -0.524, 0.134, 0.213, 0.211];
// Left arm stroking a cat curled up in his lap, from her shoulders to her back.
const LAP_PET: [ArmPose, ArmPose] = [
  [0.681, -0.403, 0.385, 1.739, 0, -0.475],
  [1.055, -0.434, 0.755, 1.15, 0, -0.004],
];
// A repeatable "random" number in [0, 1) for a whole number.
const chance = (n: number) => {
  const x = Math.sin(n * 12.9898 + 4.1) * 43758.5453;
  return x - Math.floor(x);
};
const between = (a: ArmPose, b: ArmPose, k: number) => a.map((value, i) => value + (b[i] - value) * k) as ArmPose;

export type BoardNote = {
  name: string;
  body: string;
  created_at?: string;
  weather?: WeatherKind | null;
  activity?: Activity | null;
};
export type OfficeView = "room" | "desk" | "bed" | "cats";

export type OfficeOptions = {
  // Called when a visitor clicks the cork board.
  onBoard?: () => void;
  // Called with whatever Marc says, so the page can announce it to screen
  // readers (the speech bubble itself is drawn into the canvas).
  onSay?: (line: string) => void;
  // Called with a book's index (see shelf.ts) when it's pulled off the shelf.
  onBook?: (index: number) => void;
  // Called when a visitor finds one of the things to find (see
  // lib/discoveries), every time it happens.
  onFind?: (id: Discovery) => void;
};

// Things in the room a visitor can click.
type Target =
  | "pc" | "lamp" | "marc" | "chair" | "clock" | "mug" | "plant" | "speaker" | "poster" | "bed" | "bear"
  | "cat" | "phone" | "aircon" | "book" | "fridge" | "board" | "ps5";

// What Marc says when the PC is switched off on him, getting angrier each
// time it happens within a short while, and once he's switched it back on.
const pcLines: Record<Activity, string[]> = {
  gaming: ["HEY!! I was winning", "AGAIN?! I had them", "OK, who keeps doing that?!"],
  working: ["My unsaved code!!", "Not again… I hadn't committed!", "Ctrl+S, Ctrl+S, Ctrl+S"],
  "coding-late": ["NOOO, the deploy!", "It's past midnight, please", "ARGH!!!"],
  eating: ["I was watching that…", "Hey, the episode!", "Let a man eat"],
  coffee: ["Seriously?", "Who's doing this?!", "Okay, now I'm annoyed."],
  sleeping: [""],
};
const pcBackLines: Record<Activity, string> = {
  gaming: "Respawning…",
  working: "Phew, autosave saved me",
  "coding-late": "Okay… redeploying",
  eating: "Where was I…",
  coffee: "Better.",
  sleeping: "",
};
const replyLines = [
  "Replied: 'Yes, I'm open for projects!'",
  "Replied: 'Let's build it'",
  "Replied: 'On it!'",
  "Replied: 'Check out my portfolio'",
];
const waveLines = ["Hi there!", "Oh, hello!", "Need something?", "Check out my projects!"];

export function createOfficeScene(container: HTMLElement, { onSay, onBook, onBoard, onFind }: OfficeOptions = {}): OfficeScene {
  const sound = createSound();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.domElement.style.display = "block";
  renderer.domElement.setAttribute("aria-hidden", "true");
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 40);
  camera.position.set(9, 7.6, 9);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.85, -0.1);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minAzimuthAngle = Math.PI / 4 - 0.5;
  controls.maxAzimuthAngle = Math.PI / 4 + 0.5;
  controls.minPolarAngle = 0.8;
  controls.maxPolarAngle = 1.15;
  controls.update();

  const room = new THREE.Group();
  scene.add(room);

  // ── Shell: floor, walls, rug ────────────────────────────────────────
  room.add(box(6, 0.2, 6, mat(palette.floor), 0, -0.1, 0));
  for (let i = -2; i <= 2; i++) {
    const plank = box(6, 0.005, 0.02, mat(palette.plank), 0, 0.003, i * 1.2);
    plank.castShadow = false;
    room.add(plank);
  }
  room.add(box(6, 3.2, 0.2, mat(palette.wall), 0, 1.6, -3.1));
  room.add(box(0.2, 3.2, 6, mat(palette.wall), -3.1, 1.6, 0));
  room.add(box(6, 0.14, 0.06, mat(palette.trim), 0, 0.07, -2.98));
  room.add(box(0.06, 0.14, 6, mat(palette.trim), -2.98, 0.07, 0));
  // Rug: a woven teal rug with a terracotta border, a gold lattice, a
  // central medallion and corner pieces, fringed at both ends.
  const rugArt = canvasTexture(1024, 726);
  {
    const c = rugArt.context;
    const W = 1024;
    const H = 726;
    c.fillStyle = "#1f4f55";
    c.fillRect(0, 0, W, H);
    // Borders: cream, terracotta with little diamonds, cream again.
    const band = (inset: number, width: number, color: string) => {
      c.strokeStyle = color;
      c.lineWidth = width;
      c.strokeRect(inset + width / 2, inset + width / 2, W - 2 * inset - width, H - 2 * inset - width);
    };
    band(0, 22, "#e9dcc0");
    band(22, 46, "#b5543c");
    band(68, 8, "#e9dcc0");
    c.fillStyle = "#e9dcc0";
    const diamond = (x: number, y: number, r: number) => {
      c.beginPath();
      c.moveTo(x, y - r);
      c.lineTo(x + r, y);
      c.lineTo(x, y + r);
      c.lineTo(x - r, y);
      c.closePath();
      c.fill();
    };
    for (let x = 60; x < W - 40; x += 46) {
      diamond(x, 45, 9);
      diamond(x, H - 45, 9);
    }
    for (let y = 60; y < H - 40; y += 46) {
      diamond(45, y, 9);
      diamond(W - 45, y, 9);
    }
    // Field: a fine gold lattice.
    c.save();
    c.beginPath();
    c.rect(76, 76, W - 152, H - 152);
    c.clip();
    c.strokeStyle = "rgba(217,164,65,0.35)";
    c.lineWidth = 2;
    for (let k = -H; k < W + H; k += 52) {
      c.beginPath();
      c.moveTo(k, 76);
      c.lineTo(k + H, 76 + H);
      c.moveTo(k, 76 + H);
      c.lineTo(k + H, 76);
      c.stroke();
    }
    // Corner pieces.
    c.fillStyle = "#b5543c";
    for (const [x, y] of [[76, 76], [W - 76, 76], [76, H - 76], [W - 76, H - 76]]) {
      c.beginPath();
      c.arc(x, y, 92, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
    // Medallion: layered diamonds and a star in the middle.
    const cx = W / 2;
    const cy = H / 2;
    c.fillStyle = "#e9dcc0";
    diamond(cx, cy, 210);
    c.fillStyle = "#b5543c";
    diamond(cx, cy, 196);
    c.fillStyle = "#14393d";
    diamond(cx, cy, 140);
    c.fillStyle = "#d9a441";
    diamond(cx, cy, 82);
    c.fillStyle = "#1f4f55";
    c.beginPath();
    for (let i = 0; i < 16; i++) {
      const r = i % 2 ? 26 : 62;
      const a = (i / 16) * Math.PI * 2;
      c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    c.closePath();
    c.fill();
    for (const [dx, dy] of [[-260, 0], [260, 0]]) {
      c.fillStyle = "#e9dcc0";
      diamond(cx + dx, cy + dy, 44);
      c.fillStyle = "#b5543c";
      diamond(cx + dx, cy + dy, 30);
    }
    // A woven grain over everything.
    for (let i = 0; i < 2600; i++) {
      c.fillStyle = i % 2 ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.06)";
      c.fillRect(Math.random() * W, Math.random() * H, 6, 1.5);
    }
  }
  const rug = new THREE.Group();
  rug.position.set(0.4, 0, -0.2);
  room.add(rug);
  const rugTop = box(2.4, 0.024, 1.7, new THREE.MeshStandardMaterial({ map: rugArt.texture, roughness: 1 }), 0, 0.012, 0);
  rugTop.castShadow = false;
  rug.add(rugTop);
  const tassel = mat("#e9dcc0", { roughness: 1 });
  for (const side of [-1, 1]) {
    for (let z = -0.8; z <= 0.8; z += 0.045) {
      const strand = box(0.08, 0.006, 0.014, tassel, side * 1.238, 0.004, z);
      strand.castShadow = false;
      strand.rotation.y = Math.sin(z * 40) * 0.12;
      rug.add(strand);
    }
  }

  // Cat corner, front right: a feeding mat with two bowls and water between.
  const feedMat = box(0.42, 0.008, 0.82, mat("#c0563f", { roughness: 1 }), 2.4, 0.004, 0.92);
  feedMat.castShadow = false;
  room.add(feedMat);
  const kibble: THREE.Object3D[] = [];
  for (const [plan, color] of [[mochi, "#f08fb0"], [tilapya, "#6fa8dc"]] as const) {
    const [x, , z] = plan.bowl;
    room.add(cylinder(0.085, 0.068, 0.045, mat(color, { roughness: 0.4 }), x, 0.026, z, 20));
    const food = new THREE.Group();
    food.add(cylinder(0.07, 0.07, 0.012, mat("#8a5a2b"), x, 0.046, z, 16));
    for (let i = 0; i < 7; i++) {
      const a = i * 0.9;
      food.add(box(0.016, 0.012, 0.016, mat("#6b4220"), x + Math.cos(a) * 0.04, 0.055, z + Math.sin(a) * 0.04));
    }
    food.visible = false;
    room.add(food);
    kibble.push(food);
  }
  room.add(cylinder(0.075, 0.06, 0.04, mat("#d8dde3", { metalness: 0.6, roughness: 0.3 }), 2.4, 0.022, 0.92, 20));
  room.add(cylinder(0.064, 0.064, 0.006, mat("#8fc8f0", { transparent: true, opacity: 0.8, roughness: 0.1 }), 2.4, 0.038, 0.92, 18));

  // Litter box in the front corner, with a scoop.
  const litter = new THREE.Group();
  litter.position.set(LITTER[0], 0, LITTER[2]);
  room.add(litter);
  const tray = mat("#6aa6c9", { roughness: 0.5 });
  litter.add(box(0.54, 0.03, 0.46, tray, 0, 0.015, 0));
  for (const z of [-0.218, 0.218]) litter.add(box(0.54, 0.13, 0.024, tray, 0, 0.065, z));
  for (const x of [-0.258, 0.258]) litter.add(box(0.024, 0.13, 0.46, tray, x, 0.065, 0));
  litter.add(box(0.49, 0.06, 0.41, mat("#d9c9a3", { roughness: 1 }), 0, 0.06, 0));
  for (let i = 0; i < 5; i++) litter.add(box(0.03, 0.012, 0.03, mat("#c7b48a"), -0.15 + i * 0.07, 0.093, Math.sin(i * 2) * 0.1));
  const scoop = new THREE.Group();
  scoop.position.set(0.36, 0.0, 0.12);
  scoop.rotation.set(0, 0.4, -1.2);
  scoop.add(box(0.03, 0.2, 0.02, mat("#e2603c"), 0, 0.1, 0));
  scoop.add(box(0.09, 0.07, 0.015, mat("#e2603c"), 0, 0.23, 0));
  litter.add(scoop);

  // Mini fridge in the back corner by the desk: glass door, a cool light inside, and
  // shelves of soda, water and canned coffee.
  const fridge = new THREE.Group();
  fridge.position.set(-2.1, 0, -2.58);
  fridge.scale.setScalar(1.25);
  room.add(fridge);
  const fridgeBody = mat("#1d1f24", { roughness: 0.45, metalness: 0.3 });
  for (const x of [-0.24, 0.24]) fridge.add(box(0.02, 0.74, 0.48, fridgeBody, x, 0.37, 0));
  fridge.add(box(0.5, 0.03, 0.48, fridgeBody, 0, 0.725, 0));
  fridge.add(box(0.5, 0.06, 0.48, fridgeBody, 0, 0.03, 0));
  const fridgeBack = new THREE.MeshStandardMaterial({ color: "#d8ecff", emissive: "#bfe0ff", emissiveIntensity: 0.35 });
  fridge.add(box(0.46, 0.66, 0.02, fridgeBack, 0, 0.38, -0.23));
  for (const y of [0.29, 0.5]) fridge.add(box(0.46, 0.008, 0.44, mat("#e6eef5", { transparent: true, opacity: 0.6 }), 0, y, 0));
  const can = (color: string, x: number, y: number, z: number, h = 0.1) => {
    fridge.add(cylinder(0.028, 0.028, h, mat(color, { roughness: 0.35, metalness: 0.5 }), x, y + h / 2, z, 12));
    fridge.add(cylinder(0.026, 0.026, 0.006, mat("#c9ced4", { metalness: 0.8, roughness: 0.3 }), x, y + h + 0.003, z, 12));
  };
  ["#d62b2b", "#2b6fd6", "#2bb35a", "#d62b2b", "#f2b233"].forEach((color, i) => can(color, -0.17 + i * 0.085, 0.505, -0.05 + (i % 2) * 0.08));
  for (let i = 0; i < 4; i++) {
    const x = -0.15 + i * 0.1;
    fridge.add(cylinder(0.03, 0.03, 0.15, mat("#9fd3ff", { transparent: true, opacity: 0.55, roughness: 0.05 }), x, 0.37, -0.02, 12));
    fridge.add(cylinder(0.014, 0.014, 0.025, mat("#2f7fd8"), x, 0.457, -0.02, 10));
  }
  ["#6b4a2b", "#e8dcc4", "#6b4a2b", "#e8dcc4", "#6b4a2b"].forEach((color, i) => can(color, -0.17 + i * 0.085, 0.06, (i % 2) * 0.07, 0.11));
  // The door, hinged on its left edge: a frame round a tinted glass pane.
  const fridgeDoor = new THREE.Group();
  fridgeDoor.position.set(-0.25, 0, 0.245);
  fridge.add(fridgeDoor);
  for (const y of [0.075, 0.71]) fridgeDoor.add(box(0.5, 0.05, 0.03, fridgeBody, 0.25, y, 0));
  for (const x of [0.015, 0.485]) fridgeDoor.add(box(0.03, 0.66, 0.03, fridgeBody, x, 0.39, 0));
  const pane = new THREE.Mesh(
    new THREE.PlaneGeometry(0.44, 0.6),
    new THREE.MeshStandardMaterial({ color: "#a8d4ff", transparent: true, opacity: 0.12, roughness: 0.05 }),
  );
  pane.position.set(0.25, 0.39, 0.004);
  fridgeDoor.add(pane);
  fridgeDoor.add(box(0.02, 0.26, 0.03, mat("#c9ced4", { metalness: 0.8, roughness: 0.25 }), 0.46, 0.42, 0.03));
  const fridgeLight = new THREE.PointLight("#cfe8ff", 0.6, 1.3, 2);
  fridgeLight.position.set(-2.1, 0.55, -2.35);
  room.add(fridgeLight);

  // Window with a town view that follows the time of day.
  const view = canvasTexture(320, 230);
  const windowGroup = new THREE.Group();
  windowGroup.position.set(-1.75, 1.95, -2.98);
  windowGroup.add(box(1.5, 1.12, 0.06, mat("#2b2f3a")));
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(1.36, 0.98),
    new THREE.MeshBasicMaterial({ map: view.texture, toneMapped: false }),
  );
  glass.position.z = 0.042;
  windowGroup.add(glass);
  windowGroup.add(box(0.04, 0.98, 0.04, mat("#2b2f3a"), 0, 0, 0.05));
  windowGroup.add(box(1.36, 0.04, 0.04, mat("#2b2f3a"), 0, 0, 0.05));
  windowGroup.add(box(1.6, 0.05, 0.14, mat("#2b2f3a"), 0, -0.58, 0.06));
  room.add(windowGroup);

  // "SHIP IT" poster and a wall clock showing Manila time.
  const poster = canvasTexture(128, 176);
  drawPoster(poster.context);
  const posterMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.62, 0.85),
    new THREE.MeshBasicMaterial({ map: poster.texture }),
  );
  // Hung from a nail at the top, so it can be knocked crooked. The print sits
  // clearly in front of its frame, or the two would flicker over each other
  // (z-fighting).
  const posterGroup = new THREE.Group();
  posterGroup.position.set(1.3, 2.6, -2.995);
  posterMesh.position.set(0, -0.45, 0.023);
  posterGroup.add(posterMesh, box(0.68, 0.91, 0.02, mat("#0c0d10"), 0, -0.45, 0));
  room.add(posterGroup);

  // A digital LED clock showing Manila time.
  const clock = new THREE.Group();
  clock.position.set(0.05, 2.3, -2.97);
  clock.add(rounded(0.66, 0.28, 0.06, 0.03, mat("#16171b", { roughness: 0.4, metalness: 0.3 })));
  const clockFace = canvasTexture(320, 128);
  const clockDisplay = new THREE.Mesh(
    new THREE.PlaneGeometry(0.58, 0.22),
    new THREE.MeshBasicMaterial({ map: clockFace.texture, toneMapped: false }),
  );
  clockDisplay.position.z = 0.032;
  clock.add(clockDisplay);
  const clockGlow = new THREE.PointLight("#ff4655", 0.25, 1.2, 2);
  clockGlow.position.set(0.05, 2.3, -2.75);
  room.add(clock, clockGlow);

  // Shelf with books above the bed.
  room.add(box(0.3, 0.05, 1.4, mat("#7a5a40"), -2.85, 2.15, 0.3));
  // Each book is a link: its title runs up the spine, and it slides out
  // when pointed at.
  const books = palette.books.map((color, i) => {
    const height = 0.26 + (i % 3) * 0.04;
    const book = new THREE.Group();
    book.position.set(-2.85, 2.18 + height / 2, -0.25 + i * 0.13);
    book.add(box(0.22, height, 0.09, mat(color)));
    const label = canvasTexture(48, 192);
    label.context.fillStyle = color;
    label.context.fillRect(0, 0, 48, 192);
    label.context.fillStyle = "rgba(255,255,255,0.85)";
    label.context.fillRect(0, 10, 48, 3);
    label.context.fillRect(0, 179, 48, 3);
    label.context.translate(24, 96);
    label.context.rotate(-Math.PI / 2);
    label.context.fillStyle = "#ffffff";
    label.context.font = "bold 22px system-ui, sans-serif";
    label.context.textAlign = "center";
    label.context.textBaseline = "middle";
    label.context.fillText(shelfBooks[i], 0, 1, 160);
    const spine = new THREE.Mesh(new THREE.PlaneGeometry(0.09, height), new THREE.MeshStandardMaterial({ map: label.texture, roughness: 0.8 }));
    spine.position.x = 0.111;
    spine.rotation.y = Math.PI / 2;
    book.add(spine);
    room.add(book);
    return book;
  });

  // Plant in the corner.
  const pot = box(0.36, 0.36, 0.36, mat(palette.pot), 2.45, 0.18, -2.45);
  room.add(pot);
  const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0), mat(palette.plant, { flatShading: true }));
  leaves.position.set(2.45, 0.78, -2.45);
  leaves.castShadow = true;
  room.add(leaves);

  // ── Air conditioner ─────────────────────────────────────────────────
  // A split unit high on the left wall: its flap swings and cool air drifts
  // out while it runs.
  const aircon = new THREE.Group();
  aircon.position.set(-2.88, 2.2, -1.75);
  room.add(aircon);
  aircon.add(rounded(0.22, 0.3, 0.92, 0.05, mat("#eef0f2", { roughness: 0.5 }), 0, 0, 0));
  aircon.add(box(0.005, 0.012, 0.86, mat("#cfd3d8"), 0.111, 0.05, 0));
  aircon.add(box(0.03, 0.05, 0.84, mat("#2a2d34"), 0.1, -0.12, 0));
  const flap = new THREE.Group();
  flap.position.set(0.115, -0.1, 0);
  flap.add(box(0.07, 0.012, 0.82, mat("#e3e6e9"), 0.03, 0, 0));
  aircon.add(flap);
  const acLed = new THREE.MeshBasicMaterial({ color: "#3ddc84", toneMapped: false });
  aircon.add(box(0.006, 0.015, 0.03, acLed, 0.112, 0.08, 0.36));
  const acDisplay = canvasTexture(64, 32);
  acDisplay.context.fillStyle = "#e8f6ff";
  acDisplay.context.fillRect(0, 0, 64, 32);
  acDisplay.context.fillStyle = "#1f7bd6";
  acDisplay.context.font = "bold 22px system-ui, sans-serif";
  acDisplay.context.textAlign = "center";
  acDisplay.context.textBaseline = "middle";
  acDisplay.context.fillText("18°", 32, 17);
  const acScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.05), new THREE.MeshBasicMaterial({ map: acDisplay.texture, toneMapped: false }));
  acScreen.position.set(0.112, 0.06, 0.25);
  acScreen.rotation.y = Math.PI / 2;
  aircon.add(acScreen);
  // Remote, held when he points it at the unit.
  const remote = new THREE.Group();
  remote.add(rounded(0.04, 0.12, 0.02, 0.008, mat("#f4f4f2"), 0, -0.06, 0));
  remote.add(box(0.01, 0.01, 0.022, new THREE.MeshBasicMaterial({ color: "#ff3d3d", toneMapped: false }), 0, -0.01, 0));

  // ── Cork board ──────────────────────────────────────────────────────
  // On the left wall by the nightstand: notes visitors have pinned.
  const board = new THREE.Group();
  board.position.set(-2.97, 1.55, 1.9);
  board.rotation.y = Math.PI / 2;
  room.add(board);
  board.add(box(0.98, 0.76, 0.04, mat("#7a5a40", { roughness: 0.8 })));
  const corkArt = canvasTexture(640, 480);
  const cork = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.68), new THREE.MeshStandardMaterial({ map: corkArt.texture, roughness: 1 }));
  cork.position.z = 0.021;
  board.add(cork);
  let boardNotes: BoardNote[] = [];
  function wrap(c: CanvasRenderingContext2D, text: string, width: number) {
    const lines: string[] = [];
    let line = "";
    for (const word of text.split(" ")) {
      const next = line ? `${line} ${word}` : word;
      if (c.measureText(next).width > width && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
    if (lines.length > 4) lines.splice(4, lines.length - 4, lines[3].slice(0, -1) + "…");
    return lines;
  }
  function drawBoard() {
    const c = corkArt.context;
    c.fillStyle = "#c49a6c";
    c.fillRect(0, 0, 640, 480);
    for (let i = 0; i < 900; i++) {
      c.fillStyle = i % 3 ? "rgba(120,80,40,0.25)" : "rgba(255,230,190,0.18)";
      c.fillRect(Math.random() * 640, Math.random() * 480, 2 + Math.random() * 3, 2);
    }
    c.fillStyle = "#3a2a1c";
    c.font = "bold 26px 'Segoe Print', 'Comic Sans MS', cursive";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("Notes from visitors", 320, 30);
    const shown: BoardNote[] = boardNotes.length ? boardNotes.slice(0, 6) : [{ name: "Marc", body: "Leave me a note! Click the board" }];
    // Each note is a polaroid of the moment it was left, the note written
    // underneath.
    shown.forEach((note, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 115 + col * 205;
      const y = 152 + row * 204;
      c.save();
      c.translate(x, y);
      c.rotate(Math.sin(i * 2.7 + note.body.length) * 0.07);
      c.fillStyle = "rgba(0,0,0,0.28)";
      c.fillRect(-82, -89, 172, 190);
      c.fillStyle = "#f7f4ec";
      c.fillRect(-86, -95, 172, 190);
      const at = note.created_at ? new Date(note.created_at) : new Date();
      drawPolaroidPhoto(c, -78, -87, 156, 86, at, note.weather ?? "clear");
      c.fillStyle = "#2b2420";
      c.font = "600 15px 'Segoe Print', 'Comic Sans MS', cursive";
      c.textAlign = "left";
      c.textBaseline = "middle";
      wrap(c, note.body, 152).slice(0, 4).forEach((line, k) => c.fillText(line, -78, 14 + k * 17));
      c.font = "italic 13px 'Segoe Print', 'Comic Sans MS', cursive";
      c.fillStyle = "#6b5a4c";
      c.fillText(`— ${note.name}`.slice(0, 24), -78, 84);
      c.fillStyle = "#d63b3b";
      c.beginPath();
      c.arc(0, -95, 7, 0, Math.PI * 2);
      c.fill();
      c.restore();
    });
    corkArt.texture.needsUpdate = true;
  }
  drawBoard();

  // ── The soda can Tilapya pushes off the desk ────────────────────────
  const CAN_HOME = new THREE.Vector3(-0.65, 0.88, -1.9);
  const deskCan = new THREE.Group();
  deskCan.add(cylinder(0.033, 0.033, 0.12, mat("#d62b2b", { roughness: 0.35, metalness: 0.5 })));
  deskCan.add(cylinder(0.031, 0.031, 0.008, mat("#c9ced4", { metalness: 0.8, roughness: 0.3 }), 0, 0.064, 0));
  deskCan.add(box(0.068, 0.03, 0.069, mat("#f4f1ea", { roughness: 0.5 }), 0, 0.005, 0).rotateY(0.3));
  deskCan.position.copy(CAN_HOME);
  deskCan.scale.setScalar(1.5);
  room.add(deskCan);
  let canState: "desk" | "falling" | "floor" = "desk";
  let canLandedAt = 0;
  const canVelocity = new THREE.Vector3();

  // ── Christmas, for the "-ber" months ─────────────────────────────────
  const festive = new THREE.Group();
  festive.visible = false;
  room.add(festive);
  function starShape(outer: number, inner: number) {
    const shape = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? inner : outer;
      const a = Math.PI / 2 + (i / 10) * Math.PI * 2;
      if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    shape.closePath();
    return shape;
  }
  const glowGold = new THREE.MeshBasicMaterial({ color: "#ffcf6b", toneMapped: false });
  // A tree in the front corner, with ornaments, a star and gifts.
  const tree = new THREE.Group();
  tree.position.set(-2.5, 0, 2.45);
  festive.add(tree);
  tree.add(box(0.26, 0.2, 0.26, mat("#8a5a32"), 0, 0.1, 0));
  tree.add(cylinder(0.05, 0.05, 0.2, mat("#5e4230"), 0, 0.28, 0));
  const pine = mat("#1f6b3a", { flatShading: true, roughness: 0.9 });
  for (const [r, h, y] of [[0.46, 0.55, 0.62], [0.37, 0.45, 0.92], [0.26, 0.36, 1.17]]) tree.add(cylinder(0, r, h, pine, 0, y, 0, 8));
  const topStar = new THREE.Mesh(new THREE.ExtrudeGeometry(starShape(0.09, 0.04), { depth: 0.02, bevelEnabled: false }), glowGold);
  topStar.position.set(0, 1.42, 0);
  tree.add(topStar);
  ["#e5484d", "#f2b233", "#3d7bff", "#e8e8e8", "#e5484d", "#f2b233", "#3d7bff", "#e8e8e8", "#e5484d"].forEach((color, i) => {
    const level = i % 3;
    const y = 0.5 + level * 0.3 + (i % 2) * 0.08;
    const r = [0.36, 0.28, 0.18][level];
    const a = i * 2.4;
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), mat(color, { metalness: 0.4, roughness: 0.3 }));
    ball.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    tree.add(ball);
  });
  ([["#c8202e", "#f2b233", 0.3, 0.2, 0.15], ["#2f4f7f", "#e8e8e8", -0.25, 0.16, 0.32], ["#2f7f4f", "#e5484d", 0.05, 0.13, 0.4]] as const).forEach(([paper, ribbon, x, size, z]) => {
    const gift = new THREE.Group();
    gift.position.set(x, size / 2, z);
    gift.add(box(size, size, size, mat(paper)));
    gift.add(box(size + 0.004, size + 0.004, 0.03, mat(ribbon)));
    gift.add(box(0.03, size + 0.004, size + 0.004, mat(ribbon)));
    tree.add(gift);
  });
  // String lights: along the top of the back wall and the shelf's edge, and
  // spiralling round the tree. They twinkle.
  const bulbSpots: THREE.Vector3[] = [];
  for (let i = 0; i <= 30; i++) {
    const x = -2.85 + (i / 30) * 5.7;
    bulbSpots.push(new THREE.Vector3(x, 2.95 - Math.abs(Math.sin(i * 0.9)) * 0.12, -2.95));
  }
  for (let i = 0; i <= 10; i++) bulbSpots.push(new THREE.Vector3(-2.7, 2.1 - Math.abs(Math.sin(i * 1.1)) * 0.06, -0.38 + i * 0.138));
  for (let i = 0; i < 22; i++) {
    const k = i / 22;
    const a = k * Math.PI * 7;
    const r = 0.44 - k * 0.32;
    bulbSpots.push(new THREE.Vector3(-2.5 + Math.cos(a) * r, 0.4 + k * 0.95, 2.45 + Math.sin(a) * r));
  }
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.024, 8, 6), new THREE.MeshBasicMaterial({ toneMapped: false }), bulbSpots.length);
  const bulbSlot = new THREE.Object3D();
  bulbSpots.forEach((spot, i) => {
    bulbSlot.position.copy(spot);
    bulbSlot.updateMatrix();
    bulbs.setMatrixAt(i, bulbSlot.matrix);
  });
  festive.add(bulbs);
  const bulbColors = ["#ff4655", "#ffd24a", "#3df58a", "#4aa8ff", "#ff9a3d"].map((hex) => new THREE.Color(hex));
  const bulbOff = new THREE.Color("#2a2a2e");
  let lastTwinkle = -1;
  function twinkle(now: number) {
    const tick = Math.floor(now * 3);
    if (tick === lastTwinkle) return;
    lastTwinkle = tick;
    bulbSpots.forEach((_, i) => {
      const lit = still || (i + tick) % 4 !== 0;
      bulbs.setColorAt(i, lit ? bulbColors[(i + Math.floor(tick / 2)) % bulbColors.length] : bulbOff);
    });
    if (bulbs.instanceColor) bulbs.instanceColor.needsUpdate = true;
  }
  bulbSpots.forEach((_, i) => bulbs.setColorAt(i, bulbColors[i % bulbColors.length]));

  // ── Gaming desk ─────────────────────────────────────────────────────
  // Desk-local x runs along its 3.2 width, z from back (-) to front (+).
  const desk = new THREE.Group();
  desk.position.set(0.45, 0, -2.3);
  room.add(desk);
  desk.add(box(3.2, 0.06, 0.95, mat(palette.deskTop, { roughness: 0.6 }), 0, 0.76, 0));
  for (const x of [-1.45, 1.45]) {
    desk.add(box(0.08, 0.72, 0.08, mat(palette.deskLeg), x, 0.37, 0));
    desk.add(box(0.1, 0.04, 0.8, mat(palette.deskLeg), x, 0.02, 0));
  }
  desk.add(box(2.9, 0.06, 0.04, mat(palette.deskLeg), 0, 0.6, -0.4));
  // RGB strips: under the desk's front edge and on the wall behind it.
  const rgbMaterial = new THREE.MeshBasicMaterial({ color: "#ff00aa", toneMapped: false });
  desk.add(box(3.1, 0.015, 0.02, rgbMaterial, 0, 0.725, 0.47));
  const wallStrip = box(3.1, 0.02, 0.02, rgbMaterial, 0.45, 0.98, -2.97);
  room.add(wallStrip);
  desk.add(box(1.6, 0.008, 0.52, mat("#101114"), 0.05, 0.795, 0.12));

  // Monitors: a big main screen and an angled side screen.
  const main = canvasTexture(400, 224);
  const side = canvasTexture(256, 160);
  const mainMonitor = new THREE.Group();
  mainMonitor.position.set(0, 1.2, -0.24);
  mainMonitor.add(box(1.28, 0.72, 0.05, mat(palette.metal)));
  const mainScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.22, 0.66),
    new THREE.MeshBasicMaterial({ map: main.texture, toneMapped: false }),
  );
  mainScreen.position.z = 0.034;
  mainMonitor.add(mainScreen);
  mainMonitor.add(box(0.08, 0.36, 0.06, mat(palette.metal), 0, -0.48, -0.03));
  mainMonitor.add(box(0.42, 0.02, 0.26, mat(palette.metal), 0, -0.41, -0.05));
  desk.add(mainMonitor);

  const sideMonitor = new THREE.Group();
  sideMonitor.position.set(-1.05, 1.1, -0.18);
  sideMonitor.rotation.y = 0.42;
  sideMonitor.add(box(0.7, 0.44, 0.04, mat(palette.metal)));
  const sideScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.65, 0.39),
    new THREE.MeshBasicMaterial({ map: side.texture, toneMapped: false }),
  );
  sideScreen.position.z = 0.029;
  sideMonitor.add(sideScreen);
  sideMonitor.add(box(0.06, 0.26, 0.05, mat(palette.metal), 0, -0.32, -0.02));
  sideMonitor.add(box(0.26, 0.02, 0.18, mat(palette.metal), 0, -0.44, -0.02));
  desk.add(sideMonitor);

  // Desk lamp at the far left end, clear of both screens.
  const lamp = new THREE.Group();
  lamp.position.set(-1.45, 0.79, 0.12);
  lamp.add(cylinder(0.1, 0.11, 0.03, mat(palette.metal)));
  // The switch, on top of the base at the front.
  const lampSwitch = new THREE.MeshBasicMaterial({ color: "#ffb347", toneMapped: false });
  lamp.add(cylinder(0.02, 0.02, 0.014, lampSwitch, 0, 0.02, 0.07, 12));
  const lampArm = box(0.025, 0.55, 0.025, mat(palette.metal), 0, 0.27, 0);
  lamp.add(lampArm);
  const shadeMaterial = mat("#d9c27a", { side: THREE.DoubleSide, emissive: "#ffcf73", emissiveIntensity: 0 });
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.16, 14, 1, true), shadeMaterial);
  shade.position.set(0.1, 0.54, 0.04);
  shade.rotation.z = -0.6;
  lamp.add(shade);
  desk.add(lamp);
  const lampLight = new THREE.PointLight("#ffc46b", 0, 4.5, 1.6);
  lampLight.position.set(-0.85, 1.25, -2.05);
  lampLight.castShadow = true;
  lampLight.shadow.mapSize.set(512, 512);
  room.add(lampLight);

  // Gaming PC: glass side panel, RGB fans, a glowing graphics card.
  const pc = new THREE.Group();
  pc.position.set(1.3, 0.79, -0.06);
  desk.add(pc);
  pc.add(box(0.34, 0.64, 0.62, mat("#121317", { roughness: 0.4 }), 0, 0.32, 0));
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.56, 0.56),
    new THREE.MeshStandardMaterial({ color: "#0e1a22", roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.55 }),
  );
  panel.position.set(0.172, 0.32, 0);
  panel.rotation.y = Math.PI / 2;
  pc.add(panel);
  const fanMaterial = new THREE.MeshBasicMaterial({ color: "#00e5ff", toneMapped: false });
  const fans: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const fan = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.012, 8, 24), fanMaterial);
    fan.position.set(0, 0.13 + i * 0.18, 0.312);
    pc.add(fan);
    fans.push(fan);
  }
  pc.add(box(0.02, 0.06, 0.44, new THREE.MeshBasicMaterial({ color: "#ff3d7f", toneMapped: false }), 0.14, 0.3, 0));
  pc.add(box(0.01, 0.14, 0.03, fanMaterial, 0.16, 0.48, -0.12));
  pc.add(box(0.01, 0.14, 0.03, fanMaterial, 0.16, 0.48, -0.06));
  // Power button on top, lit while the PC is on.
  const powerMaterial = new THREE.MeshBasicMaterial({ color: "#00e5ff", toneMapped: false });
  pc.add(cylinder(0.028, 0.028, 0.014, powerMaterial, 0, 0.646, 0.22));
  const pcGlow = new THREE.PointLight("#00e5ff", 0.6, 1.6, 2);
  pcGlow.position.set(1.9, 1.2, -2.0);
  room.add(pcGlow);

  // Keyboard with RGB underglow, mouse, speakers, headset rest.
  const accent = new THREE.MeshBasicMaterial({ color: "#00e5ff", toneMapped: false });
  // Keyboard: dark keycaps on a slim base, with the RGB only as a thin
  // underglow peeking out around its edge.
  const keyboard = new THREE.Group();
  keyboard.position.set(0, 0.8, 0.05);
  desk.add(keyboard);
  keyboard.add(box(0.68, 0.006, 0.23, rgbMaterial, 0, 0.004, 0));
  keyboard.add(box(0.66, 0.022, 0.21, mat("#1a1b20", { roughness: 0.5 }), 0, 0.017, 0));
  const keycaps = new THREE.InstancedMesh(new THREE.BoxGeometry(0.036, 0.016, 0.034), mat("#2c2e36", { roughness: 0.55 }), 4 * 14);
  const slot = new THREE.Object3D();
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 14; col++) {
      slot.position.set(-0.286 + col * 0.044 + (row % 2) * 0.008, 0.034, -0.08 + row * 0.04);
      slot.updateMatrix();
      keycaps.setMatrixAt(row * 14 + col, slot.matrix);
    }
  }
  keycaps.castShadow = true;
  keycaps.receiveShadow = true;
  keyboard.add(keycaps);
  keyboard.add(box(0.24, 0.016, 0.034, mat("#2c2e36", { roughness: 0.55 }), -0.02, 0.034, 0.08));
  // WASD in the accent colour, for the gamer.
  for (const [col, row] of [[2, 1], [1, 2], [2, 2], [3, 2]]) {
    keyboard.add(box(0.036, 0.017, 0.034, mat("#3a4a5c", { roughness: 0.5 }), -0.286 + col * 0.044 + (row % 2) * 0.008, 0.035, -0.08 + row * 0.04));
  }

  // Gaming mouse on its own pad: a sculpted body, split buttons, a glowing
  // scroll wheel and an RGB strip round the base.
  desk.add(box(0.34, 0.006, 0.28, mat("#0d0e11", { roughness: 0.9 }), 0.52, 0.8, 0.29));
  desk.add(box(0.344, 0.003, 0.284, rgbMaterial, 0.52, 0.797, 0.29));
  const mouse = new THREE.Group();
  mouse.position.set(0.5, 0.803, 0.3);
  desk.add(mouse);
  const mouseShell = mat("#1d1f26", { roughness: 0.35, metalness: 0.2 });
  mouse.add(box(0.072, 0.02, 0.13, mouseShell, 0, 0.012, 0));
  const hump = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 10), mouseShell);
  hump.scale.set(0.74, 0.5, 1.3);
  hump.position.set(0, 0.024, 0.01);
  hump.castShadow = true;
  mouse.add(hump);
  mouse.add(box(0.074, 0.006, 0.134, rgbMaterial, 0, 0.003, 0));
  mouse.add(box(0.003, 0.012, 0.05, mat("#0a0b0d"), 0, 0.044, -0.032));
  mouse.add(cylinder(0.009, 0.009, 0.008, accent, 0, 0.046, -0.035, 12).rotateZ(Math.PI / 2));
  mouse.add(box(0.016, 0.004, 0.022, accent, 0, 0.044, 0.035));
  for (const side of [-1, 1]) mouse.add(box(0.004, 0.008, 0.03, mat("#30333c"), side * 0.037, 0.022, -0.02));
  mouse.add(box(0.006, 0.006, 0.3, mat("#111215"), 0, 0.006, -0.21));
  const speaker = new THREE.Group();
  speaker.add(box(0.14, 0.26, 0.14, mat("#15161a"), 0.84, 0.92, -0.26));
  speaker.add(cylinder(0.04, 0.04, 0.01, mat("#3a3d45"), 0.84, 0.95, -0.188).rotateX(Math.PI / 2));
  desk.add(speaker);

  // PS5, standing up beside the PC: white panels round a black core, with a
  // light that glows blue when it's on and amber in rest mode.
  const ps5 = new THREE.Group();
  ps5.position.set(0.93, 0.79, 0.1);
  ps5.rotation.y = -0.45;
  desk.add(ps5);
  const consoleWhite = mat("#f2f2f0", { roughness: 0.45 });
  ps5.add(cylinder(0.07, 0.08, 0.015, mat("#1a1a1d"), 0, 0.008, 0, 18));
  ps5.add(rounded(0.05, 0.4, 0.24, 0.015, mat("#141417", { roughness: 0.4 }), 0, 0.22, 0));
  for (const side of [-1, 1]) {
    const panel = rounded(0.022, 0.43, 0.27, 0.01, consoleWhite, side * 0.034, 0.225, 0);
    panel.rotation.z = side * -0.04;
    ps5.add(panel);
  }
  const ps5Light = new THREE.MeshBasicMaterial({ color: "#ff9a3d", toneMapped: false });
  for (const side of [-1, 1]) ps5.add(box(0.004, 0.36, 0.004, ps5Light, side * 0.023, 0.22, 0.121));

  // A DualSense: white body, black centre, a light bar.
  function makePad() {
    const pad = new THREE.Group();
    pad.add(rounded(0.15, 0.028, 0.075, 0.012, consoleWhite, 0, 0.014, 0));
    for (const side of [-1, 1]) {
      const grip = rounded(0.04, 0.026, 0.07, 0.012, consoleWhite, side * 0.06, 0.012, 0.035);
      grip.rotation.y = side * -0.35;
      pad.add(grip);
      pad.add(cylinder(0.012, 0.012, 0.012, mat("#1a1a1d"), side * 0.032, 0.03, 0.012, 10));
    }
    pad.add(box(0.06, 0.004, 0.032, mat("#1a1a1d", { roughness: 0.3 }), 0, 0.029, -0.012));
    pad.add(box(0.05, 0.004, 0.004, new THREE.MeshBasicMaterial({ color: "#3d7bff", toneMapped: false }), 0, 0.029, -0.03));
    return pad;
  }
  const deskPad = makePad();
  deskPad.position.set(-0.68, 0.79, 0.3);
  deskPad.rotation.y = 0.3;
  desk.add(deskPad);

  const headset = new THREE.Group();
  const headsetMaterial = mat("#121316", { roughness: 0.5 });
  headset.add(box(0.36, 0.035, 0.06, headsetMaterial, 0, 0.42, 0));
  for (const side of [-1, 1]) {
    headset.add(box(0.035, 0.18, 0.06, headsetMaterial, side * 0.19, 0.32, 0));
    headset.add(box(0.06, 0.13, 0.12, headsetMaterial, side * 0.2, 0.21, 0));
    headset.add(box(0.008, 0.07, 0.07, accent, side * 0.234, 0.21, 0));
  }
  headset.add(box(0.015, 0.015, 0.16, headsetMaterial, -0.21, 0.16, -0.08));
  // The same headset, lying flat on top of the PC when not worn.
  const restHeadset = headset.clone();
  restHeadset.position.set(1.3, 1.46, 0.23);
  restHeadset.rotation.x = -Math.PI / 2;
  desk.add(restHeadset);

  // Things for coffee and meals.
  function makeMug() {
    const group = new THREE.Group();
    group.add(cylinder(0.065, 0.06, 0.15, mat(palette.mug), 0, 0.075, 0));
    group.add(cylinder(0.0665, 0.0665, 0.025, mat(palette.mugStripe), 0, 0.09, 0));
    group.add(cylinder(0.056, 0.056, 0.01, mat(palette.coffee), 0, 0.146, 0));
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 6, 12, Math.PI), mat(palette.mug));
    handle.position.set(0.07, 0.08, 0);
    handle.rotation.z = -Math.PI / 2;
    group.add(handle);
    return group;
  }
  const deskMug = makeMug();
  deskMug.position.set(-0.64, 0.79, 0.16);

  // Phone, face up in front of the PC, where visitors can see it. Its screen lights up with a
  // message when it buzzes; a copy appears in his hand when he reads it.
  function makePhone() {
    const group = new THREE.Group();
    // In a bright orange case, so it stands out on the black desk.
    group.add(rounded(0.08, 0.014, 0.155, 0.007, mat("#e2603c", { roughness: 0.5 }), 0, 0.007, 0));
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.136), new THREE.MeshBasicMaterial({ color: "#050506", toneMapped: false }));
    screen.rotation.x = -Math.PI / 2;
    screen.position.y = 0.0145;
    group.add(screen);
    return { group, screen };
  }
  const phoneLock = canvasTexture(64, 128);
  {
    const c = phoneLock.context;
    const g = c.createLinearGradient(0, 0, 64, 128);
    g.addColorStop(0, "#3b2a8a");
    g.addColorStop(1, "#d0487a");
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 128);
    c.fillStyle = "#ffffff";
    c.font = "bold 16px system-ui, sans-serif";
    c.textAlign = "center";
    c.fillText("9:41", 32, 30);
    c.fillStyle = "rgba(255,255,255,0.92)";
    c.beginPath();
    c.roundRect(5, 52, 54, 26, 6);
    c.fill();
    c.fillStyle = "#222";
    c.font = "bold 8px system-ui, sans-serif";
    c.textAlign = "left";
    c.fillText("New message", 9, 63);
    c.fillStyle = "#555";
    c.font = "7px system-ui, sans-serif";
    c.fillText("Are you free?", 9, 73);
  }
  const phoneOff = new THREE.MeshBasicMaterial({ color: "#050506", toneMapped: false });
  const phoneLit = new THREE.MeshBasicMaterial({ map: phoneLock.texture, toneMapped: false });
  const deskPhone = makePhone();
  deskPhone.group.position.set(1.0, 0.79, 0.36);
  deskPhone.group.rotation.y = -0.2;
  deskPhone.group.scale.setScalar(1.5);
  desk.add(deskPhone.group);
  const PHONE_REST = deskPhone.group.position.clone();
  desk.add(deskMug);

  const meal = new THREE.Group();
  meal.position.set(0.05, 0.79, 0.3);
  desk.add(meal);
  meal.add(cylinder(0.2, 0.17, 0.025, mat(palette.plate), 0, 0.012, 0, 24));
  const rice = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat(palette.rice));
  rice.position.set(-0.06, 0.025, 0.01);
  rice.scale.y = 0.8;
  meal.add(rice);
  for (let i = 0; i < 5; i++) {
    meal.add(box(0.045, 0.035, 0.04, mat(palette.adobo), 0.06 + (i % 2) * 0.05, 0.04, -0.06 + i * 0.03));
  }
  meal.add(cylinder(0.05, 0.05, 0.012, mat("#fdfcf8"), 0.02, 0.032, 0.11, 18));
  meal.add(cylinder(0.022, 0.022, 0.014, mat(palette.egg), 0.02, 0.038, 0.11, 12));
  const water = new THREE.Group();
  water.position.set(0.42, 0.79, 0.28);
  water.add(cylinder(0.045, 0.04, 0.16, new THREE.MeshStandardMaterial({ color: "#dfefff", transparent: true, opacity: 0.45, roughness: 0.1 }), 0, 0.08, 0));
  water.add(cylinder(0.04, 0.036, 0.11, mat(palette.water, { transparent: true, opacity: 0.6 }), 0, 0.06, 0));
  desk.add(water);

  // ── Gaming chair ────────────────────────────────────────────────────
  const CHAIR = new THREE.Vector3(0.45, 0, -1.62);
  const chair = new THREE.Group();
  chair.position.copy(CHAIR);
  room.add(chair);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const leg = box(0.05, 0.04, 0.32, mat(palette.metal), Math.sin(a) * 0.16, 0.06, Math.cos(a) * 0.16);
    leg.rotation.y = a;
    chair.add(leg);
    chair.add(cylinder(0.03, 0.03, 0.04, mat("#111"), Math.sin(a) * 0.31, 0.02, Math.cos(a) * 0.31));
  }
  chair.add(cylinder(0.035, 0.035, 0.3, mat("#3a3d45"), 0, 0.24, 0));
  chair.add(box(0.56, 0.1, 0.56, mat(palette.chairBody), 0, 0.42, 0));
  for (const side of [-1, 1]) {
    chair.add(box(0.08, 0.06, 0.56, mat(palette.chairAccent), side * 0.25, 0.49, 0));
    chair.add(box(0.05, 0.22, 0.05, mat(palette.metal), side * 0.3, 0.56, 0.02));
    chair.add(box(0.08, 0.04, 0.3, mat(palette.chairBody), side * 0.3, 0.68, -0.02));
  }
  const back = new THREE.Group();
  back.position.set(0, 0.46, 0.26);
  back.rotation.x = -0.12;
  chair.add(back);
  // Low enough that Marc's head and shoulders show above it from behind.
  back.add(box(0.5, 0.7, 0.1, mat(palette.chairBody), 0, 0.4, 0));
  for (const side of [-1, 1]) {
    back.add(box(0.08, 0.56, 0.14, mat(palette.chairAccent), side * 0.26, 0.34, -0.02));
    back.add(box(0.02, 0.48, 0.02, mat(palette.chairTrim), side * 0.18, 0.38, -0.055));
  }
  back.add(box(0.28, 0.1, 0.08, mat(palette.chairAccent), 0, 0.66, -0.08));
  back.add(box(0.36, 0.14, 0.06, mat(palette.chairBody), 0, 0.2, -0.07));

  // ── Bed ─────────────────────────────────────────────────────────────
  // Headboard against the left wall; bed-local x runs from the head (-) to
  // the foot (+), z across its width.
  const bed = new THREE.Group();
  bed.position.set(-1.9, 0, 0.65);
  room.add(bed);
  const wood = mat(palette.wood, { roughness: 0.7 });
  const woodDark = mat(palette.woodDark, { roughness: 0.7 });
  for (const x of [-0.95, 0.95]) for (const z of [-0.58, 0.58]) bed.add(cylinder(0.035, 0.03, 0.1, woodDark, x, 0.05, z));
  bed.add(box(1.96, 0.05, 1.22, woodDark, 0, 0.125, 0));
  for (const z of [-0.63, 0.63]) bed.add(box(2.02, 0.14, 0.05, wood, 0, 0.19, z));
  bed.add(box(0.05, 0.2, 1.31, wood, 0.99, 0.22, 0));
  // Soft LED glow underneath, lit at night.
  const underglow = new THREE.MeshBasicMaterial({ color: "#8a5cff", toneMapped: false });
  bed.add(box(1.9, 0.01, 1.16, underglow, 0, 0.098, 0));
  const bedGlow = new THREE.PointLight("#8a5cff", 0, 1.8, 2);
  bedGlow.position.set(-1.9, 0.06, 0.65);
  room.add(bedGlow);

  // Mattress and fitted sheet.
  bed.add(rounded(1.94, 0.22, 1.2, 0.05, mat(palette.sheet), 0, 0.31, 0));
  bed.add(box(1.95, 0.012, 1.21, mat("#d8d3c8"), 0, 0.235, 0));

  // Upholstered headboard: a wooden frame with six tufted cushions.
  bed.add(box(0.08, 0.98, 1.4, wood, -1.0, 0.49, 0));
  const fabric = mat(palette.fabric, { roughness: 0.95 });
  for (const y of [0.58, 0.84]) {
    for (const z of [-0.43, 0, 0.43]) {
      bed.add(rounded(0.08, 0.24, 0.4, 0.04, fabric, -0.94, y, z));
      bed.add(cylinder(0.014, 0.014, 0.01, mat("#3d4859"), -0.899, y, z).rotateZ(Math.PI / 2));
    }
  }
  bed.add(box(0.1, 0.04, 1.44, woodDark, -0.99, 0.99, 0));

  // Pillows, an accent cushion and Mr. Bear.
  const pillowMaterial = mat(palette.pillow, { roughness: 0.95 });
  for (const z of [-0.29, 0.29]) {
    const pillow = rounded(0.34, 0.12, 0.54, 0.05, pillowMaterial, -0.74, 0.48, z);
    pillow.rotation.z = 0.28;
    bed.add(pillow);
  }
  const accentPillow = rounded(0.12, 0.26, 0.3, 0.05, mat(palette.accentPillow, { roughness: 0.95 }), -0.58, 0.55, 0.05);
  accentPillow.rotation.z = 0.3;
  bed.add(accentPillow);
  const bear = new THREE.Group();
  bear.position.set(-0.6, 0.45, 0.42);
  bear.rotation.y = -0.6;
  const fur = mat(palette.bear, { roughness: 1 });
  bear.add(rounded(0.13, 0.15, 0.11, 0.05, fur, 0, 0.08, 0));
  bear.add(rounded(0.12, 0.11, 0.11, 0.05, fur, 0, 0.21, 0));
  for (const side of [-1, 1]) {
    bear.add(rounded(0.04, 0.04, 0.03, 0.015, fur, 0, 0.27, side * 0.05));
    bear.add(rounded(0.05, 0.05, 0.06, 0.02, fur, 0.04, 0.025, side * 0.045));
    bear.add(box(0.012, 0.015, 0.012, mat("#161616"), 0.056, 0.225, side * 0.025));
  }
  bear.add(rounded(0.03, 0.03, 0.04, 0.012, mat("#e8cfa8"), 0.06, 0.2, 0));
  bed.add(bear);

  // Made bed: the duvet pulled up with the sheet folded over, stripes, and a
  // mustard throw at the foot.
  const duvet = mat(palette.duvet, { roughness: 0.95 });
  const stripe = mat(palette.duvetStripe, { roughness: 0.95 });
  const madeCovers = new THREE.Group();
  bed.add(madeCovers);
  madeCovers.add(rounded(1.44, 0.07, 1.27, 0.03, duvet, 0.3, 0.45, 0));
  for (const z of [-0.645, 0.645]) madeCovers.add(box(1.44, 0.17, 0.02, duvet, 0.3, 0.36, z));
  madeCovers.add(rounded(0.16, 0.075, 1.28, 0.03, mat(palette.sheet), -0.38, 0.455, 0));
  for (const x of [0.15, 0.25]) madeCovers.add(box(0.035, 0.074, 1.275, stripe, x, 0.452, 0));
  const throwMaterial = mat(palette.throw, { roughness: 1 });
  madeCovers.add(rounded(0.42, 0.05, 1.3, 0.02, throwMaterial, 0.74, 0.5, 0));
  madeCovers.add(box(0.42, 0.2, 0.02, throwMaterial, 0.74, 0.39, 0.665));

  // Slept-in bed: the duvet over him, folded down at his chest.
  const sleepingCovers = new THREE.Group();
  sleepingCovers.visible = false;
  bed.add(sleepingCovers);
  sleepingCovers.add(rounded(1.44, 0.06, 1.27, 0.03, duvet, 0.3, 0.45, 0));
  for (const z of [-0.645, 0.645]) sleepingCovers.add(box(1.44, 0.17, 0.02, duvet, 0.3, 0.36, z));
  sleepingCovers.add(rounded(1.38, 0.26, 0.84, 0.1, duvet, 0.29, 0.6, -0.2));
  sleepingCovers.add(rounded(0.12, 0.27, 0.86, 0.06, mat(palette.sheet), -0.4, 0.61, -0.2));
  for (const x of [0.15, 0.25]) sleepingCovers.add(box(0.035, 0.265, 0.845, stripe, x, 0.6, -0.2));
  sleepingCovers.add(rounded(0.4, 0.09, 0.6, 0.03, throwMaterial, 0.76, 0.5, 0.3));

  // Nightstand with a lamp and a phone on charge.
  const nightstand = new THREE.Group();
  nightstand.position.set(-2.7, 0, 1.62);
  room.add(nightstand);
  nightstand.add(box(0.42, 0.46, 0.4, wood, 0, 0.23, 0));
  nightstand.add(box(0.36, 0.16, 0.01, woodDark, 0.0, 0.3, 0.205));
  nightstand.add(box(0.06, 0.02, 0.02, mat(palette.gold, { metalness: 0.6, roughness: 0.3 }), 0, 0.3, 0.215));
  nightstand.add(cylinder(0.05, 0.06, 0.05, mat("#d9d4c7"), -0.06, 0.485, -0.04));
  nightstand.add(cylinder(0.012, 0.012, 0.16, mat(palette.metal), -0.06, 0.58, -0.04));
  const bedsideShade = mat("#efe2c4", { emissive: "#ffcf86", emissiveIntensity: 0, side: THREE.DoubleSide });
  nightstand.add(cylinder(0.07, 0.1, 0.12, bedsideShade, -0.06, 0.7, -0.04));
  nightstand.add(box(0.07, 0.008, 0.13, mat("#121316"), 0.09, 0.464, 0.06));
  const phoneScreen = new THREE.MeshBasicMaterial({ color: "#1b1d22", toneMapped: false });
  nightstand.add(box(0.06, 0.002, 0.115, phoneScreen, 0.09, 0.469, 0.06));
  const bedsideLight = new THREE.PointLight("#ffc77a", 0, 2.6, 1.8);
  bedsideLight.position.set(-2.76, 0.78, 1.58);
  room.add(bedsideLight);

  // A fluffy rug by the bed, and slippers that come off at bedtime.
  const fluffyRug = cylinder(0.5, 0.5, 0.02, mat("#e6dfd0", { roughness: 1 }), -1.45, 0.011, 1.75, 28);
  fluffyRug.castShadow = false;
  room.add(fluffyRug);
  const slippers = new THREE.Group();
  for (const z of [-0.07, 0.07]) slippers.add(rounded(0.2, 0.05, 0.09, 0.02, mat("#3c4250", { roughness: 1 }), 0, 0.03, z));
  slippers.position.set(-1.3, 0, 1.55);
  slippers.rotation.y = 0.3;
  room.add(slippers);

  // ── Marc ────────────────────────────────────────────────────────────
  // Built around the hips; +y is up and he faces -z. A positive x rotation
  // swings a limb forward and tips the head back.
  const marc = new THREE.Group();
  // Yaw first, then pitch: lets him lie face-up along the bed.
  marc.rotation.order = "YXZ";
  room.add(marc);
  const skin = mat(palette.skin);
  const barong = mat(palette.barong);
  const hair = mat(palette.hair);
  const ink = mat("#161616");

  const torso = new THREE.Group();
  marc.add(torso);
  torso.add(box(0.44, 0.52, 0.26, barong, 0, 0.3, 0));
  for (const x of [-0.07, 0.07]) torso.add(box(0.03, 0.42, 0.005, mat(palette.barongLine), x, 0.3, -0.133));
  torso.add(box(0.2, 0.05, 0.27, barong, 0, 0.56, 0));
  const sash = new THREE.Group();
  sash.position.set(0.01, 0.31, -0.142);
  sash.rotation.z = -0.62;
  sash.add(box(0.11, 0.7, 0.012, mat(palette.sash)));
  sash.add(box(0.015, 0.7, 0.014, mat(palette.sashTrim), -0.055, 0, 0));
  sash.add(box(0.015, 0.7, 0.014, mat(palette.sashTrim), 0.055, 0, 0));
  for (let i = 0; i < 4; i++) sash.add(box(0.05, 0.05, 0.016, mat(palette.gold), 0, -0.2 + i * 0.14, 0));
  torso.add(sash);
  torso.add(box(0.12, 0.06, 0.12, skin, 0, 0.59, 0));

  const head = new THREE.Group();
  head.position.y = 0.6;
  torso.add(head);
  // The face has its own material so it can flush red when he's angry.
  const face = mat(palette.skin);
  head.add(box(0.34, 0.34, 0.32, face, 0, 0.2, 0));
  head.add(box(0.36, 0.1, 0.34, hair, 0, 0.41, 0.005));
  head.add(box(0.36, 0.26, 0.08, hair, 0, 0.29, 0.135));
  for (const side of [-1, 1]) {
    head.add(box(0.04, 0.2, 0.28, hair, side * 0.175, 0.3, 0.02));
    head.add(box(0.04, 0.08, 0.06, skin, side * 0.185, 0.2, 0.02));
  }
  [[-0.12, 0.07], [-0.04, 0.09], [0.04, 0.08], [0.12, 0.06]].forEach(([x, height]) =>
    head.add(box(0.08, height, 0.04, hair, x, 0.37 - height / 2 + 0.02, -0.155)),
  );
  const brows = new THREE.Group();
  for (const x of [-0.075, 0.075]) brows.add(box(0.075, 0.02, 0.01, hair, x, 0.275, -0.163));
  head.add(brows);
  const eyes = new THREE.Group();
  eyes.position.set(0, 0.215, -0.161);
  for (const x of [-0.075, 0.075]) {
    eyes.add(box(0.065, 0.045, 0.004, mat("#f5f5f0"), x, 0, 0));
    eyes.add(box(0.03, 0.04, 0.006, ink, x + 0.006, 0, -0.002));
  }
  head.add(eyes);
  const closedEyes = new THREE.Group();
  for (const x of [-0.075, 0.075]) closedEyes.add(box(0.065, 0.012, 0.01, ink, x, 0.21, -0.162));
  closedEyes.visible = false;
  head.add(closedEyes);
  head.add(box(0.045, 0.055, 0.03, mat(palette.skinShade), 0, 0.165, -0.17));
  const mouth = box(0.08, 0.016, 0.01, mat("#7a3b30"), 0, 0.1, -0.161);
  head.add(mouth);
  const sunglasses = new THREE.Group();
  const lens = mat("#0b0b0b", { roughness: 0.25, metalness: 0.5 });
  for (const x of [-0.078, 0.078]) sunglasses.add(box(0.115, 0.075, 0.02, lens, x, 0.215, -0.17));
  sunglasses.add(box(0.36, 0.022, 0.022, lens, 0, 0.245, -0.17));
  sunglasses.visible = false;
  head.add(sunglasses);
  // Spiral eyes for when he's dizzy.
  const spiral = canvasTexture(64, 64);
  spiral.context.fillStyle = "#f5f5f0";
  spiral.context.fillRect(0, 0, 64, 64);
  spiral.context.strokeStyle = "#161616";
  spiral.context.lineWidth = 5;
  spiral.context.beginPath();
  for (let a = 0; a < Math.PI * 6; a += 0.2) {
    spiral.context.lineTo(32 + Math.cos(a) * (2 + a * 1.55), 32 + Math.sin(a) * (2 + a * 1.55));
  }
  spiral.context.stroke();
  const dizzyEyes = [-0.075, 0.075].map((x) => {
    const eye = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.07), new THREE.MeshBasicMaterial({ map: spiral.texture }));
    eye.position.set(x, 0.215, -0.165);
    eye.rotation.y = Math.PI;
    eye.visible = false;
    head.add(eye);
    return eye;
  });
  const wornHeadset = headset.clone();
  wornHeadset.visible = false;
  head.add(wornHeadset);
  // A Santa hat, for the Christmas months.
  const santaHat = new THREE.Group();
  santaHat.position.set(0, 0.45, 0.02);
  santaHat.rotation.z = -0.2;
  santaHat.add(cylinder(0.2, 0.2, 0.06, mat("#f4f1ea", { roughness: 1 }), 0, 0, 0, 18));
  const hatCone = cylinder(0, 0.18, 0.32, mat("#c8202e", { roughness: 0.9 }), 0.02, 0.18, 0, 18);
  hatCone.rotation.z = -0.4;
  santaHat.add(hatCone);
  santaHat.add(new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), mat("#f4f1ea", { roughness: 1 })).translateX(-0.12).translateY(0.3));
  santaHat.visible = false;
  head.add(santaHat);

  type Arm = { shoulder: THREE.Group; elbow: THREE.Group; hand: THREE.Group };
  const arms: Arm[] = [-1, 1].map((side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.29, 0.5, 0);
    torso.add(shoulder);
    shoulder.add(box(0.13, 0.3, 0.14, barong, 0, -0.15, 0));
    const elbow = new THREE.Group();
    elbow.position.y = -0.3;
    shoulder.add(elbow);
    elbow.add(box(0.12, 0.25, 0.13, barong, 0, -0.125, 0));
    const hand = new THREE.Group();
    hand.position.y = -0.26;
    elbow.add(hand);
    hand.add(box(0.1, 0.11, 0.1, skin, 0, -0.04, 0));
    return { shoulder, elbow, hand };
  });
  const [left, right] = arms;

  const legs = [-1, 1].map((side) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.115, 0.02, 0);
    marc.add(hip);
    hip.add(box(0.17, 0.44, 0.2, mat(palette.pants), 0, -0.22, 0));
    const knee = new THREE.Group();
    knee.position.y = -0.44;
    hip.add(knee);
    knee.add(box(0.16, 0.4, 0.18, mat(palette.pants), 0, -0.2, 0));
    knee.add(box(0.18, 0.08, 0.28, mat(palette.shoe), 0, -0.42, -0.05));
    return { hip, knee };
  });

  // Held things, at the palm of each hand.
  // Held by its side, handle toward the palm, so the rim can reach his lips.
  const heldMug = makeMug();
  heldMug.position.set(-0.11, -0.07, -0.01);
  right.hand.add(heldMug);
  const spoon = new THREE.Group();
  spoon.add(box(0.02, 0.012, 0.2, mat("#cfd3d8", { metalness: 0.7, roughness: 0.25 }), 0, 0, -0.08));
  spoon.add(box(0.05, 0.015, 0.06, mat("#cfd3d8", { metalness: 0.7, roughness: 0.25 }), 0, 0.004, -0.2));
  const riceOnSpoon = box(0.035, 0.02, 0.035, mat(palette.rice), 0, 0.016, -0.2);
  spoon.add(riceOnSpoon);
  spoon.position.set(0, -0.08, -0.02);
  // Angled inward, the way a spoon is held to bring it to the mouth.
  spoon.rotation.y = 1.2;
  right.hand.add(spoon);
  const heldPhone = makePhone();
  heldPhone.group.position.set(0, -0.1, -0.03);
  heldPhone.group.rotation.x = 0.95;
  heldPhone.group.scale.setScalar(1.3);
  heldPhone.screen.material = phoneLit;
  heldPhone.group.visible = false;
  right.hand.add(heldPhone.group);
  remote.position.set(0, -0.06, -0.02);
  remote.visible = false;
  left.hand.add(remote);
  // The controller in his hands, between the two palms.
  const heldPad = makePad();
  heldPad.position.set(-0.102, -0.052, -0.053);
  heldPad.rotation.set(-0.326, -0.317, -0.313);
  heldPad.visible = false;
  right.hand.add(heldPad);
  const fork = new THREE.Group();
  fork.add(box(0.02, 0.012, 0.22, mat("#cfd3d8", { metalness: 0.7, roughness: 0.25 }), 0, 0, -0.09));
  fork.position.set(0, -0.08, -0.02);
  left.hand.add(fork);

  // Floating "Zzz" over the bed and steam over hot drinks and food.
  const zzz = Array.from({ length: 3 }, () => {
    const { context, texture } = canvasTexture(64, 64);
    context.fillStyle = "#ffffff";
    context.font = "bold 48px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("Z", 32, 34);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
    room.add(sprite);
    return sprite;
  });
  // Music notes rising from the speaker.
  const notes = ["♪", "♫", "♪"].map((symbol) => {
    const { context, texture } = canvasTexture(64, 64);
    context.fillStyle = "#ffffff";
    context.font = "bold 50px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(symbol, 32, 34);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
    sprite.visible = false;
    room.add(sprite);
    return sprite;
  });

  // Stars circling his head when he's dizzy.
  const stars = Array.from({ length: 3 }, () => {
    const { context, texture } = canvasTexture(64, 64);
    context.fillStyle = "#ffd23f";
    context.font = "bold 54px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("★", 32, 34);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
    sprite.scale.setScalar(0.13);
    sprite.visible = false;
    room.add(sprite);
    return sprite;
  });

  // Speech bubble over Marc's head, drawn on top of everything.
  const speech = canvasTexture(1024, 192);
  const bubble = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: speech.texture, transparent: true, depthTest: false, depthWrite: false }),
  );
  bubble.renderOrder = 10;
  bubble.visible = false;
  room.add(bubble);

  const puff = puffTexture();
  const wind = Array.from({ length: 5 }, () => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: puff, transparent: true, depthWrite: false, opacity: 0, color: "#dff3ff" }));
    room.add(sprite);
    return sprite;
  });
  // Sweat drops for when it's too hot.
  const dropTexture = canvasTexture(32, 32);
  dropTexture.context.fillStyle = "#7cc4ff";
  dropTexture.context.beginPath();
  dropTexture.context.moveTo(16, 3);
  dropTexture.context.quadraticCurveTo(28, 20, 16, 29);
  dropTexture.context.quadraticCurveTo(4, 20, 16, 3);
  dropTexture.context.fill();
  const sweat = Array.from({ length: 2 }, () => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: dropTexture.texture, transparent: true, depthWrite: false }));
    sprite.visible = false;
    room.add(sprite);
    return sprite;
  });

  // Mochi and Tilapya.
  const cats = [createCat(room, mochi), createCat(room, tilapya)];
  let pickedCat = 0;
  const steam = Array.from({ length: 5 }, () => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: puff, transparent: true, depthWrite: false, opacity: 0 }));
    room.add(sprite);
    return sprite;
  });

  // ── Light ───────────────────────────────────────────────────────────
  const hemisphere = new THREE.HemisphereLight("#cfe3ff", "#3a2a20", 1);
  scene.add(hemisphere);
  const keyLight = new THREE.DirectionalLight("#ffffff", 1);
  keyLight.position.set(2.5, 8, 3.5);
  keyLight.target.position.set(-0.3, 0, -0.6);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  Object.assign(keyLight.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5 });
  keyLight.shadow.bias = -0.0005;
  scene.add(keyLight, keyLight.target);
  const screenGlow = new THREE.PointLight("#7aa7ff", 0, 3.2, 2);
  screenGlow.position.set(0.45, 1.25, -1.7);
  room.add(screenGlow);
  const deskGlow = new THREE.PointLight("#ff00aa", 0, 2.2, 2);
  deskGlow.position.set(0.45, 0.5, -2.6);
  room.add(deskGlow);

  // ── Posing ──────────────────────────────────────────────────────────
  // Poses set targets; each frame every joint eases toward its target, so
  // switching activities blends instead of snapping.
  const joints = [
    torso, head, left.shoulder, left.elbow, left.hand, right.shoulder, right.elbow, right.hand,
    legs[0].hip, legs[0].knee, legs[1].hip, legs[1].knee,
  ];
  const targets = new Map<THREE.Object3D, THREE.Vector3>(joints.map((joint) => [joint, new THREE.Vector3()]));
  const aim = (joint: THREE.Object3D, x = 0, y = 0, z = 0) => targets.get(joint)!.set(x, y, z);
  // Keeps a held thing level however the arm is bent, plus an extra tilt.
  const level = (arm: Arm, tilt = 0) =>
    aim(arm.hand, -(targets.get(arm.shoulder)!.x + targets.get(arm.elbow)!.x) + tilt);
  // Blends an arm between two solved poses.
  // Eases an arm's current targets part of the way toward a solved pose.
  const toward = (arm: Arm, [x, y, z, bend, tilt, yaw]: ArmPose, k: number) => {
    const s = targets.get(arm.shoulder)!;
    const e = targets.get(arm.elbow)!;
    const h = targets.get(arm.hand)!;
    s.set(s.x + (x - s.x) * k, s.y + (y - s.y) * k, s.z + (z - s.z) * k);
    e.x += (bend - e.x) * k;
    h.set(h.x + (-(x + bend) + tilt - h.x) * k, h.y + (yaw - h.y) * k, h.z * (1 - k));
  };
  const reach = (arm: Arm, from: ArmPose, to: ArmPose, k: number) => {
    const [x, y, z, bend, tilt, yaw] = from.map((value, i) => value + (to[i] - value) * k);
    aim(arm.shoulder, x, y, z);
    aim(arm.elbow, bend);
    aim(arm.hand, -(x + bend) + tilt, yaw);
  };

  let activity: Activity = "working";
  let light = 0;
  let running = false;
  let frame = 0;
  let swivel = 0;
  let place: "chair" | "bed" = "chair";
  let appear = 1;
  let angerGoal = 0;
  let replied = false;
  let phoneRoll = 0;
  let fridgeOpen = false;
  // Gaming on the PS5 instead of the PC.
  let consoleOn = false;
  let wasPlaying = -1;
  let camView: OfficeView = "room";
  let catCam = 0;
  let keysActive = false;
  let mousePressed = false;
  let wasPressed = false;
  let wasBuzzing = false;
  let thundering = false;
  let keyTimer = 0;
  let lastShotCycle = 0;
  let loopsKey = "";
  let fridgeOpenedAt = -99;
  // Which cat (if any) is curled up in his lap over coffee.
  let lapCat = -1;
  let lastLapCat = -1;
  let wasOnLap = false;
  let sweating = false;
  const clockTime = { minutes: 0 };
  const timer = new THREE.Clock();
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let lastDraw = -1;

  // ── Interactions ────────────────────────────────────────────────────
  // A click starts a short reaction: a timeline of poses that overrides the
  // activity's own pose until it ends.
  type Kind = "pc" | "lamp" | "wave" | "poked" | "snooze" | "jolt" | "clock" | "sip" | "music" | "spin" | "phone" | "hot";
  let reaction: { kind: Kind; start: number; length: number } | null = null;
  let pcOn = true;
  let spinAngle = 0;
  let spinSpeed = 0;
  let dizzyFrom: number | null = null;
  let seeingStars = false;
  let handOnMouse = false;
  let acOn = true;
  let weather: WeatherKind = "clear";
  let temperature: number | null = null;
  let pickedBook = -1;
  let hoveredBook = -1;
  let replies = 0;
  let phoneBuzzAt = -99;
  let bubbleAnchor: THREE.Object3D | null = null;
  let bubbleLift = 0.8;
  let lampOverride: boolean | null = null;
  let music = false;
  let crooked = false;
  let rage = 0;
  let lastRage = -99;
  let pokes: number[] = [];
  let waves = 0;
  let watered = 0;
  let anger = 0;
  let roll = 0;
  let plantSize = 1;
  let ringAt = -99;
  let wateredAt = -99;
  let bubbleFrom = -99;
  let bubbleUntil = -99;
  const tilt = { angle: 0, speed: 0 };
  // Reactions run on the wall clock, so one started while frames were paused
  // (a background tab) doesn't jump to its end on the next frame.
  const elapsed = () => performance.now() / 1000;
  const react = (kind: Kind, length: number) => {
    reaction = { kind, start: elapsed(), length };
  };
  const autoLamp = () => light < 0.45 && activity !== "sleeping";
  const lampIsOn = () => lampOverride ?? autoLamp();

  function say(line: string, from: THREE.Object3D | null = null, lift = 0.8) {
    bubbleAnchor = from;
    bubbleLift = lift;
    const c = speech.context;
    c.clearRect(0, 0, 1024, 192);
    let size = 54;
    const font = () => `600 ${size}px system-ui, 'Segoe UI', 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif`;
    c.font = font();
    while (c.measureText(line).width > 920 && size > 28) {
      size -= 2;
      c.font = font();
    }
    while (c.measureText(line).width > 920 && line.length > 4) line = line.slice(0, -2).trimEnd() + "…";
    const width = Math.min(1000, c.measureText(line).width + 84);
    c.fillStyle = "rgba(255,255,255,0.96)";
    c.beginPath();
    c.roundRect((1024 - width) / 2, 12, width, 132, 44);
    c.fill();
    c.beginPath();
    c.moveTo(490, 140);
    c.lineTo(512, 182);
    c.lineTo(534, 140);
    c.fill();
    c.fillStyle = "#121212";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(line, 512, 80);
    speech.texture.needsUpdate = true;
    bubbleFrom = elapsed();
    bubbleUntil = bubbleFrom + Math.max(2.8, line.length * 0.07);
    sound.play("blip");
    onSay?.(line);
  }

  function switchPc(on: boolean) {
    if (pcOn !== on) sound.play(on ? "powerUp" : "powerDown");
    pcOn = on;
    lastDraw = -1;
  }

  function poke(target: Target) {
    const now = elapsed();
    const asleep = activity === "sleeping";
    // He finishes fixing the PC or the lamp before anything else.
    const busyWith: Partial<Record<Kind, Target>> = { pc: "pc", lamp: "lamp", spin: "chair", hot: "aircon", phone: "phone" };
    const owner = reaction && busyWith[reaction.kind];
    // The cat and the books don't need Marc's attention.
    const aside = ["cat", "book", "fridge", "board"].includes(target);
    if (owner && owner !== target && !aside) return;
    if (asleep && target === "bed") target = "marc";
    const simple: Partial<Record<Target, Discovery>> = {
      lamp: "lamp", chair: "chair", mug: "mug", plant: "plant", speaker: "speaker", poster: "poster", bed: "bed",
      bear: "bear", fridge: "fridge", book: "book", board: "board", phone: "phone", clock: asleep ? "jolt" : "clock",
    };
    const plain = simple[target];
    if (plain) onFind?.(plain);
    switch (target) {
      case "pc": {
        if (!pcOn) {
          switchPc(true);
          if (reaction?.kind === "pc") {
            reaction = null;
            say("…oh. Thanks?");
          }
          break;
        }
        switchPc(false);
        onFind?.("pc");
        if (asleep) break;
        // On the PS5 the PC isn't in use: the game plays on, so no tantrum.
        if (activity === "gaming" && consoleOn) {
          say("Go ahead, I'm on the PS5.");
          break;
        }
        rage = now - lastRage < 25 ? rage + 1 : 0;
        lastRage = now;
        const lines = pcLines[activity];
        say(lines[Math.min(rage, lines.length - 1)]);
        if (rage >= 2) onFind?.("rage");
        react("pc", 4.6);
        break;
      }
      case "lamp":
        sound.play("click");
        if (lampOverride !== null) {
          lampOverride = null;
          if (reaction?.kind === "lamp") reaction = null;
        } else {
          lampOverride = !autoLamp();
          if (asleep) say(lampOverride ? "Mmph… too bright" : "Zzz…");
          else {
            say(lampOverride ? "It's daytime…" : "Hey, who turned off the light?");
            react("lamp", 3);
          }
        }
        applyLight();
        break;
      case "marc":
        if (asleep) {
          say("Five more minutes…");
          react("snooze", 2.2);
          break;
        }
        pokes = pokes.filter((at) => now - at < 5).concat(now);
        if (pokes.length >= 3) {
          onFind?.("poked");
          say("Stop poking me!");
          react("poked", 2.6);
        } else {
          onFind?.("wave");
          say(waveLines[waves++ % waveLines.length]);
          react("wave", 2.4);
        }
        break;
      case "chair":
        if (asleep) {
          spinSpeed += 14;
          break;
        }
        say(reaction?.kind === "spin" ? "Not again!!" : "Wheee!!");
        if (still) dizzyFrom = now;
        else {
          spinSpeed += 16;
          sound.play("whoosh");
          dizzyFrom = null;
        }
        reaction = { kind: "spin", start: now, length: Infinity };
        break;
      case "bed":
        say("Hey, I just made that bed");
        break;
      case "ps5":
        if (asleep) break;
        if (activity === "gaming") {
          consoleOn = !consoleOn;
          // Back to the PC turns it on again if it was switched off.
          if (!consoleOn) switchPc(true);
          lastDraw = -1;
          sound.play(consoleOn ? "powerUp" : "click");
          say(consoleOn ? "PS5 time. One more race." : "Back to the PC.");
          if (consoleOn) onFind?.("ps5");
        } else {
          say(activity === "eating" ? "After I eat." : "After work. Promise.");
        }
        break;
      case "board":
        sound.play("pop");
        onBoard?.();
        if (!asleep && !reaction) say(boardNotes.length ? "Read the notes!" : "Leave me a note!");
        break;
      case "cat": {
        const cat = cats[pickedCat];
        sound.play(Math.random() < 0.4 ? "meow" : "pop");
        onFind?.("pet");
        if (cat.pet(now) === "bite") {
          onFind?.("bite");
          sound.play("hiss");
          say(`HSSS! (${cat.name} has had enough)`, cat.head, 0.45);
        }
        else say(asleep ? "Purrr…" : `Purrr… ${cat.name} loves you`, cat.head, 0.45);
        break;
      }
      case "fridge":
        fridgeOpen = !fridgeOpen;
        sound.play("fridge");
        fridgeOpenedAt = now;
        if (fridgeOpen && !asleep) say("Grab me a soda while you're there");
        break;
      case "book":
        sound.play("pop");
        if (pickedBook >= 0) onBook?.(pickedBook);
        break;
      case "phone":
        phoneBuzzAt = now;
        if (asleep) say("…zzz");
        else if (activity === "gaming") say("Not now, I'm in a match!");
        else if (activity === "eating") say("I'll reply after I eat");
        else {
          say("New message!");
          replied = false;
          react("phone", 5.6);
        }
        break;
      case "aircon":
        sound.play("click");
        if (!acOn) {
          acOn = true;
          if (reaction?.kind === "hot") {
            reaction = null;
            say("Thank you!!");
          } else if (asleep) say("Zzz…");
          break;
        }
        acOn = false;
        onFind?.("aircon");
        if (asleep) say("Mmm… so hot…");
        else {
          say(temperature !== null ? `It's ${temperature}°C in Bulacan!!` : "So hot!!");
          react("hot", 4.6);
        }
        break;
      case "bear":
        say(asleep ? "Zzz… Mr. Bear…" : "That's Mr. Bear. Be nice");
        break;
      case "clock":
        ringAt = now;
        sound.play("alarm");
        if (asleep) {
          say("AAH! …it's not even morning");
          react("jolt", 2.4);
        } else {
          say(activity === "gaming" ? "One more match…" : "Already?!");
          react("clock", 2);
        }
        break;
      case "mug":
        say("Ahh, needed that");
        react("sip", 2.6);
        break;
      case "plant":
        watered++;
        wateredAt = now;
        if (watered >= 6) onFind?.("overwater");
        if (!asleep) {
          say(watered >= 6 ? "Okay, that's enough water" : watered >= 3 ? "It's growing!" : "Thanks for watering it");
        }
        break;
      case "speaker":
        music = !music;
        if (asleep && music) {
          say("Turn it down!");
          react("music", 2.4);
        } else if (!asleep) {
          say(music ? "♪ Ooh, good song" : "Hey, I was vibing to that");
        }
        break;
      case "poster":
        crooked = !crooked;
        tilt.speed += crooked ? 2.2 : -1.4;
        if (!asleep) say(crooked ? "…is my poster crooked?" : "Much better.");
        break;
    }
  }

  // Where the chair should be during a reaction: turned and rolled along
  // the desk toward whatever he's reaching for.
  function seatGoal(now: number) {
    if (!reaction) return null;
    const r = now - reaction.start;
    switch (reaction.kind) {
      case "pc":
        return { swivel: 0, roll: r > 2.0 && r < 3.8 ? 0.55 : 0 };
      case "lamp":
        return { swivel: 0, roll: r > 0.6 && r < 2.5 ? LAMP_ROLL : 0 };
      case "wave":
      case "poked":
        return { swivel: -2.35, roll: 0 };
      case "sip":
      case "phone":
      case "hot":
        return { swivel: 0, roll: 0 };
      case "spin":
        // Comes to rest dizzy, facing whoever spun him.
        return dizzyFrom === null ? null : { swivel: -2.35, roll: 0 };
      default:
        return null;
    }
  }

  // Overrides the activity's pose while a reaction plays. Returns how angry
  // he looks, from 0 to 1.
  function reactionPose(now: number) {
    if (!reaction) return 0;
    const r = now - reaction.start;
    if (r >= reaction.length) {
      if (reaction.kind === "pc") switchPc(true);
      if (reaction.kind === "music") music = false;
      reaction = null;
      return 0;
    }
    switch (reaction.kind) {
      case "pc": {
        if (r < 2.1) {
          // Fists in the air, shaking.
          const shake = Math.sin(now * 22) * 0.18;
          aim(torso, 0.05, 0, Math.sin(now * 18) * 0.04);
          aim(left.shoulder, 2.5 + shake, 0, -0.35);
          aim(right.shoulder, 2.5 - shake, 0, 0.35);
          aim(left.elbow, 1.0);
          aim(right.elbow, 1.0);
          aim(left.hand);
          aim(right.hand);
          aim(head, 0.25, 0, Math.sin(now * 14) * 0.08);
          mouth.scale.set(1.4, 3, 1);
          return 1;
        }
        if (r < 3.8) {
          // Rolls over and jabs the power button on top of the PC.
          const press = r > 3.0 && r < 3.35 ? -0.18 : 0;
          aim(torso, -0.12, 0, -0.22);
          aim(right.shoulder, 2.1 + press, 0, 0.7);
          aim(right.elbow, 0.1);
          aim(right.hand, 0.4);
          aim(left.shoulder, 1.1, 0, 0.1);
          aim(left.elbow, 0.5);
          level(left);
          aim(head, -0.1, -0.5);
          if (r > 3.2 && !pcOn) {
            switchPc(true);
            say(rage >= 2 ? "There. DON'T touch it" : pcBackLines[activity]);
          }
          return 0.6;
        }
        return 0.25;
      }
      case "lamp": {
        if (r < 0.9) {
          aim(head, 0.05, 0.6);
          return 0.2;
        }
        if (r < 2.5) {
          // Rolls left, leans in and presses the switch on the lamp's base.
          aim(torso, ...LAMP_LEAN);
          reach(left, LAMP_PRESS, LAMP_PRESS, 0);
          if (r > 1.6 && r < 1.95) targets.get(left.elbow)!.x += 0.08;
          aim(head, -0.25, 0.45);
          if (r > 1.8 && lampOverride !== null) {
            lampOverride = null;
            sound.play("click");
            applyLight();
          }
        }
        return 0.1;
      }
      case "wave": {
        const wave = Math.sin(now * 10);
        aim(right.shoulder, 2.9, 0, 0.25 + wave * 0.25);
        aim(right.elbow, 0.35 + wave * 0.2);
        aim(right.hand);
        aim(head, 0.1, 0, wave * 0.05);
        mouth.scale.set(1.4, 1.6, 1);
        return 0;
      }
      case "poked": {
        // Arms crossed, shaking his head.
        aim(left.shoulder, 1.35, 0, 0.45);
        aim(right.shoulder, 1.35, 0, -0.45);
        aim(left.elbow, 1.9);
        aim(right.elbow, 1.9);
        aim(left.hand);
        aim(right.hand);
        aim(head, -0.1, Math.sin(now * 8) * 0.3);
        return 1;
      }
      case "snooze":
        aim(head, 0, 0.3 + Math.sin(now * 3) * 0.35, 0);
        return 0.3;
      case "jolt":
      case "music": {
        // Startled awake: eyes open, head up, arms out.
        const startled = r < 1.4 || reaction.kind === "music";
        eyes.visible = startled;
        closedEyes.visible = !startled;
        if (startled) {
          marc.position.y += Math.max(0, Math.sin(Math.min(r, 0.5) * Math.PI * 2)) * 0.12;
          aim(head, -0.45, 0, 0);
          aim(left.shoulder, 0, 0, -0.7);
          aim(right.shoulder, 0, 0, 0.7);
        }
        return reaction.kind === "music" ? 1 : 0.5;
      }
      case "clock":
        aim(head, 0.4, 0.2);
        return 0;
      case "phone": {
        // Buzz, pick it up, read and reply, put it back.
        phoneMoment(r - 0.4);
        if (r > 4.6 && !replied) {
          replied = true;
          say(replyLines[replies++ % replyLines.length]);
        }
        return 0;
      }
      case "hot": {
        sweating = true;
        if (r < 2.6) {
          // Fanning himself.
          const fan = Math.sin(now * 14);
          aim(right.shoulder, 1.9, 0, -0.3 + fan * 0.18);
          aim(right.elbow, 1.5);
          aim(right.hand, 0, 0, fan * 0.4);
          aim(head, 0.15);
          mouth.scale.set(1.2, 1.8, 1);
          return 0.3;
        }
        // Points the remote at the AC.
        remote.visible = true;
        aim(left.shoulder, 0.15, 0, -2.07);
        aim(left.elbow, 0.05);
        aim(left.hand);
        aim(head, 0.35, 0.9);
        if (r > 3.4 && !acOn) {
          acOn = true;
          say("Ahh… much better");
        }
        return 0;
      }
      case "spin": {
        if (dizzyFrom === null) {
          if (spinSpeed > 1.5) {
            // Arms out, along for the ride.
            aim(left.shoulder, 0.4, 0, -1.2);
            aim(right.shoulder, 0.4, 0, 1.2);
            aim(left.elbow, 0.2);
            aim(right.elbow, 0.2);
            aim(left.hand);
            aim(right.hand);
            aim(head, 0.25);
            mouth.scale.set(1.3, 2.6, 1);
            return 0;
          }
          dizzyFrom = now;
          say("Whoa…");
        }
        if (now - dizzyFrom > 3) {
          reaction = null;
          dizzyFrom = null;
          say("Okay… I'm okay");
          return 0;
        }
        // Dizzy: head going round, swaying, spiral eyes and stars.
        const wobble = now * 4.5;
        aim(head, Math.sin(wobble) * 0.16, 0, Math.cos(wobble) * 0.16);
        aim(torso, 0, 0, Math.sin(wobble * 0.5) * 0.08);
        aim(left.shoulder, 0.25, 0, -0.18);
        aim(right.shoulder, 0.25, 0, 0.18);
        aim(left.elbow, 0.3);
        aim(right.elbow, 0.3);
        aim(left.hand);
        aim(right.hand);
        eyes.visible = false;
        for (const eye of dizzyEyes) {
          eye.visible = true;
          eye.rotation.z = now * 6;
        }
        mouth.scale.set(1.2, 1.6, 1);
        seeingStars = true;
        return 0;
      }
      case "sip": {
        // Picks the mug up off the desk for a sip.
        deskMug.visible = false;
        heldMug.visible = true;
        const sip = smooth(pulse(r, 0.4, 2.2));
        reach(right, MUG_HOLD, MUG_SIP, sip);
        aim(head, sip * 0.2);
        mouth.scale.set(1, 1 + sip * 0.6, 1);
        return 0;
      }
    }
  }

  // Picking the phone up and reading it, r seconds into the moment: a buzz,
  // a reach, about three seconds reading, then back on the desk.
  function phoneMoment(r: number) {
    const now = elapsed();
    if (r < 0) {
      phoneBuzzAt = Math.max(phoneBuzzAt, now - 1);
      // Rolls over toward it as it buzzes.
      phoneRoll = r > -0.6 ? PHONE_ROLL : 0;
      return;
    }
    const reachK = smooth(Math.min(1, r / 0.6));
    const backK = smooth(Math.min(1, Math.max(0, (r - 3.9) / 0.6)));
    phoneRoll = r < 4.5 ? PHONE_ROLL : 0;
    if (r < 4.5) {
      // The mug goes down while his hand is busy.
      heldMug.visible = false;
      if (activity === "coffee") deskMug.visible = true;
    }
    if (r < 0.6) toward(right, PHONE_GRAB, reachK);
    else if (r < 3.9) {
      toward(right, PHONE_READ, 1);
      deskPhone.group.visible = false;
      heldPhone.group.visible = true;
      targets.get(head)!.x -= 0.22;
      targets.get(head)!.y += 0.12;
    } else if (r < 4.5) toward(right, PHONE_GRAB, 1 - backK * 0.6);
  }

  // Raycasting from the pointer: the first visible thing under it, if it's
  // one of the clickable things (walls and furniture block what's behind).
  const clickable = new Map<THREE.Object3D, Target>([
    [pc, "pc"],
    [restHeadset, "pc"],
    [lamp, "lamp"],
    [marc, "marc"],
    [chair, "chair"],
    [bed, "bed"],
    [bear, "bear"],
    ...cats.map((cat) => [cat.group, "cat"] as [THREE.Object3D, Target]),
    [fridge, "fridge"],
    [board, "board"],
    [ps5, "ps5"],
    [deskPhone.group, "phone"],
    [aircon, "aircon"],
    ...books.map((book) => [book, "book"] as [THREE.Object3D, Target]),
    [clock, "clock"],
    [deskMug, "mug"],
    [pot, "plant"],
    [leaves, "plant"],
    [speaker, "speaker"],
    [posterGroup, "poster"],
  ]);
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const shown = (object: THREE.Object3D) => {
    for (let o: THREE.Object3D | null = object; o; o = o.parent) if (!o.visible) return false;
    return true;
  };
  function targetAt(event: PointerEvent): Target | null {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    for (const hit of raycaster.intersectObject(room, true)) {
      if (!(hit.object instanceof THREE.Mesh) || !shown(hit.object)) continue;
      for (let o: THREE.Object3D | null = hit.object; o; o = o.parent) {
        const target = clickable.get(o);
        if (target === "book") pickedBook = books.indexOf(o as THREE.Group);
        if (target === "cat") pickedCat = cats.findIndex((cat) => cat.group === o);
        if (target) return target;
      }
      return null;
    }
    return null;
  }

  function pose(t: number, now: number) {
    const sleeping = activity === "sleeping";
    const turned = activity === "coffee";
    sleepingCovers.visible = sleeping;
    madeCovers.visible = !sleeping;
    slippers.visible = sleeping;
    // Tossed onto the floor at bedtime.
    if (sleeping) {
      accentPillow.position.set(0.7, -0.3, 0.95);
      accentPillow.rotation.set(Math.PI / 2, 0, 0.4);
    } else {
      accentPillow.position.set(-0.58, 0.55, 0.05);
      accentPillow.rotation.set(0, 0, 0.3);
    }
    for (const eye of dizzyEyes) eye.visible = false;
    seeingStars = false;
    handOnMouse = false;
    lapCat = -1;
    deskPad.visible = !(activity === "gaming" && consoleOn);
    heldPad.visible = !deskPad.visible;
    keysActive = false;
    mousePressed = false;
    deskPhone.group.visible = true;
    heldPhone.group.visible = false;
    remote.visible = false;
    sweating = false;
    heldMug.visible = activity === "coffee";
    deskMug.visible = activity === "coding-late" || activity === "working";
    meal.visible = activity === "eating";
    water.visible = activity === "eating";
    spoon.visible = activity === "eating";
    fork.visible = activity === "eating";
    wornHeadset.visible = activity === "gaming";
    restHeadset.visible = activity !== "gaming";
    eyes.visible = !sleeping;
    closedEyes.visible = sleeping;
    mouth.scale.set(1, 1, 1);
    for (const joint of joints) aim(joint);

    // Blink every few seconds.
    const blink = (t % 4.2) < 0.12;
    eyes.scale.y = blink ? 0.15 : 1;

    const nextPlace = sleeping ? "bed" : "chair";
    if (nextPlace !== place) {
      place = nextPlace;
      appear = 0;
    }

    if (sleeping) {
      // On his back, head on the pillow by the wall.
      marc.position.set(-1.85, 0.57, 0.43);
      marc.rotation.set(Math.PI / 2, -Math.PI / 2, 0);
      swivel = 0;
      aim(head, 0, 0.3, 0);
      aim(left.shoulder, 0, 0, -0.08);
      aim(right.shoulder, 0, 0, 0.08);
      const breath = Math.sin(t * 1.6);
      torso.scale.set(1, 1, 1 + breath * 0.04);
      // A lamp left on (or music) keeps him tossing instead of sleeping.
      const restless = lampIsOn() || music || !acOn;
      if (!acOn) sweating = true;
      if (restless) aim(head, 0, -0.6 + Math.sin(t * 1.2) * 0.12, 0);
      angerGoal = reactionPose(now);
      zzz.forEach((sprite, i) => {
        const phase = (t * 0.32 + i / 3) % 1;
        sprite.position.set(-2.55 + phase * 0.35, 0.95 + phase * 0.95, 0.5 + phase * 0.25);
        sprite.material.opacity = Math.sin(phase * Math.PI);
        sprite.scale.setScalar(0.12 + phase * 0.16);
        sprite.visible = !restless && !reaction;
      });
      return;
    }
    for (const sprite of zzz) sprite.visible = false;
    torso.scale.set(1, 1, 1);

    // Seated: the chair (and Marc) swivel toward the camera for coffee.
    const seat = seatGoal(now) ?? { swivel: turned ? -2.35 : 0, roll: 0 };
    // The phone (from last frame's pose) can roll him over toward the PC;
    // otherwise the reaction decides (the lamp rolls him the other way).
    const rollGoal = phoneRoll !== 0 ? phoneRoll : seat.roll;
    phoneRoll = 0;
    swivel = still ? seat.swivel : swivel + (seat.swivel - swivel) * 0.08;
    roll = still ? rollGoal : roll + (rollGoal - roll) * 0.08;
    chair.position.x = CHAIR.x + roll;
    const facing = swivel + spinAngle;
    marc.position.set(CHAIR.x + roll + Math.sin(facing) * 0.06, 0.6, CHAIR.z + Math.cos(facing) * 0.06);
    marc.rotation.set(0, facing, 0);
    for (const { hip, knee } of legs) {
      aim(hip, Math.PI / 2);
      aim(knee, -Math.PI / 2);
    }
    const typing = (side: number, speed = 16) => Math.sin(t * speed + side * 1.9) * 0.05;

    if (activity === "working" || activity === "coding-late") {
      aim(left.shoulder, 1.12, 0, 0.1);
      aim(right.shoulder, 1.12, 0, -0.1);
      aim(left.elbow, 0.5 + typing(0));
      aim(right.elbow, 0.5 + typing(1));
      level(left);
      level(right);
      aim(head, -0.12 + Math.sin(t * 1.3) * 0.03);
      if (activity === "coding-late") {
        // Every so often, a long stretch and a yawn.
        const stretch = smooth(pulse(t % 14, 10.5, 13.5));
        aim(left.shoulder, 1.12 + stretch * 1.9, 0, 0.1 - stretch * 0.25);
        aim(right.shoulder, 1.12 + stretch * 1.9, 0, -0.1 + stretch * 0.25);
        aim(left.elbow, (0.5 + typing(0)) * (1 - stretch));
        aim(right.elbow, (0.5 + typing(1)) * (1 - stretch));
        level(left);
        level(right);
        aim(head, -0.12 + stretch * 0.4);
        aim(torso, stretch * 0.12);
        mouth.scale.set(1, 1 + stretch * 3, 1);
      }
      // Every half minute the phone buzzes and he checks it.
      const moment = (t % 30) - 21;
      const onPhone = !reaction && activity === "working" && moment > -1.2 && moment < 4.6;
      // About half the time the right hand is on the mouse, scrolling and
      // clicking around, then it goes back to the keys. (After the stretch,
      // which re-aims both arms, and never during it.)
      const cycle = t % 8;
      const ramp = (x: number) => Math.min(1, Math.max(0, x));
      const onMouse = smooth(ramp((cycle - 2.5) / 0.5) * ramp((6.5 - cycle) / 0.5));
      const stretching = activity === "coding-late" && t % 14 > 10.3 && t % 14 < 13.7;
      if (onMouse > 0 && !stretching && !onPhone) {
        const glide = 0.5 + Math.sin(t * 1.4) * 0.45;
        toward(right, between(...MOUSE_CODE, glide), onMouse);
        // A click every couple of seconds.
        if (onMouse > 0.9 && t % 1.8 < 0.15) {
          targets.get(right.hand)!.x -= 0.06;
          mousePressed = true;
        }
        targets.get(head)!.y -= onMouse * 0.12;
        handOnMouse = onMouse > 0.9;
      }
      if (onPhone) phoneMoment(moment);
      keysActive = !onPhone && onMouse < 0.5 && !stretching;
    } else if (activity === "gaming" && consoleOn) {
      // Leaning back with the controller, thumbs busy, steering with the body.
      const steer = Math.sin(t * 1.3);
      aim(torso, 0.08, 0, steer * 0.05);
      reach(right, PAD_RIGHT, PAD_RIGHT, 0);
      reach(left, PAD_LEFT, PAD_LEFT, 0);
      targets.get(right.hand)!.x += Math.sin(t * 11) * 0.04;
      targets.get(left.hand)!.x += Math.sin(t * 9 + 1) * 0.04;
      aim(head, -0.04, steer * 0.08, steer * 0.06);
    } else if (activity === "gaming") {
      // Keyboard and mouse: WASD on the left, flicks and clicks on the right.
      const cycle = (t % 3.2) / 3.2;
      const shooting = cycle > 0.4 && cycle < 0.62;
      const flick = Math.sin(t * 2.3) * 0.08 + (shooting ? Math.sin(t * 40) * 0.015 : 0);
      aim(torso, -0.1);
      aim(left.shoulder, 1.1, 0, 0.16);
      aim(left.elbow, 0.5 + typing(0, 9) * 0.6);
      level(left);
      // Right hand on the mouse, flicking it left and right; a little press
      // on each shot.
      reach(right, MOUSE_GAME[0], MOUSE_GAME[1], Math.min(1, Math.max(0, 0.5 + flick * 6)));
      if (shooting) targets.get(right.hand)!.x -= 0.06;
      handOnMouse = true;
      keysActive = true;
      aim(head, -0.14 + Math.sin(t * 2.3) * 0.02, flick * 0.4);
    } else if (activity === "coffee") {
      // Holding the mug at the chest, then a sip every few seconds.
      const sip = smooth(pulse(t % 5.5, 2.4, 5.0));
      reach(right, MUG_HOLD, MUG_SIP, sip);
      // Some coffee breaks he calls one of the cats over, patting his lap;
      // she walks across, jumps up, and he strokes her while he drinks.
      const round = Math.floor(t / 26);
      const inRound = t % 26;
      lapCat = chance(round) > 0.45 && inRound > 2 && inRound < 22 ? round % 2 : -1;
      if (lapCat >= 0 && cats[lapCat].isSettled()) {
        reach(left, LAP_PET[0], LAP_PET[1], 0.5 + Math.sin(t * 2.4) * 0.5);
        aim(head, -0.25 + sip * 0.45);
      } else if (lapCat >= 0) {
        reach(left, LAP_PET[0], LAP_PET[0], 0);
        targets.get(left.hand)!.x += Math.sin(t * 13) * 0.3;
        aim(head, -0.1, Math.sin(t * 1.5) * 0.3);
      } else {
        aim(left.shoulder, 0.32, 0, 0.12);
        aim(left.elbow, 0.55);
        level(left);
        aim(head, sip * 0.2);
      }
      mouth.scale.set(1, 1 + sip * 0.6, 1);
    } else if (activity === "eating") {
      // Spoon and fork, Filipino style, with a movie on: eyes on the screen,
      // a glance down to scoop from the plate, then up to the mouth. Now and
      // then a laugh at the film.
      const meal = t % 4.5;
      const bite = smooth(pulse(meal, 1.6, 3.2));
      const glance = smooth(pulse(meal, 0.3, 1.5));
      reach(right, SPOON_SCOOP, SPOON_BITE, bite);
      aim(left.shoulder, 0.75, 0, 0.16);
      aim(left.elbow, 0.68 + Math.sin(t * 2) * 0.04);
      level(left);
      const laugh = bite > 0 ? 0 : smooth(pulse(t % 13, 9, 10.4));
      aim(head, 0.04 - glance * 0.36 + laugh * 0.18, 0, Math.sin(t * 18) * 0.04 * laugh);
      aim(torso, laugh * 0.08 + Math.sin(t * 20) * 0.02 * laugh);
      riceOnSpoon.visible = bite > 0.05;
      mouth.scale.set(1 + laugh * 0.3, 1 + bite * 1.4 + laugh * 2, 1);
    }

    // Bopping along when the music's on.
    if (music && !reaction) {
      targets.get(head)!.z += Math.sin(t * 7.5) * 0.09;
      targets.get(torso)!.z += Math.sin(t * 7.5 + 0.6) * 0.03;
    }
    angerGoal = reactionPose(now);
  }

  // Angry brows and a red face, easing in and out with the reaction.
  const calm = new THREE.Color(palette.skin);
  const flushed = new THREE.Color("#d0563f");
  function applyMood(dt: number) {
    anger = still ? angerGoal : anger + (angerGoal - anger) * (1 - Math.exp(-dt * 8));
    const [leftBrow, rightBrow] = brows.children;
    leftBrow.rotation.z = -0.45 * anger;
    rightBrow.rotation.z = 0.45 * anger;
    brows.position.y = -0.012 * anger;
    face.color.copy(calm).lerp(flushed, anger * 0.55);
  }

  // The poster swings on its nail, the clock shakes when its alarm rings and
  // the plant springs up when watered.
  function animateProps(dt: number, now: number) {
    const goal = crooked ? 0.2 : 0;
    if (still) {
      tilt.angle = goal;
      tilt.speed = 0;
    } else {
      tilt.speed += ((goal - tilt.angle) * 30 - tilt.speed * 3) * dt;
      tilt.angle += tilt.speed * dt;
    }
    posterGroup.rotation.z = tilt.angle;

    const ringing = now - ringAt;
    clock.rotation.z = ringing < 1.6 && !still ? Math.sin(now * 45) * 0.1 * (1 - ringing / 1.6) : 0;

    const size = 1 + Math.min(watered, 6) * 0.05;
    plantSize = still ? size : plantSize + (size - plantSize) * (1 - Math.exp(-dt * 3));
    const since = now - wateredAt;
    const bounce = since < 1.5 && !still ? Math.sin(since * 14) * Math.exp(-since * 4) * 0.12 : 0;
    leaves.scale.set(plantSize * (1 - bounce * 0.5), plantSize * (1 + bounce), plantSize * (1 - bounce * 0.5));

    powerMaterial.color.set(pcOn ? "#00e5ff" : "#1a1a1a");
    ps5Light.color.set(activity === "gaming" && consoleOn ? "#3d7bff" : "#ff9a3d");
    if (festive.visible) twinkle(now);

    // A pointed-at book slides out of the shelf.
    books.forEach((book, i) => {
      const out = i === hoveredBook ? 0.08 : 0;
      book.position.x += (-2.85 + out - book.position.x) * (still ? 1 : 1 - Math.exp(-dt * 12));
    });

    // The phone rattles on the desk and lights up when it buzzes.
    const buzzing = now - phoneBuzzAt < 1.2;
    if (buzzing && !wasBuzzing) sound.play("buzz");
    wasBuzzing = buzzing;
    deskPhone.screen.material = buzzing || heldPhone.group.visible ? phoneLit : phoneOff;
    deskPhone.group.position.copy(PHONE_REST);
    if (buzzing && !still) {
      deskPhone.group.position.x += Math.sin(now * 90) * 0.004;
      deskPhone.group.position.z += Math.cos(now * 70) * 0.003;
    }

    // The AC's flap swings while it runs, and cool air drifts down.
    flap.rotation.z = acOn ? -0.6 + Math.sin(now * 0.8) * 0.25 : 0;
    acLed.color.set(acOn ? "#3ddc84" : "#3a1c1c");
    acScreen.visible = acOn;
    wind.forEach((puffSprite, i) => {
      const phase = (now * 0.35 + i / wind.length) % 1;
      puffSprite.visible = acOn && !still;
      puffSprite.position.set(-2.7 + phase * 0.9, 2.0 - phase * 0.8, -1.75 + Math.sin(phase * 5 + i) * 0.3);
      puffSprite.scale.setScalar(0.18 + phase * 0.35);
      puffSprite.material.opacity = Math.sin(phase * Math.PI) * 0.16;
    });

    // Sweat runs down his face when it's too hot.
    head.getWorldPosition(worldPoint);
    sweat.forEach((drop, i) => {
      drop.visible = sweating && !still;
      if (!drop.visible) return;
      const phase = (now * 0.9 + i * 0.5) % 1;
      drop.position.set(worldPoint.x + (i ? 0.2 : -0.2), worldPoint.y + 0.3 - phase * 0.25, worldPoint.z);
      drop.scale.setScalar(0.06);
      drop.material.opacity = 1 - phase;
    });
  }

  // The cats roam, unless Marc is asleep (they sleep on the bed), eating
  // (they eat at their bowls) or has one in his lap.
  const lapPoint = new THREE.Vector3();
  // Every so often the cats play: a chase round the rug, then a scuffle.
  const playPoints = [new THREE.Vector3(), new THREE.Vector3()];
  const PLAY = { every: 80, start: 55, chase: 8, scuffle: 3 };
  function playMode(i: number, p: number, t: number): CatMode {
    const centre = { x: 0.35, z: -0.15 };
    if (p < PLAY.chase) {
      const angle = p * 1.3 - i * 0.8;
      playPoints[i].set(centre.x + Math.cos(angle) * 0.62, 0, centre.z + Math.sin(angle) * 0.62);
      return { kind: "play", at: playPoints[i], facing: Math.atan2(-Math.sin(angle), Math.cos(angle)), pose: "run", hop: 0 };
    }
    const side = i ? 1 : -1;
    playPoints[i].set(centre.x + side * 0.17, 0, centre.z);
    return {
      kind: "play",
      at: playPoints[i],
      facing: side > 0 ? -Math.PI / 2 : Math.PI / 2,
      pose: "swipe",
      hop: Math.abs(Math.sin(t * 9 + i * 1.7)) * 0.07,
    };
  }
  function updateCats(t: number, now: number, dt: number) {
    marc.updateMatrixWorld(true);
    const round = (t % PLAY.every) - PLAY.start;
    const playing =
      !still && activity !== "sleeping" && activity !== "eating" && lapCat < 0 && round >= 0 && round < PLAY.chase + PLAY.scuffle
        ? round
        : -1;
    const stage = playing < 0 ? -1 : playing < PLAY.chase ? 0 : 1;
    if (stage !== wasPlaying) {
      if (stage === 0) {
        sound.play("meow");
        onFind?.("play");
      }
      if (stage === 1) {
        sound.play("hiss");
        if (activity !== "sleeping" && !reaction) say("Hey, no fighting!");
      }
      wasPlaying = stage;
    }
    cats.forEach((cat, i) => {
      if (playing >= 0) {
        cat.update(t, now, dt, playMode(i, playing, t), still);
      } else if (lapCat === i) {
        marc.localToWorld(lapPoint.set(0, 0.12, -0.26));
        cat.update(t, now, dt, { kind: "lap", at: lapPoint, facing: marc.rotation.y + Math.PI / 2 }, still, cat.isSettled());
      } else {
        const kind = activity === "sleeping" ? "bed" : activity === "eating" ? "bowl" : "roam";
        cat.update(t, now, dt, { kind }, still);
      }
    });
    for (const food of kibble) food.visible = activity === "eating";

    // Tilapya bats the soda can off the desk; it clatters to the floor.
    const knock = cats[1].currentTag();
    if (canState === "desk" && knock?.tag === "knock" && knock.progress > 0.55) {
      canState = "falling";
      onFind?.("can");
      canVelocity.set(0, 0.6, 1.1);
      if (activity !== "sleeping" && !reaction) say("TILAPYA");
    }
    if (canState === "falling") {
      canVelocity.y -= 9.8 * dt;
      deskCan.position.addScaledVector(canVelocity, dt);
      deskCan.rotation.x += dt * 9;
      if (deskCan.position.y <= 0.05) {
        deskCan.position.y = 0.05;
        deskCan.rotation.set(Math.PI / 2, 0, 0.4);
        canState = "floor";
        canLandedAt = now;
        sound.play("crash");
      }
    }
    // Later he picks it up and puts it back.
    if (canState === "floor" && now - canLandedAt > 18) {
      canState = "desk";
      deskCan.position.copy(CAN_HOME);
      deskCan.rotation.set(0, 0, 0);
    }
    if (lapCat >= 0 && lapCat !== lastLapCat && !reaction) say(`Psst, ${cats[lapCat].name}! Come here`);
    const onLap = lapCat >= 0 && cats[lapCat].isSettled();
    if (onLap && !wasOnLap) {
      sound.play("meow");
      onFind?.("lap");
    }
    if (onLap && !wasOnLap && !reaction) say(`Hey, ${cats[lapCat].name}`);
    lastLapCat = lapCat;
    wasOnLap = onLap;

    // The fridge door swings, and closes itself if left open.
    if (fridgeOpen && now - fridgeOpenedAt > 5) {
      fridgeOpen = false;
      sound.play("fridge");
      if (activity !== "sleeping") say("Close the fridge, it's not a showroom");
    }
    const doorGoal = fridgeOpen ? -1.75 : 0;
    fridgeDoor.rotation.y += (doorGoal - fridgeDoor.rotation.y) * (still ? 1 : 1 - Math.exp(-dt * 6));
    fridgeLight.intensity = fridgeOpen ? 1.6 : 0.6;
    fridgeBack.emissiveIntensity = fridgeOpen ? 1.1 : 0.7;
  }

  // Keys, clicks and gunfire from what he's doing; the loops from the room.
  function soundTick(t: number, dt: number) {
    if (keysActive && pcOn && !reaction) {
      keyTimer -= dt;
      if (keyTimer <= 0) {
        sound.play("key");
        keyTimer = 0.06 + Math.random() * 0.12;
      }
    }
    if (mousePressed && !wasPressed) sound.play("click");
    wasPressed = mousePressed;
    if (activity === "gaming" && pcOn && !reaction && !consoleOn) {
      const cycle = (t % 3.2) / 3.2;
      for (const shot of [0.42, 0.5, 0.58]) if (lastShotCycle < shot && cycle >= shot) sound.play("shot");
      lastShotCycle = cycle;
    }
    // Moments in a repeating cycle of `length` seconds, played as t passes them.
    const at = (length: number, moments: number[], name: Parameters<typeof sound.play>[0]) => {
      const before = (t - dt) % length;
      const now = t % length;
      for (const moment of moments) if ((before < moment && now >= moment) || (before > now && moment <= now)) sound.play(name);
    };
    if (!reaction || reaction.kind === "sip") {
      // Coffee: a slurp at the top of each sip (the sip cycle runs 5.5 s).
      if (activity === "coffee") at(5.5, [3.4], "sip");
      // Eating: the spoon on the plate, then a few chews after each bite.
      if (activity === "eating") {
        at(4.5, [0.9], "clink");
        at(4.5, [2.5, 2.8, 3.1, 3.4], "chew");
      }
    }
    if (reaction?.kind === "sip") {
      const r = elapsed() - reaction.start;
      if (r - dt < 1.2 && r >= 1.2) sound.play("sip");
    }
    // The cats crunching their kibble.
    if (activity === "eating") at(1.3, [0.2, 0.75], "crunch");
    const levels = {
      rain: weather === "storm" ? 1 : weather === "rain" ? 0.6 : 0,
      aircon: acOn ? 1 : 0,
      purr: cats.some((cat) => cat.isPurring()) ? 1 : 0,
      music: music ? 1 : 0,
    };
    const key = JSON.stringify(levels);
    if (key !== loopsKey) {
      loopsKey = key;
      sound.setLoops(levels);
    }
  }

  const speakerPoint = new THREE.Vector3();
  function animateBubbleAndNotes(now: number) {
    stars.forEach((star, i) => {
      star.visible = seeingStars;
      if (!seeingStars) return;
      head.getWorldPosition(worldPoint);
      const a = now * 4 + (i / stars.length) * Math.PI * 2;
      star.position.set(worldPoint.x + Math.cos(a) * 0.28, worldPoint.y + 0.5 + Math.sin(a * 2) * 0.03, worldPoint.z + Math.sin(a) * 0.28);
    });
    bubble.visible = now < bubbleUntil;
    if (bubble.visible) {
      (bubbleAnchor ?? head).getWorldPosition(worldPoint);
      const grow = Math.min(1, (now - bubbleFrom) / 0.18);
      const pop = still ? 1 : 1 + 2.2 * (grow - 1) ** 3 + 1.2 * (grow - 1) ** 2;
      bubble.position.set(worldPoint.x, worldPoint.y + bubbleLift, worldPoint.z);
      bubble.scale.set(2.4 * pop, 0.45 * pop, 1);
      bubble.material.opacity = Math.min(1, (bubbleUntil - now) / 0.3);
    }
    speaker.children[0].getWorldPosition(speakerPoint);
    notes.forEach((sprite, i) => {
      sprite.visible = music && !still;
      if (!sprite.visible) return;
      const phase = (now * 0.5 + i / notes.length) % 1;
      sprite.position.set(
        speakerPoint.x - phase * 0.25 + Math.sin(phase * 7 + i) * 0.08,
        speakerPoint.y + 0.2 + phase * 0.9,
        speakerPoint.z + 0.1,
      );
      sprite.material.opacity = Math.sin(phase * Math.PI);
      sprite.scale.setScalar(0.14 + phase * 0.08);
    });
  }

  function blendJoints(dt: number) {
    const k = still ? 1 : 1 - Math.exp(-dt * 10);
    for (const [joint, target] of targets) {
      joint.rotation.x += (target.x - joint.rotation.x) * k;
      joint.rotation.y += (target.y - joint.rotation.y) * k;
      joint.rotation.z += (target.z - joint.rotation.z) * k;
    }
    // A spun chair coasts to a stop, then settles facing the desk again.
    if (!still) {
      spinAngle += spinSpeed * dt;
      spinSpeed *= Math.exp(-dt * 1.3);
      if (spinSpeed < 1.5) {
        const rest = Math.ceil(spinAngle / (Math.PI * 2) - 0.02) * Math.PI * 2;
        spinAngle += (rest - spinAngle) * (1 - Math.exp(-dt * 3));
        spinSpeed *= Math.exp(-dt * 4);
      }
    }
    chair.rotation.y = swivel + spinAngle;
    // A little pop when he moves between the bed and the desk.
    appear = still ? 1 : Math.min(1, appear + dt * 3);
    const s = appear < 1 ? 1 + 2.4 * (appear - 1) ** 3 + 1.4 * (appear - 1) ** 2 : 1;
    marc.scale.setScalar(Math.max(0.01, s));
  }

  const worldPoint = new THREE.Vector3();
  // The mouse goes where the palm resting on it goes, so it only moves when
  // his hand is actually on it.
  const palmPoint = new THREE.Vector3();
  function moveMouse() {
    if (!handOnMouse) return;
    marc.updateMatrixWorld(true);
    right.hand.localToWorld(palmPoint.set(0, -0.04, 0));
    desk.worldToLocal(palmPoint);
    const near = Math.hypot(palmPoint.x - mouse.position.x, palmPoint.z - mouse.position.z) < 0.08 && palmPoint.y < 0.96;
    if (!near) return;
    mouse.position.x = Math.min(0.66, Math.max(0.36, palmPoint.x));
    mouse.position.z = Math.min(0.4, Math.max(0.18, palmPoint.z));
  }
  function animateSteam(t: number) {
    const source =
      activity === "coffee" ? heldMug : activity === "eating" ? rice : activity === "coding-late" ? deskMug : null;
    steam.forEach((sprite, i) => {
      if (!source || still) {
        sprite.material.opacity = 0;
        return;
      }
      source.getWorldPosition(worldPoint);
      const phase = (t * 0.45 + i / steam.length) % 1;
      sprite.position.set(
        worldPoint.x + Math.sin(phase * 6 + i) * 0.03,
        worldPoint.y + 0.16 + phase * 0.45,
        worldPoint.z,
      );
      sprite.scale.setScalar(0.06 + phase * 0.12);
      sprite.material.opacity = Math.sin(phase * Math.PI) * 0.35;
    });
  }

  function drawScreens(t: number) {
    const tick = Math.floor(t * 10);
    if (tick === lastDraw) return;
    lastDraw = tick;
    let glow = "#7aa7ff";
    let power = 1.3;
    // The main monitor shows the PS5 even with the PC off; the side one is
    // the PC's.
    const onConsole = activity === "gaming" && consoleOn;
    if (activity === "sleeping" || (!pcOn && !onConsole)) {
      drawStandby(main.context);
      drawStandby(side.context);
      power = 0;
    } else if (activity === "gaming") {
      if (consoleOn) drawConsoleGame(main.context, t);
      else drawValorant(main.context, t);
      if (pcOn) drawChat(side.context, t);
      else drawStandby(side.context);
      glow = "#ffb36b";
      power = 2.4;
    } else if (activity === "eating") {
      glow = drawAnime(main.context, t);
      drawNowPlaying(side.context, t);
      power = 1.8;
    } else if (activity === "coffee") {
      // Away from the keyboard: the code sits where he left it, with just
      // the cursor blinking, and the preview stays still.
      drawEditor(main.context, t, false, true);
      drawPreview(side.context, 1);
    } else {
      drawEditor(main.context, t, activity === "coding-late");
      if (activity === "coding-late") drawTerminal(side.context, t);
      else drawPreview(side.context, t);
    }
    main.texture.needsUpdate = true;
    side.texture.needsUpdate = true;
    screenGlow.color.set(glow);
    screenGlow.intensity = power * (1 - light * 0.6);
  }

  const unlit = new THREE.Color("#141416");
  function animateRgb(t: number) {
    // Everything RGB runs off the PC, so it all goes dark when it's off.
    const color = pcOn ? new THREE.Color().setHSL((t * 0.05) % 1, 0.9, 0.55) : unlit;
    rgbMaterial.color.copy(color);
    deskGlow.color.copy(color);
    deskGlow.intensity = !pcOn ? 0 : activity === "sleeping" ? 0.15 : 0.9 * (1 - light * 0.6);
    const fan = pcOn ? new THREE.Color().setHSL((t * 0.05 + 0.5) % 1, 0.9, 0.55) : unlit;
    fanMaterial.color.copy(fan);
    pcGlow.color.copy(fan);
    pcGlow.intensity = pcOn ? 0.6 : 0;
    if (pcOn) for (const [i, ring] of fans.entries()) ring.rotation.z = t * (2 + i * 0.3);
  }

  // How much daylight each kind of weather lets through.
  const gloom: Record<WeatherKind, number> = { clear: 0, cloudy: 0.2, rain: 0.38, storm: 0.5 };
  let keyBase = 1;
  let lastWindow = -1;
  function animateWeather(now: number) {
    if (weather === "clear") return;
    // Lightning: a double flash every seven seconds or so.
    const strike = now % 7.3;
    const flash = weather === "storm" ? (strike < 0.1 ? 1 : strike > 0.22 && strike < 0.3 ? 0.6 : 0) : 0;
    if (flash === 1 && !thundering) sound.play("thunder");
    thundering = flash === 1;
    keyLight.intensity = keyBase + flash * 3;
    const tick = Math.floor(now * 10);
    if (tick === lastWindow && !flash) return;
    lastWindow = tick;
    drawWindowView(view.context, light, weather, still ? 0 : now, flash);
    view.texture.needsUpdate = true;
  }

  function applyLight() {
    drawWindowView(view.context, light, weather, elapsed());
    view.texture.needsUpdate = true;
    const sky = light * (1 - gloom[weather]);
    hemisphere.intensity = 0.6 + sky * 0.75;
    hemisphere.color.set(light > 0.5 ? (weather === "clear" ? "#e8f1ff" : "#d4dbe6") : "#8fa6d8");
    keyBase = 0.4 + sky * 1.6;
    keyLight.intensity = keyBase;
    keyLight.color.set(light > 0.5 ? "#fff1dc" : "#9fb4ff");
    const lampOn = lampIsOn();
    lampLight.intensity = lampOn ? 3.4 : 0;
    shadeMaterial.emissiveIntensity = lampOn ? 1.4 : 0;
    lampSwitch.color.set(lampOn ? "#ffb347" : "#3a2a18");
    const night = light < 0.45;
    const asleep = activity === "sleeping";
    bedGlow.intensity = night ? (asleep ? 0.5 : 1.1) : 0;
    underglow.color.set(night ? "#8a5cff" : "#3a2f55");
    bedsideLight.intensity = night && !asleep ? 1.6 : 0;
    bedsideShade.emissiveIntensity = night && !asleep ? 1.2 : 0;
    // The phone lights up on charge while he sleeps.
    phoneScreen.color.set(asleep ? "#4b7bd8" : "#1b1d22");
    renderer.toneMappingExposure = 0.95 + light * 0.15;
  }

  function applyClock() {
    const { minutes } = clockTime;
    const hour = Math.floor(minutes / 60) % 24;
    const c = clockFace.context;
    c.fillStyle = "#07080a";
    c.fillRect(0, 0, 320, 128);
    c.font = "bold 92px ui-monospace, Menlo, Consolas, monospace";
    c.textAlign = "center";
    c.textBaseline = "middle";
    // Unlit segments behind the digits, like a real LED display.
    c.fillStyle = "rgba(255,70,85,0.08)";
    c.fillText("88:88", 142, 66);
    c.fillStyle = "#ff4655";
    c.shadowColor = "#ff4655";
    c.shadowBlur = 14;
    c.fillText(`${String(hour % 12 || 12).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`, 142, 66);
    c.shadowBlur = 0;
    c.font = "bold 24px ui-monospace, Menlo, Consolas, monospace";
    c.fillText(hour < 12 ? "AM" : "PM", 290, 40);
    c.fillStyle = "rgba(255,70,85,0.55)";
    c.fillText("PHT", 290, 92);
    clockFace.texture.needsUpdate = true;
  }

  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    // Fit the whole room: about 9 units across and 6.4 tall in this view.
    const aspect = width / height;
    const size = Math.max(6.4, 9.2 / aspect);
    camera.left = (-size * aspect) / 2;
    camera.right = (size * aspect) / 2;
    camera.top = size / 2;
    camera.bottom = -size / 2;
    camera.updateProjectionMatrix();
    render(0);
  }

  function render(dt: number) {
    // Reactions keep running with reduced motion, which otherwise freezes
    // the scene's own animation.
    const now = elapsed();
    const t = still ? 2 : now;
    pose(t, now);
    blendJoints(dt);
    moveMouse();
    applyMood(dt);
    animateProps(dt, now);
    updateCats(t, now, dt);
    soundTick(t, dt);
    animateWeather(now);
    animateSteam(t);
    animateBubbleAndNotes(now);
    drawScreens(t);
    animateRgb(t);
    updateView(dt);
    controls.update();
    renderer.render(scene, camera);
  }

  // The camera glides to the preset view: the room, the desk, the bed or a
  // cat (followed as she moves).
  const viewGoal = new THREE.Vector3();
  const viewStep = new THREE.Vector3();
  function updateView(dt: number) {
    let zoom = 1;
    if (camView === "desk") {
      viewGoal.set(0.45, 1.05, -2.05);
      zoom = 2.1;
    } else if (camView === "bed") {
      viewGoal.set(-1.9, 0.55, 0.75);
      zoom = 2.2;
    } else if (camView === "cats") {
      viewGoal.copy(cats[catCam].group.position).add(viewStep.set(0, 0.22, 0));
      zoom = 3.4;
    } else viewGoal.set(0, 0.85, -0.1);
    const k = still ? 1 : 1 - Math.exp(-dt * 4);
    viewStep.copy(viewGoal).sub(controls.target).multiplyScalar(k);
    controls.target.add(viewStep);
    camera.position.add(viewStep);
    const next = camera.zoom + (zoom - camera.zoom) * k;
    if (Math.abs(next - camera.zoom) > 1e-4) {
      camera.zoom = next;
      camera.updateProjectionMatrix();
    }
  }

  // With reduced motion the loop only runs while a reaction or speech
  // bubble is showing.
  const busy = () =>
    reaction !== null || elapsed() < bubbleUntil || viewGoal.distanceTo(controls.target) > 0.01;
  function loop() {
    render(Math.min(timer.getDelta(), 0.1));
    frame = running && (!still || busy()) ? requestAnimationFrame(loop) : 0;
  }

  // A click (not a drag to look around) on something pokes it.
  let pressed: { x: number; y: number; at: number } | null = null;
  const onPointerDown = (event: PointerEvent) => {
    pressed = { x: event.clientX, y: event.clientY, at: performance.now() };
  };
  const onPointerUp = (event: PointerEvent) => {
    if (!pressed) return;
    const moved = Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y);
    const quick = performance.now() - pressed.at < 600;
    pressed = null;
    if (moved > 6 || !quick) return;
    const target = targetAt(event);
    if (!target) return;
    poke(target);
    if (!frame) {
      timer.getDelta();
      frame = requestAnimationFrame(loop);
    }
  };
  const onPointerMove = (event: PointerEvent) => {
    if (event.buttons) return;
    pickedBook = -1;
    const target = targetAt(event);
    hoveredBook = target === "book" ? pickedBook : -1;
    renderer.domElement.style.cursor = target ? "pointer" : "";
  };
  // Sound only while the room is on screen and its tab is the one being
  // used: not a background tab, and not a window left open behind another
  // one (or on another screen) while you're somewhere else.
  const heard = () => running && !document.hidden && document.hasFocus();
  const onVisibility = () => sound.setActive(heard());
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("focus", onVisibility);
  window.addEventListener("blur", onVisibility);
  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  renderer.domElement.addEventListener("pointerup", onPointerUp);
  renderer.domElement.addEventListener("pointermove", onPointerMove);

  controls.addEventListener("change", () => {
    if (!frame) renderer.render(scene, camera);
  });

  const resizer = new ResizeObserver(resize);
  resizer.observe(container);
  applyLight();
  applyClock();
  resize();

  return {
    setActivity(next) {
      if (next !== activity) {
        // A fresh start: whatever a visitor switched off is back on.
        reaction = null;
        dizzyFrom = null;
        consoleOn = false;
        acOn = true;
        pcOn = true;
        lampOverride = null;
        roll = 0;
        chair.position.x = CHAIR.x;
      }
      activity = next;
      lastDraw = -1;
      applyLight();
      if (!frame) render(1);
    },
    setDaylight(amount) {
      light = amount;
      applyLight();
      if (!frame) render(1);
    },
    setClock(minutes) {
      clockTime.minutes = minutes;
      applyClock();
      if (!frame) render(1);
    },
    celebrate() {
      if (activity === "sleeping") return;
      say("You found everything?! Okay, I'm impressed");
      if (!reaction) react("wave", 2.4);
      if (!frame) render(1);
    },
    setFestive(on) {
      festive.visible = on;
      santaHat.visible = on;
      for (const cat of cats) cat.setHat(on);
      if (!frame) render(1);
    },
    setView(next) {
      if (next === "cats" && camView === "cats") catCam = 1 - catCam;
      camView = next;
      if (!frame) {
        timer.getDelta();
        frame = requestAnimationFrame(loop);
      }
    },
    setSound(on) {
      sound.setEnabled(on);
      loopsKey = "";
    },
    setNotes(list, fresh) {
      boardNotes = list;
      drawBoard();
      if (fresh) {
        say(`${fresh.name}: "${fresh.body}"`);
        if (!frame) render(1);
      }
    },
    setWeather(kind, degrees) {
      weather = kind;
      temperature = degrees;
      applyLight();
      if (!frame) render(1);
    },
    setSunglasses(on) {
      sunglasses.visible = on;
      if (!frame) render(1);
    },
    setRunning(next) {
      running = next;
      sound.setActive(heard());
      if (running && !frame && !still) {
        timer.getDelta();
        frame = requestAnimationFrame(loop);
      }
    },
    dispose() {
      running = false;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
      window.removeEventListener("blur", onVisibility);
      sound.dispose();
      cancelAnimationFrame(frame);
      resizer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      controls.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Sprite) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          for (const material of materials) {
            (material as THREE.MeshBasicMaterial).map?.dispose();
            material.dispose();
          }
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
