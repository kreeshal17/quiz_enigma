"use client"
import React, { useState } from "react";
import { createAnswer } from "@/app/firebase/answer.controller";

type QuestionProp = {
  id?: string;
  firebaseId?: string;
  question?: string;
  options?: string[];
  // other fields if needed
};

const QuestionCard: React.FC<{
  question: QuestionProp;
  teamId: string;
  selectedIndex?: number | null;
  onAnswered?: (index: number) => void;
}> = ({ question, teamId, selectedIndex = null, onAnswered }) => {
  const [submittingIndex, setSubmittingIndex] = useState<number | null>(null);

  if (!question) {
    return <div className="text-center text-[#9aa0a6]">No question</div>;
  }

  const qid = question.id ?? question.firebaseId;
  const handleOptionClick = async (index: number) => {
    if (!qid) {
      console.warn("Question id missing");
      return;
    }

    // optimistic UI: mark submitting
    setSubmittingIndex(index);
    try {
      const res = await createAnswer({
        teamId,
        questionId: qid as string,
        selectedOptionIndex: index,
        timestamp: new Date(),
      });
      console.log("createAnswer result:", res);
      if (res?.success && typeof onAnswered === "function") {
        onAnswered(index);
      }
    } catch (err) {
      console.error("Failed to submit answer:", err);
    } finally {
      setSubmittingIndex(null);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{question.question}</h3>
      <div className="space-y-3">
        {(question.options || []).map((opt: string, i: number) => {
          const isSelected = selectedIndex === i;
          const isDisabled = submittingIndex !== null;
          return (
            <button
              key={i}
              onClick={() => handleOptionClick(i)}
              disabled={isDisabled}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed ${
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