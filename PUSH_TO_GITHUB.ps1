Set-Location $PSScriptRoot

Write-Host "`n=== Git Status ===" -ForegroundColor Cyan
git status

Write-Host "`n=== Staging all files ===" -ForegroundColor Cyan
git add .

Write-Host "`n=== Committing ===" -ForegroundColor Cyan
git commit -m "fix: ts-ignore pdfkit, iconv-lite webpack alias"

Write-Host "`n=== Pushing to GitHub ===" -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
  Write-Host "`n✅ Done! Vercel will deploy in ~1-2 minutes." -ForegroundColor Green
} else {
  Write-Host "`n❌ Push failed! See error above." -ForegroundColor Red
}

Write-Host "`nPress any key to close..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
