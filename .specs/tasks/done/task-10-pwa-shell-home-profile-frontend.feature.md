---
title: "Fase 2: Portal PWA - Frontend: App Shell Móvil, Login OTP, Home (Mini-Dashboard) y Perfil"
type: feature
status: done
agents:
  - qa
  - frontend
---

# Fase 2: Portal PWA - Frontend: App Shell Móvil, Login OTP, Home (Mini-Dashboard) y Perfil

## 1. Contexto y Objetivos

Conforme a las Secciones 5.1.2, 5.1.3, 5.1.4 y 5.1.8 de la especificación técnica maestra ([zuriapp-v2-expansion-spec.md](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/.specs/docs/zuriapp-v2-expansion-spec.md)):

- **App Shell Móvil y Ergonomía (1 Pulgar):** Creación del cascarón PWA con barra de navegación inferior (*Bottom Navigation Bar*) fija y adaptativa según el tipo de contrato:
  - **Planta / Contrata (3 pestañas):** `[ 🏠 Inicio ]`, `[ 📅 Mis Turnos ]`, `[ 🔔 Avisos ]`.
  - **Honorarios (4 pestañas):** `[ 🏠 Inicio ]`, `[ 📅 Mis Turnos ]`, `[ 📢 Bolsa ]`, `[ 🔔 Avisos ]`.
- **Flujo de Acceso sin Contraseña (Login OTP):** Pantalla de ingreso móvil mediante RUT con solicitud de código OTP de 6 dígitos enviado por WhatsApp, temporizador de reenvío de 60 segundos y manejo de sesión persistente con cookie de 30 días.
- **Home (Mini-Dashboard Operativo):**
  - Tarjeta destacada "Tu Próximo Turno" con acción de confirmación inmediata (`[ ✅ Confirmar Asistencia ]`) y enlace secundario de emergencia (`[ ⚠️ Declarar Emergencia / Indisponibilidad ]`).
  - *Bottom Sheet* interactivo para declarar indisponibilidad exigiendo motivo obligatorio.
  - Cards de KPIs personales en tiempo real: turnos cumplidos vs restantes, reemplazos efectuados, horas diurnas y nocturnas.
  - Botón de descarga directa: `[ 📄 Descargar Mi Avance del Mes (PDF) ]`.
  - Agenda semanal de los próximos 7 días.
- **Header Drawer (Mi Perfil):** Drawer superior con ficha del funcionario, conmutador de horario silencioso anti-fatiga (22:00 a 07:00), selector de servicios preferidos y botón de cierre de sesión.
- **Instalabilidad PWA:** Configuración de `manifest.webmanifest`, service worker y banner de instalación (*Add to Home Screen*).

---

## 2. Contrato Técnico Explícito

### 2.1 Tipos TypeScript Frontend (`client/src/types/portal.types.ts`)

```typescript
export interface PwaUserProfile {
  id: string;
  rut: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email: string;
  contractType: 'PLANTA' | 'CONTRATA' | 'HONORARIO';
  positionName: string;
  estamento: string;
  notificationPreferences?: {
    shiftReminders: boolean;
    shiftChanges: boolean;
    openCallsEnabled: boolean;
    preferredServices: string[];
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
}

export interface PortalHomeData {
  nextShift: {
    id: string;
    assignmentModel: 'TurnAssignment' | 'Replacement';
    date: string;
    sigla: string;
    entryTime: string;
    exitTime: string;
    serviceName: string;
    serviceLocation?: string;
    confirmationStatus?: 'confirmed' | 'unavailable';
    canConfirm: boolean;
  } | null;
  kpis: {
    shiftsCompleted: number;
    shiftsRemaining: number;
    replacementsCount: number;
    dayHours: number;
    nightHours: number;
    totalHours: number;
  };
  weeklyAgenda: Array<{
    date: string;
    dayName: string;
    sigla: string;
    isWorkDay: boolean;
    isReplacement: boolean;
    shiftName: string;
    serviceName: string;
  }>;
}

export interface UserPreferencesDTO {
  shiftReminders?: boolean;
  shiftChanges?: boolean;
  openCallsEnabled?: boolean;
  preferredServices?: string[];
  quietHours?: {
    enabled: boolean;
    start: string;
    end: string;
  };
}
```

### 2.2 Rutas en Frontend (`client/src/router/index.ts`)

```typescript
// Rutas PWA
{
  path: '/portal',
  component: () => import('@/views/portal/PortalLayout.vue'),
  beforeEnter: portalAuthGuard,
  children: [
    { path: '', redirect: '/portal/home' },
    { path: 'home', name: 'portal-home', component: () => import('@/views/portal/PortalHome.vue') },
    { path: 'shifts', name: 'portal-shifts', component: () => import('@/views/portal/PortalShifts.vue') },
    { path: 'offers', name: 'portal-offers', component: () => import('@/views/portal/PortalOpenOffers.vue'), meta: { requiresHonorario: true } },
    { path: 'notifications', name: 'portal-notifications', component: () => import('@/views/portal/PortalNotifications.vue') },
  ]
},
{
  path: '/portal/login',
  name: 'portal-login',
  component: () => import('@/views/portal/PortalLogin.vue'),
}
```

