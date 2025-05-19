/**
 * 物件関連のAPI
 */
import { 
  API_PATHS, 
  Property, 
  PropertyCreateData, 
  PropertyUpdateData,
  PaginationParams,
  FilterOptions,
  ApiResponse
} from 'shared';
import { get, post, put, del } from '../../../common/utils/api';

/**
 * 物件一覧を取得
 * @param params 取得条件（ページ、制限数など）
 * @param filters フィルター条件
 * @returns 物件一覧
 */
export const getProperties = async (
  params: PaginationParams = { page: 1, limit: 10 },
  filters: FilterOptions = {}
): Promise<{ properties: Property[], total: number } | null> => {
  // クエリパラメータの構築
  const queryParams = new URLSearchParams();
  queryParams.append('page', params.page.toString());
  queryParams.append('limit', params.limit.toString());

  // フィルター条件をクエリパラメータに追加
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      queryParams.append(key, value.toString());
    }
  });

  // APIリクエスト
  const url = `${API_PATHS.PROPERTIES.BASE}?${queryParams.toString()}`;
  const response = await get<Property[] | { properties: Property[], total: number }>(url);

  if (response.success && response.data) {
    // 配列の場合（直接Property[]が返ってきた場合）
    if (Array.isArray(response.data)) {
      return {
        properties: response.data,
        total: response.data.length
      };
    }
    // オブジェクトの場合（期待通りの形式の場合）
    return response.data;
  }

  return null;
};

/**
 * 物件の詳細情報を取得
 * @param propertyId 物件ID
 * @returns 物件詳細情報
 */
export const getPropertyById = async (propertyId: string): Promise<Property | null> => {
  const url = API_PATHS.PROPERTIES.DETAIL(propertyId);
  const response = await get<Property>(url);

  if (response.success && response.data) {
    return response.data;
  }

  return null;
};

/**
 * 新規物件を登録
 * @param propertyData 物件データ
 * @returns 登録された物件情報
 */
export const createProperty = async (propertyData: PropertyCreateData): Promise<Property | null> => {
  const response = await post<Property>(API_PATHS.PROPERTIES.BASE, propertyData);

  if (response.success && response.data) {
    return response.data;
  }

  return null;
};

/**
 * 物件情報を更新
 * @param propertyId 物件ID
 * @param propertyData 更新する物件データ
 * @returns 更新された物件情報
 */
export const updateProperty = async (
  propertyId: string, 
  propertyData: PropertyUpdateData
): Promise<Property | null> => {
  const url = API_PATHS.PROPERTIES.DETAIL(propertyId);
  const response = await put<Property>(url, propertyData);

  if (response.success && response.data) {
    return response.data;
  }

  return null;
};

/**
 * 物件を削除
 * @param propertyId 物件ID
 * @returns 削除成功フラグ
 */
export const deleteProperty = async (propertyId: string): Promise<boolean> => {
  const url = API_PATHS.PROPERTIES.DETAIL(propertyId);
  const response = await del<ApiResponse<any>>(url);

  return response.success;
};

/**
 * 住所から緯度経度情報を取得
 * @param address 住所
 * @returns 緯度経度情報
 */
export const getGeocode = async (address: string): Promise<{ lat: number, lng: number } | null> => {
  const queryParams = new URLSearchParams();
  queryParams.append('address', address);

  const url = `${API_PATHS.GEO.GEOCODE}?${queryParams.toString()}`;
  const response = await get<{ lat: number, lng: number }>(url);

  if (response.success && response.data) {
    return response.data;
  }

  return null;
};