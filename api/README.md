# NXCORE Kernel Server v3.10.02

SSOT-compliant WebSocket kernel server for NXCORE Cognitive OS.

## Architecture

### SSOT v3.10.02 Compliance

This server implements the complete NXCORE architecture per SSOT v3.10.02:

- **CoreModel**: Identity, authority, responsibility allocation
- **ThinkCore**: Spark → Frame → Structure → Expression pipeline
- **OutputContract**: Answer, Artifact, NextActions blocks
- **Arc**: Append-only event stream (memory ledger)
- **Arms**: Command routing system
- **DecisionState**: Append-only decision tracking
- **KernelHardening**: Two invariants enforced
  1. Mandatory Persistence of Decisions
  2. Append-Only Non-Overwritable History

### Components

#### ThinkCore Pipeline

All responses flow through 4 stages:

1. **Spark（発火）**: Detect tension, anomaly, pressure point
2. **Frame（枠組み）**: Set perspective, boundaries, goal
3. **Structure（構造）**: Logical analysis and solution construction
4. **Expression（表現）**: Optimal output via OutputContract

#### Arc Event Stream

Append-only ledger stored in `./arc/arc_stream_YYYY-MM-DD.jsonl`:

```json
{
  "timestamp": "2026-08-21T...",
  "timestamp_source": "env",
  "source": "nxcore_kernel",
  "action": "player_message",
  "payload": {...},
  "tags": ["player", "input"],
  "subtags": [],
  "refs": [],
  "prev_hash": null,
  "schema_version": "v1",
  "content_provenance": {
    "origin": "player",
    "sponsorship": "NOT_VISIBLE",
    "declaration_ref": "NOT_VISIBLE"
  }
}
```

#### Arms Commands

Built-in commands per `Arms.entries` (accepted as `/cmd` or host-local `-cmd`):

- `/quest` - Start guided dialogue flow
- `/think` - Execute ThinkCore pipeline explicitly
- `/arc` - View Arc event stream
- `/decision` - View DecisionState history
- `/ops` - CoreModel status (Arms/Arc/Tags/Profile/Mode) + runtime-visible receipts (unimplemented surfaces render NOT_VISIBLE)
- `/help` - Command table generated from Arms.entries

### Evidence-First Principle

Per `GlobalBehavior.evidenceFirst`:

- All factual assertions require visible evidence
- Missing evidence renders as `NOT_VISIBLE`
- Fabrication is forbidden

### Language Mirror

Per `GlobalBehavior.languageMirror`:

- Response language mirrors Player's input (Japanese)
- Spec keys remain English
- Internal tokens use Player's session language

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

```bash
cp .env.example .env
```

Edit `.env` and set:

```env
ANTHROPIC_API_KEY=sk-ant-...
PORT=3000
ARC_DIR=./arc
```

### 3. Start Server

**Production:**
```bash
npm start
```

**Development (with auto-reload):**
```bash
npm run dev
```

**Legacy server (pre-SSOT):**
```bash
npm run start:legacy
```

## API Endpoints

### WebSocket: `ws://localhost:3000`

**Client → Server**

```json
{
  "type": "chat",
  "message": "ユーザーのメッセージまたはコマンド"
}
```

**Server → Client**

Status update:
```json
{
  "type": "status",
  "status": "processing"
}
```

Streaming response:
```json
{
  "type": "stream",
  "text": "部分テキスト",
  "partial": "これまでの全テキスト"
}
```

Complete response:
```json
{
  "type": "complete",
  "text": "完全なレスポンス",
  "metadata": {
    "thinkCore": {...},
    "nextActions": [...]
  }
}
```

Error:
```json
{
  "type": "error",
  "error": "エラーメッセージ"
}
```

### HTTP: `GET /health`

Health check endpoint. Per `OutputContract.publicArtifactFinalization`,
public JSON uses an allowlist projection — SSOT version, kernel release,
model name, and local file paths are forbidden public content and stay on
the Player-facing WS surface (`/ops`):

```json
{
  "status": "ok",
  "service": "nxcore-kernel-server",
  "timestamp": "2026-08-21T..."
}
```

### HTTP: `GET /arc/stream`

Read Arc event stream (last 100 entries, audience-safe projection —
payloads and paths are never exposed):

```json
{
  "entryCount": 42,
  "entries": [
    { "timestamp": "...", "action": "command_receipt", "tags": ["command", "arms", "receipt"] }
  ]
}
```

## Execution Topology (ThinkCore.modeRouter)

The mode router runs before every command dispatch and records the adopted
execution topology in the command receipt:

- `adoptedMode: parallel` (`defaultModePolicy` — parallel for all Player requests)
- `adoptionPath: routerDefault`
- `topologyReceipt.executorType: mode_unavailable` — this kernel is a single
  process with no branch capability, so no concurrency is claimed
  (capabilityRule: unavailable capability MUST NOT be presented as actual
  sub-agent execution)

## Command Receipts (Arc.commandReceipt)

Every command invocation appends a receipt with the required fields
`receipt_id`, `timestamp_utc`, `command_ref`, `adoptedMode`, `adoptionPath`,
`gateDecision`, `evidenceRefs`, plus `topologyReceipt` (required whenever
`adoptedMode != single`). The Arc stream itself maintains a sha256
`prev_hash` chain across entries (`Arc.streamShape.prevHash`).

## Arc Storage

Arc events are stored in `./arc/` directory:

```
./arc/
  arc_stream_2026-08-21.jsonl
  arc_stream_2026-08-20.jsonl
  ...
```

Each line is a complete JSON object (JSONL format).

### Retention Policy

Per `Arc.streamShape.retentionMinimum`:

- **Minimum**: 6 months (P6M)
- **Recommended**: 10 years (P10Y)

## KernelHardening Invariants

### Invariant 1: Mandatory Persistence of Decisions

- Any act treated as a Decision MUST be persisted
- A Decision that is not persisted MUST NOT be treated as a Decision

### Invariant 2: Append-Only Non-Overwritable History

- Persisted Decisions MUST be append-only
- Overwrite, delete, mutation, or reordering is forbidden
- Corrections MUST be new appended entries referencing prior ones

## SSOT Metadata

- **Version**: 3.10.02
- **Built**: 2026-08-21T02:00:35.348Z
- **Tokens**: 243,015
- **Lines**: 14,454
- **Author**: Akinori Shiozawa

## License

©2025-2026 Akinori Shiozawa. All rights reserved.

**Authorized Use**: Personal / non-commercial private use only

**Commercial Use**: Requires explicit written license for:
- Organizational use
- Client-facing use
- Revenue-generating use
- Training/marketing use
- Resale/public distribution
- NXCORE-branded material use

**Contact**: ashiozawa@synap-sys.net

## Integration with NXCORE OS UI

See `../ui/README.md` for frontend integration instructions.
