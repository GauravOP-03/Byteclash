import { UserAccounts, UserOtps, UserSessions, UsersTable } from "./auth";
import {
  PlayersMatchesTable,
  PlayersPlayedTable,
  PlayersStatsTable,
} from "./players";

export interface Database {
  "auth.users": UsersTable;
  "auth.accounts": UserAccounts;
  "auth.sessions": UserSessions;
  "auth.userotps": UserOtps;
  "players.stats": PlayersStatsTable;
  "players.matches": PlayersMatchesTable;
  "players.played": PlayersPlayedTable;
}

export * from "./auth";
