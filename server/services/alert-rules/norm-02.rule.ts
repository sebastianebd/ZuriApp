import { AlertCandidate, AlertRule, RuleContext } from './alert-rule.interface';
import dayjs from 'dayjs';

export const norm02Rule: AlertRule = {
  id: 'NORM-02',
  category: 'normative',
  severity: 'critical',
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

      // Doble turno continuo: el siguiente inicia exactamente o casi inmediatamente al terminar el actual (<= 30 min)
      const gapMinutes = next.startDateTime.diff(current.endDateTime, 'minute');
      const totalContinuousMinutes = next.endDateTime.diff(current.startDateTime, 'minute');

      if (gapMinutes <= 30 && totalContinuousMinutes >= 20 * 60) {
        candidates.push({
          ruleId: 'NORM-02',
          severity: 'critical',
          category: 'normative',
          serviceId: current.serviceId || context.serviceId,
          staffId: current.staffId || context.staffId,
          date: current.startDateTime.toDate(),
          message: `Doble turno prohibido detectado (24h de jornada continua sin descanso intermedio).`,
          context: {
            firstShiftDate: current.startDateTime.format('YYYY-MM-DD'),
            secondShiftDate: next.startDateTime.format('YYYY-MM-DD'),
            firstShiftSigla: current.sigla,
            secondShiftSigla: next.sigla,
            firstShiftEntry: current.entry,
            secondShiftExit: next.exit,
            totalContinuousHours: Number((totalContinuousMinutes / 60).toFixed(1)),
            transitionKey: `${current.startDateTime.format('YYYY-MM-DDTHH:mm')}_${next.startDateTime.format('YYYY-MM-DDTHH:mm')}`,
          },
        });
      }
    }

    return candidates;
  },
};
