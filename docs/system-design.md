# NxCore System Design

NxCoreを中心としたAIシステム全体のアーキテクチャ設計書。
各コンポーネントを「製品名くん」方式で整理し、役割・責務・関係性を明確にする。

---

## NxCoreくんの現在地

> **NxCoreくんは今、「ただのプロンプト」である。**

NxCore Root Prompt v2.4 は、ThinkingPipeline・OutputContract・ExecutionPattern・
CorePrinciples といった**考え方のプロトコル**を定義しているが、
それ自体にはコードもAPIもない。LLMのコンテキストに注入されるテキストである。

### プロンプトから「OS」へ

NxCoreくんを本当の「参謀OS」にパワーアップさせるには、
**4つの下位レイヤーに実行を委譲**して、NxCoreくん自身は
**「意図 → 段取り → メタ認知ログ」のプロトコル層に専念**させる。

```
┌─────────────────────────────────────────────────────┐
│              NxCoreくん（参謀・考え方OS）               │
│  "意図を読む → 段取りを決める → メタ認知ログを残す"     │
│  ─────────────────────────────────────────────────── │
│  ThinkingPipeline / OutputContract / ExecutionPattern │
│  （プロンプト＝プロトコル層。実行コードは持たない）        │
└──────────┬──────────┬──────────┬──────────┬──────────┘
           │          │          │          │
     ┌─────▼────┐┌────▼─────┐┌──▼───────┐┌▼──────────┐
     │ ① 実行系 ││ ② 知識系 ││ ③ 安全系 ││ ④ 観察系  │
     │ 推論PL   ││ ナレッジ ││ 品質評価 ││ 可視化    │
     └──────────┘└──────────┘└──────────┘└───────────┘
```

| # | レイヤー | 何をする？ | NxCoreとの関係 |
|---|---------|-----------|---------------|
| ① | **実行系** (推論パイプライン) | NxCoreの段取りを実際のワークフローとして実行 | NxCoreが出した計画を「Chain/Workflow」として走らせる下請け |
| ② | **知識系** (RAG+KG+Semantic Layer) | ドキュメント検索・概念グラフ・用語辞書 | NxCoreの ThinkingPipeline が「どの知識を使うか」を投げる先 |
| ③ | **安全・評価系** (ガードレール+評価) | 有害コンテンツ遮断・品質スコアリング | NxCoreのメタ認知ログに安全/品質スコアを自動付与 |
| ④ | **観察系** (オブザーバビリティ) | 全テレメトリ＋メタ認知ログの統合可視化 | `nx.framing`, `nx.self_critique` 等のタグでログを紐付け |

---

## 全体構成図

```
                        [ユーザー]
                            |
                            v
              +-------------+-------------+
              |                           |
    +---------+--------+     +------------+-------+
    | Next.jsくん (Web)  |     | Flutterくん (App)  |
    +------------------+     +--------------------+
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
    ==========================================
    ||     NxCoreくん（参謀・考え方OS）       ||
    ||  意図 → 段取り → メタ認知ログ          ||
    ||  ※ プロンプト＝プロトコル層            ||
    ==========================================
         |            |           |          |
    ① 実行系     ② 知識系    ③ 安全系   ④ 観察系
         |            |           |          |
         v            v           v          v
    +---------+  +---------+  +--------+  +--------+
    |LangChain|  |RAGくん   |  |Guard-  |  |Portkey |
    |くん(監督)|  |(資料係) |  |rails   |  |くん    |
    |         |  |         |  |くん     |  |(監査)  |
    | vLLMくん |  |KGくん   |  |        |  |        |
    | (職人)  |  |(関係図) |  |Ragas   |  |        |
    |         |  |         |  |くん     |  |        |
    | Difyくん |  |Semantic |  |(テスト)|  |        |
    | (ノーコ |  |Layerくん|  |        |  |        |
    |  ード)  |  |(辞書)  |  |        |  |        |
    +---------+  +---------+  +--------+  +--------+
                      |
         +------------+------------+
         |            |            |
         v            v            v
    +--------+   +--------+  +----------+
    |Postgres|   | S3くん  |  |Pinecone  |
    |SQLくん  |   | (倉庫) |  |くん(検索)|
    +--------+   +--------+  +----------+
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

### 現状: プロンプトとしてのNxCore

NxCore Root Prompt v2.4 は**テキストとしてのプロトコル定義**であり、
LLMのシステムプロンプトに注入されることで動作する。コード・API・永続状態を持たない。

**今できること** (プロンプト単体):
- ThinkingPipeline に沿った思考の誘導
- OutputContract による出力フォーマットの強制
- SafetyAndSymptoms による自己修正の促し

**今できないこと** (外部ツール連携が必要):
- 実際のワークフロー実行（→ ①実行系に委譲）
- 外部知識の検索・参照（→ ②知識系に委譲）
- 安全性の自動検証（→ ③安全・評価系に委譲）
- 思考ログの永続化・分析（→ ④観察系に委譲）

### NxCoreくんの役割定義

- **役割**: ユーザーの意図を読み取り、「何を、どんな順番で、誰に頼むか」を決める参謀
- **本質**: **自分では何も実行しない。考え方だけを決めるメタレイヤー。**
- **責務**:
  - ThinkingPipeline（Spark → Frame → Structure → Expression）に基づくタスク分解
  - 実行計画（ExecutionPattern: align → prepare → template → pilot → evaluate）の策定
  - OutputContract（7ブロック出力）の遵守管理
  - メタ認知ログの記録（フレーミング・分解・セルフチェック）
  - SafetyAndSymptoms による異常検知と自己修正
- **参照**: [NxCore Root Prompt v2.7.4](../README.md), [SSOT Essential Pack](../specs/nx-ssot-pack-essential.yaml), [OSMonitoringSpec v1.1](../specs/os-monitoring-spec.yaml)

### NxCoreくんの思考フロー（4層委譲モデル）

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
実行計画（段取り）を確定
    |
    +--→ ① 実行系へ: 段取りをChain/Workflowとして発行
    +--→ ② 知識系へ: 「どの概念・どの指標を使うか」を投げる
    +--→ ③ 安全系へ: 入出力チェックを依頼
    +--→ ④ 観察系へ: nx.framing / nx.self_critique タグ付きログ送信
```

