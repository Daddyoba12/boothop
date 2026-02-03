// test-claude.js
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const msg = await client.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 200,
  messages: [{ role: "user", content: "Say hello to BootHop" }],
});

console.log(msg.content[0].text);
