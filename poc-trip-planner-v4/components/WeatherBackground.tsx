"use client";

import { motion } from "framer-motion";

export type WeatherMood = "calm" | "sunny" | "rain" | "cold" | "storm";

const GRADIENTS: Record<WeatherMood, string> = {
  calm: "from-indigo-500/15 via-sky-500/10 to-emerald-500/15",
  sunny: "from-amber-400/25 via-orange-500/15 to-rose-500/15",
  rain: "from-slate-600/30 via-blue-700/25 to-cyan-500/15",
  cold: "from-cyan-400/25 via-sky-500/20 to-indigo-500/20",
  storm: "from-slate-800/40 via-purple-700/25 to-slate-900/30",
};

export default function WeatherBackground({ mood = "calm" }: { mood?: WeatherMood }) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        key={mood}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4 }}
        className={`absolute inset-0 bg-gradient-to-br ${GRADIENTS[mood]}`}
      />
      <div className="absolute -top-40 -left-40 h-[40rem] w-[40rem] animate-drift rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-[36rem] w-[36rem] animate-drift rounded-full bg-rose-500/10 blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />
    </div>
  );
}

export function moodFromTemp(tempC: number | null | undefined, precip: number | null | undefined): WeatherMood {
  if (precip != null && precip > 1) return "rain";
  if (tempC == null) return "calm";
  if (tempC <= 5) return "cold";
  if (tempC >= 26) return "sunny";
  return "calm";
}
