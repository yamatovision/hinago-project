/**
 * シナリオ削除マイクロテスト - 超軽量版
 * - タイムアウト10秒以内の超高速テスト
 * - シナリオ作成と削除の基本機能を検証
 * - マイルストーンログで詳細な実行状況を把握可能
 * - 収益性試算結果との関連削除の検証を含む
 */
import request from 'supertest';
import app from '../../../src/app';
import { appConfig } from '../../../src/config';
import { connectDB, disconnectDB } from '../../utils/db-test-helper';
import { getTestAuth } from '../../utils/test-auth-helper';
import { AssetType } from '../../../src/types';
import mongoose from 'mongoose';

// APIのベースURL
const baseUrl = appConfig.app.apiPrefix;

// タイムアウト監視用の詳細マイルストーンロガー
class MilestoneTracker {
  private milestones: { [key: string]: number } = {};
  private currentOp: string = "初期化";
  private startTime: number = Date.now();
  private statusTimer: NodeJS.Timeout | null = null;

  constructor() {
    // 1秒ごとに現在の状態を報告
    this.statusTimer = setInterval(() => {
      const elapsed = (Date.now() - this.startTime) / 1000;
      console.log(`[${elapsed.toFixed(2)}秒経過] 現在の状態: ${this.currentOp}`);
    }, 1000);
  }

  // 操作の開始を記録
  setOperation(op: string): void {
    this.currentOp = op;
    const elapsed = (Date.now() - this.startTime) / 1000;
    console.log(`[${elapsed.toFixed(2)}秒経過] ▶️ 開始: ${op}`);
  }

  // マイルストーンを記録
  mark(name: string): void {
    this.milestones[name] = Date.now();
    const elapsed = (Date.now() - this.startTime) / 1000;
    console.log(`[${elapsed.toFixed(2)}秒経過] 🏁 マイルストーン: ${name}`);
  }

  // クリーンアップ
  cleanup(): void {
    if (this.statusTimer) {
      clearInterval(this.statusTimer);
      this.statusTimer = null;
    }
    
    // マイルストーン間の経過時間を表示
    const sortedMilestones = Object.entries(this.milestones).sort((a, b) => a[1] - b[1]);
    console.log("\n--- マイルストーン経過時間 ---");
    
    for (let i = 1; i < sortedMilestones.length; i++) {
      const prev = sortedMilestones[i-1];
      const curr = sortedMilestones[i];
      const diffSec = (curr[1] - prev[1]) / 1000;
      console.log(`${prev[0]} → ${curr[0]}: ${diffSec.toFixed(2)}秒`);
    }
    
    const totalSec = (Date.now() - this.startTime) / 1000;
    console.log(`総実行時間: ${totalSec.toFixed(2)}秒\n`);
  }
}

