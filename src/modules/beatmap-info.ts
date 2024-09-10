import { getApprovalStatus } from "@kasuga/osu-utils";
import { Game } from "../lib/game";
import { formatSeconds } from "../lib/formater";

export interface BeatmapInfoOptions {
  minLength?: number;
  maxLength?: number;
  mindiff: number;
  maxdiff: number;
}

export function BeatmapInfo({
  minLength,
  maxLength,
  mindiff,
  maxdiff,
}: BeatmapInfoOptions) {
  return (game: Game) => {
    let lastBeatmapId = game.beatmap?.id;

    async function setLastBeatmap() {
      if (!lastBeatmapId) return;
      await game.lobby.setMap(lastBeatmapId);
    }

    game.on("beatmap", async (beatmap) => {
      if (minLength && beatmap.totalLength < minLength) {
        await setLastBeatmap();
        return;
      }

      if (maxLength && beatmap.totalLength > maxLength) {
        await setLastBeatmap();
        return;
      }

      if (mindiff && beatmap.stars < mindiff) {
        await setLastBeatmap();
        return;
      }

      if (maxdiff && beatmap.stars > maxdiff) {
        await setLastBeatmap();
        return;
      }

      lastBeatmapId = beatmap.id;
      const link = `Beatmap: [https://osu.ppy.sh/beatmapsets/${beatmap.setId} ${beatmap.title}] ([https://osu.direct/d/${beatmap.setId} Osu Direct])`;
      const approved = getApprovalStatus(beatmap.approved);
      const formatedSeconds = formatSeconds(beatmap.totalLength);
      const info1 = `Star Rating: ${beatmap.stars.toFixed(
        2
      )} | ${approved} | Length: ${formatedSeconds} | BPM: ${beatmap.bpm}`;
      await game.message(link);
      await game.message(info1);
      await game.message(
        `AR: ${beatmap.AR} | CS: ${beatmap.CS} | OD: ${beatmap.OD} | HP: ${
          beatmap.HP
        } | 100% ${beatmap.pp100.toFixed(2)}pp | 98% ${beatmap.pp98.toFixed(
          2
        )}pp | 95% ${beatmap.pp95.toFixed(2)}pp`
      );
    });

    game.commands.push(
      {
        name: "mindiff",
        description: "Set the minimum difficulty of the lobby.",
        shortname: "mnd",
        args: "<value>",
        role: "admin",
        run: async (user, value) => {
          const newMinDiff = parseInt(value);
          if (Number.isNaN(newMinDiff) || newMinDiff < 0) {
            await game.reply(user, "invalid mindiff value");
            return;
          }
          mindiff = newMinDiff;
          await game.message(`The new minimum difficulty is ${newMinDiff}`);
        },
      },
      {
        name: "maxdiff",
        description: "Set the maximum difficulty of the lobby.",
        shortname: "mxd",
        args: "<value>",
        role: "admin",
        run: async (user, value) => {
          const newMaxDiff = parseInt(value);
          if (
            Number.isNaN(newMaxDiff) ||
            newMaxDiff < 0 ||
            newMaxDiff < (mindiff ?? 0)
          ) {
            await game.reply(user, "invalid maxdiff value");
            return;
          }
          maxdiff = newMaxDiff;
          await game.message(`The new minimum difficulty is ${newMaxDiff}`);
        },
      },
      {
        name: "minlength",
        description: "Set the minimum duration of the maps.",
        shortname: "mnl",
        args: "<value>",
        role: "admin",
        run: async (user, value) => {
          const newMinLength = parseInt(value);
          if (Number.isNaN(newMinLength) || newMinLength < 0) {
            await game.reply(user, "invalid minLength value");
            return;
          }
          minLength = newMinLength;
          await game.message(`The new minimum length is ${newMinLength}`);
        },
      },
      {
        name: "maxlength",
        description: "Set the maximum duration of the maps.",
        shortname: "mxl",
        args: "<value>",
        role: "admin",
        run: async (user, value) => {
          const newMaxLength = parseInt(value);
          if (Number.isNaN(newMaxLength) || newMaxLength < 0) {
            await game.reply(user, "invalid maxLength value");
            return;
          }
          maxLength = newMaxLength;
          await game.message(`The new maximum length is ${newMaxLength}`);
        },
      },
      {
        name: "config",
        description: "Returns the settings defined in the lobby.",
        shortname: "c",
        run: async (user) => {
          await game.reply(
            user,
            `MinDiff: ${mindiff} | MaxDiff: ${maxdiff} ${
              minLength ? `| Min Length: ${formatSeconds(minLength)}` : ""
            } ${maxLength ? `| Max Length: ${formatSeconds(maxLength)}` : ""}`
          );
        },
      }
    );
  };
}
