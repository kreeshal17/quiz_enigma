"use client"
import React from "react";

type QuestionProp = {
  id?: string;
  question?: string;
  options?: string[];
  // other fields if needed
};

const QuestionCard: React.FC<{ question: QuestionProp }> = ({ question }) => {
  if (!question) {
    return <div className="text-center text-[#9aa0a6]">No question</div>;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{question.question}</h3>
      <div className="space-y-3">
        {(question.options || []).map((opt: string, i: number) => (
          <button
            key={i}
            className="w-full text-left px-4 py-3 rounded-xl border border-white/10 bg-white/[0.02] text-sm"
          >
            <span className="font-mono text-[#C6FF00] mr-3">{String.fromCharCode(65 + i)}.</span>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuestionCard;