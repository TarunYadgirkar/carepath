export { hasEmergencyIndicator as hasEmergencyPhrase } from "@/lib/emergency-keywords";

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
