import { describe, it, expect, vi, beforeEach } from "vitest";
import notificationService from "../../services/notification.service";
import axios from "axios";
import userService from "../../services/user.service";
import logger from "../../config/logger.config";

// Mock de Dependencias:
// Mockeamos servicios internos y librerías externas (axios, logger) para probar aisladamente
// la lógica de construcción y envío de notificaciones.
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

  it("debería enviar un mensaje de WhatsApp con link al calendario cuando el reemplazo es válido", async () => {
    // Mock datos del usuario
    const mockUser = {
      _id: "123",
      nombre: "Juan",
      apellido: "Perez",
      telefono: "+56912345678",
    };
    // @ts-ignore
    userService.obtenerPorId.mockResolvedValue(mockUser);

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

    // Verificación de Orquestación:
    // Aseguramos que se obtenga la info del usuario destinatario antes de enviar.
    expect(userService.obtenerPorId).toHaveBeenCalledWith("123");

    // Verificación de Payload Externo:
    // Es crítico validar que el cuerpo del mensaje enviado a WhatsApp cumpla con el formato esperado por la API de Meta
    // y contenga la información de negocio correcta (nombre, servicio, etc).
    expect(axiosPostMock).toHaveBeenCalled();
    const callArgs = axiosPostMock.mock.calls[0];
    const payload: any = callArgs[1];

    expect(payload.to).toBe("56912345678"); // Validación de limpieza de número
    expect(payload.text.body).toContain("*Reemplazas a:* Maria Gonzalez");
    expect(payload.text.body).toContain("*Servicio:* UCI");
    expect(payload.text.body).toContain("mi-calendario");
  });

  it("debería loguear un warning si el usuario no tiene teléfono", async () => {
    const mockUser = {
      _id: "123",
      nombre: "Juan",
      // Sin teléfono
    };
    // @ts-ignore
    userService.obtenerPorId.mockResolvedValue(mockUser);

    const mockReplacement: any = { id_entrante: "123" };

    await notificationService.notifyReplacement(mockReplacement);

    // Manejo de Errores de Negocio:
    // No tener teléfono no es un error de sistema (500), pero es una condición que requiere atención (Warning),
    // ya que la notificación no se enviará.
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Skipping notification"),
    );
  });
});
