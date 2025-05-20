# 複雑な建物形状対応の実装計画

**作成日**: 2025年5月20日  
**ステータス**: 計画段階  
**担当**: バックエンド・フロントエンド開発チーム

## 1. 概要

本計画書は、日影シミュレーションと建築規制計算における複雑な建物形状への対応を実装するための計画を記述したものです。現在の直方体を基本とした単純な建物形状モデルを拡張し、セットバック、階段状、L字型などの複合形状に対応させることで、実際の建築プロジェクトにより近い日影計算と規制適合判定を可能にします。

## 2. 対応するAPIエンドポイント

### 2.1 メイン対象エンドポイント

| メソッド | エンドポイント | 概要 | 認証レベル |
|---------|--------------|------|----------|
| POST | `/api/v1/analysis/volume-check` | 建築可能ボリュームの計算実行 | 認証必須 |
| POST | `/api/v1/analysis/shape-optimization` | 形状最適化計算（新規） | 認証必須 |

APIのリクエスト・レスポンス構造を拡張し、複合形状の入力と計算結果の返却に対応します。既存のエンドポイントとの互換性を維持しつつ、新たな形状表現のパラメータを追加します。

## 3. データモデル拡張

### 3.1 shared/index.ts への追加

以下の型定義を `shared/index.ts` に追加します：

```typescript
// 建物形状の種類の列挙型
export enum BuildingShapeType {
  SIMPLE_CUBOID = 'simple-cuboid',     // 単純な直方体
  SETBACK = 'setback',                 // セットバック形状
  STEPPED = 'stepped',                 // 階段状形状 
  L_SHAPED = 'l-shaped',               // L字型
  U_SHAPED = 'u-shaped',               // U字型
  COMPOSITE = 'composite',             // 複合形状
  CUSTOM = 'custom',                   // カスタム形状
}

// 形状コンポーネント（部分形状）
export interface ShapeComponent {
  type: BuildingShapeType;             // 形状タイプ
  position: {                          // 相対位置
    x: number;
    y: number;
    z: number;
  };
  dimensions: {                        // 寸法
    width: number;
    depth: number;
    height: number;
  };
  rotation: number;                    // Z軸回りの回転角度（度）
}

// セットバック形状の詳細パラメータ
export interface SetbackShapeParams {
  baseFloors: number;                  // 基部階数
  baseWidth: number;                   // 基部幅
  baseDepth: number;                   // 基部奥行
  setbackWidth: number;                // セットバック幅
  setbackDepth: number;                // セットバック奥行
  setbackFloors: number;               // セットバック部分の階数
}

// 階段状形状の詳細パラメータ
export interface SteppedShapeParams {
  sections: {                          // 各セクション
    floors: number;                    // 階数
    width: number;                     // 幅
    depth: number;                     // 奥行
    setbackX?: number;                 // X方向のセットバック距離
    setbackY?: number;                 // Y方向のセットバック距離
  }[];
  direction: 'north' | 'east' | 'south' | 'west'; // 階段状のセットバック方向
}

// L字型形状の詳細パラメータ
export interface LShapedParams {
  mainWing: {                          // メインウィング
    width: number;
    depth: number;
    floors: number;
  };
  secondaryWing: {                     // セカンダリウィング
    width: number;
    depth: number;
    floors: number;
    position: 'northeast' | 'northwest' | 'southeast' | 'southwest'; // 位置
  };
}

// 複合形状（カスタム）
export interface CompositeShapeParams {
  components: ShapeComponent[];        // 構成コンポーネント
}

// ボリュームチェックパラメータの拡張
export interface BuildingShapeParams {
  shapeType: BuildingShapeType;        // 形状タイプ
  setbackParams?: SetbackShapeParams;  // セットバック形状のパラメータ
  steppedParams?: SteppedShapeParams;  // 階段状形状のパラメータ
  lShapedParams?: LShapedParams;       // L字型形状のパラメータ
  compositeParams?: CompositeShapeParams; // 複合形状のパラメータ
}

// 建築パラメータの拡張
export interface BuildingParams {
  // ... 既存のフィールド ...
  
  // 形状関連（新規）
  shapeParams?: BuildingShapeParams;   // 形状パラメータ
}

// 3Dモデルデータの拡張
export interface Model3DData {
  // ... 既存のフィールド ...
  
  // 形状関連（新規）
  shapeType: BuildingShapeType;        // 形状タイプ
  components?: {                       // 建物コンポーネント
    position: [number, number, number];// 位置
    dimensions: [number, number, number]; // 寸法
    rotation: number;                  // 回転
    floors: number;                    // 階数
  }[];
}

// 日影計算最適化オプション
export interface ShadowCalculationOptions {
  // ... 既存のフィールド ...
  
  // 複合形状最適化（新規）
  enableComponentCulling?: boolean;    // コンポーネント単位での視界外カリング
  useSimplifiedGeometry?: boolean;     // 遠距離での簡略化ジオメトリ使用
  accuracyLevel?: 'low' | 'medium' | 'high'; // 計算精度レベル
}
```

### 3.2 backend/src/types/index.ts への反映

`backend/src/types/index.ts` に `shared/index.ts` で追加された型定義を同様にコピーします。

## 4. ディレクトリ構造と実装ファイル

### 4.1 既存のファイル更新

```
backend/
└── src/
    ├── features/
    │   └── analysis/
    │       ├── analysis.controller.ts  # 一部更新
    │       ├── analysis.service.ts     # 大幅更新
    │       ├── analysis.utils.ts       # 一部更新
    │       └── analysis.validator.ts   # 一部更新
    ├── db/
    │   └── models/
    │       ├── VolumeCheck.ts          # 一部更新
    │       └── schemas/
    │           └── volumeCheck.schema.ts # 一部更新
    └── types/
        └── index.ts                   # 型定義追加
```

