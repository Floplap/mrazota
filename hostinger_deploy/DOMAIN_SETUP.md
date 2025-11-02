Domain (mrazota.net) setup notes

1) On Hostinger (hPanel):
   - Go to Domains ΓåÆ Add Domain (if not already added) and point it to your hosting account.
   - In Hostinger ΓåÆ DNS Zone Editor set A record:
       Name: @
       Type: A
       Value: <IP of your Hostinger server>
       TTL: default
   - Add CNAME for www -> @ (optional).

2) In hPanel ΓåÆ SSL (Let's Encrypt):
   - Enable SSL for the domain (Hostinger UI provides one-click Let's Encrypt).

3) Configure Hostinger Node.js App (or Site) to use the domain in Settings ΓåÆ Domain.

4) After deployment: check https://mrazota.net and verify redirect from http to https.

5) If using separate backend service, set env var NEXT_PUBLIC_API_BASE or other envs to full backend URL.

6) Typical DNS TTL propagation: up to 5ΓÇô15 minutes for Hostinger internal; up to 24 hours globally.
