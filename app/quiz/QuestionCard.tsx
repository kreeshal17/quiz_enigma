"use client"
import React, { useState } from "react";
import { createAnswer } from "@/app/firebase/answer.controller";

type QuestionProp = {
  id?: string;
  firebaseId?: string;
  question?: string;
  options?: string[];
  difficulty?: string;
  // other fields if needed
};

const QuestionCard: React.FC<{
  question: QuestionProp;
  teamId: string;
  selectedIndex?: number | null;
  onAnswered?: (index: number) => void;
}> = ({ question, teamId, selectedIndex = null, onAnswered }) => {
  const [saving, setSaving] = useState(false);

  if (!question) {
    return <div className="text-center text-[#9aa0a6]">No question</div>;
  }

  const qid = question.id ?? question.firebaseId;
  const handleOptionClick = (index: number) => {
    if (!qid) {
      console.warn("Question id missing");
      return;
    }

    // Optimistic: update UI immediately
    if (typeof onAnswered === "function") {
      onAnswered(index);
    }

    // Fire network call in background — don't block UI
    setSaving(true);
    createAnswer({
      teamId,
      questionId: qid as string,
      selectedOptionIndex: index,
      timestamp: new Date(),
    })
      .then((res) => {
        if (!res?.success) {
          console.error("Failed to save answer:", res?.message);
        }
      })
      .catch((err) => {
        console.error("Failed to submit answer:", err);
      })
      .finally(() => setSaving(false));
  };

  return (
    <div>
      <div className="flex items-start gap-3 mb-4">
        <h3 className="text-lg font-semibold flex-1">{question.question}</h3>
        {question.difficulty && (
          <span className={`shrink-0 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
            question.difficulty.toLowerCase() === 'easy'
              ? 'text-green-400 bg-green-950/40 border-green-500/30'
              : question.difficulty.toLowerCase() === 'medium'
                ? 'text-yellow-400 bg-yellow-950/40 border-yellow-500/30'
                : 'text-red-400 bg-red-950/40 border-red-500/30'
          }`}>
            {question.difficulty}
          </span>
        )}
      </div>
      <div className="space-y-3">
        {(question.options || []).map((opt: string, i: number) => {
          const isSelected = selectedIndex === i;
          return (
            <button
              key={i}
              onClick={() => handleOptionClick(i)}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-150 ${
                isSelected
                  ? "bg-[#C6FF00]/12 border-[#C6FF00]/50 text-[#C6FF00]"
                  : "bg-white/[0.02] border-white/10 text-[#cccccc] hover:border-[#C6FF00]/30 hover:bg-[#C6FF00]/5"
              }`}
            >
              <span className="font-mono mr-3">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionCard;