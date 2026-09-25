import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import Account from '../../models/account.model';
import Staff from '../../models/staff.model';
import { PORTAL_JWT_SECRET } from '../../services/pwa-auth.service';
import { socketAuthMiddleware } from '../../config/socket';

vi.mock('../../models/account.model');
vi.mock('../../models/staff.model');

describe('Socket.IO Auth Middleware - Dual Desktop & PWA Authentication (TDD RED)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ACCESS_TOKEN_SECRET = 'test_access_secret';
  });

  const mockAccount = {
    _id: 'acc-123',
    rut: '12.345.678-9',
    staffId: 'staff-admin-1',
    isActive: true,
  };

  const mockStaff = {
    _id: 'staff-admin-1',
    rut: '12.345.678-9',
    firstName: 'Jefa',
    lastName: 'Turno',
    serviceId: 'srv-urgencias-1',
    isActive: true,
    isDeleted: false,
  };

  const mockPwaStaff = {
    _id: 'staff-pwa-hon-1',
    rut: '18.765.432-1',
    firstName: 'Honorario',
    lastName: 'Pérez',
    contractType: 'HONORARIO',
    serviceId: 'srv-urgencias-1',
    isActive: true,
    isDeleted: false,
  };

  it('rechaza con error 401 si no se envía ningún token ni cookie', async () => {
    const mockSocket: any = {
      id: 'socket-1',
      handshake: {
        auth: {},
        headers: {},
      },
      request: {},
    };

    const next = vi.fn();
    await socketAuthMiddleware(mockSocket, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toMatch(/401/);
  });

  it('autentica exitosamente a un usuario de escritorio con Bearer token en auth.token', async () => {
    const validToken = jwt.sign({ id: 'acc-123' }, 'test_access_secret');

    vi.mocked(Account.findById).mockResolvedValueOnce(mockAccount as any);
    vi.mocked(Staff.findById).mockResolvedValueOnce(mockStaff as any);

    const mockSocket: any = {
      id: 'socket-desktop-1',
      handshake: {
        auth: { token: validToken },
        headers: {},
      },
      request: {},
    };

    const next = vi.fn();
    await socketAuthMiddleware(mockSocket, next);

    expect(next).toHaveBeenCalledWith();
    expect(mockSocket.request.account).toBeDefined();
    expect(mockSocket.request.account.id).toBe('acc-123');
    expect(mockSocket.request.staff).toBeDefined();
  });

  it('autentica exitosamente a un funcionario PWA mediante cookie zuriapp_pwa_session', async () => {
    const pwaToken = jwt.sign(
      { staffId: 'staff-pwa-hon-1', rut: '18.765.432-1' },
      PORTAL_JWT_SECRET
    );

    vi.mocked(Staff.findById).mockResolvedValueOnce(mockPwaStaff as any);

    const mockSocket: any = {
      id: 'socket-pwa-1',
      handshake: {
        auth: {},
        headers: {
          cookie: `other=123; zuriapp_pwa_session=${pwaToken}; foo=bar`,
        },
      },
      request: {},
    };

    const next = vi.fn();
    await socketAuthMiddleware(mockSocket, next);

    expect(next).toHaveBeenCalledWith();
    expect(mockSocket.request.staff).toBeDefined();
    expect(mockSocket.request.staff._id).toBe('staff-pwa-hon-1');
  });

  it('autentica exitosamente a un funcionario PWA con pwaToken en auth.pwaToken', async () => {
    const pwaToken = jwt.sign(
      { staffId: 'staff-pwa-hon-1', rut: '18.765.432-1' },
      PORTAL_JWT_SECRET
    );

    vi.mocked(Staff.findById).mockResolvedValueOnce(mockPwaStaff as any);

    const mockSocket: any = {
      id: 'socket-pwa-2',
      handshake: {
        auth: { pwaToken },
        headers: {},
      },
      request: {},
    };

    const next = vi.fn();
    await socketAuthMiddleware(mockSocket, next);

    expect(next).toHaveBeenCalledWith();
    expect(mockSocket.request.staff).toBeDefined();
    expect(mockSocket.request.staff._id).toBe('staff-pwa-hon-1');
  });
});
