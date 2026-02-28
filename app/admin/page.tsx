"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  setDoc,
  query,
  where,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from "firebase/firestore";
import { firebasedb } from "../firebase/firebase.config";

interface Question {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  rewardPoints: number;
  penaltyPoints: number;
}

interface TeamMember {
  name: string;
  email: string;
}

interface Team {
  teamId: string;
  teamName: string;
  teamMembers: TeamMember[];
  questions: string[];
  isStarted: boolean;
  isCompleted: boolean;
  start_time: Date | null;
  end_time: Date | null;
  marksScore: number | null;
  totalScore: number | null;
}

interface Answer {
  id: string;
  teamId: string;
  questionId: string;
  selectedOptionIndex: number;
  isCorrect: boolean;
  mark: number;
  timestamp: any;
}

const uid = () => Math.random().toString(36).slice(2, 9);

const emptyQuestion = (): Omit<Question, "id"> => ({
  question: "",
  options: ["", "", "", ""],
  answerIndex: 0,
  rewardPoints: 10,
  penaltyPoints: 0,
});

type ToastType = "success" | "error" | "info";
interface Toast { id: string; message: string; type: ToastType; }

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium border animate-in slide-in-from-right backdrop-blur-md ${
            t.type === "success"
              ? "bg-black/90 border-green-500/60 text-green-300"
              : t.type === "error"
              ? "bg-black/90 border-red-500/60 text-red-300"
              : "bg-black/90 border-neutral-600 text-neutral-300"
          }`}
        >
          <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${
            t.type === "success" ? "bg-green-400" : t.type === "error" ? "bg-red-400" : "bg-neutral-400"
          }`} />
          <span className="flex-1">{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="opacity-40 hover:opacity-100 text-lg leading-none">×</button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = (message: string, type: ToastType = "info") => {
    const id = uid();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };
  const remove = (id: string) => setToasts((p) => p.filter((t) => t.id !== id));
  return { toasts, push, remove };
}

function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-neutral-950 border border-neutral-700 rounded-2xl shadow-2xl w-full max-w-sm p-7 ring-1 ring-white/5">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full border-2 border-neutral-600 bg-neutral-900 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <span className="text-neutral-300 font-black text-xl leading-none">!</span>
          </div>
          <p className="text-neutral-300 text-sm font-medium leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={onCancel} className="px-6 py-2.5 rounded-xl text-sm font-medium border border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 hover:border-neutral-600 transition-all">Cancel</button>
          <button onClick={onConfirm} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-white text-black hover:bg-neutral-100 transition-all shadow-lg">Confirm</button>
        </div>
      </div>
    </div>
  );
}

function useConfirm() {
  const [state, setState] = useState<{ message: string; resolve: (v: boolean) => void } | null>(null);
  const confirm = (message: string): Promise<boolean> =>
    new Promise((resolve) => setState({ message, resolve }));
  const dialog = state ? (
    <ConfirmDialog
      message={state.message}
      onConfirm={() => { state.resolve(true); setState(null); }}
      onCancel={() => { state.resolve(false); setState(null); }}
    />
  ) : null;
  return { confirm, dialog };
}

function Spinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const s = size === "sm" ? "w-4 h-4" : size === "md" ? "w-6 h-6" : "w-10 h-10";
  return <div className={`${s} border-2 border-neutral-800 border-t-green-400 rounded-full animate-spin`} />;
}

