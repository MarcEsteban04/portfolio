// A low-poly isometric office with a blocky Marc in it, built entirely from
// shapes in code (no downloaded models). The React side creates it once the
// panel scrolls into view and then only calls the setters below.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { Activity } from "@/lib/office";

export type OfficeScene = {
  setActivity(activity: Activity): void;
  setDaylight(amount: number): void;
  setSunglasses(on: boolean): void;
  setRunning(running: boolean): void;
  dispose(): void;
};

const palette = {
  floor: "#6b4f3a",
  floorEdge: "#4e3929",
  wall: "#3f4658",
  wallTrim: "#323849",
  rug: "#2f5d62",
  desk: "#8a6446",
  deskDark: "#5e4330",
  metal: "#2a2d34",
  chair: "#23262e",
  bedFrame: "#6e5038",
  mattress: "#e8e4dc",
  blanket: "#3b5b8c",
  pillow: "#f4f1ea",
  skin: "#c98d5e",
  hair: "#141414",
  barong: "#efe7d4",
  sash: "#9b2335",
  sashTrim: "#1f8a8a",
  pants: "#2b2f3a",
  shoe: "#161616",
  plant: "#3f8f5a",
  pot: "#b5643c",
  mug: "#e9e4da",
  coffee: "#3b2416",
  plate: "#f2efe9",
  food: "#e0a33a",
  pad: "#1d1f26",
  books: ["#c0563f", "#3e6fb0", "#d9a441", "#4f9a6a", "#8a5bb0"],
};

const mat = (color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...extra });

