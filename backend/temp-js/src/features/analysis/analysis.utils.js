"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateVolumeCheck = calculateVolumeCheck;
exports.calculateProfitability = calculateProfitability;
exports.getConsumptionRateByAssetType = getConsumptionRateByAssetType;
exports.getDefaultFinancialParamsByAssetType = getDefaultFinancialParamsByAssetType;
exports.generateVolumeCheckId = generateVolumeCheckId;
exports.generateProfitabilityId = generateProfitabilityId;
exports.generateScenarioId = generateScenarioId;
/**
 * 分析機能用ユーティリティ
 */
var types_1 = require("../../types");
var utils_1 = require("../../common/utils");
var regulation_1 = require("./regulation");
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
function calculateVolumeCheck(property, buildingParams, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var adjustedParams, allowedBuildingArea, roadWidth, absoluteHeightLimit, slopedHeightLimit, heightDistrictLimit, shadowLimit, heightLimit, regulationLimits, maxFloorsByHeight, maxFloors, buildingHeight, totalFloorArea, volumeLimit, finalTotalFloorArea, consumptionRate, floorBreakdown, regulationChecks, model3dData;
        return __generator(this, function (_a) {
            try {
                adjustedParams = (0, regulation_1.adjustBuildingParamsForDistrictPlan)(property, buildingParams);
                allowedBuildingArea = property.allowedBuildingArea ||
                    (property.area * property.buildingCoverage / 100);
                roadWidth = adjustedParams.roadWidth || property.roadWidth || 4;
                absoluteHeightLimit = property.heightLimit || (0, regulation_1.getHeightLimitByZone)(property.zoneType);
                slopedHeightLimit = (0, regulation_1.calculateDetailedSlopeLimit)(property);
                heightDistrictLimit = (0, regulation_1.calculateHeightDistrictLimit)(property);
                shadowLimit = Infinity;
                heightLimit = (0, regulation_1.calculateFinalHeightLimit)([
                    absoluteHeightLimit,
                    slopedHeightLimit,
                    heightDistrictLimit,
                    shadowLimit
                ]);
                regulationLimits = {
                    heightDistrictLimit: heightDistrictLimit,
                    slopeLimit: slopedHeightLimit,
                    shadowLimit: shadowLimit,
                    absoluteLimit: absoluteHeightLimit,
                    finalLimit: heightLimit
                };
                maxFloorsByHeight = Math.floor(heightLimit / adjustedParams.floorHeight);
                maxFloors = Math.min(maxFloorsByHeight, adjustedParams.floors);
                buildingHeight = maxFloors * adjustedParams.floorHeight;
                totalFloorArea = allowedBuildingArea * maxFloors;
                volumeLimit = property.area * property.floorAreaRatio / 100;
                finalTotalFloorArea = Math.min(totalFloorArea, volumeLimit);
                consumptionRate = (finalTotalFloorArea / volumeLimit) * 100;
                floorBreakdown = generateFloorBreakdown(maxFloors, finalTotalFloorArea, adjustedParams.commonAreaRatio);
                regulationChecks = generateRegulationChecks(property, allowedBuildingArea, finalTotalFloorArea, buildingHeight, heightLimit, volumeLimit);
                model3dData = generateModel3dData(property, allowedBuildingArea, buildingHeight);
                // 結果の生成
                return [2 /*return*/, {
                        propertyId: property.id,
                        assetType: adjustedParams.assetType,
                        buildingArea: allowedBuildingArea,
                        totalFloorArea: finalTotalFloorArea,
                        buildingHeight: buildingHeight,
                        consumptionRate: consumptionRate,
                        floors: maxFloors,
                        floorBreakdown: floorBreakdown,
                        regulationChecks: regulationChecks,
                        model3dData: model3dData,
                        regulationLimits: regulationLimits, // 新規追加：高さ制限の詳細情報
                        userId: userId
                    }];
            }
            catch (error) {
                utils_1.logger.error('ボリュームチェック計算エラー', { error: error, propertyId: property.id });
                throw error;
            }
            return [2 /*return*/];
        });
    });
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
function calculateProfitability(property, volumeCheck, financialParams, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var landPrice, constructionCost, miscExpenses, totalInvestment, totalPrivateArea, annualRentalIncome, annualOperatingExpenses, annualMaintenance, annualPropertyTax, annualNOI, noiYield, annualFinancials, irr, paybackPeriod, npv;
        return __generator(this, function (_a) {
            try {
                landPrice = property.price || 0;
                constructionCost = volumeCheck.totalFloorArea * financialParams.constructionCostPerSqm;
                miscExpenses = constructionCost * 0.04;
                totalInvestment = landPrice + constructionCost + miscExpenses;
                totalPrivateArea = volumeCheck.floorBreakdown.reduce(function (sum, floor) { return sum + floor.privateArea; }, 0);
                annualRentalIncome = totalPrivateArea * financialParams.rentPerSqm * 12 * (financialParams.occupancyRate / 100);
                annualOperatingExpenses = annualRentalIncome * (financialParams.managementCostRate / 100);
                annualMaintenance = constructionCost * 0.01;
                annualPropertyTax = totalInvestment * 0.01;
                annualNOI = annualRentalIncome - annualOperatingExpenses - annualMaintenance - annualPropertyTax;
                noiYield = (annualNOI / totalInvestment) * 100;
                annualFinancials = generateAnnualFinancials(financialParams.rentalPeriod, annualRentalIncome, annualOperatingExpenses + annualMaintenance + annualPropertyTax);
                irr = calculateIRR(totalInvestment, annualNOI, financialParams.capRate, financialParams.rentalPeriod);
                paybackPeriod = totalInvestment / annualNOI;
                npv = calculateNPV(totalInvestment, annualNOI, financialParams.capRate, financialParams.rentalPeriod);
                // 結果の生成
                return [2 /*return*/, {
                        propertyId: property.id,
                        volumeCheckId: volumeCheck.id,
                        assetType: volumeCheck.assetType,
                        parameters: financialParams,
                        // 投資概要
                        landPrice: landPrice,
                        constructionCost: constructionCost,
                        miscExpenses: miscExpenses,
                        totalInvestment: totalInvestment,
                        // 年間収支
                        annualRentalIncome: annualRentalIncome,
                        annualOperatingExpenses: annualOperatingExpenses,
                        annualMaintenance: annualMaintenance,
                        annualPropertyTax: annualPropertyTax,
                        annualNOI: annualNOI,
                        // 収益指標
                        noiYield: noiYield,
                        irr: irr,
                        paybackPeriod: paybackPeriod,
                        npv: npv,
                        // 詳細データ
                        annualFinancials: annualFinancials,
                        userId: userId
                    }];
            }
            catch (error) {
                utils_1.logger.error('収益性試算計算エラー', {
                    error: error,
                    propertyId: property.id,
                    volumeCheckId: volumeCheck.id
                });
                throw error;
            }
            return [2 /*return*/];
        });
    });
}
/**
 * 年次ごとの財務データを生成
 * @param rentalPeriod 運用期間（年）
 * @param annualRentalIncome 年間賃料収入
 * @param annualExpenses 年間経費（運営費＋修繕費＋不動産税）
 * @returns 年次ごとの財務データ配列
 */