function CreateTeamModal({ onSave, onClose, loading }: {
  onSave: (teamName: string, members: TeamMember[]) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}) {
  const [teamName, setTeamName] = useState("");
  const [members, setMembers] = useState<TeamMember[]>([{ name: "", email: "" }]);
  const [errors, setErrors] = useState<string[]>([""]);

  const addMemberRow = () => { setMembers((p) => [...p, { name: "", email: "" }]); setErrors((p) => [...p, ""]); };
  const removeMemberRow = (i: number) => { setMembers((p) => p.filter((_, idx) => idx !== i)); setErrors((p) => p.filter((_, idx) => idx !== i)); };
  const updateMember = (i: number, field: keyof TeamMember, val: string) => {
    const updated = [...members]; updated[i] = { ...updated[i], [field]: val }; setMembers(updated);
    if (field === "email") { const errs = [...errors]; errs[i] = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) && val !== "" ? "Invalid email" : ""; setErrors(errs); }
  };

  const emails = members.map((m) => m.email.trim().toLowerCase()).filter(Boolean);
  const hasDuplicateEmails = emails.length !== new Set(emails).size;
  const validMembers = members.every((m) => m.name.trim() !== "" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email));
  const valid = teamName.trim() !== "" && validMembers && !hasDuplicateEmails;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col ring-1 ring-white/5">
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800/80 sticky top-0 bg-neutral-950 rounded-t-2xl z-10">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Create New Team</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Fill in team details and add members</p>
          </div>
          <button onClick={onClose} disabled={loading} className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 text-xl leading-none transition-all">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Team Name <span className="text-neutral-600">*</span></label>
            <input
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
              placeholder="e.g. Alpha Squad"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Team Members <span className="text-neutral-600">*</span></label>
              <button onClick={addMemberRow} className="text-xs text-green-400 hover:text-green-300 font-bold flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-green-500/10">+ Add Row</button>
            </div>
            {hasDuplicateEmails && <p className="text-xs text-red-400 mb-2">Duplicate email addresses detected.</p>}
            <div className="space-y-2">
              {members.map((m, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                      placeholder={`Name ${i + 1}`}
                      value={m.name}
                      onChange={(e) => updateMember(i, "name", e.target.value)}
                    />
                    <div>
                      <input
                        type="email"
                        className={`w-full bg-neutral-900 border rounded-xl px-3 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 transition-all ${errors[i] ? "border-red-500/60 focus:ring-red-500/50" : "border-neutral-800 focus:ring-green-500/50 focus:border-green-500/50"}`}
                        placeholder={`email${i + 1}@example.com`}
                        value={m.email}
                        onChange={(e) => updateMember(i, "email", e.target.value)}
                      />
                      {errors[i] && <p className="text-xs text-red-400 mt-1 px-1">{errors[i]}</p>}
                    </div>
                  </div>
                  <button onClick={() => removeMemberRow(i)} disabled={members.length === 1} className="w-8 h-8 mt-1 flex items-center justify-center rounded-lg text-neutral-600 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-20 text-lg transition-all">×</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800/80 bg-black/40 rounded-b-2xl">
          <span className="text-xs text-neutral-600 font-mono">{members.length} member{members.length !== 1 ? "s" : ""}</span>
          <div className="flex gap-3">
            <button onClick={onClose} disabled={loading} className="px-5 py-2.5 rounded-xl text-sm font-medium text-neutral-400 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 hover:text-white transition-all disabled:opacity-50">Cancel</button>
            <button onClick={() => valid && onSave(teamName.trim(), members)} disabled={!valid || loading} className="px-5 py-2.5 rounded-xl text-sm font-bold text-black bg-white hover:bg-neutral-100 disabled:opacity-30 transition-all flex items-center gap-2 shadow-lg">
              {loading && <Spinner size="sm" />} Create Team
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionModal({ initial, onSave, onClose, loading }: {
  initial: Question | null;
  onSave: (q: Omit<Question, "id">, id?: string) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<Omit<Question, "id"> & { id?: string }>(initial ? { ...initial } : emptyQuestion());

  const setOption = (i: number, val: string) => { const opts = [...form.options]; opts[i] = val; setForm({ ...form, options: opts }); };
  const addOption = () => setForm({ ...form, options: [...form.options, ""] });
  const removeOption = (i: number) => {
    if (form.options.length <= 2) return;
    const opts = form.options.filter((_, idx) => idx !== i);
    setForm({ ...form, options: opts, answerIndex: Math.min(form.answerIndex, opts.length - 1) });
  };

  const valid = form.question.trim() !== "" && form.options.every((o) => o.trim() !== "");
  const handleSubmit = async () => { if (!valid) return; const { id, ...rest } = form as any; await onSave(rest, initial?.id); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto flex flex-col ring-1 ring-white/5">
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800/80 sticky top-0 bg-neutral-950 rounded-t-2xl z-10">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">{initial ? "Edit Question" : "New Question"}</h3>
            <p className="text-xs text-neutral-500 mt-0.5">{initial ? "Update the question details below" : "Add a new question to the bank"}</p>
          </div>
          <button onClick={onClose} disabled={loading} className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 text-xl leading-none transition-all">×</button>
        </div>

        <div className="p-6 space-y-5 flex-1">
          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Question <span className="text-neutral-600">*</span></label>
            <textarea rows={3}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 resize-none transition-all"
              placeholder="Enter question…" value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })} />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">Options <span className="text-neutral-600">*</span></label>
            <p className="text-xs text-neutral-600 mb-3">Click radio to mark the correct answer — it'll highlight green.</p>
            <div className="space-y-2">
              {form.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="radio" name="answer" checked={form.answerIndex === i}
                    onChange={() => setForm({ ...form, answerIndex: i })}
                    className="w-4 h-4 shrink-0 accent-green-400" />
                  <input
                    className={`flex-1 border rounded-xl px-3 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 transition-all ${
                      form.answerIndex === i
                        ? "bg-green-950/60 border-green-500/60 focus:ring-green-500/40 text-green-100"
                        : "bg-neutral-900 border-neutral-800 focus:ring-neutral-600"
                    }`}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`} value={opt}
                    onChange={(e) => setOption(i, e.target.value)} />
                  <button onClick={() => removeOption(i)} disabled={form.options.length <= 2}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-600 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-20 text-lg transition-all">×</button>
                </div>
              ))}
            </div>
            <button onClick={addOption} className="mt-3 text-xs text-green-400 hover:text-green-300 font-bold flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-green-500/10">+ Add option</button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Reward Points</label>
              <input type="number" min={0}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                value={form.rewardPoints} onChange={(e) => setForm({ ...form, rewardPoints: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Penalty Points</label>
              <input type="number" min={0}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all"
                value={form.penaltyPoints} onChange={(e) => setForm({ ...form, penaltyPoints: Number(e.target.value) })} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-800/80 bg-black/40 rounded-b-2xl sticky bottom-0">
          <button onClick={onClose} disabled={loading} className="px-5 py-2.5 rounded-xl text-sm font-medium text-neutral-400 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 hover:text-white transition-all disabled:opacity-50">Cancel</button>
          <button onClick={handleSubmit} disabled={!valid || loading}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-black bg-white hover:bg-neutral-100 disabled:opacity-30 transition-all flex items-center gap-2 shadow-lg">
            {loading && <Spinner size="sm" />} {initial ? "Update" : "Save"} Question
          </button>
        </div>
      </div>
    </div>
  );
}

function MemberModal({ teamId, existingEmails, onSave, onClose, loading }: {
  teamId: string; existingEmails: string[];
  onSave: (teamId: string, member: TeamMember) => Promise<void>;
  onClose: () => void; loading: boolean;
}) {
  const [form, setForm] = useState<TeamMember>({ name: "", email: "" });
  const [emailError, setEmailError] = useState("");

  const validateEmail = (val: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return "Enter a valid email.";
    if (existingEmails.includes(val.trim())) return "Already in team.";
    return "";
  };

  const valid = form.name.trim() !== "" && form.email.trim() !== "" && !emailError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl w-full max-w-md ring-1 ring-white/5">
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800/80">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Add Team Member</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Add a new member to this team</p>
          </div>
          <button onClick={onClose} disabled={loading} className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 text-xl leading-none transition-all">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Full Name <span className="text-neutral-600">*</span></label>
            <input className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
              placeholder="Jane Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Email <span className="text-neutral-600">*</span></label>
            <input type="email"
              className={`w-full bg-neutral-900 border rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 transition-all ${emailError ? "border-red-500/60 focus:ring-red-500/50" : "border-neutral-800 focus:ring-green-500/50 focus:border-green-500/50"}`}
              placeholder="jane@example.com" value={form.email}
              onChange={(e) => { setForm({ ...form, email: e.target.value }); setEmailError(validateEmail(e.target.value)); }} />
            {emailError && <p className="text-xs text-red-400 mt-1">{emailError}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-800/80 bg-black/40 rounded-b-2xl">
          <button onClick={onClose} disabled={loading} className="px-5 py-2.5 rounded-xl text-sm font-medium text-neutral-400 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 hover:text-white transition-all">Cancel</button>
          <button onClick={() => valid && onSave(teamId, form)} disabled={!valid || loading}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-black bg-white hover:bg-neutral-100 disabled:opacity-30 transition-all flex items-center gap-2 shadow-lg">
            {loading && <Spinner size="sm" />} Add Member
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignQuestionsModal({ team, allQuestions, onSave, onClose, loading }: {
  team: Team; allQuestions: Question[];
  onSave: (teamId: string, questionIds: string[]) => Promise<void>;
  onClose: () => void; loading: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(team.questions));
  const toggle = (id: string) => { const s = new Set(selected); s.has(id) ? s.delete(id) : s.add(id); setSelected(s); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col ring-1 ring-white/5">
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800/80 sticky top-0 bg-neutral-950 rounded-t-2xl">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Assign Questions</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Team: <span className="text-neutral-300 font-semibold">{team.teamName}</span></p>
          </div>
          <button onClick={onClose} disabled={loading} className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 text-xl leading-none transition-all">×</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {allQuestions.length === 0 && <p className="text-sm text-neutral-600 text-center py-8">No questions available.</p>}
          {allQuestions.map((q, i) => (
            <label key={q.id}
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                selected.has(q.id) ? "border-green-500/50 bg-green-950/30" : "border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/50"
              }`}>
              <input type="checkbox" checked={selected.has(q.id)} onChange={() => toggle(q.id)} className="w-4 h-4 mt-0.5 shrink-0 accent-green-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-200 truncate">
                  <span className={`font-bold mr-1 ${selected.has(q.id) ? "text-green-400" : "text-neutral-500"}`}>Q{i + 1}.</span>
                  {q.question}
                </p>
                <p className="text-xs text-neutral-600 mt-0.5">+{q.rewardPoints} pts / -{q.penaltyPoints} penalty</p>
              </div>
            </label>
          ))}
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800/80 bg-black/40 rounded-b-2xl sticky bottom-0">
          <span className="text-xs text-neutral-500 font-mono">{selected.size} selected</span>
          <div className="flex gap-3">
            <button onClick={onClose} disabled={loading} className="px-5 py-2.5 rounded-xl text-sm font-medium text-neutral-400 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 hover:text-white transition-all">Cancel</button>
            <button onClick={() => onSave(team.teamId, Array.from(selected))} disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-black bg-white hover:bg-neutral-100 disabled:opacity-30 transition-all flex items-center gap-2 shadow-lg">
              {loading && <Spinner size="sm" />} Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionsTab({ questions, loading, onAdd, onEdit, onDelete }: {
  questions: Question[]; loading: boolean;
  onAdd: () => void; onEdit: (q: Question) => void; onDelete: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = questions.filter((q) => q.question.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-semibold text-white tracking-tight">Question Bank</h2>
          <p className="text-sm text-neutral-500 mt-1">{questions.length} question{questions.length !== 1 ? "s" : ""} in the pool</p>
        </div>
        <button onClick={onAdd} className="px-5 py-2.5 rounded-xl text-sm font-semi text-black bg-white hover:bg-neutral-100 transition-all whitespace-nowrap self-start sm:self-auto shadow-lg">
          + Add Question
        </button>
      </div>

      <div className="relative mb-6">
        <input
          className="w-full bg-neutral-900/80 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500/40 transition-all"
          placeholder="Search questions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl border border-neutral-800 bg-neutral-900 flex items-center justify-center mx-auto mb-4">
            <span className="text-neutral-600 text-2xl font-black">?</span>
          </div>
          <p className="font-bold text-neutral-400">No questions found</p>
          <p className="text-sm text-neutral-600 mt-1">Try a different search term</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q, idx) => (
            <div key={q.id} className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 hover:border-neutral-700 hover:bg-neutral-900 transition-all group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-xs font-black text-neutral-500 bg-neutral-800 border border-neutral-700 px-2.5 py-1 rounded-lg font-mono">Q{idx + 1}</span>
                    <span className="text-xs font-bold text-green-400 bg-green-950/50 border border-green-500/30 px-2.5 py-1 rounded-lg">+{q.rewardPoints} pts</span>
                    {q.penaltyPoints > 0 && <span className="text-xs font-bold text-red-400 bg-red-950/50 border border-red-500/30 px-2.5 py-1 rounded-lg">-{q.penaltyPoints} penalty</span>}
                    <span className="text-xs text-neutral-700 font-mono hidden sm:inline ml-1">{q.id}</span>
                  </div>
                  <p className="text-white font-semibold leading-snug mb-4">{q.question}</p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, i) => (
                      <li key={i} className={`text-sm px-3 py-2 rounded-xl border flex items-center gap-2 ${
                        i === q.answerIndex
                          ? "bg-green-950/60 border-green-500/50 text-green-300 font-semibold"
                          : "bg-neutral-800/60 border-neutral-700/60 text-neutral-400"
                      }`}>
                        {i === q.answerIndex && <span className="text-green-400 font-black text-xs shrink-0">✓</span>}
                        <span className="font-bold text-xs shrink-0 opacity-60">{String.fromCharCode(65 + i)}.</span>
                        <span className="truncate">{opt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col gap-2 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                  <button onClick={() => onEdit(q)} className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-300 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-600 transition-all">Edit</button>
                  <button onClick={() => onDelete(q.id)} className="px-4 py-2 rounded-xl text-xs font-bold text-red-400 bg-neutral-800 hover:bg-red-950/50 border border-neutral-700 hover:border-red-500/40 transition-all">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnswersTab({ teams, questions, loading }: { teams: Team[]; questions: Question[]; loading: boolean }) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [answersLoading, setAnswersLoading] = useState(false);
  const qMap = Object.fromEntries(questions.map((q) => [q.id, q]));

  const fetchAnswers = async (teamId: string) => {
    if (!teamId) return;
    setAnswersLoading(true);
    try {
      const q = query(collection(firebasedb, "answers"), where("teamId", "==", teamId));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Answer[];
      data.sort((a, b) => { const ta = a.timestamp?.toDate?.()?.getTime?.() ?? 0; const tb = b.timestamp?.toDate?.()?.getTime?.() ?? 0; return tb - ta; });
      setAnswers(data);
    } catch (e) { setAnswers([]); } finally { setAnswersLoading(false); }
  };

  useEffect(() => { if (selectedTeamId) fetchAnswers(selectedTeamId); else setAnswers([]); }, [selectedTeamId]);

  const selectedTeam = teams.find((t) => t.teamId === selectedTeamId);
  const totalMark = answers.reduce((s, a) => s + (a.mark ?? 0), 0);
  const correct = answers.filter((a) => a.isCorrect).length;
  const incorrect = answers.filter((a) => !a.isCorrect).length;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-black text-white tracking-tight">Answers</h2>
        <p className="text-sm text-neutral-500 mt-1">View submitted answers per team</p>
      </div>

      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 mb-6">
        <label className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Select Team</label>
        <select
          className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500/40 transition-all"
          value={selectedTeamId}
          onChange={(e) => setSelectedTeamId(e.target.value)}
        >
          <option value="">— Choose a team —</option>
          {teams.map((t) => <option key={t.teamId} value={t.teamId}>{t.teamName}</option>)}
        </select>
      </div>

      {selectedTeam && answers.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total", value: answers.length, accent: "neutral" },
            { label: "Correct", value: correct, accent: "green" },
            { label: "Incorrect", value: incorrect, accent: "red" },
            { label: "Net Score", value: totalMark, accent: totalMark >= 0 ? "green" : "red" },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl border px-4 py-4 text-center ${
              s.accent === "green" ? "bg-green-950/30 border-green-500/30"
              : s.accent === "red" ? "bg-red-950/30 border-red-500/30"
              : "bg-neutral-900 border-neutral-800"
            }`}>
              <p className="text-xs text-neutral-500 mb-1 uppercase tracking-widest font-bold">{s.label}</p>
              <p className={`text-3xl font-black ${
                s.accent === "green" ? "text-green-400" : s.accent === "red" ? "text-red-400" : "text-white"
              }`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {!selectedTeamId ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl border border-neutral-800 bg-neutral-900 flex items-center justify-center mx-auto mb-4">
            <span className="text-neutral-600 text-2xl">↑</span>
          </div>
          <p className="font-bold text-neutral-400">Select a team to view answers</p>
        </div>
      ) : answersLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : answers.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl border border-neutral-800 bg-neutral-900 flex items-center justify-center mx-auto mb-4">
            <span className="text-neutral-600 text-2xl font-black">—</span>
          </div>
          <p className="font-bold text-neutral-400">No answers submitted yet</p>
          <p className="text-sm text-neutral-600 mt-1">This team hasn't answered any questions.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {answers.map((ans) => {
            const q = qMap[ans.questionId];
            const ts = ans.timestamp?.toDate?.();
            return (
              <div key={ans.id} className={`border rounded-2xl p-5 transition-all ${
                ans.isCorrect ? "bg-green-950/20 border-green-500/30" : "bg-neutral-900/60 border-neutral-800"
              }`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                        ans.isCorrect ? "bg-green-950/60 border-green-500/50 text-green-400" : "bg-neutral-800 border-neutral-700 text-neutral-500"
                      }`}>{ans.isCorrect ? "✓ Correct" : "✗ Wrong"}</span>
                      <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                        ans.mark > 0 ? "bg-green-950/60 border-green-500/40 text-green-400"
                        : ans.mark < 0 ? "bg-red-950/50 border-red-500/40 text-red-400"
                        : "bg-neutral-800 border-neutral-700 text-neutral-500"
                      }`}>{ans.mark > 0 ? "+" : ""}{ans.mark} pts</span>
                      <span className="text-xs text-neutral-700 font-mono">{ans.questionId}</span>
                    </div>
                    <p className="text-sm font-bold text-white mb-3">
                      {q ? q.question : <span className="italic text-neutral-600">Question not found</span>}
                    </p>
                    {q && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {q.options.map((opt, i) => {
                          const isSelected = i === ans.selectedOptionIndex;
                          const isCorrectOpt = i === q.answerIndex;
                          let cls = "bg-neutral-800/60 border-neutral-700/60 text-neutral-500";
                          if (isSelected && isCorrectOpt) cls = "bg-green-950/60 border-green-500/60 text-green-300 font-bold";
                          else if (isSelected && !isCorrectOpt) cls = "bg-red-950/50 border-red-500/50 text-red-300 font-bold";
                          else if (!isSelected && isCorrectOpt) cls = "bg-green-950/30 border-green-500/30 text-green-400";
                          return (
                            <div key={i} className={`text-xs px-3 py-2 rounded-xl border flex items-center gap-2 ${cls}`}>
                              <span className="font-black shrink-0 opacity-60">{String.fromCharCode(65 + i)}.</span>
                              <span className="flex-1">{opt}</span>
                              {isSelected && <span className="ml-auto shrink-0 font-bold">{isCorrectOpt ? "✓" : "✗"}</span>}
                              {!isSelected && isCorrectOpt && <span className="ml-auto shrink-0 text-green-400">✓</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {ts && (
                      <div className="text-xs text-neutral-600 font-mono">
                        <p>{ts.toLocaleDateString()}</p>
                        <p>{ts.toLocaleTimeString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TeamsTab({ teams, questions, loading, onCreateTeam, onAddMember, onRemoveMember, onAssignQuestions, onToggleStart, onToggleComplete }: {
  teams: Team[]; questions: Question[]; loading: boolean;
  onCreateTeam: () => void; onAddMember: (teamId: string) => void;
  onRemoveMember: (teamId: string, email: string) => void; onAssignQuestions: (team: Team) => void;
  onToggleStart: (team: Team) => void; onToggleComplete: (team: Team) => void;
}) {
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const qMap = Object.fromEntries(questions.map((q) => [q.id, q]));

  const statusMeta = (team: Team) => {
    if (team.isCompleted) return { label: "Completed", cls: "bg-green-950/50 text-green-400 border-green-500/40" };
    if (team.isStarted) return { label: "In Progress", cls: "bg-neutral-800 text-neutral-300 border-neutral-600" };
    return { label: "Not Started", cls: "bg-neutral-900 text-neutral-600 border-neutral-800" };
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Teams</h2>
          <p className="text-sm text-neutral-500 mt-1">{teams.length} team{teams.length !== 1 ? "s" : ""} registered</p>
        </div>
        <button onClick={onCreateTeam} className="px-5 py-2.5 rounded-xl text-sm font-bold text-black bg-white hover:bg-neutral-100 transition-all whitespace-nowrap self-start sm:self-auto shadow-lg">
          + Create Team
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : teams.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl border border-neutral-800 bg-neutral-900 flex items-center justify-center mx-auto mb-4">
            <span className="text-neutral-600 text-2xl font-black">T</span>
          </div>
          <p className="font-bold text-neutral-400">No teams yet</p>
          <p className="text-sm text-neutral-600 mt-1">Click "Create Team" to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {teams.map((team) => {
            const isOpen = expandedTeam === team.teamId;
            const { label, cls } = statusMeta(team);
            return (
              <div key={team.teamId} className={`border rounded-2xl overflow-hidden transition-all ${isOpen ? "border-neutral-700 bg-neutral-900" : "border-neutral-800 bg-neutral-900/60 hover:border-neutral-700"}`}>
                <button onClick={() => setExpandedTeam(isOpen ? null : team.teamId)} className="w-full flex items-center justify-between px-6 py-4 hover:bg-neutral-800/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 text-white font-black flex items-center justify-center text-sm shrink-0">
                      {team.teamName.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-white">{team.teamName}</p>
                      <p className="text-xs text-neutral-600 font-mono mt-0.5">{team.teamId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${cls}`}>{label}</span>
                    <span className="text-xs bg-neutral-800 text-neutral-400 border border-neutral-700 px-2.5 py-1 rounded-lg font-bold">{team.teamMembers.length} members</span>
                    <span className="text-neutral-600 font-mono text-sm ml-1">{isOpen ? "▾" : "▸"}</span>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-neutral-800 px-6 py-6 space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "Questions", value: team.questions.length },
                        { label: "Score", value: team.marksScore !== null ? `${team.marksScore} / ${team.totalScore ?? "?"}` : "—" },
                        { label: "Start", value: team.start_time ? new Date(team.start_time).toLocaleTimeString() : "—" },
                        { label: "End", value: team.end_time ? new Date(team.end_time).toLocaleTimeString() : "—" },
                      ].map((s) => (
                        <div key={s.label} className="bg-neutral-800/60 rounded-xl px-4 py-3 text-center border border-neutral-700/60">
                          <p className="text-xs text-neutral-500 mb-1 uppercase tracking-widest font-bold">{s.label}</p>
                          <p className="text-sm font-black text-white">{s.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => onAssignQuestions(team)} className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-300 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-600 transition-all">
                        Assign Questions
                      </button>
                      <button onClick={() => onToggleStart(team)} disabled={team.isCompleted}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-40 ${
                          team.isStarted
                            ? "text-neutral-300 bg-neutral-800 hover:bg-neutral-700 border-neutral-700"
                            : "text-green-400 bg-green-950/40 hover:bg-green-950/60 border-green-500/40 hover:border-green-500/60"
                        }`}>
                        {team.isStarted ? "Pause Quiz" : "Start Quiz"}
                      </button>
                      <button onClick={() => onToggleComplete(team)} disabled={!team.isStarted}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-40 ${
                          team.isCompleted
                            ? "text-neutral-400 bg-neutral-800 hover:bg-neutral-700 border-neutral-700"
                            : "text-red-400 bg-red-950/40 hover:bg-red-950/60 border-red-500/40 hover:border-red-500/60"
                        }`}>
                        {team.isCompleted ? "Reopen Quiz" : "Mark Complete"}
                      </button>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-black text-neutral-300 text-xs uppercase tracking-widest">Team Members</h4>
                        <button onClick={() => onAddMember(team.teamId)} className="text-xs text-green-400 hover:text-green-300 font-bold flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-green-500/10">
                          + Add Member
                        </button>
                      </div>
                      {team.teamMembers.length === 0 ? (
                        <p className="text-sm text-neutral-600 italic">No members yet.</p>
                      ) : (
                        <ul className="space-y-2">
                          {team.teamMembers.map((m) => (
                            <li key={m.email} className="flex items-center justify-between bg-neutral-800/60 rounded-xl px-4 py-3 border border-neutral-700/60">
                              <div>
                                <p className="text-sm font-bold text-white">{m.name}</p>
                                <p className="text-xs text-neutral-500 font-mono">{m.email}</p>
                              </div>
                              <button onClick={() => onRemoveMember(team.teamId, m.email)} className="text-xs text-neutral-600 hover:text-red-400 font-bold px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all">
                                Remove
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <h4 className="font-black text-neutral-300 text-xs uppercase tracking-widest mb-3">Assigned Questions</h4>
                      {team.questions.length === 0 ? (
                        <p className="text-sm text-neutral-600 italic">No questions assigned.</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {team.questions.map((qid) => {
                            const q = qMap[qid];
                            return (
                              <li key={qid} className="text-sm text-neutral-400 bg-neutral-800/60 border border-neutral-700/60 rounded-xl px-3 py-2 flex items-center justify-between">
                                <span className="truncate">{q ? q.question : <span className="font-mono text-neutral-600">{qid}</span>}</span>
                                {q && <span className="text-xs text-green-500 ml-2 shrink-0 font-bold">+{q.rewardPoints}pts</span>}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminPanel() {
  const { toasts, push, remove } = useToast();
  const { confirm, dialog } = useConfirm();

  const [activeTab, setActiveTab] = useState<"questions" | "teams" | "answers">("questions");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [qModal, setQModal] = useState<{ open: boolean; editing: Question | null }>({ open: false, editing: null });
  const [mModal, setMModal] = useState<{ open: boolean; teamId: string }>({ open: false, teamId: "" });
  const [assignModal, setAssignModal] = useState<{ open: boolean; team: Team | null }>({ open: false, team: null });
  const [createTeamModal, setCreateTeamModal] = useState(false);

  const fetchAll = async () => {
    setFetchLoading(true);
    try {
      const [qSnap, tSnap] = await Promise.all([getDocs(collection(firebasedb, "questions")), getDocs(collection(firebasedb, "teams"))]);
      setQuestions(qSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Question, "id">) })));
      setTeams(tSnap.docs.map((d) => {
        const data = d.data() as any;
        return {
          teamId: d.id, teamName: data.teamName ?? "", teamMembers: data.teamMembers ?? [],
          questions: data.questions ?? [], isStarted: data.isStarted ?? false, isCompleted: data.isCompleted ?? false,
          start_time: data.start_time?.toDate?.() ?? null, end_time: data.end_time?.toDate?.() ?? null,
          marksScore: data.marksScore ?? null, totalScore: data.totalScore ?? null,
        };
      }));
    } catch (e) { push("Failed to load data from Firebase.", "error"); }
    finally { setFetchLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreateTeam = async (teamName: string, members: TeamMember[]) => {
    setActionLoading(true);
    try {
      const newTeamRef = doc(collection(firebasedb, "teams"));
      const allQuestionIds = questions.map((q) => q.id);
      const totalScore = questions.reduce((sum, q) => sum + (q.rewardPoints ?? 0), 0);
      const teamData = {
        teamName,
        teamMembers: members,
        questions: allQuestionIds,
        isStarted: false,
        isCompleted: false,
        start_time: null,
        end_time: null,
        marksScore: 0,
        totalScore,
      };
      await setDoc(newTeamRef, teamData);
      setTeams((p) => [...p, { teamId: newTeamRef.id, ...teamData }]);
      setCreateTeamModal(false);
      push(
        `Team "${teamName}" created with ${allQuestionIds.length} question${allQuestionIds.length !== 1 ? "s" : ""} auto-assigned!`,
        "success"
      );
    } catch (e) {
      push(`Failed to create team: ${(e as Error).message}`, "error");
    } finally {
      setActionLoading(false);
    }
  };
  const handleSaveQuestion = async (data: Omit<Question, "id">, id?: string) => {
    setActionLoading(true);
    try {
      if (id) {
        await updateDoc(doc(firebasedb, "questions", id), { ...data });
        setQuestions((p) => p.map((q) => (q.id === id ? { id, ...data } : q)));
        push("Question updated.", "success");
      } else {
        const ref = await addDoc(collection(firebasedb, "questions"), { ...data });
        const newId = ref.id;
  
        if (teams.length > 0) {
          await Promise.all(
            teams.map((t) =>
              updateDoc(doc(firebasedb, "teams", t.teamId), {
                questions: arrayUnion(newId),
                totalScore: (t.totalScore ?? 0) + (data.rewardPoints ?? 0),
              })
            )
          );
          setTeams((p) =>
            p.map((t) => ({
              ...t,
              questions: [...t.questions, newId],
              totalScore: (t.totalScore ?? 0) + (data.rewardPoints ?? 0),
            }))
          );
        }
  
        setQuestions((p) => [...p, { id: newId, ...data }]);
        push("Question added.", "success");
      }
      setQModal({ open: false, editing: null });
    } catch (e) {
      push(`Failed to save question: ${(e as Error).message}`, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    const ok = await confirm("Delete this question? It will be removed from all teams.");
    if (!ok) return;
    setActionLoading(true);
    try {
      await deleteDoc(doc(firebasedb, "questions", id));
  
      const teamsWithQuestion = teams.filter((t) => t.questions.includes(id));
  
      if (teamsWithQuestion.length > 0) {
        await Promise.all(
          teamsWithQuestion.map((t) => {
            const newTotal = (t.totalScore ?? 0) - (questions.find((q) => q.id === id)?.rewardPoints ?? 0);
            return updateDoc(doc(firebasedb, "teams", t.teamId), {
              questions: arrayRemove(id),
              totalScore: newTotal < 0 ? 0 : newTotal,
            });
          })
        );
      }
  
      setQuestions((p) => p.filter((q) => q.id !== id));
      setTeams((p) =>
        p.map((t) => ({
          ...t,
          questions: t.questions.filter((qid) => qid !== id),
          totalScore: Math.max(0, (t.totalScore ?? 0) - (questions.find((q) => q.id === id)?.rewardPoints ?? 0)),
        }))
      );
  
      push("Question deleted.", "success");
    } catch (e) {
      push(`Failed to delete: ${(e as Error).message}`, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMember = async (teamId: string, member: TeamMember) => {
    setActionLoading(true);
    try {
      await updateDoc(doc(firebasedb, "teams", teamId), { teamMembers: arrayUnion(member) });
      setTeams((p) => p.map((t) => t.teamId === teamId ? { ...t, teamMembers: [...t.teamMembers, member] } : t));
      setMModal({ open: false, teamId: "" });
      push("Member added.", "success");
    } catch (e) { push(`Failed to add member: ${(e as Error).message}`, "error"); }
    finally { setActionLoading(false); }
  };

  const handleRemoveMember = async (teamId: string, email: string) => {
    const team = teams.find((t) => t.teamId === teamId);
    const member = team?.teamMembers.find((m) => m.email === email);
    if (!member) return;
    const ok = await confirm(`Remove "${member.name}" from ${team?.teamName}?`);
    if (!ok) return;
    setActionLoading(true);
    try {
      await updateDoc(doc(firebasedb, "teams", teamId), { teamMembers: arrayRemove(member) });
      setTeams((p) => p.map((t) => t.teamId === teamId ? { ...t, teamMembers: t.teamMembers.filter((m) => m.email !== email) } : t));
      push("Member removed.", "success");
    } catch (e) { push(`Failed to remove member: ${(e as Error).message}`, "error"); }
    finally { setActionLoading(false); }
  };

  const handleAssignQuestions = async (teamId: string, questionIds: string[]) => {
    setActionLoading(true);
    try {
      const total = questionIds.reduce((sum, qid) => { const q = questions.find((x) => x.id === qid); return sum + (q?.rewardPoints ?? 0); }, 0);
      await updateDoc(doc(firebasedb, "teams", teamId), { questions: questionIds, totalScore: total });
      setTeams((p) => p.map((t) => t.teamId === teamId ? { ...t, questions: questionIds, totalScore: total } : t));
      setAssignModal({ open: false, team: null });
      push("Questions assigned.", "success");
    } catch (e) { push(`Failed to assign: ${(e as Error).message}`, "error"); }
    finally { setActionLoading(false); }
  };

  const handleToggleStart = async (team: Team) => {
    const newStarted = !team.isStarted;
    const ok = await confirm(newStarted ? `Start quiz for "${team.teamName}"?` : `Pause quiz for "${team.teamName}"?`);
    if (!ok) return;
    setActionLoading(true);
    try {
      const updates: Record<string, any> = { isStarted: newStarted };
      if (newStarted && !team.start_time) updates.start_time = serverTimestamp();
      await updateDoc(doc(firebasedb, "teams", team.teamId), updates);
      setTeams((p) => p.map((t) => t.teamId === team.teamId ? { ...t, isStarted: newStarted, start_time: newStarted && !t.start_time ? new Date() : t.start_time } : t));
      push(`Quiz ${newStarted ? "started" : "paused"}.`, "success");
    } catch (e) { push(`Failed: ${(e as Error).message}`, "error"); }
    finally { setActionLoading(false); }
  };

  const handleToggleComplete = async (team: Team) => {
    const newCompleted = !team.isCompleted;
    const ok = await confirm(newCompleted ? `Mark complete for "${team.teamName}"?` : `Reopen quiz for "${team.teamName}"?`);
    if (!ok) return;
    setActionLoading(true);
    try {
      const updates: Record<string, any> = { isCompleted: newCompleted };
      if (newCompleted) updates.end_time = serverTimestamp();
      await updateDoc(doc(firebasedb, "teams", team.teamId), updates);
      setTeams((p) => p.map((t) => t.teamId === team.teamId ? { ...t, isCompleted: newCompleted, end_time: newCompleted ? new Date() : t.end_time } : t));
      push(`Quiz ${newCompleted ? "completed" : "reopened"}.`, "success");
    } catch (e) { push(`Failed: ${(e as Error).message}`, "error"); }
    finally { setActionLoading(false); }
  };

  const tabs = [
    { key: "questions" as const, label: "Questions", count: questions.length },
    { key: "teams" as const, label: "Teams", count: teams.length },
    { key: "answers" as const, label: "Answers", count: null },
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-950/20 via-black to-black pointer-events-none" />

      <header className="relative bg-black/80 backdrop-blur-xl border-b border-neutral-800/80 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            
          <div>
  <h1 className="text-base font-black tracking-[0.2em] uppercase text-white leading-none">
    Admin Panel
  </h1>
  <p className="text-[10px] tracking-[0.35em] uppercase  mt-1 font-medium text-neutral-300">
    ◆ ENIGMA QUIZ ◆
  </p>
</div>
          </div>
          <button
            onClick={fetchAll}
            disabled={fetchLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 hover:text-white transition-all disabled:opacity-50"
          >
            {fetchLoading ? <Spinner size="sm" /> : <span className="font-black">↻</span>}
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </header>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex gap-1 bg-neutral-900/80 border border-neutral-800 rounded-2xl p-1 w-fit backdrop-blur-sm">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === t.key
                  ? "bg-white text-black shadow-lg"
                  : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800"
              }`}
            >
              {t.label}
              {t.count !== null && (
                <span className={`text-xs px-1.5 py-0.5 rounded-lg font-black ${
                  activeTab === t.key ? "bg-neutral-200 text-black" : "bg-neutral-800 text-neutral-500"
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === "questions" && (
          <QuestionsTab questions={questions} loading={fetchLoading}
            onAdd={() => setQModal({ open: true, editing: null })}
            onEdit={(q) => setQModal({ open: true, editing: q })}
            onDelete={handleDeleteQuestion} />
        )}
        {activeTab === "teams" && (
          <TeamsTab teams={teams} questions={questions} loading={fetchLoading}
            onCreateTeam={() => setCreateTeamModal(true)}
            onAddMember={(teamId) => setMModal({ open: true, teamId })}
            onRemoveMember={handleRemoveMember}
            onAssignQuestions={(team) => setAssignModal({ open: true, team })}
            onToggleStart={handleToggleStart}
            onToggleComplete={handleToggleComplete} />
        )}
        {activeTab === "answers" && <AnswersTab teams={teams} questions={questions} loading={fetchLoading} />}
      </main>

      {createTeamModal && <CreateTeamModal onSave={handleCreateTeam} onClose={() => !actionLoading && setCreateTeamModal(false)} loading={actionLoading} />}
      {qModal.open && <QuestionModal initial={qModal.editing} onSave={handleSaveQuestion} onClose={() => !actionLoading && setQModal({ open: false, editing: null })} loading={actionLoading} />}
      {mModal.open && (
        <MemberModal teamId={mModal.teamId}
          existingEmails={teams.find((t) => t.teamId === mModal.teamId)?.teamMembers.map((m) => m.email) ?? []}
          onSave={handleAddMember}
          onClose={() => !actionLoading && setMModal({ open: false, teamId: "" })}
          loading={actionLoading} />
      )}
      {assignModal.open && assignModal.team && (
        <AssignQuestionsModal team={assignModal.team} allQuestions={questions}
          onSave={handleAssignQuestions}
          onClose={() => !actionLoading && setAssignModal({ open: false, team: null })}
          loading={actionLoading} />
      )}

      {dialog}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}