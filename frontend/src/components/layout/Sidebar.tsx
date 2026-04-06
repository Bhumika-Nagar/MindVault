import type { Note } from "../../types/note";
import { formatRelativeDate } from "../../utils/date";
import { getNotePreview } from "../../utils/note";
import { cn } from "../../lib/cn";
import { Plus } from "../shared/icons/Plus";
import { Trash } from "../shared/icons/Trash";

interface SidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  searchValue: string;
  onSelectNote: (noteId: string) => void;
  onCreateNote: () => void;
  onDeleteNote: () => void;
}

export function Sidebar({
  notes,
  activeNoteId,
  searchValue,
  onSelectNote,
  onCreateNote,
  onDeleteNote
}: SidebarProps) {
  return (
    <aside className="flex h-full w-full max-w-full flex-col border-r border-stone-200 bg-stone-50/80 dark:border-stone-800 dark:bg-stone-950/60 lg:max-w-80">
      <div className="flex items-center justify-between px-4 py-4">
        <div>
          <p className="text-sm font-semibold text-stone-700 dark:text-stone-100">Workspace</p>
          <p className="text-xs text-stone-400">Minimal note-taking</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDeleteNote}
            className="inline-flex size-9 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-200 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-100"
            aria-label="Delete active note"
          >
            <Trash className="size-4" />
          </button>
          <button
            type="button"
            onClick={onCreateNote}
            className="inline-flex size-9 items-center justify-center rounded-lg bg-stone-900 text-white transition hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
            aria-label="Create note"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <div className="muted-scrollbar flex-1 space-y-1 overflow-y-auto px-2 pb-3">
        {notes.length === 0 ? (
          <div className="px-3 py-8 text-sm text-stone-400">No notes match “{searchValue}”.</div>
        ) : (
          notes.map((note) => (
            <button
              key={note.id}
              type="button"
              onClick={() => onSelectNote(note.id)}
              className={cn(
                "flex w-full flex-col rounded-xl px-3 py-3 text-left transition",
                activeNoteId === note.id
                  ? "bg-white shadow-sm ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700"
                  : "hover:bg-white/70 dark:hover:bg-stone-900/60"
              )}
            >
              <span className="truncate text-sm font-medium text-stone-700 dark:text-stone-100">
                {note.title}
              </span>
              <span className="mt-1 line-clamp-2 text-xs leading-5 text-stone-400">
                {getNotePreview(note)}
              </span>
              <span className="mt-2 text-[11px] uppercase tracking-[0.18em] text-stone-300">
                {formatRelativeDate(note.updatedAt)}
              </span>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
