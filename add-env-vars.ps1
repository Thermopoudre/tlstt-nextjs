# Script PowerShell pour ajouter les variables d'environnement Vercel
# Utilisation: .\add-env-vars.ps1

$projectId = "prj_LQxxFd4KnVdCL6frPtnUM4XUdxyP"
$teamId = "team_h47SJj5rW3drgfwpMh0vtrhk"

# Liste des variables à ajouter
$envVars = @(
    @{
        key = "NEXT_PUBLIC_SUPABASE_URL"
        value = "https://iapvoyhvkzlvpbngwxmq.supabase.co"
        type = "plain"
        target = @("production", "preview", "development")
    },
    @{
        key = "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        value = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhcHZveWh2a3psdnBibmd3eG1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NDMxMjQsImV4cCI6MjA4NDQxOTEyNH0.qS7N4tfJGS25jHFU1XLPzDRW4zsiIixp-49UzhxMDdk"
        type = "plain"
        target = @("production", "preview", "development")
    },
    @{
        key = "SMARTPING_APP_ID"
        value = "SX044"
        type = "plain"
        target = @("production", "preview", "development")
    },
    @{
        key = "SMARTPING_PASSWORD"
        value = "P23GaC6gaU"
        type = "sensitive"
        target = @("production", "preview", "development")
    },
    @{
        key = "NEXT_PUBLIC_SITE_NAME"
        value = "Toulon La Seyne Tennis de Table"
        type = "plain"
        target = @("production", "preview", "development")
    },
    @{
        key = "NEXT_PUBLIC_SITE_URL"
        value = "https://tlstt-nextjs.vercel.app"
        type = "plain"
        target = @("production", "preview", "development")
    }
)

Write-Host "🎯 INSTRUCTIONS POUR AJOUTER LES VARIABLES D'ENVIRONNEMENT" -ForegroundColor Cyan
Write-Host ""
Write-Host "Méthode la plus simple : Via l'interface web Vercel" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Va sur : https://vercel.com/alexis-delcroixs-projects/tlstt-nextjs/settings/environment-variables" -ForegroundColor Green
Write-Host ""
Write-Host "2. Pour chaque variable ci-dessous, clique sur 'Add' et copie/colle :" -ForegroundColor Green
Write-Host ""

foreach ($env in $envVars) {
    Write-Host "   Variable: $($env.key)" -ForegroundColor Cyan
    Write-Host "   Value: $($env.value)" -ForegroundColor White
    Write-Host "   Environments: Production, Preview, Development" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "3. Après avoir ajouté toutes les variables, Vercel va automatiquement redéployer" -ForegroundColor Green
Write-Host ""
Write-Host "4. Attends 2-3 minutes et visite : https://tlstt-nextjs.vercel.app" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Le site sera alors 100% fonctionnel avec Supabase !" -ForegroundColor Green
