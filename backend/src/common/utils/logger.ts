/**
 * ログユーティリティ
 */
import winston from 'winston';
import { appConfig } from '../../config';

// ログフォーマットの定義
const logFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  return `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
});

// Winstonロガーの設定
const logger = winston.createLogger({
  level: appConfig.logging.level,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    logFormat
  ),
  transports: [
    // コンソールへの出力
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
  ],
});

// 開発環境以外の場合はファイルへの出力も追加
if (appConfig.app.env !== 'development' && appConfig.logging.file) {
  logger.add(new winston.transports.File({
    filename: appConfig.logging.file,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }));
}

export default logger;