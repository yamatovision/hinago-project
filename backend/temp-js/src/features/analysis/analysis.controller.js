"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScenarioController = exports.ProfitabilityController = exports.VolumeCheckController = void 0;
var analysis_service_1 = require("./analysis.service");
var utils_1 = require("../../common/utils");
var response_1 = require("../../common/utils/response");
/**
 * ボリュームチェックコントローラークラス
 */
var VolumeCheckController = /** @class */ (function () {
    function VolumeCheckController() {
    }
    /**
     * ボリュームチェック実行
     * POST /api/v1/analysis/volume-check
     */
    VolumeCheckController.executeVolumeCheck = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, propertyId, buildingParams, userId, volumeCheck, error_1;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        _a = req.body, propertyId = _a.propertyId, buildingParams = _a.buildingParams;
                        userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
                        return [4 /*yield*/, analysis_service_1.VolumeCheckService.executeVolumeCheck(propertyId, buildingParams, userId)];
                    case 1:
                        volumeCheck = _c.sent();
                        // 成功レスポンス
                        (0, response_1.sendSuccess)(res, volumeCheck, 201);
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _c.sent();
                        // エラーログ
                        utils_1.logger.error('ボリュームチェック実行エラー', { error: error_1, body: req.body });
                        // 適切なエラーレスポンス
                        if (error_1.message.includes('物件が見つかりません')) {
                            (0, response_1.sendNotFoundError)(res, '指定された物件が見つかりません');
                        }
                        else if (error_1.message.includes('計算')) {
                            (0, response_1.sendError)(res, '建築ボリュームの計算に失敗しました', 'CALCULATION_ERROR', 400, {
                                details: error_1.message
                            });
                        }
                        else {
                            next(error_1);
                        }
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * ボリュームチェック結果取得
     * GET /api/v1/analysis/volume-check/:volumeCheckId
     */
    VolumeCheckController.getVolumeCheck = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var volumeCheckId, volumeCheck, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        volumeCheckId = req.params.volumeCheckId;
                        return [4 /*yield*/, analysis_service_1.VolumeCheckService.getVolumeCheckById(volumeCheckId)];
                    case 1:
                        volumeCheck = _a.sent();
                        // 結果チェック
                        if (!volumeCheck) {
                            (0, response_1.sendNotFoundError)(res, '指定されたボリュームチェック結果が見つかりません');
                            return [2 /*return*/];
                        }
                        // 成功レスポンス
                        (0, response_1.sendSuccess)(res, volumeCheck);
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        utils_1.logger.error('ボリュームチェック取得エラー', { error: error_2, volumeCheckId: req.params.volumeCheckId });
                        next(error_2);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 物件IDでボリュームチェック結果一覧取得
     * GET /api/v1/analysis/volume-check/property/:propertyId
     */
    VolumeCheckController.getVolumeChecksByProperty = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var propertyId, result, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        propertyId = req.params.propertyId;
                        return [4 /*yield*/, analysis_service_1.VolumeCheckService.getVolumeChecksByPropertyId(propertyId)];
                    case 1:
                        result = _a.sent();
                        // 成功レスポンス（空配列でも成功）
                        (0, response_1.sendSuccess)(res, result.volumeChecks, 200, {
                            total: result.total
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _a.sent();
                        utils_1.logger.error('物件ボリュームチェック一覧取得エラー', { error: error_3, propertyId: req.params.propertyId });
                        next(error_3);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * ボリュームチェック結果削除
     * DELETE /api/v1/analysis/volume-check/:volumeCheckId
     */
    VolumeCheckController.deleteVolumeCheck = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var volumeCheckId, deleted, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        volumeCheckId = req.params.volumeCheckId;
                        return [4 /*yield*/, analysis_service_1.VolumeCheckService.deleteVolumeCheck(volumeCheckId)];
                    case 1:
                        deleted = _a.sent();
                        // 結果チェック
                        if (!deleted) {
                            (0, response_1.sendNotFoundError)(res, '指定されたボリュームチェック結果が見つかりません');
                            return [2 /*return*/];
                        }
                        // 成功レスポンス（204 No Content）
                        res.status(204).end();
                        return [3 /*break*/, 3];
                    case 2:
                        error_4 = _a.sent();
                        utils_1.logger.error('ボリュームチェック削除エラー', { error: error_4, volumeCheckId: req.params.volumeCheckId });
                        next(error_4);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return VolumeCheckController;
}());
exports.VolumeCheckController = VolumeCheckController;
/**
 * 収益性試算コントローラークラス
 */
var ProfitabilityController = /** @class */ (function () {
    function ProfitabilityController() {
    }
    /**
     * 収益性試算実行
     * POST /api/v1/analysis/profitability
     */
    ProfitabilityController.executeProfitability = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, propertyId, volumeCheckId, financialParams, userId, profitability, error_5;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        _a = req.body, propertyId = _a.propertyId, volumeCheckId = _a.volumeCheckId, financialParams = _a.financialParams;
                        userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
                        return [4 /*yield*/, analysis_service_1.ProfitabilityService.executeProfitability(propertyId, volumeCheckId, financialParams, userId)];
                    case 1:
                        profitability = _c.sent();
                        // 成功レスポンス
                        (0, response_1.sendSuccess)(res, profitability, 201);
                        return [3 /*break*/, 3];
                    case 2:
                        error_5 = _c.sent();
                        // エラーログ
                        utils_1.logger.error('収益性試算実行エラー', { error: error_5, body: req.body });
                        // 適切なエラーレスポンス
                        if (error_5.message.includes('物件が見つかりません')) {
                            (0, response_1.sendNotFoundError)(res, '指定された物件が見つかりません');
                        }
                        else if (error_5.message.includes('ボリュームチェック結果が見つかりません')) {
                            (0, response_1.sendNotFoundError)(res, '指定されたボリュームチェック結果が見つかりません');
                        }
                        else if (error_5.message.includes('関連付けられていません')) {
                            (0, response_1.sendError)(res, '指定されたボリュームチェック結果は、指定された物件に関連付けられていません', 'RELATED_ERROR', 400);
                        }
                        else if (error_5.message.includes('計算')) {
                            (0, response_1.sendError)(res, '収益性試算の計算に失敗しました', 'CALCULATION_ERROR', 400, {
                                details: error_5.message
                            });
                        }
                        else {
                            next(error_5);
                        }
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 収益性試算結果取得
     * GET /api/v1/analysis/profitability/:profitabilityId
     */
    ProfitabilityController.getProfitability = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var profitabilityId, profitability, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        profitabilityId = req.params.profitabilityId;
                        return [4 /*yield*/, analysis_service_1.ProfitabilityService.getProfitabilityById(profitabilityId)];
                    case 1:
                        profitability = _a.sent();
                        // 結果チェック
                        if (!profitability) {
                            (0, response_1.sendNotFoundError)(res, '指定された収益性試算結果が見つかりません');
                            return [2 /*return*/];
                        }
                        // 成功レスポンス
                        (0, response_1.sendSuccess)(res, profitability);
                        return [3 /*break*/, 3];
                    case 2:
                        error_6 = _a.sent();
                        utils_1.logger.error('収益性試算結果取得エラー', { error: error_6, profitabilityId: req.params.profitabilityId });
                        next(error_6);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 物件IDで収益性試算結果一覧取得
     * GET /api/v1/analysis/profitability/property/:propertyId
     */
    ProfitabilityController.getProfitabilitiesByProperty = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var propertyId, result, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        propertyId = req.params.propertyId;
                        return [4 /*yield*/, analysis_service_1.ProfitabilityService.getProfitabilitiesByPropertyId(propertyId)];
                    case 1:
                        result = _a.sent();
                        // 成功レスポンス（空配列でも成功）
                        (0, response_1.sendSuccess)(res, result.profitabilityResults, 200, {
                            total: result.total
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_7 = _a.sent();
                        utils_1.logger.error('物件関連収益性試算結果一覧取得エラー', { error: error_7, propertyId: req.params.propertyId });
                        next(error_7);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * ボリュームチェックIDで収益性試算結果一覧取得
     * GET /api/v1/analysis/profitability/volume-check/:volumeCheckId
     */
    ProfitabilityController.getProfitabilitiesByVolumeCheck = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var volumeCheckId, result, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        volumeCheckId = req.params.volumeCheckId;
                        return [4 /*yield*/, analysis_service_1.ProfitabilityService.getProfitabilitiesByVolumeCheckId(volumeCheckId)];
                    case 1:
                        result = _a.sent();
                        // 成功レスポンス（空配列でも成功）
                        (0, response_1.sendSuccess)(res, result.profitabilityResults, 200, {
                            total: result.total
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_8 = _a.sent();
                        utils_1.logger.error('ボリュームチェック関連収益性試算結果一覧取得エラー', { error: error_8, volumeCheckId: req.params.volumeCheckId });
                        next(error_8);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 収益性試算結果削除
     * DELETE /api/v1/analysis/profitability/:profitabilityId
     */
    ProfitabilityController.deleteProfitability = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var profitabilityId, deleted, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        profitabilityId = req.params.profitabilityId;
                        return [4 /*yield*/, analysis_service_1.ProfitabilityService.deleteProfitability(profitabilityId)];
                    case 1:
                        deleted = _a.sent();
                        // 結果チェック
                        if (!deleted) {
                            (0, response_1.sendNotFoundError)(res, '指定された収益性試算結果が見つかりません');
                            return [2 /*return*/];
                        }
                        // 成功レスポンス（204 No Content）
                        res.status(204).end();
                        return [3 /*break*/, 3];
                    case 2:
                        error_9 = _a.sent();
                        utils_1.logger.error('収益性試算結果削除エラー', { error: error_9, profitabilityId: req.params.profitabilityId });
                        next(error_9);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return ProfitabilityController;
}());
exports.ProfitabilityController = ProfitabilityController;
/**
 * シナリオコントローラークラス
 */
var ScenarioController = /** @class */ (function () {
    function ScenarioController() {
    }
    /**
     * シナリオ作成
     * POST /api/v1/analysis/scenarios
     */
    ScenarioController.createScenario = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, propertyId, volumeCheckId, name_1, params, userId, scenario, error_10;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        _a = req.body, propertyId = _a.propertyId, volumeCheckId = _a.volumeCheckId, name_1 = _a.name, params = _a.params;
                        userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
                        return [4 /*yield*/, analysis_service_1.ScenarioService.createScenario(propertyId, volumeCheckId, name_1, params, userId)];
                    case 1:
                        scenario = _c.sent();
                        // 成功レスポンス
                        (0, response_1.sendSuccess)(res, scenario, 201);
                        return [3 /*break*/, 3];
                    case 2:
                        error_10 = _c.sent();
                        // エラーログ
                        utils_1.logger.error('シナリオ作成エラー', { error: error_10, body: req.body });
                        // 適切なエラーレスポンス
                        if (error_10.message.includes('物件が見つかりません')) {
                            (0, response_1.sendNotFoundError)(res, '指定された物件が見つかりません');
                        }
                        else if (error_10.message.includes('ボリュームチェック結果が見つかりません')) {
                            (0, response_1.sendNotFoundError)(res, '指定されたボリュームチェック結果が見つかりません');
                        }
                        else if (error_10.message.includes('関連付けられていません')) {
                            (0, response_1.sendError)(res, '指定されたボリュームチェック結果は、指定された物件に関連付けられていません', 'RELATED_ERROR', 400);
                        }
                        else {
                            next(error_10);
                        }
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * シナリオ更新
     * PUT /api/v1/analysis/scenarios/:scenarioId
     */
    ScenarioController.updateScenario = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var scenarioId, _a, name_2, params, userId, updateData, scenario, error_11;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        scenarioId = req.params.scenarioId;
                        _a = req.body, name_2 = _a.name, params = _a.params;
                        userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
                        updateData = {};
                        if (name_2 !== undefined)
                            updateData.name = name_2;
                        if (params !== undefined)
                            updateData.params = params;
                        return [4 /*yield*/, analysis_service_1.ScenarioService.updateScenario(scenarioId, updateData, userId)];
                    case 1:
                        scenario = _c.sent();
                        // 結果チェック
                        if (!scenario) {
                            (0, response_1.sendNotFoundError)(res, '指定されたシナリオが見つかりません');
                            return [2 /*return*/];
                        }
                        // 成功レスポンス
                        (0, response_1.sendSuccess)(res, scenario);
                        return [3 /*break*/, 3];
                    case 2:
                        error_11 = _c.sent();
                        utils_1.logger.error('シナリオ更新エラー', { error: error_11, scenarioId: req.params.scenarioId, body: req.body });
                        next(error_11);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * シナリオ取得
     * GET /api/v1/analysis/scenarios/:scenarioId
     */
    ScenarioController.getScenario = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var scenarioId, includeProfitability, scenario, error_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        scenarioId = req.params.scenarioId;
                        includeProfitability = req.query.include === 'profitabilityResult';
                        return [4 /*yield*/, analysis_service_1.ScenarioService.getScenarioById(scenarioId, includeProfitability)];
                    case 1:
                        scenario = _a.sent();
                        // 結果チェック
                        if (!scenario) {
                            (0, response_1.sendNotFoundError)(res, '指定されたシナリオが見つかりません');
                            return [2 /*return*/];
                        }
                        // 成功レスポンス
                        (0, response_1.sendSuccess)(res, scenario);
                        return [3 /*break*/, 3];
                    case 2:
                        error_12 = _a.sent();
                        utils_1.logger.error('シナリオ取得エラー', { error: error_12, scenarioId: req.params.scenarioId });
                        next(error_12);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 物件IDでシナリオ一覧取得
     * GET /api/v1/analysis/scenarios
     */
    ScenarioController.getScenarios = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, propertyId, volumeCheckId, result, error_13;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 5, , 6]);
                        _a = req.query, propertyId = _a.propertyId, volumeCheckId = _a.volumeCheckId;
                        // パラメータの型を確認
                        if (propertyId && typeof propertyId !== 'string') {
                            (0, response_1.sendError)(res, 'propertyIdは文字列で指定してください', 'VALIDATION_ERROR', 400);
                            return [2 /*return*/];
                        }
                        if (volumeCheckId && typeof volumeCheckId !== 'string') {
                            (0, response_1.sendError)(res, 'volumeCheckIdは文字列で指定してください', 'VALIDATION_ERROR', 400);
                            return [2 /*return*/];
                        }
                        // どちらかのパラメータが必要
                        if (!propertyId && !volumeCheckId) {
                            (0, response_1.sendError)(res, 'propertyIdまたはvolumeCheckIdのいずれかを指定してください', 'VALIDATION_ERROR', 400);
                            return [2 /*return*/];
                        }
                        result = void 0;
                        if (!propertyId) return [3 /*break*/, 2];
                        return [4 /*yield*/, analysis_service_1.ScenarioService.getScenariosByPropertyId(propertyId)];
                    case 1:
                        result = _b.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, analysis_service_1.ScenarioService.getScenariosByVolumeCheckId(volumeCheckId)];
                    case 3:
                        result = _b.sent();
                        _b.label = 4;
                    case 4:
                        // 成功レスポンス（空配列でも成功）
                        (0, response_1.sendSuccess)(res, result.scenarios, 200, {
                            total: result.total
                        });
                        return [3 /*break*/, 6];
                    case 5:
                        error_13 = _b.sent();
                        utils_1.logger.error('シナリオ一覧取得エラー', { error: error_13, query: req.query });
                        next(error_13);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * シナリオ削除
     * DELETE /api/v1/analysis/scenarios/:scenarioId
     */
    ScenarioController.deleteScenario = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var scenarioId, userId, deleted, error_14;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        scenarioId = req.params.scenarioId;
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                        return [4 /*yield*/, analysis_service_1.ScenarioService.deleteScenario(scenarioId, userId)];
                    case 1:
                        deleted = _b.sent();
                        // 結果チェック
                        if (!deleted) {
                            (0, response_1.sendNotFoundError)(res, '指定されたシナリオが見つかりません');
                            return [2 /*return*/];
                        }
                        // 成功レスポンス（204 No Content）
                        res.status(204).end();
                        return [3 /*break*/, 3];
                    case 2:
                        error_14 = _b.sent();
                        utils_1.logger.error('シナリオ削除エラー', { error: error_14, scenarioId: req.params.scenarioId });
                        next(error_14);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * シナリオから収益性試算実行
     * POST /api/v1/analysis/scenarios/:scenarioId/profitability
     */
    ScenarioController.executeProfitabilityFromScenario = function (req, res, next) {
        return __awaiter(this, void 0, void 0, function () {
            var scenarioId, userId, profitability, error_15;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        scenarioId = req.params.scenarioId;
                        userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                        return [4 /*yield*/, analysis_service_1.ScenarioService.executeProfitabilityFromScenario(scenarioId, userId)];
                    case 1:
                        profitability = _b.sent();
                        // 成功レスポンス
                        (0, response_1.sendSuccess)(res, profitability, 201);
                        return [3 /*break*/, 3];
                    case 2:
                        error_15 = _b.sent();
                        // エラーログ
                        utils_1.logger.error('シナリオからの収益性試算実行エラー', { error: error_15, scenarioId: req.params.scenarioId });
                        // 適切なエラーレスポンス
                        if (error_15.message.includes('シナリオが見つかりません')) {
                            (0, response_1.sendNotFoundError)(res, '指定されたシナリオが見つかりません');
                        }
                        else if (error_15.message.includes('物件が見つかりません')) {
                            (0, response_1.sendNotFoundError)(res, '関連する物件が見つかりません');
                        }
                        else if (error_15.message.includes('ボリュームチェック結果が見つかりません')) {
                            (0, response_1.sendNotFoundError)(res, '関連するボリュームチェック結果が見つかりません');
                        }
                        else if (error_15.message.includes('計算')) {
                            (0, response_1.sendError)(res, '収益性試算の計算に失敗しました', 'CALCULATION_ERROR', 400, {
                                details: error_15.message
                            });
                        }
                        else {
                            next(error_15);
                        }
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return ScenarioController;
}());
exports.ScenarioController = ScenarioController;
