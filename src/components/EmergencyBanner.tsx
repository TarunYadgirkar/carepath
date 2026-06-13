const EMERGENCY_PHRASES = [
  "chest pain",
  "can't breathe",
  "cannot breathe",
  "not breathing",
  "unconscious",
  "not responding",
  "severe bleeding",
  "stroke",
  "heart attack",
];

export function hasEmergencyPhrase(transcript: string): boolean {
  const lower = transcript.toLowerCase();
  return EMERGENCY_PHRASES.some((phrase) => lower.includes(phrase));
}

export function EmergencyBanner({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div
      role="alert"
      className="w-full max-w-xl rounded-xl bg-red-600 px-4 py-3 text-center text-sm font-semibold text-white"
    >
      ⚠️ If this is a medical emergency, call 911 immediately. Do not wait.
    </div>
  );
}
