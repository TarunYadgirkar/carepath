type Props = {
  message: string;
};

export function LoadingOverlay({ message }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[var(--background)]/90 backdrop-blur-sm">
      <span
        aria-hidden="true"
        className="h-12 w-12 animate-spin rounded-full border-2 border-[var(--accent)]/25 border-t-[var(--accent)]"
      />
      <p className="text-sm text-zinc-500" role="status">
        {message}
      </p>
    </div>
  );
}
