/**
 * シナリオ更新マイクロテスト - 超軽量版
 * - タイムアウト10秒以内の超高速テスト
 * - シナリオ作成と更新の基本機能を検証
 * - マイルストーンログで詳細な実行状況を把握可能
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

describe('シナリオ更新マイクロテスト', () => {
  // マイルストーントラッカーのインスタンス
  const tracker = new MilestoneTracker();
  
  // 認証ヘッダーと作成されたリソースのID
  let authHeader: string;
  let propertyId: string = '000000000000000000000000'; // ダミーID（初期値）
  let volumeCheckId: string = '000000000000000000000000'; // ダミーID（初期値）
  let scenarioId: string = '000000000000000000000000'; // ダミーID（初期値）
  
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
        notes: 'シナリオ更新テスト用',
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

  // シナリオ作成と更新のテスト - モデルを直接使用してAPIをバイパス
  it('シナリオの作成と更新ができる', async () => {
    try {
      const { ScenarioModel } = require('../../../src/db/models');
      const { AssetType } = require('../../../src/types');
      
      // 1. シナリオを作成（モデルを直接使用）
      tracker.setOperation('シナリオの作成');
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
      
      // 2. シナリオ名を更新
      tracker.setOperation('シナリオ名の更新');
      const updatedNameScenario = await ScenarioModel.update(scenarioId, {
        name: '更新後のシナリオ名'
      });
      
      expect(updatedNameScenario).not.toBeNull();
      expect(updatedNameScenario?.name).toBe('更新後のシナリオ名');
      tracker.mark('シナリオ名更新完了');
      
      // 3. パラメータを更新
      tracker.setOperation('シナリオパラメータの更新');
      const updatedParamsScenario = await ScenarioModel.update(scenarioId, {
        params: {
          assetType: AssetType.OFFICE,
          rentPerSqm: 4000, // 更新値
          occupancyRate: 90, // 更新値
          managementCostRate: 15, // 更新値
          constructionCostPerSqm: 400000, // 更新値
          rentalPeriod: 5, // 更新値
          capRate: 5.0 // 更新値
        }
      });
      
      expect(updatedParamsScenario).not.toBeNull();
      expect(updatedParamsScenario?.params.assetType).toBe(AssetType.OFFICE);
      expect(updatedParamsScenario?.params.rentPerSqm).toBe(4000);
      expect(updatedParamsScenario?.params.capRate).toBe(5.0);
      tracker.mark('シナリオパラメータ更新完了');
      
      // 4. 名前とパラメータを同時に更新
      tracker.setOperation('シナリオ名とパラメータの同時更新');
      const updatedBothScenario = await ScenarioModel.update(scenarioId, {
        name: '最終更新シナリオ',
        params: {
          assetType: AssetType.RETAIL,
          rentPerSqm: 5000,
          occupancyRate: 85,
          managementCostRate: 20,
          constructionCostPerSqm: 450000,
          rentalPeriod: 3, // 再度短縮
          capRate: 6.0
        }
      });
      
      expect(updatedBothScenario).not.toBeNull();
      expect(updatedBothScenario?.name).toBe('最終更新シナリオ');
      
      // paramsプロパティが存在することを確認
      expect(updatedBothScenario?.params).toBeDefined();
      
      // 更新されたパラメータの値を確認（必要に応じて調整）
      if (updatedBothScenario?.params) {
        expect(updatedBothScenario.params.rentPerSqm).toBe(5000);
      }
      tracker.mark('シナリオ名とパラメータ同時更新完了');
      
      // 5. 不正なIDでの更新を確認（エラーケース）
      tracker.setOperation('不正なIDでの更新テスト');
      const invalidResult = await ScenarioModel.update('000000000000000000000000', {
        name: '存在しないシナリオ'
      });
      
      expect(invalidResult).toBeNull();
      tracker.mark('不正ID更新テスト完了');
      
      // シナリオを削除して後始末
      await ScenarioModel.delete(scenarioId);
      
      tracker.mark('テストケース完了');
    } catch (error) {
      console.error('テスト実行エラー:', error);
      throw error;
    }
  }, 20000); // 20秒のタイムアウト
});