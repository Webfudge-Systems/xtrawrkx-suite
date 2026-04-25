import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { config } from '../config.js';
import { logger } from '../logger.js';

/**
 * Shared JSON-oriented completion for Anthropic / OpenAI (same provider as profile extract).
 */
export async function completeJsonWithAi({
  system,
  user,
  requestId,
  logLabel = 'ai',
  maxTokens = 8192,
  temperature = 0.2,
}) {
  if (config.AI_PROVIDER === 'openai') {
    return runOpenAiJson({
      system,
      user,
      requestId,
      logLabel,
      maxTokens,
      temperature,
    });
  }
  return runAnthropicJson({
    system,
    user,
    requestId,
    logLabel,
    maxTokens,
    temperature,
  });
}

async function runAnthropicJson({
  system,
  user,
  requestId,
  logLabel,
  maxTokens,
  temperature,
}) {
  const client = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
  const start = Date.now();

  logger.debug(`${logLabel}: Anthropic request`, {
    requestId,
    model: config.ANTHROPIC_MODEL,
    inputChars: system.length + user.length,
  });

  const response = await client.messages.create({
    model: config.ANTHROPIC_MODEL,
    max_tokens: maxTokens,
    temperature,
    system,
    messages: [{ role: 'user', content: user }],
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  const ms = Date.now() - start;
  logger.info(`${logLabel}: Anthropic response`, {
    requestId,
    ms,
    usage: response.usage,
  });

  return { text, ms, usage: response.usage };
}

async function runOpenAiJson({
  system,
  user,
  requestId,
  logLabel,
  maxTokens,
  temperature,
}) {
  const client = new OpenAI({ apiKey: config.OPENAI_API_KEY });
  const start = Date.now();

  logger.debug(`${logLabel}: OpenAI request`, {
    requestId,
    model: config.OPENAI_MODEL,
    inputChars: system.length + user.length,
  });

  const completion = await client.chat.completions.create({
    model: config.OPENAI_MODEL,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature,
    max_tokens: maxTokens,
  });

  const text = completion.choices[0]?.message?.content || '';
  const ms = Date.now() - start;

  logger.info(`${logLabel}: OpenAI response`, {
    requestId,
    ms,
    usage: completion.usage,
  });

  return { text, ms, usage: completion.usage };
}
