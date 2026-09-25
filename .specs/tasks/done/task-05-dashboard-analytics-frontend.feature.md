---
title: "Fase 1: Dashboard de Indicadores por Servicio - Frontend (Visualización, Métricas y Modal de Dotación)"
type: feature
status: done
agents:
  - qa
  - frontend
---

# Fase 1: Dashboard de Indicadores por Servicio - Frontend (Visualización, Métricas y Modal de Dotación)

## 1. Contexto y Objetivos

Conforme a la Sección 4.1.5 de la especificación técnica maestra ([.specs/docs/zuriapp-v2-expansion-spec.md](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/.specs/docs/zuriapp-v2-expansion-spec.md)):
- **Servicio Habitual y UX sin fricción:** La mayoría de las supervisoras y jefaturas trabajan fijas en una unidad clínica. Para evitar buscar su unidad en una lista de 30 servicios cada vez que ingresan, el cliente guarda la última selección en `localStorage.getItem('zuriapp_preferred_service')`. Al acceder a `/app/dashboard`, se carga automáticamente su servicio habitual. Directivos y administradores pueden cambiar de servicio libremente mediante el selector del encabezado.
- **Componentes Visuales Especializados:**
  1. `KPICards.vue`: resumen ejecutivo con 4 métricas (Total Reemplazos, Tasa de Reemplazos %, Jornadas Programadas, Jornadas Reemplazadas) y etiquetas comparativas del mes anterior (flechas verde/rojo según tendencia).
  2. `CoverageGauge.vue`: indicador semicircular o barra de progreso con semáforo contextual dinámico (`optimal` verde, `warning` amarillo, `critical` rojo) comparado contra los umbrales específicos del servicio, más desglose expandible por cargo (`byPosition`).
  3. `EmptyStateCoverage.vue`: banner informativo cuando `coverage.configured === false`, invitando a configurar la dotación mínima si el usuario tiene permisos.
  4. `ReplacementChart.vue`: gráfico de barras o líneas con la evolución mensual de reemplazos utilizando Chart.js.
  5. `TopReplacedStaff.vue`: tabla con los 5 funcionarios con mayor cantidad de turnos cubiertos por reemplazo en el período.
  6. `HoursBreakdownCard.vue`: barra horizontal proporcional de horas diurnas vs nocturnas y porcentaje de sobrecarga nocturna.
  7. `ServiceStaffingModal.vue`: modal dedicado para configurar dotación mínima por cargo (día y noche) y umbrales verde/amarillo sin abandonar el dashboard.
- **Seguridad y Permisos Visuales:**
  - El botón ⚙️ *"Ajustar Dotación y Metas"* solo se muestra si `service.canEditStaffing === true`.
  - Si la supervisora consulta un servicio ajeno, el dashboard opera estrictamente en **modo solo lectura**.
- **Reactividad en Tiempo Real (Socket.io):**
  - El store Pinia `dashboard.store.ts` se une a la sala del servicio (`socket.emit("join:service", serviceId)`) y escucha el evento `dashboard:invalidated` para actualizar los datos en segundo plano sin recargar la página.

---

## 2. Contrato Técnico Explícito

### 2.1 Tipos TypeScript en Frontend (`client/src/types/dashboard.types.ts`)

```typescript
export interface DashboardKPIResponse {
  success: boolean;
  data: {
    period: { month: number; year: number };
    service: {
      id: string;
      name: string;
      canEditStaffing: boolean;
    };
    summary: {
      totalReplacements: number;
      replacementRate: number;
      scheduledShiftDays: number;
      totalShiftsReplaced: number;
    };
    coverage: {
      configured: boolean;
      overallPercentage: number | null;
      status: 'optimal' | 'warning' | 'critical';
      thresholds: {
        green: number;
        yellow: number;
      };
      uncoveredSlotsCount: number;
      byPosition: Array<{
        positionId: string;
        positionName: string;
        minDay: number;
        minNight: number;
        coveragePercentage: number;
      }>;
    };
    hoursBreakdown: {
      totalHours: number;
      dayHours: number;
      nightHours: number;
      nightPercentage: number;
    };
    topReplacedStaff: Array<{
      staffId: string;
      fullName: string;
      rut: string;
      positionName: string;
      replacementCount: number;
      totalShiftsReplaced: number;
    }>;
    comparative: {
      previousPeriod: { month: number; year: number };
      replacementsDeltaPct: number | null;
      replacementRateDeltaPoints: number | null;
      coverageDeltaPoints: number | null;
    };
    cached: boolean;
    generatedAt: string;
  };
}

export interface UpdateServiceStaffingPayload {
  dotacion_minima?: Array<{
    positionId: string;
    minimo_dia: number;
    minimo_noche: number;
  }>;
  umbrales_cobertura?: {
    verde: number;
    amarillo: number;
  };
}
```

### 2.2 Servicio de Cliente (`client/src/services/dashboard.service.ts`)

