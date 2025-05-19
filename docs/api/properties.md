# 物件API仕様書

**バージョン**: 1.0.0  
**最終更新日**: 2025-05-19  
**ステータス**: ドラフト  

## 概要

物件APIは、HinagoProjectの中核となる物件データの管理機能を提供します。物件の基本情報、敷地形状、関連文書などを登録・管理するためのエンドポイントを含みます。

- **認証要件**: すべてのエンドポイントで認証が必要
- **基本URL**: `/api/v1/properties`

## エンドポイント一覧

### 1. 物件一覧取得 - GET /api/v1/properties

- **認証**: 必須
- **概要**: 登録済み物件の一覧を取得（フィルタリング、ページネーション、ソート対応）

#### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| page | number | いいえ | ページ番号（デフォルト: 1） |
| limit | number | いいえ | 1ページあたりの件数（デフォルト: 20、最大: 100） |
| sort | string | いいえ | ソート条件（例: `updatedAt:desc,name:asc`） |
| status | string | いいえ | ステータスによるフィルタリング（例: `active`） |
| zoneType | string | いいえ | 用途地域によるフィルタリング |
| fields | string | いいえ | 取得するフィールドを指定（例: `id,name,status`） |
| include | string | いいえ | 含める関連エンティティ（例: `volumeChecks,documents`） |

#### レスポンス

