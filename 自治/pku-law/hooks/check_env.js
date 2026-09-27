#!/usr/bin/env node
// check_env.js — SessionStart hook: check whether PKU_LAW_API is configured.
// If missing, inject a context message so Claude can offer to run the
// pkulaw-mcp-setup skill. Exits 0 either way (informational only).

if (process.env.PKU_LAW_API) {
  process.exit(0);
}

const output = {
  continue: true,
  suppressOutput: false,
  systemMessage:
    "⚠️ PKU_LAW_API 未配置：mcp__plugin_pku-law_* 工具可能无法连接。若用户需要北大法宝法律检索，请调用 pkulaw-mcp-setup skill 引导用户访问 https://mcp.pkulaw.com/console 获取密钥并配置。",
};

if (process.env.CLAUDE_HOOK_OUTPUT_FILE) {
  require("fs").writeFileSync(
    process.env.CLAUDE_HOOK_OUTPUT_FILE,
    JSON.stringify(output)
  );
} else {
  process.stdout.write(JSON.stringify(output));
}

process.exit(0);
