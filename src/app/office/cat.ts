// The office cats, built from boxes: Mochi, an orange tabby, and Tilapya, a
// grey "tilapia" tabby. Each makes her own rounds of the room, eats at her
// bowl when Marc eats, sleeps on the bed when he does, sometimes curls up in
// his lap, and can be petted. Built facing +z with the feet at y = 0.
import * as THREE from "three";
import { box, canvasTexture, cylinder, mat, rounded, smooth } from "@/app/office/shapes";

type Pose = "walk" | "run" | "sit" | "groom" | "loaf" | "eat" | "swipe";
export type PlayPose = "run" | "swipe";
export type Point = [number, number, number];

type Leg =
  | { kind: "stay"; at: Point; pose: Exclude<Pose, "walk">; seconds: number; facing: number; tag?: string }
  | { kind: "walk" | "jump"; from: Point; to: Point; seconds: number };

const walk = (...points: Point[]): Leg[] =>
  points.slice(1).map((to, i) => ({
    kind: "walk",
    from: points[i],
    to,
    seconds: Math.hypot(to[0] - points[i][0], to[2] - points[i][2]) / 0.45,
  }));
const facingTo = (from: Point, to: Point) => Math.atan2(to[0] - from[0], to[2] - from[2]);
const TOWARD_CAMERA = Math.PI / 4;

// Spots in the room (world coordinates).
const RUG: Point = [0.6, 0, 0.1];
const BY_CHAIR: Point = [1.25, 0, -1.05];
const MIDDLE: Point = [0.1, 0, 0.95];
const BED_FOOT: Point = [-0.55, 0, 0.95];
const ON_BED: Point = [-1.15, 0.53, 0.95];
const FRONT: Point = [-0.6, 0, 1.7];
const FLUFFY_RUG: Point = [-1.45, 0, 1.75];
const CHAIR: Point = [0.45, 0, -1.62];
const NEAR_FRONT: Point = [0.4, 0, 1.25];
const FRONT_MIDDLE: Point = [0.6, 0, 2.2];
export const LITTER: Point = [2.25, 0, 2.35];
const BY_LITTER: Point = [1.8, 0, 2.3];
const IN_LITTER: Point = [2.25, 0.08, 2.35];
const RUG_MIDDLE: Point = [0.05, 0, -0.45];
// Up on the desk's left end, by the soda can she likes to push off.
const BELOW_DESK: Point = [-0.65, 0, -1.45];
const ON_DESK: Point = [-0.65, 0.79, -2.18];

export type CatLook = { fur: string; stripe: string; belly: string; eyes: string };
export type CatPlan = {
  name: string;
  look: CatLook;
  route: Leg[];
  // Where she sleeps when Marc does, and where her bowl is.
  bed: Point;
  bowl: Point;
};

export const mochi: CatPlan = {
  name: "Mochi",
  look: { fur: "#e08a3c", stripe: "#b8642a", belly: "#f6efe4", eyes: "#9bd34f" },
  route: [
    { kind: "stay", at: RUG, pose: "groom", seconds: 7, facing: TOWARD_CAMERA },
    ...walk(RUG, BY_CHAIR),
    { kind: "stay", at: BY_CHAIR, pose: "sit", seconds: 8, facing: facingTo(BY_CHAIR, CHAIR) },
    ...walk(BY_CHAIR, MIDDLE, BED_FOOT),
    { kind: "jump", from: BED_FOOT, to: ON_BED, seconds: 0.7 },
    { kind: "stay", at: ON_BED, pose: "loaf", seconds: 15, facing: TOWARD_CAMERA },
    { kind: "jump", from: ON_BED, to: FRONT, seconds: 0.7 },
    ...walk(FRONT, FLUFFY_RUG),
    { kind: "stay", at: FLUFFY_RUG, pose: "sit", seconds: 6, facing: TOWARD_CAMERA },
    ...walk(FLUFFY_RUG, FRONT, MIDDLE, RUG),
  ],
  bed: ON_BED,
  bowl: [2.4, 0, 0.68],
};

