import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  IconButton,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Avatar
} from '@mui/material';
import {
  Folder as FolderIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Description as FileIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  GetApp as DownloadIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { PropertyDetail, Document, DocumentType } from 'shared';
import { getPropertyDocuments, uploadPropertyDocument, deletePropertyDocument } from '../../api/documents';

interface DocumentsTabProps {
  property: PropertyDetail;
}

/**
 * 物件の図面・資料タブ
 * 物件に関連する文書のアップロード、管理を行う
 */
const DocumentsTab: React.FC<DocumentsTabProps> = ({ property }) => {
  // ファイル入力参照
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 状態管理
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // アップロードダイアログ状態
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.OTHER);
  const [description, setDescription] = useState('');
  
  // 削除確認ダイアログ状態
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  
  // 文書一覧の取得
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const fetchedDocuments = await getPropertyDocuments(property.id);
        
        if (fetchedDocuments) {
          setDocuments(fetchedDocuments);
        }
        setError(null);
      } catch (err) {
        console.error('文書データ取得エラー:', err);
        setError('文書データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocuments();
  }, [property.id]);
  
  // ファイル選択ダイアログを開く
  const handleOpenFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // ファイル選択時の処理
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      setUploadDialogOpen(true);
    }
    
    // ファイル入力をリセット（同じファイルを連続で選択可能にするため）
    if (event.target) {
      event.target.value = '';
    }
  };
  
  // アップロードダイアログを閉じる
  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setSelectedFile(null);
    setDocumentType(DocumentType.OTHER);
    setDescription('');
  };
  
  // ドキュメントタイプの変更
  const handleDocumentTypeChange = (event: any) => {
    setDocumentType(event.target.value as DocumentType);
  };
  
  // 説明文の変更
  const handleDescriptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(event.target.value);
  };
  
  // ファイルアップロード処理
  const handleUploadFile = async () => {
    if (!selectedFile) return;
    
    try {
      setUploading(true);
      setError(null);
      
      const uploadedDocument = await uploadPropertyDocument(
        property.id,
        selectedFile,
        documentType,
        description
      );
      
      if (uploadedDocument) {
        // 文書リストに追加
        setDocuments([...documents, uploadedDocument]);
        setSuccess('文書のアップロードに成功しました');
        
        // 成功メッセージを数秒後に消す
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
        
        // ダイアログを閉じる
        handleCloseUploadDialog();
      } else {
        setError('文書のアップロードに失敗しました');
      }
    } catch (err) {
      console.error('文書アップロードエラー:', err);
      setError('文書のアップロード中にエラーが発生しました');
    } finally {
      setUploading(false);
    }
  };
  
  // 削除ダイアログを開く
  const handleOpenDeleteDialog = (document: Document) => {
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  };
  
  // 削除ダイアログを閉じる
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
  };
  
  // 文書削除処理
  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;
    
    try {
      setUploading(true);
      const success = await deletePropertyDocument(property.id, documentToDelete.id);
      
      if (success) {
        // 文書リストから削除
        setDocuments(documents.filter(doc => doc.id !== documentToDelete.id));
        setSuccess('文書を削除しました');
        
        // 成功メッセージを数秒後に消す
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        setError('文書の削除に失敗しました');
      }
    } catch (err) {
      console.error('文書削除エラー:', err);
      setError('文書の削除中にエラーが発生しました');
    } finally {
      setUploading(false);
      handleCloseDeleteDialog();
    }
  };
  
  // ファイルサイズのフォーマット
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // ドキュメントタイプ名のフォーマット
  const formatDocumentType = (type: DocumentType): string => {
    switch(type) {
      case DocumentType.SURVEY:
        return '測量図';
      case DocumentType.LEGAL:
        return '法的書類';
      case DocumentType.PLAN:
        return '計画書';
      case DocumentType.REPORT:
        return 'レポート';
      default:
        return 'その他';
    }
  };
  
  // ファイルタイプに応じたアイコンを取得
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <PdfIcon color="error" />;
    } else if (fileType.includes('image')) {
      return <ImageIcon color="primary" />;
    } else {
      return <FileIcon color="action" />;
    }
  };
  
  // ドキュメントをプレビュー
  const handlePreviewDocument = (document: Document) => {
    window.open(document.fileUrl, '_blank');
  };
  
  // ドキュメントをダウンロード
  const handleDownloadDocument = (document: Document) => {
    const link = document.createElement('a');
    link.href = document.fileUrl;
    link.download = document.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // ドラッグ&ドロップ関連のハンドラ
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
      setUploadDialogOpen(true);
    }
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <FolderIcon sx={{ mr: 1 }} />
        図面・資料
      </Typography>
      
      <Typography variant="body2" color="textSecondary" gutterBottom>
        測量図、公図、重要事項説明書など、物件に関連する図面や資料を管理できます。
      </Typography>
      
      {/* ファイルアップロードエリア */}
      <Box
        sx={{
          mt: 2,
          p: 3,
          border: '2px dashed #ddd',
          borderRadius: 1,
          bgcolor: '#f9f9f9',
          textAlign: 'center',
          cursor: 'pointer'
        }}
        onClick={handleOpenFileDialog}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
          accept=".pdf,.jpg,.jpeg,.png,.tiff,.dwg,.dxf" // 許可するファイル形式
        />
        
        <CloudUploadIcon sx={{ fontSize: 48, color: '#1976d2', mb: 1 }} />
        <Typography variant="body1" gutterBottom>
          ファイルをドラッグ＆ドロップするか、ファイルを選択してください
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={(e) => {
            e.stopPropagation();
            handleOpenFileDialog();
          }}
        >
          ファイルを選択
        </Button>
        
        <Typography variant="caption" display="block" sx={{ mt: 1, color: '#666' }}>
          対応形式: PDF, DWG, DXF, JPG, PNG（最大20MB）
        </Typography>
      </Box>
      
      {/* エラーメッセージ */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* 成功メッセージ */}
      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}
      
      {/* 文書一覧 */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          文書一覧
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        ) : documents.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            この物件に関連する文書はまだありません。
          </Alert>
        ) : (
          <List>
            {documents.map((doc) => (
              <ListItem
                key={doc.id}
                sx={{
                  border: '1px solid #eee',
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: 'white'
                }}
              >
                <ListItemAvatar>
                  <Avatar>
                    {getFileIcon(doc.fileType)}
                  </Avatar>
                </ListItemAvatar>
                
                <ListItemText
                  primary={doc.name}
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="textSecondary">
                        {formatDocumentType(doc.documentType)} - {formatFileSize(doc.fileSize)}
                      </Typography>
                      {doc.description && (
                        <Typography component="p" variant="body2" color="textSecondary">
                          {doc.description}
                        </Typography>
                      )}
                    </>
                  }
                />
                
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => handlePreviewDocument(doc)}>
                    <ViewIcon />
                  </IconButton>
                  <IconButton edge="end" onClick={() => handleDownloadDocument(doc)}>
                    <DownloadIcon />
                  </IconButton>
                  <IconButton edge="end" onClick={() => handleOpenDeleteDialog(doc)}>
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
      
      {/* アップロードダイアログ */}
      <Dialog open={uploadDialogOpen} onClose={handleCloseUploadDialog}>
        <DialogTitle>文書のアップロード</DialogTitle>
        <DialogContent>
          <Box sx={{ minWidth: 400, mt: 1 }}>
            <Typography variant="body1" gutterBottom>
              選択されたファイル: {selectedFile?.name}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              サイズ: {selectedFile ? formatFileSize(selectedFile.size) : ''}
            </Typography>
            
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id="document-type-label">文書タイプ</InputLabel>
              <Select
                labelId="document-type-label"
                value={documentType}
                label="文書タイプ"
                onChange={handleDocumentTypeChange}
              >
                <MenuItem value={DocumentType.SURVEY}>測量図</MenuItem>
                <MenuItem value={DocumentType.LEGAL}>法的書類</MenuItem>
                <MenuItem value={DocumentType.PLAN}>計画書</MenuItem>
                <MenuItem value={DocumentType.REPORT}>レポート</MenuItem>
                <MenuItem value={DocumentType.OTHER}>その他</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="説明（オプション）"
              multiline
              rows={2}
              value={description}
              onChange={handleDescriptionChange}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog} disabled={uploading}>
            キャンセル
          </Button>
          <Button
            onClick={handleUploadFile}
            variant="contained"
            disabled={uploading}
            startIcon={uploading ? <CircularProgress size={16} /> : <UploadIcon />}
          >
            {uploading ? 'アップロード中...' : 'アップロード'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>文書を削除しますか？</DialogTitle>
        <DialogContent>
          <Typography>
            「{documentToDelete?.name}」を削除します。この操作は取り消せません。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={uploading}>
            キャンセル
          </Button>
          <Button
            onClick={handleDeleteDocument}
            color="error"
            disabled={uploading}
            startIcon={uploading ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentsTab;