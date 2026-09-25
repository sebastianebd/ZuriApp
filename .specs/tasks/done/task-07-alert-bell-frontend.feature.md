---
title: "Fase 1: Campana de Alertas y Gestión de Infracciones - Frontend (AlertsBell, Modal de Detalle y WebSockets)"
type: feature
status: done
agents:
  - qa
  - frontend
---

# Fase 1: Campana de Alertas y Gestión de Infracciones - Frontend (AlertsBell, Modal de Detalle y WebSockets)

## 1. Contexto y Objetivos

Conforme a la Sección 4.2.8 de la especificación técnica maestra ([.specs/docs/zuriapp-v2-expansion-spec.md](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/.specs/docs/zuriapp-v2-expansion-spec.md)):
- **Visibilidad Ejecutiva Inmediata:** La supervisora o jefatura de turno debe enterarse de cualquier violación legal o déficit de cobertura al instante, sin tener que entrar a revisar reportes pesados.
- **Campana de Alertas (`AlertsBell.vue`):**
  - Ubicada en la barra de navegación superior ([NavBar.vue](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/client/src/components/auth/NavBar.vue)), reemplazando el icono estático actual.
  - Badge numérico con contador de alertas activas (`unreadCount`). Si hay alertas críticas, el badge tiene efecto visual distintivo (`pulse`).
  - Menú desplegable agrupado por severidad:
    - 🔴 **Críticas:** Violaciones de descanso < 12h (`NORM-01`), dobles turnos 24h (`NORM-02`) o indisponibilidad PWA (`OPS-03`).
    - 🟡 **Altas:** Descanso post-noche insuficiente (`NORM-03`).
    - 🔵 **Medias:** Déficit de dotación en los próximos 7 días (`OPS-01`), noches consecutivas (`OPS-02`) o balance semanal > 44h (`NORM-06`).
  - Botón de acción rápida en cada ítem: *"Enterado"* (`acknowledgeAlert`), que marca la alerta como revisada y reduce el badge de no leídas.
- **Modal de Detalle y Resolución (`AlertDetailModal.vue`):**
  - Muestra la explicación detallada de la regla violada, funcionario afectado, fecha, franja horaria y horas de descanso faltantes.
  - Enlace rápido para navegar al cuadrante de turnos o módulo de reemplazos.
  - Formulario de resolución manual: exige un campo de texto con la justificación (`resolutionNote`) y botón *"Marcar como Resuelta"*.
- **Reactividad en Tiempo Real (Socket.io):**
  - El store `alert.store.ts` se conecta a los eventos de WebSocket:
    - `alert:new`: agrega la alerta a la lista y anima la campana.
    - `alert:acknowledged`: actualiza el estado a `acknowledged` sin removerla del listado.
    - `alert:resolved`: remueve la alerta de la lista activa y recalcula contadores en vivo.

---

## 2. Contrato Técnico Explícito

### 2.1 Tipos TypeScript (`client/src/types/alert.types.ts`)

```typescript
export interface AlertDTO {
  id: string;
  ruleId: 'NORM-01' | 'NORM-02' | 'NORM-03' | 'NORM-06' | 'OPS-01' | 'OPS-02' | 'OPS-03';
  severity: 'critical' | 'high' | 'medium';
  category: 'normative' | 'operational';
  serviceId: string;
  staffId?: string;
  staffName?: string;
  rut?: string;
  date?: string;
  shiftSlot?: 'DIA' | 'NOCHE';
  positionName?: string;
  message: string;
  context: Record<string, any>;
  status: 'active' | 'acknowledged' | 'resolved';
  resolutionNote?: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export interface AlertsListResponse {
  success: boolean;
  data: {
    alerts: AlertDTO[];
    unreadCount: number;
    countsBySeverity: {
      critical: number;
      high: number;
      medium: number;
    };
  };
}

export interface ResolveAlertPayload {
  resolutionNote: string;
}
```

### 2.2 Servicio de Cliente (`client/src/services/alert.service.ts`)

