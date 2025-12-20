# Guía de Pruebas Automatizadas (ZuriApp)

Este proyecto cuenta con una suite de pruebas automatizadas utilizando **Vitest** tanto para el Backend como para el Frontend.

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

Crea un archivo `.test.js` en la carpeta correspondiente. Vitest lo detectará automáticamente.

```javascript
describe("Mi Funcionalidad", () => {
  it("debería hacer algo correcto", () => {
    expect(1 + 1).toBe(2);
  });
});
```

---

## 2. Frontend (Client)

### Ubicación

Las pruebas están junto al código fuente o en `src/utils/`.

- `src/utils/*.test.ts`: Pruebas unitarias de utilidades.
- `src/components/**/*.test.ts`: Pruebas de integración de componentes.

### Ejecución

```bash
cd client
npm test
```

### Notas Importantes

- Usamos `shallow: true` en las pruebas de componentes para evitar renderizar hijos complejos como `v-calendar` o `v-select` que requieren mucha configuración.
- Para simular acciones de usuario: `await wrapper.find('button').trigger('click')`.

---

## 3. Comandos Útiles

- **Correr una sola vez (sin modo escucha):**
  `npm test -- --run`
- **Ver cobertura de código:**
  `npm test -- --coverage` (Requiere `@vitest/coverage-v8`, ya instalado)
