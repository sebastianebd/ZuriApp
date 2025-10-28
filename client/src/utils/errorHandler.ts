import { AxiosError } from "axios";

export function errorHandler(error: unknown) {
  if (error instanceof AxiosError) {
    console.error("Axios error:", error.response?.data || error.message);
    return error.response?.data || { message: error.message };
  }
  console.error("Unknown error:", error);
  return { message: "Error desconocido" };
}
