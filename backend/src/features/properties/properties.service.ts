/**
 * 物件サービス
 * 
 * 物件に関連するビジネスロジックを提供します。
 */
import { PropertyModel } from '../../db/models';
import { 
  PropertyCreateData, 
  PropertyUpdateData, 
  Property, 
  PropertyShape
} from '../../types';
import { logger } from '../../common/utils';
import { extractShapeFromFile, getFileUrl } from '../../common/middlewares';
import path from 'path';
import fs from 'fs';

/**
 * 物件一覧を取得
 * @param filter フィルター条件
 * @param page ページ番号
 * @param limit 1ページあたりの件数
 * @param sort ソート条件
 * @returns 物件リストとページネーション情報
 */
export const getProperties = async (
  filter: Record<string, any> = {},
  page: number = 1,
  limit: number = 20,
  sort: string = 'updatedAt:desc'
) => {
  try {
    // ソート条件を解析
    const sortObj: Record<string, 1 | -1> = {};
    sort.split(',').forEach(s => {
      const [field, order] = s.split(':');
      sortObj[field] = order === 'desc' ? -1 : 1;
    });

    // クエリ実行
    const result = await PropertyModel.findAll(filter, page, limit, sortObj);
    
    return {
      properties: result.properties,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    };
  } catch (error) {
    logger.error('物件一覧取得エラー', { error });
    throw error;
  }
};

/**
 * 物件を作成
 * @param propertyData 物件データ
 * @param userId 作成ユーザーID
 * @returns 作成された物件
 */
export const createProperty = async (
  propertyData: PropertyCreateData,
  userId?: string
) => {
  try {
    // ユーザーIDを設定
    const data: PropertyCreateData = {
      ...propertyData,
      userId
    };
    
    // 物件を作成
    const property = await PropertyModel.create(data);
    return property;
  } catch (error) {
    logger.error('物件作成エラー', { error });
    throw error;
  }
};

/**
 * IDで物件を取得
 * @param id 物件ID
 * @returns 物件オブジェクトまたはnull
 */
export const getPropertyById = async (id: string): Promise<Property | null> => {
  try {
    return await PropertyModel.findById(id);
  } catch (error) {
    logger.error('物件取得エラー', { error, id });
    throw error;
  }
};

/**
 * 物件を更新
 * @param id 物件ID
 * @param propertyData 更新する物件データ
 * @returns 更新された物件オブジェクトまたはnull
 */
export const updateProperty = async (
  id: string,
  propertyData: PropertyUpdateData
): Promise<Property | null> => {
  try {
    return await PropertyModel.update(id, propertyData);
  } catch (error) {
    logger.error('物件更新エラー', { error, id });
    throw error;
  }
};

/**
 * 物件を削除
 * @param id 物件ID
 * @returns 削除が成功したかどうか
 */
export const deleteProperty = async (id: string): Promise<boolean> => {
  try {
    // 物件を削除
    return await PropertyModel.delete(id);
  } catch (error) {
    logger.error('物件削除エラー', { error, id });
    throw error;
  }
};

/**
 * 測量図から敷地形状データを抽出
 * @param file アップロードされたファイル
 * @param propertyId 関連付ける物件ID（任意）
 * @returns 敷地形状データとドキュメントID
 */
export const processSurveyMap = async (
  file: Express.Multer.File,
  propertyId?: string
) => {
  try {
    // 敷地形状データを抽出（モック実装）
    const shapeData = extractShapeFromFile(file);
    
    // 物件IDが指定されている場合は物件を更新
    if (propertyId) {
      await updatePropertyShape(propertyId, shapeData);
    }
    
    // 形状データとファイルURLを返す
    return {
      shapeData,
      sourceFile: getFileUrl(file)
    };
  } catch (error) {
    // エラー時はファイルを削除
    if (file.path) {
      try {
        fs.unlinkSync(file.path);
      } catch (unlinkError) {
        logger.error('アップロードファイル削除エラー', { error: unlinkError });
      }
    }
    
    logger.error('測量図処理エラー', { error });
    throw error;
  }
};

/**
 * 物件の敷地形状データを更新
 * @param id 物件ID
 * @param shapeData 敷地形状データ
 * @returns 更新された物件
 */
export const updatePropertyShape = async (
  id: string,
  shapeData: PropertyShape
): Promise<Property | null> => {
  try {
    const property = await PropertyModel.findById(id);
    if (!property) {
      return null;
    }
    
    // 敷地形状データを更新
    return await PropertyModel.update(id, {
      shapeData,
      // 敷地面積を更新 - ポリゴンから計算するロジックを実装する場合はここで行う
      // ここでは単純に矩形の面積として計算（実際には複雑な形状の場合は別のアルゴリズムが必要）
      area: shapeData.width && shapeData.depth ? shapeData.width * shapeData.depth : property.area
    });
  } catch (error) {
    logger.error('敷地形状更新エラー', { error, id });
    throw error;
  }
};

