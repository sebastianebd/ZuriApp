---
title: "Rediseño Centro de Reportes - Arquitectura Híbrida (Cartolas vs Movimientos)"
type: feature
status: draft
---

# Rediseño Centro de Reportes - Arquitectura Híbrida

## Descripción

Implementar el nuevo diseño de interfaz (Split Layout) y conectar la arquitectura híbrida de exportación de reportes (Cartolas vs Movimientos en curso).

El objetivo es separar claramente los reportes históricos inmutables (Cartolas) de los datos del mes en curso, y adaptar la interfaz usando un diseño tipo Split Layout con alta densidad de información (estilo B2B).

## Requerimientos

### 1. Interfaz de Usuario (Frontend) - Split Layout

- **Layout Dividido:**
  - _Panel Izquierdo (Contexto):_ Título de página, selectores de Mes y Año, y un componente grande indicando el Estado del Período ("Mes en Curso" en verde/azul o "Período Cerrado" en rojo con fecha/hora de cierre).
  - _Panel Derecho (Acciones):_ CSS Grid con tarjetas (Cards) claras para las acciones.
- **Tarjetas de Acción:**
  - _Tarjeta 1 (Reporte de Servicios):_ Select de Servicio y botones de exportación (PDF / Excel). Los textos de los botones deben mutar según el estado del mes (ej. "Exportar Avance" vs "Descargar Cartola Oficial").
  - _Tarjeta 2 (Reporte Individual):_ Buscador de Funcionario y sus respectivos botones.
- **Sin Intervención Manual (Cierre Automático):** Dado el dominio del sistema, no habrá botón manual de cierre de mes. Los reportes del mes en curso estarán abiertos hasta un "período de gracia" (ej. día 5 o 8 del mes siguiente).
- **Diseño General y Excepciones:**
  - Eliminar el uso de pestañas (tabs) actuales (incluida la pestaña de "Excepciones").
  - Aplicar directrices de diseño limpio, sin exceso de centrado, y jerarquía visual clara.
  - _Decisión de Arquitectura:_ Los reportes históricos son estrictamente de solo lectura. Ya no existirán excepciones ni "reaperturas". Si un turno no se corrigió durante los días de gracia, el registro histórico queda sellado tal cual.

### 2. Arquitectura de Cierre de Mes (Backend) - Opción C (Worker)

- **Proceso Asíncrono de Cierre Global (Cronjob):**
  - Configurar un proceso programado (Cronjob) en el backend (ej. programado para el día 5 de cada mes a las 00:00 hrs) que inicie automáticamente el cierre.
  - Integrar una cola de trabajo (ej. BullMQ + Redis) para manejar el cierre pesadamente en segundo plano.
  - El Worker debe implementar políticas de reintento (ej. 3 retries) y procesar **todos los servicios activos del mes** para:
    1. Calcular todos los datos del servicio y sus funcionarios.
    2. Guardar el **Snapshot JSON** inmutable en la base de datos (MongoDB).
    3. Generar físicamente el PDF de la Cartola Masiva del Servicio (ej. usando Puppeteer).
    4. Subir el PDF generado a un almacenamiento en la nube (S3 o similar).
    5. Si todo es exitoso, actualizar el estado del período a "Cerrado", guardar las URLs del S3 y emitir un evento WebSocket para que el Frontend quite el estado de carga.
    6. Si tras los reintentos el proceso fracasa (ej. S3 está caído), el trabajo quedará en estado fallido.
  - **Recuperación ante fallos:** Ya que el proyecto cuenta con la librería `bull-board`, no se ensuciará la interfaz de ZuriApp con botones de reintento de emergencia. En caso de una falla catastrófica de infraestructura, el equipo de IT ingresará al panel de `bull-board`, diagnosticará el error, y reanudará los trabajos fallidos usando el botón "Retry All" nativo de la herramienta.

### 3. Lógica de Exportación (Endpoints)

- **Mes Cerrado (Histórico):**
  - _Cartola de Servicio (PDF):_ El backend entrega la URL de S3 al frontend (desde el paso 2.5).
  - _Cartola de Servicio (Excel):_ El backend reconstruye el Excel al vuelo leyendo el Snapshot JSON guardado.
  - _Cartola de Funcionario (Excel):_ Usa el Snapshot ya implementado.
  - _Cartola de Funcionario (PDF):_ Usa el Snapshot y generación del PDF en el navegador ya implementado.
