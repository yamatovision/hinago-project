"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateScenarioId = exports.validateScenarioRequest = exports.validateProfitabilityId = exports.validateProfitabilityRequest = exports.validateVolumeCheckId = exports.validateVolumeCheckRequest = void 0;
/**
 * 分析機能用バリデーター
 */
var express_validator_1 = require("express-validator");
var types_1 = require("../../types");
var common_validator_1 = require("../../common/validators/common.validator");
/**
 * ボリュームチェック実行リクエストのバリデーション
 */
exports.validateVolumeCheckRequest = [
    (0, express_validator_1.body)('propertyId')
        .isString()
        .withMessage('物件IDは文字列である必要があります')
        .notEmpty()
        .withMessage('物件IDは必須です'),
    (0, express_validator_1.body)('buildingParams.floorHeight')
        .isFloat({ min: 2, max: 10 })
        .withMessage('階高は2m以上10m以下の数値である必要があります'),
    (0, express_validator_1.body)('buildingParams.commonAreaRatio')
        .isFloat({ min: 0, max: 100 })
        .withMessage('共用部率は0%以上100%以下の数値である必要があります'),
    (0, express_validator_1.body)('buildingParams.floors')
        .isInt({ min: 1, max: 100 })
        .withMessage('階数は1以上100以下の整数である必要があります'),
    (0, express_validator_1.body)('buildingParams.roadWidth')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('前面道路幅員は0m以上の数値である必要があります'),
    (0, express_validator_1.body)('buildingParams.assetType')
        .isIn(Object.values(types_1.AssetType))
        .withMessage('有効なアセットタイプを選択してください'),
    // 高度地区（オプション）
    (0, express_validator_1.body)('buildingParams.heightDistrict')
        .optional()
        .isIn(Object.values(types_1.HeightDistrictType))
        .withMessage('有効な高度地区を選択してください'),
    // 北側境界線距離（オプション）
    (0, express_validator_1.body)('buildingParams.northBoundaryDistance')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('北側境界線距離は0m以上の数値である必要があります'),
    // 壁面後退距離（オプション）
    (0, express_validator_1.body)('buildingParams.districtPlanInfo.wallSetbackDistance')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('壁面後退距離は0m以上の数値である必要があります'),
    // 地区計画高さ制限（オプション）
    (0, express_validator_1.body)('buildingParams.districtPlanInfo.maxHeight')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('地区計画高さ制限は0m以上の数値である必要があります'),
    // 地区計画名（壁面後退距離または高さ制限が指定された場合は必須）
    (0, express_validator_1.body)('buildingParams.districtPlanInfo.name')
        .optional()
        .isString()
        .withMessage('地区計画名は文字列である必要があります')
        .custom(function (value, _a) {
        var _b;
        var req = _a.req;
        var districtPlanInfo = ((_b = req.body.buildingParams) === null || _b === void 0 ? void 0 : _b.districtPlanInfo) || {};
        if ((districtPlanInfo.wallSetbackDistance || districtPlanInfo.maxHeight) && !value) {
            throw new Error('地区計画情報を指定する場合、地区計画名は必須です');
        }
        return true;
    })
];
/**
 * ボリュームチェックID取得のバリデーション
 */
exports.validateVolumeCheckId = [
    (0, common_validator_1.validateId)('volumeCheckId')
];
/**
 * 収益性試算実行リクエストのバリデーション
 */
exports.validateProfitabilityRequest = [
    (0, express_validator_1.body)('propertyId')
        .isString()
        .withMessage('物件IDは文字列である必要があります')
        .notEmpty()
        .withMessage('物件IDは必須です'),
    (0, express_validator_1.body)('volumeCheckId')
        .isString()
        .withMessage('ボリュームチェックIDは文字列である必要があります')
        .notEmpty()
        .withMessage('ボリュームチェックIDは必須です'),
    (0, express_validator_1.body)('assetType')
        .isIn(Object.values(types_1.AssetType))
        .withMessage('有効なアセットタイプを選択してください'),
    (0, express_validator_1.body)('financialParams.rentPerSqm')
        .isFloat({ min: 0 })
        .withMessage('賃料単価は0円以上の数値である必要があります'),
    (0, express_validator_1.body)('financialParams.occupancyRate')
        .isFloat({ min: 0, max: 100 })
        .withMessage('稼働率は0%以上100%以下の数値である必要があります'),
    (0, express_validator_1.body)('financialParams.managementCostRate')
        .isFloat({ min: 0, max: 100 })
        .withMessage('管理コスト率は0%以上100%以下の数値である必要があります'),
    (0, express_validator_1.body)('financialParams.constructionCostPerSqm')
        .isFloat({ min: 0 })
        .withMessage('建設単価は0円以上の数値である必要があります'),
    (0, express_validator_1.body)('financialParams.rentalPeriod')
        .isInt({ min: 1, max: 100 })
        .withMessage('運用期間は1年以上100年以下の整数である必要があります'),
    (0, express_validator_1.body)('financialParams.capRate')
        .isFloat({ min: 0, max: 20 })
        .withMessage('還元利回りは0%以上20%以下の数値である必要があります')
];
/**
 * 収益性試算ID取得のバリデーション
 */
exports.validateProfitabilityId = [
    (0, common_validator_1.validateId)('profitabilityId')
];
/**
 * シナリオリクエストのバリデーション
 */
exports.validateScenarioRequest = [
    (0, express_validator_1.body)('propertyId')
        .isString()
        .withMessage('物件IDは文字列である必要があります')
        .notEmpty()
        .withMessage('物件IDは必須です'),
    (0, express_validator_1.body)('volumeCheckId')
        .isString()
        .withMessage('ボリュームチェックIDは文字列である必要があります')
        .notEmpty()
        .withMessage('ボリュームチェックIDは必須です'),
    (0, express_validator_1.body)('name')
        .isString()
        .withMessage('シナリオ名は文字列である必要があります')
        .isLength({ min: 1, max: 100 })
        .withMessage('シナリオ名は1文字以上100文字以下で入力してください'),
    (0, express_validator_1.body)('params.assetType')
        .isIn(Object.values(types_1.AssetType))
        .withMessage('有効なアセットタイプを選択してください'),
    (0, express_validator_1.body)('params.rentPerSqm')
        .isFloat({ min: 0 })
        .withMessage('賃料単価は0円以上の数値である必要があります'),
    (0, express_validator_1.body)('params.occupancyRate')
        .isFloat({ min: 0, max: 100 })
        .withMessage('稼働率は0%以上100%以下の数値である必要があります'),
    (0, express_validator_1.body)('params.managementCostRate')
        .isFloat({ min: 0, max: 100 })
        .withMessage('管理コスト率は0%以上100%以下の数値である必要があります'),
    (0, express_validator_1.body)('params.constructionCostPerSqm')
        .isFloat({ min: 0 })
        .withMessage('建設単価は0円以上の数値である必要があります'),
    (0, express_validator_1.body)('params.rentalPeriod')
        .isInt({ min: 1, max: 100 })
        .withMessage('運用期間は1年以上100年以下の整数である必要があります'),
    (0, express_validator_1.body)('params.capRate')
        .isFloat({ min: 0, max: 20 })
        .withMessage('還元利回りは0%以上20%以下の数値である必要があります')
];
/**
 * シナリオID取得のバリデーション
 */
exports.validateScenarioId = [
    (0, common_validator_1.validateId)('scenarioId')
];