**成功**: 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "prop_123456",
      "name": "福岡市中央区プロジェクト",
      "address": "福岡県福岡市中央区大名2-1-1",
      "area": 250.5,
      "zoneType": "category9",
      "fireZone": "semi-fire",
      "shadowRegulation": "type1",
      "buildingCoverage": 80,
      "floorAreaRatio": 400,
      "allowedBuildingArea": 200.4,
      "status": "active",
      "price": 120000000,
      "createdAt": "2025-03-15T09:30:00Z",
      "updatedAt": "2025-03-15T09:30:00Z"
    },
    // ... 他の物件
  ],
  "meta": {
    "total": 52,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

**エラー**: 認証エラー - 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "認証が必要です"
  }
}
```

### 2. 物件登録 - POST /api/v1/properties

- **認証**: 必須
- **概要**: 新規物件情報の登録

#### リクエスト

```json
{
  "name": "福岡市中央区プロジェクト",
  "address": "福岡県福岡市中央区大名2-1-1",
  "area": 250.5,
  "zoneType": "category9",
  "fireZone": "semi-fire",
  "shadowRegulation": "type1",
  "buildingCoverage": 80,
  "floorAreaRatio": 400,
  "price": 120000000,
  "status": "active",
  "notes": "駅から徒歩5分の好立地",
  "shapeData": {
    "points": [
      { "x": 0, "y": 0 },
      { "x": 10, "y": 0 },
      { "x": 10, "y": 25.05 },
      { "x": 0, "y": 25.05 }
    ],
    "width": 10,
    "depth": 25.05
  }
}
```

#### バリデーションルール

- `name`: 必須、1〜100文字
- `address`: 必須、3〜200文字
- `area`: 必須、0.1〜100000の数値
- `zoneType`: 必須、ZoneType列挙型の値
- `fireZone`: 必須、FireZoneType列挙型の値
- `buildingCoverage`: 必須、0〜100の数値
- `floorAreaRatio`: 必須、0〜1000の数値
- `price`: オプション、0以上の数値

#### レスポンス

**成功**: 201 Created

```json
{
  "success": true,
  "data": {
    "id": "prop_123456",
    "name": "福岡市中央区プロジェクト",
    "address": "福岡県福岡市中央区大名2-1-1",
    "area": 250.5,
    "zoneType": "category9",
    "fireZone": "semi-fire",
    "shadowRegulation": "type1",
    "buildingCoverage": 80,
    "floorAreaRatio": 400,
    "allowedBuildingArea": 200.4,
    "price": 120000000,
    "status": "active",
    "notes": "駅から徒歩5分の好立地",
    "shapeData": {
      "points": [
        { "x": 0, "y": 0 },
        { "x": 10, "y": 0 },
        { "x": 10, "y": 25.05 },
        { "x": 0, "y": 25.05 }
      ],
      "width": 10,
      "depth": 25.05
    },
    "geoLocation": {
      "lat": 33.5898,
      "lng": 130.3986,
      "formatted_address": "福岡県福岡市中央区大名2-1-1"
    },
    "createdAt": "2025-03-15T09:30:00Z",
    "updatedAt": "2025-03-15T09:30:00Z"
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
      "name": "名前は必須です",
      "area": "敷地面積は0.1以上である必要があります"
    }
  }
}
```

### 3. 物件詳細取得 - GET /api/v1/properties/{propertyId}

- **認証**: 必須
- **概要**: 特定物件の詳細情報を取得

#### URLパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| propertyId | string | はい | 物件ID |

#### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| include | string | いいえ | 含める関連エンティティ（例: `volumeChecks,documents`） |

#### レスポンス

**成功**: 200 OK

```json
{
  "success": true,
  "data": {
    "id": "prop_123456",
    "name": "福岡市中央区プロジェクト",
    "address": "福岡県福岡市中央区大名2-1-1",
    "area": 250.5,
    "zoneType": "category9",
    "fireZone": "semi-fire",
    "shadowRegulation": "type1",
    "buildingCoverage": 80,
    "floorAreaRatio": 400,
    "allowedBuildingArea": 200.4,
    "heightLimit": 31,
    "roadWidth": 6,
    "price": 120000000,
    "status": "active",
    "notes": "駅から徒歩5分の好立地",
    "shapeData": {
      "points": [
        { "x": 0, "y": 0 },
        { "x": 10, "y": 0 },
        { "x": 10, "y": 25.05 },
        { "x": 0, "y": 25.05 }
      ],
      "width": 10,
      "depth": 25.05,
      "sourceFile": "https://storage.example.com/surveys/survey123.pdf"
    },
    "volumeChecks": [
      {
        "id": "vol_123456",
        "assetType": "mansion",
        "buildingArea": 180.5,
        "totalFloorArea": 900.2,
        "buildingHeight": 28.5,
        "consumptionRate": 90.02,
        "floors": 9,
        "createdAt": "2025-03-16T10:30:00Z",
        "updatedAt": "2025-03-16T10:30:00Z"
      }
    ],
    "documents": [
      {
        "id": "doc_123456",
        "name": "測量図原本.pdf",
        "fileType": "application/pdf",
        "fileSize": 1243500,
        "documentType": "survey",
        "fileUrl": "https://storage.example.com/documents/doc123456.pdf",
        "createdAt": "2025-03-15T09:35:00Z",
        "updatedAt": "2025-03-15T09:35:00Z"
      }
    ],
    "createdAt": "2025-03-15T09:30:00Z",
    "updatedAt": "2025-03-16T10:30:00Z"
  }
}
```

**エラー**: リソースが存在しない - 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "指定された物件が見つかりません"
  }
}
```

### 4. 物件更新 - PUT /api/v1/properties/{propertyId}

- **認証**: 必須（所有者または管理者のみ）
- **概要**: 物件情報の完全更新

#### URLパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| propertyId | string | はい | 物件ID |

#### リクエスト

```json
{
  "name": "福岡市中央区大名プロジェクト[更新]",
  "address": "福岡県福岡市中央区大名2-1-1",
  "area": 250.5,
  "zoneType": "category9",
  "fireZone": "semi-fire",
  "shadowRegulation": "type1",
  "buildingCoverage": 80,
  "floorAreaRatio": 400,
  "heightLimit": 31,
  "roadWidth": 6,
  "price": 150000000,
  "status": "negotiating",
  "notes": "駅から徒歩5分の好立地。価格交渉中。"
}
```

#### レスポンス

**成功**: 200 OK