### 4.2 新規追加ファイル

```
backend/
└── src/
    └── features/
        └── analysis/
            └── building-shape/
                ├── index.ts                  # 建物形状モジュールのエクスポート
                ├── shapeFactory.ts           # 形状ファクトリー
                ├── shapeComponent.ts         # 形状コンポーネント基底クラス
                ├── cuboidShape.ts            # 直方体形状
                ├── setbackShape.ts           # セットバック形状
                ├── steppedShape.ts           # 階段状形状
                ├── lShapedShape.ts           # L字型形状
                ├── compositeShape.ts         # 複合形状
                ├── shapeOptimization.ts      # 形状最適化アルゴリズム
                └── shapeUtils.ts             # 形状ユーティリティ関数
```

### 4.3 フロントエンド更新ファイル

```
frontend/
└── src/
    └── features/
        └── analysis/
            ├── components/
            │   ├── ThreeViewer/
            │   │   ├── BuildingModel.tsx         # 大幅更新
            │   │   ├── BuildingComponents.tsx    # 新規作成
            │   │   ├── ShadowVisualization.tsx   # 一部更新
            │   │   └── helpers/
            │   │       ├── shapeModelUtils.ts    # 新規作成
            │   │       └── useThreeStore.ts      # 一部更新
            │   ├── ThreeViewerControls/
            │   │   ├── BuildingShapeControls.tsx # 新規作成
            │   │   └── index.ts                  # 一部更新
            │   ├── BuildingShapeSelector/
            │   │   ├── ShapeSelector.tsx         # 新規作成
            │   │   ├── SetbackForm.tsx           # 新規作成
            │   │   ├── SteppedForm.tsx           # 新規作成
            │   │   ├── LShapedForm.tsx           # 新規作成
            │   │   └── CompositeShapeEditor.tsx  # 新規作成
            │   └── VolumeCheckForm.tsx          # 一部更新
            └── api/
                └── volumeCheck.ts               # 一部更新
```

## 5. 実装難易度の評価

### 全体的な難易度
- **難易度**: 高
- **工数の目安**: 約5～7人週（開発者1人の場合）

### 領域別の難易度

1. **建物形状モデリングの拡張**:
   - **難易度**: 高
   - **工数**: 約2人週
   - **理由**: 複雑な幾何学的計算とモデリングが必要。データ構造も複雑で、様々な形状パターンに対応する柔軟な設計が必要。

2. **複合形状での日影シミュレーション**:
   - **難易度**: 高
   - **工数**: 約2人週
   - **理由**: 複合形状に対する光線追跡と交差判定のアルゴリズムが複雑。また、パフォーマンスを維持しながら精度を確保する必要がある。

3. **UI/UXの実装**:
   - **難易度**: 中～高
   - **工数**: 約1.5人週
   - **理由**: 複雑な形状を直感的に編集できるインターフェースの設計が必要。Three.jsと連携した3Dエディタライクな機能も実装。

4. **パフォーマンス最適化**:
   - **難易度**: 中～高
   - **工数**: 約0.5人週
   - **理由**: 複合形状でのシミュレーション負荷増大に対応するための最適化戦略が必要。

5. **テストとバグ修正**:
   - **難易度**: 高
   - **工数**: 約1人週
   - **理由**: 複雑な形状と日影計算の組み合わせで、エッジケースが多く、テスト設計と実行が複雑になる。

## 6. 実装する形状モデル機能

### 6.1 形状ファクトリーの実装

```typescript
/**
 * 建物形状ファクトリークラス
 * 異なる形状タイプのインスタンスを生成
 */
export class BuildingShapeFactory {
  /**
   * 指定された形状タイプと設定に基づいて建物形状を生成
   * @param shapeType 形状タイプ
   * @param params 建築パラメータ
   * @param property 物件データ
   * @returns 建物形状インスタンス
   */
  static createShape(
    shapeType: BuildingShapeType,
    params: BuildingParams,
    property: Property
  ): IBuildingShape {
    switch (shapeType) {
      case BuildingShapeType.SIMPLE_CUBOID:
        return new CuboidShape(params, property);
        
      case BuildingShapeType.SETBACK:
        if (!params.shapeParams?.setbackParams) {
          throw new Error('セットバック形状のパラメータが必要です');
        }
        return new SetbackShape(params, property, params.shapeParams.setbackParams);
        
      case BuildingShapeType.STEPPED:
        if (!params.shapeParams?.steppedParams) {
          throw new Error('階段状形状のパラメータが必要です');
        }
        return new SteppedShape(params, property, params.shapeParams.steppedParams);
        
      case BuildingShapeType.L_SHAPED:
        if (!params.shapeParams?.lShapedParams) {
          throw new Error('L字型形状のパラメータが必要です');
        }
        return new LShapedShape(params, property, params.shapeParams.lShapedParams);
        
      case BuildingShapeType.COMPOSITE:
        if (!params.shapeParams?.compositeParams) {
          throw new Error('複合形状のパラメータが必要です');
        }
        return new CompositeShape(params, property, params.shapeParams.compositeParams);
        
      default:
        throw new Error(`未対応の形状タイプ: ${shapeType}`);
    }
  }
}
```

### 6.2 複合形状の基底インターフェース

