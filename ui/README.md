# nxcore OS UI

macOS-inspired OS interface for nxcore with real-time LLM conversation.

## Files

- `nxcore-os-standalone.html` - Standalone version with WebSocket API integration

## Usage

### 1. Start the API Server

First, make sure the API server is running:

```bash
cd ../api
npm install
npm start
```

The server will start on `http://localhost:3000` with WebSocket endpoint at `ws://localhost:3000`.

### 2. Open the UI

**Option A: Direct file open**
```bash
open nxcore-os-standalone.html
```
Or drag `nxcore-os-standalone.html` into your browser.

**Option B: Local HTTP server** (recommended)
```bash
# Using Python 3
python3 -m http.server 8080

# Using Node.js
npx http-server -p 8080
```

Then open `http://localhost:8080/nxcore-os-standalone.html`

### 3. Use the Interface

- **Commands**: Type system commands like `ops all`, `system status`, `help`
- **AI Conversation**: Type any question or message to chat with Claude API
- **Status Indicator**: Top-right shows WebSocket connection status
  - 🟢 Green = Connected to API
  - 🟡 Yellow = Connecting
  - 🔴 Red = Disconnected (check if API server is running)

## Features

- **Real-time AI conversation** via WebSocket streaming
- **macOS design language** with traffic lights, glassmorphism, and SF fonts
- **Command system** for OS operations
- **Chat history panel** for conversation logging
- **Dynamic panel system** for multi-window UI

## Requirements

- Modern browser with WebSocket support
- Node.js backend server running on localhost:3000

## Troubleshooting

**Connection Failed**
- Make sure the API server is running: `cd ../api && npm start`
- Check the server logs for errors
- Verify `ANTHROPIC_API_KEY` is set in `../api/.env`

**API Errors**
- Check your Anthropic API key is valid
- Verify you have API credits available
- Check the server logs for detailed error messages
