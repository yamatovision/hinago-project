/**
 * 認証コントローラー
 * HTTPリクエストの処理とレスポンスの整形
 */
import { Request, Response, NextFunction } from 'express';
import { responseUtils } from '../../common/utils';
import * as authService from './auth.service';
import { extractTokenFromBearer } from './auth.utils';

/**
 * ログイン処理
 * POST /api/v1/auth/login
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const loginResult = await authService.authenticateUser(req.body);
    
    return responseUtils.sendSuccess(res, loginResult);
  } catch (error) {
    next(error);
  }
};

/**
 * 認証状態確認
 * GET /api/v1/auth/me
 */
export const getAuthUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // この時点でリクエストには認証ミドルウェアにより追加されたユーザー情報が含まれている
    if (!req.user) {
      return responseUtils.sendAuthError(res);
    }
    
    // ユーザーIDからユーザー情報を取得
    const user = await authService.getUserById(req.user.id);
    
    return responseUtils.sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};

/**
 * アクセストークン更新
 * POST /api/v1/auth/refresh
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshResult = await authService.refreshAccessToken(req.body);
    
    return responseUtils.sendSuccess(res, refreshResult);
  } catch (error) {
    next(error);
  }
};

/**
 * ログアウト処理
 * POST /api/v1/auth/logout
 */
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // この時点でリクエストには認証ミドルウェアにより追加されたユーザー情報が含まれている
    if (!req.user) {
      return responseUtils.sendAuthError(res);
    }
    
    // リクエストボディからリフレッシュトークンを取得（オプショナル）
    const refreshToken = req.body.refreshToken || extractTokenFromBearer(req.headers.authorization);
    
    // ユーザーをログアウト
    await authService.logoutUser(req.user.id, refreshToken);
    
    return responseUtils.sendSuccess(res, { message: 'ログアウトしました' });
  } catch (error) {
    next(error);
  }
};