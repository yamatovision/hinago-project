# 建築基準法規制計算の精密化実装計画

**作成日**: 2025年5月20日  
**ステータス**: 計画段階  
**担当**: バックエンド開発チーム

## 1. 概要

本計画書は、ボリュームチェック機能における建築基準法規制計算の精密化を実装するための計画を記述したものです。現在の簡略化された計算モデルをより現実的かつ精密なものに拡張し、福岡市の建築基準法規制を正確に反映させることを目的としています。

## 2. 対応するAPIエンドポイント

### 2.1 メイン対象エンドポイント

| メソッド | エンドポイント | 概要 | 認証レベル |
|---------|--------------|------|----------|
| POST | `/api/v1/analysis/volume-check` | 建築可能ボリュームの計算実行 | 認証必須 |

この実装では、既存のボリュームチェックAPIを拡張して、より詳細な建築基準法規制計算を行います。APIのリクエスト・レスポンス構造を変更せず、内部計算ロジックを強化することで、後方互換性を維持しつつ計算精度を向上させます。

## 3. データモデル拡張

### 3.1 shared/index.ts への追加

以下の型定義を `shared/index.ts` に追加します（後方互換性を維持するため、すべて任意プロパティとして追加）：

```typescript
// 高度地区の列挙型（追加）
export enum HeightDistrictType {
  FIRST_10M = 'first10m',   // 第一種10M高度地区
  FIRST_15M = 'first15m',   // 第一種15M高度地区
  SECOND_15M = 'second15m', // 第二種15M高度地区
  SECOND_20M = 'second20m', // 第二種20M高度地区
  NONE = 'none',           // 指定なし
}

// 地区計画情報（追加）
export interface DistrictPlanInfo {
  name: string;                   // 地区計画名
  wallSetbackDistance?: number;   // 壁面後退距離
  maxHeight?: number;             // 最高高さ制限
  specialRegulations?: string[];  // 特別な規制事項
}

// 日影規制詳細情報（追加）
export interface ShadowRegulationDetail {
  measurementHeight: number;  // 測定面の高さ
  hourRanges: {
    primary: number;          // 4時間/5時間
    secondary: number;        // 2.5時間/3時間
  };
}

// 日影シミュレーション結果（追加）
export interface ShadowSimulationResult {
  isochroneMap?: any;       // 日影等時間線マップ
  maxHours: number;         // 最大日影時間
  mediumHours: number;      // 中間部分の日影時間
  compliant: boolean;       // 適合判定
}

// 高さ制限の詳細情報（追加）
export interface RegulationLimits {
  heightDistrictLimit: number;  // 高度地区による制限
  slopeLimit: number;           // 斜線制限による制限
  shadowLimit: number;          // 日影規制による制限
  absoluteLimit: number;        // 絶対高さ制限
  finalLimit: number;           // 最終的な制限値（最小値）
}

// 物件基本情報への拡張
export interface PropertyBase {
  // ... 既存のフィールド ...
  
  // 新規追加フィールド（すべて任意）
  heightDistrict?: HeightDistrictType;   // 高度地区
  northBoundaryDistance?: number;        // 北側敷地境界線までの距離
  districtPlanInfo?: DistrictPlanInfo;   // 地区計画情報
  shadowRegulationDetail?: ShadowRegulationDetail; // 日影規制詳細
}

// ボリュームチェックへの拡張
export interface VolumeCheck extends Timestamps {
  // ... 既存のフィールド ...
  
  // 新規追加フィールド（すべて任意）
  shadowSimulation?: ShadowSimulationResult; // 日影シミュレーション結果
  regulationLimits?: RegulationLimits;       // 高さ制限の詳細情報
}

// バリデーションルールへの追加
export const VALIDATION_RULES = {
  // ... 既存のルール ...
  
  // 新規追加のバリデーションルール
  ADVANCED_PROPERTY: {
    // ... 既存のPROPERTYルール ...
    heightDistrict: { required: false },
    northBoundaryDistance: { required: false, min: 0 },
    'districtPlanInfo.wallSetbackDistance': { required: false, min: 0 },
    'districtPlanInfo.maxHeight': { required: false, min: 0 },
  },
};
```

### 3.2 backend/src/types/index.ts への反映

`backend/src/types/index.ts` に `shared/index.ts` で追加された型定義を同様にコピーします。

## 4. ディレクトリ構造と実装ファイル

### 4.1 既存のファイル更新

```
backend/
└── src/
    ├── features/
    │   └── analysis/
    │       ├── analysis.controller.ts  # 一部更新
    │       ├── analysis.service.ts     # 一部更新
    │       ├── analysis.utils.ts       # 大幅更新
    │       └── analysis.validator.ts   # 一部更新
    ├── db/
    │   └── models/
    │       ├── Property.ts             # 一部更新
    │       ├── VolumeCheck.ts          # 一部更新
    │       └── schemas/
    │           ├── property.schema.ts  # 一部更新
    │           └── volumeCheck.schema.ts # 一部更新
    └── types/
        └── index.ts                   # 型定義追加
```

### 4.2 新規追加ファイル

