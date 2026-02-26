"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Zap, Clock, HelpCircle } from "lucide-react";

function QuizContent() {
  const searchParams = useSearchParams();
  const teamId = searchParams.get("teamId") || "—";

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-4 noise-bg">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -left-1/4 w-[500px] h-[500px] bg-[#C6FF00]/8 rounded-full blur-[140px] animate-pulse-slow" />
        <div className="absolute bottom-1/3 -right-1/4 w-[400px] h-[400px] bg-[#C6FF00]/5 rounded-full blur-[120px] animate-pulse-slow animation-delay-2000" />
      </div>

      {/* Grid overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(198,255,0,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(198,255,0,.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl text-center">
        {/* Header */}
        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mb-2 animate-title-glow text-white">
          ENIGMA
        </h1>
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-10 rounded-full border border-[#C6FF00]/20 bg-[#C6FF00]/5 text-[#C6FF00] text-xs uppercase tracking-widest">
          <Zap className="w-3 h-3" />
          Quiz Arena
        </div>

        {/* Quiz card */}
        <div className="relative rounded-2xl border border-[#C6FF00]/15 bg-[rgba(20,20,30,0.8)] backdrop-blur-xl p-10 shadow-2xl shadow-[#C6FF00]/5">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#C6FF00]/[0.03] to-transparent pointer-events-none" />

          <div className="relative space-y-8">
            {/* Team info bar */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#9aa0a6]">
                Team: <span className="text-[#C6FF00] font-mono font-bold">{teamId}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-[#9aa0a6]">
                <Clock className="w-3.5 h-3.5" />
                00:00
              </span>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#C6FF00]/15 to-transparent" />

            {/* Dummy question */}
            <div className="text-left space-y-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#C6FF00]/10 border border-[#C6FF00]/20 flex items-center justify-center text-[#C6FF00] text-sm font-bold">
                  1
                </div>
                <div>
                  <span className="text-xs text-[#9aa0a6] uppercase tracking-widest">Question 1 of 10</span>
                  <h2 className="text-lg sm:text-xl font-semibold mt-1 flex items-start gap-2">
                    <HelpCircle className="w-5 h-5 text-[#C6FF00]/50 mt-0.5 flex-shrink-0" />
                    This is a dummy quiz page. The real questions will appear here.
                  </h2>
                </div>
              </div>

              {/* Dummy options */}
              <div className="space-y-3 pl-11">
                {["Option A — Placeholder", "Option B — Placeholder", "Option C — Placeholder", "Option D — Placeholder"].map(
                  (opt, i) => (
                    <button
                      key={i}
                      className="w-full text-left px-5 py-3.5 rounded-xl border border-white/10 bg-white/[0.02] hover:border-[#C6FF00]/30 hover:bg-[#C6FF00]/5 transition-all duration-200 text-sm text-[#cccccc] cursor-pointer"
                    >
                      <span className="text-[#C6FF00]/60 font-mono mr-3">
                        {String.fromCharCode(65 + i)}.
                      </span>
                      {opt}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#C6FF00]/15 to-transparent" />

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button className="px-5 py-2.5 rounded-xl text-sm font-semibold uppercase tracking-wider border border-white/10 text-[#9aa0a6] hover:border-[#C6FF00]/30 hover:text-white transition-all duration-300 cursor-pointer">
                Previous
              </button>
              <span className="text-xs text-[#9aa0a6] font-mono">1 / 10</span>
              <button className="px-5 py-2.5 rounded-xl text-sm font-semibold uppercase tracking-wider bg-[#C6FF00] text-[#0a0a0f] shadow-lg shadow-[#C6FF00]/25 hover:shadow-[#C6FF00]/50 hover:brightness-110 transition-all duration-300 cursor-pointer">
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-[#9aa0a6]/40 text-xs tracking-wider">
          ENIGMA &copy; {new Date().getFullYear()} &middot; Power Card Challenge
        </p>
      </div>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-[#C6FF00] border-t-transparent rounded-full" />
      </div>
    }>
      <QuizContent />
    </Suspense>
  );
}
