import { addDoc, collection, doc, getDoc, getDocs, runTransaction, updateDoc } from "firebase/firestore"
import { firebasedb } from "./firebase.config"
import { getAnswersByTeamId } from "./answer.controller"

interface Team {
    teamId: string
    teamName: string
    teamMembers: TeamMember[]
    questions: string[]
    isStarted: boolean
    isCompleted: boolean
    isPaused: boolean
    start_time: Date | null
    end_time: Date | null
    marksScore: number | null
    totalScore: number | null
    // ── Round 2 fields (Round 1 fields above are NEVER touched during promotion) ──
    currentRound: 1 | 2
    qualifiedForRound2: boolean
    round2Questions: string[]
    round2Score: number | null
    round2TotalScore: number | null
    round2Started: boolean
    round2Completed: boolean
    round2Paused: boolean
    round2_start_time: Date | null
    round2_end_time: Date | null
}

interface TeamMember {
    name: string
    email: string
}

export const createTeam = async (team: Omit<Team, "questions">) => {
    try {
        // Fetch all questions from 'questions' collection
        const questionsCol = collection(firebasedb, "questions");
        const snapshot = await getDocs(questionsCol);

        // Only include round 1 questions (or questions without a round field)
        const questionIds = snapshot.docs
            .filter((d) => {
                const data = d.data() as any;
                return !data.round || data.round === 1;
            })
            .map((d) => d.id);

        // Shuffle using Fisher-Yates
        const shuffle = <T,>(arr: T[]) => {
            const a = arr.slice();
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        };
        const shuffledQuestions = shuffle(questionIds);

        const teamRef = collection(firebasedb, 'teams');

        // Ensure the team object stored has the shuffled questions
        const teamToStore: Team = {
            ...team,
            questions: shuffledQuestions,
        };

        const docRef = await addDoc(teamRef, teamToStore);

        return {
            success: true,
            message: "team created successfully",
            teamId: docRef.id,
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to create team: ${(error as Error).message || String(error)}`,
        };
    }
}

export const startQuiz = async (teamId: string, start_time: Date) => {
    try {
        const teamDocRef = doc(firebasedb, 'teams', teamId);

        await runTransaction(firebasedb, async (transaction) => {
            const teamSnap = await transaction.get(teamDocRef);
            if (!teamSnap.exists()) {
                throw new Error("Team not found");
            }

            const data = teamSnap.data() as any;
            // Prevent restarting an already started quiz
            if (data.isStarted) {
                throw new Error("Quiz already started for this team");
            }

            transaction.update(teamDocRef, { start_time, isStarted: true });
        });

        return {
            success: true,
            message: "Quiz started successfully",
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to start quiz: ${(error as Error).message || String(error)}`,
        };
    }
}

export const finishQuiz = async (teamId: string, end_time: Date) => {
    // Use a transaction to read start_time and update fields atomically
    try {
        const teamDocRef = doc(firebasedb, 'teams', teamId);

        // fetch answers for the team and compute sum of `mark`
        const answersRes = await getAnswersByTeamId(teamId);
        let marksScore = 0;
        if (answersRes?.success && Array.isArray(answersRes.answers)) {
            marksScore = answersRes.answers.reduce((acc: number, a: any) => acc + Number(a.mark || 0), 0);
        }

        await runTransaction(firebasedb, async (transaction) => {
            const teamSnap = await transaction.get(teamDocRef);
            if (!teamSnap.exists()) {
                throw new Error("Team not found");
            }

            const data = teamSnap.data() as any;
            const startRaw = data.start_time;

            // Normalize start_time (could be a Firestore Timestamp or a Date)
            const startDate =
                startRaw instanceof Date
                    ? startRaw
                    : startRaw && typeof startRaw.toDate === "function"
                        ? startRaw.toDate()
                        : null;

            // If start_time is missing, fall back to marksScore as totalScore
            if (!startDate) {
                const totalScore = marksScore;
                transaction.update(teamDocRef, { end_time, isCompleted: true, marksScore, totalScore });
                return;
            }

            const durationSeconds = Math.max(0, Math.floor((end_time.getTime() - startDate.getTime()) / 1000));

            // Example scoring: subtract 1 point per full minute taken (adjust formula as needed)
            const timePenalty = Math.floor(durationSeconds / 60);
            const totalScore = Math.max(0, marksScore - timePenalty);

            transaction.update(teamDocRef, { end_time, isCompleted: true, marksScore, totalScore });
        });

        return {
            success: true,
            message: "Quiz finished successfully",
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to finish quiz: ${(error as Error).message || String(error)}`,
        };
    }
}

export const getTeamById = async (teamId: string) => {
    try {
        const teamDocRef = doc(firebasedb, 'teams', teamId);
        const snap = await getDoc(teamDocRef);

        if (!snap.exists()) {
            return {
                success: false,
                message: "Team not found",
            };
        }

        const data = snap.data() as any;
        // include id and return
        const team = { id: snap.id, ...data };
        return {
            success: true,
            team,
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to fetch team: ${(error as Error).message || String(error)}`,
        };
    }
}

