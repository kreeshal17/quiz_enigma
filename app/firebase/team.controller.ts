import { doc, getDoc, updateDoc, runTransaction } from "firebase/firestore";
import { firebasedb } from "./firebase.config";

// ── Types ──────────────────────────────────────────────

export interface TeamData {
    team_name: string | null;
    is_logged_in: boolean;
    has_submitted: boolean;
    score: number;
    completion_time: number | null;
}

export interface LoginResult {
    success: boolean;
    message: string;
    needsTeamName?: boolean;
    teamName?: string | null;
}

// ── Validate Team ID format ────────────────────────────

export const validateTeamIdFormat = (teamId: string): string | null => {
    if (!teamId || teamId.trim().length === 0) {
        return "Team ID is required.";
    }
    const id = teamId.trim().toUpperCase();
    if (id.length !== 5) {
        return "Team ID must be 5 uppercase letters.";
    }
    if (!/^[A-Z]{5}$/.test(id)) {
        return "Team ID must be 5 uppercase letters.";
    }
    return null; // valid
};

// ── Look up team & check status ────────────────────────

export const verifyTeamLogin = async (teamId: string): Promise<LoginResult> => {
    const id = teamId.trim().toUpperCase();

    try {
        const teamRef = doc(firebasedb, "teams", id);
        const snapshot = await getDoc(teamRef);

        if (!snapshot.exists()) {
            return { success: false, message: "Invalid Team ID." };
        }

        const data = snapshot.data() as TeamData;

        if (data.has_submitted) {
            return { success: false, message: "Quiz already submitted." };
        }

        if (data.is_logged_in) {
            return { success: false, message: "This Team ID is already active." };
        }

        // Team exists and is available
        if (!data.team_name) {
            return { success: true, message: "Team name required.", needsTeamName: true };
        }

        return { success: true, message: "OK", needsTeamName: false, teamName: data.team_name };
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return { success: false, message: `Something went wrong: ${msg}` };
    }
};

// ── Save team name + set is_logged_in (transaction) ────

export const saveTeamNameAndLogin = async (
    teamId: string,
    teamName: string
): Promise<LoginResult> => {
    const id = teamId.trim().toUpperCase();
    const name = teamName.trim();

    // Validate team name
    if (name.length < 3 || name.length > 30) {
        return { success: false, message: "Team name must be 3–30 characters." };
    }
    if (!/^[a-zA-Z0-9 ]+$/.test(name)) {
        return { success: false, message: "Letters, numbers and spaces only." };
    }

    try {
        const teamRef = doc(firebasedb, "teams", id);

        await runTransaction(firebasedb, async (transaction) => {
            const snapshot = await transaction.get(teamRef);
            if (!snapshot.exists()) throw new Error("Invalid Team ID.");

            const data = snapshot.data() as TeamData;
            if (data.has_submitted) throw new Error("Quiz already submitted.");
            if (data.is_logged_in) throw new Error("This Team ID is already active.");
            if (data.team_name) throw new Error("Team name already set.");

            transaction.update(teamRef, {
                team_name: name,
                is_logged_in: true,
            });
        });

        return { success: true, message: "OK" };
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return { success: false, message: msg };
    }
};

// ── Login existing team (already has name) ─────────────

export const loginTeam = async (teamId: string): Promise<LoginResult> => {
    const id = teamId.trim().toUpperCase();

    try {
        const teamRef = doc(firebasedb, "teams", id);

        await runTransaction(firebasedb, async (transaction) => {
            const snapshot = await transaction.get(teamRef);
            if (!snapshot.exists()) throw new Error("Invalid Team ID.");

            const data = snapshot.data() as TeamData;
            if (data.has_submitted) throw new Error("Quiz already submitted.");
            if (data.is_logged_in) throw new Error("This Team ID is already active.");

            transaction.update(teamRef, { is_logged_in: true });
        });

        return { success: true, message: "OK" };
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return { success: false, message: msg };
    }
};

// ── Submit quiz ────────────────────────────────────────

export const submitQuiz = async (
    teamId: string,
    score: number,
    completionTime: number
): Promise<{ success: boolean; message: string }> => {
    const id = teamId.trim().toUpperCase();

    try {
        const teamRef = doc(firebasedb, "teams", id);

        await runTransaction(firebasedb, async (transaction) => {
            const snapshot = await transaction.get(teamRef);
            if (!snapshot.exists()) throw new Error("Invalid Team ID.");

            const data = snapshot.data() as TeamData;
            if (data.has_submitted) throw new Error("Quiz already submitted.");

            transaction.update(teamRef, {
                score,
                completion_time: completionTime,
                has_submitted: true,
                is_logged_in: false,
            });
        });

        return { success: true, message: "Quiz submitted successfully." };
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        return { success: false, message: msg };
    }
};