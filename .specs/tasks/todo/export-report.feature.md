---
title: Añadir Opciones de Exportación a Reportes
---

## Initial User Prompt

Crear descarga Excel individual (mes cerrado y en curso) e incluir un spinner de carga (UX) en los botones de frontend para notificar al usuario durante procesos de exportación. (Vía Ponytail: Se descarta la generación masiva de PDF de servicio en curso por razones de rendimiento).

## Description

Este plan aborda la necesidad de completar la opción de descarga de Excel Individual. Siguiendo el principio de simplicidad (Ponytail), se descarta generar PDFs masivos síncronos en meses abiertos, manteniendo la descarga de Excel masivo para los avances en curso y PDF oficial para los meses cerrados, evitando bloqueos en el servidor. Además, incluye la mejora visual del loading spinner en la vista web.

## Implementation Process

### Step 1: Update Services

**Description:** 
1. En `server/services/report.service.ts`: Crear `generateIndividualExcelReport(month, year, userId, period)` que instancie ExcelJS y construya la tabla detallada del funcionario.

**Expected Output:**
- `server/services/report.service.ts` modificado

#### Verification
**Level:** Single Judge
**Artifacts:**
- `server/services/report.service.ts`

### Step 2: Update Routes and Controllers
**Depends on:** Step 1

**Description:** 
1. En `server/routes/report.routes.ts`: Agregar ruta `GET /export/excel/individual`.
2. En `server/controllers/report.controller.ts`: Crear controlador `exportIndividualExcel` que valide los datos y llame al servicio de Excel.

**Expected Output:**
- `server/routes/report.routes.ts` modificado
- `server/controllers/report.controller.ts` modificado

#### Verification
**Level:** Single Judge
**Artifacts:**
- `server/routes/report.routes.ts`
- `server/controllers/report.controller.ts`

### Step 3: Frontend UI and Composables (Excel Individual y UX)
**Depends on:** Step 2

**Description:** 
1. En `client/src/composables/reports/useReports.ts`: Crear `downloadIndividualExcel()` invocando `axios.get(..., { responseType: 'blob' })` y gestionando el Blob para descarga.
2. En `client/src/views/reports/ReportsView.vue`: 
   - Añadir botón "Descargar Cartola (Excel)" individual. 
   - Añadir clase `spinner-border` nativa al ícono de *todos* los botones de descarga mientras `isExporting` esté activo.
   - Manejar correctamente el estado `isExporting` en bloque `catch` para detener el spinner en caso de error.

**Expected Output:**
- `client/src/composables/reports/useReports.ts` modificado
- `client/src/views/reports/ReportsView.vue` modificado

#### Verification
**Level:** Single Judge
**Artifacts:**
- `client/src/composables/reports/useReports.ts`
- `client/src/views/reports/ReportsView.vue`
