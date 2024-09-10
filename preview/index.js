require("dotenv").config();
const { BanchoClient } = require("bancho.js");
const {
  Client,
  createDatabase,
  Administration,
  UserPlayTime,
  UserStats,
  AutohostRotate,
  BeatmapInfo,
} = require("../dist");

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
  await banchoClient.connect();

  const testGame = await client.createGame("Test Room", "1234");
  testGame.set(
    Administration,
    UserPlayTime,
    UserStats,
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
