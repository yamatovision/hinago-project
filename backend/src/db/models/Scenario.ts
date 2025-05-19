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
    return this.findAll({ propertyId }, page, limit);
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
        query = query.populate('profitabilityResult');
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
    try {
      const newScenario = await MongoScenarioModel.create(scenarioData);
      const scenarioObject = newScenario.toObject();
      
      // _id を id に変換
      return {
        ...scenarioObject,
        id: String(scenarioObject._id),
      } as ScenarioType;
    } catch (error) {
      logger.error('シナリオ作成エラー', { error });
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
      const updatedScenario = await MongoScenarioModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).lean();
      
      if (!updatedScenario) return null;
      
      // _id を id に変換
      return {
        ...updatedScenario,
        id: String(updatedScenario._id),
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
    // MongoDBモデルの更新（参照IDのみを保存）
    const updatedDoc = await MongoScenarioModel.findByIdAndUpdate(
      scenarioId,
      { $set: { profitabilityResult: profitabilityId } },
      { new: true, runValidators: true }
    ).lean();
    
    if (!updatedDoc) return null;
    
    // _id を id に変換した結果オブジェクトを返す
    return {
      ...updatedDoc,
      id: String(updatedDoc._id),
    } as ScenarioType;
  }
}

export default ScenarioModel;