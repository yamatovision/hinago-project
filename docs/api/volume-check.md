# ボリュームチェックAPI仕様書

**バージョン**: 1.0.0  
**最終更新日**: 2025-05-19  
**ステータス**: ドラフト  

## 概要

ボリュームチェックAPIは、HinagoProjectの中核機能である建築可能ボリュームの計算と収益性分析機能を提供します。物件データに基づいた最大建築可能ボリュームの自動算出、3Dモデルの生成、容積消化率の計算、収益性試算などの機能を含みます。

- **認証要件**: すべてのエンドポイントで認証が必要
- **基本URL**: `/api/v1/analysis`

## エンドポイント一覧

### 1. ボリュームチェック実行 - POST /api/v1/analysis/volume-check

- **認証**: 必須
- **概要**: 建築基準法に基づいた最大建築可能ボリュームの計算実行

#### リクエスト

```json
{
  "propertyId": "prop_123456",
  "buildingParams": {
    "floorHeight": 3.2,
    "commonAreaRatio": 15,
    "floors": 9,
    "roadWidth": 6,
    "assetType": "mansion"
  }
}
```

#### バリデーションルール

- `propertyId`: 必須、有効な物件ID
- `buildingParams.floorHeight`: 必須、2〜10の数値（階高 m）
- `buildingParams.commonAreaRatio`: 必須、0〜100の数値（共用部率 %）
- `buildingParams.floors`: 必須、1〜100の整数（階数）
- `buildingParams.roadWidth`: オプション、0以上の数値（前面道路幅員 m）
- `buildingParams.assetType`: 必須、AssetType列挙型の値

#### レスポンス

**成功**: 201 Created

```json
{
  "success": true,
  "data": {
    "id": "vol_123456",
    "propertyId": "prop_123456",
    "assetType": "mansion",
    "buildingArea": 180.5,
    "totalFloorArea": 900.2,
    "buildingHeight": 28.8,
    "consumptionRate": 90.02,
    "floors": 9,
    "floorBreakdown": [
      {
        "floor": 1,
        "floorArea": 100.05,
        "privateArea": 85.04,
        "commonArea": 15.01
      },
      // 省略（階別データが全フロア分含まれる）
      {
        "floor": 9,
        "floorArea": 100.05,
        "privateArea": 85.04,
        "commonArea": 15.01
      }
    ],
    "regulationChecks": [
      {
        "name": "建蔽率",
        "regulationValue": "80%",
        "plannedValue": "72.2%",
        "compliant": true
      },
      {
        "name": "容積率",
        "regulationValue": "400%",
        "plannedValue": "360.08%",
        "compliant": true
      },
      {
        "name": "高さ制限",
        "regulationValue": "31m",
        "plannedValue": "28.8m",
        "compliant": true
      },
      {
        "name": "日影規制",
        "regulationValue": "4h/2.5h",
        "plannedValue": "適合",
        "compliant": true
      }
    ],
    "model3dData": {
      "modelType": "three.js",
      "data": {
        // 3Dモデルのジオメトリデータ（サイズ削減のため一部省略）
        "building": {
          "position": [0, 0, 0],
          "dimensions": [12, 12, 28.8]
        },
        "property": {
          "points": [
            [0, 0],
            [12, 0],
            [12, 20],
            [0, 20],
            [0, 0]
          ]
        }
      }
    },
    "createdAt": "2025-03-25T10:15:00Z",
    "updatedAt": "2025-03-25T10:15:00Z"
  }
}
```

