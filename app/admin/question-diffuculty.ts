type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTY_PRESETS: Record<Difficulty, { rewardPoints: number; penaltyPoints: number }> = {
  easy: { rewardPoints: 10, penaltyPoints: 2 },
  medium: { rewardPoints: 20, penaltyPoints: 4 },
  hard: { rewardPoints: 50, penaltyPoints: 10 },
};