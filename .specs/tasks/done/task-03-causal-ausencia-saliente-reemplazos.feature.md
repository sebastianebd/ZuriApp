---
title: "Pre-req 3.4: Causal de Ausencia del Saliente en Reemplazos (Backend y Frontend)"
type: feature
status: done
agents:
  - qa
  - backend
  - frontend
---

# Pre-req 3.4: Causal de Ausencia del Saliente en Reemplazos (Backend y Frontend)

## 1. Contexto y Objetivos

En el dominio operativo hospitalario, un reemplazo es estrictamente un enlace 1-a-1 entre un titular ausente y un reemplazante entrante.
Conforme a las decisiones **GAP-04** y **ADR-06** de la especificación técnica maestra ([.specs/docs/zuriapp-v2-expansion-spec.md](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/.specs/docs/zuriapp-v2-expansion-spec.md)):
- **Principio de Causalidad:** El motivo y las observaciones pertenecen **exclusivamente al funcionario titular ausente (`id_saliente`)**, justificando por qué no asiste a su turno asignado. No describe al entrante ni representa contingencias generales de dotación.
- **Catálogo Oficial Cerrado:** Se descartan textos libres no estructurados (`"lic"`, `"LM"`, `"permiso"`) y conceptos no aplicables (como "sin goce de sueldo" o "refuerzo de dotación"). Se establece un catálogo de **8 causales oficiales**.
- **Confidencialidad Hospitalaria:** La causal de ausencia médica o administrativa es un dato sensible. Es visible para la jefatura y supervisión en la aplicación web de escritorio; en el portal móvil PWA se oculta a los postulantes para resguardar la privacidad del titular saliente.

### Objetivos Específicos:
1. Agregar `motivo` (enum con las 8 causales) y `observaciones` (string max 500) en el modelo [replacement.model.ts](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/server/models/replacement.model.ts) con valor por defecto `'OTRO'` para retrocompatibilidad segura.
2. Incorporar `motivo` y `observaciones` a la lista `REPLACEMENT_AUDIT_FIELDS` para auditoría completa.
3. Actualizar los esquemas Zod en [replacement.schema.ts](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/server/schemas/replacement.schema.ts) tanto en `createReplacementSchema` como en `updateReplacementSchema`.
4. Extender el controlador [replacement.controller.ts](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/server/controllers/replacement.controller.ts) y servicio [replacement.service.ts](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/server/services/replacement.service.ts) para almacenar, actualizar y retornar estos datos.
5. Actualizar los tipos TypeScript del cliente en [client/src/types/replacement.types.ts](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/client/src/types/replacement.types.ts) (`ReplacementRegistration`).
6. Actualizar las vistas y modales de frontend:
   - [ReplacementModalCreate.vue](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/client/src/components/replacements/ReplacementModalCreate.vue): selector desplegable obligatorio de causal bajo el titular saliente + textarea opcional de observaciones (obligatorio si motivo es `'OTRO'`).
   - [ReplacementModalUpdate.vue](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/client/src/components/replacements/ReplacementModalUpdate.vue): visualización y edición de motivo y observaciones.
   - [ActiveReplacementsView.vue](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/client/src/views/active-replacements/ActiveReplacementsView.vue): columna y badge visual con el motivo + filtro rápido por causal en la tabla.
   - [StaffModalDetail.vue](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/client/src/components/staff/StaffModalDetail.vue): visualización de la causal en la pestaña de historial de reemplazos del funcionario.

---

## 2. Contrato Técnico Explícito

### 2.1 Tipos y Enums TypeScript Compartidos

```typescript
// Aplicable tanto en server/types como en client/src/types/replacement.types.ts

export type AusenciaSalienteMotivo =
  | 'LICENCIA_MEDICA'         // Licencia médica común, laboral o reposo
  | 'PRE_POST_NATAL'          // Descanso maternal, pre/postnatal y parental
  | 'PERMISO_ADMINISTRATIVO'  // Días administrativos reglamentarios (Ley 18.834)
  | 'FERIADO_LEGAL'           // Vacaciones legales programadas o urgentes
  | 'DIA_COMPENSATORIO'       // Descanso compensatorio por horas extras/feriados
  | 'COMISION_SERVICIO'       // Capacitación oficial o labores fuera del hospital
  | 'PERMISO_GREMIAL'         // Actividades gremiales autorizadas
  | 'OTRO';                   // Otros imprevistos (exige detalle en observaciones)

export const MOTIVOS_AUSENCIA_LABELS: Record<AusenciaSalienteMotivo, string> = {
  LICENCIA_MEDICA: 'Licencia Médica',
  PRE_POST_NATAL: 'Pre / Postnatal y Parental',
  PERMISO_ADMINISTRATIVO: 'Permiso Administrativo',
  FERIADO_LEGAL: 'Feriado Legal (Vacaciones)',
  DIA_COMPENSATORIO: 'Día Compensatorio',
  COMISION_SERVICIO: 'Comisión de Servicio',
  PERMISO_GREMIAL: 'Permiso Gremial',
  OTRO: 'Otro Motivo',
};
```

