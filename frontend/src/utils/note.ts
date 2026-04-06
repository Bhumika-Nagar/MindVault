import type { Note } from "../types/note";

export function getNoteTitle(content: string, fallback = "Untitled"): string {
  const firstLine = content
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  return firstLine?.slice(0, 60) || fallback;
}

export function getNotePreview(note: Note): string {
  const plain = note.content.replace(/\n+/g, " ").trim();
  return plain || "Empty note";
}
