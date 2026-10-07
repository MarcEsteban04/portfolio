import assert from "node:assert/strict";
import { test } from "node:test";
import {
  badgeAngle,
  createRope,
  fling,
  isResting,
  SEGMENTS,
  STEP,
  stepRope,
} from "./rope.ts";

function simulate(seconds: number, rope: ReturnType<typeof createRope>) {
  for (let i = 0; i < seconds / STEP; i++) stepRope(rope);
}

test("a badge dropped from the side comes to rest hanging straight down", () => {
  const rope = createRope({ x: 140, y: -28, length: 140, reach: 300, angle: 1.15 });
  simulate(12, rope);
  const top = rope.points[SEGMENTS];
  assert.ok(Math.abs(top.x - 140) < 2, `strap end drifted to x=${top.x}`);
  assert.ok(Math.abs(badgeAngle(rope)) < 0.02, `badge still tilted ${badgeAngle(rope)}`);
  assert.ok(top.y > 100, `strap end only reached y=${top.y}`);
});

test("the strap keeps its length while it swings", () => {
  const rope = createRope({ x: 0, y: 0, length: 120, reach: 200, angle: 0.9 });
  for (let i = 0; i < 240; i++) {
    stepRope(rope);
    for (let s = 0; s < SEGMENTS; s++) {
      const a = rope.points[s];
      const b = rope.points[s + 1];
      const gap = Math.hypot(b.x - a.x, b.y - a.y);
      assert.ok(Math.abs(gap - rope.link) < 0.5, `link ${s} stretched to ${gap}`);
    }
  }
});

test("a held badge follows the pointer, and a fling sets it swinging", () => {
  const rope = createRope({ x: 0, y: 0, length: 120, reach: 200 });
  for (let i = 0; i < 30; i++) stepRope(rope, { hold: { x: 150, y: 250 } });
  assert.equal(rope.weight.x, 150);
  assert.equal(rope.weight.y, 250);

  fling(rope, 1500, 0);
  stepRope(rope);
  assert.ok(rope.weight.x > 150, "the badge didn't carry on after the fling");
});

test("a rope hung straight settles within a second, and a fling wakes it", () => {
  const rope = createRope({ x: 0, y: 0, length: 120, reach: 200 });
  simulate(1, rope);
  assert.ok(isResting(rope));
  fling(rope, 800, 0);
  stepRope(rope);
  assert.ok(!isResting(rope));
});