```typescript
/**
 * 建物形状インターフェース
 * すべての形状タイプの基底
 */
export interface IBuildingShape {
  /**
   * 建物の頂点を生成
   * @returns 頂点座標の配列
   */
  generateVertices(): Point3D[];
  
  /**
   * 建物の面ポリゴンを生成
   * @returns 面ポリゴンの配列
   */
  generateFaces(): Face3D[];
  
  /**
   * 建物の最大高さを取得
   * @returns 最大高さ（メートル）
   */
  getMaxHeight(): number;
  
  /**
   * 影の計算に使用する建物の境界ボックスを取得
   * @returns 境界ボックス
   */
  getBoundingBox(): BoundingBox;
  
  /**
   * 点が建物内部（または真上）にあるかチェック
   * @param point チェックする点
   * @returns 内部にある場合true
   */
  containsPoint(point: Point3D): boolean;
  
  /**
   * 光線が建物と交差するかチェック
   * @param ray 光線ベクトル
   * @param origin 光線の原点
   * @returns 交差する場合は交差点、しない場合はnull
   */
  intersectRay(ray: Vector3D, origin: Point3D): Point3D | null;
  
  /**
   * 建物の総床面積を計算
   * @returns 総床面積（平方メートル）
   */
  calculateTotalFloorArea(): number;
  
  /**
   * 建物の3Dモデルデータを生成
   * @returns 3Dモデルデータ
   */
  generateModel3DData(): Model3DData;
}
```

### 6.3 セットバック形状の実装

```typescript
/**
 * セットバック形状クラス
 * 上層部がセットバックした建物形状
 */
export class SetbackShape implements IBuildingShape {
  private property: Property;
  private params: BuildingParams;
  private setbackParams: SetbackShapeParams;
  
  constructor(
    params: BuildingParams,
    property: Property,
    setbackParams: SetbackShapeParams
  ) {
    this.property = property;
    this.params = params;
    this.setbackParams = setbackParams;
  }
  
  /**
   * 建物の頂点を生成
   * 基部と上部の2つの直方体に対応する頂点を生成
   */
  generateVertices(): Point3D[] {
    const vertices: Point3D[] = [];
    const floorHeight = this.params.floorHeight;
    
    // プロパティの中心点（原点とする）
    const centerX = 0;
    const centerY = 0;
    
    // 基部の寸法（センタリング）
    const baseWidth = this.setbackParams.baseWidth;
    const baseDepth = this.setbackParams.baseDepth;
    const baseHeight = this.setbackParams.baseFloors * floorHeight;
    
    // 基部の頂点
    const baseVertices = this.generateCuboidVertices(
      centerX, centerY, 0,
      baseWidth, baseDepth, baseHeight
    );
    vertices.push(...baseVertices);
    
    // 上部の寸法（センタリング）
    const topWidth = this.setbackParams.setbackWidth;
    const topDepth = this.setbackParams.setbackDepth;
    const topHeight = this.setbackParams.setbackFloors * floorHeight;
    
    // 上部の位置（センタリング）
    const topX = centerX + (baseWidth - topWidth) / 2;
    const topY = centerY + (baseDepth - topDepth) / 2;
    
    // 上部の頂点
    const topVertices = this.generateCuboidVertices(
      topX, topY, baseHeight,
      topWidth, topDepth, topHeight
    );
    vertices.push(...topVertices);
    
    return vertices;
  }
  
  /**
   * 直方体の頂点を生成するヘルパーメソッド
   */
  private generateCuboidVertices(
    x: number, y: number, z: number,
    width: number, depth: number, height: number
  ): Point3D[] {
    const halfWidth = width / 2;
    const halfDepth = depth / 2;
    
    return [
      // 底面の頂点
      { x: x - halfWidth, y: y - halfDepth, z },
      { x: x + halfWidth, y: y - halfDepth, z },
      { x: x + halfWidth, y: y + halfDepth, z },
      { x: x - halfWidth, y: y + halfDepth, z },
      
      // 上面の頂点
      { x: x - halfWidth, y: y - halfDepth, z: z + height },
      { x: x + halfWidth, y: y - halfDepth, z: z + height },
      { x: x + halfWidth, y: y + halfDepth, z: z + height },
      { x: x - halfWidth, y: y + halfDepth, z: z + height }
    ];
  }
  
  /**
   * 建物の面を生成
   */
  generateFaces(): Face3D[] {
    // 実装省略（各面のポリゴン定義）
    return [];
  }
  
  /**
   * 最大高さを取得
   */
  getMaxHeight(): number {
    const baseHeight = this.setbackParams.baseFloors * this.params.floorHeight;
    const topHeight = this.setbackParams.setbackFloors * this.params.floorHeight;
    return baseHeight + topHeight;
  }
  
  /**
   * 総床面積を計算
   */
  calculateTotalFloorArea(): number {
    const baseArea = this.setbackParams.baseWidth * this.setbackParams.baseDepth;
    const topArea = this.setbackParams.setbackWidth * this.setbackParams.setbackDepth;
    
    const baseFloorArea = baseArea * this.setbackParams.baseFloors;
    const topFloorArea = topArea * this.setbackParams.setbackFloors;
    
    return baseFloorArea + topFloorArea;
  }
  
  /**
   * 光線と建物の交差判定
   */
  intersectRay(ray: Vector3D, origin: Point3D): Point3D | null {
    // 各部分形状との交差判定を行い、最も近い交差点を返す
    
    // 基部の交差判定
    const baseIntersection = this.intersectCuboid(
      ray, origin,
      0, 0, 0,
      this.setbackParams.baseWidth,
      this.setbackParams.baseDepth,
      this.setbackParams.baseFloors * this.params.floorHeight
    );
    
    // 上部の交差判定
    const baseHeight = this.setbackParams.baseFloors * this.params.floorHeight;
    const topX = (this.setbackParams.baseWidth - this.setbackParams.setbackWidth) / 2;
    const topY = (this.setbackParams.baseDepth - this.setbackParams.setbackDepth) / 2;
    
    const topIntersection = this.intersectCuboid(
      ray, origin,
      topX, topY, baseHeight,
      this.setbackParams.setbackWidth,
      this.setbackParams.setbackDepth,
      this.setbackParams.setbackFloors * this.params.floorHeight
    );
    
    // 交差点がない場合はnull
    if (!baseIntersection && !topIntersection) {
      return null;
    }
    
    // どちらかに交差した場合は、その交差点を返す
    if (!baseIntersection) return topIntersection;
    if (!topIntersection) return baseIntersection;
    
    // 両方に交差した場合は、より近い方を返す
    const baseDist = this.getDistance(origin, baseIntersection);
    const topDist = this.getDistance(origin, topIntersection);
    
    return baseDist < topDist ? baseIntersection : topIntersection;
  }
  
  /**
   * 直方体との光線交差判定ヘルパー
   */
  private intersectCuboid(
    ray: Vector3D, origin: Point3D,
    x: number, y: number, z: number,
    width: number, depth: number, height: number
  ): Point3D | null {
    // 実装省略（光線と直方体の交差判定）
    return null;
  }
  
  /**
   * 二点間の距離を計算
   */
  private getDistance(p1: Point3D, p2: Point3D): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  
  /**
   * 3Dモデルデータを生成
   */
  generateModel3DData(): Model3DData {
    return {
      modelType: 'three.js',
      shapeType: BuildingShapeType.SETBACK,
      components: [
        // 基部
        {
          position: [0, 0, 0],
          dimensions: [
            this.setbackParams.baseWidth,
            this.setbackParams.baseDepth,
            this.setbackParams.baseFloors * this.params.floorHeight
          ],
          rotation: 0,
          floors: this.setbackParams.baseFloors
        },
        // 上部
        {
          position: [
            (this.setbackParams.baseWidth - this.setbackParams.setbackWidth) / 2,
            (this.setbackParams.baseDepth - this.setbackParams.setbackDepth) / 2,
            this.setbackParams.baseFloors * this.params.floorHeight
          ],
          dimensions: [
            this.setbackParams.setbackWidth,
            this.setbackParams.setbackDepth,
            this.setbackParams.setbackFloors * this.params.floorHeight
          ],
          rotation: 0,
          floors: this.setbackParams.setbackFloors
        }
      ],
      data: {} // 追加データ（必要に応じて）
    };
  }
  
  // 他のメソッド実装（containsPoint, getBoundingBox など）
}
```

