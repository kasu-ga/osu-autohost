import { BanchoUser } from "bancho.js";
import { Beatmap, Score } from "nodesu";

export interface UserModel {
  id: number;
  username: string;
  isBanned: boolean;
  isHost: boolean;
  isAdmin: boolean;
  autoskip: boolean;
  playtime: number;
}

export interface BeatmapCustomData {
  pp100: number;
  pp98: number;
  pp95: number;
}

export interface BeatmapModel extends BeatmapCustomData {
  id: number;
  setId: number;
  AR: number;
  CS: number;
  HP: number;
  OD: number;
  bpm: number;
  title: string;
  maxCombo: number;
  approved: number;
  totalLength: number;
  stars: number;
}

export interface MatchModel {
  id: number;
  gameId: string;
}

export interface ScoreBase {
  userId: number;
  beatmapId: number;
  gameId: string;
  matchId: number;
}

export interface ScoreCustomData {
  rank: string;
  performance: number;
  accuracy: number;
  position: number;
  moment: number;
}

export interface ScoreModel extends ScoreBase, ScoreCustomData {
  id: number;

  score: number;
  count300: number;
  count100: number;
  count50: number;
  countMiss: number;
  maxCombo: number;
  countKatu: number;
  countGeki: number;
  mods?: number;
}

export interface DatabaseUserCollection {
  findOrCreate: (user: BanchoUser) => Promise<UserModel>;
  update: (id: number, data: Partial<UserModel>) => Promise<void>;
}

export interface DatabaseBeatmapCollection {
  findOne: (id: number) => Promise<BeatmapModel | null>;
  create: (beatmap: BeatmapModel) => Promise<BeatmapModel>;
}

export interface DatabaseMatchCollection {
  create: (id: number, gameId: string) => Promise<MatchModel>;
}

export interface DatabaseScoreCollection {
  create: (score: Score & ScoreBase & ScoreCustomData) => Promise<ScoreModel>;
  find: (where: Partial<ScoreBase>) => Promise<ScoreModel[]>;
  findLast: (userId: number) => Promise<ScoreModel | null>;
}

export interface DatabaseCollections {
  users: DatabaseUserCollection;
  beatmaps: DatabaseBeatmapCollection;
  matches: DatabaseMatchCollection;
  scores: DatabaseScoreCollection;
}

export class Database {
  readonly users: DatabaseUserCollection;
  readonly beatmaps: DatabaseBeatmapCollection;
  readonly matches: DatabaseMatchCollection;
  readonly scores: DatabaseScoreCollection;

  constructor(collections: DatabaseCollections) {
    this.users = collections.users;
    this.beatmaps = collections.beatmaps;
    this.matches = collections.matches;
    this.scores = collections.scores;
  }
}

export function createDatabase(): Database {
  const users: UserModel[] = [];
  const beatmaps: BeatmapModel[] = [];
  const matches: MatchModel[] = [];
  const scores: ScoreModel[] = [];

  return new Database({
    users: {
      async findOrCreate(banchoUser) {
        const userExists = users.find((u) => u.id === banchoUser.id);
        if (userExists) return userExists;
        const user: UserModel = {
          id: banchoUser.id,
          username: banchoUser.username,
          autoskip: false,
          isAdmin: false,
          isBanned: false,
          isHost: false,
          playtime: 0,
        };
        users.push(user);
        return user;
      },
      async update(id, data) {
        const userIndex = users.findIndex((u) => u.id === id);
        if (userIndex === -1) return;
        users[userIndex] = {
          ...users[userIndex],
          ...data,
        };
      },
    },
    beatmaps: {
      async findOne(id) {
        const beatmapExists = beatmaps.find((u) => u.id === id);
        return beatmapExists ?? null;
      },
      async create(nodesuBeatmap) {
        const beatmapExists = beatmaps.find((u) => u.id === nodesuBeatmap.id);
        if (beatmapExists) return beatmapExists;
        beatmaps.push(nodesuBeatmap);
        return nodesuBeatmap;
      },
    },
    matches: {
      async create(id, gameId) {
        const match: MatchModel = {
          id,
          gameId,
        };
        matches.push(match);
        return match;
      },
    },
    scores: {
      async create(score) {
        const newScore: ScoreModel = {
          id: score.scoreId,
          matchId: score.matchId,
          gameId: score.gameId,
          userId: score.userId,
          beatmapId: score.beatmapId,
          score: score.score,
          mods: score.enabledMods,
          maxCombo: score.maxCombo,
          count300: score.count300,
          count100: score.count100,
          count50: score.count50,
          countMiss: score.countMiss,
          countGeki: score.countGeki,
          countKatu: score.countKatu,
          rank: score.rank,
          accuracy: score.accuracy,
          performance: score.performance,
          position: score.position,
          moment: score.moment,
        };
        scores.push(newScore);
        return newScore;
      },
      async find(where) {
        const scs = scores.filter((score) => {
          const res = [true, true, true, true];
          if (where.gameId) {
            res[0] = where.gameId === score.gameId;
          }
          if (where.matchId) {
            res[1] = where.matchId === score.matchId;
          }
          if (where.userId) {
            res[2] = where.userId === score.userId;
          }
          if (where.beatmapId) {
            res[3] = where.beatmapId === score.beatmapId;
          }
          return res[0] && res[1] && res[2] && res[3];
        });
        return scs;
      },
      async findLast(userId) {
        const userScores = scores.filter((u) => userId === u.userId);
        const rs = userScores.sort((a, b) => b.moment - a.moment)[0];
        return rs ?? null;
      },
    },
  });
}