---

## 4. ① 実行系 — 推論パイプラインくんたち

NxCoreくんが決めた段取りを、実際のワークフローとして**実行する下回り担当**。
NxCoreは「段取りと言語プロトコル」に集中し、実行とスケーリングはここに任せる。

### LangChainくん（現場監督）

- **役割**: NxCoreくんが出した段取りを、実際の「ステップの連鎖（チェーン）」として実行する監督
- **NxCoreとの接点**:
  - NxCore側：「Step1: RAGで社内Doc検索 → Step2: 計算ツール → Step3: まとめ」と決める
  - LangChain側：そのステップをChain/Workflowとして実装し、APIで呼べるようにする
- **責務**:
  - チェーンの定義・実行・エラーハンドリング
  - プロンプトテンプレートの管理
  - マルチエージェントワークフローの制御（LangGraph）
- **技術**: LangChain, LangGraph (Python)

### Difyくん（ノーコード助手） ※選択肢

- **役割**: GUIベースでワークフローを組み立てられるノーコード/ローコード担当
- **NxCoreとの接点**: LangChainくんと同じ立場。非エンジニアでもパイプラインを編集できる
- **技術**: Dify (セルフホスト or SaaS)

### vLLMくん（LLM職人）

- **役割**: GPUの上で、テキストを高速に生成する職人
- **責務**:
  - たくさんのリクエストを同時にさばく（continuous batching）
  - PagedAttentionによるGPUメモリの効率的利用
  - 複数モデルのホスティング・切り替え
  - ストリーミング出力対応
- **技術**: vLLM, CUDA, OpenAI互換APIエンドポイント

---

## 5. ② 知識系 — ナレッジ層の子たち

NxCoreの「Knowledge Mesh」的な役割を、**RAG＋知識グラフ＋セマンティックレイヤー**に肩代わりさせる。
NxCoreのThinkingPipelineから「どの概念・どの指標を使うか」をこの層に投げるだけで済む。

### RAGくん（資料集め係）

- **役割**: 関連するドキュメントを探してくる検索担当。**ドキュメントQ&Aの即効性**を担う
- **責務**:
  - Pineconeくん・Qdrantくんたちの力を借りてベクトル検索を実行
  - クエリの前処理（HyDE、クエリ拡張）
  - 検索結果のリランキング・フィルタリング
  - チャンクの取得とコンテキストウィンドウへの最適配置
- **技術**: LangChain Retrievers, Embedding Models

### KGくん（知識グラフ係） ※将来拡張

- **役割**: 概念・エンティティ・関係を明示的なグラフ構造で管理する（GraphRAG系）
- **責務**:
  - エンティティ抽出・関係構築
  - グラフ走査による推論パスの提供
  - RAGくんとの併用によるハイブリッド検索
