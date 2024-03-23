import winston from "winston";

export default class WinstonLogger {
  private static _instance: winston.Logger;

  private constructor() {}

  public static logger(): winston.Logger {
    if (!WinstonLogger._instance) {
      WinstonLogger._instance = winston.createLogger({
        level: process.env.LOG_LEVEL ?? "info",
        format: winston.format.simple(),
      });

      if (process.env.NODE_ENV !== "production") {
        WinstonLogger._instance.add(
          new winston.transports.Console({
            format: winston.format.simple(),
          })
        );
      }
    }

    return WinstonLogger._instance;
  }
}
