/**
 * 日影シミュレーションユーティリティ
 * 
 * 建物形状と太陽位置に基づいて日影の範囲を計算するためのユーティリティ関数群
 */
import { Property, BoundaryPoint, BuildingParams, ShadowSimulationResult } from '../../../types';
import { calculateSunPositionsForDay, getWinterSolsticeDate, SunPosition } from './sunPosition';

/**
 * 座標点の型定義
 */
interface Point3D {
  x: number;
  y: number;
  z: number;
}

/**
 * 建物形状の型定義
 */
interface BuildingShape {
  basePolygon: BoundaryPoint[]; // 建物の底面形状
  height: number;               // 建物の高さ
  vertices: Point3D[];          // 建物の頂点座標
}

/**
 * 日影計算用のグリッドポイント
 */
interface GridPoint {
  x: number;
  y: number;
  z: number;
  shadowHours: number;  // その点での日影時間
  inShadow: boolean[];  // 各時間帯での日影状態
}

/**
 * 日影等時間線マップの型定義
 */
export interface IsochroneMap {
  resolution: number;     // 解像度（m/メッシュ）
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  gridData: number[][];   // x,y座標での日影時間
}

/**
 * 建物形状を生成
 * @param property 物件データ
 * @param buildingParams 建築パラメータ
 * @returns 建物形状データ
 */
export function generateBuildingShape(property: Property, buildingParams: BuildingParams & { height?: number }): BuildingShape {
  // 敷地形状データが存在しない場合は例外
  if (!property.shapeData?.points || property.shapeData.points.length < 3) {
    throw new Error('敷地形状データが不足しています');
  }
  
  // 建物高さの取得（パラメータで与えられた値または階数×階高）
  const height = buildingParams.height || 
                (buildingParams.floors * buildingParams.floorHeight);
  
  // 簡易実装: 建物底面を敷地形状と同じに（実際には建蔽率などから計算）
  // これは最大ケースのシミュレーションとして使用
  const basePolygon = property.shapeData.points.map(point => ({
    x: point.x,
    y: point.y
  }));
  
  // 建物の頂点を計算
  const vertices: Point3D[] = [
    // まず底面の頂点
    ...basePolygon.map(point => ({
      x: point.x,
      y: point.y,
      z: 0
    })),
    // 次に上面の頂点
    ...basePolygon.map(point => ({
      x: point.x,
      y: point.y,
      z: height
    }))
  ];
  
  return {
    basePolygon,
    height,
    vertices
  };
}

/**
 * 日影シミュレーションの実行
 * @param property 物件データ
 * @param buildingShape 建物形状
 * @param measurementHeight 測定面の高さ（m）
 * @param year 年（デフォルトは現在の年）
 * @returns 日影シミュレーション結果
 */
export function simulateShadow(
  property: Property,
  buildingShape: BuildingShape,
  measurementHeight: number,
  year: number = new Date().getFullYear()
): ShadowSimulationResult {
  // 冬至日を取得
  const winterSolstice = getWinterSolsticeDate(year);
  
  // 冬至日の太陽位置を計算（1時間ごと）
  const sunPositions = calculateSunPositionsForDay(winterSolstice);
  
  // 計算グリッドを生成
  const grid = generateCalculationGrid(property, buildingShape, measurementHeight);
  
  // 各時間帯の日影を計算
  for (let i = 0; i < sunPositions.length; i++) {
    const { time, position } = sunPositions[i];
    calculateShadowForTimePoint(grid, buildingShape, position, i);
  }
  
  // 日影時間を集計
  calculateTotalShadowHours(grid, sunPositions.length);
  
  // 日影等時間線マップを生成
  const isochroneMap = generateIsochroneMap(grid);
  
  // 最大日影時間と中間日影時間を計算
  const { maxHours, mediumHours } = calculateShadowStatistics(grid);
  
  // 適合判定
  const compliant = checkShadowRegulationCompliance(property, maxHours, mediumHours);
  
  return {
    isochroneMap,
    maxHours,
    mediumHours,
    compliant
  };
}

/**
 * 計算用のグリッドを生成
 * @param property 物件データ
 * @param buildingShape 建物形状
 * @param measurementHeight 測定面の高さ
 * @returns 計算グリッド
 */
