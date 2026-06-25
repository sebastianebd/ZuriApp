import allowedOrigins from "./allowedOrigins.config";
import { CorsOptions } from "cors";

const corsOptions: CorsOptions = {
  // Validación de Origen Estricta
  // A diferencia de permitir '*', verificamos explícitamente contra una lista blanca (whitelist).
  // Esto previene ataques CSRF desde dominios no autorizados mientras permite herramientas de desarrollo (!origin).
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Bloqueado por política CORS"));
    }
  },
  // Credenciales Obligatorias
  // Necesario para permitir el intercambio de cookies seguras (HttpOnly) entre el cliente y el servidor,
  // fundamental para nuestra autenticación basada en JWT/Cookies.
  credentials: true,
  optionsSuccessStatus: 200,
};

export default corsOptions;
