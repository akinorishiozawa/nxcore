# NxCore System Design

NxCoreを中心としたAIシステム全体のアーキテクチャ設計書。
各コンポーネントを「製品名くん」方式で整理し、役割・責務・関係性を明確にする。

---

## 全体構成図

```
[ユーザー]
    |
    v
+-------------------+     +-------------------+
| Next.jsくん (Web)  |     | Flutterくん (App)  |
+-------------------+     +-------------------+
         \                       /
          \                     /
           v                   v
      +-------------------------+
      |    NGINXくん（門番）      |
      +-------------------------+
                  |
                  v
      +-------------------------+
      |  FastAPIくん（受付＆事務） |
      +-------------------------+
                  |
                  v
      +-------------------------+
      |   NxCoreくん（参謀・OS）  |
      +-------------------------+
         /        |        \
        v         v         v
+----------+ +---------+ +----------+
|LangChain | | vLLMくん | | RAGくん   |
|くん(監督) | | (職人)  | | (資料係) |
+----------+ +---------+ +----------+
                  |            |
        +---------+------------+----------+
        |         |            |          |
        v         v            v          v
  +--------+ +--------+ +----------+ +----------+
  |Postgres| | S3くん  | |Pinecone  | |Semantic  |
  |SQLくん  | | (倉庫) | |くん(検索)| |Layerくん |
  +--------+ +--------+ +----------+ +----------+

      横断的関心事（安全・品質・監視）
  +------------+ +----------+ +-----------+
  |Guardrails  | | Ragasくん | | Portkeyくん|
  |くん(安全)   | | (テスト) | | (監査)    |
  +------------+ +----------+ +-----------+
```

---

## 1. ユーザーの近くにいる子たち（フロントエンド層）

### Next.jsくん（Web担当）

- **役割**: ブラウザの画面を作るフロントエンド担当
- **責務**:
  - ユーザーの入力を集めて、NxCoreくんに渡しやすい形にする
  - SSR/SSGによる高速な初期表示
  - WebSocket経由でのストリーミングレスポンス表示
- **技術**: Next.js (App Router), React, TypeScript

### Flutterくん（スマホ担当）

- **役割**: iOS/Androidアプリの画面を作る子
- **責務**:
  - 通知やカメラ入力など、スマホならではの情報をNxCoreくんに届ける
  - ネイティブ機能（プッシュ通知、生体認証、オフライン対応）の活用
  - 単一コードベースでのクロスプラットフォーム配信
- **技術**: Flutter (Dart)

---

## 2. リクエストを受け止める子たち（ゲートウェイ層）

### NGINXくん（門番）

- **役割**: 外から来たリクエストを最初に受けるガードマン
- **責務**:
  - 変なリクエストは弾いて、ちゃんとしたやつだけ中に通す
  - TLS終端・レートリミット・IP制限
  - ロードバランシング（複数のFastAPIくんへの振り分け）
  - 静的アセットのキャッシュ配信
- **技術**: NGINX (reverse proxy)

### FastAPIくん（受付＆事務）

- **役割**: 行き先を決める事務係
- **責務**:
  - 「このリクエストはNxCore行き」「これはただDB読むだけ」みたいに行き先を決める
  - NxCoreくんと、DBやLangChainくんの間をつなぐ
  - リクエスト/レスポンスのバリデーション（Pydanticスキーマ）
  - 認証・認可（JWT / OAuth2）
  - OpenAPI仕様の自動生成
- **技術**: FastAPI (Python), Pydantic, Uvicorn

---

## 3. NxCoreくん（参謀・考え方OS）

### NxCoreくん

- **役割**: ユーザーの意図を読み取り、「何を、どんな順番で、誰に頼むか」を決める参謀
- **責務**:
  - ThinkingPipeline（Spark → Frame → Structure → Expression）に基づくタスク分解
  - 実行計画（ExecutionPattern: align → prepare → template → pilot → evaluate）の策定
  - OutputContract（7ブロック出力）の遵守管理
  - メタ認知ログの記録（フレーミング・分解・セルフチェック）
  - SafetyAndSymptoms による異常検知と自己修正
- **参照**: [NxCore Root Prompt v2.4](../README.md)

#### NxCoreくんの思考フロー

```
ユーザー入力
    |
    v
[Spark] 意図・異常・非自明なシグナルの検出
    |
    v
[Frame] 視点・立場・境界・ゴールの明確化
    |
    v
[Structure] 構造選択（リスト/ツリー/テーブル/因果モデル等）
    |
    v
[Expression] 根拠に基づく出力レンダリング
    |
    v
実行計画を LangChainくん に渡す
```

---

## 4. 実行ラインの子たち（推論パイプライン層）

### LangChainくん（現場監督）

- **役割**: NxCoreくんが出した段取りを、実際の「ステップの連鎖（チェーン）」として実行する監督
- **責務**:
  - 「まずRAGくんを呼んで、その結果をvLLMくんに渡して...」みたいな流れを管理
  - チェーンの定義・実行・エラーハンドリング
  - プロンプトテンプレートの管理
  - マルチエージェントワークフローの制御（LangGraph）
