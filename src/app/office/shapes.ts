// Building blocks for the office: materials, primitive meshes with shadows
// on, canvas textures and easing helpers.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

type MaterialOptions = THREE.MeshStandardMaterialParameters;
export const mat = (color: string, extra: MaterialOptions = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...extra });

export function box(w: number, h: number, d: number, material: THREE.Material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function rounded(w: number, h: number, d: number, radius: number, material: THREE.Material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, radius), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function cylinder(radiusTop: number, radiusBottom: number, h: number, material: THREE.Material, x = 0, y = 0, z = 0, segments = 16) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, h, segments), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function canvasTexture(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return { context: canvas.getContext("2d")!, texture };
}

// A soft white dot for steam puffs.
export function puffTexture() {
  const { context, texture } = canvasTexture(64, 64);
  const g = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,0.9)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = g;
  context.fillRect(0, 0, 64, 64);
  return texture;
}

export const smooth = (x: number) => x * x * (3 - 2 * x);
export const pulse = (t: number, start: number, end: number) => {
  if (t <= start || t >= end) return 0;
  return Math.sin(((t - start) / (end - start)) * Math.PI);
};

