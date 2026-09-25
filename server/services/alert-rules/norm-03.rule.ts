import { AlertCandidate, AlertRule, RuleContext } from './alert-rule.interface';
import dayjs from 'dayjs';

export const norm03Rule: AlertRule = {
  id: 'NORM-03',
  category: 'normative',
  severity: 'high',
  async evaluate(context: RuleContext): Promise<AlertCandidate[]> {
    const shifts: any[] = (context as any).shifts || [];
    if (shifts.length < 2) return [];

    const parsedShifts = shifts
      .filter((s) => s.entry && s.exit && !['X', '-', ''].includes(s.sigla))
      .map((s) => {
        const [entryH, entryM] = s.entry.split(':').map(Number);
        const [exitH, exitM] = s.exit.split(':').map(Number);

        const startDate = dayjs(s.date).hour(entryH).minute(entryM).second(0);
        let endDate = dayjs(s.date).hour(exitH).minute(exitM).second(0);

        if (endDate.isBefore(startDate) || endDate.isSame(startDate)) {
          endDate = endDate.add(1, 'day');
        }

        const isNight =
          Boolean(s.isNight) ||
          s.sigla === 'N' ||
          (entryH >= 19 && exitH <= 9) ||
          endDate.date() !== startDate.date();

        return {
          ...s,
          startDateTime: startDate,
          endDateTime: endDate,
          isNight,
        };
      })
      .sort((a, b) => a.startDateTime.diff(b.startDateTime));

    const candidates: AlertCandidate[] = [];

    for (let i = 0; i < parsedShifts.length - 1; i++) {
      const current = parsedShifts[i];
      const next = parsedShifts[i + 1];

      if (current.isNight) {
        const restMinutes = next.startDateTime.diff(current.endDateTime, 'minute');

        // Tras salir de noche, debe haber al menos 24 horas (1440 minutos) de descanso antes de reingresar
        if (restMinutes >= 0 && restMinutes < 24 * 60) {
          const restHours = Number((restMinutes / 60).toFixed(1));
          candidates.push({
            ruleId: 'NORM-03',
            severity: 'high',
            category: 'normative',
            serviceId: next.serviceId || context.serviceId,
            staffId: next.staffId || context.staffId,
            date: next.startDateTime.toDate(),
            message: `Descanso post-noche insuficiente de ${restHours}h (< 24h requeridas tras guardia nocturna).`,
            context: {
              previousShiftDate: current.startDateTime.format('YYYY-MM-DD'),
              nextShiftDate: next.startDateTime.format('YYYY-MM-DD'),
              nightShiftExit: current.endDateTime.format('YYYY-MM-DD HH:mm'),
              nextShiftEntry: next.startDateTime.format('YYYY-MM-DD HH:mm'),
              restHours,
              transitionKey: `${current.startDateTime.format('YYYY-MM-DDTHH:mm')}_${next.startDateTime.format('YYYY-MM-DDTHH:mm')}`,
            },
          });
        }
      }
    }

    return candidates;
  },
};