- **技術**: Neo4j / Amazon Neptune, GraphRAG

### Pineconeくん（意味で探す係）

- **役割**: テキストをベクトルで覚えておいて、「意味が近いもの」をすばやく出す図書館司書
- **責務**:
  - ベクトルインデックスの管理（upsert / query / delete）
  - メタデータフィルタリング
  - ネームスペースによるテナント分離
  - 近似最近傍探索（ANN）の高速実行
- **技術**: Pinecone（またはQdrant）

### Semantic Layerくん（用語辞書係）

- **役割**: 「言葉とデータの対応表」を管理する用語委員長。**メトリクス名やビジネス用語を一元管理する「意味の窓口」**
- **責務**:
  - 「売上ってどの列？」「案件ってどのID？」のマッピング定義
  - ビジネス用語 → データカラムの変換ルール管理
  - メトリクス定義の一元管理（dbt Semantic Layer）
  - RAGくんとの連携による自然言語クエリの精度向上
- **技術**: dbt Semantic Layer, メトリクス定義YAML

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

---

## 6. ③ 安全・評価系 — ガードレール＋評価ツール

NxCoreくんの「メタ認知チェック」を、人間の目だけに頼らず、
**自動ガードレールと評価器で支える**。
メタ認知ログに「安全スコア」「品質スコア」が自動で紐づくので、
後からの改善ループ（AntiFragileLoop）を回しやすい。

### Guardrailsくん（コンプラ担当）

- **役割**: 危ない内容や出しちゃいけない情報を止める安全係
- **NxCoreとの接点**: SafetyAndSymptoms の自動化版。入出力の両方をチェック
- **責務**:
  - 入力ガード: プロンプトインジェクション検知、有害コンテンツフィルタ
  - 出力ガード: PII検出・マスキング、ハルシネーション検知
  - ポリシーベースのルール管理
- **技術**: NeMo Guardrails / Guardrails AI

### Ragasくん（テスト係）

- **役割**: 回答の品質をスコアで評価するテスター
- **NxCoreとの接点**: 文脈一致・事実性・関連度をスコアリングしてNxCoreログに埋め込む
- **責務**:
  - 「この回答は質問にちゃんと答えてる？」（Answer Relevancy）
  - 「根拠ドキュメントと合ってる？」（Faithfulness）
  - 「検索結果は的確？」（Context Precision / Recall）
  - 定期的な回帰テストの実行
- **技術**: Ragas, pytest

---

## 7. ④ 観察系 — LLMオブザーバビリティ

NxCoreの「メタ認知ログ」を、他のテレメトリ（レイテンシ・エラー・コスト）と
まとめて可視化する。**「どのフレーミング・どの思考パターンのときに事故るか／コスト増えるか」**が見える。

### Portkeyくん（監査係）

- **役割**: 全リクエストの記録と可視化を行う監査官
- **NxCoreとの接点**:
  - `nx.framing`, `nx.decomposition`, `nx.self_critique` のようなカスタムタグを一緒に送る
  - NxCoreのメタ認知ログと運用テレメトリの統合ビューを提供
- **責務**:
  - どのリクエストで、どのモデル・どのプロンプトが使われたかの記録
  - レスポンスのレイテンシ・トークン使用量・コストの追跡
  - ダッシュボードによるリアルタイム可視化
  - アラート設定（エラー率・レイテンシ閾値）
- **技術**: Portkey / Truefoundry, OpenTelemetry

---

## リクエストフロー（全体の流れ）

```
1. ユーザーが Next.jsくん or Flutterくん に入力
       |
2. NGINXくん がリクエストを受け取り、認証・レート制限を確認
       |
3. FastAPIくん がリクエストをパースし、ルーティングを決定
       |
4. NxCoreくん（プロンプト層）が ThinkingPipeline で意図を分析
   → 実行計画（段取り）を確定
   → ④ Portkeyくんへ nx.framing / nx.decomposition タグ付きログ送信
       |
       +--→ ③ Guardrailsくん が入力を安全チェック
       |
5. ① LangChainくん が実行計画をチェーンとして組み立て
       |
   +---+---+
   |       |
   v       v
6a. ② RAGくん が         6b. ① vLLMくん が
   Pineconeくん/              テキスト生成
   Semantic Layerくん/
   KGくん から
   関連情報を取得
       |                     |
       +----------+----------+
                  |
7. ③ Guardrailsくん が出力を安全チェック
       |
8. ③ Ragasくん が品質スコアを計算（非同期）
   → NxCoreメタ認知ログにスコア付与
       |
9. ④ Portkeyくん が全記録（テレメトリ＋メタ認知ログ）を保存
       |
10. FastAPIくん → NGINXくん → フロントエンドくん → ユーザー
```

