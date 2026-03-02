import { collection, doc, getDocs, query, runTransaction, where } from "firebase/firestore"
import { firebasedb } from "./firebase.config"

interface Answer {
    teamId: string
    questionId: string
    selectedOptionIndex: number
    // isCorrect: boolean
    // mark : number
    timestamp: Date
}

export const createAnswer = async (answer: Answer) => {
    try {
        const answerDocId = `${answer.teamId}_${answer.questionId}`;
        const answerDocRef = doc(firebasedb, "answers", answerDocId);
        const questionDocRef = doc(firebasedb, "questions", answer.questionId);
        const teamDocRef = doc(firebasedb, "teams", answer.teamId);

        console.log(answer);
                

        await runTransaction(firebasedb, async (transaction) => {
            const qSnap = await transaction.get(questionDocRef);
            if (!qSnap.exists()) {
                throw new Error("Question not found");
            }
            const questionData = qSnap.data() as any;

            const tSnap = await transaction.get(teamDocRef);
            if (!tSnap.exists()) {
                throw new Error("Team not found");
            }
            const teamData = tSnap.data() as any;

            const existingAnsSnap = await transaction.get(answerDocRef);            
            const isCorrect = (answer.selectedOptionIndex === questionData.answerIndex);
            const mark = isCorrect ? Number(questionData.rewardPoints || 0) : -Number(questionData.penaltyPoints || 0);

            // Use separate score field for each round — Round 1 marksScore is NEVER overwritten by Round 2
            const isRound2 = teamData.currentRound === 2;
            const scoreField = isRound2 ? 'round2Score' : 'marksScore';

            if (existingAnsSnap.exists()) {
                const prev = existingAnsSnap.data() as any;
                const prevMark = typeof prev.mark === "number" ? prev.mark : 0;

                // update answer doc
                transaction.update(answerDocRef, {
                    selectedOptionIndex: answer.selectedOptionIndex,
                    isCorrect,
                    mark,
                    timestamp: answer.timestamp,
                });

                // update team's score by difference
                const newScore = (Number(teamData[scoreField] || 0) + (mark - prevMark));
                transaction.update(teamDocRef, { [scoreField]: newScore });
            } else {
                // create new answer doc
                transaction.set(answerDocRef, {
                    teamId: answer.teamId,
                    questionId: answer.questionId,
                    selectedOptionIndex: answer.selectedOptionIndex,
                    isCorrect,
                    mark,
                    timestamp: answer.timestamp,
                });

                // increment team's score
                const newScore = Number(teamData[scoreField] || 0) + mark;
                transaction.update(teamDocRef, { [scoreField]: newScore });
            }
        });
        console.log('controller here2');

        return {
            success: true,
            message: "Answer recorded",
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to record answer: ${(error as Error).message || String(error)}`,
        };
    }
}

export const getAnswersByTeamId = async (teamId: string) => {
    try {
        const answersCol = collection(firebasedb, "answers");
        const q = query(answersCol, where("teamId", "==", teamId));
        const snap = await getDocs(q);

        const answers = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
        }));

        return {
            success: true,
            answers,
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to fetch answers: ${(error as Error).message || String(error)}`,
        };
    }
}