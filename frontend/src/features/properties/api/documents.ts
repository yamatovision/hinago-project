/**
 * 物件文書管理関連のAPI
 */
import { API_PATHS, Document, DocumentType } from 'shared';
import { get, post, del } from '../../../common/utils/api';

/**
 * 物件関連文書の一覧を取得
 * @param propertyId 物件ID
 * @param documentType オプションのドキュメントタイプフィルター
 * @returns 文書一覧
 */
export const getPropertyDocuments = async (
  propertyId: string,
  documentType?: DocumentType
): Promise<Document[] | null> => {
  let url = API_PATHS.PROPERTIES.DOCUMENTS(propertyId);
  
  // ドキュメントタイプによるフィルタリング
  if (documentType) {
    url += `?documentType=${documentType}`;
  }
  
  const response = await get<Document[]>(url);
  
  if (response.success && response.data) {
    return response.data;
  }
  
  return null;
};

/**
 * 物件関連文書をアップロード
 * @param propertyId 物件ID
 * @param file アップロードするファイル
 * @param documentType 文書タイプ
 * @param description オプションの文書説明
 * @returns アップロードされた文書情報
 */
export const uploadPropertyDocument = async (
  propertyId: string,
  file: File,
  documentType: DocumentType,
  description?: string
): Promise<Document | null> => {
  const url = API_PATHS.PROPERTIES.DOCUMENTS(propertyId);
  
  // FormDataの準備
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', documentType);
  
  if (description) {
    formData.append('description', description);
  }
  
  // 特別なヘッダーを設定（multipart/form-data）
  const response = await post<Document>(url, formData, {
    headers: {
      // Content-Type はブラウザが自動的に設定するので指定しない
    }
  });
  
  if (response.success && response.data) {
    return response.data;
  }
  
  return null;
};

/**
 * 物件関連文書を削除
 * @param propertyId 物件ID
 * @param documentId 文書ID
 * @returns 削除成功フラグ
 */
export const deletePropertyDocument = async (
  propertyId: string,
  documentId: string
): Promise<boolean> => {
  const url = API_PATHS.PROPERTIES.DOCUMENT(propertyId, documentId);
  const response = await del(url);
  
  return response.success;
};