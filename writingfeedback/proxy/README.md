# Argument Feedback relay

A Cloudflare Worker that holds the nebulaONE key and forwards only the Argument Feedback app's own requests to the gateway. See `docs/WRITING_FEEDBACK_APP_PLAN.md`, "The relay." It stores nothing and logs no request bodies.

## What it accepts

`POST /v1/feedback` with JSON `{classCode, task, ...}`. Today the only working task is `ping`, a one-word test call. `reconstruct`, `diagnose`, and `followup` return 501 until `feedback-prompts.js` exists. Any other task is refused. `GET /` is a health check.

Limits: allowed browser origins only (`ALLOWED_ORIGINS`), a valid class code, 10 requests per minute per IP, 60 KB per request.

## Deploy (from your own Terminal)

Needs Node.js (`node -v`; if missing, install the LTS from nodejs.org) and a free Cloudflare account.

```
cd /Users/michaelreno/Projects/umw-logic-textbook/writingfeedback/proxy
npx wrangler login          # opens the browser to sign in to Cloudflare
npx wrangler deploy         # first time: asks you to choose a workers.dev subdomain; prints the Worker URL
npx wrangler secret put NEBULA_KEY     # paste the nebulaONE key (hidden)
npx wrangler secret put GATEWAY_URL    # paste the gateway's /anthropic/v1/messages URL
npx wrangler secret put CLASS_CODES    # e.g. a test code; later one per section, comma-separated
bash test-relay.sh https://umw-argument-feedback.<subdomain>.workers.dev
```

Each `secret put` redeploys the Worker, so no second `deploy` is needed. Rotate class codes by running `secret put CLASS_CODES` again.

## Remove

`npx wrangler delete` removes the Worker and its secrets.
