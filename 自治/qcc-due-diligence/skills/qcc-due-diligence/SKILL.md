---
name: "qcc-due-diligence"
description: "Use when performing QCC company due diligence, KYB verification, credit risk review, litigation analysis, UBO screening, counterparty risk checks, or executive background screening through MCP tools."
version: "2026-08-03"
category: "企业尽调"
mcp_servers:
  - qcc-company
  - qcc-risk
  - qcc-ipr
  - qcc-operation
  - qcc-executive
  - qcc-legal-regulation
  - qcc-legal-case
  - qcc-document
tags:
  - 企查查
  - QCC
  - 尽调
  - KYB
  - UBO
  - 风控
---

# QCC Due Diligence

This skill uses MCP tools to query QCC company intelligence services. All tools are available as `mcp__plugin_qcc-due-diligence_qcc-{category}__{tool_name}`.

## Prerequisites

- MCP QCC servers must be configured and connected.
- Tool params must be exactly one JSON object. Do not pass `null`, arrays, strings, or extra arguments.
- User-facing answers, reports, summaries, and analysis must be written in Simplified Chinese.

## MCP Tool Categories

| Category | MCP Prefix | Description |
| --- | --- | --- |
| Company | `mcp__plugin_qcc-due-diligence_qcc-company__` | Company profile, ownership, filings, annual reports, and registry changes |
| Risk | `mcp__plugin_qcc-due-diligence_qcc-risk__` | Court, enforcement, tax, penalty, insolvency, and asset risk records |
| Executive | `mcp__plugin_qcc-due-diligence_qcc-executive__` | Executive, legal representative, controller, and individual risk records |
| IPR | `mcp__plugin_qcc-due-diligence_qcc-ipr__` | Intellectual property, digital assets, licenses, and franchise records |
| Operation | `mcp__plugin_qcc-due-diligence_qcc-operation__` | Operating activity, tenders, hiring, qualifications, financing, and news |
| Legal Case | `mcp__plugin_qcc-due-diligence_qcc-legal-case__` | Judicial case search and retrieval |
| Legal Regulation | `mcp__plugin_qcc-due-diligence_qcc-legal-regulation__` | Legal articles and regulation search |
| Document | `mcp__plugin_qcc-due-diligence_qcc-document__` | Document parsing and analysis |

## Invocation

Call MCP tools directly using the tool calling mechanism:

```
mcp__plugin_qcc-due-diligence_qcc-company__get_company_by_query({"searchKey": "Alibaba"})
mcp__plugin_qcc-due-diligence_qcc-risk__get_dishonest_info({"searchKey": "Alibaba"})
mcp__plugin_qcc-due-diligence_qcc-executive__get_executive_positions({"searchKey": "Alibaba", "personName": "JackMa"})
```

## Response Style

Before composing every user-facing clarification, progress or status update, error, partial result, or final report, load `references/humanizer-zh.md`. Write in neutral, conversational Simplified Chinese.

Due diligence accuracy, neutrality, traceability, compliance, workflow requirements, and explicit uncertainty take precedence over any conflicting humanizer advice. Preserve facts, certainty levels, quotations, sources, conclusions, names, dates, numbers, legal and financial terms, citations, and uncertainty exactly; do not invent or embellish them. Do not invent first-person experience or opinion, humor, emotions, intentional disorder, or ambiguity.

## Routing Gate

Follow this gate in order:

1. Identify the user's stated objective and map it to the canonical routing table below.
2. Treat the request as ambiguous only when it maps to no workflow with confidence, or when multiple interpretations remain and the user has not specified the intended scope. Missing optional details alone do not require clarification when the workflow scope is clear.
3. A request that names or clearly selects one or multiple workflows is clear. A multi-selection made in response to the 12-option clarification is also clear: proceed through the clear-request path without another routing clarification.
4. For an ambiguous request, ask exactly one concise question: “请问您希望开展以下哪一项或哪几项尽调工作？” Then show all 12 rows of the canonical routing table as the available options, allow the user to select one or multiple workflows, and wait for the answer. Do not begin substantive due diligence while waiting.
5. For a clear request, immediately load and execute the relevant workflow or workflows from the table without unnecessary clarification. Preserve the user's specified workflow order. Ask about priority or order only when execution order materially matters and the user did not provide one.

The following table is the single canonical workflow list:

| 编号 | 工作流 | 适用意图 | 文档 |
| --- | --- | --- | --- |
| 1 | 信用尽职调查 | 形成企业信用风险全景报告 | `references/workflows/credit-due-diligence.md` |
| 2 | 信用持续监控 | 持续跟踪企业信用与风险变化 | `references/workflows/credit-monitoring.md` |
| 3 | 交易对手风险审查 | 评估客户、供应商或合作方风险 | `references/workflows/counterparty-risk.md` |
| 4 | 企业经营健康扫描 | 快速判断企业经营状态与异常信号 | `references/workflows/business-health-scan.md` |
| 5 | 股权结构审查 | 核查股东、持股关系与控制结构 | `references/workflows/equity-structure.md` |
| 6 | 最终受益所有人筛查 | 识别并核验最终受益所有人（UBO） | `references/workflows/ubo-screening.md` |
| 7 | 诉讼分析 | 分析司法案件、争议与诉讼风险 | `references/workflows/litigation-analysis.md` |
| 8 | 高管背景调查 | 核查高管任职、关联企业与个人风险 | `references/workflows/executive-background.md` |
| 9 | 担保方审查 | 评估保证人或担保企业的代偿能力与风险 | `references/workflows/guarantor-check.md` |
| 10 | 贸易融资合规审查 | 核验贸易融资交易主体与合规风险 | `references/workflows/trade-finance-compliance.md` |
| 11 | 破产风险监控 | 跟踪破产、重整与清算相关风险 | `references/workflows/bankruptcy-monitor.md` |
| 12 | 企业身份核验 | 核验企业主体身份、登记状态与 KYB 要素 | `references/workflows/kyb-verification.md` |

## Usage Tips

1. Apply the routing gate before opening any workflow.
2. Company checks usually start with `mcp__plugin_qcc-due-diligence_qcc-company__get_company_registration_info`, then add shareholders, controllers, annual reports, changes, and contact records as needed.
3. Risk scans should combine court, enforcement, dishonesty, penalty, abnormal-operation, tax, insolvency, and guarantee records.
4. Use `mcp__plugin_qcc-due-diligence_qcc-executive__*` tools for individual background checks, `mcp__plugin_qcc-due-diligence_qcc-operation__*` for operating activity, and `mcp__plugin_qcc-due-diligence_qcc-ipr__*` for intellectual property.
