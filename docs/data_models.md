# HinagoProject データモデル定義

**バージョン**: 1.1.0  
**最終更新日**: 2025-05-19  
**ステータス**: ドラフト  

## 1. データモデル概要

このドキュメントでは、HinagoProjectで使用するデータモデルの詳細な定義を行います。すべての型定義は `shared/index.ts` で一元管理され、フロントエンドとバックエンドで共有されます。

## 2. エンティティ関連図

```
       User (ユーザー)
        |
        +----------------+-------------+-------------+-------------+-------------+
        |                |             |             |             |             |
        v                v             v             v             v             v
  RefreshToken        Property     VolumeCheck    Scenario    ProfitabilityResult  Document
 (リフレッシュトークン)  (物件)    (ボリュームチェック) (シナリオ)  (収益性試算結果)    (文書)
                        |
                        |
                        v                     
                  PropertyShape              
                   (敷地形状)                
                                    
      Property (物件)
        |
        +------------+------------+
        |            |            |
        v            v            v
  PropertyShape  VolumeCheck   Document
  (敷地形状)    (ボリュームチェック)  (文書)
                    |
                    v
                 Scenario
                (シナリオ)
                    |
                    v
              ProfitabilityResult
              (収益性試算結果)
```

## 3. 基本データ型

### 3.1 共通型

```typescript
// 基本ID型
export type ID = string;

// タイムスタンプ関連
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

// ページネーション
export interface PaginationParams {
  page: number;
  limit: number;
}

// レスポンス共通構造
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: Record<string, any>;
}

// フィルター用のオプション
export interface FilterOptions {
  [key: string]: string | number | boolean | undefined;
}
```

### 3.2 列挙型

```typescript
// ユーザーロールの列挙型
export enum UserRole {
  ADMIN = 'ADMIN', // 管理者
  USER = 'USER',   // 一般ユーザー（将来拡張用）
  GUEST = 'GUEST'  // ゲスト（将来拡張用）
}

// 用途地域の列挙型
export enum ZoneType {
  CATEGORY1 = 'category1', // 第一種低層住居専用地域
  CATEGORY2 = 'category2', // 第二種低層住居専用地域
  CATEGORY3 = 'category3', // 第一種中高層住居専用地域
  CATEGORY4 = 'category4', // 第二種中高層住居専用地域
  CATEGORY5 = 'category5', // 第一種住居地域
  CATEGORY6 = 'category6', // 第二種住居地域
  CATEGORY7 = 'category7', // 準住居地域
  CATEGORY8 = 'category8', // 近隣商業地域
  CATEGORY9 = 'category9', // 商業地域
  CATEGORY10 = 'category10', // 準工業地域
  CATEGORY11 = 'category11', // 工業地域
  CATEGORY12 = 'category12', // 工業専用地域
}

// 防火地域区分の列挙型
export enum FireZoneType {
  FIRE = 'fire', // 防火地域
  SEMI_FIRE = 'semi-fire', // 準防火地域
  NONE = 'none', // 指定なし
}

// 日影規制の列挙型
export enum ShadowRegulationType {
  TYPE1 = 'type1', // 規制タイプ1（4時間/2.5時間）
  TYPE2 = 'type2', // 規制タイプ2（5時間/3時間）
  NONE = 'none', // 規制なし
}

// 物件ステータスの列挙型
export enum PropertyStatus {
  NEW = 'new', // 新規
  ACTIVE = 'active', // 進行中
  PENDING = 'pending', // 検討中
  NEGOTIATING = 'negotiating', // 交渉中
  CONTRACTED = 'contracted', // 契約済み
  COMPLETED = 'completed', // 完了
}

// アセットタイプの列挙型
export enum AssetType {
  MANSION = 'mansion', // マンション
  OFFICE = 'office', // オフィス
  WOODEN_APARTMENT = 'wooden-apartment', // 木造アパート
  HOTEL = 'hotel', // ホテル
}

// 文書タイプの列挙型
export enum DocumentType {
  SURVEY = 'survey', // 測量図
  LEGAL = 'legal', // 法的書類
  PLAN = 'plan', // 計画書
  REPORT = 'report', // レポート
  OTHER = 'other', // その他
}
```

## 4. 物件管理エンティティ

### 4.1 Property（物件）

物件の基本情報を管理するエンティティです。

