# 高频实时行情工具统一说明

- 高频实时行情用于查询交易日日内实时快照或高频时间序列。
- 当前支持 A股、基金、债券、指数四个品类的高频行情工具。
- 高频实时行情工具使用结构化参数，不使用 `query` 字段。
- 必填参数为 `symbols`、`indicators`、`data_mode`；`data_mode` 必须显式传入 `real_time` 或 `highfreq`。
- 当 `data_mode` 为 `highfreq` 时，可传 `interval` 指定 1/3/5/10/15/30/60 分钟周期。
- `symbols` 支持多个主体用英文逗号拼接，单次请求建议不超过 10 个。
- `indicators` 支持多个指标用英文逗号拼接，单次请求建议不超过 10 个。

## MCP 工具列表

| 品类 | MCP 工具 |
| --- | --- |
| A股 | `mcp__plugin_ifind-finance-data_hexin-ifind-ds-stock-mcp__stock_highfreq_quotes` |
| 基金 | `mcp__plugin_ifind-finance-data_hexin-ifind-ds-fund-mcp__fund_highfreq_quotes` |
| 债券 | `mcp__plugin_ifind-finance-data_hexin-ifind-ds-bond-mcp__bond_highfreq_quotes` |
| 指数 | `mcp__plugin_ifind-finance-data_hexin-ifind-ds-index-mcp__index_highfreq_quotes` |

## 调用示例

**A股实时行情:**
```
使用 MCP 工具: mcp__plugin_ifind-finance-data_hexin-ifind-ds-stock-mcp__stock_highfreq_quotes
参数: {"symbols":"贵州茅台","indicators":"最新价,涨跌幅,成交量,成交额","data_mode":"real_time"}
```

**基金高频行情:**
```
使用 MCP 工具: mcp__plugin_ifind-finance-data_hexin-ifind-ds-fund-mcp__fund_highfreq_quotes
参数: {"symbols":"516850","indicators":"开盘价,最高价,最低价,收盘价,成交量","data_mode":"highfreq","interval":1}
```

**债券实时行情:**
```
使用 MCP 工具: mcp__plugin_ifind-finance-data_hexin-ifind-ds-bond-mcp__bond_highfreq_quotes
参数: {"symbols":"24附息国债25","indicators":"最新价,现手,振幅,最新成交价","data_mode":"real_time"}
```

**指数高频行情:**
```
使用 MCP 工具: mcp__plugin_ifind-finance-data_hexin-ifind-ds-index-mcp__index_highfreq_quotes
参数: {"symbols":"创业板指","indicators":"开盘价,最高价,最低价,收盘价,日内累积涨跌幅","data_mode":"highfreq","interval":1}
```

## 工具边界

- 仅支持交易日日内数据查询，不支持历史数据查询。
- 债券高频实时行情仅支持交易所债券数据，不支持银行间市场。
- 用户询问"最新价、实时行情、盘中走势、1分钟/5分钟K线、日内分时"等需求时，优先选择对应服务的高频实时行情工具。
