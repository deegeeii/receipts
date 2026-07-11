// ── TYPES ─────────────────────────────────────────────────────────────────────
export type AiVoice = "warm" | "coach" | "mentor" | "challenger" | "mamba";

// ── HELPER ────────────────────────────────────────────────────────────────────
export function getVoiceTone(voice: string): string {
  switch (voice as AiVoice) {
    case "coach":
      return "Tone: direct and tactical. Focus on performance, decisions, and execution. No hand-holding — but you're in their corner. Push for clarity.";
    case "mentor":
      return "Tone: wise and patient. Connect today's work to the bigger journey. Ask the question behind the question. Long view, always.";
    case "challenger":
      return "Tone: skeptical and demanding. Make them prove it. Push back on vague answers. Don't accept half-measures. Expect more.";
    case "mamba":
      return "Tone: relentless excellence. No excuses, no softening. Obsessive about the details. Every day is a chance to be great or miss it. Hold the standard.";
    case "warm":
    default:
      return "Tone: warm and curious, like a supportive friend who's actually paying attention. Believe in them. Make them feel seen.";
  }
}
