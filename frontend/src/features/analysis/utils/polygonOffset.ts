/**
 * 不等間隔ポリゴンオフセットユーティリティ（フロントエンド版）
 * Phase 2: 各辺に異なるオフセット距離を適用してポリゴンを内側に縮小
 */
import { BoundaryPoint } from '../../../../../shared';
import * as turf from '@turf/turf';
// @ts-ignore
const ClipperLib = require('clipper-lib');

/**
 * ロガー設定（フロントエンド版）
 */
const logger = {
  offset: (msg: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`[OFFSET] ${msg}`, data ? JSON.stringify(data, null, 2) : '');
    }
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
    // 均一オフセットとして最大値を使用
    const maxOffset = Math.max(...Array.from(segmentOffsets.values()));
    const coords = boundaryPointsToCoordinates(points);
    const polygon = turf.polygon([coords]);
    
    // Turf.jsのbufferは外側に膨張するので、負の値で内側にオフセット
    const buffered = turf.buffer(polygon, -maxOffset, { units: 'meters' });
    
    if (!buffered || buffered.geometry.type !== 'Polygon') {
      logger.error('Turf.js: オフセット失敗');
      return points;
    }
    
    const resultCoords = buffered.geometry.coordinates[0];
    const result = coordinatesToBoundaryPoints(resultCoords);
    
    logger.offset('Turf.js実装: オフセット完了', {
      originalArea: calculatePolygonArea(points),
      resultArea: calculatePolygonArea(result)
    });
    
    return result;
  } catch (error) {
    logger.error('Turf.js実装エラー', error);
    return points;
  }
}

/**
 * ポリゴンの面積を計算（ガウスの公式）
 */
function calculatePolygonArea(points: BoundaryPoint[]): number {
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
 * 辺ごとに異なるオフセット距離を適用（Clipper実装）
 */
export function applyVariableOffsetClipper(
  points: BoundaryPoint[],
  segmentOffsets: Map<number, number>
): BoundaryPoint[] {
  logger.offset('Clipper実装: 不等間隔オフセット開始', {
    pointCount: points.length,
    offsets: Array.from(segmentOffsets.entries())
  });
  
  try {
    // Clipperのスケール係数
    const scale = 100000; // 小数点以下5桁の精度
    
    // ClipperLib初期化
    const paths = new ClipperLib.Paths();
    const path = new ClipperLib.Path();
    
    // 座標をClipperフォーマットに変換
    points.forEach(p => {
      path.push({ X: Math.round(p.x * scale), Y: Math.round(p.y * scale) });
    });
    paths.push(path);
    
    // 均一オフセットとして平均値を使用
    const avgOffset = Array.from(segmentOffsets.values())
      .reduce((sum, val) => sum + val, 0) / segmentOffsets.size;
    
    // オフセット実行
    const co = new ClipperLib.ClipperOffset();
    co.AddPaths(paths, ClipperLib.JoinType.jtMiter, ClipperLib.EndType.etClosedPolygon);
    
    const solution = new ClipperLib.Paths();
    co.Execute(solution, -avgOffset * scale);
    
    if (solution.length === 0) {
      logger.error('Clipper: オフセット結果が空');
      return points;
    }
    
    // 結果を元の形式に変換
    const result = solution[0].map((p: any) => ({
      x: p.X / scale,
      y: p.Y / scale
    }));
    
    logger.offset('Clipper実装: オフセット完了', {
      originalArea: calculatePolygonArea(points),
      resultArea: calculatePolygonArea(result)
    });
    
    return result;
  } catch (error) {
    logger.error('Clipper実装エラー', error);
    return points;
  }
}

/**
 * カスタム実装による不等間隔オフセット
 * 各辺を個別にオフセットし、交点を計算
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
    
    // 辺のベクトル
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) continue;
    
    // 法線ベクトル（内側向き、反時計回りの場合は右手側が内側）
    const nx = -dy / length;
    const ny = dx / length;
    
    // オフセットした線分の端点
    const offsetP1 = {
      x: p1.x + nx * offset,
      y: p1.y + ny * offset
    };
    const offsetP2 = {
      x: p2.x + nx * offset,
      y: p2.y + ny * offset
    };
    
    // 線分を延長（交点計算のため）
    const extendLength = 1000; // 十分に長い延長
    const extendedP1 = {
      x: offsetP1.x - dx / length * extendLength,
      y: offsetP1.y - dy / length * extendLength
    };
    const extendedP2 = {
      x: offsetP2.x + dx / length * extendLength,
      y: offsetP2.y + dy / length * extendLength
    };
    
    offsetLines.push({
      geometry: {
        coordinates: [[extendedP1.x, extendedP1.y], [extendedP2.x, extendedP2.y]]
      }
    });
  }
  
  // 隣接する線分の交点を計算
  const resultPoints: BoundaryPoint[] = [];
  for (let i = 0; i < n; i++) {
    const line1 = offsetLines[i];
    const line2 = offsetLines[(i + 1) % n];
    
    const intersection = findLineIntersection(line1, line2);
    if (intersection) {
      resultPoints.push(intersection);
    } else {
      // 交点が見つからない場合は元の点を使用
      logger.offset(`交点が見つかりません: 辺${i}と辺${(i + 1) % n}`, );
      resultPoints.push(points[(i + 1) % n]);
    }
  }
  
  logger.offset('カスタム実装: オフセット完了', {
    originalArea: calculatePolygonArea(points),
    resultArea: calculatePolygonArea(resultPoints)
  });
  
  return resultPoints;
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
    // 平行線
    return null;
  }
  
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  
  const x = x1 + t * (x2 - x1);
  const y = y1 + t * (y2 - y1);
  
  return { x, y };
}

/**
 * デフォルトのオフセット実装
 * カスタム実装を使用（最も柔軟性が高い）
 */
export const applyVariableOffset = applyVariableOffsetCustom;