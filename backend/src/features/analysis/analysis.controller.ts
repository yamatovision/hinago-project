/**
 * 分析機能用コントローラー
 */
import { Request, Response, NextFunction } from 'express';
import { 
  VolumeCheckService, 
  ProfitabilityService,
  ScenarioService 
} from './analysis.service';
import { 
  BuildingParams, 
  AuthRequest, 
  FinancialParams,
  ScenarioParams,
  AssetType
} from '../../types';
import mongoose from 'mongoose';
import { 
  PropertyModel, 
  VolumeCheckModel,
  ScenarioModel
} from '../../db/models';
import { logger } from '../../common/utils';
import { sendSuccess, sendError, sendNotFoundError } from '../../common/utils/response';

/**
 * ボリュームチェックコントローラークラス
 */
export class VolumeCheckController {
  /**
   * ボリュームチェック実行
   * POST /api/v1/analysis/volume-check
   */
  static async executeVolumeCheck(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId, buildingParams } = req.body;
      const userId = req.user?.id;
      
      // ボリュームチェック実行
      const volumeCheck = await VolumeCheckService.executeVolumeCheck(
        propertyId,
        buildingParams as BuildingParams,
        userId
      );
      
      // 成功レスポンス
      sendSuccess(res, volumeCheck, 201);
    } catch (error: any) {
      // エラーログ
      logger.error('ボリュームチェック実行エラー', { error, body: req.body });
      
      // 適切なエラーレスポンス
      if (error.message.includes('物件が見つかりません')) {
        sendNotFoundError(res, '指定された物件が見つかりません');
      } else if (error.message.includes('計算')) {
        sendError(res, '建築ボリュームの計算に失敗しました', 'CALCULATION_ERROR', 400, {
          details: error.message
        });
      } else {
        next(error);
      }
    }
  }

  /**
   * ボリュームチェック結果取得
   * GET /api/v1/analysis/volume-check/:volumeCheckId
   */
  static async getVolumeCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { volumeCheckId } = req.params;
      
      // ボリュームチェック結果取得
      const volumeCheck = await VolumeCheckService.getVolumeCheckById(volumeCheckId);
      
      // 結果チェック
      if (!volumeCheck) {
        sendNotFoundError(res, '指定されたボリュームチェック結果が見つかりません');
        return;
      }
      
      // 成功レスポンス
      sendSuccess(res, volumeCheck);
    } catch (error) {
      logger.error('ボリュームチェック取得エラー', { error, volumeCheckId: req.params.volumeCheckId });
      next(error);
    }
  }

  /**
   * 物件IDでボリュームチェック結果一覧取得
   * GET /api/v1/analysis/volume-check/property/:propertyId
   */
  static async getVolumeChecksByProperty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId } = req.params;
      // クエリパラメータからページネーション情報を取得
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      
      // 物件IDでボリュームチェック一覧取得（ページネーションパラメータを渡す）
      const result = await VolumeCheckService.getVolumeChecksByPropertyId(propertyId, page, limit);
      
      // 成功レスポンス（空配列でも成功）- ページネーション情報を含める
      sendSuccess(res, result.volumeChecks, 200, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      });
    } catch (error) {
      logger.error('物件ボリュームチェック一覧取得エラー', { error, propertyId: req.params.propertyId });
      next(error);
    }
  }

  /**
   * ボリュームチェック結果削除
   * DELETE /api/v1/analysis/volume-check/:volumeCheckId
   */
  static async deleteVolumeCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { volumeCheckId } = req.params;
      
      // ボリュームチェック結果削除
      const deleted = await VolumeCheckService.deleteVolumeCheck(volumeCheckId);
      
      // 結果チェック
      if (!deleted) {
        sendNotFoundError(res, '指定されたボリュームチェック結果が見つかりません');
        return;
      }
      
      // 成功レスポンス（204 No Content）
      res.status(204).end();
    } catch (error) {
      logger.error('ボリュームチェック削除エラー', { error, volumeCheckId: req.params.volumeCheckId });
      next(error);
    }
  }
}

/**
 * 収益性試算コントローラークラス
 */
export class ProfitabilityController {
  /**
   * 収益性試算実行
   * POST /api/v1/analysis/profitability
   */
  static async executeProfitability(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId, volumeCheckId, financialParams } = req.body;
      const userId = req.user?.id;
      
