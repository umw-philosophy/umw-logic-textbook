// UMW Argument Feedback relay (Cloudflare Worker).
//
// Holds the nebulaONE key and forwards only the app's own requests to the
// gateway. The browser never sees the key, and it cannot send instructions:
// the relay builds every request itself from ../feedback-prompts.js.
// Stores nothing and logs no request bodies.
//
// Secrets (set with `npx wrangler secret put NAME`):
//   NEBULA_KEY    the nebulaONE API key
//   GATEWAY_URL   the gateway's /anthropic/v1/messages URL (kept out of the public repo)
//   CLASS_CODES   comma-separated class codes, one per section; rotate each semester
// Vars (wrangler.jsonc): MODEL, ALLOWED_ORIGINS

import FeedbackPrompts from '../feedback-prompts.js';

const MAX_BODY_BYTES = 60000;
const FEEDBACK_TASKS = new Set(['reconstruct', 'diagnose', 'followup']);

function pingRequest(env) {
  // Thinking off for the ping, so a tiny max_tokens still leaves room for the word.
  return { model: env.MODEL, max_tokens: 20, thinking: { type: 'disabled' }, messages: [{ role: 'user', content: 'Reply with the single word: ok' }] };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    // Browsers always send Origin on cross-site requests; command-line tests do not.
    const originOk = !origin || allowed.includes(origin);
    const cors = origin && originOk ? {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    } : {};
    const reply = (status, obj) => new Response(JSON.stringify(obj), {
      status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...cors }
    });

    if (!originOk) return reply(403, { error: 'origin_not_allowed' });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method === 'GET' && url.pathname === '/') {
      return reply(200, { ok: true, service: 'umw-argument-feedback-relay' });
    }
    if (request.method !== 'POST' || url.pathname !== '/v1/feedback') {
      return reply(404, { error: 'not_found' });
    }

    // Rate limit first, so rejected requests cost nothing downstream.
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const { success } = await env.RATE_LIMITER.limit({ key: ip });
    if (!success) {
      return reply(429, { error: 'rate_limited', message: 'Too many requests. Wait a minute and try again.' });
    }

    if (Number(request.headers.get('Content-Length') || 0) > MAX_BODY_BYTES) {
      return reply(413, { error: 'too_large' });
    }
    let body;
    try {
      const text = await request.text();
      if (text.length > MAX_BODY_BYTES) return reply(413, { error: 'too_large' });
      body = JSON.parse(text);
    } catch {
      return reply(400, { error: 'bad_json' });
    }

    const codes = (env.CLASS_CODES || '').split(',').map(s => s.trim()).filter(Boolean);
    const code = typeof body.classCode === 'string' ? body.classCode.trim() : '';
    if (!codes.length || !codes.includes(code)) return reply(403, { error: 'bad_class_code' });

    let apiBody;
    if (body.task === 'ping') apiBody = pingRequest(env);
    else if (FEEDBACK_TASKS.has(body.task)) {
      let built;
      try { built = FeedbackPrompts.buildRequest(body.task, body.payload, env.MODEL); }
      catch { return reply(400, { error: 'bad_payload', errors: ['The request could not be read.'] }); }
      if (!built.ok) return reply(400, { error: 'bad_payload', errors: built.errors });
      apiBody = built.body;
    } else return reply(400, { error: 'unknown_task' });

    let res;
    try {
      res = await fetch(env.GATEWAY_URL, {
        method: 'POST',
        headers: {
          'x-api-key': env.NEBULA_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify(apiBody)
      });
    } catch {
      // No detail: the error text can contain the gateway URL, and a misconfigured
      // secret could put something worse there.
      return reply(502, { error: 'gateway_unreachable' });
    }
    const text = await res.text();
    if (!res.ok) {
      // The gateway's error text never contains the key; pass it back for diagnosis.
      return reply(502, { error: 'gateway_error', gatewayStatus: res.status, detail: text.slice(0, 500) });
    }
    let data;
    try { data = JSON.parse(text); } catch { return reply(502, { error: 'gateway_bad_json' }); }
    return reply(200, { model: data.model, stop_reason: data.stop_reason, content: data.content, usage: data.usage });
  }
};
