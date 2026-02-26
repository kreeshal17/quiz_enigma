"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getAllQuestions } from "@/app/firebase/question.controller";
import { getTeamById } from "@/app/firebase/team.controller";
import QuestionCard from "../QuestionCard";

export default function Layout() {
  const params = useParams() as { teamId?: string };
  const teamId = params?.teamId;

  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<any | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(3600);
  const [warning, setWarning] = useState<string | null>(null);

  // fetch team -> validate -> fetch questions
  useEffect(() => {
    if (!teamId) return;
    let mounted = true;
    let iv: ReturnType<typeof setInterval> | null = null;

    (async () => {
      setLoading(true);
      setWarning(null);
      try {
        const tRes = await getTeamById(teamId);
        if (!mounted) return;

        if (!tRes?.success || !tRes.team) {
          setWarning("Team not found.");
          setLoading(false);
          return;
        }

        const t = tRes.team;
        const isStarted = Boolean(t.isStarted);
        const isCompleted = Boolean(t.isCompleted);

        if (!isStarted) {
          setWarning("Quiz has not been started for this team.");
          setLoading(false);
          setTeam(t);
          return;
        }

        if (isCompleted) {
          setWarning("Quiz is already completed for this team.");
          setLoading(false);
          setTeam(t);
          return;
        }

        setTeam(t);

        const qRes = await getAllQuestions(teamId);
        if (!mounted) return;

        if (!qRes?.success) {
          setWarning(qRes?.message || "Failed to fetch questions.");
          setLoading(false);
          return;
        }

        setQuestions(Array.isArray(qRes.questions) ? qRes.questions : []);
        setLoading(false);

        // compute remaining time (1 hour total)
        const startRaw = t.start_time;
        const startDate =
          startRaw instanceof Date
            ? startRaw
            : startRaw && typeof startRaw.toDate === "function"
              ? startRaw.toDate()
              : startRaw
                ? new Date(startRaw)
                : null;

        const TOTAL_SECONDS = 3600;
        if (startDate) {
          const endTime = startDate.getTime() + TOTAL_SECONDS * 1000;
          const initialRemaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
          setRemainingSeconds(initialRemaining);

          iv = setInterval(() => {
            setRemainingSeconds((prev) => {
              const next = Math.max(0, prev - 1);
              return next;
            });
          }, 1000);
        } else {
          // if no start time, show full hour
          setRemainingSeconds(TOTAL_SECONDS);
          iv = setInterval(() => {
            setRemainingSeconds((prev) => Math.max(0, prev - 1));
          }, 1000);
        }
      } catch (err) {
        console.error(err);
        setWarning("Unexpected error while loading quiz.");
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      if (iv) clearInterval(iv);
    };
  }, [teamId]);

  const formatTime = (secs: number) => {
    const mm = String(Math.floor(secs / 60)).padStart(2, "0");
    const ss = String(secs % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  if (!teamId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-[#0a0a0f]">
        <div className="text-center">Missing team id in url.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-[#0a0a0f]">
        <div className="animate-spin h-8 w-8 border-2 border-[#C6FF00] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (warning) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-[#0a0a0f] p-6">
        <div className="max-w-lg text-center rounded-lg border border-yellow-400/20 bg-yellow-900/10 p-8">
          <h2 className="text-2xl font-bold text-yellow-300 mb-2">Warning</h2>
          <p className="text-yellow-200">{warning}</p>
        </div>
      </div>
    );
  }

  const current = questions[currentIndex];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex items-start justify-center px-4 py-10 noise-bg">
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-sm text-[#9aa0a6]">Team Members</div>
            <div className="text-xl font-bold text-[#C6FF00]">{team?.teamName || teamId}</div>
            <div className="text-sm text-[#9aa0a6]">Team</div>
            <div>{
              team.teamMembers && team.teamMembers.map((member: any, index: number) => <div key={index}>
                <h1>{member.name}</h1>
                <h1>{member.email}</h1>
              </div>)
            }</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-[#9aa0a6]">Time Left</div>
            <div className="text-lg font-mono font-bold">{formatTime(remainingSeconds)}</div>
          </div>
        </div>

        <div className="relative rounded-2xl border border-[#C6FF00]/15 bg-[rgba(20,20,30,0.8)] p-8">
          <div className="mb-4 text-sm text-[#9aa0a6]">
            Question {currentIndex + 1} / {questions.length}
          </div>

          <QuestionCard question={current} />

          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              className="px-4 py-2 rounded-xl border border-white/10 text-sm"
              disabled={currentIndex === 0}
            >
              Previous
            </button>

            <div className="text-sm text-[#9aa0a6]">{/* placeholder */}</div>

            <button
              onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
              className="px-4 py-2 rounded-xl bg-[#C6FF00] text-[#0a0a0f] text-sm"
              disabled={currentIndex >= questions.length - 1}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}