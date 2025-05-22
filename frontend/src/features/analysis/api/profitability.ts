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
  console.log('=== executeProfitability 開始 ===');
  console.log('volumeCheckId:', volumeCheckId);
  console.log('financialParams:', financialParams);
  console.log('API Path:', API_PATHS.ANALYSIS.PROFITABILITY);
  
  // 重要: バックエンドではpropertyIdとassetTypeが必須のため、volumeCheckIdから両方を取得する必要がある
  // まずはvolumeCheck情報を取得してpropertyIdとassetTypeを抽出
  const volumeCheckResponse = await get<any>(`/api/v1/analysis/volume-check/${volumeCheckId}`);
  
  if (!volumeCheckResponse.success || !volumeCheckResponse.data) {
    console.error('ボリュームチェック情報の取得に失敗:', volumeCheckResponse.error);
    return null;
  }
  
  const propertyId = volumeCheckResponse.data.propertyId;
  const assetType = volumeCheckResponse.data.assetType;
  console.log('取得したpropertyId:', propertyId);
  console.log('取得したassetType:', assetType);
  
  const response = await post<ProfitabilityResult>(
    API_PATHS.ANALYSIS.PROFITABILITY, 
    { propertyId, volumeCheckId, assetType, financialParams }
  );

  console.log('=== API レスポンス詳細 ===');
  console.log('response.success:', response.success);
  console.log('response.data:', response.data);
  console.log('response.error:', response.error);
  console.log('response.meta:', response.meta);
  console.log('完全なレスポンス:', JSON.stringify(response, null, 2));

  if (response.success && response.data) {
    console.log('=== 成功: データを返却 ===');
    return response.data;
  }

  console.log('=== 失敗: null を返却 ===');
  console.log('失敗理由 - success:', response.success, ', data存在:', !!response.data);
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