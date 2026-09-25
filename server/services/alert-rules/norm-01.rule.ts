import { AlertCandidate, AlertRule, RuleContext } from './alert-rule.interface';
import dayjs from 'dayjs';

export const norm01Rule: AlertRule = {
  id: 'NORM-01',
  category: 'normative',
  severity: 'critical',
  async evaluate(context: RuleContext): Promise<AlertCandidate[]> {
    const shifts: any[] = (context as any).shifts || [];
    if (shifts.length < 2) return [];

    // Parsear fecha y hora para ordenar cronológicamente
    const parsedShifts = shifts
      .filter((s) => s.entry && s.exit && !['X', '-', ''].includes(s.sigla))
      .map((s) => {
        const [entryH, entryM] = s.entry.split(':').map(Number);
        const [exitH, exitM] = s.exit.split(':').map(Number);

        const startDate = dayjs(s.date).hour(entryH).minute(entryM).second(0);
        let endDate = dayjs(s.date).hour(exitH).minute(exitM).second(0);

        // Si la hora de salida es menor o igual a la de entrada, cruza la medianoche (ej: 20:00 a 08:00)
        if (endDate.isBefore(startDate) || endDate.isSame(startDate)) {
          endDate = endDate.add(1, 'day');
        }

        return {
          ...s,
          startDateTime: startDate,
          endDateTime: endDate,
        };
      })
      .sort((a, b) => a.startDateTime.diff(b.startDateTime));

    const candidates: AlertCandidate[] = [];

    for (let i = 0; i < parsedShifts.length - 1; i++) {
      const current = parsedShifts[i];
      const next = parsedShifts[i + 1];

      // Descanso entre fin del actual e inicio del siguiente
      const restMinutes = next.startDateTime.diff(current.endDateTime, 'minute');

      // Si el descanso es positivo pero menor a 12 horas (720 minutos)
      if (restMinutes >= 0 && restMinutes < 12 * 60) {
        const restHours = Number((restMinutes / 60).toFixed(1));
        candidates.push({
          ruleId: 'NORM-01',
          severity: 'critical',
          category: 'normative',
          serviceId: next.serviceId || context.serviceId,
          staffId: next.staffId || context.staffId,
          date: next.startDateTime.toDate(),
          message: `Descanso insuficiente de ${restHours}h entre turnos consecutivos (< 12h requeridas por ley).`,
          context: {
            restHours,
            previousShiftDate: current.startDateTime.format('YYYY-MM-DD'),
            previousExit: current.exit,
            nextShiftDate: next.startDateTime.format('YYYY-MM-DD'),
            nextEntry: next.entry,
            transitionKey: `${current.startDateTime.format('YYYY-MM-DDTHH:mm')}_${next.startDateTime.format('YYYY-MM-DDTHH:mm')}`,
          },
        });
      }
    }

    return candidates;
  },
};
