/**
 * 物件モデルのユニットテスト
 */
import { PropertyModel } from '../../../src/db/models';
import { ZoneType, FireZoneType, ShadowRegulationType, PropertyStatus } from '../../../src/types';
import { setupTestDatabase, cleanupTestDatabase } from '../../utils/db-test-helper';
import mongoose from 'mongoose';

describe('PropertyModel', () => {
  const testPropertyData = {
    name: 'テスト物件',
    address: '福岡県福岡市中央区大名2-1-1',
    area: 250.5,
    zoneType: ZoneType.CATEGORY9,
    fireZone: FireZoneType.SEMI_FIRE,
    shadowRegulation: ShadowRegulationType.TYPE1,
    buildingCoverage: 80,
    floorAreaRatio: 400,
    price: 120000000,
    status: PropertyStatus.ACTIVE,
    notes: '駅から徒歩5分の好立地',
    shapeData: {
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 25.05 },
        { x: 0, y: 25.05 }
      ],
      width: 10,
      depth: 25.05
    }
  };
  
  let testPropertyId: string;
  
  // テスト前にデータベース接続をセットアップ
  beforeAll(async () => {
    await setupTestDatabase();
  });
  
  // テスト後にデータベース接続をクリーンアップ
  afterAll(async () => {
    await cleanupTestDatabase();
  });
  
  // 物件作成のテスト
  describe('create', () => {
    it('新しい物件を作成できる', async () => {
      const newProperty = await PropertyModel.create(testPropertyData);
      
      // IDが生成されたことを確認
      expect(newProperty.id).toBeDefined();
      testPropertyId = newProperty.id;
      
      // その他のフィールドが正しく設定されていることを確認
      expect(newProperty.name).toBe(testPropertyData.name);
      expect(newProperty.address).toBe(testPropertyData.address);
      expect(newProperty.area).toBe(testPropertyData.area);
      expect(newProperty.zoneType).toBe(testPropertyData.zoneType);
      expect(newProperty.fireZone).toBe(testPropertyData.fireZone);
      expect(newProperty.shadowRegulation).toBe(testPropertyData.shadowRegulation);
      expect(newProperty.buildingCoverage).toBe(testPropertyData.buildingCoverage);
      expect(newProperty.floorAreaRatio).toBe(testPropertyData.floorAreaRatio);
      expect(newProperty.price).toBe(testPropertyData.price);
      expect(newProperty.status).toBe(testPropertyData.status);
      expect(newProperty.notes).toBe(testPropertyData.notes);
      
      // 敷地形状データが正しく設定されていることを確認
      expect(newProperty.shapeData).toBeDefined();
      expect(newProperty.shapeData?.points.length).toBe(4);
      expect(newProperty.shapeData?.width).toBe(10);
      expect(newProperty.shapeData?.depth).toBe(25.05);
      
      // 許容建築面積が正しく計算されていることを確認
      expect(newProperty.allowedBuildingArea).toBeDefined();
      expect(newProperty.allowedBuildingArea).toBeCloseTo(250.5 * 0.8, 2);
      
      // タイムスタンプが設定されていることを確認
      expect(newProperty.createdAt).toBeInstanceOf(Date);
      expect(newProperty.updatedAt).toBeInstanceOf(Date);
    });
  });
  
  // 物件検索のテスト
  describe('findById', () => {
    it('IDで物件を検索できる', async () => {
      const property = await PropertyModel.findById(testPropertyId);
      
      expect(property).toBeDefined();
      expect(property?.id).toBe(testPropertyId);
      expect(property?.name).toBe(testPropertyData.name);
    });
    
    it('存在しないIDで検索するとnullを返す', async () => {
      // MongoDBの有効なObjectIDを使用
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const property = await PropertyModel.findById(nonExistentId);
      expect(property).toBeNull();
    });
    
    it('無効なIDで検索するとnullを返す', async () => {
      const invalidId = 'invalid-id';
      const property = await PropertyModel.findById(invalidId);
      expect(property).toBeNull();
    });
  });
  
  // 物件一覧のテスト
  describe('findAll', () => {
    it('全ての物件を取得できる', async () => {
      const result = await PropertyModel.findAll();
      
      expect(result.properties).toBeDefined();
      expect(result.properties.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBeDefined();
      
      // 作成した物件が含まれていることを確認
      const foundProperty = result.properties.find(p => p.id === testPropertyId);
      expect(foundProperty).toBeDefined();
      expect(foundProperty?.name).toBe(testPropertyData.name);
    });
    
    it('フィルタリングができる', async () => {
      // ステータスでフィルタリング
      const result = await PropertyModel.findAll({ status: PropertyStatus.ACTIVE });
      
      expect(result.properties).toBeDefined();
      expect(result.properties.length).toBeGreaterThan(0);
      
      // 全ての物件が指定したステータスであることを確認
      result.properties.forEach(property => {
        expect(property.status).toBe(PropertyStatus.ACTIVE);
      });
    });
    
    it('ページネーションができる', async () => {
      // ページサイズを小さく設定
      const result = await PropertyModel.findAll({}, 1, 5);
      
      expect(result.properties).toBeDefined();
      expect(result.limit).toBe(5);
      expect(result.page).toBe(1);
      
      // 返された物件数がページサイズ以下であることを確認
      expect(result.properties.length).toBeLessThanOrEqual(5);
    });
    
    it('ソートができる', async () => {
      // 名前の昇順でソート
      const result = await PropertyModel.findAll({}, 1, 20, { name: 1 });
      
      expect(result.properties).toBeDefined();
      expect(result.properties.length).toBeGreaterThan(0);
      
      // ソートが正しく適用されていることを確認（最低2件あれば）
      if (result.properties.length >= 2) {
        for (let i = 1; i < result.properties.length; i++) {
          const prev = result.properties[i-1].name;
          const curr = result.properties[i].name;
          // 非厳密チェック：同じ名前の場合もあるため
          expect(prev <= curr).toBeTruthy();
        }
      }
    });
  });
  
  // 物件更新のテスト
  describe('update', () => {
    it('既存の物件情報を更新できる', async () => {
      const updatedData = {
        name: '更新された物件名',
        price: 150000000,
        status: PropertyStatus.NEGOTIATING
      };
      
      const updatedProperty = await PropertyModel.update(testPropertyId, updatedData);
      
      expect(updatedProperty).toBeDefined();
      expect(updatedProperty?.id).toBe(testPropertyId);
      expect(updatedProperty?.name).toBe(updatedData.name);
      expect(updatedProperty?.price).toBe(updatedData.price);
      expect(updatedProperty?.status).toBe(updatedData.status);
      expect(updatedProperty?.address).toBe(testPropertyData.address); // 変更していないフィールドは保持される
    });
    
    it('面積と建蔽率が更新された場合、許容建築面積も再計算される', async () => {
      const updatedData = {
        area: 300.0,
        buildingCoverage: 60
      };
      
      const updatedProperty = await PropertyModel.update(testPropertyId, updatedData);
      
      expect(updatedProperty).toBeDefined();
      expect(updatedProperty?.area).toBe(updatedData.area);
      expect(updatedProperty?.buildingCoverage).toBe(updatedData.buildingCoverage);
      // 許容建築面積が正しく再計算されていることを確認
      expect(updatedProperty?.allowedBuildingArea).toBeCloseTo(300.0 * 0.6, 2);
    });
    
    it('存在しない物件を更新するとnullを返す', async () => {
      // MongoDBの有効なObjectIDを使用
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const updatedProperty = await PropertyModel.update(nonExistentId, { name: '新しい名前' });
      expect(updatedProperty).toBeNull();
    });
  });
  
  // 物件削除のテスト
  describe('delete', () => {
    it('既存の物件を削除できる', async () => {
      const result = await PropertyModel.delete(testPropertyId);
      expect(result).toBe(true);
      
      // 削除されたことを確認
      const deletedProperty = await PropertyModel.findById(testPropertyId);
      expect(deletedProperty).toBeNull();
    });
    
    it('存在しない物件を削除するとfalseを返す', async () => {
      // MongoDBの有効なObjectIDを使用
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await PropertyModel.delete(nonExistentId);
      expect(result).toBe(false);
    });
  });
});