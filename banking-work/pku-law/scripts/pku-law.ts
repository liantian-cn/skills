import { readFile, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

type ObjectValue = Record<string, unknown>;
type Schema = {
  type?: string;
  properties?: Record<string, Schema>;
  required?: string[];
  anyOf?: Schema[];
  enum?: unknown[];
  items?: Schema;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
};
type Operation = { endpoint: string; title: string; inputSchema: Schema };
export const operations: Record<string, Operation> = JSON.parse(
  readFileSync(new URL('./operations.json', import.meta.url), 'utf8'),
);
const GATEWAY = 'https://apim-gateway.pkulaw.com';
const object = (value: unknown): value is ObjectValue =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

export class PkuError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'PkuError';
    this.code = code;
  }
}

function validate(schema: Schema, value: unknown, path = 'args'): void {
  const fail = (message: string): never => { throw new PkuError('ARGUMENT', `${path}: ${message}`); };
  if (schema.anyOf) {
    if (!schema.anyOf.some((variant) => {
      try { validate(variant, value, path); return true; } catch { return false; }
    })) fail('值不符合允许的类型');
    return;
  }
  if (schema.enum && !schema.enum.includes(value)) fail(`允许值: ${schema.enum.join(', ')}`);
  switch (schema.type) {
    case 'object':
      if (!object(value)) fail('必须为 JSON 对象');
      break;
    case 'array':
      if (!Array.isArray(value)) fail('必须为数组');
      break;
    case 'string':
      if (typeof value !== 'string') fail('必须为字符串');
      break;
    case 'integer':
      if (!Number.isInteger(value)) fail('必须为整数');
      break;
    case 'number':
      if (typeof value !== 'number' || !Number.isFinite(value)) fail('必须为有限数字');
      break;
    case 'null':
      if (value !== null) fail('必须为 null');
      break;
  }
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) fail('文本太短');
    if (schema.maxLength !== undefined && value.length > schema.maxLength) fail('文本太长');
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) fail(`最小值 ${schema.minimum}`);
    if (schema.maximum !== undefined && value > schema.maximum) fail(`最大值 ${schema.maximum}`);
  }
  if (Array.isArray(value) && schema.items) {
    value.forEach((item, index) => validate(schema.items!, item, `${path}[${index}]`));
  }
  if (object(value) && schema.properties) {
    for (const required of schema.required ?? []) {
      if (!(required in value)) fail(`缺少 ${required}`);
    }
    for (const [key, item] of Object.entries(value)) {
      const child = schema.properties[key];
      if (!child) fail(`未知参数 ${key}；请先查看该操作的 help`);
      validate(child, item, `${path}.${key}`);
    }
  }
}

export function validateArguments(name: string, args: unknown): asserts args is ObjectValue {
  if (!Object.hasOwn(operations, name)) throw new PkuError('ARGUMENT', `未知操作 ${name}`);
  if (!object(args)) throw new PkuError('ARGUMENT', '参数必须为 JSON 对象');
  validate(operations[name]!.inputSchema, args);
  if (['get_law_list', 'get_case_list'].includes(name) &&
      ![args.title, args.fulltext].some((value) => typeof value === 'string' && value.trim())) {
    throw new PkuError('ARGUMENT', 'title 或 fulltext 至少一个不为空');
  }
  if (['search_article', 'search_case'].includes(name) && args.size != null &&
      (Number(args.size) < 1 || Number(args.size) > 20)) {
    throw new PkuError('ARGUMENT', 'size 必须在 1 到 20 之间');
  }
  for (const key of operations[name]!.inputSchema.required ?? []) {
    if (typeof args[key] === 'string' && !args[key].trim()) {
      throw new PkuError('ARGUMENT', `${key} 不可为空`);
    }
  }
}