function generateCalculationGrid(
  property: Property,
  buildingShape: BuildingShape,
  measurementHeight: number
): GridPoint[] {
  const grid: GridPoint[] = [];
  
  // 敷地形状の範囲を計算
  const points = property.shapeData!.points;
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  // グリッドの範囲を敷地から50m外側まで拡張
  const gridRange = 50; // 50m
  const gridSize = 1;   // 1mメッシュ
  
  // グリッドを生成
  for (let x = minX - gridRange; x <= maxX + gridRange; x += gridSize) {
    for (let y = minY - gridRange; y <= maxY + gridRange; y += gridSize) {
      // 敷地内のグリッドポイントはスキップ（建物下部は日影計算不要）
      if (isPointInPolygon({ x, y }, points)) {
        continue;
      }
      
      grid.push({
        x,
        y,
        z: measurementHeight,
        shadowHours: 0,
        inShadow: []
      });
    }
  }
  
  return grid;
}

/**
 * 特定の時間帯における日影を計算
 * @param grid 計算グリッド
 * @param buildingShape 建物形状
 * @param sunPosition 太陽位置
 * @param timeIndex 時間インデックス
 */
function calculateShadowForTimePoint(
  grid: GridPoint[],
  buildingShape: BuildingShape,
  sunPosition: SunPosition,
  timeIndex: number
): void {
  // 太陽が地平線より下の場合は全てのポイントを日影とする
  if (sunPosition.altitude <= 0) {
    grid.forEach(point => {
      point.inShadow[timeIndex] = true;
    });
    return;
  }
  
  // 太陽方向ベクトルを計算
  const sunRay = calculateSunRayVector(sunPosition);
  
  // 各グリッドポイントが日影内かチェック
  grid.forEach(point => {
    point.inShadow[timeIndex] = isPointInShadow(point, buildingShape, sunRay);
  });
}

/**
 * 太陽光線ベクトルを計算
 * @param sunPosition 太陽位置
 * @returns 太陽光線ベクトル（正規化済み）
 */
function calculateSunRayVector(sunPosition: SunPosition): Point3D {
  // 太陽の方位角と高度角から光線方向ベクトルを計算
  const azimuthRad = (sunPosition.azimuth * Math.PI) / 180;
  const altitudeRad = (sunPosition.altitude * Math.PI) / 180;
  
  return {
    x: Math.sin(azimuthRad) * Math.cos(altitudeRad),
    y: Math.cos(azimuthRad) * Math.cos(altitudeRad),
    z: Math.sin(altitudeRad)
  };
}

/**
 * 点が建物の影に入っているかチェック
 * @param point グリッドポイント
 * @param buildingShape 建物形状
 * @param sunRay 太陽光線ベクトル
 * @returns 影に入っているかどうか
 */
function isPointInShadow(
  point: Point3D,
  buildingShape: BuildingShape,
  sunRay: Point3D
): boolean {
  // 光線追跡法：点から太陽方向に光線を延ばし、建物と交差するかチェック
  // 単純化のため、垂直方向の交差チェックのみ実施
  
  // 点が建物の底面ポリゴン上にあるかチェック
  if (isPointInPolygon({ x: point.x, y: point.y }, buildingShape.basePolygon)) {
    // 点の高さが建物高さ以下なら影の中
    return point.z < buildingShape.height;
  }
  
  // 太陽光線ベクトルが下向きに強すぎる場合は建物と交差しない
  if (sunRay.z <= 0) {
    return false;
  }
  
  // 光線を逆方向に延ばして、建物上部と交差する点を計算
  const t = (buildingShape.height - point.z) / sunRay.z;
  
  // 交差点がz軸負方向なら影には入らない
  if (t <= 0) {
    return false;
  }
  
  // 交差点のxy座標を計算
  const intersectX = point.x - t * sunRay.x;
  const intersectY = point.y - t * sunRay.y;
  
  // その交差点が建物の底面ポリゴン内にあるかチェック
  return isPointInPolygon(
    { x: intersectX, y: intersectY },
    buildingShape.basePolygon
  );
}

/**
 * 総日影時間を計算
 * @param grid 計算グリッド
 * @param timeCount 時間帯の数
 */
function calculateTotalShadowHours(grid: GridPoint[], timeCount: number): void {
  grid.forEach(point => {
    // 各時間帯での日影状態を集計
    let shadowCount = 0;
    for (let i = 0; i < timeCount; i++) {
      if (point.inShadow[i]) {
        shadowCount++;
      }
    }
    
    // 総日影時間を設定（1時間単位）
    point.shadowHours = shadowCount;
  });
}

/**
 * 日影等時間線マップを生成
 * @param grid 計算グリッド
 * @returns 日影等時間線マップ
 */
