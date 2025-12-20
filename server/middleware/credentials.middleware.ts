import { Request, Response, NextFunction } from "express";
import allowedOrigins from "../config/allowedOrigins.config";

function credentialsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
  }

  next();
}

export default credentialsMiddleware;
