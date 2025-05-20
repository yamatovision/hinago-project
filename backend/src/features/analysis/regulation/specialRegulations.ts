/**
 * 特殊規制対応モジュール
 * 
 * 特定地区の規制や緩和措置を処理するためのユーティリティ関数群
 */
import { Property, ZoneType, AssetType, BuildingParams } from '../../../types';

/**
 * 緩和措置の種類
 */
export enum RelaxationType {
  NONE = 'none',                       // 緩和なし
  COMPREHENSIVE_DESIGN = 'comprehensive', // 総合設計制度
  URBAN_RENEWAL = 'urban-renewal',     // 市街地再開発
  SPECIAL_DISTRICT = 'special-district', // 特別区域
  REDEVELOPMENT = 'redevelopment'      // 再開発
}

/**
 * 特殊規制情報
 */
export interface SpecialRegulation {
  name: string;                   // 規制名称
  volumeRatioRelaxation: number;  // 容積率緩和（%）
  heightRelaxation: number;       // 高さ緩和（m）
  slopeRelaxation: boolean;       // 斜線制限緩和
  shadowRelaxation: boolean;      // 日影規制緩和
  notes?: string;                 // 補足説明
}

/**
 * 容積ボーナスの計算結果
 */
export interface VolumeBonus {
  bonusRatio: number;            // ボーナス容積率（%）
  effectiveFloorAreaRatio: number; // 適用後の容積率（%）
  reasonCodes: string[];          // ボーナス理由コード
  description: string;            // 説明
}

/**
 * 該当地区の特殊規制を取得
 * @param property 物件データ
 * @returns 特殊規制情報（該当なしの場合はnull）
 */
export function getSpecialRegulations(property: Property): SpecialRegulation | null {
  // 地区計画情報がある場合
  if (property.districtPlanInfo) {
    const name = property.districtPlanInfo.name;
    
    // 特殊規制の設定
    // 実際のシステムでは外部のマスターデータから取得するべきだが
    // ここではハードコードの例として実装
    
    // 特定名称をチェック
    if (name.includes('天神明治通り')) {
      return {
        name: '天神明治通り地区計画',
        volumeRatioRelaxation: 200, // 容積率緩和 + 200%
        heightRelaxation: 15,      // 高さ緩和 + 15m
        slopeRelaxation: true,     // 斜線制限緩和あり
        shadowRelaxation: false,   // 日影規制緩和なし
        notes: '都心機能の強化・高度利用促進'
      };
    } else if (name.includes('博多駅')) {
      return {
        name: '博多駅周辺地区計画',
        volumeRatioRelaxation: 150, // 容積率緩和 + 150%
        heightRelaxation: 10,      // 高さ緩和 + 10m
        slopeRelaxation: true,     // 斜線制限緩和あり
        shadowRelaxation: false,   // 日影規制緩和なし
        notes: '陸の玄関口としての賑わい創出'
      };
    } else if (name.includes('ウォーターフロント')) {
      return {
        name: 'ウォーターフロント地区計画',
        volumeRatioRelaxation: 100, // 容積率緩和 + 100%
        heightRelaxation: 20,      // 高さ緩和 + 20m
        slopeRelaxation: true,     // 斜線制限緩和あり
        shadowRelaxation: true,    // 日影規制緩和あり
        notes: '海の玄関口としての賑わい創出'
      };
    }
    
    // 地区計画名の特徴で判定（一般的なケース）
    if (name.includes('再開発') || name.includes('redevelopment')) {
      return {
        name: '再開発地区',
        volumeRatioRelaxation: 100, // 容積率緩和 + 100%
        heightRelaxation: 10,      // 高さ緩和 + 10m
        slopeRelaxation: true,     // 斜線制限緩和あり
        shadowRelaxation: false,   // 日影規制緩和なし
        notes: '市街地の計画的な再開発'
      };
    }
    
    if (name.includes('特区') || name.includes('special')) {
      return {
        name: '特区指定地区',
        volumeRatioRelaxation: 150, // 容積率緩和 + 150%
        heightRelaxation: 15,      // 高さ緩和 + 15m
        slopeRelaxation: true,     // 斜線制限緩和あり
        shadowRelaxation: true,    // 日影規制緩和あり
        notes: '国家戦略特区における規制緩和'
      };
    }
  }
  
  return null;
}

