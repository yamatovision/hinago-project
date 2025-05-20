/**
 * 日影計算の最適化ユーティリティ
 * 
 * 計算負荷の高い日影シミュレーションのパフォーマンスを最適化するためのユーティリティ関数群
 */
import { Property, BoundaryPoint, ShadowSimulationResult } from '../../../types';
import { SunPosition } from './sunPosition';

/**
 * 日影計算のフィルタリング対象外領域（計算を省略できる領域）
 */
interface ExclusionZone {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * 計算グリッドパラメータ
 */
interface GridParameters {
  resolution: number;  // グリッド解像度（m）
  extent: number;      // 敷地境界からの拡張距離（m）
  decimation?: number; // 間引き率（1=間引きなし、2=1/2に間引き）
}

/**
 * 計算対象のグリッドポイントのフィルタリング
 * 敷地形状に基づいて計算が不要な領域を除外
 * 
 * @param property 物件データ
 * @param extent 敷地境界からの拡張距離（m）
 * @returns 計算不要な領域
 */
export function generateExclusionZones(property: Property): ExclusionZone[] {
  // 敷地形状がない場合は除外ゾーンなし
  if (!property.shapeData?.points || property.shapeData.points.length < 3) {
    return [];
  }
  
  // 敷地自体は計算対象外（建物の影が落ちるため）
  const points = property.shapeData.points;
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  
  const siteExclusion: ExclusionZone = {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys)
  };
  
  // 敷地の北側は冬至の影が落ちないため、計算不要
  // 福岡市の冬至の太陽高度と方位から計算（簡易版）
  const northExclusion: ExclusionZone = {
    minX: siteExclusion.minX - 50, // 余裕を持たせる
    maxX: siteExclusion.maxX + 50, // 余裕を持たせる
    minY: siteExclusion.maxY,      // 敷地の北端
    maxY: siteExclusion.maxY + 100 // 十分な距離
  };
  
  return [siteExclusion, northExclusion];
}

/**
 * 最適化された計算グリッドを生成
 * 空間的な最適化としてグリッドの解像度を調整し、
 * 計算が不要な領域を除外
 * 
 * @param property 物件データ
 * @param params グリッドパラメータ
 * @returns 最適化された計算グリッドポイント
 */
export function generateOptimizedGrid(
  property: Property,
  params: GridParameters = { resolution: 1, extent: 50 }
): { x: number; y: number; z: number }[] {
  // 敷地形状がない場合は空配列
  if (!property.shapeData?.points || property.shapeData.points.length < 3) {
    return [];
  }
  
  // 敷地の範囲を取得
  const points = property.shapeData.points;
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  // グリッド範囲を設定
  const gridMinX = minX - params.extent;
  const gridMaxX = maxX + params.extent;
  const gridMinY = minY - params.extent;
  const gridMaxY = maxY + params.extent;
  
  // 計算不要な領域を取得
  const exclusionZones = generateExclusionZones(property);
  
  // メッシュサイズ（解像度）
  const resolution = params.resolution;
  
  // 間引き率（デフォルトは1 = 間引きなし）
  const decimation = params.decimation || 1;
  
  // グリッドポイントを生成
  const grid: { x: number; y: number; z: number }[] = [];
  
  // 北側の影響が最も大きい方向を計算（冬至の場合は南向き = 180度方向）
  const shadowDirection = 180;
  const shadowDirectionRad = (shadowDirection * Math.PI) / 180;
  const shadowVector = {
    x: Math.sin(shadowDirectionRad),
    y: Math.cos(shadowDirectionRad)
  };
  
  // 敷地から見て日影が最も伸びる方向を優先的にサンプリング
  let xCount = 0;
  let yCount = 0;
  
  for (let x = gridMinX; x <= gridMaxX; x += resolution * decimation) {
    // x方向の間引き
    if (xCount % decimation !== 0) {
      xCount++;
      continue;
    }
    
    for (let y = gridMinY; y <= gridMaxY; y += resolution * decimation) {
      // y方向の間引き
      if (yCount % decimation !== 0) {
        yCount++;
        continue;
      }
      
      // 除外ゾーンにあるかチェック
      let skip = false;
      for (const zone of exclusionZones) {
        if (x >= zone.minX && x <= zone.maxX && 
            y >= zone.minY && y <= zone.maxY) {
          skip = true;
          break;
        }
      }
      
      if (skip) {
        continue;
      }
      
      // 特定方向のサンプリング密度を上げる（建物の影が伸びる方向）
      // 影が伸びる方向ベクトルとの内積で判定
      const dx = x - (minX + maxX) / 2; // 敷地中心からのベクトル
      const dy = y - (minY + maxY) / 2;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 正規化
      const nx = distance > 0 ? dx / distance : 0;
      const ny = distance > 0 ? dy / distance : 0;
      
      // 影の方向との内積（どれだけ影の方向に合致するか）
      const dot = nx * shadowVector.x + ny * shadowVector.y;
      
      // 影の方向と反対の領域（北側）は間引く
      if (dot < -0.7) { // -0.7 = 約135度以上影の方向と逆の場合
        if (decimation > 1 && distance > params.extent / 2) {
          continue; // 間引き
        }
      }
      
      // サンプリングバイアス：影の方向に密に、逆方向に疎に
      const biasedDecimation = Math.max(1, 
        decimation - Math.floor(1.5 * (dot + 1))); // dot: -1~1 → 0~3
      
      if (biasedDecimation > 1 && 
          (xCount % biasedDecimation !== 0 || yCount % biasedDecimation !== 0)) {
        continue;
      }
      
      // グリッドポイントを追加
      grid.push({
        x,
        y,
        z: property.shadowRegulationDetail?.measurementHeight || 4
      });
      
      yCount++;
    }
    xCount++;
  }
  
  return grid;
}

