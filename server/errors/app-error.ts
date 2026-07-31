/**
 * Standard application error with HTTP status code.
 * Use this instead of throwing plain objects `throw { status, message }`.
 * Compatible with Express error-handling middleware that reads `err.status`.
 */
export class AppError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AppError";
    this.status = status;
    // Maintains proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}
