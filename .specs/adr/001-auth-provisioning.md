# ADR 001: Estrategia de Onboarding de Usuarios y Autenticación (CSV vs Active Directory)

## Contexto
El sistema necesita escalar la creación de usuarios para implementaciones hospitalarias (50-150+ usuarios por servicio). No se sabe de antemano si el hospital requerirá una carga manual (porque es un piloto aislado) o integración con sus sistemas corporativos de TI. Se requiere un diseño que soporte ambas modalidades (bilateral) sin requerir refactorizar la base de datos drásticamente en el futuro.

## Decisión Arquitectónica
Adoptar un modelo de **Identidad Federada** (Federated Identity) combinado con aprovisionamiento "Just-In-Time" (JIT) para SSO, y un módulo de importación por lotes (CSV) para entornos locales.

### 1. Modificaciones al Modelo de Datos (MongoDB)
El esquema de `User` (Mongoose) debe abstraer el origen del usuario. La contraseña deja de ser obligatoria para todos.
- `authProvider`: `String`, enum `['local', 'sso_azure', 'sso_google', 'ldap']`. Default: `'local'`.
- `providerId`: `String` (ID único del usuario en el sistema externo del hospital, si aplica).
- `password`: `String` (Opcional, solo requerido si `authProvider` es `'local'`).

### 2. Vía 1: Pilotos y Carga Manual (CSV)
- Los administradores de ZuriApp cargan funcionarios mediante un archivo CSV en el frontend.
- Los usuarios se insertan en MongoDB con `authProvider: 'local'`.
- Se dispara un evento/cola para enviarles un email con un token para que definan su contraseña en ZuriApp.
- Inician sesión con Email y Contraseña tradicionales.

### 3. Vía 2: Hospitales Enterprise (Active Directory / SSO)
- **No se suben CSVs.**
- Se utiliza Single Sign-On (SSO) mediante protocolos estándar de la industria como **SAML 2.0** u **OAuth2 / OpenID Connect** (comúnmente implementado con `Passport.js` en Node).
- **Just-In-Time (JIT) Provisioning**: Cuando un médico inicia sesión por primera vez haciendo clic en "Ingresar con credenciales del Hospital", es redirigido al portal del hospital. Al autenticarse con éxito, el hospital devuelve a ZuriApp un perfil (Nombre, Email, Cargo). En ese instante de milisegundos, ZuriApp revisa si el usuario existe en MongoDB; si no existe, **lo crea al vuelo** sin necesidad de carga previa.

## Consecuencias (Trade-offs)
- **Positivo:** Diseño preparado para el futuro. Permite arrancar rápido con pilotos (CSV) y cumplir de inmediato con los requisitos de seguridad (SSO) al negociar con hospitales grandes.
- **Negativo:** Agrega ligera complejidad al modelo de base de datos (manejo de contraseñas opcionales) y requiere adaptar la pantalla de Login en el Frontend.
