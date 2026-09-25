---
title: "Pre-req 3.3: Normalización de end_date Obligatorio e Índices Compuestos de Asignación y Reemplazos"
type: feature
status: done
agents:
  - qa
  - backend
---

# Pre-req 3.3: Normalización de end_date Obligatorio e Índices Compuestos de Asignación y Reemplazos

## 1. Contexto y Objetivos

En la práctica hospitalaria del Hospital Base San José de Osorno (HBSJO) y en el diseño operativo de ZuriApp, la programación y asignación de cuadrantes rotativos de turnos se realiza **estrictamente mes a mes**. Ninguna asignación de turno carece de fecha de término.

De hecho, en el frontend ([TurnAssignmentModal.vue](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/client/src/components/shifts/TurnAssignmentModal.vue#L470-L471)), el formulario ya exigía:
```typescript
if (!form.value.end_date) {
  errors.value.end_date = 'La fecha de término es requerida';
}
```
Sin embargo, el modelo [turn-assignment.model.ts](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/server/models/turn-assignment.model.ts) mantenía `end_date?: Date` como opcional, y su esquema Zod [turn-assignment.schema.ts](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/server/schemas/turn-assignment.schema.ts) contenía `end_date: z.string().datetime().optional()`. Esta discrepancia obligaba a usar consultas lentas con cláusulas complejas `$or: [{ end_date: null }, ...]`.

Conforme al acuerdo de auditoría técnica y **ADR-03** de la especificación maestra ([.specs/docs/zuriapp-v2-expansion-spec.md](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/.specs/docs/zuriapp-v2-expansion-spec.md)):
- `end_date` pasa a ser **`required: true`** en backend.
- Se crean índices compuestos de alto rendimiento en MongoDB para garantizar consultas en **< 5ms** para pertenencia dinámica por cuadrante y evaluación de descansos.
- Se implementa el script de migración/backfill `server/migrations/fix-turn-assignment-end-date.ts` para asegurar que las asignaciones históricas que tengan `end_date: null` queden fijadas al último día del mes correspondiente a su `start_date`.

---

## 2. Contrato Técnico Explícito

### 2.1 Modelo `TurnAssignment` (`server/models/turn-assignment.model.ts`)

```typescript
export interface ITurnAssignment extends Document {
  staffId: mongoose.Types.ObjectId;
  service: mongoose.Types.ObjectId;
  turn_type: mongoose.Types.ObjectId | string;
  start_date: Date;
  end_date: Date; // OBLIGATORIO (eliminada la opcionalidad)
  snapshot_secuencia?: Array<{
    dia: number;
    turno_entrada?: string;
    turno_salida?: string;
    es_libre: boolean;
    sigla: string;
    color?: string;
  }>;
}

// En turnAssignmentSchema:
end_date: {
  type: Date,
  required: true, // DEUDA TÉCNICA RESUELTA
},

// Índice compuesto de alto rendimiento para pertenencia por rango y servicio:
turnAssignmentSchema.index(
  { service: 1, start_date: 1, end_date: 1 },
  { name: 'idx_turn_assignment_service_range' }
);
```

### 2.2 Esquema Zod `TurnAssignment` (`server/schemas/turn-assignment.schema.ts`)

```typescript
export const createTurnAssignmentSchema = z.object({
  body: z.object({
    staffId: z.string().min(1, "El usuario es obligatorio"),
    service: z.string().min(1, "El servicio es obligatorio"),
    turn_type: z.string().min(1, "El tipo de turno es obligatorio"),
    start_date: z.string().datetime(),
    end_date: z.string().datetime(), // OBLIGATORIO (removido .optional())
  }),
});
```

### 2.3 Modelo `Replacement` (`server/models/replacement.model.ts`)

Se agrega el índice compuesto equivalente para consultas de rango y pertenencia por servicio:

```typescript
replacementSchema.index(
  { servicio: 1, fecha_inicio: 1, fecha_termino: 1 },
  { name: 'idx_replacement_service_range' }
);
```

### 2.4 Consulta Canónica de Pertenencia Optimizada

Al ser ambos campos obligatorios y contar con el índice compuesto `{ service: 1, start_date: 1, end_date: 1 }`, la consulta en `server/services/turn-assignment.service.ts` y futuros motores de cálculo se normaliza a:

```typescript
const assignments = await TurnAssignmentModel.find({
  service: serviceId,
  start_date: { $lte: rangeEnd },
  end_date: { $gte: rangeStart },
});
```

### 2.5 Script de Migración (`server/migrations/fix-turn-assignment-end-date.ts`)

Lógica de backfill:
1. Buscar en `TurnAssignment` todos los registros con `end_date: null` o `$exists: false`.
2. Para cada registro:
   - Extraer año y mes de `start_date`.
   - Calcular la fecha fin de mes correspondiente: `new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999))`.
   - Actualizar el documento en base de datos.
3. Imprimir reporte de registros migrados y asegurar idempotencia (al re-ejecutar, registros afectados = 0).

---

## 3. Responsabilidades por Rol

### QA (RED)
1. Escribir suite de pruebas unitarias `tests/unit/models/turn-assignment.model.test.ts`:
   - Intentar guardar un `TurnAssignment` sin `end_date` y verificar que Mongoose arroje error de validación `ValidationError: Path 'end_date' is required`.
   - Crear un `TurnAssignment` con `start_date` y `end_date` válidos y verificar que persista correctamente.
2. Escribir suite de pruebas de esquema Zod `tests/unit/schemas/turn-assignment.schema.test.ts`:
   - Enviar payload sin `end_date` a `createTurnAssignmentSchema` y verificar que falle con código de error de campo requerido.
   - Enviar payload con string ISO válido y verificar que sea aceptado.
3. Escribir pruebas unitarias para el script de migración `tests/unit/migrations/fix-turn-assignment-end-date.test.ts`:
   - Simular documentos históricos con `end_date: null` y verificar que el script los actualice al último día del mes correspondiente a `start_date`.

### Backend (GREEN & REFACTOR)
1. Modificar `server/models/turn-assignment.model.ts` haciendo `end_date` obligatorio y agregando el índice compuesto.
2. Modificar `server/schemas/turn-assignment.schema.ts` haciendo `end_date` requerido en `createTurnAssignmentSchema`.
3. Modificar `server/models/replacement.model.ts` agregando el índice compuesto `{ servicio: 1, fecha_inicio: 1, fecha_termino: 1 }`.
4. Implementar `server/migrations/fix-turn-assignment-end-date.ts`.
5. Ejecutar migración y suites de pruebas en vitest.

---

## 4. Criterios de Aceptación (Gherkin)

```gherkin
Escenario: Rechazo de creación de asignación de turno sin end_date vía Zod
  DADO un payload de asignación de turno con staffId, service, turn_type y start_date
  Y el campo end_date no está presente en el cuerpo de la solicitud
  CUANDO el middleware validateSchema procesa el payload contra createTurnAssignmentSchema
  ENTONCES responde código HTTP 400 Bad Request
  Y el detalle de validación indica que end_date es requerido

Escenario: Rechazo de persistencia en Mongoose sin end_date
  DADO un modelo TurnAssignment instanciado sin end_date
  CUANDO se intenta ejecutar assignment.save()
  ENTONCES Mongoose rechaza la operación con ValidationError indicando que end_date es obligatorio

Escenario: Creación exitosa de asignación de turno con rango completo
  DADO un payload con start_date "2026-09-01T00:00:00.000Z" y end_date "2026-09-30T23:59:59.999Z"
  CUANDO se envía a la API POST /api/turn-assignments
  ENTONCES responde código HTTP 201 Created
  Y el registro se persiste con start_date y end_date exactamente iguales a los provistos

Escenario: Índices compuestos creados e indexados en MongoDB
  DADO el esquema de TurnAssignment y Replacement
  CUANDO la aplicación inicializa las conexiones de base de datos
  ENTONCES TurnAssignment cuenta con el índice compuesto { service: 1, start_date: 1, end_date: 1 }
  Y Replacement cuenta con el índice compuesto { servicio: 1, fecha_inicio: 1, fecha_termino: 1 }

Escenario: Migración de registros históricos con end_date nulo
  DADO un registro en la base de datos de TurnAssignment con start_date "2026-05-10T08:00:00.000Z" y end_date null
  CUANDO se ejecuta el script fix-turn-assignment-end-date.ts
  ENTONCES el registro es actualizado con end_date correspondiente a "2026-05-31T23:59:59.999Z"
  Y una segunda ejecución del script reporta 0 documentos pendientes
```
