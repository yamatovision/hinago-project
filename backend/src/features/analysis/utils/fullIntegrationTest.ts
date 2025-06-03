/**
 * Phase 2 完全統合テスト
 * 全テストケースで検証
 */
import { analyzeBoundaries } from './boundaryAnalyzer';
import { generateAdvancedBuildingShape, calculatePolygonArea } from './buildingShapeGenerator';
import { 
  rectangularSite, 
  cornerSite, 
  flagpoleSite, 
  lShapedSite, 
  actual14PointSite 
} from './testBoundaryData';

console.log('=== Phase 2 完全統合テスト ===\n');

// テストケースを配列にまとめる
const testCases = [
  { name: '矩形敷地', data: rectangularSite },
  { name: '角地', data: cornerSite },
  { name: '旗竿地', data: flagpoleSite },
  { name: 'L字型敷地', data: lShapedSite },
  { name: '実測14点ポリゴン', data: actual14PointSite }
];

// 結果サマリー
const results: any[] = [];

testCases.forEach((testCase, index) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`テストケース${index + 1}: ${testCase.name}`);
  console.log('='.repeat(60));
  
  try {
    // 敷地面積計算
    const siteArea = calculatePolygonArea(testCase.data.points);
    console.log(`敷地面積: ${siteArea.toFixed(2)}㎡`);
    
    // Step 1: 境界線分析
    const boundaryAnalysis = analyzeBoundaries(
      testCase.data.points,
      testCase.data.roadWidth || 6.0
    );
    console.log(`道路側: ${boundaryAnalysis.roadSegments.length}辺`);
    
    // Step 2: セットバック距離設定
    const setbackDistances = new Map<number, number>();
    boundaryAnalysis.segments.forEach((segment, idx) => {
      const isRoad = boundaryAnalysis.roadSegments.includes(idx);
      const distance = isRoad ? 4.0 : 0.5;
      setbackDistances.set(idx, distance);
    });
    
    // Step 3: 建物形状生成
    const buildingShape = generateAdvancedBuildingShape(
      testCase.data.points,
      siteArea,
      60,   // 建蔽率60%
      200,  // 容積率200%
      3.0,  // 階高3m
      boundaryAnalysis,
      setbackDistances,
      15    // 最高高さ15m
    );
    
    // 検証
    const buildingCoverageActual = (buildingShape.buildingArea / siteArea) * 100;
    const floorAreaRatioActual = (buildingShape.totalFloorArea / siteArea) * 100;
    
    console.log(`\n結果:`);
    console.log(`- 建築面積: ${buildingShape.buildingArea.toFixed(2)}㎡`);
    console.log(`- 延床面積: ${buildingShape.totalFloorArea.toFixed(2)}㎡`);
    console.log(`- 階数: ${buildingShape.floors.length}階`);
    console.log(`- 建蔽率: ${buildingCoverageActual.toFixed(1)}% (目標≤60%)`);
    console.log(`- 容積率: ${floorAreaRatioActual.toFixed(1)}% (目標≤200%)`);
    
    const buildingCoverageOK = buildingCoverageActual <= 60;
    const floorAreaRatioOK = floorAreaRatioActual <= 200;
    
    console.log(`\n判定:`);
    console.log(`- 建蔽率: ${buildingCoverageOK ? '✅ OK' : '❌ NG'}`);
    console.log(`- 容積率: ${floorAreaRatioOK ? '✅ OK' : '❌ NG'}`);
    
    results.push({
      name: testCase.name,
      siteArea,
      buildingArea: buildingShape.buildingArea,
      totalFloorArea: buildingShape.totalFloorArea,
      floors: buildingShape.floors.length,
      buildingCoverage: buildingCoverageActual,
      floorAreaRatio: floorAreaRatioActual,
      buildingCoverageOK,
      floorAreaRatioOK,
      success: buildingCoverageOK && floorAreaRatioOK
    });
    
  } catch (error) {
    console.error('❌ エラー発生:', error);
    results.push({
      name: testCase.name,
      success: false,
      error: error
    });
  }
});

// 結果サマリー
console.log('\n' + '='.repeat(60));
console.log('テスト結果サマリー');
console.log('='.repeat(60));

let allSuccess = true;
results.forEach((result, index) => {
  console.log(`\n${index + 1}. ${result.name}: ${result.success ? '✅ 成功' : '❌ 失敗'}`);
  if (result.success) {
    console.log(`   建蔽率: ${result.buildingCoverage.toFixed(1)}% ≤ 60%`);
    console.log(`   容積率: ${result.floorAreaRatio.toFixed(1)}% ≤ 200%`);
  } else if (result.error) {
    console.log(`   エラー: ${result.error}`);
  } else {
    if (!result.buildingCoverageOK) {
      console.log(`   建蔽率: ${result.buildingCoverage.toFixed(1)}% > 60% ❌`);
    }
    if (!result.floorAreaRatioOK) {
      console.log(`   容積率: ${result.floorAreaRatio.toFixed(1)}% > 200% ❌`);
    }
  }
  if (!result.success) allSuccess = false;
});

console.log('\n' + '='.repeat(60));
console.log(`総合結果: ${allSuccess ? '✅ 全テスト成功！' : '❌ 一部テスト失敗'}`);
console.log('='.repeat(60));

console.log('\n=== テスト完了 ===');