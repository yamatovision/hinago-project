# 建物形状最適化計画

## 現状の課題
- 敷地形状：正確な不整形地として表示（✅完了）
- 建物形状：単純な矩形ボックス（❌要改善）

## 改善方針

### 1. 基本的なアプローチ（簡易版）
```typescript
// 敷地境界から一定距離内側に建物を配置
function generateBuildingShape(siteShape: BoundaryPoint[], setback: number = 2) {
  // 各辺を内側にオフセット
  const buildingShape = offsetPolygon(siteShape, -setback);
  return buildingShape;
}
```

### 2. 高度なアプローチ（最適化版）
```typescript
interface BuildingOptimizationParams {
  siteShape: BoundaryPoint[];       // 敷地形状
  buildingCoverage: number;         // 建蔽率
  setbackDistances: {
    front: number;    // 道路境界線からのセットバック
    side: number;     // 隣地境界線からのセットバック
    rear: number;     // 後退距離
  };
  roadBoundaries: number[];         // 道路に面している辺のインデックス
}

// 建蔽率を最大化する建物形状を生成
function optimizeBuildingShape(params: BuildingOptimizationParams) {
  // 1. 道路境界線を識別
  // 2. 各境界線に応じたセットバックを適用
  // 3. 建蔽率制限内で最大の建築面積を確保
  // 4. 整形な建物形状に調整
}
```

### 3. 実装手順

#### Phase 1: シンプルな内側オフセット
1. 敷地境界線から一律2mセットバック
2. 建物形状も多角形として表示
3. 建築面積の自動計算

#### Phase 2: 建築規制の考慮
1. 道路斜線制限の適用
2. 隣地斜線制限の適用
3. 北側斜線制限の適用
4. 高さごとにセットバックを変更

#### Phase 3: AI最適化
1. 機械学習による最適配置
2. 日照条件の最適化
3. 眺望・プライバシーの考慮

## 技術的実装

### Three.jsでの実装例
```javascript
// 敷地形状から建物形状を生成
function createBuildingFromSite(sitePoints) {
  // Polygon offsetライブラリを使用
  const offsetter = new ClipperLib.ClipperOffset();
  const path = sitePoints.map(p => ({ X: p.x * 1000, Y: p.y * 1000 }));
  
  offsetter.AddPath(path, ClipperLib.JoinType.jtMiter, ClipperLib.EndType.etClosedPolygon);
  
  const solution = new ClipperLib.Paths();
  offsetter.Execute(solution, -2000); // 2mセットバック
  
  // Three.jsのShapeに変換
  const shape = new THREE.Shape();
  solution[0].forEach((point, index) => {
    const x = point.X / 1000;
    const y = point.Y / 1000;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  
  // ExtrudeGeometryで3D化
  const extrudeSettings = {
    steps: 1,
    depth: floorHeight * floors,
    bevelEnabled: false
  };
  
  return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}
```

## 期待される効果

1. **リアルな建物配置**: 実際の建築計画に近い表現
2. **正確な面積計算**: 不整形地での建築面積の正確な算出
3. **規制適合性**: 各種斜線制限の可視化
4. **最適化提案**: AIによる最適配置の提案

## 実装優先度

1. **必須**: 敷地形状に沿った建物形状（Phase 1）
2. **重要**: 建築規制の反映（Phase 2）
3. **将来**: AI最適化（Phase 3）