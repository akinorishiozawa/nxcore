# nxcore Chat Server

WebSocket server for real-time LLM conversation in nxcore OS interface.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Add your Anthropic API key to `.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

## Running

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server will start on `http://localhost:3000` with WebSocket endpoint at `ws://localhost:3000`.

## API Endpoints

- `GET /health` - Health check endpoint
- `ws://localhost:3000` - WebSocket endpoint for chat

## WebSocket Protocol

### Client → Server

```json
{
  "type": "chat",
  "message": "ユーザーのメッセージ"
}
```

### Server → Client

**Status Update:**
```json
{
  "type": "status",
  "status": "processing"
}
```

**Streaming Response:**
```json
{
  "type": "stream",
  "text": "テキストの一部",
  "partial": "これまでの全テキスト"
}
```

**Complete Response:**
```json
{
  "type": "complete",
  "text": "完全なレスポンス"
}
```

**Error:**
```json
{
  "type": "error",
  "error": "エラーメッセージ"
}
```

## Integration with nxcore OS UI

The nxcore OS artifact connects to this server via WebSocket for real-time AI conversation. Make sure the server is running before using the chat feature in the UI.
