# Novel Agent

Novel Agent は、AI エージェントとの対話を通じて小説執筆を支援するために設計された Web アプリケーションです。

![image](https://github.com/user-attachments/assets/ac1e9576-5281-4c74-8e42-aa861df0a465)

## ✨ 機能

- **チャットエージェント:** AI エージェントと対話しながら、アイデアを出し合ったり、物語の展開を考えたり、執筆中に行き詰まったときのヒントをもらったりできます。
- **章エディタ:** 小説の各章を生成したり、内容を編集したりできます。
- **キャラクターエディタ:** 登場人物の情報を作成し、編集できます。
- **設定エディタ:** 物語の世界観や舞台設定などを定義できます。
- **システムプロンプトエディタ:** システムプロンプトを編集して AI の動作をカスタマイズできます。

## 🚀 技術スタック

- **フロントエンド:** React, TypeScript, Vite
- **UI:** Mantine, Tailwind CSS
- **AI 統合:** Langchain (Ollama および OpenAI をサポート)

## 🏁 はじめに

### すぐに試す

以下の URL からすぐにアプリケーションを試すことができます。

https://tadaoyamaoka.github.io/novel-agent/

**注意:** このデモ版で Ollama を利用する場合は、Ollama を起動する際に環境変数 `OLLAMA_ORIGINS` を設定する必要があります。これは、Web ブラウザから Ollama へのアクセスを許可するためです (CORS 設定)。

例:

```
OLLAMA_ORIGINS=*
```

### 前提条件

- Node.js (Vite/React が推奨するバージョン)
- npm または yarn

### インストールとローカルでの実行

1.  **リポジトリをクローンします:**

    ```bash
    git clone https://github.com/TadaoYamaoka/novel-agent.git
    cd novel-agent
    ```

2.  **依存関係をインストールします:**

    ```bash
    npm install
    ```

    または

    ```bash
    yarn install
    ```

3.  **開発サーバーを実行します:**
    ```bash
    npm run dev
    ```
    または
    ```bash
    yarn dev
    ```
    アプリケーションは `http://localhost:5173` (または 5173 が使用中の場合は別のポート) で利用可能になります。

## 使い方

アプリケーションが実行されたら、必要に応じて AI プロバイダー (Ollama または OpenAI) の設定を行ってください。
チャットエージェントと対話して、物語の設定、章の執筆ができます。

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下でライセンスされています。詳細については、`LICENSE` ファイルを参照してください。
