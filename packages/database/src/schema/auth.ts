import { Generated, Insertable, Selectable, Updateable } from "kysely";

export interface UsersTable {
  id: Generated<string>;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  email_verified: boolean;
  update_at: Generated<Date>;
  created_at: Generated<Date>;
}

export interface UserAccounts {
  id: Generated<string>;
  user_id: Generated<string>;
  hash_password?: string;
  google_provider_id?: string;
  github_provider_id?: string;
  update_at: Generated<Date>;
  created_at: Generated<Date>;
}

export interface UserSessions {
  id: Generated<string>;
  user_id: Generated<string>;
  refresh_token: string;
  expires_at: Date;
  update_at: Generated<Date>;
  created_at: Generated<Date>;
}

export interface UserOtps {
  id: Generated<string>;
  user_id: Generated<string>;
  otp: string;
  purpose: "signup" | "reset_password" | "login" | "verify_email";
  consumed_at?: Date;
  expires_at: Date;
  updated_at: Generated<Date>;
  created_at: Generated<Date>;
}

export type Users = Selectable<UsersTable>;
export type NewUsers = Insertable<UsersTable>;
export type UsersUpdate = Updateable<UsersTable>;

export type Accounts = Selectable<UserAccounts>;
export type NewAccounts = Insertable<UserAccounts>;
export type AccountUpdate = Updateable<UserAccounts>;

export type Sessions = Selectable<UserSessions>;
export type NewSessions = Insertable<UserSessions>;
export type AccountsUpdate = Updateable<UserSessions>;

export type Otps = Selectable<UserOtps>;
export type NewOtps = Insertable<UserOtps>;
export type UpdateOtps = Updateable<UserOtps>;
