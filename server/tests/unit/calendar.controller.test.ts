import { describe, it, expect, vi, beforeEach } from "vitest";
import calendarController from "../../controllers/calendar.controller";
import replacementService from "../../services/replacement.service";
import { Request, Response } from "express";

// Mock del servicio de reemplazos:
// Solo necesitamos controlar el retorno de obtenerPorId para probar la generación del archivo.
vi.mock("../../services/replacement.service");

describe("Calendar Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      params: { id: "123" },
    };
    // Mock de objetos Request y Response de Express:
    // Permite verificar que se llamen a métodos como .setHeader, .send, y .status correctamente.
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      setHeader: vi.fn(),
      send: vi.fn(),
    };
  });

  it("debería generar contenido ICS válido para un reemplazo existente", async () => {
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

    // Verificar Headers Correctos:
    // Esencial para que el navegador reconozca el archivo como un calendario descargable.
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "text/calendar; charset=utf-8",
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Disposition",
      'attachment; filename="reemplazo-123.ics"',
    );

    // Verificar Contenido del ICS:
    // Aseguramos que siga el estándar iCalendar (RFC 5545).
    const sendCall = (res.send as any).mock.calls[0][0];
    expect(sendCall).toContain("BEGIN:VCALENDAR");
    expect(sendCall).toContain("SUMMARY:Reemplazo: UCI (Largo)");
    // Verificar formato de fechas (UTC 'Z' is standard for ICS to avoid timezone ambiguity)
    expect(sendCall).toContain("DTSTART:20231001T080000Z");
    expect(sendCall).toContain("DTEND:20231001T200000Z");
  });

  it("debería retornar 404 si el reemplazo no existe", async () => {
    // @ts-ignore
    replacementService.obtenerPorId.mockResolvedValue(null);

    await calendarController.downloadIcs(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Reemplazo no encontrado",
    });
  });
});
