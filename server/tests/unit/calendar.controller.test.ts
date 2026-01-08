import { describe, it, expect, vi, beforeEach } from "vitest";
import calendarController from "../../controllers/calendar.controller";
import replacementService from "../../services/replacement.service";
import { Request, Response } from "express";

vi.mock("../../services/replacement.service");

describe("Calendar Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      params: { id: "123" },
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      setHeader: vi.fn(),
      send: vi.fn(),
    };
  });

  it("should generate valid ICS content", async () => {
    const mockReplacement = {
      _id: "123",
      fecha_inicio: new Date("2023-10-01T08:00:00Z"),
      fecha_termino: new Date("2023-10-01T20:00:00Z"),
      servicio: "UCI",
      tipo_turno: "Largo",
      nombre_saliente: "Juan",
      apellido_saliente: "Perez",
    };

    // @ts-ignore
    replacementService.obtenerPorId.mockResolvedValue(mockReplacement);

    await calendarController.downloadIcs(req as Request, res as Response);

    // Verify Headers
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "text/calendar; charset=utf-8"
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Disposition",
      'attachment; filename="reemplazo-123.ics"'
    );

    // Verify Content
    const sendCall = (res.send as any).mock.calls[0][0];
    expect(sendCall).toContain("BEGIN:VCALENDAR");
    expect(sendCall).toContain("SUMMARY:Reemplazo: UCI (Largo)");
    // Check date formatting (UTC Z)
    expect(sendCall).toContain("DTSTART:20231001T080000Z");
    expect(sendCall).toContain("DTEND:20231001T200000Z");
  });

  it("should handle replacement not found", async () => {
    // @ts-ignore
    replacementService.obtenerPorId.mockResolvedValue(null);

    await calendarController.downloadIcs(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Reemplazo no encontrado",
    });
  });
});
