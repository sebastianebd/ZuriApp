---
title: "Fase 2: Bolsa de Reemplazos - Backend: Motor de Scoring en Memoria (AvailabilityService) y Búsqueda Activa"
type: feature
status: done
agents:
  - qa
  - backend
---

# Fase 2: Bolsa de Reemplazos - Backend: Motor de Scoring en Memoria (AvailabilityService) y Búsqueda Activa

## 1. Contexto y Objetivos

Conforme a la Sección 5.2.6 de la especificación técnica maestra ([zuriapp-v2-expansion-spec.md](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/.specs/docs/zuriapp-v2-expansion-spec.md)):

- **Propósito del Motor de Scoring:** Cuando una convocatoria finaliza con postulantes, la jefa necesita ver a los candidatos ordenados objetivamente según su idoneidad clínica y legal. Cuando una convocatoria finaliza sin postulantes (0 candidatos), el sistema sugiere inmediatamente el **Top 10 de candidatos calificados del hospital con sus números telefónicos directos** para llamada de contingencia.
- **Filtro Estricto de Elegibilidad (Hard Constraints):** Un funcionario solo es considerado si:
  1. No tiene turno asignado en las fechas solicitadas.
  2. La eventual asignación no viola las reglas normativas (`NORM-01`, `NORM-02`, `NORM-03`, `NORM-06`).
  3. Su cargo/estamento clínico coincide con la vacante requerida.
  4. Está activo en el sistema (`isActive === true`).
- **Algoritmo de Ponderación en Memoria (Soft Constraints):**
  - `+30 pts`: Ha realizado reemplazos previos en este servicio solicitante (experiencia operativa previa).
  - `+25 pts`: Menor carga de horas acumuladas en el mes calendario (criterio de equidad distributiva).
  - `+20 pts`: Último turno finalizado hace $>24\text{h}$ (descanso efectivo óptimo).
  - `+15 pts`: Mismo cargo y especialidad específica.
  - `+10 pts`: Historial intachable (sin reportes de indisponibilidad injustificada en `ShiftConfirmation`).
  - `-20 pts`: Próximo al tope legal de 44h semanales en la semana ISO.
  - `-30 pts`: Turno nocturno programado inmediatamente antes o después del bloque.
- **Rendimiento:** Ejecución en memoria RAM sobre colecciones precargadas en una sola pasada para responder en $< 50\text{ ms}$.

---

## 2. Contrato Técnico Explícito

### 2.1 Tipos TypeScript y DTOs (`server/types/replacement-offer.types.ts`)

```typescript
export interface CandidateScoreBreakdown {
  previousReplacements: number;        // +30 pts (experiencia previa en el servicio)
  accumulatedHoursMonthly: number;     // +25 pts (menor carga acumulada en el mes)
  hoursSinceLastShift: number;         // +20 pts (descanso post-turno > 24h)
  matchesPosition: boolean;            // +15 pts (cargo exacto)
  cleanRecord: boolean;                // +10 pts (sin avisos de indisponibilidad)
  nearWeeklyCapPenalty: boolean;       // -20 pts (cercano al límite de 44h semanales)
  nightShiftAdjacencyPenalty: boolean; // -30 pts (noche inmediata contigua)
}

export interface ScoredCandidateDTO {
  staffId: string;
  fullName: string;
  rut: string;
  phone: string;
  positionName: string;
  score: number;
  breakdown: CandidateScoreBreakdown;
}

export interface OfferScoringResponseDTO {
  success: boolean;
  data: {
    offerId: string;
    isCallList: boolean; // true si es lista de búsqueda activa (con 0 postulantes)
    candidates: ScoredCandidateDTO[];
  };
}
```

### 2.2 Servicio de Disponibilidad (`server/services/availability.service.ts`)

```typescript
export class AvailabilityService {
  /**
   * Evalúa y rankea a los postulantes registrados de una oferta específica
   */
  static async scoreOfferApplicants(offerId: string): Promise<ScoredCandidateDTO[]>;

  /**
   * Búsqueda activa: Identifica y rankea al Top 10 de candidatos elegibles de todo el hospital
   * para un servicio, rango de fechas y cargo específico
   */
  static async getTopEligibleCandidates(
    serviceId: string,
    positionId: string,
    dateStart: Date,
    dateEnd: Date
  ): Promise<ScoredCandidateDTO[]>;

  /**
   * Pre-valida en memoria si un candidato cumple todas las restricciones normativas
   */
  static async validateCompliance(
    staffId: string,
    dateStart: Date,
    dateEnd: Date,
    shiftType: string
  ): Promise<{ valid: boolean; violations: string[] }>;
}
```

### 2.3 Endpoints y Permisos (`server/routes/api/replacement-offer.routes.ts`)

| Método | Endpoint | Permiso | Descripción |
|---|---|---|---|
| `GET` | `/api/replacement-offers/:id/scoring` | `shifts.view` | Retorna postulantes rankeados por score; si no hay postulantes, retorna Top 10 para llamada directa. |

---

## 3. Responsabilidades por Rol

### QA
- Crear suite de pruebas unitarias para el algoritmo de scoring (`server/tests/unit/availability-scoring.test.ts`).
- Probar escenarios:
  1. Candidato con turno en el mismo horario es descartado de la lista (violación hard constraint).
  2. Candidato que incurriría en doble turno continuo (Largo + Noche de 24h) es descartado (violación NORM-02).
  3. Cálculo de puntuación:
     - Funcionario con reemplazos previos en el servicio recibe bonificación de +30 pts.
     - Funcionario con $>24\text{h}$ de descanso recibe +20 pts.
     - Funcionario con noche contigua recibe penalización de -30 pts.
  4. Ordenamiento: la lista final se entrega en orden descendente de `score` y limitada a Top 10 en búsqueda activa.
  5. Si la oferta tiene postulantes, rankea a los postulantes; si tiene 0 postulantes, busca en la dotación de honorarios del hospital con mismo cargo.

### Backend
- Implementar tipos en `server/types/replacement-offer.types.ts`.
- Desarrollar `server/services/availability.service.ts` con precarga en memoria RAM de asignaciones, reemplazos y excepciones.
- Integrar la pre-validación normativa reutilizando las funciones puras de `server/services/alert-rules/`.
- Conectar con `server/controllers/replacement-offer.controller.ts` en el método `getOfferScoringHandler`.

---

## 4. Criterios de Aceptación (Gherkin)

```gherkin
Escenario: Rankeo de postulantes registrados en una convocatoria
  DADO que una convocatoria en "Urgencias" finalizó con 2 postulantes:
    | Funcionario | Reemplazos previos en Urgencias | Descanso post-turno | Horas en el mes |
    | Carlos Perez | 3 | 36 horas | 40 horas |
    | Juan Soto | 0 | 14 horas | 80 horas |
  CUANDO la jefa consulta GET "/api/replacement-offers/{id}/scoring"
  ENTONCES el servidor responde HTTP 200 con la lista de candidatos
  Y "Carlos Perez" encabeza la lista con mayor puntaje por historial en el servicio y descanso óptimo
  Y la respuesta incluye el desglose detallado de "breakdown" para cada postulante

Escenario: Sugerencia de Top 10 con teléfonos ante convocatoria desierta
  DADO que una convocatoria finalizó con 0 postulantes
  CUANDO la jefa consulta GET "/api/replacement-offers/{id}/scoring"
  ENTONCES el servidor responde HTTP 200 con "isCallList: true"
  Y retorna un máximo de 10 candidatos elegibles ordenados por mayor puntaje
  Y cada candidato incluye obligatoriamente su número de teléfono directo "phone"
```
