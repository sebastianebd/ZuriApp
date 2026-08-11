import { describe, it, expect, vi, beforeEach } from "vitest";
import notificationService from "../../services/notification.service";
import axios from "axios";
import StaffService from "../../services/staff.service";
import logger from "../../config/logger.config";

vi.mock("../../services/staff.service");
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

  it("debería enviar un mensaje de WhatsApp con link al calendario cuando el reemplazo es válido", async () => {
    // Mock datos del usuario
    const mockStaff = {
      _id: "123",
      firstName: "Juan",
      lastName: "Perez",
      phone: "+56912345678",
    };
    (StaffService.getStaffById as any).mockResolvedValue(mockStaff);

    // Mock datos del reemplazo
    const mockReplacement: any = {
      id_entrante: "123",
      nombre_saliente: "Maria",
      apellido_saliente: "Gonzalez",
      servicio: "UCI",
      tipo_turno: "Largo",
      fecha_inicio: new Date("2023-10-01T08:00:00"),
      fecha_termino: new Date("2023-10-01T20:00:00"),
    };

    // Configuración de variables de entorno para la API de Meta
    process.env.WHATSAPP_TOKEN = "TEST_TOKEN";
    process.env.WHATSAPP_PHONE_ID = "TEST_PHONE_ID";

    // Mock de axios.post para interceptar la llamada a la API
    const axiosPostMock = vi.mocked(axios.post);
    axiosPostMock.mockResolvedValue({
      data: { messages: [{ id: "mock_msg_id" }] },
    });

    await notificationService.notifyReplacement(mockReplacement);

    expect(StaffService.getStaffById).toHaveBeenCalledWith("123");

    expect(axiosPostMock).toHaveBeenCalled();
    const callArgs = axiosPostMock.mock.calls[0];
    const payload: any = callArgs[1];

    expect(payload.to).toBe("56912345678"); // Validación de limpieza de número
    expect(payload.text.body).toContain("*Reemplazas a:* Maria Gonzalez");
    expect(payload.text.body).toContain("*Servicio:* UCI");
    expect(payload.text.body).toContain("mi-calendario");
  });

  it("debería loguear un warning si el usuario no tiene teléfono", async () => {
    const mockStaff = {
      _id: "123",
      firstName: "Juan",
      // Sin teléfono
    };
    (StaffService.getStaffById as any).mockResolvedValue(mockStaff);

    const mockReplacement: any = { id_entrante: "123" };

    await notificationService.notifyReplacement(mockReplacement);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Omitiendo notificación"),
    );
  });
});
