import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { formatResult, main, operations, PkuError, query, validateArguments } from './pku-law.ts';

type RpcBody = { id?: number; method: string; params?: Record<string, unknown> };
const law = { article: '第五百八十五条 原文', title: '中华人民共和国民法典', timeliness: '现行有效', url: 'https://www.pkulaw.com/example' };
const articleArgs = { title: '中华人民共和国民法典', number: '第五百八十五条' };
const key = 'test-secret-not-a-real-key';
const response = (id: number | undefined, result: unknown) => Response.json({ jsonrpc: '2.0', id, result });

function mockFetch(call: (body: RpcBody, init: RequestInit) => Response | Promise<Response>): typeof fetch {
  return async (_input, init) => {
    const body = JSON.parse(String(init?.body)) as RpcBody;
    if (body.method === 'initialize') {
      return new Response(JSON.stringify({ jsonrpc: '2.0', id: body.id,
        result: { protocolVersion: '2024-11-05' } }), {
        headers: { 'content-type': 'application/json', 'mcp-session-id': 'test-session' },
      });
    }
    const headers = init!.headers as Record<string, string>;
    assert.equal(headers['Mcp-Session-Id'], 'test-session');
    assert.equal(headers['MCP-Protocol-Version'], '2024-11-05');
    if (body.method === 'notifications/initialized') return new Response(null, { status: 202 });
    return call(body, init!);
  };
}

test('validates operation arguments before network access', async () => {
  const invalid: [string, unknown][] = [
    ['unknown', {}], ['toString', {}], ['get_article', {}], ['get_article', { ...articleArgs, number: 585 }],
    ['get_article', { ...articleArgs, typo: true }], ['get_law_list', {}],
    ['search_case', { text: '合同', size: 21 }], ['search_case', { text: '合同', case_type: 'bad' }],
    ['get_law_item_content', { title: '民法典', tiao_num: '585' }],
    ['get_linked_content', { message: '' }], ['law_recognition', { text: ' ' }],
    ['adjust_provisions', { userlaw: [{ title: '民法典', article_number: 585 }] }],
  ];
  for (const [name, args] of invalid) {
    await assert.rejects(query(name, args, { apiKey: key, fetchImpl: async () => { throw new Error('network must not run'); } }),
      (error: unknown) => error instanceof PkuError && error.code === 'ARGUMENT');
  }
  validateArguments('get_law_item_content', { title: '刑法', tiao_num: 133.1 });
  validateArguments('get_case_list', { fulltext: '合同', documentAttr: ['判决书'] });
  await assert.rejects(query('get_article', articleArgs, { apiKey: '' }), { code: 'AUTH' });
});

test('sends exact name and arguments with auth/session headers, without tools/list', async () => {
  const methods: string[] = [];
  const base = mockFetch((body, init) => {
    assert.equal(body.method, 'tools/call');
    assert.deepEqual(body.params, { name: 'get_article', arguments: articleArgs });
    assert.equal((init.headers as Record<string, string>).Authorization, `Bearer ${key}`);
    assert.equal(init.redirect, 'error');
    return response(body.id, { structuredContent: law });
  });
  const fetchImpl: typeof fetch = async (input, init) => {
    assert.equal(input, 'https://apim-gateway.pkulaw.com/mcp-law-search-service');
    methods.push(JSON.parse(String(init?.body)).method);
    return base(input, init);
  };
  const result = await query('get_article', articleArgs, { apiKey: key, fetchImpl });
  assert.deepEqual(result.data, law);
  assert.deepEqual(methods, ['initialize', 'notifications/initialized', 'tools/call']);
  assert.ok(result.retrievedAt);
  assert.ok(result.response.result);
});

test('parses split UTF-8 SSE messages, skips notifications, and cancels an open stream', async () => {
  let cancelled = false;
  const fetchImpl = mockFetch((body) => {
    const encoded = new TextEncoder().encode('event: message\r\ndata: {"jsonrpc":"2.0","method":"notifications/progress"}\r\n\r\n' +
      'data: ' + JSON.stringify({ jsonrpc: '2.0', id: body.id,
        result: { content: [{ type: 'text', text: JSON.stringify(law) }] } }) + '\r\n\r\n');
    return new Response(new ReadableStream<Uint8Array>({
      start(controller) {
        for (let i = 0; i < encoded.length; i += 7) controller.enqueue(encoded.slice(i, i + 7));
      },
      cancel() { cancelled = true; },
    }), { headers: { 'content-type': 'text/event-stream' } });
  });
  const result = await query('get_article', articleArgs, { apiKey: key, fetchImpl });
  assert.deepEqual(result.data, law);
  assert.equal(cancelled, true);
});

test('distinguishes empty results from HTTP, RPC, tool, business and malformed responses; redacts keys', async () => {
  const failures: [string, (id: number | undefined) => Response][] = [
    ['HTTP_401', () => new Response(`remaining points error ${key}`, { status: 401 })],
    ['HTTP_429', () => new Response('quota', { status: 429 })],
    ['HTTP_503', () => new Response('service unavailable', { status: 503 })],
    ['RPC', (id) => Response.json({ jsonrpc: '2.0', id, error: { message: key } })],
    ['TOOL', (id) => response(id, { isError: true, content: [{ type: 'text', text: key }] })],
    ['BUSINESS', (id) => response(id, { structuredContent: { Message: '额度不足', Data: [] } })],
    ['BUSINESS', (id) => response(id, { structuredContent: { code: '90001', message: key } })],
    ['PROTOCOL', (id) => response(id, { structuredContent: { Message: '成功' } })],
    ['PROTOCOL', () => response(99999, { structuredContent: { Data: [] } })],
  ];
  for (const [code, fail] of failures) {
    await assert.rejects(query('get_case_list', { title: '测试' }, {
      apiKey: key, fetchImpl: mockFetch((body) => fail(body.id)),
    }), (error: unknown) => error instanceof PkuError && error.code === code && !error.message.includes(key));
  }
  const empty = await query('get_case_list', { title: '测试' }, {
    apiKey: key, fetchImpl: mockFetch((body) => response(body.id, { structuredContent: { Message: '成功', Data: [], Total: 0 } })),
  });
  assert.equal(empty.ok, true);
  assert.deepEqual((empty.data as { Data: unknown[] }).Data, []);
});

