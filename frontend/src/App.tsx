import { useMemo, useState } from "react";
import { NoteEditor } from "./components/editor/NoteEditor";
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { LoadingScreen } from "./components/shared/LoadingScreen";
import { useDarkMode } from "./hooks/useDarkMode";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useNotes } from "./hooks/useNotes";

export default function App() {
  const [searchValue, setSearchValue] = useState("");
  const { isDark, toggleTheme } = useDarkMode();
  const {
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
  } = useNotes();

  useKeyboardShortcuts({
    onCreateNote: () => {
      void createNote();
    },
    onDeleteNote: () => {
      void deleteActiveNote();
    },
    onToggleTheme: toggleTheme
  });

  const filteredNotes = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) {
      return notes;
    }

    return notes.filter((note) => {
      return (
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
      );
    });
  }, [notes, searchValue]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="h-full bg-canvas dark:bg-canvas-dark">
      <div className="flex h-full flex-col">
        <TopBar
          noteCount={notes.length}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          saveState={saveState}
        />

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <Sidebar
            notes={filteredNotes}
            activeNoteId={activeNoteId}
            searchValue={searchValue}
            onSelectNote={selectNote}
            onCreateNote={() => void createNote()}
            onDeleteNote={() => void deleteActiveNote()}
          />

          <main className="min-h-0 flex-1 bg-white dark:bg-stone-950">
            <NoteEditor note={activeNote} value={draftContent} onChange={setDraftContent} />
          </main>
        </div>
      </div>
    </div>
  );
}
