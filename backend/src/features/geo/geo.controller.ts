/**
 * ジオコーディングコントローラー
 * 
 * 住所から緯度経度情報を取得するHTTPリクエストを処理します。
 */
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import * as geoService from './geo.service';
import { sendSuccess, sendError, sendNotFoundError, sendValidationError } from '../../common/utils/response';
import { logger } from '../../common/utils';

/**
 * 住所から緯度経度情報を取得
 * GET /api/v1/geocode
 */
export const getGeocode = async (req: Request, res: Response) => {
  try {
    // バリデーション結果の確認
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorDetails = errors.array().reduce((acc: Record<string, string>, error: any) => {
        acc[error.path] = error.msg;
        return acc;
      }, {});
      return sendValidationError(res, errorDetails);
    }

    // クエリパラメータを取得
    const address = req.query.address?.toString() || '';
    
    // サービスを呼び出し
    const geoLocation = await geoService.getGeocode(address);
    
    if (!geoLocation) {
      return sendNotFoundError(res, '指定された住所の位置情報が見つかりません');
    }
    
    return sendSuccess(res, geoLocation);
  } catch (error) {
    logger.error('ジオコーディングエラー', { error, address: req.query.address });
    return sendError(res, 'ジオコーディングに失敗しました', 'SERVER_ERROR', 500);
  }
};