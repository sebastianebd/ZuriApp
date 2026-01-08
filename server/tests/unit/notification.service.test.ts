import { describe, it, expect, vi, beforeEach } from "vitest";
import notificationService from "../../services/notification.service";
import userService from "../../services/user.service";
import logger from "../../config/logger.config";

// Mock dependencies
vi.mock("../../services/user.service");
vi.mock("../../config/logger.config", () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Notification Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should send a whatsapp message with calendar link when replacement is valid", async () => {
    // Mock user data
    const mockUser = {
      _id: "123",
      nombre: "Juan",
      apellido: "Perez",
      telefono: "+56912345678",
    };
    // @ts-ignore
    userService.obtenerPorId.mockResolvedValue(mockUser);

    // Mock replacement data
    const mockReplacement: any = {
      id_entrante: "123",
      nombre_saliente: "Maria",
      apellido_saliente: "Gonzalez",
      servicio: "UCI",
      tipo_turno: "Largo",
      fecha_inicio: new Date("2023-10-01T08:00:00"),
      fecha_termino: new Date("2023-10-01T20:00:00"),
    };

    await notificationService.notifyReplacement(mockReplacement);

    // Verify user service was called
    expect(userService.obtenerPorId).toHaveBeenCalledWith("123");

    // Verify logger was called (acting as our "send" verification)
    const infoCalls = (logger.info as any).mock.calls;
    const msgCall = infoCalls.find((call: any[]) =>
      call[0].includes("[WhatsApp Mock] To: +56912345678")
    );

    expect(msgCall).toBeDefined();
    const loggedMessage = msgCall[0];

    expect(loggedMessage).toContain("*Reemplazas a:* Maria Gonzalez");
    expect(loggedMessage).toContain("*Servicio:* UCI");
    expect(loggedMessage).toContain(
      "https://calendar.google.com/calendar/render"
    );
  });

  it("should log warning if user has no phone", async () => {
    const mockUser = {
      _id: "123",
      nombre: "Juan",
      // No phone
    };
    // @ts-ignore
    userService.obtenerPorId.mockResolvedValue(mockUser);

    const mockReplacement: any = { id_entrante: "123" };

    await notificationService.notifyReplacement(mockReplacement);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Skipping notification")
    );
  });
});