```
backend/
└── src/
    └── features/
        └── analysis/
            └── regulation/
                ├── index.ts               # 拡張機能のエクスポート
                ├── heightDistrict.ts      # 高度地区計算
                ├── slopeRegulation.ts     # 斜線制限計算
                ├── shadowRegulation.ts    # 日影規制計算
                ├── districtPlan.ts        # 地区計画対応
                ├── sunPosition.ts         # 太陽位置計算
                └── shadowSimulation.ts    # 日影シミュレーション
```

### 4.3 フロントエンド更新ファイル

```
frontend/
└── src/
    └── features/
        ├── properties/
        │   ├── components/
        │   │   └── PropertyForm/
        │   │       ├── PropertyForm.tsx        # 一部更新
        │   │       └── AdvancedRegulationForm.tsx  # 新規作成
        │   └── api/
        │       └── properties.ts           # 一部更新
        └── analysis/
            ├── components/
            │   ├── VolumeCheckForm.tsx     # 一部更新
            │   ├── VolumeCheckResult.tsx   # 一部更新
            │   └── RegulationDetailPanel.tsx  # 新規作成
            └── api/
                └── volumeCheck.ts          # 一部更新
```

## 5. 実装難易度の評価

### 全体的な難易度
- **難易度**: 中～高
- **工数の目安**: 約3～5人週（開発者1人の場合）

### 領域別の難易度

1. **高度地区・斜線制限の計算拡張**:
   - **難易度**: 中
   - **工数**: 約1人週
   - **理由**: 計算式自体は明確で、数学的な処理が中心。既存コードベースへの統合も比較的容易。

2. **日影規制シミュレーション**:
   - **難易度**: 高
   - **工数**: 約2人週
   - **理由**: 太陽位置の計算、建物形状に基づく影の投影計算など、複雑なアルゴリズムが必要。3Dモデルとの連携も考慮する必要がある。

3. **地区計画など特別規制の対応**:
   - **難易度**: 中～低
   - **工数**: 約0.5人週
   - **理由**: データモデルの拡張が主で、計算ロジックとしては比較的単純。

4. **ユーザーインターフェース拡張**:
   - **難易度**: 中
   - **工数**: 約1人週
   - **理由**: 追加入力項目のUIデザイン、バリデーション、ヘルプテキストなどの整備が必要。

5. **テストとバグ修正**:
   - **難易度**: 中
   - **工数**: 約0.5～1人週
   - **理由**: 計算結果の正確性検証には専門知識が必要。複数の条件パターンでのテストが必要。

## 6. 実装する計算機能

### 6.1 高度地区・斜線制限の計算精密化

