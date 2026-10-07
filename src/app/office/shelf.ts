import { projects } from "@/lib/projects";

// The titles on the shelf's book spines, in order: the three projects, then
// experience and contact. The office panel opens a card for each.
export const shelfBooks = [...projects.slice(0, 3).map((project) => project.name), "Experience", "Contact"];