/**
 * バッチ処理による日影計算の最適化
 * 大量の計算を小さなバッチに分割して処理
 * 
 * @param grid 計算グリッド
 * @param buildingShape 建物形状
 * @param sunPositions 太陽位置の配列
 * @param batchSize バッチサイズ
 * @returns バッチごとの計算関数の配列
 */
export function createShadowCalculationBatches(
  grid: { x: number; y: number; z: number }[],
  buildingShape: any,
  sunPositions: { time: number; position: SunPosition }[],
  batchSize: number = 500
): (() => { shadowHours: number[]; batchIndices: { start: number; end: number } })[] {
  // バッチ数を計算
  const totalPoints = grid.length;
  const batchCount = Math.ceil(totalPoints / batchSize);
  
  // バッチごとの計算関数配列
  const batchFunctions: (() => { shadowHours: number[]; batchIndices: { start: number; end: number } })[] = [];
  
  // 必要な関数をバッチが参照できるようにローカルコピーとして定義
  // 太陽光線ベクトルを計算
  const localCalculateSunRayVector = (sunPosition: SunPosition): { x: number; y: number; z: number } => {
    // 太陽の方位角と高度角から光線方向ベクトルを計算
    const azimuthRad = (sunPosition.azimuth * Math.PI) / 180;
    const altitudeRad = (sunPosition.altitude * Math.PI) / 180;
    
    return {
      x: Math.sin(azimuthRad) * Math.cos(altitudeRad),
      y: Math.cos(azimuthRad) * Math.cos(altitudeRad),
      z: Math.sin(altitudeRad)
    };
  };
  
  // 点がポリゴン内に含まれるかチェック（レイキャスティング法）
  const localIsPointInPolygon = (
    point: { x: number; y: number }, 
    polygon: { x: number; y: number }[]
  ): boolean => {
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
  };
  
  // 点が建物の影に入っているかチェック
  const localIsPointInShadow = (
    point: { x: number; y: number; z: number },
    buildingShape: any,
    sunRay: { x: number; y: number; z: number }
  ): boolean => {
    // 光線追跡法：点から太陽方向に光線を延ばし、建物と交差するかチェック
    
    // 点が建物の底面ポリゴン上にあるかチェック
    if (localIsPointInPolygon({ x: point.x, y: point.y }, buildingShape.basePolygon)) {
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
    return localIsPointInPolygon(
      { x: intersectX, y: intersectY },
      buildingShape.basePolygon
    );
  };
  
  for (let i = 0; i < batchCount; i++) {
    const startIdx = i * batchSize;
    const endIdx = Math.min((i + 1) * batchSize, totalPoints);
    const batchGrid = grid.slice(startIdx, endIdx);
    
    // このバッチの計算関数
    const batchFunction = () => {
      // バッチの計算結果
      const shadowHours: number[] = [];
      
      // 各グリッドポイントの日影時間を計算
      for (let j = 0; j < batchGrid.length; j++) {
        const point = batchGrid[j];
        let inShadowCount = 0;
        
        // 各時間の日影状態をチェック
        for (let k = 0; k < sunPositions.length; k++) {
          const { position } = sunPositions[k];
          
          // 太陽が地平線より上の場合のみ計算
          if (position.altitude > 0) {
            // 太陽光線ベクトルを計算
            const sunRay = localCalculateSunRayVector(position);
            
            // 日影計算
            const isInShadow = localIsPointInShadow(point, buildingShape, sunRay);
            
            if (isInShadow) {
              inShadowCount++;
            }
          }
        }
        
        // 総日影時間（時間）を記録
        shadowHours.push(inShadowCount);
      }
      
      // このバッチの日影時間を返す
      return { shadowHours, batchIndices: { start: startIdx, end: endIdx } };
    };
    
    batchFunctions.push(batchFunction);
  }
  
  return batchFunctions;
}

/**
 * 太陽光線ベクトルを計算
 * @param sunPosition 太陽位置
 * @returns 太陽光線ベクトル（正規化済み）
 */
function calculateSunRayVector(sunPosition: SunPosition): { x: number; y: number; z: number } {
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
  point: { x: number; y: number; z: number },
  buildingShape: any,
  sunRay: { x: number; y: number; z: number }
): boolean {
  // 光線追跡法：点から太陽方向に光線を延ばし、建物と交差するかチェック
  
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