// Stop reading SSE as soon as the matching response arrives; servers may keep the stream open.
async function readRpc(response: Response, id: number): Promise<ObjectValue> {
  const check = (value: unknown): value is ObjectValue =>
    object(value) && value.jsonrpc === '2.0' && value.id === id;
  if (!response.headers.get('content-type')?.includes('text/event-stream')) {
    const data: unknown = await response.json();
    if (!check(data)) throw new PkuError('PROTOCOL', '响应不是匹配请求 ID 的 JSON-RPC 对象');
    return data;
  }
  const reader = response.body?.getReader();
  if (!reader) throw new PkuError('PROTOCOL', 'SSE 响应没有正文');
  const decoder = new TextDecoder();
  let buffer = '';
  const event = (block: string): ObjectValue | undefined => {
    const payload = block.split(/\r?\n/).filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).replace(/^ /, '')).join('\n');
    if (!payload) return;
    const data: unknown = JSON.parse(payload);
    return check(data) ? data : undefined;
  };
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      let separator: RegExpExecArray | null;
      while ((separator = /\r?\n\r?\n/.exec(buffer))) {
        const block = buffer.slice(0, separator.index);
        buffer = buffer.slice(separator.index + separator[0].length);
        const result = event(block);
        if (result) return result;
      }
      if (done) {
        const result = event(buffer);
        if (result) return result;
        throw new PkuError('PROTOCOL', 'SSE 流中没有匹配的响应');
      }
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

function unwrap(name: string, result: unknown): unknown {
  if (!object(result)) throw new PkuError('PROTOCOL', '工具结果不是对象');
  if (result.isError) throw new PkuError('TOOL', JSON.stringify(result.content ?? result));
  let data = result.structuredContent;
  if (data === undefined && Array.isArray(result.content)) {
    const text = result.content.filter((item) => object(item) && item.type === 'text')
      .map((item: ObjectValue) => item.text).join('\n');
    try { data = JSON.parse(text); }
    catch { throw new PkuError('PROTOCOL', `工具正文不是 JSON: ${text.slice(0, 300)}`); }
  }
  if (!object(data)) throw new PkuError('PROTOCOL', '工具没有返回结构化数据');
  if (data.success === false || data.error ||
      (data.code !== undefined && ![0, 200, '0', '200'].includes(data.code as string | number)) ||
      (typeof data.Message === 'string' && !/^(成功|success|ok)$/i.test(data.Message.trim()))) {
    throw new PkuError('BUSINESS', JSON.stringify(data));
  }
  const arrays: Record<string, string> = {
    search_article: 'result', search_case: 'data', get_law_list: 'Data',
    get_case_list: 'Data', law_recognition: 'result', anhao_recognition: 'result',
    adjust_provisions: 'result',
  };
  const arrayKey = arrays[name];
  if (arrayKey && !Array.isArray(data[arrayKey])) {
    throw new PkuError('PROTOCOL', `缺少结果数组 ${arrayKey}`);
  }
  if (name === 'get_article' && typeof data.article !== 'string') {
    throw new PkuError('PROTOCOL', '缺少法条正文 article');
  }
  if (name === 'get_law_item_content' && (!object(data.Data) || typeof data.Data.FullText !== 'string')) {
    throw new PkuError('PROTOCOL', '缺少法条正文 Data.FullText');
  }
  if (name === 'get_linked_content' &&
      (typeof data.linkedContent !== 'string' || typeof data.hasLinks !== 'boolean')) {
    throw new PkuError('PROTOCOL', '缺少 linkedContent / hasLinks');
  }
  return data;
}

export type QueryResult = {
  ok: true;
  operation: string;
  retrievedAt: string;
  source: string;
  data: unknown;
  response: ObjectValue;
};
type ClientOptions = { apiKey?: string; fetchImpl?: typeof fetch; timeoutMs?: number };

