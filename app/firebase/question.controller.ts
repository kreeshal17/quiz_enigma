import { addDoc, collection, doc, getDoc, updateDoc } from "firebase/firestore"
import { firebasedb } from "./firebase.config"

interface Question {
    id: string
    question: string
    options: string[]
    difficulty: "EASY" | "MEDIUM" | "HARD"
    rewardPoints: 5 | 10 | 15
    penaltyPoints: 2 | 5 | 10
    answerIndex: number
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
            message: `Failed to create question: ${error.message}`,
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
            message: `Failed to update question: ${error.message}`,
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
            message: `Failed to fetch question: ${error.message}`,
        };
    }
}