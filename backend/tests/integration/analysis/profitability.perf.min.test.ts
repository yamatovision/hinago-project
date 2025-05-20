/**
 * 収益性試算の最小限パフォーマンステスト
 * 特にボトルネックの特定と直接データベースを使用した簡略テスト
 */
import mongoose from 'mongoose';
import { performance } from 'perf_hooks';
import { connectDB, disconnectDB } from '../../utils/db-test-helper';
import { 
  ProfitabilityModel, 
  ScenarioModel 
} from '../../../src/db/models';
import { AssetType } from '../../../src/types';

// パフォーマンス測定用ユーティリティ
async function measurePerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`[PERF] ${name} failed after ${duration.toFixed(2)}ms: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

// テスト実行前のセットアップ
beforeAll(async () => {
  await connectDB();
});

// テスト実行後のクリーンアップ
afterAll(async () => {
  await disconnectDB();
});

describe('収益性試算削除パフォーマンステスト', () => {
  // 直接データベースを使用した最小限テスト
  it('データベース直接操作での収益性試算削除処理の時間計測', async () => {
    // テスト用の物件ID、ボリュームチェックIDを生成
    const propertyId = new mongoose.Types.ObjectId().toString();
    const volumeCheckId = new mongoose.Types.ObjectId().toString();
    
    // シナリオを作成
    console.log('直接シナリオ作成中...');
    const scenario = await ScenarioModel.create({
      propertyId,
      volumeCheckId,
      name: `パフォーマンステストシナリオ`,
      params: {
        assetType: AssetType.MANSION,
        rentPerSqm: 3000,             // 賃料単価（円/m²）
        occupancyRate: 95,            // 稼働率（%）
        managementCostRate: 10,       // 管理コスト率（%）
        constructionCostPerSqm: 350000, // 建設単価（円/m²）
        rentalPeriod: 30,             // 運用期間（年）
        capRate: 4.0                  // 還元利回り（%）
      }
    });
    console.log(`シナリオ作成完了: ${scenario.id}`);
    
    // 収益性試算結果を作成
    console.log('直接収益性試算結果作成中...');
    const profitability = await ProfitabilityModel.create({
      propertyId,
      volumeCheckId,
      assetType: AssetType.MANSION,
      parameters: {
        rentPerSqm: 3000,
        occupancyRate: 95,
        managementCostRate: 10,
        constructionCostPerSqm: 350000,
        rentalPeriod: 30,
        capRate: 4.0
      },
      scenarioId: scenario.id,
      landPrice: 200000000,
      constructionCost: 150000000,
      miscExpenses: 30000000,
      totalInvestment: 380000000,
      annualRentalIncome: 50000000,
      annualOperatingExpenses: 5000000,
      annualMaintenance: 3000000,
      annualPropertyTax: 2000000,
      annualNOI: 40000000,
      noiYield: 10.5,
      irr: 7.2,
      paybackPeriod: 9.5,
      npv: 120000000,
      annualFinancials: [
        {
          year: 1,
          rentalIncome: 50000000,
          operatingExpenses: 10000000,
          netOperatingIncome: 40000000,
          accumulatedIncome: 40000000
        },
        {
          year: 2,
          rentalIncome: 51000000,
          operatingExpenses: 10200000,
          netOperatingIncome: 40800000,
          accumulatedIncome: 80800000
        }
      ]
    });
    console.log(`収益性試算結果作成完了: ${profitability.id}`);
    
    // シナリオと収益性試算結果を関連付け
    console.log('シナリオに収益性試算IDを関連付け中...');
    await ScenarioModel.update(scenario.id, { profitabilityResultId: profitability.id });
    console.log('関連付け完了');
    
    // 削除処理の実行時間を計測
    console.log('収益性試算結果の削除処理を実行中...');
    await measurePerformance('収益性試算結果削除（データベース直接操作）', async () => {
      // 1. 関連するシナリオの参照解除
      if (profitability.scenarioId) {
        await ScenarioModel.update(
          profitability.scenarioId,
          { profitabilityResultId: undefined }
        );
      }
      
      // 2. 収益性試算結果の削除
      await ProfitabilityModel.delete(profitability.id);
    });
    
    // 削除確認
    console.log('削除確認中...');
    const deletedProfitability = await ProfitabilityModel.findById(profitability.id);
    expect(deletedProfitability).toBeNull();
    
    // シナリオの参照解除確認
    console.log('シナリオ参照解除確認中...');
    const updatedScenario = await ScenarioModel.findById(scenario.id);
    expect(updatedScenario?.profitabilityResultId).toBeUndefined();
    
    console.log('テスト完了');
  }, 10000); // 10秒のタイムアウトを設定
});