- **Mes en Curso (Últimos Movimientos):**
  - _Data de Servicio (PDF y Excel):_ El backend calcula y genera ambos archivos al vuelo usando la data viva de la base de datos.
  - _Data Individual (PDF y Excel):_ Se calculan al vuelo.

## Notas Técnicas

- **Limpieza de Código Legacy (Excepciones):** Eliminar por completo del backend (controladores, servicios y base de datos) los endpoints y la lógica que permitía registrar excepciones en meses cerrados. El modelo de datos debe purgarse de esta capacidad mutante.
- El proyecto requerirá configurar infraestructura de colas (Redis/BullMQ) si no existe actualmente.
- Definir la estrategia de almacenamiento: SDK AWS agnóstico con `AWS_ENDPOINT` para MinIO en desarrollo y S3 real en producción.
- Mantener consistencia con las herramientas actuales del proyecto (Vue 3, Pinia, Express/NestJS, MongoDB).

## Criterios de Aceptación

### AC-1: Layout y UI
- **DADO** un usuario autenticado que navega al Centro de Reportes
- **CUANDO** carga la vista
- **ENTONCES** ve un Split Layout: Panel Izquierdo (selectores de mes/año + badge de estado grande) y Panel Derecho (Grid de 2 Cards)
- **Y** no existe ninguna pestaña (tab) de Excepciones ni botón "Cerrar Mes"

### AC-2: Botones Mutantes
- **DADO** que el mes seleccionado está abierto (en curso)
- **CUANDO** el usuario ve los botones de la Tarjeta de Servicio
- **ENTONCES** dice "📊 Exportar Avance" (PDF) y "📋 Exportar Avance Excel"
- **DADO** que el mes seleccionado está cerrado (período oficial)
- **CUANDO** el usuario ve los botones
- **ENTONCES** dice "📥 Descargar Cartola Oficial" (PDF desde S3) y "📋 Descargar Cartola Excel"

### AC-3: Cierre Automático (Cronjob)
- **DADO** que es el día 5 de cada mes a las 00:00 hrs
- **CUANDO** se dispara el Cronjob
- **ENTONCES** el Worker de BullMQ procesa todos los servicios activos del mes anterior
- **Y** genera PDFs, los sube a S3, guarda Snapshots JSON y actualiza el período a CLOSED

### AC-4: Descarga PDF Histórico (S3)
- **DADO** que el mes está cerrado
- **CUANDO** el usuario hace clic en "Descargar Cartola Oficial PDF"
- **ENTONCES** el frontend solicita una URL firmada al backend
- **Y** el backend devuelve una URL S3 Signed URL con expiración de 5 minutos
- **Y** el navegador descarga el PDF directamente desde S3

### AC-5: Descarga Excel Histórico (Snapshot)
- **DADO** que el mes está cerrado
- **CUANDO** el usuario hace clic en "Descargar Cartola Excel" de servicio
- **ENTONCES** el backend lee el Snapshot JSON del servicio desde MongoDB
- **Y** reconstruye el Excel al vuelo y lo envía como descarga

### AC-6: Limpieza de Excepciones
- **DADO** que el código de excepciones fue eliminado
- **CUANDO** se hace un request HTTP a POST /reports/seal-exception
- **ENTONCES** el servidor devuelve 404 (ruta no existe)
- **Y** no existe ningún campo `unlockedUsers` siendo procesado en el controlador

### AC-7: Recuperación ante Fallos del Worker
- **DADO** que el Worker falla tras 3 retries
- **CUANDO** el equipo IT abre bull-board
- **ENTONCES** ve el trabajo en estado "Failed" con el mensaje de error
- **Y** puede hacer "Retry" desde bull-board sin tocar la aplicación

## Alcance

### En Scope
- Rediseño completo de ReportsView.vue (Split Layout)
- Worker BullMQ + Cronjob para cierre automático día 5
- Integración S3 agnóstica (MinIO dev / AWS prod)
- Eliminación de toda lógica de excepciones (backend + frontend)
- Nuevos endpoints: GET /reports/service/pdf (URL firmada S3)

