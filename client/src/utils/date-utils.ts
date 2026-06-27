
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

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

export function formatDate(iso: string | Date | null | undefined): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export function formatTime(iso: string | Date | null | undefined): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

export function formatDateLong(dateString: string | Date | null | undefined) {
  if (!dateString) return 'N/A'
  const date = dateString instanceof Date ? dateString : new Date(dateString)
  return date.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatRelativeTime(dateString: string) {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: es })
}