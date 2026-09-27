---
name: "ifind-finance-data"
description: "本技能用于查询同花顺 iFinD 金融数据。当用户请求查询 A股/港美股行情与财务数据、公募基金净值与持仓、债券行情与估值、指数板块走势、宏观经济与行业经济指标（EDB）、财经新闻与上市公司公告，或提出“智能选股”“查估值”“看实时行情或盘中K线”等需求时触发；即使用户只问一个具体数字（如“茅台最新PE”），也应通过本技能获取数据。"
version: "2026-08-03"
category: "金融数据"
mcp_servers:
  - hexin-ifind-ds-stock-mcp
  - hexin-ifind-ds-fund-mcp
  - hexin-ifind-ds-edb-mcp
  - hexin-ifind-ds-news-mcp
  - hexin-ifind-ds-bond-mcp
  - hexin-ifind-ds-global-stock-mcp
  - hexin-ifind-ds-index-mcp
tags:
  - 同花顺
  - iFinD
  - 金融数据
  - 股票
  - 基金
  - 债券
  - 港美股
  - 指数
  - 板块
  - 宏观经济
  - 行业经济
  - 新闻公告
  - 实时行情
  - 智能选股
  - EDB
  - ESG
model: deepseek-v4-pro
---

# 同花顺金融数据查询

本技能通过 hexin-ifind 系列 MCP 工具调用同花顺 iFinD 金融数据服务，覆盖 A股、港美股、公募基金、债券、指数板块、宏观与行业经济指标（EDB）、新闻公告七大数据域。

## 定位

- 用户提出任何金融数据查询（股票行情、财务指标、估值、基金净值、债券久期、宏观行业指标、新闻公告、指数板块走势）时使用本技能。
- 即使用户只问一个具体数字（如"茅台最新PE"），也通过本技能获取。
- 不适用场景：深度企业尽职调查（使用 qcc-due-diligence 系列技能）；量化策略回测与复杂金融建模（本技能仅提供原始数据）。

## 共享引用

所有 MCP 工具全名格式：`mcp__plugin_ifind-finance-data_hexin-ifind-ds-{domain}-mcp__{tool_name}`。各数据域的工具清单与调用示例见对应参考文档，查询前先加载。

| 数据域 | MCP 服务器 | 参考文档 |
| --- | --- | --- |
| A股 | `hexin-ifind-ds-stock-mcp` | `references/cn_stock.md` |
| 基金 | `hexin-ifind-ds-fund-mcp` | `references/fund.md` |
| 债券 | `hexin-ifind-ds-bond-mcp` | `references/bond.md` |
| 港美股 | `hexin-ifind-ds-global-stock-mcp` | `references/global_stock.md` |
| 指数板块 | `hexin-ifind-ds-index-mcp` | `references/index.md` |
| 宏观行业指标 | `hexin-ifind-ds-edb-mcp` | `references/edb.md` |
| 新闻公告 | `hexin-ifind-ds-news-mcp` | `references/news_notices.md` |
| 实时/高频行情（跨域） | 各域 highfreq 工具 | `references/quotes.md` |

## 工作流

1. 判断数据域，加载对应参考文档，再选择工具。
2. 直接调用 MCP 工具并传入 JSON 参数；所有工具使用统一参数格式。
3. 描述模糊、指标或实体名不确定时，先用搜索类工具定位（`search_stocks`、`search_news`、`search_notice`），再查询具体数据。
4. 单次调用支持多主体、多指标，但主体数与指标数各控制在 5 个以内，避免单次调用过重。
5. 实时行情、盘中K线需求统一参考 `references/quotes.md`，使用结构化参数。
6. 面向用户的回答、报告、摘要和分析必须使用简体中文输出。

## 输出模板

- 查询结果以简洁表格或摘要形式输出，标注数据日期与来源。
- 回答时注明数据时间点（如"截至 2026-07-17"），避免把历史数据当作最新值。

## 参数

- 查询类工具：`{"query":"自然语言描述，需包含证券实体、指标名称、时间范围"}`。
- 高频/实时类工具：`{"symbols":"...","indicators":"...","data_mode":"real_time|highfreq","interval":1/3/5/10/15/30/60}`。
- 新闻公告类工具：`{"query":"...","time_start":"YYYY-MM-DD","time_end":"YYYY-MM-DD","size":5}`。

## 边界与免责

- 高频实时行情仅支持交易日日内数据，不支持历史数据查询；债券高频仅支持交易所债券，不支持银行间市场。
- 控制请求并发：免费版 2 qps / 个人版 5 qps / 企业版 10 qps，7 个服务共享速率限制池。
- 不要在结果中暴露任何 API 密钥。
- 数据仅供研究与参考，不构成投资建议。
- Windows PowerShell 处理中文查询时，确保终端输入输出编码支持 UTF-8。
