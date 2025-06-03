/**
 * 境界線分析ユーティリティ（フロントエンド版）
 * Phase 2: 敷地の各辺が道路側か隣地側かを判定
 */
import { BoundaryPoint } from '../../../../../shared';

/**
 * 境界線セグメント情報
 */
export interface BoundarySegment {
  index: number;          // セグメントのインデックス
  startPoint: BoundaryPoint;
  endPoint: BoundaryPoint;
  length: number;         // セグメントの長さ（m）
  angle: number;         // 角度（度）北を0度として時計回り
  midPoint: BoundaryPoint; // 中点
}

/**
 * 境界線分析結果
 */
export interface BoundaryAnalysisResult {
  segments: BoundarySegment[];      // 全セグメント情報
  roadSegments: number[];           // 道路に面しているセグメントのインデックス
  neighborSegments: number[];       // 隣地に面しているセグメントのインデックス
  roadConfiguration: {              // 道路構成
    type: 'single' | 'corner' | 'three_sides' | 'flagpole' | 'unknown';
    primaryRoadSide?: number;       // 主要道路側のセグメントインデックス
    secondaryRoadSide?: number;     // 副道路側（角地の場合）
  };
}

/**
 * ロガー設定（フロントエンド版）
 */
const logger = {
  boundary: (msg: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`[BOUNDARY] ${msg}`, data ? JSON.stringify(data, null, 2) : '');
    }
  },
  error: (msg: string, error?: any) => {
    console.error(`[BOUNDARY-ERROR] ${msg}`, error);
  }
};

/**
 * 2点間の距離を計算
 */
function calculateDistance(p1: BoundaryPoint, p2: BoundaryPoint): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 2点間の角度を計算（北を0度として時計回り）
 */
function calculateAngle(p1: BoundaryPoint, p2: BoundaryPoint): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  // Math.atan2は東を0として反時計回りなので、北を0として時計回りに変換
  let angle = (90 - Math.atan2(dy, dx) * 180 / Math.PI) % 360;
  if (angle < 0) angle += 360;
  return angle;
}

/**
 * セグメント情報を計算
 */
function calculateSegments(points: BoundaryPoint[]): BoundarySegment[] {
  const segments: BoundarySegment[] = [];
  const n = points.length;
  
  for (let i = 0; i < n; i++) {
    const startPoint = points[i];
    const endPoint = points[(i + 1) % n];
    const length = calculateDistance(startPoint, endPoint);
    const angle = calculateAngle(startPoint, endPoint);
    const midPoint = {
      x: (startPoint.x + endPoint.x) / 2,
      y: (startPoint.y + endPoint.y) / 2
    };
    
    segments.push({
      index: i,
      startPoint,
      endPoint,
      length,
      angle,
      midPoint
    });
  }
  
  return segments;
}

/**
 * 最長辺法による道路側判定
 * 基本的に最も長い辺が道路に面していると仮定
 */
function detectRoadSegmentsByLength(segments: BoundarySegment[]): number[] {
  // 長さでソート（降順）
  const sortedSegments = [...segments].sort((a, b) => b.length - a.length);
  
  // 最長辺を道路側とする
  const roadSegments = [sortedSegments[0].index];
  
  // 角地判定：2番目に長い辺が最長辺の70%以上で、隣接している場合
  if (sortedSegments.length > 1) {
    const secondSegment = sortedSegments[1];
    const lengthRatio = secondSegment.length / sortedSegments[0].length;
    
    if (lengthRatio > 0.7) {
      // 隣接チェック
      const firstIdx = sortedSegments[0].index;
      const secondIdx = secondSegment.index;
      const n = segments.length;
      
      if ((firstIdx + 1) % n === secondIdx || (secondIdx + 1) % n === firstIdx) {
        roadSegments.push(secondIdx);
      }
    }
  }
  
  return roadSegments;
}

/**
 * 道路構成を判定
 */
function determineRoadConfiguration(
  segments: BoundarySegment[],
  roadSegments: number[]
): BoundaryAnalysisResult['roadConfiguration'] {
  const roadCount = roadSegments.length;
  
  if (roadCount === 0) {
    return { type: 'unknown' };
  }
  
  if (roadCount === 1) {
    // 旗竿地判定：道路側の辺が極端に短い場合
    const roadSegment = segments[roadSegments[0]];
    const avgLength = segments.reduce((sum, s) => sum + s.length, 0) / segments.length;
    
    if (roadSegment.length < avgLength * 0.3) {
      return { type: 'flagpole', primaryRoadSide: roadSegments[0] };
    }
    
    return { type: 'single', primaryRoadSide: roadSegments[0] };
  }
  
  if (roadCount === 2) {
    // 隣接している場合は角地
    const [idx1, idx2] = roadSegments;
    const n = segments.length;
    
    if ((idx1 + 1) % n === idx2 || (idx2 + 1) % n === idx1) {
      return { 
        type: 'corner', 
        primaryRoadSide: segments[idx1].length >= segments[idx2].length ? idx1 : idx2,
        secondaryRoadSide: segments[idx1].length < segments[idx2].length ? idx1 : idx2
      };
    }
  }
  
  if (roadCount >= 3) {
    return { type: 'three_sides', primaryRoadSide: roadSegments[0] };
  }
  
  return { type: 'unknown', primaryRoadSide: roadSegments[0] };
}

/**
 * 境界線を分析して道路側と隣地側を判定
 * @param points 敷地の境界点（反時計回り）
 * @param roadWidth 前面道路幅（m）
 * @param roadDirection 道路方位（度）- 将来の拡張用
 * @returns 境界線分析結果
 */
export function analyzeBoundaries(
  points: BoundaryPoint[],
  roadWidth: number = 4.0,
  roadDirection?: number
): BoundaryAnalysisResult {
  logger.boundary('境界線分析開始', { 
    pointCount: points.length, 
    roadWidth, 
    roadDirection,
    method: 'length_based'
  });
  
  try {
    // 1. 各セグメントの情報を計算
    const segments = calculateSegments(points);
    logger.boundary('セグメント計算完了', {
      segmentCount: segments.length,
      totalLength: segments.reduce((sum, s) => sum + s.length, 0).toFixed(2)
    });
    
    // 2. 道路側セグメントを判定（現在は最長辺法）
    logger.boundary('最長辺法による道路判定開始', {
      segmentCount: segments.length
    });
    const roadSegments = detectRoadSegmentsByLength(segments);
    logger.boundary('道路側判定完了', {
      roadSegments
    });
    
    // 3. 隣地側セグメントを特定
    const neighborSegments = segments
      .map((_, idx) => idx)
      .filter(idx => !roadSegments.includes(idx));
    
    // 4. 道路構成を判定
    const roadConfiguration = determineRoadConfiguration(segments, roadSegments);
    
    const result: BoundaryAnalysisResult = {
      segments,
      roadSegments,
      neighborSegments,
      roadConfiguration
    };
    
    logger.boundary('境界線分析完了', {
      roadCount: roadSegments.length,
      neighborCount: neighborSegments.length,
      roadConfiguration
    });
    
    return result;
    
  } catch (error) {
    logger.error('境界線分析エラー', error);
    throw error;
  }
}

/**
 * 分析結果の妥当性を検証（テスト用）
 */
export function validateAnalysisResult(
  result: BoundaryAnalysisResult,
  expectedRoadSides: number[]
): boolean {
  const actualRoadSides = result.roadSegments.sort();
  const expected = expectedRoadSides.sort();
  
  if (actualRoadSides.length !== expected.length) {
    return false;
  }
  
  return actualRoadSides.every((side, idx) => side === expected[idx]);
}