function box(
  w: number,
  h: number,
  d: number,
  material: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// A part that rotates about one end, like a limb about its joint.
function limb(w: number, h: number, d: number, material: THREE.Material) {
  const pivot = new THREE.Group();
  pivot.add(box(w, h, d, material, 0, -h / 2, 0));
  return pivot;
}

function canvasTexture(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return { canvas, context: canvas.getContext("2d")!, texture };
}

// Monitor contents: scrolling code, a game, or nothing.
function drawScreen(
  context: CanvasRenderingContext2D,
  mode: "code" | "game" | "off",
  t: number,
  seed: number,
) {
  const { width, height } = context.canvas;
  context.fillStyle = mode === "off" ? "#050608" : mode === "game" ? "#120d2b" : "#0d1117";
  context.fillRect(0, 0, width, height);
  if (mode === "code") {
    const colors = ["#7ee787", "#79c0ff", "#d2a8ff", "#ffa657", "#8b949e"];
    const scroll = Math.floor(t * 2.2);
    for (let row = 0; row < 11; row++) {
      const line = row + scroll + seed;
      const indent = (line * 7) % 4;
      let x = 10 + indent * 12;
      const y = 12 + row * 13;
      for (let word = 0; word < 1 + ((line * 13) % 4); word++) {
        const length = 14 + ((line * 31 + word * 17) % 46);
        context.fillStyle = colors[(line + word) % colors.length];
        context.fillRect(x, y, length, 5);
        x += length + 6;
      }
    }
    if (Math.floor(t * 2) % 2 === 0) {
      context.fillStyle = "#e6edf3";
      context.fillRect(10, 12 + 10 * 13, 6, 8);
    }
  } else if (mode === "game") {
    const hue = (t * 40 + seed * 60) % 360;
    context.fillStyle = `hsl(${hue} 70% 22%)`;
    context.fillRect(0, height * 0.7, width, height * 0.3);
    for (let i = 0; i < 6; i++) {
      const x = (i * 53 + t * 90 * (i % 2 ? 1 : -1) + 400) % width;
      context.fillStyle = `hsl(${(hue + i * 50) % 360} 85% 60%)`;
      context.fillRect(x, 30 + ((i * 37) % 70), 16, 16);
    }
    context.fillStyle = "#ffe066";
    context.beginPath();
    context.arc(width / 2, height * 0.62 - Math.abs(Math.sin(t * 4)) * 30, 9, 0, Math.PI * 2);
    context.fill();
  }
}

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

  // Isometric view; dragging turns the room a little either way.
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  camera.position.set(9, 7.6, 9);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(-0.2, 1.0, -0.2);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minAzimuthAngle = Math.PI / 4 - 0.45;
  controls.maxAzimuthAngle = Math.PI / 4 + 0.45;
  controls.minPolarAngle = 0.85;
  controls.maxPolarAngle = 1.15;
  controls.update();

  // ── Room ──────────────────────────────────────────────────────────────
  const room = new THREE.Group();
  scene.add(room);
  room.add(box(6, 0.2, 6, mat(palette.floor), 0, -0.1, 0));
  room.add(box(6, 0.04, 0.04, mat(palette.floorEdge), 0, 0.02, 2.98));
  room.add(box(6, 3.2, 0.2, mat(palette.wall), 0, 1.6, -3.1));
  room.add(box(0.2, 3.2, 6, mat(palette.wall), -3.1, 1.6, 0));
  room.add(box(6, 0.12, 0.06, mat(palette.wallTrim), 0, 0.06, -2.98));
  room.add(box(0.06, 0.12, 6, mat(palette.wallTrim), -2.98, 0.06, 0));
  const rug = box(2.6, 0.02, 1.8, mat(palette.rug), 0.7, 0.01, -0.3);
  rug.castShadow = false;
  room.add(rug);

  // Window on the back wall, with a sky that follows the time of day.
  const skyMaterial = new THREE.MeshBasicMaterial({ color: "#0b1730" });
  const windowGroup = new THREE.Group();
  windowGroup.position.set(-1.5, 1.85, -2.98);
  windowGroup.add(box(1.5, 1.15, 0.06, mat("#2b2f3a")));
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.34, 1.0), skyMaterial);
  glass.position.z = 0.035;
  windowGroup.add(glass);
  const orb = new THREE.Mesh(
    new THREE.CircleGeometry(0.13, 24),
    new THREE.MeshBasicMaterial({ color: "#f5f3ce" }),
  );
  orb.position.set(0.32, 0.22, 0.04);
  windowGroup.add(orb);
  const stars = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const star = new THREE.Mesh(
      new THREE.CircleGeometry(0.012, 6),
      new THREE.MeshBasicMaterial({ color: "#ffffff" }),
    );
    star.position.set(-0.55 + ((i * 0.37) % 1.1), -0.35 + ((i * 0.61) % 0.75), 0.04);
    stars.add(star);
  }
  windowGroup.add(stars);
  windowGroup.add(box(0.04, 1.0, 0.04, mat("#2b2f3a"), 0, 0, 0.05));
  windowGroup.add(box(1.34, 0.04, 0.04, mat("#2b2f3a"), 0, 0, 0.05));
  room.add(windowGroup);

  // Shelf with books above the bed.
  room.add(box(0.3, 0.05, 1.4, mat(palette.desk), -2.85, 2.15, 0.3));
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

  // ── Desk ──────────────────────────────────────────────────────────────
  const desk = new THREE.Group();
  desk.position.set(0.7, 0, -2.25);
  room.add(desk);
  desk.add(box(2.2, 0.07, 0.95, mat(palette.desk), 0, 0.76, 0));
  for (const [x, z] of [[-1.02, -0.4], [1.02, -0.4], [-1.02, 0.4], [1.02, 0.4]]) {
    desk.add(box(0.07, 0.74, 0.07, mat(palette.deskDark), x, 0.37, z));
  }
  desk.add(box(0.6, 0.025, 0.2, mat(palette.metal), 0, 0.81, 0.18));
  desk.add(box(0.1, 0.02, 0.14, mat(palette.metal), 0.45, 0.81, 0.2));

  const screens = [-0.45, 0.45].map((x, i) => {
    const { context, texture } = canvasTexture(256, 160);
    const screenMaterial = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
    const monitor = new THREE.Group();
    monitor.position.set(x, 1.22, -0.22);
    monitor.rotation.y = i === 0 ? 0.12 : -0.12;
    monitor.add(box(0.82, 0.5, 0.04, mat(palette.metal)));
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.44), screenMaterial);
    screen.position.z = 0.022;
    monitor.add(screen);
    monitor.add(box(0.06, 0.3, 0.06, mat(palette.metal), 0, -0.36, -0.02));
    monitor.add(box(0.28, 0.02, 0.18, mat(palette.metal), 0, -0.5, -0.02));
    desk.add(monitor);
    return { context, texture, seed: i * 5 };
  });
  const screenGlow = new THREE.PointLight("#7aa7ff", 0, 3, 2);
  screenGlow.position.set(0.7, 1.25, -1.55);
  room.add(screenGlow);

  // Desk lamp, on after dark.
  const lamp = new THREE.Group();
  lamp.position.set(-0.85, 0.8, -0.15);
  lamp.add(box(0.2, 0.03, 0.2, mat(palette.metal)));
  lamp.add(box(0.03, 0.5, 0.03, mat(palette.metal), 0, 0.25, 0));
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.13, 0.16, 12, 1, true),
    mat("#d9c27a", { side: THREE.DoubleSide, emissive: "#ffcf73", emissiveIntensity: 0 }),
  );
  shade.position.set(0.06, 0.5, 0.06);
  lamp.add(shade);
  desk.add(lamp);
  const lampLight = new THREE.PointLight("#ffc46b", 0, 4, 1.6);
  lampLight.position.set(-0.15, 1.2, -2.15);
  lampLight.castShadow = true;
  lampLight.shadow.mapSize.set(512, 512);
  room.add(lampLight);

  // Things that come and go with the activity.
  const deskMug = new THREE.Group();
  deskMug.add(box(0.1, 0.12, 0.1, mat(palette.mug), 0, 0.06, 0));
  deskMug.add(box(0.08, 0.01, 0.08, mat(palette.coffee), 0, 0.12, 0));
  deskMug.position.set(0.72, 0.8, 0.12);
  desk.add(deskMug);
  const plate = new THREE.Group();
  plate.add(box(0.36, 0.02, 0.36, mat(palette.plate), 0, 0.01, 0));
  plate.add(box(0.2, 0.06, 0.2, mat(palette.food), 0, 0.05, 0));

  // ── Chair ─────────────────────────────────────────────────────────────
  const chair = new THREE.Group();
  chair.position.set(0.7, 0, -1.25);
  room.add(chair);
  chair.add(box(0.6, 0.08, 0.6, mat(palette.chair), 0, 0.48, 0));
  chair.add(box(0.6, 0.7, 0.08, mat(palette.chair), 0, 0.9, 0.28));
  chair.add(box(0.06, 0.44, 0.06, mat(palette.metal), 0, 0.22, 0));
  chair.add(box(0.5, 0.04, 0.5, mat(palette.metal), 0, 0.03, 0));

  // ── Bed ───────────────────────────────────────────────────────────────
  const bed = new THREE.Group();
  bed.position.set(-2.2, 0, 0.55);
  room.add(bed);
  bed.add(box(1.2, 0.3, 2.2, mat(palette.bedFrame), 0, 0.15, 0));
  bed.add(box(1.1, 0.18, 2.1, mat(palette.mattress), 0, 0.39, 0));
  bed.add(box(0.7, 0.12, 0.36, mat(palette.pillow), 0, 0.54, 0.78));
  bed.add(box(1.2, 0.6, 0.1, mat(palette.bedFrame), 0, 0.45, 1.12));
  const blanket = box(1.14, 0.1, 1.3, mat(palette.blanket), 0, 0.53, -0.32);
  bed.add(blanket);

  // ── Marc ──────────────────────────────────────────────────────────────
  // Built around the hips; +y is up and the front faces -z.
  const marc = new THREE.Group();
  room.add(marc);
  const barong = mat(palette.barong);
  const skin = mat(palette.skin);
  const torso = new THREE.Group();
  marc.add(torso);
  torso.add(box(0.46, 0.56, 0.26, barong, 0, 0.3, 0));
  const sash = box(0.1, 0.66, 0.02, mat(palette.sash), 0.02, 0.3, -0.14);
  sash.rotation.z = -0.62;
  torso.add(sash);
  const sashEdge = box(0.02, 0.66, 0.022, mat(palette.sashTrim), 0.08, 0.31, -0.141);
  sashEdge.rotation.z = -0.62;
  torso.add(sashEdge);

  const head = new THREE.Group();
  head.position.y = 0.6;
  torso.add(head);
  head.add(box(0.32, 0.34, 0.3, skin, 0, 0.2, 0));
  head.add(box(0.34, 0.12, 0.32, mat(palette.hair), 0, 0.39, 0.01));
  head.add(box(0.34, 0.2, 0.08, mat(palette.hair), 0, 0.3, 0.13));
  head.add(box(0.06, 0.18, 0.3, mat(palette.hair), -0.16, 0.27, 0.01));
  head.add(box(0.06, 0.18, 0.3, mat(palette.hair), 0.16, 0.27, 0.01));
  const eyes = new THREE.Group();
  eyes.add(box(0.05, 0.035, 0.01, mat("#1a1a1a"), -0.07, 0.22, -0.152));
  eyes.add(box(0.05, 0.035, 0.01, mat("#1a1a1a"), 0.07, 0.22, -0.152));
  head.add(eyes);
  const closedEyes = new THREE.Group();
  closedEyes.add(box(0.06, 0.012, 0.01, mat("#1a1a1a"), -0.07, 0.215, -0.152));
  closedEyes.add(box(0.06, 0.012, 0.01, mat("#1a1a1a"), 0.07, 0.215, -0.152));
  closedEyes.visible = false;
  head.add(closedEyes);
  const sunglasses = new THREE.Group();
  sunglasses.add(box(0.11, 0.07, 0.02, mat("#0c0c0c", { roughness: 0.3, metalness: 0.4 }), -0.075, 0.22, -0.16));
  sunglasses.add(box(0.11, 0.07, 0.02, mat("#0c0c0c", { roughness: 0.3, metalness: 0.4 }), 0.075, 0.22, -0.16));
  sunglasses.add(box(0.36, 0.02, 0.02, mat("#0c0c0c"), 0, 0.245, -0.16));
  sunglasses.visible = false;
  head.add(sunglasses);
  head.add(box(0.1, 0.02, 0.01, mat("#8a4b3a"), 0, 0.1, -0.152));

  const arms = [-1, 1].map((side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.3, 0.52, 0);
    torso.add(shoulder);
    shoulder.add(box(0.13, 0.3, 0.14, barong, 0, -0.15, 0));
    const elbow = new THREE.Group();
    elbow.position.y = -0.3;
    shoulder.add(elbow);
    elbow.add(box(0.12, 0.26, 0.13, barong, 0, -0.13, 0));
    const hand = new THREE.Group();
    hand.position.y = -0.27;
    elbow.add(hand);
    hand.add(box(0.1, 0.1, 0.1, skin, 0, -0.04, 0));
    return { shoulder, elbow, hand };
  });
  const [left, right] = arms;

  const legs = [-1, 1].map((side) => {
    const hip = limb(0.17, 0.44, 0.19, mat(palette.pants));
    hip.position.set(side * 0.12, 0, 0);
    marc.add(hip);
    const knee = limb(0.16, 0.42, 0.18, mat(palette.pants));
    knee.position.y = -0.44;
    hip.add(knee);
    knee.add(box(0.17, 0.08, 0.26, mat(palette.shoe), 0, -0.44, -0.05));
    return { hip, knee };
  });

  // A bowl held in the left hand while eating.
  plate.scale.setScalar(0.8);
  plate.position.set(0.06, -0.1, -0.12);
  plate.rotation.x = Math.PI / 2;
  left.hand.add(plate);

  // Props held in the right hand.
  const heldMug = deskMug.clone();
  heldMug.position.set(0, -0.12, -0.06);
  right.hand.add(heldMug);
  const spoon = box(0.025, 0.02, 0.2, mat("#c9ccd1", { metalness: 0.6, roughness: 0.3 }), 0, -0.08, -0.1);
  right.hand.add(spoon);
  const gamepad = new THREE.Group();
  gamepad.add(box(0.32, 0.06, 0.14, mat(palette.pad)));
  gamepad.add(box(0.04, 0.02, 0.04, mat("#e5484d"), 0.09, 0.04, 0));
  gamepad.add(box(0.04, 0.02, 0.04, mat("#46a758"), 0.13, 0.04, 0.03));
  gamepad.position.set(0.7, 0.86, -1.6);
  room.add(gamepad);

  // "Zzz" over the bed.
  const zzz = Array.from({ length: 3 }, () => {
    const { canvas, context, texture } = canvasTexture(64, 64);
    context.fillStyle = "#ffffff";
    context.font = "bold 48px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("Z", canvas.width / 2, canvas.height / 2);
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }),
    );
    sprite.scale.setScalar(0.25);
    room.add(sprite);
    return sprite;
  });

  // ── Light ─────────────────────────────────────────────────────────────
  const hemisphere = new THREE.HemisphereLight("#cfe3ff", "#3a2a20", 1);
  scene.add(hemisphere);
  const windowLight = new THREE.DirectionalLight("#ffffff", 1);
  // From above and in front: from behind the walls, the walls would shade
  // the whole floor.
  windowLight.position.set(2.5, 8, 3.5);
  windowLight.target.position.set(-0.3, 0, -0.6);
  windowLight.castShadow = true;
  windowLight.shadow.mapSize.set(1024, 1024);
  Object.assign(windowLight.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5 });
  windowLight.shadow.bias = -0.0005;
  scene.add(windowLight, windowLight.target);

  // ── State and animation ───────────────────────────────────────────────
  let activity: Activity = "working";
  let light = 0;
  let running = false;
  let frame = 0;
  const clock = new THREE.Clock();
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let lastScreenDraw = -1;

  // Turning the chair toward the camera (which looks in from the front
  // right) shows Marc's face; at the desk he faces the monitors.
  const FACE_CAMERA = -2.35;

  function seat(turned: boolean) {
    marc.position.set(0.7, 0.55, -1.25);
    marc.rotation.set(0, turned ? FACE_CAMERA : 0, 0);
    chair.rotation.y = turned ? FACE_CAMERA : 0;
    for (const { hip, knee } of legs) {
      hip.rotation.x = -Math.PI / 2;
      knee.rotation.x = Math.PI / 2;
    }
  }

  function lieDown() {
    // On his back, head on the pillow at the bed's front end.
    marc.position.set(-2.2, 0.63, 0.12);
    marc.rotation.set(Math.PI / 2, 0, 0);
    for (const { hip, knee } of legs) {
      hip.rotation.x = 0;
      knee.rotation.x = 0;
    }
  }

  function pose(t: number) {
    const sleeping = activity === "sleeping";
    eyes.visible = !sleeping;
    closedEyes.visible = sleeping;
    blanket.visible = sleeping;
    heldMug.visible = activity === "coffee";
    deskMug.visible = activity !== "coffee";
    spoon.visible = activity === "eating";
    plate.visible = activity === "eating";
    gamepad.visible = activity === "gaming";
    for (const sprite of zzz) sprite.visible = sleeping;

    torso.rotation.set(0, 0, 0);
    torso.scale.set(1, 1, 1);
    head.rotation.set(0, 0, 0);
    left.shoulder.rotation.set(0, 0, 0);
    right.shoulder.rotation.set(0, 0, 0);
    left.elbow.rotation.set(0, 0, 0);
    right.elbow.rotation.set(0, 0, 0);

    if (sleeping) {
      lieDown();
      const breath = Math.sin(t * 1.6);
      torso.scale.set(1, 1, 1 + breath * 0.03);
      head.rotation.y = 0.25;
      left.shoulder.rotation.z = -0.12;
      right.shoulder.rotation.z = 0.12;
      zzz.forEach((sprite, i) => {
        const phase = (t * 0.35 + i / 3) % 1;
        sprite.position.set(-2.0 + phase * 0.45, 1.05 + phase * 0.9, 0.95 - phase * 0.2);
        sprite.material.opacity = Math.sin(phase * Math.PI);
        sprite.scale.setScalar(0.14 + phase * 0.16);
      });
      return;
    }

    const turned = activity === "coffee" || activity === "eating";
    seat(turned);
    // Hands on the keyboard by default.
    const type = (side: number) => Math.sin(t * 16 + side * 1.7) * 0.06;
    left.shoulder.rotation.x = -1.05 + type(0);
    right.shoulder.rotation.x = -1.05 + type(1);
    left.elbow.rotation.x = -0.55;
    right.elbow.rotation.x = -0.55;
    left.shoulder.rotation.z = 0.12;
    right.shoulder.rotation.z = -0.12;
    head.rotation.x = Math.sin(t * 1.3) * 0.04;

    if (activity === "coffee") {
      // A sip every few seconds.
      const cycle = (t % 5) / 5;
      const sip = cycle > 0.55 && cycle < 0.9 ? Math.sin(((cycle - 0.55) / 0.35) * Math.PI) : 0;
      right.shoulder.rotation.x = -0.55 - sip * 0.9;
      right.elbow.rotation.x = -1.2 - sip * 1.15;
      right.shoulder.rotation.z = -0.3 + sip * 0.25;
      left.shoulder.rotation.x = -0.45;
      left.elbow.rotation.x = -0.6;
      head.rotation.x = -sip * 0.18;
    } else if (activity === "eating") {
      const cycle = (t % 2.4) / 2.4;
      const bite = Math.max(0, Math.sin(cycle * Math.PI * 2));
      right.shoulder.rotation.x = -0.75 - bite * 0.7;
      right.elbow.rotation.x = -0.9 - bite * 1.3;
      right.shoulder.rotation.z = -0.25 + bite * 0.2;
      left.shoulder.rotation.x = -0.7;
      left.elbow.rotation.x = -1.35;
      left.shoulder.rotation.z = 0.35;
      head.rotation.x = 0.16 - bite * 0.16;
    } else if (activity === "gaming") {
      torso.rotation.x = 0.14;
      const thumbs = Math.sin(t * 22) * 0.05;
      left.shoulder.rotation.x = -0.75 + thumbs;
      right.shoulder.rotation.x = -0.75 - thumbs;
      left.elbow.rotation.x = -1.25;
      right.elbow.rotation.x = -1.25;
      left.shoulder.rotation.z = -0.32;
      right.shoulder.rotation.z = 0.32;
      head.rotation.x = -0.08 + Math.sin(t * 3) * 0.03;
      gamepad.position.set(0.7 + Math.sin(t * 5) * 0.01, 0.98, -1.62);
      gamepad.rotation.x = 0.5;
    } else if (activity === "coding-late") {
      // Every so often, a long stretch.
      const cycle = (t % 14) / 14;
      const stretch = cycle > 0.8 ? Math.sin(((cycle - 0.8) / 0.2) * Math.PI) : 0;
      left.shoulder.rotation.x = -1.05 - stretch * 2.0 + type(0) * (1 - stretch);
      right.shoulder.rotation.x = -1.05 - stretch * 2.0 + type(1) * (1 - stretch);
      left.elbow.rotation.x = -0.55 * (1 - stretch);
      right.elbow.rotation.x = -0.55 * (1 - stretch);
      head.rotation.x = -stretch * 0.25;
      torso.rotation.x = stretch * 0.1;
    }
  }

  function screens_(t: number) {
    // Redraw the monitors a few times a second, not every frame.
    const tick = Math.floor(t * 6);
    if (tick === lastScreenDraw) return;
    lastScreenDraw = tick;
    const mode = activity === "sleeping" ? "off" : activity === "gaming" ? "game" : "code";
    for (const screen of screens) {
      drawScreen(screen.context, mode, t, screen.seed);
      screen.texture.needsUpdate = true;
    }
    screenGlow.intensity =
      mode === "off" ? 0 : (mode === "game" ? 2.2 : 1.4) * (1 - light * 0.7);
    screenGlow.color.set(mode === "game" ? "#c08bff" : "#7aa7ff");
  }

  function applyLight() {
    const night = new THREE.Color("#0b1730");
    const day = new THREE.Color("#8ec5ff");
    const dusk = new THREE.Color("#f2a46b");
    const sky = night.clone().lerp(day, light);
    if (light > 0.05 && light < 0.6) sky.lerp(dusk, 0.35 * (1 - Math.abs(light - 0.3) / 0.3));
    skyMaterial.color.copy(sky);
    stars.visible = light < 0.3;
    (orb.material as THREE.MeshBasicMaterial).color.set(light > 0.5 ? "#fff3b0" : "#f5f3ce");
    orb.position.y = light > 0.5 ? 0.25 : 0.2;

    hemisphere.intensity = 0.6 + light * 0.75;
    hemisphere.color.set(light > 0.5 ? "#e8f1ff" : "#8fa6d8");
    windowLight.intensity = 0.45 + light * 1.55;
    windowLight.color.set(light > 0.5 ? "#fff1dc" : "#9fb4ff");
    const lampOn = light < 0.45 && activity !== "sleeping";
    lampLight.intensity = lampOn ? 3.2 : 0;
    (shade.material as THREE.MeshStandardMaterial).emissiveIntensity = lampOn ? 1.4 : 0;
    renderer.toneMappingExposure = 0.95 + light * 0.15;
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
    camera.top = size / 2 - 0.1;
    camera.bottom = -size / 2 - 0.1;
    camera.updateProjectionMatrix();
    render();
  }

  function render() {
    const t = still ? 2 : clock.getElapsedTime();
    pose(t);
    screens_(t);
    controls.update();
    renderer.render(scene, camera);
  }

  function loop() {
    render();
    frame = running && !still ? requestAnimationFrame(loop) : 0;
  }

  // With reduced motion, a drag still turns the room; draw on change only.
  controls.addEventListener("change", () => {
    if (!frame) renderer.render(scene, camera);
  });

  const resizer = new ResizeObserver(resize);
  resizer.observe(container);
  applyLight();
  resize();

  return {
    setActivity(next) {
      activity = next;
      lastScreenDraw = -1;
      applyLight();
      if (!frame) render();
    },
    setDaylight(amount) {
      light = amount;
      applyLight();
      if (!frame) render();
    },
    setSunglasses(on) {
      sunglasses.visible = on;
      if (!frame) render();
    },
    setRunning(next) {
      running = next;
      if (running && !frame && !still) {
        clock.getDelta();
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
