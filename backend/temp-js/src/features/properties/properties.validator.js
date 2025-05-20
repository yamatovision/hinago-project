"use strict";
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
exports.validateDeleteDocument = exports.validateListDocuments = exports.validateUploadDocument = exports.validateUpdateShape = exports.validateShapeData = exports.validateUploadSurvey = exports.validateUpdateProperty = exports.validateCreateProperty = exports.validateGetProperty = exports.validateListProperties = void 0;
/**
 * 物件バリデーションルール
 */
var express_validator_1 = require("express-validator");
var common_validator_1 = require("../../common/validators/common.validator");
var types_1 = require("../../types");
/**
 * 物件一覧取得のバリデーション
 */
exports.validateListProperties = __spreadArray(__spreadArray([], common_validator_1.validatePagination, true), [
    (0, express_validator_1.query)('sort')
        .optional()
        .isString()
        .withMessage('sortは文字列である必要があります'),
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(Object.values(types_1.PropertyStatus))
        .withMessage('statusは有効なステータスである必要があります'),
    (0, express_validator_1.query)('zoneType')
        .optional()
        .isIn(Object.values(types_1.ZoneType))
        .withMessage('zoneTypeは有効な用途地域である必要があります'),
    (0, express_validator_1.query)('fields')
        .optional()
        .isString()
        .withMessage('fieldsは文字列である必要があります'),
    (0, express_validator_1.query)('include')
        .optional()
        .isString()
        .withMessage('includeは文字列である必要があります'),
], false);
/**
 * 物件詳細取得のバリデーション
 */
exports.validateGetProperty = [
    (0, common_validator_1.validateId)('propertyId'),
    (0, express_validator_1.query)('include')
        .optional()
        .isString()
        .withMessage('includeは文字列である必要があります'),
];
/**
 * 物件作成のバリデーション
 */
