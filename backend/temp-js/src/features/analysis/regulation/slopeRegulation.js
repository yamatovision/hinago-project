"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDetailedSlopeLimit = calculateDetailedSlopeLimit;
exports.calculateRoadSlopeLimit = calculateRoadSlopeLimit;
exports.calculateAdjacentSlopeLimit = calculateAdjacentSlopeLimit;
exports.calculateNorthSlopeLimit = calculateNorthSlopeLimit;
/**
 * 斜線制限計算ユーティリティ
 *
 * 斜線制限による高さ制限を計算するためのユーティリティ関数群
 */
var types_1 = require("../../../types");
var heightDistrict_1 = require("./heightDistrict");
/**
 * 斜線制限による高さ制限の計算（詳細版）
 * @param property 物件データ
 * @returns 高さ制限（m）
 */
function calculateDetailedSlopeLimit(property) {
    // 道路斜線
    var roadSlopeLimit = calculateRoadSlopeLimit(property);
    // 隣地斜線
    var adjacentSlopeLimit = calculateAdjacentSlopeLimit(property);
    // 北側斜線（住居系用途地域の場合）
    var northSlopeLimit = (0, heightDistrict_1.isResidentialZone)(property.zoneType)
        ? calculateNorthSlopeLimit(property)
        : Infinity;
    // 最も厳しい制限を採用
    return Math.min(roadSlopeLimit, adjacentSlopeLimit, northSlopeLimit);
}
/**
 * 道路斜線制限の計算
 * @param property 物件データ
 * @returns 道路斜線制限による高さ制限（m）
 */
function calculateRoadSlopeLimit(property) {
    var roadWidth = property.roadWidth || 4; // デフォルト4m
    var slope = 1.5; // デフォルト勾配
    // 用途地域に応じた勾配の調整
    switch (property.zoneType) {
        case types_1.ZoneType.CATEGORY9: // 商業地域
            slope = 2.0;
            break;
        case types_1.ZoneType.CATEGORY8: // 近隣商業地域
            slope = 1.75;
            break;
        case types_1.ZoneType.CATEGORY1: // 第一種低層住居専用地域
        case types_1.ZoneType.CATEGORY2: // 第二種低層住居専用地域
            slope = 1.25;
            break;
        default:
            slope = 1.5;
    }
    // セットバックを考慮
    var setback = Math.max(0, 4 - roadWidth) / 2;
    // 道路斜線制限 = (道路幅員 + セットバック) × 勾配
    return (roadWidth + setback) * slope;
}
/**
 * 隣地斜線制限の計算
 * @param property 物件データ
 * @returns 隣地斜線制限による高さ制限（m）
 */
function calculateAdjacentSlopeLimit(property) {
    // 高さの基準値（用途地域により異なる）
    var baseHeight = 20; // デフォルト
    var slope = 1.25; // デフォルト勾配
    // 用途地域に応じた基準値と勾配の調整
    switch (property.zoneType) {
        case types_1.ZoneType.CATEGORY9: // 商業地域
            baseHeight = 31;
            slope = 2.5;
            break;
        case types_1.ZoneType.CATEGORY8: // 近隣商業地域
            baseHeight = 31;
            slope = 2.5;
            break;
        case types_1.ZoneType.CATEGORY1: // 第一種低層住居専用地域
        case types_1.ZoneType.CATEGORY2: // 第二種低層住居専用地域
            baseHeight = 20;
            slope = 1.25;
            break;
        default:
            baseHeight = 20;
            slope = 1.25;
    }
    // 仮定値：隣地境界線からの距離を10mとする
    // 実際の計算では敷地形状から最短距離を計算するロジックが必要
    var distanceToAdjacentBoundary = 10;
    // 隣地斜線制限 = 基準高さ + 隣地境界線からの距離 × 勾配
    return baseHeight + (distanceToAdjacentBoundary * slope);
}
/**
 * 北側斜線制限の計算
 * @param property 物件データ
 * @returns 北側斜線制限による高さ制限（m）
 */
function calculateNorthSlopeLimit(property) {
    // 北側斜線は低層住居専用地域と中高層住居専用地域で適用
    if (![
        types_1.ZoneType.CATEGORY1, types_1.ZoneType.CATEGORY2, // 低層住居専用地域
        types_1.ZoneType.CATEGORY3, types_1.ZoneType.CATEGORY4 // 中高層住居専用地域
    ].includes(property.zoneType)) {
        return Infinity; // 適用外
    }
    // 北側敷地境界線までの距離（デフォルト値）
    var distanceToNorth = property.northBoundaryDistance || 10;
    // 高さの基準値と勾配（用途地域により異なる）
    var baseHeight = 5; // デフォルト
    var slope = 1.25; // デフォルト勾配
    if (property.zoneType === types_1.ZoneType.CATEGORY3 || property.zoneType === types_1.ZoneType.CATEGORY4) {
        // 中高層住居専用地域
        baseHeight = 10;
        slope = 1.25;
    }
    // 北側斜線制限 = 基準高さ + 北側境界線からの距離 × 勾配
    return baseHeight + (distanceToNorth * slope);
}
