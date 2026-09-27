import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const operations = {
  stock: ['search_stocks', 'get_stock_summary', 'get_stock_info', 'get_stock_performance',
    'get_stock_shareholders', 'get_stock_financials', 'get_risk_indicators',
    'get_stock_events', 'get_esg_data', 'stock_highfreq_quotes'],
  fund: ['get_fund_profile', 'get_fund_market_performance', 'get_fund_ownership',
    'get_fund_portfolio', 'get_fund_financials', 'get_fund_company_info', 'fund_highfreq_quotes'],
  bond: ['bond_basic_info', 'bond_market_data', 'bond_financial_data', 'bond_special_data', 'bond_highfreq_quotes'],
  global_stock: ['global_stock_profile', 'global_stock_quotes', 'global_stock_financial', 'global_stock_events'],
  index: ['index_data', 'sector_data', 'index_highfreq_quotes'],
  edb: ['get_edb_data'],
  news: ['search_news', 'search_notice'],
} as const;

type Domain = keyof typeof operations;
type JsonObject = Record<string, unknown>;
type FailureKind = 'input' | 'auth' | 'http' | 'network' | 'timeout' | 'protocol' | 'business' | 'file';

class IfindError extends Error {
  kind: FailureKind;
  details: unknown;
  constructor(kind: FailureKind, message: string, details?: unknown) {
    super(message);
    this.kind = kind;
    this.details = details;
  }
}

function isObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseJson(text: string, kind: FailureKind): unknown {
  try { return JSON.parse(text.replace(/^\uFEFF/, '')); }
  catch { throw new IfindError(kind, '无法解析 JSON。参数文件须使用 UTF-8 编码。'); }
}

export function validateParams(domain: string, operation: string, input: unknown): asserts input is JsonObject {
  if (!Object.hasOwn(operations, domain) ||
      !(operations[domain as Domain] as readonly string[]).includes(operation)) {
    throw new IfindError('input', '数据域或功能名无效，请运行 --help。');
  }
  if (!isObject(input)) throw new IfindError('input', '参数必须是 JSON 对象。');
  const requiredString = (key: string): string => {
    const value = input[key];
    if (typeof value !== 'string' || !value.trim()) throw new IfindError('input', `${key} 必须为非空字符串。`);
    return value;
  };
  const quotes = operation.endsWith('_highfreq_quotes');
  const allowed = quotes ? ['symbols', 'indicators', 'data_mode', 'interval']
    : domain === 'news' ? ['query', 'time_start', 'time_end', 'size'] : ['query'];
  for (const key of Object.keys(input)) {
    if (!allowed.includes(key)) throw new IfindError('input', `不支持参数 ${key}。`);
  }
  if (quotes) {
    for (const key of ['symbols', 'indicators']) {
      const items = requiredString(key).split(',');
      if (items.length > 10 || items.some(item => !item.trim()) || /[，、]/u.test(input[key] as string)) {
        throw new IfindError('input', `${key} 须使用英文逗号分隔 1 至 10 项。`);
      }
    }
    if (input.data_mode !== 'real_time' && input.data_mode !== 'highfreq') {
      throw new IfindError('input', 'data_mode 必须显式指定 real_time 或 highfreq。');
    }
    if (input.interval !== undefined &&
        (input.data_mode !== 'highfreq' || ![1, 3, 5, 10, 15, 30, 60].includes(input.interval as number))) {
      throw new IfindError('input', 'interval 仅用于 highfreq，允许 1/3/5/10/15/30/60。');
    }
  } else {
    requiredString('query');
    if (domain === 'news') {
      for (const key of ['time_start', 'time_end']) {
        const date = requiredString(key);
        const parsed = new Date(date);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.getTime()) ||
            parsed.toISOString().slice(0, 10) !== date) {
          throw new IfindError('input', `${key} 必须为有效的 YYYY-MM-DD 日期。`);
        }
      }
      if ((input.time_start as string) > (input.time_end as string)) throw new IfindError('input', '起始日期不得晚于终止日期。');
      if (!Number.isInteger(input.size) || (input.size as number) < 1 || (input.size as number) > 20) {
        throw new IfindError('input', '新闻公告 size 必须为 1 至 20 的整数，通常使用 5。');
      }
    }
  }
}

