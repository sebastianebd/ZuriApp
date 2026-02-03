# Guía de Pruebas Automatizadas (ZuriApp)

Este proyecto cuenta con una suite completa de pruebas automatizadas utilizando **Vitest** (unitarios e integración) y **Playwright** (E2E).

## 1. Backend (Server)

### Ubicación

Las pruebas se encuentran en `server/tests/`:

- **`tests/unit/`**: Pruebas unitarias de servicios y utilidades (67+ tests)
  - `auth.service.test.ts` - 19 tests de autenticación
  - `user.service.test.ts` - 20 tests de gestión de usuarios
  - `replacement.service.test.ts` - 16 tests de reemplazos
  - `audit.service.test.ts` - 20 tests de auditoría
  - `notification.service.test.ts` - 2 tests de notificaciones
  - `calendar.controller.test.ts` - 2 tests de generación ICS

- **`tests/integration/`**: Pruebas de API completa con mocks (35 tests)
  - `auth.controller.test.ts` - 9 tests de endpoints de autenticación
  - `user.controller.test.ts` - 2 tests de creación de usuarios (con MongoDB real)
  - `replacement.controller.test.ts` - 8 tests de endpoints de reemplazos
  - `turn-assignment.controller.test.ts` - 11 tests de asignación de turnos
  - `audit.controller.test.ts` - 5 tests de auditoría

**Total:** 100+ tests pasando ✅

### Ejecución

```bash
cd server
npm test
```

Esto ejecutará todas las pruebas y mostrará la cobertura.

**Ejecutar solo tests unitarios:**

```bash
npm test -- tests/unit
```

**Ejecutar solo tests de integración:**

```bash
npm test -- tests/integration
```

**Ejecutar un archivo específico:**

```bash
npm test -- tests/unit/auth.service.test.ts
```

### Crear nueva prueba

Crea un archivo `.test.ts` en la carpeta correspondiente. Vitest lo detectará automáticamente.

**Ejemplo de test unitario:**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import miServicio from "../../services/mi-servicio";

// Mock de dependencias
vi.mock("../../models/mi-modelo");

describe("Mi Servicio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debería hacer algo correcto", async () => {
    const resultado = await miServicio.miFuncion();
    expect(resultado).toBeDefined();
  });
});
```

**Ejemplo de test de integración:**

```typescript
import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import app from "../../app";

// Mock de middleware de autenticación
vi.mock("../../middleware/authentication.middleware", () => ({
  default: (req: any, res: any, next: any) => {
    req.user = { _id: "test_id", nombre: "TEST" };
    next();
  },
}));

describe("Mi Controlador - Integration", () => {
  it("GET /api/mi-endpoint debería retornar 200", async () => {
    const response = await request(app).get("/api/mi-endpoint");
    expect(response.status).toBe(200);
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

Los tests se ejecutan automáticamente en GitHub Actions en cada push y PR:

1. **test-server**:
   - Tests unitarios del backend (67+ tests)
   - Tests de integración del backend (35 tests)
   - Cobertura: 70-96% en servicios críticos
2. **test-client**:
   - Tests unitarios del frontend (Vitest)
   - Tests de componentes Vue
3. **e2e-tests**:
   - Tests E2E completos con Playwright
   - Incluye MongoDB, Redis, backend y frontend
   - Flujos completos de usuario

**Total en CI:** 100+ tests ejecutándose en cada PR ✅

Ver configuración en `.github/workflows/ci.yml`.

### Estado de los Tests

Puedes ver el estado de los tests en:

- Badge en el README (si está configurado)
- Pestaña "Actions" en GitHub
- Checks en cada Pull Request

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

---

## 6. Recursos Adicionales

### Documentación Detallada

Para un inventario completo de todos los tests con descripciones detalladas, consulta el archivo de inventario en la carpeta `brain/` del proyecto.

### Estructura de Tests

```
server/tests/
├── integration/          # Tests de API completa (35 tests)
│   ├── auth.controller.test.ts
│   ├── user.controller.test.ts
│   ├── replacement.controller.test.ts
│   ├── turn-assignment.controller.test.ts
│   └── audit.controller.test.ts
└── unit/                 # Tests unitarios (67+ tests)
    ├── auth.service.test.ts
    ├── user.service.test.ts
    ├── replacement.service.test.ts
    ├── audit.service.test.ts
    ├── notification.service.test.ts
    └── calendar.controller.test.ts

client/tests/
├── e2e/                  # Tests E2E con Playwright
│   ├── login.spec.ts
│   ├── users.spec.ts
│   └── profile.spec.ts
└── (tests unitarios junto al código fuente)
```

### Mejores Prácticas

1. **Siempre ejecuta los tests antes de hacer commit**

   ```bash
   npm test
   ```

2. **Verifica la cobertura de tus cambios**

   ```bash
   npm test -- --coverage
   ```

3. **Los tests deben pasar en CI antes de mergear**
   - Revisa los checks en tu PR
   - Corrige cualquier test que falle

4. **Escribe tests para nuevas funcionalidades**
   - Tests unitarios para lógica de negocio
   - Tests de integración para endpoints
   - Tests E2E para flujos de usuario críticos