- **技術**: LangChain, LangGraph (Python)

### vLLMくん（LLM職人）

- **役割**: GPUの上で、テキストを高速に生成する職人
- **責務**:
  - たくさんのリクエストを同時にさばく（continuous batching）
  - PagedAttentionによるGPUメモリの効率的利用
  - 複数モデルのホスティング・切り替え
  - ストリーミング出力対応
- **技術**: vLLM, CUDA, OpenAI互換APIエンドポイント

### RAGくん（資料集め係）

- **役割**: 関連するドキュメントを探してくる検索担当
- **責務**:
  - Pineconeくん・Qdrantくんたちの力を借りてベクトル検索を実行
  - クエリの前処理（HyDE、クエリ拡張）
  - 検索結果のリランキング・フィルタリング
  - チャンクの取得とコンテキストウィンドウへの最適配置
- **技術**: LangChain Retrievers, Embedding Models

---

## 5. 知識・データを持ってる子たち（データ層）

### PostgreSQLくん（台帳係）

- **役割**: ちゃんとした表データをきっちり保存する経理・総務タイプ
- **責務**:
  - ユーザー、プロジェクト、タスクなどの構造化データ管理
  - トランザクション保証（ACID）
  - マイグレーション管理（Alembic）
  - 監査ログの永続化
- **技術**: PostgreSQL, SQLAlchemy, Alembic

### S3くん（倉庫係）

- **役割**: 形バラバラのファイルを大量に預かる倉庫番
- **責務**:
  - PDF・画像・ログファイルなどの非構造化データの保存
  - 署名付きURLによるセキュアなアクセス提供
  - ライフサイクルポリシーによるコスト最適化
  - バージョニングによる誤削除防止
- **技術**: Amazon S3（またはMinIO互換ストレージ）

### Pineconeくん（意味で探す係）

- **役割**: テキストをベクトルで覚えておいて、「意味が近いもの」をすばやく出す図書館司書
- **責務**:
  - ベクトルインデックスの管理（upsert / query / delete）
  - メタデータフィルタリング
  - ネームスペースによるテナント分離
  - 近似最近傍探索（ANN）の高速実行
- **技術**: Pinecone（またはQdrant）

### Semantic Layerくん（用語辞書係）

- **役割**: 「言葉とデータの対応表」を管理する用語委員長
- **責務**:
  - 「売上ってどの列？」「案件ってどのID？」のマッピング定義
  - ビジネス用語 → データカラムの変換ルール管理
  - メトリクス定義の一元管理（dbt Semantic Layer）
  - RAGくんとの連携による自然言語クエリの精度向上
- **技術**: dbt Semantic Layer, メトリクス定義YAML

---

## 6. 安全・品質・監視の子たち（横断的関心事層）

### Guardrailsくん（コンプラ担当）

- **役割**: 危ない内容や出しちゃいけない情報を止める安全係
- **責務**:
  - 入力ガード: プロンプトインジェクション検知、有害コンテンツフィルタ
  - 出力ガード: PII検出・マスキング、ハルシネーション検知
  - ポリシーベースのルール管理
  - NxCoreくんの SafetyAndSymptoms と連携した異常対応
- **技術**: NeMo Guardrails / Guardrails AI

### Ragasくん（テスト係）

- **役割**: 回答の品質をスコアで評価するテスター
- **責務**:
  - 「この回答は質問にちゃんと答えてる？」（Answer Relevancy）
  - 「根拠ドキュメントと合ってる？」（Faithfulness）
  - 「検索結果は的確？」（Context Precision / Recall）
  - 定期的な回帰テストの実行
- **技術**: Ragas, pytest

### Portkeyくん（監査係）

- **役割**: 全リクエストの記録と可視化を行う監査官
- **責務**:
  - どのリクエストで、どのモデル・どのプロンプトが使われたかの記録
  - レスポンスのレイテンシ・トークン使用量・コストの追跡
  - ダッシュボードによるリアルタイム可視化
  - アラート設定（エラー率・レイテンシ閾値）
- **技術**: Portkey, OpenTelemetry

---

## リクエストフロー（全体の流れ）

```
1. ユーザーが Next.jsくん or Flutterくん に入力
       |
2. NGINXくん がリクエストを受け取り、認証・レート制限を確認
       |
3. FastAPIくん がリクエストをパースし、ルーティングを決定
       |
4. NxCoreくん が ThinkingPipeline で意図を分析し、実行計画を策定
       |
5. LangChainくん が実行計画をチェーンとして組み立て
       |
   +---+---+
   |       |
   v       v
6a. RAGくん が          6b. vLLMくん が
   Pineconeくん/           テキスト生成
   Semantic Layerくん
   から関連情報を取得
       |                     |
       +----------+----------+
                  |
7. Guardrailsくん が出力を安全チェック
       |
8. Ragasくん が品質スコアを計算（非同期）
       |
9. Portkeyくん が全記録を保存
       |
10. FastAPIくん → NGINXくん → フロントエンドくん → ユーザー
```

