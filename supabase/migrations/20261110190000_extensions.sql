-- Extensions and the non-exposed schema for RLS helper functions.
create extension if not exists pg_trgm with schema extensions;

-- Helpers live in `private` so PostgREST never exposes them as RPC.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;
