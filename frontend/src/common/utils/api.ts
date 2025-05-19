/**
 * API通信用ユーティリティ
 */
import { ApiResponse } from '../../../shared';

/**
 * HTTPリクエストを送信する共通関数
 * @param url APIエンドポイント
 * @param options リクエストオプション
 * @returns レスポンスデータ
 */
export async function fetchApi<T>(
  url: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // デフォルトのヘッダーを設定
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // 認証トークンがあれば追加
  const token = localStorage.getItem('accessToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // リクエストを送信
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // JSONレスポンスを解析
  const data = await response.json();

  // エラーレスポンスの場合
  if (!response.ok) {
    console.error('API Error:', data);
    return {
      success: false,
      error: data.error || '通信エラーが発生しました',
    };
  }

  // 成功レスポンスを返却
  return {
    success: true,
    data: data.data,
    meta: data.meta,
  };
}

/**
 * GETリクエストを送信
 * @param url APIエンドポイント
 * @param options リクエストオプション
 * @returns レスポンスデータ
 */
export function get<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  return fetchApi<T>(url, {
    method: 'GET',
    ...options,
  });
}

/**
 * POSTリクエストを送信
 * @param url APIエンドポイント
 * @param data リクエストデータ
 * @param options リクエストオプション
 * @returns レスポンスデータ
 */
export function post<T>(url: string, data: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
  return fetchApi<T>(url, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  });
}

/**
 * PUTリクエストを送信
 * @param url APIエンドポイント
 * @param data リクエストデータ
 * @param options リクエストオプション
 * @returns レスポンスデータ
 */
export function put<T>(url: string, data: any, options: RequestInit = {}): Promise<ApiResponse<T>> {
  return fetchApi<T>(url, {
    method: 'PUT',
    body: JSON.stringify(data),
    ...options,
  });
}

/**
 * DELETEリクエストを送信
 * @param url APIエンドポイント
 * @param options リクエストオプション
 * @returns レスポンスデータ
 */
export function del<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  return fetchApi<T>(url, {
    method: 'DELETE',
    ...options,
  });
}