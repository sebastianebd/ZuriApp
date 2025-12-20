import { describe, it, expect } from "vitest";
import auditService from "../../services/audit.service";

describe("Audit Service - generateDiff", () => {
  it("should return an empty string if there are no changes", () => {
    const oldData = { nombre: "JUAN", apellido: "PEREZ" };
    const newData = { nombre: "JUAN", apellido: "PEREZ" };
    expect(auditService.generateDiff(oldData, newData)).toBe("");
  });

  it("should detect changes in string fields", () => {
    const oldData = { nombre: "JUAN", apellido: "PEREZ" };
    const newData = { nombre: "JUAN", apellido: "SOTO" };
    expect(auditService.generateDiff(oldData, newData)).toBe(
      "apellido: PEREZ -> SOTO"
    );
  });

  it("should ignore restricted keys like _id, password, etc.", () => {
    const oldData = { _id: "123", password: "old", nombre: "JUAN" };
    const newData = { _id: "123", password: "new", nombre: "JUAN" };
    expect(auditService.generateDiff(oldData, newData)).toBe("");
  });

  it("should detect changes in dates", () => {
    const oldDate = new Date("2023-01-01T10:00:00Z");
    const newDate = new Date("2023-01-02T10:00:00Z");
    const oldData = { fecha: oldDate };
    const newData = { fecha: newDate };

    const result = auditService.generateDiff(oldData, newData);
    expect(result).toContain("fecha:");
    expect(result).toContain("->");
  });

  it("should handle null or undefined vs empty values gracefully", () => {
    const oldData = { direccion: null };
    const newData = { direccion: "" };
    expect(auditService.generateDiff(oldData, newData)).toBe("");
  });

  it("should handle multiple changes", () => {
    const oldData = { nombre: "JUAN", ciudad: "SANTIAGO" };
    const newData = { nombre: "PEDRO", ciudad: "VALPARAISO" };
    const result = auditService.generateDiff(oldData, newData);
    expect(result).toBe(
      "nombre: JUAN -> PEDRO, ciudad: SANTIAGO -> VALPARAISO"
    );
  });
});
