# Resumen Técnico de Sesión — Bolsa de Reemplazos, PWA y Motor de Turnos
> **Fecha:** 2026-09-25  
> **Ámbito:** Bolsa de Reemplazos, Portal PWA del Funcionario, Motor de Secuencias de Turnos, Sockets y Reglas de Negocio  
> **Ubicación:** `.specs/context/resumen-sesion-bolsa-pwa-turnos.md`  
> **Metodología:** Spec-Driven Development (SDD) & Test-Driven Development (TDD)  

---

## 1. Visión General
En esta sesión se abordaron e implementaron correcciones críticas de estabilidad, consistencia de datos y experiencia de usuario en el flujo integral de la **Bolsa de Reemplazos (Web)** y el **Portal del Funcionario (PWA)**, cerrando incidencias de compilación TypeScript, reactividad en tiempo real mediante WebSockets, desfases de zona horaria y cálculo dinámico de jornadas hospitalarias.

---

## 2. Puntos Clave Resueltos y Acuerdos Técnicos

### A. Estabilidad Backend & Socket Auth (TypeScript)
* **Incidencia:** Error `TSError: TS2551` y `TS2339` en `config/socket.ts` por acceso indebido a propiedades no declaradas en la interfaz de cuenta Mongoose (`isDeleted` vs `$isDeleted`, `name`).
* **Solución:** Se ajustaron los tipos e interfaces en `config/socket.ts`, garantizando tipado estricto y eliminando bloqueos en el arranque con `ts-node`.

---

### B. Notificaciones en Campana Web y Alcance por Servicio
* **Incidencia:** Al hacer clic en la campana de notificaciones de la jefatura, los avisos desaparecían instantáneamente por un auto-dismiss incorrecto en el frontend.
* **Modelo de Permisos para Notificaciones:**
  * **Rol Administrador (`level: 999`):** Acceso y visibilidad global de todas las alertas institucionales a través de la sala WebSocket `hospital:all`.
  * **Jefaturas y Mandos Medios (Jefe de Servicio, Supervisor, Coordinador, Jefe de Turno):** Acceso y suscripción focalizada exclusivamente a los servicios clínicos bajo su responsabilidad (`service:${serviceId}`).
* **Solución:** Se corrigió el ciclo de vida del dropdown en `AlertsBell.vue` y el filtrado por estado `active` en `alert.store.ts`.

---

### C. Reactividad Granular en la Tabla de Convocatorias (Anti-Parpadeo)
* **Incidencia:** Cada vez que un funcionario postulaba o retiraba su postulación, la tabla completa de la jefatura volvía a solicitar datos al servidor, mostrando spinners repetitivos ante alta concurrencia.
* **Solución:** Se optimizó la reactividad vía Socket.IO (`offer:applied`, `offer:withdrawn`):
  * La tabla web actualiza **única y exclusivamente el contador del botón de postulantes** de la fila afectada en memoria, sin re-renderizar la grilla ni disparar peticiones REST redundantes.

---

### D. Flujo de Postulación en el Portal PWA
1. **Eliminación del Botón Cancelar (Anti-Spam):**
   * Se retiró el botón *"Postulado Cancelar"* para evitar conductas erráticas de postular/cancelar repetitivamente.
   * Al postular, el botón cambia de forma irreversible a estado deshabilitado (gris) con el texto: **«Ya aplicaste a este Reemplazo»**.
2. **Consistencia de Estado en Postulaciones:**
   * Si la jefatura anula una convocatoria abierta desde el escritorio, en la sección *"Mis postulaciones"* de la PWA el estado se refleja automáticamente como **«Anulada»** (en lugar de *"En evaluación"*).

---

### E. Adjudicación de Convocatorias y Prevención de Errores 500
* **Incidencia:** Al crear una convocatoria desde el botón *"Nueva Convocatoria"*, los dropdowns de servicio y tipo de turno aparecían vacíos (*"sorry, no matching options"*). Al adjudicar una postulación, el endpoint arrojaba `Error 500`.
* **Causas y Soluciones:**
  1. **Dropdowns:** Se aseguró la carga reactiva de `useServiceStore()` y `useTurnTypeStore()` en `ReplacementOffersView.vue` y `ReplacementModalCreate.vue`.
  2. **Adjudicación (500):** Al crear el registro en `Replacement`, faltaban campos obligatorios heredados del saliente (`id_saliente`, `rut_saliente`, `nombre_saliente`, `apellido_saliente`, `motivo`, `observaciones`), un estado inicial válido (`PENDIENTE` o `EN CURSO` según la fecha de inicio) e invalidación de caché en Redis (`delPattern`). Se implementaron y blindaron con pruebas de integración.

---

### F. Notificaciones y Reactividad en la PWA al Adjudicar
* **Incidencia:** Tras adjudicarse una oferta en la web, el funcionario no recibía notificación en su campana y la sub-pestaña *"Mis Reemplazos"* no se actualizaba sin refrescar la página.
* **Solución:**
  * En `server/services/socket.service.ts` se implementó `emitOfferAwarded` que emite a la sala privada `staff:${staffId}` y en broadcast.
  * En `client/src/stores/portal.store.ts` se registraron los listeners para `offer:awarded` y `turn:update`. Al recibir la adjudicación, se agrega una notificación no leída (`¡Turno Adjudicado!`) a la campana y se refrescan automáticamente `fetchHome()` y `fetchShifts()`.

---

