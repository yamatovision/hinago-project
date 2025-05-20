/**
 * 収益性試算モデル
 * 
 * MongoDBとMongooseを使用して実装しています。
 */
import { 
  ProfitabilityResult,
  FinancialParams,
  AssetType,
  ID
} from '../../types';
import { ProfitabilityModel as MongoProfitabilityModel } from './schemas/profitability.schema';
import { logger } from '../../common/utils';
import mongoose from 'mongoose';

/**
 * 収益性試算モデルのクラス
 */
export class ProfitabilityModel {
  /**
   * 収益性試算結果一覧を取得（フィルター条件指定可能）
   * @param filter フィルター条件
   * @param page ページ番号（1から開始）
   * @param limit 1ページあたりの件数
   * @param sort ソート条件
   * @returns 収益性試算結果リストとメタデータ
   */
  static async findAll(
    filter: Record<string, any> = {},
    page: number = 1,
    limit: number = 20,
    sort: Record<string, 1 | -1> = { createdAt: -1 }
  ): Promise<{ profitabilityResults: ProfitabilityResult[], total: number, page: number, limit: number, totalPages: number }> {
    try {
      // ページネーションの設定
      const skip = (page - 1) * limit;
      
      // 総件数を取得
      const total = await MongoProfitabilityModel.countDocuments(filter);
      
      // 結果リストを取得
      const profitabilityResults = await MongoProfitabilityModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
      
      // 総ページ数を計算
      const totalPages = Math.ceil(total / limit);
      
      // _id を id に変換
      const formattedResults = profitabilityResults.map(result => ({
        ...result,
        id: String(result._id),
      })) as ProfitabilityResult[];
      
      return {
        profitabilityResults: formattedResults,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      logger.error('収益性試算結果一覧取得エラー', { error, filter });
      throw error;
    }
  }

  /**
   * 物件IDで収益性試算結果一覧を取得
   * @param propertyId 物件ID
   * @param page ページ番号（1から開始）
   * @param limit 1ページあたりの件数
   * @returns 収益性試算結果リストとメタデータ
   */
  static async findByPropertyId(
    propertyId: ID,
    page: number = 1,
    limit: number = 20
  ): Promise<{ profitabilityResults: ProfitabilityResult[], total: number, page: number, limit: number, totalPages: number }> {
    return this.findAll({ propertyId }, page, limit);
  }

  /**
   * ボリュームチェックIDで収益性試算結果一覧を取得
   * @param volumeCheckId ボリュームチェックID
   * @param page ページ番号（1から開始）
   * @param limit 1ページあたりの件数
   * @returns 収益性試算結果リストとメタデータ
   */
  static async findByVolumeCheckId(
    volumeCheckId: ID,
    page: number = 1,
    limit: number = 20
  ): Promise<{ profitabilityResults: ProfitabilityResult[], total: number, page: number, limit: number, totalPages: number }> {
    return this.findAll({ volumeCheckId }, page, limit);
  }

  /**
   * IDで収益性試算結果を検索
   * @param id 収益性試算結果ID
   * @returns 収益性試算結果オブジェクトまたはnull
   */
  static async findById(id: string): Promise<ProfitabilityResult | null> {
    try {
      // IDが有効なMongoDBのObjectIDかチェック
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }
      
      const profitabilityResult = await MongoProfitabilityModel.findById(id).lean();
      if (!profitabilityResult) return null;
      
      // _id を id に変換
      return {
        ...profitabilityResult,
        id: String(profitabilityResult._id),
      } as ProfitabilityResult;
    } catch (error) {
      logger.error('収益性試算結果検索エラー', { error, id });
      throw error;
    }
  }

  /**
   * 新しい収益性試算結果を作成
   * @param profitabilityData 収益性試算データ
   * @returns 作成された収益性試算結果オブジェクト
   */
  static async create(profitabilityData: Omit<ProfitabilityResult, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProfitabilityResult> {
    try {
      const newProfitability = await MongoProfitabilityModel.create(profitabilityData);
      const profitabilityObject = newProfitability.toObject();
      
      // _id を id に変換
      return {
        ...profitabilityObject,
        id: String(profitabilityObject._id),
      } as ProfitabilityResult;
    } catch (error) {
      logger.error('収益性試算結果作成エラー', { error });
      throw error;
    }
  }
  
  /**
   * 収益性試算結果を更新
   * @param id 収益性試算結果ID
   * @param updateData 更新データ
   * @returns 更新された収益性試算結果オブジェクト
   */
  static async update(id: string, updateData: Partial<Omit<ProfitabilityResult, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ProfitabilityResult | null> {
    try {
      const updatedProfitability = await MongoProfitabilityModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).lean();
      
      if (!updatedProfitability) return null;
      
      // _id を id に変換
      return {
        ...updatedProfitability,
        id: String(updatedProfitability._id),
      } as ProfitabilityResult;
    } catch (error) {
      logger.error('収益性試算結果更新エラー', { error, id });
      throw error;
    }
  }

  /**
   * 収益性試算結果を削除
   * @param id 収益性試算結果ID
   * @returns 削除が成功したかどうか
   */
  static async delete(id: string): Promise<boolean> {
    try {
      const result = await MongoProfitabilityModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      logger.error('収益性試算結果削除エラー', { error, id });
      throw error;
    }
  }

  /**
   * 物件IDに関連するすべての収益性試算結果を削除
   * （物件が削除される際などに使用）
   * @param propertyId 物件ID
   * @returns 削除された件数
   */
  static async deleteByPropertyId(propertyId: string): Promise<number> {
    try {
      const result = await MongoProfitabilityModel.deleteMany({ propertyId });
      return result.deletedCount || 0;
    } catch (error) {
      logger.error('物件IDによる収益性試算結果削除エラー', { error, propertyId });
      throw error;
    }
  }

  /**
   * ボリュームチェックIDに関連するすべての収益性試算結果を削除
   * （ボリュームチェック結果が削除される際などに使用）
   * @param volumeCheckId ボリュームチェックID
   * @returns 削除された件数
   */
  static async deleteByVolumeCheckId(volumeCheckId: string): Promise<number> {
    try {
      const result = await MongoProfitabilityModel.deleteMany({ volumeCheckId });
      return result.deletedCount || 0;
    } catch (error) {
      logger.error('ボリュームチェックIDによる収益性試算結果削除エラー', { error, volumeCheckId });
      throw error;
    }
  }
}

export default ProfitabilityModel;