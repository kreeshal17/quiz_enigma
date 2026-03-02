import { addDoc, collection, doc, getDoc, updateDoc } from "firebase/firestore"
import { firebasedb } from "./firebase.config"

interface Question {
    question: string
    options: string[]
    difficulty: "EASY" | "MEDIUM" | "HARD"
    rewardPoints: number
    penaltyPoints: number
    answerIndex: number
    round?: 1 | 2
}

export const createQuestion = async (question: Question) => {
    try {
        const questionsRef = collection(firebasedb, 'questions');

        // Add the new question to the Firestore collection
        const docRef = await addDoc(questionsRef, question);

        // Return success response with the document ID
        return {
            success: true,
            message: "Question created successfully",
            questionId: docRef.id,
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to create question: ${(error as Error).message}`,
        };
    }
}

export const updateQuestion = async (questionId: string, questionData: Question) => {
    try {
        // Reference to the specific question document in Firestore
        const questionDocRef = doc(firebasedb, 'questions', questionId);

        // Update the question document with the provided data
        await updateDoc(questionDocRef, { ...questionData });

        // Return success response
        return {
            success: true,
            message: "Question updated successfully",
        };
    } catch (error) {
        // Handle errors and return failure response
        return {
            success: false,
            message: `Failed to update question: ${(error as Error).message}`,
        };
    }
}

export const getQuestionById = async (questionId: string) => {
    try {
        // Reference to the specific question document in Firestore
        const questionDocRef = doc(firebasedb, 'questions', questionId);

        // Fetch the question document from Firestore
        const questionSnapshot = await getDoc(questionDocRef);

        if (!questionSnapshot.exists()) {
            return {
                success: false,
                message: "Question not found",
            };
        }

        const questionData = questionSnapshot.data();

        // Return success response with the populated question data
        return {
            success: true,
            message: "Question fetched successfully",
            question: questionData
        };
    } catch (error) {
        // Handle errors and return failure response
        return {
            success: false,
            message: `Failed to fetch question: ${(error as Error).message}`,
        };
    }
}

export const getAllQuestions = async (teamId: string, round: 1 | 2 = 1) => {
    try {
        // Fetch team doc to read its questions array
        const teamDocRef = doc(firebasedb, 'teams', teamId);
        const teamSnap = await getDoc(teamDocRef);

        if (!teamSnap.exists()) {
            return {
                success: false,
                message: "Team not found",
            };
        }

        const teamData = teamSnap.data() as any;
        const questionsField = round === 2 ? 'round2Questions' : 'questions';
        const questionIds: string[] = Array.isArray(teamData?.[questionsField]) ? teamData[questionsField] : [];

        if (questionIds.length === 0) {
            return {
                success: true,
                questions: [],
            };
        }

        // Fetch each question doc in parallel
        const questionPromises = questionIds.map(async (qid) => {
            const qSnap = await getDoc(doc(firebasedb, 'questions', qid));
            if (!qSnap.exists()) return null;
            return { id: qSnap.id, ...(qSnap.data() as any) };
        });

        const questionResults = await Promise.all(questionPromises);
        const questions = questionResults.filter(Boolean) as any[];

        return {
            success: true,
            questions,
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to fetch questions: ${(error as Error).message || String(error)}`,
        };
    }
}