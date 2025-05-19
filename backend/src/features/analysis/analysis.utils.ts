/**
 * 分析機能用ユーティリティ
 */
import { 
  BuildingParams, 
  FloorData,
  VolumeCheck,
  Property,
  RegulationCheck,
  Model3DData,
  AssetType,
  FinancialParams,
  ProfitabilityResult,
  AnnualFinancialData
} from '../../types';
import { logger } from '../../common/utils';
import { PropertyModel, VolumeCheckModel } from '../../db/models';

/**
 * 建築可能ボリュームの計算
 * 
 * 物件データと建築パラメータに基づいて、建築可能ボリュームを計算します。
 * 
 * @param property 物件データ
 * @param buildingParams 建築パラメータ
 * @param userId ユーザーID（オプション）
 * @returns ボリュームチェック結果データ（ID、タイムスタンプなし）
 */
export async function calculateVolumeCheck(
  property: Property, 
  buildingParams: BuildingParams,
  userId?: string
): Promise<Omit<VolumeCheck, 'id' | 'createdAt' | 'updatedAt'>> {
  try {
    // 建築面積の計算（許容建築面積か敷地面積×建蔽率の低い方）
    const allowedBuildingArea = property.allowedBuildingArea || 
      (property.area * property.buildingCoverage / 100);
      
    // 前面道路幅員が設定されている場合、それを使用
    const roadWidth = buildingParams.roadWidth || property.roadWidth || 4; // デフォルト4m
    
    // 高さ制限の計算（絶対高さ制限と斜線制限から厳しい方）
    const absoluteHeightLimit = property.heightLimit || getHeightLimitByZone(property.zoneType);
    const slopedHeightLimit = calculateSlopedHeightLimit(roadWidth, property);
    const heightLimit = Math.min(absoluteHeightLimit, slopedHeightLimit);
    
    // 階高に基づく最大階数の計算
    const maxFloorsByHeight = Math.floor(heightLimit / buildingParams.floorHeight);
    const maxFloors = Math.min(maxFloorsByHeight, buildingParams.floors);
    
    // 建物高さの計算
    const buildingHeight = maxFloors * buildingParams.floorHeight;
    
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
      buildingParams.commonAreaRatio
    );
    
    // 法規制チェック結果の生成
    const regulationChecks = generateRegulationChecks(
      property,
      allowedBuildingArea,
      finalTotalFloorArea,
      buildingHeight,
      heightLimit,
      volumeLimit
    );
    
    // 3Dモデルの生成
    const model3dData = generateModel3dData(
      property,
      allowedBuildingArea,
      buildingHeight
    );
    
    // 結果の生成
    return {
      propertyId: property.id,
      assetType: buildingParams.assetType,
      buildingArea: allowedBuildingArea,
      totalFloorArea: finalTotalFloorArea,
      buildingHeight,
      consumptionRate,
      floors: maxFloors,
      floorBreakdown,
      regulationChecks,
      model3dData,
      userId
    };
  } catch (error) {
    logger.error('ボリュームチェック計算エラー', { error, propertyId: property.id });
    throw error;
  }
}

/**
 * 収益性試算計算
 * 
 * 物件データ、ボリュームチェック結果、財務パラメータに基づいて、収益性を計算します。
 * 
 * @param property 物件データ
 * @param volumeCheck ボリュームチェック結果
 * @param financialParams 財務パラメータ
 * @param userId ユーザーID（オプション）
 * @returns 収益性試算結果データ（ID、タイムスタンプなし）
 */
