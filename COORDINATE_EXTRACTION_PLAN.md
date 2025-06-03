# 座標データ抽出・敷地形状生成 実装計画

## 概要
測量図PDFから座標求積表のデータを抽出し、正確な敷地形状をボリュームチェックに反映させる機能の実装計画。

## 座標データ構造（画像から確認）
```
地番: 32
座標点一覧:
- KK1: X=62206.493, Y=-53103.728, 辺長=22.729
- KK2: X=62220.989, Y=-53121.235, 辺長=21.006
- FK3: X=62204.821, Y=-53134.645, 辺長=11.100
... （計14点）
```

倍面積: 5000.036646
面積: 2500.018323㎡
地積: 2500.01㎡

## 実装手順

### 1. データモデルの拡張
```typescript
interface CoordinatePoint {
  id: string;        // 点番号（KK1, FK3など）
  x: number;         // X座標（測量座標系）
  y: number;         // Y座標（測量座標系）
  length?: number;   // 次の点までの辺長
}

interface PropertyShape {
  points: Array<{x: number; y: number}>; // 表示用座標
  coordinatePoints?: CoordinatePoint[];   // 元の測量座標
  area?: number;                          // 面積（㎡）
  perimeter?: number;                     // 周長（m）
  coordinateSystem?: string;              // 座標系（例：平面直角座標系）
}
```

### 2. 座標変換ロジック
```typescript
// 測量座標から表示用座標への変換
function convertSurveyToDisplay(coordinatePoints: CoordinatePoint[]) {
  // 1. 最小値を求めて原点調整
  const minX = Math.min(...coordinatePoints.map(p => p.x));
  const minY = Math.min(...coordinatePoints.map(p => p.y));
  
  // 2. スケール調整（適切な表示サイズに）
  const points = coordinatePoints.map(p => ({
    x: (p.x - minX) * 0.001, // メートル単位に変換
    y: (p.y - minY) * 0.001
  }));
  
  return points;
}
```

### 3. 面積計算アルゴリズム
```typescript
// 座標法による面積計算（ガウスの公式）
function calculateArea(points: CoordinatePoint[]): number {
  let area = 0;
  const n = points.length;
  
  for (let i = 0; i < n - 1; i++) {
    area += (points[i].x * points[i + 1].y - points[i + 1].x * points[i].y);
  }
  
  return Math.abs(area) / 2;
}
```

### 4. PDFからの座標抽出方法

#### オプション1: OCR + パターンマッチング
- PDF.jsでPDFをレンダリング
- Tesseract.jsでOCR処理
- 正規表現で座標データを抽出

#### オプション2: サーバーサイド処理
- Python（PyPDF2 + 表認識ライブラリ）
- 座標表を自動検出・抽出
- APIで座標データを返す

#### オプション3: 半自動アプローチ（推奨）
- ユーザーが座標表部分を選択
- 選択範囲をOCR処理
- 抽出結果を確認・修正可能なUIを提供

### 5. ボリュームチェックへの統合

```typescript
// ボリュームチェック時の処理フロー
1. 測量図アップロード
2. 座標データ抽出（自動/半自動）
3. 敷地形状の生成
4. 正確な面積・建築可能エリアの計算
5. 建蔽率・容積率の精密計算
6. 3Dモデルへの反映
```

## 実装の優先順位

1. **Phase 1**: 手動入力による座標データ対応
   - 座標入力フォーム
   - 形状生成・表示
   - 面積計算

2. **Phase 2**: PDF解析の自動化
   - OCR機能の実装
   - 座標表の自動認識

3. **Phase 3**: 高度な機能
   - DXF/DWG形式のサポート
   - 複数地番の結合
   - 道路・隣地境界の自動判定

## 期待される効果

1. **精度向上**: 実測値に基づく正確な計算
2. **作業効率化**: 手入力の削減
3. **エラー防止**: 入力ミスの排除
4. **複雑な敷地対応**: 不整形地でも正確に処理