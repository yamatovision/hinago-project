/**
 * ユーザーモデルのユニットテスト
 */
import { UserModel } from '../../../src/db/models';
import { UserRole } from '../../../src/types';
import { authConfig } from '../../../src/config';
import { setupTestDatabase, cleanupTestDatabase } from '../../utils/db-test-helper';
import mongoose from 'mongoose';

describe('UserModel', () => {
  const testUserData = {
    email: 'test@example.com',
    name: 'Test User',
    password: 'securepassword',
    role: UserRole.USER,
  };
  
  let testUserId: string;
  
  // テスト前にデータベース接続をセットアップ
  beforeAll(async () => {
    await setupTestDatabase();
  });
  
  // テスト後にデータベース接続をクリーンアップ
  afterAll(async () => {
    await cleanupTestDatabase();
  });
  
  // パスワードハッシュ化のテスト
  describe('hashPassword', () => {
    it('パスワードをハッシュ化できる', async () => {
      const plainPassword = 'password123';
      const hashedPassword = await UserModel.hashPassword(plainPassword);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toEqual(plainPassword);
      expect(hashedPassword.length).toBeGreaterThan(0);
    });
    
    it('異なるパスワードは異なるハッシュになる', async () => {
      const password1 = 'password123';
      const password2 = 'password456';
      
      const hash1 = await UserModel.hashPassword(password1);
      const hash2 = await UserModel.hashPassword(password2);
      
      expect(hash1).not.toEqual(hash2);
    });
  });
  
  // パスワード検証のテスト
  describe('verifyPassword', () => {
    it('正しいパスワードを検証できる', async () => {
      const plainPassword = 'password123';
      const hashedPassword = await UserModel.hashPassword(plainPassword);
      
      const isValid = await UserModel.verifyPassword(plainPassword, hashedPassword);
      expect(isValid).toBe(true);
    });
    
    it('間違ったパスワードを検証できる', async () => {
      const plainPassword = 'password123';
      const wrongPassword = 'wrongpassword';
      const hashedPassword = await UserModel.hashPassword(plainPassword);
      
      const isValid = await UserModel.verifyPassword(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });
  });
  
  // ユーザー作成のテスト
  describe('create', () => {
    it('新しいユーザーを作成できる', async () => {
      const newUser = await UserModel.create(testUserData);
      
      // IDが生成されたことを確認
      expect(newUser.id).toBeDefined();
      testUserId = newUser.id;
      
      // その他のフィールドが正しく設定されていることを確認
      expect(newUser.email).toBe(testUserData.email);
      expect(newUser.name).toBe(testUserData.name);
      expect(newUser.role).toBe(testUserData.role);
      
      // パスワードがハッシュ化されていることを確認
      expect(newUser.password).not.toBe(testUserData.password);
      
      // タイムスタンプが設定されていることを確認
      expect(newUser.createdAt).toBeInstanceOf(Date);
      expect(newUser.updatedAt).toBeInstanceOf(Date);
    });
  });
  
  // ユーザー検索のテスト
  describe('findByEmail / findById', () => {
    it('メールアドレスでユーザーを検索できる', async () => {
      const user = await UserModel.findByEmail(testUserData.email);
      
      expect(user).toBeDefined();
      expect(user?.id).toBe(testUserId);
      expect(user?.email).toBe(testUserData.email);
    });
    
    it('IDでユーザーを検索できる', async () => {
      const user = await UserModel.findById(testUserId);
      
      expect(user).toBeDefined();
      expect(user?.id).toBe(testUserId);
      expect(user?.email).toBe(testUserData.email);
    });
    
    it('存在しないメールアドレスで検索するとnullを返す', async () => {
      const user = await UserModel.findByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });
    
    it('存在しないIDで検索するとnullを返す', async () => {
      // MongoDBの有効なObjectIDを使用
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const user = await UserModel.findById(nonExistentId);
      expect(user).toBeNull();
    });
    
    it('管理者ユーザーを検索できる', async () => {
      const adminUser = await UserModel.findByEmail(authConfig.auth.adminUser.email);
      
      expect(adminUser).toBeDefined();
      expect(adminUser?.email).toBe(authConfig.auth.adminUser.email);
      expect(adminUser?.role).toBe(UserRole.ADMIN);
    });
  });
  
  // ユーザー更新のテスト
  describe('update', () => {
    it('既存のユーザー情報を更新できる', async () => {
      const updatedData = {
        name: 'Updated Name',
      };
      
      const updatedUser = await UserModel.update(testUserId, updatedData);
      
      expect(updatedUser).toBeDefined();
      expect(updatedUser?.id).toBe(testUserId);
      expect(updatedUser?.name).toBe(updatedData.name);
      expect(updatedUser?.email).toBe(testUserData.email); // 変更していないフィールドは保持される
    });
    
    it('存在しないユーザーを更新するとnullを返す', async () => {
      // MongoDBの有効なObjectIDを使用
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const updatedUser = await UserModel.update(nonExistentId, { name: 'New Name' });
      expect(updatedUser).toBeNull();
    });
  });
  
  // ユーザー削除のテスト
  describe('delete', () => {
    it('既存のユーザーを削除できる', async () => {
      const result = await UserModel.delete(testUserId);
      expect(result).toBe(true);
      
      // 削除されたことを確認
      const deletedUser = await UserModel.findById(testUserId);
      expect(deletedUser).toBeNull();
    });
    
    it('存在しないユーザーを削除するとfalseを返す', async () => {
      // MongoDBの有効なObjectIDを使用
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await UserModel.delete(nonExistentId);
      expect(result).toBe(false);
    });
  });
});