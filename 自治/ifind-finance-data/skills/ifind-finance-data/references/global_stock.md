## 港美股服务

| MCP 工具 | 功能说明 | 典型参数 |
| --- | --- | --- |
| `mcp__plugin_ifind-finance-data_hexin-ifind-ds-global-stock-mcp__global_stock_profile` | 港美股基本资料与股本结构 | `{"query":"智谱、minimax的所属行业、上市日期与发行价"}` |
| `mcp__plugin_ifind-finance-data_hexin-ifind-ds-global-stock-mcp__global_stock_quotes` | 港美股行情数据与技术指标 | `{"query":"苹果和特斯拉近10个交易日的涨跌幅、换手率"}` |
| `mcp__plugin_ifind-finance-data_hexin-ifind-ds-global-stock-mcp__global_stock_financial` | 港美股财务数据与估值指标 | `{"query":"Google和Meta在最新报告期的ROE、ROA、利润增速"}` |
| `mcp__plugin_ifind-finance-data_hexin-ifind-ds-global-stock-mcp__global_stock_events` | 港美股公告事件 | `{"query":"minimax的IPO日期、数量、价格及保荐人"}` |

### 调用示例

**基本资料查询:**
```
使用 MCP 工具: mcp__plugin_ifind-finance-data_hexin-ifind-ds-global-stock-mcp__global_stock_profile
参数: {"query":"苹果公司的所属行业与上市日期"}
```

**行情数据查询:**
```
使用 MCP 工具: mcp__plugin_ifind-finance-data_hexin-ifind-ds-global-stock-mcp__global_stock_quotes
参数: {"query":"苹果和特斯拉近10个交易日的涨跌幅、换手率"}
```
