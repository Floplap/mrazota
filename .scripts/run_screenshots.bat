@echo off
set NEXT_URL=http://localhost:3044
set LEGACY_URL=http://localhost:3002
cd /d F:\MRAZOTA\mrazota-site
node scripts\take_screenshots.mjs
pause
