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
exports.ScenarioService = exports.ProfitabilityService = exports.VolumeCheckService = void 0;
var utils_1 = require("../../common/utils");
var models_1 = require("../../db/models");
var analysis_utils_1 = require("./analysis.utils");
/**
 * ボリュームチェックサービスクラス
 */
var VolumeCheckService = /** @class */ (function () {
    function VolumeCheckService() {
    }
    /**
     * ボリュームチェックを実行
     * @param propertyId 物件ID
     * @param buildingParams 建築パラメータ
     * @param userId ユーザーID
     * @returns ボリュームチェック結果
     */
    VolumeCheckService.executeVolumeCheck = function (propertyId, buildingParams, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var property, volumeCheckData, volumeCheck, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, models_1.PropertyModel.findById(propertyId)];
                    case 1:
                        property = _a.sent();
                        if (!property) {
                            throw new Error("\u7269\u4EF6\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093 (ID: ".concat(propertyId, ")"));
                        }
                        return [4 /*yield*/, (0, analysis_utils_1.calculateVolumeCheck)(property, buildingParams, userId)];
                    case 2:
                        volumeCheckData = _a.sent();
                        return [4 /*yield*/, models_1.VolumeCheckModel.create(volumeCheckData)];
                    case 3:
                        volumeCheck = _a.sent();
                        return [2 /*return*/, volumeCheck];
                    case 4:
                        error_1 = _a.sent();
                        utils_1.logger.error('ボリュームチェック実行エラー', { error: error_1, propertyId: propertyId });
                        throw error_1;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * ボリュームチェック結果を取得
     * @param volumeCheckId ボリュームチェック結果ID
     * @returns ボリュームチェック結果
     */
    VolumeCheckService.getVolumeCheckById = function (volumeCheckId) {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, models_1.VolumeCheckModel.findById(volumeCheckId)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_2 = _a.sent();
                        utils_1.logger.error('ボリュームチェック結果取得エラー', { error: error_2, volumeCheckId: volumeCheckId });
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 物件に関連するボリュームチェック結果を取得
     * @param propertyId 物件ID
     * @param page ページ番号
     * @param limit 1ページあたりの件数
     * @returns ボリュームチェック結果リストとメタデータ
     */
    VolumeCheckService.getVolumeChecksByPropertyId = function (propertyId_1) {
        return __awaiter(this, arguments, void 0, function (propertyId, page, limit) {
            var error_3;
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 10; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, models_1.VolumeCheckModel.findByPropertyId(propertyId, page, limit)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_3 = _a.sent();
                        utils_1.logger.error('物件関連ボリュームチェック結果取得エラー', { error: error_3, propertyId: propertyId });
                        throw error_3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * ボリュームチェック結果を削除
     * @param volumeCheckId ボリュームチェック結果ID
     * @param userId ユーザーID（権限チェック用）
     * @returns 削除が成功したかどうか
     */
    VolumeCheckService.deleteVolumeCheck = function (volumeCheckId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var volumeCheck, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        return [4 /*yield*/, models_1.VolumeCheckModel.findById(volumeCheckId)];
                    case 1:
                        volumeCheck = _a.sent();
                        if (!volumeCheck) {
                            return [2 /*return*/, false];
                        }
                        // ユーザーIDが指定されている場合、権限チェック
                        if (userId && volumeCheck.userId && volumeCheck.userId !== userId) {
                            // 管理者権限のチェックなどの追加ロジックをここに実装
                            // 将来的な拡張のためのプレースホルダー
                            // 現状ではシンプルにユーザーIDが一致するかのみをチェック
                            utils_1.logger.warn('ボリュームチェック結果削除の権限なし', { userId: userId, volumeCheckId: volumeCheckId });
                            return [2 /*return*/, false];
                        }
                        // 関連する収益性試算結果を削除
                        return [4 /*yield*/, models_1.ProfitabilityModel.deleteByVolumeCheckId(volumeCheckId)];
                    case 2:
                        // 関連する収益性試算結果を削除
                        _a.sent();
                        // 関連するシナリオを削除
                        return [4 /*yield*/, models_1.ScenarioModel.deleteByVolumeCheckId(volumeCheckId)];
                    case 3:
                        // 関連するシナリオを削除
                        _a.sent();
                        return [4 /*yield*/, models_1.VolumeCheckModel.delete(volumeCheckId)];
                    case 4: 
                    // 結果の削除
                    return [2 /*return*/, _a.sent()];
                    case 5:
                        error_4 = _a.sent();
                        utils_1.logger.error('ボリュームチェック結果削除エラー', { error: error_4, volumeCheckId: volumeCheckId });
                        throw error_4;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    return VolumeCheckService;
}());
exports.VolumeCheckService = VolumeCheckService;
/**
 * 収益性試算サービスクラス
 */
var ProfitabilityService = /** @class */ (function () {
    function ProfitabilityService() {
    }
    /**
     * 収益性試算を実行
     * @param propertyId 物件ID
     * @param volumeCheckId ボリュームチェック結果ID
     * @param financialParams 財務パラメータ
     * @param userId ユーザーID
     * @returns 収益性試算結果
     */
    ProfitabilityService.executeProfitability = function (propertyId, volumeCheckId, financialParams, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var property, volumeCheck, profitabilityData, profitability, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        return [4 /*yield*/, models_1.PropertyModel.findById(propertyId)];
                    case 1:
                        property = _a.sent();
                        if (!property) {
                            throw new Error("\u7269\u4EF6\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093 (ID: ".concat(propertyId, ")"));
                        }
                        return [4 /*yield*/, models_1.VolumeCheckModel.findById(volumeCheckId)];
                    case 2:
                        volumeCheck = _a.sent();
                        if (!volumeCheck) {
                            throw new Error("\u30DC\u30EA\u30E5\u30FC\u30E0\u30C1\u30A7\u30C3\u30AF\u7D50\u679C\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093 (ID: ".concat(volumeCheckId, ")"));
                        }
                        // ボリュームチェック結果と物件IDの関連性チェック
                        if (volumeCheck.propertyId !== propertyId) {
                            throw new Error("\u6307\u5B9A\u3055\u308C\u305F\u30DC\u30EA\u30E5\u30FC\u30E0\u30C1\u30A7\u30C3\u30AF\u7D50\u679C\u306F\u3001\u6307\u5B9A\u3055\u308C\u305F\u7269\u4EF6\u306B\u95A2\u9023\u4ED8\u3051\u3089\u308C\u3066\u3044\u307E\u305B\u3093");
                        }
                        return [4 /*yield*/, (0, analysis_utils_1.calculateProfitability)(property, volumeCheck, financialParams, userId)];
                    case 3:
                        profitabilityData = _a.sent();
                        return [4 /*yield*/, models_1.ProfitabilityModel.create(profitabilityData)];
                    case 4:
                        profitability = _a.sent();
                        return [2 /*return*/, profitability];
                    case 5:
                        error_5 = _a.sent();
                        utils_1.logger.error('収益性試算実行エラー', {
                            error: error_5,
                            propertyId: propertyId,
                            volumeCheckId: volumeCheckId
                        });
                        throw error_5;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 収益性試算結果を取得
     * @param profitabilityId 収益性試算結果ID
     * @returns 収益性試算結果
     */
    ProfitabilityService.getProfitabilityById = function (profitabilityId) {
        return __awaiter(this, void 0, void 0, function () {
            var error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, models_1.ProfitabilityModel.findById(profitabilityId)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_6 = _a.sent();
                        utils_1.logger.error('収益性試算結果取得エラー', { error: error_6, profitabilityId: profitabilityId });
                        throw error_6;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 物件に関連する収益性試算結果を取得
     * @param propertyId 物件ID
     * @param page ページ番号
     * @param limit 1ページあたりの件数
     * @returns 収益性試算結果リストとメタデータ
     */
    ProfitabilityService.getProfitabilitiesByPropertyId = function (propertyId_1) {
        return __awaiter(this, arguments, void 0, function (propertyId, page, limit) {
            var error_7;
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 10; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, models_1.ProfitabilityModel.findByPropertyId(propertyId, page, limit)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_7 = _a.sent();
                        utils_1.logger.error('物件関連収益性試算結果取得エラー', { error: error_7, propertyId: propertyId });
                        throw error_7;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * ボリュームチェック結果に関連する収益性試算結果を取得
     * @param volumeCheckId ボリュームチェック結果ID
     * @param page ページ番号
     * @param limit 1ページあたりの件数
     * @returns 収益性試算結果リストとメタデータ
     */
    ProfitabilityService.getProfitabilitiesByVolumeCheckId = function (volumeCheckId_1) {
        return __awaiter(this, arguments, void 0, function (volumeCheckId, page, limit) {
            var error_8;
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 10; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, models_1.ProfitabilityModel.findByVolumeCheckId(volumeCheckId, page, limit)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_8 = _a.sent();
                        utils_1.logger.error('ボリュームチェック関連収益性試算結果取得エラー', { error: error_8, volumeCheckId: volumeCheckId });
                        throw error_8;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 収益性試算結果を削除
     * @param profitabilityId 収益性試算結果ID
     * @param userId ユーザーID（権限チェック用）
     * @returns 削除が成功したかどうか
     */
    ProfitabilityService.deleteProfitability = function (profitabilityId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var profitability, scenariosResult, _i, _a, scenario, error_9;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 8, , 9]);
                        return [4 /*yield*/, models_1.ProfitabilityModel.findById(profitabilityId)];
                    case 1:
                        profitability = _b.sent();
                        if (!profitability) {
                            return [2 /*return*/, false];
                        }
                        // ユーザーIDが指定されている場合、権限チェック
                        if (userId && profitability.userId && profitability.userId !== userId) {
                            // 管理者権限のチェックなどの追加ロジックをここに実装
                            // 将来的な拡張のためのプレースホルダー
                            // 現状ではシンプルにユーザーIDが一致するかのみをチェック
                            utils_1.logger.warn('収益性試算結果削除の権限なし', { userId: userId, profitabilityId: profitabilityId });
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, models_1.ScenarioModel.findAll({ profitabilityResult: profitabilityId })];
                    case 2:
                        scenariosResult = _b.sent();
                        _i = 0, _a = scenariosResult.scenarios;
                        _b.label = 3;
                    case 3:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        scenario = _a[_i];
                        return [4 /*yield*/, models_1.ScenarioModel.update(scenario.id, { profitabilityResult: undefined })];
                    case 4:
                        _b.sent();
                        _b.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6: return [4 /*yield*/, models_1.ProfitabilityModel.delete(profitabilityId)];
                    case 7: 
                    // 結果の削除
                    return [2 /*return*/, _b.sent()];
                    case 8:
                        error_9 = _b.sent();
                        utils_1.logger.error('収益性試算結果削除エラー', { error: error_9, profitabilityId: profitabilityId });
                        throw error_9;
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    return ProfitabilityService;
}());
exports.ProfitabilityService = ProfitabilityService;
/**
 * シナリオサービスクラス
 */
var ScenarioService = /** @class */ (function () {
    function ScenarioService() {
    }
    /**
     * シナリオを作成
     * @param propertyId 物件ID
     * @param volumeCheckId ボリュームチェック結果ID
     * @param name シナリオ名
     * @param params シナリオパラメータ
     * @param userId ユーザーID
     * @returns 作成されたシナリオ
     */
    ScenarioService.createScenario = function (propertyId, volumeCheckId, name, params, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var property, volumeCheck, scenarioData, scenario, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, models_1.PropertyModel.findById(propertyId)];
                    case 1:
                        property = _a.sent();
                        if (!property) {
                            throw new Error("\u7269\u4EF6\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093 (ID: ".concat(propertyId, ")"));
                        }
                        return [4 /*yield*/, models_1.VolumeCheckModel.findById(volumeCheckId)];
                    case 2:
                        volumeCheck = _a.sent();
                        if (!volumeCheck) {
                            throw new Error("\u30DC\u30EA\u30E5\u30FC\u30E0\u30C1\u30A7\u30C3\u30AF\u7D50\u679C\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093 (ID: ".concat(volumeCheckId, ")"));
                        }
                        // ボリュームチェック結果と物件IDの関連性チェック
                        if (volumeCheck.propertyId !== propertyId) {
                            throw new Error("\u6307\u5B9A\u3055\u308C\u305F\u30DC\u30EA\u30E5\u30FC\u30E0\u30C1\u30A7\u30C3\u30AF\u7D50\u679C\u306F\u3001\u6307\u5B9A\u3055\u308C\u305F\u7269\u4EF6\u306B\u95A2\u9023\u4ED8\u3051\u3089\u308C\u3066\u3044\u307E\u305B\u3093");
                        }
                        scenarioData = {
                            propertyId: propertyId,
                            volumeCheckId: volumeCheckId,
                            name: name,
                            params: params,
                            userId: userId
                        };
                        return [4 /*yield*/, models_1.ScenarioModel.create(scenarioData)];
                    case 3:
                        scenario = _a.sent();
                        return [2 /*return*/, scenario];
                    case 4:
                        error_10 = _a.sent();
                        utils_1.logger.error('シナリオ作成エラー', {
                            error: error_10,
                            propertyId: propertyId,
                            volumeCheckId: volumeCheckId
                        });
                        throw error_10;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 既存のシナリオを更新
     * @param scenarioId シナリオID
     * @param updateData 更新データ
     * @param userId ユーザーID（権限チェック用）
     * @returns 更新されたシナリオまたはnull
     */
    ScenarioService.updateScenario = function (scenarioId, updateData, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var scenario, error_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, models_1.ScenarioModel.findById(scenarioId)];
                    case 1:
                        scenario = _a.sent();
                        if (!scenario) {
                            return [2 /*return*/, null];
                        }
                        // ユーザーIDが指定されている場合、権限チェック
                        if (userId && scenario.userId && scenario.userId !== userId) {
                            // 管理者権限のチェックなどの追加ロジックをここに実装
                            // 将来的な拡張のためのプレースホルダー
                            // 現状ではシンプルにユーザーIDが一致するかのみをチェック
                            utils_1.logger.warn('シナリオ更新の権限なし', { userId: userId, scenarioId: scenarioId });
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, models_1.ScenarioModel.update(scenarioId, updateData)];
                    case 2: 
                    // シナリオの更新
                    return [2 /*return*/, _a.sent()];
                    case 3:
                        error_11 = _a.sent();
                        utils_1.logger.error('シナリオ更新エラー', { error: error_11, scenarioId: scenarioId });
                        throw error_11;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * シナリオを取得
     * @param scenarioId シナリオID
     * @param includeProfitability 収益性試算結果を含めるかどうか
     * @returns シナリオ
     */
    ScenarioService.getScenarioById = function (scenarioId_1) {
        return __awaiter(this, arguments, void 0, function (scenarioId, includeProfitability) {
            var error_12;
            if (includeProfitability === void 0) { includeProfitability = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, models_1.ScenarioModel.findById(scenarioId, includeProfitability)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_12 = _a.sent();
                        utils_1.logger.error('シナリオ取得エラー', { error: error_12, scenarioId: scenarioId });
                        throw error_12;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 物件に関連するシナリオを取得
     * @param propertyId 物件ID
     * @param page ページ番号
     * @param limit 1ページあたりの件数
     * @returns シナリオリストとメタデータ
     */
    ScenarioService.getScenariosByPropertyId = function (propertyId_1) {
        return __awaiter(this, arguments, void 0, function (propertyId, page, limit) {
            var error_13;
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 10; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, models_1.ScenarioModel.findByPropertyId(propertyId, page, limit)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_13 = _a.sent();
                        utils_1.logger.error('物件関連シナリオ取得エラー', { error: error_13, propertyId: propertyId });
                        throw error_13;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * ボリュームチェック結果に関連するシナリオを取得
     * @param volumeCheckId ボリュームチェック結果ID
     * @param page ページ番号
     * @param limit 1ページあたりの件数
     * @returns シナリオリストとメタデータ
     */
    ScenarioService.getScenariosByVolumeCheckId = function (volumeCheckId_1) {
        return __awaiter(this, arguments, void 0, function (volumeCheckId, page, limit) {
            var error_14;
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 10; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, models_1.ScenarioModel.findByVolumeCheckId(volumeCheckId, page, limit)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_14 = _a.sent();
                        utils_1.logger.error('ボリュームチェック関連シナリオ取得エラー', { error: error_14, volumeCheckId: volumeCheckId });
                        throw error_14;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * シナリオを削除
     * @param scenarioId シナリオID
     * @param userId ユーザーID（権限チェック用）
     * @returns 削除が成功したかどうか
     */
    ScenarioService.deleteScenario = function (scenarioId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var scenario, error_15;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, models_1.ScenarioModel.findById(scenarioId)];
                    case 1:
                        scenario = _a.sent();
                        if (!scenario) {
                            return [2 /*return*/, false];
                        }
                        // ユーザーIDが指定されている場合、権限チェック
                        if (userId && scenario.userId && scenario.userId !== userId) {
                            // 管理者権限のチェックなどの追加ロジックをここに実装
                            // 将来的な拡張のためのプレースホルダー
                            // 現状ではシンプルにユーザーIDが一致するかのみをチェック
                            utils_1.logger.warn('シナリオ削除の権限なし', { userId: userId, scenarioId: scenarioId });
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, models_1.ScenarioModel.delete(scenarioId)];
                    case 2: 
                    // シナリオの削除
                    return [2 /*return*/, _a.sent()];
                    case 3:
                        error_15 = _a.sent();
                        utils_1.logger.error('シナリオ削除エラー', { error: error_15, scenarioId: scenarioId });
                        throw error_15;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * シナリオに収益性試算結果を関連付ける
     * @param scenarioId シナリオID
     * @param profitabilityId 収益性試算結果ID
     * @param userId ユーザーID（権限チェック用）
     * @returns 更新されたシナリオまたはnull
     */
    ScenarioService.linkScenarioToProfitability = function (scenarioId, profitabilityId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var scenario, profitability, error_16;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, models_1.ScenarioModel.findById(scenarioId)];
                    case 1:
                        scenario = _a.sent();
                        if (!scenario) {
                            return [2 /*return*/, null];
                        }
                        // ユーザーIDが指定されている場合、権限チェック
                        if (userId && scenario.userId && scenario.userId !== userId) {
                            // 管理者権限のチェックなどの追加ロジックをここに実装
                            // 将来的な拡張のためのプレースホルダー
                            // 現状ではシンプルにユーザーIDが一致するかのみをチェック
                            utils_1.logger.warn('シナリオ更新の権限なし', { userId: userId, scenarioId: scenarioId });
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, models_1.ProfitabilityModel.findById(profitabilityId)];
                    case 2:
                        profitability = _a.sent();
                        if (!profitability) {
                            throw new Error("\u53CE\u76CA\u6027\u8A66\u7B97\u7D50\u679C\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093 (ID: ".concat(profitabilityId, ")"));
                        }
                        // 関連付けの整合性チェック
                        if (profitability.propertyId !== scenario.propertyId ||
                            profitability.volumeCheckId !== scenario.volumeCheckId) {
                            throw new Error('シナリオと収益性試算結果の関連付けが一致しません');
                        }
                        return [4 /*yield*/, models_1.ScenarioModel.linkToProfitabilityResult(scenarioId, profitabilityId)];
                    case 3: 
                    // シナリオの更新
                    return [2 /*return*/, _a.sent()];
                    case 4:
                        error_16 = _a.sent();
                        utils_1.logger.error('シナリオと収益性試算結果の関連付けエラー', {
                            error: error_16,
                            scenarioId: scenarioId,
                            profitabilityId: profitabilityId
                        });
                        throw error_16;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * シナリオから収益性試算を実行
     * @param scenarioId シナリオID
     * @param userId ユーザーID
     * @returns 収益性試算結果
     */
    ScenarioService.executeProfitabilityFromScenario = function (scenarioId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var scenario, profitability, error_17;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, models_1.ScenarioModel.findById(scenarioId)];
                    case 1:
                        scenario = _a.sent();
                        if (!scenario) {
                            throw new Error("\u30B7\u30CA\u30EA\u30AA\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093 (ID: ".concat(scenarioId, ")"));
                        }
                        return [4 /*yield*/, ProfitabilityService.executeProfitability(scenario.propertyId, scenario.volumeCheckId, scenario.params, userId)];
                    case 2:
                        profitability = _a.sent();
                        // シナリオと収益性試算結果を関連付け
                        return [4 /*yield*/, models_1.ScenarioModel.linkToProfitabilityResult(scenarioId, profitability.id)];
                    case 3:
                        // シナリオと収益性試算結果を関連付け
                        _a.sent();
                        return [2 /*return*/, profitability];
                    case 4:
                        error_17 = _a.sent();
                        utils_1.logger.error('シナリオからの収益性試算実行エラー', { error: error_17, scenarioId: scenarioId });
                        throw error_17;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    return ScenarioService;
}());
exports.ScenarioService = ScenarioService;