/**
 * 総合設計制度による容積率ボーナスを計算
 * @param property 物件データ
 * @param params 建築パラメータ
 * @returns 容積ボーナスの計算結果
 */
export function calculateComprehensiveDesignBonus(
  property: Property, 
  params: BuildingParams
): VolumeBonus {
  // 基準となる容積率
  const baseRatio = property.floorAreaRatio;
  
  // ボーナス容積率の初期値
  let bonusRatio = 0;
  const reasonCodes = [];
  
  // 敷地面積によるボーナス
  if (property.area >= 1000) {
    // 1000㎡以上で基本ボーナス50%
    bonusRatio += 50;
    reasonCodes.push('LARGE_SITE');
    
    // 2000㎡以上でさらに追加
    if (property.area >= 2000) {
      bonusRatio += 50;
      reasonCodes.push('VERY_LARGE_SITE');
    }
  }
  
  // 公開空地の確保を想定
  // 実際のシステムではユーザー入力または計算から取得
  const assumedOpenSpaceRatio = calculateAssumedOpenSpaceRatio(property, params);
  
  if (assumedOpenSpaceRatio >= 0.2) { // 20%以上の公開空地
    bonusRatio += assumedOpenSpaceRatio * 300; // 最大60%追加
    reasonCodes.push('OPEN_SPACE');
  }
  
  // 環境配慮設計（仮定）
  if (params.assetType === AssetType.OFFICE || params.assetType === AssetType.MANSION) {
    bonusRatio += 20;
    reasonCodes.push('GREEN_DESIGN');
  }
  
  // ボーナス上限の適用
  const maxBonus = 250; // 最大250%まで
  bonusRatio = Math.min(bonusRatio, maxBonus);
  
  // 結果を返却
  return {
    bonusRatio,
    effectiveFloorAreaRatio: baseRatio + bonusRatio,
    reasonCodes,
    description: generateBonusDescription(reasonCodes, bonusRatio)
  };
}

/**
 * 想定される公開空地比率を計算
 * @param property 物件データ 
 * @param params 建築パラメータ
 * @returns 推定公開空地比率（0-1の値）
 */
function calculateAssumedOpenSpaceRatio(property: Property, params: BuildingParams): number {
  // 建ぺい率から空地比率を推定
  const coverageRatio = property.buildingCoverage / 100;
  
  // 基本空地比率 = 1 - 建ぺい率
  const basicOpenRatio = 1 - coverageRatio;
  
  // そのうち公開空地として設計可能な割合を推定
  let publicRatio = 0;
  
  // アセットタイプによって異なる公開空地の可能性
  switch (params.assetType) {
    case AssetType.OFFICE:
      // オフィスは比較的公開空地を設けやすい
      publicRatio = 0.5;
      break;
    case AssetType.MANSION:
      // マンションはセキュリティ上、完全公開は少ない
      publicRatio = 0.3;
      break;
    case AssetType.HOTEL:
      // ホテルは公開空地を設けやすい
      publicRatio = 0.6;
      break;
    default:
      // その他は控えめに
      publicRatio = 0.2;
  }
  
  // 敷地面積が大きいほど公開空地も増加
  if (property.area >= 2000) {
    publicRatio += 0.1;
  }
  
  // 最終的な公開空地比率の推定値（敷地面積に対する割合）
  const openSpaceRatio = basicOpenRatio * publicRatio;
  
  // 上限を設定
  return Math.min(openSpaceRatio, 0.5);
}

