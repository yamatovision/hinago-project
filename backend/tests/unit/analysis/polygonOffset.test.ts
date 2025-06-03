/**
 * 不等間隔ポリゴンオフセットのテスト
 */
import { 
  applyVariableOffsetCustom,
  applyVariableOffsetTurf,
  applyVariableOffsetClipper
} from '../../../src/features/analysis/utils/polygonOffset';
import { BoundaryPoint } from '../../../src/types';

describe('PolygonOffset', () => {
  // テスト用の矩形ポリゴン
  const rectanglePoints: BoundaryPoint[] = [
    { x: 0, y: 0 },
    { x: 20, y: 0 },
    { x: 20, y: 15 },
    { x: 0, y: 15 }
  ];
  
  // 均等オフセット（全辺2m）
  const uniformOffsets = new Map<number, number>([
    [0, 2], // 南側
    [1, 2], // 東側
    [2, 2], // 北側
    [3, 2]  // 西側
  ]);
  
  // 不等間隔オフセット（道路側4m、隣地側0.5m）
  const variableOffsets = new Map<number, number>([
    [0, 4.0], // 南側（道路）
    [1, 0.5], // 東側（隣地）
    [2, 0.5], // 北側（隣地）
    [3, 0.5]  // 西側（隣地）
  ]);
  
  describe('カスタム実装', () => {
    it('均等オフセットを適用できる', () => {
      const result = applyVariableOffsetCustom(rectanglePoints, uniformOffsets);
      
      expect(result).toHaveLength(4);
      
      // 各点が内側に移動していることを確認
      expect(result[0].x).toBeGreaterThan(rectanglePoints[0].x);
      expect(result[0].y).toBeGreaterThan(rectanglePoints[0].y);
      expect(result[1].x).toBeLessThan(rectanglePoints[1].x);
      expect(result[1].y).toBeGreaterThan(rectanglePoints[1].y);
    });
    
    it('不等間隔オフセットを適用できる', () => {
      const result = applyVariableOffsetCustom(rectanglePoints, variableOffsets);
      
      expect(result).toHaveLength(4);
      
      // 南側（道路側）は大きくオフセット
      const southOffset = result[0].y - rectanglePoints[0].y;
      expect(southOffset).toBeCloseTo(4.0, 0);
      
      // 東側（隣地側）は小さくオフセット
      const eastOffset = rectanglePoints[1].x - result[1].x;
      expect(eastOffset).toBeCloseTo(0.5, 0);
    });
  });
  
  describe('Turf.js実装', () => {
    it('均等オフセットを適用できる', () => {
      const result = applyVariableOffsetTurf(rectanglePoints, uniformOffsets);
      
      expect(result.length).toBeGreaterThan(0);
      
      // 面積が減少していることを確認
      const originalArea = calculatePolygonArea(rectanglePoints);
      const resultArea = calculatePolygonArea(result);
      expect(resultArea).toBeLessThan(originalArea);
    });
  });
  
  describe('Clipper実装', () => {
    it('均等オフセットを適用できる', () => {
      const result = applyVariableOffsetClipper(rectanglePoints, uniformOffsets);
      
      expect(result.length).toBeGreaterThan(0);
      
      // 面積が減少していることを確認
      const originalArea = calculatePolygonArea(rectanglePoints);
      const resultArea = calculatePolygonArea(result);
      expect(resultArea).toBeLessThan(originalArea);
    });
  });
  
  describe('エッジケース', () => {
    it('空の入力に対して空の配列を返す', () => {
      const emptyOffsets = new Map<number, number>();
      const result = applyVariableOffsetCustom([], emptyOffsets);
      expect(result).toEqual([]);
    });
    
    it('自己交差が発生する場合でも処理できる', () => {
      // 大きすぎるオフセット
      const largeOffsets = new Map<number, number>([
        [0, 10], // 高さ15mの半分以上
        [1, 10],
        [2, 10],
        [3, 10]
      ]);
      
      const result = applyVariableOffsetCustom(rectanglePoints, largeOffsets);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});

/**
 * ポリゴンの面積を計算（テスト用）
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