---
title: "Fase 1: Motor de Alertas Inteligentes - Backend (Reglas Normativas, Operativas, Cron BullMQ y WebSockets)"
type: feature
status: done
agents:
  - qa
  - backend
---

# Fase 1: Motor de Alertas Inteligentes - Backend (Reglas Normativas, Operativas, Cron BullMQ y WebSockets)

## 1. Contexto y Objetivos

Conforme a la Sección 4.2 de la especificación técnica maestra ([.specs/docs/zuriapp-v2-expansion-spec.md](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/.specs/docs/zuriapp-v2-expansion-spec.md)):
- **Modelo de Disparo Dual:**
  1. **Nivel 1: Tiempo Real (Event-Driven — Quirúrgico):** Se evalúa de manera síncrona/ligera (< 10ms) ante cada creación o mutación de `TurnAssignment`, `Replacement` o `ShiftException`. Evalúa únicamente al funcionario modificado en una ventana de $\pm 2$ días frente a las reglas normativas (`NORM-01`, `NORM-02`, `NORM-03`, `NORM-06`, `OPS-02`). Si se detecta una infracción, persiste la alerta y emite inmediatamente por Socket.io a la sala del servicio (`alert:new`).
  2. **Nivel 2: Programado (Cron Diario 06:00 AM — Red de Seguridad y Cobertura):** Job BullMQ que barre la ventana de los próximos 7 días evaluando la dotación mínima de todos los servicios (`OPS-01`).
- **Auto-resolución Automática:** Si un déficit de dotación previo (`OPS-01`) es cubierto mediante la asignación de un reemplazo, el evaluador marca automáticamente la alerta como `status = 'resolved'` con la nota `"Auto-resuelto: dotación cubierta"` y emite `alert:resolved` vía WebSockets.
- **Catálogo Purgado de 6 Reglas Puras en Memoria:**
  - `NORM-01`: Descanso mínimo 12h entre turnos consecutivos (`turno_entrada[N+1] - turno_salida[N] < 12h`). Severidad: `critical`.
  - `NORM-02`: Doble turno prohibido (Largo + Noche continuo, 24 horas ininterrumpidas). Severidad: `critical`.
  - `NORM-03`: Descanso post-noche insuficiente (tras turno noche, reingreso a trabajar con descanso < 24h). Severidad: `high`.
  - `NORM-06`: Balance sobretiempo semanal (> 44h en semana calendario ISO Lunes a Domingo). Severidad: `medium`.
  - `OPS-01`: Déficit de dotación en ventana de 7 días (presentes efectivos por cargo < `Service.dotacion_minima`). Severidad: `medium`.
  - `OPS-02`: Noches consecutivas acumuladas (3 o más turnos nocturnos consecutivos). Severidad: `medium`.
- **Prevención de Consultas N+1:** Las reglas no hacen queries directas a MongoDB. El orquestador `alert.service.ts` precarga el contexto consolidado en una sola query por funcionario/servicio y se lo pasa en memoria a las funciones de regla.
- **Blindaje de Concurrencia e Idempotencia:** Índices parciales especializados en MongoDB para evitar duplicación de alertas activas bajo concurrencia.

---

## 2. Contrato Técnico Explícito

### 2.1 Modelo MongoDB (`server/models/alert.model.ts`)

```typescript
export interface IAlert extends Document {
  ruleId: 'NORM-01' | 'NORM-02' | 'NORM-03' | 'NORM-06' | 'OPS-01' | 'OPS-02' | 'OPS-03';
  severity: 'critical' | 'high' | 'medium';
  category: 'normative' | 'operational';
  serviceId: mongoose.Types.ObjectId;
  staffId?: mongoose.Types.ObjectId;
  date?: Date;
  shiftSlot?: 'DIA' | 'NOCHE';
  positionId?: mongoose.Types.ObjectId;
  message: string;
  context: Record<string, any>;
  status: 'active' | 'acknowledged' | 'resolved';
  resolutionNote?: string;
  acknowledgedBy?: mongoose.Types.ObjectId;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  created_at: Date;
  updated_at: Date;
}

// Índices requeridos en alertSchema:
// 1. Idempotencia OPS-01 (Cobertura de Dotación)
alertSchema.index(
  { serviceId: 1, ruleId: 1, date: 1, shiftSlot: 1, positionId: 1, status: 1 },
  { partialFilterExpression: { ruleId: 'OPS-01', status: 'active' }, name: 'idx_idempotency_ops01' }
);

// 2. Idempotencia Individual (Normativas)
alertSchema.index(
  { staffId: 1, ruleId: 1, date: 1, status: 1 },
  { partialFilterExpression: { staffId: { $exists: true }, status: 'active' }, name: 'idx_idempotency_individual' }
);

// 3. Consulta Rápida por Servicio (Campana UI)
alertSchema.index({ serviceId: 1, status: 1, created_at: -1 });

// 4. Historial por Funcionario
alertSchema.index({ staffId: 1, created_at: -1 }, { sparse: true });
```