// ====== Round 2 Functions ======
// These NEVER touch Round 1 fields (marksScore, isStarted, isCompleted, start_time, end_time, questions)

export const promoteToRound2 = async (teamId: string) => {
    try {
        const teamDocRef = doc(firebasedb, 'teams', teamId);

        // Fetch all questions and filter for round 2
        const questionsCol = collection(firebasedb, "questions");
        const snapshot = await getDocs(questionsCol);
        const r2QuestionIds = snapshot.docs
            .filter((d) => (d.data() as any).round === 2)
            .map((d) => d.id);

        if (r2QuestionIds.length === 0) {
            return {
                success: false,
                message: "No Round 2 questions found. Add questions with round=2 first.",
            };
        }

        // Shuffle using Fisher-Yates
        const shuffle = <T,>(arr: T[]) => {
            const a = arr.slice();
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        };
        const shuffledR2 = shuffle(r2QuestionIds);

        // Promote team — writes ONLY Round 2 fields, Round 1 data is untouched
        await updateDoc(teamDocRef, {
            currentRound: 2,
            qualifiedForRound2: true,
            round2Questions: shuffledR2,
            round2Score: 0,
            round2TotalScore: 0,
            round2Started: false,
            round2Completed: false,
            round2_start_time: null,
            round2_end_time: null,
        });

        return {
            success: true,
            message: `Team promoted to Round 2 with ${shuffledR2.length} questions.`,
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to promote team: ${(error as Error).message || String(error)}`,
        };
    }
}

export const startRound2 = async (teamId: string, start_time: Date) => {
    try {
        const teamDocRef = doc(firebasedb, 'teams', teamId);

        await runTransaction(firebasedb, async (transaction) => {
            const teamSnap = await transaction.get(teamDocRef);
            if (!teamSnap.exists()) {
                throw new Error("Team not found");
            }

            const data = teamSnap.data() as any;
            if (!data.qualifiedForRound2) {
                throw new Error("Team not qualified for Round 2");
            }
            if (data.round2Started) {
                throw new Error("Round 2 already started for this team");
            }

            transaction.update(teamDocRef, { round2_start_time: start_time, round2Started: true });
        });

        return {
            success: true,
            message: "Round 2 started successfully",
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to start Round 2: ${(error as Error).message || String(error)}`,
        };
    }
}

export const finishRound2 = async (teamId: string, end_time: Date) => {
    try {
        const teamDocRef = doc(firebasedb, 'teams', teamId);

        // fetch answers for the team
        const answersRes = await getAnswersByTeamId(teamId);

        await runTransaction(firebasedb, async (transaction) => {
            const teamSnap = await transaction.get(teamDocRef);
            if (!teamSnap.exists()) {
                throw new Error("Team not found");
            }

            const data = teamSnap.data() as any;
            const r2QuestionSet = new Set<string>(data.round2Questions || []);

            // Sum ONLY round 2 answer marks (ignore round 1 answers)
            let round2Score = 0;
            if (answersRes?.success && Array.isArray(answersRes.answers)) {
                round2Score = answersRes.answers
                    .filter((a: any) => r2QuestionSet.has(a.questionId))
                    .reduce((acc: number, a: any) => acc + Number(a.mark || 0), 0);
            }

            const startRaw = data.round2_start_time;
            const startDate =
                startRaw instanceof Date
                    ? startRaw
                    : startRaw && typeof startRaw.toDate === "function"
                        ? startRaw.toDate()
                        : null;

            if (!startDate) {
                transaction.update(teamDocRef, {
                    round2_end_time: end_time,
                    round2Completed: true,
                    round2Score,
                    round2TotalScore: round2Score,
                });
                return;
            }

            const durationSeconds = Math.max(0, Math.floor((end_time.getTime() - startDate.getTime()) / 1000));
            const timePenalty = Math.floor(durationSeconds / 60);
            const round2TotalScore = Math.max(0, round2Score - timePenalty);

            transaction.update(teamDocRef, {
                round2_end_time: end_time,
                round2Completed: true,
                round2Score,
                round2TotalScore,
            });
        });

        return {
            success: true,
            message: "Round 2 finished successfully",
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to finish Round 2: ${(error as Error).message || String(error)}`,
        };
    }
}