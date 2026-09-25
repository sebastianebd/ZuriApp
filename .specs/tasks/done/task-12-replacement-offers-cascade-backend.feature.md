---
title: "Fase 2: Bolsa de Reemplazos - Backend: Modelo de Convocatorias, BullMQ Delayed Jobs, Adjudicación Atómica y Retiro en Cascada"
type: feature
status: done
agents:
  - qa
  - backend
---

# Fase 2: Bolsa de Reemplazos - Backend: Modelo de Convocatorias, BullMQ Delayed Jobs, Adjudicación Atómica y Retiro en Cascada

## 1. Contexto y Objetivos

Conforme a las Secciones 5.2.1 a 5.2.5 de la especificación técnica maestra ([zuriapp-v2-expansion-spec.md](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/.specs/docs/zuriapp-v2-expansion-spec.md)):

- **Modelo de Convocatorias (`ReplacementOffer`):** Permite a la jefatura publicar turnos no cubiertos con fecha límite (`expiresAt`) para que los honorarios del mismo cargo puedan postular.
- **Confidencialidad Hospitalaria:** La causal de ausencia del titular saliente (`motivo` de las 8 oficiales) y sus datos personales son visibles únicamente para la jefatura; en los endpoints consumidos por los honorarios se reservan estrictamente.
- **Expiración al Segundo Exacto (BullMQ Delayed Jobs):** Al crear una convocatoria, se programa un job en `replacementOfferQueue` con `delay = expiresAt - Date.now()` (respaldado por un cron cada 30 min como red de seguridad). Al expirar:
  - **Con $\ge 1$ postulantes:** Pasa a `'finalized'` y notifica a la jefatura para proceder con la adjudicación.
  - **Con 0 postulantes:** Pasa a `'finalized'` y genera alerta operativa en la campana de ZuriApp para activar la búsqueda activa por llamada directa.
- **Adjudicación Atómica con Control de Concurrencia:** En una sola transacción Mongoose (`session.withTransaction`):
  1. Verifica estado de la oferta y marca a la ganadora (`status: 'filled'`, postulante `'selected'`).
  2. Crea el registro formal en `Replacement` con el código `id_negocio` y asigna al honorario como `id_entrante`.
  3. Marca a los restantes candidatos de la oferta como `'not_selected'`.
- **Retiro en Cascada (`withdrawn_conflict`):** El sistema identifica todas las otras ofertas abiertas donde el funcionario adjudicado figure como postulante. Si sus horarios colisionan o violan descansos normativos (`NORM-01`, `NORM-02`, `NORM-03`, `NORM-06`), actualiza su estado a `'withdrawn_conflict'` y emite el evento Socket.io `offer:applicant_withdrawn` a las jefaturas correspondientes.
- **Endpoints de Postulación PWA (Honorarios):** Consulta de vacantes filtradas por cargo, postulación con pre-validación normativa inmediata en memoria y cancelación voluntaria.

---

## 2. Contrato Técnico Explícito

### 2.1 Modelo MongoDB (`server/models/replacement-offer.model.ts`)

```typescript
import mongoose, { Schema, Document } from 'mongoose';
import { AusenciaSalienteMotivo } from './replacement.model';

export interface IReplacementOfferApplicant {
  staffId: mongoose.Types.ObjectId;
  appliedAt: Date;
  scoreAtApplication?: number;
  status: 'pending' | 'selected' | 'not_selected' | 'cancelled_by_staff' | 'withdrawn_conflict';
}

export interface IReplacementOffer extends Document {
  serviceId: mongoose.Types.ObjectId;
  positionId: mongoose.Types.ObjectId;
  id_saliente: mongoose.Types.ObjectId;
  rut_saliente: string;
  nombre_saliente: string;
  apellido_saliente: string;
  motivo: AusenciaSalienteMotivo;
  observaciones?: string;
  tipo_turno: string;
  turn_type_id?: mongoose.Types.ObjectId;
  fecha_inicio: Date;
  fecha_termino: Date;
  snapshot_secuencia?: Array<{
    dia: number;
    turno_entrada?: string;
    turno_salida?: string;
    es_libre: boolean;
    sigla: string;
  }>;
  creado_por: mongoose.Types.ObjectId;
  expiresAt: Date;
  status: 'open' | 'finalized' | 'filled' | 'cancelled';
  applicants: IReplacementOfferApplicant[];
  awardedStaffId?: mongoose.Types.ObjectId;
  replacementId?: mongoose.Types.ObjectId;
  awardedAt?: Date;
  created_at: Date;
  updated_at: Date;
}
```

### 2.2 Tipos TypeScript y DTOs (`server/types/replacement-offer.types.ts`)

```typescript
export interface CreateReplacementOfferDTO {
  serviceId: string;
  positionId: string;
  id_saliente: string;
  motivo: 'LICENCIA_MEDICA' | 'PRE_POST_NATAL' | 'PERMISO_ADMINISTRATIVO' | 'FERIADO_LEGAL' | 'DIA_COMPENSATORIO' | 'COMISION_SERVICIO' | 'PERMISO_GREMIAL' | 'OTRO';
  observaciones?: string;
  tipo_turno: string;
  turn_type_id?: string;
  fecha_inicio: string; // ISO
  fecha_termino: string; // ISO
  expiresAt: string; // ISO
}

export interface ReplacementOfferListItemDTO {
  id: string;
  serviceId: string;
  serviceName: string;
  positionId: string;
  positionName: string;
  status: 'open' | 'finalized' | 'filled' | 'cancelled';
  expiresAt: string;
  fecha_inicio: string;
  fecha_termino: string;
  tipo_turno: string;
  applicantsCount: number;
  // Campos del saliente (omitidos en endpoints PWA para honorarios)
  id_saliente?: string;
  nombre_saliente?: string;
  rut_saliente?: string;
  motivo?: string;
  observaciones?: string;
}

export interface AwardOfferDTO {
  targetStaffId: string;
}
```