```typescript
// 物件基本情報
export interface PropertyBase {
  name: string; // 物件名
  address: string; // 住所
  area: number; // 敷地面積 (m²)
  zoneType: ZoneType; // 用途地域
  fireZone: FireZoneType; // 防火地域区分
  shadowRegulation?: ShadowRegulationType; // 日影規制
  buildingCoverage: number; // 建蔽率 (%)
  floorAreaRatio: number; // 容積率 (%)
  allowedBuildingArea?: number; // 許容建築面積 (m²)
  heightLimit?: number; // 高さ制限 (m)
  roadWidth?: number; // 前面道路幅員 (m)
  price?: number; // 想定取得価格 (円)
  status?: PropertyStatus; // 物件ステータス
  notes?: string; // 備考・メモ
  shapeData?: PropertyShape; // 敷地形状データ
}

// 物件詳細の型（DBモデルに対応）
export interface Property extends PropertyBase, Timestamps {
  id: ID;
}

// 物件詳細の型（関連エンティティを含む）
export interface PropertyDetail extends Property {
  volumeChecks?: VolumeCheck[]; // 関連するボリュームチェック結果
  documents?: Document[]; // 関連する文書
}
```

### 4.2 PropertyShape（敷地形状）

物件の敷地形状を管理するエンティティです。

```typescript
// 境界点座標の型
export interface BoundaryPoint {
  x: number; // X座標
  y: number; // Y座標
}

// 敷地形状の型
export interface PropertyShape {
  points: BoundaryPoint[]; // 境界点の配列
  width?: number; // 敷地間口
  depth?: number; // 敷地奥行
  sourceFile?: string; // 測量図ファイルのURL
}
```

### 4.3 Document（文書）

物件に関連する文書を管理するエンティティです。

```typescript
// 文書の型（DBモデルに対応）
export interface Document extends Timestamps {
  id: ID;
  propertyId: ID; // 関連物件ID
  name: string; // ファイル名
  fileType: string; // ファイル種類 (MIME Type)
  fileSize: number; // ファイルサイズ (bytes)
  fileUrl: string; // ファイルURL
  documentType: DocumentType; // 文書タイプ
  description?: string; // 説明
}
```

## 5. ボリュームチェックエンティティ

### 5.1 VolumeCheck（ボリュームチェック）

建築可能ボリュームの計算結果を管理するエンティティです。

```typescript
// ボリュームチェックパラメータの型
export interface BuildingParams {
  floorHeight: number; // 階高 (m)
  commonAreaRatio: number; // 共用部率 (%)
  floors: number; // 階数
  roadWidth?: number; // 前面道路幅員 (m)
  assetType: AssetType; // アセットタイプ
}

// 階別データの型
export interface FloorData {
  floor: number; // 階数
  floorArea: number; // 床面積 (m²)
  privateArea: number; // 専有面積 (m²)
  commonArea: number; // 共用面積 (m²)
}

// ボリュームチェック結果の型
export interface VolumeCheckResult {
  buildingArea: number; // 建築面積 (m²)
  totalFloorArea: number; // 延床面積 (m²)
  buildingHeight: number; // 建物高さ (m)
  consumptionRate: number; // 容積消化率 (%)
  floors: number; // 階数
  floorBreakdown: FloorData[]; // 階別内訳
  regulationChecks: RegulationCheck[]; // 法規制チェック結果
}

// 法規制チェック結果の型
export interface RegulationCheck {
  name: string; // 規制項目名
  regulationValue: string; // 規制値
  plannedValue: string; // 計画値
  compliant: boolean; // 適合判定
}

// 3Dモデルデータの型
export interface Model3DData {
  modelType: string; // モデルの種類（three.js, cesiumなど）
  data: any; // モデルデータ（具体的な形式は実装により異なる）
}

// ボリュームチェックの型（DBモデルに対応）
export interface VolumeCheck extends Timestamps {
  id: ID;
  propertyId: ID; // 関連物件ID
  assetType: AssetType; // アセットタイプ
  buildingArea: number; // 建築面積 (m²)
  totalFloorArea: number; // 延床面積 (m²)
  buildingHeight: number; // 建物高さ (m)
  consumptionRate: number; // 容積消化率 (%)
  floors: number; // 階数
  floorBreakdown: FloorData[]; // 階別内訳
  model3dData?: Model3DData; // 3Dモデルデータ
  regulationChecks: RegulationCheck[]; // 法規制チェック結果
}
```

## 6. 収益性試算エンティティ

### 6.1 ProfitabilityResult（収益性試算結果）

収益性試算の結果を管理するエンティティです。

