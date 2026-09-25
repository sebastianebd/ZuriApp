---
title: "Fase 1: Dashboard de Indicadores por Servicio - Backend (KPIs, Caché Redis y Ajuste de Dotación)"
type: feature
status: done
agents:
  - qa
  - backend
---

# Fase 1: Dashboard de Indicadores por Servicio - Backend (KPIs, Caché Redis y Ajuste de Dotación)

## 1. Contexto y Objetivos

Conforme a la Sección 4.1 de la especificación técnica maestra ([.specs/docs/zuriapp-v2-expansion-spec.md](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/.specs/docs/zuriapp-v2-expansion-spec.md)):
- **Delimitación de Dominio:** ZuriApp **no es un reloj biométrico** ni mide asistencia física de RRHH (SIRH). Lo que administra con rigor matemático es la **planificación de turnos oficiales y los reemplazos autorizados**. Mide la **Tasa de Reemplazos** (nivel de inestabilidad o contingencia de dotación), no el ausentismo no justificado de reloj control.
- **Catálogo de KPIs por Servicio:**
  1. `totalReplacements`: conteo de reemplazos en el mes para el servicio.
  2. `scheduledShiftDays`: suma de jornadas presenciales planificadas (Largos, Noches, Diurnos, excluyendo días libres `X`) de todo el personal asignado al servicio según `TurnAssignment`.
  3. `totalShiftsReplaced`: suma de jornadas presenciales cubiertas por reemplazos activos en el mes.
  4. `replacementRate`: porcentaje normalizado $\left( \frac{\text{totalShiftsReplaced}}{\text{scheduledShiftDays}} \right) \times 100$. Si `scheduledShiftDays == 0`, retorna `0`.
  5. `topReplacedStaff`: Top 5 de funcionarios salientes con más turnos reemplazados.
  6. `coverage`: puestos-persona presentes vs requeridos según `Service.dotacion_minima`. Si no está configurada, retorna `configured: false` y `overallPercentage: null`. Se evalúa frente a los umbrales específicos del servicio (`Service.umbrales_cobertura`: `verde` default 95, `amarillo` default 85) retornando `status: 'optimal' | 'warning' | 'critical'`.
  7. `hoursBreakdown`: reutiliza `calculateDayNightMetrics()` de `report.service.ts` para total, día, noche y `%` nocturno.
  8. `comparative`: deltas con respecto al mes anterior ($M-1$).
- **Caché y Rendimiento:**
  - Almacenamiento en Redis con clave `kpi:service:{serviceId}:{year}:{month}` y TTL de 24 horas (86.400 segundos).
  - Invalidación perezosa (`delPattern` o `redis.del`) en mutaciones de `TurnAssignment`, `Replacement`, `ShiftException` y `Service`.
  - Notificación en tiempo real vía Socket.io a la sala `service:{serviceId}` con evento `dashboard:invalidated`.
- **Gobernanza Contextual de Dotación (`PATCH /api/services/:id/staffing`):**
  - Permite a jefaturas de servicio, supervisores o coordinadores configurar la dotación mínima y umbrales sin requerir permisos globales de administración (`SYS_ADMIN`).

---

## 2. Contrato Técnico Explícito

### 2.1 Tipos TypeScript y DTOs (`server/types/dashboard.types.ts`)

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