**エラー**: バリデーションエラー - 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力データが無効です",
    "details": {
      "buildingParams.floors": "階数は1以上100以下の整数で指定してください",
      "buildingParams.floorHeight": "階高は2m以上10m以下で指定してください"
    }
  }
}
```

**エラー**: 計算エラー - 422 Unprocessable Entity

```json
{
  "success": false,
  "error": {
    "code": "CALCULATION_ERROR",
    "message": "建築ボリュームの計算に失敗しました",
    "details": {
      "reason": "法規制への適合が不可能なパラメータが指定されています",
      "violatedRegulations": ["高さ制限を超過しています"]
    }
  }
}
```

### 2. ボリュームチェック結果取得 - GET /api/v1/analysis/volume-check/{volumeCheckId}

- **認証**: 必須
- **概要**: 過去に計算したボリュームチェック結果の取得

#### URLパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| volumeCheckId | string | はい | ボリュームチェック結果ID |

#### レスポンス

**成功**: 200 OK

```json
{
  "success": true,
  "data": {
    "id": "vol_123456",
    "propertyId": "prop_123456",
    "assetType": "mansion",
    "buildingArea": 180.5,
    "totalFloorArea": 900.2,
    "buildingHeight": 28.8,
    "consumptionRate": 90.02,
    "floors": 9,
    "floorBreakdown": [
      {
        "floor": 1,
        "floorArea": 100.05,
        "privateArea": 85.04,
        "commonArea": 15.01
      },
      // 省略（階別データが全フロア分含まれる）
    ],
    "regulationChecks": [
      {
        "name": "建蔽率",
        "regulationValue": "80%",
        "plannedValue": "72.2%",
        "compliant": true
      },
      // 省略（他の規制チェック結果）
    ],
    "model3dData": {
      "modelType": "three.js",
      "data": {
        // 3Dモデルのジオメトリデータ（省略）
      }
    },
    "createdAt": "2025-03-25T10:15:00Z",
    "updatedAt": "2025-03-25T10:15:00Z"
  }
}
```

**エラー**: リソースが存在しない - 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "指定されたボリュームチェック結果が見つかりません"
  }
}
```

### 3. ボリュームチェック結果削除 - DELETE /api/v1/analysis/volume-check/{volumeCheckId}

- **認証**: 必須（所有者または管理者のみ）
- **概要**: ボリュームチェック結果の削除

#### URLパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| volumeCheckId | string | はい | ボリュームチェック結果ID |

#### レスポンス

**成功**: 204 No Content

**エラー**: リソースが存在しない - 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "指定されたボリュームチェック結果が見つかりません"
  }
}
```

**エラー**: 権限エラー - 403 Forbidden

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "この操作を実行する権限がありません"
  }
}
```

### 4. 収益性試算実行 - POST /api/v1/analysis/profitability

- **認証**: 必須
- **概要**: ボリュームチェック結果に基づいた収益性試算の実行

#### リクエスト

```json
{
  "propertyId": "prop_123456",
  "volumeCheckId": "vol_123456",
  "assetType": "mansion",
  "financialParams": {
    "rentPerSqm": 3500,
    "occupancyRate": 95,
    "managementCostRate": 20,
    "constructionCostPerSqm": 380000,
    "rentalPeriod": 35,
    "capRate": 4.5
  }
}
```

#### バリデーションルール

- `propertyId`: 必須、有効な物件ID
- `volumeCheckId`: 必須、有効なボリュームチェック結果ID
- `assetType`: 必須、AssetType列挙型の値
- `financialParams.rentPerSqm`: 必須、0以上の数値（賃料単価 円/m²）
- `financialParams.occupancyRate`: 必須、0〜100の数値（稼働率 %）
- `financialParams.managementCostRate`: 必須、0〜100の数値（管理コスト率 %）
- `financialParams.constructionCostPerSqm`: 必須、0以上の数値（建設単価 円/m²）
- `financialParams.rentalPeriod`: 必須、1〜100の整数（運用期間 年）
- `financialParams.capRate`: 必須、0〜20の数値（還元利回り %）

#### レスポンス

**成功**: 201 Created

```json
{
  "success": true,
  "data": {
    "id": "prof_123456",
    "propertyId": "prop_123456",
    "volumeCheckId": "vol_123456",
    "assetType": "mansion",
    "parameters": {
      "rentPerSqm": 3500,
      "occupancyRate": 95,
      "managementCostRate": 20,
      "constructionCostPerSqm": 380000,
      "rentalPeriod": 35,
      "capRate": 4.5
    },
    
    "landPrice": 120000000,
    "constructionCost": 342076000,
    "miscExpenses": 13683040,
    "totalInvestment": 475759040,
    
    "annualRentalIncome": 32507175,
    "annualOperatingExpenses": 6501435,
    "annualMaintenance": 3420760,
    "annualPropertyTax": 4757590,
    "annualNOI": 17827390,
    
    "noiYield": 3.75,
    "irr": 5.2,
    "paybackPeriod": 26.7,
    "npv": 51236485,
    
    "annualFinancials": [
      {
        "year": 1,
        "rentalIncome": 32507175,
        "operatingExpenses": 14679785,
        "netOperatingIncome": 17827390,
        "accumulatedIncome": 17827390
      },
      // 省略（35年分のデータ）
      {
        "year": 35,
        "rentalIncome": 32507175,
        "operatingExpenses": 14679785,
        "netOperatingIncome": 17827390,
        "accumulatedIncome": 623958650
      }
    ],
    
    "createdAt": "2025-03-26T11:20:00Z",
    "updatedAt": "2025-03-26T11:20:00Z"
  }
}
```