### Fuera de Scope
- Sistema de nóminas de pago o integración con sistemas de RRHH externos
- Reapertura de períodos cerrados (decisión de dominio: sellado permanente)
- Notificaciones push/email al generar las cartolas
- Panel de administración para configurar el día de cierre

## Arquitectura Técnica

### Decisiones Clave
1. **Generación de PDF Server-side:** Usar `html-pdf-node` (wrapper de Puppeteer headless más liviano) para generar las cartolas masivas. Alternativa si no es suficiente: `puppeteer` directo.
2. **S3 Agnóstico:** `@aws-sdk/client-s3` + variable de entorno `AWS_ENDPOINT`. Si existe → MinIO local (dev). Si no → S3 real (prod). Con `forcePathStyle: true` para compatibilidad MinIO.
3. **Cola de Trabajos:** BullMQ con Redis. Una cola: `reportClosureQueue`. El Worker procesa los servicios de a 1 (no paralelo) para proteger la RAM del servidor.
4. **Cronjob:** `node-cron` con expresión `0 0 5 * *`. Insertar job en la cola BullMQ.
5. **Snapshot JSON:** Ya implementado en el codebase. El Worker lo aprovecha — no se reinventa.
6. **Signed URL S3:** `@aws-sdk/s3-request-presigner` genera URLs con 5 minutos de expiración.

### Flujo de Datos (Cierre de Mes)
```
Día 5 00:00 → node-cron → inserta job en reportClosureQueue (BullMQ)
    → Worker consume job
    → Para cada servicio activo:
        a. getMonthlyReport() × todos los usuarios → calcula datos vivos
        b. ReportSnapshot.upsert() → guarda JSON inmutable en MongoDB
        c. html-pdf-node.generate() → buffer PDF en memoria
        d. S3Client.PutObjectCommand() → sube a S3
        e. Period.pdfUrls.set(serviceId, s3Key) → guarda referencia
    → Period.status = 'CLOSED'
    → bull-board refleja estado final
```

### Flujo de Datos (Descarga Frontend)
```
Usuario selecciona servicio + mes cerrado → clic "Descargar Cartola PDF"
    → GET /api/reports/service/pdf?serviceId=&month=&year=
    → Controller busca Period.pdfUrls[serviceId] (S3 key)
    → getSignedUrl(s3Client, GetObjectCommand, { expiresIn: 300 })
    → Devuelve { signedUrl: "https://s3.aws.com/..." }
    → Frontend abre la URL en nueva pestaña → descarga directa desde S3
```

### Archivos y Dependencias Nuevas
```
server/
├── workers/report.worker.ts         [NUEVO] — BullMQ Worker
├── cron/report.cron.ts              [NUEVO] — node-cron día 5
└── config/s3.client.ts              [NUEVO] — Singleton S3Client agnóstico

Nuevas dependencias (server/package.json):
- @aws-sdk/client-s3
- @aws-sdk/s3-request-presigner
- html-pdf-node (o puppeteer)
- node-cron
- bullmq (verificar si ya existe)
```



## Plan de Implementacion

### FASE A: Setup de Infraestructura
#### A1: Instalar dependencias del servidor
- Verificar si bullmq ya existe en server/package.json
- Instalar: @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, html-pdf-node, node-cron
- Exito: Dependencias en package.json sin errores de compilacion

#### A2: Crear server/config/s3.client.ts
- Cliente S3 agnostico: endpoint desde AWS_ENDPOINT (si existe) + forcePathStyle:true
- Exportar getSignedDownloadUrl(key, expiresIn=300)
- Exito: Importable sin errores, sube test file a MinIO local

### FASE B: Backend - Limpieza de Excepciones (paralelo a A)
#### B1: Limpiar server/services/report.service.ts
- Eliminar: import ShiftExceptionModel, bloque fetch excepciones (lineas 151-158), logica "C. Excepcion" (lineas 263-270)
- Exito: sin referencias a ShiftException en el servicio

