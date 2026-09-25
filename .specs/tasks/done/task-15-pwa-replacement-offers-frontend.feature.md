---
title: "Fase 2: Bolsa de Reemplazos - Frontend: Postulaciones Móviles en PWA para Honorarios"
type: feature
status: done
agents:
  - qa
  - frontend
---

# Fase 2: Bolsa de Reemplazos - Frontend: Postulaciones Móviles en PWA para Honorarios

## 1. Contexto y Objetivos

Conforme a la Sección 5.1.6 de la especificación técnica maestra ([zuriapp-v2-expansion-spec.md](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/.specs/docs/zuriapp-v2-expansion-spec.md)):

- **Tablón Móvil de Convocatorias (Exclusivo Honorarios):** Los funcionarios con contrato a honorarios acceden a la 3ª pestaña de su barra de navegación: `[ 📢 Bolsa ]`.
- **Alcance Multiservicio y Confidencialidad:** Visualizan ofertas de **cualquier servicio del hospital** que coincidan estrictamente con su cargo (`positionId`). Se mantiene reserva total de la identidad y causal médica del titular ausente.
- **Sub-pestaña "Convocatorias Abiertas":**
  - Tarjetas interactivas (`OfferCard.vue`) con temporizador decreciente en vivo (ej. ⏳ *Cierra en 45m*).
  - Información operativa: servicio, unidad, fechas, horario (`Largo 08:00-20:00` o `Noche 20:00-08:00`) y observaciones clínicas.
  - Postulación en 1 toque con pre-validación visual de descanso inter-turno.
  - Opción de retirar postulación voluntariamente mientras la oferta siga abierta.
- **Sub-pestaña "Mis Postulaciones":**
  - Seguimiento del ciclo de vida de cada postulación con badges informativos:
    - 🟡 *En postulación* (convocatoria abierta).
    - ⏳ *En evaluación* (plazo cerrado, jefa revisando candidatos).
    - 🏆 *Adjudicado* (turno asignado, botón directo a *Mis Turnos*).
    - ⚪ *No seleccionado* (adjudicado a otro colega).
    - 🔄 *Retirado por conflicto (`withdrawn_conflict`)*: Informa claramente que fue retirado de forma automática al habérsele adjudicado otro turno simultáneo.

---

## 2. Contrato Técnico Explícito

### 2.1 Tipos TypeScript Frontend (`client/src/types/portal.types.ts`)

```typescript
export interface PwaOpenOfferItem {
  id: string;
  serviceId?: string;
  serviceName: string;
  serviceLocation?: string;
  positionId?: string;
  positionName: string;
  tipo_turno: string;
  entryTime?: string;
  exitTime?: string;
  fecha_inicio: string;
  fecha_termino: string;
  totalShifts?: number;
  expiresAt: string;
  observaciones?: string;
  applicantsCount?: number;
  alreadyApplied?: boolean;
  hasApplied?: boolean;
  myApplicationStatus?: 'pending' | 'selected' | 'not_selected' | 'cancelled_by_staff' | 'withdrawn_conflict';
}

export interface PwaMyApplicationItem {
  offerId: string;
  serviceName: string;
  positionName: string;
  tipo_turno: string;
  fecha_inicio: string;
  fecha_termino: string;
  appliedAt: string;
  offerStatus?: 'open' | 'evaluating' | 'awarded' | 'cancelled' | 'expired';
  myStatus?: 'pending' | 'selected' | 'not_selected' | 'cancelled_by_staff' | 'withdrawn_conflict';
  status: 'pending' | 'selected' | 'not_selected' | 'cancelled_by_staff' | 'withdrawn_conflict';
  statusLabel?: string;
  statusColor?: string;
}
```

### 2.2 Componentes y Vistas a Implementar

```
client/src/views/portal/PortalOpenOffers.vue             [NUEVO — Vista principal de la Bolsa en PWA]
client/src/components/portal/
├── OfferCard.vue                                       [NUEVO — Tarjeta de convocatoria con countdown y botón 1-toque]
└── ApplicationStatusBadge.vue                          [NUEVO — Badge de estado de postulación]
```

### 2.3 Métodos del Servicio (`client/src/services/portal.service.ts`)

- `getOpenOffers(): Promise<PwaOpenOfferItem[]>` (consume `GET /api/replacement-offers/open`)
- `getMyApplications(): Promise<PwaMyApplicationItem[]>` (consume `GET /api/replacement-offers/my-applications`)
- `applyToOffer(offerId: string): Promise<void>` (consume `POST /api/replacement-offers/:id/apply`)
- `withdrawApplication(offerId: string): Promise<void>` (consume `POST /api/replacement-offers/:id/withdraw`)

---

## 3. Responsabilidades por Rol

### QA
- Crear suite de tests de componentes para la bolsa móvil (`client/src/views/portal/__tests__/PortalOpenOffers.test.ts`, `OfferCard.test.ts`, `ApplicationStatusBadge.test.ts`).
- Probar escenarios:
  1. `PortalOpenOffers.vue`: control segmentado alterna entre "Convocatorias Abiertas" y "Mis Postulaciones".
  2. `OfferCard.vue`: muestra temporizador dinámico en vivo; si el funcionario ya postuló, el botón cambia a "Postulado (Cancelar)".
  3. Al pulsar "Postular", invoca `applyToOffer` y muestra confirmación visual.
  4. En "Mis Postulaciones", una oferta con estado `withdrawn_conflict` muestra el badge de advertencia y el mensaje explicativo de conflicto de horario.
  5. Una oferta adjudicada (`selected`) muestra botón destacado "Ir a Mis Turnos" que redirige a `/portal/shifts`.

### Frontend
- Crear vista `client/src/views/portal/PortalOpenOffers.vue` con control segmentado superior y pull-to-refresh.
- Desarrollar componente `client/src/components/portal/OfferCard.vue` con diseño para smartphone y temporizador en cuenta regresiva.
- Desarrollar `client/src/components/portal/ApplicationStatusBadge.vue` con los 5 estados hospitalarios.
- Integrar métodos en `client/src/services/portal.service.ts`.

---

## 4. Criterios de Aceptación (Gherkin)

```gherkin
Escenario: Postulación en 1 toque desde la PWA
  DADO que un honorario TENS visualiza una convocatoria abierta en "Urgencias"
  CUANDO presiona el botón "Postular a este Turno"
  ENTONCES se invoca "portalService.applyToOffer"
  Y la tarjeta pasa inmediatamente a mostrar "Postulado" con opción de cancelar
  Y la oferta se lista en la pestaña "Mis Postulaciones" con estado "En postulación"

Escenario: Visualización de retiro en cascada por adjudicación paralela
  DADO que el honorario fue adjudicado en otro turno que colisiona con una postulación previa
  CUANDO revisa la pestaña "Mis Postulaciones"
  ENTONCES la postulación colisionante muestra el estado "Retirado por conflicto"
  Y al tocar la tarjeta se informa: "Fuiste seleccionado para otro turno en el mismo horario. Postulación cancelada automáticamente."
```