export async function query(name: string, args: unknown, options: ClientOptions = {}): Promise<QueryResult> {
  validateArguments(name, args);
  const key = options.apiKey ?? process.env.PKU_LAW_API;
  if (!key?.trim()) throw new PkuError('AUTH', '请在运行环境配置 PKU_LAW_API，脚本不会自动写入或修改凭据');
  const fetchImpl = options.fetchImpl ?? fetch;
  const source = GATEWAY + operations[name]!.endpoint;
  const timeoutMs = options.timeoutMs ?? 45_000;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1) throw new PkuError('ARGUMENT', 'timeoutMs 必须为正整数');
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`, 'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  };
  let nextId = 0;
  async function request(method: string, params?: unknown, notification = false): Promise<ObjectValue> {
    const id = ++nextId;
    const response = await fetchImpl(source, {
      method: 'POST', headers, redirect: 'error', signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify({ jsonrpc: '2.0', ...(notification ? {} : { id }), method,
        ...(params === undefined ? {} : { params }) }),
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new PkuError(`HTTP_${response.status}`, detail || response.statusText);
    }
    if (method === 'initialize') {
      const session = response.headers.get('mcp-session-id');
      if (session) headers['Mcp-Session-Id'] = session;
    }
    if (notification) { await response.body?.cancel(); return {}; }
    const rpc = await readRpc(response, id);
    if (rpc.error) throw new PkuError('RPC', JSON.stringify(rpc.error));
    if (!Object.hasOwn(rpc, 'result')) throw new PkuError('PROTOCOL', '响应缺少 result');
    return rpc;
  }
  try {
    const init = await request('initialize', {
      protocolVersion: '2024-11-05', capabilities: {},
      clientInfo: { name: 'pku-law-skill', version: '1.0.0' },
    });
    if (!object(init.result) || typeof init.result.protocolVersion !== 'string') {
      throw new PkuError('PROTOCOL', '初始化未返回协议版本');
    }
    headers['MCP-Protocol-Version'] = init.result.protocolVersion;
    await request('notifications/initialized', undefined, true);
    const response = await request('tools/call', { name, arguments: args });
    return { ok: true, operation: name, retrievedAt: new Date().toISOString(),
      source, data: unwrap(name, response.result), response };
  } catch (error) {
    const code = error instanceof PkuError ? error.code :
      error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name) ? 'TIMEOUT' : 'TRANSPORT';
    const message = error instanceof Error ? error.message : String(error);
    throw new PkuError(code, message.replaceAll(key, '[REDACTED]').slice(0, 1500));
  }
}

const CASE_FIELDS = new Set([
  'Title', 'title', 'CaseFlag', 'caseNumber', 'Url', 'url', 'Court', 'courthouseName',
  'LastInstanceDate', 'decisionDate', 'CaseGrade', 'caseGrade', 'Category', 'causeOfAction',
  'DocumentAttr', 'docType', 'CaseClassName', 'caseType', 'CaseGist', 'Ascertain', 'ascertain',
  'Identified', 'identified', 'RefereeBasis', 'RefereeResult', 'refereeResult', 'content',
]);

export function formatResult(result: QueryResult, full = false, limit = 5): ObjectValue {
  if (!Number.isInteger(limit) || limit < 1) throw new PkuError('ARGUMENT', 'limit 必须为正整数');
  const { response: _response, ...base } = result;
  if (full) return base;
  const truncatedPaths: string[] = [];
  const omittedFields: string[] = [];
  const isCases = ['get_case_list', 'search_case'].includes(result.operation);
  function preview(value: unknown, path: string): unknown {
    if (typeof value === 'string' && value.length > 600) {
      truncatedPaths.push(path);
      return value.slice(0, 600) + '…[已截断，引用前读取完整结果]';
    }
    if (Array.isArray(value)) {
      if (value.length > limit) truncatedPaths.push(path);
      return value.slice(0, limit).map((item, i) => preview(item, `${path}[${i}]`));
    }
    if (object(value)) {
      const caseRecord = isCases && /^data\.(Data|data)\[\d+\]$/.test(path);
      return Object.fromEntries(Object.entries(value).filter(([key]) => {
        if (caseRecord && !CASE_FIELDS.has(key)) { omittedFields.push(`${path}.${key}`); return false; }
        return true;
      }).map(([key, item]) => [key, preview(item, `${path}.${key}`)]));
    }
    return value;
  }
  const data = preview(base.data, 'data');
  const record = object(base.data) ? base.data : {};
  const rows = [record.Data, record.data, record.result].find(Array.isArray);
  return { ...base, data, preview: {
    limit, returnedItems: rows?.length ?? null, displayedItems: rows ? Math.min(rows.length, limit) : null,
    truncated: truncatedPaths.length > 0 || omittedFields.length > 0, truncatedPaths, omittedFields,
    note: '预览不代表全部检索结果；引用正文前读取完整数据。--out 保存完整响应，--full 输出完整数据。',
  } };
}

function json(text: string): unknown {
  try { return JSON.parse(text.replace(/^\uFEFF/, '')); }
  catch { throw new PkuError('ARGUMENT', '参数不是有效 JSON；PowerShell 下优先使用 --args-file'); }
}

export async function main(argv = process.argv.slice(2)): Promise<void> {
  const { values, positionals } = parseArgs({ args: argv, allowPositionals: true, options: {
    args: { type: 'string' }, 'args-file': { type: 'string' }, out: { type: 'string' },
    full: { type: 'boolean' }, limit: { type: 'string' }, 'timeout-ms': { type: 'string' },
    help: { type: 'boolean', short: 'h' },
  } });
  const [command, target] = positionals;
  if (command === 'help' && target) {
    if (!Object.hasOwn(operations, target)) throw new PkuError('ARGUMENT', `未知操作 ${target}`);
    console.log(JSON.stringify({ operation: target, ...operations[target] }, null, 2));
    return;
  }
  if (!command || command === 'help' || values.help) {
    console.log('node scripts/pku-law.ts list\nnode scripts/pku-law.ts help <operation>\n' +
      'node scripts/pku-law.ts <operation> --args-file query.json [--out result.json] [--full] [--limit 5] [--timeout-ms 45000]\n' +
      '也可用 --args 提供 JSON 字符串。运行查询需环境变量 PKU_LAW_API。');
    return;
  }
  if (command === 'list') {
    console.log(JSON.stringify(Object.entries(operations).map(([name, value]) => ({ name, title: value.title })), null, 2));
    return;
  }
  if (positionals.length !== 1) throw new PkuError('ARGUMENT', '只接受一个操作名');
  if (Boolean(values.args !== undefined) === Boolean(values['args-file'] !== undefined)) {
    throw new PkuError('ARGUMENT', '必须且只能提供 --args 或 --args-file');
  }
  const limit = values.limit === undefined ? 5 : Number(values.limit);
  if (!Number.isInteger(limit) || limit < 1) throw new PkuError('ARGUMENT', 'limit 必须为正整数');
  const args = json(values['args-file'] !== undefined ? await readFile(values['args-file'], 'utf8') : values.args!);
  const result = await query(command, args, {
    timeoutMs: values['timeout-ms'] === undefined ? 45_000 : Number(values['timeout-ms']),
  });
  // Exclusive creation avoids overwriting a query input, a source file, or a previous result.
  if (values.out) await writeFile(values.out, JSON.stringify(result, null, 2) + '\n', { encoding: 'utf8', flag: 'wx' });
  console.log(JSON.stringify({ ...formatResult(result, values.full, limit),
    ...(values.out ? { savedTo: resolve(values.out) } : {}) }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error: unknown) => {
    const key = process.env.PKU_LAW_API;
    const raw = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ ok: false, code: error instanceof PkuError ? error.code : 'CLI',
      message: key ? raw.replaceAll(key, '[REDACTED]') : raw }));
    process.exitCode = 1;
  });
}
