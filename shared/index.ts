/**
 * ===== 統合型定義・APIパスガイドライン =====
 * 
 * 【重要】このファイルはフロントエンド（client）からは直接インポートして使用します。
 * バックエンド（server）では、このファイルをリファレンスとして、
 * server/src/types/index.ts に必要な型定義をコピーして使用してください。
 * これはデプロイ時の問題を回避するためのアプローチです。
 * 
 * 【絶対に守るべき原則】
 * 1. フロントエンドとバックエンドで異なる型を作らない
 * 2. 同じデータ構造に対して複数の型を作らない
 * 3. 新しいプロパティは必ずオプショナルとして追加
 * 4. データの形はこのファイルで一元的に定義し、バックエンドはこれをコピーして使用
 * 5. APIパスは必ずこのファイルで一元管理する
 * 6. コード内でAPIパスをハードコードしない
 * 7. パスパラメータを含むエンドポイントは関数として提供する
 */

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

/**
 * ==================
 * エンティティの定義
 * ==================
 */

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

// 高度地区の列挙型（追加）
export enum HeightDistrictType {
  FIRST_10M = 'first10m',   // 第一種10M高度地区
  FIRST_15M = 'first15m',   // 第一種15M高度地区
  SECOND_15M = 'second15m', // 第二種15M高度地区
  SECOND_20M = 'second20m', // 第二種20M高度地区
  NONE = 'none',            // 指定なし
}

// セットバック理由の列挙型（Phase 2追加）
export enum SetbackReason {
  ROAD_SETBACK = 'road_setback',           // 道路境界線
  NEIGHBOR_SETBACK = 'neighbor_setback',   // 隣地境界線
  SLOPE_RESTRICTION = 'slope_restriction', // 斜線制限
  SHADOW_REGULATION = 'shadow_regulation', // 日影規制
  DISTRICT_PLAN = 'district_plan'          // 地区計画
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

// 境界点座標の型
export interface BoundaryPoint {
  x: number; // X座標
  y: number; // Y座標
}

// 地理的位置情報の型
export interface GeoLocation {
  latitude: number; // 緯度
  longitude: number; // 経度
}

// 座標点データの型（測量座標）
export interface CoordinatePoint {
  id: string;        // 点番号（KK1, FK3など）
  x: number;         // X座標（測量座標系）
  y: number;         // Y座標（測量座標系）
  length?: number;   // 次の点までの辺長
}

// 座標抽出結果の型
export interface CoordinateExtractionResult {
  coordinatePoints: CoordinatePoint[];
  totalArea: number;          // 倍面積
  area: number;               // 面積（㎡）
  registeredArea: number;     // 地積（㎡）
  plotNumber?: string;        // 地番
  confidence?: number;        // OCR信頼度（0-1）
  extractedImageUrl?: string; // 抽出元画像のURL
}

// 敷地形状の型
export interface PropertyShape {
  points: BoundaryPoint[]; // 境界点の配列（表示用）
  width?: number; // 敷地間口
  depth?: number; // 敷地奥行
  sourceFile?: string; // 測量図ファイルのURL
  
  // 測量座標データ（新規追加）
  coordinatePoints?: CoordinatePoint[];
  area?: number;                          // 実測面積（㎡）
  perimeter?: number;                     // 周長（m）
  coordinateSystem?: string;              // 座標系（例：平面直角座標系）
  extractionResult?: CoordinateExtractionResult; // 座標抽出結果
}


// 地区計画情報（追加）
export interface DistrictPlanInfo {
  name: string;                   // 地区計画名
  wallSetbackDistance?: number;   // 壁面後退距離
  maxHeight?: number;             // 最高高さ制限
  specialRegulations?: string[];  // 特別な規制事項
}

// 日影規制詳細情報（追加）
export interface ShadowRegulationDetail {
  measurementHeight: number;  // 測定面の高さ
  hourRanges: {
    primary: number;          // 4時間/5時間
    secondary: number;        // 2.5時間/3時間
  };
}

// 日影シミュレーション結果（追加）
export interface ShadowSimulationResult {
  isochroneMap?: any;       // 日影等時間線マップ
  maxHours: number;         // 最大日影時間
  mediumHours: number;      // 中間部分の日影時間
  compliant: boolean;       // 適合判定
}

// 高さ制限の詳細情報（追加）
export interface RegulationLimits {
  heightDistrictLimit: number;  // 高度地区による制限
  slopeLimit: number;           // 斜線制限による制限
  shadowLimit: number;          // 日影規制による制限
  absoluteLimit: number;        // 絶対高さ制限
  districtPlanLimit?: number;   // 地区計画による高さ制限
  finalLimit: number;           // 最終的な制限値（最小値）
}

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
  geoLocation?: GeoLocation; // 地理的位置情報
  