#### B2: Limpiar server/controllers/report.controller.ts
- Eliminar funcion sealException (lineas 110-150)
- Simplificar getMonthlySummary: eliminar logica unlockedUsers/isUnlocked
- Exito: Controlador sin referencias a unlockedUsers

#### B3: Limpiar server/routes/api/report.routes.ts
- Eliminar router.post('/seal-exception', ...)
- Exito: POST /reports/seal-exception devuelve 404

### FASE C: Backend - Worker y Cronjob (depende de A)
#### [x] C1: Crear server/workers/report.worker.ts
- Worker BullMQ: procesa reportClosureQueue
- Loop secuencial por servicios activos: getMonthlyReport() ? ReportSnapshot.upsert() ? html-pdf-node ? S3 PutObject ? guardar key en Period.pdfUrls
- Al finalizar: Period.status = 'CLOSED'
- attempts: 3, backoff exponential 5000ms
- Exito: Job manual en bull-board ? periodo CLOSED + PDF en S3/MinIO

#### [x] C2: Crear server/cron/report.cron.ts
- node-cron expresion: 0 0 5 * * (dia 5, 00:00 hrs)
- Inserta: reportClosureQueue.add('monthly-closure', { month, year })
- Registrar en bootstrap del servidor
- Exito: Job insertado correctamente en bull-board

#### [x] C3: Agregar endpoint GET /reports/service/pdf (depende de A2)
- Controller getServicePDFUrl: busca key S3 en Period.pdfUrls[serviceId], genera Signed URL
- Ruta: GET /service/pdf?serviceId=&month=&year=
- Exito: Endpoint devuelve { signedUrl } funcional

### FASE D: Modelo Period (depende de C1)
#### [x] D1: Actualizar server/models/period.model.ts
- Agregar campo pdfUrls: Map<string, string> (default empty)
- Exito: Worker puede guardar y leer keys S3 por servicio

### FASE E: Frontend (paralelo a B)
#### [x] E1: Redisenar ReportsView.vue - Split Layout
- Eliminar tabs (lineas 59-82), TAB Excepciones (192-237), boton Cerrar Mes (48-56)
- Nuevo layout: div.split-layout con Panel Izquierdo + Panel Derecho CSS Grid 2 Cards
- Eliminar del script setup: handleClosePeriod, confirmClosePeriod, handleAddException, handleSealException, showCloseConfirm, showUserSelectionModal, activeTab
- Diseno B2B premium: sombras, tipografia Inter, micro-animaciones hover
- Exito: Vista sin tabs, Split Layout visible

#### [x] E2: Implementar botones mutantes + descarga PDF S3 (depende de E1 y C3)
- Computed isPeriodClosed desde periodStore.isClosed
- downloadServicePDF(): si cerrado ? GET /reports/service/pdf ? window.open(signedUrl); si abierto ? generar al vuelo
- Textos mutantes: "Exportar Avance" vs "Descargar Cartola Oficial"
- Exito: Botones mutan, descarga desde S3 funciona en mes cerrado

## Definicion de Done
- Sin pestanas ni boton Cerrar Mes en UI
- Split Layout con 2 Cards premium visibles
- Botones mutan al cambiar mes abierto/cerrado
- Cronjob activo y registrado en servidor
- Job manual en bull-board ? periodo CLOSED + PDF en S3
- GET /reports/service/pdf devuelve Signed URL funcional
- POST /reports/seal-exception devuelve 404
- getMonthlyReport() no importa ni procesa ShiftExceptionModel

## Paralelizacion de Agentes

GRUPO 1 (paralelo, sin dependencias):
  Agente 1: FASE A (Setup S3 + dependencias)
  Agente 2: FASE B (Limpieza excepciones backend)
  Agente 3: FASE E1 (Rediseno UI Split Layout)

GRUPO 2 (paralelo, depende de Grupo 1):
  Agente 4: FASE C1+C2 (Worker + Cronjob) - depende de A
  Agente 5: FASE E2 (Botones mutantes + descarga S3) - depende de E1

GRUPO 3 (secuencial, depende de Grupo 2):
  Paso C3: Endpoint Signed URL - depende de A2
  Paso D1: Modelo Period - depende de C1
