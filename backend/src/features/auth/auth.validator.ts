/**
 * 認証関連のバリデーションルール
 */
import { body } from 'express-validator';
import { commonValidator } from '../../common/validators';

/**
 * ログインリクエストのバリデーション
 */
export const validateLogin = [
  // メールアドレスのバリデーション
  commonValidator.validateEmail(),
  
  // パスワードのバリデーション
  commonValidator.validatePassword(),
  
  // リメンバーミーのバリデーション（オプショナル）
  body('rememberMe')
    .optional()
    .isBoolean()
    .withMessage('rememberMeはブール値である必要があります')
    .toBoolean(),
];

/**
 * リフレッシュトークンリクエストのバリデーション
 */
export const validateRefreshToken = [
  body('refreshToken')
    .isString()
    .withMessage('リフレッシュトークンは必須です')
    .notEmpty()
    .withMessage('リフレッシュトークンは空であってはなりません'),
];