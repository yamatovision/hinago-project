"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 物件ルート
 *
 * 物件関連のエンドポイントを定義します。
 */
var express_1 = require("express");
var propertiesController = require("./properties.controller");
var properties_validator_1 = require("./properties.validator");
var common_validator_1 = require("../../common/validators/common.validator");
var auth_middleware_1 = require("../../common/middlewares/auth.middleware");
var middlewares_1 = require("../../common/middlewares");
var router = express_1.default.Router();
/**
 * @route GET /api/v1/properties
 * @desc 物件一覧を取得
 * @access 認証済みユーザー
 */
router.get('/', auth_middleware_1.authRequired, properties_validator_1.validateListProperties, propertiesController.getProperties);
/**
 * @route POST /api/v1/properties
 * @desc 新規物件を登録
 * @access 認証済みユーザー
 */
router.post('/', auth_middleware_1.authRequired, properties_validator_1.validateCreateProperty, propertiesController.createProperty);
/**
 * @route POST /api/v1/properties/upload-survey
 * @desc 測量図をアップロードして形状データを抽出
 * @access 認証済みユーザー
 */
router.post('/upload-survey', auth_middleware_1.authRequired, properties_validator_1.validateUploadSurvey, middlewares_1.uploadSurveyMap, middlewares_1.handleUploadError, propertiesController.uploadSurveyMap);
/**
 * @route GET /api/v1/properties/:propertyId
 * @desc 物件詳細を取得
 * @access 認証済みユーザー
 */
router.get('/:propertyId', auth_middleware_1.authRequired, properties_validator_1.validateGetProperty, propertiesController.getPropertyById);
/**
 * @route PUT /api/v1/properties/:propertyId
 * @desc 物件を更新
 * @access 認証済みユーザー（所有者または管理者）
 */
router.put('/:propertyId', auth_middleware_1.authRequired, properties_validator_1.validateUpdateProperty, propertiesController.updateProperty);
/**
 * @route PUT /api/v1/properties/:propertyId/shape
 * @desc 敷地形状データを更新
 * @access 認証済みユーザー（所有者または管理者）
 */
router.put('/:propertyId/shape', auth_middleware_1.authRequired, properties_validator_1.validateUpdateShape, propertiesController.updatePropertyShape);
/**
 * @route DELETE /api/v1/properties/:propertyId
 * @desc 物件を削除
 * @access 認証済みユーザー（所有者または管理者）
 */
router.delete('/:propertyId', auth_middleware_1.authRequired, (0, common_validator_1.validateId)('propertyId'), propertiesController.deleteProperty);
/**
 * @route POST /api/v1/properties/:propertyId/documents
 * @desc 物件関連文書をアップロード
 * @access 認証済みユーザー
 */
router.post('/:propertyId/documents', auth_middleware_1.authRequired, properties_validator_1.validateUploadDocument, middlewares_1.uploadPropertyDocument, middlewares_1.handleUploadError, propertiesController.uploadDocument);
/**
 * @route GET /api/v1/properties/:propertyId/documents
 * @desc 物件の文書一覧を取得
 * @access 認証済みユーザー
 */
router.get('/:propertyId/documents', auth_middleware_1.authRequired, properties_validator_1.validateListDocuments, propertiesController.getDocuments);
/**
 * @route DELETE /api/v1/properties/:propertyId/documents/:documentId
 * @desc 物件の文書を削除
 * @access 認証済みユーザー（所有者または管理者）
 */
router.delete('/:propertyId/documents/:documentId', auth_middleware_1.authRequired, properties_validator_1.validateDeleteDocument, propertiesController.deleteDocument);
exports.default = router;
