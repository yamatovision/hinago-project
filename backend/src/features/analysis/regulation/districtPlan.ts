/**
 * 地区計画対応ユーティリティ
 * 
 * 地区計画情報に基づいて建築パラメータを調整するためのユーティリティ関数群
 */
import { Property, BuildingParams } from '../../../types';

/**
 * 地区計画を考慮した建築可能ボリュームの計算
 * @param property 物件データ（地区計画情報を含む）
 * @param buildingParams 建築パラメータ
 * @returns 調整された建築パラメータ
 */
export function adjustBuildingParamsForDistrictPlan(
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
      // 原本の建築面積（与えられた場合はそれを使用、なければ建蔵率から計算）
      const originalBuildingArea = 'buildingArea' in adjustedParams
        ? (adjustedParams as any).buildingArea
        : (originalArea * property.buildingCoverage / 100);
      
      // 新しい品面積（後退距離考慮）
      const reducedBuildingArea = originalBuildingArea * (reducedArea / originalArea);
      
      // デバッグ用ログ
      console.log(`Original area: ${originalArea}, Reduced area: ${reducedArea}`);
      console.log(`Original building area: ${originalBuildingArea}, Reduced building area: ${reducedBuildingArea}`);
      
      // パラメータに明示的に建築面積を設定
      adjustedParams.buildingArea = reducedBuildingArea;
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