```typescript
/**
 * 高度地区による高さ制限の計算
 * @param property 物件データ
 * @returns 高さ制限（m）
 */
function calculateHeightDistrictLimit(property: Property): number {
  if (!property.heightDistrict || property.heightDistrict === HeightDistrictType.NONE) {
    return Infinity; // 制限なし
  }
  
  switch (property.heightDistrict) {
    case HeightDistrictType.FIRST_10M:
      return 10;
    case HeightDistrictType.FIRST_15M:
      return 15;
    case HeightDistrictType.SECOND_15M:
      // 第二種は北側斜線あり
      if (property.northBoundaryDistance) {
        // 5m + 距離×1.25の計算（勾配1:1.25）
        const northSlope = 5 + (property.northBoundaryDistance * 1.25);
        return Math.min(15, northSlope);
      }
      return 15;
    case HeightDistrictType.SECOND_20M:
      // 第二種は北側斜線あり
      if (property.northBoundaryDistance) {
        // 5m + 距離×1.25の計算（勾配1:1.25）
        const northSlope = 5 + (property.northBoundaryDistance * 1.25);
        return Math.min(20, northSlope);
      }
      return 20;
    default:
      return Infinity;
  }
}

/**
 * 斜線制限による高さ制限の計算（詳細版）
 * @param property 物件データ
 * @returns 高さ制限（m）
 */
function calculateDetailedSlopeLimit(property: Property): number {
  // 道路斜線
  const roadSlopeLimit = calculateRoadSlopeLimit(property);
  
  // 隣地斜線
  const adjacentSlopeLimit = calculateAdjacentSlopeLimit(property);
  
  // 北側斜線（住居系用途地域の場合）
  const northSlopeLimit = isResidentialZone(property.zoneType) 
    ? calculateNorthSlopeLimit(property)
    : Infinity;
  
  // 最も厳しい制限を採用
  return Math.min(roadSlopeLimit, adjacentSlopeLimit, northSlopeLimit);
}

/**
 * 道路斜線制限の計算
 */
function calculateRoadSlopeLimit(property: Property): number {
  const roadWidth = property.roadWidth || 4; // デフォルト4m
  let slope = 1.5; // デフォルト勾配
  
  // 用途地域に応じた勾配の調整
  switch (property.zoneType) {
    case ZoneType.CATEGORY9: // 商業地域
      slope = 2.0;
      break;
    case ZoneType.CATEGORY8: // 近隣商業地域
      slope = 1.75;
      break;
    case ZoneType.CATEGORY1: // 第一種低層住居専用地域
    case ZoneType.CATEGORY2: // 第二種低層住居専用地域
      slope = 1.25;
      break;
    default:
      slope = 1.5;
  }
  
  // セットバックを考慮
  const setback = Math.max(0, 4 - roadWidth) / 2;
  
  // 道路斜線制限 = (道路幅員 + セットバック) × 勾配
  return (roadWidth + setback) * slope;
}

/**
 * 隣地斜線制限の計算
 */
function calculateAdjacentSlopeLimit(property: Property): number {
  // 高さの基準値（用途地域により異なる）
  let baseHeight = 20; // デフォルト
  let slope = 1.25; // デフォルト勾配
  
  // 用途地域に応じた基準値と勾配の調整
  switch (property.zoneType) {
    case ZoneType.CATEGORY9: // 商業地域
      baseHeight = 31;
      slope = 2.5;
      break;
    case ZoneType.CATEGORY8: // 近隣商業地域
      baseHeight = 31;
      slope = 2.5;
      break;
    case ZoneType.CATEGORY1: // 第一種低層住居専用地域
    case ZoneType.CATEGORY2: // 第二種低層住居専用地域
      baseHeight = 20;
      slope = 1.25;
      break;
    default:
      baseHeight = 20;
      slope = 1.25;
  }
  
  // 仮定値：隣地境界線からの距離を10mとする
  // 実際の計算では敷地形状から最短距離を計算するロジックが必要
  const distanceToAdjacentBoundary = 10;
  
  // 隣地斜線制限 = 基準高さ + 隣地境界線からの距離 × 勾配
  return baseHeight + (distanceToAdjacentBoundary * slope);
}

/**
 * 北側斜線制限の計算
 */
function calculateNorthSlopeLimit(property: Property): number {
  // 北側斜線は低層住居専用地域と中高層住居専用地域で適用
  if (![
    ZoneType.CATEGORY1, ZoneType.CATEGORY2, // 低層住居専用地域
    ZoneType.CATEGORY3, ZoneType.CATEGORY4  // 中高層住居専用地域
  ].includes(property.zoneType)) {
    return Infinity; // 適用外
  }
  
  // 北側敷地境界線までの距離（デフォルト値）
  const distanceToNorth = property.northBoundaryDistance || 10;
  
  // 高さの基準値と勾配（用途地域により異なる）
  let baseHeight = 5; // デフォルト
  let slope = 1.25;   // デフォルト勾配
  
  if (property.zoneType === ZoneType.CATEGORY3 || property.zoneType === ZoneType.CATEGORY4) {
    // 中高層住居専用地域
    baseHeight = 10;
    slope = 1.25;
  }
  
  // 北側斜線制限 = 基準高さ + 北側境界線からの距離 × 勾配
  return baseHeight + (distanceToNorth * slope);
}
```

### 6.2 日影規制シミュレーション

