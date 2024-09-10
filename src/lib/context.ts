import { BanchoClient } from "bancho.js";
import { Database } from "./database";

export interface ContextOptions {
  client: BanchoClient;
  database: Database;
  prefix?: string;
}

export class Context {
  readonly client: BanchoClient;
  readonly database: Database;
  readonly prefix: string;

  constructor(options: ContextOptions) {
    this.client = options.client;
    this.prefix = options.prefix ?? "!";
    this.database = options.database;
  }
}