export async function calculateProfitability(
  property: Property,
  volumeCheck: VolumeCheck,
  financialParams: FinancialParams,
  userId?: string
): Promise<Omit<ProfitabilityResult, 'id' | 'createdAt' | 'updatedAt'>> {
  try {
    // 土地取得費用
    const landPrice = property.price || 0;
    
    // 建設費用（延床面積 × 建設単価）
    const constructionCost = volumeCheck.totalFloorArea * financialParams.constructionCostPerSqm;
    
    // 諸経費（建設費用 × 4%）
    const miscExpenses = constructionCost * 0.04;
    
    // 総投資額（土地取得費 + 建設費 + 諸経費）
    const totalInvestment = landPrice + constructionCost + miscExpenses;
    
    // 専有面積の合計を取得（共用部分を除く）
    const totalPrivateArea = volumeCheck.floorBreakdown.reduce(
      (sum, floor) => sum + floor.privateArea, 0
    );
    
    // 年間賃料収入（専有面積 × 賃料単価 × 稼働率）
    const annualRentalIncome = totalPrivateArea * financialParams.rentPerSqm * 12 * (financialParams.occupancyRate / 100);
    
    // 年間運営費（賃料収入 × 管理コスト率）
    const annualOperatingExpenses = annualRentalIncome * (financialParams.managementCostRate / 100);
    
    // 年間修繕費（建設費 × 1%）
    const annualMaintenance = constructionCost * 0.01;
    
    // 年間不動産税（総投資額 × 1%）
    const annualPropertyTax = totalInvestment * 0.01;
    
    // 年間純収益（賃料収入 - 運営費 - 修繕費 - 不動産税）
    const annualNOI = annualRentalIncome - annualOperatingExpenses - annualMaintenance - annualPropertyTax;
    
    // 投資利回り（年間純収益 ÷ 総投資額 × 100）
    const noiYield = (annualNOI / totalInvestment) * 100;
    
    // 年次ごとの財務データを生成
    const annualFinancials = generateAnnualFinancials(
      financialParams.rentalPeriod,
      annualRentalIncome,
      annualOperatingExpenses + annualMaintenance + annualPropertyTax
    );
    
    // IRR（内部収益率）の計算
    const irr = calculateIRR(totalInvestment, annualNOI, financialParams.capRate, financialParams.rentalPeriod);
    
    // 投資回収期間の計算
    const paybackPeriod = totalInvestment / annualNOI;
    
    // NPV（正味現在価値）の計算
    const npv = calculateNPV(totalInvestment, annualNOI, financialParams.capRate, financialParams.rentalPeriod);
    
    // 結果の生成
    return {
      propertyId: property.id,
      volumeCheckId: volumeCheck.id,
      assetType: volumeCheck.assetType,
      parameters: financialParams,
      
      // 投資概要
      landPrice,
      constructionCost,
      miscExpenses,
      totalInvestment,
      
      // 年間収支
      annualRentalIncome,
      annualOperatingExpenses,
      annualMaintenance,
      annualPropertyTax,
      annualNOI,
      
      // 収益指標
      noiYield,
      irr,
      paybackPeriod,
      npv,
      
      // 詳細データ
      annualFinancials,
      
      userId
    };
  } catch (error) {
    logger.error('収益性試算計算エラー', { 
      error, 
      propertyId: property.id,
      volumeCheckId: volumeCheck.id
    });
    throw error;
  }
}

/**
 * 年次ごとの財務データを生成
 * @param rentalPeriod 運用期間（年）
 * @param annualRentalIncome 年間賃料収入
 * @param annualExpenses 年間経費（運営費＋修繕費＋不動産税）
 * @returns 年次ごとの財務データ配列
 */
function generateAnnualFinancials(
  rentalPeriod: number,
  annualRentalIncome: number,
  annualExpenses: number
): AnnualFinancialData[] {
  const annualFinancials: AnnualFinancialData[] = [];
  let accumulatedIncome = 0;

  // 各年の財務データを作成
  for (let year = 1; year <= rentalPeriod; year++) {
    // 賃料収入（経年による変動を考慮する場合はここで調整）
    const rentalIncome = annualRentalIncome;
    
    // 運営支出（経年による変動を考慮する場合はここで調整）
    const operatingExpenses = annualExpenses;
    
    // 年間純収益
    const netOperatingIncome = rentalIncome - operatingExpenses;
    
    // 累計収益
    accumulatedIncome += netOperatingIncome;
    
    // データ追加
    annualFinancials.push({
      year,
      rentalIncome,
      operatingExpenses,
      netOperatingIncome,
      accumulatedIncome
    });
  }
  
  return annualFinancials;
}

/**
 * IRR（内部収益率）の計算
 * 
 * 簡略化した計算方法です。実際の計算はより複雑になる場合があります。
 * 
 * @param totalInvestment 総投資額
 * @param annualNOI 年間純収益
 * @param capRate 還元利回り（%）
 * @param rentalPeriod 運用期間（年）
 * @returns IRR（%）
 */
