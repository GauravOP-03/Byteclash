alter table auth.users drop column password_hash;
alter table auth.users drop column username;

alter table auth.users add column first_name TEXT not null Default 'Anonymous';
alter table auth.users add column last_name TEXT;

alter table auth.users add column avatar_url TEXT;
alter table auth.users add column email_verified BOOLEAN not null default false ;

alter table auth.users add column updated_at TIMESTAMPTZ DEFAULT NOW();


CREATE TYPE provider_status AS ENUM ('email', 'google');
create table auth.accounts(
  id UUID primary key DEFAULT gen_random_uuid(),
  user_id UUID not null REFERENCES auth.users(id) ON DELETE CASCADE,
  provider provider_status not null,
  provider_user_id TEXT,
  hash_password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

create table auth.sessions (
   id UUID primary key DEFAULT gen_random_uuid(),
   user_id UUID not null REFERENCES auth.users(id) ON DELETE CASCADE,
   refresh_token TEXT not null,
   expires_at TIMESTAMPTZ not null,
   created_at TIMESTAMPTZ DEFAULT NOW(),
   updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE otp_purpose AS ENUM ('signup' , 'reset_password' , 'login' , 'verify_email');
create table auth.userOtps (
   id UUID primary key DEFAULT gen_random_uuid(),
   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
   otp TEXT not null,
   purpose otp_purpose not null,
   consumed_at TIMESTAMPTZ,
   expires_at TIMESTAMPTZ not null,
   created_at TIMESTAMPTZ DEFAULT NOW(),
   updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE auth.userOtps add constraint Unique_otp UNIQUE (user_id, purpose);