### 2.2 Tipos TypeScript y DTOs (`server/types/alert.types.ts`)

```typescript
export interface AlertDTO {
  id: string;
  ruleId: 'NORM-01' | 'NORM-02' | 'NORM-03' | 'NORM-06' | 'OPS-01' | 'OPS-02' | 'OPS-03';
  severity: 'critical' | 'high' | 'medium';
  category: 'normative' | 'operational';
  serviceId: string;
  staffId?: string;
  staffName?: string;
  rut?: string;
  date?: string;
  shiftSlot?: 'DIA' | 'NOCHE';
  positionName?: string;
  message: string;
  context: Record<string, any>;
  status: 'active' | 'acknowledged' | 'resolved';
  resolutionNote?: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export interface AlertsListResponse {
  success: boolean;
  data: {
    alerts: AlertDTO[];
    unreadCount: number;
    countsBySeverity: {
      critical: number;
      high: number;
      medium: number;
    };
  };
}

export interface ResolveAlertDTO {
  resolutionNote: string;
}
```

### 2.3 Interfaz de Reglas en Memoria (`server/services/alert-rules/alert-rule.interface.ts`)

```typescript
export interface RuleContext {
  staffId?: string;
  serviceId: string;
  dateRange: { start: Date; end: Date };
  assignments: any[];
  replacements: any[];
  exceptions: any[];
  dotacionMinima?: any[];
}

export interface AlertCandidate {
  ruleId: 'NORM-01' | 'NORM-02' | 'NORM-03' | 'NORM-06' | 'OPS-01' | 'OPS-02';
  severity: 'critical' | 'high' | 'medium';
  category: 'normative' | 'operational';
  serviceId: string;
  staffId?: string;
  date?: Date;
  shiftSlot?: 'DIA' | 'NOCHE';
  positionId?: string;
  message: string;
  context: Record<string, any>;
}

export interface AlertRule {
  id: string;
  category: 'normative' | 'operational';
  severity: 'critical' | 'high' | 'medium';
  evaluate: (context: RuleContext) => Promise<AlertCandidate[]>;
}
```

### 2.4 Rutas de API REST (`server/routes/api/alert.routes.ts`)

- `GET /api/alerts?serviceId=X&status=active` (Permiso: `shifts.view`)
- `PATCH /api/alerts/:id/acknowledge` (Permiso: `shifts.update`)
- `PATCH /api/alerts/:id/resolve` (Permiso: `shifts.update`, valida `resolutionNote` con Zod)

### 2.5 Cron BullMQ (`server/jobs/alerts.cron.ts`)

- Programación diaria: `0 6 * * *` (06:00 AM hora de Chile).
- Ejecuta `alertService.evaluateAllDaily()`.

---

## 3. Responsabilidades por Rol

### QA (RED)
1. **Pruebas Unitarias de Reglas (`server/tests/unit/alert-rules.test.ts`):**
   - `NORM-01`: Generar dos turnos con 8 horas de descanso entre salida y entrada $\rightarrow$ emite alerta crítica. Con 12h de descanso $\rightarrow$ no emite alerta.
   - `NORM-02`: Asignar Largo de día (08:00 a 20:00) y Noche (20:00 a 08:00) en el mismo día $\rightarrow$ emite alerta crítica de doble turno 24h.
   - `NORM-03`: Salida de Noche (08:00 AM) y entrada al día siguiente a las 08:00 AM (24h exactas) $\rightarrow$ no emite; reingreso en la misma tarde $\rightarrow$ emite alerta alta.
   - `NORM-06`: Simular semana ISO con 60 horas efectivas $\rightarrow$ emite alerta informativa con saldo de 16 horas.
   - `OPS-01`: Simular día con 1 enfermera presente y mínimo requerido 2 $\rightarrow$ emite alerta media con slot y positionId. Cubrir el puesto $\rightarrow$ auto-resuelve.
   - `OPS-02`: Asignar 3 turnos de noche consecutivos $\rightarrow$ emite alerta media.
