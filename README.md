# 現場回収管理システム

共栄紙業×アークホーム向けの廃棄物回収依頼・マニフェスト管理システム

## 🚀 機能

- **回収依頼フォーム** - 店舗からの回収依頼を受付
- **管理ボード** - カンバン/リスト/カレンダーの3ビュー切替
- **マニフェスト** - 石綿あり/なし対応の帳票印刷
- **マスター設定** - 店舗・業者・紐付けの管理
- **通知機能** - Slack Webhook + EmailJS

## 📁 ページ構成

| パス | 用途 |
|------|------|
| `/` | 社内用（全機能） |
| `/form` | お客様用（フォームのみ） |

## 🛠️ 技術スタック

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **通知**: Slack Webhook, EmailJS

## 📦 セットアップ

### ローカル開発

```bash
# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env.local
# .env.local を編集

# 開発サーバー起動
npm run dev
```

### デプロイ

詳細は `DEPLOY_GUIDE.md` を参照してください。

## 📄 ファイル構成

```
src/
├── app/
│   ├── page.tsx          # メインページ（社内用）
│   ├── form/page.tsx     # フォームページ（お客様用）
│   ├── layout.tsx        # ルートレイアウト
│   └── globals.css       # グローバルスタイル
├── components/
│   ├── Toast.tsx         # トースト通知
│   ├── RequestForm.tsx   # 回収依頼フォーム
│   ├── KanbanBoard.tsx   # カンバンビュー
│   ├── ListView.tsx      # リストビュー
│   ├── CalendarView.tsx  # カレンダービュー
│   ├── RequestModal.tsx  # 依頼詳細モーダル
│   ├── Manifest.tsx      # マニフェスト帳票
│   └── Settings.tsx      # マスター設定
├── lib/
│   ├── supabase.ts       # Supabaseクライアント
│   ├── api.ts            # API関数
│   ├── notifications.ts  # 通知機能
│   └── utils.ts          # ユーティリティ
└── types/
    └── index.ts          # 型定義
```

## 🗄️ データベース

- `stores` - 店舗マスタ
- `vendors` - 業者マスタ（4分類: carrier/processor/dest/transfer）
- `store_vendor_mappings` - 店舗-業者紐付け
- `requests` - 回収依頼
- `email_config` - メール設定

初期データは `supabase_schema.sql` を参照。

## 📝 ライセンス

Private - 共栄紙業株式会社
