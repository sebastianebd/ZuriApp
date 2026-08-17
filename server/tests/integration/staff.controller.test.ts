import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { connect, closeDatabase, clearDatabase } from '../db-helper';
import Staff from '../../models/staff.model';
import Account from '../../models/account.model';
import Role from '../../models/role.model';
import { emailQueue } from '../../queues/email.queue';
import mongoose from 'mongoose';

// Setup Mock for Authentication Middleware (to bypass JWT checking for these specific tests)
vi.mock('../../middleware/verifyJWT.middleware', () => ({
  default: (req: any, res: any, next: any) => {
    req.staff = { id: 'admin123', roles: ['SYS_ADMIN'] };
    req.account = { id: 'admin123' };
    next();
  },
}));

// Mock Email Queue
vi.mock('../../queues/email.queue', () => ({
  emailQueue: {
    name: 'emailQueue',
    add: vi.fn(),
  },
}));

// Mock BullBoard to prevent crash when passing mocked queue
vi.mock('@bull-board/api', () => ({
  createBullBoard: vi.fn(),
}));

vi.mock('@bull-board/api/bullMQAdapter', () => {
  return {
    BullMQAdapter: class {
      setFormatter() {}
    }
  };
});

// Mock Auth Middleware for Controller Tests so we focus on business logic
vi.mock('../../middleware/authentication.middleware', () => {
  return {
    default: vi.fn((req, res, next) => {
      req.staff = { id: '507f1f77bcf86cd799439011', rut: '11111111-1', roleId: { level: 999 } };
      req.account = { id: '507f1f77bcf86cd799439011', name: '11111111-1' };
      next();
    }),
    requirePermission: vi.fn(() => (req: any, res: any, next: any) => {
      req.staff = { id: '507f1f77bcf86cd799439011', rut: '11111111-1', roleId: { level: 999 } };
      req.account = { id: '507f1f77bcf86cd799439011', name: '11111111-1' };
      next();
    }),
  };
});

