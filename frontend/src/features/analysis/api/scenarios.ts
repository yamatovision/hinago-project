/**
 * シナリオ管理関連のAPI
 */
import { 
  API_PATHS, 
  Scenario, 
  ScenarioParams,
  ProfitabilityResult,
  ID,
  ApiResponse
} from 'shared';
import { get, post, put, del } from '../../../common/utils/api';

/**
 * シナリオを作成
 * @param volumeCheckId ボリュームチェックID
 * @param name シナリオ名
 * @param params シナリオパラメータ
 * @returns 作成されたシナリオ
 */
export const createScenario = async (
  volumeCheckId: ID,
  propertyId: ID,
  name: string,
  params: ScenarioParams
): Promise<Scenario | null> => {
  const response = await post<Scenario>(
    API_PATHS.ANALYSIS.SCENARIOS, 
    { volumeCheckId, propertyId, name, params }
  );

  if (response.success && response.data) {
    return response.data;
  }

  return null;
};

/**
 * シナリオ一覧を取得
 * @returns シナリオ一覧
 */
export const getScenarios = async (): Promise<Scenario[] | null> => {
  const response = await get<Scenario[]>(API_PATHS.ANALYSIS.SCENARIOS);

  if (response.success && response.data) {
    return response.data;
  }

  return null;
};

/**
 * シナリオを取得
 * @param scenarioId シナリオID
 * @returns シナリオ
 */
export const getScenarioById = async (scenarioId: ID): Promise<Scenario | null> => {
  const url = API_PATHS.ANALYSIS.SCENARIO(scenarioId);
  const response = await get<Scenario>(url);

  if (response.success && response.data) {
    return response.data;
  }

  return null;
};

/**
 * シナリオを更新
 * @param scenarioId シナリオID
 * @param updateData 更新データ（name, params等）
 * @returns 更新されたシナリオ
 */
export const updateScenario = async (
  scenarioId: ID,
  updateData: Partial<Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Scenario | null> => {
  const url = API_PATHS.ANALYSIS.SCENARIO(scenarioId);
  const response = await put<Scenario>(url, updateData);

  if (response.success && response.data) {
    return response.data;
  }

  return null;
};

/**
 * シナリオを削除
 * @param scenarioId シナリオID
 * @returns 削除成功フラグ
 */
export const deleteScenario = async (scenarioId: ID): Promise<boolean> => {
  const url = API_PATHS.ANALYSIS.SCENARIO(scenarioId);
  const response = await del<ApiResponse<any>>(url);

  return response.success;
};

/**
 * シナリオから収益性試算を実行
 * @param scenarioId シナリオID
 * @returns 収益性試算結果
 */
export const executeProfitabilityFromScenario = async (
  scenarioId: ID
): Promise<ProfitabilityResult | null> => {
  const url = `${API_PATHS.ANALYSIS.SCENARIO(scenarioId)}/profitability`;
  const response = await post<ProfitabilityResult>(url, {});

  if (response.success && response.data) {
    return response.data;
  }

  return null;
};