# Traspaso de Sesión — ZuriApp v2
- **Fecha:** 2026-09-12
- **Objetivo General:** Especificación y diseño arquitectónico para la expansión "ZuriApp v2" (Hospital Base San José de Osorno - HBSJO). Transformar el sistema de un registro pasivo de turnos a una plataforma de gestión inteligente: Dashboard de KPIs, Motor de Alertas normativo/operativo, Portal PWA para funcionarios y Bolsa de Reemplazantes con scoring.

---

## 1. Decisiones Clave Acordadas

- **GAP-01 / DP-01 (Estatuto Jurídico):** Resuelto. Se agrega enum `estamento` (`MEDICO`, `PROFESIONAL`, `TECNICO`, `ADMINISTRATIVO`, `AUXILIAR`) al modelo `Position`. El marco legal (`LEY_18834`, `LEY_19664`, `CODIGO_TRABAJO`) se deriva en runtime mediante `getLegalFramework(staff.contractType, position.estamento)`. El modelo `Staff` no se modifica.
- **GAP-02 / DP-02 (Patrones de Turno Dinámicos):** Resuelto. Descartado el campo `turnPattern` en `TurnType` (YAGNI). ZuriApp modela turnos con secuencias cíclicas arbitrarias (`secuencia[]`). Se validó que el 3er turno hospitalario chileno real es de 6 días (`L L N N X X`) y desliza sobre la semana calendario. El motor evalúa matemáticamente horas de descanso efectivas (post-noche $\ge$ 24h/48h, entre turnos $\ge$ 12h) y semanas ISO (Lunes a Domingo) para balances de 44h y sobretiempo.
- **GAP-03 (Pertenencia Dinámica Staff ↔ Service):** Resuelto. En el sistema público chileno el personal no está ligado contractualmente a un servicio (facultad de destinación). Se adopta pertenencia dinámica deducida de `TurnAssignment` y `Replacement` activos en el rango de fechas. Optimizado mediante índices compuestos:
  - `TurnAssignment`: `{ service: 1, start_date: 1, end_date: 1 }`
  - `Replacement`: `{ servicio: 1, fecha_inicio: 1, fecha_termino: 1 }`
- **DP-04 (Configurabilidad de Umbrales & Cobertura):** Resuelto. Modelo de dos niveles:
  1. *Normativos (Leyes):* Constantes fijas en código (no editables por UI).
  2. *Dotación por Servicio:* Campo `Service.dotacion_minima[]` con `{ positionId, minimo_dia, minimo_noche }`, editable en UI.
  - *Doble Horizonte de Cobertura:*
    - **Capa 1 (Alerta `OPS-01`):** Evalúa ventana rodante de 7 días. El cron diario evita duplicados creando una sola alerta activa por `(serviceId + fecha + franja + positionId)` y la marca `RESOLVED` automáticamente cuando el turno es cubierto.
    - **Capa 2 (Dashboard mensual):** Recalcula KPIs del mes en tiempo real con caché en Redis (TTL 24h) e invalidación reactiva por Socket.io (`service:{serviceId}`) hacia Pinia store.
- **DP-05 (Portal del Funcionario & PWA):** Resuelto y refinado con arquitectura App Shell móvil:
  - *Autenticación sin contraseñas:* Magic Link + OTP de 6 dígitos por WhatsApp para el onboarding inicial.
  - *Sesión Persistente (30 días):* Cookie `HttpOnly` persistente por 30 días. **Acceso con 1 solo toque** sin ingresar RUT ni contraseñas cada vez que se abre la app o se pulsa una notificación push.
  - *Aislamiento Estricto de Datos (Anti-IDOR):* El funcionario en la PWA **única y exclusivamente puede consultar y descargar sus propios datos y reportes**. Los endpoints de consulta (`/api/pwa/*`) ignoran cualquier `userId` recibido y extraen forzosamente la identidad desde `req.staff._id` en el JWT verificado.
  - *Estructura Modular (Bottom Bar):*
    - 🏠 **Inicio:** Próximo turno con ACK (`confirmed`) o indisponibilidad (`unavailable` con alerta crítica a jefatura), más **Mini-Dashboard de auto-consulta de KPIs** (turnos del mes, coberturas/reemplazos realizados, horas diurnas y nocturnas de recargo calculadas por `report.service.ts`), y botón para **descargar su Avance del Mes (PDF)**.
    - 📅 **Mis Turnos (Dualidad Turno vs Pseudo-Contrato):** Conmutador superior entre `[ 📅 Calendario de Turnos ]` (cuadrícula mensual con distintivo de reemplazos, histórico de meses pasados y Cartola Oficial PDF) y `[ 🤝 Mis Reemplazos ]` (cartola de contratos administrativos `REP-2026-XXXX`, vigencia, turnos amarrados, estado y descarga de comprobante individual). Atajos directos desde el Home (tarjeta de KPI) y desde el día seleccionado en el Calendario.
    - 📢 **Bolsa de Reemplazos (Exclusivo Honorarios):** Convocatorias abiertas de todo el hospital estrictamente para su cargo (`positionId`), postulación en 1 toque y seguimiento de postulaciones.
    - 🔔 **Avisos:** Bandeja de notificaciones push recibidas.
    - 👤 **Mi Perfil (Header Drawer):** Datos del funcionario, horario silencioso anti-fatiga (22:00-07:00), selector de servicios preferidos y botón de cierre de sesión.
