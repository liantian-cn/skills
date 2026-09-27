# operation 工具参考

只在当前工作流需要本类数据时读取。下表用于选工具；实际权限、参数与说明以 `node scripts/qcc.ts describe operation <工具名>` 为准。通过 `call operation <工具名> --params-file <路径或 ->` 获取资料。

| 工具 | 业务名称 | 必填参数 | 可选参数 |
| --- | --- | --- | --- |
| `get_administrative_license` | 行政许可 | `searchKey` | — |
| `get_advertising_review` | 广告审查 | `searchKey` | — |
| `get_asset_auction` | 资产拍卖 | `searchKey` | — |
| `get_bidding_info` | 招投标信息 | `searchKey` | `role`, `date_from` |
| `get_company_announcement` | 企业公告 | `searchKey` | — |
| `get_counterfeit_cosmetics` | 假冒化妆品 | `searchKey` | — |
| `get_credit_commitments` | 信用承诺 | `searchKey` | — |
| `get_credit_evaluation` | 信用评价 | `searchKey` | — |
| `get_entry_denied` | 未准入境 | `searchKey` | — |
| `get_financing_lease_info` | 租赁融资 | `searchKey` | — |
| `get_financing_records` | 融资信息 | `searchKey` | — |
| `get_food_safety` | 食品安全 | `searchKey` | — |
| `get_game_approval` | 游戏审批 | `searchKey` | — |
| `get_government_announcement` | 政府公告 | `searchKey` | — |
| `get_government_interview` | 政府约谈 | `searchKey` | — |
| `get_honor_info` | 荣誉信息 | `searchKey` | — |
| `get_import_export_credit` | 进出口信用 | `searchKey` | — |
| `get_investment_institution` | 投资机构 | `searchKey` | — |
| `get_land_grant_info` | 国有土地受让 | `searchKey` | — |
| `get_land_transfer_info` | 土地转让 | `searchKey` | — |
| `get_news_sentiment` | 新闻舆情 | `searchKey` | `sentiment`, `date_from` |
| `get_private_fund_manager` | 私募基金管理人 | `searchKey` | — |
| `get_product_recall` | 产品召回 | `searchKey` | — |
| `get_product_spot_check` | 产品抽查 | `searchKey` | — |
| `get_property_rights_transaction` | 产权交易 | `searchKey` | — |
| `get_qualifications` | 资质证书 | `searchKey` | `status`, `year` |
| `get_random_check` | 双随机抽查 | `searchKey` | — |
| `get_ranking_list_info` | 上榜榜单 | `searchKey` | — |
| `get_recruitment_info` | 招聘信息 | `searchKey` | — |
| `get_related_announcement` | 相关公告 | `searchKey` | — |
| `get_software_violation` | 软件违规 | `searchKey` | — |
| `get_spot_check_info` | 抽查检查 | `searchKey` | — |
| `get_taxpayer_qualification` | 纳税人资质 | `searchKey` | — |
| `get_tech_achievement` | 科技成果 | `searchKey` | — |
| `get_telecom_license` | 电信许可 | `searchKey` | — |