```typescript
export const getAlerts = async (
  apiPrivate: any,
  serviceId: string,
  status = 'active'
): Promise<AlertsListResponse> => {
  const { data } = await apiPrivate.get('/alerts', {
    params: { serviceId, status }
  });
  return data;
};

export const acknowledgeAlert = async (
  apiPrivate: any,
  alertId: string
): Promise<{ success: boolean; data: AlertDTO }> => {
  const { data } = await apiPrivate.patch(`/alerts/${alertId}/acknowledge`);
  return data;
};

export const resolveAlert = async (
  apiPrivate: any,
  alertId: string,
  payload: ResolveAlertPayload
): Promise<{ success: boolean; data: AlertDTO }> => {
  const { data } = await apiPrivate.patch(`/alerts/${alertId}/resolve`, payload);
  return data;
};
```

### 2.3 Store Pinia (`client/src/stores/alert.store.ts`)

- **State:**
  - `alerts: AlertDTO[]`
  - `unreadCount: number`
  - `countsBySeverity: { critical: number; high: number; medium: number }`
  - `loading: boolean`
  - `selectedAlert: AlertDTO | null`
  - `showDetailModal: boolean`
- **Acciones:**
  - `fetchAlerts(serviceId: string)`
  - `acknowledgeAlert(alertId: string)`
  - `resolveAlert(alertId: string, note: string)`
  - `initSocketListeners()`: suscripción a `alert:new`, `alert:acknowledged` y `alert:resolved` para mutación reactiva del estado.

---

## 3. Responsabilidades por Rol

### QA (RED)
1. **Pruebas de Componentes Frontend (`client/src/components/layout/AlertsBell.test.ts`):**
   - Verificar que renderice el badge con el conteo correcto de alertas no leídas.
   - Verificar que al hacer clic despliegue el dropdown con las alertas agrupadas por severidad.
   - Verificar que el botón "Enterado" llame a `acknowledgeAlert` y disminuya el contador visual.
   - Verificar que al hacer clic en un ítem de alerta se abra el modal `AlertDetailModal.vue`.
2. **Pruebas de Modal de Resolución (`client/src/components/alerts/AlertDetailModal.test.ts`):**
   - Verificar que muestre el contexto detallado de la alerta.
   - Verificar que el botón "Marcar como Resuelta" esté deshabilitado si el textarea de justificación está vacío.
   - Verificar que al escribir la nota y enviar, se invoque la mutación de resolución y se cierre el modal.
3. **Pruebas del Store (`client/src/stores/alert.store.test.ts`):**
   - Probar que ante evento de Socket `alert:new` se incremente `unreadCount` y se agregue la alerta al array.
   - Probar que ante `alert:resolved` la alerta sea removida de la lista activa.

### Frontend (GREEN & REFACTOR)
1. Crear `client/src/types/alert.types.ts`.
2. Crear `client/src/services/alert.service.ts`.
3. Crear `client/src/stores/alert.store.ts`.
4. Implementar `client/src/components/layout/AlertsBell.vue`.
5. Implementar `client/src/components/alerts/AlertDetailModal.vue`.
6. Integrar `AlertsBell.vue` en `client/src/components/auth/NavBar.vue` sustituyendo el marcador de posición anterior.

---

## 4. Criterios de Aceptación (Gherkin)

```gherkin
Escenario: Recepción en vivo de nueva alerta crítica y animación en la campana
  DADO que la supervisora se encuentra navegando en el sistema web
  Y la campana de alertas muestra 0 notificaciones activas
  CUANDO el backend detecta una infracción NORM-01 y emite el evento "alert:new" por WebSocket
  ENTONCES la campana actualiza inmediatamente su badge a 1
  Y el badge adquiere la clase visual de alerta crítica con animación
  Y la nueva alerta aparece en la parte superior del dropdown desplegable

Escenario: Acuse de recibo de alerta desde el dropdown rápido
  DADO una alerta activa no leída mostrada en el dropdown de la campana
  CUANDO la supervisora hace clic en el botón "Enterado" del ítem
  ENTONCES se envía una solicitud PATCH a /api/alerts/:id/acknowledge
  Y la alerta se marca como leída disminuyendo el contador del badge
  Y la alerta permanece visible pero con estado reconocido

Escenario: Resolución manual de alerta con justificación obligatoria
  DADO que la supervisora abre el AlertDetailModal para una alerta NORM-03
  CUANDO el campo de justificación se encuentra vacío
  ENTONCES el botón "Marcar como Resuelta" permanece deshabilitado
  PERO cuando la supervisora ingresa "Autorizado excepcionalmente por emergencia de servicio" y pulsa confirmar
  ENTONCES se envía PATCH /api/alerts/:id/resolve con la nota ingresada
  Y la alerta desaparece del listado activo en tiempo real
```
