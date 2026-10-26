# supabase/pending/

Migrations that are written and reviewed but **not yet applied** to the live DB.

They are kept out of `supabase/migrations/` on purpose, so no tool (the Supabase GitHub
integration, `supabase db push`) can deploy them automatically. They are applied by hand,
in the SQL editor, following `docs/runbooks/pre-migration-backup.md` (snapshot and
`pg_dump` first; the Free plan has no restorable backups).

After a migration is applied and verified: set its `Applied to live DB:` header to the date,
then `git mv` it into `supabase/migrations/`.
