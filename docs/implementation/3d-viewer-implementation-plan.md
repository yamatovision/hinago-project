# ボリュームチェック3Dビューアー実装計画

**作成日**: 2025年5月19日  
**ステータス**: 計画段階  
**担当**: フロントエンド開発チーム

## 1. 概要

本計画書は、ボリュームチェック機能において3Dモデルビューアーを実装するための計画を記述したものです。この3Dビューアーは、建築可能ボリュームを視覚的に表示し、ユーザーがさまざまな角度から建物モデルを確認できるようにします。

## 2. 技術選定

### 2.1 ライブラリ選定

| ライブラリ名 | バージョン | 用途 | 選定理由 |
|------------|-----------|------|----------|
| Three.js | ^0.156.1 | 3Dレンダリングエンジン | Webブラウザ上での3D表示に最も広く使われているライブラリ。WebGLを抽象化して使いやすいAPIを提供 |
| React Three Fiber | ^8.15.11 | ReactのThree.js用フレームワーク | ReactコンポーネントとしてThree.jsを扱えるようにするため |
| @react-three/drei | ^9.88.2 | Three.js用ユーティリティ | カメラコントロール、ライティング、シャドウなどの便利な機能を提供 |
| zustand | ^4.4.6 | 状態管理 | 3Dモデルの状態管理に必要な軽量な状態管理ライブラリ |

### 2.2 導入方法

```bash
# 開発環境に必要なライブラリをインストール
npm install three @types/three @react-three/fiber @react-three/drei zustand
```

## 3. 機能要件

### 3.1 基本機能

- [x] 建築物の3Dモデル表示
- [x] 敷地形状の表示
- [x] オービットコントロール（回転、ズーム、パン）
- [x] 階別の表示切替

### 3.2 拡張機能

- [ ] 建物の断面表示
- [ ] 日影シミュレーション
- [ ] 各階の用途による色分け表示
- [ ] 測定ツール（距離、面積）
- [ ] スクリーンショット機能

## 4. コンポーネント設計

```
src/
└── features/
    └── analysis/
        └── components/
            ├── ThreeViewer/
            │   ├── index.ts
            │   ├── ThreeViewer.tsx       # メインビューアーコンポーネント
            │   ├── BuildingModel.tsx     # 建物モデルコンポーネント
            │   ├── SiteModel.tsx         # 敷地モデルコンポーネント
            │   ├── Controls.tsx          # カメラコントロール
            │   ├── Lighting.tsx          # ライティング設定
            │   └── helpers/
            │       ├── useThreeStore.ts  # 3D状態管理
            │       └── modelUtils.ts     # モデル操作ユーティリティ
            └── ThreeViewerControls/
                ├── index.ts
                ├── ThreeViewerControls.tsx  # コントロールパネル
                ├── ViewOptions.tsx          # 表示オプション
                └── FloorSelector.tsx        # 階選択UI
```

## 5. データフロー

1. VolumeCheckResult コンポーネントから ThreeViewer に建物データを渡す
2. ThreeViewer は以下のプロパティを受け取る:
   - volumeCheck: ボリュームチェック結果データ
   - property: 物件情報データ
   - options: 表示オプション設定
3. BuildingModel コンポーネントが建物の3Dモデルを生成
4. SiteModel コンポーネントが敷地の3Dモデルを生成
5. Controls コンポーネントがインタラクションを処理
6. ユーザー操作に応じて zustand ストアが状態を更新

## 6. モデル生成ロジック

### 6.1 敷地モデル生成

```typescript
// 敷地形状からThree.jsのShapeを生成
function createSiteShape(points: BoundaryPoint[]): THREE.Shape {
  const shape = new THREE.Shape();
  
  // 最初の点から始める
  if (points.length > 0) {
    shape.moveTo(points[0].x, points[0].y);
    
    // 残りの点を線で結ぶ
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i].x, points[i].y);
    }
    
    // 形状を閉じる
    shape.lineTo(points[0].x, points[0].y);
  }
  
  return shape;
}
```

### 6.2 建物モデル生成

```typescript
// ボリュームチェック結果から建物モデルを生成
function createBuildingModel(volumeCheck: VolumeCheck): THREE.Group {
  const building = new THREE.Group();
  
  // 各階のデータを取得
  const floors = volumeCheck.floorBreakdown || [];
  
  // 階ごとに異なるジオメトリを生成
  floors.forEach((floor, index) => {
    const floorHeight = volumeCheck.buildingHeight / volumeCheck.floors;
    const geometry = new THREE.BoxGeometry(
      Math.sqrt(floor.floorArea), // 幅
      floorHeight, // 高さ
      Math.sqrt(floor.floorArea) // 奥行き
    );
    
    const material = new THREE.MeshPhongMaterial({
      color: 0x2196f3,
      transparent: true,
      opacity: 0.7,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = index * floorHeight + floorHeight / 2;
    mesh.userData.floorInfo = floor; // フロア情報を保存
    
    building.add(mesh);
  });
  
  return building;
}
```

## 7. ユーザーインタラクション

