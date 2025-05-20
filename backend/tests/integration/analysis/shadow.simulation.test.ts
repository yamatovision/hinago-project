/**
 * 日影シミュレーション統合テスト
 */
import mongoose from 'mongoose';
import { Property, ShadowRegulationType, HeightDistrictType, ZoneType, FireZoneType, AssetType } from '../../../src/types';
import { PropertyModel, VolumeCheckModel } from '../../../src/db/models';
import { setupTestDatabase, cleanupTestDatabase } from '../../utils/db-test-helper';
import { getTestAuth, verifyTestAdminUser } from '../../utils/test-auth-helper';
import { 
  generateBuildingShape,
  simulateShadow 
} from '../../../src/features/analysis/regulation/shadowSimulation';
import { calculateSunPositionsForDay, getWinterSolsticeDate } from '../../../src/features/analysis/regulation/sunPosition';
import { 
  generateOptimizedGrid,
  createShadowCalculationBatches 
} from '../../../src/features/analysis/regulation/shadowOptimization';

// モックデータ
const mockProperty: Partial<Property> = {
  name: '日影シミュレーションテスト用物件',
  address: '福岡市中央区天神1-1-1',
  area: 1000,
  zoneType: ZoneType.CATEGORY5, // 第一種住居地域
  fireZone: FireZoneType.SEMI_FIRE,
  shadowRegulation: ShadowRegulationType.TYPE1,
  buildingCoverage: 60,
  floorAreaRatio: 200,
  heightDistrict: HeightDistrictType.FIRST_15M,
  northBoundaryDistance: 12,
  shadowRegulationDetail: {
    measurementHeight: 4,
    hourRanges: {
      primary: 4,
      secondary: 2.5
    }
  },
  shapeData: {
    points: [
      { x: 0, y: 0 },
      { x: 30, y: 0 },
      { x: 30, y: 33.33 },
      { x: 0, y: 33.33 }
    ]
  }
};