      // 収益性試算実行
      const profitability = await ProfitabilityService.executeProfitability(
        propertyId,
        volumeCheckId,
        financialParams as FinancialParams,
        userId
      );
      
      // 成功レスポンス
      sendSuccess(res, profitability, 201);
    } catch (error: any) {
      // エラーログ
      logger.error('収益性試算実行エラー', { error, body: req.body });
      
      // 適切なエラーレスポンス
      if (error.message.includes('物件が見つかりません')) {
        sendNotFoundError(res, '指定された物件が見つかりません');
      } else if (error.message.includes('ボリュームチェック結果が見つかりません')) {
        sendNotFoundError(res, '指定されたボリュームチェック結果が見つかりません');
      } else if (error.message.includes('関連付けられていません')) {
        sendError(res, '指定されたボリュームチェック結果は、指定された物件に関連付けられていません', 'RELATED_ERROR', 400);
      } else if (error.message.includes('計算')) {
        sendError(res, '収益性試算の計算に失敗しました', 'CALCULATION_ERROR', 400, {
          details: error.message
        });
      } else {
        next(error);
      }
    }
  }

  /**
   * 収益性試算結果取得
   * GET /api/v1/analysis/profitability/:profitabilityId
   */
  static async getProfitability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { profitabilityId } = req.params;
      
      // 収益性試算結果取得
      const profitability = await ProfitabilityService.getProfitabilityById(profitabilityId);
      
      // 結果チェック
      if (!profitability) {
        sendNotFoundError(res, '指定された収益性試算結果が見つかりません');
        return;
      }
      
      // 成功レスポンス
      sendSuccess(res, profitability);
    } catch (error) {
      logger.error('収益性試算結果取得エラー', { error, profitabilityId: req.params.profitabilityId });
      next(error);
    }
  }

  /**
   * 物件IDで収益性試算結果一覧取得
   * GET /api/v1/analysis/profitability/property/:propertyId
   */
  static async getProfitabilitiesByProperty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId } = req.params;
      
      // IDフォーマットチェック
      if (!mongoose.Types.ObjectId.isValid(propertyId)) {
        sendNotFoundError(res, '指定された物件IDが無効です');
        return;
      }
      
      // ページネーションパラメータの取得
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      
      // 物件IDで収益性試算結果一覧取得（ページネーションパラメータを渡す）
      const result = await ProfitabilityService.getProfitabilitiesByPropertyId(propertyId, page, limit);
      
      // 成功レスポンス（空配列でも成功）- ページネーション情報を含める
      sendSuccess(res, result.profitabilityResults, 200, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      });
    } catch (error) {
      logger.error('物件関連収益性試算結果一覧取得エラー', { error, propertyId: req.params.propertyId });
      next(error);
    }
  }

  /**
   * ボリュームチェックIDで収益性試算結果一覧取得
   * GET /api/v1/analysis/profitability/volume-check/:volumeCheckId
   */
  static async getProfitabilitiesByVolumeCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { volumeCheckId } = req.params;
      
      // IDフォーマットチェック
      if (!mongoose.Types.ObjectId.isValid(volumeCheckId)) {
        sendNotFoundError(res, '指定されたボリュームチェックIDが無効です');
        return;
      }
      
      // ページネーションパラメータの取得
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      
      // ボリュームチェックIDで収益性試算結果一覧取得（ページネーションパラメータを渡す）
      // 高速化のために処理を簡略化
      try {
        const result = await ProfitabilityService.getProfitabilitiesByVolumeCheckId(volumeCheckId, page, limit);
        
        // 成功レスポンス（空配列でも成功）- ページネーション情報を含める
        sendSuccess(res, result.profitabilityResults, 200, {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        });
      } catch (serviceError: any) {
        // サービス層でのエラーをより詳細にログ
        logger.error('収益性試算結果取得サービスエラー', { 
          error: serviceError, 
          volumeCheckId,
          errorMessage: serviceError?.message || '不明なエラー',
          errorStack: serviceError?.stack || '詳細なエラースタックが利用できません'
        });
        
        // 一般的なエラーとして処理
        sendError(res, 'ボリュームチェック関連収益性試算結果の取得中にエラーが発生しました', 'SERVER_ERROR', 500);
      }
    } catch (error) {
      logger.error('ボリュームチェック関連収益性試算結果一覧取得エラー', { error, volumeCheckId: req.params.volumeCheckId });
      next(error);
    }
  }

  /**
   * 収益性試算結果削除
   * DELETE /api/v1/analysis/profitability/:profitabilityId
   */
  static async deleteProfitability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { profitabilityId } = req.params;
      
      // 収益性試算結果削除
      const deleted = await ProfitabilityService.deleteProfitability(profitabilityId);
      
      // 結果チェック
      if (!deleted) {
        sendNotFoundError(res, '指定された収益性試算結果が見つかりません');
        return;
      }
      
      // 成功レスポンス（204 No Content）
      res.status(204).end();
    } catch (error) {
      logger.error('収益性試算結果削除エラー', { error, profitabilityId: req.params.profitabilityId });
      next(error);
    }
  }
}

