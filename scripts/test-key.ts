import Anthropic from '@anthropic-ai/sdk';

const KEY = process.env.ANTHROPIC_API_KEY ?? '';

const claude = new Anthropic({ apiKey: KEY });

claude.messages.create({
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 10,
  messages: [{ role: 'user', content: 'ping' }],
}).then(() => {
  console.log('KEY WORKS - credit available');
}).catch((e: any) => {
  console.log('FAILED:', e.message);
});
