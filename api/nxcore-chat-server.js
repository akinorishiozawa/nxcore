const express = require('express');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const Anthropic = require('@anthropic-ai/sdk');
const cors = require('cors');

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

// System prompt for nxcore
const NXCORE_SYSTEM_PROMPT = `あなたはnxcore（参謀OS）のAIアシスタントです。

nxcoreは、AIの思考とメモリを管理する認知フレームワークです。以下の機能を持ちます：

## ThinkingPipeline（4段階思考プロセス）
1. Spark（発火）: 問題の認識と動機付け
2. Frame（枠組み）: 問題の構造化と視点の設定
3. Structure（構造）: 論理的な分析と解決策の構築
4. Expression（表現）: 最適な形式での出力

## OutputContract（7ブロック構造化出力）
1. ForceStatus: 実行状態
2. TopicMap: トピック分類
3. Intention: 意図の明確化
4. ProcessPlan: プロセス計画
5. Answer: 回答
6. Artifact: 生成物
7. NextActions: 次のアクション

## 4層アーキテクチャ
1. Execution Layer: LangChain, vLLM, Dify
2. Knowledge Layer: RAG, Knowledge Graph, PostgreSQL, S3
3. Safety Layer: Guardrails, Ragas
4. Observation Layer: Portkey

ユーザーの質問に対して、nxcoreの設計思想に基づいて丁寧に回答してください。`;

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'chat') {
        const userMessage = data.message;
        console.log('User message:', userMessage);

        // Send acknowledgment
        ws.send(JSON.stringify({
          type: 'status',
          status: 'processing'
        }));

        // Call Claude API with streaming
        const stream = await anthropic.messages.stream({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 2048,
          system: NXCORE_SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: userMessage
            }
          ]
        });

        let fullResponse = '';

        // Stream response back to client
        stream.on('text', (text) => {
          fullResponse += text;
          ws.send(JSON.stringify({
            type: 'stream',
            text: text,
            partial: fullResponse
          }));
        });

        stream.on('end', () => {
          ws.send(JSON.stringify({
            type: 'complete',
            text: fullResponse
          }));
          console.log('Response complete');
        });

        stream.on('error', (error) => {
          console.error('Stream error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            error: error.message
          }));
        });

      } else if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }

    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        error: error.message
      }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'nxcore-chat-server',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`nxcore chat server running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
