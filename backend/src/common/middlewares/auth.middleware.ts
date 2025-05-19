/**
 * 認証ミドルウェア
 */
import { Request, Response, NextFunction } from 'express';
import { extractTokenFromBearer, verifyAccessToken } from '../../features/auth/auth.utils';
import { PUBLIC_ENDPOINTS, UserRole } from '../../types';
import { responseUtils } from '../utils';
import { AppError } from './error.middleware';

/**
 * リクエスト拡張のためのインターフェース
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
    }
  }
}

/**
 * 認証が必要なルートを保護する
 * パブリックエンドポイントのリストに含まれていないルートへのアクセスには認証が必要
 */
export const authRequired = (req: Request, res: Response, next: NextFunction) => {
  // パブリックエンドポイントへのアクセスは認証不要
  if (PUBLIC_ENDPOINTS.includes(req.path)) {
    return next();
  }

  // Authorizationヘッダーからトークンを取得
  const token = extractTokenFromBearer(req.headers.authorization);
  if (!token) {
    return responseUtils.sendAuthError(res);
  }

  // トークンを検証
  const payload = verifyAccessToken(token);
  if (!payload) {
    return responseUtils.sendError(res, 'トークンが無効です', 'INVALID_TOKEN', 401);
  }

  // リクエストにユーザー情報を追加
  req.user = {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
  };

  next();
};

/**
 * 特定のロールを持つユーザーのみアクセスを許可する
 * @param roles アクセスを許可するロールの配列
 */
export const hasRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // 認証チェック（ユーザー情報が存在するか）
    if (!req.user) {
      return responseUtils.sendAuthError(res);
    }

    // ロールチェック
    if (!roles.includes(req.user.role)) {
      return responseUtils.sendForbiddenError(res);
    }

    next();
  };
};

/**
 * 管理者ロールを持つユーザーのみアクセスを許可する
 */
export const adminOnly = hasRole([UserRole.ADMIN]);

/**
 * リクエスト制限ミドルウェア（レート制限）
 * 実際のプロジェクトでは Redis などを使用した実装に置き換えてください
 */
const requestLimits: Record<string, { count: number; resetTime: number }> = {};

export const rateLimiter = (maxRequests = 10, timeWindowMs = 60000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || 'unknown';
    const key = `${ip}:${req.path}`;
    const now = Date.now();

    // 初めてのリクエストまたはリセット時間が過ぎた場合
    if (!requestLimits[key] || requestLimits[key].resetTime < now) {
      requestLimits[key] = {
        count: 1,
        resetTime: now + timeWindowMs,
      };
      return next();
    }

    // 既存のリクエスト数をインクリメント
    requestLimits[key].count += 1;

    // リクエスト制限を超えた場合
    if (requestLimits[key].count > maxRequests) {
      // 429 Too Many Requests
      return responseUtils.sendError(
        res,
        'リクエスト回数の制限を超えました。しばらく経ってから再試行してください。',
        'TOO_MANY_REQUESTS',
        429,
        { retryAfter: Math.ceil((requestLimits[key].resetTime - now) / 1000) }
      );
    }

    next();
  };
};