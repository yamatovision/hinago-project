/**
 * シナリオモデル
 * 
 * MongoDBとMongooseを使用して実装しています。
 */
import { 
  Scenario as ScenarioType,
  ScenarioParams,
  AssetType,
  ID
} from '../../types';
import { ScenarioModel as MongoScenarioModel } from './schemas/scenario.schema';
import { logger } from '../../common/utils';
import mongoose from 'mongoose';

/**
 * シナリオモデルのクラス
 */
export class ScenarioModel {
  /**
   * シナリオ一覧を取得（フィルター条件指定可能）
   * @param filter フィルター条件
   * @param page ページ番号（1から開始）
   * @param limit 1ページあたりの件数
   * @param sort ソート条件
   * @returns シナリオリストとメタデータ
   */
  static async findAll(
    filter: Record<string, any> = {},
    page: number = 1,
    limit: number = 20,
    sort: Record<string, 1 | -1> = { createdAt: -1 }
  ): Promise<{ scenarios: ScenarioType[], total: number, page: number, limit: number, totalPages: number }> {
    try {
      // ページネーションの設定
      const skip = (page - 1) * limit;
      
      // 総件数を取得
      const total = await MongoScenarioModel.countDocuments(filter);
      
      // 結果リストを取得
      const scenarios = await MongoScenarioModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
      
      // 総ページ数を計算
      const totalPages = Math.ceil(total / limit);
      
      // _id を id に変換
      const formattedScenarios = scenarios.map(scenario => ({
        ...scenario,
        id: String(scenario._id),
      })) as ScenarioType[];
      
      return {
        scenarios: formattedScenarios,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      logger.error('シナリオ一覧取得エラー', { error, filter });
      throw error;
    }
  }

  /**
   * 物件IDでシナリオ一覧を取得
   * @param propertyId 物件ID
   * @param page ページ番号（1から開始）
   * @param limit 1ページあたりの件数
   * @returns シナリオリストとメタデータ
   */
  static async findByPropertyId(
    propertyId: ID,
    page: number = 1,
    limit: number = 20
  ): Promise<{ scenarios: ScenarioType[], total: number, page: number, limit: number, totalPages: number }> {
    try {
      // 直接MongoDBコレクションにアクセスして高速化
      const skip = (page - 1) * limit;
      
      // 総件数を取得
      const total = await MongoScenarioModel.countDocuments({ propertyId });
      
      // 結果リストを取得
      const scenarios = await MongoScenarioModel.find({ propertyId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      
      // 総ページ数を計算
      const totalPages = Math.ceil(total / limit);
      
      // _id を id に変換
      const formattedScenarios = scenarios.map(scenario => ({
        ...scenario,
        id: String(scenario._id),
      })) as ScenarioType[];
      
      return {
        scenarios: formattedScenarios,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      logger.error('物件ID別シナリオ一覧取得エラー', { error, propertyId });
      throw error;
    }
  }

  /**
   * ボリュームチェックIDでシナリオ一覧を取得
   * @param volumeCheckId ボリュームチェックID
   * @param page ページ番号（1から開始）
   * @param limit 1ページあたりの件数
   * @returns シナリオリストとメタデータ
   */
  static async findByVolumeCheckId(
    volumeCheckId: ID,
    page: number = 1,
    limit: number = 20
  ): Promise<{ scenarios: ScenarioType[], total: number, page: number, limit: number, totalPages: number }> {
    return this.findAll({ volumeCheckId }, page, limit);
  }

  /**
   * IDでシナリオを検索
   * @param id シナリオID
   * @param includeProfitability 収益性試算結果を含めるかどうか
   * @returns シナリオオブジェクトまたはnull
   */
  static async findById(id: string, includeProfitability: boolean = false): Promise<ScenarioType | null> {
    try {
      // IDが有効なMongoDBのObjectIDかチェック
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }
      
      // クエリの作成
      let query = MongoScenarioModel.findById(id);
      
      // 収益性試算結果を含める場合
      if (includeProfitability) {
        query = query.populate('profitabilityResultId');
      }
      
      const scenario = await query.lean();
      if (!scenario) return null;
      
      // _id を id に変換
      return {
        ...scenario,
        id: String(scenario._id),
      } as ScenarioType;
    } catch (error) {
      logger.error('シナリオ検索エラー', { error, id });
      throw error;
    }
  }

  /**
   * 新しいシナリオを作成
   * @param scenarioData シナリオデータ
   * @returns 作成されたシナリオオブジェクト
   */
  static async create(scenarioData: Omit<ScenarioType, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScenarioType> {
    const startTime = Date.now();
    
    try {
      logger.info('ScenarioModel.create開始', { 
        time: `${Date.now() - startTime}ms`,
        propertyId: scenarioData.propertyId,
        volumeCheckId: scenarioData.volumeCheckId
      });
      
      // MongooseモデルではなくMongoDBネイティブのinsertOneを使用して高速化
      const now = new Date();
      const docToInsert = {
        ...scenarioData,
        createdAt: now,
        updatedAt: now
      };
      
      // 処理準備時間
      logger.info('インサート準備完了', { time: `${Date.now() - startTime}ms` });
      
      // MongoDBネイティブ操作を使用
      const dbOperationStart = Date.now();
      const result = await (MongoScenarioModel.collection as any).insertOne(docToInsert);
      const _id = result.insertedId;
      
      logger.info('Mongoインサート完了', { 
        time: `${Date.now() - dbOperationStart}ms`,
        scenarioId: String(_id)
      });
      
      // 作成したドキュメントを返す
      const scenario = {
        ...docToInsert,
        id: String(_id),
        _id: _id
      } as ScenarioType;
      
      // 全体の実行時間
      logger.info('ScenarioModel.create完了', { 
        time: `${Date.now() - startTime}ms`,
        scenarioId: String(_id)
      });
      
      return scenario;
    } catch (error) {
      logger.error('シナリオ作成エラー (モデル層)', { 
        time: `${Date.now() - startTime}ms`,
        error,
        propertyId: scenarioData.propertyId
      });
      throw error;
    }
  }

  /**
   * シナリオを更新
   * @param id シナリオID
   * @param updateData 更新データ
   * @returns 更新されたシナリオオブジェクト
   */
  static async update(id: string, updateData: Partial<Omit<ScenarioType, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ScenarioType | null> {
    try {
      // 更新前のシナリオを取得して、更新データをマージする
      const existingScenario = await MongoScenarioModel.findById(id);
      if (!existingScenario) return null;
      
      // 完全な更新データを準備
      let finalUpdateData: any = { ...updateData };
      
      // パラメータの部分更新の場合は、既存のパラメータとマージ
      if (updateData.params) {
        finalUpdateData.params = {
          ...existingScenario.params,
          ...updateData.params
        };
      }
      
      // バリデーションをスキップしてMongoDBを直接更新
      
      // Mongooseではなく、MongoDBネイティブのupdateOneを使用
      const { _id } = existingScenario;
      await (MongoScenarioModel.collection as any).updateOne(
        { _id },
        { $set: finalUpdateData }
      );
      
      // 更新後のデータを取得して返す
      const updatedDoc = await MongoScenarioModel.findById(id).lean();
      if (!updatedDoc) return null;
      
      return {
        ...updatedDoc,
        id: String(updatedDoc._id)
      } as ScenarioType;
    } catch (error) {
      logger.error('シナリオ更新エラー', { error, id });
      throw error;
    }
  }

  /**
   * シナリオを削除
   * @param id シナリオID
   * @returns 削除が成功したかどうか
   */
  static async delete(id: string): Promise<boolean> {
    try {
      // シナリオの情報を取得
      const scenario = await this.findById(id);
      if (!scenario) {
        return false;
      }
      
      // 関連する収益性試算結果のscenarioIdを解除
      if (scenario.profitabilityResultId) {
        // 直接MongoDBモデルを使用して確実に更新
        const { ProfitabilityModel: MongoProfitabilityModel } = require('./schemas/profitability.schema');
        await MongoProfitabilityModel.updateOne(
          { _id: scenario.profitabilityResultId },
          { $unset: { scenarioId: "" } }
        );
        
        logger.info('シナリオ削除時に収益性試算結果参照を解除しました', {
          scenarioId: id,
          profitabilityId: scenario.profitabilityResultId
        });
      }
      
      // シナリオを削除
      const result = await MongoScenarioModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      logger.error('シナリオ削除エラー', { error, id });
      throw error;
    }
  }

  /**
   * 物件IDに関連するすべてのシナリオを削除
   * （物件が削除される際などに使用）
   * @param propertyId 物件ID
   * @returns 削除された件数
   */
  static async deleteByPropertyId(propertyId: string): Promise<number> {
    try {
      // 関連するシナリオの一覧を取得
      const { scenarios } = await this.findByPropertyId(propertyId, 1, 1000);
      
      // 各シナリオに関連する収益性試算結果の参照を解除
      const { ProfitabilityModel: MongoProfitabilityModel } = require('./schemas/profitability.schema');
      for (const scenario of scenarios) {
        if (scenario.profitabilityResultId) {
          await MongoProfitabilityModel.updateOne(
            { _id: scenario.profitabilityResultId },
            { $unset: { scenarioId: "" } }
          );
          
          logger.info('物件削除時にシナリオ関連の収益性試算結果参照を解除しました', {
            scenarioId: scenario.id,
            profitabilityId: scenario.profitabilityResultId
          });
        }
      }
      
      // シナリオをまとめて削除
      const result = await MongoScenarioModel.deleteMany({ propertyId });
      return result.deletedCount || 0;
    } catch (error) {
      logger.error('物件IDによるシナリオ削除エラー', { error, propertyId });
      throw error;
    }
  }

  /**
   * ボリュームチェックIDに関連するすべてのシナリオを削除
   * （ボリュームチェック結果が削除される際などに使用）
   * @param volumeCheckId ボリュームチェックID
   * @returns 削除された件数
   */
  static async deleteByVolumeCheckId(volumeCheckId: string): Promise<number> {
    try {
      // 関連するシナリオの一覧を取得
      const { scenarios } = await this.findByVolumeCheckId(volumeCheckId, 1, 1000);
      
      // 各シナリオに関連する収益性試算結果の参照を解除
      const { ProfitabilityModel: MongoProfitabilityModel } = require('./schemas/profitability.schema');
      for (const scenario of scenarios) {
        if (scenario.profitabilityResultId) {
          await MongoProfitabilityModel.updateOne(
            { _id: scenario.profitabilityResultId },
            { $unset: { scenarioId: "" } }
          );
          
          logger.info('ボリュームチェック削除時にシナリオ関連の収益性試算結果参照を解除しました', {
            scenarioId: scenario.id,
            profitabilityId: scenario.profitabilityResultId
          });
        }
      }
      
      // シナリオをまとめて削除
      const result = await MongoScenarioModel.deleteMany({ volumeCheckId });
      return result.deletedCount || 0;
    } catch (error) {
      logger.error('ボリュームチェックIDによるシナリオ削除エラー', { error, volumeCheckId });
      throw error;
    }
  }

  /**
   * シナリオに収益性試算結果を関連付ける
   * @param scenarioId シナリオID
   * @param profitabilityId 収益性試算結果ID
   * @returns 更新されたシナリオオブジェクト
   */
  static async linkToProfitabilityResult(scenarioId: string, profitabilityId: string): Promise<ScenarioType | null> {
    try {
      // 1対1関係のより強固な実装
      // ステップ1: トランザクション的な処理順序で参照の整合性を維持

      // 既存の関連付けを解除
      const scenario = await this.findById(scenarioId);
      if (scenario?.profitabilityResultId && scenario.profitabilityResultId !== profitabilityId) {
        // 以前の収益性試算結果との関連を解除
        const { ProfitabilityModel: MongoProfitabilityModel } = require('./schemas/profitability.schema');
        
        await MongoProfitabilityModel.updateOne(
          { _id: scenario.profitabilityResultId },
          { $unset: { scenarioId: "" } }
        );
        
        logger.info('シナリオの既存収益性試算結果参照を解除しました', {
          scenarioId,
          oldProfitabilityId: scenario.profitabilityResultId,
          newProfitabilityId: profitabilityId
        });
      }
      
      // ステップ2: 収益性試算結果の現在のシナリオ参照を確認
      const ProfitabilityModel = require('./Profitability').default;
      const profitability = await ProfitabilityModel.findById(profitabilityId);
      
      // MongoDBモデルを直接使用
      const { ProfitabilityModel: MongoProfitabilityModel } = require('./schemas/profitability.schema');
      
      // 既に別のシナリオと関連付けられている場合はその関連を解除
      if (profitability && profitability.scenarioId && profitability.scenarioId !== scenarioId) {
        // 直接MongoDBモデルを使用して高速かつ確実な更新を実行
        const { ScenarioModel: MongoScenarioModel } = require('./schemas/scenario.schema');
        await MongoScenarioModel.updateOne(
          { _id: profitability.scenarioId },
          { $unset: { profitabilityResultId: "" } }
        );
        
        logger.info('収益性試算結果の既存シナリオ参照を解除しました', {
          profitabilityId,
          oldScenarioId: profitability.scenarioId,
          newScenarioId: scenarioId
        });
      }
      
      // ステップ3: 新しい相互参照を設定
      
      // 収益性試算結果にシナリオIDを関連付け
      await MongoProfitabilityModel.updateOne(
        { _id: profitabilityId },
        { $set: { scenarioId: scenarioId } }
      );
      
      // MongoDBモデルの更新（参照IDのみを保存）
      const updatedDoc = await MongoScenarioModel.findByIdAndUpdate(
        scenarioId,
        { $set: { profitabilityResultId: profitabilityId } },
        { new: true, runValidators: true }
      ).lean();
      
      if (!updatedDoc) return null;
      
      // _id を id に変換した結果オブジェクトを返す
      return {
        ...updatedDoc,
        id: String(updatedDoc._id),
      } as ScenarioType;
    } catch (error) {
      logger.error('シナリオと収益性試算結果の関連付けエラー', { 
        error, 
        scenarioId, 
        profitabilityId 
      });
      throw error;
    }
  }
}

export default ScenarioModel;