```typescript
/**
 * 日影規制に基づく高さ制限の計算
 * @param property 物件データ
 * @param buildingParams 建築パラメータ
 * @returns 日影規制に適合する最大高さ（m）
 */
function calculateShadowRegulationHeight(
  property: Property,
  buildingParams: BuildingParams
): number {
  // 日影規制がない場合は制限なし
  if (!property.shadowRegulation || property.shadowRegulation === ShadowRegulationType.NONE) {
    return Infinity;
  }
  
  // 日影規制の詳細情報を取得
  const shadowRegDetail = getShadowRegulationDetail(property.shadowRegulation, property.zoneType);
  
  // 二分探索で日影規制を満たす最大高さを求める
  let minHeight = 0;
  let maxHeight = 100; // 十分大きな値
  let currentHeight;
  let iterations = 0;
  const maxIterations = 10; // 収束の保証
  
  while (iterations < maxIterations && (maxHeight - minHeight) > 0.1) {
    currentHeight = (minHeight + maxHeight) / 2;
    
    // この高さで日影規制を満たすか検証
    const compliant = simulateShadowAndCheckCompliance(
      property,
      { ...buildingParams, height: currentHeight },
      shadowRegDetail
    );
    
    if (compliant) {
      // 適合する場合は高さを上げてみる
      minHeight = currentHeight;
    } else {
      // 適合しない場合は高さを下げる
      maxHeight = currentHeight;
    }
    
    iterations++;
  }
  
  // 安全マージンを設けて返す
  return minHeight * 0.99;
}

/**
 * 指定高さでの日影シミュレーションと適合性チェック
 * @param property 物件データ
 * @param buildingParams 建築パラメータ（高さ情報を含む）
 * @param shadowRegDetail 日影規制詳細
 * @returns 適合判定
 */
function simulateShadowAndCheckCompliance(
  property: Property,
  buildingParams: BuildingParams & { height: number },
  shadowRegDetail: ShadowRegulationDetail
): boolean {
  // 敷地形状から建物形状を生成
  const buildingShape = generateBuildingShape(property, buildingParams);
  
  // 冬至日の日影をシミュレーション（8:00〜16:00の間で1時間ごと）
  const date = new Date(new Date().getFullYear(), 11, 22); // 冬至日
  const shadowHours = calculateShadowHours(
    property,
    buildingShape,
    shadowRegDetail.measurementHeight,
    date
  );
  
  // 規制時間と比較して適合判定
  return (
    shadowHours.maxHours <= shadowRegDetail.hourRanges.primary &&
    shadowHours.mediumHours <= shadowRegDetail.hourRanges.secondary
  );
}

/**
 * 冬至日の日影時間を計算
 */
function calculateShadowHours(
  property: Property,
  buildingShape: any,
  measurementHeight: number,
  date: Date
): { maxHours: number; mediumHours: number } {
  // グリッドポイントでの日影時間マップを作成
  const gridSize = 1; // 1mグリッド
  const range = 50;   // 敷地から50m範囲をチェック
  const hoursMap: number[][] = [];
  
  // 敷地の中心点（仮）
  const centerX = 0;
  const centerY = 0;
  
  // グリッドの初期化
  for (let x = -range; x <= range; x += gridSize) {
    const row: number[] = [];
    for (let y = -range; y <= range; y += gridSize) {
      // 各グリッドポイントでの日影時間を計算
      const hours = calculateShadowHoursAtPoint(
        { x: centerX + x, y: centerY + y, z: measurementHeight },
        buildingShape,
        date
      );
      row.push(hours);
    }
    hoursMap.push(row);
  }
  
  // 最大時間と中間域の時間を抽出
  let maxHours = 0;
  let mediumHours = 0;
  
  // 敷地外の隣地のみを対象とする（簡略化）
  for (let i = 0; i < hoursMap.length; i++) {
    for (let j = 0; j < hoursMap[i].length; j++) {
      const hours = hoursMap[i][j];
      if (hours > maxHours) {
        maxHours = hours;
      }
      if (hours > mediumHours && hours < maxHours) {
        mediumHours = hours;
      }
    }
  }
  
  return { maxHours, mediumHours };
}

/**
 * 特定の点における日影時間の計算
 */
function calculateShadowHoursAtPoint(
  point: { x: number; y: number; z: number },
  buildingShape: any,
  date: Date
): number {
  let totalShadowHours = 0;
  
  // 8:00から16:00まで1時間ごとにチェック
  for (let hour = 8; hour <= 16; hour++) {
    const sunPosition = calculateSunPosition(date, hour);
    
    // この点がその時間に日影にあるかチェック
    if (isPointInShadow(point, buildingShape, sunPosition)) {
      totalShadowHours += 1;
    }
  }
  
  return totalShadowHours;
}

/**
 * 太陽位置の計算
 */
function calculateSunPosition(date: Date, hour: number): { azimuth: number; altitude: number } {
  // 福岡市の位置情報
  const latitude = 33.6;  // 福岡市の緯度
  const longitude = 130.4; // 福岡市の経度
  
  // 詳細な太陽位置計算（実際にはより複雑なアルゴリズムが必要）
  // 簡易計算のため、実際の実装ではSunCalcなどのライブラリを使用することを推奨
  
  // 日付と時刻から時角を計算
  const dayOfYear = getDayOfYear(date);
  const declination = 23.45 * Math.sin(Math.PI / 180 * 360 * (284 + dayOfYear) / 365);
  const timeOffset = hour - 12; // 正午からのオフセット
  const hourAngle = 15 * timeOffset; // 15度/時
  
  // 高度角（太陽の高さ）を計算
  const sinAltitude = Math.sin(Math.PI / 180 * latitude) * Math.sin(Math.PI / 180 * declination) +
                     Math.cos(Math.PI / 180 * latitude) * Math.cos(Math.PI / 180 * declination) * 
                     Math.cos(Math.PI / 180 * hourAngle);
  const altitude = Math.asin(sinAltitude) * 180 / Math.PI;
  
  // 方位角を計算
  const cosAzimuth = (Math.sin(Math.PI / 180 * declination) - 
                     Math.sin(Math.PI / 180 * altitude) * Math.sin(Math.PI / 180 * latitude)) /
                     (Math.cos(Math.PI / 180 * altitude) * Math.cos(Math.PI / 180 * latitude));
  let azimuth = Math.acos(cosAzimuth) * 180 / Math.PI;
  
  // 午後は方位角を調整
  if (hourAngle > 0) {
    azimuth = 360 - azimuth;
  }
  
  return { azimuth, altitude };
}
```

### 6.3 地区計画対応