### 6.4 階段状形状の実装

```typescript
/**
 * 階段状形状クラス
 * 高さが段階的に変化する形状
 */
export class SteppedShape implements IBuildingShape {
  private property: Property;
  private params: BuildingParams;
  private steppedParams: SteppedShapeParams;
  
  constructor(
    params: BuildingParams,
    property: Property,
    steppedParams: SteppedShapeParams
  ) {
    this.property = property;
    this.params = params;
    this.steppedParams = steppedParams;
    
    // セクションを高さ順に並べ替え
    this.sortSectionsByHeight();
  }
  
  /**
   * セクションを高さの昇順に並べ替え
   */
  private sortSectionsByHeight(): void {
    this.steppedParams.sections.sort((a, b) => b.floors - a.floors);
  }
  
  /**
   * 頂点の生成
   */
  generateVertices(): Point3D[] {
    const vertices: Point3D[] = [];
    const floorHeight = this.params.floorHeight;
    
    // 各段ごとに頂点を生成
    let currentX = 0;
    let currentY = 0;
    let currentZ = 0;
    
    // 最初の段（最下部・最大サイズ）
    const baseSection = this.steppedParams.sections[0];
    
    // 方向に応じた処理
    // 北向きは+Y方向にステップアップ
    const isNorthDirection = this.steppedParams.direction === 'north';
    const isEastDirection = this.steppedParams.direction === 'east';
    
    // 各セクション（段）の頂点を生成
    for (let i = 0; i < this.steppedParams.sections.length; i++) {
      const section = this.steppedParams.sections[i];
      const sectionHeight = section.floors * floorHeight;
      
      // 各段の横幅と奥行き（最下部を基準にする）
      let sectionWidth = section.width;
      let sectionDepth = section.depth;
      
      // 位置調整（段ごとのオフセット）
      let adjustX = 0;
      let adjustY = 0;
      
      if (i > 0) {
        // 前のセクションからのセットバック
        const prevSection = this.steppedParams.sections[i - 1];
        
        // 方向に応じたセットバック
        if (isNorthDirection) {
          // 北向きの階段状：Y方向（奥行き）にセットバック
          adjustY = (prevSection.depth - section.depth) / 2;
        } else if (isEastDirection) {
          // 東向きの階段状：X方向（幅）にセットバック
          adjustX = (prevSection.width - section.width) / 2;
        }
        // （他の方向も同様に実装）
      }
      
      // セクションの頂点を生成
      const sectionVertices = this.generateCuboidVertices(
        currentX + adjustX, 
        currentY + adjustY, 
        currentZ,
        sectionWidth, 
        sectionDepth, 
        sectionHeight
      );
      
      vertices.push(...sectionVertices);
      
      // 次のセクションのZ座標（高さ）を更新
      currentZ += sectionHeight;
    }
    
    return vertices;
  }
  
  /**
   * 直方体の頂点を生成するヘルパーメソッド
   */
  private generateCuboidVertices(
    x: number, y: number, z: number,
    width: number, depth: number, height: number
  ): Point3D[] {
    // セットバック形状と同様の実装
    return [];
  }
  
  /**
   * 建物の面を生成
   */
  generateFaces(): Face3D[] {
    // 実装省略
    return [];
  }
  
  /**
   * 最大高さを取得
   */
  getMaxHeight(): number {
    // 全セクションの高さを合計
    return this.steppedParams.sections.reduce(
      (total, section) => total + section.floors * this.params.floorHeight, 
      0
    );
  }
  
  /**
   * 総床面積を計算
   */
  calculateTotalFloorArea(): number {
    // 各セクションの床面積を計算して合計
    return this.steppedParams.sections.reduce(
      (total, section) => total + (section.width * section.depth * section.floors), 
      0
    );
  }
  
  /**
   * 3Dモデルデータを生成
   */
  generateModel3DData(): Model3DData {
    const components: any[] = [];
    let currentZ = 0;
    
    // 各セクションのコンポーネントを生成
    for (let i = 0; i < this.steppedParams.sections.length; i++) {
      const section = this.steppedParams.sections[i];
      const sectionHeight = section.floors * this.params.floorHeight;
      
      // 位置調整
      let adjustX = 0;
      let adjustY = 0;
      
      if (i > 0) {
        // 前のセクションからのセットバック処理（方向に応じて）
        const prevSection = this.steppedParams.sections[i - 1];
        
        if (this.steppedParams.direction === 'north') {
          adjustY = (prevSection.depth - section.depth) / 2;
        } else if (this.steppedParams.direction === 'east') {
          adjustX = (prevSection.width - section.width) / 2;
        }
        // （他の方向も実装）
      }
      
      components.push({
        position: [adjustX, adjustY, currentZ],
        dimensions: [section.width, section.depth, sectionHeight],
        rotation: 0,
        floors: section.floors
      });
      
      // 次のセクションの高さを更新
      currentZ += sectionHeight;
    }
    
    return {
      modelType: 'three.js',
      shapeType: BuildingShapeType.STEPPED,
      components,
      data: {}
    };
  }
  
  // 他のメソッド実装（intersectRay, containsPoint, getBoundingBox など）
}
```

