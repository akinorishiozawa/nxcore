# NXCORE OS UI v3.10.02

macOS-inspired SSOT-compliant interface for NXCORE Cognitive OS.

## SSOT v3.10.02 Compliance

This UI properly visualizes all NXCORE components per SSOT v3.10.02:

### ThinkCore Visualization

Real-time display of the 4-stage thinking pipeline:

```
Spark → Frame → Structure → Expression
```

Each stage shows:
- **Spark**: Pressure point detection
- **Frame**: Goal, perspective, boundaries
- **Structure**: Approach and components
- **Expression**: OutputContract rendering

### OutputContract Rendering

Three-block structure:

1. **Answer**: Primary response content
2. **Artifact**: Generated deliverables (when needed)
3. **NextActions**: Continuation choices (max 3 items)

### Arc Event Stream

Browse append-only memory ledger:

- Timestamp + source + action
- Tags and subtags
- Content provenance tracking

### Arms Commands

Execute NXCORE commands via `/` prefix:

- `/quest` - Start guided dialogue
- `/think <text>` - Explicit ThinkCore execution
- `/arc` - View Arc stream
- `/decision` - View DecisionState history

## Files

### nxcore-os-v3.html

SSOT-compliant standalone interface with:

- ✅ ThinkCore pipeline visualization
- ✅ OutputContract rendering
- ✅ Arc event stream panel
- ✅ DecisionState history panel
- ✅ Next Actions interactive buttons
- ✅ WebSocket real-time streaming
- ✅ macOS design language
- ✅ Dark/light theme support

### nxcore-os-standalone.html (Legacy)

Pre-SSOT interface (v1.0):

- Basic command system
- Simple AI conversation
- No ThinkCore visualization
- No Arc integration

## Usage

### 1. Start NXCORE Kernel Server

```bash
cd ../api
npm install
npm start
```

Server should display:

```
NXCORE Kernel Server v3.10.02 running on port 3000
WebSocket endpoint: ws://localhost:3000
Health check: http://localhost:3000/health
Arc stream: http://localhost:3000/arc/stream
```

### 2. Open UI

**Option A: Direct file open**

```bash
open nxcore-os-v3.html
```

Or drag `nxcore-os-v3.html` into your browser.

**Option B: Local HTTP server** (recommended)

```bash
# Using Python 3
python3 -m http.server 8080

# Using Node.js
npx http-server -p 8080
```

Then open: `http://localhost:8080/nxcore-os-v3.html`

### 3. Interface Overview

#### Header

- **Logo**: NXCORE OS v3.10.02
- **Kernel Status**: Connection indicator (green/yellow/red)
- **Arc Status**: Event count

#### Main Area

Multi-panel grid layout:

1. **対話履歴 (Chat History)**: Player ↔ NXCORE conversation
2. **ThinkCore Pipeline**: 4-stage visualization
3. **Next Actions**: Interactive continuation buttons

Additional panels created on-demand:

- Arc event stream viewer
- DecisionState history viewer

#### Command Bar

- **Input field**: Type commands or questions
- **送信 button**: Submit (or press Enter)

### 4. Command Examples

```bash
# Start guided dialogue
/quest

# Execute ThinkCore explicitly
/think nxcoreの設計思想

# View Arc event stream
/arc

# View DecisionState history
/decision

# Normal conversation (no command prefix)
nxcoreとは何ですか？
```

## Design Language

### macOS Aesthetic

Following Apple's Human Interface Guidelines:

- **Typography**: SF Pro Text, SF Mono
- **Colors**: System accent colors (blue, purple, green, red, yellow)
- **Glassmorphism**: Backdrop blur + transparency
- **Traffic Lights**: Red, yellow, green window controls
- **Shadows**: Layered elevation

### Theme Support

Automatic dark/light theme switching:

- **Dark mode**: Default for `prefers-color-scheme: dark`
- **Light mode**: Adapts to `prefers-color-scheme: light`
- **Manual override**: `data-theme` attribute support

### Color Palette

**Dark Theme:**
```css
--bg-space: #1e1e1e
--bg-panel: rgba(44, 44, 44, 0.85)
--accent-blue: #007AFF
--accent-purple: #BF5AF2
--accent-green: #30D158
```

**Light Theme:**
```css
--bg-space: #f5f5f7
--bg-panel: rgba(255, 255, 255, 0.85)
--accent-blue: #007AFF
--accent-purple: #AF52DE
--accent-green: #34C759
```

## SSOT Principles Enforced

### Evidence-First

- All claims visible in UI are evidence-backed
- Missing evidence shows `NOT_VISIBLE`
- No fabricated timestamps or hashes

### Language Mirror

- UI labels in Japanese (Player's language)
- Spec keys (Spark, Frame, etc.) in English
- Consistent bilingual display

### Append-Only Display

- Arc entries show chronological append-only sequence
- No delete/edit UI for history
- DecisionState shows immutable chain

## Technical Details

### WebSocket Protocol

See `../api/README.md` for complete protocol specification.

### Browser Compatibility

- **Required**: Modern browser with ES6+ support
- **Recommended**: Chrome 90+, Safari 14+, Firefox 88+
- **WebSocket**: Required for real-time communication
- **localStorage**: Used for per-viewer preferences (optional)

### CSP Constraints

When deployed as Claude Artifact:

- ❌ External API calls blocked
- ❌ WebSocket to external hosts blocked
- ✅ Inline CSS/JS allowed
- ✅ Google Fonts allowed

**Solution**: Use standalone HTML file (this directory) instead of Artifact for WebSocket integration.

## Troubleshooting

### "Kernel未接続" (Kernel Not Connected)

1. Check server is running: `cd ../api && npm start`
2. Verify port 3000 is not in use
3. Check browser console for WebSocket errors
4. Verify `.env` has valid `ANTHROPIC_API_KEY`

### ThinkCore Panel Not Showing

- ThinkCore panel appears only when metadata is received
- Try sending a normal question (not a command)
- Check server logs for ThinkCore execution

### Arc/Decision Commands Show "No entries"

- Commands work but Arc file doesn't exist yet
- Send a few messages first to populate Arc
- Check `../api/arc/` directory for JSONL files

### Dark/Light Theme Not Switching

- Browser's `prefers-color-scheme` controls automatic switching
- Use OS theme settings or browser developer tools
- Add `data-theme="dark"` or `data-theme="light"` to `<html>` for manual override

## License

©2025-2026 Akinori Shiozawa. All rights reserved.

See `../api/README.md` for license details.