function calculateIRR(
  totalInvestment: number,
  annualNOI: number,
  capRate: number,
  rentalPeriod: number
): number {
  // 出口価値の計算（還元利回りに基づく）
  const exitValue = annualNOI / (capRate / 100);
  
  // キャッシュフロー配列の作成
  const cashFlows = [-totalInvestment];
  for (let i = 1; i <= rentalPeriod - 1; i++) {
    cashFlows.push(annualNOI);
  }
  // 最終年は純収益＋出口価値
  cashFlows.push(annualNOI + exitValue);
  
  // IRRの計算（試行錯誤法）
  return calculateIRRFromCashFlows(cashFlows);
}

/**
 * キャッシュフロー配列からIRRを計算（試行錯誤法）
 * @param cashFlows キャッシュフロー配列
 * @returns IRR（%）
 */
function calculateIRRFromCashFlows(cashFlows: number[]): number {
  // 初期推測値
  let guess = 0.1;
  const maxIterations = 1000;
  const tolerance = 0.0001;
  
  for (let i = 0; i < maxIterations; i++) {
    // NPVの計算
    let npv = 0;
    for (let j = 0; j < cashFlows.length; j++) {
      npv += cashFlows[j] / Math.pow(1 + guess, j);
    }
    
    // NPVがゼロに近ければ終了
    if (Math.abs(npv) < tolerance) {
      return guess * 100;
    }
    
    // 微分値の計算
    let derivative = 0;
    for (let j = 1; j < cashFlows.length; j++) {
      derivative -= j * cashFlows[j] / Math.pow(1 + guess, j + 1);
    }
    
    // ニュートン法による更新
    guess = guess - npv / derivative;
    
    // 有効範囲外の場合
    if (guess < -1) {
      return -100; // IRRが計算できない場合
    }
  }
  
  // 最大反復回数に達した場合
  return guess * 100;
}

/**
 * NPV（正味現在価値）の計算
 * @param totalInvestment 総投資額
 * @param annualNOI 年間純収益
 * @param capRate 還元利回り（%）
 * @param rentalPeriod 運用期間（年）
 * @returns NPV（円）
 */
function calculateNPV(
  totalInvestment: number,
  annualNOI: number,
  capRate: number,
  rentalPeriod: number
): number {
  // 割引率（簡略化のために還元利回りを使用）
  const discountRate = capRate / 100;
  
  // 出口価値の計算（還元利回りに基づく）
  const exitValue = annualNOI / discountRate;
  
  // 現在価値の計算
  let presentValue = 0;
  
  // 毎年の純収益の現在価値
  for (let year = 1; year <= rentalPeriod; year++) {
    presentValue += annualNOI / Math.pow(1 + discountRate, year);
  }
  
  // 出口価値の現在価値を追加
  presentValue += exitValue / Math.pow(1 + discountRate, rentalPeriod);
  
  // NPV = 現在価値 - 初期投資
  return presentValue - totalInvestment;
}

/**
 * 用途地域による高さ制限の取得
 * @param zoneType 用途地域
 * @returns 高さ制限（m）
 */
function getHeightLimitByZone(zoneType: string): number {
  // 用途地域ごとの高さ制限（福岡市の一般的な値）
  // 実際には地区計画や高度地区によって異なる場合がある
  switch (zoneType) {
    case 'category1': // 第一種低層住居専用地域
    case 'category2': // 第二種低層住居専用地域
      return 10; // 例: 10m
    case 'category3': // 第一種中高層住居専用地域
    case 'category4': // 第二種中高層住居専用地域
      return 20; // 例: 20m
    case 'category5': // 第一種住居地域
    case 'category6': // 第二種住居地域
    case 'category7': // 準住居地域
      return 31; // 例: 31m
    case 'category8': // 近隣商業地域
      return 31; // 例: 31m
    case 'category9': // 商業地域
      return 45; // 例: 45m
    case 'category10': // 準工業地域
    case 'category11': // 工業地域
    case 'category12': // 工業専用地域
      return 31; // 例: 31m
    default:
      return 31; // デフォルト: 31m
  }
}

/**
 * 斜線制限による高さ制限の計算
 * @param roadWidth 前面道路幅員
 * @param property 物件データ
 * @returns 高さ制限（m）
 */
