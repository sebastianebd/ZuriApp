---
title: "Fase 2: Portal PWA - Backend: Autenticación OTP por WhatsApp, Sesión Persistente y Seguridad Anti-IDOR"
type: feature
status: done
agents:
  - qa
  - backend
---

# Fase 2: Portal PWA - Backend: Autenticación OTP por WhatsApp, Sesión Persistente y Seguridad Anti-IDOR

## 1. Contexto y Objetivos

Conforme a la Sección 5.1.2 de la especificación técnica maestra ([zuriapp-v2-expansion-spec.md](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/.specs/docs/zuriapp-v2-expansion-spec.md)) y los acuerdos de diseño de la PWA ([resumen-conversacion-pwa-y-reemplazos.md](file:///C:/Users/sebas/workspace/Proyecto_ZuriApp/.specs/context/resumen-conversacion-pwa-y-reemplazos.md)):

- **Onboarding Inicial sin Contraseñas:** El funcionario ingresa mediante su número oficial de WhatsApp. Recibe un código OTP numérico de 6 dígitos con TTL de 10 minutos almacenado en Redis (`pwa:otp:{rut}`).
- **Control de Tasa Anti-Spam (Rate Limiting en Redis):** Para proteger el presupuesto de WhatsApp Cloud API, el endpoint de solicitud de OTP restringe a un máximo de **3 solicitudes cada 10 minutos** por RUT (`pwa:otp:ratelimit:{rut}`). Si se excede, retorna `429 Too Many Requests`.
- **Sesión Persistente de 30 días:** Una vez verificado el OTP, se genera una cookie `HttpOnly`, `SameSite=Lax` con vigencia de 30 días (`zuriapp_pwa_session`), permitiendo acceso diario con 1 solo toque sin ingresar RUT ni contraseñas cada vez que se abre la app.
- **Principio de Aislamiento Estricto de Datos (Anti-IDOR):** Los endpoints `/api/pwa/*` ignoran cualquier parámetro `userId` o `staffId` recibido por query o body. El middleware `portalAuthMiddleware` extrae forzosamente la identidad desde `req.staff._id` a partir del token de la cookie de sesión verificada.
- **Cierre de Sesión:** Invalida y elimina la cookie `zuriapp_pwa_session` en el cliente y backend.

---

## 2. Contrato Técnico Explícito

### 2.1 Tipos TypeScript y DTOs (`server/types/pwa-auth.types.ts`)

```typescript
export interface RequestOtpDTO {
  rut: string; // Formato con o sin puntos y guión (ej: '12.345.678-9' o '12345678-9')
}

export interface VerifyOtpDTO {
  rut: string;
  otp: string; // Exactamente 6 dígitos numéricos
}

export interface PwaStaffProfileDTO {
  id: string;
  rut: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email: string;
  contractType: 'PLANTA' | 'CONTRATA' | 'HONORARIO';
  positionId: string;
  positionName: string;
  estamento: 'MEDICO' | 'PROFESIONAL' | 'TECNICO' | 'ADMINISTRATIVO' | 'AUXILIAR';
}

export interface PwaAuthResponseDTO {
  success: boolean;
  message: string;
  data?: {
    staff: PwaStaffProfileDTO;
  };
}
```

### 2.2 Esquemas de Validación Zod (`server/schemas/pwa-auth.schema.ts`)

```typescript
import { z } from 'zod';

export const requestOtpSchema = z.object({
  body: z.object({
    rut: z.string().min(8).max(12).regex(/^(\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]|\d{7,8}-[\dkK])$/, 'Formato de RUT inválido'),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    rut: z.string().min(8).max(12),
    otp: z.string().length(6, 'El código OTP debe tener exactamente 6 dígitos').regex(/^\d{6}$/, 'El OTP solo puede contener números'),
  }),
});
```

### 2.3 Endpoints y Rutas de API (`server/routes/api/portal.routes.ts`)

| Método | Endpoint | Middleware | Código Éxito | Descripción |
|---|---|---|:---:|---|
| `POST` | `/api/pwa/auth/request-otp` | `validateSchema(requestOtpSchema)` | `200 OK` | Genera OTP en Redis, valida rate limit (máx 3/10min) y despacha WhatsApp. |
| `POST` | `/api/pwa/auth/verify-otp` | `validateSchema(verifyOtpSchema)` | `200 OK` | Valida OTP, emite cookie `zuriapp_pwa_session` (30 días) y retorna perfil. |
| `GET` | `/api/pwa/auth/me` | `portalAuthMiddleware` | `200 OK` | Retorna el perfil del funcionario autenticado desde la cookie de sesión. |
| `POST` | `/api/pwa/auth/logout` | `portalAuthMiddleware` | `200 OK` | Limpia la cookie de sesión `zuriapp_pwa_session`. |

### 2.4 Middleware de Seguridad (`server/middleware/portal-auth.middleware.ts`)

- Lee la cookie `req.cookies.zuriapp_pwa_session`.
- Verifica el JWT con el secreto de sesión PWA (`JWT_PORTAL_SECRET` o fallback a `JWT_SECRET`).
- Busca el funcionario en MongoDB: `StaffModel.findById(decoded.staffId)`. Valida que exista y `isActive === true`.
- Inyecta el funcionario en `req.staff`.
- Si el token no existe, está expirado o el funcionario está inactivo, responde `401 Unauthorized: "Sesión expirada o no autorizada"`.

---

## 3. Responsabilidades por Rol

### QA
- Crear suite de tests de integración para endpoints de autenticación PWA (`server/tests/integration/pwa-auth.controller.test.ts`).
- Mockear `notification.service.sendWhatsApp` y Redis client (`ioredis-mock`).
- Probar escenarios:
  1. Solicitud exitosa de OTP para funcionario activo con envío simulado de WhatsApp.
  2. Funcionario inactivo o inexistente retorna `404 Not Found`.
  3. Rate limit en Redis: cuarta solicitud antes de 10 minutos retorna `429 Too Many Requests`.
  4. Verificación de OTP correcto setea la cookie `HttpOnly` `zuriapp_pwa_session` con `maxAge = 30 días`.
  5. Verificación con OTP incorrecto retorna `400 Bad Request` y no emite cookie.
  6. Endpoint `/api/pwa/auth/me` con cookie válida retorna datos propios; sin cookie retorna `401`.
  7. Logout limpia la cookie.

### Backend
- Implementar tipos en `server/types/pwa-auth.types.ts`.
- Implementar esquemas Zod en `server/schemas/pwa-auth.schema.ts`.
- Crear `server/middleware/portal-auth.middleware.ts`.
- Crear servicio `server/services/pwa-auth.service.ts` con manejo de Redis para OTP y rate limit.
- Extender `server/services/notification.service.ts` con método `sendOTP(phone, otp)`.
- Crear controlador `server/controllers/pwa-auth.controller.ts`.
- Crear rutas en `server/routes/api/portal.routes.ts` y montar `/api/pwa` en `server/app.ts`.

---

## 4. Criterios de Aceptación (Gherkin)

```gherkin
Escenario: Solicitud de código OTP exitosa para funcionario activo
  DADO que existe un funcionario con RUT "12.345.678-9", teléfono "+56911223344" y estado activo
  Y no ha superado el límite de 3 solicitudes en 10 minutos
  CUANDO envía una solicitud POST a "/api/pwa/auth/request-otp" con dicho RUT
  ENTONCES el servidor responde HTTP 200 con mensaje "Código de verificación enviado"
  Y se almacena en Redis la clave "pwa:otp:12345678-9" con un valor numérico de 6 dígitos y TTL de 600 segundos
  Y se incrementa el contador de tasa en Redis "pwa:otp:ratelimit:12345678-9"

Escenario: Bloqueo por exceso de solicitudes de OTP (Rate Limit)
  DADO que un funcionario ya solicitó 3 códigos OTP en los últimos 10 minutos
  CUANDO envía una cuarta solicitud POST a "/api/pwa/auth/request-otp"
  ENTONCES el servidor responde HTTP 429 Too Many Requests
  Y el cuerpo contiene "Has superado el límite de intentos. Por favor espera unos minutos."
  Y no se despacha ningún mensaje adicional por WhatsApp

Escenario: Verificación de OTP correcta y emisión de cookie de 30 días
  DADO que existe una clave en Redis "pwa:otp:12345678-9" con el valor "749201"
  CUANDO envía una solicitud POST a "/api/pwa/auth/verify-otp" con rut "12.345.678-9" y otp "749201"
  ENTONCES el servidor responde HTTP 200 con el perfil del funcionario
  Y se incluye la cabecera Set-Cookie con "zuriapp_pwa_session"
  Y la cookie tiene las propiedades HttpOnly, SameSite=Lax y vigencia de 30 días
  Y la clave "pwa:otp:12345678-9" es eliminada de Redis

Escenario: Intento de spoofing de identidad (Anti-IDOR) en endpoints PWA
  DADO que un usuario autenticado con sesión del funcionario "staff_A"
  CUANDO envía una solicitud GET a "/api/pwa/auth/me?staffId=staff_B"
  ENTONCES el middleware ignora completamente el parámetro "staff_B"
  Y el endpoint retorna estrictamente la identidad del funcionario "staff_A"
```
