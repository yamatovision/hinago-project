/**
 * 物件更新履歴関連のAPI
 */
import { API_PATHS, HistoryEntry } from 'shared';
import { get } from '../../../common/utils/api';

/**
 * 物件の更新履歴を取得
 * @param propertyId 物件ID
 * @returns 更新履歴エントリの配列
 */
export const getPropertyHistory = async (
  propertyId: string
): Promise<HistoryEntry[] | null> => {
  const url = API_PATHS.PROPERTIES.HISTORY(propertyId);
  const response = await get<HistoryEntry[]>(url);
  
  if (response.success && response.data) {
    return response.data;
  }
  
  return null;
};