export const tilapya: CatPlan = {
  name: "Tilapya",
  look: { fur: "#6c7075", stripe: "#25272a", belly: "#b9bcbf", eyes: "#e8c547" },
  route: [
    { kind: "stay", at: FLUFFY_RUG, pose: "loaf", seconds: 12, facing: TOWARD_CAMERA },
    ...walk(FLUFFY_RUG, FRONT, FRONT_MIDDLE, BY_LITTER),
    { kind: "jump", from: BY_LITTER, to: IN_LITTER, seconds: 0.4 },
    { kind: "stay", at: IN_LITTER, pose: "sit", seconds: 5, facing: TOWARD_CAMERA },
    { kind: "jump", from: IN_LITTER, to: BY_LITTER, seconds: 0.4 },
    ...walk(BY_LITTER, RUG_MIDDLE),
    { kind: "stay", at: RUG_MIDDLE, pose: "groom", seconds: 7, facing: TOWARD_CAMERA },
    ...walk(RUG_MIDDLE, BELOW_DESK),
    { kind: "jump", from: BELOW_DESK, to: ON_DESK, seconds: 0.6 },
    // Paw, paw, paw… and over the edge it goes.
    { kind: "stay", at: ON_DESK, pose: "swipe", seconds: 4, facing: 0, tag: "knock" },
    { kind: "stay", at: ON_DESK, pose: "sit", seconds: 3, facing: 0 },
    { kind: "jump", from: ON_DESK, to: BELOW_DESK, seconds: 0.6 },
    ...walk(BELOW_DESK, NEAR_FRONT, FRONT, FLUFFY_RUG),
  ],
  bed: [-1.6, 0.5, 1.08],
  bowl: [2.4, 0, 1.16],
};

// Where Marc asks a cat to be this frame.
export type CatMode =
  | { kind: "roam" }
  | { kind: "bed" }
  | { kind: "bowl" }
  | { kind: "lap"; at: THREE.Vector3; facing: number }
  // Playing with the other cat: wherever the game puts her, running or
  // batting at the other one (with a little hop).
  | { kind: "play"; at: THREE.Vector3; facing: number; pose: PlayPose; hop: number };

