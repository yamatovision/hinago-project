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