import { describe, it, expect, vi, beforeEach } from "vitest";
import AccountService from "../../services/account.service";
import Account from "../../models/account.model";
import Staff from "../../models/staff.model";
import { emailQueue } from "../../queues/email.queue";
import auditService from "../../services/audit.service";
import crypto from "crypto";

vi.mock("../../models/account.model");
vi.mock("../../models/staff.model");
vi.mock("../../services/audit.service");
vi.mock("../../config/socket", () => ({
  default: {
    getIO: vi.fn().mockReturnValue({ emit: vi.fn() })
  }
}));
vi.mock("../../queues/email.queue", () => ({
  emailQueue: {
    add: vi.fn(),
  },
}));

describe("Account Service - Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createAccountForStaff()", () => {
    it("debería crear una cuenta inactiva y agregar correo OTL a la cola", async () => {
      const mockStaff = { _id: "staff123", rut: "111-1", email: "test@test.com", firstName: "Test" };
      const sessionMock = {} as any;
      (Account.create as any).mockResolvedValue([{ _id: "account1" }]);

      await AccountService.createAccountForStaff(mockStaff, sessionMock);

      expect(Account.create).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            staffId: "staff123",
            rut: "111-1",
            isActive: false
          })
        ]),
        { session: sessionMock }
      );
      expect(emailQueue.add).toHaveBeenCalledWith("sendOTL", expect.objectContaining({
        to: "test@test.com"
      }));
    });
  });

  describe("revokeAccount()", () => {
    it("debería realizar un Hard Delete de la cuenta", async () => {
      const sessionMock = {} as any;
      const deleteOneMock = { session: vi.fn().mockResolvedValue(true) };
      (Account.deleteOne as any).mockReturnValue(deleteOneMock);

      await AccountService.revokeAccount("staff123", sessionMock);

      expect(Account.deleteOne).toHaveBeenCalledWith({ staffId: "staff123" });
      expect(deleteOneMock.session).toHaveBeenCalledWith(sessionMock);
    });
  });

  describe("toggleAccountStatus()", () => {
    it("debería lanzar error 403 si reqRoleLevel <= targetRole.level", async () => {
      (Staff.findById as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue({
          _id: "staff123",
          roleId: { level: 99 } // High level
        })
      });

      const reqAccount = { id: "admin", name: "admin" };
      await expect(AccountService.toggleAccountStatus("staff123", false, 1, reqAccount))
        .rejects.toThrow(/jerarquía/);
    });

    it("debería cambiar el estado y registrar auditoría si permisos son válidos", async () => {
      const mockStaff = { _id: "staff123", firstName: "A", lastName: "B", roleId: { level: 1 } };
      (Staff.findById as any).mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockStaff)
      });
      const mockAccount = { _id: "acc1", isActive: true, save: vi.fn().mockResolvedValue(true) };
      (Account.findOne as any).mockResolvedValue(mockAccount);
      (auditService.generateDiff as any).mockReturnValue("changed");

      const reqAccount = { id: "admin", name: "admin" };
      await AccountService.toggleAccountStatus("staff123", false, 99, reqAccount);

      expect(mockAccount.isActive).toBe(false);
      expect(mockAccount.save).toHaveBeenCalled();
      expect(auditService.logAction).toHaveBeenCalled();
    });
  });
});
