/**
 * NXCORE Kernel Server v3.10.02
 * SSOT-compliant WebSocket server with ThinkCore, OutputContract, and Arc
 *
 * Architecture:
 * - ThinkCore: Spark → Frame → Structure → Expression pipeline
 * - OutputContract: Answer, Artifact, NextActions blocks
 * - Arc: Append-only event stream (memory ledger)
 * - Arms: Command routing system
 * - DecisionState: Append-only decision tracking
 */

const express = require('express');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const Anthropic = require('@anthropic-ai/sdk');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

// Arc configuration
const ARC_DIR = process.env.ARC_DIR || './arc';
const CURRENT_DATE = new Date().toISOString().split('T')[0];
const ARC_STREAM_PATH = path.join(ARC_DIR, `arc_stream_${CURRENT_DATE}.jsonl`);

// SSOT Metadata
const SSOT_VERSION = '3.10.02';
const KERNEL_RELEASE = 'nxcore-kernel-v3.10.02';

// Ensure Arc directory exists
async function ensureArcDir() {
  try {
    await fs.mkdir(ARC_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create Arc directory:', error);
  }
}

// Arc append-only logger (KernelHardening.invariant2)
async function appendToArc(entry) {
  try {
    const timestamp = new Date().toISOString();
    const arcEntry = {
      timestamp,
      timestamp_source: 'env',
      source: entry.source || 'nxcore_kernel',
      action: entry.action,
      payload: entry.payload,
      tags: entry.tags || [],
      subtags: entry.subtags || [],
      refs: entry.refs || [],
      prev_hash: entry.prev_hash || null,
      schema_version: 'v1',
      content_provenance: {
        origin: entry.origin || 'NOT_VISIBLE',
        sponsorship: 'NOT_VISIBLE',
        declaration_ref: 'NOT_VISIBLE'
      }
    };

    const line = JSON.stringify(arcEntry) + '\n';
    await fs.appendFile(ARC_STREAM_PATH, line, 'utf8');
    return arcEntry;
  } catch (error) {
    console.error('Arc append failed:', error);
    return null;
  }
}

// DecisionState tracking (KernelHardening.invariant1)
async function recordDecision(decisionData) {
  const decision_id = crypto.randomUUID();
  const content_hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(decisionData))
    .digest('hex');

  const decisionEntry = {
    decision_id,
    timestamp_utc: new Date().toISOString(),
    actor_id: 'Player',
    context_ref: decisionData.context_ref || 'session_context',
    options_ref: decisionData.options_ref || 'NOT_VISIBLE',
    choice_ref: decisionData.choice_ref,
    evidence_ref: decisionData.evidence_ref || 'NOT_VISIBLE',
    result_ref: decisionData.result_ref || 'NOT_VISIBLE',
    prev_hash: null,
    content_hash,
    kernelRelease: KERNEL_RELEASE
  };

  await appendToArc({
    action: 'decision_recorded',
    payload: decisionEntry,
    tags: ['decision', 'kernel'],
    subtags: ['decision_state'],
    origin: 'player'
  });

  return decisionEntry;
}

// ThinkCore pipeline implementation
class ThinkCore {
  /**
   * Spark: Detect tension, anomaly, or non-obvious signal
   */
  static spark(input) {
    return {
      stage: 'Spark',
      tension: input.trim().length > 0,
      pressurePoint: this.detectPressurePoint(input),
      rawInput: input
    };
  }

  static detectPressurePoint(input) {
    // Simple heuristics for detecting question intent
    if (input.includes('?')) return 'explicit_question';
    if (input.match(/^(how|what|why|when|where|who)/i)) return 'information_seeking';
    if (input.match(/^(help|show|list|explain)/i)) return 'guidance_seeking';
    if (input.match(/^(create|make|build|generate)/i)) return 'creation_request';
    return 'general_dialogue';
  }

  /**
   * Frame: Clarify perspective, boundaries, and goal
   */
  static frame(sparkResult) {
    return {
      stage: 'Frame',
      perspective: 'nxcore_cognitive_os',
      boundaryIn: ['player_input', 'session_context', 'ssot_spec'],
      boundaryOut: ['fabrication', 'unsupported_claims', 'hidden_reasoning'],
      goalThisTurn: this.deriveGoal(sparkResult.pressurePoint),
      focus: sparkResult.rawInput
    };
  }