- **回転**: マウスの左ボタンドラッグ
- **パン**: マウスの右ボタンドラッグ
- **ズーム**: マウスホイールまたはピンチジェスチャー
- **階表示切替**: UI上のチェックボックスまたはスライダー
- **表示モード切替**: UI上のラジオボタンまたはタブ

## 8. モバイル対応

- タッチイベントによるカメラ操作
- 画面サイズに応じたレスポンシブレイアウト
- パフォーマンス最適化（ポリゴン数削減、テクスチャサイズ制限）

## 9. パフォーマンス最適化

- レンダリング品質とパフォーマンスのバランス調整
- デバイス性能に応じた自動調整機能
- ジオメトリとテクスチャのキャッシング
- 視点からの距離に応じたLOD（Level of Detail）実装

## 10. 実装ステップ

1. **準備フェーズ (1日)**
   - 必要なライブラリの導入
   - プロジェクト構造の整備

2. **基本実装フェーズ (3日)**
   - ThreeViewer コンポーネントの実装
   - 建物と敷地のベーシックなモデル表示
   - カメラコントロール実装

3. **機能拡張フェーズ (4日)**
   - 階別表示切替機能
   - コントロールパネル実装
   - ライティング調整

4. **最適化フェーズ (2日)**
   - パフォーマンス最適化
   - モバイル対応
   - エラーハンドリング

5. **テストとデバッグ (2日)**
   - クロスブラウザテスト
   - さまざまなデバイスでのテスト
   - エッジケースの対応

## 11. コード例

### 11.1 ThreeViewer コンポーネントの基本構造

```tsx
// ThreeViewer.tsx
import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid } from '@react-three/drei';
import { VolumeCheck, Property } from 'shared';
import { BuildingModel } from './BuildingModel';
import { SiteModel } from './SiteModel';
import { Lighting } from './Lighting';

interface ThreeViewerProps {
  volumeCheck: VolumeCheck;
  property: Property;
  options?: {
    showFloors?: number[];
    showSite?: boolean;
    showGrid?: boolean;
    viewMode?: 'normal' | 'wireframe' | 'xray';
  };
}

export const ThreeViewer: React.FC<ThreeViewerProps> = ({
  volumeCheck,
  property,
  options = {
    showFloors: undefined, // undefined means all floors
    showSite: true,
    showGrid: true,
    viewMode: 'normal',
  },
}) => {
  return (
    <div style={{ width: '100%', height: '400px', position: 'relative' }}>
      <Canvas camera={{ position: [20, 20, 20], fov: 50 }}>
        {/* 環境設定 */}
        <color attach="background" args={['#f0f0f0']} />
        <fog attach="fog" args={['#f0f0f0', 30, 100]} />
        <Lighting />
        <Environment preset="city" />
        
        {/* グリッドと座標軸 */}
        {options.showGrid && (
          <>
            <Grid infiniteGrid fadeDistance={50} />
            <axesHelper args={[5]} />
          </>
        )}
        
        {/* 敷地モデル */}
        {options.showSite && property.shapeData && (
          <SiteModel shapeData={property.shapeData} />
        )}
        
        {/* 建物モデル */}
        <BuildingModel 
          volumeCheck={volumeCheck} 
          showFloors={options.showFloors}
          viewMode={options.viewMode} 
        />
        
        {/* カメラコントロール */}
        <OrbitControls 
          enableDamping 
          dampingFactor={0.05} 
          minDistance={5}
          maxDistance={100}
        />
      </Canvas>
    </div>
  );
};
```

## 12. リスクと対策

| リスク | 影響度 | 対策 |
|-------|--------|------|
| 低スペックデバイスでのパフォーマンス問題 | 高 | 自動品質調整機能の実装、軽量モードの提供 |
| ブラウザの互換性問題 | 中 | 主要ブラウザでのテスト、フォールバック機能の実装 |
| 3Dデータの生成ロジックの複雑化 | 中 | モジュール分割、再利用可能なユーティリティ作成 |
| メモリリーク | 高 | 適切なリソース解放、コンポーネントのマウント/アンマウント処理の徹底 |
| モバイルでのタッチ操作の難しさ | 中 | モバイル用の簡易操作モードの実装 |

## 13. 今後の拡張計画

フェーズ2での機能拡張候補:

1. **高度な日影シミュレーション**
   - 季節・時間帯による日影変化
   - 周辺建物を考慮した日影計算

2. **AR連携**
   - 実際の現場でのAR表示
   - QRコードによる3Dモデル共有

3. **エクスポート機能**
   - glTF, OBJ, FBXなどの一般的な3Dフォーマットへのエクスポート
   - CADソフトへの連携

4. **周辺環境シミュレーション**
   - 風の流れのシミュレーション
   - 景観評価

## 14. まとめ

本計画書に基づいて3Dモデルビューアーを実装することで、ユーザーは建築可能ボリュームを視覚的に把握し、より良い意思決定を行うことができるようになります。実装は段階的に進め、基本機能の安定動作を確保した上で拡張機能の追加を検討します。