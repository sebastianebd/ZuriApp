import { AlertCandidate, AlertRule, RuleContext } from './alert-rule.interface';
import dayjs from 'dayjs';

export const ops02Rule: AlertRule = {
  id: 'OPS-02',
  category: 'operational',
  severity: 'medium',
  async evaluate(context: RuleContext): Promise<AlertCandidate[]> {
    const shifts: any[] = (context as any).shifts || [];
    if (shifts.length < 3) return [];

    const nightShifts = shifts
      .filter((s) => {
        if (['X', '-', ''].includes(s.sigla)) return false;
        if (s.isNight) return true;
        if (s.sigla === 'N') return true;
        if (s.entry && s.exit) {
          const [entryH] = s.entry.split(':').map(Number);
          const [exitH] = s.exit.split(':').map(Number);
          return entryH >= 19 && exitH <= 9;
        }
        return false;
      })
      .map((s) => ({
        ...s,
        dayjsDate: dayjs(s.date).startOf('day'),
      }))
      .sort((a, b) => a.dayjsDate.diff(b.dayjsDate));

    if (nightShifts.length < 3) return [];

    const candidates: AlertCandidate[] = [];
    let consecutiveCount = 1;

    for (let i = 0; i < nightShifts.length - 1; i++) {
      const current = nightShifts[i];
      const next = nightShifts[i + 1];

      const diffDays = next.dayjsDate.diff(current.dayjsDate, 'day');

      if (diffDays === 1) {
        consecutiveCount++;
        if (consecutiveCount >= 3) {
          candidates.push({
            ruleId: 'OPS-02',
            severity: 'medium',
            category: 'operational',
            serviceId: next.serviceId || context.serviceId,
            staffId: next.staffId || context.staffId,
            date: next.dayjsDate.toDate(),
            message: `Sobrecarga nocturna acumulada: ${consecutiveCount} turnos nocturnos consecutivos.`,
            context: {
              consecutiveNights: consecutiveCount,
              endDate: next.dayjsDate.format('YYYY-MM-DD'),
            },
          });
        }
      } else {
        consecutiveCount = 1;
      }
    }

    return candidates;
  },
};
