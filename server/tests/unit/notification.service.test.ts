import { describe, it, expect, vi, beforeEach } from "vitest";
import notificationService from "../../services/notification.service";
import axios from "axios";
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
vi.mock("axios");

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

    // Set env vars
    process.env.WHATSAPP_TOKEN = "TEST_TOKEN";
    process.env.WHATSAPP_PHONE_ID = "TEST_PHONE_ID";

    // Mock axios post
    const axiosPostMock = vi.mocked(axios.post);
    axiosPostMock.mockResolvedValue({
      data: { messages: [{ id: "mock_msg_id" }] },
    });

    await notificationService.notifyReplacement(mockReplacement);

    // Verify user service was called
    expect(userService.obtenerPorId).toHaveBeenCalledWith("123");

    // Verify axios was called with correct payload
    expect(axiosPostMock).toHaveBeenCalled();
    const callArgs = axiosPostMock.mock.calls[0];
    const payload: any = callArgs[1];

    expect(payload.to).toBe("56912345678"); // cleaned number
    expect(payload.text.body).toContain("*Reemplazas a:* Maria Gonzalez");
    expect(payload.text.body).toContain("*Servicio:* UCI");
    expect(payload.text.body).toContain("/api/calendar/view/");
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
