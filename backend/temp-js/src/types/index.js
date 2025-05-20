"use strict";
/**
 * ===== 統合型定義 =====
 *
 * このファイルはshared/index.ts をリファレンスとして、
 * 必要な型定義をコピーしたものです。
 * デプロイ時の問題を回避するためのアプローチです。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FIXED_ADMIN_USER = exports.PUBLIC_ENDPOINTS = exports.API_PATHS = exports.UserRole = exports.DocumentType = exports.AssetType = exports.PropertyStatus = exports.HeightDistrictType = exports.ShadowRegulationType = exports.FireZoneType = exports.ZoneType = void 0;
/**
 * =================
 * エンティティの定義
 * =================
 */
// 用途地域の列挙型
var ZoneType;
(function (ZoneType) {
    ZoneType["CATEGORY1"] = "category1";
    ZoneType["CATEGORY2"] = "category2";
    ZoneType["CATEGORY3"] = "category3";
    ZoneType["CATEGORY4"] = "category4";
    ZoneType["CATEGORY5"] = "category5";
    ZoneType["CATEGORY6"] = "category6";
    ZoneType["CATEGORY7"] = "category7";
    ZoneType["CATEGORY8"] = "category8";
    ZoneType["CATEGORY9"] = "category9";
    ZoneType["CATEGORY10"] = "category10";
    ZoneType["CATEGORY11"] = "category11";
    ZoneType["CATEGORY12"] = "category12";
})(ZoneType || (exports.ZoneType = ZoneType = {}));
// 防火地域区分の列挙型
var FireZoneType;
(function (FireZoneType) {
    FireZoneType["FIRE"] = "fire";
    FireZoneType["SEMI_FIRE"] = "semi-fire";
    FireZoneType["NONE"] = "none";
})(FireZoneType || (exports.FireZoneType = FireZoneType = {}));
// 日影規制の列挙型
var ShadowRegulationType;
(function (ShadowRegulationType) {
    ShadowRegulationType["TYPE1"] = "type1";
    ShadowRegulationType["TYPE2"] = "type2";
    ShadowRegulationType["NONE"] = "none";
})(ShadowRegulationType || (exports.ShadowRegulationType = ShadowRegulationType = {}));
// 高度地区の列挙型（追加）
var HeightDistrictType;
(function (HeightDistrictType) {
    HeightDistrictType["FIRST_10M"] = "first10m";
    HeightDistrictType["FIRST_15M"] = "first15m";
    HeightDistrictType["SECOND_15M"] = "second15m";
    HeightDistrictType["SECOND_20M"] = "second20m";
    HeightDistrictType["NONE"] = "none";
})(HeightDistrictType || (exports.HeightDistrictType = HeightDistrictType = {}));
// 物件ステータスの列挙型
var PropertyStatus;
(function (PropertyStatus) {
    PropertyStatus["NEW"] = "new";
    PropertyStatus["ACTIVE"] = "active";
    PropertyStatus["PENDING"] = "pending";
    PropertyStatus["NEGOTIATING"] = "negotiating";
    PropertyStatus["CONTRACTED"] = "contracted";
    PropertyStatus["COMPLETED"] = "completed";
})(PropertyStatus || (exports.PropertyStatus = PropertyStatus = {}));
// アセットタイプの列挙型
var AssetType;
(function (AssetType) {
    AssetType["MANSION"] = "mansion";
    AssetType["OFFICE"] = "office";
    AssetType["WOODEN_APARTMENT"] = "wooden-apartment";
    AssetType["HOTEL"] = "hotel";
})(AssetType || (exports.AssetType = AssetType = {}));
// 文書タイプの列挙型
var DocumentType;
(function (DocumentType) {
    DocumentType["SURVEY"] = "survey";
    DocumentType["LEGAL"] = "legal";
    DocumentType["PLAN"] = "plan";
    DocumentType["REPORT"] = "report";
    DocumentType["OTHER"] = "other";
})(DocumentType || (exports.DocumentType = DocumentType = {}));
/**
 * =================
 * 認証関連の型定義
 * =================
 */
// ユーザーロールの列挙型
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["USER"] = "USER";
    UserRole["GUEST"] = "GUEST"; // ゲスト（将来拡張用）
})(UserRole || (exports.UserRole = UserRole = {}));
/**
 * =================
 * APIパスの定義
 * =================
 */
exports.API_PATHS = {
    // 認証関連
    AUTH: {
        LOGIN: '/api/v1/auth/login',
        LOGOUT: '/api/v1/auth/logout',
        REFRESH: '/api/v1/auth/refresh',
        ME: '/api/v1/auth/me',
    },
    // 物件管理関連
    PROPERTIES: {
        BASE: '/api/v1/properties',
        DETAIL: function (propertyId) { return "/api/v1/properties/".concat(propertyId); },
        UPLOAD_SURVEY: '/api/v1/properties/upload-survey',
        SHAPE: function (propertyId) { return "/api/v1/properties/".concat(propertyId, "/shape"); },
        DOCUMENTS: function (propertyId) { return "/api/v1/properties/".concat(propertyId, "/documents"); },
        DOCUMENT: function (propertyId, documentId) { return "/api/v1/properties/".concat(propertyId, "/documents/").concat(documentId); },
        HISTORY: function (propertyId) { return "/api/v1/properties/".concat(propertyId, "/history"); },
    },
    // ボリュームチェック関連
    ANALYSIS: {
        VOLUME_CHECK: '/api/v1/analysis/volume-check',
        VOLUME_CHECK_DETAIL: function (volumeCheckId) { return "/api/v1/analysis/volume-check/".concat(volumeCheckId); },
        PROFITABILITY: '/api/v1/analysis/profitability',
        PROFITABILITY_DETAIL: function (profitabilityId) { return "/api/v1/analysis/profitability/".concat(profitabilityId); },
        SCENARIOS: '/api/v1/analysis/scenarios',
        SCENARIO: function (scenarioId) { return "/api/v1/analysis/scenarios/".concat(scenarioId); },
    },
    // ジオコーディング関連
    GEO: {
        GEOCODE: '/api/v1/geocode',
        REVERSE_GEOCODE: '/api/v1/geocode/reverse',
    },
};
/**
 * =================
 * 認証設定
 * =================
 */
// 認証が不要なパブリックエンドポイント
exports.PUBLIC_ENDPOINTS = [
    exports.API_PATHS.AUTH.LOGIN,
    exports.API_PATHS.AUTH.REFRESH
];
// 固定管理者ユーザー（開発用）
exports.FIXED_ADMIN_USER = {
    id: '1',
    email: 'higano@gmail.com',
    name: '管理者',
    role: UserRole.ADMIN
};
