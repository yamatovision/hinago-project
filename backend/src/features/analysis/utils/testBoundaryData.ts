/**
 * Phase 2 境界線判定テスト用データセット
 */
import { BoundaryPoint } from '../../../types';

export interface TestCase {
  name: string;
  description: string;
  points: BoundaryPoint[];
  expectedRoadSides: number[];      // 期待される道路側の辺
  expectedConfiguration: string;     // 期待される道路構成
  roadWidth?: number;
}

/**
 * テストケース1: 単純な矩形敷地（南側道路）
 * 南側（辺0）が最も長く、道路に面している
 */
export const rectangularSite: TestCase = {
  name: '矩形敷地（南側道路）',
  description: '20m x 15mの矩形で南側が道路に面している標準的なケース',
  points: [
    { x: 0, y: 0 },      // 南西角
    { x: 20, y: 0 },     // 南東角（辺0: 20m）
    { x: 20, y: 15 },    // 北東角（辺1: 15m）
    { x: 0, y: 15 }      // 北西角（辺2: 20m）
  ],
  expectedRoadSides: [0],
  expectedConfiguration: 'single',
  roadWidth: 6.0
};

/**
 * テストケース2: 角地
 * 南側と東側が道路に面している
 */
export const cornerSite: TestCase = {
  name: '角地（南東角）',
  description: '南側と東側が道路に面している角地',
  points: [
    { x: 0, y: 0 },      // 南西角
    { x: 18, y: 0 },     // 南東角（辺0: 18m）
    { x: 18, y: 16 },    // 北東角（辺1: 16m）
    { x: 0, y: 16 }      // 北西角（辺2: 18m）
  ],
  expectedRoadSides: [0, 1],
  expectedConfiguration: 'corner',
  roadWidth: 6.0
};

/**
 * テストケース3: 旗竿地
 * 狭い接道部分と奥の広い敷地
 */
export const flagpoleSite: TestCase = {
  name: '旗竿地',
  description: '接道部分が狭く、奥に広がる旗竿地',
  points: [
    { x: 0, y: 0 },      // 接道部南西
    { x: 3, y: 0 },      // 接道部南東（辺0: 3m - 狭い接道）
    { x: 3, y: 10 },     // 通路東側
    { x: 15, y: 10 },    // 奥地南東
    { x: 15, y: 25 },    // 奥地北東
    { x: 0, y: 25 },     // 奥地北西
    { x: 0, y: 10 },     // 通路西側
  ],
  expectedRoadSides: [0],
  expectedConfiguration: 'flagpole',
  roadWidth: 4.0
};

/**
 * テストケース4: L字型敷地
 * 複雑な形状での境界判定
 */
export const lShapedSite: TestCase = {
  name: 'L字型敷地',
  description: 'L字型の不整形地',
  points: [
    { x: 0, y: 0 },      // 南西角
    { x: 20, y: 0 },     // 南東角（辺0: 20m - 最長）
    { x: 20, y: 10 },    // 東側中間点
    { x: 10, y: 10 },    // 内側角
    { x: 10, y: 20 },    // 北側中間点
    { x: 0, y: 20 }      // 北西角
  ],
  expectedRoadSides: [0],
  expectedConfiguration: 'single',
  roadWidth: 8.0
};

/**
 * テストケース5: 実際の14点ポリゴン（引き継ぎ書より）
 * 測量図から抽出された実際のデータ
 */
export const actual14PointSite: TestCase = {
  name: '実測14点ポリゴン',
  description: '測量図から抽出された実際の敷地形状',
  points: [
    { x: 0, y: 0 },           // KK1を原点に正規化
    { x: 22.729, y: 0 },      // KK2
    { x: 40.979, y: 31.250 }, // KK3
    { x: 48.229, y: 44.750 }, // KK4
    { x: 64.979, y: 60.750 }, // KK5
    { x: 80.229, y: 75.000 }, // KK6
    { x: 95.479, y: 89.750 }, // KK7
    { x: 81.979, y: 103.250 },// KK8
    { x: 63.729, y: 84.500 }, // KK9
    { x: 47.729, y: 68.500 }, // KK10
    { x: 32.479, y: 53.750 }, // KK11
    { x: 16.979, y: 38.250 }, // KK12
    { x: 5.479, y: 26.750 },  // KK13
    { x: -8.021, y: 13.250 }  // KK14
  ],
  expectedRoadSides: [0, 1],  // 最も長い2辺が道路側と推定
  expectedConfiguration: 'corner',
  roadWidth: 6.0
};

/**
 * 全テストケースのリスト
 */
export const allTestCases: TestCase[] = [
  rectangularSite,
  cornerSite,
  flagpoleSite,
  lShapedSite,
  actual14PointSite
];

/**
 * テストケースを実行して結果を検証
 */
export function validateTestCase(
  testCase: TestCase,
  actualRoadSides: number[],
  actualConfiguration: string
): { 
  passed: boolean; 
  message: string;
  details: {
    expectedRoadSides: number[];
    actualRoadSides: number[];
    expectedConfiguration: string;
    actualConfiguration: string;
  }
} {
  const roadSidesMatch = 
    testCase.expectedRoadSides.length === actualRoadSides.length &&
    testCase.expectedRoadSides.every(side => actualRoadSides.includes(side));
  
  const configurationMatch = testCase.expectedConfiguration === actualConfiguration;
  
  const passed = roadSidesMatch && configurationMatch;
  
  return {
    passed,
    message: passed 
      ? `✅ ${testCase.name}: テスト成功`
      : `❌ ${testCase.name}: テスト失敗`,
    details: {
      expectedRoadSides: testCase.expectedRoadSides,
      actualRoadSides,
      expectedConfiguration: testCase.expectedConfiguration,
      actualConfiguration
    }
  };
}