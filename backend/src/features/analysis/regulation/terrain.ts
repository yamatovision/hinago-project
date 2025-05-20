/**
 * 地形考慮モジュール
 * 
 * 複雑な地形や傾斜地での建築規制計算を行うためのユーティリティ関数群
 */
import { Property, BoundaryPoint } from '../../../types';

/**
 * 標高点の型定義
 */
export interface ElevationPoint extends BoundaryPoint {
  z: number; // 標高
}

/**
 * 地形データの型定義
 */
export interface TerrainData {
  elevationPoints: ElevationPoint[];  // 標高点のリスト
  averageElevation: number;           // 平均地盤面
  highestPoint: number;               // 最高点
  lowestPoint: number;                // 最低点
  slopeAngle: number;                 // 斜面の傾斜角（度）
  slopeDirection: number;             // 斜面の方位角（北=0°、時計回り）
}

/**
 * 点の標高データから平均地盤面を計算
 * @param elevationPoints 標高点のリスト
 * @returns 平均地盤面の標高（m）
 */
export function calculateAverageGroundLevel(elevationPoints: ElevationPoint[]): number {
  if (elevationPoints.length === 0) {
    return 0;
  }
  
  // 全点の標高の平均を計算
  const totalElevation = elevationPoints.reduce((sum, point) => sum + point.z, 0);
  return totalElevation / elevationPoints.length;
}

/**
 * 標高点から地形データを生成
 * @param elevationPoints 標高点のリスト
 * @returns 地形データ
 */
export function generateTerrainData(elevationPoints: ElevationPoint[]): TerrainData {
  if (elevationPoints.length < 3) {
    throw new Error('地形分析には少なくとも3つの標高点が必要です');
  }
  
  // 最高点と最低点を取得
  const elevations = elevationPoints.map(p => p.z);
  const highestPoint = Math.max(...elevations);
  const lowestPoint = Math.min(...elevations);
  
  // 平均地盤面を計算
  const averageElevation = calculateAverageGroundLevel(elevationPoints);
  
  // 最も標高差の大きい二点を見つけて傾斜角を計算
  let maxSlopeAngle = 0;
  let slopeDirection = 0;
  
  for (let i = 0; i < elevationPoints.length; i++) {
    for (let j = i + 1; j < elevationPoints.length; j++) {
      const p1 = elevationPoints[i];
      const p2 = elevationPoints[j];
      
      // 水平距離を計算
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const horizontalDistance = Math.sqrt(dx * dx + dy * dy);
      
      // 垂直距離（標高差）
      const verticalDistance = Math.abs(p2.z - p1.z);
      
      // 傾斜角を計算（ラジアン → 度）
      const angle = Math.atan(verticalDistance / horizontalDistance) * (180 / Math.PI);
      
      // より大きい傾斜角を記録
      if (angle > maxSlopeAngle) {
        maxSlopeAngle = angle;
        
        // 傾斜の方向（方位角）を計算
        slopeDirection = Math.atan2(dy, dx) * (180 / Math.PI);
        
        // 0-360度の範囲に調整（北=0°、時計回り）
        slopeDirection = (90 - slopeDirection) % 360;
        if (slopeDirection < 0) slopeDirection += 360;
      }
    }
  }
  
  return {
    elevationPoints,
    averageElevation,
    highestPoint,
    lowestPoint,
    slopeAngle: maxSlopeAngle,
    slopeDirection
  };
}

/**
 * 傾斜地での高さ規制の調整
 * @param baseHeightLimit 基本となる高さ制限（m）
 * @param terrain 地形データ
 * @returns 調整された高さ制限（m）
 */
export function adjustHeightLimitForSlope(baseHeightLimit: number, terrain: TerrainData): number {
  // 傾斜が緩やかな場合は調整なし
  if (terrain.slopeAngle < 3) {
    return baseHeightLimit;
  }
  
  // 傾斜角に応じた調整係数（例: 傾斜10度で1.05倍まで緩和）
  const slopeCoefficient = 1 + (Math.min(terrain.slopeAngle, 15) / 100);
  
  // 傾斜による高さ制限の緩和
  const adjustedLimit = baseHeightLimit * slopeCoefficient;
  
  // 最大でも元の制限の1.15倍まで
  const maxLimit = baseHeightLimit * 1.15;
  
  return Math.min(adjustedLimit, maxLimit);
}

/**
 * 傾斜地の敷地での建築高さの基準点を取得
 * @param property 物件データ
 * @param terrain 地形データ
 * @returns 建築高さの計算基準点の標高（m）
 */
export function getHeightReferenceLevel(property: Property, terrain: TerrainData): number {
  // 傾斜地の場合、道路面からの高さと平均地盤面の低い方を採用
  // ここでは道路面の標高を最も低い点と仮定
  const roadLevel = terrain.lowestPoint;
  
  return Math.min(terrain.averageElevation, roadLevel);
}

/**
 * 地形を考慮した実際の建物高さを計算
 * @param buildingHeight 基本建物高さ（m）
 * @param terrain 地形データ
 * @returns 地形を考慮した実際の最高点の高さ（m）
 */
export function calculateActualBuildingHeight(buildingHeight: number, terrain: TerrainData): number {
  // 平均地盤面から計算したときの最高点の高さ
  const heightFromAverage = buildingHeight;
  
  // 最低点から計算したときの最高点の高さ
  const heightFromLowest = buildingHeight + (terrain.averageElevation - terrain.lowestPoint);
  
  // 実際の建物高さは、平均地盤面からの高さと最低点からの高さのうち大きい方
  return Math.max(heightFromAverage, heightFromLowest);
}

/**
 * 傾斜地での日影計算の基準面高さを調整
 * @param baseHeight 基本となる基準面高さ（m）
 * @param terrain 地形データ
 * @returns 調整された基準面高さ（m）
 */
export function adjustShadowMeasurementHeight(baseHeight: number, terrain: TerrainData): number {
  // 傾斜地では日影測定面の高さを調整
  // 傾斜角が大きい場合、低い方を基準にする
  if (terrain.slopeAngle > 5) {
    // 基準となる高さから傾斜による影響分を差し引く
    const adjustedHeight = baseHeight - (terrain.slopeAngle / 10);
    
    // 最低でも1mを確保
    return Math.max(1, adjustedHeight);
  }
  
  return baseHeight;
}