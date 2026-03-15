import React from "react";

export default function MysteryRevealCard() {
  return (
    <div className="relative mx-auto mt-4 mb-10 w-full max-w-md h-48 sm:h-56">
      <div className="absolute left-4 sm:left-8 top-14 w-24 h-28 sm:w-28 sm:h-32 rounded-full bg-white/8 blur-xl silhouette-left" />
      <div className="absolute right-4 sm:right-8 top-14 w-24 h-28 sm:w-28 sm:h-32 rounded-full bg-white/8 blur-xl silhouette-right" />

      <div className="absolute inset-x-8 sm:inset-x-12 top-10 h-28 sm:h-32 rounded-3xl border border-red-300/20 bg-gradient-to-b from-red-200/10 via-red-500/5 to-black/40 backdrop-blur-md shadow-2xl mystery-card-glow flex items-center justify-center">
        <div className="text-6xl sm:text-7xl font-black text-red-100/90 select-none leading-none">?</div>
      </div>
    </div>
  );
}
