"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  ChevronDown,
  Zap,
  AlertTriangle,
  Monitor,
  Copy,
  Code,
  Users,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const router = useRouter();

  const rulesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => setHeroVisible(true), 100);
  }, []);

  const scrollToRules = () => {
    rulesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleProceedToLogin = () => {
    if (!agreedToTerms) return;
    router.push("/login");
  };

  const rules = [
    { icon: <Monitor className="w-5 h-5" />, text: "Full-screen mode is mandatory during the quiz." },
    { icon: <AlertTriangle className="w-5 h-5" />, text: "Tab switching will be monitored." },
    { icon: <Copy className="w-5 h-5" />, text: "Copy–Paste is disabled." },
    { icon: <Code className="w-5 h-5" />, text: "Developer tools are restricted." },
    { icon: <Shield className="w-5 h-5" />, text: "Any malpractice may result in disqualification." },
    { icon: <Zap className="w-5 h-5" />, text: "Power Cards will be distributed manually during the event." },
    { icon: <Users className="w-5 h-5" />, text: "Team ID must be used only by assigned team members." },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden noise-bg">
      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4">
        {/* Animated background gradients */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-[#C6FF00]/10 rounded-full blur-[140px] animate-pulse-slow" />
          <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-[#C6FF00]/5 rounded-full blur-[120px] animate-pulse-slow animation-delay-2000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#C6FF00]/8 rounded-full blur-[100px] animate-pulse-slow animation-delay-4000" />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(198,255,0,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(198,255,0,.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div
          className={`relative z-10 text-center transition-all duration-1000 ease-out ${
            heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-[#C6FF00]/20 bg-[#C6FF00]/5 backdrop-blur-sm text-sm text-[#C6FF00]/80">
            <Zap className="w-3.5 h-3.5 text-[#C6FF00]" />
            Interdepartmental Competition
          </div>

          {/* Main Title */}
          <h1 className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter leading-none mb-4">
            <span className="text-white animate-title-glow">
              ENIGMA
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl md:text-2xl font-bold tracking-[0.3em] uppercase text-[#cccccc] mb-3">
            Power Card Challenge
          </p>

          {/* Tagline */}
          <p className="text-sm sm:text-base tracking-widest text-[#C6FF00]/80 font-mono mb-12">
            Compete &middot; Strategize &middot; Dominate
          </p>

          {/* Scroll CTA */}
          <button
            onClick={scrollToRules}
            className="group inline-flex flex-col items-center gap-2 text-[#9aa0a6] hover:text-[#C6FF00] transition-colors duration-300"
          >
            <span className="text-xs uppercase tracking-widest">Enter the Arena</span>
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </button>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
      </section>

      {/* ===== RULES SECTION ===== */}
      <section ref={rulesRef} className="relative py-24 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Section heading */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full border border-[#C6FF00]/20 bg-[#C6FF00]/5 text-[#C6FF00] text-xs uppercase tracking-widest">
              <Shield className="w-3.5 h-3.5" />
              Mandatory
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight uppercase mb-2">
              Competition Rules
            </h2>
            <p className="text-[#9aa0a6] text-sm">& Fair Play Policy</p>
          </div>

          {/* Rules Card */}
          <div className="relative rounded-2xl border border-[#C6FF00]/15 bg-[rgba(20,20,30,0.8)] backdrop-blur-xl p-8 shadow-2xl shadow-[#C6FF00]/5">
            {/* Glass highlight */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#C6FF00]/[0.03] to-transparent pointer-events-none" />

            <div className="relative space-y-4">
              {rules.map((rule, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-[#C6FF00]/5 transition-colors duration-200"
                >
                  <div className="flex-shrink-0 mt-0.5 text-[#C6FF00]/70">{rule.icon}</div>
                  <p className="text-[#cccccc] text-sm sm:text-base leading-relaxed">{rule.text}</p>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="my-8 h-px bg-gradient-to-r from-transparent via-[#C6FF00]/15 to-transparent" />

            {/* Checkbox */}
            <label className="flex items-center gap-3 cursor-pointer group select-none">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 rounded border-2 border-white/20 peer-checked:border-[#C6FF00] peer-checked:bg-[#C6FF00] transition-all duration-300 flex items-center justify-center peer-checked:shadow-[0_0_10px_rgba(198,255,0,0.4)]">
                  {agreedToTerms && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0a0a0f] animate-check-pop" />
                  )}
                </div>
              </div>
              <span className="text-sm text-[#9aa0a6] group-hover:text-[#cccccc] transition-colors">
                I have read and agree to the <span className="text-[#C6FF00]">Terms & Conditions</span>
              </span>
            </label>

            {/* Proceed Button */}
            <button
              onClick={handleProceedToLogin}
              disabled={!agreedToTerms}
              className={`mt-6 w-full py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-500 ${
                agreedToTerms
                  ? "bg-[#C6FF00] text-[#0a0a0f] shadow-lg shadow-[#C6FF00]/25 hover:shadow-[#C6FF00]/50 hover:brightness-110 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  : "bg-white/5 text-gray-600 cursor-not-allowed border border-white/5"
              }`}
            >
              Proceed to Login
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-[#9aa0a6]/50 text-xs tracking-wider border-t border-[#C6FF00]/5">
        ENIGMA &copy; {new Date().getFullYear()} &middot; Power Card Challenge
      </footer>
    </div>
  );
}
