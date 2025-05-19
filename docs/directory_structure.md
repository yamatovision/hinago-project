# HinagoProject ディレクトリ構造設計

**バージョン**: 1.0.0  
**最終更新日**: 2025-05-19  
**ステータス**: ドラフト  

## 1. 設計方針

HinagoProjectでは、以下の原則に基づいてディレクトリ構造を設計しています：

1. **機能中心の構造**: 技術的な層ではなく、ビジネス機能を中心としたディレクトリ構造
2. **単一責任の原則**: 各コンポーネントは明確に定義された単一の責任を持つ
3. **共通コードの抽象化**: 複数の機能で使用されるコードは共通ディレクトリに抽象化
4. **型定義の一元管理**: すべての型定義は `shared/index.ts` で管理
5. **APIパスの一元管理**: すべてのAPIパスは `shared/index.ts` で管理
6. **共有コードは上流へ**: 複数の機能でコードの共有が必要になった場合は、上位の共通層へ移動

この構造は、非技術者にも理解しやすく、ビジネス要件の進化に合わせて拡張しやすいように設計されています。

## 2. システム全体構成

```
/HinagoProject/
├── docs/                   # プロジェクトドキュメント
│   ├── requirements.md     # 要件定義書
│   ├── data_models.md      # データモデル定義
│   ├── directory_structure.md # 本ドキュメント
│   ├── SCOPE_PROGRESS.md   # スコープ進捗状況
│   └── deployment/         # デプロイメント関連ドキュメント
│
├── mockups/                # UIモックアップ
│   ├── dashboard.html      # ダッシュボード画面
│   ├── property-register.html # 物件登録画面
│   ├── property-detail.html # 物件詳細画面
│   ├── volume-check.html   # ボリュームチェック画面
│   └── profitability-analysis.html # 収益性試算画面
│
├── shared/                 # 共有型定義とAPIパス
│   └── index.ts            # 型定義・APIパスの単一の真実源
│
├── frontend/               # フロントエンドアプリケーション
│
├── backend/                # バックエンドアプリケーション
│
└── scripts/                # ビルドスクリプトや開発用ツール
```

## 3. フロントエンド構造