---

## デプロイメント構成

| レイヤー | コンポーネント | 実行環境 | スケーリング |
|---------|---|---|---|
| フロントエンド | Next.jsくん | Vercel / Kubernetes | オートスケール（CDN edge） |
| フロントエンド | Flutterくん | App Store / Play Store | N/A（クライアント側） |
| ゲートウェイ | NGINXくん | Kubernetes (Ingress) | HPA（CPU/接続数ベース） |
| ゲートウェイ | FastAPIくん | Kubernetes (Deployment) | HPA（CPU/リクエスト数ベース） |
| **プロトコル層** | **NxCoreくん** | **LLMプロンプトとして注入** | **LLMインスタンスに依存** |
| ① 実行系 | LangChainくん / Difyくん | Kubernetes (Deployment) | HPA / キューワーカー |
| ① 実行系 | vLLMくん | GPU Node (A100/H100) | GPUノード数ベース |
| ② 知識系 | RAGくん | LangChainくん内蔵 | LangChainくんと同一Pod |
| ② 知識系 | KGくん | Neo4j / Neptune | クラスターノード数 |
| ② 知識系 | Pineconeくん | Pinecone Managed | Pod数ベース |
| ② 知識系 | Semantic Layerくん | dbt Cloud / セルフホスト | ステートレス |
| ② 知識系 | PostgreSQLくん | RDS / Cloud SQL | リードレプリカ |
| ② 知識系 | S3くん | Amazon S3 | マネージド（無制限） |
| ③ 安全・評価系 | Guardrailsくん | FastAPIくん内 sidecar | FastAPIくんと連動 |
| ③ 安全・評価系 | Ragasくん | バッチジョブ / CI | 定期実行 |
| ④ 観察系 | Portkeyくん | Portkey SaaS / セルフホスト | マネージド |

---

## NxCoreくんと4層の関係性まとめ

NxCoreくんは**今はプロンプト（テキスト）**であり、LLMのコンテキストに注入されることで動作する。
自分では何も実行せず、**「意図 → 段取り → メタ認知ログ」のプロトコル層**として機能する。

4層それぞれとの関係:

| # | レイヤー | NxCoreから何を渡す？ | NxCoreに何が戻る？ |
|---|---------|--------------------|--------------------|
| ① | 実行系 | 実行計画（段取り・ステップ順序） | 実行結果・エラー情報 |
| ② | 知識系 | 「どの概念・どの指標を使うか」 | 関連ドキュメント・メトリクス値 |
| ③ | 安全・評価系 | 入出力テキスト | 安全スコア・品質スコア |
| ④ | 観察系 | `nx.framing` / `nx.self_critique` タグ付きメタ認知ログ | ダッシュボード・アラート |

### NxCoreくんがOSとして機能するための条件

NxCoreくんが「ただのプロンプト」から「OS」になるとは:

1. **段取りがAPIコールに変わる**: ThinkingPipelineの出力がLangChainくんのChain定義として実行可能になる
2. **知識アクセスが自動化される**: Frame段階で必要な知識を②知識系に自動問い合わせできる
3. **安全チェックがインライン化される**: 出力前に③安全系が自動介入する
4. **メタ認知ログが永続化される**: ④観察系でフレーミングと結果の因果関係が追跡可能になる

**この4つが揃ったとき、NxCoreくんは「考え方のプロンプト」から「考え方のOS」に進化する。**

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
19. [Truefoundry](https://www.truefoundry.com/blog/llm-observability-tools)
20. [AI Agentフレームワーク徹底比較：9つの主要ツールを実例付きで](https://qiita.com/nogataka/items/14463123b1eeb80b2a0c)
21. [Difyと主要AIエージェントフレームワーク徹底比較](https://sokuresu.ai/column/ai-agent-flamework)
22. [Compare Dify vs. LangChain in 2025](https://slashdot.org/software/comparison/Dify-vs-LangChain/)
23. [RAG Alone Won't Scale: Why Enterprise AI Agents Needs a Semantic Layer](https://www.linkedin.com/pulse/rag-alone-wont-scale-why-enterprise-ai-agents-needs-semantic-paul-ltnxc)
