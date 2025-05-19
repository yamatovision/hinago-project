/**
 * 物件バリデーションルール
 */
import { body, query, param } from 'express-validator';
import { validatePagination, validateId } from '../../common/validators/common.validator';
import { ZoneType, FireZoneType, ShadowRegulationType, PropertyStatus } from '../../types';

/**
 * 物件一覧取得のバリデーション
 */
export const validateListProperties = [
  ...validatePagination,
  query('sort')
    .optional()
    .isString()
    .withMessage('sortは文字列である必要があります'),
  query('status')
    .optional()
    .isIn(Object.values(PropertyStatus))
    .withMessage('statusは有効なステータスである必要があります'),
  query('zoneType')
    .optional()
    .isIn(Object.values(ZoneType))
    .withMessage('zoneTypeは有効な用途地域である必要があります'),
  query('fields')
    .optional()
    .isString()
    .withMessage('fieldsは文字列である必要があります'),
  query('include')
    .optional()
    .isString()
    .withMessage('includeは文字列である必要があります'),
];

/**
 * 物件詳細取得のバリデーション
 */
export const validateGetProperty = [
  validateId('propertyId'),
  query('include')
    .optional()
    .isString()
    .withMessage('includeは文字列である必要があります'),
];

/**
 * 物件作成のバリデーション
 */
export const validateCreateProperty = [
  body('name')
    .isString()
    .withMessage('nameは文字列である必要があります')
    .trim()
    .notEmpty()
    .withMessage('nameは必須です')
    .isLength({ max: 100 })
    .withMessage('nameは100文字以内で入力してください'),

  body('address')
    .isString()
    .withMessage('addressは文字列である必要があります')
    .trim()
    .notEmpty()
    .withMessage('addressは必須です')
    .isLength({ min: 3, max: 200 })
    .withMessage('addressは3文字以上200文字以内で入力してください'),

  body('area')
    .isFloat({ min: 0.1, max: 100000 })
    .withMessage('areaは0.1以上100000以下の数値である必要があります'),

  body('zoneType')
    .isIn(Object.values(ZoneType))
    .withMessage('zoneTypeは有効な用途地域である必要があります'),

  body('fireZone')
    .isIn(Object.values(FireZoneType))
    .withMessage('fireZoneは有効な防火地域区分である必要があります'),

  body('shadowRegulation')
    .optional()
    .isIn(Object.values(ShadowRegulationType))
    .withMessage('shadowRegulationは有効な日影規制である必要があります'),

  body('buildingCoverage')
    .isFloat({ min: 0, max: 100 })
    .withMessage('buildingCoverageは0以上100以下の数値である必要があります'),

  body('floorAreaRatio')
    .isFloat({ min: 0, max: 1000 })
    .withMessage('floorAreaRatioは0以上1000以下の数値である必要があります'),

  body('heightLimit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('heightLimitは0以上の数値である必要があります'),

  body('roadWidth')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('roadWidthは0以上の数値である必要があります'),

  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('priceは0以上の数値である必要があります'),

  body('status')
    .optional()
    .isIn(Object.values(PropertyStatus))
    .withMessage('statusは有効なステータスである必要があります'),

  body('notes')
    .optional()
    .isString()
    .withMessage('notesは文字列である必要があります')
    .isLength({ max: 1000 })
    .withMessage('notesは1000文字以内で入力してください'),

  body('shapeData')
    .optional()
    .isObject()
    .withMessage('shapeDataはオブジェクトである必要があります'),

  body('shapeData.points')
    .optional()
    .isArray()
    .withMessage('shapeData.pointsは配列である必要があります'),

  body('shapeData.points.*')
    .optional()
    .isObject()
    .withMessage('shapeData.pointsの要素はオブジェクトである必要があります'),

  body('shapeData.points.*.x')
    .optional()
    .isFloat()
    .withMessage('shapeData.points.*.xは数値である必要があります'),

  body('shapeData.points.*.y')
    .optional()
    .isFloat()
    .withMessage('shapeData.points.*.yは数値である必要があります'),

  body('shapeData.width')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('shapeData.widthは0以上の数値である必要があります'),

  body('shapeData.depth')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('shapeData.depthは0以上の数値である必要があります'),
];

/**
 * 物件更新のバリデーション
 */
export const validateUpdateProperty = [
  validateId('propertyId'),
  ...validateCreateProperty.map(validator => validator.optional()),
];

/**
 * 測量図アップロードのバリデーション
 */
export const validateUploadSurvey = [
  query('propertyId')
    .optional()
    .isMongoId()
    .withMessage('propertyIdはMongoIDの形式である必要があります'),
];

/**
 * 敷地形状データのバリデーション（共通）
 */
export const validateShapeData = [
  body('points')
    .isArray({ min: 3 })
    .withMessage('pointsは少なくとも3つの点を含む配列である必要があります'),
  
  body('points.*')
    .isObject()
    .withMessage('pointsの要素はオブジェクトである必要があります'),
  
  body('points.*.x')
    .isFloat()
    .withMessage('points.xは数値である必要があります'),
  
  body('points.*.y')
    .isFloat()
    .withMessage('points.yは数値である必要があります'),
  
  body('width')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('widthは0以上の数値である必要があります'),
  
  body('depth')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('depthは0以上の数値である必要があります'),
];

/**
 * 敷地形状更新のバリデーション
 */
export const validateUpdateShape = [
  validateId('propertyId'),
  ...validateShapeData,
];