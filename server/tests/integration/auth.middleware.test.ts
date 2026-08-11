import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { connect, closeDatabase } from '../db-helper';
import Account from '../../models/account.model';
import Staff from '../../models/staff.model';
import Role from '../../models/role.model';
import jwt from 'jsonwebtoken';

// Mock BullBoard
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

describe('Integration - AC-4: Auth Middleware Security', () => {
  beforeAll(async () => {
    await connect();
    process.env.ACCESS_TOKEN_SECRET = 'test-secret';
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('rejects access if the Account was hard-deleted (zombie token protection)', async () => {
    // 1. Create Role
    const role = await Role.create({
      name: 'Admin',
      code: 'ADM',
      description: 'Admin',
      hasSystemAccess: true,
    });

    // 2. Create Staff
    const staff = await Staff.create({
      rut: '66666666-6',
      firstName: 'Zombie',
      lastName: 'User',
      roleId: role._id,
    });

    // 3. Generate a VALID JWT for this user
    // The payload usually contains id or rut depending on the app's auth controller
    // Let's assume it uses account._id as the JWT subject.
    // Wait, the current verifyJWT middleware in this project expects what? 
    // Let's check how the middleware works or just write the test and fix it in GREEN phase.
    const token = jwt.sign(
      {
        id: staff._id, // Some projects use staffId, others accountId. Let's use staffId for now.
      },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: '1h' }
    );

    // 4. Hit a protected route without Account in DB (Simulating it was Hard Deleted)
    // We can hit POST /api/staff because we temporarily added verifyJWT there
    const res = await request(app)
      .post('/api/staff')
      .set('Authorization', `Bearer ${token}`)
      .send({}); // payload doesn't matter, it should fail at auth

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Cuenta de usuario inactiva o eliminada/i);
  });
});
