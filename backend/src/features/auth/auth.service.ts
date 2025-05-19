/**
 * 認証サービス
 * 認証関連のビジネスロジックを実装
 */
import { AppError } from '../../common/middlewares';
import { logger } from '../../common/utils';
import { UserModel, RefreshTokenModel } from '../../db/models';
import { LoginRequest, RefreshTokenRequest, AuthUser } from '../../types';
import { generateAccessToken, calculateRefreshTokenExpiration, extractAuthUser } from './auth.utils';

/**
 * ユーザー認証を行う
 * @param loginData ログインリクエストデータ
 * @returns ユーザー情報、アクセストークン、リフレッシュトークン
 */
export const authenticateUser = async (loginData: LoginRequest) => {
  const { email, password, rememberMe } = loginData;

  // メールアドレスでユーザーを検索
  const user = await UserModel.findByEmail(email);
  if (!user) {
    logger.debug('ログイン失敗: ユーザーが見つかりません', { email });
    throw new AppError('メールアドレスまたはパスワードが間違っています', 401, 'INVALID_CREDENTIALS');
  }

  // パスワードを検証
  const isPasswordValid = await UserModel.verifyPassword(password, user.password);
  if (!isPasswordValid) {
    logger.debug('ログイン失敗: パスワードが間違っています', { email });
    throw new AppError('メールアドレスまたはパスワードが間違っています', 401, 'INVALID_CREDENTIALS');
  }

  // 認証に使用するユーザー情報を抽出（パスワードなどの機密情報を除外）
  const authUser = extractAuthUser(user);

  // アクセストークンを生成
  const accessToken = generateAccessToken(authUser);

  // リフレッシュトークンの有効期限を計算
  const refreshTokenExpiration = calculateRefreshTokenExpiration(rememberMe);

  // 既存のリフレッシュトークンを削除（オプショナル：セキュリティ向上のため）
  await RefreshTokenModel.deleteAllForUser(user.id);

  // 新しいリフレッシュトークンを生成
  const refreshTokenObj = await RefreshTokenModel.create(user.id, refreshTokenExpiration);

  return {
    user: authUser,
    accessToken,
    refreshToken: refreshTokenObj.token,
  };
};

/**
 * リフレッシュトークンを使用して新しいアクセストークンを生成
 * @param refreshData リフレッシュリクエストデータ
 * @returns 新しいアクセストークン
 */
export const refreshAccessToken = async (refreshData: RefreshTokenRequest) => {
  const { refreshToken } = refreshData;

  // リフレッシュトークンを検索
  const tokenObj = await RefreshTokenModel.findByToken(refreshToken);
  if (!tokenObj) {
    logger.debug('リフレッシュトークンが無効です');
    throw new AppError('リフレッシュトークンが無効です', 401, 'INVALID_TOKEN');
  }

  // トークンの有効期限をチェック
  if (new Date() > tokenObj.expiresAt) {
    // 期限切れのトークンを削除
    await RefreshTokenModel.delete(refreshToken);
    logger.debug('リフレッシュトークンの有効期限が切れています');
    throw new AppError('リフレッシュトークンの有効期限が切れています', 401, 'EXPIRED_TOKEN');
  }

  // ユーザーを検索
  const user = await UserModel.findById(tokenObj.userId);
  if (!user) {
    await RefreshTokenModel.delete(refreshToken);
    logger.debug('リフレッシュトークンに関連するユーザーが見つかりません');
    throw new AppError('無効なトークンです', 401, 'INVALID_TOKEN');
  }

  // 認証ユーザー情報を抽出
  const authUser = extractAuthUser(user);

  // 新しいアクセストークンを生成
  const accessToken = generateAccessToken(authUser);

  return { accessToken };
};

/**
 * ユーザーをログアウトする（リフレッシュトークンを無効化）
 * @param userId ユーザーID
 * @param refreshToken リフレッシュトークン
 */
export const logoutUser = async (userId: string, refreshToken?: string) => {
  try {
    if (refreshToken) {
      // 特定のリフレッシュトークンのみを無効化
      await RefreshTokenModel.delete(refreshToken);
    } else {
      // ユーザーの全てのリフレッシュトークンを無効化
      await RefreshTokenModel.deleteAllForUser(userId);
    }
    return { success: true };
  } catch (error) {
    logger.error('ログアウト処理エラー', { error, userId });
    throw new AppError('ログアウト処理中にエラーが発生しました', 500);
  }
};

/**
 * ユーザーIDからユーザー情報を取得
 * @param userId ユーザーID
 * @returns 認証ユーザー情報
 */
export const getUserById = async (userId: string): Promise<AuthUser> => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError('ユーザーが見つかりません', 404, 'USER_NOT_FOUND');
  }
  return extractAuthUser(user);
};