<div align="center">
  <h1>🏥 ZuriApp</h1>
  <p><strong>Plataforma integral para la gestión, asignación y auditoría de reemplazos de personal en entornos hospitalarios.</strong></p>

  ![Node.js](https://img.shields.io/badge/Node.js-v22-green?style=for-the-badge&logo=node.js)
  ![Vue.js](https://img.shields.io/badge/Vue.js-3-4FC08D?style=for-the-badge&logo=vuedotjs)
  ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript)
  ![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb)
  ![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=for-the-badge&logo=docker)
</div>

---

## 📖 Acerca del Proyecto

La gestión de reemplazos y turnos en entornos de salud suele ser un desafío logístico propenso a errores, cruces de horarios y falta de trazabilidad. 

**ZuriApp** nace como una solución moderna para optimizar estos flujos operativos. Es una plataforma full-stack que automatiza la asignación de turnos, maneja excepciones de horarios, mantiene informados a los usuarios mediante notificaciones en tiempo real (Socket.io) y correos electrónicos procesados en segundo plano (BullMQ + Redis), y asegura la trazabilidad total mediante un módulo robusto de auditoría.

---

## ✨ Características Principales

- **Gestión Avanzada de Turnos:** Asignación dinámica de reemplazos y manejo de excepciones de turnos integrados con un calendario interactivo (FullCalendar).
- **Notificaciones y Eventos en Tiempo Real:** Actualizaciones instantáneas en los dashboards para todos los clientes conectados usando **Socket.io**.
- **Procesamiento Asíncrono (Colas):** Uso de **BullMQ y Redis** en el backend para gestionar tareas pesadas como el envío de correos electrónicos mediante **Resend** sin bloquear el hilo principal.
- **Reportes Profesionales (PDF & Excel):** Generación de PDFs complejos utilizando **Puppeteer** y jsPDF, además de exportaciones de datos limpios a Excel con exceljs.
- **Auditoría Completa (Logging):** Registro detallado de acciones de los usuarios con visualización de diferencias (diff) para mantener un rastro inmutable de las operaciones sensibles.
- **Gestión de Archivos en la Nube:** Integración con **AWS S3** para el almacenamiento y descarga segura de documentos.
- **Seguridad:** Autenticación basada en JWT, encriptado con bcrypt, middlewares para autorización por roles y protección contra ataques (Rate Limiting, CORS).

---

## 🏗 Arquitectura y Stack Tecnológico

El proyecto está diseñado usando una arquitectura orientada a servicios en el backend, y un patrón composable altamente modular en el frontend.

### Frontend (Cliente)
Construido para ser reactivo, rápido y mantenible.
- **Framework:** Vue 3 (Composition API) con Vite
- **Gestión de Estado:** Pinia
- **Estilos y UI:** Bootstrap 5, SASS
- **Validación de Formularios:** Vee-Validate + Yup
- **Gráficos y Calendarios:** Chart.js, FullCalendar, v-calendar
- **Testing:** Vitest y Playwright (E2E)

### Backend (Servidor)
API RESTful robusta y escalable.
- **Runtime & Framework:** Node.js, Express.js
- **Lenguaje:** TypeScript
- **Base de Datos:** MongoDB (Mongoose) + Redis (Manejo de Colas/Caché)
- **Integraciones:** BullMQ (Background Jobs), AWS S3 SDK, Socket.io, Resend (Emails), Puppeteer (PDFs)
- **Documentación:** Swagger UI
- **Testing:** Vitest + Supertest

---

## 📸 Galería del Proyecto

*(NOTA PARA EL PORTFOLIO: Reemplaza estas imágenes con capturas reales de tu aplicación)*

<div align="center">
  <img src="[URL_DE_TU_IMAGEN_DEL_DASHBOARD]" alt="Dashboard de ZuriApp" width="800">
  <br>
  <em>Vista principal del Dashboard.</em>
</div>
<br>
<div align="center">
  <img src="[URL_DE_TU_IMAGEN_DEL_CALENDARIO]" alt="Vista de Calendario" width="800">
  <br>
  <em>Gestión de turnos y reemplazos mediante FullCalendar.</em>
</div>

---

## 🚀 Instalación y Despliegue Local

### Opción Rápida con Docker (Recomendado)
Levanta la base de datos (MongoDB/Redis), el backend y el frontend con un solo comando:
```bash
docker-compose up
```
> 🌐 La app estará disponible en `http://localhost:5173`

### Opción Manual
Requisitos: Node.js v22+ y acceso a MongoDB/Redis.

**1. Backend:**
```bash
cd server
npm install
npm run seed # Poblar base de datos inicial
npm run dev
```
> El servidor corre en `http://localhost:3500`

**2. Frontend:**
```bash
cd client
npm install
npm run dev
```

---

## 🤝 Contribución y Despliegue CI/CD

El repositorio está configurado con **GitHub Actions** para integración continua y se despliega automáticamente en plataformas cloud.
Para conocer nuestro flujo de trabajo completo, revisiones de código y pautas, consulta:
👉 **[Guía de Contribución (CONTRIBUTING.md)](CONTRIBUTING.md)**

---
<div align="center">
  <em>Desarrollado con ❤️ para transformar la gestión hospitalaria</em>
</div>
