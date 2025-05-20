"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
/**
 * 建築規制計算機能のテスト
 * - 高度地区
 * - 斜線制限
 * - 地区計画対応
 */
var supertest_1 = require("supertest");
var app_1 = require("../../../src/app");
var config_1 = require("../../../src/config");
var db_test_helper_1 = require("../../utils/db-test-helper");
var test_auth_helper_1 = require("../../utils/test-auth-helper");
var types_1 = require("../../../src/types");
// APIのベースURL
var baseUrl = config_1.appConfig.app.apiPrefix;
// テスト実行前のセットアップ
beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, db_test_helper_1.connectDB)()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
// テスト実行後のクリーンアップ
afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, db_test_helper_1.disconnectDB)()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
describe('建築規制計算機能のテスト', function () {
    // テスト用の物件データ
    var testPropertyData = {
        name: '規制テスト物件',
        address: '福岡県福岡市中央区天神2-2-2',
        area: 500,
        zoneType: types_1.ZoneType.CATEGORY9, // 商業地域
        fireZone: types_1.FireZoneType.FIRE, // 防火地域
        shadowRegulation: types_1.ShadowRegulationType.NONE,
        buildingCoverage: 80,
        floorAreaRatio: 400,
        price: 200000000,
        status: types_1.PropertyStatus.ACTIVE,
        notes: '規制テスト用',
        shapeData: {
            points: [
                { x: 0, y: 0 },
                { x: 20, y: 0 },
                { x: 20, y: 25 },
                { x: 0, y: 25 }
            ],
            width: 20,
            depth: 25
        }
    };
    // テスト用のボリュームチェックパラメータ（基本）
    var testBuildingParams = {
        floorHeight: 3.2,
        commonAreaRatio: 15,
        floors: 9,
        roadWidth: 6,
        assetType: types_1.AssetType.MANSION
    };
    var testPropertyId;
    var authHeader;
    // 各テスト前に認証トークンを取得
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        var auth, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, test_auth_helper_1.getTestAuth)()];
                case 1:
                    auth = _a.sent();
                    authHeader = auth.authHeader;
                    return [4 /*yield*/, (0, supertest_1.default)(app_1.default)
                            .post("".concat(baseUrl, "/properties"))
                            .set('Authorization', authHeader)
                            .send(testPropertyData)];
                case 2:
                    res = _a.sent();
                    testPropertyId = res.body.data.id;
                    return [2 /*return*/];
            }
        });
    }); });
    // 高度地区のテスト
    describe('高度地区', function () {
        it('第一種10M高度地区のテスト', function () { return __awaiter(void 0, void 0, void 0, function () {
            var updateRes, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, supertest_1.default)(app_1.default)
                            .put("".concat(baseUrl, "/properties/").concat(testPropertyId))
                            .set('Authorization', authHeader)
                            .send({
                            heightDistrict: types_1.HeightDistrictType.FIRST_10M
                        })];
                    case 1:
                        updateRes = _a.sent();
                        expect(updateRes.status).toBe(200);
                        return [4 /*yield*/, (0, supertest_1.default)(app_1.default)
                                .post("".concat(baseUrl, "/analysis/volume-check"))
                                .set('Authorization', authHeader)
                                .send({
                                propertyId: testPropertyId,
                                buildingParams: __assign(__assign({}, testBuildingParams), { floors: 5 // 階数を増やしても高さ制限により上限が設定される
                                 })
                            })];
                    case 2:
                        res = _a.sent();
                        expect(res.status).toBe(201);
                        expect(res.body.success).toBe(true);
                        expect(res.body.data).toHaveProperty('regulationLimits');
                        // 高度地区による高さ制限が反映されていることを確認
                        expect(res.body.data.regulationLimits.heightDistrictLimit).toBe(10);
                        // 最終的な高さ制限が高度地区の値になることを確認
                        expect(res.body.data.regulationLimits.finalLimit).toBe(10);
                        // 建物高さが高度地区の制限以下になることを確認
                        expect(res.body.data.buildingHeight).toBeLessThanOrEqual(10);
                        return [2 /*return*/];
                }
            });
        }); });
        it('北側境界線までの距離を考慮した第二種高度地区のテスト', function () { return __awaiter(void 0, void 0, void 0, function () {
            var updateRes, res, expectedHeight;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, supertest_1.default)(app_1.default)
                            .put("".concat(baseUrl, "/properties/").concat(testPropertyId))
                            .set('Authorization', authHeader)
                            .send({
                            heightDistrict: types_1.HeightDistrictType.SECOND_15M,
                            northBoundaryDistance: 8 // 北側境界線距離 8m
                        })];
                    case 1:
                        updateRes = _a.sent();
                        expect(updateRes.status).toBe(200);
                        return [4 /*yield*/, (0, supertest_1.default)(app_1.default)
                                .post("".concat(baseUrl, "/analysis/volume-check"))
                                .set('Authorization', authHeader)
                                .send({
                                propertyId: testPropertyId,
                                buildingParams: testBuildingParams
                            })];
                    case 2:
                        res = _a.sent();
                        expect(res.status).toBe(201);
                        expect(res.body.success).toBe(true);
                        expect(res.body.data).toHaveProperty('regulationLimits');
                        expectedHeight = 15;
                        // 高度地区による高さ制限が反映されていることを確認
                        expect(res.body.data.regulationLimits.heightDistrictLimit).toBe(expectedHeight);
                        // 建物高さが高度地区の制限以下になることを確認
                        expect(res.body.data.buildingHeight).toBeLessThanOrEqual(expectedHeight);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    // 斜線制限のテスト
    describe('斜線制限', function () {
        it('道路斜線制限のテスト', function () { return __awaiter(void 0, void 0, void 0, function () {
            var updateRes, res, expectedSlopeLimit, wideRoadRes, wideRoadSlopeLimit;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, supertest_1.default)(app_1.default)
                            .put("".concat(baseUrl, "/properties/").concat(testPropertyId))
                            .set('Authorization', authHeader)
                            .send({
                            heightDistrict: types_1.HeightDistrictType.NONE
                        })];
                    case 1:
                        updateRes = _a.sent();
                        expect(updateRes.status).toBe(200);
                        return [4 /*yield*/, (0, supertest_1.default)(app_1.default)
                                .post("".concat(baseUrl, "/analysis/volume-check"))
                                .set('Authorization', authHeader)
                                .send({
                                propertyId: testPropertyId,
                                buildingParams: __assign(__assign({}, testBuildingParams), { roadWidth: 4 // 狭い道路幅員
                                 })
                            })];
                    case 2:
                        res = _a.sent();
                        expect(res.status).toBe(201);
                        expect(res.body.success).toBe(true);
                        expect(res.body.data).toHaveProperty('regulationLimits');
                        expectedSlopeLimit = 4 * 2.0;
                        // 斜線制限による高さ制限が反映されていることを確認（許容誤差0.1m）
                        expect(res.body.data.regulationLimits.slopeLimit).toBeCloseTo(expectedSlopeLimit, 1);
                        return [4 /*yield*/, (0, supertest_1.default)(app_1.default)
                                .post("".concat(baseUrl, "/analysis/volume-check"))
                                .set('Authorization', authHeader)
                                .send({
                                propertyId: testPropertyId,
                                buildingParams: __assign(__assign({}, testBuildingParams), { roadWidth: 12 // 広い道路幅員
                                 })
                            })];
                    case 3:
                        wideRoadRes = _a.sent();
                        expect(wideRoadRes.status).toBe(201);
                        expect(wideRoadRes.body.success).toBe(true);
                        wideRoadSlopeLimit = wideRoadRes.body.data.regulationLimits.slopeLimit;
                        expect(wideRoadSlopeLimit).toBeGreaterThan(res.body.data.regulationLimits.slopeLimit);
                        return [2 /*return*/];
                }
            });
        }); });
        it('用途地域別の斜線制限の違いをテスト', function () { return __awaiter(void 0, void 0, void 0, function () {
            var updateRes, residentialRes, residentialSlopeLimit, updateCommercialRes, commercialRes, commercialSlopeLimit;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, supertest_1.default)(app_1.default)
                            .put("".concat(baseUrl, "/properties/").concat(testPropertyId))
                            .set('Authorization', authHeader)
                            .send({
                            zoneType: types_1.ZoneType.CATEGORY5, // 第一種住居地域
                            heightDistrict: types_1.HeightDistrictType.NONE
                        })];
                    case 1:
                        updateRes = _a.sent();
                        expect(updateRes.status).toBe(200);
                        return [4 /*yield*/, (0, supertest_1.default)(app_1.default)
                                .post("".concat(baseUrl, "/analysis/volume-check"))
                                .set('Authorization', authHeader)
                                .send({
                                propertyId: testPropertyId,
                                buildingParams: __assign(__assign({}, testBuildingParams), { roadWidth: 8 // 一定の道路幅員
                                 })
                            })];
                    case 2:
                        residentialRes = _a.sent();
                        expect(residentialRes.status).toBe(201);
                        expect(residentialRes.body.success).toBe(true);
                        residentialSlopeLimit = residentialRes.body.data.regulationLimits.slopeLimit;
                        return [4 /*yield*/, (0, supertest_1.default)(app_1.default)
                                .put("".concat(baseUrl, "/properties/").concat(testPropertyId))
                                .set('Authorization', authHeader)
                                .send({
                                zoneType: types_1.ZoneType.CATEGORY9, // 商業地域
                                heightDistrict: types_1.HeightDistrictType.NONE
                            })];
                    case 3:
                        updateCommercialRes = _a.sent();
                        expect(updateCommercialRes.status).toBe(200);
                        return [4 /*yield*/, (0, supertest_1.default)(app_1.default)
                                .post("".concat(baseUrl, "/analysis/volume-check"))
                                .set('Authorization', authHeader)
                                .send({
                                propertyId: testPropertyId,
                                buildingParams: __assign(__assign({}, testBuildingParams), { roadWidth: 8 // 同じ道路幅員
                                 })
                            })];
                    case 4:
                        commercialRes = _a.sent();
                        expect(commercialRes.status).toBe(201);
                        expect(commercialRes.body.success).toBe(true);
                        commercialSlopeLimit = commercialRes.body.data.regulationLimits.slopeLimit;
                        // 商業系の方が住居系よりも斜線制限が緩い（高い建物が建てられる）ことを確認
                        expect(commercialSlopeLimit).toBeGreaterThan(residentialSlopeLimit);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    // 地区計画対応のテスト
    describe('地区計画対応', function () {
        it('壁面後退距離による敷地面積の減少をテスト', function () { return __awaiter(void 0, void 0, void 0, function () {
            var updateRes, withSetbackRes, updateNoSetbackRes, withoutSetbackRes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, supertest_1.default)(app_1.default)
                            .put("".concat(baseUrl, "/properties/").concat(testPropertyId))
                            .set('Authorization', authHeader)
                            .send({
                            districtPlanInfo: {
                                name: 'テスト地区計画',
                                wallSetbackDistance: 2.0 // 2m後退
                            }
                        })];
                    case 1:
                        updateRes = _a.sent();
                        expect(updateRes.status).toBe(200);
                        return [4 /*yield*/, (0, supertest_1.default)(app_1.default)
                                .post("".concat(baseUrl, "/analysis/volume-check"))
                                .set('Authorization', authHeader)
                                .send({
                                propertyId: testPropertyId,
                                buildingParams: testBuildingParams
                            })];
                    case 2:
                        withSetbackRes = _a.sent();
                        expect(withSetbackRes.status).toBe(201);
                        expect(withSetbackRes.body.success).toBe(true);
                        return [4 /*yield*/, (0, supertest_1.default)(app_1.default)
                                .put("".concat(baseUrl, "/properties/").concat(testPropertyId))
                                .set('Authorization', authHeader)
                                .send({
                                districtPlanInfo: null
                            })];
                    case 3:
                        updateNoSetbackRes = _a.sent();
                        expect(updateNoSetbackRes.status).toBe(200);
                        return [4 /*yield*/, (0, supertest_1.default)(app_1.default)
                                .post("".concat(baseUrl, "/analysis/volume-check"))
                                .set('Authorization', authHeader)
                                .send({
                                propertyId: testPropertyId,
                                buildingParams: testBuildingParams
                            })];
                    case 4:
                        withoutSetbackRes = _a.sent();
                        expect(withoutSetbackRes.status).toBe(201);
                        expect(withoutSetbackRes.body.success).toBe(true);
                        // 壁面後退ありの方が建築面積が小さくなることを確認
                        expect(withSetbackRes.body.data.buildingArea).toBeLessThan(withoutSetbackRes.body.data.buildingArea);
                        // 壁面後退ありの方が延床面積も小さくなることを確認
                        expect(withSetbackRes.body.data.totalFloorArea).toBeLessThan(withoutSetbackRes.body.data.totalFloorArea);
                        return [2 /*return*/];
                }
            });
        }); });
        it('地区計画の高さ制限をテスト', function () { return __awaiter(void 0, void 0, void 0, function () {
            var updateRes, res, heightCheck;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, supertest_1.default)(app_1.default)
                            .put("".concat(baseUrl, "/properties/").concat(testPropertyId))
                            .set('Authorization', authHeader)
                            .send({
                            districtPlanInfo: {
                                name: 'テスト地区計画',
                                maxHeight: 15.0 // 15m高さ制限
                            }
                        })];
                    case 1:
                        updateRes = _a.sent();
                        expect(updateRes.status).toBe(200);
                        return [4 /*yield*/, (0, supertest_1.default)(app_1.default)
                                .post("".concat(baseUrl, "/analysis/volume-check"))
                                .set('Authorization', authHeader)
                                .send({
                                propertyId: testPropertyId,
                                buildingParams: __assign(__assign({}, testBuildingParams), { floors: 10 // 高い階数（無制限なら32m程度になる）
                                 })
                            })];
                    case 2:
                        res = _a.sent();
                        expect(res.status).toBe(201);
                        expect(res.body.success).toBe(true);
                        // 建物高さが地区計画の高さ制限以下になることを確認
                        expect(res.body.data.buildingHeight).toBeLessThanOrEqual(15);
                        heightCheck = res.body.data.regulationChecks.find(function (check) { return check.name === '地区計画高さ制限'; });
                        expect(heightCheck).toBeDefined();
                        expect(heightCheck === null || heightCheck === void 0 ? void 0 : heightCheck.regulationValue).toContain('15.0m');
                        expect(heightCheck === null || heightCheck === void 0 ? void 0 : heightCheck.compliant).toBe(true);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    // 複数の規制が組み合わさる場合のテスト
    describe('複数規制の組み合わせ', function () {
        it('高度地区と地区計画の組み合わせで最も厳しい制限が適用されることをテスト', function () { return __awaiter(void 0, void 0, void 0, function () {
            var updateRes, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, supertest_1.default)(app_1.default)
                            .put("".concat(baseUrl, "/properties/").concat(testPropertyId))
                            .set('Authorization', authHeader)
                            .send({
                            heightDistrict: types_1.HeightDistrictType.FIRST_15M, // 15m高度地区
                            districtPlanInfo: {
                                name: 'テスト地区計画',
                                maxHeight: 12.0 // 12m高さ制限（より厳しい）
                            }
                        })];
                    case 1:
                        updateRes = _a.sent();
                        expect(updateRes.status).toBe(200);
                        return [4 /*yield*/, (0, supertest_1.default)(app_1.default)
                                .post("".concat(baseUrl, "/analysis/volume-check"))
                                .set('Authorization', authHeader)
                                .send({
                                propertyId: testPropertyId,
                                buildingParams: __assign(__assign({}, testBuildingParams), { floors: 10 // 高い階数
                                 })
                            })];
                    case 2:
                        res = _a.sent();
                        expect(res.status).toBe(201);
                        expect(res.body.success).toBe(true);
                        expect(res.body.data).toHaveProperty('regulationLimits');
                        // 高度地区と地区計画の両方の制限値を確認
                        expect(res.body.data.regulationLimits.heightDistrictLimit).toBe(15);
                        // 最終的な高さ制限が地区計画の値（より厳しい方）になることを確認
                        expect(res.body.data.regulationLimits.finalLimit).toBe(12);
                        // 建物高さが最終的な高さ制限以下になることを確認
                        expect(res.body.data.buildingHeight).toBeLessThanOrEqual(12);
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
