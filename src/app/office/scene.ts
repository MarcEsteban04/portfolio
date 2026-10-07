// A low-poly isometric office with a blocky Marc in it, built entirely from
// shapes in code (no downloaded models). The React side creates it once and
// then only calls the setters below.
//
// Coordinates: y is up, the back wall is at z = -3 and the left wall at
// x = -3; the camera looks in from the front right.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  drawChat,
  drawEditor,
  drawPoster,
  drawPreview,
  drawShooter,
  drawStandby,
  drawTerminal,
  drawVideo,
  drawWindowView,
} from "@/app/office/screens";
import type { Activity } from "@/lib/office";

export type OfficeScene = {
  setActivity(activity: Activity): void;
  setDaylight(amount: number): void;
  setClock(minutesAfterMidnight: number): void;
  setSunglasses(on: boolean): void;
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
  bedFrame: "#6e5038",
  mattress: "#e8e4dc",
  blanket: "#3b5b8c",
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
  books: ["#c0563f", "#3e6fb0", "#d9a441", "#4f9a6a", "#8a5bb0"],
};

type MaterialOptions = THREE.MeshStandardMaterialParameters;
const mat = (color: string, extra: MaterialOptions = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...extra });

function box(w: number, h: number, d: number, material: THREE.Material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cylinder(radiusTop: number, radiusBottom: number, h: number, material: THREE.Material, x = 0, y = 0, z = 0, segments = 16) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, h, segments), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function canvasTexture(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return { context: canvas.getContext("2d")!, texture };
}

// A soft white dot for steam puffs.
function puffTexture() {
  const { context, texture } = canvasTexture(64, 64);
  const g = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,0.9)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = g;
  context.fillRect(0, 0, 64, 64);
  return texture;
}

const smooth = (x: number) => x * x * (3 - 2 * x);
const pulse = (t: number, start: number, end: number) => {
  if (t <= start || t >= end) return 0;
  return Math.sin(((t - start) / (end - start)) * Math.PI);
};

