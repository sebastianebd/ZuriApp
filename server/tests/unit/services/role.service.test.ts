import { describe, it, expect, beforeEach, vi } from "vitest";

// We will implement this service next
import RoleService from "../../../services/role.service";
import Role from "../../../models/role.model";

vi.mock("../../../models/role.model");

describe("RoleService - AC-1: Role Creation & Update Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Creation", () => {
    it("throws error when hasSystemAccess is true but permissions array is empty", async () => {
      const payload = {
        name: "Empty Admin",
        code: "EMPTY_ADMIN",
        hasSystemAccess: true,
        permissions: [],
      };

      await expect(RoleService.createRole(payload)).rejects.toThrow(
        "Roles with system access must have at least 1 permission",
      );
    });

    it("succeeds when hasSystemAccess is true and permissions has at least 1 item", async () => {
      const payload = {
        name: "Valid Admin",
        code: "VALID_ADMIN",
        hasSystemAccess: true,
        permissions: ["users.view"],
      };

      vi.mocked(Role.create).mockResolvedValue(payload as any);

      const result = await RoleService.createRole(payload);
      expect(result.name).toBe("Valid Admin");
      expect(Role.create).toHaveBeenCalledWith(payload);
    });

    it("succeeds when hasSystemAccess is false regardless of permissions", async () => {
      const payload = {
        name: "TENS",
        code: "TENS",
        hasSystemAccess: false,
        permissions: [],
      };

      vi.mocked(Role.create).mockResolvedValue(payload as any);

      const result = await RoleService.createRole(payload);
      expect(result.name).toBe("TENS");
      expect(Role.create).toHaveBeenCalledWith(payload);
    });
  });

  describe("Update (Immutability)", () => {
    it("throws error if attempting to change hasSystemAccess value", async () => {
      const existingRole = {
        _id: "123",
        name: "Valid Admin",
        code: "VALID_ADMIN",
        hasSystemAccess: true,
        permissions: ["users.view"],
      };

      vi.mocked(Role.findById).mockResolvedValue(existingRole as any);

      const updatePayload = {
        hasSystemAccess: false, // Attempting to change immutable field
      };

      await expect(
        RoleService.updateRole("123", updatePayload),
      ).rejects.toThrow(
        "The field hasSystemAccess is immutable and cannot be changed after creation",
      );
    });

    it("succeeds if hasSystemAccess is omitted or identical", async () => {
      const existingRole = {
        _id: "123",
        name: "Valid Admin",
        code: "VALID_ADMIN",
        hasSystemAccess: true,
        permissions: ["users.view"],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(Role.findById).mockResolvedValue(existingRole as any);

      const updatePayload = {
        name: "Super Admin",
      };

      const result = await RoleService.updateRole("123", updatePayload);
      expect(existingRole.name).toBe("Super Admin");
      expect(existingRole.save).toHaveBeenCalled();
    });
  });
});