export interface UpdateServiceStaffingDTO {
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

### 2.2 Rutas y Controladores

#### A) `GET /api/dashboard/:serviceId/kpis`
- **Archivo:** `server/routes/api/dashboard.routes.ts`
- **Middlewares:** `authMiddleware`, `requirePermission("shifts.view")`
- **Controlador:** `server/controllers/dashboard.controller.ts` $\rightarrow$ `getServiceKPIsHandler`
- **Query Params:**
  - `month`: entero entre 1 y 12 (opcional, default mes actual).
  - `year`: entero $\ge 2020$ (opcional, default año actual).

#### B) `PATCH /api/services/:id/staffing`
- **Archivo:** `server/routes/api/service.routes.ts`
- **Middlewares:** `authMiddleware`
- **Controlador:** `server/controllers/service.controller.ts` $\rightarrow$ `updateServiceStaffingHandler`
- **Regla RBAC Contextual:**
  - Autorizado si el usuario tiene rol con permisos globales `service.update` (o `SYS_ADMIN`).
  - O si el usuario logueado (`req.user.staffId`) coincide con `service.jefe_servicio`, `service.supervisor` o figura en `service.coordinadores[]`.
  - En caso contrario, retorna código HTTP `403 Forbidden`.

### 2.3 Servicio y Métricas (`server/services/dashboard.service.ts`)

Debe implementar:
1. `getServiceKPIs(serviceId: string, month: number, year: number, accountStaffId?: string): Promise<DashboardKPIResponse['data']>`
2. `calculateReplacementMetrics(...)`: cálculo de jornadas efectivas excluyendo días libres `'X'`.
3. `calculateCoverageMetrics(...)`: cálculo de puestos cubiertos vs mínimos requeridos comparados con `umbrales_cobertura`.
4. Reutilizar `calculateDayNightMetrics` de [report.service.ts](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/server/services/report.service.ts).
5. Clave de caché en Redis: `kpi:service:{serviceId}:{year}:{month}` con TTL de 86400 segundos.
6. Emisión Socket.io mediante `emitDashboardInvalidated` en [socket.service.ts](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/server/services/socket.service.ts).

---

## 3. Responsabilidades por Rol

### QA (RED)
1. **Pruebas Unitarias de Servicio (`server/tests/unit/dashboard.service.test.ts`):**
   - Verificar cálculo de `replacementRate` con datos conocidos (ej: 15 jornadas reemplazadas de 300 programadas = 5.0%).
   - Verificar cálculo de `replacementRate = 0` cuando `scheduledShiftDays = 0`.
   - Verificar que `coverage` retorne `configured: false` y `% = null` si el servicio no tiene `dotacion_minima`.
   - Verificar semáforo contextual: si cobertura es 90% con umbrales 95/85 $\rightarrow$ `'warning'`; con umbrales 88/80 $\rightarrow$ `'optimal'`.
   - Verificar cálculo de deltas comparativos respecto al mes anterior.
2. **Pruebas de Integración de API (`server/tests/integration/dashboard.controller.test.ts`):**
   - `GET /api/dashboard/:serviceId/kpis`: verificar respuesta 200 con estructura completa, cabeceras y caché en Redis.
   - `PATCH /api/services/:id/staffing`:
     - Verificar 200 cuando el usuario es coordinador o supervisor del servicio.
     - Verificar 403 Forbidden cuando el usuario pertenece a otro servicio y no es admin.
     - Verificar invalidación de clave Redis al modificar dotación.

### Backend (GREEN & REFACTOR)
1. Crear `server/types/dashboard.types.ts` con las interfaces de DTOs.
2. Actualizar modelo de `Service` ([service.model.ts](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/server/models/service.model.ts)) si requiere campos `dotacion_minima` y `umbrales_cobertura` tipados.
3. Crear `server/services/dashboard.service.ts` importando funciones de fecha y hora de `report.service.ts`.
4. Crear `server/controllers/dashboard.controller.ts` y montar ruta en `server/routes/api/dashboard.routes.ts`.
5. Extender `server/controllers/service.controller.ts` y `server/routes/api/service.routes.ts` para el endpoint `PATCH /api/services/:id/staffing`.
6. Conectar hooks de invalidación de caché en `TurnAssignment`, `Replacement` y `ShiftException`.
7. Agregar helper `emitDashboardInvalidated` en `server/services/socket.service.ts`.

---

## 4. Criterios de Aceptación (Gherkin)

```gherkin
Escenario: Obtención exitosa de KPIs para un servicio con dotación configurada
  DADO un servicio clínico con asignaciones de turnos y reemplazos en el mes 10 del año 2026
  Y el servicio cuenta con dotacion_minima configurada
  CUANDO la supervisora solicita GET /api/dashboard/:serviceId/kpis?month=10&year=2026
  ENTONCES la API responde código HTTP 200 OK
  Y el JSON contiene replacementRate calculado excluyendo jornadas libres 'X'
  Y el objeto coverage indica configured: true con overallPercentage y semáforo status
  Y la clave kpi:service:{serviceId}:2026:10 queda almacenada en Redis con TTL de 24 horas

Escenario: Servicio sin dotación mínima configurada retorna estado no configurado
  DADO un servicio clínico que no tiene registros en dotacion_minima
  CUANDO se consultan los KPIs del servicio
  ENTONCES coverage.configured es false
  Y coverage.overallPercentage es null
  Y el status es 'optimal' por defecto sin alertas de déficit

Escenario: Control de acceso contextual para actualizar dotación mínima
  DADO un usuario autenticado que está asignado como supervisor en el servicio A
  PERO no tiene el rol global SYS_ADMIN
  CUANDO envía una solicitud PATCH a /api/services/servicioA/staffing con nueva dotación
  ENTONCES la API responde código HTTP 200 OK y persiste la configuración
  PERO si intenta enviar PATCH a /api/services/servicioB/staffing de un servicio ajeno
  ENTONCES la API responde código HTTP 403 Forbidden

Escenario: Invalidación reactiva de caché al registrar un reemplazo en el servicio
  DADO que existe una respuesta de KPIs en caché de Redis para el servicio y mes actual
  CUANDO se crea exitosamente un nuevo reemplazo en dicho servicio
  ENTONCES la clave en Redis es eliminada inmediatamente
  Y el backend emite el evento WebSocket "dashboard:invalidated" a la sala del servicio
```
