# QCC Due Diligence — 企查查企业尽职调查插件

面向金融机构的企业尽职调查工具包，通过企查查（QCC）商业数据库提供覆盖企业全生命周期风控的 13 项业务技能。

## 功能概览

| # | Skill | 中文名称 | 业务场景 |
|---|-------|---------|---------|
| 1 | `qcc-due-diligence` | 企查查企业尽调 | KYB 核验、UBO 穿透、授信尽调、贷后监控、破产预警、诉讼分析、贸易融资合规等 |
| 2 | `qcc-mcp-setup` | 企查查 MCP 环境配置 | 工具不可用或验证报错时，引导获取密钥并配置 `QCC_API_KEY` |

## QCC_API_KEY 获取

访问 https://agent.qcc.com/ 注册登录后创建 QCC API Key，并在 `~/.claude/settings.json` 的 `env` 字段中配置：

```json
{
  "env": {
    "QCC_API_KEY": "您的API密钥"
  }
}
```

> 插件内置 `SessionStart` hook：启动时会检查 `QCC_API_KEY` 是否配置，未配置时提示调用 `qcc-mcp-setup` skill 完成配置。
