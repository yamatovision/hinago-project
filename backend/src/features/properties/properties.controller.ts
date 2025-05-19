/**
 * 物件コントローラー
 * 
 * 物件関連のHTTPリクエストを処理します。
 */
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import * as propertiesService from './properties.service';
import { sendSuccess, sendError, sendNotFoundError, sendValidationError } from '../../common/utils/response';
import { logger } from '../../common/utils';
import { AuthRequest } from '../../types';

/**
 * 物件一覧を取得
 * GET /api/v1/properties
 */
export const getProperties = async (req: Request, res: Response) => {
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
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const sort = req.query.sort?.toString() || 'updatedAt:desc';
    
    // フィルター条件を作成
    const filter: Record<string, any> = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.zoneType) filter.zoneType = req.query.zoneType;
    
    // サービスを呼び出し
    const result = await propertiesService.getProperties(filter, page, limit, sort);
    
    return sendSuccess(res, result.properties, 200, result.meta);
  } catch (error) {
    logger.error('物件一覧取得エラー', { error });
    return sendError(res, '物件一覧の取得に失敗しました', 'SERVER_ERROR', 500);
  }
};

/**
 * 新規物件を登録
 * POST /api/v1/properties
 */
export const createProperty = async (req: AuthRequest, res: Response) => {
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

    // 認証済みユーザーのIDを取得
    const userId = req.user?.id;
    
    // サービスを呼び出し
    const property = await propertiesService.createProperty(req.body, userId);
    
    return sendSuccess(res, property, 201);
  } catch (error) {
    logger.error('物件作成エラー', { error });
    return sendError(res, '物件の作成に失敗しました', 'SERVER_ERROR', 500);
  }
};

/**
 * 物件詳細を取得
 * GET /api/v1/properties/:propertyId
 */
export const getPropertyById = async (req: Request, res: Response) => {
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

    const { propertyId } = req.params;
    
    // サービスを呼び出し
    const property = await propertiesService.getPropertyById(propertyId);
    
    if (!property) {
      return sendNotFoundError(res, '指定された物件が見つかりません');
    }
    
    return sendSuccess(res, property);
  } catch (error) {
    logger.error('物件詳細取得エラー', { error, propertyId: req.params.propertyId });
    return sendError(res, '物件詳細の取得に失敗しました', 'SERVER_ERROR', 500);
  }
};

/**
 * 物件を更新
 * PUT /api/v1/properties/:propertyId
 */
export const updateProperty = async (req: AuthRequest, res: Response) => {
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

    const { propertyId } = req.params;
    
    // サービスを呼び出し
    const property = await propertiesService.updateProperty(propertyId, req.body);
    
    if (!property) {
      return sendNotFoundError(res, '指定された物件が見つかりません');
    }
    
    return sendSuccess(res, property);
  } catch (error) {
    logger.error('物件更新エラー', { error, propertyId: req.params.propertyId });
    return sendError(res, '物件の更新に失敗しました', 'SERVER_ERROR', 500);
  }
};

/**
 * 物件を削除
 * DELETE /api/v1/properties/:propertyId
 */
export const deleteProperty = async (req: Request, res: Response) => {
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

    const { propertyId } = req.params;
    
    // サービスを呼び出し
    const deleted = await propertiesService.deleteProperty(propertyId);
    
    if (!deleted) {
      return sendNotFoundError(res, '指定された物件が見つかりません');
    }
    
    return res.status(204).end();
  } catch (error) {
    logger.error('物件削除エラー', { error, propertyId: req.params.propertyId });
    return sendError(res, '物件の削除に失敗しました', 'SERVER_ERROR', 500);
  }
};

/**
 * 測量図をアップロードして形状データを抽出
 * POST /api/v1/properties/upload-survey
 */
export const uploadSurveyMap = async (req: AuthRequest, res: Response) => {
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

    // ファイルが存在するか確認
    if (!req.file) {
      return sendError(res, 'ファイルが見つかりません', 'FILE_NOT_FOUND', 400);
    }

    // 物件IDの取得（任意パラメータ）
    const propertyId = req.query.propertyId?.toString();
    
    // サービスを呼び出し
    const result = await propertiesService.processSurveyMap(req.file, propertyId);
    
    return sendSuccess(res, result, 200);
  } catch (error) {
    logger.error('測量図アップロードエラー', { error });
    return sendError(res, '測量図の処理に失敗しました', 'SERVER_ERROR', 500);
  }
};

/**
 * 敷地形状データを更新
 * PUT /api/v1/properties/:propertyId/shape
 */
export const updatePropertyShape = async (req: AuthRequest, res: Response) => {
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

    const { propertyId } = req.params;
    
    // サービスを呼び出し
    const property = await propertiesService.updatePropertyShape(propertyId, req.body);
    
    if (!property) {
      return sendNotFoundError(res, '指定された物件が見つかりません');
    }
    
    return sendSuccess(res, property);
  } catch (error) {
    logger.error('敷地形状更新エラー', { error, propertyId: req.params.propertyId });
    return sendError(res, '敷地形状の更新に失敗しました', 'SERVER_ERROR', 500);
  }
};