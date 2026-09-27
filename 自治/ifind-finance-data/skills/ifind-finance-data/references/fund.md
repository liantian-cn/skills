## 基金服务

| MCP 工具 | 功能说明 | 典型参数 |
| --- | --- | --- |
| `mcp__plugin_ifind-finance-data_hexin-ifind-ds-fund-mcp__get_fund_profile` | 基金基本资料 | `{"query":"工银双盈债券A(010068)的发行日期与发行费率"}` |
| `mcp__plugin_ifind-finance-data_hexin-ifind-ds-fund-mcp__get_fund_market_performance` | 基金行情与业绩 | `{"query":"方正富邦策略精选A(010072)在近一月收益率"}` |
| `mcp__plugin_ifind-finance-data_hexin-ifind-ds-fund-mcp__get_fund_ownership` | 基金份额与持有人 | `{"query":"湘财长弘灵活配置混合A(010076)在2025-06-30的申购总份额和赎回总份额"}` |
| `mcp__plugin_ifind-finance-data_hexin-ifind-ds-fund-mcp__get_fund_portfolio` | 基金持仓明细 | `{"query":"工银优质成长混合A(010088)在2025-06-30披露报告中的股票投资占比"}` |
| `mcp__plugin_ifind-finance-data_hexin-ifind-ds-fund-mcp__get_fund_financials` | 基金财务指标 | `{"query":"泰康浩泽混合A(010081)在2025-06-30的利润"}` |
| `mcp__plugin_ifind-finance-data_hexin-ifind-ds-fund-mcp__get_fund_company_info` | 基金公司信息 | `{"query":"蜂巢丰瑞的所属基金公司基金经理数量"}` |
| `mcp__plugin_ifind-finance-data_hexin-ifind-ds-fund-mcp__fund_highfreq_quotes` | 基金实时快照与高频序列 | `{"symbols":"000307.OF,516850,易方达蓝筹精选混合","indicators":"最新价,IOPV净值估值,振幅,折价","data_mode":"real_time"}` |

### 调用示例

**行情业绩查询:**
```
使用 MCP 工具: mcp__plugin_ifind-finance-data_hexin-ifind-ds-fund-mcp__get_fund_market_performance
参数: {"query":"易方达蓝筹精选混合的基金净值和近一月收益率"}
```

**实时行情查询:**
```
使用 MCP 工具: mcp__plugin_ifind-finance-data_hexin-ifind-ds-fund-mcp__fund_highfreq_quotes
参数: {"symbols":"516850","indicators":"开盘价,最高价,最低价,收盘价,成交量","data_mode":"highfreq","interval":1}
```