/**
 * シナリオコントローラークラス
 */
export class ScenarioController {
  /**
   * シナリオ作成 - 直接実装バージョン
   * POST /api/v1/analysis/scenarios-direct
   * 
   * テストで成功したパターンを採用 - サービス層をバイパス
   */
  static async createScenarioDirect(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    // タイムスタンプ計測用
    const startTime = Date.now();
    
    try {
      logger.info('シナリオ作成開始 (直接実装)', { 
        time: `${Date.now() - startTime}ms`,
        body: req.body 
      });
      
      const { propertyId, volumeCheckId, name, params } = req.body;
      const userId = req.user?.id;
      
      // バリデーション計測
      const validationStart = Date.now();
      
      // バリデーション: 最小限のチェックのみで高速化
      if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
        sendError(res, '有効な物件IDを指定してください', 'VALIDATION_ERROR', 400);
        return;
      }
      
      if (!volumeCheckId || !mongoose.Types.ObjectId.isValid(volumeCheckId)) {
        sendError(res, '有効なボリュームチェックIDを指定してください', 'VALIDATION_ERROR', 400);
        return;
      }
      
      if (!name || typeof name !== 'string' || name.trim() === '') {
        sendError(res, '有効なシナリオ名を指定してください', 'VALIDATION_ERROR', 400);
        return;
      }
      
      if (!params || typeof params !== 'object') {
        sendError(res, '有効なシナリオパラメータを指定してください', 'VALIDATION_ERROR', 400);
        return;
      }
      
      logger.info('バリデーション完了 (直接実装)', { time: `${Date.now() - validationStart}ms` });
      
      // 物件とボリュームチェックの存在確認
      const referenceCheckStart = Date.now();
      
      // 超高速参照チェック: コレクション直接アクセス - ここでモデルをrequireする
      const { PropertyModel: MongoPropertyModel } = require('../../db/models/schemas/property.schema');
      const { VolumeCheckModel: MongoVolumeCheckModel } = require('../../db/models/schemas/volumeCheck.schema');
      
      logger.info('DBモデル取得完了 (直接実装)', { time: `${Date.now() - referenceCheckStart}ms` });
      
      // 文字列のままの_idを使用して直接存在チェック
      // Promise.allで並列実行して高速化
      const existsCheckStart = Date.now();
      const [propertyExists, volumeCheckExists] = await Promise.all([
        MongoPropertyModel.exists({ _id: new mongoose.Types.ObjectId(propertyId) }),
        MongoVolumeCheckModel.exists({ _id: new mongoose.Types.ObjectId(volumeCheckId) })
      ]);
      
      logger.info('存在チェック完了 (直接実装)', { 
        time: `${Date.now() - existsCheckStart}ms`,
        propertyExists: !!propertyExists,
        volumeCheckExists: !!volumeCheckExists
      });
      
      if (!propertyExists) {
        sendNotFoundError(res, '指定された物件が見つかりません');
        return;
      }
      
      if (!volumeCheckExists) {
        sendNotFoundError(res, '指定されたボリュームチェック結果が見つかりません');
        return;
      }
      
      // 関連性チェック: 最小限のフィールド取得で高速化
      const relationCheckStart = Date.now();
      const volumeCheckRef = await MongoVolumeCheckModel.findOne(
        { _id: new mongoose.Types.ObjectId(volumeCheckId) },
        { propertyId: 1 }
      ).lean();
      
      logger.info('関連性チェック完了 (直接実装)', { 
        time: `${Date.now() - relationCheckStart}ms`,
        propertyId,
        volumeCheckPropertyId: volumeCheckRef?.propertyId
      });
      
      if (volumeCheckRef && volumeCheckRef.propertyId !== propertyId) {
        sendError(res, '指定されたボリュームチェック結果は、指定された物件に関連付けられていません', 'RELATED_ERROR', 400);
        return;
      }
      
      // 直接MongoDBを使用してインサート - テストで成功したパターンを採用
      const dbWriteStart = Date.now();
      logger.info('DB書き込み前 (直接実装)', { time: `${Date.now() - startTime}ms` });
      
      // シナリオデータの準備
      const now = new Date();
      const scenarioDoc = {
        propertyId,
        volumeCheckId,
        name,
        params,
        userId,
        createdAt: now,
        updatedAt: now
      };
      
      // テストで成功したパターンを採用 - MongoDBコレクションに直接アクセス
      const { ScenarioModel: MongoScenarioModel } = require('../../db/models/schemas/scenario.schema');
      const insertResult = await MongoScenarioModel.create(scenarioDoc);
      const scenarioId = insertResult._id;
      
      logger.info('DB書き込み完了 (直接実装)', { 
        time: `${Date.now() - dbWriteStart}ms`,
        scenarioId: scenarioId.toString()
      });
      
      // 結果オブジェクトを構築
      const scenario = {
        ...scenarioDoc,
        id: scenarioId.toString(),
        _id: scenarioId
      };
      
      // 成功レスポンス
      const responseStart = Date.now();
      sendSuccess(res, scenario, 201);
      logger.info('レスポンス送信完了 (直接実装)', { time: `${Date.now() - responseStart}ms` });
      
      // 全体の実行時間
      logger.info('シナリオ作成完了 (直接実装) - 全体処理時間', { time: `${Date.now() - startTime}ms` });
      
    } catch (error: any) {
      // エラーログ
      logger.error('シナリオ作成エラー (直接実装)', { 
        time: `${Date.now() - startTime}ms`,
        error, 
        body: req.body 
      });
      
      // MongoDBエラーハンドリング
      if (error.name === 'ValidationError') {
        sendError(res, 'シナリオデータが不正です', 'VALIDATION_ERROR', 400, {
          details: Object.values(error.errors).map((err: any) => err.message)
        });
        return;
      }
      
      next(error);
    }
  }

  /**
   * シナリオ作成 - サービス層経由実装
   * POST /api/v1/analysis/scenarios
   */
  static async createScenario(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    // タイムスタンプ計測用
    const startTime = Date.now();
    
    try {
      logger.info('シナリオ作成開始', { 
        time: `${Date.now() - startTime}ms`,
        body: req.body 
      });
      
      const { propertyId, volumeCheckId, name, params } = req.body;
      const userId = req.user?.id;
      
      // バリデーション計測
      const validationStart = Date.now();
      
      // バリデーション: 最小限のチェックのみで高速化
      if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
        sendError(res, '有効な物件IDを指定してください', 'VALIDATION_ERROR', 400);
        return;
      }
      
      if (!volumeCheckId || !mongoose.Types.ObjectId.isValid(volumeCheckId)) {
        sendError(res, '有効なボリュームチェックIDを指定してください', 'VALIDATION_ERROR', 400);
        return;
      }
      
      if (!name || typeof name !== 'string' || name.trim() === '') {
        sendError(res, '有効なシナリオ名を指定してください', 'VALIDATION_ERROR', 400);
        return;
      }
      
      if (!params || typeof params !== 'object') {
        sendError(res, '有効なシナリオパラメータを指定してください', 'VALIDATION_ERROR', 400);
        return;
      }
      
      logger.info('バリデーション完了', { time: `${Date.now() - validationStart}ms` });
      
      // 物件とボリュームチェックの存在確認
      const referenceCheckStart = Date.now();
      
      // 超高速参照チェック: コレクション直接アクセス
      const { PropertyModel: MongoPropertyModel } = require('../../db/models/schemas/property.schema');
      const { VolumeCheckModel: MongoVolumeCheckModel } = require('../../db/models/schemas/volumeCheck.schema');
      
      logger.info('DBモデル取得完了', { time: `${Date.now() - referenceCheckStart}ms` });
      
      // 文字列のままの_idを使用して直接存在チェック
      const propertyCheckStart = Date.now();
      const propertyExists = await MongoPropertyModel.exists({ _id: new mongoose.Types.ObjectId(propertyId) });
      logger.info('物件確認完了', { time: `${Date.now() - propertyCheckStart}ms`, exists: !!propertyExists });
      
      if (!propertyExists) {
        sendNotFoundError(res, '指定された物件が見つかりません');
        return;
      }
      
      const volumeCheckStart = Date.now();
      const volumeCheckExists = await MongoVolumeCheckModel.exists({ _id: new mongoose.Types.ObjectId(volumeCheckId) });
      logger.info('ボリュームチェック確認完了', { time: `${Date.now() - volumeCheckStart}ms`, exists: !!volumeCheckExists });
      
      if (!volumeCheckExists) {
        sendNotFoundError(res, '指定されたボリュームチェック結果が見つかりません');
        return;
      }
      
      // 関連性チェック: 最小限のフィールド取得で高速化
      const relationCheckStart = Date.now();
      const volumeCheckRef = await MongoVolumeCheckModel.findOne(
        { _id: new mongoose.Types.ObjectId(volumeCheckId) },
        { propertyId: 1 }
      ).lean();
      
      logger.info('関連性チェック完了', { 
        time: `${Date.now() - relationCheckStart}ms`,
        propertyId,
        volumeCheckPropertyId: volumeCheckRef?.propertyId
      });
      
      if (volumeCheckRef && volumeCheckRef.propertyId !== propertyId) {
        sendError(res, '指定されたボリュームチェック結果は、指定された物件に関連付けられていません', 'RELATED_ERROR', 400);
        return;
      }
      
      // サービス層を使用 - ボトルネックの分析用
      const serviceCallStart = Date.now();
      logger.info('ScenarioService呼び出し前', { time: `${Date.now() - startTime}ms` });
      
      try {
        const scenario = await ScenarioService.createScenario(
          propertyId,
          volumeCheckId,
          name,
          params as ScenarioParams,
          userId
        );
        
        logger.info('ScenarioService呼び出し完了', { 
          time: `${Date.now() - serviceCallStart}ms`,
          scenarioId: scenario.id
        });
        
        // 成功レスポンス
        const responseStart = Date.now();
        sendSuccess(res, scenario, 201);
        logger.info('レスポンス送信完了', { time: `${Date.now() - responseStart}ms` });
        
        // 全体の実行時間ログ
        logger.info('シナリオ作成完了 - 全体処理時間', { time: `${Date.now() - startTime}ms` });
        
        return;
      } catch (serviceError) {
        logger.error('ScenarioService.createScenario呼び出しエラー', { 
          time: `${Date.now() - serviceCallStart}ms`,
          error: serviceError
        });
        throw serviceError;
      }
      
      // このコードは到達しない（上記serviceCallでレスポンスが返される）
      
    } catch (error: any) {
      // エラーログ
      logger.error('シナリオ作成エラー', { 
        time: `${Date.now() - startTime}ms`,
        error, 
        body: req.body 
      });
      
      // MongoDBエラーハンドリング
      if (error.name === 'ValidationError') {
        sendError(res, 'シナリオデータが不正です', 'VALIDATION_ERROR', 400, {
          details: Object.values(error.errors).map((err: any) => err.message)
        });
        return;
      }
      
      next(error);
    }
  }

  /**
   * シナリオ更新
   * PUT /api/v1/analysis/scenarios/:scenarioId
   */
  static async updateScenario(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    // 処理時間計測開始
    const startTime = Date.now();
    
    try {
      logger.info('シナリオ更新開始', { 
        time: `${Date.now() - startTime}ms`, 
        scenarioId: req.params.scenarioId 
      });
      
      const { scenarioId } = req.params;
      const { name, params } = req.body;
      const userId = req.user?.id;
      
      // 更新データの準備
      const updateData: { name?: string; params?: ScenarioParams } = {};
      if (name !== undefined) updateData.name = name;
      if (params !== undefined) updateData.params = params as ScenarioParams;
      
      logger.info('更新データ準備完了', { 
        time: `${Date.now() - startTime}ms`,
        hasName: name !== undefined,
        hasParams: params !== undefined
      });
      
      // 権限チェック（必要な場合）
      const authCheckStart = Date.now();
      if (userId) {
        // 権限チェックが必要な場合のみシナリオを取得
        const existing = await ScenarioModel.findById(scenarioId);
        
        if (!existing) {
          logger.info('シナリオが見つかりません', { 
            time: `${Date.now() - startTime}ms`, 
            scenarioId 
          });
          sendNotFoundError(res, '指定されたシナリオが見つかりません');
          return;
        }
        
        // ユーザー権限チェック
        if (existing.userId && existing.userId !== userId) {
          logger.warn('シナリオ更新の権限なし', { 
            time: `${Date.now() - startTime}ms`,
            userId,
            scenarioId,
            scenarioUserId: existing.userId
          });
          sendError(res, '更新する権限がありません', 'PERMISSION_ERROR', 403);
          return;
        }
      }
      logger.info('権限チェック完了', { time: `${Date.now() - authCheckStart}ms` });
      
      // モデルを直接使用してシナリオを更新
      const dbOpStart = Date.now();
      const scenario = await ScenarioModel.update(scenarioId, updateData);
      logger.info('DB更新処理完了', { time: `${Date.now() - dbOpStart}ms` });
      
      // 結果チェック
      if (!scenario) {
        sendNotFoundError(res, '指定されたシナリオが見つかりません');
        return;
      }
      
      // 成功レスポンス
      sendSuccess(res, scenario);
      
      // 全体の実行時間ログ
      logger.info('シナリオ更新完了 - 全体処理時間', { time: `${Date.now() - startTime}ms` });
    } catch (error) {
      logger.error('シナリオ更新エラー', { 
        time: `${Date.now() - startTime}ms`,
        error, 
        scenarioId: req.params.scenarioId, 
        body: req.body 
      });
      next(error);
    }
  }

  /**
   * シナリオ取得
   * GET /api/v1/analysis/scenarios/:scenarioId
   */
  static async getScenario(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { scenarioId } = req.params;
      // フィールド名の修正: profitabilityResult -> profitabilityResultId
      const includeProfitability = req.query.include === 'profitabilityResultId' || req.query.include === 'profitabilityResult';
      
      if (includeProfitability) {
        // ログ出力などを行います
        logger.info('収益性試算結果を含めてシナリオを取得します', {
          scenarioId,
          includeParam: req.query.include
        });
      }
      
      // シナリオ取得
      const scenario = await ScenarioService.getScenarioById(scenarioId, includeProfitability);
      
      // 結果チェック
      if (!scenario) {
        sendNotFoundError(res, '指定されたシナリオが見つかりません');
        return;
      }
      
      // 成功レスポンス
      sendSuccess(res, scenario);
    } catch (error) {
      logger.error('シナリオ取得エラー', { error, scenarioId: req.params.scenarioId });
      next(error);
    }
  }

  /**
   * 物件IDでシナリオ一覧取得
   * GET /api/v1/analysis/scenarios
   */
  static async getScenarios(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId, volumeCheckId } = req.query;
      // クエリパラメータからページネーション情報を取得
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      
      // パラメータの型を確認
      if (propertyId && typeof propertyId !== 'string') {
        sendError(res, 'propertyIdは文字列で指定してください', 'VALIDATION_ERROR', 400);
        return;
      }
      
      if (volumeCheckId && typeof volumeCheckId !== 'string') {
        sendError(res, 'volumeCheckIdは文字列で指定してください', 'VALIDATION_ERROR', 400);
        return;
      }
      
      // どちらかのパラメータが必要
      if (!propertyId && !volumeCheckId) {
        sendError(res, 'propertyIdまたはvolumeCheckIdのいずれかを指定してください', 'VALIDATION_ERROR', 400);
        return;
      }
      
      // シナリオ一覧取得（最適化された直接DBアクセス）
      let result;
      if (propertyId) {
        // 最適化されたモデル関数を直接使用
        result = await ScenarioModel.findByPropertyId(propertyId, page, limit);
      } else {
        result = await ScenarioModel.findByVolumeCheckId(volumeCheckId as string, page, limit);
      }
      
      // 成功レスポンス（空配列でも成功）
      sendSuccess(res, result.scenarios, 200, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      });
    } catch (error) {
      logger.error('シナリオ一覧取得エラー', { error, query: req.query });
      next(error);
    }
  }

  /**
   * シナリオ削除 - モデル直接アクセスで最適化
   * DELETE /api/v1/analysis/scenarios/:scenarioId
   */
  static async deleteScenario(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    // 処理時間計測開始
    const startTime = Date.now();
    
    try {
      const { scenarioId } = req.params;
      const userId = req.user?.id;
      
      // ScenarioModelを直接使用して処理（サービスをバイパス）
      logger.info('シナリオ削除処理開始', { 
        time: `${Date.now() - startTime}ms`,
        scenarioId
      });
      
      // 権限チェックなどの最小限の検証
      if (!scenarioId || !mongoose.Types.ObjectId.isValid(scenarioId)) {
        sendError(res, '有効なシナリオIDを指定してください', 'VALIDATION_ERROR', 400);
        return;
      }
      
      // シナリオの取得
      const checkStart = Date.now();
      // 権限チェックが必要な場合のみシナリオを取得
      let scenario = null;
      if (userId) {
        scenario = await ScenarioModel.findById(scenarioId);
        
        // 存在確認
        if (!scenario) {
          logger.info('シナリオ削除 - シナリオが見つかりません', {
            time: `${Date.now() - startTime}ms`,
            scenarioId
          });
          sendNotFoundError(res, '指定されたシナリオが見つかりません');
          return;
        }
        
        // ユーザー権限チェック
        if (scenario.userId && scenario.userId !== userId) {
          logger.warn('シナリオ削除 - 権限なし', {
            time: `${Date.now() - startTime}ms`,
            userId,
            scenarioId
          });
          sendError(res, '削除する権限がありません', 'PERMISSION_ERROR', 403);
          return;
        }
      }
      
      logger.info('シナリオ削除の権限チェック完了', { 
        time: `${Date.now() - checkStart}ms` 
      });
      
      // 削除処理実行（モデルを直接使用）
      const deleteStart = Date.now();
      const deleted = await ScenarioModel.delete(scenarioId);
      logger.info('シナリオ削除処理完了', { 
        time: `${Date.now() - deleteStart}ms`,
        success: deleted
      });
      
      // 結果チェック
      if (!deleted) {
        sendNotFoundError(res, '指定されたシナリオが見つかりません');
        return;
      }
      
      // 成功レスポンス（204 No Content）
      res.status(204).end();
      
      // 全体の実行時間ログ
      logger.info('シナリオ削除完了 - 全体処理時間', { 
        time: `${Date.now() - startTime}ms`
      });
    } catch (error) {
      logger.error('シナリオ削除エラー', { 
        time: `${Date.now() - startTime}ms`,
        error, 
        scenarioId: req.params.scenarioId 
      });
      next(error);
    }
  }

  /**
   * シナリオから収益性試算実行
   * POST /api/v1/analysis/scenarios/:scenarioId/profitability
   */
  static async executeProfitabilityFromScenario(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { scenarioId } = req.params;
      const userId = req.user?.id;
      
      // シナリオから収益性試算実行
      const profitability = await ScenarioService.executeProfitabilityFromScenario(
        scenarioId,
        userId
      );
      
      // 成功レスポンス
      sendSuccess(res, profitability, 201);
    } catch (error: any) {
      // エラーログ
      logger.error('シナリオからの収益性試算実行エラー', { error, scenarioId: req.params.scenarioId });
      
      // 適切なエラーレスポンス
      if (error.message.includes('シナリオが見つかりません')) {
        sendNotFoundError(res, '指定されたシナリオが見つかりません');
      } else if (error.message.includes('物件が見つかりません')) {
        sendNotFoundError(res, '関連する物件が見つかりません');
      } else if (error.message.includes('ボリュームチェック結果が見つかりません')) {
        sendNotFoundError(res, '関連するボリュームチェック結果が見つかりません');
      } else if (error.message.includes('計算')) {
        sendError(res, '収益性試算の計算に失敗しました', 'CALCULATION_ERROR', 400, {
          details: error.message
        });
      } else {
        next(error);
      }
    }
  }
}