// SSE can remain open after the matching response: stop on its request ID, not EOF.
export async function readRpcResponse(response: Response, id: number): Promise<JsonObject> {
  const match = (value: unknown): JsonObject | undefined =>
    isObject(value) && value.id === id ? value : undefined;
  if (!response.headers.get('content-type')?.includes('text/event-stream')) {
    const envelope = match(parseJson(await response.text(), 'protocol'));
    if (!envelope) throw new IfindError('protocol', '响应缺少匹配的请求 ID。');
    return envelope;
  }
  if (!response.body) throw new IfindError('protocol', 'SSE 响应为空。');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const event = (block: string): JsonObject | undefined => {
    const data = block.split(/\r\n|\n|\r/).filter(line => line.startsWith('data:'))
      .map(line => line.slice(5).replace(/^ /, '')).join('\n');
    return data && data !== '[DONE]' ? match(parseJson(data, 'protocol')) : undefined;
  };
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      let boundary: RegExpExecArray | null;
      while ((boundary = /\r\n\r\n|\n\n|\r\r/.exec(buffer))) {
        const envelope = event(buffer.slice(0, boundary.index));
        buffer = buffer.slice(boundary.index + boundary[0].length);
        if (envelope) return envelope;
      }
      if (done) {
        const envelope = event(buffer);
        if (envelope) return envelope;
        throw new IfindError('protocol', 'SSE 结束但没有匹配的响应。');
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

function checkBusinessResult(result: unknown): void {
  if (!isObject(result)) throw new IfindError('protocol', '查询结果不是对象。');
  if (result.isError === true) throw new IfindError('business', '51ifind 返回业务错误。', result);
  const payloads: unknown[] = [result.structuredContent];
  if (Array.isArray(result.content)) {
    for (const block of result.content) {
      if (isObject(block) && block.type === 'text' && typeof block.text === 'string') {
        try { payloads.push(JSON.parse(block.text)); } catch { /* Preserve plain text results. */ }
      }
    }
  }
  for (const payload of payloads) {
    // 51ifind's business envelope uses code=1 for success, not the HTTP convention code=0.
    if (isObject(payload) && Object.hasOwn(payload, 'code') && Object.hasOwn(payload, 'msg') &&
        payload.code !== 1 && payload.code !== '1') {
      throw new IfindError('business', '51ifind 业务状态未成功，请检查返回的 code/msg。', result);
    }
  }
}

export async function callIfind(domain: string, operation: string, params: unknown): Promise<unknown> {
  validateParams(domain, operation, params);
  const apiKey = process.env.IFIND_API_KEY?.trim();
  if (!apiKey) throw new IfindError('auth', '缺少 IFIND_API_KEY 环境变量；请配置后在继承该变量的新终端重试。');
  const endpointDomain = domain === 'global_stock' ? 'global-stock' : domain;
  const url = `https://api-mcp.51ifind.com:8643/ds-mcp-servers/hexin-ifind-ds-${endpointDomain}-mcp`;
  const headers: Record<string, string> = {
    Authorization: apiKey, Accept: 'application/json, text/event-stream', 'Content-Type': 'application/json',
  };
  const signal = AbortSignal.timeout(120_000);
  const send = async (method: string, id?: number, arguments_?: JsonObject): Promise<unknown> => {
    const response = await fetch(url, {
      method: 'POST', headers, signal, redirect: 'error',
      body: JSON.stringify({ jsonrpc: '2.0', ...(id === undefined ? {} : { id }), method,
        ...(arguments_ === undefined ? {} : { params: arguments_ }) }),
    });
    const session = response.headers.get('mcp-session-id');
    if (session) headers['Mcp-Session-Id'] = session;
    if (!response.ok) {
      const detail = await response.text();
      throw new IfindError(response.status === 401 || response.status === 403 ? 'auth' : 'http',
        `51ifind HTTP ${response.status}。`, detail);
    }
    if (id === undefined) { await response.body?.cancel(); return undefined; }
    const envelope = await readRpcResponse(response, id);
    if (envelope.error !== undefined) throw new IfindError('protocol', '51ifind 协议错误。', envelope.error);
    if (!Object.hasOwn(envelope, 'result')) throw new IfindError('protocol', '响应缺少 result。');
    return envelope.result;
  };
  try {
    const initialized = await send('initialize', 1, {
      protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'ifind-finance-data-skill', version: '1.0.0' },
    });
    if (!isObject(initialized) || initialized.protocolVersion !== '2024-11-05') {
      throw new IfindError('protocol', '服务端未接受支持的协议版本 2024-11-05。', initialized);
    }
    headers['MCP-Protocol-Version'] = initialized.protocolVersion;
    await send('notifications/initialized');
    const result = await send('tools/call', 2, { name: operation, arguments: params });
    checkBusinessResult(result);
    return result;
  } catch (error) {
    if (error instanceof IfindError) throw error;
    if (signal.aborted) throw new IfindError('timeout', '请求超过 120 秒，未自动重试。');
    throw new IfindError('network', '网络请求失败，未自动重试。', error instanceof Error ? error.message : String(error));
  }
}

function redact(text: string): string {
  const secret = process.env.IFIND_API_KEY?.trim();
  return secret ? text.replaceAll(secret, '[REDACTED]') : text;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length === 0 || (args.length === 1 && args[0] === '--help')) {
    console.log('node scripts/ifind.ts <domain> <operation> (--params <JSON> | --params-file <UTF-8 file>) [--output <file>]\n' +
      'Requires Node >=22.18 and IFIND_API_KEY. Timeout: 120s; no automatic retries.\n' +
      JSON.stringify(operations, null, 2));
    return;
  }
  const [domain, operation, ...options] = args;
  if (!domain || !operation) throw new IfindError('input', '缺少数据域或功能名，请运行 --help。');
  const flags = new Map<string, string>();
  for (let i = 0; i < options.length; i += 2) {
    const flag = options[i];
    const value = options[i + 1];
    if (!flag || !['--params', '--params-file', '--output'].includes(flag) || !value || value.startsWith('--') || flags.has(flag)) {
      throw new IfindError('input', '选项无效、重复或缺少值，请运行 --help。');
    }
    flags.set(flag, value);
  }
  if (flags.has('--params') === flags.has('--params-file')) {
    throw new IfindError('input', '--params 和 --params-file 必须且只能提供一个。');
  }
  let input = flags.get('--params');
  if (input === undefined) {
    try { input = await readFile(resolve(flags.get('--params-file')!), 'utf8'); }
    catch { throw new IfindError('file', '无法读取参数文件。'); }
  }
  const result = await callIfind(domain, operation, parseJson(input, 'input'));
  const json = redact(JSON.stringify(result, null, 2)) + '\n';
  const output = flags.get('--output');
  if (output) {
    const path = resolve(output);
    try { await writeFile(path, json, { encoding: 'utf8', flag: 'wx' }); }
    catch { throw new IfindError('file', '无法保存结果；父目录必须存在，输出文件不得已存在。查询已执行，请勿为重写文件盲目重复请求。'); }
    console.log(JSON.stringify({ status: 'saved', path }));
  } else {
    process.stdout.write(json);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error: unknown) => {
    const failure = error instanceof IfindError ? error : new IfindError('file', error instanceof Error ? error.message : String(error));
    process.stderr.write(redact(JSON.stringify({ error: { kind: failure.kind, message: failure.message, details: failure.details } })) + '\n');
    process.exitCode = 1;
  });
}
