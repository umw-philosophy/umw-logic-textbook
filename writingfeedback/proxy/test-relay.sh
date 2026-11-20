#!/usr/bin/env bash
# Tests a deployed relay. Usage: bash test-relay.sh https://umw-argument-feedback.<you>.workers.dev
URL="${1%/}"
[ -z "$URL" ] && { echo "Usage: bash test-relay.sh <worker URL>"; exit 1; }
read -rsp "Class code you set in CLASS_CODES: " CODE; echo >&2
TMP=$(mktemp)
run() { # label, curl args...
  local label="$1"; shift
  local code; code=$(curl -s -m 40 -o "$TMP" -w '%{http_code}' "$@")
  local body; body=$(head -c 500 "$TMP" | tr '\n' ' ')
  printf '%s | %s | %s\n' "$label" "$code" "${body//$CODE/[CODE]}"
}
J='Content-Type: application/json'
echo "== 1. Relay is up (expect 200)"
run "GET /" "$URL/"
echo "== 2. Relay reaches nebulaONE (expect 200 with \"ok\") -- answers question 2"
run "POST ping" -X POST -H "$J" -d "{\"classCode\":\"$CODE\",\"task\":\"ping\"}" "$URL/v1/feedback"
echo "== 3. Wrong class code is refused (expect 403)"
run "POST ping, wrong code" -X POST -H "$J" -d '{"classCode":"not-a-code","task":"ping"}' "$URL/v1/feedback"
echo "== 4. Another site's page is refused (expect 403)"
run "POST ping, Origin evil.example" -X POST -H "$J" -H "Origin: https://evil.example" -d "{\"classCode\":\"$CODE\",\"task\":\"ping\"}" "$URL/v1/feedback"
echo "== 5. GitHub Pages preflight is allowed (expect 204 and an Access-Control-Allow-Origin line)"
curl -s -m 20 -D - -o /dev/null -X OPTIONS "$URL/v1/feedback" -H "Origin: https://umw-philosophy.github.io" \
  -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: content-type" | grep -i -E '^HTTP|access-control-allow-origin'
echo "== 6. A feedback task with no essay, and an unknown task, are refused (expect 400 bad_payload, then 400 unknown_task)"
run "POST reconstruct" -X POST -H "$J" -d "{\"classCode\":\"$CODE\",\"task\":\"reconstruct\"}" "$URL/v1/feedback"
run "POST chat (not a task)" -X POST -H "$J" -d "{\"classCode\":\"$CODE\",\"task\":\"chat\",\"messages\":[]}" "$URL/v1/feedback"
echo "== 7. Rate limit (12 quick requests with a wrong code; expect some 429s near the end)"
for i in $(seq 1 12); do
  printf '%s ' "$(curl -s -m 20 -o /dev/null -w '%{http_code}' -X POST -H "$J" -d '{"classCode":"x","task":"ping"}' "$URL/v1/feedback")"
done; echo
echo "== 8. Real model calls: reconstruct, then diagnose with a stated conclusion that differs from the essay's (expect 200, end_turn, valid JSON, and item 1 about the thesis)"
ESSAY='Our town should build a protected bike lane on Main Street. Main Street has had twelve bike crashes in two years. Protected lanes cut crashes in nearby towns. The town council meets on Tuesdays. So the lane would make the street safer.'
curl -s -m 90 -o "$TMP" -X POST -H "$J" \
  -d "$(python3 -c 'import json,sys; print(json.dumps({"classCode":sys.argv[1],"task":"reconstruct","payload":{"essay":sys.argv[2],"prompt":"Argue for a local policy."}}))' "$CODE" "$ESSAY")" "$URL/v1/feedback"
python3 - "$TMP" <<'PYIN'
import json, sys
m = json.load(open(sys.argv[1]))
if 'content' not in m: print('reconstruct | failed |', json.dumps(m)[:400]); sys.exit()
kinds = [b.get('type') for b in m['content']]
text = ''.join(b.get('text', '') for b in m['content'] if b.get('type') == 'text')
u = m.get('usage', {})
print('reconstruct | model', m.get('model'), '| stop', m.get('stop_reason'), '| blocks', kinds, '| output tokens', u.get('output_tokens'), '| cache read', u.get('cache_read_input_tokens'))
rec = json.loads(text); print('  conclusion:', rec['conclusion']); print('  premises:', [(p['id'], p['sentences'], p['implicit']) for p in rec['premises']])
json.dump(rec, open(sys.argv[1] + '.rec', 'w'))
PYIN
if [ -f "$TMP.rec" ]; then
  curl -s -m 90 -o "$TMP" -X POST -H "$J" \
    -d "$(python3 - "$CODE" "$ESSAY" "$TMP.rec" <<'PYIN'
import json, sys
rec = json.load(open(sys.argv[3]))
labels = ['C'] + [c['id'] for c in rec.get('subconclusions', [])] + [p['id'] for p in rec['premises']]
marks = {l: {'mark': 'meant', 'note': ''} for l in labels}
marks['C'] = {'mark': 'not-meant', 'note': 'My point is that Main Street is dangerous for cyclists; the lane is only one possible fix.'}
print(json.dumps({'classCode': sys.argv[1], 'task': 'diagnose', 'payload': {'essay': sys.argv[2], 'prompt': 'Argue for a local policy.', 'focus': 'writing',
  'stated': {'conclusion': 'Main Street is too dangerous for cyclists as it is.', 'reasons': ['twelve crashes in two years']}, 'readerRec': rec, 'audit': {'marks': marks, 'missing': ''}}}))
PYIN
)" "$URL/v1/feedback"
  python3 - "$TMP" <<'PYIN'
import json, sys
m = json.load(open(sys.argv[1]))
if 'content' not in m: print('diagnose | failed |', json.dumps(m)[:400]); sys.exit()
text = ''.join(b.get('text', '') for b in m['content'] if b.get('type') == 'text')
u = m.get('usage', {})
print('diagnose | stop', m.get('stop_reason'), '| output tokens', u.get('output_tokens'), '| cache write', u.get('cache_creation_input_tokens'), '| cache read', u.get('cache_read_input_tokens'))
d = json.loads(text)
for i, it in enumerate(d['items'], 1): print('  %d. %s %s\n     %s\n     %s%s' % (i, it['concept'], it['sentences'], it['observation'], it['question'], ('\n     example: ' + it['example']) if it.get('example') else ''))
print('  strength:', d['strength'])
PYIN
  rm -f "$TMP.rec"
fi
rm -f "$TMP"; unset CODE