function generateIsochroneMap(grid: GridPoint[]): IsochroneMap {
  // グリッドの範囲を計算
  const xs = grid.map(p => p.x);
  const ys = grid.map(p => p.y);
  
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  
  // グリッドサイズを計算
  const resolution = 1; // 1mメッシュ
  const xSize = Math.ceil((xMax - xMin) / resolution) + 1;
  const ySize = Math.ceil((yMax - yMin) / resolution) + 1;
  
  // グリッドデータを初期化
  const gridData = Array(xSize).fill(0).map(() => Array(ySize).fill(0));
  
  // グリッドデータに日影時間を設定
  grid.forEach(point => {
    const xIndex = Math.floor((point.x - xMin) / resolution);
    const yIndex = Math.floor((point.y - yMin) / resolution);
    
    // 範囲外のポイントは無視
    if (xIndex >= 0 && xIndex < xSize && yIndex >= 0 && yIndex < ySize) {
      gridData[xIndex][yIndex] = point.shadowHours;
    }
  });
  
  return {
    resolution,
    xMin,
    xMax,
    yMin,
    yMax,
    gridData
  };
}

/**
 * 日影時間の統計を計算
 * @param grid 計算グリッド
 * @returns 最大日影時間と中間日影時間
 */
function calculateShadowStatistics(grid: GridPoint[]): { maxHours: number, mediumHours: number } {
  // 空のグリッドの場合はゼロを返す
  if (grid.length === 0) {
    return { maxHours: 0, mediumHours: 0 };
  }
  
  // 日影時間をソート
  const sortedHours = grid
    .map(point => point.shadowHours)
    .sort((a, b) => b - a); // 降順
  
  // 最大日影時間
  const maxHours = sortedHours[0];
  
  // 中間日影時間（時間分布の中央値に近い値）
  // 規制上は最大時間エリアに隣接する領域の時間を使用するが、
  // 簡易計算として上位25%地点の時間を使用
  const mediumIndex = Math.floor(sortedHours.length * 0.25);
  const mediumHours = mediumIndex < sortedHours.length ? sortedHours[mediumIndex] : 0;
  
  return { maxHours, mediumHours };
}

/**
 * 日影規制への適合をチェック
 * @param property 物件データ
 * @param maxHours 最大日影時間
 * @param mediumHours 中間日影時間
 * @returns 適合判定
 */
function checkShadowRegulationCompliance(
  property: Property,
  maxHours: number,
  mediumHours: number
): boolean {
  // 日影規制がなければ適合
  if (!property.shadowRegulation || property.shadowRegulation === 'none') {
    return true;
  }
  
  // 日影規制詳細がない場合はデフォルト値を使用
  const shadowRegDetail = property.shadowRegulationDetail || getDefaultShadowRegulationDetail(property);
  
  // 規制時間と比較して適合判定
  const primaryCompliant = maxHours <= shadowRegDetail.hourRanges.primary;
  const secondaryCompliant = mediumHours <= shadowRegDetail.hourRanges.secondary;
  
  return primaryCompliant && secondaryCompliant;
}

/**
 * デフォルトの日影規制詳細を取得
 * @param property 物件データ
 * @returns 日影規制詳細
 */
function getDefaultShadowRegulationDetail(property: Property): {
  measurementHeight: number;
  hourRanges: { primary: number; secondary: number };
} {
  // 日影規制タイプに応じたデフォルト値
  switch (property.shadowRegulation) {
    case 'type1': // 規制タイプ1（4時間/2.5時間）
      return {
        measurementHeight: 4, // 測定面高さ 4m
        hourRanges: {
          primary: 4,    // 4時間
          secondary: 2.5 // 2.5時間
        }
      };
    case 'type2': // 規制タイプ2（5時間/3時間）
      return {
        measurementHeight: 4, // 測定面高さ 4m
        hourRanges: {
          primary: 5,  // 5時間
          secondary: 3 // 3時間
        }
      };
    default:
      return {
        measurementHeight: 4, // 測定面高さ 4m
        hourRanges: {
          primary: 4,    // 4時間
          secondary: 2.5 // 2.5時間
        }
      };
  }
}

/**
 * 点がポリゴン内に含まれるかチェック（レイキャスティング法）
 * @param point チェックする点
 * @param polygon ポリゴン頂点配列
 * @returns ポリゴン内に含まれるかどうか
 */
function isPointInPolygon(point: { x: number; y: number }, polygon: { x: number; y: number }[]): boolean {
  // ポリゴンが3点未満の場合は常に外部
  if (polygon.length < 3) {
    return false;
  }
  
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) {
      inside = !inside;
    }
  }
  
  return inside;
}