```typescript
// 収益性試算パラメータの型
export interface FinancialParams {
  rentPerSqm: number; // 賃料単価 (円/m²)
  occupancyRate: number; // 稼働率 (%)
  managementCostRate: number; // 管理コスト率 (%)
  constructionCostPerSqm: number; // 建設単価 (円/m²)
  rentalPeriod: number; // 運用期間 (年)
  capRate: number; // 還元利回り (%)
}

// 年間財務データの型
export interface AnnualFinancialData {
  year: number; // 年次
  rentalIncome: number; // 賃料収入 (円)
  operatingExpenses: number; // 運営支出 (円)
  netOperatingIncome: number; // 年間純収益 (円)
  accumulatedIncome: number; // 累計収益 (円)
}

// 収益性試算結果の型
export interface ProfitabilityResult extends Timestamps {
  id: ID;
  propertyId: ID; // 関連物件ID
  volumeCheckId: ID; // 関連ボリュームチェックID
  assetType: AssetType; // アセットタイプ
  parameters: FinancialParams; // 計算パラメータ
  
  // 投資概要
  landPrice: number; // 土地取得費 (円)
  constructionCost: number; // 建設費 (円)
  miscExpenses: number; // 諸経費 (円)
  totalInvestment: number; // 総投資額 (円)
  
  // 年間収支
  annualRentalIncome: number; // 年間賃料収入 (円)
  annualOperatingExpenses: number; // 年間運営費 (円)
  annualMaintenance: number; // 年間修繕費 (円)
  annualPropertyTax: number; // 年間不動産税 (円)
  annualNOI: number; // 年間純収益 (円)
  
  // 収益指標
  noiYield: number; // 投資利回り (%)
  irr: number; // 内部収益率 (%)
  paybackPeriod: number; // 投資回収期間 (年)
  npv: number; // 正味現在価値 (円)
  
  // 詳細データ
  annualFinancials: AnnualFinancialData[]; // 年次ごとの財務データ
}
```

### 6.2 Scenario（シナリオ）

収益性試算の異なるシナリオを管理するエンティティです。

```typescript
// シナリオパラメータの型
export interface ScenarioParams extends FinancialParams {
  assetType: AssetType; // アセットタイプ
}

// シナリオの型（DBモデルに対応）
export interface Scenario extends Timestamps {
  id: ID;
  propertyId: ID; // 関連物件ID
  volumeCheckId: ID; // 関連ボリュームチェックID
  name: string; // シナリオ名
  params: ScenarioParams; // シナリオパラメータ
  profitabilityResult?: ProfitabilityResult; // 収益性試算結果
}
```

## 7. 認証・ユーザー管理エンティティ

### 7.1 User（ユーザー）

ユーザー情報を管理するエンティティです。

```typescript
// ユーザーの型（DBモデルに対応）
export interface User extends Timestamps {
  id: ID;
  email: string;      // メールアドレス
  name?: string;      // ユーザー名
  password: string;   // ハッシュ化されたパスワード（保存用）
  role: UserRole;     // ユーザーロール
}

// 認証用ユーザー情報（パスワードなどのセキュリティ情報を除いた情報）
export interface AuthUser {
  id: ID;
  email: string;
  name?: string;
  role: UserRole;
}
```

### 7.2 RefreshToken（リフレッシュトークン）

リフレッシュトークン情報を管理するエンティティです。

```typescript
// リフレッシュトークンの型（DBモデルに対応）
export interface RefreshToken extends Timestamps {
  id: ID;
  userId: ID;        // ユーザーID
  token: string;     // トークン文字列
  expiresAt: Date;   // 有効期限
}
```

### 7.3 JWT Payload

JWTトークンのペイロード構造です。

```typescript
// JWT Payloadの型
export interface JwtPayload {
  sub: string;     // ユーザーID
  email: string;   // メールアドレス
  role: UserRole;  // ロール
  iat: number;     // 発行時間
  exp: number;     // 有効期限
}
```

### 7.4 認証リクエスト/レスポンス

認証関連のリクエストとレスポンスの型定義です。

```typescript
// ログインリクエストの型
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// ログインレスポンスの型
export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

// リフレッシュトークンリクエストの型
export interface RefreshTokenRequest {
  refreshToken: string;
}

// リフレッシュトークンレスポンスの型
export interface RefreshTokenResponse {
  accessToken: string;
}
```

## 8. その他のエンティティ

### 8.1 HistoryEntry（更新履歴）

物件情報の更新履歴を管理するエンティティです。

