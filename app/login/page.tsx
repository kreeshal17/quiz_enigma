"use client";

import React, { useState } from "react";
import { IdCard, Zap } from "lucide-react";
import { startQuiz } from "../firebase/team.controller";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LoginPage() {
  const [teamId, setTeamId] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const visible = true;

  const handleStart = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const id = teamId.trim();
    if (!id) {
      alert("Please enter a Team ID");
      return;
    }

    try {
      setLoading(true);
      const res = await startQuiz(id, new Date());
      if (res?.success) {
        // Quiz started successfully
        sessionStorage.setItem("teamId", id);
        router.push(`/quiz/${id}`);
      } else if (res?.message?.includes("already started")) {
        // Quiz was already started (e.g. by admin), proceed to quiz
        sessionStorage.setItem("teamId", id);
        router.push(`/quiz/${id}`);
      } else {
        toast.error(res?.message || "Failed to start quiz");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to start quiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-4 noise-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -left-1/4 w-[500px] h-[500px] bg-[#C6FF00]/8 rounded-full blur-[140px] animate-pulse-slow" />
        <div className="absolute bottom-1/3 -right-1/4 w-[400px] h-[400px] bg-[#C6FF00]/5 rounded-full blur-[120px] animate-pulse-slow animation-delay-2000" />
      </div>

      <div className="fixed inset-0 bg-[linear-gradient(rgba(198,255,0,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(198,255,0,.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <div
        className={`relative z-10 w-full max-w-md transition-all duration-700 ease-out ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mb-2 animate-title-glow text-white">
            ENIGMA
          </h1>
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-[#C6FF00]/20 bg-[#C6FF00]/5 text-[#C6FF00] text-xs uppercase tracking-widest">
            <Zap className="w-3 h-3" />
            Interdepartmental Competition
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <IdCard className="w-5 h-5 text-[#C6FF00]" />
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight uppercase">
              Team Login
            </h2>
          </div>
          <p className="text-[#9aa0a6] text-sm">Enter your Team ID to begin the challenge</p>
        </div>

        <form onSubmit={handleStart} className="relative rounded-2xl border border-[#C6FF00]/15 bg-[rgba(20,20,30,0.8)] backdrop-blur-xl p-8 shadow-2xl shadow-[#C6FF00]/5">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#C6FF00]/[0.03] to-transparent pointer-events-none" />

          <div className="relative space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#9aa0a6] mb-2">
                Team ID
              </label>
              <input
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                type="text"
                placeholder="XXXXX"
                autoFocus
                className="w-full px-4 py-3.5 rounded-xl bg-[rgba(15,15,20,0.9)] border text-white placeholder-gray-600 text-sm font-mono tracking-[0.4em] text-center focus:outline-none transition-all duration-300 border-white/10 focus:border-[#C6FF00]/50 focus:ring-1 focus:ring-[#C6FF00]/20 focus:shadow-[0_0_15px_rgba(198,255,0,0.1)]"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !teamId.trim()}
              className="w-full py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider bg-[#C6FF00] text-[#0a0a0f] shadow-lg shadow-[#C6FF00]/25 hover:shadow-[#C6FF00]/50 hover:brightness-110 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Starting..." : "Start Quiz"}
            </button>
          </div>
        </form>

        <p className="mt-8 text-center text-[#9aa0a6]/40 text-xs tracking-wider">
          ENIGMA &copy; {new Date().getFullYear()} &middot; Power Card Challenge
        </p>
      </div>
    </div>
  );
}