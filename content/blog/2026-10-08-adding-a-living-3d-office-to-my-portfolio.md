---
title: "Adding a living 3D office to my portfolio"
date: 2026-10-08
category: Build log
summary: "I turned the home‑page desk demo into a full‑screen interactive office with cats, weather, sound and a smoother UI."
tags: [portfolio, threejs, interactive]
---

## A dedicated 3D office page
I moved the low‑poly office from the home panel to its own route **/desk**. The page now fills the screen and loads three.js only when visited, keeping the rest of the site fast. A set of buttons lets visitors pick an activity – work, coffee, eat, game, code late or sleep – and the scene updates its lighting to match the real‑time Manila clock.

## Refined environment and furniture
The office was rebuilt with a racing‑style gaming chair, a 3.2 m wide desk with RGB strips, dual monitors, a glass‑panel PC, keyboard with real keycaps, a thin‑glow mouse pad and a "SHIP IT" poster. I fixed the poster’s z‑fight so it no longer disappears, and adjusted camera clipping for better depth precision.

## Interactivity that feels personal
Every major object can be clicked: the PC, lamp, speakers, wall clock, mug, plant, poster and even my avatar. Turning the PC off during a game makes me rage, roll over and power it back on, getting angrier each time. The lamp now has a physical switch; I roll left, press it, and the light responds. The chair spins when clicked, showing a brief dizzy animation before I settle.

## Eating, drinking and coding details
I solved the arm poses so the mug’s rim and spoon actually meet my lips. The right hand rests on the mouse, which only moves when the hand is on it, letting me scroll and click while coding late at night. During coffee breaks the code stays on screen, idle, with just the cursor blinking.

## Cats, weather and ambient sound
Two cats – Mochi and Tilapya – wander the room, use the litter box, eat from bowls and jump onto my lap. On some coffee breaks I call one of them over and she walks across and curls up in my lap. Visitors can pet them for a purr, or a hiss if they overdo it. The window displays real‑time Bulacan weather from Open‑Meteo, with rain that uses soft brown noise instead of harsh white noise.

## Audio that respects the browser
All sounds – typing, mouse clicks, game gunfire, rain, air‑con hum, fridge door, chair spin, coffee slurp and cat meows – are generated with WebAudio and start only after the first user interaction. The audio engine suspends when the page is hidden or scrolled out of view.

## UI polish and visitor tools
I replaced emojis with line icons for activities, weather and notes. Hero invites now appear instantly, with plain arrow tiles instead of sparkles. A "Notes" button opens a cork‑board where visitors can pin short messages. Scrollbars are slim, rounded and theme‑aware, and the guided tour no longer launches by itself; the home page invites visitors to take it instead.

All these tweaks make the 3D office feel like a lived‑in space that visitors can explore, interact with and leave a trace in, without slowing down the rest of my portfolio site.
