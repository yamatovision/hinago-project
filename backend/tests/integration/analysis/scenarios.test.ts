/**
 * ���_�nƹ�
 */
import request from 'supertest';
import app from '../../../src/app';
import { appConfig } from '../../../src/config';
import { connectDB, disconnectDB } from '../../utils/db-test-helper';
import { getTestAuth } from '../../utils/test-auth-helper';
import { 
  ZoneType, 
  FireZoneType, 
  ShadowRegulationType, 
  PropertyStatus, 
  AssetType
} from '../../../src/types';

// APIn���URL
const baseUrl = appConfig.app.apiPrefix;

// ƹȟLMn��Ȣ��
beforeAll(async () => {
  await connectDB();
});

// ƹȟL�n������
afterAll(async () => {
  await disconnectDB();
});

describe('���_�nƹ�', () => {
  // ƹ�(ni����
  const testPropertyData = {
    name: '���ƹ�i�',
    address: 'q��7:1-1-1',
    area: 800,
    zoneType: ZoneType.CATEGORY8, // ѣFm0�
    fireZone: FireZoneType.FIRE, // 2k0�
    shadowRegulation: ShadowRegulationType.NONE,
    buildingCoverage: 80,
    floorAreaRatio: 400,
    price: 350000000,
    status: PropertyStatus.ACTIVE,
    notes: '���ƹ�(',
    shapeData: {
      points: [
        { x: 0, y: 0 },
        { x: 25, y: 0 },
        { x: 25, y: 32 },
        { x: 0, y: 32 }
      ],
      width: 25,
      depth: 32
    }
  };
  
  // ƹ�(n�������ï�����
  const testBuildingParams = {
    floorHeight: 3.3,
    commonAreaRatio: 12,
    floors: 8,
    roadWidth: 7,
    assetType: AssetType.OFFICE
  };
  
  // ƹ�(n�������գ�	
  const testOfficeScenarioData = {
    name: '�գ����',
    params: {
      assetType: AssetType.OFFICE,
      rentPerSqm: 4500,
      occupancyRate: 90,
      managementCostRate: 25,
      constructionCostPerSqm: 430000,
      rentalPeriod: 35,
      capRate: 4.0
    }
  };
  
  // ƹ�(n����������	
  const testMansionScenarioData = {
    name: '������',
    params: {
      assetType: AssetType.MANSION,
      rentPerSqm: 3800,
      occupancyRate: 95,
      managementCostRate: 20,
      constructionCostPerSqm: 380000,
      rentalPeriod: 30,
      capRate: 4.5
    }
  };
  
  // ƹ�(n���������	
  const testHotelScenarioData = {
    name: '�����',
    params: {
      assetType: AssetType.HOTEL,
      rentPerSqm: 5000,
      occupancyRate: 85,
      managementCostRate: 35,
      constructionCostPerSqm: 450000,
      rentalPeriod: 25,
      capRate: 4.2
    }
  };

  let testPropertyId: string;
  let testVolumeCheckId: string;
  let testOfficeScenarioId: string;
  let testMansionScenarioId: string;
  let testHotelScenarioId: string;
  let testProfitabilityId: string;
  let authHeader: string;

  // ƹ�MkŁj������
  beforeAll(async () => {
    const auth = await getTestAuth();
    authHeader = auth.authHeader;
    
    // ƹ�(ni��\
    const propertyRes = await request(app)
      .post(`${baseUrl}/properties`)
      .set('Authorization', authHeader)
      .send(testPropertyData);
    
    testPropertyId = propertyRes.body.data.id;
    
    // �������ï��L
    const volumeCheckRes = await request(app)
      .post(`${baseUrl}/analysis/volume-check`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        buildingParams: testBuildingParams
      });
    
    testVolumeCheckId = volumeCheckRes.body.data.id;
  });

  // hfnƹȌkƹ�����������
  afterAll(async () => {
    // ���n��'f�P��Jd
    if (testProfitabilityId) {
      await request(app)
        .delete(`${baseUrl}/analysis/profitability/${testProfitabilityId}`)
        .set('Authorization', authHeader);
    }
    
    // ��ꪒJd
    if (testOfficeScenarioId) {
      await request(app)
        .delete(`${baseUrl}/analysis/scenarios/${testOfficeScenarioId}`)
        .set('Authorization', authHeader);
    }
    
    if (testMansionScenarioId) {
      await request(app)
        .delete(`${baseUrl}/analysis/scenarios/${testMansionScenarioId}`)
        .set('Authorization', authHeader);
    }
    
    if (testHotelScenarioId) {
      await request(app)
        .delete(`${baseUrl}/analysis/scenarios/${testHotelScenarioId}`)
        .set('Authorization', authHeader);
    }
    
    // �������ïhi��Jd
    if (testVolumeCheckId) {
      await request(app)
        .delete(`${baseUrl}/analysis/volume-check/${testVolumeCheckId}`)
        .set('Authorization', authHeader);
    }
    
    if (testPropertyId) {
      await request(app)
        .delete(`${baseUrl}/properties/${testPropertyId}`)
        .set('Authorization', authHeader);
    }
  });

  describe('���nCRUD�\', () => {
    it('�գ���ꪒ\gM�Sh', async () => {
      const res = await request(app)
        .post(`${baseUrl}/analysis/scenarios`)
        .set('Authorization', authHeader)
        .send({
          propertyId: testPropertyId,
          volumeCheckId: testVolumeCheckId,
          name: testOfficeScenarioData.name,
          params: testOfficeScenarioData.params
        });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('propertyId', testPropertyId);
      expect(res.body.data).toHaveProperty('volumeCheckId', testVolumeCheckId);
      expect(res.body.data).toHaveProperty('name', testOfficeScenarioData.name);
      expect(res.body.data).toHaveProperty('params');
      
      // �����LcWO�XU�fD�Sh���
      expect(res.body.data.params).toHaveProperty('assetType', testOfficeScenarioData.params.assetType);
      expect(res.body.data.params).toHaveProperty('rentPerSqm', testOfficeScenarioData.params.rentPerSqm);
      expect(res.body.data.params).toHaveProperty('occupancyRate', testOfficeScenarioData.params.occupancyRate);
      
      // ID��XWf��ƹ�g(
      testOfficeScenarioId = res.body.data.id;
    });
    
    it('�����ꪒ\gM�Sh', async () => {
      const res = await request(app)
        .post(`${baseUrl}/analysis/scenarios`)
        .set('Authorization', authHeader)
        .send({
          propertyId: testPropertyId,
          volumeCheckId: testVolumeCheckId,
          name: testMansionScenarioData.name,
          params: testMansionScenarioData.params
        });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      
      // ID��XWf��ƹ�g(
      testMansionScenarioId = res.body.data.id;
    });
    
    it('����ꪒ\gM�Sh', async () => {
      const res = await request(app)
        .post(`${baseUrl}/analysis/scenarios`)
        .set('Authorization', authHeader)
        .send({
          propertyId: testPropertyId,
          volumeCheckId: testVolumeCheckId,
          name: testHotelScenarioData.name,
          params: testHotelScenarioData.params
        });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      
      // ID��XWf��ƹ�g(
      testHotelScenarioId = res.body.data.id;
    });
    
    it('��� ��֗gM�Sh', async () => {
      const res = await request(app)
        .get(`${baseUrl}/analysis/scenarios`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('scenarios');
      expect(Array.isArray(res.body.data.scenarios)).toBe(true);
      expect(res.body.data.scenarios.length).toBeGreaterThanOrEqual(3);
      
      // \W_���L+~�fD�Sh���
      const scenarioIds = res.body.data.scenarios.map((s: any) => s.id);
      expect(scenarioIds).toContain(testOfficeScenarioId);
      expect(scenarioIds).toContain(testMansionScenarioId);
      expect(scenarioIds).toContain(testHotelScenarioId);
    });
    
    it('i�IDg��ꪒգ���gM�Sh', async () => {
      const res = await request(app)
        .get(`${baseUrl}/analysis/scenarios?propertyId=${testPropertyId}`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('scenarios');
      
      // hfn���L�W_i�k�#�Q��fD�Sh���
      const allRelatedToProperty = res.body.data.scenarios.every(
        (s: any) => s.propertyId === testPropertyId
      );
      expect(allRelatedToProperty).toBe(true);
    });
    
    it('ID�g��ꪒ֗gM�Sh', async () => {
      const res = await request(app)
        .get(`${baseUrl}/analysis/scenarios/${testOfficeScenarioId}`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', testOfficeScenarioId);
      expect(res.body.data).toHaveProperty('name', testOfficeScenarioData.name);
      expect(res.body.data.params).toHaveProperty('assetType', testOfficeScenarioData.params.assetType);
    });
    
    it('��ꪒ��gM�Sh', async () => {
      const updatedName = '�գ�������	';
      const updatedRentPerSqm = 5000;
      
      const res = await request(app)
        .put(`${baseUrl}/analysis/scenarios/${testOfficeScenarioId}`)
        .set('Authorization', authHeader)
        .send({
          name: updatedName,
          params: {
            ...testOfficeScenarioData.params,
            rentPerSqm: updatedRentPerSqm
          }
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', testOfficeScenarioId);
      expect(res.body.data).toHaveProperty('name', updatedName);
      expect(res.body.data.params).toHaveProperty('rentPerSqm', updatedRentPerSqm);
      
      // ��L8�U�fD�Sh���
      const checkRes = await request(app)
        .get(`${baseUrl}/analysis/scenarios/${testOfficeScenarioId}`)
        .set('Authorization', authHeader);
      
      expect(checkRes.status).toBe(200);
      expect(checkRes.body.data).toHaveProperty('name', updatedName);
      expect(checkRes.body.data.params).toHaveProperty('rentPerSqm', updatedRentPerSqm);
    });
  });
  
  describe('���K�n��'f�', () => {
    it('���K���'f���LgM�Sh', async () => {
      const res = await request(app)
        .post(`${baseUrl}/analysis/scenarios/${testMansionScenarioId}/profitability`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('propertyId', testPropertyId);
      expect(res.body.data).toHaveProperty('volumeCheckId', testVolumeCheckId);
      expect(res.body.data).toHaveProperty('scenarioId', testMansionScenarioId);
      expect(res.body.data).toHaveProperty('assetType', AssetType.MANSION);
      
      // ��L�U�fD�Sh���
      expect(res.body.data).toHaveProperty('annualRentalIncome');
      expect(res.body.data).toHaveProperty('annualNOI');
      expect(res.body.data).toHaveProperty('noiYield');
      expect(res.body.data).toHaveProperty('irr');
      expect(res.body.data).toHaveProperty('paybackPeriod');
      expect(res.body.data).toHaveProperty('npv');
      
      // t!�����LU�fD�Sh���
      expect(res.body.data).toHaveProperty('annualFinancials');
      expect(Array.isArray(res.body.data.annualFinancials)).toBe(true);
      expect(res.body.data.annualFinancials.length).toBe(testMansionScenarioData.params.rentalPeriod);
      
      // ID��XWf��ƹ�g(
      testProfitabilityId = res.body.data.id;
      
      // ���k��'f�P�L�#�Q��fD�Sh���
      const scenarioRes = await request(app)
        .get(`${baseUrl}/analysis/scenarios/${testMansionScenarioId}`)
        .set('Authorization', authHeader);
      
      expect(scenarioRes.status).toBe(200);
      expect(scenarioRes.body.data).toHaveProperty('profitabilityResultId', testProfitabilityId);
    });
    
    it('X���K�����'f���LY�h�Xn�#L��U��Sh', async () => {
      //  n��'f�P�ID��X
      const firstProfitabilityId = testProfitabilityId;
      
      // X���K�����'f���L
      const res = await request(app)
        .post(`${baseUrl}/analysis/scenarios/${testMansionScenarioId}/profitability`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('scenarioId', testMansionScenarioId);
      
      // �WD��'f�P�ID�֗
      const secondProfitabilityId = res.body.data.id;
      
      // pj�IDgB�Sh���
      expect(secondProfitabilityId).not.toBe(firstProfitabilityId);
      
      // ���n�#L��U�fD�Sh���
      const scenarioRes = await request(app)
        .get(`${baseUrl}/analysis/scenarios/${testMansionScenarioId}`)
        .set('Authorization', authHeader);
      
      expect(scenarioRes.status).toBe(200);
      expect(scenarioRes.body.data).toHaveProperty('profitabilityResultId', secondProfitabilityId);
      
      //  n��'f�P�oM�MX(Y�L���hn�#o�dU�fD�Sh���
      const firstProfitabilityRes = await request(app)
        .get(`${baseUrl}/analysis/profitability/${firstProfitabilityId}`)
        .set('Authorization', authHeader);
      
      if (firstProfitabilityRes.status === 200) {
        // �#L�dU�fD�Sh���
        expect(firstProfitabilityRes.body.data.scenarioId).not.toBe(testMansionScenarioId);
      } else {
        // ~_oJdU�fD���'�B���k��	
        expect(firstProfitabilityRes.status).toBe(404);
      }
      
      // ʌnƹ�n_�k �n��'f�P�ID���
      testProfitabilityId = secondProfitabilityId;
    });
    
    it('pn���nP���gM�Sh', async () => {
      // �����n��'f���L
      const hotelRes = await request(app)
        .post(`${baseUrl}/analysis/scenarios/${testHotelScenarioId}/profitability`)
        .set('Authorization', authHeader);
      
      expect(hotelRes.status).toBe(201);
      const hotelProfitabilityId = hotelRes.body.data.id;
      
      // �գ����n��'f���L
      const officeRes = await request(app)
        .post(`${baseUrl}/analysis/scenarios/${testOfficeScenarioId}/profitability`)
        .set('Authorization', authHeader);
      
      expect(officeRes.status).toBe(201);
      const officeProfitabilityId = officeRes.body.data.id;
      
      // ����n��'f�P��֗
      const mansionRes = await request(app)
        .get(`${baseUrl}/analysis/profitability/${testProfitabilityId}`)
        .set('Authorization', authHeader);
      
      expect(mansionRes.status).toBe(200);
      
      // ���n��'f�P��֗
      const hotelCheckRes = await request(app)
        .get(`${baseUrl}/analysis/profitability/${hotelProfitabilityId}`)
        .set('Authorization', authHeader);
      
      expect(hotelCheckRes.status).toBe(200);
      
      // �գ�n��'f�P��֗
      const officeCheckRes = await request(app)
        .get(`${baseUrl}/analysis/profitability/${officeProfitabilityId}`)
        .set('Authorization', authHeader);
      
      expect(officeCheckRes.status).toBe(200);
      
      // ���ȿ��Thk��'��
      console.log('���ȿ��n��'�:');
      console.log('����:', {
        noiYield: mansionRes.body.data.noiYield,
        irr: mansionRes.body.data.irr,
        paybackPeriod: mansionRes.body.data.paybackPeriod
      });
      console.log('���:', {
        noiYield: hotelCheckRes.body.data.noiYield,
        irr: hotelCheckRes.body.data.irr,
        paybackPeriod: hotelCheckRes.body.data.paybackPeriod
      });
      console.log('�գ�:', {
        noiYield: officeCheckRes.body.data.noiYield,
        irr: officeCheckRes.body.data.irr,
        paybackPeriod: officeCheckRes.body.data.paybackPeriod
      });
      
      // ���ȿ��n��'L�U�fD�Sh���
      expect(mansionRes.body.data.noiYield).toBeGreaterThan(0);
      expect(hotelCheckRes.body.data.noiYield).toBeGreaterThan(0);
      expect(officeCheckRes.body.data.noiYield).toBeGreaterThan(0);
    });
  });
  
  describe('Jd�\', () => {
    it('��ꪒJdY�h�#Y���'f�P�hn�#L�dU��Sh', async () => {
      // ��'f�P�nID��X
      const profitabilityId = testProfitabilityId;
      
      // ��ꪒJd
      const deleteRes = await request(app)
        .delete(`${baseUrl}/analysis/scenarios/${testMansionScenarioId}`)
        .set('Authorization', authHeader);
      
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
      
      // Jd�o���L֗gMjDSh���
      const scenarioCheckRes = await request(app)
        .get(`${baseUrl}/analysis/scenarios/${testMansionScenarioId}`)
        .set('Authorization', authHeader);
      
      expect(scenarioCheckRes.status).toBe(404);
      
      // ��'f�P�oX(Y�L���hn�#L�dU�fD�Sh���
      const profitabilityCheckRes = await request(app)
        .get(`${baseUrl}/analysis/profitability/${profitabilityId}`)
        .set('Authorization', authHeader);
      
      if (profitabilityCheckRes.status === 200) {
        // �#L�dU�fD�Sh���
        expect(profitabilityCheckRes.body.data.scenarioId).not.toBe(testMansionScenarioId);
      }
    });
    
    it('��n��ꪂJdgM�Sh', async () => {
      // �գ���ꪒJd
      const officeDeleteRes = await request(app)
        .delete(`${baseUrl}/analysis/scenarios/${testOfficeScenarioId}`)
        .set('Authorization', authHeader);
      
      expect(officeDeleteRes.status).toBe(200);
      
      // ����ꪒJd
      const hotelDeleteRes = await request(app)
        .delete(`${baseUrl}/analysis/scenarios/${testHotelScenarioId}`)
        .set('Authorization', authHeader);
      
      expect(hotelDeleteRes.status).toBe(200);
      
      // Jd�o��� �K�rSn���LdU�fD�Sh���
      const listRes = await request(app)
        .get(`${baseUrl}/analysis/scenarios?propertyId=${testPropertyId}`)
        .set('Authorization', authHeader);
      
      expect(listRes.status).toBe(200);
      
      // JdW_���L �k+~�fDjDSh���
      const scenarioIds = listRes.body.data.scenarios.map((s: any) => s.id);
      expect(scenarioIds).not.toContain(testOfficeScenarioId);
      expect(scenarioIds).not.toContain(testMansionScenarioId);
      expect(scenarioIds).not.toContain(testHotelScenarioId);
    });
  });
});