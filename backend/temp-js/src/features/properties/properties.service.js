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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDocument = exports.getDocuments = exports.uploadDocument = exports.updatePropertyShape = exports.processSurveyMap = exports.deleteProperty = exports.updateProperty = exports.getPropertyById = exports.createProperty = exports.getProperties = void 0;
/**
 * 物件サービス
 *
 * 物件に関連するビジネスロジックを提供します。
 */
var models_1 = require("../../db/models");
var utils_1 = require("../../common/utils");
var middlewares_1 = require("../../common/middlewares");
var path_1 = require("path");
var fs_1 = require("fs");
/**
 * 物件一覧を取得
 * @param filter フィルター条件
 * @param page ページ番号
 * @param limit 1ページあたりの件数
 * @param sort ソート条件
 * @returns 物件リストとページネーション情報
 */
var getProperties = function () {
    var args_1 = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args_1[_i] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (filter, page, limit, sort) {
        var sortObj_1, result, error_1;
        if (filter === void 0) { filter = {}; }
        if (page === void 0) { page = 1; }
        if (limit === void 0) { limit = 20; }
        if (sort === void 0) { sort = 'updatedAt:desc'; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    sortObj_1 = {};
                    sort.split(',').forEach(function (s) {
                        var _a = s.split(':'), field = _a[0], order = _a[1];
                        sortObj_1[field] = order === 'desc' ? -1 : 1;
                    });
                    return [4 /*yield*/, models_1.PropertyModel.findAll(filter, page, limit, sortObj_1)];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, {
                            properties: result.properties,
                            meta: {
                                total: result.total,
                                page: result.page,
                                limit: result.limit,
                                totalPages: result.totalPages
                            }
                        }];
                case 2:
                    error_1 = _a.sent();
                    utils_1.logger.error('物件一覧取得エラー', { error: error_1 });
                    throw error_1;
                case 3: return [2 /*return*/];
            }
        });
    });
};
exports.getProperties = getProperties;
/**
 * 物件を作成
 * @param propertyData 物件データ
 * @param userId 作成ユーザーID
 * @returns 作成された物件
 */
