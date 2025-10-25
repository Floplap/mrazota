<#
prepare-apply-pr.ps1

Helper PowerShell script to prepare a local branch for applying Supabase SQL via CI.
It will create branch `apply-sql`, stage the key workflow and docs files, commit, and
print the git push command to run manually (we don't push from here).
#>

Set-StrictMode -Version Latest

$files = @(
  '.github/workflows/apply-supabase-sql.yml',
  '.github/workflows/apply-supabase-sql-on-push.yml',
  '.github/PR_APPLY_INSTRUCTIONS.md',
  '.github/PR_READY.md',
  'scripts/SQL_MANUAL_APPLY.md'
)

Write-Host "Creating branch 'apply-sql'..."
git checkout -b apply-sql

foreach ($f in $files) {
  if (Test-Path $f) {
    Write-Host "Adding $f"
    git add $f
  } else {
    Write-Warn "File not found: $f"
  }
}

Write-Host "Committing changes..."
$null = git commit -m "chore(ci): add apply-supabase workflows and docs"
if ($LASTEXITCODE -ne 0) {
  Write-Host 'No changes to commit'
}

Write-Host "To push the branch and create PR, run these commands locally:"
Write-Host "  git push origin apply-sql"
Write-Host "  (then use GitHub UI or 'gh pr create' to make a PR)"
