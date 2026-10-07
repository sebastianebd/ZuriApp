# Requerimiento Técnico de Integración (ZuriApp - RRHH)

**Para:** Departamento de Informática / Unidad de TIC
**Asunto:** Especificaciones Técnicas para Sincronización Batch de Funcionarios (ZuriApp)

Estimado equipo de Informática,

Para el correcto funcionamiento de la plataforma de gestión operativa ZuriApp, requerimos habilitar una sincronización unidireccional (de lectura) desde su sistema de Recursos Humanos (SIRH o base local) hacia nuestra plataforma.

Con el fin de alinearnos con los más altos estándares de Privacidad por Diseño (Ley 21.719 / GDPR) y evitar la retención insegura de archivos físicos intermedios, **solicitamos la implementación de un envío de datos directo en memoria mediante una petición HTTP POST.**

A continuación, el detalle técnico del requerimiento:

## 1. Método y Frecuencia de Transmisión
- **Periodicidad:** Diaria (1 vez al día, lunes a domingo).
- **Horario sugerido:** 03:00 AM.
- **Canales de Transmisión Aprobados:**
  - **Opción A (Oficial y Preferida - Endpoint API):** Envío masivo mediante una petición `POST` (HTTPS/TLS 1.2+) a nuestro endpoint protegido. Autenticación mediante `x-api-key` y restricción mediante Whitelisting de su IP pública (Payload en formato `JSON`).
  - **Opción B (Fallback / Alternativa - SFTP):** Solo en caso de existir limitaciones técnicas de desarrollo interno para utilizar la API, ZuriApp proveerá credenciales para un servidor SFTP seguro donde podrán depositar un archivo plano (`CSV`) cada madrugada.

## 2. Filtro y Estructura de los Datos
- **Filtro Excluyente:** El envío debe contener única y exclusivamente la lista de funcionarios **activos**. (Cualquier funcionario que se omita en el envío del día, será dado de baja lógicamente en ZuriApp de forma automática).
- **Formato:** Arreglo JSON (Opción A) o CSV en formato UTF-8 (Opción B).

## 3. Diccionario de Datos (Campos)

| Campo | Tipo | Requerido | Descripción / Formato | Ejemplo |
| :--- | :--- | :---: | :--- | :--- |
| `rut` | String | **SÍ** | RUT con dígito verificador, con guion y sin puntos. | `12345678-9` |
| `nombres` | String | **SÍ** | Nombres del funcionario. | `Juan Antonio` |
| `apellidos` | String | **SÍ** | Apellido paterno y materno. | `Pérez González` |
| `cargo` | String | **SÍ** | Cargo, estamento o profesión. | `TENS` |
| `unidad` | String | **SÍ** | Servicio o Unidad Clínica a la que pertenece. | `Urgencias` |
| `email` | String | NO | Correo institucional o personal (omitir si no existe). | `jperez@hospital.cl` |
| `telefono` | String | NO | Teléfono celular (omitir si no existe). | `912345678` |

Quedamos a su entera disposición para agendar una breve reunión técnica de 15 minutos para definir la opción de transmisión final y facilitarles la API Key y URL oficial de integración.

Saludos cordiales,
**[Tu Nombre/Equipo ZuriApp]**
