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

  // mark for later
  const [markedQuestions, setMarkedQuestions] = useState<Set<string>>(new Set());
  const [showSubmitWarning, setShowSubmitWarning] = useState(false);

  const toggleMark = (qid: string) => {
    setMarkedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qid)) next.delete(qid);
      else next.add(qid);
      return next;
    });
  };

  const attemptSubmit = () => {
    if (markedQuestions.size > 0) {
      setShowSubmitWarning(true);
    } else {
      handleEndQuiz();
    }
  };

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
                      router.push("/submitted");
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
                      router.push("/submitted");
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
                  router.push('/submitted');
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
        router.push("/submitted");
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ backgroundColor: '#1a1a2e', border: '1px solid rgba(234,179,8,0.4)', borderRadius: '1rem', boxShadow: '0 0 40px rgba(234,179,8,0.1)', padding: '2rem', maxWidth: '24rem', width: '100%', margin: '0 1rem', textAlign: 'center', animation: 'scaleIn 0.25s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', backgroundColor: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#facc15', fontSize: '1.5rem' }}>⚠</span>
              </div>
            </div>
            <h3 style={{ color: '#facc15', fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.25rem' }}>Warning</h3>
            <p style={{ color: '#d4d4d4', fontSize: '0.875rem', lineHeight: '1.6' }}>{tabWarning}</p>
          </div>
        </div>
      )}
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xl font-bold text-[#C6FF00] mb-2">{team?.teamName || teamId}</div>
            <div className="flex flex-wrap gap-2">
              {team.teamMembers &&
                team.teamMembers.map((member: { name?: string; email?: string }, index: number) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C6FF00]/5 border border-[#C6FF00]/20 shadow-[0_0_8px_rgba(198,255,0,0.06)]"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#C6FF00]/15 border border-[#C6FF00]/30 flex items-center justify-center text-[#C6FF00] text-xs font-bold shrink-0">
                      {member.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <span className="text-sm text-neutral-300 font-medium">{member.name}</span>
                  </div>
                ))}
            </div>
          </div>
          <div className="text-right shrink-0 ml-4">
            <div className="text-xs text-[#9aa0a6] uppercase tracking-widest mb-1">Time Left</div>
            <div className="text-2xl font-mono font-black text-white tabular-nums">{formatTime(remainingSeconds)}</div>
          </div>
        </div>

        {/* Question Map Panel */}
        <div className="mb-5 rounded-2xl border border-white/[0.06] bg-[rgba(18,18,28,0.7)] px-5 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {questions.map((q, i) => {
              const qid = q?.id ?? q?.firebaseId;
              const isAnswered = qid && answersMap[qid] !== undefined;
              const isMarked = qid && markedQuestions.has(qid);
              const isCurrent = i === currentIndex;

              let boxBg = 'bg-[#1a1a24]';
              let boxBorder = 'border-white/10';
              let boxText = 'text-neutral-500';
              let boxShadow = '';
              let bookmarkIcon = false;

              if (isAnswered) {
                boxBg = 'bg-[#C6FF00]';
                boxBorder = 'border-[#C6FF00]';
                boxText = 'text-[#0a0a0f]';
              }
              if (isMarked) {
                boxBg = isAnswered ? 'bg-[#C6FF00]' : 'bg-[#FACC15]/15';
                boxBorder = 'border-[#FACC15]/60';
                boxText = isAnswered ? 'text-[#0a0a0f]' : 'text-[#FACC15]';
                bookmarkIcon = true;
              }
              if (isCurrent) {
                boxShadow = 'shadow-[0_0_12px_rgba(198,255,0,0.3)] ring-2 ring-[#C6FF00]/50';
              }

              return (
                <button
                  key={qid || i}
                  onClick={() => setCurrentIndex(i)}
                  className={`relative flex-shrink-0 w-11 h-11 rounded-lg border-[1.5px] flex items-center justify-center text-xs font-bold transition-all duration-200 cursor-pointer hover:scale-105 ${boxBg} ${boxBorder} ${boxText} ${boxShadow}`}
                >
                  {bookmarkIcon && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FACC15" className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5" style={{ filter: 'drop-shadow(0 0 3px rgba(250,204,21,0.5))' }}>
                      <path d="M6 2a2 2 0 00-2 2v18l8-5.5L20 22V4a2 2 0 00-2-2H6z" />
                    </svg>
                  )}
                  Q{i + 1}
                </button>
              );
            })}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 pt-2 border-t border-white/[0.04]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C6FF00]" />
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Answered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FACC15]" />
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Marked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-neutral-700 border border-neutral-600" />
              <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Unanswered</span>
            </div>
          </div>
        </div>

        <div className="relative rounded-2xl border border-[#C6FF00]/15 bg-[rgba(20,20,30,0.8)] p-8">
          {/* Bookmark button - top right */}
          {currentQid && (
            <button
              onClick={() => toggleMark(currentQid)}
              className="absolute top-4 right-4 group"
              title="Mark for review"
            >
              {markedQuestions.has(currentQid) ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FACC15" className="w-6 h-6 transition-all duration-300" style={{ filter: 'drop-shadow(0 0 8px rgba(250,204,21,0.5))' }}>
                  <path d="M6 2a2 2 0 00-2 2v18l8-5.5L20 22V4a2 2 0 00-2-2H6z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-neutral-500 group-hover:text-[#FACC15]/60 transition-all duration-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 2a2 2 0 00-2 2v18l8-5.5L20 22V4a2 2 0 00-2-2H6z" />
                </svg>
              )}
              <span className="absolute -bottom-8 right-0 whitespace-nowrap text-[10px] text-neutral-500 bg-neutral-900 border border-neutral-700 rounded-md px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Mark for review
              </span>
            </button>
          )}

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
  onClick={() => {
    if (currentIndex === questions.length - 1) {
      attemptSubmit();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }}
  className="px-4 py-2 rounded-xl bg-[#C6FF00] text-[#0a0a0f] text-sm font-bold"
  disabled={finishing}
>
  {currentIndex === questions.length - 1 ? "Submit Quiz" : "Next"}
</button>
            {/* End Quiz button */}
            <button
              onClick={attemptSubmit}
              disabled={finishing}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {finishing ? "Ending..." : "End Quiz"}
            </button>
          </div>
        </div>
      </div>

      {/* Pre-submit warning modal for marked questions */}
      {showSubmitWarning && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99998, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ backgroundColor: '#14141e', border: '1px solid rgba(198,255,0,0.2)', borderRadius: '1.25rem', boxShadow: '0 0 60px rgba(198,255,0,0.05)', padding: '2rem', maxWidth: '28rem', width: '100%', margin: '0 1rem', textAlign: 'center', animation: 'scaleIn 0.25s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', backgroundColor: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#facc15', fontSize: '1.75rem' }}>⚠</span>
              </div>
            </div>
            <h3 style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.5rem' }}>Marked Questions Pending</h3>
            <p style={{ color: '#9aa0a6', fontSize: '0.875rem', lineHeight: '1.7', marginBottom: '1.5rem' }}>
              {markedQuestions.size} question{markedQuestions.size > 1 ? 's are' : ' is'} still marked for review. Do you want to go back and review them or submit anyway?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setShowSubmitWarning(false);
                  // jump to first marked question
                  const firstMarked = questions.findIndex((q) => {
                    const qid = q?.id ?? q?.firebaseId;
                    return qid && markedQuestions.has(qid);
                  });
                  if (firstMarked >= 0) setCurrentIndex(firstMarked);
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-bold border border-[#C6FF00]/40 text-[#C6FF00] bg-transparent hover:bg-[#C6FF00]/10 transition-all"
              >
                Review Now
              </button>
              <button
                onClick={() => {
                  setShowSubmitWarning(false);
                  handleEndQuiz();
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-500 transition-all"
              >
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}