  // 新規追加フィールド（すべて任意）
  heightDistrict?: HeightDistrictType;   // 高度地区
  northBoundaryDistance?: number;        // 北側敷地境界線までの距離
  districtPlanInfo?: DistrictPlanInfo;   // 地区計画情報
  shadowRegulationDetail?: ShadowRegulationDetail; // 日影規制詳細
}

// 物件作成時の型
export interface PropertyCreateData extends PropertyBase {
  // 作成時固有のフィールド（今後の要件に応じて追加）
}

// 物件更新時の型
export interface PropertyUpdateData extends Partial<PropertyBase> {
  // 更新時固有のフィールド（今後の要件に応じて追加）
}

// 物件詳細の型（DBモデルに対応）
export interface Property extends PropertyBase, Timestamps {
  id: ID;
  userId?: ID; // 作成したユーザーID（将来的なマルチユーザー対応用）
}

// 物件詳細の型（関連エンティティを含む）
export interface PropertyDetail extends Property {
  volumeChecks?: VolumeCheck[]; // 関連するボリュームチェック結果
}

// セットバック情報（Phase 2追加）
export interface SetbackInfo {
  north: number;                // 北側セットバック（m）
  south: number;                // 南側セットバック（m）
  east: number;                 // 東側セットバック（m）
  west: number;                 // 西側セットバック（m）
  uniform?: number;             // 一律セットバック（m）
  reason?: SetbackReason[];     // セットバック理由
}

// 階層情報（Phase 2追加）
export interface FloorInfo {
  level: number;                // 階数（1から始まる）
  height: number;               // 階高（m）
  shape: BoundaryPoint[];       // 平面形状
  area: number;                 // 床面積（㎡）
  setback: SetbackInfo;         // セットバック情報
}

// 建物形状情報（Phase 2追加）
export interface BuildingShape {
  floors: FloorInfo[];          // 階層ごとの形状
  totalHeight: number;          // 建物全体の高さ（m）
  buildingArea: number;         // 建築面積（1階床面積）（㎡）
  totalFloorArea: number;       // 延床面積（㎡）
  volumeEfficiency: number;     // 容積効率（%）
}

// 3Dモデルデータの型
export interface Model3DData {
  modelType: string; // モデルの種類（three.js, cesiumなど）
  data: any; // モデルデータ（具体的な形式は実装により異なる）
  building?: BuildingShape; // 建物形状情報（Phase 2追加）
}

// ボリュームチェックパラメータの型
export interface BuildingParams {
  floorHeight: number; // 階高 (m)
  commonAreaRatio: number; // 共用部率 (%)
  floors: number; // 階数
  roadWidth?: number; // 前面道路幅員 (m)
  assetType: AssetType; // アセットタイプ
  buildingArea?: number; // 建築面積 (m²) - 建築パラメータで指定される場合
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
  userId?: ID; // 作成したユーザーID（将来的なマルチユーザー対応用）
  
  // 新規追加フィールド（すべて任意）
  shadowSimulation?: ShadowSimulationResult; // 日影シミュレーション結果
  regulationLimits?: RegulationLimits;       // 高さ制限の詳細情報
}

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
  noi: number; // 純営業収益 (円)
  cashFlow: number; // キャッシュフロー (円)
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
  
  scenarioId?: string; // 関連するシナリオID（新規追加：このシナリオIDに所属）
  userId?: ID; // 作成したユーザーID（将来的なマルチユーザー対応用）
}

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
  profitabilityResultId?: string; // 収益性試算結果ID（名前を明確化）
  userId?: ID; // 作成したユーザーID（将来的なマルチユーザー対応用）
}


// 更新履歴エントリの型
export interface HistoryEntry extends Timestamps {
  id: ID;
  propertyId: ID; // 関連物件ID
  userId: ID; // 変更したユーザーID
  action: string; // 実行したアクション
  details: string; // 変更の詳細
}

/**
 * =================
 * レポート関連の型定義
 * =================
 */

// レポートタイプの列挙型
export enum ReportType {
  VOLUME_CHECK = 'volume-check',    // ボリュームチェックレポート
  PROFITABILITY = 'profitability',  // 収益性試算レポート
  COMBINED = 'combined'             // 複合レポート（両方を含む）
}

// レポート出力形式の列挙型
export enum ReportFormat {
  PDF = 'pdf',    // PDF形式
  CSV = 'csv'     // CSV形式（将来拡張用）
}