### 2.3 Store Pinia (`client/src/stores/portal.store.ts`)

- **State:** `user` (perfil autenticado), `homeData`, `isAuthenticated`, `isLoading`.
- **Actions:**
  - `requestOtp(rut)`: invoca `/api/pwa/auth/request-otp`.
  - `verifyOtp(rut, otp)`: invoca `/api/pwa/auth/verify-otp`, almacena el usuario y redirige a `/portal/home`.
  - `fetchMe()`: invoca `/api/pwa/auth/me` para validar la sesión de la cookie.
  - `fetchHome()`: invoca `/api/pwa/home`.
  - `confirmNextShift(id, model, date)`: envía confirmación y actualiza el estado local.
  - `reportUnavailableNextShift(id, model, date, reason)`: envía reporte de indisponibilidad.
  - `downloadAdvancePdf()`: descarga el PDF de avance mensual.
  - `updatePreferences(preferences)`: actualiza preferencias en el backend.
  - `logout()`: limpia la sesión y redirige a `/portal/login`.

---

## 3. Responsabilidades por Rol

### QA
- Crear suite de tests de componentes para la PWA (`client/src/views/portal/__tests__/PortalLogin.test.ts`, `PortalHome.test.ts`, `PortalLayout.test.ts`, `ShiftConfirmSheet.test.ts`, `ProfileDrawer.test.ts`).
- Probar escenarios:
  1. `PortalLogin.vue`: ingreso de RUT inválido muestra error de validación; ingreso válido activa cuenta regresiva de 60 segundos para reenvío de OTP.
  2. `PortalLayout.vue`: funcionarios con `contractType === 'HONORARIO'` visualizan la pestaña `[ 📢 Bolsa ]`; funcionarios con `PLANTA` o `CONTRATA` solo ven 3 pestañas.
  3. `PortalHome.vue`: renderiza tarjeta "Tu Próximo Turno" con botón "Confirmar Asistencia". Al pulsar, llama a la acción de confirmación y actualiza el badge a "Asistencia Confirmada".
  4. Pulsar "Declarar Emergencia / Indisponibilidad" abre el Bottom Sheet (`ShiftConfirmSheet.vue`). Si el usuario intenta enviar sin ingresar al menos 5 caracteres en el motivo, el botón permanece deshabilitado.
  5. Pulsar "Descargar Mi Avance del Mes" invoca la descarga de archivo Blob en navegador sin errores.

### Frontend
- Configurar PWA en `client/vite.config.ts` y crear `client/public/manifest.webmanifest`.
- Implementar tipos en `client/src/types/portal.types.ts`.
- Crear servicio Axios `client/src/services/portal.service.ts` con `{ withCredentials: true }`.
- Implementar guardia `portalAuthGuard` en `client/src/router/index.ts`.
- Crear store Pinia `client/src/stores/portal.store.ts`.
- Desarrollar componentes y vistas:
  - `client/src/views/portal/PortalLayout.vue`: Header con botón de drawer, vista activa y Bottom Bar adaptativa.
  - `client/src/views/portal/PortalLogin.vue`: Formulario táctil adaptado a móvil para ingreso de RUT y OTP.
  - `client/src/views/portal/PortalHome.vue`: Tarjeta de próximo turno, cards de KPIs y lista cronológica de agenda.
  - `client/src/components/portal/ShiftConfirmSheet.vue`: Bottom sheet deslizable táctil con validación de motivo.
  - `client/src/components/portal/ProfileDrawer.vue`: Offcanvas con switches de quiet hours y logout.
  - `client/src/components/portal/PwaInstallBanner.vue`: Banner antes del prompt de instalación A2HS.

---

## 4. Criterios de Aceptación (Gherkin)

```gherkin
Escenario: Navegación inferior adaptativa según tipo de contrato
  DADO que el funcionario autenticado tiene contractType "HONORARIO"
  CUANDO se renderiza "PortalLayout.vue"
  ENTONCES la barra inferior muestra 4 pestañas: "Inicio", "Mis Turnos", "Bolsa" y "Avisos"
  Y si el funcionario tiene contractType "PLANTA", la pestaña "Bolsa" no se renderiza

Escenario: Confirmación de próximo turno desde el Home
  DADO que el funcionario visualiza en su Home un próximo turno no confirmado
  CUANDO hace clic en el botón "Confirmar Asistencia"
  ENTONCES se invoca "portalStore.confirmNextShift"
  Y la tarjeta pasa a mostrar "Asistencia Confirmada" con icono de verificación
  Y se mantiene visible el botón secundario "Declarar Emergencia / Indisponibilidad"

Escenario: Declaración de indisponibilidad con motivo obligatorio
  DADO que el funcionario abre el panel "ShiftConfirmSheet.vue" para reportar un imprevisto
  CUANDO ingresa un motivo con menos de 5 caracteres
  ENTONCES el botón "Enviar Aviso de Indisponibilidad" se mantiene deshabilitado
  Y cuando escribe "Licencia médica de urgencia por fractura" y presiona enviar
  ENTONCES el panel se cierra, el turno pasa a estado "unavailable" y se emite toast de aviso enviado a jefatura
```
