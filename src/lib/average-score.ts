import { transformModsToString } from "@kasuga/osu-utils";
import { BeatmapModel, ScoreModel } from "./database";

export function getAverageScore(scores: ScoreModel[]): ScoreModel | null {
  const rankCount: { [key: string]: number } = {};
  const rankScores: { [key: string]: ScoreModel[] } = {};

  scores.forEach((score) => {
    if (!rankCount[score.rank]) {
      rankCount[score.rank] = 0;
      rankScores[score.rank] = [];
    }
    rankCount[score.rank]++;
    rankScores[score.rank].push(score);
  });

  let mostFrequentRank = "";
  let maxCount = 0;
  for (const rank in rankCount) {
    if (rankCount[rank] > maxCount) {
      maxCount = rankCount[rank];
      mostFrequentRank = rank;
    }
  }

  if (!mostFrequentRank) {
    return null;
  }

  const topScore = rankScores[mostFrequentRank].reduce((prev, current) => {
    return prev.accuracy > current.accuracy ? prev : current;
  });

  return topScore;
}

export function transformAverageScoreToString(
  score: {
    mods?: number;
    rank: string;
    accuracy: number;
  },
  beatmap: BeatmapModel
) {
  return `[https://osu.ppy.sh/beatmapsets/${beatmap.setId} ${beatmap.title}]${
    score.mods ? ` + ${transformModsToString(score.mods)}` : ""
  } | You usually get a range of [${score.rank}] with ${score.accuracy.toFixed(
    2
  )}%`;
}
