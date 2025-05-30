/**
 * 分析機能用サービス
 */
import { 
  BuildingParams, 
  VolumeCheck,
  AssetType,
  Property,
  FinancialParams,
  ProfitabilityResult,
  ScenarioParams,
  Scenario
} from '../../types';
import { logger } from '../../common/utils';
import { 
  PropertyModel, 
  VolumeCheckModel, 
  ProfitabilityModel,
  ScenarioModel 
} from '../../db/models';
import { 
  calculateVolumeCheck, 
  calculateProfitability,
  getDefaultFinancialParamsByAssetType
} from './analysis.utils';
import mongoose from 'mongoose';

/**
 * ボリュームチェックサービスクラス
 */
export class VolumeCheckService {
  /**
   * ボリュームチェックを実行
   * @param propertyId 物件ID
   * @param buildingParams 建築パラメータ
   * @param userId ユーザーID
   * @returns ボリュームチェック結果
   */
  static async executeVolumeCheck(
    propertyId: string,
    buildingParams: BuildingParams,
    userId?: string
  ): Promise<VolumeCheck> {
    try {
      // 物件データの取得
      const property = await PropertyModel.findById(propertyId);
      if (!property) {
        throw new Error(`物件が見つかりません (ID: ${propertyId})`);
      }
      
      // ボリュームチェック計算
      const volumeCheckData = await calculateVolumeCheck(property, buildingParams, userId);
      
      // 結果をDBに保存
      const volumeCheck = await VolumeCheckModel.create(volumeCheckData);
      
      return volumeCheck;
    } catch (error) {
      logger.error('ボリュームチェック実行エラー', { error, propertyId });
      throw error;
    }
  }

  /**
   * ボリュームチェック結果を取得
   * @param volumeCheckId ボリュームチェック結果ID
   * @returns ボリュームチェック結果
   */
  static async getVolumeCheckById(volumeCheckId: string): Promise<VolumeCheck | null> {
    try {
      return await VolumeCheckModel.findById(volumeCheckId);
    } catch (error) {
      logger.error('ボリュームチェック結果取得エラー', { error, volumeCheckId });
      throw error;
    }
  }

  /**
   * 物件に関連するボリュームチェック結果を取得
   * @param propertyId 物件ID
   * @param page ページ番号
   * @param limit 1ページあたりの件数
   * @returns ボリュームチェック結果リストとメタデータ
   */
  static async getVolumeChecksByPropertyId(
    propertyId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ volumeChecks: VolumeCheck[]; total: number; page: number; limit: number; totalPages: number; }> {
    try {
      return await VolumeCheckModel.findByPropertyId(propertyId, page, limit);
    } catch (error) {
      logger.error('物件関連ボリュームチェック結果取得エラー', { error, propertyId });
      throw error;
    }
  }

  /**
   * ボリュームチェック結果を削除
   * @param volumeCheckId ボリュームチェック結果ID
   * @param userId ユーザーID（権限チェック用）
   * @returns 削除が成功したかどうか
   */
  static async deleteVolumeCheck(
    volumeCheckId: string,
    userId?: string
  ): Promise<boolean> {
    try {
      // 結果の取得
      const volumeCheck = await VolumeCheckModel.findById(volumeCheckId);
      if (!volumeCheck) {
        return false;
      }
      
      // ユーザーIDが指定されている場合、権限チェック
      if (userId && volumeCheck.userId && volumeCheck.userId !== userId) {
        // 管理者権限のチェックなどの追加ロジックをここに実装
        // 将来的な拡張のためのプレースホルダー
        // 現状ではシンプルにユーザーIDが一致するかのみをチェック
        logger.warn('ボリュームチェック結果削除の権限なし', { userId, volumeCheckId });
        return false;
      }
      
      // 関連する収益性試算結果を削除
      await ProfitabilityModel.deleteByVolumeCheckId(volumeCheckId);
      
      // 関連するシナリオを削除
      await ScenarioModel.deleteByVolumeCheckId(volumeCheckId);
      
      // 結果の削除
      return await VolumeCheckModel.delete(volumeCheckId);
    } catch (error) {
      logger.error('ボリュームチェック結果削除エラー', { error, volumeCheckId });
      throw error;
    }
  }
}

/**
 * 収益性試算サービスクラス
 */
