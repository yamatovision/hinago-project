"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePassword = exports.validateEmail = exports.validatePagination = exports.validateId = void 0;
/**
 * 共通バリデーションルール
 */
var express_validator_1 = require("express-validator");
/**
 * IDパラメータのバリデーション
 * @param paramName パラメータ名（デフォルト: 'id'）
 */
var validateId = function (paramName) {
    if (paramName === void 0) { paramName = 'id'; }
    return (0, express_validator_1.param)(paramName)
        .isString()
        .trim()
        .notEmpty()
        .withMessage("".concat(paramName, "\u306F\u5FC5\u9808\u3067\u3059"));
};
exports.validateId = validateId;
/**
 * ページネーションクエリのバリデーション
 */
exports.validatePagination = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('pageは1以上の整数である必要があります')
        .toInt(),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('limitは1から100の間の整数である必要があります')
        .toInt(),
];
/**
 * メールアドレスのバリデーション
 * @param fieldName フィールド名（デフォルト: 'email'）
 */
var validateEmail = function (fieldName) {
    if (fieldName === void 0) { fieldName = 'email'; }
    return (0, express_validator_1.body)(fieldName)
        .isEmail()
        .withMessage('有効なメールアドレスを入力してください')
        .normalizeEmail()
        .isLength({ max: 100 })
        .withMessage('メールアドレスは100文字以内で入力してください');
};
exports.validateEmail = validateEmail;
/**
 * パスワードのバリデーション
 * @param fieldName フィールド名（デフォルト: 'password'）
 */
var validatePassword = function (fieldName) {
    if (fieldName === void 0) { fieldName = 'password'; }
    return (0, express_validator_1.body)(fieldName)
        .isString()
        .withMessage('パスワードは文字列である必要があります')
        .isLength({ min: 6, max: 100 })
        .withMessage('パスワードは6文字以上100文字以内で入力してください');
};
exports.validatePassword = validatePassword;
