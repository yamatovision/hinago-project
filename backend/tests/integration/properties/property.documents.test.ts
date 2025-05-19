/**
 * 物件文書API統合テスト
 */
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import app from '../../../src/app';
import { appConfig } from '../../../src/config';
import { connectDB, disconnectDB } from '../../utils/db-test-helper';
import { getTestAuth } from '../../utils/test-auth-helper';
import { ZoneType, FireZoneType, ShadowRegulationType, PropertyStatus, DocumentType } from '../../../src/types';

// APIのベースURL
const baseUrl = appConfig.app.apiPrefix;

// テスト実行前のセットアップ
beforeAll(async () => {
  await connectDB();
});

// テスト実行後のクリーンアップ
afterAll(async () => {
  await disconnectDB();
});

describe('物件文書API', () => {
  // テスト用の物件データ
  const testPropertyData = {
    name: 'ドキュメントテスト物件',
    address: '福岡県福岡市中央区天神1-1-1',
    area: 350.5,
    zoneType: ZoneType.CATEGORY9,
    fireZone: FireZoneType.SEMI_FIRE,
    shadowRegulation: ShadowRegulationType.TYPE1,
    buildingCoverage: 80,
    floorAreaRatio: 400,
    price: 150000000,
    status: PropertyStatus.ACTIVE,
    notes: 'ドキュメントテスト用物件'
  };
  
  let testPropertyId: string;
  let authHeader: string;
  let testDocumentId: string;
  
  // テスト用PDFファイルのパス
  const testPdfPath = path.join(process.cwd(), 'uploads', 'test', 'mock-survey.pdf');
  
  // 各テスト前に認証トークンを取得し、テスト物件を作成
  beforeAll(async () => {
    // 認証トークンの取得
    const auth = await getTestAuth();
    authHeader = auth.authHeader;
    
    // テスト物件の作成
    const res = await request(app)
      .post(`${baseUrl}/properties`)
      .set('Authorization', authHeader)
      .send(testPropertyData);
    
    testPropertyId = res.body.data.id;
    expect(testPropertyId).toBeDefined();
  });
  
  // テスト終了後にテスト物件を削除
  afterAll(async () => {
    if (testPropertyId) {
      await request(app)
        .delete(`${baseUrl}/properties/${testPropertyId}`)
        .set('Authorization', authHeader);
    }
  });
  
  describe('POST /properties/:propertyId/documents', () => {
    it('認証済みユーザーは物件に文書をアップロードできる', async () => {
      // ファイルが存在することを確認
      expect(fs.existsSync(testPdfPath)).toBe(true);
      
      const res = await request(app)
        .post(`${baseUrl}/properties/${testPropertyId}/documents`)
        .set('Authorization', authHeader)
        .field('documentType', DocumentType.SURVEY)
        .field('description', 'テスト測量図')
        .attach('file', testPdfPath);
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('propertyId', testPropertyId);
      expect(res.body.data).toHaveProperty('name');
      expect(res.body.data).toHaveProperty('fileUrl');
      expect(res.body.data).toHaveProperty('documentType', DocumentType.SURVEY);
      expect(res.body.data).toHaveProperty('description', 'テスト測量図');
      
      // 後続のテストのために文書IDを保存
      testDocumentId = res.body.data.id;
    });
    
    it('認証なしで文書をアップロードできない', async () => {
      const res = await request(app)
        .post(`${baseUrl}/properties/${testPropertyId}/documents`)
        .field('documentType', DocumentType.LEGAL)
        .field('description', '認証なしテスト')
        .attach('file', testPdfPath);
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
    });
    
    it('存在しない物件IDでは404が返される', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011'; // 適当な MongoDB ObjectId フォーマット
      
      const res = await request(app)
        .post(`${baseUrl}/properties/${nonExistentId}/documents`)
        .set('Authorization', authHeader)
        .field('documentType', DocumentType.LEGAL)
        .field('description', '存在しない物件テスト')
        .attach('file', testPdfPath);
      
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
    });
    
    it('必須フィールドがない場合はエラーになる', async () => {
      // documentTypeを省略
      const res = await request(app)
        .post(`${baseUrl}/properties/${testPropertyId}/documents`)
        .set('Authorization', authHeader)
        .field('description', 'バリデーションテスト')
        .attach('file', testPdfPath);
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(res.body.error.details).toHaveProperty('documentType');
    });
    
    it('ファイルなしではアップロードできない', async () => {
      const res = await request(app)
        .post(`${baseUrl}/properties/${testPropertyId}/documents`)
        .set('Authorization', authHeader)
        .field('documentType', DocumentType.REPORT)
        .field('description', 'ファイルなしテスト');
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'FILE_NOT_FOUND');
    });
  });
  
  describe('GET /properties/:propertyId/documents', () => {
    it('認証済みユーザーは物件の文書一覧を取得できる', async () => {
      const res = await request(app)
        .get(`${baseUrl}/properties/${testPropertyId}/documents`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      
      // アップロードした文書が含まれているか確認
      const foundDocument = res.body.data.find((doc: any) => doc.id === testDocumentId);
      expect(foundDocument).toBeDefined();
      expect(foundDocument.propertyId).toBe(testPropertyId);
      expect(foundDocument.documentType).toBe(DocumentType.SURVEY);
    });
    
    it('認証なしで文書一覧を取得できない', async () => {
      const res = await request(app)
        .get(`${baseUrl}/properties/${testPropertyId}/documents`);
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
    });
    
    it('存在しない物件IDでは404が返される', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011'; // 適当な MongoDB ObjectId フォーマット
      
      const res = await request(app)
        .get(`${baseUrl}/properties/${nonExistentId}/documents`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
    });
    
    it('文書タイプでフィルタリングできる', async () => {
      // まず別のタイプの文書をアップロード
      await request(app)
        .post(`${baseUrl}/properties/${testPropertyId}/documents`)
        .set('Authorization', authHeader)
        .field('documentType', DocumentType.LEGAL)
        .field('description', '法的文書テスト')
        .attach('file', testPdfPath);
      
      // SURVEY タイプの文書のみを取得
      const res = await request(app)
        .get(`${baseUrl}/properties/${testPropertyId}/documents?documentType=${DocumentType.SURVEY}`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      
      // すべての文書が指定したタイプを持っているか確認
      res.body.data.forEach((doc: any) => {
        expect(doc.documentType).toBe(DocumentType.SURVEY);
      });
      
      // テストで作成した文書が含まれているか確認
      const foundDocument = res.body.data.find((doc: any) => doc.id === testDocumentId);
      expect(foundDocument).toBeDefined();
    });
  });
  
  describe('DELETE /properties/:propertyId/documents/:documentId', () => {
    it('認証済みユーザーは文書を削除できる', async () => {
      // 削除用に新しい文書をアップロード
      const uploadRes = await request(app)
        .post(`${baseUrl}/properties/${testPropertyId}/documents`)
        .set('Authorization', authHeader)
        .field('documentType', DocumentType.OTHER)
        .field('description', '削除テスト用文書')
        .attach('file', testPdfPath);
      
      const deleteDocumentId = uploadRes.body.data.id;
      
      // 文書IDが存在することを確認
      expect(deleteDocumentId).toBeDefined();
      
      // 文書を削除
      const res = await request(app)
        .delete(`${baseUrl}/properties/${testPropertyId}/documents/${deleteDocumentId}`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(204); // No Content
      
      // 削除されたことを確認するために文書一覧を取得
      const checkRes = await request(app)
        .get(`${baseUrl}/properties/${testPropertyId}/documents`)
        .set('Authorization', authHeader);
      
      // 削除した文書が一覧に含まれていないことを確認
      const deletedDocument = checkRes.body.data.find((doc: any) => doc.id === deleteDocumentId);
      expect(deletedDocument).toBeUndefined();
    });
    
    it('認証なしで文書を削除できない', async () => {
      const res = await request(app)
        .delete(`${baseUrl}/properties/${testPropertyId}/documents/${testDocumentId}`);
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
      
      // 削除されていないことを確認
      const checkRes = await request(app)
        .get(`${baseUrl}/properties/${testPropertyId}/documents`)
        .set('Authorization', authHeader);
      
      // テスト文書がまだ存在することを確認
      const document = checkRes.body.data.find((doc: any) => doc.id === testDocumentId);
      expect(document).toBeDefined();
    });
    
    it('存在しない文書IDでは404が返される', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011'; // 適当な MongoDB ObjectId フォーマット
      
      const res = await request(app)
        .delete(`${baseUrl}/properties/${testPropertyId}/documents/${nonExistentId}`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
    });
  });
});