import { addDoc, collection, doc, getDocs, runTransaction, updateDoc } from "firebase/firestore"
import { firebasedb } from "./firebase.config"

interface Team {
    teamId: string
    teamName: string
    teamMembers: TeamMember[]
    questions: string[]
    isStarted: boolean
    isCompleted: boolean
    start_time: Date | null
    end_time: Date | null
    marksScore: number | null
    totalScore: number | null
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

        // Map to question IDs (or change to use a field like 'text' if you prefer)
        const questionIds = snapshot.docs.map((d) => d.id);

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

export const finishQuiz = async (teamId: string, end_time: Date, marksScore: number) => {
    // Use a transaction to read start_time and update fields atomically
    try {
        const teamDocRef = doc(firebasedb, 'teams', teamId);

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