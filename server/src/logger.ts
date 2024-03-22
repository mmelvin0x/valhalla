import winston from "winston";

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export default class WinstonLogger {
  private static _instance: winston.Logger;

  private constructor() {}

  public static logger(): winston.Logger {
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!WinstonLogger._instance) {
      WinstonLogger._instance = winston.createLogger({
        level: process.env.LOG_LEVEL ?? "info",
        format: winston.format.simple(),
      });

      if (process.env.NODE_ENV !== "production") {
        WinstonLogger._instance.add(
          new winston.transports.Console({
            format: winston.format.simple(),
          }),
        );
      }
    }

    return WinstonLogger._instance;
  }
}
