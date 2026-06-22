import { Generated, Insertable, Selectable, Updateable } from "kysely";

export interface PlayersStatsTable {
  id: Generated<string>;
  user_id: Generated<string>;
  rating?: number;
  rating_deviation?: number;
  volatility?: number;
  update_at: Generated<Date>;
  created_at: Generated<Date>;
}

export interface PlayersMatchesTable {
  id: Generated<string>;
  user_id: Generated<string>;
  status: "completed" | "ongoing";
  total_players: number;
  winner_id: Generated<string>;
  problem_id: Generated<string>;
  match_start_time: Date;
  match_end_time: Date;
  update_at: Generated<Date>;
  created_at: Generated<Date>;
}

export interface PlayersPlayedTable {
  id: Generated<string>;
  user_id: Generated<string>;
  match_id: Generated<string>;
  total_time_taken: number;
  status: "ongoing" | "completed" | "left";
  update_at: Generated<Date>;
  created_at: Generated<Date>;
}

export type PlayersStats = Selectable<PlayersStatsTable>;
export type NewPlayersStats = Insertable<PlayersStatsTable>;
export type PlayersStatsUpdate = Updateable<PlayersStatsTable>;

export type PlayersMatches = Selectable<PlayersMatchesTable>;
export type NewPlayersMatches = Insertable<PlayersMatchesTable>;
export type PlayersMatchesUpdate = Updateable<PlayersMatchesTable>;

export type PlayersPlayed = Selectable<PlayersPlayedTable>;
export type NewPlayersPlayed = Insertable<PlayersPlayedTable>;
export type PlayersPlayedUpdate = Updateable<PlayersPlayedTable>;
