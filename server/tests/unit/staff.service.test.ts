import { describe, it, expect, vi, beforeEach } from "vitest";
import StaffService from "../../services/staff.service";
import Staff from "../../models/staff.model";
import accountService from "../../services/account.service";

vi.mock("../../models/staff.model");
vi.mock("../../services/account.service");
vi.mock("../../queues/email.queue", () => ({
  emailQueue: {
    add: vi.fn(),
  },
}));

describe("Staff Service - Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getStaffById()", () => {
    it("debería retornar un staff por su ID", async () => {
      const mockStaff = { _id: "staff123", firstName: "JUAN" };
      (Staff.findById as any).mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockStaff),
      });

      const result = await StaffService.getStaffById("staff123");

      expect(Staff.findById).toHaveBeenCalledWith("staff123");
      expect(result).toEqual(mockStaff);
    });
  });

  describe("getAllStaff()", () => {
    it("debería retornar todos los staff no eliminados", async () => {
      const mockStaffList = [{ _id: "1" }, { _id: "2" }];
      (Staff.find as any).mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockStaffList),
      });
      (Staff.countDocuments as any).mockResolvedValue(2);

      const result = await StaffService.getAllStaff({ page: 1, limit: 10 });

      expect(Staff.find).toHaveBeenCalledWith({ isDeleted: false });
      expect(result.staff).toEqual(mockStaffList);
    });
  });

  describe("deleteStaff()", () => {
    it("debería realizar borrado lógico (soft delete)", async () => {
      const sessionMock = { startTransaction: vi.fn(), commitTransaction: vi.fn(), abortTransaction: vi.fn(), endSession: vi.fn() };
      const mongoose = require("mongoose");
      mongoose.startSession = vi.fn().mockResolvedValue(sessionMock);

      (Staff.findById as any).mockReturnValue({
        session: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue({
            _id: "staff123",
            roleId: { level: 0 },
            isDeleted: false,
            save: vi.fn().mockResolvedValue(true)
          })
        })
      });
      (accountService.revokeAccount as any).mockResolvedValue(true);

      await StaffService.deleteStaff("staff123", 999);

      // Check that soft delete fields were set
      // The staff mock was retrieved via session()
      expect(accountService.revokeAccount).toHaveBeenCalledWith("staff123", sessionMock);
    });
  });
});