```
/frontend/
├── public/                # 静的ファイル
│   ├── index.html         # メインHTMLファイル
│   ├── favicon.ico        # アプリケーションアイコン
│   └── assets/            # 画像などの静的アセット
│
└── src/
    ├── common/            # 共通コンポーネント・ユーティリティ
    │   ├── components/    # 汎用UIコンポーネント
    │   │   ├── Button/    # ボタンコンポーネント
    │   │   ├── Card/      # カードコンポーネント
    │   │   ├── Form/      # フォームコンポーネント
    │   │   ├── Layout/    # レイアウトコンポーネント
    │   │   ├── Loading/   # ローディングインジケータ
    │   │   └── ...        # その他の共通コンポーネント
    │   │
    │   ├── hooks/         # 共通Reactフック
    │   │   ├── useForm.ts # フォーム管理フック
    │   │   ├── useApi.ts  # API通信フック
    │   │   ├── useAuth.ts # 認証状態管理フック
    │   │   └── ...        # その他の共通フック
    │   │
    │   └── utils/         # ユーティリティ関数
    │       ├── api.ts     # API通信ユーティリティ
    │       ├── validation.ts # バリデーションユーティリティ
    │       ├── token.ts   # トークン管理ユーティリティ
    │       └── ...        # その他のユーティリティ
    │
    ├── features/          # 機能ごとにグループ化
    │   ├── auth/          # 認証機能
    │   │   ├── components/ # 認証関連コンポーネント
    │   │   │   ├── LoginForm/ # ログインフォーム
    │   │   │   ├── RegisterForm/ # 登録フォーム
    │   │   │   └── ProtectedRoute/ # 保護されたルート
    │   │   ├── hooks/     # 認証関連フック
    │   │   ├── pages/     # 認証関連ページ
    │   │   │   ├── LoginPage.tsx # ログインページ
    │   │   │   └── RegisterPage.tsx # 登録ページ
    │   │   ├── contexts/  # 認証コンテキスト
    │   │   │   └── AuthContext.tsx # 認証状態管理コンテキスト
    │   │   ├── services/  # 認証関連サービス
    │   │   │   └── tokenService.ts # トークン管理サービス
    │   │   └── api.ts     # 認証API連携
    │   │
    │   ├── dashboard/     # ダッシュボード機能
    │   │   ├── components/ # ダッシュボード固有のコンポーネント
    │   │   ├── hooks/     # ダッシュボード固有のフック
    │   │   ├── pages/     # ダッシュボード画面
    │   │   └── api.ts     # ダッシュボードAPI連携
    │   │
    │   ├── properties/    # 物件管理機能
    │   │   ├── components/ # 物件管理固有のコンポーネント
    │   │   │   ├── PropertyForm/ # 物件フォームコンポーネント
    │   │   │   ├── PropertyList/ # 物件一覧コンポーネント
    │   │   │   └── ...     # その他の物件関連コンポーネント
    │   │   ├── hooks/      # 物件管理固有のフック
    │   │   ├── pages/      # 物件管理画面
    │   │   │   ├── PropertyListPage.tsx # 物件一覧ページ
    │   │   │   ├── PropertyRegisterPage.tsx # 物件登録ページ
    │   │   │   └── PropertyDetailPage.tsx # 物件詳細ページ
    │   │   └── api.ts      # 物件管理API連携
    │   │
    │   ├── volume-check/  # ボリュームチェック機能
    │   │   ├── components/ # ボリュームチェック固有のコンポーネント
    │   │   │   ├── AssetTypeSelector/ # アセットタイプ選択コンポーネント
    │   │   │   ├── Model3DViewer/    # 3Dモデルビューアコンポーネント
    │   │   │   ├── SurveyMapUploader/ # 測量図アップローダーコンポーネント
    │   │   │   └── ...     # その他のボリュームチェック関連コンポーネント
    │   │   ├── hooks/      # ボリュームチェック固有のフック
    │   │   ├── pages/      # ボリュームチェック画面
    │   │   └── api.ts      # ボリュームチェックAPI連携
    │   │
    │   └── profitability/ # 収益性試算機能
    │       ├── components/ # 収益性試算固有のコンポーネント
    │       ├── hooks/      # 収益性試算固有のフック
    │       ├── pages/      # 収益性試算画面
    │       └── api.ts      # 収益性試算API連携
    │
    ├── app/               # アプリケーションのコア
    │   ├── routes.tsx     # ルーティング設定
    │   ├── providers.tsx  # コンテキストプロバイダー
    │   └── store.ts       # グローバル状態管理
    │
    └── index.tsx          # エントリーポイント
```

## 4. バックエンド構造

