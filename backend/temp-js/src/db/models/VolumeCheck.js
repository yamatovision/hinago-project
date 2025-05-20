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
exports.VolumeCheckModel = void 0;
var volumeCheck_schema_1 = require("./schemas/volumeCheck.schema");
var utils_1 = require("../../common/utils");
var mongoose_1 = require("mongoose");
/**
 * ボリュームチェックモデルのクラス
 */
var VolumeCheckModel = /** @class */ (function () {
    function VolumeCheckModel() {
    }
    /**
     * ボリュームチェック結果一覧を取得（物件IDでフィルタリング可能）
     * @param filter フィルター条件
     * @param page ページ番号（1から開始）
     * @param limit 1ページあたりの件数
     * @param sort ソート条件
     * @returns ボリュームチェック結果リストとメタデータ
     */
    VolumeCheckModel.findAll = function () {
        return __awaiter(this, arguments, void 0, function (filter, page, limit, sort) {
            var skip, total, volumeChecks, totalPages, formattedVolumeChecks, error_1;
            if (filter === void 0) { filter = {}; }
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 20; }
            if (sort === void 0) { sort = { createdAt: -1 }; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        skip = (page - 1) * limit;
                        return [4 /*yield*/, volumeCheck_schema_1.VolumeCheckModel.countDocuments(filter)];
                    case 1:
                        total = _a.sent();
                        return [4 /*yield*/, volumeCheck_schema_1.VolumeCheckModel.find(filter)
                                .sort(sort)
                                .skip(skip)
                                .limit(limit)
                                .lean()];
                    case 2:
                        volumeChecks = _a.sent();
                        totalPages = Math.ceil(total / limit);
                        formattedVolumeChecks = volumeChecks.map(function (volumeCheck) { return (__assign(__assign({}, volumeCheck), { id: String(volumeCheck._id) })); });
                        return [2 /*return*/, {
                                volumeChecks: formattedVolumeChecks,
                                total: total,
                                page: page,
                                limit: limit,
                                totalPages: totalPages
                            }];
                    case 3:
                        error_1 = _a.sent();
                        utils_1.logger.error('ボリュームチェック結果一覧取得エラー', { error: error_1, filter: filter });
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 物件IDでボリュームチェック結果一覧を取得
     * @param propertyId 物件ID
     * @param page ページ番号（1から開始）
     * @param limit 1ページあたりの件数
     * @returns ボリュームチェック結果リストとメタデータ
     */
    VolumeCheckModel.findByPropertyId = function (propertyId_1) {
        return __awaiter(this, arguments, void 0, function (propertyId, page, limit) {
            if (page === void 0) { page = 1; }
            if (limit === void 0) { limit = 20; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.findAll({ propertyId: propertyId }, page, limit)];
            });
        });
    };
    /**
     * IDでボリュームチェック結果を検索
     * @param id ボリュームチェック結果ID
     * @returns ボリュームチェック結果オブジェクトまたはnull
     */
    VolumeCheckModel.findById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var volumeCheck, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // IDが有効なMongoDBのObjectIDかチェック
                        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, volumeCheck_schema_1.VolumeCheckModel.findById(id).lean()];
                    case 1:
                        volumeCheck = _a.sent();
                        if (!volumeCheck)
                            return [2 /*return*/, null];
                        // _id を id に変換
                        return [2 /*return*/, __assign(__assign({}, volumeCheck), { id: String(volumeCheck._id) })];
                    case 2:
                        error_2 = _a.sent();
                        utils_1.logger.error('ボリュームチェック結果検索エラー', { error: error_2, id: id });
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 新しいボリュームチェック結果を作成
     * @param volumeCheckData ボリュームチェックデータ
     * @returns 作成されたボリュームチェック結果オブジェクト
     */
    VolumeCheckModel.create = function (volumeCheckData) {
        return __awaiter(this, void 0, void 0, function () {
            var newVolumeCheck, volumeCheckObject, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, volumeCheck_schema_1.VolumeCheckModel.create(volumeCheckData)];
                    case 1:
                        newVolumeCheck = _a.sent();
                        volumeCheckObject = newVolumeCheck.toObject();
                        // _id を id に変換
                        return [2 /*return*/, __assign(__assign({}, volumeCheckObject), { id: String(volumeCheckObject._id) })];
                    case 2:
                        error_3 = _a.sent();
                        utils_1.logger.error('ボリュームチェック結果作成エラー', { error: error_3 });
                        throw error_3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * ボリュームチェック結果を削除
     * @param id ボリュームチェック結果ID
     * @returns 削除が成功したかどうか
     */
    VolumeCheckModel.delete = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, volumeCheck_schema_1.VolumeCheckModel.findByIdAndDelete(id)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, !!result];
                    case 2:
                        error_4 = _a.sent();
                        utils_1.logger.error('ボリュームチェック結果削除エラー', { error: error_4, id: id });
                        throw error_4;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 物件IDに関連するすべてのボリュームチェック結果を削除
     * （物件が削除される際などに使用）
     * @param propertyId 物件ID
     * @returns 削除された件数
     */
    VolumeCheckModel.deleteByPropertyId = function (propertyId) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, volumeCheck_schema_1.VolumeCheckModel.deleteMany({ propertyId: propertyId })];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.deletedCount || 0];
                    case 2:
                        error_5 = _a.sent();
                        utils_1.logger.error('物件IDによるボリュームチェック結果削除エラー', { error: error_5, propertyId: propertyId });
                        throw error_5;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return VolumeCheckModel;
}());
exports.VolumeCheckModel = VolumeCheckModel;
exports.default = VolumeCheckModel;
