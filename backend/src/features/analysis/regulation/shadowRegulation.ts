/**
 * 日影規制計算ユーティリティ
 * 
 * 日影規制に基づく高さ制限を計算するためのユーティリティ関数群
 */
import { Property, BuildingParams, ShadowRegulationType, ShadowRegulationDetail, ZoneType } from '../../../types';
import { generateBuildingShape, simulateShadow } from './shadowSimulation';
import { getWinterSolsticeDate } from './sunPosition';

/**
 * 日影規制による高さ制限の計算
 * @param property 物件データ
 * @param buildingParams 建築パラメータ
 * @returns 日影規制に適合する最大高さ（m）
 */
export function calculateShadowRegulationHeight(
  property: Property,
  buildingParams: BuildingParams
): number {
  // 日影規制がない場合は制限なし
  if (!property.shadowRegulation || property.shadowRegulation === ShadowRegulationType.NONE) {
    return Infinity;
  }
  
  // 敷地形状データがない場合は計算不能
  if (!property.shapeData?.points || property.shapeData.points.length < 3) {
    return Infinity; // 計算できないので制限なしとする
  }
  
  // 日影規制の詳細情報を取得
  const shadowRegDetail = getShadowRegulationDetail(property);
  
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
  try {
    // 敷地形状から建物形状を生成
    const buildingShape = generateBuildingShape(property, buildingParams);
    
    // 冬至日の日影をシミュレーション
    const date = getWinterSolsticeDate(new Date().getFullYear());
    const shadowResult = simulateShadow(
      property,
      buildingShape,
      shadowRegDetail.measurementHeight,
      date.getFullYear()
    );
    
    // 規制時間と比較して適合判定
    return (
      shadowResult.maxHours <= shadowRegDetail.hourRanges.primary &&
      shadowResult.mediumHours <= shadowRegDetail.hourRanges.secondary
    );
  } catch (error) {
    console.error('日影シミュレーションエラー:', error);
    return false; // エラー時は不適合と判断
  }
}

/**
 * 日影規制詳細情報の取得
 * @param property 物件データ
 * @returns 日影規制詳細
 */
export function getShadowRegulationDetail(property: Property): ShadowRegulationDetail {
  // 物件に詳細情報が設定されている場合はそれを使用
  if (property.shadowRegulationDetail) {
    return property.shadowRegulationDetail;
  }
  
  // 日影規制タイプに応じたデフォルト値を返す
  return getDefaultShadowRegulationDetail(property.shadowRegulation, property.zoneType);
}

/**
 * デフォルトの日影規制詳細を取得
 * @param shadowRegulation 日影規制タイプ
 * @param zoneType 用途地域
 * @returns 日影規制詳細
 */
export function getDefaultShadowRegulationDetail(
  shadowRegulation?: ShadowRegulationType,
  zoneType?: ZoneType
): ShadowRegulationDetail {
  // 日影規制がない場合
  if (!shadowRegulation || shadowRegulation === ShadowRegulationType.NONE) {
    return {
      measurementHeight: 4,
      hourRanges: {
        primary: Infinity,
        secondary: Infinity
      }
    };
  }
  
  // 測定面の高さ（用途地域により異なる）
  const measurementHeight = getMeasurementHeight(zoneType);
  
  // 規制タイプに応じた時間範囲
  let hourRanges = {
    primary: 4,    // デフォルト: 4時間
    secondary: 2.5 // デフォルト: 2.5時間
  };
  
  if (shadowRegulation === ShadowRegulationType.TYPE1) {
    hourRanges = {
      primary: 4,    // 4時間
      secondary: 2.5 // 2.5時間
    };
  } else if (shadowRegulation === ShadowRegulationType.TYPE2) {
    hourRanges = {
      primary: 5,  // 5時間
      secondary: 3 // 3時間
    };
  }
  
  return {
    measurementHeight,
    hourRanges
  };
}

/**
 * 測定面の高さを取得
 * @param zoneType 用途地域
 * @returns 測定面の高さ（m）
 */
function getMeasurementHeight(zoneType?: ZoneType): number {
  // 用途地域に応じた測定面の高さ
  if (!zoneType) {
    return 4; // デフォルト値
  }
  
  switch (zoneType) {
    case ZoneType.CATEGORY1: // 第一種低層住居専用地域
    case ZoneType.CATEGORY2: // 第二種低層住居専用地域
      return 1.5; // 1.5m
    case ZoneType.CATEGORY3: // 第一種中高層住居専用地域
    case ZoneType.CATEGORY4: // 第二種中高層住居専用地域
    case ZoneType.CATEGORY5: // 第一種住居地域
    case ZoneType.CATEGORY6: // 第二種住居地域
    case ZoneType.CATEGORY7: // 準住居地域
      return 4.0; // 4.0m
    default:
      return 4.0; // その他の用途地域でも一般的な値
  }
}