import { createLogger, format, transports } from "winston";
import config from "./config";

const logFormat =
  config.NODE_ENV === "production"
    ? format.combine(format.timestamp(), format.json())
    : format.combine(format.timestamp(), format.colorize(), format.simple());

const logger = createLogger({
  level: config.NODE_ENV === "production" ? "info" : "debug",
  format: logFormat,
  transports: [new transports.Console()],
});

export default logger;
