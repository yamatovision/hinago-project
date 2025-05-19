/**
 * ジオコーディングバリデーションルール
 */
import { query } from 'express-validator';

/**
 * ジオコーディングリクエストのバリデーション
 */
export const validateGeocode = [
  query('address')
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
export const validateReverseGeocode = [
  query('lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('latは-90から90の間の数値である必要があります')
    .notEmpty()
    .withMessage('latは必須です'),
  
  query('lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('lngは-180から180の間の数値である必要があります')
    .notEmpty()
    .withMessage('lngは必須です'),
];