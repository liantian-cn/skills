import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { main, QccClient, QccError, readReply } from './qcc.ts';

type Request = { id?: number; method: string; params?: Record<string, unknown> };
function reply(id: number | undefined, result: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify({ jsonrpc: '2.0', id, result }), { headers: { 'Content-Type': 'application/json', ...headers } });
}
const tool = { name: 'get_example', inputSchema: { type: 'object', required: ['searchKey'] } };

test('SSE handles split UTF-8, CRLF, notifications, multiline data and an open stream without changing numeric text', async () => {
  const raw = '{"jsonrpc":"2.0","id":7,\n"result":{"name":"企业","ratio":"47.6955%","large":9007199254740993,"decimal":1.2300}}';
  const bytes = new TextEncoder().encode(': heartbeat\r\ndata: {"jsonrpc":"2.0","method":"notice"}\r\n\r\nevent: message\r\ndata: ' + raw.replace('\n', '\r\ndata: ') + '\r\n\r\n');
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) { for (const byte of bytes) controller.enqueue(new Uint8Array([byte])); },
    cancel() { cancelled = true; },
  });
  const parsed = await readReply(new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } }), 7);
  assert.equal(parsed.raw, raw);
  assert.equal(parsed.value.name, '企业');
  assert.equal(cancelled, true);
});

test('JSON and SSE failures are distinct from empty successful business results', async () => {
  assert.deepEqual((await readReply(reply(1, { content: [], isError: false }), 1)).value.content, []);
  await assert.rejects(readReply(new Response('', { status: 401 }), 1), { code: 'HTTP_401' });
  await assert.rejects(readReply(new Response('{broken'), 1), { code: 'INVALID_RESPONSE' });
  await assert.rejects(readReply(reply(2, {}), 1), { code: 'INVALID_RESPONSE' });
  await assert.rejects(readReply(new Response('data: {"jsonrpc":"2.0","id":1,"error":{"code":300012,"message":"未授权"}}\n\n', { headers: { 'Content-Type': 'text/event-stream' } }), 1), { code: 300012, message: '未授权' });
});

test('session headers, initialization, paginated tool discovery and a single business call', async () => {
  const seen: Request[] = [];
  const fetcher: typeof fetch = async (url, init) => {
    assert.equal(url, 'https://agent.qcc.com/mcp/company/stream');
    const headers = new Headers(init?.headers);
    assert.equal(headers.get('Authorization'), 'Bearer fixture-key');
    assert.equal(init?.redirect, 'error');
    if (init?.method === 'DELETE') return new Response(null, { status: 204 });
    const body = JSON.parse(init?.body as string) as Request;
    seen.push(body);
    if (body.method === 'initialize') return reply(body.id, { protocolVersion: '2024-11-05' }, { 'Mcp-Session-Id': 'session-1' });
    assert.equal(headers.get('Mcp-Session-Id'), 'session-1');
    assert.equal(headers.get('MCP-Protocol-Version'), '2024-11-05');
    if (body.method === 'notifications/initialized') return new Response(null, { status: 202 });
    if (body.method === 'tools/list') return reply(body.id, body.params?.cursor ? { tools: [tool] } : { tools: [], nextCursor: 'second' });
    assert.equal(body.method, 'tools/call');
    assert.deepEqual(body.params, { name: 'get_example', arguments: { searchKey: '某某有限公司' } });
    return reply(body.id, { content: [{ type: 'text', text: '{"count":0}' }] });
  };
  const client = new QccClient('company', 'fixture-key', { fetcher });
  await client.initialize();
  await client.call('get_example', { searchKey: '某某有限公司' });
  await client.close();
  assert.deepEqual(seen.map(x => x.method), ['initialize', 'notifications/initialized', 'tools/list', 'tools/list', 'tools/call']);
});

test('unavailable tools and missing required fields never trigger a business call', async () => {
  let calls = 0;
  const client = new QccClient('company', 'fixture', { fetcher: async (_url, init) => {
    calls++;
    const body = JSON.parse(init?.body as string) as Request;
    assert.equal(body.method, 'tools/list');
    return reply(body.id, { tools: [tool] });
  } });
  await assert.rejects(client.call('get_missing', {}), { code: 'TOOL_UNAVAILABLE' });
  await assert.rejects(client.call('get_example', {}), { code: 'MISSING_PARAMETER' });
  assert.equal(calls, 2);
});

