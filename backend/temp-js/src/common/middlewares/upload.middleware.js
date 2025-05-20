"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractShapeFromFile = exports.getFileUrl = exports.handleUploadError = exports.uploadPropertyDocument = exports.uploadSurveyMap = void 0;
var multer_1 = require("multer");
var path_1 = require("path");
var fs_1 = require("fs");
var uuid_1 = require("uuid");
var utils_1 = require("../utils");
// アップロードディレクトリの設定
var UPLOAD_DIR = path_1.default.join(process.cwd(), 'uploads');
// アップロードディレクトリが存在しない場合は作成
if (!fs_1.default.existsSync(UPLOAD_DIR)) {
    fs_1.default.mkdirSync(UPLOAD_DIR, { recursive: true });
    utils_1.logger.info("\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u30C7\u30A3\u30EC\u30AF\u30C8\u30EA\u3092\u4F5C\u6210\u3057\u307E\u3057\u305F: ".concat(UPLOAD_DIR));
}
// ストレージ設定
var storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        var _a;
        // 物件関連文書用のサブディレクトリがあれば使用
        var propertyId = (_a = req.params) === null || _a === void 0 ? void 0 : _a.propertyId;
        if (propertyId && req.path.includes('/documents')) {
            var propertyDir = path_1.default.join(UPLOAD_DIR, 'documents', propertyId);
            if (!fs_1.default.existsSync(propertyDir)) {
                fs_1.default.mkdirSync(propertyDir, { recursive: true });
                utils_1.logger.info("\u7269\u4EF6\u6587\u66F8\u7528\u30C7\u30A3\u30EC\u30AF\u30C8\u30EA\u3092\u4F5C\u6210\u3057\u307E\u3057\u305F: ".concat(propertyDir));
            }
            cb(null, propertyDir);
        }
        else {
            cb(null, UPLOAD_DIR);
        }
    },
    filename: function (req, file, cb) {
        // オリジナルファイル名を保持しつつユニークなファイル名を生成
        var uniqueSuffix = "".concat(Date.now(), "-").concat((0, uuid_1.v4)());
        var extension = path_1.default.extname(file.originalname);
        var filename = "".concat(path_1.default.basename(file.originalname, extension), "-").concat(uniqueSuffix).concat(extension);
        cb(null, filename);
    },
});
// 許可されるファイルタイプの定義
var ALLOWED_MIME_TYPES = [
    'application/pdf', // PDF
    'image/jpeg', // JPEG
    'image/png', // PNG
    'image/tiff', // TIFF
    'application/dxf', // DXF
    'application/dwg', // DWG
    'application/octet-stream', // 一般バイナリ（DWG, DXFなど）
    'application/msword', // DOC
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/vnd.ms-excel', // XLS
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
    'application/zip', // ZIP
    'text/plain', // TXT
    'text/csv' // CSV
];
// ファイルフィルター関数
var fileFilter = function (req, file, cb) {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        // ファイルを受け入れる
        cb(null, true);
    }
    else {
        // ファイルを拒否
        cb(new Error('許可されていないファイル形式です。一般的なドキュメント形式（PDF、画像、オフィス文書など）のみ許可されています。'));
    }
};
// 基本のアップロード設定
var upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 最大ファイルサイズ 10MB
    },
});
// 測量図アップロード用のミドルウェア
exports.uploadSurveyMap = upload.single('file');
// 物件文書アップロード用のミドルウェア
exports.uploadPropertyDocument = upload.single('file');
// ファイルアップロードエラーハンドラー
var handleUploadError = function (err, req, res, next) {
    if (err instanceof multer_1.default.MulterError) {
        // Multerのエラー
        utils_1.logger.error('ファイルアップロードエラー', { error: err });
        return res.status(400).json({
            success: false,
            error: {
                code: 'UPLOAD_ERROR',
                message: getMulterErrorMessage(err),
            },
        });
    }
    else if (err) {
        // その他のエラー
        utils_1.logger.error('ファイルアップロードエラー', { error: err });
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
exports.handleUploadError = handleUploadError;
// Multerエラーメッセージの取得
var getMulterErrorMessage = function (err) {
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
            return "\u30D5\u30A1\u30A4\u30EB\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F: ".concat(err.message);
    }
};
// ファイル情報からURLを生成する関数
var getFileUrl = function (file) {
    // パスを確認して適切なURLを生成
    var relativePath = file.path.replace(process.cwd(), '').replace(/\\/g, '/');
    return relativePath.startsWith('/') ? relativePath : "/".concat(relativePath);
};
exports.getFileUrl = getFileUrl;
// アップロードされたファイルからの形状抽出関数（モック実装）
var extractShapeFromFile = function (file) {
    // 本番環境では実際に測量図からの形状抽出ロジックを実装
    // ここではモック実装として単純な矩形を返す
    var mockShape = {
        points: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },
            { x: 10, y: 20 },
            { x: 0, y: 20 },
            { x: 0, y: 0 } // 閉じたポリゴンにするため最初の点を繰り返す
        ],
        width: 10,
        depth: 20,
        sourceFile: (0, exports.getFileUrl)(file)
    };
    utils_1.logger.info("\u30D5\u30A1\u30A4\u30EB\u304B\u3089\u5F62\u72B6\u30C7\u30FC\u30BF\u3092\u62BD\u51FA\u3057\u307E\u3057\u305F: ".concat(file.filename));
    return mockShape;
};
exports.extractShapeFromFile = extractShapeFromFile;
