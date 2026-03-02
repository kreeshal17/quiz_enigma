"use client";

import { CheckCircle } from "lucide-react";

export default function SubmittedPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-4 noise-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -left-1/4 w-[500px] h-[500px] bg-[#C6FF00]/8 rounded-full blur-[140px] animate-pulse-slow" />
        <div className="absolute bottom-1/3 -right-1/4 w-[400px] h-[400px] bg-[#C6FF00]/5 rounded-full blur-[120px] animate-pulse-slow" />
      </div>

      <div className="relative z-10 text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-[#C6FF00]/10 border-2 border-[#C6FF00]/30 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-[#C6FF00]" />
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3 text-white">
          Quiz Submitted!
        </h1>

        <p className="text-[#9aa0a6] text-sm mb-8 leading-relaxed">
          Your answers have been recorded successfully. <br />
          Thank you for participating in the ENIGMA challenge!
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#C6FF00]/20 bg-[#C6FF00]/5 text-[#C6FF00] text-xs uppercase tracking-widest">
          Results will be announced soon
        </div>

        <p className="mt-6 text-yellow-400/80 text-sm font-medium leading-relaxed">
          Please wait until the results are out for Round 2. <br />
          Qualified teams will be notified to proceed.
        </p>

        <p className="mt-10 text-[#9aa0a6]/40 text-xs tracking-wider">
          ENIGMA &copy; {new Date().getFullYear()} &middot; Power Card Challenge
        </p>
      </div>
    </div>
  );
}
