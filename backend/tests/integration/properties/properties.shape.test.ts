/**
 * 敷地形状管理機能の統合テスト
 */
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import app from '../../../src/app';
import { appConfig } from '../../../src/config';
import { connectDB, disconnectDB, clearCollection } from '../../utils/db-test-helper';
import { getTestAuth, verifyTestAdminUser } from '../../utils/test-auth-helper';
import { ZoneType, FireZoneType, PropertyStatus } from '../../../src/types';

// APIのベースURL
const baseUrl = `${appConfig.app.apiPrefix}/properties`;

// テスト用変数
let authHeader: string;
let testPropertyId: string;
let testPropertyData: any;

// テスト開始前の準備
beforeAll(async () => {
  // DB接続
  await connectDB();
  // テスト用管理者ユーザーの検証
  await verifyTestAdminUser();
  // 認証情報取得
  const auth = await getTestAuth();
  authHeader = auth.authHeader;
  
  // テスト用物件データ
  testPropertyData = {
    name: 'テスト用物件_敷地形状テスト',
    address: '福岡県福岡市中央区大名2-1-1',
    area: 250.5,
    zoneType: ZoneType.CATEGORY9,
    fireZone: FireZoneType.SEMI_FIRE,
    buildingCoverage: 80,
    floorAreaRatio: 400,
    price: 150000000,
    status: PropertyStatus.NEW,
    notes: 'テスト用物件'
  };
});

// テスト終了後のクリーンアップ
afterAll(async () => {
  // 物件コレクションのクリーンアップ
  await clearCollection('properties');
  // DB切断
  await disconnectDB();
});

describe('敷地形状管理機能', () => {
  // テストデータ作成
  beforeEach(async () => {
    // テスト物件登録
    const response = await request(app)
      .post(baseUrl)
      .set('Authorization', authHeader)
      .send(testPropertyData);
    
    expect(response.status).toBe(201);
    testPropertyId = response.body.data.id;
  });
  
  // テストデータ削除
  afterEach(async () => {
    if (testPropertyId) {
      // テスト物件削除
      await request(app)
        .delete(`${baseUrl}/${testPropertyId}`)
        .set('Authorization', authHeader);
      
      testPropertyId = '';
    }
  });
  
  test('物件の敷地形状データを正しく更新できること', async () => {
    // 敷地形状データ
    const shapeData = {
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 25 },
        { x: 0, y: 25 },
        { x: 0, y: 0 }
      ],
      width: 10,
      depth: 25
    };
    
    // 敷地形状データを更新
    const response = await request(app)
      .put(`${baseUrl}/${testPropertyId}/shape`)
      .set('Authorization', authHeader)
      .send(shapeData);
    
    // レスポンスの検証
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id', testPropertyId);
    expect(response.body.data).toHaveProperty('shapeData');
    expect(response.body.data.shapeData).toHaveProperty('points');
    expect(response.body.data.shapeData.points).toHaveLength(5);
    expect(response.body.data.shapeData.width).toBe(10);
    expect(response.body.data.shapeData.depth).toBe(25);
    expect(response.body.data.area).toBe(250); // 矩形面積が自動計算される
  });
  
  test('測量図アップロードエンドポイントが期待通りに動作すること', async () => {
    // テスト用ファイルパス
    const filePath = path.join(__dirname, '../../../uploads/test/mock-survey.pdf');
    
    // ファイルアップロードをテスト
    const response = await request(app)
      .post(`${baseUrl}/upload-survey`)
      .set('Authorization', authHeader)
      .query({ propertyId: testPropertyId })
      .attach('file', filePath);
    
    // レスポンスの検証
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('shapeData');
    expect(response.body.data.shapeData).toHaveProperty('points');
    expect(response.body.data.shapeData.points).toHaveLength(5); // モック実装では5点を返す
    expect(response.body.data.shapeData).toHaveProperty('sourceFile');
    expect(response.body.data).toHaveProperty('sourceFile');
    
    // ファイルパスが正しい形式かを検証
    expect(response.body.data.sourceFile).toMatch(/^\/uploads\//);
  });
  
  test('物件IDを指定せずに測量図アップロードが動作すること', async () => {
    // テスト用ファイルパス
    const filePath = path.join(__dirname, '../../../uploads/test/mock-survey.pdf');
    
    // ファイルアップロードをテスト（物件ID未指定）
    const response = await request(app)
      .post(`${baseUrl}/upload-survey`)
      .set('Authorization', authHeader)
      .attach('file', filePath);
    
    // レスポンスの検証
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('shapeData');
    expect(response.body.data.shapeData).toHaveProperty('points');
    expect(response.body.data.shapeData).toHaveProperty('sourceFile');
  });
  
  test('存在しない物件IDの場合に適切なエラーを返すこと', async () => {
    // 敷地形状データ
    const shapeData = {
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 25 },
        { x: 0, y: 25 }
      ],
      width: 10,
      depth: 25
    };
    
    // 不正なIDで敷地形状データを更新
    const response = await request(app)
      .put(`${baseUrl}/111111111111111111111111/shape`)
      .set('Authorization', authHeader)
      .send(shapeData);
    
    // レスポンスの検証
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toHaveProperty('message');
  });
  
  test('バリデーションエラーが適切に処理されること', async () => {
    // 不正な敷地形状データ（pointsが2点のみ）
    const invalidShapeData = {
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 0 }
      ],
      width: 10,
      depth: 25
    };
    
    // 不正なデータで敷地形状データを更新
    const response = await request(app)
      .put(`${baseUrl}/${testPropertyId}/shape`)
      .set('Authorization', authHeader)
      .send(invalidShapeData);
    
    // レスポンスの検証
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    expect(response.body.error).toHaveProperty('details');
    expect(response.body.error.details).toHaveProperty('points');
  });
});