import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-sm text-zinc-500">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="rounded-full bg-foreground px-6 py-3 font-medium text-background"
      >
        Back to Home
      </Link>
    </main>
  );
}