/**
 * ボーナス理由コードから説明文を生成
 * @param reasonCodes ボーナス理由コード配列
 * @param bonusRatio 合計ボーナス率
 * @returns 説明文
 */
function generateBonusDescription(reasonCodes: string[], bonusRatio: number): string {
  const reasons = [];
  
  if (reasonCodes.includes('LARGE_SITE')) {
    reasons.push('大規模敷地の活用');
  }
  
  if (reasonCodes.includes('VERY_LARGE_SITE')) {
    reasons.push('特大規模敷地の活用');
  }
  
  if (reasonCodes.includes('OPEN_SPACE')) {
    reasons.push('公開空地の確保');
  }
  
  if (reasonCodes.includes('GREEN_DESIGN')) {
    reasons.push('環境配慮設計');
  }
  
  return `総合設計制度により容積率が${bonusRatio}%緩和されます（${reasons.join('、')}による）`;
}

/**
 * 斜線制限の適用除外条件をチェック
 * @param property 物件データ
 * @param relaxationType 緩和措置の種類
 * @returns 斜線制限が適用除外かどうか
 */
export function checkSlopeRegulationExemption(
  property: Property,
  relaxationType: RelaxationType = RelaxationType.NONE
): boolean {
  // 特定の商業地域では斜線制限の適用外となるケースがある
  if (property.zoneType === ZoneType.CATEGORY9) { // 商業地域
    
    // 特殊な緩和措置がある場合
    if (relaxationType !== RelaxationType.NONE) {
      return true;
    }
    
    // 敷地面積が大きい場合
    if (property.area >= 2000) {
      return true;
    }
  }
  
  // 特殊規制情報がある場合
  const specialReg = getSpecialRegulations(property);
  if (specialReg && specialReg.slopeRelaxation) {
    return true;
  }
  
  return false;
}

/**
 * 日影規制の適用除外条件をチェック
 * @param property 物件データ
 * @param relaxationType 緩和措置の種類
 * @returns 日影規制が適用除外かどうか
 */
export function checkShadowRegulationExemption(
  property: Property,
  relaxationType: RelaxationType = RelaxationType.NONE
): boolean {
  // 商業地域と工業地域は日影規制適用外
  if (
    property.zoneType === ZoneType.CATEGORY9 || // 商業地域
    property.zoneType === ZoneType.CATEGORY11 || // 工業地域
    property.zoneType === ZoneType.CATEGORY12    // 工業専用地域
  ) {
    return true;
  }
  
  // 特定の緩和措置がある場合
  if (
    relaxationType === RelaxationType.SPECIAL_DISTRICT ||
    relaxationType === RelaxationType.URBAN_RENEWAL
  ) {
    return true;
  }
  
  // 特殊規制情報がある場合
  const specialReg = getSpecialRegulations(property);
  if (specialReg && specialReg.shadowRelaxation) {
    return true;
  }
  
  return false;
}

/**
 * 建築高さの緩和値を計算
 * @param property 物件データ
 * @param relaxationType 緩和措置の種類
 * @returns 高さの緩和量（m）
 */
export function calculateHeightRelaxation(
  property: Property,
  relaxationType: RelaxationType = RelaxationType.NONE
): number {
  let relaxation = 0;
  
  // 緩和措置による高さ緩和
  switch (relaxationType) {
    case RelaxationType.COMPREHENSIVE_DESIGN:
      relaxation += 10;
      break;
    case RelaxationType.URBAN_RENEWAL:
      relaxation += 15;
      break;
    case RelaxationType.SPECIAL_DISTRICT:
      relaxation += 20;
      break;
    case RelaxationType.REDEVELOPMENT:
      relaxation += 15;
      break;
  }
  
  // 特殊規制情報がある場合
  const specialReg = getSpecialRegulations(property);
  if (specialReg) {
    relaxation += specialReg.heightRelaxation;
  }
  
  return relaxation;
}