**エラー**: バリデーションエラー - 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力データが無効です",
    "details": {
      "financialParams.rentPerSqm": "賃料単価は0以上の数値で指定してください",
      "financialParams.capRate": "還元利回りは0~20%の範囲で指定してください"
    }
  }
}
```

### 5. 収益性試算結果取得 - GET /api/v1/analysis/profitability/{profitabilityId}

- **認証**: 必須
- **概要**: 過去に計算した収益性試算結果の取得

#### URLパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| profitabilityId | string | はい | 収益性試算結果ID |

#### レスポンス

**成功**: 200 OK

```json
{
  "success": true,
  "data": {
    "id": "prof_123456",
    "propertyId": "prop_123456",
    "volumeCheckId": "vol_123456",
    "assetType": "mansion",
    "parameters": {
      "rentPerSqm": 3500,
      "occupancyRate": 95,
      "managementCostRate": 20,
      "constructionCostPerSqm": 380000,
      "rentalPeriod": 35,
      "capRate": 4.5
    },
    
    "landPrice": 120000000,
    "constructionCost": 342076000,
    "miscExpenses": 13683040,
    "totalInvestment": 475759040,
    
    "annualRentalIncome": 32507175,
    "annualOperatingExpenses": 6501435,
    "annualMaintenance": 3420760,
    "annualPropertyTax": 4757590,
    "annualNOI": 17827390,
    
    "noiYield": 3.75,
    "irr": 5.2,
    "paybackPeriod": 26.7,
    "npv": 51236485,
    
    "annualFinancials": [
      // 省略（35年分のデータ）
    ],
    
    "createdAt": "2025-03-26T11:20:00Z",
    "updatedAt": "2025-03-26T11:20:00Z"
  }
}
```

**エラー**: リソースが存在しない - 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "指定された収益性試算結果が見つかりません"
  }
}
```

### 6. 収益性試算結果削除 - DELETE /api/v1/analysis/profitability/{profitabilityId}

- **認証**: 必須（所有者または管理者のみ）
- **概要**: 収益性試算結果の削除

#### URLパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| profitabilityId | string | はい | 収益性試算結果ID |

#### レスポンス

**成功**: 204 No Content

**エラー**: リソースが存在しない - 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "指定された収益性試算結果が見つかりません"
  }
}
```

### 7. シナリオ一覧取得 - GET /api/v1/analysis/scenarios

- **認証**: 必須
- **概要**: 物件またはボリュームチェック結果に関連するシナリオ一覧の取得

#### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| propertyId | string | いいえ | 物件IDでフィルタリング |
| volumeCheckId | string | いいえ | ボリュームチェック結果IDでフィルタリング |

注: propertyIdまたはvolumeCheckIdのいずれかは必須です

#### レスポンス

**成功**: 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "scen_123456",
      "propertyId": "prop_123456",
      "volumeCheckId": "vol_123456",
      "name": "基本シナリオ",
      "params": {
        "assetType": "mansion",
        "rentPerSqm": 3500,
        "occupancyRate": 95,
        "managementCostRate": 20,
        "constructionCostPerSqm": 380000,
        "rentalPeriod": 35,
        "capRate": 4.5
      },
      "createdAt": "2025-03-26T11:20:00Z",
      "updatedAt": "2025-03-26T11:20:00Z"
    },
    {
      "id": "scen_123457",
      "propertyId": "prop_123456",
      "volumeCheckId": "vol_123456",
      "name": "楽観的シナリオ",
      "params": {
        "assetType": "mansion",
        "rentPerSqm": 3800,
        "occupancyRate": 98,
        "managementCostRate": 18,
        "constructionCostPerSqm": 370000,
        "rentalPeriod": 35,
        "capRate": 4.2
      },
      "createdAt": "2025-03-26T11:25:00Z",
      "updatedAt": "2025-03-26T11:25:00Z"
    }
  ]
}
```

