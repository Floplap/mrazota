Security: rotate the database password

While interacting with automation, a temporary file in the repository previously contained a password in plaintext.
Although I replaced that file with a safe message, you should assume the password may have been exposed and rotate it.

Steps (Supabase Dashboard):
1) Open Supabase → Project → Settings → Database → Credentials
2) Rotate the password for the `postgres` user (or create a new user with required privileges and revoke the old one).
3) Update any clients or secrets that use the old password. In particular, update GitHub Actions secret `SUPABASE_DATABASE_URL` with the new connection string.

If you want, I can prepare exact SQL to create a new role and grant minimal privileges instead of rotating the main `postgres` password.