// レポート生成リクエストの型
export interface ReportGenerateRequest {
  type: ReportType;                // レポートタイプ
  format: ReportFormat;            // 出力形式
  volumeCheckId?: ID;              // ボリュームチェックID（タイプがVOLUME_CHECKまたはCOMBINEDの場合必須）
  profitabilityId?: ID;            // 収益性試算ID（タイプがPROFITABILITYまたはCOMBINEDの場合必須）
  includeCharts?: boolean;         // グラフを含めるかどうか（デフォルトtrue）
  template?: string;               // 使用するテンプレート名（オプション）
  language?: string;               // レポート言語（デフォルト: ja）
}

// レポート生成レスポンスの型
export interface ReportGenerateResponse {
  reportUrl: string;               // 生成されたレポートのURL
  fileName: string;                // ファイル名
  expiresAt?: Date;                // URL有効期限（オプション）
}

/**
 * =================
 * 認証関連の型定義
 * =================
 */

// ユーザーロールの列挙型
export enum UserRole {
  ADMIN = 'ADMIN', // 管理者
  USER = 'USER',   // 一般ユーザー（将来拡張用）
  GUEST = 'GUEST'  // ゲスト（将来拡張用）
}

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

// リフレッシュトークンの型（DBモデルに対応）
export interface RefreshToken extends Timestamps {
  id: ID;
  userId: ID;        // ユーザーID
  token: string;     // トークン文字列
  expiresAt: Date;   // 有効期限
}

// JWT Payloadの型
export interface JwtPayload {
  sub: string;     // ユーザーID
  email: string;   // メールアドレス
  role: UserRole;  // ロール
  iat: number;     // 発行時間
  exp: number;     // 有効期限
}

/**
 * =================
 * APIパスの定義
 * =================
 */

export const API_PATHS = {
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
    DETAIL: (propertyId: string) => `/api/v1/properties/${propertyId}`,
    UPLOAD_SURVEY: '/api/v1/properties/upload-survey',
    SHAPE: (propertyId: string) => `/api/v1/properties/${propertyId}/shape`,
    DOCUMENTS: (propertyId: string) => `/api/v1/properties/${propertyId}/documents`,
    DOCUMENT: (propertyId: string, documentId: string) => `/api/v1/properties/${propertyId}/documents/${documentId}`,
    HISTORY: (propertyId: string) => `/api/v1/properties/${propertyId}/history`,
  },
  
  // ボリュームチェック関連
  ANALYSIS: {
    VOLUME_CHECK: '/api/v1/analysis/volume-check',
    VOLUME_CHECK_DETAIL: (volumeCheckId: string) => `/api/v1/analysis/volume-check/${volumeCheckId}`,
    PROFITABILITY: '/api/v1/analysis/profitability',
    PROFITABILITY_DETAIL: (profitabilityId: string) => `/api/v1/analysis/profitability/${profitabilityId}`,
    SCENARIOS: '/api/v1/analysis/scenarios',
    SCENARIO: (scenarioId: string) => `/api/v1/analysis/scenarios/${scenarioId}`,
    // レポート生成関連
    REPORT: '/api/v1/analysis/report',
    VOLUME_CHECK_REPORT: (volumeCheckId: string) => `/api/v1/analysis/report/volume-check/${volumeCheckId}`,
    PROFITABILITY_REPORT: (profitabilityId: string) => `/api/v1/analysis/report/profitability/${profitabilityId}`,
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
export const PUBLIC_ENDPOINTS = [
  API_PATHS.AUTH.LOGIN,
  API_PATHS.AUTH.REFRESH
];

// 固定管理者ユーザー（開発用）
export const FIXED_ADMIN_USER: AuthUser = {
  id: '1',
  email: 'higano@gmail.com',
  name: '管理者',
  role: UserRole.ADMIN
};

/**
 * =================
 * バリデーションルール
 * =================
 */

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
    geoLocation: { required: false },
  },
  
  // ジオコーディングバリデーション
  GEO: {
    address: { required: true, minLength: 3, maxLength: 200 },
    lat: { required: true, min: -90, max: 90 },
    lng: { required: true, min: -180, max: 180 },
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
  
  // 追加: 高度地区・地区計画パラメータのバリデーション
  ADVANCED_PROPERTY: {
    heightDistrict: { required: false },
    northBoundaryDistance: { required: false, min: 0 },
    'districtPlanInfo.wallSetbackDistance': { required: false, min: 0 },
    'districtPlanInfo.maxHeight': { required: false, min: 0 },
  },
  
  // レポート生成バリデーション
  REPORT: {
    type: { required: true, enum: Object.values(ReportType) },
    format: { required: true, enum: Object.values(ReportFormat) },
    volumeCheckId: { required: false },
    profitabilityId: { required: false },
    includeCharts: { required: false, type: 'boolean' },
    template: { required: false },
    language: { required: false, enum: ['ja', 'en'] },
  },
};