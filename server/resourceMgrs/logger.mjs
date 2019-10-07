import winston from 'winston';
import winstonDailyRotateFile from 'winston-daily-rotate-file';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { format, transports } = winston;
const logPath = path.resolve(__dirname, '../../logs/general-%DATE%.log');

// scripting for the server app
winston.loggers.add('app', {
  transports: [
    new winstonDailyRotateFile({
      filename: logPath,
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      format: format.combine(
        format.label({ label: 'app' }),
        format.timestamp(),
        format.json()
      )
    })
  ]
});

// scripting for the scripts, note use of label
winston.loggers.add('script', {
  transports: [
    new winstonDailyRotateFile({
      filename: logPath,
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      format: format.combine(
        format.label({ label: 'script' }),
        format.timestamp(),
        format.json()
      )
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  winston.loggers.get('app').add(
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
      level: 'debug'
    })
  );
  winston.loggers.get('script').add(
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
      level: 'debug'
    })
  );
}

export const loggerScript = winston.loggers.get('script');

export default winston.loggers.get('app');
