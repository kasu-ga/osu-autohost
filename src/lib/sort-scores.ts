import { ScoreModel } from "./database";

export function sortScores({
  scores,
  scoringType,
}: {
  scores: ScoreModel[];
  scoringType: number;
  gamemode: number;
}): ScoreModel[] {
  switch (scoringType) {
    case 0: // ScoreV1
      return scores.sort((a, b) => b.score - a.score);
    case 1: // ScoreV2
      return scores.sort((a, b) => {
        return b.accuracy - a.accuracy || b.score - a.score;
      });
    case 2: // Accuracy
      return scores.sort((a, b) => b.accuracy - a.accuracy);
    case 3: // Combo
      return scores.sort((a, b) => b.maxCombo - a.maxCombo);
    default:
      return scores;
  }
}
