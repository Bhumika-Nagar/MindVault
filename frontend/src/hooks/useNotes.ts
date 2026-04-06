import { useEffect, useMemo, useState } from "react";
import { STORAGE_KEY } from "../lib/constants";
import { notesService } from "../services/notes";
import type { Note } from "../types/note";
import { getNoteTitle } from "../utils/note";
import { useDebouncedValue } from "./useDebouncedValue";

type SaveState = "idle" | "saving" | "saved";

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [draftContent, setDraftContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const activeNote = useMemo(
    () => notes.find((note) => note.id === activeNoteId) ?? null,
    [activeNoteId, notes]
  );

  const debouncedDraftContent = useDebouncedValue(draftContent, 300);

  useEffect(() => {
    let mounted = true;

    async function loadNotes() {
      try {
        const initialNotes = await notesService.list();
        if (!mounted) {
          return;
        }

        setNotes(initialNotes);
        const firstNote = initialNotes[0] ?? null;
        setActiveNoteId(firstNote?.id ?? null);
        setDraftContent(firstNote?.content ?? "");
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadNotes();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!activeNote) {
      return;
    }

    setDraftContent(activeNote.content);
  }, [activeNoteId]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY || !event.newValue) {
        return;
      }

      try {
        const nextNotes = JSON.parse(event.newValue) as Note[];
        setNotes(nextNotes);
        setActiveNoteId((currentId) => {
          if (currentId && nextNotes.some((note) => note.id === currentId)) {
            return currentId;
          }

          return nextNotes[0]?.id ?? null;
        });
      } catch {
        return;
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (!activeNote || debouncedDraftContent === activeNote.content) {
      return;
    }

    setSaveState("saving");

    void notesService
      .update(activeNote.id, {
        content: debouncedDraftContent,
        title: getNoteTitle(debouncedDraftContent)
      })
      .then((updatedNote) => {
        setNotes((currentNotes) =>
          [updatedNote, ...currentNotes.filter((note) => note.id !== updatedNote.id)].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
        );
        setSaveState("saved");
        window.setTimeout(() => setSaveState("idle"), 1200);
      })
      .catch(() => {
        setSaveState("idle");
      });
  }, [activeNote, debouncedDraftContent]);

  async function createNote() {
    const note = await notesService.create({
      title: "Untitled",
      content: ""
    });

    setNotes((currentNotes) => [note, ...currentNotes]);
    setActiveNoteId(note.id);
    setDraftContent(note.content);
  }

  async function deleteActiveNote() {
    if (!activeNote) {
      return;
    }

    const deletedId = activeNote.id;
    await notesService.remove(deletedId);

    setNotes((currentNotes) => {
      const nextNotes = currentNotes.filter((note) => note.id !== deletedId);
      const fallback = nextNotes[0] ?? null;
      setActiveNoteId(fallback?.id ?? null);
      setDraftContent(fallback?.content ?? "");
      return nextNotes;
    });
  }

  function selectNote(noteId: string) {
    setActiveNoteId(noteId);
  }

  return {
    notes,
    activeNote,
    activeNoteId,
    draftContent,
    isLoading,
    saveState,
    setDraftContent,
    selectNote,
    createNote,
    deleteActiveNote
  };
}
