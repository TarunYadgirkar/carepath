export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 px-6 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800">
      <p>CarePath — voice-first patient navigation. Not a diagnosis system.</p>
      <p className="mt-1">© {new Date().getFullYear()} CarePath. Hackathon demo project.</p>
    </footer>
  );
}
