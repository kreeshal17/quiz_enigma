type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTY_PRESETS: Record<Difficulty, { rewardPoints: number; penaltyPoints: number }> = {
  easy: { rewardPoints: 5, penaltyPoints: 2 },
  medium: { rewardPoints: 10, penaltyPoints: 5 },
  hard: { rewardPoints: 20, penaltyPoints: 10 },
};