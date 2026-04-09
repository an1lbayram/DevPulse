import winston from 'winston';
import path from 'path';
import { app } from 'electron';
import fs from 'node:fs';

const logDir = path.join(app.getPath('userData'), 'logs');
fs.mkdirSync(logDir, { recursive: true });

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logDir, 'scan.log'), level: 'info' }),
    new winston.transports.Console()
  ]
});

export default logger;