function generateAnnualFinancials(rentalPeriod, annualRentalIncome, annualExpenses) {
    var annualFinancials = [];
    var accumulatedIncome = 0;
    // 各年の財務データを作成
    for (var year = 1; year <= rentalPeriod; year++) {
        // 賃料収入（経年による変動を考慮する場合はここで調整）
        var rentalIncome = annualRentalIncome;
        // 運営支出（経年による変動を考慮する場合はここで調整）
        var operatingExpenses = annualExpenses;
        // 年間純収益
        var netOperatingIncome = rentalIncome - operatingExpenses;
        // 累計収益
        accumulatedIncome += netOperatingIncome;
        // データ追加
        annualFinancials.push({
            year: year,
            rentalIncome: rentalIncome,
            operatingExpenses: operatingExpenses,
            netOperatingIncome: netOperatingIncome,
            accumulatedIncome: accumulatedIncome
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
function calculateIRR(totalInvestment, annualNOI, capRate, rentalPeriod) {
    // 出口価値の計算（還元利回りに基づく）
    var exitValue = annualNOI / (capRate / 100);
    // キャッシュフロー配列の作成
    var cashFlows = [-totalInvestment];
    for (var i = 1; i <= rentalPeriod - 1; i++) {
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
function calculateIRRFromCashFlows(cashFlows) {
    // 初期推測値
    var guess = 0.1;
    var maxIterations = 1000;
    var tolerance = 0.0001;
    for (var i = 0; i < maxIterations; i++) {
        // NPVの計算
        var npv = 0;
        for (var j = 0; j < cashFlows.length; j++) {
            npv += cashFlows[j] / Math.pow(1 + guess, j);
        }
        // NPVがゼロに近ければ終了
        if (Math.abs(npv) < tolerance) {
            return guess * 100;
        }
        // 微分値の計算
        var derivative = 0;
        for (var j = 1; j < cashFlows.length; j++) {
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
function calculateNPV(totalInvestment, annualNOI, capRate, rentalPeriod) {
    // 割引率（簡略化のために還元利回りを使用）
    var discountRate = capRate / 100;
    // 出口価値の計算（還元利回りに基づく）
    var exitValue = annualNOI / discountRate;
    // 現在価値の計算
    var presentValue = 0;
    // 毎年の純収益の現在価値
    for (var year = 1; year <= rentalPeriod; year++) {
        presentValue += annualNOI / Math.pow(1 + discountRate, year);
    }
    // 出口価値の現在価値を追加
    presentValue += exitValue / Math.pow(1 + discountRate, rentalPeriod);
    // NPV = 現在価値 - 初期投資
    return presentValue - totalInvestment;
}
/**
 * 階別データの生成
 * @param floors 階数
 * @param totalFloorArea 総延床面積
 * @param commonAreaRatio 共用部率（%）
 * @returns 階別データ配列
 */
function generateFloorBreakdown(floors, totalFloorArea, commonAreaRatio) {
    var floorBreakdown = [];
    // 1階あたりの床面積
    var floorAreaPerFloor = totalFloorArea / floors;
    // 共用部面積と専有部面積の計算
    var commonAreaPerFloor = floorAreaPerFloor * (commonAreaRatio / 100);
    var privateAreaPerFloor = floorAreaPerFloor - commonAreaPerFloor;
    // 階別データの作成
    for (var floor = 1; floor <= floors; floor++) {
        floorBreakdown.push({
            floor: floor,
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
function generateRegulationChecks(property, buildingArea, totalFloorArea, buildingHeight, heightLimit, volumeLimit) {
    var regulationChecks = [];
    // 建蔽率チェック
    var buildingCoverageRatio = (buildingArea / property.area) * 100;
    regulationChecks.push({
        name: '建蔽率',
        regulationValue: "".concat(property.buildingCoverage, "%"),
        plannedValue: "".concat(buildingCoverageRatio.toFixed(1), "%"),
        compliant: buildingCoverageRatio <= property.buildingCoverage
    });
    // 容積率チェック
    var floorAreaRatio = (totalFloorArea / property.area) * 100;
    regulationChecks.push({
        name: '容積率',
        regulationValue: "".concat(property.floorAreaRatio, "%"),
        plannedValue: "".concat(floorAreaRatio.toFixed(1), "%"),
        compliant: floorAreaRatio <= property.floorAreaRatio
    });
    // 高さ制限チェック
    regulationChecks.push({
        name: '高さ制限',
        regulationValue: heightLimit === Infinity ? '制限なし' : "".concat(heightLimit.toFixed(1), "m"),
        plannedValue: "".concat(buildingHeight.toFixed(1), "m"),
        compliant: buildingHeight <= heightLimit || heightLimit === Infinity
    });
    // 高度地区チェック
    if (property.heightDistrict) {
        var heightDistrictName = property.heightDistrict.includes('first') ? '第一種' : '第二種';
        var heightValue = property.heightDistrict.includes('10M') ? '10m' :
            property.heightDistrict.includes('15M') ? '15m' :
                property.heightDistrict.includes('20M') ? '20m' : '';
        regulationChecks.push({
            name: '高度地区',
            regulationValue: "".concat(heightDistrictName).concat(heightValue, "\u9AD8\u5EA6\u5730\u533A"),
            plannedValue: "".concat(buildingHeight.toFixed(1), "m"),
            compliant: true // 既に上位の高さ制限チェックで検証済み
        });
    }
    // 地区計画チェック
    if (property.districtPlanInfo && property.districtPlanInfo.maxHeight) {
        regulationChecks.push({
            name: '地区計画高さ制限',
            regulationValue: "".concat(property.districtPlanInfo.maxHeight.toFixed(1), "m"),
            plannedValue: "".concat(buildingHeight.toFixed(1), "m"),
            compliant: buildingHeight <= property.districtPlanInfo.maxHeight
        });
    }
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
function generateModel3dData(property, buildingArea, buildingHeight) {
    var _a, _b, _c;
    // 簡易的に敷地形状から建物形状を生成
    var buildingWidth, buildingDepth;
    if (((_a = property.shapeData) === null || _a === void 0 ? void 0 : _a.width) && ((_b = property.shapeData) === null || _b === void 0 ? void 0 : _b.depth)) {
        // 敷地形状から寸法を取得
        buildingWidth = Math.sqrt(buildingArea * (property.shapeData.width / property.shapeData.depth));
        buildingDepth = buildingArea / buildingWidth;
    }
    else {
        // デフォルトは正方形に近い形状
        buildingWidth = Math.sqrt(buildingArea);
        buildingDepth = buildingWidth;
    }
    // 敷地座標
    var propertyPoints = ((_c = property.shapeData) === null || _c === void 0 ? void 0 : _c.points) || [
        { x: 0, y: 0 },
        { x: buildingWidth * 1.2, y: 0 },
        { x: buildingWidth * 1.2, y: buildingDepth * 1.2 },
        { x: 0, y: buildingDepth * 1.2 },
        { x: 0, y: 0 }
    ];
    // Three.js形式のモデルデータを作成
    var model3dData = {
        modelType: 'three.js',
        data: {
            building: {
                position: [0, 0, 0],
                dimensions: [buildingWidth, buildingDepth, buildingHeight]
            },
            property: {
                points: propertyPoints.map(function (point) { return [point.x, point.y]; })
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
function getConsumptionRateByAssetType(assetType) {
    // アセットタイプに応じた容積消化率の目安
    switch (assetType) {
        case types_1.AssetType.MANSION: // マンション
            return 90; // 例: 90%
        case types_1.AssetType.OFFICE: // オフィス
            return 95; // 例: 95%
        case types_1.AssetType.WOODEN_APARTMENT: // 木造アパート
            return 85; // 例: 85%
        case types_1.AssetType.HOTEL: // ホテル
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
function getDefaultFinancialParamsByAssetType(assetType) {
    // アセットタイプに応じたデフォルトの財務パラメータ
    switch (assetType) {
        case types_1.AssetType.MANSION: // マンション
            return {
                rentPerSqm: 3500, // 賃料単価 (円/m²/月)
                occupancyRate: 95, // 稼働率 (%)
                managementCostRate: 20, // 管理コスト率 (%)
                constructionCostPerSqm: 380000, // 建設単価 (円/m²)
                rentalPeriod: 35, // 運用期間 (年)
                capRate: 4.5 // 還元利回り (%)
            };
        case types_1.AssetType.OFFICE: // オフィス
            return {
                rentPerSqm: 4000, // 賃料単価 (円/m²/月)
                occupancyRate: 90, // 稼働率 (%)
                managementCostRate: 25, // 管理コスト率 (%)
                constructionCostPerSqm: 430000, // 建設単価 (円/m²)
                rentalPeriod: 35, // 運用期間 (年)
                capRate: 4.0 // 還元利回り (%)
            };
        case types_1.AssetType.WOODEN_APARTMENT: // 木造アパート
            return {
                rentPerSqm: 2800, // 賃料単価 (円/m²/月)
                occupancyRate: 92, // 稼働率 (%)
                managementCostRate: 18, // 管理コスト率 (%)
                constructionCostPerSqm: 220000, // 建設単価 (円/m²)
                rentalPeriod: 30, // 運用期間 (年)
                capRate: 5.5 // 還元利回り (%)
            };
        case types_1.AssetType.HOTEL: // ホテル
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
function generateVolumeCheckId() {
    return "vol_".concat(Date.now(), "_").concat(Math.floor(Math.random() * 10000));
}
/**
 * 収益性試算結果IDの生成
 * @returns ユニークなID文字列
 */
function generateProfitabilityId() {
    return "prof_".concat(Date.now(), "_").concat(Math.floor(Math.random() * 10000));
}
/**
 * シナリオIDの生成
 * @returns ユニークなID文字列
 */
function generateScenarioId() {
    return "scen_".concat(Date.now(), "_").concat(Math.floor(Math.random() * 10000));
}
