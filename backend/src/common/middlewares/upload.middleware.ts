/**
 * ファイルアップロード用ミドルウェア
 * Multerを使用して一時ファイルとしてアップロードを処理します
 */
import { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils';

// アップロードディレクトリの設定
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// アップロードディレクトリが存在しない場合は作成
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  logger.info(`アップロードディレクトリを作成しました: ${UPLOAD_DIR}`);
}

// ストレージ設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 物件関連文書用のサブディレクトリがあれば使用
    const propertyId = req.params?.propertyId;
    if (propertyId && req.path.includes('/documents')) {
      const propertyDir = path.join(UPLOAD_DIR, 'documents', propertyId);
      if (!fs.existsSync(propertyDir)) {
        fs.mkdirSync(propertyDir, { recursive: true });
        logger.info(`物件文書用ディレクトリを作成しました: ${propertyDir}`);
      }
      cb(null, propertyDir);
    } else {
      cb(null, UPLOAD_DIR);
    }
  },
  filename: (req, file, cb) => {
    // オリジナルファイル名を保持しつつユニークなファイル名を生成
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    const extension = path.extname(file.originalname);
    // 日本語ファイル名をサニタイズ（英数字、ハイフン、アンダースコアのみ残す）
    const basename = path.basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9\-_]/g, '_')
      .substring(0, 50); // 長すぎる場合は切り詰める
    const filename = `${basename}-${uniqueSuffix}${extension}`;
    cb(null, filename);
  },
});

// 許可されるファイルタイプの定義
const ALLOWED_MIME_TYPES = [
  'application/pdf',          // PDF
  'image/jpeg',               // JPEG
  'image/png',                // PNG
  'image/tiff',               // TIFF
  'application/dxf',          // DXF
  'application/dwg',          // DWG
  'application/octet-stream', // 一般バイナリ（DWG, DXFなど）
  'application/msword',       // DOC
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  'application/vnd.ms-excel', // XLS
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
  'application/zip',          // ZIP
  'text/plain',               // TXT
  'text/csv'                  // CSV
];

// ファイルフィルター関数
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    // ファイルを受け入れる
    cb(null, true);
  } else {
    // ファイルを拒否
    cb(new Error('許可されていないファイル形式です。一般的なドキュメント形式（PDF、画像、オフィス文書など）のみ許可されています。'));
  }
};

// 基本のアップロード設定
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 最大ファイルサイズ 10MB
  },
});

// 測量図アップロード用のミドルウェア
export const uploadSurveyMap = upload.single('file');

// ファイルアップロードエラーハンドラー
export const handleUploadError = (err: any, req: Request, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    // Multerのエラー
    logger.error('ファイルアップロードエラー', { error: err });
    return res.status(400).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: getMulterErrorMessage(err),
      },
    });
  } else if (err) {
    // その他のエラー
    logger.error('ファイルアップロードエラー', { error: err });
    return res.status(400).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: err.message || 'ファイルアップロード中にエラーが発生しました。',
      },
    });
  }
  next();
};

// Multerエラーメッセージの取得
const getMulterErrorMessage = (err: multer.MulterError): string => {
  switch (err.code) {
    case 'LIMIT_FILE_SIZE':
      return 'ファイルサイズが大きすぎます。最大10MBまで許可されています。';
    case 'LIMIT_UNEXPECTED_FILE':
      return '予期せぬファイルフィールドが検出されました。';
    case 'LIMIT_PART_COUNT':
      return 'アップロードパーツが多すぎます。';
    case 'LIMIT_FILE_COUNT':
      return 'アップロードファイルが多すぎます。';
    default:
      return `ファイルアップロード中にエラーが発生しました: ${err.message}`;
  }
};

// ファイル情報からURLを生成する関数
export const getFileUrl = (file: Express.Multer.File): string => {
  // パスを確認して適切なURLを生成
  const relativePath = file.path.replace(process.cwd(), '').replace(/\\/g, '/');
  return relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
};

// アップロードされたファイルからの形状抽出関数（モック実装）
export const extractShapeFromFile = (file: Express.Multer.File) => {
  // 本番環境では実際に測量図からの形状抽出ロジックを実装
  // ここではモック実装として単純な矩形を返す
  const mockShape = {
    points: [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 20 },
      { x: 0, y: 20 },
      { x: 0, y: 0 } // 閉じたポリゴンにするため最初の点を繰り返す
    ],
    width: 10,
    depth: 20,
    sourceFile: getFileUrl(file)
  };
  
  logger.info(`ファイルから形状データを抽出しました: ${file.filename}`);
  return mockShape;
};