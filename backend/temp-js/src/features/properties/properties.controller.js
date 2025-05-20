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
exports.deleteDocument = exports.getDocuments = exports.uploadDocument = exports.updatePropertyShape = exports.uploadSurveyMap = exports.deleteProperty = exports.updateProperty = exports.getPropertyById = exports.createProperty = exports.getProperties = void 0;
var express_validator_1 = require("express-validator");
var propertiesService = require("./properties.service");
var response_1 = require("../../common/utils/response");
var utils_1 = require("../../common/utils");
/**
 * 物件一覧を取得
 * GET /api/v1/properties
 */
var getProperties = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var errors, errorDetails, page, limit, sort, filter, result, error_1;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    errorDetails = errors.array().reduce(function (acc, error) {
                        acc[error.path] = error.msg;
                        return acc;
                    }, {});
                    return [2 /*return*/, (0, response_1.sendValidationError)(res, errorDetails)];
                }
                page = Number(req.query.page) || 1;
                limit = Number(req.query.limit) || 20;
                sort = ((_a = req.query.sort) === null || _a === void 0 ? void 0 : _a.toString()) || 'updatedAt:desc';
                filter = {};
                if (req.query.status)
                    filter.status = req.query.status;
                if (req.query.zoneType)
                    filter.zoneType = req.query.zoneType;
                return [4 /*yield*/, propertiesService.getProperties(filter, page, limit, sort)];
            case 1:
                result = _b.sent();
                return [2 /*return*/, (0, response_1.sendSuccess)(res, result.properties, 200, result.meta)];
            case 2:
                error_1 = _b.sent();
                utils_1.logger.error('物件一覧取得エラー', { error: error_1 });
                return [2 /*return*/, (0, response_1.sendError)(res, '物件一覧の取得に失敗しました', 'SERVER_ERROR', 500)];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getProperties = getProperties;
/**
 * 新規物件を登録
 * POST /api/v1/properties
 */
var createProperty = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var errors, errorDetails, userId, property, error_2;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    errorDetails = errors.array().reduce(function (acc, error) {
                        acc[error.path] = error.msg;
                        return acc;
                    }, {});
                    return [2 /*return*/, (0, response_1.sendValidationError)(res, errorDetails)];
                }
                userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                return [4 /*yield*/, propertiesService.createProperty(req.body, userId)];
            case 1:
                property = _b.sent();
                return [2 /*return*/, (0, response_1.sendSuccess)(res, property, 201)];
            case 2:
                error_2 = _b.sent();
                utils_1.logger.error('物件作成エラー', { error: error_2 });
                return [2 /*return*/, (0, response_1.sendError)(res, '物件の作成に失敗しました', 'SERVER_ERROR', 500)];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.createProperty = createProperty;
/**
 * 物件詳細を取得
 * GET /api/v1/properties/:propertyId
 */
var getPropertyById = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var errors, errorDetails, propertyId, property, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    errorDetails = errors.array().reduce(function (acc, error) {
                        acc[error.path] = error.msg;
                        return acc;
                    }, {});
                    return [2 /*return*/, (0, response_1.sendValidationError)(res, errorDetails)];
                }
                propertyId = req.params.propertyId;
                return [4 /*yield*/, propertiesService.getPropertyById(propertyId)];
            case 1:
                property = _a.sent();
                if (!property) {
                    return [2 /*return*/, (0, response_1.sendNotFoundError)(res, '指定された物件が見つかりません')];
                }
                return [2 /*return*/, (0, response_1.sendSuccess)(res, property)];
            case 2:
                error_3 = _a.sent();
                utils_1.logger.error('物件詳細取得エラー', { error: error_3, propertyId: req.params.propertyId });
                return [2 /*return*/, (0, response_1.sendError)(res, '物件詳細の取得に失敗しました', 'SERVER_ERROR', 500)];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getPropertyById = getPropertyById;
/**
 * 物件を更新
 * PUT /api/v1/properties/:propertyId
 */
var updateProperty = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var errors, errorDetails, propertyId, property, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    errorDetails = errors.array().reduce(function (acc, error) {
                        acc[error.path] = error.msg;
                        return acc;
                    }, {});
                    return [2 /*return*/, (0, response_1.sendValidationError)(res, errorDetails)];
                }
                propertyId = req.params.propertyId;
                return [4 /*yield*/, propertiesService.updateProperty(propertyId, req.body)];
            case 1:
                property = _a.sent();
                if (!property) {
                    return [2 /*return*/, (0, response_1.sendNotFoundError)(res, '指定された物件が見つかりません')];
                }
                return [2 /*return*/, (0, response_1.sendSuccess)(res, property)];
            case 2:
                error_4 = _a.sent();
                utils_1.logger.error('物件更新エラー', { error: error_4, propertyId: req.params.propertyId });
                return [2 /*return*/, (0, response_1.sendError)(res, '物件の更新に失敗しました', 'SERVER_ERROR', 500)];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.updateProperty = updateProperty;
/**
 * 物件を削除
 * DELETE /api/v1/properties/:propertyId
 */
var deleteProperty = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var errors, errorDetails, propertyId, deleted, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    errorDetails = errors.array().reduce(function (acc, error) {
                        acc[error.path] = error.msg;
                        return acc;
                    }, {});
                    return [2 /*return*/, (0, response_1.sendValidationError)(res, errorDetails)];
                }
                propertyId = req.params.propertyId;
                return [4 /*yield*/, propertiesService.deleteProperty(propertyId)];
            case 1:
                deleted = _a.sent();
                if (!deleted) {
                    return [2 /*return*/, (0, response_1.sendNotFoundError)(res, '指定された物件が見つかりません')];
                }
                return [2 /*return*/, res.status(204).end()];
            case 2:
                error_5 = _a.sent();
                utils_1.logger.error('物件削除エラー', { error: error_5, propertyId: req.params.propertyId });
                return [2 /*return*/, (0, response_1.sendError)(res, '物件の削除に失敗しました', 'SERVER_ERROR', 500)];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.deleteProperty = deleteProperty;
/**
 * 測量図をアップロードして形状データを抽出
 * POST /api/v1/properties/upload-survey
 */
var uploadSurveyMap = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var errors, errorDetails, propertyId, result, error_6;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    errorDetails = errors.array().reduce(function (acc, error) {
                        acc[error.path] = error.msg;
                        return acc;
                    }, {});
                    return [2 /*return*/, (0, response_1.sendValidationError)(res, errorDetails)];
                }
                // ファイルが存在するか確認
                if (!req.file) {
                    return [2 /*return*/, (0, response_1.sendError)(res, 'ファイルが見つかりません', 'FILE_NOT_FOUND', 400)];
                }
                propertyId = (_a = req.query.propertyId) === null || _a === void 0 ? void 0 : _a.toString();
                return [4 /*yield*/, propertiesService.processSurveyMap(req.file, propertyId)];
            case 1:
                result = _b.sent();
                return [2 /*return*/, (0, response_1.sendSuccess)(res, result, 200)];
            case 2:
                error_6 = _b.sent();
                utils_1.logger.error('測量図アップロードエラー', { error: error_6 });
                return [2 /*return*/, (0, response_1.sendError)(res, '測量図の処理に失敗しました', 'SERVER_ERROR', 500)];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.uploadSurveyMap = uploadSurveyMap;
/**
 * 敷地形状データを更新
 * PUT /api/v1/properties/:propertyId/shape
 */
var updatePropertyShape = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var errors, errorDetails, propertyId, property, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    errorDetails = errors.array().reduce(function (acc, error) {
                        acc[error.path] = error.msg;
                        return acc;
                    }, {});
                    return [2 /*return*/, (0, response_1.sendValidationError)(res, errorDetails)];
                }
                propertyId = req.params.propertyId;
                return [4 /*yield*/, propertiesService.updatePropertyShape(propertyId, req.body)];
            case 1:
                property = _a.sent();
                if (!property) {
                    return [2 /*return*/, (0, response_1.sendNotFoundError)(res, '指定された物件が見つかりません')];
                }
                return [2 /*return*/, (0, response_1.sendSuccess)(res, property)];
            case 2:
                error_7 = _a.sent();
                utils_1.logger.error('敷地形状更新エラー', { error: error_7, propertyId: req.params.propertyId });
                return [2 /*return*/, (0, response_1.sendError)(res, '敷地形状の更新に失敗しました', 'SERVER_ERROR', 500)];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.updatePropertyShape = updatePropertyShape;