- **Bolsa de Reemplazos & Retiro en Cascada (Fase 2):** Resuelto y blindado:
  - *Arquitectura Enterprise de Navegación:* Módulo de primer nivel en el menú lateral ([SidebarMenu.vue](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/client/src/components/auth/SidebarMenu.vue)) como `📢 Bolsa de Reemplazos` (`/app/operaciones/bolsa-reemplazos`) con **Badge Reactivo Permanente** con el total de ofertas abiertas/activas (`status: 'open'`). Las ofertas vencidas o desiertas se canalizan vía notificaciones sin sobrecargar el badge. Evita la sobrecarga de pestañas (tab fatigue) en la vista de Reemplazos Oficiales.
  - *Interconexión Cruzada Fluida:* Botón rápido en [ActiveReplacementsView.vue](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/client/src/views/active-replacements/ActiveReplacementsView.vue) para ver la Bolsa de Reemplazos, y botón de navegación directa hacia Reemplazos Oficiales tras adjudicar.
  - *Embudo Operativo:* La jefatura usa el mismo modal de creación de reemplazos ([ReplacementModalCreate.vue](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/client/src/components/replacements/ReplacementModalCreate.vue)), selecciona el saliente y los turnos, oculta el selector de `id_entrante` y publica con vencimiento (`expiresAt`).
  - *Alcance Multiservicio y Confidencialidad:* Los honorarios ven vacantes de cualquier servicio del hospital que coincidan con su cargo (`positionId`). Se mantiene estricta reserva de la identidad del titular saliente (`id_saliente`).
  - *Adjudicación Atómica:* Al adjudicar a un postulante rankeado por el Score 5.2 en [ReplacementOfferApplicantsModal.vue](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/client/src/components/replacements/ReplacementOfferApplicantsModal.vue), se crea el `Replacement` oficial en una sola transacción, y el sistema **auto-retira en cascada (`withdrawn_conflict`)** al postulante de todas sus otras postulaciones abiertas que colisionen en horario o violen descansos normativos (`NORM-01`, `NORM-02`, `NORM-03`).
  - *Convocatorias Finalizadas (Con vs. Sin Postulantes):* Al expirar el plazo (`expiresAt`), pasa a `'finalized'`. Si tiene postulantes ($\ge 1$), se cierran nuevas postulaciones, los candidatos ven *"En proceso de selección"* en su PWA y la jefa recibe notificación para adjudicar; si vence con 0 postulantes, dispara alerta operativa a la jefatura con enlace directo al panel del **Scoring Engine (5.2)** mostrando el Top 10 de candidatos calificados y sus números de teléfono directo.
- **Causal de Ausencia del Saliente (Motivo & Observaciones en Reemplazos):** Resuelto y blindado:
  - *Modelo de Datos:* Se agregan los campos `motivo` (desplegable obligatorio) y `observaciones` (texto libre opcional) tanto en [replacement.model.ts](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/server/models/replacement.model.ts) como en `ReplacementOffer`.
  - *Causales Exactas de Ausencia (8):* `LICENCIA_MEDICA`, `PRE_POST_NATAL`, `PERMISO_ADMINISTRATIVO`, `FERIADO_LEGAL`, `DIA_COMPENSATORIO`, `COMISION_SERVICIO`, `PERMISO_GREMIAL` y `OTRO`.
  - *Delimitación de Dominio:* Se eliminó la etiqueta "sin goce de sueldo" (ZuriApp no gestiona nóminas ni remuneraciones).
  - *Confidencialidad Hospitalaria:* El motivo del ausente es visible exclusivamente para la jefatura y supervisión en el sistema web; en la PWA se oculta a los postulantes para proteger la privacidad del titular saliente.
