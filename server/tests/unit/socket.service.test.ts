import { describe, it, expect, vi, beforeEach } from 'vitest';
import socketService from '../../services/socket.service';
import socketConfig from '../../config/socket';

describe('SocketService - Scoped Alert Emission Tests', () => {
  let mockIo: any;
  let mockTo: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockTo = {
      to: vi.fn().mockReturnThis(),
      emit: vi.fn(),
    };

    mockIo = {
      to: vi.fn().mockReturnValue(mockTo),
      emit: vi.fn(),
    };

    vi.spyOn(socketConfig, 'getIO').mockReturnValue(mockIo as any);
  });

  it('emitAlertNew debería emitir exclusivamente a la sala del servicio y a hospital:all', () => {
    const alert = { _id: 'alert-1', ruleId: 'NORM-01', message: 'Test alert' };
    socketService.emitAlertNew('srv-urgencias', alert);

    expect(mockIo.to).toHaveBeenCalledWith('service:srv-urgencias');
    expect(mockTo.to).toHaveBeenCalledWith('hospital:all');
    expect(mockTo.emit).toHaveBeenCalledWith('alert:new', alert);
    // Verificar que NO se hace broadcast global io.emit
    expect(mockIo.emit).not.toHaveBeenCalled();
  });

  it('emitAlertAcknowledged debería emitir a la sala del servicio y a hospital:all', () => {
    socketService.emitAlertAcknowledged('srv-urgencias', 'alert-1');

    expect(mockIo.to).toHaveBeenCalledWith('service:srv-urgencias');
    expect(mockTo.to).toHaveBeenCalledWith('hospital:all');
    expect(mockTo.emit).toHaveBeenCalledWith('alert:acknowledged', { alertId: 'alert-1' });
    expect(mockIo.emit).not.toHaveBeenCalled();
  });

  it('emitAlertResolved debería emitir a la sala del servicio y a hospital:all', () => {
    socketService.emitAlertResolved('srv-urgencias', 'alert-1');

    expect(mockIo.to).toHaveBeenCalledWith('service:srv-urgencias');
    expect(mockTo.to).toHaveBeenCalledWith('hospital:all');
    expect(mockTo.emit).toHaveBeenCalledWith('alert:resolved', { alertId: 'alert-1' });
    expect(mockIo.emit).not.toHaveBeenCalled();
  });
});
