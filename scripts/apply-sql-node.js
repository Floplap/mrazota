#!/usr/bin/env node
/*
apply-sql-node.js

Apply infra/supabase_schema.sql to a Postgres database using the node 'pg' client.

Usage:
  # set env var and run
  $env:DATABASE_URL = 'postgres://user:pass@host:5432/dbname?sslmode=require'
  node .\scripts\apply-sql-node.js

  # or pass as first arg
  node .\scripts\apply-sql-node.js 'postgres://...'

This avoids requiring the 'psql' CLI. It will install 'pg' via npm if you need to.
*/

const fs = require('fs');
const path = require('path');

async function main() {
  const passed = process.argv[2];
  const databaseUrl = passed || process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('ERROR: No DATABASE_URL provided. Set env $DATABASE_URL or pass as first arg.');
    console.error('Example (PowerShell): $env:DATABASE_URL = "postgres://user:pass@host:5432/dbname"; node .\\scripts\\apply-sql-node.js');
    process.exit(1);
  }

  // Quick validation: users sometimes paste the project HTTP URL (https://...supabase.co)
  // instead of the Postgres connection string. Detect that and give a clear hint.
  if (/^https?:\/\//i.test(databaseUrl)) {
    console.error('ERROR: The provided DATABASE_URL looks like an HTTP(S) project URL, not a Postgres connection string.');
    console.error('Get the correct Postgres connection string from Supabase Dashboard → Settings → Database → Connection info (it starts with "postgres://" or "postgresql://").');
    console.error('Do NOT paste public HTTP URLs or anon keys here. Example format: postgres://user:password@db.host.supabase.co:5432/postgres');
    process.exit(1);
  }

  const sqlPath = path.resolve(__dirname, '..', 'infra', 'supabase_schema.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('ERROR: SQL file not found at', sqlPath);
    process.exit(1);
  }

  let sql;
  try {
    sql = fs.readFileSync(sqlPath, 'utf8');
  } catch (err) {
    console.error('ERROR: Failed to read SQL file:', err.message);
    process.exit(1);
  }

  // require pg dynamically so the repo doesn't force-install it for everyone
  let pg;
  try {
    pg = require('pg');
  } catch (err) {
    console.error("The 'pg' package is required but not installed. Run: npm install pg --no-audit --no-fund");
    process.exit(2);
  }

  // Decide SSL usage: if connecting to localhost, don't force SSL; otherwise enable SSL but allow self-signed.
  const useLocal = /localhost|127\.0\.0\.1|::1/.test(databaseUrl);
  const clientConfig = {
    connectionString: databaseUrl,
    ssl: useLocal ? false : { rejectUnauthorized: false }
  };

  const { Client } = pg;
  const client = new Client(clientConfig);

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected. Applying SQL (this may take a few seconds)...');

    // Execute entire SQL file in a single query. Postgres accepts multiple statements separated by semicolons.
    await client.query(sql);

    console.log('SQL applied successfully.');
    await client.end();
    process.exit(0);
  } catch (err) {
    // Provide clearer, actionable messages for common network errors without leaking secrets
    const code = err && err.code ? err.code : null;
    const msg = err && err.message ? err.message : String(err);
    console.error('ERROR: Failed to apply SQL:');
    console.error('  message:', msg);
    if (code) console.error('  code:', code);

    if (msg.includes('ENOTFOUND') || msg.includes('getaddrinfo')) {
      console.error('Hint: DNS resolution failed for the host in your connection string.');
      console.error('Check that the host is correct and that your network can resolve it. On Windows run: Resolve-DnsName <host>');
    } else if (msg.includes('ETIMEDOUT')) {
      console.error('Hint: Connection timed out. This usually means outbound TCP port 5432 is blocked by your network/firewall, or the DB is not reachable from your machine.');
      console.error('Try from another network (mobile hotspot) or use the CI runner workflow we prepared (push branch apply-sql and add SUPABASE_DATABASE_URL secret).');
    } else if (msg.includes('ECONNREFUSED')) {
      console.error('Hint: Connection refused. The host is reachable but not accepting Postgres connections on the port.');
    }

    // Minimal stack for debugging (don't echo connection string)
    if (err && err.stack) {
      console.error('Stack:', err.stack.split('\n').slice(0,6).join('\n'));
    }

    try { await client.end(); } catch(_){ }
    process.exit(3);
  }
}

main();
