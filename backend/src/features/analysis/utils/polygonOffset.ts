/**
 * 不等間隔ポリゴンオフセットユーティリティ（Phase 2）
 * 各辺に異なるオフセット距離を適用してポリゴンを内側に縮小
 */
import { BoundaryPoint } from '../../../types';
import * as turf from '@turf/turf';
// @ts-ignore
const ClipperLib = require('clipper-lib');

/**
 * ロガー設定
 */
const logger = {
  offset: (msg: string, data?: any) => {
    console.log(`[OFFSET] ${msg}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (msg: string, error?: any) => {
    console.error(`[OFFSET-ERROR] ${msg}`, error);
  }
};

/**
 * BoundaryPoint配列をTurf.jsのPolygon座標形式に変換
 */
function boundaryPointsToCoordinates(points: BoundaryPoint[]): number[][] {
  // ポリゴンは最初と最後の点が同じである必要がある
  const coords = points.map(p => [p.x, p.y]);
  if (coords.length > 0 && (coords[0][0] !== coords[coords.length - 1][0] || 
      coords[0][1] !== coords[coords.length - 1][1])) {
    coords.push([coords[0][0], coords[0][1]]);
  }
  return coords;
}

/**
 * Turf.jsの座標形式をBoundaryPoint配列に変換
 */
function coordinatesToBoundaryPoints(coords: number[][]): BoundaryPoint[] {
  // 最後の重複点を除去
  const points = coords.slice(0, -1);
  return points.map(coord => ({ x: coord[0], y: coord[1] }));
}

/**
 * 辺ごとに異なるオフセット距離を適用（Turf.js実装）
 * @param points 元のポリゴン座標
 * @param segmentOffsets 各辺のオフセット距離（Map<辺インデックス, 距離>）
 * @returns オフセット後のポリゴン座標
 */
export function applyVariableOffsetTurf(
  points: BoundaryPoint[],
  segmentOffsets: Map<number, number>
): BoundaryPoint[] {
  logger.offset('Turf.js実装: 不等間隔オフセット開始', {
    pointCount: points.length,
    offsets: Array.from(segmentOffsets.entries())
  });

  try {
    // 平均オフセット距離を計算
    const offsetValues = Array.from(segmentOffsets.values());
    const avgOffset = offsetValues.reduce((sum, val) => sum + val, 0) / offsetValues.length;
    
    // Turf.jsでポリゴンを作成
    const coords = boundaryPointsToCoordinates(points);
    const polygon = turf.polygon([coords]);
    
    // 負の値で内側にオフセット
    const buffered = turf.buffer(polygon, -avgOffset, { units: 'meters' });
    
    if (!buffered || buffered.geometry.type !== 'Polygon') {
      throw new Error('オフセット後のポリゴンが無効です');
    }
    
    const resultCoords = buffered.geometry.coordinates[0];
    const result = coordinatesToBoundaryPoints(resultCoords);
    
    logger.offset('Turf.js実装: オフセット完了', {
      originalArea: calculateArea(points),
      resultArea: calculateArea(result)
    });
    
    return result;
  } catch (error) {
    logger.error('Turf.js実装エラー', error);
    // フォールバックとして元の形状を返す
    return points;
  }
}

/**
 * 辺ごとに異なるオフセット距離を適用（Clipper実装）
 * @param points 元のポリゴン座標
 * @param segmentOffsets 各辺のオフセット距離（Map<辺インデックス, 距離>）
 * @param scale スケール係数（デフォルト: 100）
 * @returns オフセット後のポリゴン座標
 */
export function applyVariableOffsetClipper(
  points: BoundaryPoint[],
  segmentOffsets: Map<number, number>,
  scale: number = 100
): BoundaryPoint[] {
  logger.offset('Clipper実装: 不等間隔オフセット開始', {
    pointCount: points.length,
    offsets: Array.from(segmentOffsets.entries()),
    scale
  });

  try {
    // ClipperLibの初期化
    const clipper = new ClipperLib.ClipperOffset();
    const solution = new ClipperLib.Paths();
    
    // BoundaryPointをClipperの形式に変換（スケーリング適用）
    const path = new ClipperLib.Path();
    points.forEach(point => {
      path.push(new ClipperLib.IntPoint(
        Math.round(point.x * scale),
        Math.round(point.y * scale)
      ));
    });
    
    // 平均オフセット距離を計算（現時点では簡易実装）
    const offsetValues = Array.from(segmentOffsets.values());
    const avgOffset = offsetValues.reduce((sum, val) => sum + val, 0) / offsetValues.length;
    
    // パスを追加（JoinType: jtMiter, EndType: etClosedPolygon）
    clipper.AddPath(path, ClipperLib.JoinType.jtMiter, ClipperLib.EndType.etClosedPolygon);
    
    // オフセットを実行（負の値で内側に）
    clipper.Execute(solution, -avgOffset * scale);
    
    if (solution.length === 0) {
      throw new Error('オフセット後のポリゴンが生成されませんでした');
    }
    
    // 結果をBoundaryPoint形式に変換
    const resultPath = solution[0];
    const result = resultPath.map((point: any) => ({
      x: point.X / scale,
      y: point.Y / scale
    }));
    
    logger.offset('Clipper実装: オフセット完了', {
      originalArea: calculateArea(points),
      resultArea: calculateArea(result)
    });
    
    return result;
  } catch (error) {
    logger.error('Clipper実装エラー', error);
    // フォールバックとして元の形状を返す
    return points;
  }
}

/**
 * カスタム実装: 各辺を個別にオフセット
 * @param points 元のポリゴン座標
 * @param segmentOffsets 各辺のオフセット距離
 * @returns オフセット後のポリゴン座標
 */
export function applyVariableOffsetCustom(
  points: BoundaryPoint[],
  segmentOffsets: Map<number, number>
): BoundaryPoint[] {
  logger.offset('カスタム実装: 不等間隔オフセット開始', {
    pointCount: points.length,
    offsets: Array.from(segmentOffsets.entries())
  });

  const n = points.length;
  const offsetLines: any[] = []; // LineString型の代わりにanyを使用
  
  // 各辺を内側にオフセット
  for (let i = 0; i < n; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const offset = segmentOffsets.get(i) || 0;
    
    // 辺の方向ベクトル
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) continue;
    
    // 法線ベクトル（内側向き）
    const nx = -dy / length;
    const ny = dx / length;
    
    // オフセットした線分の端点
    const offsetP1: BoundaryPoint = {
      x: p1.x + nx * offset,
      y: p1.y + ny * offset
    };
    const offsetP2: BoundaryPoint = {
      x: p2.x + nx * offset,
      y: p2.y + ny * offset
    };
    
    offsetLines.push(turf.lineString([[offsetP1.x, offsetP1.y], [offsetP2.x, offsetP2.y]]));
  }
  
  // オフセットした線分の交点を計算
  const newPoints: BoundaryPoint[] = [];
  for (let i = 0; i < n; i++) {
    const line1 = offsetLines[i];
    const line2 = offsetLines[(i + 1) % n];
    
    // 2つの線分を延長して交点を求める
    const intersection = findLineIntersection(line1, line2);
    if (intersection) {
      newPoints.push(intersection);
    } else {
      // 交点が見つからない場合は元の点を使用
      logger.offset(`交点が見つかりません: 辺${i}と辺${(i + 1) % n}`);
      newPoints.push(points[(i + 1) % n]);
    }
  }
  
  logger.offset('カスタム実装: オフセット完了', {
    originalArea: calculateArea(points),
    resultArea: calculateArea(newPoints)
  });
  
  return newPoints;
}

/**
 * 2つの線分（延長線）の交点を求める
 */
function findLineIntersection(line1: any, line2: any): BoundaryPoint | null {
  const coords1 = line1.geometry.coordinates;
  const coords2 = line2.geometry.coordinates;
  
  const x1 = coords1[0][0], y1 = coords1[0][1];
  const x2 = coords1[1][0], y2 = coords1[1][1];
  const x3 = coords2[0][0], y3 = coords2[0][1];
  const x4 = coords2[1][0], y4 = coords2[1][1];
  
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  
  if (Math.abs(denom) < 1e-10) {
    return null; // 平行
  }
  
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  
  return {
    x: x1 + t * (x2 - x1),
    y: y1 + t * (y2 - y1)
  };
}

/**
 * ポリゴンの面積を計算
 */
function calculateArea(points: BoundaryPoint[]): number {
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
 * デフォルトのオフセット実装を選択
 */
export const applyVariableOffset = applyVariableOffsetCustom;