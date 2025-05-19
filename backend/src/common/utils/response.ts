/**
 * レスポンス形式ユーティリティ
 * APIのレスポンスを統一的なフォーマットにする
 */
import { Response } from 'express';

/**
 * 成功レスポンスを返す
 * @param res Expressのレスポンスオブジェクト
 * @param data レスポンスデータ
 * @param statusCode HTTPステータスコード（デフォルト: 200）
 * @param meta メタデータ（オプショナル）
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Record<string, any>
): Response => {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(meta && { meta }),
  });
};

/**
 * エラーレスポンスを返す
 * @param res Expressのレスポンスオブジェクト
 * @param error エラーメッセージ
 * @param code エラーコード
 * @param statusCode HTTPステータスコード（デフォルト: 400）
 * @param details 詳細情報（オプショナル）
 */
export const sendError = (
  res: Response,
  error: string,
  code: string,
  statusCode = 400,
  details?: Record<string, any>
): Response => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: error,
      ...(details && { details }),
    },
  });
};

/**
 * 認証エラーレスポンスを返す
 * @param res Expressのレスポンスオブジェクト
 * @param message エラーメッセージ
 * @param code エラーコード
 */
export const sendAuthError = (
  res: Response,
  message = '認証が必要です',
  code = 'AUTH_REQUIRED'
): Response => {
  return sendError(res, message, code, 401);
};

/**
 * 権限エラーレスポンスを返す
 * @param res Expressのレスポンスオブジェクト
 * @param message エラーメッセージ
 */
export const sendForbiddenError = (
  res: Response,
  message = 'この操作を実行する権限がありません'
): Response => {
  return sendError(res, message, 'FORBIDDEN', 403);
};

/**
 * 存在しないリソースエラーレスポンスを返す
 * @param res Expressのレスポンスオブジェクト
 * @param message エラーメッセージ
 */
export const sendNotFoundError = (
  res: Response,
  message = 'リソースが見つかりませんでした'
): Response => {
  return sendError(res, message, 'NOT_FOUND', 404);
};

/**
 * バリデーションエラーレスポンスを返す
 * @param res Expressのレスポンスオブジェクト
 * @param details バリデーションエラーの詳細
 */
export const sendValidationError = (
  res: Response,
  details: Record<string, string>
): Response => {
  return sendError(res, '入力データが無効です', 'VALIDATION_ERROR', 400, details);
};