function calculateSlopedHeightLimit(roadWidth: number, property: Property): number {
  // 用途地域ごとの道路斜線制限の勾配
  let slope = 1.5; // デフォルト: 1.5
  
  // 用途地域に応じた勾配の調整
  switch (property.zoneType) {
    case 'category9': // 商業地域
      slope = 2.0;
      break;
    case 'category8': // 近隣商業地域
      slope = 1.75;
      break;
    case 'category1': // 第一種低層住居専用地域
    case 'category2': // 第二種低層住居専用地域
      slope = 1.25;
      break;
    default:
      slope = 1.5;
  }
  
  // 道路斜線制限による高さ制限 = 道路幅員 × 勾配
  // 実際の計算はより複雑（セットバック、北側斜線など）だが、簡略化
  return roadWidth * slope;
}

/**
 * 階別データの生成
 * @param floors 階数
 * @param totalFloorArea 総延床面積
 * @param commonAreaRatio 共用部率（%）
 * @returns 階別データ配列
 */
function generateFloorBreakdown(
  floors: number, 
  totalFloorArea: number, 
  commonAreaRatio: number
): FloorData[] {
  const floorBreakdown: FloorData[] = [];
  
  // 1階あたりの床面積
  const floorAreaPerFloor = totalFloorArea / floors;
  
  // 共用部面積と専有部面積の計算
  const commonAreaPerFloor = floorAreaPerFloor * (commonAreaRatio / 100);
  const privateAreaPerFloor = floorAreaPerFloor - commonAreaPerFloor;
  
  // 階別データの作成
  for (let floor = 1; floor <= floors; floor++) {
    floorBreakdown.push({
      floor,
      floorArea: floorAreaPerFloor,
      privateArea: privateAreaPerFloor,
      commonArea: commonAreaPerFloor
    });
  }
  
  return floorBreakdown;
}

/**
 * 法規制チェック結果の生成
 * @param property 物件データ
 * @param buildingArea 建築面積
 * @param totalFloorArea 総延床面積
 * @param buildingHeight 建物高さ
 * @param heightLimit 高さ制限
 * @param volumeLimit 容積制限
 * @returns 法規制チェック結果配列
 */
function generateRegulationChecks(
  property: Property,
  buildingArea: number,
  totalFloorArea: number,
  buildingHeight: number,
  heightLimit: number,
  volumeLimit: number
): RegulationCheck[] {
  const regulationChecks: RegulationCheck[] = [];
  
  // 建蔽率チェック
  const buildingCoverageRatio = (buildingArea / property.area) * 100;
  regulationChecks.push({
    name: '建蔽率',
    regulationValue: `${property.buildingCoverage}%`,
    plannedValue: `${buildingCoverageRatio.toFixed(1)}%`,
    compliant: buildingCoverageRatio <= property.buildingCoverage
  });
  
  // 容積率チェック
  const floorAreaRatio = (totalFloorArea / property.area) * 100;
  regulationChecks.push({
    name: '容積率',
    regulationValue: `${property.floorAreaRatio}%`,
    plannedValue: `${floorAreaRatio.toFixed(1)}%`,
    compliant: floorAreaRatio <= property.floorAreaRatio
  });
  
  // 高さ制限チェック
  regulationChecks.push({
    name: '高さ制限',
    regulationValue: `${heightLimit.toFixed(1)}m`,
    plannedValue: `${buildingHeight.toFixed(1)}m`,
    compliant: buildingHeight <= heightLimit
  });
  
  // 日影規制チェック（簡略化）
  regulationChecks.push({
    name: '日影規制',
    regulationValue: property.shadowRegulation === 'none' ? 'なし' : 
                     property.shadowRegulation === 'type1' ? '4h/2.5h' : '5h/3h',
    plannedValue: '適合',
    compliant: true // 簡略化のため常に適合としている
  });
  
  return regulationChecks;
}

/**
 * 3Dモデルデータの生成
 * @param property 物件データ
 * @param buildingArea 建築面積
 * @param buildingHeight 建物高さ
 * @returns 3Dモデルデータ
 */
