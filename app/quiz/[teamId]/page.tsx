"use client";
import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAllQuestions } from "@/app/firebase/question.controller";
import { finishQuiz, getTeamById } from "@/app/firebase/team.controller";
import { getAnswersByTeamId } from "@/app/firebase/answer.controller";
import QuestionCard from "../QuestionCard";

export default function Layout() {
  const params = useParams() as { teamId?: string };
  const teamId = params?.teamId;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<any | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(3600);
  const [warning, setWarning] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);

  // map of questionId -> selectedOptionIndex
  const [answersMap, setAnswersMap] = useState<Record<string, number>>({});
  // ref to avoid duplicate auto-submit calls
  const autoSubmittedRef = useRef(false);
  // tab switch tracking
  const tabSwitchCountRef = useRef(0);
  const [tabWarning, setTabWarning] = useState<string | null>(null);

  // fetch team -> validate -> fetch questions & answers
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

        const qs = Array.isArray(qRes.questions) ? qRes.questions : [];
        setQuestions(qs);

        // fetch existing answers and build map
        const aRes = await getAnswersByTeamId(teamId);
        if (mounted && aRes?.success && Array.isArray(aRes.answers)) {
          const map: Record<string, number> = {};
          for (const a of aRes.answers) {
            if (a.questionId && typeof a.selectedOptionIndex === "number") {
              map[a.questionId] = a.selectedOptionIndex;
            }
          }
          setAnswersMap(map);
        }

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
              if (next === 0 && !autoSubmittedRef.current) {
                autoSubmittedRef.current = true;
                if (iv) clearInterval(iv);
                (async () => {
                  setFinishing(true);
                  try {
                    const res = await finishQuiz(teamId, new Date());
                    if (res?.success) {
                      router.push("/leaderboard");
                    } else {
                      alert(res?.message || "Auto submit failed");
                    }
                  } catch (err) {
                    console.error("Auto submit failed:", err);
                  } finally {
                    setFinishing(false);
                  }
                })();
              }
              return next;
            });
          }, 1000);
        } else {
          setRemainingSeconds(TOTAL_SECONDS);
          iv = setInterval(() => {
            setRemainingSeconds((prev) => {
              const next = Math.max(0, prev - 1);
              if (next === 0 && !autoSubmittedRef.current) {
                autoSubmittedRef.current = true;
                if (iv) clearInterval(iv);
                (async () => {
                  setFinishing(true);
                  try {
                    const res = await finishQuiz(teamId, new Date());
                    if (res?.success) {
                      router.push("/leaderboard");
                    } else {
                      alert(res?.message || "Auto submit failed");
                    }
                  } catch (err) {
                    console.error("Auto submit failed:", err);
                  } finally {
                    setFinishing(false);
                  }
                })();
              }
              return next;
            });
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
  }, [teamId, router]);

  // prevent copy/contextmenu, detect tab switches and block devtools shortcuts
  useEffect(() => {
    if (!teamId) return;

    const onVisibilityChange = () => {
      if (document.hidden) {
        tabSwitchCountRef.current += 1;
        const count = tabSwitchCountRef.current;
        if (count < 3) {
          setTabWarning(`Warning: you switched tabs ${count} time(s). ${2 - (count - 1)} warning(s) left.`);
          // hide warning after 3s
          setTimeout(() => setTabWarning(null), 3000);
        } else {
          setTabWarning('You switched tabs 3 times — auto submitting quiz.');
          if (!autoSubmittedRef.current) {
            autoSubmittedRef.current = true;
            (async () => {
              setFinishing(true);
              try {
                const res = await finishQuiz(teamId, new Date());
                if (res?.success) {
                  router.push('/leaderboard');
                } else {
                  alert(res?.message || 'Auto submit failed');
                }
              } catch (err) {
                console.error('Auto submit failed:', err);
              } finally {
                setFinishing(false);
              }
            })();
          }
        }
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key;
      // block F12, Ctrl+Shift+I/J/C/K, Ctrl+U, Ctrl+Shift+K, Cmd+Opt+I (mac)
      const isDevCombo =
        k === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'J', 'C', 'K'].includes(k.toUpperCase())) ||
        ((e.ctrlKey || e.metaKey) && k.toUpperCase() === 'U');

      if (isDevCombo) {
        e.preventDefault();
        e.stopPropagation();
        // small user-facing message
        setTabWarning('Opening developer tools is disabled on this page.');
        setTimeout(() => setTabWarning(null), 2000);
        return false;
      }
      return true;
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, [teamId, router]);

  const formatTime = (secs: number) => {
    const mm = String(Math.floor(secs / 60)).padStart(2, "0");
    const ss = String(secs % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const handleEndQuiz = async () => {
    if (!teamId || finishing) return;
    setFinishing(true);
    try {
      const res = await finishQuiz(teamId, new Date());
      if (res?.success) {
        router.push("/leaderboard");
      } else {
        alert(res?.message || "Failed to finish quiz");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to finish quiz");
    } finally {
      setFinishing(false);
    }
  };

  // called from QuestionCard after successful createAnswer
  const handleAnswered = (questionId: string, index: number) => {
    setAnswersMap((prev) => ({ ...prev, [questionId]: index }));
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
  const currentQid = current?.id ?? current?.firebaseId;

  return (
    <div
      className="min-h-screen bg-[#0a0a0f] text-white flex items-start justify-center px-4 py-10 noise-bg"
      onCopy={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {tabWarning && (
        <div className="fixed inset-0 flex items-start justify-center pt-20 z-50 pointer-events-none">
          <div className="bg-yellow-500 text-black px-4 py-2 rounded shadow">{tabWarning}</div>
        </div>
      )}
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-sm text-[#9aa0a6]">Team Members</div>
            <div className="text-xl font-bold text-[#C6FF00]">{team?.teamName || teamId}</div>
            <div className="text-sm text-[#9aa0a6]">Team</div>
            <div>
              {team.teamMembers &&
                team.teamMembers.map((member: { name?: string; email?: string }, index: number) => (
                  <div key={index}>
                    <h1>{member.name}</h1>
                    <h1>{member.email}</h1>
                  </div>
                ))}
            </div>
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

          <QuestionCard
            question={current}
            teamId={teamId}
            selectedIndex={currentQid ? answersMap[currentQid] ?? null : null}
            onAnswered={(index) => currentQid && handleAnswered(currentQid, index)}
          />

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
            {/* End Quiz button */}
            <button
              onClick={handleEndQuiz}
              disabled={finishing}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {finishing ? "Ending..." : "End Quiz"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}