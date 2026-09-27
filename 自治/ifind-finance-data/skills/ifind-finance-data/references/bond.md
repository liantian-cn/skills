## 债券服务

| MCP 工具 | 功能说明 | 典型参数 |
| --- | --- | --- |
| `mcp__plugin_ifind-finance-data_hexin-ifind-ds-bond-mcp__bond_basic_info` | 债券基本信息与发债主体资料 | `{"query":"23广东11的发行期限与发行总额"}` |
| `mcp__plugin_ifind-finance-data_hexin-ifind-ds-bond-mcp__bond_market_data` | 债券行情数据与估值分析 | `{"query":"26国债01近五日收盘价、涨跌幅与最新久期、凸性"}` |
| `mcp__plugin_ifind-finance-data_hexin-ifind-ds-bond-mcp__bond_financial_data` | 发债主体财务数据与指标 | `{"query":"24辽港01、24皮城01在20251231的资产负债率和ROE"}` |
| `mcp__plugin_ifind-finance-data_hexin-ifind-ds-bond-mcp__bond_special_data` | 信用债、回购、可转债等特殊指标 | `{"query":"华海转债、南航转债的最新转股价格及转换比例"}` |
| `mcp__plugin_ifind-finance-data_hexin-ifind-ds-bond-mcp__bond_highfreq_quotes` | 债券实时快照与高频序列 | `{"symbols":"240025.IB,199222,大连2521","indicators":"开盘价,最高价,最低价,收盘价,成交量","data_mode":"highfreq","interval":1}` |

### 调用示例

**基本信息查询:**
```
使用 MCP 工具: mcp__plugin_ifind-finance-data_hexin-ifind-ds-bond-mcp__bond_basic_info
参数: {"query":"23广东11、19黑龙江债01的发行期限与发行总额"}
```

**行情数据查询:**
```
使用 MCP 工具: mcp__plugin_ifind-finance-data_hexin-ifind-ds-bond-mcp__bond_market_data
参数: {"query":"26国债01近五日收盘价、涨跌幅与最新久期、凸性"}
```

**实时行情查询:**
```
使用 MCP 工具: mcp__plugin_ifind-finance-data_hexin-ifind-ds-bond-mcp__bond_highfreq_quotes
参数: {"symbols":"24附息国债25","indicators":"最新价,现手,振幅,最新成交价","data_mode":"real_time"}
```