**エラー**: パラメータエラー - 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMETERS",
    "message": "propertyIdまたはvolumeCheckIdのいずれかを指定してください"
  }
}
```

### 8. シナリオ作成 - POST /api/v1/analysis/scenarios

- **認証**: 必須
- **概要**: 収益性試算のための新規シナリオの作成

#### リクエスト

```json
{
  "propertyId": "prop_123456",
  "volumeCheckId": "vol_123456",
  "name": "悲観的シナリオ",
  "params": {
    "assetType": "mansion",
    "rentPerSqm": 3200,
    "occupancyRate": 90,
    "managementCostRate": 25,
    "constructionCostPerSqm": 400000,
    "rentalPeriod": 35,
    "capRate": 5.0
  }
}
```

#### バリデーションルール

- `propertyId`: 必須、有効な物件ID
- `volumeCheckId`: 必須、有効なボリュームチェック結果ID
- `name`: 必須、1〜100文字
- `params`: 必須、FinancialParamsオブジェクト

#### レスポンス

**成功**: 201 Created

```json
{
  "success": true,
  "data": {
    "id": "scen_123458",
    "propertyId": "prop_123456",
    "volumeCheckId": "vol_123456",
    "name": "悲観的シナリオ",
    "params": {
      "assetType": "mansion",
      "rentPerSqm": 3200,
      "occupancyRate": 90,
      "managementCostRate": 25,
      "constructionCostPerSqm": 400000,
      "rentalPeriod": 35,
      "capRate": 5.0
    },
    "createdAt": "2025-03-26T14:10:00Z",
    "updatedAt": "2025-03-26T14:10:00Z"
  }
}
```

**エラー**: バリデーションエラー - 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力データが無効です",
    "details": {
      "name": "シナリオ名は必須です",
      "params.rentPerSqm": "賃料単価は0以上の数値で指定してください"
    }
  }
}
```

### 9. シナリオ詳細取得 - GET /api/v1/analysis/scenarios/{scenarioId}

- **認証**: 必須
- **概要**: 特定シナリオの詳細情報取得

#### URLパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| scenarioId | string | はい | シナリオID |

#### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| include | string | いいえ | `profitabilityResult`を指定すると関連する収益性試算結果を含める |

#### レスポンス

**成功**: 200 OK

```json
{
  "success": true,
  "data": {
    "id": "scen_123456",
    "propertyId": "prop_123456",
    "volumeCheckId": "vol_123456",
    "name": "基本シナリオ",
    "params": {
      "assetType": "mansion",
      "rentPerSqm": 3500,
      "occupancyRate": 95,
      "managementCostRate": 20,
      "constructionCostPerSqm": 380000,
      "rentalPeriod": 35,
      "capRate": 4.5
    },
    "profitabilityResult": {
      "id": "prof_123456",
      "totalInvestment": 475759040,
      "annualNOI": 17827390,
      "noiYield": 3.75,
      "irr": 5.2,
      "paybackPeriod": 26.7,
      "npv": 51236485
    },
    "createdAt": "2025-03-26T11:20:00Z",
    "updatedAt": "2025-03-26T11:20:00Z"
  }
}
```

