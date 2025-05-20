/**
 * レポート生成機能の統合テスト
 */
import request from 'supertest';
import app from '../../../../src/app';
import { ReportType, ReportFormat } from '../../../../src/types';
import { getTestAuth } from '../../../utils/test-auth-helper';
import { setupTestDb, cleanupTestDb } from '../../../utils/db-test-helper';
import fs from 'fs';
import path from 'path';

const baseUrl = '/api/v1';

describe('レポート生成API', () => {
  let authHeader: string;
  let propertyId: string;
  let volumeCheckId: string;
  let profitabilityId: string;
  
  // テスト開始前の準備
  beforeAll(async () => {
    await setupTestDb();
    
    // テスト用認証情報の取得
    const auth = await getTestAuth();
    authHeader = auth.authHeader;
    
    // テスト用物件の作成
    const propertyRes = await request(app)
      .post(`${baseUrl}/properties`)
      .set('Authorization', authHeader)
      .send({
        name: 'テスト物件',
        address: '福岡市中央区天神1-1-1',
        area: 500,
        zoneType: 'category8', // 近隣商業地域
        fireZone: 'semi-fire',
        buildingCoverage: 80,
        floorAreaRatio: 400
      });
    
    propertyId = propertyRes.body.data.id;
    
    // テスト用ボリュームチェックの作成
    const volumeCheckRes = await request(app)
      .post(`${baseUrl}/analysis/volume-check`)
      .set('Authorization', authHeader)
      .send({
        propertyId: propertyId,
        buildingParams: {
          floorHeight: 3.2,
          commonAreaRatio: 15,
          floors: 8,
          assetType: 'mansion'
        }
      });
    
    volumeCheckId = volumeCheckRes.body.data.id;
    
    // テスト用収益性試算の作成
    const profitabilityRes = await request(app)
      .post(`${baseUrl}/analysis/profitability`)
      .set('Authorization', authHeader)
      .send({
        propertyId: propertyId,
        volumeCheckId: volumeCheckId,
        financialParams: {
          rentPerSqm: 3500,
          occupancyRate: 95,
          managementCostRate: 20,
          constructionCostPerSqm: 320000,
          rentalPeriod: 35,
          capRate: 4.5
        }
      });
    
    profitabilityId = profitabilityRes.body.data.id;
  });
  
  // テスト終了後のクリーンアップ
  afterAll(async () => {
    await cleanupTestDb();
  });
  
  describe('POST /api/v1/analysis/report', () => {
    it('認証情報なしでアクセスするとエラーになる', async () => {
      const res = await request(app)
        .post(`${baseUrl}/analysis/report`)
        .send({
          type: ReportType.VOLUME_CHECK,
          format: ReportFormat.PDF,
          volumeCheckId: volumeCheckId
        });
      
      expect(res.status).toBe(401);
    });
    
    it('ボリュームチェックレポートを生成できる', async () => {
      const res = await request(app)
        .post(`${baseUrl}/analysis/report`)
        .set('Authorization', authHeader)
        .send({
          type: ReportType.VOLUME_CHECK,
          format: ReportFormat.PDF,
          volumeCheckId: volumeCheckId
        });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('reportUrl');
      expect(res.body.data).toHaveProperty('fileName');
      expect(res.body.data.reportUrl).toContain('/uploads/reports/');
      expect(res.body.data.fileName).toContain('report-volume-check-');
    });
    
    it('収益性試算レポートを生成できる', async () => {
      const res = await request(app)
        .post(`${baseUrl}/analysis/report`)
        .set('Authorization', authHeader)
        .send({
          type: ReportType.PROFITABILITY,
          format: ReportFormat.PDF,
          profitabilityId: profitabilityId
        });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('reportUrl');
      expect(res.body.data).toHaveProperty('fileName');
      expect(res.body.data.reportUrl).toContain('/uploads/reports/');
      expect(res.body.data.fileName).toContain('report-profitability-');
    });
    
    it('複合レポートを生成できる', async () => {
      const res = await request(app)
        .post(`${baseUrl}/analysis/report`)
        .set('Authorization', authHeader)
        .send({
          type: ReportType.COMBINED,
          format: ReportFormat.PDF,
          volumeCheckId: volumeCheckId,
          profitabilityId: profitabilityId
        });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('reportUrl');
      expect(res.body.data).toHaveProperty('fileName');
      expect(res.body.data.reportUrl).toContain('/uploads/reports/');
      expect(res.body.data.fileName).toContain('report-combined-');
    });
    
    it('必須パラメータが欠けているとエラーになる', async () => {
      const res = await request(app)
        .post(`${baseUrl}/analysis/report`)
        .set('Authorization', authHeader)
        .send({
          type: ReportType.VOLUME_CHECK,
          format: ReportFormat.PDF
        });
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
    
    it('存在しないIDを指定するとエラーになる', async () => {
      const res = await request(app)
        .post(`${baseUrl}/analysis/report`)
        .set('Authorization', authHeader)
        .send({
          type: ReportType.VOLUME_CHECK,
          format: ReportFormat.PDF,
          volumeCheckId: '60f1a5c3f0f1b2a3c4d5e6f7' // 存在しないID
        });
      
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
  
  describe('GET /api/v1/analysis/report/volume-check/:volumeCheckId', () => {
    it('ボリュームチェックレポートを生成できる', async () => {
      const res = await request(app)
        .get(`${baseUrl}/analysis/report/volume-check/${volumeCheckId}`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('reportUrl');
      expect(res.body.data).toHaveProperty('fileName');
    });
    
    it('存在しないIDを指定するとエラーになる', async () => {
      const res = await request(app)
        .get(`${baseUrl}/analysis/report/volume-check/60f1a5c3f0f1b2a3c4d5e6f7`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
  
  describe('GET /api/v1/analysis/report/profitability/:profitabilityId', () => {
    it('収益性試算レポートを生成できる', async () => {
      const res = await request(app)
        .get(`${baseUrl}/analysis/report/profitability/${profitabilityId}`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('reportUrl');
      expect(res.body.data).toHaveProperty('fileName');
    });
    
    it('存在しないIDを指定するとエラーになる', async () => {
      const res = await request(app)
        .get(`${baseUrl}/analysis/report/profitability/60f1a5c3f0f1b2a3c4d5e6f7`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});