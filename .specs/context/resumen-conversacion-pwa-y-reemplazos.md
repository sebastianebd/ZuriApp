# Resumen Ejecutivo de Acuerdos y Refinamiento — ZuriApp v2
> **Fecha:** 2026-09-14  
> **Ámbito:** Definición Funcional y Arquitectónica para Portal PWA, Bolsa de Reemplazos y Dominio Hospitalario  
> **Ubicación:** `.specs/context/resumen-conversacion-pwa-y-reemplazos.md`  
> **Documentos Oficiales Vinculados:**  
> - [zuriapp-v2-expansion-spec.md](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/.specs/docs/zuriapp-v2-expansion-spec.md)  
> - [session-handover.md](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/.specs/context/session-handover.md)  

---

## 1. Visión General y Contexto
Durante esta serie de sesiones de trabajo y refinamiento técnico, se avanzó en la transformación de **ZuriApp** (Hospital Base San José de Osorno - HBSJO) desde un sistema de registro pasivo de turnos hacia una plataforma inteligente de gestión operativa.

Se aplicaron principios estrictos de **Spec-Driven Development (SDD)** y **Pragmatismo Arquitectónico (Ponytail / YAGNI)**:
1. No alterar código de producción hasta contar con el visto bueno formal de la especificación.
2. Delimitación de dominio: ZuriApp gestiona cuadrantes operativos y reemplazos formales; **no calcula remuneraciones, descuentos ni se conecta a tótems de marcaje biométrico (SIRH)**.
3. Reutilización máxima del backend existente ([report.service.ts](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/server/services/report.service.ts), colas BullMQ, Redis, Socket.io).

---

## 2. Acuerdos Principales por Eje Temático

### A. Dominio de Reemplazos y Causales del Saliente (GAP-04)
* **Principio de Causalidad:** Un reemplazo es estrictamente un enlace 1-a-1 entre un titular ausente y un reemplazante entrante. **El motivo y las observaciones pertenecen exclusivamente al titular saliente** (explican por qué no estará presente), nunca al entrante.
* **Purga de Conceptos Erróneos:** Se eliminaron conceptos inválidos como *"Contingencia / Refuerzo Operativo"* (no es causal de ausencia individual) y *"Sin goce de sueldo"* (el sistema no evalúa si un permiso tiene goce de haberes o no).
* **Catálogo Oficial de 8 Causales de Ausencia:**
  1. `LICENCIA_MEDICA` (Licencia Médica)
  2. `PRE_POST_NATAL` (Pre / Postnatal y Parental)
  3. `PERMISO_ADMINISTRATIVO` (Permiso Administrativo)
  4. `FERIADO_LEGAL` (Feriado Legal / Vacaciones)
  5. `DIA_COMPENSATORIO` (Día Compensatorio)
  6. `COMISION_SERVICIO` (Comisión de Servicio / Capacitación)
  7. `PERMISO_GREMIAL` (Permiso Gremial)
  8. `OTRO` (Otro Motivo — exige detalle en observaciones)
* **Confidencialidad y Probidad Hospitalaria:** La identidad del saliente (`id_saliente`), su RUT y su causal médica son visibles para la jefatura en el sistema web; en la PWA se ocultan totalmente a los postulantes para evitar sesgos o vulneración de datos sensibles de salud.

---

### B. Bolsa de Reemplazos y Motor de Adjudicación (Fase 2)
* **Evolución del Término ("Desierta" $\rightarrow$ "Finalizada"):**
  * Se abandonó el término burocrático "Desierta".
  * Al expirar el plazo de una oferta (`expiresAt`), su estado pasa limpiamente a **"Finalizada"** (`status: 'finalized'`), independiente de si tuvo candidatos o no.
  * **Si tiene postulantes ($\ge 1$):** Se bloquean nuevas postulaciones; los postulantes ven *"En proceso de selección"* en su smartphone; la Jefa de Servicio revisa a los candidatos ordenados por el Score 5.2 y presiona *"Adjudicar Turno"*.
  * **Si tiene 0 postulantes:** Se dispara una alerta operativa en ZuriApp que abre directamente el **Scoring Engine (5.2)** mostrando el Top 10 de candidatos calificados del hospital con sus **números telefónicos directos** para llamada inmediata de contingencia.
