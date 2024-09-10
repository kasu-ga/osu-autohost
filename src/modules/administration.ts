import type { Game } from "../lib/game";

export function Administration(game: Game) {
  game.commands.push(
    {
      name: "name",
      description: "Set a name in the lobby.",
      args: "<new_name>",
      role: "admin",
      run: async (user, name) => {
        if (!name) {
          await game.reply(user, "name is required.");
          return;
        }
        await game.lobby.setName(name);
      },
    },
    {
      name: "password",
      description: "Set a password in the lobby.",
      args: "<new_pass>",
      role: "admin",
      run: async (user, password) => {
        await game.lobby.setPassword(password);
      },
    },
    {
      name: "sethost",
      description: "Set a lobby host by username.",
      args: "<username>",
      role: "admin",
      run: async (user, username) => {
        if (!username) {
          await game.reply(user, "username is required.");
          return;
        }
        await game.lobby.setHost(user.username);
        const host = await game.lobby.getHost();
        if (host?.user) {
          await game.context.database.users.update(host.user.id, {
            isHost: false,
          });
        }
        if (user.isHost) {
          await game.context.database.users.update(user.id, {
            isHost: true,
          });
        }
      },
    },
    {
      name: "setadmin",
      description: "Set a lobby admin by username.",
      args: "<username>",
      role: "admin",
      run: async (user, username) => {
        if (!username) {
          await game.reply(user, "username is required.");
          return;
        }
        username = username.toLowerCase().trim();
        const slot = game.lobby.slots.find(
          (slot) => slot.user.username.toLowerCase() === username
        );
        if (!slot) {
          await game.reply(user, `${username} is not in this lobby.`);
          return;
        }
        if (!user.isAdmin) {
          await game.context.database.users.update(user.id, {
            isAdmin: true,
          });
        }
      },
    },
    {
      name: "deladmin",
      description: "Remove a lobby admin by username.",
      args: "<username>",
      role: "admin",
      run: async (user, username) => {
        if (!username) {
          await game.reply(user, "username is required.");
          return;
        }
        username = username.toLowerCase().trim();
        const slot = game.lobby.slots.find(
          (slot) => slot.user.username.toLowerCase() === username
        );
        if (!slot) {
          await game.reply(user, `${username} is not in this lobby.`);
          return;
        }
        if (user.isAdmin) {
          await game.context.database.users.update(user.id, {
            isAdmin: false,
          });
        }
      },
    },
    {
      name: "ban",
      description: "Ban a user using their username.",
      args: "<username>",
      role: "admin",
      run: async (user, username) => {
        if (!username) {
          await game.reply(user, "username is required.");
          return;
        }
        await game.lobby.kickPlayer(user.username);
        if (!user.isBanned) {
          await game.context.database.users.update(user.id, {
            isBanned: true,
          });
        }
      },
    },
    {
      name: "unban",
      description: "Unban a user.",
      args: "<username>",
      role: "admin",
      run: async (user, username) => {
        if (!username) {
          await game.reply(user, "username is required.");
          return;
        }
        if (user.isBanned) {
          await game.context.database.users.update(user.id, {
            isBanned: false,
          });
        }
      },
    },
    {
      name: "close",
      description: "Close a lobby.",
      role: "admin",
      run: async () => {
        await game.close();
        game.emit("close");
      },
    }
  );
}
