# Osu Autohost

> Minimalist system to manage osu multiplayer games using Bancho.js

Osu Autohost is a minimalist and easy-to-use module that allows you to add different functionalities to multiplayer rooms created with [Bancho.js](https://bancho.js.org/).

With Osu Autohost you can create a room and add different modules that will provide specific functionality and commands for that [module](#modules).

## Installation

```bash
npm install osu-autohost
```

## Quick Start

```ts
import { BanchoClient } from "bancho.js";
import {
  Client,
  createDatabase,
  Administration,
  UserPlayTime,
  UserCommands,
  AutohostRotate,
  BeatmapInfo,
} from "osu-autohost";

const banchoClient = new BanchoClient({
  apiKey: process.env.OSU_KEY,
  username: process.env.OSU_NAME,
  password: process.env.OSU_PASS,
});

const client = new Client({
  client: banchoClient,
  database: createDatabase(),
});

async function main() {
  await banchoClient.connect(); // It is necessary to establish the connection with osu.

  const testGame = await client.createGame("Test Room", "1234");
  testGame.set(
    Administration,
    UserPlayTime,
    UserCommands,
    AutohostRotate,
    BeatmapInfo({
      mindiff: 0,
      maxdiff: 4.2,
    })
  );
  testGame.on("message", (user, content) => {
    console.info(`${user.username}: ${content}`);
  });
}

main();
```

## Modules

- Administration: Moderation and administration commands.
- Autohost Rotate: Automatic Rotating Autohost System, along with related commands.
- Beatmap Info: Show information about a beatmap when it is selected and add difficulty and duration validation.
- User Commands: Add user statistics and their scores in the different matches.
- User Playtime: Counts the total and current time that the user has been connected to the lobby.