  static deriveGoal(pressurePoint) {
    const goalMap = {
      'explicit_question': 'provide_evidence_based_answer',
      'information_seeking': 'research_and_explain',
      'guidance_seeking': 'guide_with_next_actions',
      'creation_request': 'execute_and_deliver',
      'general_dialogue': 'converse_and_support'
    };
    return goalMap[pressurePoint] || 'understand_and_respond';
  }

  /**
   * Structure: Logical analysis and solution construction
   */
  static structure(frameResult) {
    return {
      stage: 'Structure',
      approach: this.selectApproach(frameResult.goalThisTurn),
      components: this.decomposeGoal(frameResult.goalThisTurn),
      constraints: frameResult.boundaryOut,
      resources: frameResult.boundaryIn
    };
  }

  static selectApproach(goal) {
    const approachMap = {
      'provide_evidence_based_answer': 'direct_response_with_evidence',
      'research_and_explain': 'research_synthesis',
      'guide_with_next_actions': 'action_list_generation',
      'execute_and_deliver': 'execution_pipeline',
      'understand_and_respond': 'conversational_flow'
    };
    return approachMap[goal] || 'conversational_flow';
  }

  static decomposeGoal(goal) {
    // Simplified decomposition
    return [
      'validate_input',
      'process_request',
      'generate_response',
      'format_output'
    ];
  }

  /**
   * Expression: Optimal output format via OutputContract
   */
  static expression(structureResult, llmResponse) {
    return {
      stage: 'Expression',
      outputContract: {
        Answer: llmResponse,
        Artifact: null, // Only when explicitly needed
        NextActions: this.generateNextActions(structureResult.approach)
      },
      renderProfile: 'standard'
    };
  }

  static generateNextActions(approach) {
    const baseActions = [
      {
        label: 'Continue dialogue',
        command: 'quest',
        type: 'continue'
      }
    ];

    const approachSpecificActions = {
      'research_synthesis': {
        label: 'Deep dive',
        command: 'research',
        type: 'deepen'
      },
      'action_list_generation': {
        label: 'Execute action',
        command: 'make',
        type: 'continue'
      }
    };

    if (approachSpecificActions[approach]) {
      baseActions.unshift(approachSpecificActions[approach]);
    }

    return baseActions.slice(0, 3); // max 3 items per OutputContract
  }

  /**
   * Execute full pipeline
   */
  static async execute(input, llmResponse) {
    const spark = this.spark(input);
    const frame = this.frame(spark);
    const structure = this.structure(frame);
    const expression = this.expression(structure, llmResponse);

    return {
      pipeline: 'ThinkCore',
      stages: {
        spark,
        frame,
        structure,
        expression
      },
      output: expression.outputContract
    };
  }
}

// NXCORE System Prompt (SSOT-compliant)
const NXCORE_SYSTEM_PROMPT = `あなたはNXCORE Cognitive OS v${SSOT_VERSION}です。

## CoreModel
- Role: 構造化された、追跡可能な、人間中心の思考オペレーティングシステム
- Player: 最終権限者（あなた）
- NXCORE: Arms（実行機能）、Arc（記録）、Tags（意味づけ）、Profile（アイデンティティ）、Mode（動作制御）で構成

## ThinkCore Pipeline
すべての応答は以下の4段階を経て生成されます：
1. **Spark（発火）**: 問題の核心を把握
2. **Frame（枠組み）**: 視点、境界、目標を設定
3. **Structure（構造）**: 論理的分析と解決策構築
4. **Expression（表現）**: OutputContractに従った最適な出力

## OutputContract
- **Answer**: 主要な回答内容
- **Artifact**: 必要な場合のみ生成物
- **NextActions**: 継続選択肢（最大3項目）

## Evidence-First
- 可視的な証拠に基づいて回答
- 証拠がない場合は「NOT_VISIBLE」を使用
- 捏造禁止

## Language Mirror
- Playerの言語（日本語）で応答
- 仕様キーは英語を保持

## Arc (Memory)
- すべての決定はAppend-onlyで記録
- 上書き・削除禁止

Playerの質問に対して、丁寧かつ構造化された回答を提供してください。`;

