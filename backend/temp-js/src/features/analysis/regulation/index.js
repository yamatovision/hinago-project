"use strict";
/**
 * 建築基準法規制計算モジュール
 *
 * 高度地区、斜線制限、日影規制、地区計画対応の各種計算機能をまとめたインデックス
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateFinalHeightLimit = calculateFinalHeightLimit;
// 高度地区計算
__exportStar(require("./heightDistrict"), exports);
// 斜線制限計算
__exportStar(require("./slopeRegulation"), exports);
// 地区計画対応
__exportStar(require("./districtPlan"), exports);
/**
 * 最終的な高さ制限の計算
 * 各種制限から最も厳しい値を採用
 *
 * @param heightLimits 高さ制限の配列
 * @returns 最終的な高さ制限（m）
 */
function calculateFinalHeightLimit(heightLimits) {
    // 無限大（制限なし）を除外
    var finiteHeightLimits = heightLimits.filter(function (limit) { return limit !== Infinity && !isNaN(limit); });
    // 有限の制限がない場合
    if (finiteHeightLimits.length === 0) {
        return Infinity; // 制限なし
    }
    // 最も低い値（厳しい制限）を採用
    return Math.min.apply(Math, finiteHeightLimits);
}