```typescript
/**
 * 地区計画を考慮した建築可能ボリュームの計算
 * @param property 物件データ（地区計画情報を含む）
 * @param buildingParams 建築パラメータ
 * @returns 調整された建築パラメータ
 */
function adjustBuildingParamsForDistrictPlan(
  property: Property,
  buildingParams: BuildingParams
): BuildingParams {
  // 地区計画情報がない場合はそのまま返す
  if (!property.districtPlanInfo) {
    return buildingParams;
  }
  
  const adjustedParams = { ...buildingParams };
  
  // 壁面後退距離がある場合、敷地面積を調整
  if (property.districtPlanInfo.wallSetbackDistance) {
    // 簡易計算：敷地の外周に沿って壁面後退を考慮した面積を計算
    // 実際にはより複雑な計算が必要
    const setbackDistance = property.districtPlanInfo.wallSetbackDistance;
    
    // 敷地形状がある場合
    if (property.shapeData?.points) {
      const originalArea = property.area;
      
      // 敷地外周の長さを計算（簡易版）
      let perimeter = 0;
      const points = property.shapeData.points;
      for (let i = 0; i < points.length - 1; i++) {
        const dx = points[i + 1].x - points[i].x;
        const dy = points[i + 1].y - points[i].y;
        perimeter += Math.sqrt(dx * dx + dy * dy);
      }
      
      // 最後の点と最初の点の距離を追加
      const dx = points[0].x - points[points.length - 1].x;
      const dy = points[0].y - points[points.length - 1].y;
      perimeter += Math.sqrt(dx * dx + dy * dy);
      
      // 後退による面積減少の簡易計算
      // 実際には敷地形状に応じたより精密な計算が必要
      const reducedArea = Math.max(0, originalArea - perimeter * setbackDistance);
      
      // 建築面積を調整
      const originalBuildingArea = adjustedParams.buildingArea || 
        (originalArea * property.buildingCoverage / 100);
      
      // 面積比率で建築面積を調整
      adjustedParams.buildingArea = originalBuildingArea * (reducedArea / originalArea);
    }
  }
  
  // 高さ制限がある場合、階数と建物高さを調整
  if (property.districtPlanInfo.maxHeight) {
    const maxHeight = property.districtPlanInfo.maxHeight;
    const floorHeight = buildingParams.floorHeight || 3; // デフォルト3m
    
    // 最大階数を計算
    const maxFloors = Math.floor(maxHeight / floorHeight);
    
    // 階数を制限
    adjustedParams.floors = Math.min(adjustedParams.floors, maxFloors);
  }
  
  return adjustedParams;
}
```

### 6.4 ボリュームチェック計算の拡張

```typescript
/**
 * 拡張版：建築可能ボリュームの計算
 */
export async function calculateDetailedVolumeCheck(
  property: Property, 
  buildingParams: BuildingParams,
  userId?: string
): Promise<Omit<VolumeCheck, 'id' | 'createdAt' | 'updatedAt'>> {
  try {
    // 地区計画による調整
    const adjustedParams = adjustBuildingParamsForDistrictPlan(property, buildingParams);
    
    // 建築面積の計算（許容建築面積か敷地面積×建蔽率の低い方）
    const allowedBuildingArea = property.allowedBuildingArea || 
      (property.area * property.buildingCoverage / 100);
    
    // 前面道路幅員が設定されている場合、それを使用
    const roadWidth = adjustedParams.roadWidth || property.roadWidth || 4; // デフォルト4m
    
    // 各種高さ制限の計算
    const absoluteHeightLimit = property.heightLimit || getHeightLimitByZone(property.zoneType);
    const slopedHeightLimit = calculateDetailedSlopeLimit(property);
    const heightDistrictLimit = calculateHeightDistrictLimit(property);
    
    // 日影規制による高さ制限の計算
    const shadowRegulationLimit = property.shadowRegulation !== ShadowRegulationType.NONE
      ? calculateShadowRegulationHeight(property, adjustedParams)
      : Infinity;
    
    // すべての制限から最も厳しいものを採用
    const heightLimit = Math.min(
      absoluteHeightLimit,
      slopedHeightLimit,
      heightDistrictLimit,
      shadowRegulationLimit
    );
    
    // 階高に基づく最大階数の計算
    const maxFloorsByHeight = Math.floor(heightLimit / adjustedParams.floorHeight);
    const maxFloors = Math.min(maxFloorsByHeight, adjustedParams.floors);
    
    // 建物高さの計算
    const buildingHeight = maxFloors * adjustedParams.floorHeight;
    
    // 延床面積の計算
    const totalFloorArea = allowedBuildingArea * maxFloors;
    
    // 容積制限による延床面積チェック
    const volumeLimit = property.area * property.floorAreaRatio / 100;
    const finalTotalFloorArea = Math.min(totalFloorArea, volumeLimit);
    
    // 容積消化率の計算（実際の延床面積 ÷ 法定上限延床面積 × 100）
    const consumptionRate = (finalTotalFloorArea / volumeLimit) * 100;
    
    // 階別データの生成
    const floorBreakdown = generateFloorBreakdown(
      maxFloors, 
      finalTotalFloorArea, 
      adjustedParams.commonAreaRatio
    );
    
    // 日影シミュレーション（日影規制がある場合のみ）
    let shadowSimulation = undefined;
    if (property.shadowRegulation !== ShadowRegulationType.NONE) {
      const shadowRegDetail = getShadowRegulationDetail(
        property.shadowRegulation, 
        property.zoneType
      );
      
      const buildingShape = generateBuildingShape(property, {
        ...adjustedParams,
        height: buildingHeight
      });
      
      const date = new Date(new Date().getFullYear(),
       11, 22); // 冬至日
      const shadowHours = calculateShadowHours(
        property,
        buildingShape,
        shadowRegDetail.measurementHeight,
        date
      );
      
      shadowSimulation = {
        // isochroneMap: generateIsochroneMap(...), // 詳細な等時間線マップ（実装省略）
        maxHours: shadowHours.maxHours,
        mediumHours: shadowHours.mediumHours,
        compliant: (
          shadowHours.maxHours <= shadowRegDetail.hourRanges.primary &&
          shadowHours.mediumHours <= shadowRegDetail.hourRanges.secondary
        )
      };
    }
    
    // 法規制チェック結果の生成
    const regulationChecks = generateDetailedRegulationChecks(
      property,
      allowedBuildingArea,
      finalTotalFloorArea,
      buildingHeight,
      heightLimit,
      volumeLimit,
      shadowSimulation
    );
    
    // 3Dモデルの生成
    const model3dData = generateDetailedModel3dData(
      property,
      allowedBuildingArea,
      buildingHeight
    );
    
    // 高さ制限の詳細情報
    const regulationLimits = {
      heightDistrictLimit,
      slopeLimit: slopedHeightLimit,
      shadowLimit: shadowRegulationLimit,
      absoluteLimit: absoluteHeightLimit,
      finalLimit: heightLimit
    };
    
    // 結果の生成
    return {
      propertyId: property.id,
      assetType: adjustedParams.assetType,
      buildingArea: allowedBuildingArea,
      totalFloorArea: finalTotalFloorArea,
      buildingHeight,
      consumptionRate,
      floors: maxFloors,
      floorBreakdown,
      regulationChecks,
      model3dData,
      shadowSimulation,
      regulationLimits,
      userId
    };
  } catch (error) {
    logger.error('詳細ボリュームチェック計算エラー', { error, propertyId: property.id });
    throw error;
  }
}
```

