## 指数板块服务

| MCP 工具 | 功能说明 | 典型参数 |
| --- | --- | --- |
| `mcp__plugin_ifind-finance-data_hexin-ifind-ds-index-mcp__index_data` | 指数行情、技术指标与估值指标 | `{"query":"沪深300、中证2000过去10个交易日的涨跌幅和收盘点数"}` |
| `mcp__plugin_ifind-finance-data_hexin-ifind-ds-index-mcp__sector_data` | 板块行情、财务分析与成分股指标 | `{"query":"医疗设备板块(中证行业)的成分股个数及过去5个交易日的成分股平均涨跌幅"}` |
| `mcp__plugin_ifind-finance-data_hexin-ifind-ds-index-mcp__index_highfreq_quotes` | 指数实时快照与高频序列 | `{"symbols":"000001.SH,000941,创业板指","indicators":"最高价,最新价,涨跌幅,上涨家数","data_mode":"real_time"}` |

### 调用示例

**指数行情查询:**
```
使用 MCP 工具: mcp__plugin_ifind-finance-data_hexin-ifind-ds-index-mcp__index_data
参数: {"query":"沪深300过去10个交易日的涨跌幅和收盘点数"}
```

**板块数据查询:**
```
使用 MCP 工具: mcp__plugin_ifind-finance-data_hexin-ifind-ds-index-mcp__sector_data
参数: {"query":"医疗设备板块(中证行业)的成分股个数及过去5个交易日的成分股平均涨跌幅"}
```

**实时行情查询:**
```
使用 MCP 工具: mcp__plugin_ifind-finance-data_hexin-ifind-ds-index-mcp__index_highfreq_quotes
参数: {"symbols":"创业板指","indicators":"开盘价,最高价,最低价,收盘价,日内累积涨跌幅","data_mode":"highfreq","interval":1}
```