export class ProfitabilityService {
  /**
   * 収益性試算を実行
   * @param propertyId 物件ID
   * @param volumeCheckId ボリュームチェック結果ID
   * @param financialParams 財務パラメータ
   * @param userId ユーザーID
   * @returns 収益性試算結果
   */
  static async executeProfitability(
    propertyId: string,
    volumeCheckId: string,
    financialParams: FinancialParams,
    userId?: string
  ): Promise<ProfitabilityResult> {
    try {
      // 物件データの取得
      const property = await PropertyModel.findById(propertyId);
      if (!property) {
        throw new Error(`物件が見つかりません (ID: ${propertyId})`);
      }
      
      // ボリュームチェック結果の取得
      const volumeCheck = await VolumeCheckModel.findById(volumeCheckId);
      if (!volumeCheck) {
        throw new Error(`ボリュームチェック結果が見つかりません (ID: ${volumeCheckId})`);
      }
      
      // ボリュームチェック結果と物件IDの関連性チェック
      if (volumeCheck.propertyId !== propertyId) {
        throw new Error(`指定されたボリュームチェック結果は、指定された物件に関連付けられていません`);
      }
      
      // 収益性試算計算
      const profitabilityData = await calculateProfitability(
        property, 
        volumeCheck, 
        financialParams,
        userId
      );
      
      // 結果をDBに保存
      const profitability = await ProfitabilityModel.create(profitabilityData);
      
      return profitability;
    } catch (error) {
      logger.error('収益性試算実行エラー', { 
        error, 
        propertyId, 
        volumeCheckId 
      });
      throw error;
    }
  }

  /**
   * 収益性試算結果を取得
   * @param profitabilityId 収益性試算結果ID
   * @returns 収益性試算結果
   */
  static async getProfitabilityById(profitabilityId: string): Promise<ProfitabilityResult | null> {
    try {
      return await ProfitabilityModel.findById(profitabilityId);
    } catch (error) {
      logger.error('収益性試算結果取得エラー', { error, profitabilityId });
      throw error;
    }
  }

  /**
   * 物件に関連する収益性試算結果を取得
   * @param propertyId 物件ID
   * @param page ページ番号
   * @param limit 1ページあたりの件数
   * @returns 収益性試算結果リストとメタデータ
   */
  static async getProfitabilitiesByPropertyId(
    propertyId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ profitabilityResults: ProfitabilityResult[]; total: number; page: number; limit: number; totalPages: number; }> {
    try {
      return await ProfitabilityModel.findByPropertyId(propertyId, page, limit);
    } catch (error) {
      logger.error('物件関連収益性試算結果取得エラー', { error, propertyId });
      throw error;
    }
  }

