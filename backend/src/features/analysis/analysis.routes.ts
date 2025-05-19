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
router.post(
  '/profitability',
  authRequired,
  validate(validateProfitabilityRequest),
  ProfitabilityController.executeProfitability
);

router.get(
  '/profitability/:profitabilityId',
  authRequired,
  validate(validateProfitabilityId),
  ProfitabilityController.getProfitability
);

router.get(
  '/profitability/property/:propertyId',
  authRequired,
  ProfitabilityController.getProfitabilitiesByProperty
);

router.get(
  '/profitability/volume-check/:volumeCheckId',
  authRequired,
  validateVolumeCheckId,
  validate,
  ProfitabilityController.getProfitabilitiesByVolumeCheck
);

router.delete(
  '/profitability/:profitabilityId',
  authRequired,
  validateProfitabilityId,
  validate,
  ProfitabilityController.deleteProfitability
);

// シナリオ関連のルート
router.post(
  '/scenarios',
  authRequired,
  validateScenarioRequest,
  validate,
  ScenarioController.createScenario
);

router.get(
  '/scenarios',
  authRequired,
  ScenarioController.getScenarios
);

router.get(
  '/scenarios/:scenarioId',
  authRequired,
  validateScenarioId,
  validate,
  ScenarioController.getScenario
);

router.put(
  '/scenarios/:scenarioId',
  authRequired,
  validateScenarioId,
  validate,
  ScenarioController.updateScenario
);

router.delete(
  '/scenarios/:scenarioId',
  authRequired,
  validateScenarioId,
  validate,
  ScenarioController.deleteScenario
);

router.post(
  '/scenarios/:scenarioId/profitability',
  authRequired,
  validateScenarioId,
  validate,
  ScenarioController.executeProfitabilityFromScenario
);

export default router;