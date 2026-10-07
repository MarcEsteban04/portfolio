// Rope physics for the lanyard (Verlet integration). The strap is a chain of
// points hanging from a fixed anchor; the badge is a rigid stick from the last
// strap point to a heavier point below it, so the strap bends and trails while
// the badge swings.

export const SEGMENTS = 10;
export const STEP = 1 / 120;
const GRAVITY = 2400; // px/s²
const RETAIN = 0.993; // share of velocity kept each step
const ITERATIONS = 16;
const BADGE_WEIGHT = 5; // the badge outweighs a strap link this many times

// w is the inverse weight: 0 pins a point in place.
export type Point = { x: number; y: number; px: number; py: number; w: number };

export type Rope = {
  anchor: { x: number; y: number };
  points: Point[];
  // The heavy point at the badge's centre of weight.
  weight: Point;
  link: number;
  reach: number;
};

// Lays the rope out straight from the anchor at `angle` radians from hanging
// down (positive swings it to the right), at rest.
export function createRope({
  x,
  y,
  length,
  reach,
  angle = 0,
}: {
  x: number;
  y: number;
  length: number;
  reach: number;
  angle?: number;
}): Rope {
  const link = length / SEGMENTS;
  const dx = Math.sin(angle);
  const dy = Math.cos(angle);
  const points = Array.from({ length: SEGMENTS + 1 }, (_, i) => {
    const px = x + dx * link * i;
    const py = y + dy * link * i;
    return { x: px, y: py, px, py, w: i === 0 ? 0 : 1 };
  });
  const top = points[SEGMENTS];
  const wx = top.x + dx * reach;
  const wy = top.y + dy * reach;
  return {
    anchor: { x, y },
    points,
    weight: { x: wx, y: wy, px: wx, py: wy, w: 1 / BADGE_WEIGHT },
    link,
    reach,
  };
}

// Moves two points toward or apart from each other until they are `length`
// apart, each by a share set by its inverse weight.
function solve(a: Point, b: Point, length: number) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.hypot(dx, dy) || 0.0001;
  const total = a.w + b.w;
  if (!total) return;
  const diff = (distance - length) / distance;
  a.x += dx * diff * (a.w / total);
  a.y += dy * diff * (a.w / total);
  b.x -= dx * diff * (b.w / total);
  b.y -= dy * diff * (b.w / total);
}

// Advances the rope by one fixed step. `push` is a sideways acceleration on
// the badge (a breeze); `hold` pins the badge's weight to a point while it is
// being dragged.
export function stepRope(
  rope: Rope,
  {
    push = 0,
    hold = null,
  }: { push?: number; hold?: { x: number; y: number } | null } = {},
) {
  const { points, weight } = rope;
  const dt = STEP;
  weight.w = hold ? 0 : 1 / BADGE_WEIGHT;
  for (const point of [...points, weight]) {
    if (!point.w) continue;
    const vx = (point.x - point.px) * RETAIN;
    const vy = (point.y - point.py) * RETAIN;
    point.px = point.x;
    point.py = point.y;
    point.x += vx;
    point.y += vy + GRAVITY * dt * dt;
  }
  if (hold) {
    weight.x = hold.x;
    weight.y = hold.y;
  } else {
    weight.x += push * dt * dt;
  }
  points[0].x = rope.anchor.x;
  points[0].y = rope.anchor.y;
  const top = points[SEGMENTS];
  for (let k = 0; k < ITERATIONS; k++) {
    for (let i = 0; i < SEGMENTS; i++) solve(points[i], points[i + 1], rope.link);
    solve(top, weight, rope.reach);
  }
}

// Gives the badge's weight a velocity, in px/s, as when a drag is let go.
export function fling(rope: Rope, vx: number, vy: number) {
  rope.weight.px = rope.weight.x - vx * STEP;
  rope.weight.py = rope.weight.y - vy * STEP;
}

// True once nothing is moving more than a hair per step, so the animation
// loop can stop until something disturbs the badge again.
export function isResting(rope: Rope) {
  return [...rope.points, rope.weight].every(
    (point) =>
      Math.abs(point.x - point.px) < 0.01 && Math.abs(point.y - point.py) < 0.01,
  );
}

// The badge's tilt in radians from hanging straight down; positive when its
// bottom swings to the right.
export function badgeAngle(rope: Rope) {
  const top = rope.points[SEGMENTS];
  return Math.atan2(rope.weight.x - top.x, rope.weight.y - top.y);
}
