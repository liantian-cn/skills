import { operations, query } from './pku-law.ts';

// Explicit opt-in: this script makes paid read-only calls with PKU_LAW_API.
const samples: Record<string, Record<string, unknown>> = {
  get_article: { title: '中华人民共和国民法典', number: '第五百八十五条' },
  search_article: { text: '合同违约金调整', size: 1 },
  get_law_list: { title: '中华人民共和国民法典' },
  search_case: { text: '腾讯公司合同纠纷', size: 1 },
  get_case_list: { title: '腾讯', fulltext: '合同纠纷' },
  get_law_item_content: { title: '中华人民共和国民法典', tiao_num: 585 },
  law_recognition: { text: '根据《中华人民共和国民法典》第五百八十五条，当事人可以约定违约金。' },
  anhao_recognition: { text: '（2013）民三终字第4号' },
  adjust_provisions: { userlaw: [{ title: '中华人民共和国民法典', article_number: '585' }],
    prompt: '民法典第五百八十五条规定是什么？' },
  get_linked_content: { message: '根据《中华人民共和国民法典》第五百八十五条，当事人可以约定违约金。' },
};

let passed = 0;
for (const name of Object.keys(operations)) {
  const start = Date.now();
  try {
    if (!samples[name]) throw new Error('Missing smoke input');
    const result = await query(name, samples[name]);
    const data = result.data as Record<string, unknown>;
    const rows = [data.Data, data.data, data.result].find(Array.isArray);
    const text = data.article ?? (data.Data as Record<string, unknown> | undefined)?.FullText ?? data.linkedContent;
    if (rows ? rows.length === 0 : typeof text !== 'string' || !text.length) {
      throw new Error('Known smoke query returned no data');
    }
    passed++;
    console.log(JSON.stringify({ operation: name, ok: true, elapsedMs: Date.now() - start,
      items: rows?.length, textLength: typeof text === 'string' ? text.length : undefined }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ operation: name, ok: false,
      message: process.env.PKU_LAW_API ? message.replaceAll(process.env.PKU_LAW_API, '[REDACTED]') : message }));
  }
}
console.log(JSON.stringify({ passed, total: Object.keys(operations).length }));
if (passed !== Object.keys(operations).length) process.exitCode = 1;
