/**
 * バリデーションミドルウェア
 */
import { Request, Response, NextFunction } from 'express';
import { ValidationChain, validationResult } from 'express-validator';
import { responseUtils } from '../utils';

/**
 * リクエストのバリデーションを行い、エラーがあれば適切なレスポンスを返す
 * @param validations バリデーションルールの配列
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // 全てのバリデーションを実行
    await Promise.all(validations.map(validation => validation.run(req)));
    
    // バリデーション結果を取得
    const errors = validationResult(req);
    
    // エラーがなければ次のミドルウェアへ
    if (errors.isEmpty()) {
      return next();
    }
    
    // エラーがあれば整形してレスポンスを返す
    const errorDetails: Record<string, string> = {};
    errors.array().forEach(error => {
      if (error.type === 'field' && error.path && error.msg) {
        errorDetails[error.path] = error.msg;
      }
    });
    
    return responseUtils.sendValidationError(res, errorDetails);
  };
};