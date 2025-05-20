/**
 * 建築基準法規制計算モジュール
 * 
 * 高度地区、斜線制限、日影規制、地区計画対応の各種計算機能をまとめたインデックス
 */

// 高度地区計算
export * from './heightDistrict';

// 斜線制限計算
export * from './slopeRegulation';

// 地区計画対応
export * from './districtPlan';

// 太陽位置計算
export * from './sunPosition';

// 日影シミュレーション
export * from './shadowSimulation';

// 日影規制計算
export * from './shadowRegulation';

/**
 * 最終的な高さ制限の計算
 * 各種制限から最も厳しい値を採用
 * 
 * @param heightLimits 高さ制限の配列
 * @returns 最終的な高さ制限（m）
 */
export function calculateFinalHeightLimit(heightLimits: number[]): number {
  // 無限大（制限なし）を除外
  const finiteHeightLimits = heightLimits.filter(limit => limit !== Infinity && !isNaN(limit));
  
  // 有限の制限がない場合
  if (finiteHeightLimits.length === 0) {
    return Infinity; // 制限なし
  }
  
  // 最も低い値（厳しい制限）を採用
  return Math.min(...finiteHeightLimits);
}