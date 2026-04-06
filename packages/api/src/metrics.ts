import {
  Registry,
  collectDefaultMetrics,
  Counter,
  Histogram,
} from "prom-client";

const register = new Registry();

collectDefaultMetrics({ register });

export const httpRequestCounter = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route"],
  registers: [register],
});

export default register;
