# risk 工具参考

只在当前工作流需要本类数据时读取。下表用于选工具；实际权限、参数与说明以 `node scripts/qcc.ts describe risk <工具名>` 为准。通过 `call risk <工具名> --params-file <路径或 ->` 获取资料。

| 工具 | 业务名称 | 必填参数 | 可选参数 |
| --- | --- | --- | --- |
| `get_administrative_penalty` | 行政处罚 | `searchKey` | `date_from` |
| `get_bankruptcy_reorganization` | 破产重整 | `searchKey` | — |
| `get_business_exception` | 经营异常 | `searchKey` | — |
| `get_cancellation_record_info` | 注销备案 | `searchKey` | — |
| `get_case_filing_info` | 立案信息 | `searchKey` | `role`, `year` |
| `get_chattel_mortgage_info` | 动产抵押 | `searchKey` | — |
| `get_company_related_risk_scan` | 企业关联风险扫描 | `searchKey` | — |
| `get_company_risk_scan` | 企业风险扫描 | `searchKey` | — |
| `get_court_notice` | 法院公告 | `searchKey` | `role`, `notice_type`, `year` |
| `get_default_info` | 违约事项 | `searchKey` | — |
| `get_disciplinary_list` | 惩戒名单 | `searchKey` | — |
| `get_dishonest_info` | 失信信息 | `searchKey` | — |
| `get_environmental_penalty` | 环保处罚 | `searchKey` | — |
| `get_equity_freeze` | 股权冻结 | `searchKey` | — |
| `get_equity_pledge_info` | 股权出质 | `searchKey` | — |
| `get_exit_restriction` | 限制出境 | `searchKey` | — |
| `get_guarantee_info` | 担保信息 | `searchKey` | — |
| `get_hearing_notice` | 开庭公告 | `searchKey` | `role`, `year` |
| `get_high_consumption_restriction` | 限制高消费 | `searchKey` | — |
| `get_judgment_debtor_info` | 被执行人 | `searchKey` | — |
| `get_judicial_auction` | 司法拍卖 | `searchKey` | — |
| `get_judicial_document_detail` | 裁判文书详情 | `searchKey`, `documentId` | `section` |
| `get_judicial_documents` | 裁判文书 | `searchKey` | `role`, `year` |
| `get_land_mortgage_info` | 土地抵押 | `searchKey` | — |
| `get_liquidation_info` | 清算信息 | `searchKey` | — |
| `get_pre_litigation_mediation` | 诉前调解 | `searchKey` | — |
| `get_property_asset_announcement` | 财产悬赏公告 | `searchKey` | — |
| `get_public_exhortation` | 公示催告 | `searchKey` | — |
| `get_serious_violation` | 严重违法 | `searchKey` | — |
| `get_service_announcement` | 劳动仲裁 | `searchKey` | — |
| `get_service_notice` | 送达公告 | `searchKey` | `role`, `year` |
| `get_simple_cancellation_info` | 简易注销 | `searchKey` | — |
| `get_stock_pledge_info` | 股权质押 | `searchKey` | — |
| `get_tax_abnormal` | 税务非正常户 | `searchKey` | — |
| `get_tax_arrears_notice` | 欠税公告 | `searchKey` | — |
| `get_tax_violation` | 税收违法 | `searchKey` | — |
| `get_terminated_cases` | 终本案件 | `searchKey` | — |
| `get_valuation_inquiry` | 询价评估 | `searchKey` | — |
