export function LoadingScreen() {
  return (
    <div className="flex h-full items-center justify-center bg-stone-50 dark:bg-stone-950">
      <div className="space-y-3 text-center">
        <div className="mx-auto size-10 animate-pulse rounded-2xl bg-stone-200 dark:bg-stone-800" />
        <p className="text-sm text-stone-400">Loading notes...</p>
      </div>
    </div>
  );
}