describe('日影シミュレーション統合テスト', () => {
  let testUserId: string;
  let testPropertyId: string;
  
  // テスト前のセットアップ
  beforeAll(async () => {
    await setupTestDatabase();
    
    // テストユーザーの認証情報を取得
    await verifyTestAdminUser();
    const testAuth = await getTestAuth();
    testUserId = testAuth.user.id;
    
    // テスト用物件の作成
    const property = await PropertyModel.create({
      ...mockProperty,
      userId: testUserId
    } as any); // PropertyCreateDataに一部合わないものがあるためany型を使用
    testPropertyId = property.id;
  });
  
  // テスト後のクリーンアップ
  afterAll(async () => {
    await cleanupTestDatabase();
  });
  
  describe('建物形状生成', () => {
    test('敷地形状から建物形状を正しく生成できる', async () => {
      // 物件の取得
      const property = await PropertyModel.findById(testPropertyId);
      
      // 建築パラメータ
      const buildingParams = {
        floorHeight: 3,
        floors: 5,
        commonAreaRatio: 15,
        assetType: AssetType.MANSION
      };
      
      // 建物形状の生成
      const buildingShape = generateBuildingShape(property!, buildingParams);
      
      // 検証
      expect(buildingShape).toBeDefined();
      expect(buildingShape.height).toBe(buildingParams.floorHeight * buildingParams.floors);
      expect(buildingShape.basePolygon).toHaveLength(mockProperty.shapeData!.points.length);
      expect(buildingShape.vertices).toHaveLength(mockProperty.shapeData!.points.length * 2);
    });
  });
  
  describe('最適化グリッド生成', () => {
    test('最適化されたグリッドを生成できる', async () => {
      // 物件の取得
      const property = await PropertyModel.findById(testPropertyId);
      
      // 最適化グリッドの生成
      const grid = generateOptimizedGrid(property!, { resolution: 2, extent: 30 });
      
      // 検証
      expect(grid).toBeDefined();
      expect(grid.length).toBeGreaterThan(0);
      
      // グリッドの各点がz座標（測定面高さ）を持っていることを確認
      const allHaveZCoordinate = grid.every(point => 
        typeof point.z === 'number' && 
        point.z === property!.shadowRegulationDetail!.measurementHeight
      );
      expect(allHaveZCoordinate).toBe(true);
    });
    
    test('間引き率を指定したグリッド生成が機能する', async () => {
      // 物件の取得
      const property = await PropertyModel.findById(testPropertyId);
      
      // 間引きなしのグリッド
      const gridNoDecimation = generateOptimizedGrid(property!, { 
        resolution: 2, 
        extent: 30 
      });
      
      // 50%間引きのグリッド
      const gridWithDecimation = generateOptimizedGrid(property!, { 
        resolution: 2, 
        extent: 30,
        decimation: 2
      });
      
      // 検証
      expect(gridNoDecimation.length).toBeGreaterThan(gridWithDecimation.length);
      // 完全に半分になるわけではないが、大幅に減少していることを確認
      expect(gridNoDecimation.length > gridWithDecimation.length * 1.5).toBe(true);
    });
  });
  
  describe('日影シミュレーション計算', () => {
    test('日影シミュレーションが正しく計算できる', async () => {
      // 物件の取得
      const property = await PropertyModel.findById(testPropertyId);
      
      // 建築パラメータ
      const buildingParams = {
        floorHeight: 3,
        floors: 5,
        commonAreaRatio: 15,
        assetType: AssetType.MANSION
      };
      
      // 建物形状の生成
      const buildingShape = generateBuildingShape(property!, buildingParams);
      
      // 日影シミュレーションの実行
      const shadowSimulation = simulateShadow(
        property!,
        buildingShape,
        property!.shadowRegulationDetail!.measurementHeight
      );
      
      // 検証
      expect(shadowSimulation).toBeDefined();
      expect(typeof shadowSimulation.maxHours).toBe('number');
      expect(typeof shadowSimulation.mediumHours).toBe('number');
      expect(typeof shadowSimulation.compliant).toBe('boolean');
      expect(shadowSimulation.isochroneMap).toBeDefined();
      
      // 等時間線マップの検証
      const { isochroneMap } = shadowSimulation;
      expect(isochroneMap).toBeDefined();
      expect(isochroneMap!.resolution).toBeGreaterThan(0);
      expect(isochroneMap!.gridData.length).toBeGreaterThan(0);
    });
  });
  
  describe('バッチ処理計算', () => {
    test('日影計算がバッチに分割できる', async () => {
      // 物件の取得
      const property = await PropertyModel.findById(testPropertyId);
      
      // 建築パラメータと建物形状
      const buildingParams = {
        floorHeight: 3,
        floors: 5,
        commonAreaRatio: 15,
        assetType: AssetType.MANSION
      };
      const buildingShape = generateBuildingShape(property!, buildingParams);
      
      // 最適化グリッドの生成
      const grid = generateOptimizedGrid(property!, { 
        resolution: 2, 
        extent: 20
      });
      
      // 太陽位置の計算
      const winterSolstice = getWinterSolsticeDate(new Date().getFullYear());
      const sunPositions = calculateSunPositionsForDay(winterSolstice);
      
      // バッチサイズを小さく設定してテスト
      const batchSize = 10;
      const batches = createShadowCalculationBatches(
        grid, 
        buildingShape, 
        sunPositions, 
        batchSize
      );
      
      // 検証
      expect(batches.length).toBe(Math.ceil(grid.length / batchSize));
      
      // 最初のバッチを実行してみる
      const firstBatchResult = batches[0]();
      expect(firstBatchResult.shadowHours).toBeDefined();
      expect(firstBatchResult.shadowHours!.length).toBeLessThanOrEqual(batchSize);
      expect(firstBatchResult.batchIndices).toBeDefined();
      expect(firstBatchResult.batchIndices!.start).toBe(0);
      expect(firstBatchResult.batchIndices!.end).toBeLessThanOrEqual(batchSize);
    });
  });
});