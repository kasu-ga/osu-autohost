import { Beatmap, MultiScore } from "nodesu";
import { BeatmapModel, ScoreModel } from "../lib/database";
import type { Game } from "../lib/game";
import {
  calculateAccuracy,
  calculatePerformance,
  calculateRank,
  getBeatmap,
} from "@kasuga/osu-utils";
import { transformScoreToString } from "../lib/score-to-string";
import {
  getAverageScore,
  transformAverageScoreToString,
} from "../lib/average-score";
import { sortScores } from "../lib/sort-scores";

export function UserStats(game: Game) {
  game.on("finished", async () => {
    const multi = await game.context.client.osuApi.multi.getMatch(
      game.lobby.id
    );
    if (!("games" in multi)) return;
    const lastGame = multi.games[multi.games.length - 1];
    const match = await game.context.database.matches.create(
      multi.match.id,
      game.id
    );
    const scores: ScoreModel[] = [];
    for (let index = 0; index < lastGame.scores.length; index++) {
      const multiScore = lastGame.scores[index];
      const accuracy = calculateAccuracy({
        mode: game.gamemode,
        count300: multiScore.count300,
        count100: multiScore.count100,
        count50: multiScore.count50,
        countMiss: multiScore.countMiss,
        k: multiScore.countKatu,
        g: multiScore.countGeki,
      });
      const rank = calculateRank({
        mode: game.gamemode,
        count300: multiScore.count300,
        count100: multiScore.count100,
        count50: multiScore.count50,
        countMiss: multiScore.countMiss,
        accuracy,
      });
      const performanceBeatmap = await getBeatmap(
        lastGame.beatmapId,
        game.gamemode
      );
      const performance = calculatePerformance(performanceBeatmap, {
        accuracy,
        combo: multiScore.maxCombo,
        misses: multiScore.countMiss,
        mods: multiScore.enabledMods,
      }).pp;
      const moment = Date.now();
      const score = await game.context.database.scores.create({
        ...multiScore,
        gameId: game.id,
        matchId: match.id,
        beatmapId: lastGame.beatmapId,
        rank,
        accuracy,
        performance,
        position: index + 1,
        moment,
      });
      scores.push(score);
    }
  });
  game.commands.push(
    {
      name: "playstats",
      description: "Return your games played and your victories (#1).",
      shortname: "ps",
      run: async (user) => {
        const userMatches = await game.context.database.scores.find({
          userId: user.id,
        });
        const wins = userMatches.reduce((value: number, score) => {
          if (score.position === 1) return value + 1;
          return value;
        }, 0);
        await game.reply(
          user,
          `Total matches: ${userMatches.length}; wins: ${wins}`
        );
      },
    },
    {
      name: "rs",
      description: "Returns your most recent result.",
      run: async (user) => {
        const rs = await game.context.database.scores.findLast(user.id);
        if (!rs) return;
        const beatmap = await game.context.database.beatmaps.findOne(
          rs.beatmapId
        );
        if (!beatmap) return;
        const data = await transformScoreToString(rs, beatmap, game.gamemode);
        await game.reply(user, `Recent score: ${data}`);
      },
    },
    {
      name: "mapstats",
      description: "Returns your average result on a map.",
      shortname: "ms",
      run: async (user) => {
        if (!game.beatmap) return;
        const scores = await game.context.database.scores.find({
          userId: user.id,
          beatmapId: game.lobby.beatmap.id,
        });
        const averageScore = getAverageScore(scores);
        if (!averageScore) {
          await game.reply(
            user,
            "You haven't played this map yet in this lobby."
          );
          return;
        }
        const data = transformAverageScoreToString(averageScore, game.beatmap);
        await game.reply(user, data);
      },
    },
    {
      name: "bestmapstats",
      description: "Get your highest score on a map.",
      shortname: "bms",
      run: async (user) => {
        if (!game.beatmap) return;
        const scores = await game.context.database.scores.find({
          userId: user.id,
          beatmapId: game.lobby.beatmap.id,
        });
        const scoresSorted = sortScores({
          scores,
          gamemode: game.gamemode,
          scoringType: 0,
        });
        const bestScore = scoresSorted[0];
        if (!bestScore) {
          await game.reply(
            user,
            "You haven't played this map yet in this lobby."
          );
          return;
        }
        const data = await transformScoreToString(
          bestScore,
          game.beatmap,
          game.gamemode
        );
        await game.reply(user, data);
      },
    }
  );
}
