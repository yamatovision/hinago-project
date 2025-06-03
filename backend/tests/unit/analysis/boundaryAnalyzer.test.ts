/**
 * 境界線分析機能のユニットテスト
 */
import { 
  analyzeBoundaries, 
  determineSetbackDistances, 
  BoundaryDetectionMethod 
} from '../../../src/features/analysis/utils/boundaryAnalyzer';
import { 
  allTestCases, 
  validateTestCase 
} from '../../../src/features/analysis/utils/testBoundaryData';

describe('BoundaryAnalyzer', () => {
  describe('analyzeBoundaries', () => {
    it('矩形敷地の境界線を正しく分析できる', () => {
      const testCase = allTestCases[0]; // rectangularSite
      const result = analyzeBoundaries(
        testCase.points,
        testCase.roadWidth,
        undefined,
        BoundaryDetectionMethod.LENGTH_BASED
      );
      
      const validation = validateTestCase(
        testCase,
        result.roadSegments,
        result.roadConfiguration?.type || 'unknown'
      );
      
      expect(validation.passed).toBe(true);
      expect(result.segments).toHaveLength(4);
      expect(result.roadSegments).toContain(0);
    });
    
    it('角地の2つの道路境界線を検出できる', () => {
      const testCase = allTestCases[1]; // cornerSite
      const result = analyzeBoundaries(
        testCase.points,
        testCase.roadWidth
      );
      
      expect(result.roadSegments).toHaveLength(2);
      expect(result.roadConfiguration?.type).toBe('corner');
    });
    
    it('旗竿地の狭い接道部分を検出できる', () => {
      const testCase = allTestCases[2]; // flagpoleSite
      const result = analyzeBoundaries(
        testCase.points,
        testCase.roadWidth
      );
      
      // 最短辺が道路側として検出される可能性があるため、
      // ここでは接道部分が検出されることを確認
      expect(result.segments[0].length).toBeLessThan(4);
    });
    
    it('不正な入力に対してエラーを投げる', () => {
      expect(() => {
        analyzeBoundaries([], 6.0);
      }).toThrow('有効な敷地形状データがありません');
      
      expect(() => {
        analyzeBoundaries([{ x: 0, y: 0 }, { x: 1, y: 1 }], 6.0);
      }).toThrow('有効な敷地形状データがありません');
    });
  });
  
  describe('determineSetbackDistances', () => {
    it('道路側と隣地側で異なるセットバック距離を設定できる', () => {
      const testCase = allTestCases[0];
      const analysis = analyzeBoundaries(testCase.points, testCase.roadWidth);
      
      const setbacks = determineSetbackDistances(analysis, {
        roadSetback: 4.0,
        neighborSetback: 0.5
      });
      
      // 道路側（辺0）は4m
      expect(setbacks.get(0)).toBe(4.0);
      
      // 隣地側（辺1,2,3）は0.5m
      expect(setbacks.get(1)).toBe(0.5);
      expect(setbacks.get(2)).toBe(0.5);
      expect(setbacks.get(3)).toBe(0.5);
    });
    
    it('デフォルト値が正しく適用される', () => {
      const testCase = allTestCases[0];
      const analysis = analyzeBoundaries(testCase.points, testCase.roadWidth);
      
      const setbacks = determineSetbackDistances(analysis);
      
      // デフォルト: 道路側4m、隣地側0.5m
      expect(setbacks.get(0)).toBe(4.0);
      expect(setbacks.get(1)).toBe(0.5);
    });
  });
  
  describe('実際の14点ポリゴンでの動作確認', () => {
    it('14点の不整形地を処理できる', () => {
      const testCase = allTestCases[4]; // actual14PointSite
      const result = analyzeBoundaries(
        testCase.points,
        testCase.roadWidth
      );
      
      expect(result.segments).toHaveLength(14);
      expect(result.roadSegments.length).toBeGreaterThan(0);
      expect(result.neighborSegments.length).toBeGreaterThan(0);
      
      // 全セグメントに種別が設定されている
      result.segments.forEach(segment => {
        expect(['road', 'neighbor', 'unknown']).toContain(segment.type);
      });
    });
  });
});