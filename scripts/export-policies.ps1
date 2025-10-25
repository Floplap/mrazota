param()

# Exports all policies for public schema into supabase/policies.sql
if (-not $env:DATABASE_URL) {
  Write-Error "Please set environment variable DATABASE_URL"
  exit 1
}

$out = "supabase/policies.sql"
Write-Host "Exporting policies to $out"

$query = @"
SELECT '--- policy for table: ' || p.polrelid::regclass || E'\n' ||
       'CREATE POLICY ' || quote_ident(p.polname) || ' ON ' || p.polrelid::regclass || E'\n' ||
       '  FOR ' || p.polcmd || ' USING (' || coalesce(pg_get_expr(p.polqual, p.polrelid), 'TRUE') || ') ' ||
       coalesce(' WITH CHECK (' || pg_get_expr(p.polwithcheck, p.polrelid) || ')', '') || E';' as policy_sql
FROM pg_policy p
WHERE p.schemname = 'public' OR p.polrelid::regclass::text LIKE 'public.%';
"@

psql $env:DATABASE_URL -t -A -F $"\n" -c $query | Out-File -Encoding utf8 $out
Write-Host "Done"
