/**
 * アプリケーションのルーター
 * 各機能のルーターをまとめる
 */
import express from 'express';
import { appConfig } from './config';
import authRoutes from './features/auth/auth.routes';

const router = express.Router();

// APIのバージョンプレフィックスを取得
const apiPrefix = appConfig.app.apiPrefix;

// 各機能のルーターをマウント
router.use(`${apiPrefix}/auth`, authRoutes);

// API Health Check
router.get(`${apiPrefix}/health`, (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;