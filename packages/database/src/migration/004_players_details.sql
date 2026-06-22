CREATE SCHEMA IF NOT EXISTS players;
create table players.stats(
  id UUID primary key Default gen_random_uuid(),
  user_id UUID not null REFERENCES auth.users(id) ON DELETE CASCADE,
  rating int not null Default 1600,
  rating_deviation int not null Default 300,
  volatility int not null default 0.5,
  created_at TIMESTAMPTZ Default NOW(),
  updated_at TIMESTAMPTZ Default NOW()
);
 

create type match_status as Enum ('completed', 'ongoing');

create table players.matches(
  id UUID primary key default gen_random_uuid(),
  user_id UUID not null REFERENCES auth.users(id) on delete cascade,
  status match_status not null,
  total_players INT,
  winner_id UUID references auth.users(id),
  problem_id UUID,
  match_start_time Date not null,
  match_end_time Date not null,
  created_at TIMESTAMPTZ Default NOW(),
  updated_at TIMESTAMPTZ Default NOW()
);

create type players_status as Enum ('ongoing', 'completed', 'left');
create table players.played(
  id UUID primary key default gen_random_uuid(),
  user_id UUID not null REFERENCES auth.users(id) on delete cascade,
  match_id UUID not null references players.matches(id),
  total_time_taken int,
  status players_status,
  created_at TIMESTAMPTZ Default NOW(),
  updated_at TIMESTAMPTZ Default NOW()
);
