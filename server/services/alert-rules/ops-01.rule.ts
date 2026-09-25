import { AlertCandidate, AlertRule, RuleContext } from './alert-rule.interface';
import dayjs from 'dayjs';

export const ops01Rule: AlertRule = {
  id: 'OPS-01',
  category: 'operational',
  severity: 'medium',
  async evaluate(context: RuleContext): Promise<AlertCandidate[]> {
    const dotacion = context.dotacionMinima || [];
    if (dotacion.length === 0) return [];

    const dailyPresent: any[] = (context as any).dailyPresent || [];
    const candidates: AlertCandidate[] = [];

    const toDateString = (d: any) => {
      if (!d) return '';
      if (typeof d === 'string') return d.split('T')[0];
      return dayjs(d).toISOString().split('T')[0];
    };

    // Mapear presentes por clave: `${date}_${slot}_${positionId}` -> count
    const presentMap = new Map<string, number>();
    dailyPresent.forEach((item) => {
      const dateStr = toDateString(item.date);
      const key = `${dateStr}_${item.slot}_${item.positionId}`;
      presentMap.set(key, item.count);
    });

    const startStr = toDateString(context.dateRange.start);
    const endStr = toDateString(context.dateRange.end);
    const startDate = dayjs(startStr);
    const endDate = dayjs(endStr);
    const daysDiff = endDate.diff(startDate, 'day');

    for (let d = 0; d <= daysDiff; d++) {
      const currentDate = startDate.add(d, 'day');
      const dateStr = currentDate.format('YYYY-MM-DD');

      for (const item of dotacion) {
        const posId = (item.positionId?._id || item.positionId || '').toString();
        const posName = item.positionId?.name || item.positionName || 'Cargo';

        // Evaluar turno DIA
        if (item.minimo_dia > 0) {
          const keyDia = `${dateStr}_DIA_${posId}`;
          const actualDia = presentMap.get(keyDia) || 0;

          if (actualDia < item.minimo_dia) {
            const deficit = item.minimo_dia - actualDia;
            candidates.push({
              ruleId: 'OPS-01',
              severity: 'medium',
              category: 'operational',
              serviceId: context.serviceId,
              date: currentDate.startOf('day').toDate(),
              shiftSlot: 'DIA',
              positionId: posId,
              message: `Déficit de dotación diurna en ${posName}: ${actualDia} presente(s) vs ${item.minimo_dia} requerido(s) (${deficit} vacante(s)).`,
              context: {
                required: item.minimo_dia,
                actual: actualDia,
                deficit,
                positionName: posName,
                slot: 'DIA',
              },
            });
          }
        }

        // Evaluar turno NOCHE
        if (item.minimo_noche > 0) {
          const keyNoche = `${dateStr}_NOCHE_${posId}`;
          const actualNoche = presentMap.get(keyNoche) || 0;

          if (actualNoche < item.minimo_noche) {
            const deficit = item.minimo_noche - actualNoche;
            candidates.push({
              ruleId: 'OPS-01',
              severity: 'medium',
              category: 'operational',
              serviceId: context.serviceId,
              date: currentDate.startOf('day').toDate(),
              shiftSlot: 'NOCHE',
              positionId: posId,
              message: `Déficit de dotación nocturna en ${posName}: ${actualNoche} presente(s) vs ${item.minimo_noche} requerido(s) (${deficit} vacante(s)).`,
              context: {
                required: item.minimo_noche,
                actual: actualNoche,
                deficit,
                positionName: posName,
                slot: 'NOCHE',
              },
            });
          }
        }
      }
    }

    return candidates;
  },
};
