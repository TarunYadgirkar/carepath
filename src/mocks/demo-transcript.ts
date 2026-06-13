// src/mocks/demo-transcript.ts
// Preloaded Maya Patel demo transcript for fallback demo mode.
// Use this to bypass Grok Voice if the live voice pipeline has issues during demo.
// This transcript is fed directly to /api/classify as if it came from a live conversation.

export const DEMO_TRANSCRIPT = `
Patient: I've had a fever for three days, my throat is really sore, and I can barely swallow. I'm on a Silver PPO plan and I have around 420 dollars left on my deductible. I take lisinopril and I took ibuprofen today.

CarePath: Are you having any trouble breathing, chest pain, confusion, or signs of severe dehydration like feeling very dizzy or unable to drink anything?

Patient: No trouble breathing or chest pain. I can drink water, but swallowing hurts a lot. I haven't had much of an appetite since yesterday.

CarePath: How high has your fever been, and have you taken your temperature recently?

Patient: It was 101.8 this morning. It went down a little with ibuprofen but comes back.

CarePath: Got it. Any known allergies to medications? And is there anything else you're taking besides lisinopril?

Patient: No allergies that I know of. Just the lisinopril 10 milligrams every morning. That's it.
`.trim();

// Patient profile derived from the transcript — used to pre-populate the Care Card display
export const DEMO_PATIENT_PROFILE = {
  name: "Maya Patel",
  insurancePlan: "BlueShield Silver PPO",
  deductibleRemaining: 420,
};
