/**
 * テスト用データベースヘルパー
 */
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User, Organization, RefreshToken } from '../../src/db/models';

// インメモリMongoDBサーバー
let mongoServer: MongoMemoryServer;

/**
 * テスト用DBの接続
 */
export const connectTestDB = async (): Promise<void> => {
  // インメモリMongoDBを起動
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  // Mongooseの接続
  await mongoose.connect(uri);
};

/**
 * テスト用DBの切断
 */
export const disconnectTestDB = async (): Promise<void> => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
};

/**
 * テスト用DBのクリア
 */
export const clearTestDB = async (): Promise<void> => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

/**
 * テスト用の組織データを作成
 */
export const createTestOrganization = async (name = 'テスト組織'): Promise<any> => {
  return await Organization.create({
    name,
    subscription: 'free',
  });
};

/**
 * テスト用のユーザーデータを作成
 */
export const createTestUser = async (
  email = 'test@example.com',
  password = 'password123',
  name = 'テストユーザー',
  organizationId?: string
): Promise<any> => {
  // 組織IDがない場合は新規作成
  if (!organizationId) {
    const organization = await createTestOrganization();
    organizationId = organization._id;
  }
  
  return await User.create({
    email,
    password,
    name,
    role: 'user',
    organizationId,
  });
};

/**
 * テスト用のリフレッシュトークンを作成
 */
export const createTestRefreshToken = async (
  userId: string,
  token = 'test-refresh-token',
  expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
): Promise<any> => {
  return await RefreshToken.create({
    userId,
    token,
    expiresAt,
    isRevoked: false,
  });
};