test('aborts timed-out requests without retrying', async () => {
  let calls = 0;
  const fetchImpl = mockFetch(async (_body, init) => {
    calls++;
    return new Promise<Response>((_resolve, reject) => {
      // Keeps the event loop alive, like a real pending network request.
      const timer = setTimeout(() => reject(new Error('request did not abort')), 1000);
      init.signal!.addEventListener('abort', () => { clearTimeout(timer); reject(init.signal!.reason); }, { once: true });
    });
  });
  await assert.rejects(query('get_article', articleArgs, { apiKey: key, fetchImpl, timeoutMs: 20 }), { code: 'TIMEOUT' });
  assert.equal(calls, 1);
});

test('preview retains provenance, declares omissions, and leaves full data unchanged', async () => {
  const rows = Array.from({ length: 7 }, (_, i) => ({ Title: `案例${i}`, CaseFlag: `案号${i}`, Court: '测试法院',
    Url: 'https://www.pkulaw.com/example', LastInstanceDate: '2026.01.01',
    Identified: '原'.repeat(1000), JudgeDic: ['法官'] }));
  const result = await query('get_case_list', { title: '测试' }, { apiKey: key,
    fetchImpl: mockFetch((body) => response(body.id, { structuredContent: { Message: '成功', Data: rows, Total: 100 } })),
  });
  const preview = formatResult(result) as { data: { Data: typeof rows; Total: number }; preview: { truncated: boolean; returnedItems: number; truncatedPaths: string[]; omittedFields: string[] } };
  assert.equal(preview.data.Data.length, 5);
  assert.equal(preview.data.Total, 100);
  assert.equal(preview.data.Data[0]!.CaseFlag, '案号0');
  assert.equal(preview.data.Data[0]!.Url, rows[0]!.Url);
  assert.equal(preview.preview.returnedItems, 7);
  assert.equal(preview.preview.truncated, true);
  assert.ok(preview.preview.truncatedPaths.includes('data.Data[0].Identified'));
  assert.ok(preview.preview.omittedFields.includes('data.Data[0].JudgeDic'));
  assert.equal((result.data as { Data: typeof rows }).Data[0]!.Identified.length, 1000);
  assert.deepEqual(formatResult(result, true).data, result.data);
});

test('CLI reads BOM UTF-8 argument files, saves full responses, and refuses overwrites', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'pku-law-test-'));
  const oldFetch = globalThis.fetch;
  const oldKey = process.env.PKU_LAW_API;
  const oldLog = console.log;
  const logged: string[] = [];
  try {
    process.env.PKU_LAW_API = key;
    globalThis.fetch = mockFetch((body) => response(body.id, { structuredContent: law }));
    console.log = (value: unknown) => { logged.push(String(value)); };
    const input = join(dir, 'input.json');
    const output = join(dir, 'output.json');
    await writeFile(input, '\uFEFF' + JSON.stringify(articleArgs));
    await main(['get_article', '--args-file', input, '--out', output]);
    const saved = JSON.parse(await readFile(output, 'utf8'));
    assert.deepEqual(saved.data, law);
    assert.ok(saved.response.result);
    assert.equal(JSON.parse(logged[0]!).savedTo, output);
    await assert.rejects(main(['get_article', '--args-file', input, '--out', output]), { code: 'EEXIST' });
    assert.deepEqual(JSON.parse(await readFile(output, 'utf8')), saved);
    await assert.rejects(main(['get_article', '--args', '{}', '--args-file', input]), { code: 'ARGUMENT' });
    await assert.rejects(main(['get_article', '--args', 'not-json']), { code: 'ARGUMENT' });
  } finally {
    globalThis.fetch = oldFetch;
    console.log = oldLog;
    if (oldKey === undefined) delete process.env.PKU_LAW_API; else process.env.PKU_LAW_API = oldKey;
    await rm(dir, { recursive: true, force: true });
  }
});

test('CLI help is offline and missing credentials produce a nonzero exit code', () => {
  const path = fileURLToPath(new URL('./pku-law.ts', import.meta.url));
  const env = { ...process.env, PKU_LAW_API: '' };
  const help = spawnSync(process.execPath, [path, 'help', 'search_case'], { env, encoding: 'utf8' });
  assert.equal(help.status, 0);
  assert.equal(JSON.parse(help.stdout).operation, 'search_case');
  assert.equal(Object.keys(operations).length, 10);
  const call = spawnSync(process.execPath, [path, 'get_article', '--args', JSON.stringify(articleArgs)], { env, encoding: 'utf8' });
  assert.equal(call.status, 1);
  assert.equal(call.stdout, '');
  assert.equal(JSON.parse(call.stderr).code, 'AUTH');
});