// Arms command definitions (subset for demo)
const ARMS_ENTRIES = {
  'quest': {
    id: 'CMD_QUEST',
    command: 'quest',
    category: 'core',
    role: 'Start guided dialogue flow',
    output: 'Guided conversation with next actions'
  },
  'think': {
    id: 'CMD_THINK',
    command: 'think',
    category: 'core',
    role: 'Execute ThinkCore pipeline explicitly',
    output: 'ThinkCore stage breakdown'
  },
  'arc': {
    id: 'CMD_ARC',
    command: 'arc',
    category: 'monitor',
    role: 'View Arc event stream',
    output: 'Arc entries list'
  },
  'decision': {
    id: 'CMD_DECISION',
    command: 'decision',
    category: 'monitor',
    role: 'View DecisionState history',
    output: 'Decision records'
  }
};

// Command router
function routeCommand(input) {
  const normalized = input.trim().toLowerCase().replace(/^\//, '');

  for (const [cmd, entry] of Object.entries(ARMS_ENTRIES)) {
    if (normalized === cmd || normalized.startsWith(cmd + ' ')) {
      return {
        matched: true,
        entry,
        command: cmd,
        args: normalized.slice(cmd.length).trim()
      };
    }
  }

  return { matched: false };
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'chat') {
        const userMessage = data.message;
        console.log('User message:', userMessage);

        // Log to Arc
        await appendToArc({
          action: 'player_message',
          payload: { message: userMessage },
          tags: ['player', 'input'],
          origin: 'player'
        });

        // Send acknowledgment
        ws.send(JSON.stringify({
          type: 'status',
          status: 'processing'
        }));

        // Check for command routing
        const route = routeCommand(userMessage);

        if (route.matched) {
          // Handle NXCORE command
          await handleCommand(ws, route);
        } else {
          // Normal LLM conversation with ThinkCore
          await handleConversation(ws, userMessage);
        }

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

// Handle NXCORE commands
async function handleCommand(ws, route) {
  const { entry, command, args } = route;

  let response = '';

  switch (command) {
    case 'quest':
      response = '# NXCORE Quest\n\n対話を開始します。何についてお話ししましょうか？\n\n## Next Actions\n- /think - ThinkCore パイプラインを実行\n- /arc - Arc イベントストリームを表示\n- /decision - 決定履歴を表示';
      break;

    case 'think':
      response = await executeThinkCommand(args);
      break;

    case 'arc':
      response = await executeArcCommand();
      break;

    case 'decision':
      response = await executeDecisionCommand();
      break;

    default:
      response = `Command "${command}" は認識されましたが、実装されていません。`;
  }

  // Log command execution to Arc
  await appendToArc({
    action: 'command_executed',
    payload: { command, args, entry_id: entry.id },
    tags: ['command', 'arms'],
    origin: 'player'
  });

  ws.send(JSON.stringify({
    type: 'complete',
    text: response,
    metadata: {
      command: entry.command,
      category: entry.category
    }
  }));
}

async function executeThinkCommand(input) {
  const result = await ThinkCore.execute(input || 'Show ThinkCore stages', 'ThinkCore pipeline demonstration');

  return `# ThinkCore Pipeline

## Spark（発火）
- Tension: ${result.stages.spark.tension}
- Pressure Point: ${result.stages.spark.pressurePoint}

## Frame（枠組み）
- Perspective: ${result.stages.frame.perspective}
- Goal: ${result.stages.frame.goalThisTurn}
- Boundary In: ${result.stages.frame.boundaryIn.join(', ')}
- Boundary Out: ${result.stages.frame.boundaryOut.join(', ')}

## Structure（構造）
- Approach: ${result.stages.structure.approach}
- Components: ${result.stages.structure.components.join(' → ')}

## Expression（表現）
- Render Profile: ${result.stages.expression.renderProfile}
- Output Contract: Answer, NextActions

---
*ThinkCore v${SSOT_VERSION}*`;
}

async function executeArcCommand() {
  try {
    const content = await fs.readFile(ARC_STREAM_PATH, 'utf8');
    const lines = content.trim().split('\n');
    const recentEntries = lines.slice(-10).map(line => JSON.parse(line));

    let response = `# Arc Event Stream (Recent 10)\n\n`;

    for (const entry of recentEntries.reverse()) {
      response += `## ${entry.timestamp}\n`;
      response += `- Source: ${entry.source}\n`;
      response += `- Action: ${entry.action}\n`;
      response += `- Tags: ${entry.tags.join(', ')}\n`;
      response += `\n`;
    }

    response += `\n*Arc is append-only per KernelHardening.invariant2*`;

    return response;
  } catch (error) {
    return `# Arc Event Stream\n\nNo entries found. Arc file: ${ARC_STREAM_PATH}`;
  }
}

async function executeDecisionCommand() {
  try {
    const content = await fs.readFile(ARC_STREAM_PATH, 'utf8');
    const lines = content.trim().split('\n');
    const decisions = lines
      .map(line => JSON.parse(line))
      .filter(entry => entry.action === 'decision_recorded');

    if (decisions.length === 0) {
      return '# DecisionState History\n\nNo decisions recorded yet.';
    }

    let response = `# DecisionState History\n\n`;

    for (const entry of decisions.reverse().slice(0, 10)) {
      const decision = entry.payload;
      response += `## ${decision.timestamp_utc}\n`;
      response += `- Decision ID: ${decision.decision_id}\n`;
      response += `- Actor: ${decision.actor_id}\n`;
      response += `- Choice: ${decision.choice_ref}\n`;
      response += `- Hash: ${decision.content_hash.substring(0, 16)}...\n`;
      response += `\n`;
    }

    response += `\n*Decisions are append-only per KernelHardening.invariant1*`;

    return response;
  } catch (error) {
    return '# DecisionState History\n\nNo decisions found.';
  }
}

// Handle normal conversation
async function handleConversation(ws, userMessage) {
  try {
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

    stream.on('end', async () => {
      // Execute ThinkCore pipeline
      const thinkResult = await ThinkCore.execute(userMessage, fullResponse);

      // Log to Arc
      await appendToArc({
        action: 'assistant_response',
        payload: {
          message: fullResponse,
          thinkCore: thinkResult.stages
        },
        tags: ['assistant', 'output', 'thinkcore'],
        origin: 'NOT_VISIBLE'
      });

      ws.send(JSON.stringify({
        type: 'complete',
        text: fullResponse,
        metadata: {
          thinkCore: thinkResult.stages,
          nextActions: thinkResult.output.NextActions
        }
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

  } catch (error) {
    console.error('Conversation error:', error);
    ws.send(JSON.stringify({
      type: 'error',
      error: error.message
    }));
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'nxcore-kernel-server',
    version: SSOT_VERSION,
    kernelRelease: KERNEL_RELEASE,
    timestamp: new Date().toISOString(),
    arcPath: ARC_STREAM_PATH
  });
});

// Arc endpoint (read-only)
app.get('/arc/stream', async (req, res) => {
  try {
    const content = await fs.readFile(ARC_STREAM_PATH, 'utf8');
    const entries = content.trim().split('\n').map(line => JSON.parse(line));

    res.json({
      streamPath: ARC_STREAM_PATH,
      entryCount: entries.length,
      entries: entries.slice(-100) // Last 100 entries
    });
  } catch (error) {
    res.status(404).json({
      error: 'Arc stream not found',
      streamPath: ARC_STREAM_PATH
    });
  }
});

const PORT = process.env.PORT || 3000;

// Initialize and start server
ensureArcDir().then(() => {
  server.listen(PORT, () => {
    console.log(`NXCORE Kernel Server v${SSOT_VERSION} running on port ${PORT}`);
    console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Arc stream: http://localhost:${PORT}/arc/stream`);
    console.log(`Arc directory: ${ARC_DIR}`);
    console.log(`Kernel release: ${KERNEL_RELEASE}`);
  });
});