### G. Resolución de Secuencias de Turnos (Snapshot Pattern) y Eliminación de Texto Largo
* **Incidencia:** En el calendario mensual de la PWA, los días del reemplazo mostraban el texto `"CUARTO TURNO"` desbordando las celdas circulares en cada día.
* **Causa Raíz:** `ReplacementOfferService.createOffer` no resolvía el catálogo de `TurnType`, guardando `snapshot_secuencia: []`. En `pwa-shifts.service.ts`, al estar vacía la secuencia, hacía fallback a `sigla = activeRep.tipo_turno` (`"CUARTO TURNO"`).
* **Solución:**
  1. `createOffer` y `awardOffer` ahora congelan la secuencia oficial del turno (`L, N, X, X`) en el documento mediante el patrón Snapshot.
  2. En `pwa-shifts.service.ts` se implementó una resolución dinámica de respaldo: si un reemplazo histórico quedó sin secuencia en la base de datos, la resuelve en caliente consultando `TurnType`.
  3. Sanitización estricta: ninguna sigla puede tener más de 2 caracteres (`sigla.length <= 2 ? rawSigla : 'L'`).

---

### H. Formato Determinista de Fechas Inmune a Zonas Horarias
* **Incidencia:** Un reemplazo configurado del 04/10 al 10/10 se mostraba desfasado (días 5 al 11) debido a que `new Date("2026-10-05T00:00:00Z").toLocaleDateString('es-CL')` en Chile (UTC-3) restaba 3 horas y caía en las 21:00 hrs del 04/10.
* **Solución:**
  * En `ReplacementOffersView.vue`, `formatDate` ahora extrae los componentes del string `YYYY-MM-DD` directamente con fallback a `timeZone: 'UTC'`.
  * En `pwa-shifts.service.ts`, las comparaciones de fechas y cálculo de días se realizan con cadenas `YYYY-MM-DD` y milisegundos UTC exactos (`86400000 ms/día`).

---

### I. Cálculo Dinámico de Jornadas Comprometidas (Agnóstico a Tipos de Turno)
* **Incidencia:** En la tarjeta de *"Mis Reemplazos"* (`RPL-121`), el indicador *"Jornadas Comprometidas"* mostraba **4 turnos** para un contrato de 10 días en Tercer Turno (`L, L, N, N, X, X`), cuando en realidad la funcionaria trabajaba **8 turnos** y descansaba 2 días libres.
* **Causa:** El código contaba los turnos laborables de un solo ciclo de la secuencia (`seq.filter(s => !s.es_libre).length`), en vez de proyectar la duración total del contrato.
* **Solución Dinámica:**
  * Se implementó un algoritmo agnóstico que itera día por día sobre el rango del contrato (`totalDays`) aplicando el módulo de la secuencia (`i % seq.length`):
    ```typescript
    let committedShifts = 0;
    if (seq && seq.length > 0 && diffDays > 0) {
      for (let i = 0; i < diffDays; i++) {
        const step = seq[i % seq.length];
        const sigla = (step?.sigla || '').trim().toUpperCase();
        const isWork = !step?.es_libre && sigla !== 'X' && sigla !== '-';
        if (isWork) committedShifts++;
      }
    } else {
      committedShifts = diffDays;
    }
    ```
  * Soporta secuencias estándar (3er y 4to turno) y patrones arbitrarios no convencionales (ej. secuencias de 5 o 7 días).

---

### J. Blindaje y Aislamiento de Rol de Planta para Funcionarios a Honorarios
* **Incidencia:** El calendario de octubre de una funcionaria honoraria se mostraba lleno con Tercer Turno en los días 1-4 y 12-31, a pesar de tener un único reemplazo adjudicado del 5 al 11.
* **Causa:** En pruebas anteriores se le había cambiado temporalmente el contrato a contrata/planta y se le había asignado un rol institucional mensual en `turnassignments`. Al devolverla a honorario, ese registro residual continuaba proyectándose.
* **Regla de Negocio Implementada:**
  * El personal con contrato **`HONORARIO`** no pertenece a la planta institucional; sus turnos provienen **exclusivamente de sus reemplazos asignados**.
  * En `PwaShiftsService.getShifts`:
    ```typescript
    const isHonorario = (staffDoc as any)?.contractType === 'HONORARIO';
    const assignments = isHonorario ? [] : rawAssignments;
    ```
  * Si el funcionario es Honorario, las asignaciones regulares de planta se descartan (`assignments = []`), garantizando que los días sin reemplazo queden completamente libres y limpios.
  * Se eliminó el registro residual huérfano de MongoDB y se limpió la caché de Redis.

---

## 3. Métricas de Calidad y Pruebas Automatizadas (TDD)

Todas las correcciones fueron desarrolladas bajo el ciclo estricto **RED-GREEN-REFACTOR**:

| Componente | Suites de Test | Tests Totales | Estado |
| :--- | :---: | :---: | :---: |
| **Backend (Node.js / Express / Vitest)** | **43** | **271** | **100% PASS** |
| **Frontend (Vue 3 / Pinia / Vitest)** | **54** | **240** | **100% PASS** |
| **Typecheck Backend (`tsc`)** | — | — | **0 errores** |
| **Typecheck Frontend (`vue-tsc`)** | — | — | **0 errores** |

---

## 4. Estado de Infraestructura y Servicios
* **Contenedores Docker Activos:**
  * `zuri_server`: Operativo en puerto 3500 con workers BullMQ y Socket.IO activos.
  * `zuri_client`: Operativo en puerto 5173.
  * `zuri_mongo`: Base de datos sincronizada y saneada.
  * `zuri_redis`: Caché de sesiones e invalidación de consultas operando con normalidad.