### 6.5 複合形状での日影計算の最適化

```typescript
/**
 * 複合形状用の最適化された日影計算
 * @param buildingShape 建物形状
 * @param grid 計算グリッド
 * @param sunPosition 太陽位置
 * @param options 最適化オプション
 * @returns 日影計算結果
 */
export function calculateOptimizedShadowForCompositeShape(
  buildingShape: IBuildingShape,
  grid: GridPoint[],
  sunPosition: SunPosition,
  options: ShadowCalculationOptions = {}
): { inShadow: boolean[] } {
  // 太陽光線ベクトルを計算
  const sunRay = calculateSunRayVector(sunPosition);
  
  // 建物の境界ボックスを取得（高速な事前判定用）
  const bbox = buildingShape.getBoundingBox();
  
  // 日影判定結果
  const inShadow: boolean[] = new Array(grid.length).fill(false);
  
  // 空間分割による最適化（オプション）
  if (options.enableComponentCulling) {
    // インデックスでグリッドを空間分割して並列処理
    const BATCH_SIZE = 500;
    const batchCount = Math.ceil(grid.length / BATCH_SIZE);
    
    // バッチごとに並列処理（WebWorkerを使用する場合はここで分割）
    for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
      const startIdx = batchIndex * BATCH_SIZE;
      const endIdx = Math.min((batchIndex + 1) * BATCH_SIZE, grid.length);
      
      for (let i = startIdx; i < endIdx; i++) {
        const point = grid[i];
        
        // 境界ボックスによる高速判定（明らかに影に入らない点をスキップ）
        if (!isPointPotentiallyInShadow(point, sunRay, bbox)) {
          continue;
        }
        
        // 建物形状との詳細な交差判定
        const intersection = buildingShape.intersectRay(sunRay, point);
        inShadow[i] = intersection !== null;
      }
    }
  } else {
    // 通常の処理（バッチ処理なし）
    for (let i = 0; i < grid.length; i++) {
      const point = grid[i];
      const intersection = buildingShape.intersectRay(sunRay, point);
      inShadow[i] = intersection !== null;
    }
  }
  
  return { inShadow };
}

/**
 * 点が潜在的に影に入る可能性があるかの高速判定
 * @param point グリッドポイント
 * @param sunRay 太陽光線ベクトル
 * @param bbox 建物の境界ボックス
 * @returns 影に入る可能性がある場合true
 */
function isPointPotentiallyInShadow(
  point: Point3D,
  sunRay: Vector3D,
  bbox: BoundingBox
): boolean {
  // 点から太陽の逆方向に光線を伸ばし、その光線が境界ボックスと交差するか判定
  // （詳細な計算の前に、明らかに影にならない点を除外するための高速判定）
  
  // sunRayは太陽からの方向を示すベクトルなので、逆方向を取る
  const invRay = {
    x: -sunRay.x,
    y: -sunRay.y,
    z: -sunRay.z
  };
  
  // 光線と境界ボックスの交差判定（Slabメソッドなど）
  // 実装省略（標準的な光線・AABB交差アルゴリズムを使用）
  
  return true; // 実際の実装では条件判定を行う
}
```

### 6.6 形状最適化アルゴリズム

