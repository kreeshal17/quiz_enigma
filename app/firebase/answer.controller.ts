interface Answer {
    id: string
    teamId: string
    questionId: string
    selectedOptionIndex: number
    isCorrect: boolean
    timestamp: Date
}

// Create new answer only if team.isStarted is true and team.isCompleted is false
export const createAnswer = async (answer: Answer) => { }

// Update answer only if team.isStarted is true and team.isCompleted is false
export const updateAnswer = async (answerId: string, answerData: Answer) => { }