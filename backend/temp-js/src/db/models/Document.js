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
exports.DocumentModel = void 0;
var document_schema_1 = require("./schemas/document.schema");
var utils_1 = require("../../common/utils");
var mongoose_1 = require("mongoose");
var fs_1 = require("fs");
var path_1 = require("path");
/**
 * 文書モデルのクラス
 */
var DocumentModel = /** @class */ (function () {
    function DocumentModel() {
    }
    /**
     * 物件に関連する文書一覧を取得
     * @param propertyId 物件ID
     * @param documentType 文書タイプ（オプション）
     * @returns 文書リスト
     */
    DocumentModel.findByPropertyId = function (propertyId, documentType) {
        return __awaiter(this, void 0, void 0, function () {
            var query, documents, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        query = { propertyId: propertyId };
                        if (documentType) {
                            query.documentType = documentType;
                        }
                        return [4 /*yield*/, document_schema_1.DocumentModel.find(query)
                                .sort({ updatedAt: -1 })
                                .lean()];
                    case 1:
                        documents = _a.sent();
                        // _id を id に変換
                        return [2 /*return*/, documents.map(function (doc) { return (__assign(__assign({}, doc), { id: String(doc._id) })); })];
                    case 2:
                        error_1 = _a.sent();
                        utils_1.logger.error('文書一覧取得エラー', { error: error_1, propertyId: propertyId });
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 文書をIDで検索
     * @param id 文書ID
     * @returns 文書オブジェクトまたはnull
     */
    DocumentModel.findById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var document_1, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // IDが有効なMongoDBのObjectIDかチェック
                        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, document_schema_1.DocumentModel.findById(id).lean()];
                    case 1:
                        document_1 = _a.sent();
                        if (!document_1)
                            return [2 /*return*/, null];
                        // _id を id に変換
                        return [2 /*return*/, __assign(__assign({}, document_1), { id: String(document_1._id) })];
                    case 2:
                        error_2 = _a.sent();
                        utils_1.logger.error('文書検索エラー', { error: error_2, id: id });
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 新しい文書を作成
     * @param documentData 文書データ
     * @returns 作成された文書オブジェクト
     */
    DocumentModel.create = function (documentData) {
        return __awaiter(this, void 0, void 0, function () {
            var newDocument, documentObject, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, document_schema_1.DocumentModel.create(documentData)];
                    case 1:
                        newDocument = _a.sent();
                        documentObject = newDocument.toObject();
                        // _id を id に変換
                        return [2 /*return*/, __assign(__assign({}, documentObject), { id: String(documentObject._id) })];
                    case 2:
                        error_3 = _a.sent();
                        utils_1.logger.error('文書作成エラー', { error: error_3 });
                        throw error_3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 文書を削除
     * @param id 文書ID
     * @returns 削除が成功したかどうか
     */
    DocumentModel.delete = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var document_2, fileUrl, filePath, result, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, document_schema_1.DocumentModel.findById(id)];
                    case 1:
                        document_2 = _a.sent();
                        if (!document_2) {
                            return [2 /*return*/, false];
                        }
                        fileUrl = document_2.fileUrl;
                        filePath = path_1.default.join(process.cwd(), fileUrl.replace(/^\//, ''));
                        return [4 /*yield*/, document_schema_1.DocumentModel.findByIdAndDelete(id)];
                    case 2:
                        result = _a.sent();
                        // ファイルが存在すれば削除
                        if (fs_1.default.existsSync(filePath)) {
                            try {
                                fs_1.default.unlinkSync(filePath);
                                utils_1.logger.info("\u30D5\u30A1\u30A4\u30EB\u3092\u524A\u9664\u3057\u307E\u3057\u305F: ".concat(filePath));
                            }
                            catch (unlinkError) {
                                utils_1.logger.error('ファイル削除エラー', { error: unlinkError, filePath: filePath });
                                // ドキュメント自体は削除できているので、エラーはスローしない
                            }
                        }
                        return [2 /*return*/, !!result];
                    case 3:
                        error_4 = _a.sent();
                        utils_1.logger.error('文書削除エラー', { error: error_4, id: id });
                        throw error_4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 物件に関連する全ての文書を削除
     * @param propertyId 物件ID
     * @returns 削除した文書の数
     */
    DocumentModel.deleteByPropertyId = function (propertyId) {
        return __awaiter(this, void 0, void 0, function () {
            var documents, _i, documents_1, doc, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, document_schema_1.DocumentModel.find({ propertyId: propertyId }).lean()];
                    case 1:
                        documents = _a.sent();
                        _i = 0, documents_1 = documents;
                        _a.label = 2;
                    case 2:
                        if (!(_i < documents_1.length)) return [3 /*break*/, 5];
                        doc = documents_1[_i];
                        return [4 /*yield*/, this.delete(String(doc._id))];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, documents.length];
                    case 6:
                        error_5 = _a.sent();
                        utils_1.logger.error('物件関連文書削除エラー', { error: error_5, propertyId: propertyId });
                        throw error_5;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    return DocumentModel;
}());
exports.DocumentModel = DocumentModel;
