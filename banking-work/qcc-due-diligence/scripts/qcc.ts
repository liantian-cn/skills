import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Fixed first-party routes: never send the API key to a caller-supplied URL.
export const services = {
  company: 'company', risk: 'risk',
  executive: 'executive', operation: 'operation', ipr: 'ipr',
  'legal-regulation': 'regulation', 'legal-case': 'case', document: 'document',
} as const;
export type Service = keyof typeof services;
type ObjectValue = Record<string, unknown>;
type Reply = { value: ObjectValue; raw: string };
type Fetch = typeof globalThis.fetch;

export class QccError extends Error {
  code: string | number;
  constructor(code: string | number, message: string) {
    super(message);
    this.name = 'QccError';
    this.code = code;
  }
}

function object(value: unknown): value is ObjectValue {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseObject(text: string): ObjectValue {
  let value: unknown;
  try { value = JSON.parse(text.replace(/^\uFEFF/, '')); }
  catch { throw new QccError('INVALID_JSON', '输入必须是有效的 JSON。'); }
  if (!object(value)) throw new QccError('INVALID_PARAMS', '参数必须是单个 JSON 对象，不能是 null、数组或字符串。');
  return value;
}

function matchReply(raw: string, id: number): Reply | undefined {
  let value: unknown;
  try { value = JSON.parse(raw); }
  catch { throw new QccError('INVALID_RESPONSE', '服务返回了无法解析的 JSON。'); }
  if (!object(value) || value.id !== id) return undefined; // Ignore notifications.
  if (value.jsonrpc !== '2.0') throw new QccError('INVALID_RESPONSE', '服务返回了无效的协议版本。');
  if (object(value.error)) {
    const code = value.error.code;
    throw new QccError(typeof code === 'string' || typeof code === 'number' ? code : 'RPC_ERROR',
      typeof value.error.message === 'string' ? value.error.message : '服务调用失败。');
  }
  if (!object(value.result)) throw new QccError('INVALID_RESPONSE', '服务未返回结果对象。');
  return { value: value.result, raw };
}

// Return as soon as the matching SSE response arrives; a stream may stay open.
// Preserve the original JSON text so large numbers/decimal literals are not rewritten.
export async function readReply(response: Response, id: number): Promise<Reply> {
  if (!response.ok) {
    await response.body?.cancel();
    throw new QccError(`HTTP_${response.status}`, `企查查 HTTP 请求失败（${response.status}）。`);
  }
  if (!response.headers.get('content-type')?.includes('text/event-stream')) {
    const reply = matchReply(await response.text(), id);
    if (reply) return reply;
    throw new QccError('INVALID_RESPONSE', '响应 ID 与请求不匹配。');
  }
  if (!response.body) throw new QccError('EMPTY_RESPONSE', '服务返回了空数据流。');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let data: string[] = [];
  function line(text: string): Reply | undefined {
    if (text === '') {
      const raw = data.join('\n');
      data = [];
      return raw ? matchReply(raw, id) : undefined;
    }
    if (text.startsWith('data:')) data.push(text.slice(5).replace(/^ /, ''));
    return undefined;
  }
  try {
    while (true) {
      const chunk = await reader.read();
      buffer += decoder.decode(chunk.value, { stream: !chunk.done });
      while (true) {
        const index = buffer.search(/[\r\n]/);
        if (index < 0 || (!chunk.done && buffer[index] === '\r' && index === buffer.length - 1)) break;
        const ending = buffer[index] === '\r' && buffer[index + 1] === '\n' ? 2 : 1;
        const reply = line(buffer.slice(0, index));
        buffer = buffer.slice(index + ending);
        if (reply) return reply;
      }
      if (chunk.done) {
        if (buffer) { const reply = line(buffer); if (reply) return reply; }
        const reply = line('');
        if (reply) return reply;
        break;
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
  throw new QccError('EMPTY_RESPONSE', '数据流结束，未收到当前请求的结果。');
}

export class QccClient {
  private key: string;
  private url: string;
  private fetcher: Fetch;
  private timeoutMs: number;
  private session?: string;
  private protocol?: string;
  private id = 0;

  constructor(service: Service, key: string, options: { fetcher?: Fetch; timeoutMs?: number } = {}) {
    if (!key.trim()) throw new QccError('MISSING_API_KEY', '请在运行环境中配置 QCC_API_KEY，再启动查询进程。');
    if (!Object.hasOwn(services, service)) throw new QccError('UNKNOWN_SERVICE', '未知企查查服务。');
    this.key = key.trim();
    this.url = `https://agent.qcc.com/mcp/${services[service]}/stream`;
    this.fetcher = options.fetcher ?? globalThis.fetch;
    this.timeoutMs = options.timeoutMs ?? 60_000;
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.key}`, 'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...(this.session ? { 'Mcp-Session-Id': this.session } : {}),
      ...(this.protocol ? { 'MCP-Protocol-Version': this.protocol } : {}),
    };
  }

  private async post(body: ObjectValue, notification = false): Promise<Reply | undefined> {
    try {
      const response = await this.fetcher(this.url, {
        method: 'POST', headers: this.headers(), body: JSON.stringify(body),
        redirect: 'error', signal: AbortSignal.timeout(this.timeoutMs),
      });
      const session = response.headers.get('mcp-session-id');
      if (session) this.session = session;
      if (notification) {
        await response.body?.cancel();
        if (!response.ok) throw new QccError(`HTTP_${response.status}`, '服务初始化通知失败。');
        return undefined;
      }
      return await readReply(response, body.id as number);
    } catch (error) {
      if (error instanceof QccError) throw error;
      if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) {
        throw new QccError('TIMEOUT', '请求超时；未自动重试，请先确认查询状态。');
      }
      throw new QccError('NETWORK_ERROR', '无法完成企查查网络请求；未自动重试。');
    }
  }

  async request(method: string, params: ObjectValue = {}): Promise<Reply> {
    return (await this.post({ jsonrpc: '2.0', id: ++this.id, method, params }))!;
  }

  async initialize(): Promise<void> {
    const { value } = await this.request('initialize', {
      protocolVersion: '2024-11-05', capabilities: {},
      clientInfo: { name: 'qcc-due-diligence-skill', version: '1.0.0' },
    });
    if (typeof value.protocolVersion !== 'string') throw new QccError('INVALID_RESPONSE', '初始化未返回协议版本。');
    this.protocol = value.protocolVersion;
    await this.post({ jsonrpc: '2.0', method: 'notifications/initialized' }, true);
  }

  async list(kind: 'tools' | 'resources'): Promise<ObjectValue[]> {
    const items: ObjectValue[] = [];
    const cursors = new Set<string>();
    let cursor: string | undefined;
    do {
      const { value } = await this.request(`${kind}/list`, cursor ? { cursor } : {});
      const page = value[kind];
      if (!Array.isArray(page) || !page.every(object)) throw new QccError('INVALID_RESPONSE', '服务目录格式异常。');
      items.push(...page);
      const next = value.nextCursor;
      if (next !== undefined && (typeof next !== 'string' || next.length === 0)) throw new QccError('INVALID_RESPONSE', '目录分页游标无效。');
      cursor = next as string | undefined;
      if (cursor && cursors.has(cursor)) throw new QccError('PAGINATION_LOOP', '服务目录重复返回同一游标，已停止。');
      if (cursor) cursors.add(cursor);
    } while (cursor);
    return items;
  }

  async describe(name: string): Promise<ObjectValue> {
    const tool = (await this.list('tools')).find(tool => tool.name === name);
    if (!tool) throw new QccError('TOOL_UNAVAILABLE', `当前服务未提供或未授权工具：${name}`);
    return tool;
  }

  async call(name: string, args: ObjectValue): Promise<Reply> {
    const tool = await this.describe(name);
    const schema = tool.inputSchema;
    if (object(schema) && Array.isArray(schema.required)) {
      for (const field of schema.required) {
        if (typeof field === 'string' && (!Object.hasOwn(args, field) || args[field] == null)) {
          throw new QccError('MISSING_PARAMETER', `缺少必填参数：${field}`);
        }
      }
    }
    // tools/list establishes current availability; the server validates the full schema.
    return this.request('tools/call', { name, arguments: args });
  }

  async close(): Promise<void> {
    if (!this.session) return;
    try {
      const response = await this.fetcher(this.url, {
        method: 'DELETE', headers: this.headers(), redirect: 'error', signal: AbortSignal.timeout(2000),
      });
      await response.body?.cancel();
    } catch { /* Cleanup must not hide a query result or cause a query retry. */ }
  }
}

const help = `企查查 TypeScript 查询入口（Node >= 22.18）
  node scripts/qcc.ts call <service> <tool> --params-file <path|-> [--out <path>]
  node scripts/qcc.ts describe <service> <tool> [--out <path>]
  node scripts/qcc.ts resources list <service> [--out <path>]
  node scripts/qcc.ts resources read <service> <uri> [--out <path>]
所有命令支持 --timeout-ms <毫秒>（默认 60000）。密钥只读取 QCC_API_KEY。
--params-file - 从标准输入读取 JSON 对象；--out 保存完整响应，仅向终端输出路径。
查询和资源读取保留原始 JSON-RPC 响应：业务数据在 result 中。
service: ${Object.keys(services).join(', ')}
`;

export async function main(argv = process.argv.slice(2)): Promise<void> {
  if (argv.length === 0 || (argv.length === 1 && ['--help', '-h'].includes(argv[0]))) {
    process.stdout.write(help); return;
  }
  const positional: string[] = [];
  const options = new Map<string, string>();
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      if (!['--params-file', '--out', '--timeout-ms'].includes(arg) || options.has(arg)) throw new QccError('USAGE', `未知或重复选项：${arg}`);
      const value = argv[++i];
      if (!value || value.startsWith('--')) throw new QccError('USAGE', `选项缺少值：${arg}`);
      options.set(arg, value);
    } else positional.push(arg);
  }
  const resource = positional[0] === 'resources';
  const action = resource ? positional[1] : positional[0];
  const service = positional[resource ? 2 : 1];
  const target = positional[resource ? 3 : 2];
  const expected = resource ? (action === 'list' ? 3 : 4) : 3;
  if (!(resource ? ['list', 'read'] : ['call', 'describe']).includes(action) || positional.length !== expected) throw new QccError('USAGE', help);
  if (!Object.hasOwn(services, service)) throw new QccError('UNKNOWN_SERVICE', `未知服务：${service}`);
  const paramsFile = options.get('--params-file');
  if ((!resource && action === 'call') !== Boolean(paramsFile)) throw new QccError('USAGE', '只有 call 且必须指定 --params-file <path|->。');
  const timeoutMs = Number(options.get('--timeout-ms') ?? 60_000);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 300_000) throw new QccError('USAGE', '超时必须为 1 至 300000 毫秒的整数。');
  let args: ObjectValue = {};
  if (paramsFile) {
    let text: string;
    if (paramsFile === '-') {
      process.stdin.setEncoding('utf8');
      text = '';
      for await (const chunk of process.stdin) text += chunk;
    } else text = await readFile(paramsFile, 'utf8');
    args = parseObject(text);
  }
  const client = new QccClient(service as Service, process.env.QCC_API_KEY ?? '', { timeoutMs });
  try {
    await client.initialize();
    let output: string;
    let toolError = false;
    if (resource && action === 'list') {
      output = JSON.stringify({ resources: await client.list('resources') }, null, 2);
    } else if (resource) {
      const reply = await client.request('resources/read', { uri: target });
      output = reply.raw;
    } else if (action === 'describe') {
      output = JSON.stringify(await client.describe(target), null, 2);
    } else {
      const reply = await client.call(target, args);
      output = reply.raw;
      toolError = reply.value.isError === true;
    }
    output = redact(output) + '\n';
    const out = options.get('--out');
    if (out) {
      await writeFile(out, output, { encoding: 'utf8', flag: 'wx' });
      process.stdout.write(JSON.stringify({ savedTo: resolve(out) }) + '\n');
    } else process.stdout.write(output);
    if (toolError) throw new QccError('TOOL_ERROR', '企查查工具返回失败；完整返回已输出，不得视为无记录。');
  } finally { await client.close(); }
}

function redact(text: string): string {
  const key = process.env.QCC_API_KEY?.trim();
  if (!key) return text;
  return text.split(key).join('[REDACTED]').split(JSON.stringify(key).slice(1, -1)).join('[REDACTED]');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {
    const code = error instanceof QccError ? error.code : 'LOCAL_ERROR';
    const message = error instanceof Error ? error.message : '脚本执行失败。';
    process.stderr.write(redact(JSON.stringify({ error: { code, message } })) + '\n');
    process.exitCode = 1;
  });
}
