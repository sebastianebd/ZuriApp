# Análisis de Impacto: Rediseño Centro de Reportes - Arquitectura Híbrida

## Resumen Ejecutivo
- **Archivos a Modificar:** 5
- **Archivos a Crear:** 3 (Worker, Cron, S3 client)
- **Riesgo Global:** MEDIO-ALTO

## Archivos a MODIFICAR

### client/src/views/reports/ReportsView.vue (1570 líneas) — Riesgo: ALTO
- Eliminar tabs: Exportación, Individual, Excepciones (líneas 59-82)
- Eliminar TAB 3 Excepciones (líneas 192-237)
- Eliminar botón cerrar mes (líneas 48-56)
- Eliminar funciones: handleClosePeriod, confirmClosePeriod, handleAddException, handleSealException, showUserSelectionModal
- Nuevo Split Layout: Panel Izquierdo (selector periodo + estado) + Panel Derecho (CSS Grid 2 Cards)
- Card 1 (Servicio): select servicio + botones PDF/Excel mutantes
- Card 2 (Funcionario): buscador + botones PDF/Excel individuales

### server/services/report.service.ts (583 líneas) — Riesgo: ALTO
- Eliminar: import ShiftExceptionModel, fetch excepciones (líneas 151-158), lógica excepción (líneas 263-270)
- Agregar: generateServicePDFWithPuppeteer(), uploadPDFToS3(), getSignedURL()
- Conservar intacto: generateServiceExcelReport() ya funciona con Snapshots

### server/controllers/report.controller.ts (202 líneas) — Riesgo: MEDIO
- Eliminar función sealException (líneas 110-150)
- Simplificar getMonthlySummary: eliminar lógica unlockedUsers (líneas 50-91)
- Agregar: getServicePDFUrl()

### server/routes/api/report.routes.ts (33 líneas) — Riesgo: BAJO
- Eliminar: POST /seal-exception
- Agregar: GET /service/pdf

### client/src/stores/report.store.ts — Riesgo: BAJO
- Adaptar para URLs firmadas S3

## Archivos a CREAR

### server/workers/report.worker.ts [NUEVO]
Worker BullMQ: calcula datos ? guarda Snapshot ? genera PDF (Puppeteer) ? sube S3 ? actualiza Period.CLOSED

### server/cron/report.cron.ts [NUEVO]
node-cron expresión: 0 0 5 * * (día 5, 00:00 hrs)

### server/config/s3.client.ts [NUEVO]
Singleton S3Client agnóstico: forcePathStyle:true + endpoint=AWS_ENDPOINT para MinIO dev

## Modelos MongoDB Involucrados
- TurnAssignmentModel: sin cambio
- Replacement: sin cambio  
- ShiftExceptionModel: ELIMINAR USO
- Period: agregar campo pdfUrls (Map serviceId?S3Key)
- ReportSnapshot: sin cambio (ya funciona bien)

## Nuevas Dependencias
- @aws-sdk/client-s3 + @aws-sdk/s3-request-presigner
- puppeteer o html-pdf-node
- node-cron
- bullmq (verificar si ya instalado)

## Riesgos
- Puppeteer pesado: considerar html-pdf-node
- Redis requerido por BullMQ
- Period.pdfUrls: campo nuevo (non-breaking)
