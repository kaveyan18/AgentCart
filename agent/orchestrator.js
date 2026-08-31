require('dotenv').config();
const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');
const { searchCatalog, getUpsellCandidates, toolSchemas, proposeOrder, getOrderStatus } = require('./tools');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const systemPrompt = fs.readFileSync(path.join(__dirname, 'agent.md'), 'utf-8');

const availableFunctions = {
  search_catalog: (args) => searchCatalog(args.query),
  get_upsell_candidates: (args) => getUpsellCandidates(args.productId),
  propose_order: (args) => proposeOrder(args),
  get_order_status: (args) => getOrderStatus(args)
};

/**
 * Proper agentic loop:
 * Keep calling Groq + executing tools until the model stops calling tools
 * and produces a plain text reply. Max 5 iterations to prevent runaway.
 */
async function runAgent(userMessage, conversationHistory = []) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  const MAX_TURNS = 8;

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const response = await groq.chat.completions.create({
      model: 'qwen/qwen3.8-27b',
      messages,
      tools: toolSchemas,
      tool_choice: 'auto'
    });

   const responseMessage = response.choices[0].message;
    const toolCalls = responseMessage.tool_calls;
    console.log(`[turn ${turn}] tool_calls: ${toolCalls ? toolCalls.map(c => c.function.name).join(', ') : 'none (final reply)'}`);

    // No tool calls → model produced a final text reply
    if (!toolCalls || toolCalls.length === 0) {
      const rawReply = responseMessage.content || '';
      const cleanReply = rawReply
        .replace(/<think>[\s\S]*?<\/think>/g, '')  // strip Qwen reasoning blocks
        .trim();
      return {
        reply: cleanReply,
        history: [...messages, responseMessage]
      };
    }

    // Execute every tool the model requested
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
        args = JSON.parse(call.function.arguments);
      } catch {
        args = {};
      }

      const result = await fn(args);
      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(result)
      });
    }
    // Loop back — let the model see the tool results and decide what to do next
  }

  return {
    reply: '[Assistant reply interrupted after too many steps.]',
    history: messages
  };
}

module.exports = { runAgent };