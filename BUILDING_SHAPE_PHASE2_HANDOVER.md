# 建物形状最適化 Phase 2 実装引き継ぎ書

## 1. プロジェクト概要

### 1.1 システム概要
HinagoProjectは不動産開発における建築可能ボリュームと収益性を分析するWebアプリケーションです。測量図から敷地形状を抽出し、建築規制を考慮した最適な建物形状を自動生成する機能を実装中です。

### 1.2 技術スタック
- **フロントエンド**: React + TypeScript + Three.js + MUI
- **バックエンド**: Node.js + Express + TypeScript + MongoDB
- **共通**: 型定義は`shared/index.ts`で一元管理

## 2. Phase 1 実装済み内容

### 2.1 実装済み機能
1. **測量図アップロード機能** ✅
   - PDFファイルのアップロード
   - 座標求積表から14点の座標データを抽出（現在はモック）
   - 座標確認・編集UI

2. **敷地形状データ管理** ✅
   - `PropertyShape`型に測量座標データを追加
   - 測量座標（62206.493, -53103.728等）から表示用座標への変換
   - 実測面積2500.01㎡の保持

3. **基本的な建物形状生成（Phase 1）** ✅
   - 敷地境界から一律2m内側にオフセット
   - 建蔽率チェック（制限超過時は追加セットバック）
   - 容積率から必要階数を自動計算
   - 3Dビューでの表示（敷地に沿った多角形建物）

### 2.2 主要ファイル構成

#### バックエンド
```
backend/src/features/analysis/
├── analysis.utils.ts          # ボリュームチェック計算ロジック
├── utils/
│   └── buildingShapeGenerator.ts  # 建物形状生成ユーティリティ
└── regulation/                # 建築規制関連（既存）
```

#### フロントエンド
```
frontend/src/features/
├── analysis/
│   ├── utils/
│   │   └── buildingShapeGenerator.ts  # 建物形状生成（未使用）
│   └── components/
│       └── ThreeViewer/
│           └── BuildingModel.tsx      # 3D建物表示コンポーネント
└── properties/
    └── components/
        └── CoordinateInput/           # 座標入力UI
```

### 2.3 データフロー
```
1. 測量図PDF → 座標データ抽出（モック）
2. PropertyShape.coordinatePoints に座標保存
3. ボリュームチェック時に buildingShapeGenerator.generateBuildingFromPropertyShape() を呼び出し
4. 敷地形状から2m内側にオフセットした建物形状を生成
5. model3dData.data.building.floors に階層ごとの形状データを格納
6. ThreeViewer/BuildingModel.tsx で ExtrudeGeometry を使用して3D表示
```

## 3. Phase 2 実装要件

### 3.1 概要
境界線の種別（道路/隣地）を自動判定し、それぞれに適切なセットバック距離を適用する。

### 3.2 機能要件

#### 3.2.1 境界線種別の自動判定
- **要件ID**: BSO-002
- **内容**: 各境界線が道路に面しているか隣地に面しているかを判定

**判定ロジック案**:
1. 物件の`roadWidth`（前面道路幅員）情報を使用
2. 最も長い辺を道路側と推定（一般的なケース）
3. 将来的には方位情報や都市計画データと連携

#### 3.2.2 境界線別セットバック距離
- **道路境界線**: 4m以上（建築基準法42条）
  - 4m未満の道路の場合は道路中心から2mまでセットバック
- **隣地境界線**: 0.5m以上（民法234条）
  - 商業地域等では0mも可能

### 3.3 実装手順

#### Step 1: 境界線分析機能の実装
`backend/src/features/analysis/utils/boundaryAnalyzer.ts` を新規作成

```typescript
interface BoundarySegment {
  startPoint: BoundaryPoint;
  endPoint: BoundaryPoint;
  length: number;
  angle: number;  // 北を0度とした方位角
  type?: 'road' | 'neighbor' | 'unknown';
}

interface BoundaryAnalysisResult {
  segments: BoundarySegment[];
  roadSegments: number[];      // 道路に面している辺のインデックス
  neighborSegments: number[];  // 隣地に面している辺のインデックス
}

// 境界線を分析して種別を判定
export function analyzeBoundaries(
  points: BoundaryPoint[],
  roadWidth?: number,
  roadDirection?: number  // 道路の方位（オプション）
): BoundaryAnalysisResult
```

#### Step 2: 建物形状生成の拡張
`backend/src/features/analysis/utils/buildingShapeGenerator.ts` を更新

