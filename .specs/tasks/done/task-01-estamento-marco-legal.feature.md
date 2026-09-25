---
title: "Pre-req 3.1: Incorporación de Estamento en Position y Util getLegalFramework"
type: feature
status: done
agents:
  - qa
  - backend
---

# Pre-req 3.1: Incorporación de Estamento en Position y Util getLegalFramework

## 1. Contexto y Objetivos

En el sector público de salud chileno rigen tres marcos jurídicos diferenciados con distintas normativas de jornada, turnos y descansos:
1. **Ley N° 18.834** (Estatuto Administrativo): Aplica al personal de planta y contrata de los estamentos Profesional, Técnico, Administrativo y Auxiliar.
2. **Leyes N° 15.076 y N° 19.664** (Estatuto Médico-Funcionario): Aplica a médicos cirujanos, odontólogos y farmacéuticos de planta o contrata.
3. **Código del Trabajo**: Aplica a trabajadores contratados a honorarios o externalizados (quienes operan bajo régimen contractual civil/laboral común).

Conforme a la decisión de diseño **ADR-01** de la especificación maestra ([.specs/docs/zuriapp-v2-expansion-spec.md](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/.specs/docs/zuriapp-v2-expansion-spec.md)):
- **El modelo Staff permanece inmutable.** No se agregan campos estáticos ni redundantes.
- El estamento es intrínseco al cargo ([Position](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/server/models/position.model.ts)) y se configura una sola vez al definir el cargo.
- El marco legal aplicable se **deriva dinámicamente en tiempo de ejecución** mediante una función pura:
  `getLegalFramework(contractType, estamento)`.

### Objetivos Específicos:
1. Agregar el campo `estamento` (enum con los 5 estamentos hospitalarios oficiales) al modelo [position.model.ts](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/server/models/position.model.ts) con valor por defecto `'PROFESIONAL'` para retrocompatibilidad.
2. Incorporar `'estamento'` a la constante `POSITION_AUDIT_FIELDS` para trazabilidad de auditoría.
3. Actualizar el esquema Zod [position.schema.ts](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/server/schemas/position.schema.ts).
4. Implementar la función utilitaria `getLegalFramework` en `server/utils/legal-framework.util.ts`.
5. Crear un script de migración/backfill (`server/migrations/set-default-estamentos.ts`) para asegurar que los cargos ya existentes en la base de datos posean su estamento asignado.

---

## 2. Contrato Técnico Explícito

### 2.1 Tipos y Enums TypeScript

```typescript
// server/utils/legal-framework.util.ts

export type Estamento =
  | 'MEDICO'
  | 'PROFESIONAL'
  | 'TECNICO'
  | 'ADMINISTRATIVO'
  | 'AUXILIAR';

export type ContractType = 'PLANTA' | 'CONTRATA' | 'HONORARIO';

export type LegalFramework = 'LEY_18834' | 'LEY_19664' | 'CODIGO_TRABAJO';

/**
 * Deriva el marco legal aplicable combinando contractType y estamento.
 * Regla de precedencia: HONORARIO siempre deriva a CODIGO_TRABAJO.
 * Si no es HONORARIO y estamento === 'MEDICO' -> LEY_19664.
 * En cualquier otro caso -> LEY_18834.
 */
export function getLegalFramework(
  contractType: ContractType,
  estamento: Estamento | string
): LegalFramework {
  if (contractType === 'HONORARIO') return 'CODIGO_TRABAJO';
  if (estamento === 'MEDICO') return 'LEY_19664';
  return 'LEY_18834';
}
```

### 2.2 Modelo Mongoose (`server/models/position.model.ts`)

```typescript
// Inclusión en IPosition
export interface IPosition extends Document {
  name: string;
  position_code: string;
  description?: string;
  estamento: 'MEDICO' | 'PROFESIONAL' | 'TECNICO' | 'ADMINISTRATIVO' | 'AUXILIAR';
  isActive: boolean;
  deleted_at?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Inclusión en PositionSchema
estamento: {
  type: String,
  enum: ['MEDICO', 'PROFESIONAL', 'TECNICO', 'ADMINISTRATIVO', 'AUXILIAR'],
  required: true,
  default: 'PROFESIONAL',
}

// Actualización en POSITION_AUDIT_FIELDS
export const POSITION_AUDIT_FIELDS = [
  "name",
  "position_code",
  "description",
  "estamento",
  "isActive",
];
```

### 2.3 Esquema Zod (`server/schemas/position.schema.ts`)

