require('dotenv').config();
const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');
const { searchCatalog, getUpsellCandidates, toolSchemas, proposeOrder, getOrderStatus } = require('./tools');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const systemPrompt = fs.readFileSync(path.join(__dirname, 'agent.md'), 'utf-8');
const MODEL_NAME = process.env.GROQ_MODEL || 'qwen/qwen3.8-27b';

const availableFunctions = {
  search_catalog: (args) => searchCatalog(args.query),
  get_upsell_candidates: (args) => getUpsellCandidates(args.productId),
  propose_order: (args, context) => proposeOrder(args, context),
  get_order_status: (args) => getOrderStatus(args)
};

/**
 * Filter history to keep only clean user & assistant turns (last 6 max).
 * Strips verbose internal tool outputs and token-heavy blobs from older turns.
 */
function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  const clean = [];

  for (const msg of history) {
    if (!msg || typeof msg !== 'object') continue;
    if (msg.role === 'user' && typeof msg.content === 'string') {
      clean.push({ role: 'user', content: msg.content.trim() });
    } else if (msg.role === 'assistant' && typeof msg.content === 'string' && msg.content.trim()) {
      // Remove any leftover thinking blocks or tool metadata
      const text = msg.content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      if (text) {
        clean.push({ role: 'assistant', content: text });
      }
    }
  }

  // Keep at most the last 6 messages (3 conversation rounds) to stay well within TPM
  return clean.slice(-6);
}

/**
 * Executes a single agentic session with Groq tool calling loop.
 */
async function executeAgentTurn(sanitizedHistory, userMessage, context = {}) {
  const isAffirmative = /^(yes|confirm|proceed|continue|proceed to checkout|continue to checkout|yes please|confirm order|approve)$/i.test((userMessage || '').trim());
  const effectiveContext = {
    ...context,
    userConfirmed: Boolean(context.userConfirmed || isAffirmative)
  };

  const messages = [
    { role: 'system', content: systemPrompt },
    ...sanitizedHistory,
    { role: 'user', content: userMessage }
  ];

  const MAX_TOOL_TURNS = 6;
  let proposedOrder = null;
  let upsell = null;

  for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
    const response = await groq.chat.completions.create({
      model: MODEL_NAME,
      messages,
      tools: toolSchemas,
      tool_choice: 'auto',
      max_tokens: 600,
      temperature: 0.4
    });

    const responseMessage = response.choices[0].message;
    const toolCalls = responseMessage.tool_calls;

    // No tool calls → model produced a final text reply
    if (!toolCalls || toolCalls.length === 0) {
      const rawReply = responseMessage.content || '';
      const cleanReply = rawReply
        .replace(/<think>[\s\S]*?<\/think>/g, '') // strip Qwen reasoning blocks
        .trim();

      const nextCleanHistory = [
        ...sanitizedHistory,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: cleanReply }
      ].slice(-6);

      return {
        reply: cleanReply,
        history: nextCleanHistory,
        proposedOrder,
        upsell
      };
    }

    // Execute tool calls
    messages.push(responseMessage);

    for (const call of toolCalls) {
      const fn = availableFunctions[call.function.name];
      if (!fn) {
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify({ error: `Unknown function: ${call.function.name}` })
        });
        continue;
      }

      let args;
      try {
        args = typeof call.function.arguments === 'string'
          ? JSON.parse(call.function.arguments)
          : call.function.arguments || {};
      } catch {
        args = {};
      }

      const result = await fn(args, effectiveContext);

      if (call.function.name === 'propose_order' && result) {
        proposedOrder = {
          items: result.items || args.items,
          total: result.total,
          status: result.status,
          policy: result.policy,
          message: result.message
        };
      }

      if (call.function.name === 'get_upsell_candidates' && Array.isArray(result) && result.length > 0) {
        upsell = result[0];
      }

      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(result)
      });
    }
  }

  return {
    reply: "I found the details for your request! How would you like to proceed?",
    history: [
      ...sanitizedHistory,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: "I found the details for your request!" }
    ].slice(-6),
    proposedOrder,
    upsell
  };
}

/**
 * Top-level agent runner with automatic TPM rate-limit protection & fallback retry.
 */
async function runAgent(userMessage, conversationHistory = [], context = {}) {
  const sanitized = sanitizeHistory(conversationHistory);

  try {
    return await executeAgentTurn(sanitized, userMessage, context);
  } catch (err) {
    const isRateLimit = err.status === 413 || err.status === 429 || (err.message && err.message.includes('TPM'));
    console.warn(`[runAgent] Primary attempt failed (rateLimit=${isRateLimit}):`, err.message);

    // If rate limit or token limit was hit, retry with empty history (only current turn)
    if (isRateLimit && sanitized.length > 0) {
      console.log('[runAgent] Retrying with pruned single-turn context...');
      try {
        return await executeAgentTurn([], userMessage, context);
      } catch (retryErr) {
        console.error('[runAgent] Retry also failed:', retryErr.message);
      }
    }

    return {
      reply: "I'm right here to help! Could you please repeat what product you're looking for?",
      history: [{ role: 'user', content: userMessage }]
    };
  }
}

module.exports = { runAgent };