---
title: "Fase 2: Portal PWA - Frontend: Módulo Mis Turnos (Calendario Mensual vs Cartola de Reemplazos)"
type: feature
status: done
agents:
  - qa
  - frontend
---

# Fase 2: Portal PWA - Frontend: Módulo Mis Turnos (Calendario Mensual vs Cartola de Reemplazos)

## 1. Contexto y Objetivos

Conforme a la Sección 5.1.5 de la especificación técnica maestra ([zuriapp-v2-expansion-spec.md](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/.specs/docs/zuriapp-v2-expansion-spec.md)):

- **Dualidad Conceptual de Dominio:**
  - *Turno Base:* Matriz fija programada del servicio (`TurnAssignment`).
  - *Reemplazo:* Acto administrativo formal / "pseudo-contrato" (`Replacement`) que amarra a un titular ausente con un reemplazante entrante, generando código `id_negocio` (ej. `REP-2026-0891`), vigencia y jornadas comprometidas.
  - Para los honorarios, toda jornada trabajada emana de un reemplazo. Necesitan auditar tanto la cuadrícula de días como sus contratos de respaldo legal para emitir sus boletas de cobro.
- **Conmutador Superior:** Control segmentado ergonómico entre:
  - `[ 📅 Calendario de Turnos ]`
  - `[ 🤝 Mis Reemplazos (N) ]`
- **Sub-pestaña A — Calendario de Turnos:**
  - Cuadrícula mensual móvil con siglas hospitalarias (`L` Largo en azul, `N` Noche en morado, `X` Libre en gris).
  - Distintivo visual en días de reemplazo (borde dorado y badge `🤝`).
  - Navegación mensual histórica `< Mes >`. En meses cerrados despliega botón `[ 📄 Descargar Mi Cartola Oficial (PDF) ]`.
  - Detalle diario al tocar cualquier fecha, con enlace de salto directo al contrato de reemplazo si aplica.
  - Alternador visual entre cuadrícula y lista cronológica (`[ 📋 Ver como Lista ]`).
- **Sub-pestaña B — Mis Reemplazos (Cartola de Contratos):**
  - Filtros rápidos: `[ Todos ]`, `[ Activos ]`, `[ Finalizados ]`.
  - Tarjetas de contrato (`ReplacementContractCard.vue`) con código `id_negocio`, servicio, vigencia, estado (Activo, Finalizado, Corte Anticipado) y botón `[ 📄 Descargar Comprobante (PDF) ]`.
- **Atajos y Navegación Cruzada (Deep Linking):**
  - Tocar el KPI en Home (`🤝 X Reemplazos este mes ➔`) salta a la pestaña "Mis Reemplazos".
  - Tocar el enlace de contrato en el detalle de un turno del calendario enfoca la tarjeta del contrato respectivo.

---

## 2. Contrato Técnico Explícito

### 2.1 Tipos TypeScript Frontend (`client/src/types/portal.types.ts`)

```typescript
export interface PortalShiftItem {
  date: string;                // YYYY-MM-DD
  sigla: string;               // 'L', 'N', 'X', etc.
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

export interface PortalReplacementContract {
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

export interface PortalShiftsViewData {
  period: { month: number; year: number };
  isClosed: boolean;
  shifts: PortalShiftItem[];
  replacementContracts: PortalReplacementContract[];
}
```

### 2.2 Componentes a Implementar

```
client/src/views/portal/PortalShifts.vue                 [NUEVO — Vista principal con conmutador dual]
client/src/components/portal/
├── ReplacementContractCard.vue                         [NUEVO — Tarjeta de pseudo-contrato con código REP y botón PDF]
└── ShiftDayDetailSheet.vue                             [NUEVO — Panel inferior al pulsar un día en el calendario]
```

### 2.3 Métodos del Servicio (`client/src/services/portal.service.ts`)

- `getShifts(month: number, year: number): Promise<PortalShiftsViewData>`
- `downloadCartolaPdf(month: number, year: number): Promise<Blob>`
- `downloadVoucherPdf(replacementId: string): Promise<Blob>`

---

## 3. Responsabilidades por Rol

### QA
- Crear tests de componentes para el módulo Mis Turnos (`client/src/views/portal/__tests__/PortalShifts.test.ts`, `ReplacementContractCard.test.ts`).
- Probar escenarios:
  1. Conmutador alterna fluidamente entre la vista de Calendario y la vista de Cartola de Reemplazos sin reconsultar el backend innecesariamente.
  2. Días marcados como reemplazo (`isReplacement: true`) renderizan el distintivo dorado `🤝`.
  3. Navegación a un mes cerrado muestra el botón "Descargar Mi Cartola Oficial (PDF)"; en meses abiertos no se muestra o muestra "Avance del Mes".
  4. Pulsar el botón de copiar código `id_negocio` en `ReplacementContractCard.vue` escribe al portapapeles y muestra confirmación visual.
  5. Pulsar "Descargar Comprobante (PDF)" invoca `downloadVoucherPdf` con el ID del contrato.
  6. Deep link: al entrar con query `?tab=contracts` o al pulsar el link desde el calendario, se activa directamente la pestaña de reemplazos y se enfoca el contrato.

### Frontend
- Crear vista `client/src/views/portal/PortalShifts.vue`:
  - Cabecera con selector de mes (`< Agosto 2026 >`).
  - Control segmentado `[ 📅 Calendario de Turnos ]` / `[ 🤝 Mis Reemplazos (N) ]`.
  - Integración de FullCalendar móvil en modo cuadrícula y alternador a vista de lista.
  - Sub-pestaña de Reemplazos con filtros (`Todos`, `Activos`, `Finalizados`).
- Crear componente `client/src/components/portal/ReplacementContractCard.vue`:
  - Diseño estilo tarjeta de contrato con badges de estado, código formal `REP-YYYY-XXXX`, servicio y fechas.
  - Botón de descarga de comprobante individual PDF.
- Crear componente `client/src/components/portal/ShiftDayDetailSheet.vue` para detalle al tocar cualquier día.
- Conectar con `portal.store.ts` y soportar query params en ruta (`?tab=contracts&id=...`).

---

## 4. Criterios de Aceptación (Gherkin)

```gherkin
Escenario: Visualización de días de reemplazo en calendario mensual
  DADO que el funcionario tiene un turno el día 15/09/2026 originado por un reemplazo
  CUANDO visualiza el calendario en "PortalShifts.vue"
  ENTONCES la celda del 15 de septiembre muestra la sigla correspondiente
  Y muestra un icono distintivo de reemplazo "🤝"
  Y al tocar la celda, el panel de detalle muestra "Turno cubierto bajo Contrato REP-2026-0891" con enlace al contrato

Escenario: Navegación por deep link hacia la cartola de contratos
  DADO que el funcionario toca el enlace "[ Ver Contrato de Reemplazo ➔ ]" en el detalle del día
  CUANDO la vista responde a la navegación
  ENTONCES el conmutador superior cambia automáticamente a la pestaña "Mis Reemplazos"
  Y la tarjeta del contrato correspondiente es resaltada en pantalla

Escenario: Descarga de cartola oficial de mes cerrado
  DADO que el funcionario retrocede con las flechas de navegación a un mes anterior cerrado (ej. Agosto 2026)
  CUANDO hace clic en "[ 📄 Descargar Mi Cartola Oficial (PDF) ]"
  ENTONCES se invoca la descarga del archivo PDF oficial timbrado del mes seleccionado
```
