# Commands

> Note: The commands below are not necessarily implemented, it depends on the person implementing this bot.

## User commands

| name               | description                                       |
| ------------------ | ------------------------------------------------- |
| help               | Returns the list of available commands.           |
| playtime           | Get the current and total playing time.           |
| queue              | Shows the current host queue.                     |
| queuepos           | Returns the user's position in the host queue.    |
| skip               | Skip your turn or start a vote to skip the host.  |
| start <time?>      | Set a countdown or start a vote to start.         |
| abort              | Cancels the game start countdown.                 |
| autoskip           | Activate or disable autoskip.                     |
| playstats /ps      | Return your games played and your victories (#1). |
| rs                 | Returns your most recent result.                  |
| mapstats / ms      | Returns your average result on a map.             |
| bestmapstats / bms | Get your highest score on a map.                  |

## Admin commands

| name                | description                              |
| ------------------- | ---------------------------------------- |
| name <value>        | Set a name in the lobby.                 |
| password <value>    | Set a password in the lobby.             |
| sethost <username>  | Set a lobby host by username.            |
| setadmin <username> | Set a lobby admin by username.           |
| deladmin <username> | Remove a lobby admin by username.        |
| ban <username>      | Ban a user using their username.         |
| unban <username>    | Unban a user.                            |
| close               | Close a lobby.                           |
| forceskip or fs     | Forces to jump to the next host in line. |
| mindiff <value>     | Set the minimum difficulty of the lobby. |
| maxdiff <value>     | Set the maximum difficulty of the lobby. |
| minlength <value>   | Set the minimum duration of the maps.    |
| maxlength <value>   | Set the maximum difficulty of the lobby. |