test('resource pagination stops on repeated cursors', async () => {
  const client = new QccClient('company', 'fixture', { fetcher: async (_url, init) => {
    const body = JSON.parse(init?.body as string) as Request;
    return reply(body.id, { resources: [], nextCursor: 'same' });
  } });
  await assert.rejects(client.list('resources'), { code: 'PAGINATION_LOOP' });
});

test('network errors and timeouts do not retry requests', async () => {
  for (const error of [new TypeError('fetch failed'), new DOMException('timeout', 'TimeoutError')]) {
    let calls = 0;
    const client = new QccClient('company', 'fixture', { fetcher: async () => { calls++; throw error; } });
    await assert.rejects(client.request('tools/list'), { code: error.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK_ERROR' });
    assert.equal(calls, 1);
  }
});

test('timeout interrupts a response body that never completes', async () => {
  let calls = 0;
  const client = new QccClient('company', 'fixture', { timeoutMs: 10, fetcher: async (_url, init) => {
    calls++;
    const stream = new ReadableStream<Uint8Array>({ start(controller) {
      init?.signal?.addEventListener('abort', () => controller.error(new DOMException('timeout', 'TimeoutError')), { once: true });
    } });
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
  } });
  // AbortSignal timers are unref'ed; keep the test alive until the simulated request settles.
  const timer = setTimeout(() => {}, 1000);
  try { await assert.rejects(client.request('tools/list'), { code: 'TIMEOUT' }); }
  finally { clearTimeout(timer); }
  assert.equal(calls, 1);
});

test('CLI rejects missing key, non-object JSON, malformed JSON and unknown arguments without network access', () => {
  const script = fileURLToPath(new URL('./qcc.ts', import.meta.url));
  const env = { ...process.env };
  delete env.QCC_API_KEY;
  for (const [input, code] of [['{}', 'MISSING_API_KEY'], ['[]', 'INVALID_PARAMS'], ['null', 'INVALID_PARAMS'], ['"text"', 'INVALID_PARAMS'], ['{', 'INVALID_JSON']]) {
    const result = spawnSync(process.execPath, [script, 'call', 'company', 'get_example', '--params-file', '-'], { input, env, encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stderr).error.code, code);
  }
  const result = spawnSync(process.execPath, [script, 'describe', 'company', 'get_example', '--unexpected', 'x'], { env, encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.stderr).error.code, 'USAGE');
  const removedService = spawnSync(process.execPath, [script, 'describe', 'history', 'get_example'], { env, encoding: 'utf8' });
  assert.equal(removedService.status, 1);
  assert.equal(JSON.parse(removedService.stderr).error.code, 'UNKNOWN_SERVICE');
});

test('CLI preserves tool error output, redacts keys, and refuses to overwrite output files', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'qcc-test-'));
  const params = join(directory, 'params.json');
  const output = join(directory, 'result.json');
  const oldKey = process.env.QCC_API_KEY;
  process.env.QCC_API_KEY = 'test-secret-value';
  t.mock.method(process.stdout, 'write', () => true);
  t.mock.method(globalThis, 'fetch', async (_url: unknown, init?: RequestInit) => {
    const body = JSON.parse(init?.body as string) as Request;
    if (body.method === 'initialize') return reply(body.id, { protocolVersion: '2024-11-05' });
    if (body.method === 'notifications/initialized') return new Response(null, { status: 202 });
    if (body.method === 'tools/list') return reply(body.id, { tools: [tool] });
    return reply(body.id, { isError: true, content: [{ type: 'text', text: 'denied test-secret-value' }] });
  });
  try {
    await writeFile(params, '\uFEFF{"searchKey":"某某有限公司"}');
    const argv = ['call', 'company', 'get_example', '--params-file', params, '--out', output];
    await assert.rejects(main(argv), { code: 'TOOL_ERROR' });
    const saved = await readFile(output, 'utf8');
    assert.match(saved, /\[REDACTED\]/);
    assert.equal(saved.includes('test-secret-value'), false);
    await assert.rejects(main(argv), { code: 'EEXIST' });
    assert.equal(await readFile(output, 'utf8'), saved);
  } finally {
    if (oldKey === undefined) delete process.env.QCC_API_KEY; else process.env.QCC_API_KEY = oldKey;
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
    assert.ok(basename(directory).startsWith('qcc-test-'));
    await rm(directory, { recursive: true, force: true });
  }
});

test('constructor rejects missing credentials before sending requests', () => {
  assert.throws(() => new QccClient('company', '  '), QccError);
});
