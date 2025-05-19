/**
 * エラーハンドリングミドルウェア
 */
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils';
import { responseUtils } from '../utils';

/**
 * アプリケーションエラークラス
 */
export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: Record<string, any>;

  constructor(message: string, statusCode = 500, code = 'SERVER_ERROR', details?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 存在しないルートへのアクセス時のエラーハンドリング
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const err = new AppError(`要求されたパス ${req.originalUrl} が見つかりません`, 404, 'NOT_FOUND');
  next(err);
};

/**
 * グローバルエラーハンドラ
 */
export const errorHandler = (err: AppError | Error, req: Request, res: Response, next: NextFunction) => {
  // デフォルトのエラー情報
  let statusCode = 500;
  let message = 'サーバーエラーが発生しました';
  let code = 'SERVER_ERROR';
  let details = undefined;

  // AppErrorの場合は詳細情報を取得
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
    details = err.details;
  } else {
    // その他のエラーの場合
    message = err.message || message;
  }

  // 本番環境では内部エラーの詳細を隠す
  if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
    message = 'サーバーエラーが発生しました';
    details = undefined;
  }

  // エラーをログに記録
  const logMethod = statusCode >= 500 ? logger.error : logger.warn;
  logMethod(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, {
    error: err.stack || err,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // クライアントにレスポンスを返す
  return responseUtils.sendError(res, message, code, statusCode, details);
};