```json
{
  "success": true,
  "data": {
    "id": "prop_123456",
    "name": "福岡市中央区大名プロジェクト[更新]",
    "address": "福岡県福岡市中央区大名2-1-1",
    "area": 250.5,
    "zoneType": "category9",
    "fireZone": "semi-fire",
    "shadowRegulation": "type1",
    "buildingCoverage": 80,
    "floorAreaRatio": 400,
    "allowedBuildingArea": 200.4,
    "heightLimit": 31,
    "roadWidth": 6,
    "price": 150000000,
    "status": "negotiating",
    "notes": "駅から徒歩5分の好立地。価格交渉中。",
    "shapeData": {
      "points": [
        { "x": 0, "y": 0 },
        { "x": 10, "y": 0 },
        { "x": 10, "y": 25.05 },
        { "x": 0, "y": 25.05 }
      ],
      "width": 10,
      "depth": 25.05,
      "sourceFile": "https://storage.example.com/surveys/survey123.pdf"
    },
    "createdAt": "2025-03-15T09:30:00Z",
    "updatedAt": "2025-03-18T14:15:00Z"
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
      "area": "敷地面積は0.1以上である必要があります"
    }
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

### 5. 物件部分更新 - PATCH /api/v1/properties/{propertyId}

- **認証**: 必須（所有者または管理者のみ）
- **概要**: 物件情報の部分更新

#### URLパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| propertyId | string | はい | 物件ID |

#### リクエスト

```json
{
  "status": "contracted",
  "price": 145000000,
  "notes": "価格交渉完了。契約済み。"
}
```

#### レスポンス

**成功**: 200 OK

```json
{
  "success": true,
  "data": {
    "id": "prop_123456",
    "name": "福岡市中央区大名プロジェクト[更新]",
    "address": "福岡県福岡市中央区大名2-1-1",
    "area": 250.5,
    "zoneType": "category9",
    "fireZone": "semi-fire",
    "shadowRegulation": "type1",
    "buildingCoverage": 80,
    "floorAreaRatio": 400,
    "allowedBuildingArea": 200.4,
    "heightLimit": 31,
    "roadWidth": 6,
    "price": 145000000,
    "status": "contracted",
    "notes": "価格交渉完了。契約済み。",
    "createdAt": "2025-03-15T09:30:00Z",
    "updatedAt": "2025-03-20T11:20:00Z"
  }
}
```

### 6. 物件削除 - DELETE /api/v1/properties/{propertyId}

- **認証**: 必須（所有者または管理者のみ）
- **概要**: 物件の削除

#### URLパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| propertyId | string | はい | 物件ID |

#### レスポンス

**成功**: 204 No Content

**エラー**: リソースが存在しない - 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "指定された物件が見つかりません"
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

### 7. 測量図アップロード - POST /api/v1/properties/upload-survey

- **認証**: 必須
- **概要**: 測量図のアップロードと土地形状の自動抽出

#### リクエスト

Content-Type: multipart/form-data

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| file | File | はい | PDF、PNG、JPGなどの測量図ファイル |
| propertyId | string | いいえ | 関連付ける物件ID（指定しない場合は未関連） |

#### レスポンス

**成功**: 200 OK

```json
{
  "success": true,
  "data": {
    "shapeData": {
      "points": [
        { "x": 0, "y": 0 },
        { "x": 10, "y": 0 },
        { "x": 10, "y": 25.05 },
        { "x": 0, "y": 25.05 }
      ],
      "width": 10,
      "depth": 25.05,
      "sourceFile": "https://storage.example.com/surveys/survey123.pdf"
    },
    "documentId": "doc_123456"
  }
}
```

**エラー**: ファイルタイプエラー - 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "サポートされていないファイル形式です。PDF、PNG、JPG形式の測量図をアップロードしてください。"
  }
}
```

### 8. 敷地形状更新 - PUT /api/v1/properties/{propertyId}/shape

- **認証**: 必須（所有者または管理者のみ）
- **概要**: 物件の敷地形状データの更新

#### URLパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| propertyId | string | はい | 物件ID |

#### リクエスト

```json
{
  "points": [
    { "x": 0, "y": 0 },
    { "x": 12, "y": 0 },
    { "x": 12, "y": 22 },
    { "x": 0, "y": 22 }
  ],
  "width": 12,
  "depth": 22
}
```

#### レスポンス