var createProperty = function (propertyData, userId) { return __awaiter(void 0, void 0, void 0, function () {
    var data, property, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                data = __assign(__assign({}, propertyData), { userId: userId });
                return [4 /*yield*/, models_1.PropertyModel.create(data)];
            case 1:
                property = _a.sent();
                return [2 /*return*/, property];
            case 2:
                error_2 = _a.sent();
                utils_1.logger.error('物件作成エラー', { error: error_2 });
                throw error_2;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.createProperty = createProperty;
/**
 * IDで物件を取得
 * @param id 物件ID
 * @returns 物件オブジェクトまたはnull
 */
var getPropertyById = function (id) { return __awaiter(void 0, void 0, void 0, function () {
    var error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, models_1.PropertyModel.findById(id)];
            case 1: return [2 /*return*/, _a.sent()];
            case 2:
                error_3 = _a.sent();
                utils_1.logger.error('物件取得エラー', { error: error_3, id: id });
                throw error_3;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getPropertyById = getPropertyById;
/**
 * 物件を更新
 * @param id 物件ID
 * @param propertyData 更新する物件データ
 * @returns 更新された物件オブジェクトまたはnull
 */
var updateProperty = function (id, propertyData) { return __awaiter(void 0, void 0, void 0, function () {
    var error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, models_1.PropertyModel.update(id, propertyData)];
            case 1: return [2 /*return*/, _a.sent()];
            case 2:
                error_4 = _a.sent();
                utils_1.logger.error('物件更新エラー', { error: error_4, id: id });
                throw error_4;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.updateProperty = updateProperty;
/**
 * 物件を削除
 * @param id 物件ID
 * @returns 削除が成功したかどうか
 */
var deleteProperty = function (id) { return __awaiter(void 0, void 0, void 0, function () {
    var error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                // 関連する文書も削除
                return [4 /*yield*/, models_1.DocumentModel.deleteByPropertyId(id)];
            case 1:
                // 関連する文書も削除
                _a.sent();
                return [4 /*yield*/, models_1.PropertyModel.delete(id)];
            case 2: 
            // 物件を削除
            return [2 /*return*/, _a.sent()];
            case 3:
                error_5 = _a.sent();
                utils_1.logger.error('物件削除エラー', { error: error_5, id: id });
                throw error_5;
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.deleteProperty = deleteProperty;
/**
 * 測量図から敷地形状データを抽出
 * @param file アップロードされたファイル
 * @param propertyId 関連付ける物件ID（任意）
 * @returns 敷地形状データとドキュメントID
 */
var processSurveyMap = function (file, propertyId) { return __awaiter(void 0, void 0, void 0, function () {
    var shapeData, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                shapeData = (0, middlewares_1.extractShapeFromFile)(file);
                if (!propertyId) return [3 /*break*/, 2];
                return [4 /*yield*/, (0, exports.updatePropertyShape)(propertyId, shapeData)];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2: 
            // 形状データとファイルURLを返す
            return [2 /*return*/, {
                    shapeData: shapeData,
                    sourceFile: (0, middlewares_1.getFileUrl)(file)
                }];
            case 3:
                error_6 = _a.sent();
                // エラー時はファイルを削除
                if (file.path) {
                    try {
                        fs_1.default.unlinkSync(file.path);
                    }
                    catch (unlinkError) {
                        utils_1.logger.error('アップロードファイル削除エラー', { error: unlinkError });
                    }
                }
                utils_1.logger.error('測量図処理エラー', { error: error_6 });
                throw error_6;
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.processSurveyMap = processSurveyMap;
/**
 * 物件の敷地形状データを更新
 * @param id 物件ID
 * @param shapeData 敷地形状データ
 * @returns 更新された物件
 */
var updatePropertyShape = function (id, shapeData) { return __awaiter(void 0, void 0, void 0, function () {
    var property, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, models_1.PropertyModel.findById(id)];
            case 1:
                property = _a.sent();
                if (!property) {
                    return [2 /*return*/, null];
                }
                return [4 /*yield*/, models_1.PropertyModel.update(id, {
                        shapeData: shapeData,
                        // 敷地面積を更新 - ポリゴンから計算するロジックを実装する場合はここで行う
                        // ここでは単純に矩形の面積として計算（実際には複雑な形状の場合は別のアルゴリズムが必要）
                        area: shapeData.width && shapeData.depth ? shapeData.width * shapeData.depth : property.area
                    })];
            case 2: 
            // 敷地形状データを更新
            return [2 /*return*/, _a.sent()];
            case 3:
                error_7 = _a.sent();
                utils_1.logger.error('敷地形状更新エラー', { error: error_7, id: id });
                throw error_7;
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.updatePropertyShape = updatePropertyShape;
/**
 * 物件文書をアップロード
 * @param propertyId 物件ID
 * @param documentType 文書タイプ
 * @param file アップロードファイル
 * @param description 説明（任意）
 * @param userId アップロードユーザーID（任意）
 * @returns 作成された文書オブジェクト
 */
var uploadDocument = function (propertyId, documentType, file, description, userId) { return __awaiter(void 0, void 0, void 0, function () {
    var property, fileType, documentData, document_1, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, models_1.PropertyModel.findById(propertyId)];
            case 1:
                property = _a.sent();
                if (!property) {
                    throw new Error('指定された物件が見つかりません');
                }
                fileType = file.mimetype;
                documentData = {
                    propertyId: propertyId,
                    name: path_1.default.basename(file.originalname), // オリジナルのファイル名を使用
                    fileType: fileType,
                    fileSize: file.size,
                    fileUrl: (0, middlewares_1.getFileUrl)(file),
                    documentType: documentType,
                    description: description,
                    userId: userId
                };
                return [4 /*yield*/, models_1.DocumentModel.create(documentData)];
            case 2:
                document_1 = _a.sent();
                utils_1.logger.info("\u6587\u66F8\u304C\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u3055\u308C\u307E\u3057\u305F: ".concat(document_1.id), { propertyId: propertyId, documentType: documentType });
                return [2 /*return*/, document_1];
            case 3:
                error_8 = _a.sent();
                // エラー時はファイルを削除
                if (file && file.path) {
                    try {
                        fs_1.default.unlinkSync(file.path);
                    }
                    catch (unlinkError) {
                        utils_1.logger.error('アップロードファイル削除エラー', { error: unlinkError });
                    }
                }
                utils_1.logger.error('文書アップロードエラー', { error: error_8, propertyId: propertyId });
                throw error_8;
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.uploadDocument = uploadDocument;
/**
 * 物件の文書一覧を取得
 * @param propertyId 物件ID
 * @param documentType 文書タイプでフィルター（任意）
 * @returns 文書リスト
 */
var getDocuments = function (propertyId, documentType) { return __awaiter(void 0, void 0, void 0, function () {
    var property, error_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, models_1.PropertyModel.findById(propertyId)];
            case 1:
                property = _a.sent();
                if (!property) {
                    throw new Error('指定された物件が見つかりません');
                }
                return [4 /*yield*/, models_1.DocumentModel.findByPropertyId(propertyId, documentType)];
            case 2: 
            // 文書を取得
            return [2 /*return*/, _a.sent()];
            case 3:
                error_9 = _a.sent();
                utils_1.logger.error('文書一覧取得エラー', { error: error_9, propertyId: propertyId });
                throw error_9;
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getDocuments = getDocuments;
/**
 * 文書を削除
 * @param propertyId 物件ID
 * @param documentId 文書ID
 * @returns 削除が成功したかどうか
 */
var deleteDocument = function (propertyId, documentId) { return __awaiter(void 0, void 0, void 0, function () {
    var documents, targetDocument, error_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, models_1.DocumentModel.findByPropertyId(propertyId)];
            case 1:
                documents = _a.sent();
                targetDocument = documents.find(function (doc) { return doc.id === documentId; });
                if (!targetDocument) {
                    return [2 /*return*/, false];
                }
                return [4 /*yield*/, models_1.DocumentModel.delete(documentId)];
            case 2: 
            // 文書を削除
            return [2 /*return*/, _a.sent()];
            case 3:
                error_10 = _a.sent();
                utils_1.logger.error('文書削除エラー', { error: error_10, propertyId: propertyId, documentId: documentId });
                throw error_10;
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.deleteDocument = deleteDocument;
