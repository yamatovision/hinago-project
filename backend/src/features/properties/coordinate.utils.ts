/**
 * 座標計算ユーティリティ
 * 測量座標から表示用座標への変換、面積計算などを行う
 */
import { CoordinatePoint, BoundaryPoint } from '../../types';
import { logger } from '../../common/utils';

/**
 * 測量座標から表示用座標への変換
 * @param coordinatePoints 測量座標の配列
 * @returns 表示用座標の配列
 */
export function convertSurveyToDisplay(coordinatePoints: CoordinatePoint[]): BoundaryPoint[] {
  if (coordinatePoints.length === 0) {
    return [];
  }

  // 1. 最小値を求めて原点調整
  const minX = Math.min(...coordinatePoints.map(p => p.x));
  const minY = Math.min(...coordinatePoints.map(p => p.y));
  
  // 2. 最大値も求めてスケール計算
  const maxX = Math.max(...coordinatePoints.map(p => p.x));
  const maxY = Math.max(...coordinatePoints.map(p => p.y));
  
  const width = maxX - minX;
  const height = maxY - minY;
  
  // 3. 100m x 100mの範囲に正規化（適切な表示サイズ）
  const scale = Math.max(width, height) / 100;
  
  // 4. 座標変換（Y軸反転も含む - 測量座標系は上が北）
  const points = coordinatePoints.map(p => ({
    x: (p.x - minX) / scale,
    y: (maxY - p.y) / scale // Y軸反転
  }));
  
  logger.info('座標変換完了', {
    originalBounds: { minX, minY, maxX, maxY },
    scale,
    pointCount: points.length
  });
  
  return points;
}

/**
 * 座標法による面積計算（ガウスの公式）
 * @param points 座標点の配列
 * @returns 面積（平方メートル）
 */
export function calculateArea(points: CoordinatePoint[]): number {
  if (points.length < 3) {
    return 0;
  }
  
  let area = 0;
  const n = points.length;
  
  // ガウスの公式（Shoelace formula）
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  
  return Math.abs(area) / 2;
}

/**
 * 周長（外周）の計算
 * @param points 座標点の配列
 * @returns 周長（メートル）
 */
export function calculatePerimeter(points: CoordinatePoint[]): number {
  if (points.length < 2) {
    return 0;
  }
  
  let perimeter = 0;
  const n = points.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const dx = points[j].x - points[i].x;
    const dy = points[j].y - points[i].y;
    perimeter += Math.sqrt(dx * dx + dy * dy);
  }
  
  return perimeter;
}

/**
 * 座標点が時計回りか反時計回りかを判定
 * @param points 座標点の配列
 * @returns true: 時計回り, false: 反時計回り
 */
export function isClockwise(points: CoordinatePoint[]): boolean {
  let sum = 0;
  const n = points.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    sum += (points[j].x - points[i].x) * (points[j].y + points[i].y);
  }
  
  return sum > 0;
}

/**
 * 座標点を時計回りに並び替える
 * @param points 座標点の配列
 * @returns 時計回りに並び替えた座標点の配列
 */
export function ensureClockwise(points: CoordinatePoint[]): CoordinatePoint[] {
  if (isClockwise(points)) {
    return points;
  }
  return points.slice().reverse();
}

/**
 * 矩形の幅と奥行きを計算（近似）
 * @param points 座標点の配列
 * @returns { width: 幅, depth: 奥行き }
 */
export function calculateDimensions(points: CoordinatePoint[]): { width: number; depth: number } {
  if (points.length < 4) {
    return { width: 0, depth: 0 };
  }
  
  // バウンディングボックスで近似
  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxY = Math.max(...points.map(p => p.y));
  
  return {
    width: maxX - minX,
    depth: maxY - minY
  };
}

/**
 * 座標データの検証
 * @param points 座標点の配列
 * @returns エラーメッセージ（問題がない場合はnull）
 */
export function validateCoordinatePoints(points: CoordinatePoint[]): string | null {
  if (points.length < 3) {
    return '座標点は3点以上必要です';
  }
  
  // 重複点のチェック
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      if (points[i].x === points[j].x && points[i].y === points[j].y) {
        return `重複する座標点があります: ${points[i].id} と ${points[j].id}`;
      }
    }
  }
  
  // 自己交差のチェック（簡易版）
  // TODO: より詳細な自己交差チェックを実装
  
  return null;
}