### 2.2 Modelo Backend (`server/models/replacement.model.ts`)

```typescript
export interface IReplacement extends Document {
  id_negocio?: string;
  id_saliente: mongoose.Types.ObjectId;
  rut_saliente: string;
  nombre_saliente: string;
  apellido_saliente: string;
  motivo: AusenciaSalienteMotivo;        // NUEVO: Causal del titular saliente
  observaciones?: string;               // NUEVO: Detalle operativo opcional (max 500)
  id_entrante: mongoose.Types.ObjectId;
  rut_entrante: string;
  nombre_entrante: string;
  apellido_entrante: string;
  tipo_turno: string;
  turn_type_id?: mongoose.Types.ObjectId;
  fecha_inicio: Date;
  fecha_termino: Date;
  servicio: mongoose.Types.ObjectId;
  snapshot_secuencia?: Array<any>;
  status: string;
  creado_por: mongoose.Types.ObjectId;
  corte_anticipado: boolean;
  created_at: Date;
  updated_at: Date;
}

// En replacementSchema:
motivo: {
  type: String,
  enum: [
    'LICENCIA_MEDICA',
    'PRE_POST_NATAL',
    'PERMISO_ADMINISTRATIVO',
    'FERIADO_LEGAL',
    'DIA_COMPENSATORIO',
    'COMISION_SERVICIO',
    'PERMISO_GREMIAL',
    'OTRO',
  ],
  required: true,
  default: 'OTRO', // Retrocompatibilidad para registros históricos
},
observaciones: {
  type: String,
  trim: true,
  maxlength: 500,
},

// Actualización en REPLACEMENT_AUDIT_FIELDS:
export const REPLACEMENT_AUDIT_FIELDS = [
  "rut_saliente",
  "nombre_saliente",
  "apellido_saliente",
  "motivo",            // NUEVO
  "observaciones",     // NUEVO
  "rut_entrante",
  "nombre_entrante",
  "apellido_entrante",
  "tipo_turno",
  "fecha_inicio",
  "fecha_termino",
  "servicio",
  "status",
  "corte_anticipado",
];
```

### 2.3 Esquemas de Validación Zod (`server/schemas/replacement.schema.ts`)

```typescript
const motivosEnum = z.enum([
  'LICENCIA_MEDICA',
  'PRE_POST_NATAL',
  'PERMISO_ADMINISTRATIVO',
  'FERIADO_LEGAL',
  'DIA_COMPENSATORIO',
  'COMISION_SERVICIO',
  'PERMISO_GREMIAL',
  'OTRO',
]);

export const createReplacementSchema = z.object({
  body: z.object({
    id_negocio: z.string().optional(),
    id_saliente: objectIdSchema,
    rut_saliente: z.string().min(8, "RUT saliente inválido"),
    nombre_saliente: z.string().min(2).transform(toTitleCase),
    apellido_saliente: z.string().min(2).transform(toTitleCase),
    motivo: motivosEnum,                                        // OBLIGATORIO
    observaciones: z.string().max(500, "Máximo 500 caracteres").optional(),
    id_entrante: objectIdSchema,
    rut_entrante: z.string().min(8, "RUT entrante inválido"),
    nombre_entrante: z.string().min(2).transform(toTitleCase),
    apellido_entrante: z.string().min(2).transform(toTitleCase),
    tipo_turno: z.string().min(1),
    fecha_inicio: z.coerce.date(),
    fecha_termino: z.coerce.date(),
    servicio: z.string().min(1),
    status: z.enum(["PENDIENTE", "APROBADO", "RECHAZADO", "FINALIZADO", "ANULADO"]).optional(),
    creado_por: objectIdSchema,
    corte_anticipado: z.boolean().optional(),
  }).refine((data) => {
    if (data.motivo === 'OTRO') {
      return !!data.observaciones && data.observaciones.trim().length > 0;
    }
    return true;
  }, {
    message: "Las observaciones son obligatorias cuando el motivo es 'OTRO'",
    path: ["observaciones"],
  }),
});

export const updateReplacementSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    rut_saliente: z.string().min(8).optional(),
    motivo: motivosEnum.optional(),
    observaciones: z.string().max(500).optional(),
    rut_entrante: z.string().min(8).optional(),
    tipo_turno: z.string().min(1).optional(),
    servicio: z.string().min(1).optional(),
    fecha_inicio: z.coerce.date().optional(),
    fecha_termino: z.coerce.date().optional(),
    status: z.enum(["PENDIENTE", "APROBADO", "RECHAZADO", "FINALIZADO", "ANULADO"]).optional(),
  }).partial(),
});
```

### 2.4 Interfaz en Frontend (`client/src/types/replacement.types.ts`)

```typescript
export interface ReplacementRegistration {
  id_negocio: string;
  _id: string;
  id_saliente: string;
  rut_saliente: string;
  nombre_saliente: string;
  apellido_saliente: string;
  motivo: AusenciaSalienteMotivo;       // NUEVO
  observaciones?: string;              // NUEVO
  id_entrante: string;
  rut_entrante: string;
  nombre_entrante: string;
  apellido_entrante: string;
  tipo_turno: string;
  fecha_inicio: string;
  fecha_termino: string;
  tipo_cargo: string;
  servicio: string;
  status: string;
  creado_por: string | IStaff;
  corte_anticipado: Boolean;
}
```

