/**
 * 認証ルーター
 * 認証関連のエンドポイントを定義
 */
import express from 'express';
import { validate } from '../../common/middlewares';
import * as authController from './auth.controller';
import { validateLogin, validateRefreshToken } from './auth.validator';
import { rateLimiter } from '../../common/middlewares/auth.middleware';

const router = express.Router();

/**
 * @route   POST /api/v1/auth/login
 * @desc    ユーザー認証とトークン取得
 * @access  Public
 */
router.post(
  '/login',
  rateLimiter(10, 60000), // 1分間に10回までの制限
  validate(validateLogin),
  authController.login
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    認証ユーザー情報取得
 * @access  Private
 */
router.get('/me', authController.getAuthUser);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    リフレッシュトークンによるアクセストークン更新
 * @access  Public
 */
router.post(
  '/refresh',
  validate(validateRefreshToken),
  authController.refreshToken
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    ユーザーログアウト
 * @access  Private
 */
router.post('/logout', authController.logout);

export default router;