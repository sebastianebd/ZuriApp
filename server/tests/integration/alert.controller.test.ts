import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../../app'
import Alert from '../../models/alert.model'
import Service from '../../models/service.model'
import socketService from '../../services/socket.service'

let currentAuthUser: any = {
  _id: 'staff-supervisor-1',
  firstName: 'Supervisor',
  lastName: 'Alertas',
  roleId: { level: 10, permissions: ['shifts.view', 'shifts.update'] },
}

vi.mock('../../middleware/authentication.middleware', () => ({
  default: (req: any, res: any, next: any) => {
    if (!currentAuthUser) {
      return res.status(401).json({ success: false, message: 'Token no provisto' })
    }
    req.staff = currentAuthUser
    req.account = { id: 'acc-1', staffId: currentAuthUser._id, name: 'Supervisor Test' }
    next()
  },
  requirePermission: (permission: string) => (req: any, res: any, next: any) => {
    if (!currentAuthUser) {
      return res.status(401).json({ success: false, message: 'No autenticado' })
    }
    if (
      currentAuthUser.roleId?.level === 100 ||
      currentAuthUser.roleId?.permissions?.includes(permission)
    ) {
      return next()
    }
    return res.status(403).json({ success: false, message: 'Permiso denegado' })
  },
  requireAdmin: (req: any, res: any, next: any) => {
    if (currentAuthUser?.roleId?.level === 100) return next()
    return res.status(403).json({ success: false, message: 'Admin requerido' })
  },
}))

vi.mock('../../services/socket.service', () => ({
  default: {
    emitAlertNew: vi.fn(),
    emitAlertAcknowledged: vi.fn(),
    emitAlertResolved: vi.fn(),
    emitDashboardInvalidated: vi.fn(),
    emitTurnUpdate: vi.fn(),
    emitHistoryUpdate: vi.fn(),
  },
}))

vi.mock('../../models/service.model', () => {
  return {
    default: {
      find: vi.fn(),
    },
  }
})

vi.mock('../../models/alert.model', () => {
  return {
    default: {
      find: vi.fn(),
      findById: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      countDocuments: vi.fn(),
    },
  }
})

