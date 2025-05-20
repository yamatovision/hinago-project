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
Object.defineProperty(exports, "__esModule", { value: true });
exports.adjustBuildingParamsForDistrictPlan = adjustBuildingParamsForDistrictPlan;
/**
 * 地区計画を考慮した建築可能ボリュームの計算
 * @param property 物件データ（地区計画情報を含む）
 * @param buildingParams 建築パラメータ
 * @returns 調整された建築パラメータ
 */
function adjustBuildingParamsForDistrictPlan(property, buildingParams) {
    var _a;
    // 地区計画情報がない場合はそのまま返す
    if (!property.districtPlanInfo) {
        return buildingParams;
    }
    var adjustedParams = __assign({}, buildingParams);
    // 壁面後退距離がある場合、敷地面積を調整
    if (property.districtPlanInfo.wallSetbackDistance) {
        // 簡易計算：敷地の外周に沿って壁面後退を考慮した面積を計算
        // 実際にはより複雑な計算が必要
        var setbackDistance = property.districtPlanInfo.wallSetbackDistance;
        // 敷地形状がある場合
        if ((_a = property.shapeData) === null || _a === void 0 ? void 0 : _a.points) {
            var originalArea = property.area;
            // 敷地外周の長さを計算（簡易版）
            var perimeter = 0;
            var points = property.shapeData.points;
            for (var i = 0; i < points.length - 1; i++) {
                var dx_1 = points[i + 1].x - points[i].x;
                var dy_1 = points[i + 1].y - points[i].y;
                perimeter += Math.sqrt(dx_1 * dx_1 + dy_1 * dy_1);
            }
            // 最後の点と最初の点の距離を追加
            var dx = points[0].x - points[points.length - 1].x;
            var dy = points[0].y - points[points.length - 1].y;
            perimeter += Math.sqrt(dx * dx + dy * dy);
            // 後退による面積減少の簡易計算
            // 実際には敷地形状に応じたより精密な計算が必要
            var reducedArea = Math.max(0, originalArea - perimeter * setbackDistance);
            // 建築面積を調整（計算結果として buildingArea プロパティを追加）
            var originalBuildingArea = 'buildingArea' in adjustedParams
                ? adjustedParams.buildingArea
                : (originalArea * property.buildingCoverage / 100);
            // 面積比率で建築面積を調整
            adjustedParams.buildingArea = originalBuildingArea * (reducedArea / originalArea);
        }
    }
    // 高さ制限がある場合、階数と建物高さを調整
    if (property.districtPlanInfo.maxHeight) {
        var maxHeight = property.districtPlanInfo.maxHeight;
        var floorHeight = buildingParams.floorHeight || 3; // デフォルト3m
        // 最大階数を計算
        var maxFloors = Math.floor(maxHeight / floorHeight);
        // 階数を制限
        adjustedParams.floors = Math.min(adjustedParams.floors, maxFloors);
    }
    return adjustedParams;
}
