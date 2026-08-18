---
title: Cierre Fase 2 - Control de Accesos, RBAC y DDD (Staff vs Account)
depends_on: [refactor-frontend-domains.refactor.md]
---

## Description

Este task aborda la deuda técnica remanente de la Fase 2 y aplica una solución de Domain-Driven Design (DDD) para la segregación de responsabilidades en la creación y administración de personal (Funcionarios vs Accesos a Sistema). 

Se resuelve la vulnerabilidad de escalamiento de privilegios vertical (IDOR) donde un usuario de menor jerarquía podía manipular o suspender cuentas de usuarios con mayor nivel jerárquico. Adicionalmente, implementa "Smart Panels" en el frontend para adaptar dinámicamente la vista según el nivel del rol del usuario logueado.

### Acceptance Criteria
- [ ] Backend: Existe `account.service.ts` y `account.controller.ts` (DDD separación de responsabilidades).
- [ ] Backend: El nuevo endpoint `PATCH /accounts/:staffId/toggle-status` valida el esquema con Zod (`isActive: boolean`).
- [ ] Backend: Operaciones de Account generan logs de auditoría a través de `auditService.logAction()`.
- [ ] Backend (Seguridad): En `onboardStaff`, `updateStaff`, `deleteStaff` y `toggleAccountStatus`, el backend valida que el nivel del rol del JWT (`req.account.role.level`) sea **estrictamente mayor** que el nivel del rol a asignar o manipular.
- [ ] Frontend: `cargo.store.ts` es eliminado completamente, migrando todo a `position.store.ts`.
- [ ] Frontend: Carpeta `users/` es renombrada a `staff/` y el router actualizado a `/personal/staff`.
- [ ] Frontend (UI): `StaffModalCreate` y `StaffModalUpdate` muestran la pestaña "Acceso al Sistema" únicamente si el rol seleccionado tiene `hasSystemAccess: true`.
- [ ] Frontend (UI Seguridad): `StaffTable.vue` oculta botones de Editar/Eliminar para filas correspondientes a usuarios con nivel jerárquico superior o igual al usuario logueado.

## Architecture Overview

**Capa de Backend (DDD & RBAC):**
- Domain `Staff`: Maneja operaciones CRUD del personal operativo. Delega la creación de cuentas a `account.service.ts` pasando la sesión transaccional de Mongoose.
- Domain `Account`: Exclusivo para gestionar el estado del login, tokens de recuperación, e invalidación de sesiones. Protegido por Middlewares de Seguridad.
- **Zero-Trust (IDOR)**: Toda mutación de datos verifica `req.staff.role.level > target.role.level`.

**Capa de Frontend (Smart Panels):**
- La vista centraliza la información en un solo componente unificado (Gestión de Personal), pero el contenido de los modales y el selector de roles se adapta "inteligentemente" leyendo el Nivel de Rol del usuario autenticado.

## Implementation Process

### Step 1: Backend - Extracción del Servicio de Cuentas (DDD)
1. Crear `server/services/account.service.ts`.
2. Migrar la lógica de `Account.create`, `Account.deleteOne` y correos OTL desde `staff.service.ts`.
3. Asegurar que los métodos de `account.service.ts` reciban y usen la `session` de Mongoose para atomicidad.

### Step 2: Backend - Controladores y Auditoría
1. Crear `server/schemas/account.schema.ts` para validar `{ isActive: boolean }`.
2. Crear `server/controllers/account.controller.ts`.
3. Mover `sendResetLink` de `staff` a `account` controller.
4. Crear endpoint `PATCH /accounts/:staffId/toggle-status`.
5. Integrar llamadas a `auditService.logAction` y emitir evento de Socket.io (`account:suspended`) para forzar deslogueo en cliente.
6. Crear y montar `server/routes/account.routes.ts`.

### Step 3: Backend - Refactor Staff Service & Seguridad Anti-IDOR
1. Eliminar importación del modelo `Account` en `staff.service.ts` y reemplazar por el servicio `account.service`.
2. Inyectar protección IDOR en `onboardStaff`, `updateStaff`, `deleteStaff` y `toggleAccountStatus` (comparar `levels`).

### Step 4: Frontend - Clean-Up de Deuda Técnica
1. Eliminar `client/src/stores/cargo.store.ts`.
2. Refactorizar `useEmployeesState.ts` eliminando Axios directo y usando los stores oficiales.
3. Filtrar en `useEmployeesState.ts` los roles disponibles para que el usuario logueado solo vea roles con nivel **menor** al suyo.
4. Renombrar carpeta `client/src/components/users/` a `staff/` y actualizar dependencias.

### Step 5: Frontend - UI y Smart Panels
1. Actualizar `StaffTable.vue`: Agregar badge de acceso a sistema, ocultar botones Editar/Eliminar por nivel jerárquico.
2. Actualizar `StaffModalUpdate.vue` y `StaffModalCreate.vue`:
   - Cambiar campo Estado a boolean.
   - Pestaña "Seguridad y Acceso" condicionada a `hasSystemAccess`.
   - Toggle independiente para suspender `Account.isActive` que pegue al nuevo endpoint de Cuentas.

### Step 6: Pruebas Unitarias (QA)
1. Crear `server/tests/account.service.test.ts`.
2. Refactorizar `server/tests/staff.service.test.ts` con mocks actualizados.

## Parallelization / Dependencies

- **Step 1, 2 y 3** (Backend) deben ejecutarse secuencialmente. 
- **Step 4 y 5** (Frontend) dependen directamente de que el Step 2 y 3 estén terminados para consumir los nuevos endpoints y lógica de niveles.
- **Step 6** (Pruebas) puede correr en paralelo con el Frontend una vez finalizado el Step 3.

## Verifications

- **IDOR Check**: Intentar eliminar a un usuario de nivel superior usando Postman. Debe retornar 403 Forbidden.
- **Visual Check**: Autenticarse como Coordinador. Confirmar que no hay botones de Edición en filas de Administradores.
- **Transaccionalidad**: Crear un Administrador y confirmar que la cuenta se generó correctamente vía `account.service` y el log se grabó en auditoría.
