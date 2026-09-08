import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function main() {
  const msg = await claude.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 10,
    messages: [{ role: 'user', content: 'ping' }],
  });
  console.log('✓ API key has credit. Response:', msg.content[0].type === 'text' ? msg.content[0].text : 'ok');
}

main().catch(e => console.error('✗ No credit / key issue:', e.message));
