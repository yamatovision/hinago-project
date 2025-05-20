#!/bin/bash

# シナリオ詳細取得APIテストスクリプト

# -------------------------------------------------------
# 設定パラメータ
# -------------------------------------------------------
API_BASE_URL="http://localhost:8080/api/v1"
EMAIL="higano@gmail.com"
PASSWORD="aikakumei"
AUTH_TOKEN=""
TEST_SCENARIO_ID=""

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
# テスト用物件・ボリュームチェック・シナリオの作成
# -------------------------------------------------------
log_milestone "テスト用データ作成開始"

# タイムスタンプ
TIMESTAMP=$(date +%s)

# 物件作成
PROPERTY_DATA='{
  "name": "シナリオ詳細取得テスト用物件 '"$TIMESTAMP"'",
  "address": "福岡県福岡市中央区天神1-1-'"$TIMESTAMP"'",
  "area": 200,
  "zoneType": "category9",
  "fireZone": "fire",
  "shadowRegulation": "none",
  "buildingCoverage": 80,
  "floorAreaRatio": 400,
  "price": 100000000,
  "status": "active",
  "notes": "シナリオ詳細取得APIテスト用",
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

# ボリュームチェック作成
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

# シナリオ作成
SCENARIO_DATA='{
  "propertyId": "'"$TEST_PROPERTY_ID"'",
  "volumeCheckId": "'"$TEST_VOLUME_CHECK_ID"'",
  "name": "シナリオ詳細取得テスト用 '"$TIMESTAMP"'",
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
# シナリオ詳細取得テスト
# -------------------------------------------------------
log_milestone "シナリオ詳細取得テスト開始"

# 認証なしでシナリオ詳細取得（エラーを期待）
log_milestone "認証なしでシナリオ詳細取得テスト"
UNAUTHORIZED_RESPONSE=$(curl -s -X GET "$API_BASE_URL/analysis/scenarios/$TEST_SCENARIO_ID")

if [[ $UNAUTHORIZED_RESPONSE == *"AUTH_REQUIRED"* ]]; then
  log_milestone "認証なしテスト成功: 正しく401エラーが返されました"
else
  exit_with_error "認証なしテスト失敗: 401エラーが返されませんでした。レスポンス: $UNAUTHORIZED_RESPONSE"
fi

# 認証ありでシナリオ詳細取得
log_milestone "認証ありでシナリオ詳細取得テスト"
SCENARIO_GET_RESPONSE=$(curl -s -X GET "$API_BASE_URL/analysis/scenarios/$TEST_SCENARIO_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN")

echo "詳細取得レスポンス: $SCENARIO_GET_RESPONSE"

# レスポンス検証
if [[ $SCENARIO_GET_RESPONSE == *"success\":true"* && $SCENARIO_GET_RESPONSE == *"id\":\"$TEST_SCENARIO_ID"* ]]; then
  log_milestone "シナリオ詳細取得成功"
else
  exit_with_error "シナリオ詳細取得に失敗しました。レスポンス: $SCENARIO_GET_RESPONSE"
fi

# include=profitabilityResult パラメータ付きでシナリオ詳細取得
log_milestone "include=profitabilityResult パラメータ付きでシナリオ詳細取得テスト"
SCENARIO_GET_WITH_PROFITABILITY=$(curl -s -X GET "$API_BASE_URL/analysis/scenarios/$TEST_SCENARIO_ID?include=profitabilityResult" \
  -H "Authorization: Bearer $AUTH_TOKEN")

echo "profitabilityResult付き詳細取得レスポンス: $SCENARIO_GET_WITH_PROFITABILITY"

# -------------------------------------------------------
# シナリオから収益性試算実行
# -------------------------------------------------------
log_milestone "シナリオから収益性試算実行"
PROFITABILITY_RESPONSE=$(curl -s -X POST "$API_BASE_URL/analysis/scenarios/$TEST_SCENARIO_ID/profitability" \
  -H "Authorization: Bearer $AUTH_TOKEN")

echo "収益性試算実行レスポンス: $PROFITABILITY_RESPONSE"

# レスポンス検証
if [[ $PROFITABILITY_RESPONSE == *"success\":true"* ]]; then
  log_milestone "シナリオから収益性試算実行成功"
  
  # 収益性試算IDを抽出
  PROFITABILITY_ID=$(echo $PROFITABILITY_RESPONSE | grep -o '"id":"[^"]*' | sed 's/"id":"//')
  log_milestone "収益性試算ID: $PROFITABILITY_ID"
else
  log_milestone "シナリオから収益性試算実行に失敗しました。レスポンス: $PROFITABILITY_RESPONSE"
fi

# 収益性試算実行後のシナリオ詳細取得（include=profitabilityResult パラメータ付き）
log_milestone "収益性試算実行後のシナリオ詳細取得テスト"
SCENARIO_GET_AFTER_PROFITABILITY=$(curl -s -X GET "$API_BASE_URL/analysis/scenarios/$TEST_SCENARIO_ID?include=profitabilityResult" \
  -H "Authorization: Bearer $AUTH_TOKEN")

echo "収益性試算後のシナリオ詳細取得レスポンス: $SCENARIO_GET_AFTER_PROFITABILITY"

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
echo "  - シナリオ詳細取得: 結果は上記ログを確認"
echo "==================================================="

exit 0