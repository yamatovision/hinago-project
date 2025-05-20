/**
 * Joiバリデーションミドルウェア
 */
import { Request, Response, NextFunction } from 'express';
import { ValidationResult } from 'joi';
import { sendValidationError } from '../utils/response';

/**
 * Joiを使用したリクエストのバリデーションを行い、エラーがあれば適切なレスポンスを返す
 * @param validationFn バリデーション関数
 */
export const validateWithJoi = (validationFn: (req: Request) => ValidationResult<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // バリデーション実行
    const result = validationFn(req);
    
    // エラーがなければ次のミドルウェアへ
    if (!result.error) {
      return next();
    }
    
    // エラーがあれば整形してレスポンスを返す
    const errorDetails: Record<string, string> = {};
    result.error.details.forEach(detail => {
      const path = detail.path.join('.');
      errorDetails[path] = detail.message;
    });
    
    return sendValidationError(res, errorDetails);
  };
};