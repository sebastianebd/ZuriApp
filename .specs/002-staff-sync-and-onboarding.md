# Especificación Técnica: Sincronización de Funcionarios y Onboarding PWA (ZuriApp)

## 1. Visión General
Este documento detalla el flujo de ingesta de datos desde los sistemas de RRHH de hospitales (ej. MINSAL/SIRH) hacia la colección `staffs` de ZuriApp, y el posterior flujo de Onboarding (MFA) para el acceso a la PWA del personal operativo.

## 2. Proceso Batch Nocturno (Worker / BullMQ)
### 2.1. Recepción de Datos
- **Frecuencia:** Diaria a las 03:00 AM.
- **Canal de entrada (Prioridad de Ciberseguridad / Privacidad por Diseño):**
  - **Vía Principal (API Webhook):** El hospital hace un `POST` con un payload JSON directo a nuestro endpoint protegido (TLS 1.2+, API Key, IP Whitelisting). ZuriApp recibe en memoria, encola en BullMQ y responde `202 Accepted`. Es la vía más segura al no dejar archivos estáticos de por medio.
  - **Vía Secundaria (SFTP - Fallback):** Si el hospital carece de capacidad para enviar JSON por API, se utiliza la carga de un archivo CSV a un servidor SFTP seguro aprovisionado por ZuriApp.
- **Campos Esperados:** `rut` (obligatorio), `nombres` (obligatorio), `apellidos` (obligatorio), `cargo` (obligatorio), `unidad` (obligatorio), `email` (opcional), `telefono` (opcional).

### 2.2. Procesamiento y Lógica de Negocio
1. **Safeguard (Seguro Anti-Desastres):** El worker debe contar los registros del CSV. Si la cantidad es un 50% menor al total actual de la base de datos, **ABORTAR** el proceso y enviar alerta al administrador. *(Evita que un archivo vacío por error del hospital desactive a todo el personal).*
2. **Saneamiento de Datos:**
   - **RUTs:** Limpiar puntos y estandarizar el formato con guion (ej. `12345678-9`).
   - **Teléfonos:** Limpiar espacios y anteponer `+56` si no lo trae.
3. **Upsert (Lógica de "Dueño del Dato"):**
   - Se procesa utilizando una operación `bulkWrite` masiva para evitar saturación de red.
   - **Campos del Hospital (`$set`):** El CSV es el dueño de la información laboral. Por lo tanto, SIEMPRE se deben sobrescribir: `firstName`, `lastName`, `role`, `unit` y `active`.
   - **Campos de ZuriApp (`$setOnInsert`):** ZuriApp es el dueño de la información de contacto. El CSV SOLO inserta el `phone` y el `email` si el usuario se está creando por primera vez. Si el funcionario ya existía, el Worker debe ignorar estos campos para no sobrescribir correcciones manuales realizadas por las jefaturas.
4. **Baja Lógica Optimizada (Soft-Delete Masivo):**
   - En lugar de consultar registro por registro, el Worker ejecuta una única consulta de actualización usando el operador `$nin` (Not In).
   - Se cambia el estado a `active: false` de todos los `rut` que estén actualmente activos en la BD pero que **NO** vengan incluidos en el CSV de hoy.
   - **Trigger secundario:** Si un `staff` pasa a inactivo, el sistema debe buscar si tiene una cuenta en la colección `accounts` y desactivarla también, revocando inmediatamente su acceso a la Web.

## 3. Modificaciones al Modelo de Datos (`Staff`)
```typescript
{
  rut: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String }, // Cargo (ej. TENS)
  unit: { type: String }, // Unidad (ej. Urgencias)
  email: { type: String, required: false }, // Opcional
  phone: { type: String, required: false }, // Opcional
  active: { type: Boolean, default: true },
  pwaStatus: { type: Boolean, default: false } // Controla el estado del MFA Zero-Trust
}
```

## 4. Flujo de Onboarding PWA (MFA Zero-Trust)

### 4.1. Primera Vez (Onboarding Inicial - `pwaStatus: false`)
1. Funcionario ingresa a la PWA.
2. Ingresa su `RUT` y su `Teléfono`.
3. ZuriApp valida que ambos coincidan en la colección `staffs`.
4. Si coinciden, se envía código OTP de 6 dígitos vía WhatsApp.
5. Funcionario ingresa el código en la PWA.
6. **Verificación de Correo (Barrera Final):**
   - **Camino A (Tiene correo registrado):** El sistema envía un link de activación al correo. Al hacer clic, `pwaStatus` cambia a `true` y se emite un JWT válido por 30 días.
   - **Camino B (No tiene correo o no tiene acceso):** La interfaz avisa que debe contactar a su jefatura. La jefatura (Usuario Web) entra al perfil del TENS y presiona **"Forzar Activación PWA"**, cambiando `pwaStatus` a `true`.

### 4.2. Renovación de Acceso (Token expirado - `pwaStatus: true`)
1. A los 30 días el JWT expira.
2. Funcionario ingresa a la PWA, pone su `RUT`.
3. Solicita código OTP (llega a WhatsApp).
4. Ingresa el código en la PWA.
5. Como `pwaStatus` ya es `true`, el sistema no pide el paso del correo e ingresa directamente, emitiendo un nuevo JWT por 30 días.
