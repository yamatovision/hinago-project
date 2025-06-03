/**
 * 建物形状生成ユーティリティ（フロントエンド版）
 * 敷地形状から建築規制を考慮した建物形状を生成
 */
import { 
  BoundaryPoint, 
  PropertyShape,
  FloorInfo,
  BuildingShape,
  SetbackReason 
} from '../../../../../shared';
import { applyVariableOffset } from './polygonOffset';
import { BoundaryAnalysisResult } from './boundaryAnalyzer';

/**
 * ロガー設定（フロントエンド版）
 */
const logger = {
  boundary: (msg: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`[BOUNDARY] ${msg}`, data ? JSON.stringify(data, null, 2) : '');
    }
  },
  shape: (msg: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`[SHAPE] ${msg}`, data ? JSON.stringify(data, null, 2) : '');
    }
  },
  error: (msg: string, error?: any) => {
    console.error(`[ERROR] ${msg}`, error);
  }
};

/**
 * ポリゴンの面積を計算（ガウスの公式）
 * @param points ポリゴン座標
 * @returns 面積（㎡）
 */
export function calculatePolygonArea(points: BoundaryPoint[]): number {
  let area = 0;
  const n = points.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  
  return Math.abs(area) / 2;
}

/**
 * 簡易的なポリゴンオフセット（内側への縮小）
 * 注: 本格的な実装にはライブラリを使用すべき
 * @param points 元のポリゴン座標
 * @param offset オフセット距離（m）
 * @returns オフセット後のポリゴン座標
 */
function offsetPolygonSimple(points: BoundaryPoint[], offset: number): BoundaryPoint[] {
  // ポリゴンの重心を計算
  const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  
  // 各点を重心方向に移動
  return points.map(point => {
    const dx = point.x - centerX;
    const dy = point.y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return point;
    
    // オフセット分だけ内側に移動
    const ratio = 1 - (offset / distance);
    
    return {
      x: centerX + dx * ratio,
      y: centerY + dy * ratio
    };
  });
}

/**
 * Phase 1: 基本的な建物形状生成（一律セットバック）
 * @param siteShape 敷地形状
 * @param siteArea 敷地面積（㎡）
 * @param buildingCoverage 建蔽率（%）
 * @param floorAreaRatio 容積率（%）
 * @param floorHeight 階高（m）
 * @param setback セットバック距離（m）
 * @param maxHeight 最高高さ制限（m）
 * @returns 建物形状情報
 */
export function generateBasicBuildingShape(
  siteShape: BoundaryPoint[],
  siteArea: number,
  buildingCoverage: number,
  floorAreaRatio: number,
  floorHeight: number,
  setback: number = 2.0,
  maxHeight?: number
): BuildingShape {
  logger.shape('基本建物形状生成開始', {
    sitePoints: siteShape.length,
    siteArea,
    buildingCoverage,
    floorAreaRatio,
    setback
  });
  
  // 敷地形状から建物形状を生成（セットバック適用）
  let buildingFootprint = offsetPolygonSimple(siteShape, setback);
  let buildingArea = calculatePolygonArea(buildingFootprint);
  logger.shape('初期セットバック完了', { buildingArea });
  
  // 建蔽率チェック
  const maxBuildingArea = siteArea * (buildingCoverage / 100);
  if (buildingArea > maxBuildingArea) {
    // 建蔽率を超える場合は追加でセットバック
    const ratio = Math.sqrt(maxBuildingArea / buildingArea);
    const additionalSetback = setback * (1 / ratio);
    buildingFootprint = offsetPolygonSimple(siteShape, additionalSetback);
    buildingArea = calculatePolygonArea(buildingFootprint);
  }
  
  // 容積率から必要な延床面積を計算
  const requiredFloorArea = siteArea * (floorAreaRatio / 100);
  
  // 必要階数を計算
  let floors = Math.ceil(requiredFloorArea / buildingArea);
  
  // 高さ制限がある場合はそれも考慮
  if (maxHeight) {
    const maxFloors = Math.floor(maxHeight / floorHeight);
    floors = Math.min(floors, maxFloors);
  }
  
  // 各階の形状を生成（Phase 1では全階同じ形状）
  const floorInfos: FloorInfo[] = [];
  for (let i = 1; i <= floors; i++) {
    floorInfos.push({
      level: i,
      height: floorHeight,
      shape: buildingFootprint,
      area: buildingArea,
      setback: {
        north: setback,
        south: setback,
        east: setback,
        west: setback,
        uniform: setback
      }
    });
  }
  
  // 建物情報をまとめる
  const totalFloorArea = buildingArea * floors;
  const volumeEfficiency = (totalFloorArea / requiredFloorArea) * 100;
  
  logger.shape('建物形状生成完了', {
    floors: floors,
    buildingArea,
    totalFloorArea,
    volumeEfficiency: Math.min(volumeEfficiency, 100)
  });
  
  return {
    floors: floorInfos,
    totalHeight: floors * floorHeight,
    buildingArea,
    totalFloorArea,
    volumeEfficiency: Math.min(volumeEfficiency, 100)
  };
}

/**
 * PropertyShapeから建物形状を生成
 * @param propertyShape 敷地形状データ
 * @param buildingCoverage 建蔽率（%）
 * @param floorAreaRatio 容積率（%）
 * @param floorHeight 階高（m）
 * @param setback セットバック距離（m）
 * @param maxHeight 最高高さ制限（m）
 * @returns 建物形状情報
 */
