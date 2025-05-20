/**
 * 分析機能用バリデーター
 */
import { body, param } from 'express-validator';
import { AssetType, HeightDistrictType, ShadowRegulationType } from '../../types';
import { validateId } from '../../common/validators/common.validator';

/**
 * ボリュームチェック実行リクエストのバリデーション
 */
export const validateVolumeCheckRequest = [
  body('propertyId')
    .isString()
    .withMessage('物件IDは文字列である必要があります')
    .notEmpty()
    .withMessage('物件IDは必須です'),
  
  body('buildingParams.floorHeight')
    .isFloat({ min: 2, max: 10 })
    .withMessage('階高は2m以上10m以下の数値である必要があります'),
    
  body('buildingParams.commonAreaRatio')
    .isFloat({ min: 0, max: 100 })
    .withMessage('共用部率は0%以上100%以下の数値である必要があります'),
    
  body('buildingParams.floors')
    .isInt({ min: 1, max: 100 })
    .withMessage('階数は1以上100以下の整数である必要があります'),
    
  body('buildingParams.roadWidth')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('前面道路幅員は0m以上の数値である必要があります'),
    
  body('buildingParams.assetType')
    .isIn(Object.values(AssetType))
    .withMessage('有効なアセットタイプを選択してください'),
    
  // 高度地区（オプション）
  body('buildingParams.heightDistrict')
    .optional()
    .isIn(Object.values(HeightDistrictType))
    .withMessage('有効な高度地区を選択してください'),
    
  // 北側境界線距離（オプション）
  body('buildingParams.northBoundaryDistance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('北側境界線距離は0m以上の数値である必要があります'),
    
  // 壁面後退距離（オプション）
  body('buildingParams.districtPlanInfo.wallSetbackDistance')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('壁面後退距離は0m以上の数値である必要があります'),
    
  // 地区計画高さ制限（オプション）
  body('buildingParams.districtPlanInfo.maxHeight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('地区計画高さ制限は0m以上の数値である必要があります'),
    
  // 地区計画名（壁面後退距離または高さ制限が指定された場合は必須）
  body('buildingParams.districtPlanInfo.name')
    .optional()
    .isString()
    .withMessage('地区計画名は文字列である必要があります')
    .custom((value, { req }) => {
      const districtPlanInfo = req.body.buildingParams?.districtPlanInfo || {};
      if ((districtPlanInfo.wallSetbackDistance || districtPlanInfo.maxHeight) && !value) {
        throw new Error('地区計画情報を指定する場合、地区計画名は必須です');
      }
      return true;
    })
];

/**
 * ボリュームチェックID取得のバリデーション
 */
export const validateVolumeCheckId = [
  validateId('volumeCheckId')
];

/**
 * 収益性試算実行リクエストのバリデーション
 */
export const validateProfitabilityRequest = [
  body('propertyId')
    .isString()
    .withMessage('物件IDは文字列である必要があります')
    .notEmpty()
    .withMessage('物件IDは必須です'),
    
  body('volumeCheckId')
    .isString()
    .withMessage('ボリュームチェックIDは文字列である必要があります')
    .notEmpty()
    .withMessage('ボリュームチェックIDは必須です'),
    
  body('assetType')
    .isIn(Object.values(AssetType))
    .withMessage('有効なアセットタイプを選択してください'),
    
  body('financialParams.rentPerSqm')
    .isFloat({ min: 0 })
    .withMessage('賃料単価は0円以上の数値である必要があります'),
    
  body('financialParams.occupancyRate')
    .isFloat({ min: 0, max: 100 })
    .withMessage('稼働率は0%以上100%以下の数値である必要があります'),
    
  body('financialParams.managementCostRate')
    .isFloat({ min: 0, max: 100 })
    .withMessage('管理コスト率は0%以上100%以下の数値である必要があります'),
    
  body('financialParams.constructionCostPerSqm')
    .isFloat({ min: 0 })
    .withMessage('建設単価は0円以上の数値である必要があります'),
    
  body('financialParams.rentalPeriod')
    .isInt({ min: 1, max: 100 })
    .withMessage('運用期間は1年以上100年以下の整数である必要があります'),
    
  body('financialParams.capRate')
    .isFloat({ min: 0, max: 20 })
    .withMessage('還元利回りは0%以上20%以下の数値である必要があります')
];

/**
 * 収益性試算ID取得のバリデーション
 */
export const validateProfitabilityId = [
  validateId('profitabilityId')
];

/**
 * シナリオリクエストのバリデーション
 */
export const validateScenarioRequest = [
  body('propertyId')
    .isString()
    .withMessage('物件IDは文字列である必要があります')
    .notEmpty()
    .withMessage('物件IDは必須です'),
    
  body('volumeCheckId')
    .isString()
    .withMessage('ボリュームチェックIDは文字列である必要があります')
    .notEmpty()
    .withMessage('ボリュームチェックIDは必須です'),
    
  body('name')
    .isString()
    .withMessage('シナリオ名は文字列である必要があります')
    .isLength({ min: 1, max: 100 })
    .withMessage('シナリオ名は1文字以上100文字以下で入力してください'),
    
  body('params.assetType')
    .isIn(Object.values(AssetType))
    .withMessage('有効なアセットタイプを選択してください'),
    
  body('params.rentPerSqm')
    .isFloat({ min: 0 })
    .withMessage('賃料単価は0円以上の数値である必要があります'),
    
  body('params.occupancyRate')
    .isFloat({ min: 0, max: 100 })
    .withMessage('稼働率は0%以上100%以下の数値である必要があります'),
    
  body('params.managementCostRate')
    .isFloat({ min: 0, max: 100 })
    .withMessage('管理コスト率は0%以上100%以下の数値である必要があります'),
    
  body('params.constructionCostPerSqm')
    .isFloat({ min: 0 })
    .withMessage('建設単価は0円以上の数値である必要があります'),
    
  body('params.rentalPeriod')
    .isInt({ min: 1, max: 100 })
    .withMessage('運用期間は1年以上100年以下の整数である必要があります'),
    
  body('params.capRate')
    .isFloat({ min: 0, max: 20 })
    .withMessage('還元利回りは0%以上20%以下の数値である必要があります')
];

/**
 * シナリオID取得のバリデーション
 */
export const validateScenarioId = [
  validateId('scenarioId')
];