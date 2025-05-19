/**
 * 物件ルート
 * 
 * 物件関連のエンドポイントを定義します。
 */
import express from 'express';
import * as propertiesController from './properties.controller';
import { 
  validateListProperties, 
  validateGetProperty, 
  validateCreateProperty, 
  validateUpdateProperty,
  validateUploadSurvey,
  validateUpdateShape,
  validateUploadDocument,
  validateListDocuments,
  validateDeleteDocument
} from './properties.validator';
import { validateId } from '../../common/validators/common.validator';
import { validate } from '../../common/middlewares/validation.middleware';
import { authRequired } from '../../common/middlewares/auth.middleware';
import { uploadSurveyMap, uploadPropertyDocument, handleUploadError } from '../../common/middlewares';

const router = express.Router();

/**
 * @route GET /api/v1/properties
 * @desc 物件一覧を取得
 * @access 認証済みユーザー
 */
router.get(
  '/', 
  authRequired,
  validateListProperties,
  propertiesController.getProperties
);

/**
 * @route POST /api/v1/properties
 * @desc 新規物件を登録
 * @access 認証済みユーザー
 */
router.post(
  '/', 
  authRequired,
  validateCreateProperty,
  propertiesController.createProperty
);

/**
 * @route POST /api/v1/properties/upload-survey
 * @desc 測量図をアップロードして形状データを抽出
 * @access 認証済みユーザー
 */
router.post(
  '/upload-survey',
  authRequired,
  validateUploadSurvey,
  uploadSurveyMap,
  handleUploadError,
  propertiesController.uploadSurveyMap
);

/**
 * @route GET /api/v1/properties/:propertyId
 * @desc 物件詳細を取得
 * @access 認証済みユーザー
 */
router.get(
  '/:propertyId', 
  authRequired,
  validateGetProperty,
  propertiesController.getPropertyById
);

/**
 * @route PUT /api/v1/properties/:propertyId
 * @desc 物件を更新
 * @access 認証済みユーザー（所有者または管理者）
 */
router.put(
  '/:propertyId', 
  authRequired,
  validateUpdateProperty,
  propertiesController.updateProperty
);

/**
 * @route PUT /api/v1/properties/:propertyId/shape
 * @desc 敷地形状データを更新
 * @access 認証済みユーザー（所有者または管理者）
 */
router.put(
  '/:propertyId/shape',
  authRequired,
  validateUpdateShape,
  propertiesController.updatePropertyShape
);

/**
 * @route DELETE /api/v1/properties/:propertyId
 * @desc 物件を削除
 * @access 認証済みユーザー（所有者または管理者）
 */
router.delete(
  '/:propertyId', 
  authRequired,
  validateId('propertyId'),
  propertiesController.deleteProperty
);

/**
 * @route POST /api/v1/properties/:propertyId/documents
 * @desc 物件関連文書をアップロード
 * @access 認証済みユーザー
 */
router.post(
  '/:propertyId/documents',
  authRequired,
  validateUploadDocument,
  uploadPropertyDocument,
  handleUploadError,
  propertiesController.uploadDocument
);

/**
 * @route GET /api/v1/properties/:propertyId/documents
 * @desc 物件の文書一覧を取得
 * @access 認証済みユーザー
 */
router.get(
  '/:propertyId/documents',
  authRequired,
  validateListDocuments,
  propertiesController.getDocuments
);

/**
 * @route DELETE /api/v1/properties/:propertyId/documents/:documentId
 * @desc 物件の文書を削除
 * @access 認証済みユーザー（所有者または管理者）
 */
router.delete(
  '/:propertyId/documents/:documentId',
  authRequired,
  validateDeleteDocument,
  propertiesController.deleteDocument
);

export default router;