```typescript
// Phase 2: 境界線種別を考慮した建物形状生成
export function generateAdvancedBuildingShape(
  siteShape: BoundaryPoint[],
  siteArea: number,
  buildingCoverage: number,
  floorAreaRatio: number,
  floorHeight: number,
  boundaryAnalysis: BoundaryAnalysisResult,
  maxHeight?: number
): BuildingShape {
  // 各辺に対して個別のセットバックを適用
  // 1. 各境界線セグメントに対してオフセット距離を決定
  // 2. 道路側: 4m、隣地側: 0.5m
  // 3. 不等間隔オフセットアルゴリズムを実装
}
```

#### Step 3: ポリゴンオフセットアルゴリズムの改良
現在の`offsetPolygonSimple`は中心点からの単純な縮小のため、不等間隔オフセットに対応できません。

**推奨ライブラリ**:
- `clipper-lib`: 高精度なポリゴンオフセット
- `turf.js`: 地理空間演算ライブラリ

```bash
npm install clipper-lib @turf/turf
```

### 3.4 テストケース

#### ケース1: 角地物件
- 2辺が道路に面している
- 道路側: 4mセットバック
- 隣地側: 0.5mセットバック

#### ケース2: 旗竿地
- 狭い接道部分の判定
- 奥側は全て隣地境界

### 3.5 UI/UX更新

#### セットバック設定UI
`frontend/src/features/analysis/components/VolumeCheckForm.tsx` に追加

```typescript
interface SetbackSettings {
  mode: 'auto' | 'manual';  // 自動判定 or 手動設定
  roadSetback: number;      // 道路側セットバック（m）
  neighborSetback: number;  // 隣地側セットバック（m）
  customSegments?: {        // セグメント別カスタム設定
    [segmentIndex: number]: {
      type: 'road' | 'neighbor';
      distance: number;
    }
  }
}
```

#### 境界線種別の可視化
- 道路境界: 青色の線
- 隣地境界: 緑色の線
- セットバックライン: 点線で表示

## 4. Phase 2 成果物

### 4.1 必須成果物
1. 境界線自動判定機能
2. 境界種別に応じたセットバック適用
3. 不等間隔ポリゴンオフセットの実装
4. テストケースの実装と検証

### 4.2 ドキュメント
- 境界線判定アルゴリズムの技術仕様
- セットバック計算のフローチャート
- APIドキュメントの更新

## 5. 注意事項

### 5.1 既存機能との互換性
- Phase 1の一律セットバックモードは残す（fallback用）
- 既存のVolumeCheckデータ構造を破壊しない
- 3D表示は自動的に新形状に対応（実装済み）

### 5.2 パフォーマンス
- ポリゴン演算は計算コストが高いため、キャッシュを検討
- 大規模な座標データ（100点以上）への対応

### 5.3 エラーハンドリング
- 自己交差するポリゴンの処理
- セットバック後に建築面積が0になる場合
- 不正な座標データへの対処

## 6. 開発環境セットアップ

```bash
# リポジトリクローン後
cd HinagoProject★3

# バックエンド
cd backend
npm install
npm install clipper-lib @turf/turf @types/geojson
npm run dev

# フロントエンド（別ターミナル）
cd ../frontend
npm install
npm run dev

# MongoDB起動（別ターミナル）
brew services start mongodb-community
```

## 7. 動作確認手順

1. http://localhost:3001 でログイン
   - Email: `higano@gmail.com`
   - Password: `aikakumei`

2. 物件詳細ページ > 敷地形状タブ
   - 測量図PDFをアップロード
   - 座標データを確認（14点のポリゴン）

3. ボリュームチェック実行
   - 3Dビューで建物形状を確認
   - 現状: 敷地から一律2m内側の建物
   - Phase 2後: 道路側4m、隣地側0.5mのセットバック

## 8. 参考資料

- [要件定義書](./BUILDING_SHAPE_OPTIMIZATION_REQUIREMENTS.md)
- [Phase 1実装メモ](./BUILDING_SHAPE_OPTIMIZATION.md)
- [座標データ抽出計画](./COORDINATE_EXTRACTION_PLAN.md)
- 建築基準法42条（道路）
- 民法234条（境界線付近の建築制限）

## 9. 連絡事項

Phase 2実装時の疑問点や設計判断が必要な場合は、以下の観点で判断してください：
1. **実用性**: 実際の建築設計で使える精度
2. **拡張性**: Phase 3（斜線制限）への移行を考慮
3. **保守性**: コードの可読性とテスタビリティ

成功を祈っています！🏗️