**成功**: 200 OK

```json
{
  "success": true,
  "data": {
    "id": "prop_123456",
    "shapeData": {
      "points": [
        { "x": 0, "y": 0 },
        { "x": 12, "y": 0 },
        { "x": 12, "y": 22 },
        { "x": 0, "y": 22 }
      ],
      "width": 12,
      "depth": 22,
      "sourceFile": "https://storage.example.com/surveys/survey123.pdf"
    },
    "area": 264,
    "allowedBuildingArea": 211.2,
    "updatedAt": "2025-03-21T09:45:00Z"
  }
}
```

### 9. 文書一覧取得 - GET /api/v1/properties/{propertyId}/documents

- **認証**: 必須
- **概要**: 物件に関連する文書一覧の取得

#### URLパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| propertyId | string | はい | 物件ID |

#### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| documentType | string | いいえ | 文書タイプでフィルタリング |
| page | number | いいえ | ページ番号（デフォルト: 1） |
| limit | number | いいえ | 1ページあたりの件数（デフォルト: 20） |

#### レスポンス

**成功**: 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "doc_123456",
      "propertyId": "prop_123456",
      "name": "測量図原本.pdf",
      "fileType": "application/pdf",
      "fileSize": 1243500,
      "documentType": "survey",
      "fileUrl": "https://storage.example.com/documents/doc123456.pdf",
      "description": "測量会社から受領した原本",
      "createdAt": "2025-03-15T09:35:00Z",
      "updatedAt": "2025-03-15T09:35:00Z"
    },
    {
      "id": "doc_123457",
      "propertyId": "prop_123456",
      "name": "登記簿謄本.pdf",
      "fileType": "application/pdf",
      "fileSize": 523400,
      "documentType": "legal",
      "fileUrl": "https://storage.example.com/documents/doc123457.pdf",
      "description": "登記簿謄本（2025年3月取得）",
      "createdAt": "2025-03-15T10:05:00Z",
      "updatedAt": "2025-03-15T10:05:00Z"
    }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### 10. 文書アップロード - POST /api/v1/properties/{propertyId}/documents

- **認証**: 必須（所有者または管理者のみ）
- **概要**: 物件関連文書のアップロード

#### URLパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| propertyId | string | はい | 物件ID |

#### リクエスト

Content-Type: multipart/form-data

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| file | File | はい | アップロードするファイル |
| documentType | string | はい | 文書タイプ（survey/legal/plan/report/other） |
| description | string | いいえ | 文書の説明 |

#### レスポンス

**成功**: 201 Created

```json
{
  "success": true,
  "data": {
    "id": "doc_123458",
    "propertyId": "prop_123456",
    "name": "建築計画書.pdf",
    "fileType": "application/pdf",
    "fileSize": 2540000,
    "documentType": "plan",
    "fileUrl": "https://storage.example.com/documents/doc123458.pdf",
    "description": "初期建築計画案",
    "createdAt": "2025-03-22T14:30:00Z",
    "updatedAt": "2025-03-22T14:30:00Z"
  }
}
```

### 11. 文書詳細取得 - GET /api/v1/properties/{propertyId}/documents/{documentId}

- **認証**: 必須
- **概要**: 特定文書の詳細情報取得

#### URLパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| propertyId | string | はい | 物件ID |
| documentId | string | はい | 文書ID |

#### レスポンス

**成功**: 200 OK

```json
{
  "success": true,
  "data": {
    "id": "doc_123458",
    "propertyId": "prop_123456",
    "name": "建築計画書.pdf",
    "fileType": "application/pdf",
    "fileSize": 2540000,
    "documentType": "plan",
    "fileUrl": "https://storage.example.com/documents/doc123458.pdf",
    "description": "初期建築計画案",
    "createdAt": "2025-03-22T14:30:00Z",
    "updatedAt": "2025-03-22T14:30:00Z"
  }
}
```