* **Navegación Enterprise:**
  * Módulo independiente de primer nivel en el menú lateral ([SidebarMenu.vue](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/client/src/components/auth/SidebarMenu.vue)) como `📢 Bolsa de Reemplazos` (`/app/operaciones/bolsa-reemplazos`).
  * **Badge reactivo permanente:** Muestra exclusivamente la cantidad de ofertas abiertas/activas (`status: 'open'`). No se satura con ofertas vencidas o cerradas.
* **Adjudicación Atómica con Retiro en Cascada:**
  * Al adjudicar a un honorario el Turno A, el sistema automáticamente pasa a `'withdrawn_conflict'` cualquier otra postulación simultánea de ese mismo honorario que colisione en fecha/hora o viole las 4 reglas de descanso normativo (`NORM-01`, `NORM-02`, `NORM-03`, `NORM-06`).
* **Decisión DP-03 Eliminada:** El punto de decisión sobre la prioridad de inicio entre Dashboard y Alertas fue eliminado de la spec de arquitectura para ser zanjado directamente por el Tech Lead.

---

### C. Portal del Funcionario (PWA Móvil) — Arquitectura y Módulos

#### 1. Autenticación y Acceso Diario (Opción A)
* **Onboarding (1 sola vez al mes):** WhatsApp Magic Link + código OTP de 6 dígitos.
* **Sesión Persistente (30 días):** Cookie segura `HttpOnly`, `SameSite=Lax`.
* **Entrada sin fricción (1 toque):** El funcionario abre la app instalada en su teléfono o toca una notificación push y entra directamente **sin ingresar RUT ni contraseñas**. La seguridad física recae en el desbloqueo biométrico (FaceID/huella/PIN) del propio smartphone.

#### 2. Principio de Aislamiento Estricto de Datos (Anti-IDOR)
* **Regla Inquebrantable:** El funcionario en la PWA **única y exclusivamente puede ver, consultar y descargar su propia información** (turnos, reemplazos realizados, horas y reportes).
* **Seguridad en Backend:** Los endpoints móviles (`/api/pwa/*`) **no aceptan `userId` ni `staffId`** por query params ni body. Extraen la identidad forzosamente desde `req.staff._id` verificado en la cookie de sesión. Cualquier parámetro externo enviado por un cliente malicioso es descartado.
* Todo PDF generado en la PWA se emite timbrado y rotulado con el RUT y nombre exacto del usuario autenticado.

#### 3. Estructura de Módulos (App Shell Móvil)
A diferencia del sistema de escritorio, la PWA no tiene menús laterales ni dashboards de jefatura. Cuenta con un **Header superior con perfil** y una **Barra Inferior (*Bottom Navigation Bar*)** ergonómica para usar con un solo pulgar:

```
┌────────────────────────────────────────────────────────┐
│ 🏥 ZuriApp Móvil                     [🔔 2] [👤 Perfil]│
├────────────────────────────────────────────────────────┤
│                                                        │
│                 [ CONTENIDO DEL MÓDULO ]               │
│                                                        │
├────────────────────────────────────────────────────────┤
│  BARRA INFERIOR DE NAVEGACIÓN (BOTTOM BAR):            │
│                                                        │
│  Para Planta / Contrata (3 pestañas):                  │
│  [ 🏠 Inicio ]      [ 📅 Mis Turnos ]    [ 🔔 Avisos ] │
│                                                        │
│  Para Honorarios (4 pestañas):                         │
│  [ 🏠 Inicio ]  [ 📅 Mis Turnos ]  [ 📢 Bolsa ]  [ 🔔 ]│
└────────────────────────────────────────────────────────┘
```

