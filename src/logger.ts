import pino from 'pino';

export type Logger = {
  info: pino.LogFn;
  debug: pino.LogFn;
  error: pino.LogFn;
};

const pinoLogger = pino({
  name: `Sequence`,
  level: `debug`,
});

export const logger: Logger = {
  info: pinoLogger.info.bind(pinoLogger),
  debug: pinoLogger.debug.bind(pinoLogger),
  error: pinoLogger.error.bind(pinoLogger),
};
