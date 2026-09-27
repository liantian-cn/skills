## 宏观经济和行业经济指标服务

宏观行业经济指标通过自然语言查询 `get_edb_data`。当指标名称不确定时，在 `query` 中描述指标、地区和时间范围，让服务返回匹配数据。

| MCP 工具 | 功能说明 | 典型参数 |
| --- | --- | --- |
| `mcp__plugin_ifind-finance-data_hexin-ifind-ds-edb-mcp__get_edb_data` | 指标数据查询 | `{"query":"光伏电池产量202301-202506"}` |

### 调用示例

**宏观经济指标查询:**
```
使用 MCP 工具: mcp__plugin_ifind-finance-data_hexin-ifind-ds-edb-mcp__get_edb_data
参数: {"query":"新能源汽车产量当月值（202301-202506）"}
```