```typescript
const positionBodySchema = z.object({
  name: z.string().min(1, "El nombre del cargo es requerido").transform(toTitleCase),
  position_code: z.string().min(1, "El código del cargo es requerido"),
  description: z.string().optional().transform((v) => (v ? toSentenceCase(v) : v)),
  estamento: z
    .enum(['MEDICO', 'PROFESIONAL', 'TECNICO', 'ADMINISTRATIVO', 'AUXILIAR'])
    .default('PROFESIONAL'),
  isActive: z.boolean().default(true),
});
```

### 2.4 Script de Migración (`server/migrations/set-default-estamentos.ts`)
- Script ejecutable idempotente que actualiza todos los documentos de `Position` donde `{ estamento: { $exists: false } }`, asignando `'PROFESIONAL'` por defecto o mapeando según código/nombre si aplica.

---

## 3. Responsabilidades por Rol

### QA (RED)
1. Escribir suite de pruebas unitarias `tests/unit/utils/legal-framework.util.test.ts`:
   - Validar la matriz completa:
     - `('PLANTA', 'MEDICO')` $\rightarrow$ `'LEY_19664'`
     - `('CONTRATA', 'MEDICO')` $\rightarrow$ `'LEY_19664'`
     - `('HONORARIO', 'MEDICO')` $\rightarrow$ `'CODIGO_TRABAJO'` (precedencia de honorario)
     - `('PLANTA', 'PROFESIONAL')` $\rightarrow$ `'LEY_18834'`
     - `('CONTRATA', 'TECNICO')` $\rightarrow$ `'LEY_18834'`
     - `('PLANTA', 'ADMINISTRATIVO')` $\rightarrow$ `'LEY_18834'`
     - `('CONTRATA', 'AUXILIAR')` $\rightarrow$ `'LEY_18834'`
     - `('HONORARIO', 'TECNICO')` $\rightarrow$ `'CODIGO_TRABAJO'`
2. Escribir pruebas unitarias de esquema y modelo `tests/unit/models/position.model.test.ts`:
   - Verificar que al instanciar un `Position` sin estamento explícito tome `'PROFESIONAL'`.
   - Verificar rechazo cuando se ingresa un estamento no listado en el enum.
   - Verificar que `POSITION_AUDIT_FIELDS` contenga `'estamento'`.

### Backend (GREEN & REFACTOR)
1. Crear `server/utils/legal-framework.util.ts` exportando los tipos y la función utilitaria.
2. Actualizar `server/models/position.model.ts` con el campo `estamento` y la constante de auditoría.
3. Actualizar `server/schemas/position.schema.ts` para validar y transformar el nuevo campo en payloads de creación y actualización.
4. Crear y probar el script de migración `server/migrations/set-default-estamentos.ts`.
5. Ejecutar la suite completa de tests (`npm test` o `npx vitest run`) asegurando cero regresiones.

---

## 4. Criterios de Aceptación (Gherkin)

```gherkin
Escenario: Derivación de Ley 19.664 para Médicos de Planta o Contrata
  DADO un funcionario con contractType "PLANTA" o "CONTRATA"
  Y un cargo con estamento "MEDICO"
  CUANDO se invoca getLegalFramework(contractType, estamento)
  ENTONCES la función retorna "LEY_19664"

Escenario: Derivación de Código del Trabajo para Personal a Honorarios (Precedencia)
  DADO un funcionario con contractType "HONORARIO"
  Y un cargo con estamento "MEDICO", "PROFESIONAL", "TECNICO", "ADMINISTRATIVO" o "AUXILIAR"
  CUANDO se invoca getLegalFramework(contractType, estamento)
  ENTONCES la función retorna siempre "CODIGO_TRABAJO"

Escenario: Derivación de Ley 18.834 para Estamentos No Médicos en Planta o Contrata
  DADO un funcionario con contractType "CONTRATA"
  Y un cargo con estamento "PROFESIONAL" o "TECNICO"
  CUANDO se invoca getLegalFramework(contractType, estamento)
  ENTONCES la función retorna "LEY_18834"

Escenario: Creación de Position con estamento válido y auditoría
  DADO un payload para crear cargo con estamento "TECNICO"
  CUANDO el endpoint POST /api/positions o el modelo Position lo procesa
  ENTONCES el registro se almacena con estamento "TECNICO"
  Y el campo "estamento" queda registrado en el historial de auditoría si sufre modificaciones

Escenario: Rechazo de Position con estamento inválido
  DADO un payload de cargo con estamento "DIRECTIVO_INEXISTENTE"
  CUANDO el middleware de validación Zod procesa la solicitud
  ENTONCES responde código HTTP 400 con mensaje descriptivo de enum inválido
```