```typescript
export const getServiceKPIs = async (
  apiPrivate: any,
  serviceId: string,
  month?: number,
  year?: number
): Promise<DashboardKPIResponse> => {
  const params: Record<string, any> = {};
  if (month) params.month = month;
  if (year) params.year = year;
  const { data } = await apiPrivate.get(`/dashboard/${serviceId}/kpis`, { params });
  return data;
};

export const updateServiceStaffing = async (
  apiPrivate: any,
  serviceId: string,
  payload: UpdateServiceStaffingPayload
): Promise<{ success: boolean; data: any }> => {
  const { data } = await apiPrivate.patch(`/services/${serviceId}/staffing`, payload);
  return data;
};
```

### 2.3 Store Pinia (`client/src/stores/dashboard.store.ts`)

- **State:**
  - `selectedServiceId: string`
  - `selectedMonth: number`
  - `selectedYear: number`
  - `kpiData: DashboardKPIResponse['data'] | null`
  - `loading: boolean`
  - `error: string | null`
  - `showStaffingModal: boolean`
- **Acciones:**
  - `fetchKPIs(serviceId?: string, month?: number, year?: number)`
  - `setSelectedService(serviceId: string)`: guarda en `localStorage` (`zuriapp_preferred_service`), gestiona salas de Socket (`leave:service` y `join:service`) y recarga KPIs.
  - `saveStaffing(payload: UpdateServiceStaffingPayload)`
  - `initSocketListeners()`: al recibir `dashboard:invalidated`, si coincide con el servicio y período activo, recarga silenciosamente.

---

## 3. Responsabilidades por Rol

### QA (RED)
1. **Pruebas de Componentes Frontend (`client/src/views/DashboardView.test.ts`):**
   - Verificar que al montar cargue el servicio almacenado en `localStorage` si existe.
   - Verificar que renderice las 4 cards con valores formateados (tasa con un decimal y `%`, deltas con signos $+/-$).
   - Verificar que `CoverageGauge.vue` muestre color verde cuando `status === 'optimal'`, amarillo cuando `status === 'warning'` y rojo cuando `status === 'critical'`.
   - Verificar que si `coverage.configured === false`, muestre el componente `EmptyStateCoverage.vue`.
   - Verificar que el botón de configuración de dotación ⚙️ solo sea visible si `canEditStaffing === true`.
2. **Pruebas del Store (`client/src/stores/dashboard.store.test.ts`):**
   - Probar que `setSelectedService` actualice `localStorage` y llame a la API.
   - Probar que el evento de Socket `dashboard:invalidated` dispare la recarga de datos.

### Frontend (GREEN & REFACTOR)
1. Crear `client/src/types/dashboard.types.ts`.
2. Crear `client/src/services/dashboard.service.ts`.
3. Crear `client/src/stores/dashboard.store.ts`.
4. Implementar componentes en `client/src/components/dashboard/`:
   - `KPICards.vue`
   - `CoverageGauge.vue`
   - `EmptyStateCoverage.vue`
   - `ReplacementChart.vue`
   - `TopReplacedStaff.vue`
   - `HoursBreakdownCard.vue`
   - `ServiceStaffingModal.vue`
5. Implementar vista principal `client/src/views/DashboardView.vue`.
6. Actualizar `client/src/router/index.ts` para que la ruta `/app/dashboard` renderice `DashboardView.vue`.

---

## 4. Criterios de Aceptación (Gherkin)

```gherkin
Escenario: Carga automática de servicio habitual desde LocalStorage al ingresar al Dashboard
  DADO que una supervisora seleccionó previamente el servicio "Urgencia Adultos"
  Y su identificador quedó persistido en la clave localStorage "zuriapp_preferred_service"
  CUANDO la usuaria navega a la ruta /app/dashboard
  ENTONCES la vista selecciona automáticamente "Urgencia Adultos" en el dropdown principal
  Y solicita los KPIs correspondientes al mes y año en curso

Escenario: Semáforo contextual dinámico en indicador de Cobertura
  DADO un servicio con cobertura general del 91%
  CUANDO se visualiza el componente CoverageGauge
  Y el servicio tiene configurado umbral verde en 95% y amarillo en 85%
  ENTONCES el indicador muestra estado "warning" con badge y borde amarillo
  PERO si otro servicio tiene configurado umbral verde en 90%
  ENTONCES el indicador muestra estado "optimal" con badge y borde verde

Escenario: Gobernanza y visibilidad del botón de configuración de dotación
  DADO un usuario que ingresa al Dashboard de un servicio donde service.canEditStaffing es false
  CUANDO visualiza la tarjeta de Cobertura de Dotación
  ENTONCES el botón "Ajustar Dotación y Metas" está oculto
  Y no es posible abrir el modal de edición de dotación

Escenario: Actualización en vivo ante evento de invalidación por WebSockets
  DADO que el Dashboard tiene desplegados los KPIs de "UCI Adultos" para el mes actual
  CUANDO otro usuario registra un reemplazo en "UCI Adultos" y el backend emite "dashboard:invalidated"
  ENTONCES el store del Dashboard intercepta el evento
  Y actualiza los datos en segundo plano reflejando el nuevo total de reemplazos sin recargar la página completa
```
