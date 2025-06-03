/**
 * 境界線分析ユーティリティ（Phase 2）
 * 敷地境界線の種別（道路/隣地）を判定し、適切なセットバック距離を決定
 */
import { BoundaryPoint } from '../../../types';

/**
 * ロガー設定
 */
const logger = {
  boundary: (msg: string, data?: any) => {
    console.log(`[BOUNDARY] ${msg}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (msg: string, error?: any) => {
    console.error(`[BOUNDARY-ERROR] ${msg}`, error);
  }
};

/**
 * 境界線セグメント情報
 */
export interface BoundarySegment {
  startPoint: BoundaryPoint;      // 開始点
  endPoint: BoundaryPoint;        // 終了点
  length: number;                 // 辺の長さ（m）
  angle: number;                  // 北を0度とした方位角（度）
  midPoint: BoundaryPoint;        // 中点
  type?: 'road' | 'neighbor' | 'unknown';  // 境界線種別
}

/**
 * 境界線分析結果
 */
export interface BoundaryAnalysisResult {
  segments: BoundarySegment[];    // 全セグメント情報
  roadSegments: number[];         // 道路に面している辺のインデックス
  neighborSegments: number[];     // 隣地に面している辺のインデックス
  roadConfiguration?: RoadConfiguration;  // 道路構成情報
}

/**
 * 道路構成情報
 */
export interface RoadConfiguration {
  type: 'single' | 'corner' | 'three_sides' | 'flagpole';
  primaryRoadSide?: number;       // 主要道路の辺インデックス
  secondaryRoadSides?: number[];  // 副道路の辺インデックス
}

/**
 * 境界線検出方法
 */
export enum BoundaryDetectionMethod {
  LENGTH_BASED = 'length_based',      // 最長辺を道路と推定
  MANUAL_OVERRIDE = 'manual_override', // 手動設定
  GIS_INTEGRATION = 'gis_integration'  // GISデータ連携（将来）
}

/**
 * 2点間の距離を計算
 */
function calculateDistance(p1: BoundaryPoint, p2: BoundaryPoint): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 2点間の方位角を計算（北を0度として時計回り）
 */
function calculateAngle(p1: BoundaryPoint, p2: BoundaryPoint): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  // Math.atan2は東を0として反時計回りなので、北を0として時計回りに変換
  let angle = (450 - (Math.atan2(dy, dx) * 180 / Math.PI)) % 360;
  return angle < 0 ? angle + 360 : angle;
}

/**
 * 2点の中点を計算
 */
function calculateMidPoint(p1: BoundaryPoint, p2: BoundaryPoint): BoundaryPoint {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2
  };
}

/**
 * 各辺のセグメント情報を計算
 */
function calculateSegments(points: BoundaryPoint[]): BoundarySegment[] {
  const segments: BoundarySegment[] = [];
  const n = points.length;
  
  for (let i = 0; i < n; i++) {
    const startPoint = points[i];
    const endPoint = points[(i + 1) % n];
    const length = calculateDistance(startPoint, endPoint);
    const angle = calculateAngle(startPoint, endPoint);
    const midPoint = calculateMidPoint(startPoint, endPoint);
    
    segments.push({
      startPoint,
      endPoint,
      length,
      angle,
      midPoint,
      type: 'unknown'
    });
  }
  
  return segments;
}

/**
 * 最長辺法による道路側の判定
 */
function detectRoadSegmentsByLength(
  segments: BoundarySegment[],
  roadWidth?: number
): number[] {
  logger.boundary('最長辺法による道路判定開始', { segmentCount: segments.length });
  
  // 辺を長さ順にソート
  const sortedIndices = segments
    .map((seg, idx) => ({ idx, length: seg.length }))
    .sort((a, b) => b.length - a.length)
    .map(item => item.idx);
  
  // 最長辺を道路側と推定
  const roadSegments = [sortedIndices[0]];
  const longestLength = segments[sortedIndices[0]].length;
  
  // 角地の可能性を考慮（2番目に長い辺が最長辺の70%以上の場合）
  if (sortedIndices.length > 1) {
    const secondLength = segments[sortedIndices[1]].length;
    if (secondLength >= longestLength * 0.7) {
      // 隣接しているか確認
      const idx1 = sortedIndices[0];
      const idx2 = sortedIndices[1];
      const n = segments.length;
      
      if (idx2 === (idx1 + 1) % n || idx1 === (idx2 + 1) % n) {
        roadSegments.push(sortedIndices[1]);
        logger.boundary('角地と判定', { 
          primaryRoad: idx1, 
          secondaryRoad: idx2 
        });
      }
    }
  }
  
  logger.boundary('道路側判定完了', { roadSegments });
  return roadSegments;
}

/**
 * 道路構成を分析
 */
function analyzeRoadConfiguration(
  segments: BoundarySegment[],
  roadIndices: number[]
): RoadConfiguration {
  const roadCount = roadIndices.length;
  
  if (roadCount === 0) {
    return { type: 'single' };
  } else if (roadCount === 1) {
    return { 
      type: 'single',
      primaryRoadSide: roadIndices[0]
    };
  } else if (roadCount === 2) {
    // 隣接確認
    const n = segments.length;
    const isAdjacent = roadIndices.some((idx1, i) => 
      roadIndices.some((idx2, j) => 
        i !== j && (idx2 === (idx1 + 1) % n || idx1 === (idx2 + 1) % n)
      )
    );
    
    if (isAdjacent) {
      return {
        type: 'corner',
        primaryRoadSide: roadIndices[0],
        secondaryRoadSides: roadIndices.slice(1)
      };
    }
  } else if (roadCount >= 3) {
    return {
      type: 'three_sides',
      primaryRoadSide: roadIndices[0],
      secondaryRoadSides: roadIndices.slice(1)
    };
  }
  
  // 旗竿地の判定（狭い接道部分）
  const narrowRoads = roadIndices.filter(idx => segments[idx].length < 4.0);
  if (narrowRoads.length > 0) {
    return {
      type: 'flagpole',
      primaryRoadSide: narrowRoads[0]
    };
  }
  
  return { type: 'single' };
}

/**
 * 境界線を分析して種別を判定
 */
export function analyzeBoundaries(
  points: BoundaryPoint[],
  roadWidth?: number,
  roadDirection?: number,
  method: BoundaryDetectionMethod = BoundaryDetectionMethod.LENGTH_BASED
): BoundaryAnalysisResult {
  logger.boundary('境界線分析開始', { 
    pointCount: points.length, 
    roadWidth, 
    roadDirection,
    method
  });
  
  try {
    // 入力検証
    if (!points || points.length < 3) {
      throw new Error('有効な敷地形状データがありません（3点以上必要）');
    }
    
    // 1. 各辺の情報を計算
    const segments = calculateSegments(points);
    logger.boundary('セグメント計算完了', { 
      segmentCount: segments.length,
      totalLength: segments.reduce((sum, seg) => sum + seg.length, 0).toFixed(2)
    });
    
    // 2. 道路側の判定（現在は最長辺法のみ実装）
    let roadSegments: number[] = [];
    
    switch (method) {
      case BoundaryDetectionMethod.LENGTH_BASED:
        roadSegments = detectRoadSegmentsByLength(segments, roadWidth);
        break;
      case BoundaryDetectionMethod.MANUAL_OVERRIDE:
        // TODO: 手動設定の実装
        logger.boundary('手動設定モードは未実装');
        roadSegments = detectRoadSegmentsByLength(segments, roadWidth);
        break;
      case BoundaryDetectionMethod.GIS_INTEGRATION:
        // TODO: GIS連携の実装
        logger.boundary('GIS連携モードは未実装');
        roadSegments = detectRoadSegmentsByLength(segments, roadWidth);
        break;
    }
    
    // 3. 隣地側の判定（道路側以外）
    const neighborSegments = segments
      .map((_, idx) => idx)
      .filter(idx => !roadSegments.includes(idx));
    
    // 4. セグメントに種別を設定
    segments.forEach((seg, idx) => {
      if (roadSegments.includes(idx)) {
        seg.type = 'road';
      } else {
        seg.type = 'neighbor';
      }
    });
    
    // 5. 道路構成を分析
    const roadConfiguration = analyzeRoadConfiguration(segments, roadSegments);
    
    logger.boundary('境界線分析完了', { 
      roadCount: roadSegments.length,
      neighborCount: neighborSegments.length,
      roadConfiguration
    });
    
    return {
      segments,
      roadSegments,
      neighborSegments,
      roadConfiguration
    };
  } catch (error) {
    logger.error('境界線分析エラー', error);
    throw error;
  }
}

/**
 * 境界線種別に基づいてセットバック距離を決定
 */
export function determineSetbackDistances(
  analysisResult: BoundaryAnalysisResult,
  options?: {
    roadSetback?: number;      // 道路側セットバック（デフォルト: 4m）
    neighborSetback?: number;  // 隣地側セットバック（デフォルト: 0.5m）
    useMinimumRoadCenter?: boolean;  // 道路中心後退を使用するか
  }
): Map<number, number> {
  const roadSetback = options?.roadSetback ?? 4.0;
  const neighborSetback = options?.neighborSetback ?? 0.5;
  const setbackMap = new Map<number, number>();
  
  analysisResult.segments.forEach((segment, idx) => {
    if (segment.type === 'road') {
      setbackMap.set(idx, roadSetback);
    } else {
      setbackMap.set(idx, neighborSetback);
    }
  });
  
  logger.boundary('セットバック距離決定', {
    roadSetback,
    neighborSetback,
    setbackDistances: Array.from(setbackMap.entries())
  });
  
  return setbackMap;
}