"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.ScenarioModel = void 0;
var scenario_schema_1 = require("./schemas/scenario.schema");
var utils_1 = require("../../common/utils");
var mongoose_1 = require("mongoose");
/**
 * シナリオモデルのクラス
 */
var ScenarioModel = /** @class */ (function () {
    function ScenarioModel() {
    }
    /**
     * シナリオ一覧を取得（フィルター条件指定可能）
     * @param filter フィルター条件
     * @param page ページ番号（1から開始）
     * @param limit 1ページあたりの件数
     * @param sort ソート条件
     * @returns シナリオリストとメタデータ
     */
    ScenarioModel.findAll = function () {
        return __awaiter(this, arguments, void 0, function (filter, page, limit, sort) {
            var skip, total, scenarios, totalPages, formattedScenarios, error_1;
            if (filter === void 0) { filter = {}; }
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 20; }
            if (sort === void 0) { sort = { createdAt: -1 }; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        skip = (page - 1) * limit;
                        return [4 /*yield*/, scenario_schema_1.ScenarioModel.countDocuments(filter)];
                    case 1:
                        total = _a.sent();
                        return [4 /*yield*/, scenario_schema_1.ScenarioModel.find(filter)
                                .sort(sort)
                                .skip(skip)
                                .limit(limit)
                                .lean()];
                    case 2:
                        scenarios = _a.sent();
                        totalPages = Math.ceil(total / limit);
                        formattedScenarios = scenarios.map(function (scenario) { return (__assign(__assign({}, scenario), { id: String(scenario._id) })); });
                        return [2 /*return*/, {
                                scenarios: formattedScenarios,
                                total: total,
                                page: page,
                                limit: limit,
                                totalPages: totalPages
                            }];
                    case 3:
                        error_1 = _a.sent();
                        utils_1.logger.error('シナリオ一覧取得エラー', { error: error_1, filter: filter });
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 物件IDでシナリオ一覧を取得
     * @param propertyId 物件ID
     * @param page ページ番号（1から開始）
     * @param limit 1ページあたりの件数
     * @returns シナリオリストとメタデータ
     */
    ScenarioModel.findByPropertyId = function (propertyId_1) {
        return __awaiter(this, arguments, void 0, function (propertyId, page, limit) {
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 20; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.findAll({ propertyId: propertyId }, page, limit)];
            });
        });
    };
    /**
     * ボリュームチェックIDでシナリオ一覧を取得
     * @param volumeCheckId ボリュームチェックID
     * @param page ページ番号（1から開始）
     * @param limit 1ページあたりの件数
     * @returns シナリオリストとメタデータ
     */
    ScenarioModel.findByVolumeCheckId = function (volumeCheckId_1) {
        return __awaiter(this, arguments, void 0, function (volumeCheckId, page, limit) {
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 20; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.findAll({ volumeCheckId: volumeCheckId }, page, limit)];
            });
        });
    };
    /**
     * IDでシナリオを検索
     * @param id シナリオID
     * @param includeProfitability 収益性試算結果を含めるかどうか
     * @returns シナリオオブジェクトまたはnull
     */
    ScenarioModel.findById = function (id_1) {
        return __awaiter(this, arguments, void 0, function (id, includeProfitability) {
            var query, scenario, error_2;
            if (includeProfitability === void 0) { includeProfitability = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // IDが有効なMongoDBのObjectIDかチェック
                        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                            return [2 /*return*/, null];
                        }
                        query = scenario_schema_1.ScenarioModel.findById(id);
                        // 収益性試算結果を含める場合
                        if (includeProfitability) {
                            query = query.populate('profitabilityResult');
                        }
                        return [4 /*yield*/, query.lean()];
                    case 1:
                        scenario = _a.sent();
                        if (!scenario)
                            return [2 /*return*/, null];
                        // _id を id に変換
                        return [2 /*return*/, __assign(__assign({}, scenario), { id: String(scenario._id) })];
                    case 2:
                        error_2 = _a.sent();
                        utils_1.logger.error('シナリオ検索エラー', { error: error_2, id: id });
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 新しいシナリオを作成
     * @param scenarioData シナリオデータ
     * @returns 作成されたシナリオオブジェクト
     */
    ScenarioModel.create = function (scenarioData) {
        return __awaiter(this, void 0, void 0, function () {
            var newScenario, scenarioObject, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, scenario_schema_1.ScenarioModel.create(scenarioData)];
                    case 1:
                        newScenario = _a.sent();
                        scenarioObject = newScenario.toObject();
                        // _id を id に変換
                        return [2 /*return*/, __assign(__assign({}, scenarioObject), { id: String(scenarioObject._id) })];
                    case 2:
                        error_3 = _a.sent();
                        utils_1.logger.error('シナリオ作成エラー', { error: error_3 });
                        throw error_3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * シナリオを更新
     * @param id シナリオID
     * @param updateData 更新データ
     * @returns 更新されたシナリオオブジェクト
     */
    ScenarioModel.update = function (id, updateData) {
        return __awaiter(this, void 0, void 0, function () {
            var updatedScenario, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, scenario_schema_1.ScenarioModel.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true }).lean()];
                    case 1:
                        updatedScenario = _a.sent();
                        if (!updatedScenario)
                            return [2 /*return*/, null];
                        // _id を id に変換
                        return [2 /*return*/, __assign(__assign({}, updatedScenario), { id: String(updatedScenario._id) })];
                    case 2:
                        error_4 = _a.sent();
                        utils_1.logger.error('シナリオ更新エラー', { error: error_4, id: id });
                        throw error_4;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * シナリオを削除
     * @param id シナリオID
     * @returns 削除が成功したかどうか
     */
    ScenarioModel.delete = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, scenario_schema_1.ScenarioModel.findByIdAndDelete(id)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, !!result];
                    case 2:
                        error_5 = _a.sent();
                        utils_1.logger.error('シナリオ削除エラー', { error: error_5, id: id });
                        throw error_5;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 物件IDに関連するすべてのシナリオを削除
     * （物件が削除される際などに使用）
     * @param propertyId 物件ID
     * @returns 削除された件数
     */
    ScenarioModel.deleteByPropertyId = function (propertyId) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, scenario_schema_1.ScenarioModel.deleteMany({ propertyId: propertyId })];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.deletedCount || 0];
                    case 2:
                        error_6 = _a.sent();
                        utils_1.logger.error('物件IDによるシナリオ削除エラー', { error: error_6, propertyId: propertyId });
                        throw error_6;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * ボリュームチェックIDに関連するすべてのシナリオを削除
     * （ボリュームチェック結果が削除される際などに使用）
     * @param volumeCheckId ボリュームチェックID
     * @returns 削除された件数
     */
    ScenarioModel.deleteByVolumeCheckId = function (volumeCheckId) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, scenario_schema_1.ScenarioModel.deleteMany({ volumeCheckId: volumeCheckId })];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.deletedCount || 0];
                    case 2:
                        error_7 = _a.sent();
                        utils_1.logger.error('ボリュームチェックIDによるシナリオ削除エラー', { error: error_7, volumeCheckId: volumeCheckId });
                        throw error_7;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * シナリオに収益性試算結果を関連付ける
     * @param scenarioId シナリオID
     * @param profitabilityId 収益性試算結果ID
     * @returns 更新されたシナリオオブジェクト
     */
    ScenarioModel.linkToProfitabilityResult = function (scenarioId, profitabilityId) {
        return __awaiter(this, void 0, void 0, function () {
            var updatedDoc;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, scenario_schema_1.ScenarioModel.findByIdAndUpdate(scenarioId, { $set: { profitabilityResult: profitabilityId } }, { new: true, runValidators: true }).lean()];
                    case 1:
                        updatedDoc = _a.sent();
                        if (!updatedDoc)
                            return [2 /*return*/, null];
                        // _id を id に変換した結果オブジェクトを返す
                        return [2 /*return*/, __assign(__assign({}, updatedDoc), { id: String(updatedDoc._id) })];
                }
            });
        });
    };
    return ScenarioModel;
}());
exports.ScenarioModel = ScenarioModel;
exports.default = ScenarioModel;