---

## デプロイメント構成

| コンポーネント | 実行環境 | スケーリング |
|---|---|---|
| Next.jsくん | Vercel / Kubernetes | オートスケール（CDN edge） |
| Flutterくん | App Store / Play Store | N/A（クライアント側） |
| NGINXくん | Kubernetes (Ingress) | HPA（CPU/接続数ベース） |
| FastAPIくん | Kubernetes (Deployment) | HPA（CPU/リクエスト数ベース） |
| NxCoreくん | FastAPIくん内蔵モジュール | FastAPIくんと同一Pod |
| LangChainくん | Kubernetes (Deployment) | HPA / キューワーカー |
| vLLMくん | GPU Node (A100/H100) | GPUノード数ベース |
| RAGくん | LangChainくん内蔵 | LangChainくんと同一Pod |
| PostgreSQLくん | RDS / Cloud SQL | リードレプリカ |
| S3くん | Amazon S3 | マネージド（無制限） |
| Pineconeくん | Pinecone Managed | Pod数ベース |
| Semantic Layerくん | dbt Cloud / セルフホスト | ステートレス |
| Guardrailsくん | FastAPIくん内 sidecar | FastAPIくんと連動 |
| Ragasくん | バッチジョブ / CI | 定期実行 |
| Portkeyくん | Portkey SaaS / セルフホスト | マネージド |

---

## NxCoreくんと他コンポーネントの関係性まとめ

NxCoreくんは **「考え方のOS」** として、以下の関係性を持つ:

- **上流**（インプット）: FastAPIくんからユーザーリクエストを受け取る
- **下流**（アウトプット）: LangChainくんに実行計画を渡す
- **参照**（知識）: PostgreSQLくん・S3くん・Pineconeくん・Semantic Layerくんから情報を引き出す
- **制約**（安全）: Guardrailsくんの判定に従い、出力を制御する
- **評価**（品質）: Ragasくんによるスコアを AntiFragileLoop として改善に活かす
- **記録**（監査）: Portkeyくんに全ての思考・判断ログを送る

NxCoreくんは自分でテキストを生成するわけではなく、**「何を考え、何を誰に頼み、どう組み立てるか」を決めるメタレイヤー**として機能する。

---

## 参考文献

1. [AI System Design: A Complete Guide (2026)](https://www.systemdesignhandbook.com/guides/ai-system-design/)
2. [Building the Future with GenAI: A Scalable Architecture for AI-Powered Applications](https://www.abhisheksisodia.com/blog/tech-stack-genai-app)
3. [System Design for AI Applications: From Request to Response](https://www.linkedin.com/pulse/system-design-ai-applications-from-request-response-palash-wvglc)
4. [Building Multi-Agent Workflows with LangChain](https://www.ema.co/additional-blogs/addition-blogs/multi-agent-workflows-langchain-langgraph)
5. [What Is LangChain? A Guide for Modern AI Workflows](https://www.netcomlearning.com/blog/what-is-lang-chain)
6. [LangChain overview - Docs by LangChain](https://docs.langchain.com/oss/python/langchain/overview)
7. [Mastering LLM Techniques: Inference Optimization](https://developer.nvidia.com/blog/mastering-llm-techniques-inference-optimization/)
8. [High-performance LLM inference](https://modal.com/docs/guide/high-performance-llm-inference)
9. [RAG vs. Knowledge Graph vs. Semantic Layer: Enterprise AI](https://www.getgalaxy.io/articles/rag-vs-knowledge-graph-vs-semantic-layer-enterprise-ai)
10. [Demo: Build an AI Application with Your Private Data Using Astra DB & LangFlow](https://www.youtube.com/watch?v=xbaw-JaAU0U)
11. [database.build v2: Bring-your-own-LLM](https://supabase.com/blog/database-build-v2)
12. [dbt Semantic LayerとSteepの連携ガイド](https://zenn.dev/tanuhack/articles/bc97447699d1bc)
13. [How RAG and Semantic Layers Work Together in Enterprise AI](https://www.dawiso.com/blog-post/how-rag-and-semantic-layers-work-together-in-enterprise-ai-with-dawiso-context-layer)
14. [Deploying Enterprise LLM Applications: Inference, Guardrails, Observability](https://www.swept.ai/post/deploying-enterprise-llm-applications-inference-guardrails-observability)
15. [Fiddler Guardrails: Safeguarding LLM Applications](https://www.fiddler.ai/blog/introducing-fiddler-guardrails)
16. [The Complete Guide to LLM Evaluation Tools in 2026](https://futureagi.substack.com/p/the-complete-guide-to-llm-evaluation-c82)
17. [The complete guide to LLM observability for 2026](https://portkey.ai/blog/the-complete-guide-to-llm-observability)
18. [Best LLM Observability Tools in 2025](https://www.firecrawl.dev/blog/best-llm-observability-tools)
19. [1. Truefoundry](https://www.truefoundry.com/blog/llm-observability-tools)
