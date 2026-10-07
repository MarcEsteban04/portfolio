// Mochi, the office cat: an orange tabby built from boxes who makes her
// rounds of the room (a groom on the rug, watching Marc work, a nap on the
// bed) and can be petted. Built facing +z with her feet at y = 0.
import * as THREE from "three";
import { box, canvasTexture, cylinder, mat, rounded, smooth } from "@/app/office/shapes";

type Pose = "walk" | "sit" | "groom" | "loaf";
type Point = [number, number, number];

// Spots in the room (world coordinates) and the route between them.
const RUG: Point = [0.6, 0, 0.1];
const BY_CHAIR: Point = [1.25, 0, -1.05];
const MIDDLE: Point = [0.1, 0, 0.95];
const BED_FOOT: Point = [-0.55, 0, 0.95];
const ON_BED: Point = [-1.15, 0.53, 0.95];
const FRONT: Point = [-0.6, 0, 1.7];
const FLUFFY_RUG: Point = [-1.45, 0, 1.75];
const CHAIR: Point = [0.45, 0, -1.62];

type Leg =
  | { kind: "stay"; at: Point; pose: Exclude<Pose, "walk">; seconds: number; facing: number }
  | { kind: "walk" | "jump"; from: Point; to: Point; seconds: number };

const walk = (from: Point, to: Point): Leg => ({
  kind: "walk",
  from,
  to,
  seconds: Math.hypot(to[0] - from[0], to[2] - from[2]) / 0.45,
});
const facingTo = (from: Point, to: Point) => Math.atan2(to[0] - from[0], to[2] - from[2]);
const TOWARD_CAMERA = Math.PI / 4;

const route: Leg[] = [
  { kind: "stay", at: RUG, pose: "groom", seconds: 7, facing: TOWARD_CAMERA },
  walk(RUG, BY_CHAIR),
  { kind: "stay", at: BY_CHAIR, pose: "sit", seconds: 8, facing: facingTo(BY_CHAIR, CHAIR) },
  walk(BY_CHAIR, MIDDLE),
  walk(MIDDLE, BED_FOOT),
  { kind: "jump", from: BED_FOOT, to: ON_BED, seconds: 0.7 },
  { kind: "stay", at: ON_BED, pose: "loaf", seconds: 15, facing: TOWARD_CAMERA },
  { kind: "jump", from: ON_BED, to: FRONT, seconds: 0.7 },
  walk(FRONT, FLUFFY_RUG),
  { kind: "stay", at: FLUFFY_RUG, pose: "sit", seconds: 6, facing: TOWARD_CAMERA },
  walk(FLUFFY_RUG, FRONT),
  walk(FRONT, MIDDLE),
  walk(MIDDLE, RUG),
];
const routeLength = route.reduce((sum, leg) => sum + leg.seconds, 0);

