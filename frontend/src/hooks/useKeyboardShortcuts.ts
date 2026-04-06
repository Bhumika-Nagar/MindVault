import { useEffect } from "react";

interface KeyboardShortcutOptions {
  onCreateNote: () => void;
  onDeleteNote: () => void;
  onToggleTheme: () => void;
}

export function useKeyboardShortcuts({
  onCreateNote,
  onDeleteNote,
  onToggleTheme
}: KeyboardShortcutOptions) {
  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      const isModifier = event.metaKey || event.ctrlKey;
      if (!isModifier) {
        return;
      }

      if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        onCreateNote();
      }

      if (event.key.toLowerCase() === "backspace") {
        event.preventDefault();
        onDeleteNote();
      }

      if (event.shiftKey && event.key.toLowerCase() === "d") {
        event.preventDefault();
        onToggleTheme();
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [onCreateNote, onDeleteNote, onToggleTheme]);
}