**エラー**: リソースが存在しない - 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "指定された文書が見つかりません"
  }
}
```

### 12. 文書削除 - DELETE /api/v1/properties/{propertyId}/documents/{documentId}

- **認証**: 必須（所有者または管理者のみ）
- **概要**: 特定文書の削除

#### URLパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| propertyId | string | はい | 物件ID |
| documentId | string | はい | 文書ID |

#### レスポンス

**成功**: 204 No Content

**エラー**: リソースが存在しない - 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "指定された文書が見つかりません"
  }
}
```

### 13. 更新履歴取得 - GET /api/v1/properties/{propertyId}/history

- **認証**: 必須
- **概要**: 物件の更新履歴取得

#### URLパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| propertyId | string | はい | 物件ID |

#### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| limit | number | いいえ | 取得する履歴の最大数（デフォルト: 20） |

#### レスポンス

**成功**: 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "hist_123456",
      "propertyId": "prop_123456",
      "userId": "user_1",
      "action": "property_update",
      "details": "ステータスを「negotiating」から「contracted」に変更、価格を更新",
      "createdAt": "2025-03-20T11:20:00Z"
    },
    {
      "id": "hist_123455",
      "propertyId": "prop_123456",
      "userId": "user_1",
      "action": "property_update",
      "details": "ステータスを「active」から「negotiating」に変更、価格と備考を更新",
      "createdAt": "2025-03-18T14:15:00Z"
    },
    {
      "id": "hist_123454",
      "propertyId": "prop_123456",
      "userId": "user_1",
      "action": "volume_check_created",
      "details": "新規ボリュームチェック結果を作成（マンションタイプ）",
      "createdAt": "2025-03-16T10:30:00Z"
    },
    {
      "id": "hist_123453",
      "propertyId": "prop_123456",
      "userId": "user_1",
      "action": "document_uploaded",
      "details": "文書「測量図原本.pdf」をアップロード",
      "createdAt": "2025-03-15T09:35:00Z"
    },
    {
      "id": "hist_123452",
      "propertyId": "prop_123456",
      "userId": "user_1",
      "action": "property_created",
      "details": "新規物件を作成",
      "createdAt": "2025-03-15T09:30:00Z"
    }
  ],
  "meta": {
    "total": 5
  }
}
```

### 14. ジオコーディング - GET /api/v1/geocode

- **認証**: 必須
- **概要**: 住所から緯度経度情報を取得

#### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| address | string | はい | ジオコーディングする住所 |

#### レスポンス

**成功**: 200 OK

```json
{
  "success": true,
  "data": {
    "lat": 33.5898,
    "lng": 130.3986,
    "formatted_address": "福岡県福岡市中央区大名2-1-1"
  }
}
```

**エラー**: 住所が見つからない - 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "ADDRESS_NOT_FOUND",
    "message": "指定された住所の位置情報が見つかりません"
  }
}
```

### 15. 逆ジオコーディング - GET /api/v1/geocode/reverse

- **認証**: 必須
- **概要**: 緯度経度情報から住所を取得

#### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| lat | number | はい | 緯度 (-90〜90) |
| lng | number | はい | 経度 (-180〜180) |

#### レスポンス

**成功**: 200 OK

```json
{
  "success": true,
  "data": {
    "lat": 33.5898,
    "lng": 130.3986,
    "formatted_address": "福岡県福岡市中央区大名2-1-1",
    "components": {
      "prefecture": "福岡県",
      "city": "福岡市中央区",
      "town": "大名",
      "block": "2-1-1"
    }
  }
}
```

**エラー**: 位置情報が見つからない - 404 Not Found

```json
{
  "success": false,
  "error": {
    "code": "LOCATION_NOT_FOUND",
    "message": "指定された位置情報に対応する住所が見つかりません"
  }
}
```

## 実装ノート

### 敷地形状データの扱い

- 敷地形状データは常に基準点（0,0）からの相対座標として保存してください
- `points`配列の最初と最後は同じ座標を指定してポリゴンを閉じてください
- 座標はメートル単位で指定し、小数点以下2桁までの精度を推奨します

### 許容建築面積の自動計算

敷地情報が更新された場合、以下の計算で許容建築面積を自動更新します：

```
allowedBuildingArea = area * (buildingCoverage / 100)
```

