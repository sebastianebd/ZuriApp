export interface AlertDTO {
  id: string;
  ruleId: 'NORM-01' | 'NORM-02' | 'NORM-03' | 'NORM-06' | 'OPS-01' | 'OPS-02' | 'OPS-03' | 'OPS-04' | 'OPS-05';
  severity: 'critical' | 'high' | 'medium';
  category: 'normative' | 'operational';
  serviceId: string;
  serviceName?: string;
  staffId?: string;
  staffName?: string;
  rut?: string;
  date?: string;
  shiftSlot?: 'DIA' | 'NOCHE';
  positionName?: string;
  message: string;
  context: Record<string, any>;
  status: 'active' | 'acknowledged' | 'resolved';
  resolutionNote?: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export interface AlertsListResponse {
  success: boolean;
  data: {
    alerts: AlertDTO[];
    unreadCount: number;
    countsBySeverity: {
      critical: number;
      high: number;
      medium: number;
    };
  };
}

export interface ResolveAlertPayload {
  resolutionNote: string;
}
