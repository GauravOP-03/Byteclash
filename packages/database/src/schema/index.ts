import { UserAccounts, UserOtps, UserSessions, UsersTable } from "./auth";

export interface Database {
  "auth.users": UsersTable;
  "auth.accounts": UserAccounts;
  "auth.sessions": UserSessions;
  "auth.userotps": UserOtps;
}

export * from "./auth";
