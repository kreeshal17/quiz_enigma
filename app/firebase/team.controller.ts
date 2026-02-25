interface Team{
    teamId : string
    teamName : string
    teamMembers : TeamMember[]
    questions : string[]
    isStarted : boolean
    isCompleted : boolean
    start_time : Date | null
    end_time : Date | null
    marksScore : number | null
    totalScore : number | null
}

interface TeamMember {
    name : string
    email : string
}

export const createTeam = async(team : Team) => {}

export const startQuiz = async(teamId : string , start_time : Date) => {
    // TODO : use transaction and set start_time and isStarted simultaneously
}

export const finishQuiz = async(teamId : string , end_time : Date,marksScore : number , totalScore : number) => {
    // TODO : use transaction to set isCompleted , end_time and marks simultaneously
}