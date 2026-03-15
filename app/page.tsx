"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
import MysteryRevealCard from "@/components/MysteryRevealCard";

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
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Image
            src="/enigma.avif"
            alt="Enigma background"
            fill
            priority
            className="object-cover object-center opacity-35 scale-105"
          />
        </div>

        {/* Animated background gradients */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#140304] via-[#090303] to-[#020202]" />
          <div className="absolute inset-0 stage-curtain-overlay" />
          <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-[#7a0f19]/20 rounded-full blur-[140px] animate-pulse-slow" />
          <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-[#5e0d15]/20 rounded-full blur-[120px] animate-pulse-slow animation-delay-2000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#8b121f]/20 rounded-full blur-[100px] animate-pulse-slow animation-delay-4000" />
        </div>

        {/* Floating particle lights */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <span className="particle-light left-[10%] top-[20%] animation-delay-2000" />
          <span className="particle-light left-[22%] top-[65%]" />
          <span className="particle-light left-[48%] top-[30%] animation-delay-4000" />
          <span className="particle-light left-[64%] top-[72%] animation-delay-2000" />
          <span className="particle-light left-[82%] top-[40%]" />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,80,80,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,80,80,.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

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

          <p className="text-sm sm:text-base md:text-lg tracking-wider text-red-100/90 mb-2">
            The Blinddate - Who's gonna be your tech partner?
          </p>

          <MysteryRevealCard />

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
            className="group inline-flex flex-col items-center gap-2 text-[#b8a0a4] hover:text-[#ff7b7b] transition-all duration-300 mystery-button-glow rounded-xl px-4 py-2"
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
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Image
            src="/enigma.avif"
            alt="Enigma rules background"
            fill
            className="object-cover object-center opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#090909]/85 via-[#120506]/82 to-[#090909]/90" />
          <div className="absolute inset-0 stage-curtain-overlay opacity-60" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto">
          {/* Section heading */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full border border-[#ff8a96]/30 bg-[#7a0f19]/20 text-[#ff9da7] text-xs uppercase tracking-widest">
              <Shield className="w-3.5 h-3.5" />
              Mandatory
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight uppercase mb-2 text-[#ffd6db]">
              Competition Rules
            </h2>
            <p className="text-[#c4a6aa] text-sm">& Fair Play Policy</p>
          </div>

          {/* Rules Card */}
          <div className="relative rounded-2xl border border-[#ff8a96]/20 bg-[rgba(26,10,12,0.78)] backdrop-blur-xl p-8 shadow-2xl shadow-[#7a0f19]/20">
            {/* Glass highlight */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#ff8a96]/[0.07] to-transparent pointer-events-none" />

            <div className="relative space-y-4">
              {rules.map((rule, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-[#ff8a96]/10 transition-colors duration-200"
                >
                  <div className="flex-shrink-0 mt-0.5 text-[#ff8a96]/80">{rule.icon}</div>
                  <p className="text-[#f2d7db] text-sm sm:text-base leading-relaxed">{rule.text}</p>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="my-8 h-px bg-gradient-to-r from-transparent via-[#ff8a96]/30 to-transparent" />

            {/* Checkbox */}
            <label className="flex items-center gap-3 cursor-pointer group select-none">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 rounded border-2 border-white/20 peer-checked:border-[#ff8a96] peer-checked:bg-[#ff8a96] transition-all duration-300 flex items-center justify-center peer-checked:shadow-[0_0_10px_rgba(255,138,150,0.45)]">
                  {agreedToTerms && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0a0a0f] animate-check-pop" />
                  )}
                </div>
              </div>
              <span className="text-sm text-[#c4a6aa] group-hover:text-[#f2d7db] transition-colors">
                I have read and agree to the <span className="text-[#ff9da7]">Terms & Conditions</span>
              </span>
            </label>

            {/* Proceed Button */}
            <button
              onClick={handleProceedToLogin}
              disabled={!agreedToTerms}
              className={`mt-6 w-full py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-500 mystery-button-glow ${
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
