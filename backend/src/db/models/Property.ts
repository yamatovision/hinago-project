/**
 * 物件モデル
 * 
 * MongoDBとMongooseを使用して実装しています。
 */
import { Property, PropertyCreateData, PropertyUpdateData, PropertyBase } from '../../types';
import { PropertyModel as MongoPropertyModel } from './schemas/property.schema';
import { logger } from '../../common/utils';
import mongoose from 'mongoose';

/**
 * 物件モデルのクラス
 */
export class PropertyModel {
  /**
   * 物件一覧を取得
   * @param filter フィルター条件
   * @param page ページ番号（1から開始）
   * @param limit 1ページあたりの件数
   * @param sort ソート条件
   * @returns 物件リストとメタデータ
   */
  static async findAll(
    filter: Record<string, any> = {},
    page: number = 1,
    limit: number = 20,
    sort: Record<string, 1 | -1> = { updatedAt: -1 }
  ): Promise<{ properties: Property[], total: number, page: number, limit: number, totalPages: number }> {
    try {
      // ページネーションの設定
      const skip = (page - 1) * limit;
      
      // 総件数を取得
      const total = await MongoPropertyModel.countDocuments(filter);
      
      // 物件リストを取得
      const properties = await MongoPropertyModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();
      
      // 総ページ数を計算
      const totalPages = Math.ceil(total / limit);
      
      // _id を id に変換
      const formattedProperties = properties.map(property => ({
        ...property,
        id: String(property._id),
      })) as Property[];
      
      return {
        properties: formattedProperties,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      logger.error('物件一覧取得エラー', { error, filter });
      throw error;
    }
  }

  /**
   * IDで物件を検索
   * @param id 物件ID
   * @returns 物件オブジェクトまたはnull
   */
  static async findById(id: string): Promise<Property | null> {
    try {
      // IDが有効なMongoDBのObjectIDかチェック
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }
      
      const property = await MongoPropertyModel.findById(id).lean();
      if (!property) return null;
      
      // _id を id に変換
      return {
        ...property,
        id: String(property._id),
      } as Property;
    } catch (error) {
      logger.error('物件検索エラー', { error, id });
      throw error;
    }
  }

  /**
   * 新しい物件を作成
   * @param propertyData 物件データ
   * @returns 作成された物件オブジェクト
   */
  static async create(propertyData: PropertyCreateData): Promise<Property> {
    try {
      // 許容建築面積を計算
      let data = { ...propertyData };
      if (data.area && data.buildingCoverage) {
        data.allowedBuildingArea = data.area * (data.buildingCoverage / 100);
      }
      
      const newProperty = await MongoPropertyModel.create(data);
      const propertyObject = newProperty.toObject();
      
      // _id を id に変換
      return {
        ...propertyObject,
        id: String(propertyObject._id),
      } as Property;
    } catch (error) {
      logger.error('物件作成エラー', { error });
      throw error;
    }
  }

  /**
   * 物件情報を更新
   * @param id 物件ID
   * @param propertyData 更新する物件データ
   * @returns 更新された物件オブジェクトまたはnull
   */
  static async update(
    id: string,
    propertyData: PropertyUpdateData
  ): Promise<Property | null> {
    try {
      // 許容建築面積を再計算
      let updateData = { ...propertyData };
      
      // 現在の物件データを取得
      const currentProperty = await MongoPropertyModel.findById(id);
      if (!currentProperty) return null;
      
      // 面積または建蔽率が更新される場合、許容建築面積を再計算
      if (propertyData.area !== undefined || propertyData.buildingCoverage !== undefined) {
        const area = propertyData.area !== undefined ? propertyData.area : currentProperty.area;
        const buildingCoverage = propertyData.buildingCoverage !== undefined 
          ? propertyData.buildingCoverage 
          : currentProperty.buildingCoverage;
        
        updateData.allowedBuildingArea = area * (buildingCoverage / 100);
      }
      
      const updatedProperty = await MongoPropertyModel.findByIdAndUpdate(
        id,
        { ...updateData },
        { new: true }
      );
      
      if (!updatedProperty) return null;
      
      const propertyObject = updatedProperty.toObject();
      
      // _id を id に変換
      return {
        ...propertyObject,
        id: String(propertyObject._id),
      } as Property;
    } catch (error) {
      logger.error('物件更新エラー', { error, id });
      throw error;
    }
  }

  /**
   * 物件を削除
   * @param id 物件ID
   * @returns 削除が成功したかどうか
   */
  static async delete(id: string): Promise<boolean> {
    try {
      // IDが有効なMongoDBのObjectIDかチェック
      if (!mongoose.Types.ObjectId.isValid(id)) {
        logger.warn('無効な物件ID形式で削除が試行されました', { id });
        return false;
      }
      
      // 物件が存在するか確認
      const property = await MongoPropertyModel.findById(id);
      if (!property) {
        logger.warn('削除対象の物件が存在しません', { id });
        return false;
      }
      
      // 物件を削除
      const result = await MongoPropertyModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      logger.error('物件削除エラー', { error, id });
      throw error;
    }
  }
}

export default PropertyModel;