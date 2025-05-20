"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 分析機能用ルート定義
 */
var express_1 = require("express");
var analysis_controller_1 = require("./analysis.controller");
var analysis_validator_1 = require("./analysis.validator");
var auth_middleware_1 = require("../../common/middlewares/auth.middleware");
var validation_middleware_1 = require("../../common/middlewares/validation.middleware");
// ルーターの作成
var router = (0, express_1.Router)();
// ボリュームチェック関連のルート
router.post('/volume-check', auth_middleware_1.authRequired, (0, validation_middleware_1.validate)(analysis_validator_1.validateVolumeCheckRequest), analysis_controller_1.VolumeCheckController.executeVolumeCheck);
router.get('/volume-check/:volumeCheckId', auth_middleware_1.authRequired, (0, validation_middleware_1.validate)(analysis_validator_1.validateVolumeCheckId), analysis_controller_1.VolumeCheckController.getVolumeCheck);
router.get('/volume-check/property/:propertyId', auth_middleware_1.authRequired, analysis_controller_1.VolumeCheckController.getVolumeChecksByProperty);
router.delete('/volume-check/:volumeCheckId', auth_middleware_1.authRequired, (0, validation_middleware_1.validate)(analysis_validator_1.validateVolumeCheckId), analysis_controller_1.VolumeCheckController.deleteVolumeCheck);
// 収益性試算関連のルート
router.post('/profitability', auth_middleware_1.authRequired, (0, validation_middleware_1.validate)(analysis_validator_1.validateProfitabilityRequest), analysis_controller_1.ProfitabilityController.executeProfitability);
router.get('/profitability/:profitabilityId', auth_middleware_1.authRequired, (0, validation_middleware_1.validate)(analysis_validator_1.validateProfitabilityId), analysis_controller_1.ProfitabilityController.getProfitability);
router.get('/profitability/property/:propertyId', auth_middleware_1.authRequired, analysis_controller_1.ProfitabilityController.getProfitabilitiesByProperty);
router.get('/profitability/volume-check/:volumeCheckId', auth_middleware_1.authRequired, analysis_validator_1.validateVolumeCheckId, validation_middleware_1.validate, analysis_controller_1.ProfitabilityController.getProfitabilitiesByVolumeCheck);
router.delete('/profitability/:profitabilityId', auth_middleware_1.authRequired, analysis_validator_1.validateProfitabilityId, validation_middleware_1.validate, analysis_controller_1.ProfitabilityController.deleteProfitability);
// シナリオ関連のルート
router.post('/scenarios', auth_middleware_1.authRequired, analysis_validator_1.validateScenarioRequest, validation_middleware_1.validate, analysis_controller_1.ScenarioController.createScenario);
router.get('/scenarios', auth_middleware_1.authRequired, analysis_controller_1.ScenarioController.getScenarios);
router.get('/scenarios/:scenarioId', auth_middleware_1.authRequired, analysis_validator_1.validateScenarioId, validation_middleware_1.validate, analysis_controller_1.ScenarioController.getScenario);
router.put('/scenarios/:scenarioId', auth_middleware_1.authRequired, analysis_validator_1.validateScenarioId, validation_middleware_1.validate, analysis_controller_1.ScenarioController.updateScenario);
router.delete('/scenarios/:scenarioId', auth_middleware_1.authRequired, analysis_validator_1.validateScenarioId, validation_middleware_1.validate, analysis_controller_1.ScenarioController.deleteScenario);
router.post('/scenarios/:scenarioId/profitability', auth_middleware_1.authRequired, analysis_validator_1.validateScenarioId, validation_middleware_1.validate, analysis_controller_1.ScenarioController.executeProfitabilityFromScenario);
exports.default = router;
