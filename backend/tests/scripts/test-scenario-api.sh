#!/bin/bash

# シナリオAPI テストスクリプト
# APIのテストをcurlコマンドで実行し、基本的な認証とシナリオ作成機能をテストします

# -------------------------------------------------------
# 設定パラメータ
# -------------------------------------------------------
API_BASE_URL="http://localhost:8080/api/v1"
EMAIL="higano@gmail.com"
PASSWORD="aikakumei"
TEST_PROPERTY_ID=""
TEST_VOLUME_CHECK_ID=""
AUTH_TOKEN=""

# -------------------------------------------------------
# ユーティリティ関数
# -------------------------------------------------------
# 現在時刻とマイルストーンを表示
function log_milestone() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') [MILESTONE] $1"
}

# エラー表示とプログラム終了
function exit_with_error() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') [ERROR] $1"
  exit 1
}

# -------------------------------------------------------
# 認証処理
# -------------------------------------------------------
log_milestone "ログイン処理開始"

LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

# jqコマンドがインストールされていない場合に備えて代替手段も用意
AUTH_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')

if [ -z "$AUTH_TOKEN" ]; then
  exit_with_error "認証トークンの取得に失敗しました。レスポンス: $LOGIN_RESPONSE"
fi

log_milestone "認証成功: トークン取得完了"

# -------------------------------------------------------
# テスト用物件作成
# -------------------------------------------------------
log_milestone "テスト用物件作成開始"

TIMESTAMP=$(date +%s)
PROPERTY_DATA='{
  "name": "シナリオテスト用物件 '"$TIMESTAMP"'",
  "address": "福岡県福岡市中央区天神1-1-'"$TIMESTAMP"'",
  "area": 200,
  "zoneType": "category9",
  "fireZone": "fire",
  "shadowRegulation": "none",
  "buildingCoverage": 80,
  "floorAreaRatio": 400,
  "price": 100000000,
  "status": "active",
  "notes": "シナリオAPIテスト用",
  "shapeData": {
    "points": [
      { "x": 0, "y": 0 },
      { "x": 10, "y": 0 },
      { "x": 10, "y": 20 },
      { "x": 0, "y": 20 }
    ],
    "width": 10,
    "depth": 20
  }
}'

PROPERTY_RESPONSE=$(curl -s -X POST "$API_BASE_URL/properties" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "$PROPERTY_DATA")

TEST_PROPERTY_ID=$(echo $PROPERTY_RESPONSE | grep -o '"id":"[^"]*' | sed 's/"id":"//')

if [ -z "$TEST_PROPERTY_ID" ]; then
  exit_with_error "物件IDの取得に失敗しました。レスポンス: $PROPERTY_RESPONSE"
fi

log_milestone "物件作成成功: ID=$TEST_PROPERTY_ID"

# -------------------------------------------------------
# ボリュームチェック作成
# -------------------------------------------------------
log_milestone "ボリュームチェック作成開始"

VOLUME_CHECK_DATA='{
  "propertyId": "'"$TEST_PROPERTY_ID"'",
  "buildingParams": {
    "floorHeight": 3,
    "commonAreaRatio": 15,
    "floors": 3,
    "roadWidth": 6,
    "assetType": "mansion"
  }
}'

VOLUME_CHECK_RESPONSE=$(curl -s -X POST "$API_BASE_URL/analysis/volume-check" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "$VOLUME_CHECK_DATA")

TEST_VOLUME_CHECK_ID=$(echo $VOLUME_CHECK_RESPONSE | grep -o '"id":"[^"]*' | sed 's/"id":"//')

if [ -z "$TEST_VOLUME_CHECK_ID" ]; then
  exit_with_error "ボリュームチェックIDの取得に失敗しました。レスポンス: $VOLUME_CHECK_RESPONSE"
fi

log_milestone "ボリュームチェック作成成功: ID=$TEST_VOLUME_CHECK_ID"

# -------------------------------------------------------
# シナリオ作成テスト
# -------------------------------------------------------
log_milestone "シナリオ作成テスト開始"

SCENARIO_DATA='{
  "propertyId": "'"$TEST_PROPERTY_ID"'",
  "volumeCheckId": "'"$TEST_VOLUME_CHECK_ID"'",
  "name": "テストシナリオ '"$TIMESTAMP"'",
  "params": {
    "assetType": "mansion",
    "rentPerSqm": 3000,
    "occupancyRate": 95,
    "managementCostRate": 10,
    "constructionCostPerSqm": 350000,
    "rentalPeriod": 10,
    "capRate": 4.0
  }
}'

# 認証なしでシナリオ作成（エラーを期待）
log_milestone "認証なしでシナリオ作成テスト"
UNAUTHORIZED_RESPONSE=$(curl -s -X POST "$API_BASE_URL/analysis/scenarios" \
  -H "Content-Type: application/json" \
  -d "$SCENARIO_DATA")

if [[ $UNAUTHORIZED_RESPONSE == *"AUTH_REQUIRED"* ]]; then
  log_milestone "認証なしテスト成功: 正しく401エラーが返されました"
else
  exit_with_error "認証なしテスト失敗: 401エラーが返されませんでした。レスポンス: $UNAUTHORIZED_RESPONSE"
fi

# 認証ありでシナリオ作成
log_milestone "認証ありでシナリオ作成テスト"
SCENARIO_RESPONSE=$(curl -s -X POST "$API_BASE_URL/analysis/scenarios" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "$SCENARIO_DATA")

TEST_SCENARIO_ID=$(echo $SCENARIO_RESPONSE | grep -o '"id":"[^"]*' | sed 's/"id":"//')

if [ -z "$TEST_SCENARIO_ID" ]; then
  exit_with_error "シナリオ作成に失敗しました。レスポンス: $SCENARIO_RESPONSE"
fi

log_milestone "シナリオ作成成功: ID=$TEST_SCENARIO_ID"

# -------------------------------------------------------
# テスト終了報告
# -------------------------------------------------------
log_milestone "全テスト完了"
echo "==================================================="
echo "テスト結果サマリー:"
echo "  - 認証: 成功"
echo "  - 物件作成: 成功 (ID: $TEST_PROPERTY_ID)"
echo "  - ボリュームチェック: 成功 (ID: $TEST_VOLUME_CHECK_ID)"
echo "  - シナリオ作成: 成功 (ID: $TEST_SCENARIO_ID)"
echo "==================================================="

exit 0