**エラー**: リソースが存在しない - 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "指定されたシナリオが見つかりません"
  }
}
```

### 10. シナリオ更新 - PUT /api/v1/analysis/scenarios/{scenarioId}

- **認証**: 必須（所有者または管理者のみ）
- **概要**: シナリオ情報の更新

#### URLパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| scenarioId | string | はい | シナリオID |

#### リクエスト

```json
{
  "name": "基本シナリオ（修正版）",
  "params": {
    "assetType": "mansion",
    "rentPerSqm": 3600,
    "occupancyRate": 96,
    "managementCostRate": 19,
    "constructionCostPerSqm": 375000,
    "rentalPeriod": 35,
    "capRate": 4.3
  }
}
```

#### レスポンス

**成功**: 200 OK

```json
{
  "success": true,
  "data": {
    "id": "scen_123456",
    "propertyId": "prop_123456",
    "volumeCheckId": "vol_123456",
    "name": "基本シナリオ（修正版）",
    "params": {
      "assetType": "mansion",
      "rentPerSqm": 3600,
      "occupancyRate": 96,
      "managementCostRate": 19,
      "constructionCostPerSqm": 375000,
      "rentalPeriod": 35,
      "capRate": 4.3
    },
    "createdAt": "2025-03-26T11:20:00Z",
    "updatedAt": "2025-03-27T09:45:00Z"
  }
}
```

**エラー**: リソースが存在しない - 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "指定されたシナリオが見つかりません"
  }
}
```

### 11. シナリオ削除 - DELETE /api/v1/analysis/scenarios/{scenarioId}

- **認証**: 必須（所有者または管理者のみ）
- **概要**: シナリオの削除

#### URLパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| scenarioId | string | はい | シナリオID |

#### レスポンス

**成功**: 204 No Content

**エラー**: リソースが存在しない - 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "指定されたシナリオが見つかりません"
  }
}
```

## 実装ノート

### 計算プロセス

#### ボリュームチェック計算の流れ

1. 物件情報（敷地面積、用途地域、建蔽率、容積率など）を取得
2. 建築パラメータ（階高、共用部率、階数など）を適用
3. 以下の法規制に基づいた計算を実行:
   - 建蔽率による建築面積制限
   - 容積率による延床面積制限
   - 高さ制限（絶対高さ、斜線制限、日影規制）
4. 各制限の中で最も厳しい制限を適用
5. 容積消化率（実際の延床面積 ÷ 法定上限延床面積 × 100）を計算
6. 建物形状を簡易的な箱型モデルとして生成
7. 階別の床面積内訳と専有面積・共用面積を計算

#### 収益性試算計算の流れ

1. ボリュームチェック結果から建物規模を取得
2. 土地取得費用（物件の価格）を取得
3. 建設費用（延床面積 × 建設単価）を計算
4. 諸経費（建設費用 × 4%）を計算
5. 総投資額（土地取得費 + 建設費 + 諸経費）を計算
6. 年間賃料収入（専有面積 × 賃料単価 × 稼働率）を計算
7. 年間運営費（賃料収入 × 管理コスト率）を計算
8. 年間修繕費（建設費 × 1%）を計算
9. 年間不動産税（総投資額 × 1%）を計算
10. 年間純収益（賃料収入 - 運営費 - 修繕費 - 不動産税）を計算
11. 投資利回り（年間純収益 ÷ 総投資額 × 100）を計算
12. 内部収益率（IRR）を計算（DCF法による）
13. 投資回収期間を計算
14. 正味現在価値（NPV）を計算

### 3Dモデルデータ形式

3Dモデルデータは、Three.jsで直接利用可能な形式で提供されます。以下の要素を含みます：

1. **敷地形状**: 2D境界点の配列（地面レベルで表示）
2. **建物形状**: 箱型の寸法と位置
3. **視点情報**: 推奨されるカメラ位置と向き

```json
{
  "modelType": "three.js",
  "data": {
    "building": {
      "position": [0, 0, 0],
      "dimensions": [width, depth, height]
    },
    "property": {
      "points": [[x1, y1], [x2, y2], ...],
      "elevation": 0
    },
    "camera": {
      "position": [posX, posY, posZ],
      "target": [tarX, tarY, tarZ]
    }
  }
}
```

### 拡張性と互換性

1. **アセットタイプの追加**
   - 新しいアセットタイプを追加する場合、AssetType列挙型を拡張
   - アセットタイプごとのデフォルトパラメータを提供

2. **計算エンジンのバージョニング**
   - 計算ロジックの大幅な変更時は、APIバージョンを更新
   - 古いバージョンの計算結果との互換性を維持

## 型定義参照

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
  userId?: ID; // 作成したユーザーID
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
  
  userId?: ID; // 作成したユーザーID
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
  profitabilityResult?: ProfitabilityResult; // 収益性試算結果
  userId?: ID; // 作成したユーザーID
}
```