# Contribuyendo a ZuriApp

Seguimos un flujo de trabajo profesional para asegurar la calidad y estabilidad del código. Por favor sigue estas pautas al contribuir.

## Estrategia de Ramas y Despliegue

Usamos un flujo estructurado para mover el código desde desarrollo hasta producción.

### 1. Desarrollo (Local)

- Crea una nueva rama para tu funcionalidad: `git checkout -b feature/mi-funcionalidad`.
- Ejecuta la apicación localmente con Docker:
  ```bash
  docker-compose up
  ```
- Esto inicia el entorno completo con recarga en caliente (hot-reloading).

### 2. Staging (Pre-Producción)

- **Objetivo**: Verificar cambios en un entorno similar a producción.
- **Acción**: Crea un Pull Request (PR) desde tu rama feature hacia la rama **`stage`**.
- **Despliegue**: Al fusionar (merge) en `stage` se despliega automáticamente al entorno **ZuriApp-Staging** en Railway.
- **Verificación**: Prueba tus cambios en la URL de Staging.

### 3. Producción (En Vivo)

- **Objetivo**: Liberar cambios detallados y verificados a los usuarios.
- **Acción**: Crea un Pull Request desde `stage` hacia **`main`**.
- **Despliegue**: Al fusionar en `main` se despliega automáticamente al entorno **ZuriApp-Production** en Railway.

## Controles de Calidad (CI)

Nuestro pipeline de GitHub Actions se ejecuta automáticamente en cada Pull Request para asegurar:

- Que las dependencias se instalen correctamente.
- Que todas las pruebas automatizadas pasen.

Asegúrate de correr los tests localmente antes de hacer push:

```bash
# Servidor
cd server
npm test

# Cliente
cd client
npm test
```

## Variables de Entorno

- `.env.development`: Pares llave-valor para desarrollo local (ignorado por git).
- `.env.production`: Plantilla/Referencia para variables de producción.