export function createCat(room: THREE.Object3D) {
  const fur = mat("#e08a3c", { roughness: 1 });
  const stripe = mat("#b8642a", { roughness: 1 });
  const white = mat("#f6efe4", { roughness: 1 });
  const pink = mat("#f2a0a8");
  const ink = mat("#141414");

  const cat = new THREE.Group();
  cat.scale.setScalar(1.15);
  room.add(cat);

  const body = new THREE.Group();
  body.position.y = 0.17;
  cat.add(body);
  body.add(rounded(0.17, 0.15, 0.34, 0.06, fur));
  for (const z of [-0.09, 0, 0.09]) body.add(box(0.172, 0.03, 0.025, stripe, 0, 0.062, z));
  body.add(rounded(0.1, 0.08, 0.06, 0.03, white, 0, -0.03, 0.15));

  const head = new THREE.Group();
  head.position.set(0, 0.28, 0.17);
  cat.add(head);
  head.add(rounded(0.15, 0.13, 0.13, 0.05, fur));
  head.add(box(0.03, 0.02, 0.1, stripe, 0, 0.062, -0.01));
  for (const side of [-1, 1]) {
    const ear = cylinder(0, 0.03, 0.06, fur, side * 0.045, 0.08, -0.01, 4);
    ear.rotation.z = side * -0.25;
    head.add(ear);
    const inner = cylinder(0, 0.017, 0.04, pink, side * 0.045, 0.078, 0.004, 4);
    inner.rotation.z = side * -0.25;
    head.add(inner);
    for (const tilt of [-0.12, 0.12]) {
      const whisker = box(0.06, 0.003, 0.003, white, side * 0.06, -0.025 + tilt * 0.06, 0.066);
      whisker.rotation.z = side * tilt;
      whisker.castShadow = false;
      head.add(whisker);
    }
  }
  const eyes = new THREE.Group();
  for (const side of [-1, 1]) {
    eyes.add(box(0.028, 0.03, 0.006, mat("#9bd34f", { emissive: "#3a5a10", emissiveIntensity: 0.4 }), side * 0.035, 0.015, 0.066));
    eyes.add(box(0.008, 0.026, 0.008, ink, side * 0.035, 0.015, 0.068));
  }
  head.add(eyes);
  const sleepyEyes = new THREE.Group();
  for (const side of [-1, 1]) sleepyEyes.add(box(0.03, 0.006, 0.008, ink, side * 0.035, 0.012, 0.067));
  sleepyEyes.visible = false;
  head.add(sleepyEyes);
  head.add(rounded(0.07, 0.04, 0.025, 0.012, white, 0, -0.03, 0.06));
  head.add(box(0.018, 0.012, 0.01, pink, 0, -0.012, 0.074));

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
    hip.add(box(0.045, 0.022, 0.052, white, 0, -0.112, 0.006));
    return hip;
  });

  // Tail: four segments, each hung off the end of the last.
  const tail: THREE.Group[] = [];
  let parent: THREE.Object3D = cat;
  for (let i = 0; i < 4; i++) {
    const segment = new THREE.Group();
    segment.position.set(0, i === 0 ? 0.2 : 0, i === 0 ? -0.16 : -0.085);
    segment.add(box(0.036, 0.036, 0.09, i === 3 ? stripe : fur, 0, 0, -0.042));
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
  let pettedAt = -99;
  let biteAt = -99;
  const pets: number[] = [];
  const headPoint = new THREE.Vector3();

  // Where she is on her rounds at time t, and in what pose.
  function onRoute(t: number) {
    let left = t % routeLength;
    for (const leg of route) {
      if (left < leg.seconds) {
        const k = left / leg.seconds;
        if (leg.kind === "stay") return { at: leg.at, pose: leg.pose, facing: leg.facing, hop: 0 };
        const at = leg.from.map((v, i) => v + (leg.to[i] - v) * (leg.kind === "jump" ? smooth(k) : k)) as Point;
        const hop = leg.kind === "jump" ? Math.sin(k * Math.PI) * 0.35 : 0;
        return { at, pose: "walk" as Pose, facing: facingTo(leg.from, leg.to), hop };
      }
      left -= leg.seconds;
    }
    return { at: RUG, pose: "sit" as Pose, facing: TOWARD_CAMERA, hop: 0 };
  }

  function update(t: number, now: number, dt: number, ownerAsleep: boolean, still: boolean) {
    const spot = ownerAsleep
      ? { at: ON_BED, pose: "loaf" as Pose, facing: TOWARD_CAMERA, hop: 0 }
      : onRoute(t);
    const startled = now - biteAt < 0.5 ? Math.sin(((now - biteAt) / 0.5) * Math.PI) * 0.12 : 0;
    cat.position.set(spot.at[0], spot.at[1] + spot.hop + startled, spot.at[2]);
    // Turn smoothly, the short way round.
    const turn = Math.atan2(Math.sin(spot.facing - facing), Math.cos(spot.facing - facing));
    facing = still ? spot.facing : facing + turn * Math.min(1, dt * 6);
    cat.rotation.y = facing;

    const purring = now - pettedAt < 2.2 && now - biteAt > 1;
    const step = t * 9;
    // Reset to standing, then shape the pose.
    body.position.set(0, 0.17, 0);
    body.rotation.set(0, 0, 0);
    head.position.set(0, 0.28, 0.17);
    head.rotation.set(0, 0, 0);
    legs.forEach((leg, i) => {
      leg.position.y = 0.12;
      leg.rotation.set(0, 0, 0);
      leg.scale.y = 1;
      if (spot.pose === "walk") leg.rotation.x = Math.sin(step + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.55;
    });
    tail[0].rotation.set(1.0, Math.sin(t * 2.2) * 0.35, 0);
    for (let i = 1; i < tail.length; i++) tail[i].rotation.set(-0.25, Math.sin(t * 2.2 - i) * 0.25, 0);

    if (spot.pose === "walk") {
      body.position.y += Math.abs(Math.sin(step)) * 0.01;
      head.rotation.x = Math.sin(step * 0.5) * 0.05;
    } else if (spot.pose === "sit" || spot.pose === "groom") {
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
      if (spot.pose === "groom") {
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
    for (const leg of [legs[0], legs[1]]) if (spot.pose !== "sit" && spot.pose !== "groom") leg.position.z = 0.11;

    if (purring) {
      head.rotation.z = Math.sin(now * 3) * 0.12;
      head.rotation.x += 0.12;
      tail[0].rotation.y = Math.sin(now * 1.2) * 0.5;
    }
    const napping = spot.pose === "loaf";
    sleepyEyes.visible = napping || purring;
    eyes.visible = !sleepyEyes.visible;

    // Hearts drift up while she's enjoying it.
    head.getWorldPosition(headPoint);
    hearts.forEach((heart, i) => {
      const age = now - pettedAt - i * 0.35;
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

  return { group: cat, head, update, pet };
}