describe('Alert Controller - Integration Tests (TDD RED)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentAuthUser = {
      _id: 'staff-supervisor-1',
      firstName: 'Supervisor',
      lastName: 'Alertas',
      roleId: { level: 10, permissions: ['shifts.view', 'shifts.update'] },
    };
    (Service.find as any).mockReturnValue({
      select: vi.fn().mockResolvedValue([{ _id: 'srv-uci' }]),
    })
  })

  describe('GET /api/alerts', () => {
    it('debería responder 200 OK con la lista de alertas y contadores agrupados', async () => {
      const mockAlerts = [
        {
          _id: 'alert-1',
          ruleId: 'NORM-01',
          severity: 'critical',
          category: 'normative',
          serviceId: 'srv-uci',
          message: 'Descanso insuficiente entre turnos',
          status: 'active',
          created_at: new Date(),
        },
        {
          _id: 'alert-2',
          ruleId: 'OPS-01',
          severity: 'medium',
          category: 'operational',
          serviceId: 'srv-uci',
          message: 'Déficit de dotación de enfermera',
          status: 'acknowledged',
          created_at: new Date(),
        },
      ];

      const queryMock: any = {
        populate: vi.fn(),
        sort: vi.fn().mockResolvedValue(mockAlerts),
      };
      queryMock.populate.mockReturnValue(queryMock);
      (Alert.find as any).mockReturnValue(queryMock);

      const res = await request(app).get('/api/alerts?serviceId=srv-uci')

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.alerts.length).toBe(2)
      expect(res.body.data.countsBySeverity.critical).toBe(1)
      expect(res.body.data.countsBySeverity.medium).toBe(1)
      expect(res.body.data.unreadCount).toBe(1) // Solo 'active' cuenta como unread
    })

    it('debería responder 403 Forbidden si el usuario carece del permiso shifts.view', async () => {
      currentAuthUser = {
        _id: 'user-sin-perm',
        roleId: { level: 1, permissions: [] },
      }

      const res = await request(app).get('/api/alerts?serviceId=srv-uci')
      expect(res.status).toBe(403)
    })

    it('debería permitir a un Administrador (level 100) ver alertas globales de todos los servicios sin filtro de servicio', async () => {
      currentAuthUser = {
        _id: 'admin-1',
        firstName: 'Admin',
        lastName: 'Global',
        roleId: { level: 100, permissions: [] },
      }

      const queryMock: any = {
        populate: vi.fn(),
        sort: vi.fn().mockResolvedValue([]),
      }
      queryMock.populate.mockReturnValue(queryMock);
      (Alert.find as any).mockReturnValue(queryMock)

      const res = await request(app).get('/api/alerts')

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      // Para admin sin serviceId en query, Alert.find NO debe restringir serviceId
      expect(Alert.find).toHaveBeenCalledWith(
        expect.not.objectContaining({ serviceId: expect.anything() }),
      )
    })

    it('debería acotar las alertas a los servicios asignados para Jefaturas/Supervisores (level < 100) sin serviceId', async () => {
      currentAuthUser = {
        _id: 'staff-supervisor-1',
        firstName: 'Supervisor',
        lastName: 'Urgencias',
        roleId: { level: 10, permissions: ['shifts.view'] },
      };

      (Service.find as any).mockReturnValue({
        select: vi.fn().mockResolvedValue([{ _id: 'srv-urgencias' }, { _id: 'srv-uci' }]),
      });

      const queryMock: any = {
        populate: vi.fn(),
        sort: vi.fn().mockResolvedValue([]),
      };
      queryMock.populate.mockReturnValue(queryMock);
      (Alert.find as any).mockReturnValue(queryMock)

      const res = await request(app).get('/api/alerts')

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Alert.find).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceId: { $in: ['srv-urgencias', 'srv-uci'] },
        }),
      )
    })

    it('debería retornar lista vacía si un Supervisor intenta consultar un servicio no asignado', async () => {
      currentAuthUser = {
        _id: 'staff-supervisor-1',
        firstName: 'Supervisor',
        lastName: 'Urgencias',
        roleId: { level: 10, permissions: ['shifts.view'] },
      };

      // Asignado únicamente a srv-urgencias
      (Service.find as any).mockReturnValue({
        select: vi.fn().mockResolvedValue([{ _id: 'srv-urgencias' }]),
      });

      // Intenta consultar srv-maternidad (servicio ajeno)
      const res = await request(app).get('/api/alerts?serviceId=srv-maternidad')

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.alerts).toEqual([])
      expect(res.body.data.unreadCount).toBe(0)
      // No debería llegar a consultar la base de datos de alertas para ese servicio
      expect(Alert.find).not.toHaveBeenCalled()
    })

    it('debería retornar lista vacía si un Supervisor no tiene ningún servicio asignado a su cargo', async () => {
      currentAuthUser = {
        _id: 'staff-sin-servicio',
        firstName: 'Supervisor',
        lastName: 'Flotante',
        roleId: { level: 10, permissions: ['shifts.view'] },
      };

      (Service.find as any).mockReturnValue({
        select: vi.fn().mockResolvedValue([]),
      });

      const res = await request(app).get('/api/alerts')

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.alerts).toEqual([])
      expect(res.body.data.unreadCount).toBe(0)
      expect(Alert.find).not.toHaveBeenCalled()
    })
  })

  describe('PATCH /api/alerts/:id/acknowledge', () => {
    it('debería cambiar el estado a acknowledged y emitir WebSocket', async () => {
      const mockAlert: any = {
        _id: 'alert-1',
        serviceId: 'srv-uci',
        status: 'active',
        save: vi.fn().mockResolvedValue(true),
      };

      (Alert.findById as any).mockResolvedValue(mockAlert)

      const res = await request(app).patch('/api/alerts/alert-1/acknowledge')

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(mockAlert.status).toBe('acknowledged')
      expect(mockAlert.acknowledgedBy).toBe('staff-supervisor-1')
      expect(socketService.emitAlertAcknowledged).toHaveBeenCalledWith('srv-uci', 'alert-1')
    })
  })

  describe('PATCH /api/alerts/:id/resolve', () => {
    it('debería marcar la alerta como resolved con nota y emitir WebSocket', async () => {
      const mockAlert: any = {
        _id: 'alert-1',
        serviceId: 'srv-uci',
        status: 'active',
        save: vi.fn().mockResolvedValue(true),
      };

      (Alert.findById as any).mockResolvedValue(mockAlert)

      const res = await request(app)
        .patch('/api/alerts/alert-1/resolve')
        .send({ resolutionNote: 'Autorizado por contingencia de catástrofe' })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(mockAlert.status).toBe('resolved')
      expect(mockAlert.resolutionNote).toBe('Autorizado por contingencia de catástrofe')
      expect(socketService.emitAlertResolved).toHaveBeenCalledWith('srv-uci', 'alert-1')
    })

    it('debería responder 400 Bad Request si resolutionNote está vacía o tiene menos de 5 caracteres', async () => {
      const res = await request(app)
        .patch('/api/alerts/alert-1/resolve')
        .send({ resolutionNote: 'abc' })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })
  })
})