- **Descarte de "Solicitud de Cambio entre Pares" (YAGNI / Dominio Hospitalario):** Resuelto y depurado. Se eliminó la feature de intercambio de turnos entre colegas (`shift-swap-request.model.ts` y vistas asociadas). En hospitales públicos chilenos (Ley 18.834), los intercambios entre pares no se practican ni se autorizan por: (a) responsabilidad administrativa/sumario por abandono de deberes ante eventos adversos clínicos, (b) control de asistencia biométrico de RRHH, y (c) régimen remunerativo de turnos rotativos (DFL 30). Las ausencias se manejan formalmente mediante solicitud a jefatura o Bolsa de Reemplazos. Ahorro: -3 semanas de desarrollo innecesario.
- **Refinamiento de Dominio Dashboard 4.1 (Tasa de Reemplazos vs Asistencia Biométrica):** Resuelto y blindado. ZuriApp no se conecta a los tótems dactilares de marcaje de RRHH (SIRH). Se descarta el concepto de "Tasa de Ausentismo" y se formaliza como **"Tasa de Reemplazos"** (`replacementRate = (jornadas reemplazadas / jornadas programadas) * 100`), midiendo la estabilidad y fricción operativa de la dotación. Se especificó el DTO TypeScript completo `DashboardKPIResponse`, invalidación en Redis (TTL 24h) y reactividad con `dashboard:invalidated` vía Socket.io.
- **Refinamiento de Cobertura y Gobernanza de Dotación (Semáforo Contextual & RBAC):** Resuelto y blindado:
  - *Semáforo Contextual:* Cada servicio almacena `umbrales_cobertura` (`verde` default 95%, `amarillo` default 85%). Permite que el 90% en Maternidad sea 🟢 *Óptimo* y en UCI sea 🟡 *Alerta* o 🔴 *Crítico*.
  - *Gobernanza Contextual:* Endpoint dedicado `PATCH /api/services/:id/staffing` con validación RBAC en backend: solo editable por `SYS_ADMIN` o si el usuario figura como `jefe_servicio`, `supervisor` o en `coordinadores[]` de ESE servicio. Otros usuarios ven el dashboard en solo lectura (sin botón ⚙️).
  - *UX / Preferencia de Servicio:* Se almacena `zuriapp_preferred_service` en `localStorage` para entrar directamente al servicio habitual de la supervisora.
- **Refinamiento de Alertas Inteligentes 4.2 (Catálogo Purgado, DTOs & Modelo Dual):** Resuelto y blindado.
  - *Catálogo Purgado a 6 Reglas Esenciales:* 4 normativas (`NORM-01` descanso 12h, `NORM-02` doble turno prohibido, `NORM-03` descanso post-noche < 24h, `NORM-06` sobretiempo semanal ISO > 44h) y 2 operativas (`OPS-01` cobertura ventana 7 días con auto-resolución, `OPS-02` 3+ noches seguidas).
  - *7 Reglas Descartadas por Dominio (YAGNI):* `NORM-05` (turnos de reemplazo son siempre de 12h en hospitales), `OPS-03` (`replacement.cron.ts` ya cierra reemplazos automáticamente), `OPS-04` (redundante con `OPS-01`), `OPS-05` (excepciones de turno son automáticas), y `EQ-01`, `EQ-02`, `EQ-03` (la concentración de reemplazos es deliberada por pericia técnica y seguridad del paciente; 4to turno cicla fines de semana solo).
  - *Modelo Dual:* Evaluación en Tiempo Real (< 10ms al mutar turnos) + Cron Diario (06:00 AM con auto-resolución de alertas cubiertas).
  - *Arquitectura de Alto Rendimiento (Cero N+1):* Interface `RuleContext` para pasar datos precargados en memoria RAM a las 6 reglas puras; índice de idempotencia para evitar duplicados en OPS-01; DTOs de API (`AlertDTO`, `AlertsListResponse`, `ResolveAlertDTO`) y eventos Socket.io (`alert:new`, `alert:acknowledged`, `alert:resolved` en room `service:{serviceId}`).
- **DP-03 (Prioridad de Inicio F1):** Pospuesto de común acuerdo para cuando se decida comenzar la fase de implementación de código.

---

## 2. Estado Actual del Trabajo