```
/backend/
├── src/
│   ├── common/            # 全機能で共有する共通コード
│   │   ├── middlewares/   # 共通ミドルウェア
│   │   │   ├── auth.middleware.ts     # 認証ミドルウェア
│   │   │   ├── error.middleware.ts    # エラーハンドリングミドルウェア
│   │   │   └── validation.middleware.ts # バリデーションミドルウェア
│   │   │
│   │   ├── utils/         # ユーティリティ
│   │   │   ├── logger.ts   # ロギングユーティリティ
│   │   │   └── response.ts # レスポンスフォーマットユーティリティ
│   │   │
│   │   └── validators/    # 共通バリデーター
│   │       └── common.validator.ts # 共通バリデーションルール
│   │
│   ├── features/          # 機能ごとにグループ化
│   │   ├── auth/          # 認証機能
│   │   │   ├── auth.controller.ts   # 認証コントローラー
│   │   │   ├── auth.service.ts      # 認証サービス
│   │   │   ├── auth.routes.ts       # 認証ルート定義
│   │   │   ├── auth.middleware.ts   # 認証固有ミドルウェア
│   │   │   ├── auth.utils.ts        # 認証ユーティリティ
│   │   │   ├── auth.validator.ts    # 認証バリデーター
│   │   │   └── auth.config.ts       # JWT設定などの認証設定
│   │   │
│   │   ├── properties/    # 物件管理機能
│   │   │   ├── properties.controller.ts # コントローラー
│   │   │   ├── properties.service.ts    # サービス
│   │   │   ├── properties.routes.ts     # ルート定義
│   │   │   ├── properties.repository.ts # リポジトリ
│   │   │   └── properties.validator.ts  # バリデーター
│   │   │
│   │   ├── volume-check/  # ボリュームチェック機能
│   │   │   ├── volume-check.controller.ts # コントローラー
│   │   │   ├── volume-check.service.ts    # サービス
│   │   │   ├── volume-check.routes.ts     # ルート定義
│   │   │   ├── volume-check.repository.ts # リポジトリ
│   │   │   └── volume-check.validator.ts  # バリデーター
│   │   │
│   │   └── profitability/ # 収益性試算機能
│   │       ├── profitability.controller.ts # コントローラー
│   │       ├── profitability.service.ts    # サービス
│   │       ├── profitability.routes.ts     # ルート定義
│   │       ├── profitability.repository.ts # リポジトリ
│   │       └── profitability.validator.ts  # バリデーター
│   │
│   ├── config/           # アプリケーション設定
│   │   ├── app.config.ts  # アプリケーション設定
│   │   ├── db.config.ts   # データベース設定
│   │   ├── auth.config.ts # 認証・JWT設定
│   │   └── index.ts       # 設定エクスポート
│   │
│   ├── db/               # データベース関連
│   │   ├── connection.ts  # データベース接続
│   │   └── models/        # データモデル
│   │       ├── User.ts        # ユーザーモデル
│   │       ├── RefreshToken.ts # リフレッシュトークンモデル
│   │       ├── Property.ts     # 物件モデル
│   │       ├── VolumeCheck.ts  # ボリュームチェックモデル
│   │       ├── Document.ts     # 文書モデル
│   │       └── Scenario.ts     # シナリオモデル
│   │
│   ├── types/            # 型定義（shared/index.tsからコピー）
│   │   └── index.ts       # 型定義
│   │
│   ├── routes.ts         # ルートインデックス
│   │
│   └── app.ts            # アプリケーションエントリーポイント
│
└── tests/                # テスト
    ├── integration/      # 統合テスト
    │   ├── auth/         # 認証機能のテスト
    │   ├── properties/   # 物件管理機能のテスト
    │   ├── volume-check/ # ボリュームチェック機能のテスト
    │   └── profitability/ # 収益性試算機能のテスト
    │
    └── unit/             # ユニットテスト
        ├── auth/         # 認証機能のテスト
        ├── properties/   # 物件管理機能のテスト
        ├── volume-check/ # ボリュームチェック機能のテスト
        └── profitability/ # 収益性試算機能のテスト
```

## 5. ディレクトリ構造の原則と利点

### 5.1 機能中心アプローチの利点

- **ビジネス理解の向上**: ディレクトリ構造が技術的な関心事ではなくビジネス機能を反映しているため、非技術者にとっても理解しやすい
- **チーム作業の効率化**: 同じ機能に関連するコードが同じディレクトリにまとまっているため、複数の開発者が同じ機能に取り組む際の衝突が減少
- **コードの再利用性**: 共通コンポーネントと機能固有のコンポーネントが明確に分離されているため、再利用が容易
- **スケーラビリティ**: 新機能の追加が既存のコードに影響を与えにくく、独立した形で実装可能
- **テスト容易性**: 機能単位でのテストが容易になり、テストカバレッジの向上につながる

### 5.2 推奨開発ワークフロー

1. **共有層の定義**: 新機能の開発を始める前に、必要な型定義とAPIパスを `shared/index.ts` に追加
2. **バックエンド実装**: 型定義を参照しながらバックエンドの機能を実装
3. **フロントエンド実装**: 同じ型定義を参照しながらフロントエンドのコンポーネントとページを実装
4. **統合テスト**: バックエンドとフロントエンドの統合テストを実施
5. **リファクタリング**: 共通化できる部分を特定し、必要に応じて共通層に移動

## 6. 発展の方向性

この設計は将来の拡張を考慮しており、以下のような発展が想定されています：

1. **マイクロフロントエンド化**: 機能ごとにさらに細分化し、独立したマイクロフロントエンドとして開発・デプロイする可能性
2. **マイクロサービス化**: バックエンドも同様に、機能ごとに独立したマイクロサービスとして切り出す可能性
3. **コンテナ化**: 各機能をコンテナ化し、Kubernetes等のオーケストレーションツールで管理する方向性
4. **CI/CD自動化**: 機能単位でのCI/CDパイプラインの構築と自動化