2. **Pruebas de Integración (`server/tests/integration/alert.controller.test.ts`):**
   - Verificar `GET /api/alerts` retornando lista y contadores agrupados.
   - Verificar `PATCH /api/alerts/:id/acknowledge` cambiando status a `acknowledged`.
   - Verificar `PATCH /api/alerts/:id/resolve` requiriendo `resolutionNote` y pasando a `resolved`.
   - Probar que un evento de mutación en reemplazos ejecute la evaluación y emita `alert:new` por Socket.io.

### Backend (GREEN & REFACTOR)
1. Crear modelo `Alert` en `server/models/alert.model.ts` con sus índices compuestos.
2. Crear DTOs y validaciones Zod en `server/types/alert.types.ts` y `server/schemas/alert.schema.ts`.
3. Implementar las 6 reglas en `server/services/alert-rules/`:
   - `norm-01.rule.ts`
   - `norm-02.rule.ts`
   - `norm-03.rule.ts`
   - `norm-06.rule.ts`
   - `ops-01.rule.ts`
   - `ops-02.rule.ts`
4. Implementar orquestador `server/services/alert.service.ts` con precarga en memoria y lógica de auto-resolución.
5. Configurar job diario BullMQ en `server/jobs/alerts.cron.ts`.
6. Extender `server/services/socket.service.ts` con los emisores `emitAlertNew`, `emitAlertAcknowledged` y `emitAlertResolved`.
7. Crear controlador y rutas en `server/controllers/alert.controller.ts` y `server/routes/api/alert.routes.ts`.
8. Enlazar evaluación reactiva en los servicios de `TurnAssignment` y `Replacement`.

---

## 4. Criterios de Aceptación (Gherkin)

```gherkin
Escenario: Detección síncrona en tiempo real de infracción de descanso mínimo de 12 horas
  DADO un funcionario asignado a un turno Largo que culmina a las 20:00 hrs del día 1
  CUANDO la supervisora le asigna un turno Diurno que inicia a las 07:00 hrs del día 2 (11h de descanso)
  ENTONCES el motor de alertas evalúa la infracción NORM-01 en menos de 10 milisegundos
  Y persiste una alerta de severidad "critical" para el funcionario y servicio
  Y emite el evento WebSocket "alert:new" a la sala del servicio correspondiente

Escenario: Auto-resolución de alerta de déficit de dotación cuando se cubre el puesto
  DADO que existe una alerta activa OPS-01 por falta de un TENS para el turno de noche del día viernes
  CUANDO la jefatura registra exitosamente un reemplazo cubriendo dicho puesto vacante
  ENTONCES la alerta previa OPS-01 pasa automáticamente a estado "resolved"
  Y el campo resolutionNote registra "Auto-resuelto: dotación cubierta"
  Y el evento "alert:resolved" es emitido en tiempo real

Escenario: Resolución manual de alerta con justificación obligatoria
  DADO una alerta activa NORM-03 registrada en el sistema
  CUANDO el usuario envía PATCH /api/alerts/:id/resolve con resolutionNote "Autorizado por contingencia de catástrofe"
  ENTONCES responde código HTTP 200 OK
  Y la alerta queda registrada como "resolved" con la nota y fecha de resolución
  PERO si envía la solicitud con resolutionNote vacía
  ENTONCES responde código HTTP 400 Bad Request por validación de campo requerido

Escenario: Idempotencia en ejecución de reglas que previene alertas duplicadas
  DADO que ya existe una alerta activa NORM-02 para el funcionario F en la fecha D
  CUANDO se vuelve a ejecutar la evaluación de reglas para ese mismo funcionario y fecha
  ENTONCES no se inserta un nuevo documento en la colección de alertas
  Y se mantiene únicamente la alerta original activa
```
