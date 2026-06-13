import Link from "next/link";
import { SafetyDisclaimer } from "@/components/SafetyDisclaimer";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <h1 className="text-4xl font-semibold">CarePath</h1>
      <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        Tell it what&apos;s wrong. It tells you where to go, what it may cost, and what to
        bring.
      </p>
      <Link
        href="/intake"
        className="rounded-full bg-foreground px-6 py-3 font-medium text-background"
      >
        Start
      </Link>
      <SafetyDisclaimer />
    </main>
  );
}