## 7. ユーザーインターフェース拡張

### 7.1 物件情報入力フォーム拡張

物件情報入力フォームに以下の項目を追加します：

```tsx
// PropertyForm.tsx の拡張部分
<Accordion>
  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
    <Typography>詳細法規制情報</Typography>
  </AccordionSummary>
  <AccordionDetails>
    <Grid container spacing={2}>
      {/* 高度地区 */}
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>高度地区</InputLabel>
          <Select
            value={formData.heightDistrict || ''}
            onChange={(e) => handleChange('heightDistrict', e.target.value)}
          >
            <MenuItem value={HeightDistrictType.NONE}>指定なし</MenuItem>
            <MenuItem value={HeightDistrictType.FIRST_10M}>第一種10M高度地区</MenuItem>
            <MenuItem value={HeightDistrictType.FIRST_15M}>第一種15M高度地区</MenuItem>
            <MenuItem value={HeightDistrictType.SECOND_15M}>第二種15M高度地区</MenuItem>
            <MenuItem value={HeightDistrictType.SECOND_20M}>第二種20M高度地区</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      
      {/* 北側境界線距離 */}
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="北側境界線までの距離（m）"
          type="number"
          InputProps={{ inputProps: { min: 0, step: 0.1 } }}
          value={formData.northBoundaryDistance || ''}
          onChange={(e) => handleChange('northBoundaryDistance', parseFloat(e.target.value))}
        />
      </Grid>
      
      {/* 壁面後退距離 */}
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="壁面後退距離（m）"
          type="number"
          InputProps={{ inputProps: { min: 0, step: 0.1 } }}
          value={formData.districtPlanInfo?.wallSetbackDistance || ''}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            const districtPlanInfo = { ...formData.districtPlanInfo, wallSetbackDistance: value };
            handleChange('districtPlanInfo', districtPlanInfo);
          }}
        />
      </Grid>
      
      {/* 地区計画最高高さ */}
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="地区計画高さ制限（m）"
          type="number"
          InputProps={{ inputProps: { min: 0, step: 0.1 } }}
          value={formData.districtPlanInfo?.maxHeight || ''}
          onChange={(e) => {
            const value = parseFloat(e.target.value);
            const districtPlanInfo = { ...formData.districtPlanInfo, maxHeight: value };
            handleChange('districtPlanInfo', districtPlanInfo);
          }}
        />
      </Grid>
    </Grid>
  </AccordionDetails>
</Accordion>
```

### 7.2 結果表示の拡張

ボリュームチェック結果表示を拡張します：