---

## 3. Responsabilidades por Rol

### QA (RED)
1. **Pruebas de Backend Zod (`tests/unit/schemas/replacement.schema.test.ts`):**
   - Validar que un payload sin `motivo` sea rechazado con 400 Bad Request.
   - Validar que las 8 causales del enum sean aceptadas individualmente.
   - Validar que si `motivo === 'OTRO'`, falle si `observaciones` está ausente o vacío.
   - Validar que si `observaciones` excede 500 caracteres, falle la validación.
2. **Pruebas de Integración de API (`tests/integration/replacement.controller.test.ts`):**
   - Ejecutar `POST /api/replacements` con `motivo: 'LICENCIA_MEDICA'` y verificar persistencia en base de datos.
   - Ejecutar `PATCH /api/replacements/:id` actualizando observaciones y verificar actualización en auditoría.
3. **Pruebas de Componentes Frontend (`client/src/components/replacements/ReplacementModalCreate.test.ts`):**
   - Verificar que el formulario renderice el selector de motivos.
   - Verificar que no permita enviar el formulario sin seleccionar un motivo.
   - Verificar que muestre error si se elige "OTRO" sin ingresar observaciones.

### Backend (GREEN & REFACTOR)
1. Actualizar `server/models/replacement.model.ts` incorporando `motivo`, `observaciones` y sumándolos a `REPLACEMENT_AUDIT_FIELDS`.
2. Actualizar `server/schemas/replacement.schema.ts` integrando las validaciones Zod con la regla condicional para `'OTRO'`.
3. Actualizar `server/controllers/replacement.controller.ts` y `server/services/replacement.service.ts` asegurando que reciban, guarden y retornen ambos campos en listados y detalles.

### Frontend (GREEN & REFACTOR)
1. Modificar `client/src/types/replacement.types.ts` exportando `AusenciaSalienteMotivo`, `MOTIVOS_AUSENCIA_LABELS` y actualizando `ReplacementRegistration`.
2. Modificar `ReplacementModalCreate.vue`:
   - Agregar selector desplegable obligatorio de motivo ubicado bajo el bloque del titular saliente.
   - Agregar textarea para observaciones (maxlength 500) con indicador dinámico si es obligatorio por motivo `'OTRO'`.
3. Modificar `ReplacementModalUpdate.vue`:
   - Mostrar el selector de motivo y campo observaciones para permitir su corrección por la jefatura.
4. Modificar `ActiveReplacementsView.vue`:
   - Añadir columna de "Causal / Motivo" con badge visual (ej: azul para Licencia Médica, verde para Feriado Legal, etc.).
   - Añadir filtro rápido por causal en la barra de herramientas.
5. Modificar `StaffModalDetail.vue`:
   - En la tabla de historial de suplencias/reemplazos, incorporar la columna "Motivo".

---

## 4. Criterios de Aceptación (Gherkin)

```gherkin
Escenario: Creación exitosa de reemplazo con causal de ausencia oficial
  DADO un usuario autenticado con permisos para crear reemplazos
  Y un payload de creación con motivo "LICENCIA_MEDICA"
  CUANDO envía una solicitud POST a /api/replacements
  ENTONCES responde código HTTP 201 Created
  Y el registro en base de datos almacena motivo "LICENCIA_MEDICA"
  Y el evento de auditoría registra la asignación del motivo

Escenario: Validación obligatoria de observaciones al seleccionar motivo "OTRO"
  DADO un formulario de creación con motivo seleccionado "OTRO"
  PERO el campo observaciones se encuentra vacío o solo con espacios
  CUANDO el usuario intenta enviar el formulario o la API procesa el schema
  ENTONCES responde error 400 Bad Request
  Y el mensaje indica "Las observaciones son obligatorias cuando el motivo es 'OTRO'"

Escenario: Rechazo de motivo no perteneciente al catálogo hospitalario oficial
  DADO un payload con motivo "SIN_GOCE_DE_SUELDO" o "CONTINGENCIA"
  CUANDO el endpoint POST /api/replacements valida el cuerpo de la petición
  ENTONCES la solicitud es rechazada con HTTP 400 por no coincidir con el catálogo oficial

Escenario: Visualización de badge de motivo y filtro en tabla de Reemplazos Activos
  DADO que existen reemplazos registrados con distintas causales
  CUANDO la supervisora ingresa a la vista de Reemplazos Activos en el sistema web
  ENTONCES cada fila exhibe un badge claro con el motivo de ausencia del titular saliente
  Y puede filtrar la grilla seleccionando una causal específica del dropdown de filtros

Escenario: Confidencialidad de la causal frente a postulantes en la PWA
  DADO un reemplazo originado por motivo "LICENCIA_MEDICA"
  CUANDO la información del turno se envía a los endpoints móviles o tablón de la PWA (/api/pwa/*)
  ENTONCES la respuesta JSON omite el RUT del saliente y la causal médica del ausente
```