  /**
   * ボリュームチェック結果に関連する収益性試算結果を取得
   * @param volumeCheckId ボリュームチェック結果ID
   * @param page ページ番号
   * @param limit 1ページあたりの件数
   * @returns 収益性試算結果リストとメタデータ
   */
  static async getProfitabilitiesByVolumeCheckId(
    volumeCheckId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ profitabilityResults: ProfitabilityResult[]; total: number; page: number; limit: number; totalPages: number; }> {
    try {
      // パフォーマンス最適化版 - 直接DBにアクセス
      const startTime = Date.now();
      logger.info('収益性試算結果取得開始', { volumeCheckId, page, limit });
      
      // モンゴDBスキーマに直接アクセス
      try {
        const { ProfitabilityModel: MongoProfitabilityModel } = require('../../db/models/schemas/profitability.schema');
        
        // ページネーションの設定
        const skip = (page - 1) * limit;
        
        // 並列で総件数とデータを取得（高速化）
        const [total, profitabilityResults] = await Promise.all([
          MongoProfitabilityModel.countDocuments({ volumeCheckId }),
          MongoProfitabilityModel.find({ volumeCheckId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
        ]);
        
        // 総ページ数を計算
        const totalPages = Math.ceil(total / limit);
        
        // _id を id に変換
        const formattedResults = profitabilityResults.map((result: any) => ({
          ...result,
          id: String(result._id),
        })) as ProfitabilityResult[];
        
        logger.info('収益性試算結果取得完了', { 
          volumeCheckId, 
          page, 
          limit, 
          time: `${Date.now() - startTime}ms`,
          resultCount: formattedResults.length
        });
        
        return {
          profitabilityResults: formattedResults,
          total,
          page,
          limit,
          totalPages
        };
      } catch (dbError) {
        logger.error('収益性試算結果DB取得エラー', { 
          dbError, 
          volumeCheckId,
          time: `${Date.now() - startTime}ms` 
        });
        
        // エラーが発生した場合は標準のモデルに戻す
        return await ProfitabilityModel.findByVolumeCheckId(volumeCheckId, page, limit);
      }
    } catch (error) {
      logger.error('ボリュームチェック関連収益性試算結果取得エラー', { error, volumeCheckId });
      throw error;
    }
  }

  /**
   * 収益性試算結果を削除
   * @param profitabilityId 収益性試算結果ID
   * @param userId ユーザーID（権限チェック用）
   * @returns 削除が成功したかどうか
   */
  static async deleteProfitability(
    profitabilityId: string,
    userId?: string
  ): Promise<boolean> {
    try {
      // 結果の取得
      const profitability = await ProfitabilityModel.findById(profitabilityId);
      if (!profitability) {
        return false;
      }
      
      // ユーザーIDが指定されている場合、権限チェック
      if (userId && profitability.userId && profitability.userId !== userId) {
        // 管理者権限のチェックなどの追加ロジックをここに実装
        logger.warn('収益性試算結果削除の権限なし', { userId, profitabilityId });
        return false;
      }
      
      // 1対1モデルの場合は、関連するシナリオの参照を解除する
      if (profitability.scenarioId) {
        await ScenarioModel.update(
          profitability.scenarioId,
          { profitabilityResultId: undefined }
        );
      }
      
      // 念のため、多対1関係が残っている可能性を考慮して一括更新を導入
      // 直接MongoDBモデルにアクセスして高速な一括更新を実行
      try {
        const { ScenarioModel: MongoScenarioModel } = require('../../db/models/schemas/scenario.schema');
        await MongoScenarioModel.updateMany(
          { profitabilityResultId: profitabilityId },
          { $unset: { profitabilityResultId: "" } }
        );
        logger.info('収益性試算結果の参照をすべて解除しました', { profitabilityId });
      } catch (updateError) {
        logger.warn('シナリオの一括更新中にエラーが発生しましたが、処理を続行します', { 
          updateError, 
          profitabilityId 
        });
      }
      
      // 結果の削除
      return await ProfitabilityModel.delete(profitabilityId);
    } catch (error) {
      logger.error('収益性試算結果削除エラー', { error, profitabilityId });
      throw error;
    }
  }
}

/**
 * シナリオサービスクラス
 */
export class ScenarioService {
  /**
   * シナリオを作成 - 最適化バージョン
   * @param propertyId 物件ID
   * @param volumeCheckId ボリュームチェック結果ID
   * @param name シナリオ名
   * @param params シナリオパラメータ
   * @param userId ユーザーID
   * @returns 作成されたシナリオ
   */
  static async createScenario(
    propertyId: string,
    volumeCheckId: string,
    name: string,
    params: ScenarioParams,
    userId?: string
  ): Promise<Scenario> {
    const startTime = Date.now();
    
    try {
      logger.info('ScenarioService.createScenario開始', { 
        time: `${Date.now() - startTime}ms`,
        propertyId, 
        volumeCheckId,
        name
      });
      
      // 関連性チェックはすでにコントローラーで実施済みと想定
      // デバッグ用コメント: ここでID存在チェックやリレーションチェックは省略
      
      // シナリオデータの作成
      const scenarioData = {
        propertyId,
        volumeCheckId,
        name,
        params,
        userId
      };
      
      // シナリオをDBに保存 - パフォーマンス最適化版
      const dbSaveStart = Date.now();
      logger.info('シナリオDB保存開始', { time: `${Date.now() - startTime}ms` });
      
      // モデルクラスを直接使用して高速に保存
      const { ScenarioModel: MongoScenarioModel } = require('../../db/models/schemas/scenario.schema');
      
      // データを準備
      const now = new Date();
      const docToInsert = {
        ...scenarioData,
        createdAt: now,
        updatedAt: now
      };
      
      // MongoDB ネイティブ操作を使用（高速）
      const insertResult = await MongoScenarioModel.create(docToInsert);
      const scenarioId = insertResult._id;
      
      // 結果オブジェクトを構築
      const scenario = {
        ...docToInsert,
        id: scenarioId.toString(),
        _id: scenarioId
      } as Scenario;
      
      logger.info('シナリオDB保存完了', { 
        time: `${Date.now() - dbSaveStart}ms`,
        scenarioId: scenario.id
      });
      
      // 全体の実行時間
      logger.info('ScenarioService.createScenario完了', { 
        time: `${Date.now() - startTime}ms`,
        scenarioId: scenario.id
      });
      
      return scenario;
    } catch (error) {
      logger.error('シナリオ作成エラー (サービス層)', { 
        time: `${Date.now() - startTime}ms`,
        error, 
        propertyId, 
        volumeCheckId 
      });
      throw error;
    }
  }

  /**
   * 既存のシナリオを更新
   * @param scenarioId シナリオID
   * @param updateData 更新データ
   * @param userId ユーザーID（権限チェック用）
   * @returns 更新されたシナリオまたはnull
   */
  static async updateScenario(
    scenarioId: string,
    updateData: { name?: string; params?: ScenarioParams },
    userId?: string
  ): Promise<Scenario | null> {
    try {
      // シナリオの取得
      const scenario = await ScenarioModel.findById(scenarioId);
      if (!scenario) {
        return null;
      }
      
      // ユーザーIDが指定されている場合、権限チェック
      if (userId && scenario.userId && scenario.userId !== userId) {
        // 管理者権限のチェックなどの追加ロジックをここに実装
        // 将来的な拡張のためのプレースホルダー
        // 現状ではシンプルにユーザーIDが一致するかのみをチェック
        logger.warn('シナリオ更新の権限なし', { userId, scenarioId });
        return null;
      }
      
      // シナリオの更新
      return await ScenarioModel.update(scenarioId, updateData);
    } catch (error) {
      logger.error('シナリオ更新エラー', { error, scenarioId });
      throw error;
    }
  }

  /**
   * シナリオを取得
   * @param scenarioId シナリオID
   * @param includeProfitability 収益性試算結果を含めるかどうか
   * @returns シナリオ
   */
  static async getScenarioById(
    scenarioId: string, 
    includeProfitability: boolean = false
  ): Promise<Scenario | null> {
    try {
      return await ScenarioModel.findById(scenarioId, includeProfitability);
    } catch (error) {
      logger.error('シナリオ取得エラー', { error, scenarioId });
      throw error;
    }
  }

  /**
   * 物件に関連するシナリオを取得
   * @param propertyId 物件ID
   * @param page ページ番号
   * @param limit 1ページあたりの件数
   * @returns シナリオリストとメタデータ
   */
  static async getScenariosByPropertyId(
    propertyId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ scenarios: Scenario[]; total: number; page: number; limit: number; totalPages: number; }> {
    try {
      return await ScenarioModel.findByPropertyId(propertyId, page, limit);
    } catch (error) {
      logger.error('物件関連シナリオ取得エラー', { error, propertyId });
      throw error;
    }
  }

  /**
   * ボリュームチェック結果に関連するシナリオを取得
   * @param volumeCheckId ボリュームチェック結果ID
   * @param page ページ番号
   * @param limit 1ページあたりの件数
   * @returns シナリオリストとメタデータ
   */
  static async getScenariosByVolumeCheckId(
    volumeCheckId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ scenarios: Scenario[]; total: number; page: number; limit: number; totalPages: number; }> {
    try {
      return await ScenarioModel.findByVolumeCheckId(volumeCheckId, page, limit);
    } catch (error) {
      logger.error('ボリュームチェック関連シナリオ取得エラー', { error, volumeCheckId });
      throw error;
    }
  }

  /**
   * シナリオを削除
   * @param scenarioId シナリオID
   * @param userId ユーザーID（権限チェック用）
   * @returns 削除が成功したかどうか
   */
  static async deleteScenario(
    scenarioId: string,
    userId?: string
  ): Promise<boolean> {
    try {
      // シナリオの取得
      const scenario = await ScenarioModel.findById(scenarioId);
      if (!scenario) {
        return false;
      }
      
      // ユーザーIDが指定されている場合、権限チェック
      if (userId && scenario.userId && scenario.userId !== userId) {
        // 管理者権限のチェックなどの追加ロジックをここに実装
        // 将来的な拡張のためのプレースホルダー
        // 現状ではシンプルにユーザーIDが一致するかのみをチェック
        logger.warn('シナリオ削除の権限なし', { userId, scenarioId });
        return false;
      }
      
      // シナリオの削除
      return await ScenarioModel.delete(scenarioId);
    } catch (error) {
      logger.error('シナリオ削除エラー', { error, scenarioId });
      throw error;
    }
  }

  /**
   * シナリオに収益性試算結果を関連付ける
   * @param scenarioId シナリオID
   * @param profitabilityId 収益性試算結果ID
   * @param userId ユーザーID（権限チェック用）
   * @returns 更新されたシナリオまたはnull
   */
  static async linkScenarioToProfitability(
    scenarioId: string,
    profitabilityId: string,
    userId?: string
  ): Promise<Scenario | null> {
    try {
      // シナリオの取得
      const scenario = await ScenarioModel.findById(scenarioId);
      if (!scenario) {
        return null;
      }
      
      // ユーザーIDが指定されている場合、権限チェック
      if (userId && scenario.userId && scenario.userId !== userId) {
        // 管理者権限のチェックなどの追加ロジックをここに実装
        // 将来的な拡張のためのプレースホルダー
        // 現状ではシンプルにユーザーIDが一致するかのみをチェック
        logger.warn('シナリオ更新の権限なし', { userId, scenarioId });
        return null;
      }
      
      // 収益性試算結果の取得
      const profitability = await ProfitabilityModel.findById(profitabilityId);
      if (!profitability) {
        throw new Error(`収益性試算結果が見つかりません (ID: ${profitabilityId})`);
      }
      
      // 関連付けの整合性チェック
      if (profitability.propertyId !== scenario.propertyId || 
          profitability.volumeCheckId !== scenario.volumeCheckId) {
        throw new Error('シナリオと収益性試算結果の関連付けが一致しません');
      }
      
      // 1対1関係を維持するための追加チェック
      // 既に他のシナリオと関連付けられている収益性試算結果の場合、その関連を解除
      if (profitability.scenarioId && profitability.scenarioId !== scenarioId) {
        // 既存のシナリオとの関連を解除
        try {
          const { ScenarioModel: MongoScenarioModel } = require('../../db/models/schemas/scenario.schema');
          await MongoScenarioModel.updateOne(
            { _id: profitability.scenarioId },
            { $unset: { profitabilityResultId: "" } }
          );
          logger.info('既存シナリオの収益性試算結果参照を解除しました', {
            oldScenarioId: profitability.scenarioId,
            profitabilityId
          });
        } catch (updateError) {
          logger.warn('既存シナリオ参照解除中にエラーが発生しましたが、処理を続行します', {
            updateError,
            oldScenarioId: profitability.scenarioId,
            profitabilityId
          });
        }
      }
      
      // シナリオの更新
      return await ScenarioModel.linkToProfitabilityResult(scenarioId, profitabilityId);
    } catch (error) {
      logger.error('シナリオと収益性試算結果の関連付けエラー', { 
        error, 
        scenarioId, 
        profitabilityId 
      });
      throw error;
    }
  }

  /**
   * シナリオから収益性試算を実行
   * @param scenarioId シナリオID
   * @param userId ユーザーID
   * @returns 収益性試算結果
   */
  static async executeProfitabilityFromScenario(
    scenarioId: string,
    userId?: string
  ): Promise<ProfitabilityResult> {
    try {
      // シナリオの取得
      const scenario = await ScenarioModel.findById(scenarioId);
      if (!scenario) {
        throw new Error(`シナリオが見つかりません (ID: ${scenarioId})`);
      }
      
      // 既存の関連収益性試算結果がある場合は削除
      if (scenario.profitabilityResultId) {
        await ProfitabilityModel.delete(scenario.profitabilityResultId);
      }
      
      // 物件とボリュームチェックのデータを取得
      const property = await PropertyModel.findById(scenario.propertyId);
      if (!property) {
        throw new Error(`物件が見つかりません (ID: ${scenario.propertyId})`);
      }
      
      const volumeCheck = await VolumeCheckModel.findById(scenario.volumeCheckId);
      if (!volumeCheck) {
        throw new Error(`ボリュームチェック結果が見つかりません (ID: ${scenario.volumeCheckId})`);
      }
      
      // 収益性試算の実行
      const profitabilityData = await calculateProfitability(
        property,
        volumeCheck,
        scenario.params,
        userId
      );
      
      // シナリオIDを関連付け
      profitabilityData.scenarioId = scenarioId;
      
      // 結果をDBに保存
      const profitability = await ProfitabilityModel.create(profitabilityData);
      
      // シナリオと収益性試算結果を関連付け
      await ScenarioModel.update(scenarioId, { 
        profitabilityResultId: profitability.id 
      });
      
      return profitability;
    } catch (error) {
      logger.error('シナリオからの収益性試算実行エラー', { error, scenarioId });
      throw error;
    }
  }
}