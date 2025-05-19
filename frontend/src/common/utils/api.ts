/**
 * API通信用ユーティリティ
 */
import { ApiResponse } from 'shared';

// APIのベースURL
// 開発環境ではプロキシ経由でAPIにアクセス
// Viteの設定でプロキシされるため、相対パスを使用
const API_BASE_URL = 'http://localhost:8080';

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
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // 認証トークンがあれば追加
  const token = localStorage.getItem('accessToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // APIのベースURLを追加
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  console.log(`APIリクエスト: ${options.method || 'GET'} ${fullUrl}`);
  
  try {
    // リクエストを送信
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    console.log(`APIステータスコード: ${response.status} ${response.statusText}`);
    
    // JSONレスポンスを解析
    const data = await response.json();

    // エラーレスポンスの場合
    if (!response.ok) {
      console.error('APIエラーレスポンス:', {
        status: response.status,
        statusText: response.statusText,
        data
      });
      
      return {
        success: false,
        error: data.error || `通信エラーが発生しました: ${response.status} ${response.statusText}`,
      };
    }

    // 成功レスポンスを返却
    return {
      success: true,
      data: data.data,
      meta: data.meta,
    };
  } catch (error) {
    console.error('APIリクエスト実行エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '予期しないエラーが発生しました',
    };
  }
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