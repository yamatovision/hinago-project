/**
 * アプリケーションルート定義
 */
import { Router } from 'express';
import authRoutes from './features/auth/auth.routes';
import config from './config';

const router = Router();

// APIバージョンプレフィックス
const apiPrefix = config.app.app.apiPrefix;

// 認証ルート
router.use(`${apiPrefix}/auth`, authRoutes);

// TODO: 他のルートモジュールをここに追加

export default router;