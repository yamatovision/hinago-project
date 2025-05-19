/**
 * 敷地形状管理関連のAPI
 */
import { API_PATHS, Property, PropertyShape } from 'shared';
import { put, post } from '../../../common/utils/api';

/**
 * 敷地形状データを更新
 * @param propertyId 物件ID
 * @param shapeData 更新する敷地形状データ
 * @returns 更新された物件情報
 */
export const updatePropertyShape = async (
  propertyId: string,
  shapeData: PropertyShape
): Promise<Property | null> => {
  const url = API_PATHS.PROPERTIES.SHAPE(propertyId);
  const response = await put<Property>(url, { shapeData });
  
  if (response.success && response.data) {
    return response.data;
  }
  
  return null;
};

/**
 * 測量図をアップロードして形状データを抽出
 * @param file アップロードする測量図ファイル
 * @param propertyId オプションの物件ID（指定された場合、その物件の形状データを更新）
 * @returns 抽出された敷地形状データ
 */
export const uploadSurveyAndExtractShape = async (
  file: File,
  propertyId?: string
): Promise<PropertyShape | null> => {
  const url = API_PATHS.PROPERTIES.UPLOAD_SURVEY;
  
  // FormDataの準備
  const formData = new FormData();
  formData.append('file', file);
  
  if (propertyId) {
    formData.append('propertyId', propertyId);
  }
  
  // 特別なヘッダーを設定（multipart/form-data）
  const response = await post<PropertyShape>(url, formData, {
    headers: {
      // Content-Type はブラウザが自動的に設定するので指定しない
    }
  });
  
  if (response.success && response.data) {
    return response.data;
  }
  
  return null;
};