describe('Integration - AC-2: Onboarding Workflow', () => {
  let roleWithAccess: any;
  let roleNoAccess: any;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    vi.clearAllMocks();

    // Create Base Roles
    roleWithAccess = await Role.create({
      name: 'Admin',
      code: 'ADMIN',
      hasSystemAccess: true,
      permissions: ['*'],
    });

    roleNoAccess = await Role.create({
      name: 'Basic Staff',
      code: 'BASIC',
      hasSystemAccess: false,
      permissions: [],
    });
  });

  describe('POST /api/staff - Onboarding', () => {
    it('creates Staff only (No Account) when Role has hasSystemAccess=false', async () => {
      const payload = {
        rut: '12345678-9',
        firstName: 'Roberto',
        lastName: 'Gomez',
        email: 'roberto@example.com',
        roleId: roleNoAccess._id,
      };

      const res = await request(app).post('/api/staff').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.rut).toBe(payload.rut);

      // Verify DB State
      const staffInDb = await Staff.findOne({ rut: payload.rut });
      expect(staffInDb).toBeTruthy();

      const accountInDb = await Account.findOne({ staffId: staffInDb?._id });
      expect(accountInDb).toBeNull(); // No account created
      expect(emailQueue.add).not.toHaveBeenCalled();
    });

    it('creates Staff + Account transactionally and queues email when Role has hasSystemAccess=true', async () => {
      const payload = {
        rut: '98765432-1',
        firstName: 'Laura',
        lastName: 'Perez',
        email: 'laura@example.com',
        roleId: roleWithAccess._id,
      };

      const res = await request(app).post('/api/staff').send(payload);

      expect(res.status).toBe(201);

      // Verify DB State
      const staffInDb = await Staff.findOne({ rut: payload.rut });
      expect(staffInDb).toBeTruthy();

      const accountInDb = await Account.findOne({ staffId: staffInDb?._id });
      expect(accountInDb).toBeTruthy();
      expect(accountInDb?.isActive).toBe(false); // Pending OTL

      expect(emailQueue.add).toHaveBeenCalledTimes(1);
    });

    it('restores soft-deleted Staff and creates Account if RUT exists and isDeleted=true (Rehire Check)', async () => {
      // 1. Create a soft-deleted staff first
      const existingStaff = await Staff.create({
        rut: '11111111-1',
        firstName: 'Old',
        lastName: 'Name',
        roleId: roleNoAccess._id,
        isDeleted: true,
      });

      const payload = {
        rut: '11111111-1', // Same RUT
        firstName: 'New', // Update name on rehire
        lastName: 'Name',
        email: 'new@example.com',
        roleId: roleWithAccess._id,
      };

      const res = await request(app).post('/api/staff').send(payload);
      expect(res.status).toBe(201);

      // Verify DB State
      const staffList = await Staff.find({ rut: payload.rut });
      expect(staffList.length).toBe(1); // No duplicates
      expect(staffList[0].firstName).toBe('New'); // Details updated
      expect(staffList[0].isDeleted).toBe(false); // Restored

      const accountInDb = await Account.findOne({ staffId: existingStaff._id });
      expect(accountInDb).toBeTruthy(); // New account created for rehired staff
    });

    it('rolls back Staff creation if Account creation fails (Transaction Integrity)', async () => {
      // Force Account creation to fail by hooking into mongoose
      vi.spyOn(Account, 'create').mockImplementationOnce(() => {
        throw new Error('Simulated DB Error during Account creation');
      });

      const payload = {
        rut: '22222222-2',
        firstName: 'Error',
        lastName: 'User',
        email: 'error@example.com',
        roleId: roleWithAccess._id,
      };

      const res = await request(app).post('/api/staff').send(payload);
      expect(res.status).toBe(500);

      // Verify Rollback: Staff should NOT exist
      const staffInDb = await Staff.findOne({ rut: payload.rut });
      expect(staffInDb).toBeNull();
    });
  });

  describe('PUT /api/staff/:id - Update Workflow (Promotions & Demotions)', () => {
    it('creates Account transactionally when changing Role from no-access to access (Promotion)', async () => {
      // 1. Create a basic staff without access
      const staff = await Staff.create({
        rut: '33333333-3',
        firstName: 'Junior',
        lastName: 'Dev',
        email: 'junior@example.com',
        roleId: roleNoAccess._id,
      });

      // 2. Promote to Role with access
      const payload = {
        roleId: roleWithAccess._id,
      };

      const res = await request(app).put(`/api/staff/${staff._id}`).send(payload);
      expect(res.status).toBe(200);

      // Verify DB State
      const updatedStaff = await Staff.findById(staff._id);
      expect(updatedStaff?.roleId.toString()).toBe(roleWithAccess._id.toString());

      const accountInDb = await Account.findOne({ staffId: staff._id });
      expect(accountInDb).toBeTruthy(); // Account was created
      expect(emailQueue.add).toHaveBeenCalledTimes(1); // OTL Email was queued
    });

    it('hard-deletes Account transactionally when changing Role from access to no-access (Demotion)', async () => {
      // 1. Create staff with access and their account
      const staff = await Staff.create({
        rut: '44444444-4',
        firstName: 'Senior',
        lastName: 'Dev',
        email: 'senior@example.com',
        roleId: roleWithAccess._id,
      });

      await Account.create({
        staffId: staff._id,
        rut: staff.rut,
        isActive: true,
      });

      // 2. Demote to Role without access
      const payload = {
        roleId: roleNoAccess._id,
      };

      const res = await request(app).put(`/api/staff/${staff._id}`).send(payload);
      expect(res.status).toBe(200);

      // Verify DB State
      const updatedStaff = await Staff.findById(staff._id);
      expect(updatedStaff?.roleId.toString()).toBe(roleNoAccess._id.toString());

      const accountInDb = await Account.findOne({ staffId: staff._id });
      expect(accountInDb).toBeNull(); // Account was HARD DELETED
    });
  });

  describe('DELETE /api/staff/:id - Offboarding Workflow', () => {
    it('soft-deletes Staff and hard-deletes Account transactionally', async () => {
      // 1. Create staff with access and their account
      const staff = await Staff.create({
        rut: '55555555-5',
        firstName: 'Leaving',
        lastName: 'Employee',
        email: 'leaving@example.com',
        roleId: roleWithAccess._id,
      });

      await Account.create({
        staffId: staff._id,
        rut: staff.rut,
        isActive: true,
      });

      // 2. Execute Offboarding
      const res = await request(app).delete(`/api/staff/${staff._id}`);
      expect(res.status).toBe(200);

      // Verify DB State
      const deletedStaff = await Staff.findById(staff._id);
      expect(deletedStaff?.isDeleted).toBe(true); // Soft Delete

      const accountInDb = await Account.findOne({ staffId: staff._id });
      expect(accountInDb).toBeNull(); // Hard Delete
    });
  });
});
