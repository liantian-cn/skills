---
name: qcc-due-diligence
description: 使用企查查数据开展银行企业尽调。当用户提出 UBO 受益所有人识别、KYB 企业核验、股权结构穿透分析、授信尽调报告、高管背景核查、诉讼风险评估、交易对手风险评估、信贷风险定期监控、贸易融资合规核查、经营健康度扫描、担保方资信核查、企业破产预警监控，或语义相同的业务场景时使用。通过 TypeScript 脚本按需取数。
---

# 企查查企业尽调

通过 `scripts/qcc.ts` 获取企查查实时资料，输出简体中文报告。脚本读取当前进程的 `QCC_API_KEY`；不安装插件、不向客户端注册工具。底层协议由脚本处理。

## 工作流路由

1. 先识别用户目的，再选择下表工作流。明确指定一个或多个工作流时直接执行，保留用户指定顺序；只有顺序实质影响结果且用户未说明时才询问。
2. 缺少可选参数不等于意图不清。仅在无法可靠匹配、或仍有多个未确定的解释时，问一次：“请问您希望开展以下哪一项或哪几项尽调工作？”展示下表全部 12 项，允许多选，等待回答后再开始实质尽调。
3. 用户明确选择后不重复询问路由。先读取 [脚本接口与通用纪律](references/execution.md)，再只加载选中的工作流；不要一次加载全部工作流或工具字典。

| 编号 | 工作流 | 触发关键词 / 场景 | 文档 |
| --- | --- | --- | --- |
| 1 | 信用尽职调查 | 授信尽调报告、企业信用全景评估 | [授信尽调](references/workflows/credit-due-diligence.md) |
| 2 | 信用持续监控 | 信贷风险定期监控、贷后风险变化 | [信用监控](references/workflows/credit-monitoring.md) |
| 3 | 交易对手风险审查 | 交易对手风险评估、客户或供应商风险 | [交易对手](references/workflows/counterparty-risk.md) |
| 4 | 企业经营健康扫描 | 经营健康度扫描、经营异常信号 | [经营健康](references/workflows/business-health-scan.md) |
| 5 | 股权结构审查 | 股权结构穿透分析、股东及控制关系 | [股权结构](references/workflows/equity-structure.md) |
| 6 | 最终受益所有人筛查 | UBO 受益所有人识别、最终受益人核验 | [UBO](references/workflows/ubo-screening.md) |
| 7 | 诉讼分析 | 诉讼风险评估、司法争议分析 | [诉讼分析](references/workflows/litigation-analysis.md) |
| 8 | 高管背景调查 | 高管背景核查、任职关联与个人风险 | [高管背景](references/workflows/executive-background.md) |
| 9 | 担保方审查 | 担保方资信核查、代偿能力与风险 | [担保方](references/workflows/guarantor-check.md) |
| 10 | 贸易融资合规审查 | 贸易融资合规核查、交易主体核验 | [贸易融资](references/workflows/trade-finance-compliance.md) |
| 11 | 破产风险监控 | 企业破产预警监控、重整清算风险 | [破产监控](references/workflows/bankruptcy-monitor.md) |
| 12 | 企业身份核验 | KYB 企业核验、主体身份及登记要素 | [KYB](references/workflows/kyb-verification.md) |

## 取数与输出

- 在本技能目录执行 `node scripts/qcc.ts ...`，或使用脚本绝对路径。要求 Node.js >= 22.18；日常运行无需安装 npm 依赖。
- 工作流中的 `company/get_company_registration_info` 等是“服务/工具名”简写，须通过脚本 `call` 执行。需要参数时先 `describe` 该工具；工具目录只在脚本内部按所属服务发现，不送入模型上下文。
- 企业历史专属查询及其评分项、报告栏目已移除；保留工商变更、人员服务历史记录与多年财报。评级不重新分配分值，明确披露覆盖范围收窄。定期监控仅使用可核验快照对比，无基准时只报告本期。
- 保持各工作流的主体识别、先扫后钻、数据来源、报告结构、评级及降级规则。脚本负责取数，不代替工作流判断、不自动遍历关联企业、不自动运行所有工具。
- 当前权限以实时返回为准。保留服务未授权时明确标记相应维度“本次未核验”；成功返回零条才可写“本次未发现公开记录”。
- 远程规范和报告模板按工作流规定通过 `resources` 命令读取；同会话去重，最终报告前按工作流要求读取模板。
- 报告用中性、准确的简体中文，保留原始比例字符串和全部小数位。缺失字段不推算、不编造。客户报告只用业务语言，不包含脚本、协议、内部工具名称或权限诊断。

需要查找业务工具时，按 [服务索引](references/tools.md) 只打开相关类别。