### 2.3 Endpoints y Permisos (`server/routes/api/replacement-offer.routes.ts`)

| Método | Endpoint | Middleware | Permiso | Descripción |
|---|---|---|:---:|---|
| `GET` | `/api/replacement-offers` | `authMiddleware` | `shifts.view` | Listado de convocatorias de servicio con filtros de estado. |
| `POST` | `/api/replacement-offers` | `authMiddleware, validateSchema` | `shifts.create` | Crea convocatoria y encola delayed job BullMQ. |
| `PATCH` | `/api/replacement-offers/:id/cancel` | `authMiddleware` | `shifts.update` | Anula convocatoria y notifica a postulantes. |
| `POST` | `/api/replacement-offers/:id/award` | `authMiddleware` | `shifts.create` | Adjudica turno atómicamente y retira en cascada. |
| `GET` | `/api/replacement-offers/open` | `portalAuthMiddleware` | - | Convocatorias abiertas compatibles con el cargo del honorario (saliente reservado). |
| `GET` | `/api/replacement-offers/my-applications` | `portalAuthMiddleware` | - | Listado de postulaciones del honorario en sesión. |
| `POST` | `/api/replacement-offers/:id/apply` | `portalAuthMiddleware` | - | Postulación con pre-validación normativa en memoria. |
| `POST` | `/api/replacement-offers/:id/withdraw` | `portalAuthMiddleware` | - | Cancelación voluntaria de postulación activa. |

---

## 3. Responsabilidades por Rol

### QA
- Crear suite de tests de integración para convocatorias y adjudicación (`server/tests/integration/replacement-offer.controller.test.ts`).
- Mockear colas BullMQ (`replacementOfferQueue`).
- Probar escenarios:
  1. Creación de convocatoria encola delayed job con retraso exacto hasta `expiresAt`.
  2. Worker de expiración pasa oferta con postulantes a `'finalized'` y oferta con 0 postulantes a `'finalized'` con alerta en campana.
  3. Postulación de honorario (`/apply`): valida en memoria que no colisione con turnos existentes y respete descansos de 12h (`NORM-01`) y post-noche (`NORM-03`).
  4. Adjudicación atómica (`/award`): crea el documento en `Replacement`, marca la oferta como `'filled'` y cambia al ganador a `'selected'`.
  5. Retiro en cascada: si el honorario estaba postulado en otra oferta colisionante, su estado en dicha oferta cambia automáticamente a `'withdrawn_conflict'`.
  6. Endpoint `/open` no expone `id_saliente`, `rut_saliente` ni `motivo` sensible del titular ausente.

### Backend
- Crear modelo Mongoose `server/models/replacement-offer.model.ts` con índices de concurrencia.
- Crear esquemas Zod en `server/schemas/replacement-offer.schema.ts`.
- Crear cola BullMQ `server/queues/replacement-offer.queue.ts` y worker de procesamiento diferido.
- Implementar `server/services/replacement-offer.service.ts`:
  - Lógica transaccional de creación, expiración y adjudicación (`session.withTransaction`).
  - Lógica de retiro en cascada evaluando colisiones horarias y descansos normativos.
  - Emisión de WebSocket `offer:applicant_withdrawn` vía `socket.service.ts`.
- Implementar métodos del controlador `server/controllers/replacement-offer.controller.ts`.
- Registrar rutas en `server/routes/api/replacement-offer.routes.ts` y montar en `server/app.ts`.

---

## 4. Criterios de Aceptación (Gherkin)

```gherkin
Escenario: Creación de convocatoria con encolado de expiración en BullMQ
  DADO que la jefa de servicio publica una convocatoria con vencimiento en 2 horas
  CUANDO envía POST a "/api/replacement-offers" con los datos del turno y causal del saliente
  ENTONCES el servidor responde HTTP 201 Created
  Y se crea el registro en "ReplacementOffer" con status "open"
  Y se añade un delayed job en "replacementOfferQueue" con delay de 7200000 milisegundos

Escenario: Adjudicación atómica y retiro automático en cascada
  DADO que el honorario "staff_H" tiene dos postulaciones activas:
    | Convocatoria | Fechas | Horario |
    | Oferta_1 | 2026-10-05 | Largo 08:00 - 20:00 |
    | Oferta_2 | 2026-10-05 | Noche 20:00 - 08:00 |
  CUANDO la jefa de servicio adjudica la "Oferta_1" a "staff_H"
  ENTONCES se crea una transacción en MongoDB que:
    1. Marca "Oferta_1" como "filled" y a "staff_H" como "selected"
    2. Crea el registro oficial en "Replacement" para "Oferta_1"
    3. Detecta colisión de 24h continuas (NORM-02) con "Oferta_2"
    4. Cambia el estado de "staff_H" en "Oferta_2" a "withdrawn_conflict"
    5. Emite evento WebSocket "offer:applicant_withdrawn" a la jefatura de "Oferta_2"
```
