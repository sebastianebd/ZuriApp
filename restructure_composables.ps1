$ErrorActionPreference = "Stop"
$client = "c:\Users\sebas\workspace\Proyecto_ZuriApp\client\src"
$composables = "$client\composables"
$utils = "$client\utils"
$dirs = @("employees", "active-replacements", "replacement-calendar", "replacement-history", "profile", "login")

Write-Host "Creando nuevos directorios..."
foreach ($dir in $dirs) { 
    New-Item -Path "$composables\$dir" -ItemType Directory -Force | Out-Null
}
New-Item -Path $utils -ItemType Directory -Force | Out-Null

Write-Host "Moviendo y renombrando archivos..."
Move-Item "$composables\user\useUsers.ts" "$composables\employees\useEmployees.ts"
Move-Item "$composables\user\useUsers.test.ts" "$composables\employees\useEmployees.test.ts"
Move-Item "$composables\replacement\useReplacements.ts" "$composables\active-replacements\useActiveReplacements.ts"
Move-Item "$composables\replacement\useReplacements.test.ts" "$composables\active-replacements\useActiveReplacements.test.ts"
Move-Item "$composables\useReplacementModals.ts" "$composables\active-replacements\useReplacementModals.ts"
Move-Item "$composables\useReplacementModals.test.ts" "$composables\active-replacements\useReplacementModals.test.ts"
Move-Item "$composables\replacement\useCalendar.ts" "$composables\replacement-calendar\useReplacementCalendar.ts"
Move-Item "$composables\replacement\useHistory.ts" "$composables\replacement-history\useReplacementHistory.ts"
Move-Item "$composables\user\useUserProfile.ts" "$composables\profile\useProfile.ts"
Move-Item "$composables\user\useUserProfile.test.ts" "$composables\profile\useProfile.test.ts"
Move-Item "$composables\auth\useLogin.ts" "$composables\login\useLogin.ts"
Move-Item "$composables\auth\useLogin.test.ts" "$composables\login\useLogin.test.ts"
Move-Item "$composables\auth\useAuth.ts" "$composables\login\useAuth.ts"

Write-Host "Eliminando directorios antiguos..."
Remove-Item "$composables\user" -Force -Recurse
Remove-Item "$composables\replacement" -Force -Recurse
Remove-Item "$composables\auth" -Force -Recurse

Write-Host "¡Reestructuración completada!"
