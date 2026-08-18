---
title: Refactor Frontend Domains (Staff and Account Separation)
depends_on: []
---

## Initial User Prompt

ahora crea un /plan-task de @[../../.gemini/antigravity-ide/brain/075b87b9-cc72-47a8-953c-fa8aec486eec/critique_frontend_domains_phase2.md]

## Description

El sistema actualmente maneja un monolito en el frontend a través de `user.store.ts` y `user.types.ts`, fusionando las identidades operativas (Staff) y de acceso al sistema (Account). Esto rompe la regla de ortogonalidad del negocio, donde la capacidad de hacer turnos (Staff.isActive) debe ser completamente independiente de la capacidad de entrar al sistema (Account.isActive).

El objetivo de este task es destruir el monolito `User` en el frontend, dividiéndolo en `staff.store.ts` y `account.store.ts`, y migrando el campo `status` a `isActive` en el backend para alinear nomenclatura, sin generar un efecto cascada entre los dominios.

### Acceptance Criteria
- [ ] Backend: `Staff.status` es reemplazado por `Staff.isActive` (booleano).
- [ ] Backend: `deleteStaff` aplica soft-delete seteando `isActive = false` en lugar de `status = 'INACTIVO'`.
- [ ] Backend: Modificar la operatividad del Staff JAMÁS altera el estado de la Cuenta (Ortogonalidad Estricta).
- [ ] Frontend: `user.types.ts`, `user.store.ts` y `user.service.ts` están completamente eliminados.
- [ ] Frontend: Se han creado las capas `staff` y `account` (types, services, stores).
- [ ] Frontend: `staff.store` fuerza la invalidación de `account.store` al crear o promover empleados para evitar Race Conditions.
- [ ] UI: `UserSelectionModal.vue` es renombrado a `StaffSelectionModal.vue`.
- [ ] UI: Todas las vistas de UI (`TurnAssignmentModal`, `ReplacementModalCreate`, etc.) leen `IStaff.isActive` en lugar de la variable genérica de acceso a cuenta.

## Architecture Overview

**Capa de Datos (Mutable):**
- Domain: Staff (RRHH & Operaciones)
- Domain: Account (Seguridad & Accesos)
Ambos dominios consumen `isActive` ortogonalmente. 

**Capa de Presentación (Intocable):**
Las vistas y composables mantienen sus nombres de negocio (`EmployeesView.vue`, `useEmployeesState.ts`) pero internamente instancian `useStaffStore()` o `useAccountStore()` dependiendo del caso de uso.

## Implementation Process

### Step 1: Backend Data Model Update
1. Modificar `server/models/staff.model.ts`: Cambiar `status` por `isActive: boolean`.
2. Modificar `server/schemas/staff.schema.ts`: Cambiar Zod validation a `isActive: z.boolean()`.
3. Modificar `server/services/staff.service.ts`: 
   - Cambiar lógica de `deleteStaff` (Soft Delete) para setear `isActive = false`.
   - Asegurar que no existan bloqueos de ortogonalidad.

### Step 2: Frontend Data Layer Destruction and Creation
1. Eliminar `src/types/user.types.ts`, `src/stores/user.store.ts`, `src/services/user.service.ts`.
2. Crear `src/types/staff.types.ts` y `src/types/account.types.ts`.
3. Crear `src/services/staff.service.ts` y `src/services/account.service.ts`.
4. Crear `src/stores/staff.store.ts` y `src/stores/account.store.ts`.

### Step 3: Synchronization Rules (Pinia)
1. En `staff.store.ts`, invocar acciones del `account.store.ts` (ej. `refreshAccounts()`) cuando se ejecuten operaciones de on-boarding o ascensos de rol, para sincronizar la creación automática de cuentas.

### Step 4: UI Refactoring
1. Renombrar `UserSelectionModal.vue` a `StaffSelectionModal.vue`.
2. Refactorizar los imports y métodos en:
   - `ReplacementModalCreate.vue`
   - `TurnAssignmentModal.vue`
   - `EmployeesView.vue`
   - Composables asociados a empleados.
3. Asegurar que los componentes comparen contra `IStaff.isActive` para verificar disponibilidad clínica.

## Parallelization / Dependencies

- **Step 1** (Backend) debe ejecutarse de manera obligatoria ANTES que el resto, ya que cambia la firma del payload JSON (`status` -> `isActive`).
- **Step 2 y Step 3** (Stores y Types) se ejecutan secuencialmente luego del Step 1.
- **Step 4** (UI) puede paralelizarse a través de múltiples agentes si el volumen de Vistas/Modales es alto, siempre y cuando dependan del Step 2 y 3.

## Verifications

- **Type-Check:** Ejecutar `npx tsc --noEmit` en `client/` para asegurar que el refactor no dejó variables huérfanas o tipos `User` antiguos.
- **Flujo Ortogonal:** Intentar asignar un turno a un empleado con `Staff.isActive = false` desde la UI; no debería aparecer.
- **Creación Segura:** Crear un "Funcionario", verificar que no tiene acceso a cuenta. Promover a "Coordinador" y verificar que el `account.store` se sincronizó exitosamente.
