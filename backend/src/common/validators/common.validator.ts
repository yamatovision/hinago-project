/**
 * 共通バリデーションルール
 */
import { body, param, query } from 'express-validator';

/**
 * IDパラメータのバリデーション
 * @param paramName パラメータ名（デフォルト: 'id'）
 */
export const validateId = (paramName = 'id') => {
  return param(paramName)
    .isString()
    .trim()
    .notEmpty()
    .withMessage(`${paramName}は必須です`);
};

/**
 * ページネーションクエリのバリデーション
 */
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('pageは1以上の整数である必要があります')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limitは1から100の間の整数である必要があります')
    .toInt(),
];

/**
 * メールアドレスのバリデーション
 * @param fieldName フィールド名（デフォルト: 'email'）
 */
export const validateEmail = (fieldName = 'email') => {
  return body(fieldName)
    .isEmail()
    .withMessage('有効なメールアドレスを入力してください')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('メールアドレスは100文字以内で入力してください');
};

/**
 * パスワードのバリデーション
 * @param fieldName フィールド名（デフォルト: 'password'）
 */
export const validatePassword = (fieldName = 'password') => {
  return body(fieldName)
    .isString()
    .withMessage('パスワードは文字列である必要があります')
    .isLength({ min: 6, max: 100 })
    .withMessage('パスワードは6文字以上100文字以内で入力してください');
};