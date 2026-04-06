import { API_BASE_URL, STORAGE_KEY } from "../lib/constants";
import type { CreateNoteInput, Note, UpdateNoteInput } from "../types/note";
import { getNoteTitle } from "../utils/note";

const NOTES_ENDPOINT = `${API_BASE_URL}/notes`;

function createEmptyNote(input?: CreateNoteInput): Note {
  const now = new Date().toISOString();
  const content = input?.content ?? "";

  return {
    id: crypto.randomUUID(),
    title: input?.title?.trim() || getNoteTitle(content),
    content,
    createdAt: now,
    updatedAt: now
  };
}

function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

function readStoredNotes(): Note[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = [
      createEmptyNote({
        title: "Welcome to MindVault",
        content:
          "This is a clean, minimal note-taking workspace.\n\nUse the sidebar to switch notes, press Cmd/Ctrl + N to create a new one, and start writing here."
      })
    ];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  try {
    const parsed = JSON.parse(raw) as Note[];
    return sortNotes(parsed);
  } catch {
    return [];
  }
}

function writeStoredNotes(notes: Note[]): Note[] {
  const sorted = sortNotes(notes);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  return sorted;
}

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export const notesService = {
  async list(): Promise<Note[]> {
    try {
      const data = await request<Note[]>(NOTES_ENDPOINT);
      return sortNotes(data);
    } catch {
      return readStoredNotes();
    }
  },

  async create(input?: CreateNoteInput): Promise<Note> {
    try {
      return await request<Note>(NOTES_ENDPOINT, {
        method: "POST",
        body: JSON.stringify(input ?? {})
      });
    } catch {
      const notes = readStoredNotes();
      const next = createEmptyNote(input);
      writeStoredNotes([next, ...notes]);
      return next;
    }
  },

  async update(noteId: string, input: UpdateNoteInput): Promise<Note> {
    try {
      return await request<Note>(`${NOTES_ENDPOINT}/${noteId}`, {
        method: "PATCH",
        body: JSON.stringify(input)
      });
    } catch {
      const notes = readStoredNotes();
      const nextNotes = notes.map((note) => {
        if (note.id !== noteId) {
          return note;
        }

        const content = input.content ?? note.content;
        return {
          ...note,
          ...input,
          title: input.title?.trim() || getNoteTitle(content),
          content,
          updatedAt: new Date().toISOString()
        };
      });

      const updated = nextNotes.find((note) => note.id === noteId);
      writeStoredNotes(nextNotes);

      if (!updated) {
        throw new Error("Note not found");
      }

      return updated;
    }
  },

  async remove(noteId: string): Promise<void> {
    try {
      await request(`${NOTES_ENDPOINT}/${noteId}`, {
        method: "DELETE"
      });
    } catch {
      const notes = readStoredNotes();
      writeStoredNotes(notes.filter((note) => note.id !== noteId));
    }
  }
};
