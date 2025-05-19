/**
 * アプリケーションのルーター
 * 各機能のルーターをまとめる
 */
import express from 'express';
import { appConfig } from './config';
import authRoutes from './features/auth/auth.routes';
import propertiesRoutes from './features/properties/properties.routes';
import geoRoutes from './features/geo/geo.routes';
import analysisRoutes from './features/analysis/analysis.routes';

const router = express.Router();

// APIのバージョンプレフィックスを取得
const apiPrefix = appConfig.app.apiPrefix;

// 各機能のルーターをマウント
router.use(`${apiPrefix}/auth`, authRoutes);
router.use(`${apiPrefix}/properties`, propertiesRoutes);
router.use(`${apiPrefix}/geocode`, geoRoutes);
router.use(`${apiPrefix}/analysis`, analysisRoutes);

// API Health Check
router.get(`${apiPrefix}/health`, (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;