describe('シナリオ削除マイクロテスト', () => {
  // マイルストーントラッカーのインスタンス
  const tracker = new MilestoneTracker();
  
  // 認証ヘッダーと作成されたリソースのID
  let authHeader: string;
  let propertyId: string = '000000000000000000000000'; // ダミーID（初期値）
  let volumeCheckId: string = '000000000000000000000000'; // ダミーID（初期値）
  let scenarioId: string = '000000000000000000000000'; // ダミーID（初期値）
  let profitabilityId: string = '000000000000000000000000'; // ダミーID（初期値）
  
  // テスト実行前のセットアップ
  beforeAll(async () => {
    tracker.mark('テスト開始');
    
    tracker.setOperation('データベース接続');
    await connectDB();
    tracker.mark('DB接続完了');
    
    tracker.setOperation('認証情報の取得');
    try {
      const auth = await getTestAuth();
      authHeader = auth.authHeader;
      tracker.mark('認証情報取得完了');
    } catch (error) {
      console.error('認証情報取得エラー:', error);
      throw new Error('認証情報の取得に失敗しました');
    }

    // テスト用の物件を作成（超軽量）
    tracker.setOperation('テスト用物件の作成');
    try {
      const { PropertyModel } = require('../../../src/db/models');
      const { ZoneType, FireZoneType, ShadowRegulationType } = require('../../../src/types');
      
      // モデルを直接使用して作成
      const property = await PropertyModel.create({
        name: 'マイクロテスト用物件',
        address: '福岡県福岡市中央区大名2-1-1',
        area: 50, // 小さい敷地面積
        zoneType: ZoneType.CATEGORY9,
        fireZone: FireZoneType.SEMI_FIRE,
        shadowRegulation: ShadowRegulationType.TYPE1,
        buildingCoverage: 60,
        floorAreaRatio: 200,
        notes: 'シナリオ削除テスト用',
        shapeData: {
          points: [
            { x: 0, y: 0 },
            { x: 5, y: 0 },
            { x: 5, y: 10 },
            { x: 0, y: 10 }
          ],
          width: 5,
          depth: 10
        }
      });
      
      propertyId = property.id;
      tracker.mark('物件作成完了');
    } catch (error) {
      console.error('物件作成エラー:', error);
      throw new Error('テスト用物件の作成に失敗しました');
    }

    // テスト用のボリュームチェックを作成（超軽量）
    tracker.setOperation('テスト用ボリュームチェックの作成');
    try {
      const { VolumeCheckModel } = require('../../../src/db/models');
      
      // モデルを直接使用して最小限のボリュームチェック結果を作成
      const { AssetType } = require('../../../src/types');
      
      const volumeCheck = await VolumeCheckModel.create({
        propertyId: propertyId,
        assetType: AssetType.MANSION,
        buildingArea: 30,
        totalFloorArea: 60,
        buildingHeight: 7,
        consumptionRate: 60,
        floors: 2,
        floorBreakdown: [
          { floor: 1, floorArea: 30, privateArea: 25, commonArea: 5 },
          { floor: 2, floorArea: 30, privateArea: 25, commonArea: 5 }
        ],
        regulationChecks: [
          {
            name: '建蔽率',
            regulationValue: '60%',
            plannedValue: '60%',
            compliant: true
          }
        ]
      });
      
      volumeCheckId = volumeCheck.id;
      tracker.mark('ボリュームチェック作成完了');
    } catch (error) {
      console.error('ボリュームチェック作成エラー:', error);
      throw new Error('テスト用ボリュームチェックの作成に失敗しました');
    }
  }, 10000); // 10秒のタイムアウト
  
  // テスト実行後のクリーンアップ
  afterAll(async () => {
    // 作成したリソースを削除（逆順）
    tracker.setOperation('作成したリソースの削除');

    // 物件削除（これで全ての関連リソースが削除される）
    if (propertyId && propertyId !== '000000000000000000000000') {
      await request(app)
        .delete(`${baseUrl}/properties/${propertyId}`)
        .set('Authorization', authHeader);
    }

    tracker.setOperation('データベース切断');
    await disconnectDB();
    tracker.mark('テスト終了');
    tracker.cleanup();
  }, 10000); // 10秒のタイムアウト

  // シナリオ作成と削除のテスト - モデルを直接使用してAPIをバイパス
  it('シナリオの作成と削除ができる', async () => {
    // 1. シナリオを作成（モデルを直接使用）
    tracker.setOperation('シナリオの作成');
    try {
      const { ScenarioModel, ProfitabilityModel } = require('../../../src/db/models');
      const { AssetType } = require('../../../src/types');

      // シナリオを直接作成
      const scenario = await ScenarioModel.create({
        propertyId,
        volumeCheckId,
        name: 'マイクロテスト用シナリオ',
        params: {
          assetType: AssetType.MANSION,
          rentPerSqm: 3000,
          occupancyRate: 95,
          managementCostRate: 10,
          constructionCostPerSqm: 350000,
          rentalPeriod: 3, // 短期間（3年）
          capRate: 4.0
        }
      });
      
      scenarioId = scenario.id;
      tracker.mark('シナリオ作成完了');
      console.log(`作成されたシナリオID: ${scenarioId}`);
      
      // 2. 収益性試算結果を直接作成
      tracker.setOperation('収益性試算の作成');
      const profitability = await ProfitabilityModel.create({
        propertyId,
        volumeCheckId,
        assetType: AssetType.MANSION,
        parameters: {
          rentPerSqm: 3000,
          occupancyRate: 95,
          managementCostRate: 10,
          constructionCostPerSqm: 350000,
          rentalPeriod: 3,
          capRate: 4.0
        },
        landPrice: 50000000,
        constructionCost: 25000000,
        miscExpenses: 5000000,
        totalInvestment: 80000000,
        annualRentalIncome: 6000000,
        annualOperatingExpenses: 1000000,
        annualMaintenance: 500000,
        annualPropertyTax: 300000,
        annualNOI: 4200000,
        noiYield: 5.25,
        irr: 4.5,
        paybackPeriod: 15,
        npv: 10000000,
        annualFinancials: [
          { year: 1, rentalIncome: 6000000, operatingExpenses: 1800000, netOperatingIncome: 4200000, accumulatedIncome: 4200000, noi: 4200000, cashFlow: 4000000 },
          { year: 2, rentalIncome: 6000000, operatingExpenses: 1800000, netOperatingIncome: 4200000, accumulatedIncome: 8400000, noi: 4200000, cashFlow: 4000000 },
          { year: 3, rentalIncome: 6000000, operatingExpenses: 1800000, netOperatingIncome: 4200000, accumulatedIncome: 12600000, noi: 4200000, cashFlow: 4000000 }
        ]
      });
      
      profitabilityId = profitability.id;
      tracker.mark('収益性試算作成完了');
      console.log(`作成された収益性試算ID: ${profitabilityId}`);
      
      // 3. シナリオに収益性試算結果を関連付ける
      tracker.setOperation('関連付け');
      await ScenarioModel.linkToProfitabilityResult(scenarioId, profitabilityId);
      tracker.mark('関連付け完了');
      
      // 4. 関連付けの確認
      const updatedScenario = await ScenarioModel.findById(scenarioId);
      expect(updatedScenario).not.toBeNull();
      expect(updatedScenario?.profitabilityResultId).toBe(profitabilityId);
      
      // 5. シナリオを削除
      tracker.setOperation('シナリオの削除');
      const deleteSuccess = await ScenarioModel.delete(scenarioId);
      expect(deleteSuccess).toBe(true);
      tracker.mark('シナリオ削除完了');
      
      // 6. 削除の確認
      const deletedScenario = await ScenarioModel.findById(scenarioId);
      expect(deletedScenario).toBeNull();
      tracker.mark('削除確認完了');
      
      // 7. 収益性試算結果が残っていることを確認
      const remainingProfitability = await ProfitabilityModel.findById(profitabilityId);
      expect(remainingProfitability).not.toBeNull();
      expect(remainingProfitability?.scenarioId).toBeUndefined();
      tracker.mark('収益性試算結果確認完了');
      
      // 8. 収益性試算結果を削除
      tracker.setOperation('収益性試算結果の削除');
      const profitDeleteSuccess = await ProfitabilityModel.delete(profitabilityId);
      expect(profitDeleteSuccess).toBe(true);
      tracker.mark('収益性試算結果削除完了');
      
      tracker.mark('テストケース完了');
    } catch (error) {
      console.error('テスト実行エラー:', error);
      throw error;
    }
  }, 20000); // 20秒のタイムアウト
});