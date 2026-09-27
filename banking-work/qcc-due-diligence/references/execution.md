# 脚本接口与通用执行纪律

## 环境与调用

要求 Node.js >= 22.18，当前进程环境变量 `QCC_API_KEY` 已设置。不要打印密钥、把密钥放入命令参数或写入文件。若操作系统刚设置变量，须让新的查询进程继承它。

所有示例以技能目录为工作目录。脚本直接运行 TypeScript；无需全局安装 tsx，也无需编译为 JavaScript。开发验证使用 `npm ci`、`npm run check`、`npm test`。

```powershell
# 只查看即将使用的一个工具的完整说明与参数
node scripts/qcc.ts describe company get_company_registration_info

# Windows 下使用标准输入，避免命令行 JSON 引号转义问题
'{"searchKey":"企查查科技股份有限公司"}' | node scripts/qcc.ts call company get_company_registration_info --params-file -

# 参数文件须为 UTF-8 JSON 对象；--out 保存完整结果，终端只返回保存路径
node scripts/qcc.ts call risk get_company_risk_scan --params-file query.json --out risk-result.json

# 工作流要求的资源发现、规范读取、最终报告模板读取
node scripts/qcc.ts resources list company
node scripts/qcc.ts resources read company qcc://policy/entity-anchoring
node scripts/qcc.ts resources read company qcc://skill/kyb-verification/report-template
```

- `call <service> <tool> --params-file <path|->`：只执行该业务查询。先在脚本内部确认当前工具可见及必填参数，再调用；服务端校验完整参数 schema。参数禁止传 `null`、数组或字符串。
- `describe <service> <tool>`：只输出一个工具的当前说明与 schema，不输出完整工具目录。
- `resources list <service>`：列出该服务的资源，自动读取目录分页。
- `resources read <service> <uri>`：读取指定远程资源。通用规范及 12 个工作流模板从 `company` 读取；服务专属字典从对应服务读取。
- 所有命令支持 `--timeout-ms`（默认 60000，范围 1–300000）和 `--out`。输出目录须已存在；已有文件不会覆盖，请使用新文件名。业务记录较多时保存完整结果，再按报告所需读取，不将整份结果反复注入上下文。临时资料放工作任务目录或技能内被忽略的 `query-results/`，不提交企业查询资料。
- 查询和资源读取输出原始 JSON-RPC 响应，业务返回位于 `result`（常见为 `content` 中的文本或 `structuredContent`）；不重写返回数字或小数位。工具返回 `isError: true` 时保留完整响应并以非零状态退出。
- 协议、HTTP、权限、网络、超时和本地错误以 stderr 的 JSON `error.code/message` 返回，进程非零退出。禁止将失败当作零记录；不自动重试业务请求，避免重复计费。HTTP 成功也须检查业务内容中的失败或缺失说明。
- 脚本内部实现 MCP 的初始化、会话、JSON/SSE 解码与工具发现；客户端无需连接 MCP。远程资料若仍使用旧工具标识，取其 `qcc-类别` 和最后的工具名，映射到 `call 类别 工具名`。远程资料中的插件配置、客户端安装和 OAuth 操作不适用于本 skill。

## 通用执行纪律及资源读取失败时的底线

- 企业查询必须先锚定主体。用户只给简称、品牌或股票简称时，将原始输入不加改写地传给 `company/get_company_by_query`；结果有歧义时让用户确定企业。下游 `searchKey` 使用确认后的完整登记名或 18 位统一社会信用代码，不自行补全名称。
- 个人查询必须同时提供已锚定企业的 `searchKey` 和 `personName`，避免同名错配。未给人名时按工作流取得法代、实控人等关键人，不自动遍历全公司人员。
- 保持工作流的风险扫描顺序：综合扫描先分诊，再对命中维度取明细；单一风险维度按原工作流直接查询。计数不足以支持风险定性，未取明细时明确披露。关联扫描遵守原有单层预警边界，不自动扩散关联图谱。
- 所有名称、日期、金额及比例来自本次成功返回，不从训练知识、历史测试数据或旧报告补齐。持股、受益比例和表决权完整保留原始字符串，不自行乘算、相减、加总或四舍五入；评级的确定性计算例外仍按各工作流原规则执行。
- 成功零记录、字段未返回、未调用、服务未授权及查询失败分别处理。必需数据缺失时遵守原工作流的部分评分、不可评分或报告限制，不编造评级。
- 远程规范仅作保留维度的参考，不得恢复本地已删除的服务、评分项或报告栏目。取数范围、评级规则与报告结构以本地工作流为准。远程规范按工作流逐项读取，失败时记录缺口并使用本文和工作流内联规则，不循环重试、不假装已读取。工具可用性以脚本实时发现结果为准，静态表和远程模板不能替代授权检查。
- 报告保持原工作流结构与业务判断边界；最终业务决定由客户及有权人员作出。诊断、脚本路径、URI、积分与配额不进入客户报告，实际数据缺口必须披露。

## 工作流参数与输出

各工作流的 `--depth`、`--format`、`--baseline` 等是分析需求约定，由执行 skill 的助手理解；不是本查询脚本的 CLI 选项，也不是已安装的斜杠命令。脚本只负责资料获取；报告、趋势分析及按需文档输出仍由原工作流完成。
