---
title: "Fase 2: Bolsa de Reemplazos - Frontend: Módulo de Convocatorias en Escritorio, Scoring y Adjudicación"
type: feature
status: done
agents:
  - qa
  - frontend
---

# Fase 2: Bolsa de Reemplazos - Frontend: Módulo de Convocatorias en Escritorio, Scoring y Adjudicación

## 1. Contexto y Objetivos

Conforme a las Secciones 5.2.2, 5.2.7 y 5.2.8 de la especificación técnica maestra ([zuriapp-v2-expansion-spec.md](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/.specs/docs/zuriapp-v2-expansion-spec.md)):

- **Navegación Enterprise y Badge Reactivo:** Incorporar en el menú lateral ([SidebarMenu.vue](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/client/src/components/auth/SidebarMenu.vue)) el módulo `📢 Bolsa de Reemplazos` (`/app/operaciones/bolsa-reemplazos`) con badge permanente del total de convocatorias abiertas (`status: 'open'`).
- **Tablón Operativo de Convocatorias (`ReplacementOffersView.vue`):**
  - Filtros por estado: `[ Todas ]`, `[ Abiertas ]`, `[ Finalizadas ]`, `[ Adjudicadas ]`, `[ Canceladas ]`.
  - Tabla de gestión con cuenta regresiva en vivo (ej: `45m restantes`), datos del titular ausente y su causal (`motivo`), horario del turno y contador interactivo de postulantes.
- **Modal Dual de Candidatos (`ReplacementOfferApplicantsModal.vue`):**
  - *Con Postulantes:* Visualización de postulantes ordenados por el Score del motor 5.2 con desglose de puntos y botón "Adjudicar Turno" (con mensaje de retiro en cascada y enlace a Reemplazos Oficiales).
  - *Sin Postulantes:* Panel de contingencia con el Top 10 de candidatos sugeridos del hospital y botones de llamada telefónica directa (`tel:...`).
- **Evolución del Modal de Reemplazos ([ReplacementModalCreate.vue](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/client/src/components/replacements/ReplacementModalCreate.vue)):**
  - Selector de modo: **Modo A (Directo)** vs **Modo B ("Publicar en Bolsa de Reemplazos")**.
  - En Modo B, oculta el selector de `id_entrante` y despliega selector de vencimiento (`expiresAt`) con botones rápidos: `[ En 2 horas ]`, `[ En 4 horas ]`, `[ Fin del día (18:00) ]` y `[ Personalizado ]`.
- **Puente Cruzado:** Botón rápido en [ActiveReplacementsView.vue](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/client/src/views/active-replacements/ActiveReplacementsView.vue) para acceder directamente a la Bolsa de Reemplazos.

---

## 2. Contrato Técnico Explícito

### 2.1 Tipos TypeScript Frontend (`client/src/types/replacement-offer.types.ts`)

```typescript
export interface ReplacementOfferItem {
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
  id_saliente?: string;
  nombre_saliente?: string;
  rut_saliente?: string;
  motivo?: string;
  observaciones?: string;
}

export interface CandidateBreakdown {
  previousReplacements: number;
  accumulatedHoursMonthly: number;
  hoursSinceLastShift: number;
  matchesPosition: boolean;
  cleanRecord: boolean;
  nearWeeklyCapPenalty: boolean;
  nightShiftAdjacencyPenalty: boolean;
}

export interface ScoredCandidateItem {
  staffId: string;
  fullName: string;
  rut: string;
  phone: string;
  positionName: string;
  score: number;
  breakdown: CandidateBreakdown;
}
```

### 2.2 Archivos a Implementar / Modificar

```
client/src/views/replacement-offers/ReplacementOffersView.vue  [NUEVO — Vista principal de Jefatura]
client/src/components/replacements/
├── ReplacementOfferApplicantsModal.vue                       [NUEVO — Modal dual: Postulantes y Búsqueda Activa]
└── ReplacementModalCreate.vue                                [MODIFICADO — Selector de Modo Directo vs Modo Bolsa]
client/src/stores/replacement-offer.store.ts                  [NUEVO — Store Pinia reactivo con Socket.io]
client/src/components/auth/SidebarMenu.vue                    [MODIFICADO — Ítem Bolsa de Reemplazos con Badge 'open']
client/src/views/active-replacements/ActiveReplacementsView.vue [MODIFICADO — Botón de enlace a Bolsa de Reemplazos]
client/src/router/index.ts                                    [MODIFICADO — Ruta /app/operaciones/bolsa-reemplazos]
```

---

## 3. Responsabilidades por Rol

### QA
- Crear suite de tests de componentes para la gestión de ofertas de escritorio (`client/src/views/replacement-offers/__tests__/ReplacementOffersView.test.ts`, `ReplacementOfferApplicantsModal.test.ts`).
- Probar escenarios:
  1. `SidebarMenu.vue`: muestra el badge con la cantidad exacta de ofertas con `status === 'open'`. No cuenta ofertas finalizadas ni canceladas.
  2. `ReplacementOffersView.vue`: filtros rápidos (`Abiertas`, `Finalizadas`, `Adjudicadas`) filtran la grilla reactivamente en cliente.
  3. Temporizador de tiempo restante calcula y muestra minutos/horas decrecientes y pasa a "Plazo concluido" al vencer.
  4. `ReplacementModalCreate.vue`: al alternar a "Modo Bolsa", el campo `id_entrante` desaparece y se muestran los presets de vencimiento (`2h`, `4h`, `18:00`).
  5. `ReplacementOfferApplicantsModal.vue`:
     - Renderiza postulantes ordenados por score con barras de desglose visual.
     - Botón "Adjudicar Turno" dispara confirmación y feedback de retiro en cascada.
     - Si la oferta tiene 0 postulantes, renderiza el listado de contingencia con enlaces directos `tel:...`.

### Frontend
- Crear vista `client/src/views/replacement-offers/ReplacementOffersView.vue`.
- Desarrollar modal `client/src/components/replacements/ReplacementOfferApplicantsModal.vue`.
- Modificar modal `client/src/components/replacements/ReplacementModalCreate.vue` sumando selector de modo y presets de tiempo.
- Modificar `client/src/components/auth/SidebarMenu.vue` integrando el ítem y el badge numérico.
- Crear store Pinia `client/src/stores/replacement-offer.store.ts` con consumo de servicio Axios y eventos WebSocket.
- Agregar botón rápido en `client/src/views/active-replacements/ActiveReplacementsView.vue`.

---

## 4. Criterios de Aceptación (Gherkin)

```gherkin
Escenario: Publicación de convocatoria con selector rápido de tiempo
  DADO que la supervisora abre el modal "Nuevo Reemplazo"
  CUANDO selecciona el interruptor "Publicar en Bolsa de Reemplazos"
  ENTONCES el campo de funcionario entrante se oculta
  Y aparecen los botones de vencimiento: "En 2 horas", "En 4 horas", "Fin del día (18:00)" y "Personalizado"
  Y al pulsar "En 2 horas" y guardar, la oferta se publica en la bolsa con fecha límite calculada

Escenario: Adjudicación de turno con feedback de retiro en cascada
  DADO que una convocatoria finalizó con 3 postulantes
  CUANDO la jefa abre el modal de postulantes y presiona "Adjudicar Turno" sobre el candidato con mayor score
  ENTONCES se procesa la adjudicación exitosamente
  Y se muestra notificación Toast: "Turno adjudicado exitosamente. Candidato auto-retirado de 1 convocatoria colisionante."
  Y el toast incluye el enlace "[ Ver en Reemplazos Oficiales ➔ ]"
```