export function generateBuildingFromPropertyShape(
  propertyShape: PropertyShape,
  buildingCoverage: number,
  floorAreaRatio: number,
  floorHeight: number,
  setback: number = 2.0,
  maxHeight?: number
): BuildingShape {
  // 敷地面積（実測値があればそれを使用）
  const siteArea = propertyShape.area || calculatePolygonArea(propertyShape.points);
  
  return generateBasicBuildingShape(
    propertyShape.points,
    siteArea,
    buildingCoverage,
    floorAreaRatio,
    floorHeight,
    setback,
    maxHeight
  );
}

/**
 * Phase 2: 境界線種別を考慮した建物形状生成
 * @param siteShape 敷地形状
 * @param siteArea 敷地面積（㎡）
 * @param buildingCoverage 建蔽率（%）
 * @param floorAreaRatio 容積率（%）
 * @param floorHeight 階高（m）
 * @param boundaryAnalysis 境界線分析結果
 * @param maxHeight 最高高さ制限（m）
 * @returns 建物形状情報
 */
export function generateAdvancedBuildingShape(
  siteShape: BoundaryPoint[],
  siteArea: number,
  buildingCoverage: number,
  floorAreaRatio: number,
  floorHeight: number,
  boundaryAnalysis: BoundaryAnalysisResult,
  setbackDistances: Map<number, number>,
  maxHeight?: number
): BuildingShape {
  logger.shape('詳細建物形状生成開始', {
    sitePoints: siteShape.length,
    siteArea,
    roadSegments: boundaryAnalysis.roadSegments,
    setbackDistances: Array.from(setbackDistances.entries())
  });
  
  // Phase 2実装: 不等間隔オフセットを適用
  let buildingFootprint = applyVariableOffset(siteShape, setbackDistances);
  let buildingArea = calculatePolygonArea(buildingFootprint);
  
  logger.shape('不等間隔オフセット適用', {
    originalArea: siteArea,
    afterOffsetArea: buildingArea
  });
  
  // 建蔽率チェック
  const maxBuildingArea = siteArea * (buildingCoverage / 100);
  let iterations = 0;
  const maxIterations = 10;
  
  while (buildingArea > maxBuildingArea && iterations < maxIterations) {
    iterations++;
    logger.shape(`建蔽率調整 (反復${iterations})`, {
      currentArea: buildingArea,
      targetArea: maxBuildingArea,
      ratio: buildingArea / maxBuildingArea
    });
    
    // より積極的な縮小率を計算
    const targetRatio = maxBuildingArea / buildingArea;
    const scaleFactor = Math.sqrt(targetRatio) * 0.95; // 95%でより確実に目標値を下回る
    
    // 各辺に比例的な追加オフセットを加算
    const adjustedSetbacks = new Map<number, number>();
    setbackDistances.forEach((distance, idx) => {
      // 元のオフセットに基づいて比例的に増加
      const newDistance = distance / scaleFactor;
      adjustedSetbacks.set(idx, newDistance);
    });
    
    buildingFootprint = applyVariableOffset(siteShape, adjustedSetbacks);
    buildingArea = calculatePolygonArea(buildingFootprint);
    
    // 次回の反復のために調整後の値を保存
    setbackDistances = adjustedSetbacks;
  }
  
  logger.shape('建蔽率調整完了', {
    finalArea: buildingArea,
    targetArea: maxBuildingArea,
    iterations: iterations,
    achieved: buildingArea <= maxBuildingArea
  });
  
  // 容積率から最大延床面積を計算
  const maxTotalFloorArea = siteArea * (floorAreaRatio / 100);
  
  // 最大階数を計算（容積率制限と高さ制限の両方を考慮）
  let maxFloorsByVolume = Math.floor(maxTotalFloorArea / buildingArea);
  let maxFloorsByHeight = maxHeight ? Math.floor(maxHeight / floorHeight) : Infinity;
  let floors = Math.min(maxFloorsByVolume, maxFloorsByHeight);
  
  // 最低1階は確保
  floors = Math.max(1, floors);
  
  logger.shape('階数計算', {
    maxTotalFloorArea,
    buildingArea,
    maxFloorsByVolume,
    maxFloorsByHeight,
    finalFloors: floors
  });
  
  // 各階の形状を生成
  const floorInfos: FloorInfo[] = [];
  for (let i = 1; i <= floors; i++) {
    // TODO: Phase 3で階層ごとの斜線制限を適用
    floorInfos.push({
      level: i,
      height: floorHeight,
      shape: buildingFootprint,
      area: buildingArea,
      setback: {
        north: setbackDistances.get(2) || 2.0,  // 仮の方位割り当て
        south: setbackDistances.get(0) || 2.0,
        east: setbackDistances.get(1) || 2.0,
        west: setbackDistances.get(3) || 2.0,
        reason: [SetbackReason.ROAD_SETBACK, SetbackReason.NEIGHBOR_SETBACK]
      }
    });
  }
  
  // 建物情報をまとめる
  const totalFloorArea = buildingArea * floors;
  const volumeEfficiency = (totalFloorArea / maxTotalFloorArea) * 100;
  
  logger.shape('詳細建物形状生成完了', {
    floors: floors,
    buildingArea,
    totalFloorArea,
    volumeEfficiency: Math.min(volumeEfficiency, 100)
  });
  
  return {
    floors: floorInfos,
    totalHeight: floors * floorHeight,
    buildingArea,
    totalFloorArea,
    volumeEfficiency: Math.min(volumeEfficiency, 100)
  };
}