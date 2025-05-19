/**
 * ボリュームチェック関連のAPI
 */
import { 
  API_PATHS, 
  VolumeCheck, 
  BuildingParams,
  ID,
  ApiResponse
} from 'shared';
import { get, post, del } from '../../../common/utils/api';

/**
 * ボリュームチェックを実行
 * @param propertyId 物件ID
 * @param buildingParams 建築パラメータ
 * @returns ボリュームチェック結果
 */
export const executeVolumeCheck = async (
  propertyId: ID, 
  buildingParams: BuildingParams
): Promise<VolumeCheck | null> => {
  const response = await post<VolumeCheck>(
    API_PATHS.ANALYSIS.VOLUME_CHECK, 
    { propertyId, buildingParams }
  );

  if (response.success && response.data) {
    return response.data;
  }

  return null;
};

/**
 * ボリュームチェック結果を取得
 * @param volumeCheckId ボリュームチェック結果ID
 * @returns ボリュームチェック結果
 */
export const getVolumeCheckById = async (volumeCheckId: ID): Promise<VolumeCheck | null> => {
  const url = API_PATHS.ANALYSIS.VOLUME_CHECK_DETAIL(volumeCheckId);
  const response = await get<VolumeCheck>(url);

  if (response.success && response.data) {
    return response.data;
  }

  return null;
};

/**
 * 物件に関連するボリュームチェック結果一覧を取得
 * @param propertyId 物件ID
 * @returns ボリュームチェック結果一覧
 */
export const getVolumeChecksByProperty = async (
  propertyId: ID
): Promise<{ volumeChecks: VolumeCheck[], total: number } | null> => {
  const url = `${API_PATHS.ANALYSIS.VOLUME_CHECK}/property/${propertyId}`;
  const response = await get<VolumeCheck[] | { volumeChecks: VolumeCheck[], total: number }>(url);

  if (response.success && response.data) {
    // 配列の場合（直接VolumeCheck[]が返ってきた場合）
    if (Array.isArray(response.data)) {
      return {
        volumeChecks: response.data,
        total: response.data.length
      };
    }
    // オブジェクトの場合（期待通りの形式の場合）
    return response.data;
  }

  return null;
};

/**
 * ボリュームチェック結果を削除
 * @param volumeCheckId ボリュームチェック結果ID
 * @returns 削除成功フラグ
 */
export const deleteVolumeCheck = async (volumeCheckId: ID): Promise<boolean> => {
  const url = API_PATHS.ANALYSIS.VOLUME_CHECK_DETAIL(volumeCheckId);
  const response = await del<ApiResponse<any>>(url);

  return response.success;
};