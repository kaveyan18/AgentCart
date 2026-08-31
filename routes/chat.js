const express = require('express');
const router = express.Router();
const { runAgent } = require('../agent/orchestrator');
const { optionalAuth } = require('../middleware/requireAuth');

router.post('/', optionalAuth, async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });
    const result = await runAgent(message, history || [], { userId: req.userId || null });
    res.json(result); // { reply, history }
  } catch (err) {
    console.error('[/api/chat error]', err.message);
    res.status(500).json({ error: 'Agent error', detail: err.message });
  }
});

module.exports = router;
