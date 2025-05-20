/**
 * 収益性試算関連のAPI
 */
import { 
  API_PATHS, 
  ProfitabilityResult, 
  FinancialParams,
  ID,
  ApiResponse
} from 'shared';
import { get, post, del } from '../../../common/utils/api';

/**
 * 収益性試算を実行
 * @param volumeCheckId ボリュームチェックID
 * @param financialParams 財務パラメータ
 * @returns 収益性試算結果
 */
export const executeProfitability = async (
  volumeCheckId: ID, 
  financialParams: FinancialParams
): Promise<ProfitabilityResult | null> => {
  const response = await post<ProfitabilityResult>(
    API_PATHS.ANALYSIS.PROFITABILITY, 
    { volumeCheckId, financialParams }
  );

  if (response.success && response.data) {
    return response.data;
  }

  return null;
};

/**
 * 収益性試算結果を取得
 * @param profitabilityId 収益性試算結果ID
 * @returns 収益性試算結果
 */
export const getProfitabilityById = async (profitabilityId: ID): Promise<ProfitabilityResult | null> => {
  const url = API_PATHS.ANALYSIS.PROFITABILITY_DETAIL(profitabilityId);
  const response = await get<ProfitabilityResult>(url);

  if (response.success && response.data) {
    return response.data;
  }

  return null;
};

/**
 * 物件に関連する収益性試算結果一覧を取得
 * @param propertyId 物件ID
 * @returns 収益性試算結果一覧
 */
export const getProfitabilitiesByProperty = async (
  propertyId: ID
): Promise<{ profitabilities: ProfitabilityResult[], total: number } | null> => {
  const url = `${API_PATHS.ANALYSIS.PROFITABILITY}/property/${propertyId}`;
  const response = await get<ProfitabilityResult[] | { profitabilities: ProfitabilityResult[], total: number }>(url);

  if (response.success && response.data) {
    // 配列の場合（直接ProfitabilityResult[]が返ってきた場合）
    if (Array.isArray(response.data)) {
      return {
        profitabilities: response.data,
        total: response.data.length
      };
    }
    // オブジェクトの場合（期待通りの形式の場合）
    return response.data;
  }

  return null;
};

/**
 * ボリュームチェックに関連する収益性試算結果一覧を取得
 * @param volumeCheckId ボリュームチェックID
 * @returns 収益性試算結果一覧
 */
export const getProfitabilitiesByVolumeCheck = async (
  volumeCheckId: ID
): Promise<{ profitabilities: ProfitabilityResult[], total: number } | null> => {
  const url = `${API_PATHS.ANALYSIS.PROFITABILITY}/volume-check/${volumeCheckId}`;
  const response = await get<ProfitabilityResult[] | { profitabilities: ProfitabilityResult[], total: number }>(url);

  if (response.success && response.data) {
    // 配列の場合（直接ProfitabilityResult[]が返ってきた場合）
    if (Array.isArray(response.data)) {
      return {
        profitabilities: response.data,
        total: response.data.length
      };
    }
    // オブジェクトの場合（期待通りの形式の場合）
    return response.data;
  }

  return null;
};

/**
 * 収益性試算結果を削除
 * @param profitabilityId 収益性試算結果ID
 * @returns 削除成功フラグ
 */
export const deleteProfitability = async (profitabilityId: ID): Promise<boolean> => {
  const url = API_PATHS.ANALYSIS.PROFITABILITY_DETAIL(profitabilityId);
  const response = await del<ApiResponse<any>>(url);

  return response.success;
};