```typescript
/**
 * 日影規制に基づく建物形状最適化
 * @param property 物件データ
 * @param initialParams 初期建築パラメータ
 * @param options 最適化オプション
 * @returns 最適化された建築パラメータ
 */
export async function optimizeBuildingShape(
  property: Property,
  initialParams: BuildingParams,
  options: {
    targetRegulation?: 'shadow' | 'slope' | 'all';
    maxIterations?: number;
    tolerance?: number;
  } = {}
): Promise<BuildingParams> {
  // デフォルトオプション
  const targetRegulation = options.targetRegulation || 'all';
  const maxIterations = options.maxIterations || 10;
  const tolerance = options.tolerance || 0.1;
  
  // 初期形状の評価
  let currentParams = { ...initialParams };
  let currentShape = BuildingShapeFactory.createShape(
    currentParams.shapeParams?.shapeType || BuildingShapeType.SIMPLE_CUBOID,
    currentParams,
    property
  );
  
  let currentScore = evaluateShape(currentShape, property, targetRegulation);
  
  // 最適化ループ
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // 近傍解（形状のバリエーション）を生成
    const neighbors = generateShapeVariations(currentParams, property);
    
    // 各近傍解を評価
    let bestNeighbor = currentParams;
    let bestScore = currentScore;
    
    for (const neighbor of neighbors) {
      const shape = BuildingShapeFactory.createShape(
        neighbor.shapeParams?.shapeType || BuildingShapeType.SIMPLE_CUBOID,
        neighbor,
        property
      );
      
      const score = evaluateShape(shape, property, targetRegulation);
      
      // より良い解が見つかった場合は更新
      if (score > bestScore) {
        bestNeighbor = neighbor;
        bestScore = score;
      }
    }
    
    // 改善が見られない、または改善が微小な場合は終了
    if (bestScore <= currentScore || (bestScore - currentScore) < tolerance) {
      break;
    }
    
    // 最良の近傍解に更新
    currentParams = bestNeighbor;
    currentShape = BuildingShapeFactory.createShape(
      currentParams.shapeParams?.shapeType || BuildingShapeType.SIMPLE_CUBOID,
      currentParams,
      property
    );
    currentScore = bestScore;
  }
  
  return currentParams;
}

/**
 * 形状の評価関数
 * 評価値が高いほど良い形状（規制適合性と容積効率のバランス）
 */
function evaluateShape(
  shape: IBuildingShape,
  property: Property,
  targetRegulation: 'shadow' | 'slope' | 'all'
): number {
  // 総床面積（最大化したい）
  const totalFloorArea = shape.calculateTotalFloorArea();
  
  // 法定容積率による上限
  const maxFloorArea = property.area * property.floorAreaRatio / 100;
  
  // 容積消化率（0～1）
  const volumeRate = Math.min(totalFloorArea / maxFloorArea, 1);
  
  // 規制適合度の評価（0～1）
  let regulationScore = 1.0;
  
  if (targetRegulation === 'shadow' || targetRegulation === 'all') {
    // 日影規制の評価
    const shadowScore = evaluateShadowRegulation(shape, property);
    regulationScore = Math.min(regulationScore, shadowScore);
  }
  
  if (targetRegulation === 'slope' || targetRegulation === 'all') {
    // 斜線制限の評価
    const slopeScore = evaluateSlopeRegulation(shape, property);
    regulationScore = Math.min(regulationScore, slopeScore);
  }
  
  // 規制違反は大きなペナルティ
  if (regulationScore < 0.5) {
    return regulationScore; // 重大な違反
  }
  
  // 最終スコア（容積効率と規制適合度の加重平均）
  return volumeRate * 0.7 + regulationScore * 0.3;
}

/**
 * 現在の形状から派生するバリエーションを生成
 */
function generateShapeVariations(
  currentParams: BuildingParams,
  property: Property
): BuildingParams[] {
  const variations: BuildingParams[] = [];
  
  // 形状タイプに応じたバリエーション生成
  const shapeType = currentParams.shapeParams?.shapeType || BuildingShapeType.SIMPLE_CUBOID;
  
  switch (shapeType) {
    case BuildingShapeType.SETBACK:
      // セットバック形状のバリエーション
      if (currentParams.shapeParams?.setbackParams) {
        const baseParams = currentParams.shapeParams.setbackParams;
        
        // セットバック距離のバリエーション
        for (const setbackWidthDelta of [-1, 1, 2]) {
          const newSetbackWidth = Math.max(baseParams.setbackWidth + setbackWidthDelta, 1);
          
          if (newSetbackWidth >= baseParams.baseWidth) continue;
          
          variations.push({
            ...currentParams,
            shapeParams: {
              ...currentParams.shapeParams,
              setbackParams: {
                ...baseParams,
                setbackWidth: newSetbackWidth
              }
            }
          });
        }
        
        // 他のパラメータのバリエーションも同様に生成
      }
      break;
      
    case BuildingShapeType.STEPPED:
      // 階段状形状のバリエーション
      // 実装省略
      break;
      
    // 他の形状タイプも同様に実装
  }
  
  return variations;
}
```

## 7. UI/UX実装の詳細

### 7.1 建物形状セレクター

