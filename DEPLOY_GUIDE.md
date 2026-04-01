# 現場回収管理システム デプロイ手順書

このガイドでは、現場回収管理システムを **Supabase + Vercel** で公開する手順を説明します。
プログラミング初心者の方でも進められるよう、スクリーンショット付きで解説しています。

---

## 📋 目次

1. [事前準備](#1-事前準備)
2. [Supabase のセットアップ](#2-supabase-のセットアップ)
3. [GitHub へのアップロード](#3-github-へのアップロード)
4. [Vercel へのデプロイ](#4-vercel-へのデプロイ)
5. [動作確認](#5-動作確認)
6. [EmailJS の設定（任意）](#6-emailjs-の設定任意)
7. [Slack 通知の設定（任意）](#7-slack-通知の設定任意)
8. [トラブルシューティング](#8-トラブルシューティング)

---

## 1. 事前準備

以下のアカウントを作成してください（すべて無料）：

| サービス | URL | 用途 |
|---------|-----|------|
| GitHub | https://github.com | ソースコード管理 |
| Supabase | https://supabase.com | データベース |
| Vercel | https://vercel.com | Webサイト公開 |

---

## 2. Supabase のセットアップ

### 2-1. プロジェクト作成

1. [Supabase](https://supabase.com) にログイン
2. **「New Project」** をクリック
3. 以下を入力：
   - **Name**: `arkhome-collection`（任意）
   - **Database Password**: 強力なパスワードを設定（後で使わないのでメモ不要）
   - **Region**: `Northeast Asia (Tokyo)`
4. **「Create new project」** をクリック（2〜3分待つ）

### 2-2. テーブル作成

1. 左メニューの **「SQL Editor」** をクリック
2. **「New Query」** をクリック
3. `supabase_schema.sql` の内容を **すべてコピー** してエディタに貼り付け
4. **「Run」** ボタンをクリック
5. 「Success」と表示されれば完了

### 2-3. API キーの取得

1. 左メニューの **「Settings」→「API」** をクリック
2. 以下の2つをメモ帳にコピー：
   - **Project URL**: `https://xxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIs...`（長い文字列）

> ⚠️ **重要**: この2つは後で Vercel に設定します。他人に見せないでください。

---

## 3. GitHub へのアップロード

### 3-1. リポジトリ作成

1. [GitHub](https://github.com) にログイン
2. 右上の **「+」→「New repository」** をクリック
3. 以下を入力：
   - **Repository name**: `arkhome-collection`
   - **Public / Private**: `Private`（推奨）
4. **「Create repository」** をクリック

### 3-2. ファイルのアップロード

**方法A: GitHub Desktop を使う（推奨）**

1. [GitHub Desktop](https://desktop.github.com) をインストール
2. 「Clone a Repository」→ 先ほど作成したリポジトリを選択
3. `arkhome-app` フォルダの中身をすべてコピー
4. 「Summary」に `Initial commit` と入力
5. **「Commit to main」** → **「Push origin」**

**方法B: Web でアップロード**

1. リポジトリページで **「uploading an existing file」** をクリック
2. `arkhome-app` フォルダの中身をドラッグ＆ドロップ
3. **「Commit changes」** をクリック

---

## 4. Vercel へのデプロイ

### 4-1. プロジェクト作成

1. [Vercel](https://vercel.com) にログイン（GitHub アカウントで連携推奨）
2. **「Add New...」→「Project」** をクリック
3. 「Import Git Repository」で `arkhome-collection` を選択
4. **「Import」** をクリック

### 4-2. 環境変数の設定

「Configure Project」画面で **「Environment Variables」** を展開し、以下を追加：

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxxxxx.supabase.co`（手順2-3でコピーしたURL） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIs...`（手順2-3でコピーしたキー） |

> **追加方法**: 「NAME」に変数名、「VALUE」に値を入力 → **「Add」**

### 4-3. デプロイ

1. **「Deploy」** をクリック
2. 2〜3分待つ
3. 「Congratulations!」と表示されれば成功！
4. 表示された URL（`https://arkhome-collection-xxxxx.vercel.app`）をクリック

---

## 5. 動作確認

### 5-1. 社内用ページ

URL: `https://あなたのドメイン/`

- ✅ 4つのタブが表示される（回収依頼・管理ボード・マニフェスト・マスター設定）
- ✅ 「マスター設定」で店舗・業者が表示される

### 5-2. お客様用フォームページ

URL: `https://あなたのドメイン/form`

- ✅ フォームのみが表示される
- ✅ 店舗を選択できる

### 5-3. テスト送信

1. `/form` でテストデータを入力して送信
2. `/` の「管理ボード」に依頼が表示されることを確認
3. カードをクリックして詳細が見れることを確認
4. 「マニフェスト」タブで依頼を選択し、帳票が表示されることを確認

---

## 6. EmailJS の設定（任意）

フォーム送信時にメール通知を送りたい場合：

### 6-1. EmailJS アカウント作成

1. [EmailJS](https://www.emailjs.com) にアクセス
2. **「Sign Up Free」** でアカウント作成

### 6-2. Email Service 追加

1. 「Email Services」→ **「Add New Service」**
2. 「Gmail」を選択 → Google アカウントで連携
3. 作成された **Service ID**（`service_xxxxxxx`）をメモ

### 6-3. テンプレート作成

1. 「Email Templates」→ **「Create New Template」**
2. 以下のように設定：

**Subject（件名）:**
```
【現場回収依頼】{{store_name}} {{cname}}
```

**Content（本文）:**
```
{{message}}
```

3. 作成された **Template ID**（`template_xxxxxxx`）をメモ

### 6-4. Public Key 取得

1. 「Account」→「General」タブ
2. **Public Key** をコピー

### 6-5. アプリに設定

1. 公開したアプリの「マスター設定」タブを開く
2. 「メール通知設定」に以下を入力：
   - 共有アドレス: 通知を受け取るメールアドレス
   - EmailJS サービスID: `service_xxxxxxx`
   - EmailJS テンプレートID: `template_xxxxxxx`
   - EmailJS 公開キー: （コピーした Public Key）
3. **「設定を保存」** をクリック

---

## 7. Slack 通知の設定（任意）

Slack に通知を送りたい場合：

### 7-1. Webhook URL 取得

1. [Slack API](https://api.slack.com/apps) にアクセス
2. **「Create New App」→「From scratch」**
3. App Name: `現場回収通知`、Workspace を選択
4. 「Incoming Webhooks」→ **「Activate」** を ON
5. **「Add New Webhook to Workspace」** → 通知先チャンネルを選択
6. 生成された **Webhook URL** をコピー

### 7-2. Vercel に環境変数追加

1. Vercel のプロジェクト設定 → 「Environment Variables」
2. 以下を追加：

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SLACK_WEBHOOK_URL` | `https://hooks.slack.com/services/...` |

3. **「Redeploy」** で再デプロイ

---

## 8. トラブルシューティング

### ❌ 「データの読み込みに失敗しました」

**原因**: Supabase への接続エラー

**対処**:
1. Vercel の環境変数が正しいか確認
2. Supabase の「API」設定で URL と Key を再確認
3. 変更後は Vercel で「Redeploy」が必要

### ❌ 店舗や業者が表示されない

**原因**: SQL が正しく実行されていない

**対処**:
1. Supabase の「Table Editor」を開く
2. `stores` テーブルにデータがあるか確認
3. なければ SQL Editor で `supabase_schema.sql` を再実行

### ❌ フォーム送信でエラー

**原因**: RLS（Row Level Security）の設定不足

**対処**:
1. Supabase の「Authentication」→「Policies」
2. 各テーブルに「Allow all」ポリシーがあるか確認
3. なければ SQL で作成：
```sql
CREATE POLICY "Allow all" ON stores FOR ALL USING (true);
```

### ❌ メール通知が届かない

**対処**:
1. EmailJS の「Email History」でエラーを確認
2. Gmail の場合、「安全性の低いアプリのアクセス」設定を確認
3. 送信先メールアドレスの迷惑メールフォルダを確認

---

## 📞 サポート

問題が解決しない場合は、以下の情報と一緒にご連絡ください：

- エラーメッセージのスクリーンショット
- 実行した手順
- ブラウザの種類とバージョン

---

## 🔄 更新方法

コードを修正した場合：

1. GitHub Desktop で変更を Commit → Push
2. Vercel が自動的に再デプロイ（1〜2分）

環境変数を変更した場合：

1. Vercel の Settings → Environment Variables で変更
2. Deployments → 最新のデプロイで「...」→ **「Redeploy」**

---

以上でデプロイ完了です！ 🎉
