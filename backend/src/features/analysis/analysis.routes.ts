/**
 * 分析機能用ルート定義
 */
import { Router } from 'express';
import { 
  VolumeCheckController,
  ProfitabilityController,
  ScenarioController 
} from './analysis.controller';
import { 
  validateVolumeCheckRequest,
  validateVolumeCheckId,
  validateProfitabilityRequest,
  validateProfitabilityId,
  validateScenarioRequest,
  validateScenarioId
} from './analysis.validator';
import { authRequired } from '../../common/middlewares/auth.middleware';
import { validate } from '../../common/middlewares/validation.middleware';
import reportRoutes from './report/report.routes';

// ルーターの作成
const router = Router();

// ボリュームチェック関連のルート
router.post(
  '/volume-check', 
  authRequired,
  validate(validateVolumeCheckRequest),
  VolumeCheckController.executeVolumeCheck
);

router.get(
  '/volume-check/:volumeCheckId', 
  authRequired,
  validate(validateVolumeCheckId),
  VolumeCheckController.getVolumeCheck
);

router.get(
  '/volume-check/property/:propertyId', 
  authRequired,
  VolumeCheckController.getVolumeChecksByProperty
);

router.delete(
  '/volume-check/:volumeCheckId', 
  authRequired,
  validate(validateVolumeCheckId),
  VolumeCheckController.deleteVolumeCheck
);

// 収益性試算関連のルート
// 重要: 動的パラメータを含むルートは、パラメータなしルートより先に定義する
// ボリュームチェック・物件関連の収益性試算ルートを先に定義
router.get(
  '/profitability/property/:propertyId',
  authRequired,
  ProfitabilityController.getProfitabilitiesByProperty
);

router.get(
  '/profitability/volume-check/:volumeCheckId',
  authRequired,
  validate(validateVolumeCheckId), // バリデーション修正
  ProfitabilityController.getProfitabilitiesByVolumeCheck
);

// 次に個別の収益性試算ルートを定義
router.get(
  '/profitability/:profitabilityId',
  authRequired,
  validate(validateProfitabilityId),
  ProfitabilityController.getProfitability
);

router.post(
  '/profitability',
  authRequired,
  validate(validateProfitabilityRequest),
  ProfitabilityController.executeProfitability
);

router.delete(
  '/profitability/:profitabilityId',
  authRequired,
  validate(validateProfitabilityId), // バリデーション修正
  ProfitabilityController.deleteProfitability
);

// シナリオ関連のルート
// シナリオ作成エンドポイント - 高速直接実装版を使用
router.post(
  '/scenarios',
  authRequired,
  validate(validateScenarioRequest), // バリデーション修正
  ScenarioController.createScenarioDirect
);

// 診断用シナリオ作成エンドポイント（元の実装）- 開発時の比較用
router.post(
  '/scenarios-legacy',
  authRequired,
  validate(validateScenarioRequest), // バリデーション修正
  ScenarioController.createScenario
);

// 注: シナリオ作成のパフォーマンス問題を解決するために
// DB直接アクセスパターンを採用した最適化実装に切り替えました

router.get(
  '/scenarios',
  authRequired,
  ScenarioController.getScenarios
);

router.get(
  '/scenarios/:scenarioId',
  authRequired,
  validate(validateScenarioId), // バリデーション修正
  ScenarioController.getScenario
);

router.put(
  '/scenarios/:scenarioId',
  authRequired,
  validate(validateScenarioId), // バリデーション修正
  ScenarioController.updateScenario
);

router.delete(
  '/scenarios/:scenarioId',
  authRequired,
  validate(validateScenarioId), // バリデーション修正
  ScenarioController.deleteScenario
);

router.post(
  '/scenarios/:scenarioId/profitability',
  authRequired,
  validate(validateScenarioId), // バリデーション修正
  ScenarioController.executeProfitabilityFromScenario
);

// レポート生成関連のルートを追加
router.use('/report', reportRoutes);

export default router;