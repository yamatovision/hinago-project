/**
 * ボリュームチェックモデル
 * 
 * MongoDBとMongooseを使用して実装しています。
 */
import { 
  VolumeCheck as VolumeCheckType, 
  BuildingParams, 
  AssetType,
  Property,
  ID
} from '../../types';
import { VolumeCheckModel as MongoVolumeCheckModel } from './schemas/volumeCheck.schema';
import { logger } from '../../common/utils';
import mongoose from 'mongoose';

/**
 * ボリュームチェックモデルのクラス
 */
export class VolumeCheckModel {
  /**
   * ボリュームチェック結果一覧を取得（物件IDでフィルタリング可能）
   * @param filter フィルター条件
   * @param page ページ番号（1から開始）
   * @param limit 1ページあたりの件数
   * @param sort ソート条件
   * @returns ボリュームチェック結果リストとメタデータ
   */
  static async findAll(
    filter: Record<string, any> = {},
    page: number = 1,
    limit: number = 20,
    sort: Record<string, 1 | -1> = { createdAt: -1 }
  ): Promise<{ volumeChecks: VolumeCheckType[], total: number, page: number, limit: number, totalPages: number }> {
    try {
      // ページネーションの設定
      const skip = (page - 1) * limit;
      
      // 総件数を取得
      const total = await MongoVolumeCheckModel.countDocuments(filter);
      
      // 結果リストを取得
      const volumeChecks = await MongoVolumeCheckModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
      
      // 総ページ数を計算
      const totalPages = Math.ceil(total / limit);
      
      // _id を id に変換
      const formattedVolumeChecks = volumeChecks.map(volumeCheck => ({
        ...volumeCheck,
        id: String(volumeCheck._id),
      })) as VolumeCheckType[];
      
      return {
        volumeChecks: formattedVolumeChecks,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      logger.error('ボリュームチェック結果一覧取得エラー', { error, filter });
      throw error;
    }
  }

  /**
   * 物件IDでボリュームチェック結果一覧を取得
   * @param propertyId 物件ID
   * @param page ページ番号（1から開始）
   * @param limit 1ページあたりの件数
   * @returns ボリュームチェック結果リストとメタデータ
   */
  static async findByPropertyId(
    propertyId: ID,
    page: number = 1,
    limit: number = 20
  ): Promise<{ volumeChecks: VolumeCheckType[], total: number, page: number, limit: number, totalPages: number }> {
    return this.findAll({ propertyId }, page, limit);
  }

  /**
   * IDでボリュームチェック結果を検索
   * @param id ボリュームチェック結果ID
   * @returns ボリュームチェック結果オブジェクトまたはnull
   */
  static async findById(id: string): Promise<VolumeCheckType | null> {
    try {
      // IDが有効なMongoDBのObjectIDかチェック
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }
      
      const volumeCheck = await MongoVolumeCheckModel.findById(id).lean();
      if (!volumeCheck) return null;
      
      // _id を id に変換
      return {
        ...volumeCheck,
        id: String(volumeCheck._id),
      } as VolumeCheckType;
    } catch (error) {
      logger.error('ボリュームチェック結果検索エラー', { error, id });
      throw error;
    }
  }

  /**
   * 新しいボリュームチェック結果を作成
   * @param volumeCheckData ボリュームチェックデータ
   * @returns 作成されたボリュームチェック結果オブジェクト
   */
  static async create(volumeCheckData: Omit<VolumeCheckType, 'id' | 'createdAt' | 'updatedAt'>): Promise<VolumeCheckType> {
    try {
      const newVolumeCheck = await MongoVolumeCheckModel.create(volumeCheckData);
      const volumeCheckObject = newVolumeCheck.toObject();
      
      // _id を id に変換
      return {
        ...volumeCheckObject,
        id: String(volumeCheckObject._id),
      } as VolumeCheckType;
    } catch (error) {
      logger.error('ボリュームチェック結果作成エラー', { error });
      throw error;
    }
  }

  /**
   * ボリュームチェック結果を削除
   * @param id ボリュームチェック結果ID
   * @returns 削除が成功したかどうか
   */
  static async delete(id: string): Promise<boolean> {
    try {
      const result = await MongoVolumeCheckModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      logger.error('ボリュームチェック結果削除エラー', { error, id });
      throw error;
    }
  }

  /**
   * 物件IDに関連するすべてのボリュームチェック結果を削除
   * （物件が削除される際などに使用）
   * @param propertyId 物件ID
   * @returns 削除された件数
   */
  static async deleteByPropertyId(propertyId: string): Promise<number> {
    try {
      const result = await MongoVolumeCheckModel.deleteMany({ propertyId });
      return result.deletedCount || 0;
    } catch (error) {
      logger.error('物件IDによるボリュームチェック結果削除エラー', { error, propertyId });
      throw error;
    }
  }
}

export default VolumeCheckModel;