exports.validateCreateProperty = [
    (0, express_validator_1.body)('name')
        .isString()
        .withMessage('nameは文字列である必要があります')
        .trim()
        .notEmpty()
        .withMessage('nameは必須です')
        .isLength({ max: 100 })
        .withMessage('nameは100文字以内で入力してください'),
    (0, express_validator_1.body)('address')
        .isString()
        .withMessage('addressは文字列である必要があります')
        .trim()
        .notEmpty()
        .withMessage('addressは必須です')
        .isLength({ min: 3, max: 200 })
        .withMessage('addressは3文字以上200文字以内で入力してください'),
    (0, express_validator_1.body)('area')
        .isFloat({ min: 0.1, max: 100000 })
        .withMessage('areaは0.1以上100000以下の数値である必要があります'),
    (0, express_validator_1.body)('zoneType')
        .isIn(Object.values(types_1.ZoneType))
        .withMessage('zoneTypeは有効な用途地域である必要があります'),
    (0, express_validator_1.body)('fireZone')
        .isIn(Object.values(types_1.FireZoneType))
        .withMessage('fireZoneは有効な防火地域区分である必要があります'),
    (0, express_validator_1.body)('shadowRegulation')
        .optional()
        .isIn(Object.values(types_1.ShadowRegulationType))
        .withMessage('shadowRegulationは有効な日影規制である必要があります'),
    (0, express_validator_1.body)('buildingCoverage')
        .isFloat({ min: 0, max: 100 })
        .withMessage('buildingCoverageは0以上100以下の数値である必要があります'),
    (0, express_validator_1.body)('floorAreaRatio')
        .isFloat({ min: 0, max: 1000 })
        .withMessage('floorAreaRatioは0以上1000以下の数値である必要があります'),
    (0, express_validator_1.body)('heightLimit')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('heightLimitは0以上の数値である必要があります'),
    (0, express_validator_1.body)('roadWidth')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('roadWidthは0以上の数値である必要があります'),
    (0, express_validator_1.body)('price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('priceは0以上の数値である必要があります'),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(Object.values(types_1.PropertyStatus))
        .withMessage('statusは有効なステータスである必要があります'),
    (0, express_validator_1.body)('notes')
        .optional()
        .isString()
        .withMessage('notesは文字列である必要があります')
        .isLength({ max: 1000 })
        .withMessage('notesは1000文字以内で入力してください'),
    (0, express_validator_1.body)('shapeData')
        .optional()
        .isObject()
        .withMessage('shapeDataはオブジェクトである必要があります'),
    (0, express_validator_1.body)('shapeData.points')
        .optional()
        .isArray()
        .withMessage('shapeData.pointsは配列である必要があります'),
    (0, express_validator_1.body)('shapeData.points.*')
        .optional()
        .isObject()
        .withMessage('shapeData.pointsの要素はオブジェクトである必要があります'),
    (0, express_validator_1.body)('shapeData.points.*.x')
        .optional()
        .isFloat()
        .withMessage('shapeData.points.*.xは数値である必要があります'),
    (0, express_validator_1.body)('shapeData.points.*.y')
        .optional()
        .isFloat()
        .withMessage('shapeData.points.*.yは数値である必要があります'),
    (0, express_validator_1.body)('shapeData.width')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('shapeData.widthは0以上の数値である必要があります'),
    (0, express_validator_1.body)('shapeData.depth')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('shapeData.depthは0以上の数値である必要があります'),
];
/**
 * 物件更新のバリデーション
 */
exports.validateUpdateProperty = __spreadArray([
    (0, common_validator_1.validateId)('propertyId')
], exports.validateCreateProperty.map(function (validator) { return validator.optional(); }), true);
/**
 * 測量図アップロードのバリデーション
 */
exports.validateUploadSurvey = [
    (0, express_validator_1.query)('propertyId')
        .optional()
        .isMongoId()
        .withMessage('propertyIdはMongoIDの形式である必要があります'),
];
/**
 * 敷地形状データのバリデーション（共通）
 */
exports.validateShapeData = [
    (0, express_validator_1.body)('points')
        .isArray({ min: 3 })
        .withMessage('pointsは少なくとも3つの点を含む配列である必要があります'),
    (0, express_validator_1.body)('points.*')
        .isObject()
        .withMessage('pointsの要素はオブジェクトである必要があります'),
    (0, express_validator_1.body)('points.*.x')
        .isFloat()
        .withMessage('points.xは数値である必要があります'),
    (0, express_validator_1.body)('points.*.y')
        .isFloat()
        .withMessage('points.yは数値である必要があります'),
    (0, express_validator_1.body)('width')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('widthは0以上の数値である必要があります'),
    (0, express_validator_1.body)('depth')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('depthは0以上の数値である必要があります'),
];
/**
 * 敷地形状更新のバリデーション
 */
exports.validateUpdateShape = __spreadArray([
    (0, common_validator_1.validateId)('propertyId')
], exports.validateShapeData, true);
/**
 * 物件文書アップロードのバリデーション
 */
exports.validateUploadDocument = [
    (0, common_validator_1.validateId)('propertyId'),
    (0, express_validator_1.body)('documentType')
        .isIn(Object.values(types_1.DocumentType))
        .withMessage('documentTypeは有効な文書タイプである必要があります'),
    (0, express_validator_1.body)('description')
        .optional()
        .isString()
        .withMessage('descriptionは文字列である必要があります')
        .isLength({ max: 500 })
        .withMessage('descriptionは500文字以内で入力してください'),
];
/**
 * 物件文書一覧取得のバリデーション
 */
exports.validateListDocuments = [
    (0, common_validator_1.validateId)('propertyId'),
    (0, express_validator_1.query)('documentType')
        .optional()
        .isIn(Object.values(types_1.DocumentType))
        .withMessage('documentTypeは有効な文書タイプである必要があります'),
];
/**
 * 物件文書削除のバリデーション
 */
exports.validateDeleteDocument = [
    (0, common_validator_1.validateId)('propertyId'),
    (0, common_validator_1.validateId)('documentId'),
];
