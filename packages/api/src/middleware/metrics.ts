import { Request, Response, NextFunction } from "express";
import { httpRequestCounter, httpRequestDuration } from "../metrics";

export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || "unmatched";

    httpRequestCounter.inc({
      method: req.method,
      route,
      status: res.statusCode.toString(),
    });

    httpRequestDuration.observe({ method: req.method, route }, duration);
  });

  next();
}