export function createCat(room: THREE.Object3D, plan: CatPlan) {
  const { look, route } = plan;
  const routeLength = route.reduce((sum, leg) => sum + leg.seconds, 0);
  const fur = mat(look.fur, { roughness: 1 });
  const stripe = mat(look.stripe, { roughness: 1 });
  const belly = mat(look.belly, { roughness: 1 });
  const pink = mat("#f2a0a8");
  const ink = mat("#141414");

  const cat = new THREE.Group();
  cat.scale.setScalar(1.15);
  room.add(cat);

  const body = new THREE.Group();
  body.position.y = 0.17;
  cat.add(body);
  body.add(rounded(0.17, 0.15, 0.34, 0.06, fur));
  for (const z of [-0.12, -0.04, 0.04, 0.12]) body.add(box(0.172, 0.03, 0.022, stripe, 0, 0.062, z));
  body.add(rounded(0.1, 0.08, 0.06, 0.03, belly, 0, -0.03, 0.15));

  const head = new THREE.Group();
  head.position.set(0, 0.28, 0.17);
  cat.add(head);
  head.add(rounded(0.15, 0.13, 0.13, 0.05, fur));
  // Tabby "M" on the forehead.
  head.add(box(0.03, 0.02, 0.1, stripe, 0, 0.062, -0.01));
  for (const side of [-1, 1]) head.add(box(0.012, 0.03, 0.006, stripe, side * 0.03, 0.04, 0.066));
  for (const side of [-1, 1]) {
    const ear = cylinder(0, 0.03, 0.06, fur, side * 0.045, 0.08, -0.01, 4);
    ear.rotation.z = side * -0.25;
    head.add(ear);
    const inner = cylinder(0, 0.017, 0.04, pink, side * 0.045, 0.078, 0.004, 4);
    inner.rotation.z = side * -0.25;
    head.add(inner);
    for (const tilt of [-0.12, 0.12]) {
      const whisker = box(0.06, 0.003, 0.003, belly, side * 0.06, -0.025 + tilt * 0.06, 0.066);
      whisker.rotation.z = side * tilt;
      whisker.castShadow = false;
      head.add(whisker);
    }
  }
  const eyes = new THREE.Group();
  for (const side of [-1, 1]) {
    eyes.add(box(0.028, 0.03, 0.006, mat(look.eyes, { emissive: look.eyes, emissiveIntensity: 0.15 }), side * 0.035, 0.015, 0.066));
    eyes.add(box(0.008, 0.026, 0.008, ink, side * 0.035, 0.015, 0.068));
  }
  head.add(eyes);
  const sleepyEyes = new THREE.Group();
  for (const side of [-1, 1]) sleepyEyes.add(box(0.03, 0.006, 0.008, ink, side * 0.035, 0.012, 0.067));
  sleepyEyes.visible = false;
  head.add(sleepyEyes);
  head.add(rounded(0.07, 0.04, 0.025, 0.012, belly, 0, -0.03, 0.06));
  head.add(box(0.018, 0.012, 0.01, pink, 0, -0.012, 0.074));
  const hat = new THREE.Group();
  hat.position.set(0, 0.07, -0.01);
  hat.rotation.z = -0.25;
  hat.add(cylinder(0.07, 0.07, 0.03, mat("#f4f1ea", { roughness: 1 }), 0, 0, 0, 14));
  const cone = cylinder(0, 0.062, 0.13, mat("#c8202e", { roughness: 0.9 }), 0, 0.08, 0, 14);
  cone.rotation.z = -0.35;
  hat.add(cone);
  hat.add(new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), mat("#f4f1ea", { roughness: 1 })).translateX(-0.045).translateY(0.13));
  hat.visible = false;
  head.add(hat);

  const legs = (
    [
      [-1, 1],
      [1, 1],
      [-1, -1],
      [1, -1],
    ] as const
  ).map(([side, end]) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.055, 0.12, end * 0.11);
    cat.add(hip);
    hip.add(box(0.04, 0.12, 0.04, fur, 0, -0.06, 0));
    hip.add(box(0.045, 0.022, 0.052, belly, 0, -0.112, 0.006));
    return hip;
  });

  // Tail: four segments, each hung off the end of the last, ringed.
  const tail: THREE.Group[] = [];
  let parent: THREE.Object3D = cat;
  for (let i = 0; i < 4; i++) {
    const segment = new THREE.Group();
    segment.position.set(0, i === 0 ? 0.2 : 0, i === 0 ? -0.16 : -0.085);
    segment.add(box(0.036, 0.036, 0.09, i % 2 ? stripe : fur, 0, 0, -0.042));
    parent.add(segment);
    tail.push(segment);
    parent = segment;
  }

  // Hearts when she's petted.
  const heartTexture = canvasTexture(64, 64);
  heartTexture.context.fillStyle = "#ff5c8a";
  heartTexture.context.font = "bold 50px sans-serif";
  heartTexture.context.textAlign = "center";
  heartTexture.context.textBaseline = "middle";
  heartTexture.context.fillText("♥", 32, 36);
  const hearts = Array.from({ length: 3 }, () => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartTexture.texture, transparent: true, depthWrite: false }));
    sprite.visible = false;
    room.add(sprite);
    return sprite;
  });

  let facing = TOWARD_CAMERA;
  // Where she actually is: she walks (and jumps) to wherever she's wanted
  // instead of appearing there.
  const pos = new THREE.Vector3();
  let placed = false;
  let settled = false;
  let purringNow = false;
  // The tagged stop she's at on her rounds, if any, and how far through.
  let tag: { tag: string; progress: number } | null = null;
  let pettedAt = -99;
  let biteAt = -99;
  const pets: number[] = [];
  const headPoint = new THREE.Vector3();

  // Where she is on her rounds at time t, and in what pose.
  function onRoute(t: number) {
    tag = null;
    let left = t % routeLength;
    for (const leg of route) {
      if (left < leg.seconds) {
        const k = left / leg.seconds;
        if (leg.kind === "stay") {
          tag = leg.tag ? { tag: leg.tag, progress: k } : null;
          return { at: leg.at, pose: leg.pose, facing: leg.facing, hop: 0 };
        }
        const at = leg.from.map((v, i) => v + (leg.to[i] - v) * (leg.kind === "jump" ? smooth(k) : k)) as Point;
        const hop = leg.kind === "jump" ? Math.sin(k * Math.PI) * (leg.to[1] === leg.from[1] ? 0.1 : 0.35) : 0;
        return { at, pose: "walk" as Pose, facing: facingTo(leg.from, leg.to), hop };
      }
      left -= leg.seconds;
    }
    return { at: RUG, pose: "sit" as Pose, facing: TOWARD_CAMERA, hop: 0 };
  }

  function where(t: number, mode: CatMode) {
    if (mode.kind === "bed") return { at: plan.bed, pose: "loaf" as Pose, facing: TOWARD_CAMERA, hop: 0 };
    if (mode.kind === "lap") {
      return { at: mode.at.toArray() as Point, pose: "loaf" as Pose, facing: mode.facing, hop: 0 };
    }
    if (mode.kind === "play") {
      return { at: mode.at.toArray() as Point, pose: mode.pose as Pose, facing: mode.facing, hop: mode.hop };
    }
    if (mode.kind === "bowl") {
      // On the room side of the bowl, facing it.
      const [x, , z] = plan.bowl;
      return { at: [x - 0.24, 0, z] as Point, pose: "eat" as Pose, facing: Math.PI / 2, hop: 0 };
    }
    return onRoute(t);
  }

  // `stroked` keeps the hearts and purring going while Marc pets her.
  function update(t: number, now: number, dt: number, mode: CatMode, still: boolean, stroked = false) {
    if (mode.kind !== "roam") tag = null;
    let spot = where(t, mode);
    const [tx, ty, tz] = spot.at;
    if (!placed || still) {
      pos.set(tx, ty, tz);
      placed = true;
    }
    const dx = tx - pos.x;
    const dz = tz - pos.z;
    const away = Math.hypot(dx, dz);
    let hop = spot.hop;
    settled = away < (mode.kind === "play" ? 0.12 : 0.06) && Math.abs(ty - pos.y) < 0.1;
    if (settled) {
      pos.set(tx, ty, tz);
    } else {
      // Trot over, jumping up (to a lap or the bed) once close, or down
      // straight away when leaving one.
      const step = Math.min(away, dt * (mode.kind === "play" ? 1.6 : 1.0));
      if (away > 1e-4) {
        pos.x += (dx / away) * step;
        pos.z += (dz / away) * step;
      }
      const height = away < 0.35 ? ty : 0;
      const before = pos.y;
      pos.y += (height - pos.y) * Math.min(1, dt * 8);
      hop = Math.abs(height - before) > 0.05 ? 0.08 : 0;
      spot = { at: spot.at, pose: "walk", facing: away > 1e-3 ? Math.atan2(dx, dz) : spot.facing, hop };
    }
    const startled = now - biteAt < 0.5 ? Math.sin(((now - biteAt) / 0.5) * Math.PI) * 0.12 : 0;
    cat.position.set(pos.x, pos.y + hop + startled, pos.z);
    // Turn smoothly, the short way round (instantly once in a lap, which moves).
    const turn = Math.atan2(Math.sin(spot.facing - facing), Math.cos(spot.facing - facing));
    facing = still || (mode.kind === "lap" && settled) ? spot.facing : facing + turn * Math.min(1, dt * 6);
    cat.rotation.y = facing;

    const purring = stroked || (now - pettedAt < 2.2 && now - biteAt > 1);
    purringNow = purring;
    const step = t * (spot.pose === "run" ? 17 : 9);
    // Reset to standing, then shape the pose.
    body.position.set(0, 0.17, 0);
    body.rotation.set(0, 0, 0);
    head.position.set(0, 0.28, 0.17);
    head.rotation.set(0, 0, 0);
    legs.forEach((leg, i) => {
      leg.position.set(leg.position.x, 0.12, i < 2 ? 0.11 : -0.11);
      leg.rotation.set(0, 0, 0);
      leg.scale.y = 1;
      if (spot.pose === "walk") leg.rotation.x = Math.sin(step + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.55;
    });
    tail[0].rotation.set(1.0, Math.sin(t * 2.2) * 0.35, 0);
    for (let i = 1; i < tail.length; i++) tail[i].rotation.set(-0.25, Math.sin(t * 2.2 - i) * 0.25, 0);

    if (spot.pose === "run") {
      // A low, stretched-out gallop with the tail streaming behind.
      body.position.y += Math.abs(Math.sin(step)) * 0.03;
      body.rotation.x = Math.sin(step) * 0.08;
      head.position.y = 0.25;
      tail[0].rotation.set(0.25, Math.sin(t * 6) * 0.2, 0);
      legs.forEach((leg, i) => (leg.rotation.x = Math.sin(step + (i < 2 ? 0 : Math.PI)) * 0.9));
    } else if (spot.pose === "walk") {
      body.position.y += Math.abs(Math.sin(step)) * 0.01;
      head.rotation.x = Math.sin(step * 0.5) * 0.05;
    } else if (spot.pose === "eat") {
      // Front end down, nose in the bowl, chewing.
      body.rotation.x = 0.2;
      body.position.y = 0.16;
      head.position.set(0, 0.16, 0.22);
      head.rotation.x = 0.75 + Math.sin(t * 11) * 0.06;
      for (const front of [legs[0], legs[1]]) front.rotation.x = -0.25;
      tail[0].rotation.set(0.5, Math.sin(t * 1.6) * 0.5, 0);
    } else if (spot.pose === "sit" || spot.pose === "groom" || spot.pose === "swipe") {
      body.position.set(0, 0.16, -0.03);
      body.rotation.x = -0.5;
      head.position.set(0, 0.35, 0.13);
      for (const back of [legs[2], legs[3]]) {
        back.position.y = 0.05;
        back.rotation.x = -1.45;
      }
      for (const front of [legs[0], legs[1]]) front.position.z = 0.1;
      tail[0].rotation.set(-0.35, 0.9, 0);
      for (let i = 1; i < tail.length; i++) tail[i].rotation.set(0.05, 0.45 + Math.sin(t * 1.5 - i) * 0.15, 0);
      if (spot.pose === "swipe") {
        // Reaching out and batting at something in front of her.
        const bat = Math.max(0, Math.sin(t * 5));
        legs[1].rotation.x = -1.2 - bat * 0.6;
        legs[1].position.y = 0.15;
        head.rotation.x = 0.35;
      } else if (spot.pose === "groom") {
        // A paw up to the face, the head bobbing to lick it.
        const lick = Math.sin(t * 7);
        legs[1].rotation.x = -2.6 + lick * 0.15;
        legs[1].position.y = 0.16;
        head.rotation.x = 0.35 + lick * 0.08;
        head.rotation.y = -0.25;
      } else {
        head.rotation.y = Math.sin(t * 0.7) * 0.3;
      }
    } else {
      // Loaf: tucked up, head down, tail wrapped round.
      body.position.y = 0.1;
      head.position.set(0, 0.17, 0.16);
      head.rotation.x = 0.25;
      for (const leg of legs) {
        leg.scale.y = 0.15;
        leg.position.y = 0.03;
      }
      tail[0].rotation.set(-0.9, 1.3, 0);
      for (let i = 1; i < tail.length; i++) tail[i].rotation.set(0, 0.55, 0);
    }

    if (purring) {
      head.rotation.z = Math.sin(now * 3) * 0.12;
      head.rotation.x += 0.12;
      tail[0].rotation.y = Math.sin(now * 1.2) * 0.5;
    }
    const napping = spot.pose === "loaf" && mode.kind !== "lap";
    sleepyEyes.visible = napping || purring;
    eyes.visible = !sleepyEyes.visible;

    // Hearts drift up while she's enjoying it.
    head.getWorldPosition(headPoint);
    hearts.forEach((heart, i) => {
      const age = stroked ? ((now * 0.7 + i / hearts.length) % 1) * 1.6 : now - pettedAt - i * 0.35;
      heart.visible = purring && age > 0 && age < 1.6 && !still;
      if (!heart.visible) return;
      heart.position.set(headPoint.x + Math.sin(age * 4 + i) * 0.06, headPoint.y + 0.12 + age * 0.35, headPoint.z);
      heart.scale.setScalar(0.09 + age * 0.03);
      heart.material.opacity = 1 - age / 1.6;
    });
  }

  // Petting: a purr, unless she's been petted too much lately.
  function pet(now: number) {
    while (pets.length && now - pets[0] > 5) pets.shift();
    pets.push(now);
    if (pets.length >= 4) {
      pets.length = 0;
      biteAt = now;
      return "bite" as const;
    }
    pettedAt = now;
    return "purr" as const;
  }

  return {
    name: plan.name,
    group: cat,
    head,
    update,
    pet,
    // Whether she has got where she's wanted (into his lap, say).
    isSettled: () => settled,
    isPurring: () => purringNow,
    setHat: (on: boolean) => {
      hat.visible = on;
    },
    // Only while she's actually there on her rounds.
    currentTag: () => (settled ? tag : null),
  };
}
