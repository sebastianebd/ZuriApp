---
title: "Fase 2: Portal PWA - Backend: Turnos, Confirmaciones, Indisponibilidad (OPS-03) y Reportes PDF Timbrados"
type: feature
status: done
agents:
  - qa
  - backend
---

# Fase 2: Portal PWA - Backend: Turnos, Confirmaciones, Indisponibilidad (OPS-03) y Reportes PDF Timbrados

## 1. Contexto y Objetivos

Conforme a las Secciones 5.1.4, 5.1.5 y 5.1.9 de la especificación técnica maestra ([zuriapp-v2-expansion-spec.md](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/.specs/docs/zuriapp-v2-expansion-spec.md)):

- **Consulta de Próximo Turno y Confirmación (ACK):** Los funcionarios pueden confirmar su asistencia (`status: 'confirmed'`) para los turnos de los próximos 7 días, notificando de antemano a la jefatura de servicio.
- **Reporte de Indisponibilidad y Alerta Crítica `OPS-03`:** Si un funcionario reporta fuerza mayor o indisponibilidad (`status: 'unavailable'`), es obligatorio incluir un motivo (`reason`). El sistema registra el evento en `ShiftConfirmation`, genera de forma automática y persistente una alerta crítica `OPS-03: INDISPONIBILIDAD_REPORTADA` en la colección `Alert` y emite `'alert:new'` en tiempo real vía WebSockets (`service:{serviceId}`) hacia la campana de escritorio de la jefatura.
- **Mini-Dashboard de Auto-Consulta de KPIs Personales:** Reutiliza la lógica de [report.service.ts](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/server/services/report.service.ts) para calcular:
  - Turnos del mes cumplidos vs restantes.
  - Reemplazos realizados en el mes.
  - Horas ordinarias diurnas y horas nocturnas con recargo (desglose vital para remuneración y compensaciones DFL 30).
- **Dualidad Turno vs. Pseudo-Contrato:** Para los honorarios, cada jornada de trabajo está amparada por un contrato de reemplazo (`Replacement`). El endpoint `/api/pwa/shifts` retorna tanto las marcas de calendario como la lista de contratos `REP-XXXX`.
- **Emisión de Reportes PDF con Aislamiento Estricto (Anti-IDOR):**
  - Avance del mes en curso (`/api/pwa/reports/advance`).
  - Cartola oficial de meses cerrados (`/api/pwa/reports/cartola`).
  - Comprobante individual de reemplazo (`/api/pwa/replacements/:id/voucher`).
  - Todo documento se rotula y timbra con el RUT y nombre exacto del `req.staff._id` verificado en sesión.

---

## 2. Contrato Técnico Explícito

### 2.1 Modelo MongoDB: Confirmación de Turno (`server/models/shift-confirmation.model.ts`)

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IShiftConfirmation extends Document {
  staffId: mongoose.Types.ObjectId;
  assignmentId: mongoose.Types.ObjectId;
  assignmentModel: 'TurnAssignment' | 'Replacement';
  serviceId: mongoose.Types.ObjectId;
  date: Date;
  status: 'confirmed' | 'unavailable';
  reason?: string;
  confirmedAt: Date;
  source: 'pwa';
  created_at: Date;
  updated_at: Date;
}