- **Completado:**
  - Especificación formal consolidada y refinada en [zuriapp-v2-expansion-spec.md](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/.specs/docs/zuriapp-v2-expansion-spec.md) (1247 líneas).
  - **Fase 1 (Dashboard de KPIs + Motor de Alertas):** 100% blindada (Tasa de reemplazos, semáforo contextual, RBAC de dotación, 6 reglas purgadas, doble disparador tiempo real + cron).
  - **Fase 2 (Portal PWA + Bolsa de Reemplazos + Scoring Engine):** 100% blindada (Sesión 30 días con 1 toque, confirmación de turnos, módulo Bolsa de Reemplazos, causales de ausencia del titular saliente GAP-04, retiro en cascada y escalación a Scoring).
  - **Fase 3 (Consolidación y Notificaciones Push):** 100% blindada (Catálogo Web Push purgado exclusivo para PWA sin referencias a dashboard, onboarding OTP WhatsApp acotado).
  - Estimación total reducida a **~12 semanas (~3 meses)** (ahorro neto de 6 semanas frente al roadmap original).
  - Tablas de arquitectura, rutas, modelos y cronograma completamente sincronizadas.
- **En Progreso:**
  - Transición y preparación para el inicio de la implementación en código.

---

## 3. Próximo Paso Inmediato

Al retomar el proyecto para comenzar a codificar:
1. Definir **DP-03** (decidir si se arranca por el *Dashboard de KPIs* o por el *Motor de Alertas*).
2. Implementar los pre-requisitos de base de datos, utilitarios y modelo base (~4 días de trabajo):
   - **GAP-01:** Agregar campo `estamento` a [position.model.ts](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/server/models/position.model.ts) y función `getLegalFramework` en `server/utils/legal-framework.util.ts`.
   - **GAP-03:** Agregar índices compuestos en [turn-assignment.model.ts](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/server/models/turn-assignment.model.ts) y [replacement.model.ts](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/server/models/replacement.model.ts).
   - **GAP-04:** Incorporar causal de ausencia del saliente (`motivo` enum 8 causales + `observaciones`) en backend ([replacement.model.ts](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/server/models/replacement.model.ts), controller y service) y frontend ([replacement.types.ts](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/client/src/types/replacement.types.ts), modales y vista de reemplazos).
   - **Fase 1 (Pre):** Agregar campos `dotacion_minima` y `umbrales_cobertura` a [service.model.ts](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/server/models/service.model.ts).

---

## 4. Archivos Clave a Consultar

- `.specs/docs/zuriapp-v2-expansion-spec.md` — Documento maestro de arquitectura y especificación funcional de ZuriApp v2.
- `server/services/report.service.ts` — Lógica core existente para cálculo de turnos cíclicos (`diff % patternSeq.length`) y desglose de horas diurnas/nocturnas (`calculateDayNightMetrics`). Reutilizable en KPIs y alertas.
- `server/services/notification.service.ts` — Integración actual con Meta WhatsApp Cloud API.
- `server/models/service.model.ts` — Modelo donde reside la estructura organizativa de cada servicio.
- `server/models/turn-assignment.model.ts` — Asignaciones activas de cuadrantes.
- `server/models/shift-exception.model.ts` — Mecanismo oficial existente para registrar alteraciones a los turnos base.

---

## 5. Advertencias o Cosas a Evitar

1. **NO agregar pertenencia fija en `Staff`:** No agregar `serviceId` ni tablas pivot fijas para asociar personal a servicios; en el sistema de salud chileno el personal rota y se destina dinámicamente según contingencias.
2. **NO categorizar turnos de forma estática:** No crear enums rígidos de secuencias (como `TERCER_TURNO` o `CUARTO_TURNO`). La evaluación debe ser siempre matemática sobre las horas efectivas entre marcas y secuencias activas.
3. **NO intentar resucitar el cambio de turnos entre pares:** El feature fue evaluado y descartado intencionalmente por incompatibilidad legal y sumarios administrativos en hospitales públicos.
4. **NO evaluar cobertura mensual para alertas activas:** La alerta `OPS-01` debe correr sobre una ventana deslizante de 7 días. Si evalúa el mes completo, disparará falsas alarmas masivas sobre cuadrantes que aún se están planificando.
5. **Caché y concurrencia:** El cálculo del Dashboard mensual debe protegerse con Redis server-side e invalidarse únicamente por mutaciones reales (`TurnAssignment`, `ShiftException`, `Replacement`) para evitar saturar MongoDB en visitas recurrentes.
