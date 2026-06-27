$ErrorActionPreference = "Stop"
$views = "c:\Users\sebas\workspace\Proyecto_ZuriApp\client\src\views"
$dirs = @("employees", "positions", "shift-records", "active-replacements", "replacement-calendar", "current-shifts", "replacement-history", "shift-history", "shift-exceptions", "service-management", "shift-type-management", "login", "profile", "public-calendar")

Write-Host "Creando nuevos directorios..."
foreach ($dir in $dirs) { 
    New-Item -Path "$views\$dir" -ItemType Directory -Force | Out-Null
}

Write-Host "Moviendo y renombrando archivos..."
Move-Item "$views\user\VerUsuarios.vue" "$views\employees\EmployeesView.vue"
Move-Item "$views\personal\CargoManagement.vue" "$views\positions\PositionsView.vue"
Move-Item "$views\personal\FichaTurnosView.vue" "$views\shift-records\ShiftRecordsView.vue"
Move-Item "$views\user\ReemplazosView.vue" "$views\active-replacements\ActiveReplacementsView.vue"
Move-Item "$views\user\CalendarioView.vue" "$views\replacement-calendar\ReplacementCalendarView.vue"
Move-Item "$views\shifts\ShiftsView.vue" "$views\current-shifts\CurrentShiftsView.vue"
Move-Item "$views\user\VerHistorial.vue" "$views\replacement-history\ReplacementHistoryView.vue"
Move-Item "$views\historial\TurnosHistorial.vue" "$views\shift-history\ShiftHistoryView.vue"
Move-Item "$views\historial\ExcepcionesHistorial.vue" "$views\shift-exceptions\ShiftExceptionsView.vue"
Move-Item "$views\audit\AuditoriaView.vue" "$views\audit\AuditView.vue"
Move-Item "$views\configuracion\ServiceManagement.vue" "$views\service-management\ServiceManagementView.vue"
Move-Item "$views\configuracion\ShiftTypeManagement.vue" "$views\shift-type-management\ShiftTypeManagementView.vue"
Move-Item "$views\auth\LoginView.vue" "$views\login\LoginView.vue"
Move-Item "$views\user\UserView.vue" "$views\profile\ProfileView.vue"
Move-Item "$views\public\PublicCalendar.vue" "$views\public-calendar\PublicCalendarView.vue"

Write-Host "Eliminando directorios antiguos..."
Remove-Item "$views\user" -Force -Recurse
Remove-Item "$views\personal" -Force -Recurse
Remove-Item "$views\historial" -Force -Recurse
Remove-Item "$views\configuracion" -Force -Recurse
Remove-Item "$views\auth" -Force -Recurse
Remove-Item "$views\public" -Force -Recurse
Remove-Item "$views\shifts" -Force -Recurse

Write-Host "¡Reestructuración completada!"
