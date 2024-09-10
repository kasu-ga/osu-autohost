import { MultiScore } from "nodesu";
import { BeatmapModel, ScoreModel } from "./database";
import {
  calculateAccuracy,
  calculatePerformance,
  calculateRank,
  GameMode,
  getBeatmap,
  transformModsToString,
} from "@kasuga/osu-utils";

async function getScorePerformance(
  beatmapId: number,
  gamemode: GameMode,
  accuracy: number,
  multiScore: MultiScore
) {
  const performanceBeatmap = await getBeatmap(beatmapId, gamemode);
  const performance = calculatePerformance(performanceBeatmap, {
    accuracy,
    combo: multiScore.maxCombo,
    misses: multiScore.countMiss,
    mods: multiScore.enabledMods,
  });
  return performance.pp;
}

export async function transformScoreToString(
  rs: ScoreModel | MultiScore,
  beatmap: BeatmapModel,
  gamemode: GameMode
) {
  const isMultiScore = !("rank" in rs);
  const modsInt = isMultiScore ? rs.enabledMods : rs.mods;
  const mods = modsInt ? transformModsToString(modsInt) : null;
  const accuracy = isMultiScore
    ? calculateAccuracy({
        mode: gamemode,
        count300: rs.count300,
        count100: rs.count100,
        count50: rs.count50,
        countMiss: rs.countMiss,
        k: rs.countKatu,
        g: rs.countGeki,
      })
    : rs.accuracy;
  const rank = isMultiScore
    ? calculateRank({
        mode: gamemode,
        count300: rs.count300,
        count100: rs.count100,
        count50: rs.count50,
        countMiss: rs.countMiss,
        accuracy,
      })
    : rs.rank;
  const performance = isMultiScore
    ? await getScorePerformance(beatmap.id, gamemode, accuracy, rs)
    : rs.performance;
  return `[https://osu.ppy.sh/beatmapsets/${beatmap.setId} ${beatmap.title}]${
    mods ? ` + ${mods}` : ""
  } | [${rank}] ${accuracy.toFixed(2)}% | ${performance.toFixed(0)}pp | x${
    rs.maxCombo
  }/${beatmap.maxCombo} | [${rs.count300}/${rs.count100}/${rs.count50}/${
    rs.countMiss
  }]`;
}