```tsx
// RegulationDetailPanel.tsx (新規作成)
<Card>
  <CardHeader title="高さ制限詳細" />
  <CardContent>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>制限種別</TableCell>
          <TableCell>制限値（m）</TableCell>
          <TableCell>採用</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {volumeCheck.regulationLimits && (
          <>
            <TableRow>
              <TableCell>絶対高さ制限</TableCell>
              <TableCell>{volumeCheck.regulationLimits.absoluteLimit.toFixed(1)}</TableCell>
              <TableCell>
                {volumeCheck.regulationLimits.finalLimit === volumeCheck.regulationLimits.absoluteLimit && (
                  <CheckCircleIcon color="primary" />
                )}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>高度地区制限</TableCell>
              <TableCell>{volumeCheck.regulationLimits.heightDistrictLimit.toFixed(1)}</TableCell>
              <TableCell>
                {volumeCheck.regulationLimits.finalLimit === volumeCheck.regulationLimits.heightDistrictLimit && (
                  <CheckCircleIcon color="primary" />
                )}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>斜線制限</TableCell>
              <TableCell>{volumeCheck.regulationLimits.slopeLimit.toFixed(1)}</TableCell>
              <TableCell>
                {volumeCheck.regulationLimits.finalLimit === volumeCheck.regulationLimits.slopeLimit && (
                  <CheckCircleIcon color="primary" />
                )}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>日影規制</TableCell>
              <TableCell>
                {volumeCheck.regulationLimits.shadowLimit === Infinity 
                  ? '適用なし' 
                  : volumeCheck.regulationLimits.shadowLimit.toFixed(1)}
              </TableCell>
              <TableCell>
                {volumeCheck.regulationLimits.finalLimit === volumeCheck.regulationLimits.shadowLimit && (
                  <CheckCircleIcon color="primary" />
                )}
              </TableCell>
            </TableRow>
            <TableRow style={{ fontWeight: 'bold' }}>
              <TableCell>最終制限高さ</TableCell>
              <TableCell>{volumeCheck.regulationLimits.finalLimit.toFixed(1)}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </>
        )}
      </TableBody>
    </Table>
  </CardContent>
</Card>

{/* 日影シミュレーション結果（該当する場合） */}
{volumeCheck.shadowSimulation && (
  <Card>
    <CardHeader title="日影規制シミュレーション" />
    <CardContent>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        冬至日（12月22日）における日影時間のシミュレーション結果
      </Typography>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography>
          最大日影時間: <strong>{volumeCheck.shadowSimulation.maxHours.toFixed(1)}時間</strong>
        </Typography>
        <Typography>
          中間日影時間: <strong>{volumeCheck.shadowSimulation.mediumHours.toFixed(1)}時間</strong>
        </Typography>
        <Typography>
          規制適合: 
          <strong>
            {volumeCheck.shadowSimulation.compliant ? '適合' : '不適合'}
          </strong>
          {volumeCheck.shadowSimulation.compliant ? (
            <CheckCircleIcon color="success" fontSize="small" style={{ marginLeft: 4 }} />
          ) : (
            <ErrorIcon color="error" fontSize="small" style={{ marginLeft: 4 }} />
          )}
        </Typography>
      </Box>
      
      {/* 日影等時間線マップの表示 - 詳細実装は省略 */}
      <Box height="200px" border="1px solid #ccc" display="flex" alignItems="center" justifyContent="center">
        <Typography color="textSecondary">
          日影等時間線マップが表示されます（フェーズ3で実装）
        </Typography>
      </Box>
    </CardContent>
  </Card>
)}
```

## 8. 技術的課題

### 8.1 計算の複雑さ
- 日影規制計算は三次元空間での影のシミュレーションが必要
- 不整形敷地での計算精度の確保が課題

### 8.2 データモデルの拡張
- 既存モデルを壊さずに拡張する必要がある
- 後方互換性の維持

### 8.3 パフォーマンス考慮
- 特に日影計算など計算負荷の高い処理のパフォーマンス最適化
- クライアント側での計算とサーバー側での計算の適切な分担

### 8.4 専門知識の必要性
- 建築基準法の詳細な解釈と計算方法の理解が必要
- 実際の建築計画との整合性確認

## 9. 実装のリスク

### 9.1 法規制解釈の曖昧さ
- 建築基準法の解釈に幅があり、自治体ごとの運用差異も
- 完全な正確性を担保することの難しさ

### 9.2 更新・メンテナンスコスト
- 法規制変更時の更新対応
- 複雑な計算ロジックのメンテナンス

## 10. 段階的実装の提案

リスクを抑えつつ価値を早期に提供するため、以下のような段階的実装が考えられます：

### 10.1 フェーズ1 (約1人週)
- 高度地区制限と斜線制限の精密化
- データモデル・UI拡張の基礎部分

### 10.2 フェーズ2 (約1.5人週)
- 地区計画などの特別規制対応
- 規制項目ごとの詳細な適合性検証機能

### 10.3 フェーズ3 (約2人週)
- 日影規制シミュレーションの実装
- 3Dモデルとの統合

このような段階的アプローチにより、リスクを抑えつつ、価値の高い機能から順次リリースできます。正確な日影計算などは複雑ですが、斜線制限や高度地区の計算など比較的実装しやすい部分から着手することで、早期に精度向上のメリットを得られるでしょう。

## 11. 日影規制シミュレーションの重要性

日影規制シミュレーションは、特に福岡市のような都市部での建築計画において非常に重要な機能です。

### 11.1 法的観点
日影規制は建築基準法で定められた絶対的な制限の一つであり、この規制に違反すると建築確認が下りず、計画そのものが頓挫してしまいます。特に住居系地域では、隣地に落とす影の時間が厳しく制限されており、これが建物の高さや形状を大きく左右します。

### 11.2 実務的観点
日影規制はしばしば建物の最大ボリュームを決定する最も厳しい制約となります。容積率や建蔽率を最大限に活用できる計画でも、日影規制によって大幅な設計変更を余儀なくされるケースは珍しくありません。例えば、北側に住宅地がある場合、セットバックや階段状の形状にすることで対応することが一般的です。

