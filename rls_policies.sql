-- Deprecated entry point kept to prevent accidental use of the former open policies.
-- Production setup now lives in supabase_auth_rls_migration.sql.
-- The old version granted full table access to the public anon role. Do not restore it.

SELECT 'Use supabase_auth_rls_migration.sql' AS migration_required;
