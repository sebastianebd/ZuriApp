# Guía de Pruebas Automatizadas (ZuriApp)

Este proyecto cuenta con una suite completa de pruebas automatizadas utilizando **Vitest** (unitarios) y **Playwright** (E2E).

## 1. Backend (Server)

### Ubicación

Las pruebas se encuentran en `server/tests/`.

- `tests/unit/`: Pruebas de lógica pura (ej. `audit.service`).
- `tests/integration/`: Pruebas de API completa con BD en memoria (ej. `user.controller`).

### Ejecución

```bash
cd server
npm test
```

Esto ejecutará todas las pruebas y mostrará la cobertura.

### Crear nueva prueba

Crea un archivo `.test.ts` en la carpeta correspondiente. Vitest lo detectará automáticamente.

```typescript
describe("Mi Funcionalidad", () => {
  it("debería hacer algo correcto", () => {
    expect(1 + 1).toBe(2);
  });
});
```

---

## 2. Frontend (Client)

### 2.1 Tests Unitarios (Vitest)

#### Ubicación

Las pruebas están junto al código fuente:

- `src/utils/*.test.ts`: Pruebas unitarias de utilidades.
- `src/components/**/*.test.ts`: Pruebas de componentes.
- `src/composables/**/*.test.ts`: Pruebas de composables.

#### Ejecución

```bash
cd client
npm test
```

#### Notas Importantes

- Usamos `shallow: true` en las pruebas de componentes para evitar renderizar hijos complejos como `v-calendar` o `v-select`.
- Para simular acciones de usuario: `await wrapper.find('button').trigger('click')`.

### 2.2 Tests E2E (Playwright)

#### Ubicación

Los tests E2E se encuentran en `client/tests/e2e/`:

- `login.spec.ts`: Flujo de autenticación (login exitoso y fallido).
- `users.spec.ts`: Gestión de usuarios (creación, validación).
- `profile.spec.ts`: Visualización de perfil de usuario.

#### Ejecución

**Requisitos previos:**

- El servidor backend debe estar corriendo (`npm run dev` en `/server`)
- El cliente frontend debe estar corriendo (`npm run dev` en `/client`)

```bash
cd client
npm run test:e2e
```

**Modo UI (interactivo):**

```bash
npx playwright test --ui
```

**Ver reporte HTML:**

```bash
npx playwright show-report
```

#### Configuración

Los tests E2E utilizan:

- **Setup global** (`tests/e2e/global-setup.ts`): Crea una sesión autenticada reutilizable.
- **Storage state** (`playwright/.auth/user.json`): Almacena cookies de sesión para evitar login repetido.

---

## 3. Comandos Útiles

### Tests Unitarios (Vitest)

- **Correr una sola vez (sin modo escucha):**
  ```bash
  npm test -- --run
  ```
- **Ver cobertura de código:**
  ```bash
  npm test -- --coverage
  ```

### Tests E2E (Playwright)

- **Correr un archivo específico:**
  ```bash
  npx playwright test users.spec.ts
  ```
- **Modo headed (ver navegador):**
  ```bash
  npx playwright test --headed
  ```
- **Debug mode:**
  ```bash
  npx playwright test --debug
  ```

---

## 4. Integración Continua (CI)

Los tests se ejecutan automáticamente en GitHub Actions en cada PR:

1. **test-server**: Tests unitarios del backend
2. **test-client**: Tests unitarios del frontend
3. **e2e-tests**: Tests E2E completos con MongoDB, backend y frontend

Ver configuración en `.github/workflows/ci.yml`.

---

## 5. Cobertura de Tests

Para ver un reporte completo de cobertura:

```bash
# Backend
cd server && npm test -- --coverage

# Frontend (unitarios)
cd client && npm test -- --coverage
```

**Nota:** Los tests E2E no se incluyen en el reporte de cobertura de Vitest, pero validan flujos completos de usuario.