### 11.3 投資判断の観点
日影規制を正確に把握することで、土地の実際の開発ポテンシャルをより正確に評価できます。初期段階で日影規制を考慮せずに計画を進めると、後になって大幅な計画変更が必要になり、事業採算性に大きな影響を与える可能性があります。

### 11.4 技術的課題
- 緯度・経度・方位に基づく正確な太陽位置の計算
- 時間経過に伴う影の移動シミュレーション
- 複雑な建物形状に対応した影の計算
- 不整形敷地での正確な投影計算
- 計算処理の最適化（計算負荷が高い）

日影規制シミュレーションは、建築可能ボリュームを現実的に把握するための重要な機能であり、この機能を実装することで、システムの実用性と信頼性は大きく向上するでしょう。都市部での土地購入判断において、誤った評価によるリスクを大幅に減らすことができる価値ある機能と言えます。

## 12. フェーズ2の実装完了と次ステップ

### 12.1 フェーズ2の実装成果

フェーズ2の主要課題であった日影規制シミュレーションおよび関連機能の実装が完了しました：

- **太陽位置計算モジュール (sunPosition.ts)**
  - 冬至日における太陽位置の精密計算
  - 福岡市の緯度経度を考慮した実装
  - 日影規制時間帯（8時〜16時）の対応

- **日影シミュレーションモジュール (shadowSimulation.ts)**
  - 建物形状に基づく影の計算アルゴリズム
  - グリッドベースの日影時間計算
  - 日影等時間線マップの生成

- **日影規制計算モジュール (shadowRegulation.ts)**
  - 用途地域に応じた測定面高さの設定
  - 日影規制タイプによる判定基準の切り替え
  - 二分探索による最大高さの計算

- **規制計算の統合と検証**
  - 設計値と計算値の比較による検証
  - 適切なエラーハンドリング
  - 全ての規制（高度地区、斜線制限、日影規制）の総合評価

### 12.2 次のステップ：フェーズ3の計画

フェーズ3では、日影シミュレーションのビジュアライゼーションと高度な規制対応の実装を行います：

#### 12.2.1 日影シミュレーションの可視化

- **実装範囲**: 日影シミュレーション結果の3D表示
- **実装方針**:
  - Three.jsを活用した日影の視覚化
  - 時間経過に伴う日影変化のアニメーション
  - 等時間線の色分け表示
  - 実装ファイル:
    - `frontend/src/features/analysis/components/ThreeViewer/ShadowVisualization.tsx`
    - `frontend/src/features/analysis/components/ThreeViewerControls/ShadowControls.tsx`

#### 12.2.2 特殊規制対応の拡充

- **実装範囲**: 特定地区の規制と緩和措置
- **実装方針**:
  - 総合設計制度による容積率緩和
  - 特区や再開発地区の特別基準
  - 斜線制限の適用除外条件
  - 実装ファイル:
    - `backend/src/features/analysis/regulation/specialRegulations.ts`
    - `backend/src/features/analysis/regulation/volumeBonus.ts`

#### 12.2.3 地形考慮の実装

- **実装範囲**: 複雑な地形や傾斜地への対応
- **実装方針**:
  - 平均地盤面の算出
  - 傾斜地での高さ規制の調整
  - 周辺地形を考慮した日影計算
  - 実装ファイル:
    - `backend/src/features/analysis/regulation/terrain.ts`
    - `backend/src/features/analysis/regulation/groundLevelCalculation.ts`

#### 12.2.4 規制情報の詳細表示

- **実装範囲**: 詳細な規制情報の提供
- **実装方針**:
  - 規制ごとの詳細情報表示
  - 高さ制限に寄与する要因の分析
  - 最適建築形状の提案機能
  - 実装ファイル:
    - `frontend/src/features/analysis/components/RegulationDetailPanel.tsx`
    - `frontend/src/features/analysis/components/OptimalBuildingProposal.tsx`

### 12.3 実装の優先順位と工数見積もり

| 機能 | 優先度 | 工数 | 担当 |
|-----|-------|-----|-----|
| 日影シミュレーション可視化 | 最高 | 2週間 | フロントエンド担当 |
| 特殊規制対応 | 中 | 2週間 | バックエンド担当 |
| 地形考慮の実装 | 高 | 1.5週間 | バックエンド担当 |
| 規制情報の詳細表示 | 高 | 1週間 | フロントエンド担当 |

### 12.4 フェーズ3の技術的課題

1. **パフォーマンス最適化**
   - 複雑な日影計算の負荷軽減
   - 3Dレンダリングの最適化
   - 計算結果のキャッシング戦略

2. **データ互換性の確保**
   - 既存データとの互換性維持
   - APIの下位互換性保持
   - フロントエンドとバックエンドの同期

3. **精度と実用性のバランス**
   - 計算精度と実行速度のトレードオフ
   - 簡略化と実務レベルの正確性のバランス
   - ユーザビリティと専門性の両立

これらの機能拡張により、建築規制計算ツールはより実用的で視覚的な意思決定支援ツールへと進化します。フェーズ3の実装により、ユーザーは複雑な規制環境下での最適な建築計画をより直感的に理解できるようになります。