### 地図表示コンポーネントの実装

地図表示コンポーネントは、以下のアプローチで実装します：

1. **マップライブラリの導入**
   - Google Maps JavaScript API、Mapbox GL JS、またはLeaflet.jsなどのマップライブラリを使用
   - 適切なAPIキーとライセンス管理を行う

2. **地図コンポーネント実装例（React + Google Maps）**

```jsx
import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

interface MapViewProps {
  lat: number;
  lng: number;
  zoom?: number;
  mapType?: string;
  showNearbyFacilities?: boolean;
}

const MapView = ({ 
  lat, 
  lng, 
  zoom = 15,
  mapType = 'roadmap',
  showNearbyFacilities = false 
}: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mapRef.current && lat && lng) {
      const mapOptions = {
        center: { lat, lng },
        zoom,
        mapTypeId: mapType,
      };
      
      const map = new google.maps.Map(mapRef.current, mapOptions);
      
      // 物件位置のマーカー
      new google.maps.Marker({
        position: { lat, lng },
        map,
        title: '物件位置'
      });
      
      // 周辺施設の表示（オプション）
      if (showNearbyFacilities) {
        // 周辺施設APIの呼び出しと表示ロジック
        // 例: getNearbyPlaces(map, lat, lng, 1000, ['train_station', 'school']);
      }
    }
  }, [lat, lng, zoom, mapType, showNearbyFacilities]);

  return (
    <Box
      ref={mapRef}
      sx={{
        width: '100%',
        height: 300,
        borderRadius: 1,
        mb: 2
      }}
      aria-label="物件位置の地図"
    />
  );
};

export default MapView;
```

3. **フォーム連携**
   - PropertyFormコンポーネント内でジオコーディング結果を地図表示に連携
   - 住所入力時に自動的に位置情報を取得して地図を更新

### セキュリティ考慮事項

1. **ファイルアップロード**
   - アップロードされたファイルは安全なストレージに保存
   - ファイルタイプとサイズのバリデーションを厳格に実施
   - ファイルダウンロードURLはアクセス権限を持つユーザーのみ取得可能

2. **権限管理**
   - 物件データの更新・削除操作は所有者または管理者のみ実行可能
   - 一般ユーザーは自分が作成した物件のみ更新可能（将来的な拡張）

3. **地図APIセキュリティ**
   - 地図APIキーはクライアントサイドのみの制限を設定
   - リファラーとドメイン制限で不正利用を防止
   - API使用量の監視とクォータ設定

## 型定義参照

```typescript
// 地理座標の型
export interface GeoLocation {
  lat: number; // 緯度
  lng: number; // 経度
  formatted_address?: string; // フォーマット済み住所
}

// 地図表示設定の型
export interface MapViewSettings {
  zoom: number; // 初期ズームレベル
  mapType?: string; // 地図種別（通常、航空写真など）
  showNearbyFacilities?: boolean; // 周辺施設表示フラグ
  showTraffic?: boolean; // 交通情報表示フラグ
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
  geoLocation?: GeoLocation; // 位置情報（緯度・経度）
}

// 物件詳細の型（DBモデルに対応）
export interface Property extends PropertyBase, Timestamps {
  id: ID;
  userId?: ID; // 作成したユーザーID
}

// 物件詳細の型（関連エンティティを含む）
export interface PropertyDetail extends Property {
  volumeChecks?: VolumeCheck[]; // 関連するボリュームチェック結果
  documents?: Document[]; // 関連する文書
}

// 敷地形状の型
export interface PropertyShape {
  points: BoundaryPoint[]; // 境界点の配列
  width?: number; // 敷地間口
  depth?: number; // 敷地奥行
  sourceFile?: string; // 測量図ファイルのURL
}

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
  userId?: ID; // アップロードしたユーザーID
}

// 更新履歴エントリの型
export interface HistoryEntry extends Timestamps {
  id: ID;
  propertyId: ID; // 関連物件ID
  userId: ID; // 変更したユーザーID
  action: string; // 実行したアクション
  details: string; // 変更の詳細
}
```