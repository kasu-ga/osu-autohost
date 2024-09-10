import { formatTime } from "../lib/formater";
import type { Game } from "../lib/game";

export function UserPlayTime(game: Game) {
  const playtimes: Record<number, number> = {};
  game.on("join", (user) => {
    playtimes[user.id] = Date.now();
  });
  game.on("leave", async (user) => {
    const currentTime = Date.now() - playtimes[user.id];
    delete playtimes[user.id];
    await game.context.database.users.update(user.id, {
      playtime: currentTime + user.playtime,
    });
  });
  game.commands.push({
    name: "playtime",
    description: "Get the current and total playing time. ",
    shortname: "pt",
    run: async (user) => {
      const currentTime = Date.now() - playtimes[user.id];
      const totalTime = user.playtime + currentTime;
      const currentTimeFormated = formatTime(currentTime);
      const totalTimeFormated = formatTime(totalTime);
      await game.reply(
        user,
        `Current time: ${currentTimeFormated}; total time: ${totalTimeFormated}`
      );
    },
  });
}
