import { Context, ContextOptions } from "./context";
import { Game } from "./game";
import { generateId } from "./generate-id";

export interface ClientOptions extends ContextOptions {}

export class Client {
  readonly context: Context;
  readonly games: Game[] = [];

  constructor(options: ClientOptions) {
    this.context = new Context(options);
  }

  async createGame(
    name: string,
    password?: string,
    id?: string
  ): Promise<Game> {
    const multi = await this.context.client.createLobby(name);
    await multi.lobby.setPassword(password ?? "");
    if (!id) id = generateId();
    const game = new Game(id, multi.lobby, this.context);
    this.games.push(game);
    return game;
  }

  async closeGames() {
    for (const game of this.games) {
      await game.close();
    }
  }
}
