type Props = {
  message: string;
};

export function LoadingOverlay({ message }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 backdrop-blur-sm"
      style={{ background: "color-mix(in srgb, var(--background) 92%, transparent)" }}
    >
      <div className="flex flex-col items-center gap-5">
        <div className="relative flex h-16 w-16 items-center justify-center" aria-hidden="true">
          <span
            className="absolute inset-0 animate-spin rounded-full border-2"
            style={{
              borderColor: "color-mix(in srgb, var(--accent) 20%, transparent)",
              borderTopColor: "var(--accent)",
            }}
          />
          <span
            className="h-8 w-8 rounded-full"
            style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)" }}
          />
        </div>
        <div className="flex flex-col items-center gap-1.5 text-center">
          <p
            className="text-sm font-medium"
            role="status"
            style={{ color: "var(--text-primary)" }}
          >
            {message}
          </p>
          <p className="text-xs" style={{ color: "var(--text-subtle)" }}>
            This usually takes a few seconds
          </p>
        </div>
      </div>
    </div>
  );
}
