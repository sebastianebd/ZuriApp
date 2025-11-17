// src/utils/date-utils.ts

/**
 * Retorna un array de strings de fecha (YYYY-MM-DD) entre dos fechas (inclusivas).
 */
export const getDatesInRange = (startDate: string, endDate: string): string[] => {
  const dates: string[] = [];
  const currentDate = new Date(startDate);
  const stopDate = new Date(endDate);

  // Asegurar que la fecha de inicio sea correcta al inicio del día (zona horaria)
  currentDate.setUTCHours(0, 0, 0, 0); 
  stopDate.setUTCHours(0, 0, 0, 0);

  // Itera día a día
  while (currentDate <= stopDate) {
    dates.push(currentDate.toISOString().slice(0, 10));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};