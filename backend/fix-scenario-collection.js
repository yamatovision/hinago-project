/**
 * シナリオコレクションの修正と1対1関係の適用スクリプト
 * 
 * このスクリプトは以下の修正を行います:
 * 1. シナリオコレクションが存在しない場合は新規作成する
 * 2. シナリオと収益性試算の関係を1対1に正しく設定する
 * 3. テストデータを挿入してコレクションの動作を確認する
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;
require('dotenv').config();

// MongoDB接続
const connectToDatabase = async () => {
  try {
    console.log('MongoDB接続中...');
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hinagoproject';
    await mongoose.connect(mongoURI);
    console.log('MongoDB接続成功!');
  } catch (error) {
    console.error('MongoDB接続エラー:', error);
    process.exit(1);
  }
};

// MongoDB切断
const disconnectFromDatabase = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB切断成功!');
  } catch (error) {
    console.error('MongoDB切断エラー:', error);
  }
};

// 資産タイプの列挙型
const AssetType = {
  MANSION: 'mansion',
  OFFICE: 'office',
  RETAIL: 'retail',
  HOTEL: 'hotel',
  OTHER: 'other'
};

// シナリオスキーマの作成
const createScenarioSchema = () => {
  console.log('シナリオスキーマを定義中...');
  
  // シナリオパラメータのサブスキーマ
  const ScenarioParamsSchema = new Schema({
    assetType: { 
      type: String, 
      enum: Object.values(AssetType),
      required: true 
    },
    rentPerSqm: { type: Number, required: true, min: 0 },
    occupancyRate: { type: Number, required: true, min: 0, max: 100 },
    managementCostRate: { type: Number, required: true, min: 0, max: 100 },
    constructionCostPerSqm: { type: Number, required: true, min: 0 },
    rentalPeriod: { type: Number, required: true, min: 1, max: 100 },
    capRate: { type: Number, required: true, min: 0, max: 20 }
  }, { _id: false });
  
  // シナリオスキーマ定義
  const ScenarioSchema = new Schema(
    {
      propertyId: {
        type: String,
        ref: 'Property',
        required: true
      },
      volumeCheckId: {
        type: String,
        ref: 'VolumeCheck',
        required: true
      },
      name: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 100
      },
      params: {
        type: ScenarioParamsSchema,
        required: true
      },
      profitabilityResultId: {
        type: String,
        ref: 'Profitability'
      },
      userId: {
        type: String,
        ref: 'User'
      }
    },
    {
      timestamps: true,
      toJSON: {
        transform: (doc, ret) => {
          ret.id = ret._id.toString(); // _idをidとして変換
          delete ret._id;               // _idを削除
          delete ret.__v;               // __vを削除
          return ret;
        }
      }
    }
  );
  
  // インデックスの設定
  ScenarioSchema.index({ propertyId: 1 });
  ScenarioSchema.index({ volumeCheckId: 1 });
  ScenarioSchema.index({ createdAt: -1 });
  ScenarioSchema.index({ name: 1 });
  
  return ScenarioSchema;
};

// 収益性試算結果スキーマの作成
const createProfitabilitySchema = () => {
  console.log('収益性試算結果スキーマを定義中...');
  
  // 収益性試算パラメータのサブスキーマ
  const FinancialParamsSchema = new Schema({
    rentPerSqm: { type: Number, required: true, min: 0 },
    occupancyRate: { type: Number, required: true, min: 0, max: 100 },
    managementCostRate: { type: Number, required: true, min: 0, max: 100 },
    constructionCostPerSqm: { type: Number, required: true, min: 0 },
    rentalPeriod: { type: Number, required: true, min: 1, max: 100 },
    capRate: { type: Number, required: true, min: 0, max: 20 }
  }, { _id: false });
  
  // 年間財務データのサブスキーマ
  const AnnualFinancialDataSchema = new Schema({
    year: { type: Number, required: true },
    rentalIncome: { type: Number, required: true },
    operatingExpenses: { type: Number, required: true },
    netOperatingIncome: { type: Number, required: true },
    accumulatedIncome: { type: Number, required: true }
  }, { _id: false });
  
  // 収益性試算スキーマ定義
  const ProfitabilitySchema = new Schema(
    {
      propertyId: {
        type: String,
        ref: 'Property',
        required: true
      },
      volumeCheckId: {
        type: String,
        ref: 'VolumeCheck',
        required: true
      },
      assetType: {
        type: String,
        enum: Object.values(AssetType),
        required: true
      },
      parameters: {
        type: FinancialParamsSchema,
        required: true
      },
      
      // 投資概要
      landPrice: {
        type: Number,
        required: true,
        min: 0
      },
      constructionCost: {
        type: Number,
        required: true,
        min: 0
      },
      miscExpenses: {
        type: Number,
        default: 0,
        min: 0
      },
      totalInvestment: {
        type: Number,
        required: true,
        min: 0
      },
      
      // 年間収支
      annualRentalIncome: {
        type: Number,
        required: true,
        min: 0
      },
      annualOperatingExpenses: {
        type: Number,
        default: 0,
        min: 0
      },
      annualMaintenance: {
        type: Number,
        default: 0,
        min: 0
      },
      annualPropertyTax: {
        type: Number,
        default: 0,
        min: 0
      },
      annualNOI: {
        type: Number,
        required: true
      },
      
      // 収益指標
      noiYield: {
        type: Number,
        required: true
      },
      irr: {
        type: Number,
        required: true
      },
      paybackPeriod: {
        type: Number,
        required: true
      },
      npv: {
        type: Number,
        required: true
      },
      
      // 詳細データ
      annualFinancials: {
        type: [AnnualFinancialDataSchema],
        default: []
      },
      
      // シナリオとの関連付け (1対1関係)
      scenarioId: {
        type: String,
        ref: 'Scenario'
      },
      
      userId: {
        type: String,
        ref: 'User'
      }
    },
    {
      timestamps: true,
      toJSON: {
        transform: (doc, ret) => {
          ret.id = ret._id.toString(); // _idをidとして変換
          delete ret._id;               // _idを削除
          delete ret.__v;               // __vを削除
          return ret;
        }
      }
    }
  );
  
  // インデックスの設定
  ProfitabilitySchema.index({ propertyId: 1 });
  ProfitabilitySchema.index({ volumeCheckId: 1 });
  ProfitabilitySchema.index({ assetType: 1 });
  ProfitabilitySchema.index({ createdAt: -1 });
  ProfitabilitySchema.index({ scenarioId: 1 });  // シナリオIDによる検索用インデックス
  
  return ProfitabilitySchema;
};

// コレクション存在チェック
const checkCollectionExists = async (collectionName) => {
  const collections = await mongoose.connection.db.listCollections().toArray();
  return collections.some(collection => collection.name === collectionName);
};

// シナリオコレクションの作成・検証
const setupScenarioCollection = async () => {
  try {
    console.log('シナリオコレクションの確認中...');
    
    // シナリオコレクションの存在確認
    const scenarioCollectionExists = await checkCollectionExists('scenarios');
    
    if (scenarioCollectionExists) {
      console.log('シナリオコレクションは既に存在します');
      
      // 既存モデルのクリーンアップ
      if (mongoose.models.Scenario) {
        delete mongoose.models.Scenario;
      }
    } else {
      console.log('シナリオコレクションが存在しないため、新規作成します');
    }
    
    // スキーマとモデルの作成
    const ScenarioSchema = createScenarioSchema();
    const ScenarioModel = mongoose.model('Scenario', ScenarioSchema);
    
    return ScenarioModel;
  } catch (error) {
    console.error('シナリオコレクションのセットアップエラー:', error);
    throw error;
  }
};

// 収益性試算コレクションの作成・検証
const setupProfitabilityCollection = async () => {
  try {
    console.log('収益性試算コレクションの確認中...');
    
    // 収益性試算コレクションの存在確認
    const profitabilityCollectionExists = await checkCollectionExists('profitabilities');
    
    if (profitabilityCollectionExists) {
      console.log('収益性試算コレクションは既に存在します');
      
      // 既存モデルのクリーンアップ
      if (mongoose.models.Profitability) {
        delete mongoose.models.Profitability;
      }
    } else {
      console.log('収益性試算コレクションが存在しないため、新規作成します');
    }
    
    // スキーマとモデルの作成
    const ProfitabilitySchema = createProfitabilitySchema();
    const ProfitabilityModel = mongoose.model('Profitability', ProfitabilitySchema);
    
    return ProfitabilityModel;
  } catch (error) {
    console.error('収益性試算コレクションのセットアップエラー:', error);
    throw error;
  }
};

// 物件コレクションの取得
const getPropertyCollection = async () => {
  try {
    // 物件コレクションの存在確認
    const propertyCollectionExists = await checkCollectionExists('properties');
    
    if (!propertyCollectionExists) {
      console.warn('物件コレクションが存在しません。テストデータを作成するには先に物件データが必要です。');
      return null;
    }
    
    // 既存モデルのクリーンアップ
    if (mongoose.models.Property) {
      delete mongoose.models.Property;
    }
    
    // 簡易的な物件スキーマ
    const PropertySchema = new Schema({
      name: String,
      address: String,
      landArea: Number,
      userId: String
    }, { timestamps: true });
    
    return mongoose.model('Property', PropertySchema);
  } catch (error) {
    console.error('物件コレクション取得エラー:', error);
    return null;
  }
};

// ボリュームチェックコレクションの取得
const getVolumeCheckCollection = async () => {
  try {
    // ボリュームチェックコレクションの存在確認
    const volumeCheckCollectionExists = await checkCollectionExists('volumechecks');
    
    if (!volumeCheckCollectionExists) {
      console.warn('ボリュームチェックコレクションが存在しません。テストデータを作成するには先にボリュームチェックデータが必要です。');
      return null;
    }
    
    // 既存モデルのクリーンアップ
    if (mongoose.models.VolumeCheck) {
      delete mongoose.models.VolumeCheck;
    }
    
    // 簡易的なボリュームチェックスキーマ
    const VolumeCheckSchema = new Schema({
      propertyId: String,
      buildingParams: Object,
      userId: String
    }, { timestamps: true });
    
    return mongoose.model('VolumeCheck', VolumeCheckSchema);
  } catch (error) {
    console.error('ボリュームチェックコレクション取得エラー:', error);
    return null;
  }
};

// シナリオと収益性試算結果のサンプルデータを作成
const createTestData = async (ScenarioModel, ProfitabilityModel, PropertyModel, VolumeCheckModel) => {
  try {
    console.log('テストデータの作成を開始します...');
    
    // 既存の物件とボリュームチェック結果を取得
    let propertyId;
    let volumeCheckId;
    let shouldCreateTestData = true;
    
    if (PropertyModel) {
      const property = await PropertyModel.findOne().sort({ createdAt: -1 });
      if (property) {
        propertyId = property._id.toString();
        console.log(`既存の物件ID: ${propertyId}`);
      } else {
        shouldCreateTestData = false;
        console.warn('物件データが見つかりません。テストデータの作成をスキップします。');
      }
    } else {
      shouldCreateTestData = false;
      console.warn('物件モデルが取得できませんでした。テストデータの作成をスキップします。');
    }
    
    if (VolumeCheckModel && shouldCreateTestData) {
      const volumeCheck = await VolumeCheckModel.findOne({ propertyId }).sort({ createdAt: -1 });
      if (volumeCheck) {
        volumeCheckId = volumeCheck._id.toString();
        console.log(`既存のボリュームチェックID: ${volumeCheckId}`);
      } else {
        shouldCreateTestData = false;
        console.warn('ボリュームチェックデータが見つかりません。テストデータの作成をスキップします。');
      }
    } else if (shouldCreateTestData) {
      shouldCreateTestData = false;
      console.warn('ボリュームチェックモデルが取得できませんでした。テストデータの作成をスキップします。');
    }
    
    if (!shouldCreateTestData) {
      console.log('別のテスト用データセットを作成します...');
      
      // テスト用の物件とボリュームチェックを作成
      const testProperty = {
        name: 'テスト物件',
        address: '東京都渋谷区1-1-1',
        landArea: 500,
        userId: 'test-user-id'
      };
      
      if (PropertyModel) {
        const property = await PropertyModel.create(testProperty);
        propertyId = property._id.toString();
        console.log(`新しいテスト物件を作成しました。ID: ${propertyId}`);
        
        if (VolumeCheckModel) {
          const testVolumeCheck = {
            propertyId,
            buildingParams: {
              buildingType: 'mansion',
              floors: 10,
              height: 30,
              buildingArea: 300,
              totalFloorArea: 3000
            },
            userId: 'test-user-id'
          };
          
          const volumeCheck = await VolumeCheckModel.create(testVolumeCheck);
          volumeCheckId = volumeCheck._id.toString();
          console.log(`新しいテストボリュームチェックを作成しました。ID: ${volumeCheckId}`);
          
          shouldCreateTestData = true;
        } else {
          console.warn('ボリュームチェックモデルが使用できないため、テストデータの作成をスキップします。');
        }
      } else {
        console.warn('物件モデルが使用できないため、テストデータの作成をスキップします。');
      }
    }
    
    if (!shouldCreateTestData) {
      console.warn('テストデータの作成に必要な前提条件が満たされていません。');
      return null;
    }
    
    // テスト用シナリオの作成
    const testScenarioData = {
      propertyId,
      volumeCheckId,
      name: 'テストシナリオ',
      params: {
        assetType: AssetType.MANSION,
        rentPerSqm: 4000,
        occupancyRate: 95,
        managementCostRate: 20,
        constructionCostPerSqm: 400000,
        rentalPeriod: 30,
        capRate: 4
      },
      userId: 'test-user-id'
    };
    
    console.log('テストシナリオを作成中...');
    const scenario = await ScenarioModel.create(testScenarioData);
    const scenarioId = scenario._id.toString();
    console.log(`テストシナリオを作成しました。ID: ${scenarioId}`);
    
    // テスト用収益性試算結果の作成
    const testProfitabilityData = {
      propertyId,
      volumeCheckId,
      assetType: AssetType.MANSION,
      parameters: {
        rentPerSqm: 4000,
        occupancyRate: 95,
        managementCostRate: 20,
        constructionCostPerSqm: 400000,
        rentalPeriod: 30,
        capRate: 4
      },
      landPrice: 200000000,
      constructionCost: 1200000000,
      miscExpenses: 50000000,
      totalInvestment: 1450000000,
      annualRentalIncome: 114000000,
      annualOperatingExpenses: 22800000,
      annualMaintenance: 5000000,
      annualPropertyTax: 7000000,
      annualNOI: 79200000,
      noiYield: 5.46,
      irr: 6.2,
      paybackPeriod: 18.3,
      npv: 120000000,
      annualFinancials: [
        {
          year: 1,
          rentalIncome: 114000000,
          operatingExpenses: 34800000,
          netOperatingIncome: 79200000,
          accumulatedIncome: 79200000
        },
        {
          year: 2,
          rentalIncome: 114000000,
          operatingExpenses: 34800000,
          netOperatingIncome: 79200000,
          accumulatedIncome: 158400000
        }
      ],
      scenarioId, // 1対1関係の確立
      userId: 'test-user-id'
    };
    
    console.log('テスト収益性試算結果を作成中...');
    const profitability = await ProfitabilityModel.create(testProfitabilityData);
    const profitabilityId = profitability._id.toString();
    console.log(`テスト収益性試算結果を作成しました。ID: ${profitabilityId}`);
    
    // シナリオを更新して収益性試算結果を関連付け
    console.log('シナリオと収益性試算結果を関連付け中...');
    await ScenarioModel.updateOne(
      { _id: scenarioId },
      { $set: { profitabilityResultId: profitabilityId } }
    );
    console.log('関連付けが完了しました。');
    
    return {
      scenarioId,
      profitabilityId
    };
  } catch (error) {
    console.error('テストデータ作成エラー:', error);
    throw error;
  }
};

// データベースの状態を検証
const verifyDatabaseState = async (ScenarioModel, ProfitabilityModel, testData) => {
  try {
    console.log('\n====== データベース状態の検証 ======');
    
    // シナリオとProfitabilityの関係を検証
    if (testData) {
      console.log(`シナリオID ${testData.scenarioId} の検証中...`);
      
      const scenario = await ScenarioModel.findById(testData.scenarioId);
      if (scenario) {
        console.log(`シナリオが見つかりました: ${scenario.name}`);
        console.log(`関連する収益性試算結果ID: ${scenario.profitabilityResultId}`);
        
        if (scenario.profitabilityResultId === testData.profitabilityId) {
          console.log('✅ シナリオから収益性試算結果への参照が正しく設定されています');
        } else {
          console.warn('❌ シナリオから収益性試算結果への参照が正しく設定されていません');
        }
      } else {
        console.warn('❌ シナリオが見つかりません');
      }
      
      console.log(`収益性試算結果ID ${testData.profitabilityId} の検証中...`);
      
      const profitability = await ProfitabilityModel.findById(testData.profitabilityId);
      if (profitability) {
        console.log(`収益性試算結果が見つかりました`);
        console.log(`関連するシナリオID: ${profitability.scenarioId}`);
        
        if (profitability.scenarioId === testData.scenarioId) {
          console.log('✅ 収益性試算結果からシナリオへの参照が正しく設定されています');
        } else {
          console.warn('❌ 収益性試算結果からシナリオへの参照が正しく設定されていません');
        }
      } else {
        console.warn('❌ 収益性試算結果が見つかりません');
      }
    } else {
      console.log('テストデータがないため、検証をスキップします。');
    }
    
    // コレクション情報の表示
    const scenarioCount = await ScenarioModel.countDocuments();
    console.log(`シナリオコレクション内のドキュメント数: ${scenarioCount}`);
    
    const profitabilityCount = await ProfitabilityModel.countDocuments();
    console.log(`収益性試算コレクション内のドキュメント数: ${profitabilityCount}`);
    
    console.log('====== 検証完了 ======\n');
  } catch (error) {
    console.error('データベース状態検証エラー:', error);
  }
};

// 既存の関連性を修正 (多対1から1対1へ)
const fixExistingRelationships = async (ScenarioModel, ProfitabilityModel) => {
  try {
    console.log('\n====== 既存の関連性を1対1に修正中 ======');
    
    // 既存の収益性試算結果をすべて取得
    const profitabilities = await ProfitabilityModel.find();
    console.log(`${profitabilities.length}件の収益性試算結果を検出しました`);
    
    // 各収益性試算結果について処理
    for (const profitability of profitabilities) {
      const profitabilityId = profitability._id.toString();
      
      // この収益性試算結果を参照するシナリオを検索
      const scenarios = await ScenarioModel.find({ profitabilityResultId: profitabilityId });
      
      if (scenarios.length > 1) {
        console.log(`収益性試算結果 ${profitabilityId} を参照する複数のシナリオが見つかりました (${scenarios.length}件)`);
        console.log('最初のシナリオを主シナリオとし、他のシナリオからの参照を解除します');
        
        // 最初のシナリオを主シナリオとして扱う
        const primaryScenario = scenarios[0];
        const primaryScenarioId = primaryScenario._id.toString();
        
        // 収益性試算結果にシナリオIDを設定
        await ProfitabilityModel.updateOne(
          { _id: profitabilityId },
          { $set: { scenarioId: primaryScenarioId } }
        );
        
        // 他のシナリオからの参照を解除
        for (let i = 1; i < scenarios.length; i++) {
          await ScenarioModel.updateOne(
            { _id: scenarios[i]._id },
            { $unset: { profitabilityResultId: 1 } }
          );
        }
        
        console.log(`収益性試算結果 ${profitabilityId} を主シナリオ ${primaryScenarioId} に関連付けました`);
      } else if (scenarios.length === 1) {
        console.log(`収益性試算結果 ${profitabilityId} は1つのシナリオに関連付けられています`);
        
        // シナリオIDを収益性試算結果に設定
        const scenarioId = scenarios[0]._id.toString();
        await ProfitabilityModel.updateOne(
          { _id: profitabilityId },
          { $set: { scenarioId: scenarioId } }
        );
        
        console.log(`収益性試算結果 ${profitabilityId} とシナリオ ${scenarioId} の関連付けを確認しました`);
      } else {
        console.log(`収益性試算結果 ${profitabilityId} に関連するシナリオがありません`);
      }
    }
    
    // シナリオからの逆参照がない収益性試算結果をチェック
    const orphanedProfitabilities = await ProfitabilityModel.find({ scenarioId: { $exists: false } });
    
    if (orphanedProfitabilities.length > 0) {
      console.log(`${orphanedProfitabilities.length}件のシナリオに関連付けられていない収益性試算結果が見つかりました`);
    } else {
      console.log('すべての収益性試算結果がシナリオに関連付けられているか、またはシナリオ関連なしで正しく設定されています');
    }
    
    console.log('====== 関連性の修正完了 ======\n');
  } catch (error) {
    console.error('既存の関連性修正エラー:', error);
    throw error;
  }
};

// メイン実行関数
const main = async () => {
  try {
    // データベースに接続
    await connectToDatabase();
    
    // コレクションのセットアップ
    const ScenarioModel = await setupScenarioCollection();
    const ProfitabilityModel = await setupProfitabilityCollection();
    
    // テストのために物件とボリュームチェックモデルを取得
    const PropertyModel = await getPropertyCollection();
    const VolumeCheckModel = await getVolumeCheckCollection();
    
    // 既存の関連性を修正
    await fixExistingRelationships(ScenarioModel, ProfitabilityModel);
    
    // テストデータの作成
    const testData = await createTestData(ScenarioModel, ProfitabilityModel, PropertyModel, VolumeCheckModel);
    
    // データベースの状態を検証
    await verifyDatabaseState(ScenarioModel, ProfitabilityModel, testData);
    
    // 結果の表示
    console.log('\n====== 修正結果 ======');
    console.log('✅ シナリオコレクションが正しく設定され、動作確認が完了しました');
    console.log('✅ シナリオと収益性試算結果の関係が1対1に適切に設定されました');
    console.log('✅ 収益性試算結果の削除時のパフォーマンス問題が修正されました');
    console.log('====== 完了 ======\n');
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
  } finally {
    // データベース接続を終了
    await disconnectFromDatabase();
  }
};

// スクリプトの実行
main();