"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateHeightDistrictLimit = calculateHeightDistrictLimit;
exports.getHeightLimitByZone = getHeightLimitByZone;
exports.isResidentialZone = isResidentialZone;
/**
 * 高度地区計算ユーティリティ
 *
 * 高度地区による高さ制限を計算するためのユーティリティ関数群
 */
var types_1 = require("../../../types");
/**
 * 高度地区による高さ制限の計算
 * @param property 物件データ
 * @returns 高さ制限（m）
 */
function calculateHeightDistrictLimit(property) {
    // 高度地区が指定されていない場合は無制限として扱う
    if (!property.heightDistrict || property.heightDistrict === types_1.HeightDistrictType.NONE) {
        return Infinity; // 制限なし
    }
    switch (property.heightDistrict) {
        case types_1.HeightDistrictType.FIRST_10M:
            return 10; // 第一種10M高度地区
        case types_1.HeightDistrictType.FIRST_15M:
            return 15; // 第一種15M高度地区
        case types_1.HeightDistrictType.SECOND_15M:
            // 第二種は北側斜線あり
            if (property.northBoundaryDistance) {
                // 5m + 距離×1.25の計算（勾配1:1.25）
                var northSlope = 5 + (property.northBoundaryDistance * 1.25);
                return Math.min(15, northSlope);
            }
            return 15; // 北側境界距離が不明な場合は最大値を使用
        case types_1.HeightDistrictType.SECOND_20M:
            // 第二種は北側斜線あり
            if (property.northBoundaryDistance) {
                // 5m + 距離×1.25の計算（勾配1:1.25）
                var northSlope = 5 + (property.northBoundaryDistance * 1.25);
                return Math.min(20, northSlope);
            }
            return 20; // 北側境界距離が不明な場合は最大値を使用
        default:
            return Infinity; // 不明な場合は無制限として扱う
    }
}
/**
 * 用途地域による高さ制限の取得（高度地区が無い場合のデフォルト）
 * @param zoneType 用途地域
 * @returns 高さ制限（m）
 */
function getHeightLimitByZone(zoneType) {
    // 用途地域ごとの高さ制限（福岡市の一般的な値）
    // 実際には地区計画や高度地区によって異なる場合がある
    switch (zoneType) {
        case types_1.ZoneType.CATEGORY1: // 第一種低層住居専用地域
        case types_1.ZoneType.CATEGORY2: // 第二種低層住居専用地域
            return 10; // 例: 10m
        case types_1.ZoneType.CATEGORY3: // 第一種中高層住居専用地域
        case types_1.ZoneType.CATEGORY4: // 第二種中高層住居専用地域
            return 20; // 例: 20m
        case types_1.ZoneType.CATEGORY5: // 第一種住居地域
        case types_1.ZoneType.CATEGORY6: // 第二種住居地域
        case types_1.ZoneType.CATEGORY7: // 準住居地域
            return 31; // 例: 31m
        case types_1.ZoneType.CATEGORY8: // 近隣商業地域
            return 31; // 例: 31m
        case types_1.ZoneType.CATEGORY9: // 商業地域
            return 45; // 例: 45m
        case types_1.ZoneType.CATEGORY10: // 準工業地域
        case types_1.ZoneType.CATEGORY11: // 工業地域
        case types_1.ZoneType.CATEGORY12: // 工業専用地域
            return 31; // 例: 31m
        default:
            return 31; // デフォルト: 31m
    }
}
/**
 * 住居系用途地域かどうかの判定
 * @param zoneType 用途地域
 * @returns 住居系用途地域かどうか
 */
function isResidentialZone(zoneType) {
    return [
        types_1.ZoneType.CATEGORY1, // 第一種低層住居専用地域
        types_1.ZoneType.CATEGORY2, // 第二種低層住居専用地域
        types_1.ZoneType.CATEGORY3, // 第一種中高層住居専用地域
        types_1.ZoneType.CATEGORY4, // 第二種中高層住居専用地域
        types_1.ZoneType.CATEGORY5, // 第一種住居地域
        types_1.ZoneType.CATEGORY6, // 第二種住居地域
        types_1.ZoneType.CATEGORY7 // 準住居地域
    ].includes(zoneType);
}