```tsx
// ShapeSelector.tsx
import React, { useState } from 'react';
import { 
  Box, 
  FormControl, 
  FormLabel, 
  RadioGroup, 
  Radio, 
  FormControlLabel,
  Stack,
  Typography
} from '@mui/material';
import { BuildingShapeType } from '../../../types';

// 形状タイプ別のフォームコンポーネント
import SetbackForm from './SetbackForm';
import SteppedForm from './SteppedForm';
import LShapedForm from './LShapedForm';
import CompositeShapeEditor from './CompositeShapeEditor';

interface ShapeSelectorProps {
  value: BuildingShapeType;
  onChange: (value: BuildingShapeType) => void;
  shapeParams: any;
  onShapeParamsChange: (params: any) => void;
}

const ShapeSelector: React.FC<ShapeSelectorProps> = ({
  value,
  onChange,
  shapeParams,
  onShapeParamsChange
}) => {
  // 形状タイプの変更ハンドラ
  const handleShapeTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value as BuildingShapeType;
    onChange(newValue);
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>建物形状の選択</Typography>
      
      <FormControl component="fieldset">
        <FormLabel component="legend">形状タイプ</FormLabel>
        <RadioGroup
          value={value}
          onChange={handleShapeTypeChange}
          row
        >
          <FormControlLabel
            value={BuildingShapeType.SIMPLE_CUBOID}
            control={<Radio />}
            label="直方体"
          />
          <FormControlLabel
            value={BuildingShapeType.SETBACK}
            control={<Radio />}
            label="セットバック"
          />
          <FormControlLabel
            value={BuildingShapeType.STEPPED}
            control={<Radio />}
            label="階段状"
          />
          <FormControlLabel
            value={BuildingShapeType.L_SHAPED}
            control={<Radio />}
            label="L字型"
          />
          <FormControlLabel
            value={BuildingShapeType.COMPOSITE}
            control={<Radio />}
            label="カスタム"
          />
        </RadioGroup>
      </FormControl>
      
      {/* 選択された形状タイプに応じたパラメータフォームを表示 */}
      <Box mt={3}>
        {value === BuildingShapeType.SETBACK && (
          <SetbackForm
            params={shapeParams?.setbackParams}
            onChange={(setbackParams) => onShapeParamsChange({
              ...shapeParams,
              setbackParams
            })}
          />
        )}
        
        {value === BuildingShapeType.STEPPED && (
          <SteppedForm
            params={shapeParams?.steppedParams}
            onChange={(steppedParams) => onShapeParamsChange({
              ...shapeParams,
              steppedParams
            })}
          />
        )}
        
        {value === BuildingShapeType.L_SHAPED && (
          <LShapedForm
            params={shapeParams?.lShapedParams}
            onChange={(lShapedParams) => onShapeParamsChange({
              ...shapeParams,
              lShapedParams
            })}
          />
        )}
        
        {value === BuildingShapeType.COMPOSITE && (
          <CompositeShapeEditor
            params={shapeParams?.compositeParams}
            onChange={(compositeParams) => onShapeParamsChange({
              ...shapeParams,
              compositeParams
            })}
          />
        )}
      </Box>
    </Box>
  );
};

export default ShapeSelector;
```

### 7.2 セットバック形状フォーム

```tsx
// SetbackForm.tsx
import React from 'react';
import {
  Box,
  Grid,
  TextField,
  Typography,
  Divider
} from '@mui/material';
import { SetbackShapeParams } from '../../../types';

interface SetbackFormProps {
  params?: SetbackShapeParams;
  onChange: (params: SetbackShapeParams) => void;
}

const SetbackForm: React.FC<SetbackFormProps> = ({
  params,
  onChange
}) => {
  // デフォルト値
  const defaultParams: SetbackShapeParams = {
    baseFloors: 3,
    baseWidth: 20,
    baseDepth: 20,
    setbackWidth: 15,
    setbackDepth: 15,
    setbackFloors: 5
  };
  
  // 実際に使用するパラメータ（デフォルト値またはpropsから）
  const formParams = params || defaultParams;
  
  // 数値フィールドの変更ハンドラ
  const handleChange = (field: keyof SetbackShapeParams) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    // 数値に変換
    const value = parseFloat(event.target.value);
    
    // 値が不正な場合は更新しない
    if (isNaN(value)) return;
    
    onChange({
      ...formParams,
      [field]: value
    });
  };
  
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        セットバック形状のパラメータ
      </Typography>
      
      <Grid container spacing={3}>
        {/* 基部パラメータ */}
        <Grid item xs={12}>
          <Typography variant="subtitle2">基部</Typography>
          <Divider />
        </Grid>
        
        <Grid item xs={4}>
          <TextField
            fullWidth
            label="階数"
            type="number"
            value={formParams.baseFloors}
            onChange={handleChange('baseFloors')}
            InputProps={{ inputProps: { min: 1, step: 1 } }}
          />
        </Grid>
        
        <Grid item xs={4}>
          <TextField
            fullWidth
            label="幅 (m)"
            type="number"
            value={formParams.baseWidth}
            onChange={handleChange('baseWidth')}
            InputProps={{ inputProps: { min: 1, step: 0.1 } }}
          />
        </Grid>
        
        <Grid item xs={4}>
          <TextField
            fullWidth
            label="奥行 (m)"
            type="number"
            value={formParams.baseDepth}
            onChange={handleChange('baseDepth')}
            InputProps={{ inputProps: { min: 1, step: 0.1 } }}
          />
        </Grid>
        
        {/* 上部パラメータ */}
        <Grid item xs={12}>
          <Typography variant="subtitle2">上部（セットバック）</Typography>
          <Divider />
        </Grid>
        
        <Grid item xs={4}>
          <TextField
            fullWidth
            label="階数"
            type="number"
            value={formParams.setbackFloors}
            onChange={handleChange('setbackFloors')}
            InputProps={{ inputProps: { min: 1, step: 1 } }}
          />
        </Grid>
        
        <Grid item xs={4}>
          <TextField
            fullWidth
            label="幅 (m)"
            type="number"
            value={formParams.setbackWidth}
            onChange={handleChange('setbackWidth')}
            InputProps={{ 
              inputProps: { 
                min: 1, 
                max: formParams.baseWidth,
                step: 0.1 
              } 
            }}
            helperText={`最大 ${formParams.baseWidth}m`}
          />
        </Grid>
        
        <Grid item xs={4}>
          <TextField
            fullWidth
            label="奥行 (m)"
            type="number"
            value={formParams.setbackDepth}
            onChange={handleChange('setbackDepth')}
            InputProps={{ 
              inputProps: { 
                min: 1, 
                max: formParams.baseDepth,
                step: 0.1 
              } 
            }}
            helperText={`最大 ${formParams.baseDepth}m`}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default SetbackForm;
```

