ALTER TABLE auth.accounts DROP COLUMN provider;
ALTER TABLE auth.accounts DROP COLUMN provider_user_id;
DROP TYPE provider_status CASCADE;

ALTER TABLE auth.accounts ALTER COLUMN hash_password DROP NOT NULL;  -- or DROP COLUMN if unneeded

ALTER TABLE auth.accounts ADD COLUMN google_provider_id TEXT;
ALTER TABLE auth.accounts ADD COLUMN github_provider_id TEXT;

CREATE INDEX ON auth.accounts (google_provider_id) WHERE google_provider_id IS NOT NULL;
CREATE INDEX ON auth.accounts (github_provider_id) WHERE github_provider_id IS NOT NULL;
