import { BanchoLobby } from "bancho.js";
import { Context } from "./context";
import { BeatmapModel, UserModel } from "./database";
import EventEmitter from "events";
import { calculatePerformance, GameMode, getBeatmap } from "@kasuga/osu-utils";

export interface GameCommand {
  name: string;
  description: string;
  args?: string;
  role?: "user" | "admin";
  shortname?: string;
  run: (user: UserModel, ...args: string[]) => Promise<void>;
}

interface GameEvents {
  join: (user: UserModel) => void;
  leave: (user: UserModel) => void;
  finished: () => void;
  playing: () => void;
  beatmap: (beatmap: BeatmapModel) => void;
  gamemode: (gamemode: 0 | 1 | 2 | 3) => void;
  message: (user: UserModel, content: string) => void;
  close: () => void;
  host: (user: UserModel | null) => void;
}

export class Game extends EventEmitter {
  readonly id: string;
  readonly commands: GameCommand[] = [
    {
      name: "help",
      description: "Returns the list of available commands.",
      run: async (user, admin) => {
        const banchoUser = await this.context.client.getUser(user.username);
        await banchoUser.sendMessage(`Hi ${user.username}! My commands are:`);
        const commands = this.commands.filter(
          (u) => u.role === (admin === "-a" ? "admin" : "user")
        );
        for (const command of commands) {
          const name = `${command.name}${
            command.shortname ? `/${command.shortname}` : ""
          }${command.args ? ` ${command.args}` : ""}`;
          await banchoUser.sendMessage(`${name} ${command.description}`);
        }
      },
    },
  ];
  readonly context: Context;
  readonly lobby: BanchoLobby;
  public beatmap: BeatmapModel | null = null;
  public gamemode: GameMode = 0;

  constructor(id: string, lobby: BanchoLobby, context: Context) {
    super();
    this.id = id;
    this.context = context;
    this.lobby = lobby;

    lobby.on("playerJoined", async ({ player }) => {
      if (!player.user.username) return;
      const user = await this.context.database.users.findOrCreate(player.user);
      if (user.isBanned) {
        await lobby.kickPlayer(`#${user.id}`);
        return;
      }
      this.emit("join", user);
    });

    lobby.on("host", async (player) => {
      if (!player.user.username) return;
      const user = await this.context.database.users.findOrCreate(player.user);
      this.emit("host", user);
    });

    lobby.channel.on("message", async ({ content, user: banchoUser }) => {
      if (!banchoUser.username) return;
      const user = await this.context.database.users.findOrCreate(banchoUser);
      this.emit("message", user, content);
      if (!content.startsWith(this.context.prefix)) return;
      const [commandName, ...args] = content.slice(1).split(" ");
      const command = this.commands.find(
        (cmd) => cmd.name === commandName || cmd.shortname === commandName
      );
      if (!command) return;
      if (command.role === "admin" && !user.isAdmin) return;
      await command.run(user, ...args);
    });

    lobby.on("gamemode", (gamemode) => {
      this.gamemode = (gamemode as any) ?? 0;
      this.emit("gamemode", this.gamemode);
    });

    lobby.on("beatmap", async (nodesuBeatmap) => {
      if (!nodesuBeatmap || !nodesuBeatmap.id) return;
      let beatmap = await context.database.beatmaps.findOne(nodesuBeatmap.id);
      if (!beatmap) {
        const performanceBeatmap = await getBeatmap(
          nodesuBeatmap.id,
          this.gamemode
        );
        const pp100 = calculatePerformance(performanceBeatmap, {
          accuracy: 100,
        }).pp;
        const pp98 = calculatePerformance(performanceBeatmap, {
          accuracy: 98,
        }).pp;
        const pp95 = calculatePerformance(performanceBeatmap, {
          accuracy: 95,
        }).pp;
        beatmap = await this.context.database.beatmaps.create({
          id: nodesuBeatmap.id,
          setId: nodesuBeatmap.setId,
          AR: nodesuBeatmap.AR,
          CS: nodesuBeatmap.CS,
          HP: nodesuBeatmap.HP,
          OD: nodesuBeatmap.OD,
          bpm: nodesuBeatmap.bpm,
          maxCombo: nodesuBeatmap.maxCombo,
          title: nodesuBeatmap.title,
          approved: nodesuBeatmap.approved,
          totalLength: nodesuBeatmap.totalLength,
          stars: parseFloat(nodesuBeatmap.difficultyRating.toFixed(2)),
          pp100,
          pp98,
          pp95,
        });
      }
      this.beatmap = beatmap;
      this.emit("beatmap", beatmap);
    });

    lobby.on("matchStarted", () => {
      this.emit("playing");
    });

    lobby.on("matchFinished", async () => {
      this.emit("finished");
    });

    lobby.on("playerLeft", async (player) => {
      if (!player.user.username) return;
      const user = await this.context.database.users.findOrCreate(player.user);
      if (user.isBanned) return;
      this.emit("leave", user);
    });
  }

  async close() {
    await this.lobby.closeLobby();
    this.emit("close");
  }

  async message(content: string) {
    await this.lobby.channel.sendMessage(content);
  }

  async reply(user: UserModel, content: string) {
    await this.message(`${user.username} -> ${content}`);
  }

  set(...modules: ((game: Game) => void)[]) {
    for (const module of modules) {
      module(this);
    }
  }

  on<K extends keyof GameEvents>(event: K, listener: GameEvents[K]): this {
    return super.on(event, listener);
  }

  emit<K extends keyof GameEvents>(
    event: K,
    ...args: Parameters<GameEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }
}
