/**
 * Constantes centralizadas para el módulo de Auditoría.
 *
 * Usar estas constantes en lugar de strings literales ("magic strings")
 * garantiza consistencia entre controladores, servicios y el frontend.
 *
 * Si necesitas agregar un nuevo módulo o acción, hazlo aquí
 * y se reflejará automáticamente en toda la aplicación.
 */

export const AUDIT_ACTIONS = {
  CREAR: "CREAR",
  MODIFICAR: "MODIFICAR",
  ELIMINAR: "ELIMINAR",
  FINALIZAR: "FINALIZAR",
  ANULAR: "ANULAR",
  SUSTITUCION: "SUSTITUCION",
} as const;

export const AUDIT_MODULES = {
  FUNCIONARIOS: "Funcionarios",
  REEMPLAZOS_ACTIVOS: "Reemplazos Activos",
  TURNOS_ACTUALES: "Turnos Actuales",
  EXCEPCIONES_TURNO: "Excepciones de Turno",
  SERVICIOS: "Servicios",
  TIPOS_TURNO: "Tipos de Turno",
  ROLES: "Roles y Cargos",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
export type AuditModule = (typeof AUDIT_MODULES)[keyof typeof AUDIT_MODULES];
