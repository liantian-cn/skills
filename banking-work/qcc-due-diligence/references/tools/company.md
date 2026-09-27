# company 工具参考

只在当前工作流需要本类数据时读取。下表用于选工具；实际权限、参数与说明以 `node scripts/qcc.ts describe company <工具名>` 为准。通过 `call company <工具名> --params-file <路径或 ->` 获取资料。

| 工具 | 业务名称 | 必填参数 | 可选参数 |
| --- | --- | --- | --- |
| `get_actual_controller` | 实际控制人 | `searchKey` | — |
| `get_annual_reports` | 企业年报 | `searchKey` | — |
| `get_beneficial_owners` | 受益所有人 | `searchKey` | — |
| `get_branches` | 分支机构 | `searchKey` | — |
| `get_change_records` | 变更记录 | `searchKey` | — |
| `get_company_by_query` | 企业实体识别 | `searchKey` | — |
| `get_company_profile` | 企业简介 | `searchKey` | — |
| `get_company_registration_info` | 企业工商信息 | `searchKey` | — |
| `get_contact_info` | 联系方式 | `searchKey` | `excludeInvalidPhone` |
| `get_external_investments` | 对外投资 | `searchKey` | — |
| `get_financial_data` | 财务数据 | `searchKey` | — |
| `get_key_personnel` | 主要人员 | `searchKey` | — |
| `get_listing_info` | 上市信息 | `searchKey` | — |
| `get_shareholder_info` | 股东信息 | `searchKey` | — |
| `get_tax_invoice_info` | 税号开票信息 | `searchKey` | — |
| `verify_company_accuracy` | 企业准确性验证 | `searchKey`, `name` | — |
