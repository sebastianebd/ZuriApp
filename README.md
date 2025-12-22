# ZuriApp

**ZuriApp** es una plataforma integral para la gestión de reemplazos de personal en entornos hospitalarios, diseñada para optimizar los flujos de trabajo operativos.

![Badge Node](https://img.shields.io/badge/Node.js-v22-green)
![Badge Vue](https://img.shields.io/badge/Vue.js-3-4FC08D)
![Badge Docker](https://img.shields.io/badge/Docker-Ready-blue)

## 🚀 Stack Tecnológico

El proyecto está construido utilizando una arquitectura moderna basada en JavaScript/TypeScript.

### Cliente (Frontend)

- **Framework**: [Vue 3](https://vuejs.org/) (Composition API)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Gestión de Estado**: [Pinia](https://pinia.vuejs.org/)
- **Estilos**: Bootstrap 5 & SASS
- **Validación**: Vee-Validate + Yup
- **Testing**: Vitest & Playwright

### Servidor (Backend)

- **Runtime**: Node.js
- **Framework**: [Express](https://expressjs.com/)
- **Lenguaje**: TypeScript
- **Base de Datos**: MongoDB (usando Mongoose)
- **Documentación API**: Swagger UI
- **Testing**: Vitest

---

## 🛠️ Instalación y Configuración

### Prerrequisitos

Asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) (v22 o superior)
- [Docker Desktop](https://www.docker.com/) (Opcional, pero recomendado)

### 🚀 Opción A: Inicio Rápido con Docker (Recomendado)

Docker Compose levantará automáticamente la base de datos, el backend y el frontend.

```bash
docker-compose up
```

_La aplicación estará disponible en `http://localhost:5173`._

### 💻 Opción B: Instalación Manual

Si prefieres ejecutar los servicios individualmente en tu máquina local:

#### 1. Servidor (Backend)

```bash
cd server
npm install
npm run dev
```

_El servidor correrá en `http://localhost:3500`._

#### 2. Cliente (Frontend)

```bash
cd client
npm install
npm run dev
```

_El cliente correrá en `http://localhost:5173`._

---

## 🌱 Base de Datos (Seed)

El proyecto incluye scripts para poblar la base de datos con un usuario administrador inicial.

**En Desarrollo (Local):**

```bash
cd server
npm run seed
```

**En Producción (Railway/Build):**

```bash
cd server
npm run seed:prod
```

> **Nota:** El script de seed es idempotente; verificará si el usuario admin ya existe antes de crearlo para evitar duplicados o errores.

---

## 🤝 Contribución y Despliegue

Para conocer nuestro flujo de trabajo, estrategia de ramas y proceso de despliegue a **Railway** (Stage/Prod), por favor consulta nuestra guía de contribución:

👉 **[LEER GUÍA DE CONTRIBUTING (CONTRIBUTING.md)](CONTRIBUTING.md)**

---

## 📄 Licencia

Este proyecto está bajo la licencia ISC.