```typescript
// 更新履歴エントリの型
export interface HistoryEntry extends Timestamps {
  id: ID;
  propertyId: ID; // 関連物件ID
  userId: ID; // 変更したユーザーID
  action: string; // 実行したアクション
  details: string; // 変更の詳細
}
```

## 9. APIパス定義

APIパスも `shared/index.ts` で一元管理されており、以下のような構造になっています。

```typescript
export const API_PATHS = {
  // 認証関連
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    ME: '/api/auth/me',
  },
  
  // 物件管理関連
  PROPERTIES: {
    BASE: '/api/properties',
    DETAIL: (propertyId: string) => `/api/properties/${propertyId}`,
    UPLOAD_SURVEY: '/api/properties/upload-survey',
    SHAPE: (propertyId: string) => `/api/properties/${propertyId}/shape`,
    DOCUMENTS: (propertyId: string) => `/api/properties/${propertyId}/documents`,
    DOCUMENT: (propertyId: string, documentId: string) => `/api/properties/${propertyId}/documents/${documentId}`,
    HISTORY: (propertyId: string) => `/api/properties/${propertyId}/history`,
  },
  
  // ボリュームチェック関連
  ANALYSIS: {
    VOLUME_CHECK: '/api/analysis/volume-check',
    VOLUME_CHECK_DETAIL: (volumeCheckId: string) => `/api/analysis/volume-check/${volumeCheckId}`,
    PROFITABILITY: '/api/analysis/profitability',
    PROFITABILITY_DETAIL: (profitabilityId: string) => `/api/analysis/profitability/${profitabilityId}`,
    SCENARIOS: '/api/analysis/scenarios',
    SCENARIO: (scenarioId: string) => `/api/analysis/scenarios/${scenarioId}`,
  },
  
  // ジオコーディング関連
  GEO: {
    GEOCODE: '/api/geocode',
  },
};

// 認証が不要なパブリックエンドポイント
export const PUBLIC_ENDPOINTS = [
  API_PATHS.AUTH.LOGIN,
  API_PATHS.AUTH.REFRESH
];
```

## 10. バリデーションルール

各エンティティのバリデーションルールも `shared/index.ts` で定義されています。

```typescript
export const VALIDATION_RULES = {
  // 認証バリデーション
  AUTH: {
    email: { required: true, email: true, maxLength: 100 },
    password: { required: true, minLength: 6, maxLength: 100 },
  },

  // 物件バリデーション
  PROPERTY: {
    name: { required: true, minLength: 1, maxLength: 100 },
    address: { required: true, minLength: 3, maxLength: 200 },
    area: { required: true, min: 0.1, max: 100000 },
    zoneType: { required: true },
    fireZone: { required: true },
    buildingCoverage: { required: true, min: 0, max: 100 },
    floorAreaRatio: { required: true, min: 0, max: 1000 },
    price: { required: false, min: 0 },
  },
  
  // ボリュームチェックバリデーション
  VOLUME_CHECK: {
    assetType: { required: true },
    floorHeight: { required: true, min: 2, max: 10 },
    commonAreaRatio: { required: true, min: 0, max: 100 },
    floors: { required: true, min: 1, max: 100 },
    roadWidth: { required: false, min: 0 },
  },
  
  // 収益性試算バリデーション
  FINANCIAL: {
    rentPerSqm: { required: true, min: 0 },
    occupancyRate: { required: true, min: 0, max: 100 },
    managementCostRate: { required: true, min: 0, max: 100 },
    constructionCostPerSqm: { required: true, min: 0 },
    rentalPeriod: { required: true, min: 1, max: 100 },
    capRate: { required: true, min: 0, max: 20 },
  },
};
```

## 11. 変更履歴

| 日付 | バージョン | 変更内容 | 担当者 |
|------|------------|----------|--------|
| 2025-05-19 | 1.0.0 | 初期バージョン作成 | データモデルアーキテクト |
| 2025-05-19 | 1.1.0 | 認証・ユーザー管理の追加 | システムアーキテクター |

## 12. データモデル進化の原則

1. **後方互換性の維持**: 既存のフィールドの型を変更しない、必須フィールドを後から追加しない
2. **オプショナルフィールドの追加**: 新しいフィールドは常にオプショナル（`?`付き）として追加
3. **deprecationの明示**: 廃止予定のフィールドにはコメントでdeprecatedであることを明示
4. **変更履歴の記録**: すべての変更は本ドキュメントの変更履歴に記録する

これらの原則に従うことで、データモデルの進化による既存コードへの影響を最小限に抑えることができます。