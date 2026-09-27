# pku-law

北大法宝（PKU Law）MCP 服务器与法律技能集合：面向中国法律场景，提供法律法规检索、案例检索、条文定位、引用校验等数据服务。

## 安装

```bash
/plugin marketplace add liantian-cn/cc-marketplace
/plugin install pku-law
```

## 环境变量

在 `~/.claude/settings.json` 的 `env` 字段（或系统环境变量）中配置：

```json
{
  "env": {
    "PKU_LAW_API": "你的 Key"
  }
}
```

Key 可在 https://mcp.pkulaw.com/console 获取。

## MCP 服务器

`.mcp.json` 配置了 9 个北大法宝 MCP 服务器（均使用 `PKU_LAW_API` 认证）：

| 服务器                           | 用途               |
| -------------------------------- | ------------------ |
| `pkulaw-law-search`              | 法律法规语义检索   |
| `pkulaw-law-keyword`             | 法律法规关键词检索 |
| `pkulaw-case-semantic-search`    | 案例语义检索       |
| `pkulaw-case-keyword`            | 案例关键词检索     |
| `pkulaw-law-item-keyword`        | 法条定位           |
| `pkulaw-law-recognition`         | 法规文本识别       |
| `pkulaw-case-number-recognition` | 案号识别           |
| `pkulaw-citation-validator`      | 引用校验           |
| `pkulaw-doc-link`                | 文档关联           |

## 使用

安装并配置密钥后，运行 `/mcp` 确认服务器已连接，然后提问，例如「检索《民法典》关于不可抗力的规定」或「查询某案的裁判文书」。

本插件还包含 `legal-chinese` 法律中文技能集合（法律推理、文书生成、案例检索等子技能），由社区持续维护更新。

## Setup Skill

`pkulaw-mcp-setup` 技能用于维护 `PKU_LAW_API` 环境变量：当 `mcp__plugin_pku-law_*` 工具不可用或报密钥错误时，引导用户到 https://mcp.pkulaw.com/console 获取密钥，并通过 `scripts/set_pkulaw_key.py` 配置。脚本会自动检测环境：在 Claude Code 中写入 `~/.claude/settings.json` 的 `env` 字段；在其他环境中设置用户级环境变量（Windows 通过 `[System.Environment]::SetEnvironmentVariable`，Linux/macOS 写入登录 shell 的 rc 文件）。

## Hooks

会话启动时（`SessionStart`）检查 `PKU_LAW_API` 环境变量是否已配置；缺失时向 Claude 注入提示，引导调用 `pkulaw-mcp-setup` skill 完成配置。

- 配置：`hooks/hooks.json`，脚本：`hooks/check_env.js`（基于 Node.js，需 `node` 在 PATH 中）
- Hook 在会话启动时加载，**修改后需重启 Claude Code 生效**
- 也可用 `/hooks` 命令查看当前会话已加载的 hooks