const shiftConfirmationSchema = new Schema<IShiftConfirmation>(
  {
    staffId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
    assignmentId: { type: Schema.Types.ObjectId, required: true },
    assignmentModel: { type: String, enum: ['TurnAssignment', 'Replacement'], required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['confirmed', 'unavailable'], required: true },
    reason: { type: String, maxlength: 500 },
    confirmedAt: { type: Date, default: Date.now },
    source: { type: String, default: 'pwa' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

shiftConfirmationSchema.index({ staffId: 1, date: 1, assignmentId: 1 }, { unique: true });
shiftConfirmationSchema.index({ serviceId: 1, date: 1, status: 1 });
```

### 2.2 Tipos TypeScript y DTOs (`server/types/portal.types.ts`)

```typescript
export interface PortalHomeSummaryDTO {
  nextShift: {
    id: string;
    assignmentModel: 'TurnAssignment' | 'Replacement';
    date: string;              // YYYY-MM-DD
    sigla: string;             // 'L', 'N', etc.
    entryTime: string;         // '08:00'
    exitTime: string;          // '20:00'
    serviceName: string;
    serviceLocation?: string;
    confirmationStatus?: 'confirmed' | 'unavailable';
    canConfirm: boolean;       // true si está dentro de los próximos 7 días
  } | null;
  kpis: {
    shiftsCompleted: number;
    shiftsRemaining: number;
    replacementsCount: number;
    dayHours: number;
    nightHours: number;
    totalHours: number;
  };
  weeklyAgenda: Array<{
    date: string;
    dayName: string;
    sigla: string;
    isWorkDay: boolean;
    isReplacement: boolean;
    shiftName: string;
    serviceName: string;
  }>;
}

export interface PortalShiftItemDTO {
  date: string;                // YYYY-MM-DD
  sigla: string;
  isWorkDay: boolean;
  isReplacement: boolean;
  replacementId?: string;
  replacementBusinessCode?: string; // ej: 'REP-2026-0891'
  serviceId: string;
  serviceName: string;
  entryTime?: string;
  exitTime?: string;
  confirmationStatus?: 'confirmed' | 'unavailable';
}

export interface PortalReplacementContractDTO {
  id: string;
  businessCode: string;        // ej: 'REP-2026-0891'
  serviceId: string;
  serviceName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: 'Activo' | 'Finalizado' | 'Corte Anticipado';
  shiftsCommittedCount: number;
  origin: 'Asignación Directa' | 'Bolsa de Reemplazos';
}

export interface PortalShiftsResponseDTO {
  period: { month: number; year: number };
  isClosed: boolean;
  shifts: PortalShiftItemDTO[];
  replacementContracts: PortalReplacementContractDTO[];
}

export interface ConfirmShiftDTO {
  assignmentModel: 'TurnAssignment' | 'Replacement';
  date: string;
}

export interface ReportUnavailableDTO {
  assignmentModel: 'TurnAssignment' | 'Replacement';
  date: string;
  reason: string;
}
```

### 2.3 Endpoints y Rutas de API (`server/routes/api/portal.routes.ts`)

Todos protegidos por `portalAuthMiddleware` (identidad extraída de `req.staff._id`):

| Método | Endpoint | Middleware | Código Éxito | Descripción |
|---|---|---|:---:|---|
| `GET` | `/api/pwa/home` | `portalAuthMiddleware` | `200 OK` | Próximo turno, confirmación pendiente, KPIs del mes y agenda de 7 días. |
| `GET` | `/api/pwa/shifts` | `portalAuthMiddleware` | `200 OK` | Calendario mensual de turnos y lista de contratos de reemplazo (`?month=X&year=Y`). |
| `POST` | `/api/pwa/shifts/:id/confirm` | `portalAuthMiddleware` | `200 OK` | Registra confirmación de asistencia (`status: 'confirmed'`). |
| `POST` | `/api/pwa/shifts/:id/unavailable` | `portalAuthMiddleware` | `200 OK` | Registra indisponibilidad, crea alerta `OPS-03` persistente y emite `alert:new`. |
| `GET` | `/api/pwa/reports/advance` | `portalAuthMiddleware` | `200 OK (PDF Stream)` | Descarga informe de avance acumulado del mes en curso en formato PDF. |
| `GET` | `/api/pwa/reports/cartola` | `portalAuthMiddleware` | `200 OK (PDF Stream)` | Descarga Cartola Oficial del mes cerrado en PDF. |
| `GET` | `/api/pwa/replacements/:id/voucher` | `portalAuthMiddleware` | `200 OK (PDF Stream)` | Descarga Comprobante Individual de Reemplazo en PDF. |
| `PATCH` | `/api/pwa/profile/preferences` | `portalAuthMiddleware` | `200 OK` | Guarda servicios preferidos y horario silencioso en `Staff.notificationPreferences`. |

---

## 3. Responsabilidades por Rol

### QA
- Crear suite de tests de integración para los flujos operativos de la PWA (`server/tests/integration/pwa-shifts.controller.test.ts`).
- Probar escenarios:
  1. `GET /api/pwa/home` retorna el próximo turno correcto dentro de la ventana de 7 días y los KPIs calculados exactamente con las horas diurnas/nocturnas de `report.service`.
  2. Confirmación de turno (`POST .../confirm`) persiste `ShiftConfirmation` con `status: 'confirmed'`.
  3. Reporte de indisponibilidad (`POST .../unavailable`) valida motivo obligatorio ($\ge 5$ caracteres), persiste `ShiftConfirmation` (`unavailable`), inserta documento en `Alert` con `ruleId: 'OPS-03'` y severidad `critical`, y llama a `socket.service.emitAlertNew`.
  4. Descarga de PDF (`advance`, `cartola`, `voucher`) retorna `Content-Type: application/pdf`, no expone datos de otros funcionarios y timbra el documento con el RUT del usuario autenticado.
  5. Consulta de un `voucher` de un reemplazo en el cual el usuario no participó retorna `403 Forbidden` (Anti-IDOR).

### Backend
- Crear modelo Mongoose `server/models/shift-confirmation.model.ts`.
- Crear DTOs en `server/types/portal.types.ts` y esquemas Zod de validación en `server/schemas/portal-shift.schema.ts`.
- Implementar `server/services/pwa-portal.service.ts`:
  - Cálculo de home summary y agenda de 7 días.
  - Cálculo de turnos del mes combinando asignaciones base y contratos de reemplazo.
  - Lógica de confirmación y reporte de indisponibilidad.
  - Integración con `AlertModel` para generar alerta `OPS-03`.
  - Integración con `socket.service.ts` para emitir evento `alert:new` a la sala `service:{serviceId}`.
- Implementar generadores PDF en `server/services/pdf.service.ts` (o extensión dedicada `pwa-report.service.ts`) para avance mensual, cartola y voucher de reemplazo.
- Crear `server/controllers/pwa-portal.controller.ts` y registrar las rutas en `server/routes/api/portal.routes.ts`.

---

## 4. Criterios de Aceptación (Gherkin)

```gherkin
Escenario: Confirmación de asistencia para turno próximo
  DADO que el funcionario "staff_123" tiene un Turno Largo programado para mañana en "Urgencias"
  CUANDO envía una solicitud POST a "/api/pwa/shifts/{id}/confirm"
  ENTONCES el servidor responde HTTP 200 con éxito
  Y se crea un registro en "ShiftConfirmation" con staffId "staff_123", status "confirmed" y source "pwa"

Escenario: Declaración de indisponibilidad por imprevisto y disparo de alerta OPS-03
  DADO que el funcionario "staff_123" tiene un Turno Noche programado para hoy en "Urgencias"
  CUANDO envía una solicitud POST a "/api/pwa/shifts/{id}/unavailable" con el motivo "Urgencia médica personal inminente"
  ENTONCES el servidor responde HTTP 200
  Y se actualiza "ShiftConfirmation" con status "unavailable" y reason "Urgencia médica personal inminente"
  Y se crea una alerta en "Alert" con ruleId "OPS-03", severity "critical", serviceId de "Urgencias" y staffId "staff_123"
  Y se emite el evento WebSocket "alert:new" a la sala "service:{urgenciasId}"

Escenario: Intento de descarga de comprobante de reemplazo ajeno (Anti-IDOR)
  DADO que existe un reemplazo con ID "rep_999" donde el funcionario entrante es "staff_456"
  Y el usuario autenticado en la PWA es "staff_123"
  CUANDO envía una solicitud GET a "/api/pwa/replacements/rep_999/voucher"
  ENTONCES el servidor responde HTTP 403 Forbidden con "No tienes autorización para acceder a este comprobante"
```
