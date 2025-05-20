/**
 * レポート生成API関連の処理
 */
import { API_PATHS, ReportType, ReportFormat, ReportGenerateRequest, ReportGenerateResponse } from '../../../../../shared';
import { api } from '../../../common/utils/api';

/**
 * レポート生成
 * @param params レポート生成パラメータ
 * @returns レポート生成結果
 */
export const generateReport = async (params: ReportGenerateRequest): Promise<ReportGenerateResponse> => {
  const response = await api.post<ReportGenerateResponse>(API_PATHS.ANALYSIS.REPORT, params);
  return response.data;
};

/**
 * ボリュームチェックレポート生成
 * @param volumeCheckId ボリュームチェックID
 * @param format レポート形式（デフォルト: PDF）
 * @param includeCharts グラフを含めるかどうか（デフォルト: true）
 * @returns レポート生成結果
 */
export const generateVolumeCheckReport = async (
  volumeCheckId: string,
  format: ReportFormat = ReportFormat.PDF,
  includeCharts: boolean = true
): Promise<ReportGenerateResponse> => {
  const url = API_PATHS.ANALYSIS.VOLUME_CHECK_REPORT(volumeCheckId);
  const queryParams = new URLSearchParams();
  
  if (format === ReportFormat.CSV) {
    queryParams.append('format', 'csv');
  }
  
  if (!includeCharts) {
    queryParams.append('includeCharts', 'false');
  }
  
  const queryString = queryParams.toString();
  const fullUrl = queryString ? `${url}?${queryString}` : url;
  
  const response = await api.get<ReportGenerateResponse>(fullUrl);
  return response.data;
};

/**
 * 収益性試算レポート生成
 * @param profitabilityId 収益性試算ID
 * @param format レポート形式（デフォルト: PDF）
 * @param includeCharts グラフを含めるかどうか（デフォルト: true）
 * @returns レポート生成結果
 */
export const generateProfitabilityReport = async (
  profitabilityId: string,
  format: ReportFormat = ReportFormat.PDF,
  includeCharts: boolean = true
): Promise<ReportGenerateResponse> => {
  const url = API_PATHS.ANALYSIS.PROFITABILITY_REPORT(profitabilityId);
  const queryParams = new URLSearchParams();
  
  if (format === ReportFormat.CSV) {
    queryParams.append('format', 'csv');
  }
  
  if (!includeCharts) {
    queryParams.append('includeCharts', 'false');
  }
  
  const queryString = queryParams.toString();
  const fullUrl = queryString ? `${url}?${queryString}` : url;
  
  const response = await api.get<ReportGenerateResponse>(fullUrl);
  return response.data;
};

/**
 * 複合レポート生成
 * @param volumeCheckId ボリュームチェックID
 * @param profitabilityId 収益性試算ID
 * @param format レポート形式（デフォルト: PDF）
 * @param includeCharts グラフを含めるかどうか（デフォルト: true）
 * @returns レポート生成結果
 */
export const generateCombinedReport = async (
  volumeCheckId: string,
  profitabilityId: string,
  format: ReportFormat = ReportFormat.PDF,
  includeCharts: boolean = true
): Promise<ReportGenerateResponse> => {
  return generateReport({
    type: ReportType.COMBINED,
    format,
    volumeCheckId,
    profitabilityId,
    includeCharts
  });
};