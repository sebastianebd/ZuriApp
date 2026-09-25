export interface RuleContext {
  staffId?: string;
  serviceId: string;
  dateRange: { start: Date; end: Date };
  assignments: any[];
  replacements: any[];
  exceptions: any[];
  dotacionMinima?: any[];
  siglasMap?: Map<string, any>;
}

export interface AlertCandidate {
  ruleId: 'NORM-01' | 'NORM-02' | 'NORM-03' | 'NORM-06' | 'OPS-01' | 'OPS-02' | 'OPS-03';
  severity: 'critical' | 'high' | 'medium';
  category: 'normative' | 'operational';
  serviceId: string;
  staffId?: string;
  date?: Date;
  shiftSlot?: 'DIA' | 'NOCHE';
  positionId?: string;
  message: string;
  context: Record<string, any>;
}

export interface AlertRule {
  id: string;
  category: 'normative' | 'operational';
  severity: 'critical' | 'high' | 'medium';
  evaluate: (context: RuleContext) => Promise<AlertCandidate[]>;
}