export function createOfficeScene(container: HTMLElement): OfficeScene {
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
  controls.target.set(-0.1, 1.0, -0.4);
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
  const rug = box(2.4, 0.02, 1.7, mat(palette.rug), 0.4, 0.01, -0.2);
  rug.castShadow = false;
  room.add(rug);

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
  // The frame's front face is at z = -2.985; the print sits clearly in front
  // of it, or the two would flicker over each other (z-fighting).
  posterMesh.position.set(1.3, 2.15, -2.972);
  room.add(posterMesh);
  room.add(box(0.68, 0.91, 0.02, mat("#0c0d10"), 1.3, 2.15, -2.995));

  const clock = new THREE.Group();
  clock.position.set(0.05, 2.3, -2.97);
  clock.add(cylinder(0.24, 0.24, 0.05, mat("#e9e6df"), 0, 0, 0, 32).rotateX(Math.PI / 2));
  clock.add(cylinder(0.26, 0.26, 0.03, mat("#1b1d22"), 0, 0, -0.02, 32).rotateX(Math.PI / 2));
  for (let i = 0; i < 12; i++) {
    const tick = box(0.012, i % 3 === 0 ? 0.05 : 0.025, 0.01, mat("#2b2d33"));
    const a = (i / 12) * Math.PI * 2;
    tick.position.set(Math.sin(a) * 0.2, Math.cos(a) * 0.2, 0.03);
    tick.rotation.z = -a;
    clock.add(tick);
  }
  const hourHand = new THREE.Group();
  hourHand.add(box(0.02, 0.12, 0.01, mat("#1b1d22"), 0, 0.05, 0));
  hourHand.position.z = 0.035;
  const minuteHand = new THREE.Group();
  minuteHand.add(box(0.014, 0.18, 0.01, mat("#1b1d22"), 0, 0.08, 0));
  minuteHand.position.z = 0.04;
  clock.add(hourHand, minuteHand);
  room.add(clock);

  // Shelf with books above the bed.
  room.add(box(0.3, 0.05, 1.4, mat("#7a5a40"), -2.85, 2.15, 0.3));
  palette.books.forEach((color, i) => {
    const height = 0.26 + (i % 3) * 0.04;
    room.add(box(0.22, height, 0.09, mat(color), -2.85, 2.18 + height / 2, -0.25 + i * 0.13));
  });

  // Plant in the corner.
  room.add(box(0.36, 0.36, 0.36, mat(palette.pot), 2.45, 0.18, -2.45));
  const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0), mat(palette.plant, { flatShading: true }));
  leaves.position.set(2.45, 0.78, -2.45);
  leaves.castShadow = true;
  room.add(leaves);

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
  const pcGlow = new THREE.PointLight("#00e5ff", 0.6, 1.6, 2);
  pcGlow.position.set(1.9, 1.2, -2.0);
  room.add(pcGlow);

  // Keyboard with RGB underglow, mouse, speakers, headset rest.
  desk.add(box(0.66, 0.03, 0.2, mat("#16171b"), 0, 0.815, 0.05));
  desk.add(box(0.62, 0.006, 0.16, rgbMaterial, 0, 0.832, 0.05));
  const mouse = box(0.06, 0.03, 0.1, mat("#16171b"), 0.58, 0.815, 0.12);
  desk.add(mouse);
  desk.add(box(0.14, 0.26, 0.14, mat("#15161a"), 0.84, 0.92, -0.26));
  desk.add(cylinder(0.04, 0.04, 0.01, mat("#3a3d45"), 0.84, 0.95, -0.188).rotateX(Math.PI / 2));

  const headset = new THREE.Group();
  const headsetMaterial = mat("#121316", { roughness: 0.5 });
  const accent = new THREE.MeshBasicMaterial({ color: "#00e5ff", toneMapped: false });
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
  deskMug.position.set(-0.55, 0.79, 0.22);
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
  const bed = new THREE.Group();
  bed.position.set(-2.2, 0, 0.55);
  room.add(bed);
  bed.add(box(1.2, 0.3, 2.2, mat(palette.bedFrame), 0, 0.15, 0));
  bed.add(box(1.1, 0.18, 2.1, mat(palette.mattress), 0, 0.39, 0));
  bed.add(box(0.7, 0.12, 0.36, mat(palette.pillow), 0, 0.54, 0.78));
  bed.add(box(1.2, 0.6, 0.1, mat(palette.bedFrame), 0, 0.45, 1.12));
  // Thick enough to reach the mattress, from his feet to his chest.
  const blanket = box(1.12, 0.3, 1.5, mat(palette.blanket), 0, 0.63, -0.3);
  blanket.visible = false;
  bed.add(blanket);
  const foldedBlanket = box(1.12, 0.08, 0.5, mat(palette.blanket), 0, 0.52, -0.75);
  bed.add(foldedBlanket);

  // ── Marc ────────────────────────────────────────────────────────────
  // Built around the hips; +y is up and he faces -z. A positive x rotation
  // swings a limb forward and tips the head back.
  const marc = new THREE.Group();
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
  head.add(box(0.34, 0.34, 0.32, skin, 0, 0.2, 0));
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
  const wornHeadset = headset.clone();
  wornHeadset.visible = false;
  head.add(wornHeadset);

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
  // Gripped around its middle, just in front of the palm.
  const heldMug = makeMug();
  heldMug.position.set(0, -0.115, -0.075);
  right.hand.add(heldMug);
  const spoon = new THREE.Group();
  spoon.add(box(0.02, 0.012, 0.2, mat("#cfd3d8", { metalness: 0.7, roughness: 0.25 }), 0, 0, -0.08));
  spoon.add(box(0.05, 0.015, 0.06, mat("#cfd3d8", { metalness: 0.7, roughness: 0.25 }), 0, 0.004, -0.2));
  const riceOnSpoon = box(0.035, 0.02, 0.035, mat(palette.rice), 0, 0.016, -0.2);
  spoon.add(riceOnSpoon);
  spoon.position.set(0, -0.08, -0.02);
  right.hand.add(spoon);
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
  const puff = puffTexture();
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

  let activity: Activity = "working";
  let light = 0;
  let running = false;
  let frame = 0;
  let swivel = 0;
  let place: "chair" | "bed" = "chair";
  let appear = 1;
  const clockTime = { minutes: 0 };
  const timer = new THREE.Clock();
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let lastDraw = -1;

  function pose(t: number) {
    const sleeping = activity === "sleeping";
    const turned = activity === "coffee";
    blanket.visible = sleeping;
    foldedBlanket.visible = !sleeping;
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
      marc.position.set(-2.2, 0.61, 0.42);
      marc.rotation.set(Math.PI / 2, 0, 0);
      swivel = 0;
      aim(head, 0, 0.3, 0);
      aim(left.shoulder, 0, 0, -0.08);
      aim(right.shoulder, 0, 0, 0.08);
      const breath = Math.sin(t * 1.6);
      torso.scale.set(1, 1, 1 + breath * 0.04);
      zzz.forEach((sprite, i) => {
        const phase = (t * 0.32 + i / 3) % 1;
        sprite.position.set(-2.0 + phase * 0.4, 1.0 + phase * 0.95, 1.2 - phase * 0.25);
        sprite.material.opacity = Math.sin(phase * Math.PI);
        sprite.scale.setScalar(0.12 + phase * 0.16);
        sprite.visible = true;
      });
      return;
    }
    for (const sprite of zzz) sprite.visible = false;
    torso.scale.set(1, 1, 1);

    // Seated: the chair (and Marc) swivel toward the camera for coffee.
    const targetSwivel = turned ? -2.35 : 0;
    swivel = still ? targetSwivel : swivel + (targetSwivel - swivel) * 0.08;
    marc.position.set(CHAIR.x + Math.sin(swivel) * 0.06, 0.6, CHAIR.z + Math.cos(swivel) * 0.06);
    marc.rotation.set(0, swivel, 0);
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
    } else if (activity === "gaming") {
      // Keyboard and mouse: WASD on the left, flicks and clicks on the right.
      const cycle = (t % 3.2) / 3.2;
      const shooting = cycle > 0.4 && cycle < 0.62;
      const flick = Math.sin(t * 2.3) * 0.08 + (shooting ? Math.sin(t * 40) * 0.015 : 0);
      aim(torso, -0.1);
      aim(left.shoulder, 1.1, 0, 0.16);
      aim(left.elbow, 0.5 + typing(0, 9) * 0.6);
      level(left);
      aim(right.shoulder, 1.0, flick, -0.32);
      aim(right.elbow, 0.62);
      level(right, shooting ? -0.06 : 0);
      aim(head, -0.14 + Math.sin(t * 2.3) * 0.02, flick * 0.4);
      mouse.position.x = 0.58 + flick * 0.35;
    } else if (activity === "coffee") {
      // Holding the mug at the chest, then a sip every few seconds. The sip
      // angles put the mug's rim at the mouth (upper arm 1.3, elbow 2.35).
      const sip = smooth(pulse(t % 5.5, 2.4, 5.0));
      aim(right.shoulder, 0.7 + sip * 0.6, 0, -0.08 - sip * 0.26);
      aim(right.elbow, 1.75 + sip * 0.6);
      level(right, sip * 0.85);
      aim(left.shoulder, 0.32, 0, 0.12);
      aim(left.elbow, 0.55);
      level(left);
      aim(head, sip * 0.28);
      mouth.scale.set(1, 1 + sip * 0.6, 1);
    } else if (activity === "eating") {
      // Spoon and fork, Filipino style: scoop from the plate, up to the mouth.
      // The scoop angles reach the plate; the bite angles bring the hand up
      // by the chin with the spoon tipped toward the mouth.
      const bite = smooth(pulse(t % 3.2, 1.0, 2.6));
      aim(right.shoulder, 0.75 + bite * 0.55, 0, -0.08 - bite * 0.24);
      aim(right.elbow, 0.68 + bite * 1.66);
      level(right, bite * 1.2);
      aim(left.shoulder, 0.75, 0, 0.16);
      aim(left.elbow, 0.68 + Math.sin(t * 2) * 0.04);
      level(left);
      aim(head, -0.32 + bite * 0.3);
      riceOnSpoon.visible = bite > 0.05;
      mouth.scale.set(1, 1 + bite * 1.4, 1);
    }
  }

  function blendJoints(dt: number) {
    const k = still ? 1 : 1 - Math.exp(-dt * 10);
    for (const [joint, target] of targets) {
      joint.rotation.x += (target.x - joint.rotation.x) * k;
      joint.rotation.y += (target.y - joint.rotation.y) * k;
      joint.rotation.z += (target.z - joint.rotation.z) * k;
    }
    chair.rotation.y = swivel;
    // A little pop when he moves between the bed and the desk.
    appear = still ? 1 : Math.min(1, appear + dt * 3);
    const s = appear < 1 ? 1 + 2.4 * (appear - 1) ** 3 + 1.4 * (appear - 1) ** 2 : 1;
    marc.scale.setScalar(Math.max(0.01, s));
  }

  const worldPoint = new THREE.Vector3();
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
    if (activity === "sleeping") {
      drawStandby(main.context);
      drawStandby(side.context);
      power = 0;
    } else if (activity === "gaming") {
      drawShooter(main.context, t);
      drawChat(side.context, t);
      glow = "#ffb36b";
      power = 2.4;
    } else if (activity === "eating") {
      drawVideo(main.context, t);
      drawPreview(side.context, t);
      glow = "#ff8a8a";
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

  function animateRgb(t: number) {
    const color = new THREE.Color().setHSL((t * 0.05) % 1, 0.9, 0.55);
    rgbMaterial.color.copy(color);
    deskGlow.color.copy(color);
    deskGlow.intensity = activity === "sleeping" ? 0.15 : 0.9 * (1 - light * 0.6);
    const fan = new THREE.Color().setHSL((t * 0.05 + 0.5) % 1, 0.9, 0.55);
    fanMaterial.color.copy(fan);
    pcGlow.color.copy(fan);
    for (const [i, ring] of fans.entries()) ring.rotation.z = t * (2 + i * 0.3);
  }

  function applyLight() {
    drawWindowView(view.context, light);
    view.texture.needsUpdate = true;
    hemisphere.intensity = 0.6 + light * 0.75;
    hemisphere.color.set(light > 0.5 ? "#e8f1ff" : "#8fa6d8");
    keyLight.intensity = 0.4 + light * 1.6;
    keyLight.color.set(light > 0.5 ? "#fff1dc" : "#9fb4ff");
    const lampOn = light < 0.45 && activity !== "sleeping";
    lampLight.intensity = lampOn ? 3.4 : 0;
    shadeMaterial.emissiveIntensity = lampOn ? 1.4 : 0;
    renderer.toneMappingExposure = 0.95 + light * 0.15;
  }

  function applyClock() {
    const { minutes } = clockTime;
    hourHand.rotation.z = -((minutes % 720) / 720) * Math.PI * 2;
    minuteHand.rotation.z = -((minutes % 60) / 60) * Math.PI * 2;
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
    const size = Math.max(5.5, 8.4 / aspect);
    camera.left = (-size * aspect) / 2;
    camera.right = (size * aspect) / 2;
    camera.top = size / 2;
    camera.bottom = -size / 2;
    camera.updateProjectionMatrix();
    render(0);
  }

  function render(dt: number) {
    const t = still ? 2 : timer.elapsedTime;
    pose(t);
    blendJoints(dt);
    animateSteam(t);
    drawScreens(t);
    animateRgb(t);
    controls.update();
    renderer.render(scene, camera);
  }

  function loop() {
    render(Math.min(timer.getDelta(), 0.1));
    frame = running && !still ? requestAnimationFrame(loop) : 0;
  }

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
    setSunglasses(on) {
      sunglasses.visible = on;
      if (!frame) render(1);
    },
    setRunning(next) {
      running = next;
      if (running && !frame && !still) {
        timer.getDelta();
        frame = requestAnimationFrame(loop);
      }
    },
    dispose() {
      running = false;
      cancelAnimationFrame(frame);
      resizer.disconnect();
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
