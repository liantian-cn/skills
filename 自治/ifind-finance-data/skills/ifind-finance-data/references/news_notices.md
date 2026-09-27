## 新闻公告服务

- 新闻公告服务支持语义检索，返回相关段落而非公告全文。
- `query` 字段可同时包含报告元数据和查询内容。

| MCP 工具 | 功能说明 | 典型参数 |
| --- | --- | --- |
| `mcp__plugin_ifind-finance-data_hexin-ifind-ds-news-mcp__search_news` | 新闻资讯语义检索 | `{"query":"脑机接口技术最新进展","time_start":"2025-01-01","time_end":"2026-01-01","size":5}` |
| `mcp__plugin_ifind-finance-data_hexin-ifind-ds-news-mcp__search_notice` | 公告语义检索 | `{"query":"光迅科技2024年度报告 光模块技术","time_start":"2025-01-01","time_end":"2026-01-01","size":5}` |

### 调用示例

**新闻资讯查询:**
```
使用 MCP 工具: mcp__plugin_ifind-finance-data_hexin-ifind-ds-news-mcp__search_news
参数: {"query":"脑机接口技术最新进展","time_start":"2025-01-01","time_end":"2026-01-01","size":5}
```

**公告查询:**
```
使用 MCP 工具: mcp__plugin_ifind-finance-data_hexin-ifind-ds-news-mcp__search_notice
参数: {"query":"光迅科技2024年度报告 光模块技术","time_start":"2025-01-01","time_end":"2026-01-01","size":5}
```
