"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateReverseGeocode = exports.validateGeocode = void 0;
/**
 * ジオコーディングバリデーションルール
 */
var express_validator_1 = require("express-validator");
/**
 * ジオコーディングリクエストのバリデーション
 */
exports.validateGeocode = [
    (0, express_validator_1.query)('address')
        .isString()
        .withMessage('addressは文字列である必要があります')
        .trim()
        .notEmpty()
        .withMessage('addressは必須です')
        .isLength({ min: 3, max: 200 })
        .withMessage('addressは3文字以上200文字以内で入力してください'),
];
/**
 * 逆ジオコーディングリクエストのバリデーション
 */
exports.validateReverseGeocode = [
    (0, express_validator_1.query)('lat')
        .isFloat({ min: -90, max: 90 })
        .withMessage('latは-90から90の間の数値である必要があります')
        .notEmpty()
        .withMessage('latは必須です'),
    (0, express_validator_1.query)('lng')
        .isFloat({ min: -180, max: 180 })
        .withMessage('lngは-180から180の間の数値である必要があります')
        .notEmpty()
        .withMessage('lngは必須です'),
];
