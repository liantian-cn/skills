# ifind-finance-data（iFinD）— 同花顺金融数据查询插件

通过同花顺 iFinD MCP API 提供覆盖中国金融市场的全方位数据查询能力，包括股票、基金、宏观经济、行业经济、新闻公告、债券、港美股及指数板块数据。

## 功能概览

| # | Skill | 中文名称 | 业务场景 |
|---|-------|---------|---------|
| 1 | `ifind-finance-data` | 同花顺金融数据查询 | 股票/基金/宏观/行业/新闻/债券/港美股/指数板块数据一站式查询 |
| 2 | `ifind-mcp-setup` | 同花顺 MCP 环境配置 | 工具不可用或验证报错时，引导获取密钥并配置 `IFIND_API_KEY` |

### 支持的数据范围

- **股票数据**：智能选股、基本信息、财务数据、行情、股东、风险指标、ESG评级、重大事件
- **基金数据**：基金搜索、基金资料、行情、持仓明细、持有人结构、基金公司信息
- **宏观经济数据**：GDP、CPI、PPI、行业经济指标、大宗商品数据（EDB）
- **新闻公告**：财经新闻、上市公司公告、热点事件
- **债券数据**：债券基本信息、行情、财务数据、特殊指标（信用债、可转债、回购等）
- **港美股数据**：智能选股、基本资料、行情、财务数据、公告事件
- **指数板块数据**：指数行情、板块行情、成分股数据

### 核心能力

1. **先搜再查**：不确定具体指标时，先用 `search_edb` 搜索，再通过 `get_edb_data` 获取数据
2. **查询合并**：股票基金数据查询支持多主体、多指标（最多 5 个）
3. **板块级查询**：支持以行业板块作为查询主体，获取板块内股票数据

## 前置条件

### 环境依赖

- **Node.js** 或 **Python >= 3.12**（至少具备其一）
- Python 方案需安装 `requests` 库：`pip install requests`

### API 密钥配置

需申请同花顺 iFinD MCP API 密钥，并在 `~/.claude/settings.json` 的 `env` 字段中配置：

```json
{
  "env": {
    "IFIND_API_KEY": "您的API密钥"
  }
}
```

密钥获取路径：https://mcp.51ifind.com/ → 个人中心 → 密钥。

> 插件内置 `SessionStart` hook：启动时会检查 `IFIND_API_KEY` 是否配置，未配置时提示调用 `ifind-mcp-setup` skill 完成配置。

### 并发限制

| 用户类型 | 每秒并发上限 |
|---------|------------|
| 免费版   | 2 个请求    |
| 个人版   | 5 个请求    |
| 企业版   | 10 个请求   |

## 使用方法

### Node.js 方案（推荐）

```javascript
const { call } = require('./call-node.js');

async function main() {
    // 智能选股
    const result = await call("stock", "search_stocks", {
        query: "电子行业市值排名前20的股票"
    });
    console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
```

### Python 方案

```python
from call import call

# 智能选股
result = call("stock", "search_stocks", {"query": "电子行业市值排名前20的股票"})
print(result)
```

## MCP 服务架构

本插件通过 iFinD MCP API 提供数据服务，所有请求通过 HTTPS 发送到 `api-mcp.51ifind.com:8643`，包含 7 个独立服务：

| 服务类型 | server_type | MCP 服务名称 |
|---------|-------------|-------------|
| 股票     | `stock`       | hexin-ifind-ds-stock-mcp |
| 基金     | `fund`        | hexin-ifind-ds-fund-mcp |
| 宏观行业 | `edb`         | hexin-ifind-ds-edb-mcp |
| 新闻公告 | `news`        | hexin-ifind-ds-news-mcp |
| 债券     | `bond`        | hexin-ifind-ds-bond-mcp |
| 港美股   | `global_stock` | hexin-ifind-ds-global-stock-mcp |
| 指数板块 | `index`       | hexin-ifind-ds-index-mcp |
