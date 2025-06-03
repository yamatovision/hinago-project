/**
 * API通信用ユーティリティ
 */
import { ApiResponse } from 'shared';

// APIのベースURL - 環境変数から取得
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

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
  // FormDataの場合はContent-Typeを設定しない（ブラウザが自動設定）
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  // 認証トークンがあれば追加
  const token = localStorage.getItem('accessToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // APIのベースURLを追加
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  console.log(`=== APIリクエスト開始 ===`);
  console.log(`メソッド: ${options.method || 'GET'}`);
  console.log(`URL: ${fullUrl}`);
  console.log(`環境: ${import.meta.env.VITE_ENV || 'unknown'}`);
  console.log(`APIベースURL: ${API_BASE_URL}`);
  console.log(`ヘッダー:`, headers);
  if (options.body) {
    console.log(`リクエストボディ:`, options.body);
  }
  
  try {
    // リクエストを送信
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    console.log(`=== レスポンス受信 ===`);
    console.log(`ステータス: ${response.status} ${response.statusText}`);
    console.log(`Content-Type:`, response.headers.get('content-type'));
    
    // DELETEリクエストで204レスポンスの場合は成功として処理
    if (options.method === 'DELETE' && response.status === 204) {
      console.log('DELETE 204 レスポンス - 成功として処理');
      return {
        success: true,
        data: undefined,
      };
    }
    
    // レスポンスが空の場合はエラー
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('=== レスポンス形式エラー ===');
      console.error('Content-Type:', contentType);
      console.error('レスポンスボディ (テキスト):');
      const responseText = await response.text();
      console.error(responseText);
      
      return {
        success: false,
        error: `予期しないレスポンス形式: ${contentType || '不明'}`,
      };
    }
    
    // JSONレスポンスを解析
    const data = await response.json();
    console.log('=== JSONレスポンスデータ ===');
    console.log('パースしたデータ:', JSON.stringify(data, null, 2));

    // エラーレスポンスの場合
    if (!response.ok) {
      console.error('=== APIエラーレスポンス ===');
      console.error('ステータス:', response.status, response.statusText);
      console.error('エラーデータ:', data);
      
      return {
        success: false,
        error: data.error || `通信エラーが発生しました: ${response.status} ${response.statusText}`,
      };
    }

    console.log('=== API成功レスポンス ===');
    console.log('dataフィールド:', data.data);
    console.log('metaフィールド:', data.meta);
    
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
  // FormDataの場合はそのまま、それ以外はJSON文字列化
  const body = data instanceof FormData ? data : JSON.stringify(data);
  
  // FormDataの場合、Content-Typeヘッダーを削除（ブラウザが自動設定）
  if (data instanceof FormData && options.headers) {
    const headers = { ...(options.headers as Record<string, string>) };
    delete headers['Content-Type'];
    options.headers = headers;
  }
  
  return fetchApi<T>(url, {
    method: 'POST',
    body,
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
  // FormDataの場合はそのまま、それ以外はJSON文字列化
  const body = data instanceof FormData ? data : JSON.stringify(data);
  
  // FormDataの場合、Content-Typeヘッダーを削除（ブラウザが自動設定）
  if (data instanceof FormData && options.headers) {
    const headers = { ...(options.headers as Record<string, string>) };
    delete headers['Content-Type'];
    options.headers = headers;
  }
  
  return fetchApi<T>(url, {
    method: 'PUT',
    body,
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