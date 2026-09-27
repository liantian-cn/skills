## A股股票服务

| MCP 工具 | 功能说明 | 典型参数 |
| --- | --- | --- |
| `mcp__plugin_ifind-finance-data_hexin-ifind-ds-stock-mcp__search_stocks` | 智能选股 | `{"query":"电子行业市值大于100亿"}` |
| `mcp__plugin_ifind-finance-data_hexin-ifind-ds-stock-mcp__get_stock_summary` | 股票信息摘要 | `{"query":"茅台财务状况"}` |
| `mcp__plugin_ifind-finance-data_hexin-ifind-ds-stock-mcp__get_stock_info` | 股票基本资料 | `{"query":"格力电器上市时间"}` |
| `mcp__plugin_ifind-finance-data_hexin-ifind-ds-stock-mcp__get_stock_performance` | 股票日频行情与技术指标 | `{"query":"三花智控近5日涨跌幅"}` |
| `mcp__plugin_ifind-finance-data_hexin-ifind-ds-stock-mcp__get_stock_shareholders` | 股本结构与股东数据 | `{"query":"光明乳业流通股占比"}` |
| `mcp__plugin_ifind-finance-data_hexin-ifind-ds-stock-mcp__get_stock_financials` | 财务数据与指标 | `{"query":"科大讯飞2025年三季度的ROE"}` |
| `mcp__plugin_ifind-finance-data_hexin-ifind-ds-stock-mcp__get_risk_indicators` | 风险定量指标 | `{"query":"航天电子在2026-03-19的夏普比率"}` |
| `mcp__plugin_ifind-finance-data_hexin-ifind-ds-stock-mcp__get_stock_events` | 上市公司重大事件类指标 | `{"query":"摩尔线程IPO首发股本数量"}` |
| `mcp__plugin_ifind-finance-data_hexin-ifind-ds-stock-mcp__get_esg_data` | ESG评级数据 | `{"query":"诚意药业中诚信ESG评级"}` |
| `mcp__plugin_ifind-finance-data_hexin-ifind-ds-stock-mcp__stock_highfreq_quotes` | A股实时快照与高频序列 | `{"symbols":"300033.SZ,300059,贵州茅台","indicators":"开盘价,最高价,最低价,收盘价,涨跌幅,成交量","data_mode":"highfreq","interval":1}` |

### 调用示例

**智能选股:**
```
使用 MCP 工具: mcp__plugin_ifind-finance-data_hexin-ifind-ds-stock-mcp__search_stocks
参数: {"query":"汽车零部件行业市值大于1000亿的股票"}
```

**财务数据查询:**
```
使用 MCP 工具: mcp__plugin_ifind-finance-data_hexin-ifind-ds-stock-mcp__get_stock_financials
参数: {"query":"同花顺、东方财富、大智慧、恒生电子的2025-09-30的净利润增速、ROE、ROA"}
```

**实时行情查询:**
```
使用 MCP 工具: mcp__plugin_ifind-finance-data_hexin-ifind-ds-stock-mcp__stock_highfreq_quotes
参数: {"symbols":"贵州茅台","indicators":"最新价,涨跌幅,成交量,成交额","data_mode":"real_time"}
```
