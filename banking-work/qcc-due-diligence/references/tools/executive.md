# executive 工具参考

只在当前工作流需要本类数据时读取。下表用于选工具；实际权限、参数与说明以 `node scripts/qcc.ts describe executive <工具名>` 为准。通过 `call executive <工具名> --params-file <路径或 ->` 获取资料。

| 工具 | 业务名称 | 必填参数 | 可选参数 |
| --- | --- | --- | --- |
| `get_executive_admin_penalty` | 董监高-行政处罚 | `searchKey`, `personName` | — |
| `get_executive_beneficial_owner` | 董监高-作为最终受益人 | `searchKey`, `personName` | — |
| `get_executive_case_filing` | 董监高-立案信息 | `searchKey`, `personName` | — |
| `get_executive_controlled_companies` | 董监高-控制企业 | `searchKey`, `personName` | — |
| `get_executive_court_notice` | 董监高-法院公告 | `searchKey`, `personName` | — |
| `get_executive_dishonest` | 董监高-失信被执行人 | `searchKey`, `personName` | — |
| `get_executive_equity_freeze` | 董监高-股权冻结 | `searchKey`, `personName` | — |
| `get_executive_equity_pledge` | 董监高-股权出质 | `searchKey`, `personName` | — |
| `get_executive_exit_restriction` | 董监高-限制出境 | `searchKey`, `personName` | — |
| `get_executive_hearing_notice` | 董监高-开庭公告 | `searchKey`, `personName` | — |
| `get_executive_high_consumption_ban` | 董监高-限制高消费 | `searchKey`, `personName` | — |
| `get_executive_historical_admin_penalty` | 董监高-历史行政处罚 | `searchKey`, `personName` | — |
| `get_executive_historical_case_filing` | 董监高-历史立案信息 | `searchKey`, `personName` | — |
| `get_executive_historical_court_notice` | 董监高-历史法院公告 | `searchKey`, `personName` | — |
| `get_executive_historical_dishonest` | 董监高-历史失信被执行人 | `searchKey`, `personName` | — |
| `get_executive_historical_equity_freeze` | 董监高-历史股权冻结 | `searchKey`, `personName` | — |
| `get_executive_historical_equity_pledge` | 董监高-历史股权出质 | `searchKey`, `personName` | — |
| `get_executive_historical_hearing_notice` | 董监高-历史开庭公告 | `searchKey`, `personName` | — |
| `get_executive_historical_high_consumption_ban` | 董监高-历史限制高消费 | `searchKey`, `personName` | — |
| `get_executive_historical_investments` | 董监高-历史对外投资 | `searchKey`, `personName` | — |
| `get_executive_historical_judgment_debtor` | 董监高-历史被执行人 | `searchKey`, `personName` | — |
| `get_executive_historical_judicial_docs` | 董监高-历史裁判文书 | `searchKey`, `personName` | — |
| `get_executive_historical_legal_rep_roles` | 董监高-历史担任法定代表人 | `searchKey`, `personName` | — |
| `get_executive_historical_partners` | 董监高-历史合作伙伴 | `searchKey`, `personName` | — |
| `get_executive_historical_positions` | 董监高-历史在外任职 | `searchKey`, `personName` | — |
| `get_executive_historical_pre_litigation_mediation` | 董监高-历史诉前调解 | `searchKey`, `personName` | — |
| `get_executive_historical_related_companies` | 董监高-历史全部关联企业 | `searchKey`, `personName` | — |
| `get_executive_historical_service_notice` | 董监高-历史送达公告 | `searchKey`, `personName` | — |
| `get_executive_historical_terminated_cases` | 董监高-历史终本案件 | `searchKey`, `personName` | — |
| `get_executive_investments` | 董监高-对外投资 | `searchKey`, `personName` | — |
| `get_executive_judgment_debtor` | 董监高-被执行人 | `searchKey`, `personName` | — |
| `get_executive_judicial_docs` | 董监高-裁判文书 | `searchKey`, `personName` | — |
| `get_executive_legal_rep_roles` | 董监高-担任法定代表人 | `searchKey`, `personName` | — |
| `get_executive_positions` | 董监高-在外任职 | `searchKey`, `personName` | — |
| `get_executive_pre_litigation_mediation` | 董监高-诉前调解 | `searchKey`, `personName` | — |
| `get_executive_property_reward_notice` | 董监高-财产悬赏公告 | `searchKey`, `personName` | — |
| `get_executive_related_companies` | 董监高-全部关联企业 | `searchKey`, `personName` | — |
| `get_executive_related_risk_scan` | 董监高关联风险扫描 | `searchKey`, `personName` | — |
| `get_executive_risk_scan` | 董监高风险扫描 | `searchKey`, `personName` | — |
| `get_executive_service_notice` | 董监高-送达公告 | `searchKey`, `personName` | — |
| `get_executive_stock_pledge` | 董监高-股权质押 | `searchKey`, `personName` | — |
| `get_executive_tax_violation` | 董监高-税收违法 | `searchKey`, `personName` | — |
| `get_executive_terminated_cases` | 董监高-终本案件 | `searchKey`, `personName` | — |
| `get_executive_valuation_inquiry` | 董监高-询价评估 | `searchKey`, `personName` | — |
