/**
 * Phase 2 統合テストスクリプト
 * boundaryAnalyzer + polygonOffset + buildingShapeGeneratorの統合テスト
 */
import { analyzeBoundaries } from './boundaryAnalyzer';
import { generateAdvancedBuildingShape } from './buildingShapeGenerator';
import { 
  rectangularSite, 
  cornerSite, 
  flagpoleSite, 
  lShapedSite, 
  actual14PointSite 
} from './testBoundaryData';

// ログ出力を有効化
console.log('=== Phase 2 統合テスト開始 ===\n');

// テストケースを配列にまとめる
const testCases = [
  rectangularSite,
  cornerSite,
  flagpoleSite,
  lShapedSite,
  actual14PointSite
];

// テストケースごとに実行
testCases.forEach((testCase, index) => {
  console.log(`\n--- テストケース${index + 1}: ${testCase.name} ---`);
  console.log(`敷地形状: ${testCase.points.length}点`);
  console.log(`道路幅: ${testCase.roadWidth || 6.0}m`);
  
  try {
    // Step 1: 境界線分析
    console.log('\n[Step 1] 境界線分析実行中...');
    const boundaryAnalysis = analyzeBoundaries(
      testCase.points,
      testCase.roadWidth || 6.0
    );
    
    console.log(`道路側: ${boundaryAnalysis.roadSegments}辺`);
    console.log(`隣地側: ${boundaryAnalysis.neighborSegments}辺`);
    console.log(`道路構成: ${boundaryAnalysis.roadConfiguration}`);
    
    // Step 2: セットバック距離の設定
    console.log('\n[Step 2] セットバック距離設定中...');
    const setbackDistances = new Map<number, number>();
    
    // 各辺にセットバック距離を設定
    boundaryAnalysis.segments.forEach((segment, idx) => {
      const isRoad = boundaryAnalysis.roadSegments.includes(idx);
      const distance = isRoad ? 4.0 : 0.5; // 道路側4m、隣地側0.5m
      setbackDistances.set(idx, distance);
      console.log(`辺${idx}: ${isRoad ? '道路側' : '隣地側'} - ${distance}m`);
    });
    
    // Step 3: 建物形状生成
    console.log('\n[Step 3] 建物形状生成中...');
    // 敷地面積を計算
    const siteArea = testCase.points.reduce((area, p, i) => {
      const j = (i + 1) % testCase.points.length;
      return area + (p.x * testCase.points[j].y - testCase.points[j].x * p.y);
    }, 0) / 2;
    
    const buildingShape = generateAdvancedBuildingShape(
      testCase.points,
      Math.abs(siteArea),
      60,  // 建蔽率60%
      200, // 容積率200%
      3.0, // 階高3m
      boundaryAnalysis,
      setbackDistances,
      15   // 最高高さ15m
    );
    
    // 結果出力
    console.log('\n[結果]');
    console.log(`建築面積: ${buildingShape.buildingArea.toFixed(2)}㎡`);
    console.log(`延床面積: ${buildingShape.totalFloorArea.toFixed(2)}㎡`);
    console.log(`階数: ${buildingShape.floors.length}階`);
    console.log(`容積効率: ${buildingShape.volumeEfficiency.toFixed(1)}%`);
    
    // 検証
    const buildingCoverageActual = (buildingShape.buildingArea / Math.abs(siteArea)) * 100;
    const floorAreaRatioActual = (buildingShape.totalFloorArea / Math.abs(siteArea)) * 100;
    
    console.log('\n[検証]');
    console.log(`実建蔽率: ${buildingCoverageActual.toFixed(1)}% (目標: ≤60%)`)
    console.log(`実容積率: ${floorAreaRatioActual.toFixed(1)}% (目標: ≤200%)`);
    
    if (buildingCoverageActual <= 60) {
      console.log('✅ 建蔽率OK');
    } else {
      console.log('❌ 建蔽率超過');
    }
    
    if (floorAreaRatioActual <= 200) {
      console.log('✅ 容積率OK');
    } else {
      console.log('❌ 容積率超過');
    }
    
  } catch (error) {
    console.error('❌ エラー発生:', error);
  }
});

console.log('\n=== 統合テスト完了 ===');