##### Detalle de Módulos:

1. 🏠 **Módulo 1: Inicio (Home / Mini-Dashboard Operativo)**
   * **Tarjeta "Tu Próximo Turno":** Horario, servicio y confirmación rápida de turnos de los próximos 7 días:
     * `[ ✅ Confirmar Asistencia ]` (`confirmed` - ACK a Jefatura).
     * `[ ⚠️ Avisar Indisponibilidad ]` (`unavailable` - despliega bottom sheet para ingresar causal de fuerza mayor y dispara alerta Socket.io en tiempo real a Jefatura).
   * **Mini-Dashboard de Auto-consulta (KPIs Personales del Mes):**
     * Turnos del mes (cumplidos vs restantes programados).
     * Reemplazos realizados en el mes.
     * Horas diurnas (jornada ordinaria).
     * Horas nocturnas (con recargo y desgaste nocturno, según [report.service.ts](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/server/services/report.service.ts)).
   * **Emisión de Reporte del Mes:** Botón `[ 📄 Descargar Mi Avance del Mes (PDF) ]` en tiempo real (vital para que el honorario respalde su boleta de cobro mensual).
   * **Agenda Semanal:** Vista cronológica de los próximos 7 días (turnos y libres).

2. 📅 **Módulo 2: Mis Turnos (Dualidad Turno vs. Pseudo-Contrato de Reemplazo)**
   * **Distinción Conceptual de Dominio:**
     * *Turno Base:* Matriz fija programada del servicio que existe sí o sí para garantizar dotación 24/7 (`TurnAssignment`).
     * *Reemplazo:* Acto formal / "pseudo-contrato" administrativo de sustitución 1-a-1 (`Replacement`).
     * *Para el Honorario:* **No tiene turnos base de planta**. Cada jornada que trabaja existe porque hay un pseudo-contrato activo que lo amarra al titular ausente. Por ello, el honorario necesita auditar tanto su calendario diario como sus contratos de respaldo legal.
   * **Conmutador Superior:**
     * `[ 📅 Calendario de Turnos ]`: Cuadrícula mensual completa (FullCalendar) con siglas hospitalarias oficiales (`L`, `N`, `X`), distintivo visual dorado (`🤝`) en días de reemplazo, flechas `< Mes >` para navegar a períodos históricos cerrados con botón `[ 📄 Descargar Mi Cartola Oficial (PDF) ]`, y alternador opcional `[ 📋 Ver como Lista ]`.
     * `[ 🤝 Mis Reemplazos ]`: Cartola formal de pseudo-contratos con código de negocio `id_negocio` (ej: `REP-2026-0891`), servicio, fechas de vigencia, jornadas amarradas, estado (`Activo`, `Finalizado`, `Corte Anticipado`) y botón `[ 📄 Descargar Comprobante (PDF) ]`.
   * **Atajos (Deep Linking):**
     * Tocar el KPI en el Home (`🤝 X Reemplazos este mes ➔`) salta directo a la sub-pestaña *"Mis Reemplazos"*.
     * Tocar un día de reemplazo en el Calendario abre el detalle con botón `[ Ver Contrato de Reemplazo ➔ ]`.

3. 📢 **Módulo 3: Bolsa de Reemplazos (Exclusivo Personal a Honorarios)**
   * **Convocatorias Abiertas:** Turnos disponibles en cualquier servicio del hospital, estrictamente filtrados por el cargo del honorario (`staff.positionId.equals(offer.positionId)`). Temporizador en vivo (⏳ *"Cierra en 45m"*), botón para postular con validación normativa inmediata en memoria (<200 ms), y reserva total del titular saliente.
   * **Mis Postulaciones:** Historial con seguimiento de estados: *En postulación*, *En evaluación*, *Adjudicado*, *No seleccionado* y *Retirado por conflicto*.

