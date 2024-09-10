import { UserModel } from "../lib/database";
import type { Game } from "../lib/game";

interface Votes {
  skip: number[];
  start: number[];
}

export function AutohostRotate(game: Game) {
  const queue: UserModel[] = [];
  const votes: Votes = {
    skip: [],
    start: [],
  };
  const setHost = async () => {
    const nextHost = queue[0];
    await game.lobby.setHost(`#${nextHost.id}`);
  };
  const nextHost = async () => {
    const currentHost = queue[0];
    queue.push(currentHost);
    queue.splice(0, 1);
    await setHost();
  };
  game.on("join", async (user) => {
    if (user.autoskip) return;
    queue.push(user);
    const host = game.lobby.getHost();
    if (host?.user) return;
    await setHost();
  });
  game.on("leave", async (user) => {
    const index = queue.findIndex((u) => u.id === user.id);
    if (index === -1) return;
    queue.splice(index, 1);
    if (!user.isHost) return;
    await setHost();
  });
  game.on("playing", async () => {
    votes.skip = [];
    votes.start = [];
    await nextHost();
  });
  game.commands.push(
    {
      name: "queue",
      description: "Shows the current host queue.",
      shortname: "q",
      run: async () => {
        await game.message(
          `Queue: ${queue
            .slice(0, 5)
            .map((u) => u.username)
            .join(", ")}${queue.length > 5 ? "..." : ""}`
        );
      },
    },
    {
      name: "queuepos",
      description: "Returns the user's position in the host queue.",
      shortname: "qp",
      run: async (user) => {
        const position = queue.findIndex((u) => u.id === user.id) + 1;
        await game.reply(user, `your position is: ${position}`);
      },
    },
    {
      name: "forceskip",
      description: "Forces to jump to the next host in line.",
      shortname: "fs",
      role: "admin",
      run: async () => {
        await nextHost();
      },
    },
    {
      name: "skip",
      description: "Skip your turn or start a vote to skip the host.",
      shortname: "s",
      run: async (user) => {
        const currentHost = queue[0];
        if (currentHost.id === user.id) {
          await nextHost();
          return;
        }
        const votesRequired = queue.length / 2 + 1;
        const userAlreadyVoted = votes.skip.find((u) => u === user.id);
        if (userAlreadyVoted) return;
        votes.skip.push(user.id);
        const votesTotal = votes.skip.length;
        await game.reply(
          user,
          `Votes to skip (${votesTotal}/${votesRequired})`
        );
        if (votesTotal < votesRequired) return;
        votes.skip = [];
        await nextHost();
      },
    },
    {
      name: "start",
      description: "Set a countdown or start a vote to start.",
      args: "<time?>",
      run: async (user, time = "0") => {
        const currentHost = queue[0];
        if (currentHost.id === user.id) {
          const timeValue = parseInt(time);
          if (Number.isNaN(timeValue)) {
            await game.reply(user, "invalid time value");
            return;
          }
          if (timeValue > 5) {
            await game.message('Host can use "abort" command to cancel');
          }
          await game.lobby.startMatch(timeValue);
          return;
        }
        const votesRequired = queue.length / 2 + 1;
        const userAlreadyVoted = votes.start.find((u) => u === user.id);
        if (userAlreadyVoted) return;
        votes.start.push(user.id);
        const votesTotal = votes.start.length;
        await game.reply(
          user,
          `Votes to start (${votesTotal}/${votesRequired})`
        );
        if (votesTotal < votesRequired) return;
        votes.start = [];
        await game.lobby.startMatch(0);
      },
    },
    {
      name: "abort",
      description: "Cancels the game start countdown.",
      run: async (user) => {
        const currentHost = queue[0];
        if (currentHost.id !== user.id) return;
        await game.lobby.abortMatch();
        await game.message("Match aborted");
      },
    },
    {
      name: "autoskip",
      description: "Activate or disable autoskip.",
      run: async (user, status) => {
        if (!status) status = status.toLowerCase().trim();
        await game.context.database.users.update(user.id, {
          autoskip: status ? (status === "off" ? false : true) : !user.autoskip,
        });
      },
    }
  );
}