### 7.3 Three.jsでの建物形状表示

```tsx
// BuildingComponents.tsx
import React, { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { BuildingShapeType, Model3DData } from '../../../types';

interface BuildingComponentsProps {
  modelData: Model3DData;
  color?: string;
  wireframe?: boolean;
  opacity?: number;
}

const BuildingComponents: React.FC<BuildingComponentsProps> = ({
  modelData,
  color = '#88A9C3',
  wireframe = false,
  opacity = 1
}) => {
  // コンポーネントがない場合、または不正な形状タイプの場合は何も表示しない
  if (!modelData.components || modelData.components.length === 0) {
    return null;
  }
  
  // 基本マテリアル
  const material = useMemo(() => {
    return new THREE.MeshPhongMaterial({
      color: new THREE.Color(color),
      wireframe,
      transparent: opacity < 1,
      opacity,
      depthWrite: opacity === 1
    });
  }, [color, wireframe, opacity]);
  
  return (
    <group>
      {modelData.components.map((component, index) => (
        <mesh
          key={`building-component-${index}`}
          position={new THREE.Vector3(...component.position)}
          material={material}
        >
          <boxGeometry
            args={[
              component.dimensions[0],
              component.dimensions[1],
              component.dimensions[2]
            ]}
          />
        </mesh>
      ))}
    </group>
  );
};

export default BuildingComponents;
```

## 8. パフォーマンス最適化戦略

### 8.1 バッチ処理と空間分割

複雑な形状での日影計算は計算負荷が高いため、以下の最適化戦略を実装します：

1. **空間分割による計算量削減**
   - バウンディングボックスを使用した高速スクリーニング
   - 日影が発生しない領域の計算スキップ

2. **バッチ処理による並列化**
   - 計算グリッドをバッチに分割し並列処理
   - WebWorkerを使用した非ブロッキング計算

3. **形状最適化アルゴリズムの段階的適用**
   - 低解像度での高速近似計算による候補形状の絞り込み
   - 高解像度での詳細計算は候補形状のみに実施

### 8.2 メモリ最適化

複雑な形状モデルでのメモリ使用量を最適化するための戦略も実装します：

1. **遅延評価とキャッシング**
   - 計算結果のキャッシング
   - 実際に表示・計算する部分のみをメモリに保持

2. **Webワーカーでの計算とメインスレッドでの表示の分離**
   - 計算と表示の分離により、UIの応答性とメモリ効率を向上

## 9. テストおよび検証計画

### 9.1 単体テスト

- 各形状クラスの基本機能（頂点生成、交差判定など）のテスト
- 形状パラメータのバリデーションテスト
- 形状変換とモデル生成のテスト

### 9.2 統合テスト

- 複合形状での日影計算の正確性テスト
- パフォーマンステスト（大規模グリッドでの計算速度）
- メモリ使用量テスト

### 9.3 実際のケースを使用した検証

- 実際の建築プロジェクトデータを使用した検証
- セットバック、階段状など様々な形状の組み合わせでの検証
- 計算結果と実測値（または専門CADソフトなど）との比較検証

## 10. 実装スケジュール

| フェーズ | タスク | 期間 | 担当 |
|---------|-------|------|------|
| 1 | 基盤実装: 形状基底クラスとファクトリー | 5日 | バックエンド |
| 2 | 基本形状実装: セットバック・階段状 | 5日 | バックエンド |
| 3 | 日影計算拡張: 複合形状対応 | 7日 | バックエンド |
| 4 | UI実装: 形状選択と編集 | 5日 | フロントエンド |
| 5 | Three.js連携: 複合形状の3D表示 | 5日 | フロントエンド |
| 6 | パフォーマンス最適化 | 3日 | バックエンド |
| 7 | 形状最適化アルゴリズム | 5日 | バックエンド |
| 8 | テストと検証 | 5日 | 共同 |

## 11. リスクと対策

| リスク | 影響度 | 対策 |
|-------|-------|------|
| 複雑形状での計算パフォーマンス劣化 | 高 | 空間分割、バッチ処理、WebWorker活用、簡易モードの提供 |
| 形状表現の柔軟性限界 | 中 | 段階的な形状サポート、拡張性の高いコンポーネントベース設計 |
| 計算精度と実際の規制適合差異 | 高 | 専門家レビュー、実際の建築事例での検証、幅をもたせた結果表示 |
| UIの複雑化によるユーザビリティ低下 | 中 | プリセット提供、段階的UI、コンテキストヘルプ、チュートリアル |

## 12. 結論

複雑な建物形状への対応は、実際の建築プロジェクトに近い日影計算と規制適合判定を可能にする重要な機能拡張です。セットバック形状や階段状形状など、日影規制への適合に一般的に用いられる手法を直接モデリングできるようになることで、現実的な建築計画の検討が可能になります。

パフォーマンスと使いやすさのバランスを考慮した実装を行い、段階的な形状サポートと計算最適化により、実用的かつ効率的なシステムを構築します。将来的には、形状最適化アルゴリズムとの統合により、与えられた敷地条件や規制条件に対する最適な建物形状を自動提案するシステムへの拡張も視野に入れています。