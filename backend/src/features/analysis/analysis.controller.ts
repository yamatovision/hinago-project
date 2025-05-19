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
      
      // 物件IDでボリュームチェック一覧取得
      const result = await VolumeCheckService.getVolumeChecksByPropertyId(propertyId);
      
      // 成功レスポンス（空配列でも成功）
      sendSuccess(res, result.volumeChecks, 200, {
        total: result.total
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
      
      // 物件IDで収益性試算結果一覧取得
      const result = await ProfitabilityService.getProfitabilitiesByPropertyId(propertyId);
      
      // 成功レスポンス（空配列でも成功）
      sendSuccess(res, result.profitabilityResults, 200, {
        total: result.total
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
      
      // ボリュームチェックIDで収益性試算結果一覧取得
      const result = await ProfitabilityService.getProfitabilitiesByVolumeCheckId(volumeCheckId);
      
      // 成功レスポンス（空配列でも成功）
      sendSuccess(res, result.profitabilityResults, 200, {
        total: result.total
      });
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
   * シナリオ作成
   * POST /api/v1/analysis/scenarios
   */
  static async createScenario(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyId, volumeCheckId, name, params } = req.body;
      const userId = req.user?.id;
      
      // シナリオ作成
      const scenario = await ScenarioService.createScenario(
        propertyId,
        volumeCheckId,
        name,
        params as ScenarioParams,
        userId
      );
      
      // 成功レスポンス
      sendSuccess(res, scenario, 201);
    } catch (error: any) {
      // エラーログ
      logger.error('シナリオ作成エラー', { error, body: req.body });
      
      // 適切なエラーレスポンス
      if (error.message.includes('物件が見つかりません')) {
        sendNotFoundError(res, '指定された物件が見つかりません');
      } else if (error.message.includes('ボリュームチェック結果が見つかりません')) {
        sendNotFoundError(res, '指定されたボリュームチェック結果が見つかりません');
      } else if (error.message.includes('関連付けられていません')) {
        sendError(res, '指定されたボリュームチェック結果は、指定された物件に関連付けられていません', 'RELATED_ERROR', 400);
      } else {
        next(error);
      }
    }
  }

  /**
   * シナリオ更新
   * PUT /api/v1/analysis/scenarios/:scenarioId
   */
  static async updateScenario(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { scenarioId } = req.params;
      const { name, params } = req.body;
      const userId = req.user?.id;
      
      // 更新データの作成
      const updateData: { name?: string; params?: ScenarioParams } = {};
      if (name !== undefined) updateData.name = name;
      if (params !== undefined) updateData.params = params as ScenarioParams;
      
      // シナリオ更新
      const scenario = await ScenarioService.updateScenario(
        scenarioId,
        updateData,
        userId
      );
      
      // 結果チェック
      if (!scenario) {
        sendNotFoundError(res, '指定されたシナリオが見つかりません');
        return;
      }
      
      // 成功レスポンス
      sendSuccess(res, scenario);
    } catch (error) {
      logger.error('シナリオ更新エラー', { error, scenarioId: req.params.scenarioId, body: req.body });
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
      const includeProfitability = req.query.include === 'profitabilityResult';
      
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
      
      // シナリオ一覧取得
      let result;
      if (propertyId) {
        result = await ScenarioService.getScenariosByPropertyId(propertyId);
      } else {
        result = await ScenarioService.getScenariosByVolumeCheckId(volumeCheckId as string);
      }
      
      // 成功レスポンス（空配列でも成功）
      sendSuccess(res, result.scenarios, 200, {
        total: result.total
      });
    } catch (error) {
      logger.error('シナリオ一覧取得エラー', { error, query: req.query });
      next(error);
    }
  }

  /**
   * シナリオ削除
   * DELETE /api/v1/analysis/scenarios/:scenarioId
   */
  static async deleteScenario(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { scenarioId } = req.params;
      const userId = req.user?.id;
      
      // シナリオ削除
      const deleted = await ScenarioService.deleteScenario(scenarioId, userId);
      
      // 結果チェック
      if (!deleted) {
        sendNotFoundError(res, '指定されたシナリオが見つかりません');
        return;
      }
      
      // 成功レスポンス（204 No Content）
      res.status(204).end();
    } catch (error) {
      logger.error('シナリオ削除エラー', { error, scenarioId: req.params.scenarioId });
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