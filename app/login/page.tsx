"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  validateTeamIdFormat,
  verifyTeamLogin,
  saveTeamNameAndLogin,
  loginTeam,
} from "../firebase/team.controller";
import { IdCard, AlertTriangle, Zap, X, Users } from "lucide-react";

export default function LoginPage() {
  const [teamId, setTeamId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  // Team name modal state
  const [showModal, setShowModal] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamNameError, setTeamNameError] = useState("");
  const [savingName, setSavingName] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  const handleTeamIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only letters, auto-uppercase, max 5 chars
    const value = e.target.value
      .replace(/[^a-zA-Z]/g, "")
      .toUpperCase()
      .slice(0, 5);
    setTeamId(value);
    if (error) setError("");
  };

  const handleStartQuiz = async () => {
    // Client-side format validation
    const formatError = validateTeamIdFormat(teamId);
    if (formatError) {
      setError(formatError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await verifyTeamLogin(teamId);

      if (!result.success) {
        setError(result.message);
        setLoading(false);
        return;
      }

      if (result.needsTeamName) {
        // Show team name modal
        setShowModal(true);
        setLoading(false);
        return;
      }

      // Team already has a name → just login and redirect
      const loginResult = await loginTeam(teamId);
      if (!loginResult.success) {
        setError(loginResult.message);
        setLoading(false);
        return;
      }

      router.push(`/quiz?teamId=${teamId.trim().toUpperCase()}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleTeamNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9 ]/g, "");
    setTeamName(value);
    if (teamNameError) setTeamNameError("");
  };

  const handleSaveTeamName = async () => {
    const trimmed = teamName.trim();

    if (trimmed.length < 3) {
      setTeamNameError("Team name must be at least 3 characters.");
      return;
    }
    if (trimmed.length > 30) {
      setTeamNameError("Team name must be at most 30 characters.");
      return;
    }

    setSavingName(true);
    setTeamNameError("");

    try {
      const result = await saveTeamNameAndLogin(teamId, trimmed);

      if (!result.success) {
        setTeamNameError(result.message);
        setSavingName(false);
        return;
      }

      router.push(`/quiz?teamId=${teamId.trim().toUpperCase()}`);
    } catch {
      setTeamNameError("Something went wrong. Please try again.");
      setSavingName(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-4 noise-bg">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -left-1/4 w-[500px] h-[500px] bg-[#C6FF00]/8 rounded-full blur-[140px] animate-pulse-slow" />
        <div className="absolute bottom-1/3 -right-1/4 w-[400px] h-[400px] bg-[#C6FF00]/5 rounded-full blur-[120px] animate-pulse-slow animation-delay-2000" />
      </div>

      {/* Grid overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(198,255,0,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(198,255,0,.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <div
        className={`relative z-10 w-full max-w-md transition-all duration-700 ease-out ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Header */}
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

        {/* Login Card */}
        <div className="relative rounded-2xl border border-[#C6FF00]/15 bg-[rgba(20,20,30,0.8)] backdrop-blur-xl p-8 shadow-2xl shadow-[#C6FF00]/5">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#C6FF00]/[0.03] to-transparent pointer-events-none" />

          <div className="relative space-y-6">
            {/* Input */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#9aa0a6] mb-2">
                Team ID
              </label>
              <input
                type="text"
                value={teamId}
                onChange={handleTeamIdChange}
                placeholder="XXXXX"
                maxLength={5}
                autoFocus
                className={`w-full px-4 py-3.5 rounded-xl bg-[rgba(15,15,20,0.9)] border text-white placeholder-gray-600 text-sm font-mono tracking-[0.4em] text-center uppercase focus:outline-none transition-all duration-300 ${
                  error
                    ? "border-red-500/50 focus:border-red-400 focus:ring-1 focus:ring-red-400/30"
                    : "border-white/10 focus:border-[#C6FF00]/50 focus:ring-1 focus:ring-[#C6FF00]/20 focus:shadow-[0_0_15px_rgba(198,255,0,0.1)]"
                }`}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleStartQuiz()}
              />
              {/* Character count hint */}
              <div className="mt-1.5 flex justify-between items-center">
                <div>
                  {error && (
                    <p className="text-xs text-red-400 flex items-center gap-1.5 animate-fade-in">
                      <AlertTriangle className="w-3 h-3" />
                      {error}
                    </p>
                  )}
                </div>
                <span className={`text-xs font-mono ${teamId.length === 5 ? "text-[#C6FF00]/60" : "text-[#9aa0a6]/40"}`}>
                  {teamId.length}/5
                </span>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartQuiz}
              disabled={loading || teamId.length !== 5}
              className="w-full py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider bg-[#C6FF00] text-[#0a0a0f] shadow-lg shadow-[#C6FF00]/25 hover:shadow-[#C6FF00]/50 hover:brightness-110 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-[#C6FF00]/25 cursor-pointer"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Validating...
                </span>
              ) : (
                "Start Quiz"
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-[#9aa0a6]/40 text-xs tracking-wider">
          ENIGMA &copy; {new Date().getFullYear()} &middot; Power Card Challenge
        </p>
      </div>

      {/* ===== TEAM NAME MODAL ===== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fade-in">
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* Modal card */}
          <div className="relative w-full max-w-md animate-fade-in-up">
            <div className="relative rounded-2xl border border-[#C6FF00]/20 bg-[rgba(16,16,24,0.95)] backdrop-blur-xl p-8 shadow-2xl shadow-[#C6FF00]/10">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#C6FF00]/[0.04] to-transparent pointer-events-none" />

              {/* Close button */}
              <button
                onClick={() => {
                  setShowModal(false);
                  setTeamName("");
                  setTeamNameError("");
                }}
                className="absolute top-4 right-4 text-[#9aa0a6] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative">
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#C6FF00]/10 border border-[#C6FF00]/20 mb-4">
                    <Users className="w-6 h-6 text-[#C6FF00]" />
                  </div>
                  <h3 className="text-xl font-bold uppercase tracking-tight">
                    Enter Your Team Name
                  </h3>
                  <p className="text-[#9aa0a6] text-xs mt-1">
                    Team ID: <span className="text-[#C6FF00] font-mono">{teamId}</span>
                  </p>
                  <p className="text-[#9aa0a6]/60 text-xs mt-1">
                    This cannot be changed later.
                  </p>
                </div>

                {/* Team name input */}
                <div className="mb-6">
                  <label className="block text-xs uppercase tracking-widest text-[#9aa0a6] mb-2">
                    Team Name
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={handleTeamNameChange}
                    placeholder="Enter Team Name"
                    maxLength={30}
                    autoFocus
                    className={`w-full px-4 py-3.5 rounded-xl bg-[rgba(15,15,20,0.9)] border text-white placeholder-gray-600 text-sm focus:outline-none transition-all duration-300 ${
                      teamNameError
                        ? "border-red-500/50 focus:border-red-400 focus:ring-1 focus:ring-red-400/30"
                        : "border-white/10 focus:border-[#C6FF00]/50 focus:ring-1 focus:ring-[#C6FF00]/20 focus:shadow-[0_0_15px_rgba(198,255,0,0.1)]"
                    }`}
                    onKeyDown={(e) => e.key === "Enter" && !savingName && handleSaveTeamName()}
                  />
                  <div className="mt-1.5 flex justify-between items-center">
                    <div>
                      {teamNameError && (
                        <p className="text-xs text-red-400 flex items-center gap-1.5 animate-fade-in">
                          <AlertTriangle className="w-3 h-3" />
                          {teamNameError}
                        </p>
                      )}
                    </div>
                    <span className={`text-xs font-mono ${teamName.trim().length >= 3 ? "text-[#C6FF00]/60" : "text-[#9aa0a6]/40"}`}>
                      {teamName.trim().length}/30
                    </span>
                  </div>
                </div>

                {/* Confirm button */}
                <button
                  onClick={handleSaveTeamName}
                  disabled={savingName || teamName.trim().length < 3}
                  className="w-full py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider bg-[#C6FF00] text-[#0a0a0f] shadow-lg shadow-[#C6FF00]/25 hover:shadow-[#C6FF00]/50 hover:brightness-110 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
                >
                  {savingName ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    "Confirm & Start Quiz"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