function generateModel3dData(
  property: Property,
  buildingArea: number,
  buildingHeight: number
): Model3DData {
  // 簡易的に敷地形状から建物形状を生成
  let buildingWidth, buildingDepth;
  
  if (property.shapeData?.width && property.shapeData?.depth) {
    // 敷地形状から寸法を取得
    buildingWidth = Math.sqrt(buildingArea * (property.shapeData.width / property.shapeData.depth));
    buildingDepth = buildingArea / buildingWidth;
  } else {
    // デフォルトは正方形に近い形状
    buildingWidth = Math.sqrt(buildingArea);
    buildingDepth = buildingWidth;
  }
  
  // 敷地座標
  const propertyPoints = property.shapeData?.points || [
    { x: 0, y: 0 },
    { x: buildingWidth * 1.2, y: 0 },
    { x: buildingWidth * 1.2, y: buildingDepth * 1.2 },
    { x: 0, y: buildingDepth * 1.2 },
    { x: 0, y: 0 }
  ];
  
  // Three.js形式のモデルデータを作成
  const model3dData: Model3DData = {
    modelType: 'three.js',
    data: {
      building: {
        position: [0, 0, 0],
        dimensions: [buildingWidth, buildingDepth, buildingHeight]
      },
      property: {
        points: propertyPoints.map(point => [point.x, point.y])
      },
      camera: {
        position: [buildingWidth * 2, buildingDepth * 2, buildingHeight * 1.5],
        target: [buildingWidth / 2, buildingDepth / 2, buildingHeight / 2]
      }
    }
  };
  
  return model3dData;
}

/**
 * アセットタイプに基づく容積消化率パラメータを取得
 * @param assetType アセットタイプ
 * @returns 容積消化率（%）
 */
export function getConsumptionRateByAssetType(assetType: AssetType): number {
  // アセットタイプに応じた容積消化率の目安
  switch (assetType) {
    case AssetType.MANSION: // マンション
      return 90; // 例: 90%
    case AssetType.OFFICE: // オフィス
      return 95; // 例: 95%
    case AssetType.WOODEN_APARTMENT: // 木造アパート
      return 85; // 例: 85%
    case AssetType.HOTEL: // ホテル
      return 92; // 例: 92%
    default:
      return 90; // デフォルト: 90%
  }
}

/**
 * アセットタイプに基づくデフォルト財務パラメータを取得
 * @param assetType アセットタイプ
 * @returns 財務パラメータ
 */
export function getDefaultFinancialParamsByAssetType(assetType: AssetType): FinancialParams {
  // アセットタイプに応じたデフォルトの財務パラメータ
  switch (assetType) {
    case AssetType.MANSION: // マンション
      return {
        rentPerSqm: 3500, // 賃料単価 (円/m²/月)
        occupancyRate: 95, // 稼働率 (%)
        managementCostRate: 20, // 管理コスト率 (%)
        constructionCostPerSqm: 380000, // 建設単価 (円/m²)
        rentalPeriod: 35, // 運用期間 (年)
        capRate: 4.5 // 還元利回り (%)
      };
    case AssetType.OFFICE: // オフィス
      return {
        rentPerSqm: 4000, // 賃料単価 (円/m²/月)
        occupancyRate: 90, // 稼働率 (%)
        managementCostRate: 25, // 管理コスト率 (%)
        constructionCostPerSqm: 430000, // 建設単価 (円/m²)
        rentalPeriod: 35, // 運用期間 (年)
        capRate: 4.0 // 還元利回り (%)
      };
    case AssetType.WOODEN_APARTMENT: // 木造アパート
      return {
        rentPerSqm: 2800, // 賃料単価 (円/m²/月)
        occupancyRate: 92, // 稼働率 (%)
        managementCostRate: 18, // 管理コスト率 (%)
        constructionCostPerSqm: 220000, // 建設単価 (円/m²)
        rentalPeriod: 30, // 運用期間 (年)
        capRate: 5.5 // 還元利回り (%)
      };
    case AssetType.HOTEL: // ホテル
      return {
        rentPerSqm: 3800, // 賃料単価 (円/m²/月)
        occupancyRate: 85, // 稼働率 (%)
        managementCostRate: 35, // 管理コスト率 (%)
        constructionCostPerSqm: 420000, // 建設単価 (円/m²)
        rentalPeriod: 30, // 運用期間 (年)
        capRate: 4.2 // 還元利回り (%)
      };
    default:
      return {
        rentPerSqm: 3500,
        occupancyRate: 95,
        managementCostRate: 20,
        constructionCostPerSqm: 380000,
        rentalPeriod: 35,
        capRate: 4.5
      };
  }
}

/**
 * ボリュームチェック結果IDの生成
 * @returns ユニークなID文字列
 */
export function generateVolumeCheckId(): string {
  return `vol_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

/**
 * 収益性試算結果IDの生成
 * @returns ユニークなID文字列
 */
export function generateProfitabilityId(): string {
  return `prof_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

/**
 * シナリオIDの生成
 * @returns ユニークなID文字列
 */
export function generateScenarioId(): string {
  return `scen_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}