4. 🔔 **Módulo 4: Avisos (Bandeja Push)**
   * Historial de notificaciones push recibidas en el teléfono (turnos adjudicados, cancelaciones, recordatorios del día anterior a las 18:00 hrs, nuevas convocatorias).

5. 👤 **Módulo 5: Mi Perfil (Header Drawer)**
   * Ficha personal (RUT, cargo, estamento, contrato).
   * Horas de silencio anti-fatiga (*Quiet Hours* 22:00 a 07:00).
   * Filtro de servicios favoritos para recibir alertas (honorarios).
   * Botón para cerrar sesión (invalida la cookie HttpOnly de 30 días).

---

## 3. Inventario de Componentes Nuevos PWA para Frontend (`client/src/`)

| Archivo | Tipo | Propósito |
|---|---|---|
| `views/portal/PortalLayout.vue` | Vista Base PWA | App Shell móvil, Header superior con perfil y Bottom Navigation Bar. |
| `views/portal/PortalLogin.vue` | Vista Auth | Validación de Magic Link y verificación de código OTP de WhatsApp. |
| `views/portal/PortalHome.vue` | Vista Home | Próximo turno, confirmación ACK/Indisponibilidad, Mini-Dashboard KPIs y descarga Avance PDF. |
| `views/portal/PortalShifts.vue` | Vista Mis Turnos | Calendario mensual, navegación histórica a meses cerrados, Cartola PDF y conmutador a Reemplazos. |
| `views/portal/PortalOpenOffers.vue` | Vista Bolsa | Convocatorias abiertas para postular y seguimiento de "Mis Postulaciones" (honorarios). |
| `views/portal/PortalNotifications.vue` | Vista Avisos | Bandeja cronológica de notificaciones push móviles. |
| `components/portal/ProfileDrawer.vue` | Componente Layout | Drawer de perfil, configuración anti-fatiga (quiet hours, servicios preferidos) y logout. |
| `components/portal/ShiftConfirmSheet.vue` | Componente Modal | Bottom Sheet interactivo para confirmación de asistencia o declaración de indisponibilidad con motivo. |
| `components/portal/ReplacementContractCard.vue` | Componente Card | Tarjeta de pseudo-contrato con código `id_negocio`, servicio, vigencia, estado y descarga de comprobante individual. |
| `components/portal/OfferCard.vue` | Componente Card | Tarjeta de convocatoria abierta con cuenta regresiva, pre-validación de descanso y botón de postulación. |

---

## 4. Próximos Pasos Técnicos para Implementación

Para dar comienzo a la codificación (respetando las fases del roadmap):

1. **Pre-requisitos de Base de Datos y Dominio (~4 días):**
   * **GAP-01:** Enum `estamento` (`MEDICO`, `PROFESIONAL`, `TECNICO`, `ADMINISTRATIVO`, `AUXILIAR`) en [position.model.ts](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/server/models/position.model.ts) y función `getLegalFramework()` en `server/utils/legal-framework.util.ts`.
   * **GAP-03:** Índices compuestos de alto rendimiento en [turn-assignment.model.ts](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/server/models/turn-assignment.model.ts) y [replacement.model.ts](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/server/models/replacement.model.ts).
   * **GAP-04:** Inclusión obligatoria de `motivo` (enum 8 causales del saliente) y `observaciones` en backend ([replacement.model.ts](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/server/models/replacement.model.ts), controlador, servicio) y frontend ([replacement.types.ts](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/client/src/types/replacement.types.ts), modales y tablas).
   * **Configuración de Servicios:** Campos `dotacion_minima` y `umbrales_cobertura` en [service.model.ts](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/server/models/service.model.ts).
2. **Ejecución de Fase 1:**
   * Dashboard Operativo de KPIs (4.1) o Motor de Alertas Inteligentes (4.2), según determine el Tech Lead.
