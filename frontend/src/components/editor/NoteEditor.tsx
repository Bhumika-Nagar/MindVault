import type { Note } from "../../types/note";

interface NoteEditorProps {
  note: Note | null;
  value: string;
  onChange: (value: string) => void;
}

export function NoteEditor({ note, value, onChange }: NoteEditorProps) {
  if (!note) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center">
        <div className="max-w-sm space-y-3">
          <p className="text-lg font-medium text-stone-700 dark:text-stone-100">No note selected</p>
          <p className="text-sm leading-6 text-stone-400">
            Create a new note from the sidebar to start writing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col px-6 py-8 sm:px-10">
      <input
        value={note.title}
        readOnly
        className="mb-4 border-none bg-transparent p-0 text-3xl font-semibold tracking-tight text-stone-900 outline-none placeholder:text-stone-300 dark:text-stone-100"
      />

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Start writing..."
        className="muted-scrollbar min-h-0 flex-1 resize-none border-none bg-transparent p-0 text-base leading-7 text-stone-600 outline-none placeholder:text-stone-300 dark:text-stone-300 dark:placeholder:text-stone-600"
      />
    </div>
  );
}
