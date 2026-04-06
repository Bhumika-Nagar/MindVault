import { Search } from "../shared/icons/Search";
import { Moon } from "../shared/icons/Moon";
import { Sun } from "../shared/icons/Sun";

interface TopBarProps {
  noteCount: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  saveState: "idle" | "saving" | "saved";
}

export function TopBar({
  noteCount,
  searchValue,
  onSearchChange,
  isDark,
  onToggleTheme,
  saveState
}: TopBarProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-stone-200 px-4 dark:border-stone-800 sm:px-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">MindVault</p>
        <h1 className="text-sm font-medium text-stone-700 dark:text-stone-200">
          {noteCount} {noteCount === 1 ? "note" : "notes"}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <label className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
          <input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search notes..."
            className="h-10 w-64 rounded-xl border border-stone-200 bg-stone-50 pl-10 pr-3 text-sm outline-none transition focus:border-stone-400 focus:bg-white dark:border-stone-700 dark:bg-stone-900 dark:focus:border-stone-500"
          />
        </label>

        <span className="hidden text-xs text-stone-400 sm:inline">
          {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : "All changes synced"}
        </span>

        <button
          type="button"
          onClick={onToggleTheme}
          className="inline-flex size-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
          aria-label="Toggle color theme"
        >
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
      </div>
    </header>
  );
}