/**
 * 物件関連文書をアップロード
 * POST /api/v1/properties/:propertyId/documents
 */
var uploadDocument = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var errors, errorDetails, propertyId, documentType, description, userId, document_1, error_8;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    errorDetails = errors.array().reduce(function (acc, error) {
                        acc[error.path] = error.msg;
                        return acc;
                    }, {});
                    return [2 /*return*/, (0, response_1.sendValidationError)(res, errorDetails)];
                }
                // ファイルが存在するか確認
                if (!req.file) {
                    return [2 /*return*/, (0, response_1.sendError)(res, 'ファイルが見つかりません', 'FILE_NOT_FOUND', 400)];
                }
                propertyId = req.params.propertyId;
                documentType = req.body.documentType;
                description = req.body.description;
                userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                return [4 /*yield*/, propertiesService.uploadDocument(propertyId, documentType, req.file, description, userId)];
            case 1:
                document_1 = _b.sent();
                return [2 /*return*/, (0, response_1.sendSuccess)(res, document_1, 201)];
            case 2:
                error_8 = _b.sent();
                utils_1.logger.error('文書アップロードエラー', { error: error_8, propertyId: req.params.propertyId });
                if (error_8.message === '指定された物件が見つかりません') {
                    return [2 /*return*/, (0, response_1.sendNotFoundError)(res, error_8.message)];
                }
                return [2 /*return*/, (0, response_1.sendError)(res, '文書のアップロードに失敗しました', 'SERVER_ERROR', 500)];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.uploadDocument = uploadDocument;
/**
 * 物件の文書一覧を取得
 * GET /api/v1/properties/:propertyId/documents
 */
var getDocuments = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var errors, errorDetails, propertyId, documentType, documents, serviceError_1, error_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    errorDetails = errors.array().reduce(function (acc, error) {
                        acc[error.path] = error.msg;
                        return acc;
                    }, {});
                    return [2 /*return*/, (0, response_1.sendValidationError)(res, errorDetails)];
                }
                propertyId = req.params.propertyId;
                documentType = req.query.documentType;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, propertiesService.getDocuments(propertyId, documentType)];
            case 2:
                documents = _a.sent();
                return [2 /*return*/, (0, response_1.sendSuccess)(res, documents)];
            case 3:
                serviceError_1 = _a.sent();
                if (serviceError_1.message === '指定された物件が見つかりません') {
                    return [2 /*return*/, (0, response_1.sendNotFoundError)(res, serviceError_1.message)];
                }
                throw serviceError_1;
            case 4: return [3 /*break*/, 6];
            case 5:
                error_9 = _a.sent();
                utils_1.logger.error('文書一覧取得エラー', { error: error_9, propertyId: req.params.propertyId });
                return [2 /*return*/, (0, response_1.sendError)(res, '文書一覧の取得に失敗しました', 'SERVER_ERROR', 500)];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.getDocuments = getDocuments;
/**
 * 物件の文書を削除
 * DELETE /api/v1/properties/:propertyId/documents/:documentId
 */
var deleteDocument = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var errors, errorDetails, _a, propertyId, documentId, deleted, error_10;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    errorDetails = errors.array().reduce(function (acc, error) {
                        acc[error.path] = error.msg;
                        return acc;
                    }, {});
                    return [2 /*return*/, (0, response_1.sendValidationError)(res, errorDetails)];
                }
                _a = req.params, propertyId = _a.propertyId, documentId = _a.documentId;
                return [4 /*yield*/, propertiesService.deleteDocument(propertyId, documentId)];
            case 1:
                deleted = _b.sent();
                if (!deleted) {
                    return [2 /*return*/, (0, response_1.sendNotFoundError)(res, '指定された文書が見つかりません')];
                }
                return [2 /*return*/, res.status(204).end()];
            case 2:
                error_10 = _b.sent();
                utils_1.logger.error('文書削除エラー', { error: error_10, propertyId: req.params.propertyId, documentId: req.params.documentId });
                return [2 /*return*/, (0, response_1.sendError)(res, '文書の削除に失敗しました', 'SERVER_ERROR', 500)];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.deleteDocument = deleteDocument;
