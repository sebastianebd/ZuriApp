---
title: Implement bank paradigm for open month reports
---

## Initial User Prompt

Al entrar al modulo selecciono un mes antiguo .. es decir si estamos en julio 2026.. al seleccionar cualquier mes de junio del 2026 hacia atras debería ocurrir lo siguiente (eso considerando que el job cerro el mes correctamente)

En Cartola por Servicio:
-Si encuentra data debería poder dejar descargar el excel y el pdf...
-Si no encuentra data debería decir ese warning "AMARILLO, NO DE OTRO COLOR" tal cual como lo tengo actualmente: "No se encontraron registros para este servicio"

En Consulta Individual:
Si encuentra data debería poder generarse el pdf con el diseño que ya tengo integrado...
y si no existe data del funcionario se despliega el mismo warning diciendo: "No se encuentan registros para este usuario en el periodo seleccionado"

revisar reportes en el mes en curso:
En el apartado de cartola por servicio: el boton muta a Descargar Avance lo cual esta bien.. y es solo el excel
Al darle al boton de descargar debería primero evaluar si existe información... si no existiera: "No existen registros para este servicio"
Si existieran se debe descargar el excel con la info que hay hasta ese momento

En el apartado de consulta individual:
Mismo caso el boton muta a "Ver Avance", si le doy click y no encuentra data: "No existen registros para este servicio" (usuario)
si encuentra data debería poder generar un pdf con el diseño que ya tengo rellenando con la data que existe hasta el momento.. (actualmente si hago esto aparece un warning que indica "El mes seleccionado se encuentra en curso. Solo se pueden emitir reportes de meses cerrados", era la forma legacy de antes)

## Description

Implementar el "Paradigma Bancario" en el módulo de reportes, permitiendo la consulta y exportación de reportes tanto en meses cerrados (oficiales) como en meses abiertos (avances), asegurando validaciones estrictas de datos vacíos.

## General Constraints

- **Cero cálculos en el Frontend**: Se debe verificar estrictamente que TODOS los cálculos (estadísticas, sumatorias de horas diurnas/nocturnas, totales, etc.) se sigan realizando 100% en el backend. El frontend (`ReportsView.vue` y relacionados) debe limitarse únicamente a recibir el JSON y renderizar la data gráfica, sin procesar ni manipular los montos.
- **Estandarización de Alertas Amarillas (No Data)**: Se debe actualizar el backend para que devuelva un 404 estricto usando EXACTAMENTE esta estructura de texto cuando no se encuentre información, de modo que el frontend lo despliegue tal cual:
  - Para Cartola por Servicio: `"No se encontraron registros para este servicio en el periodo seleccionado."`
  - Para Consulta Individual: `"No se encontraron registros para este usuario en el periodo seleccionado."`

## Implementation Process

### Step 1: Add empty data validation to Service Excel Export [Single Judge]
#### Expected Output
- En `server/services/report.service.ts` (función `generateServiceExcelReport`), lanzar un error 404 con el mensaje `"No se encontraron registros para este servicio en el periodo seleccionado."` si no hay usuarios asignados (`assignments.length === 0`). Esto evitará que se generen Excels vacíos tanto en meses cerrados como en avances de meses abiertos.

#### Verification
- Nivel: Single Judge
- Artefactos:
  - `server/services/report.service.ts`

### Step 2: Remove legacy validation in Individual Reports [Single Judge]
#### Expected Output
- En `client/src/views/reports/ReportsView.vue`, eliminar la validación "legacy" que bloquea la consulta de reportes individuales cuando `!periodStore.isClosed`.
- Esto debe permitir que la función `onSearch` y el botón "Ver Avance" funcionen correctamente en meses abiertos, calculando la data on-the-fly de la misma forma que el Excel de servicios.
- Asegurar que si el backend devuelve un 404 al consultar el avance individual, se muestre el warning amarillo: `"No se encontraron registros para este usuario en el periodo seleccionado"`.

#### Verification
- Nivel: Single Judge
- Artefactos:
  - `client/src/views/reports/ReportsView.vue`

### Step 3: Update Titles for "Avances" [None]
#### Expected Output
- En `client/src/composables/reports/useReports.ts` o donde se gestione el título del reporte web/PDF impreso, añadir lógica para que si el mes está abierto, el título indique claramente que es un avance (Ej: `"Avance de Movimientos - En Curso"`), diferenciándolo del reporte oficial cerrado.

#### Verification
- Nivel: None
- Artefactos:
  - `client/src/composables/reports/useReports.ts`

