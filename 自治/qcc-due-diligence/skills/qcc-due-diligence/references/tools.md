# Tool Reference

All tools are available via MCP as `mcp__plugin_qcc-due-diligence_qcc-{category}__{tool_name}`.

## company

Company profile, ownership, filings, annual reports, and registry changes. MCP prefix: `mcp__plugin_qcc-due-diligence_qcc-company__`

| Tool | Required params | Common optional params | Label |
| --- | --- | --- | --- |
| `get_actual_controller` | `searchKey` | - | Actual Controller |
| `get_annual_reports` | `searchKey` | - | Annual Reports |
| `get_beneficial_owners` | `searchKey` | - | Beneficial Owners |
| `get_branches` | `searchKey` | - | Branches |
| `get_change_records` | `searchKey` | - | Change Records |
| `get_company_by_query` | `searchKey` | - | Company By Query |
| `get_company_profile` | `searchKey` | - | Company Profile |
| `get_company_registration_info` | `searchKey` | - | Company Registration Info |
| `get_contact_info` | `searchKey` | `excludeInvalidPhone` | Contact Info |
| `get_external_investments` | `searchKey` | - | External Investments |
| `get_financial_data` | `searchKey` | - | Financial Data |
| `get_key_personnel` | `searchKey` | - | Key Personnel |
| `get_listing_info` | `searchKey` | - | Listing Info |
| `get_shareholder_info` | `searchKey` | - | Shareholder Info |
| `get_tax_invoice_info` | `searchKey` | - | Tax Invoice Info |
| `verify_company_accuracy` | `searchKey`, `name` | - | Verify Company Accuracy |

## risk

Court, enforcement, tax, penalty, insolvency, and asset risk records. MCP prefix: `mcp__plugin_qcc-due-diligence_qcc-risk__`

| Tool | Required params | Common optional params | Label |
| --- | --- | --- | --- |
| `get_administrative_penalty` | `searchKey` | `date_from` | Administrative Penalty |
| `get_bankruptcy_reorganization` | `searchKey` | - | Bankruptcy Reorganization |
| `get_business_exception` | `searchKey` | - | Business Exception |
| `get_cancellation_record_info` | `searchKey` | - | Cancellation Record Info |
| `get_case_filing_info` | `searchKey` | `role`, `year` | Case Filing Info |
| `get_chattel_mortgage_info` | `searchKey` | - | Chattel Mortgage Info |
| `get_company_related_risk_scan` | `searchKey` | - | Company Related Risk Scan |
| `get_company_risk_scan` | `searchKey` | - | Company Risk Scan |
| `get_court_notice` | `searchKey` | `role`, `notice_type`, `year` | Court Notice |
| `get_default_info` | `searchKey` | - | Default Info |
| `get_disciplinary_list` | `searchKey` | - | Disciplinary List |
| `get_dishonest_info` | `searchKey` | - | Dishonest Info |
| `get_environmental_penalty` | `searchKey` | - | Environmental Penalty |
| `get_equity_freeze` | `searchKey` | - | Equity Freeze |
| `get_equity_pledge_info` | `searchKey` | - | Equity Pledge Info |
| `get_exit_restriction` | `searchKey` | - | Exit Restriction |
| `get_guarantee_info` | `searchKey` | - | Guarantee Info |
| `get_hearing_notice` | `searchKey` | `role`, `year` | Hearing Notice |
| `get_high_consumption_restriction` | `searchKey` | - | High Consumption Restriction |
| `get_judgment_debtor_info` | `searchKey` | - | Judgment Debtor Info |
| `get_judicial_auction` | `searchKey` | - | Judicial Auction |
| `get_judicial_document_detail` | `searchKey`, `documentId` | `section` | Judicial Document Detail |
| `get_judicial_documents` | `searchKey` | `role`, `year` | Judicial Documents |
| `get_land_mortgage_info` | `searchKey` | - | Land Mortgage Info |
| `get_liquidation_info` | `searchKey` | - | Liquidation Info |
| `get_pre_litigation_mediation` | `searchKey` | - | Pre Litigation Mediation |
| `get_property_asset_announcement` | `searchKey` | - | Property Asset Announcement |
| `get_public_exhortation` | `searchKey` | - | Public Exhortation |
| `get_serious_violation` | `searchKey` | - | Serious Violation |
| `get_service_announcement` | `searchKey` | - | Service Announcement |
| `get_service_notice` | `searchKey` | `role`, `year` | Service Notice |
| `get_simple_cancellation_info` | `searchKey` | - | Simple Cancellation Info |
| `get_stock_pledge_info` | `searchKey` | - | Stock Pledge Info |
| `get_tax_abnormal` | `searchKey` | - | Tax Abnormal |
| `get_tax_arrears_notice` | `searchKey` | - | Tax Arrears Notice |
| `get_tax_violation` | `searchKey` | - | Tax Violation |
| `get_terminated_cases` | `searchKey` | - | Terminated Cases |
| `get_valuation_inquiry` | `searchKey` | - | Valuation Inquiry |

## ipr

Intellectual property, digital assets, licenses, and franchise records. MCP prefix: `mcp__plugin_qcc-due-diligence_qcc-ipr__`

| Tool | Required params | Common optional params | Label |
| --- | --- | --- | --- |
| `get_app_info` | `searchKey` | - | App Info |
| `get_commercial_franchise` | `searchKey` | - | Commercial Franchise |
| `get_copyright_work_info` | `searchKey` | `year` | Copyright Work Info |
| `get_douyin_account` | `searchKey` | - | Douyin Account |
| `get_integrated_circuit_layout` | `searchKey` | - | Integrated Circuit Layout |
| `get_international_patent` | `searchKey` | - | International Patent |
| `get_internet_service_info` | `searchKey` | - | Internet Service Info |
| `get_ipr_pledge` | `searchKey` | - | Ipr Pledge |
| `get_kuaishou_account` | `searchKey` | - | Kuaishou Account |
| `get_mini_program` | `searchKey` | - | Mini Program |
| `get_online_store` | `searchKey` | - | Online Store |
| `get_patent_info` | `searchKey` | `patent_type`, `status` | Patent Info |
| `get_software_copyright_info` | `searchKey` | `year` | Software Copyright Info |
| `get_standard_info` | `searchKey` | - | Standard Info |
| `get_trademark_document` | `searchKey` | - | Trademark Document |
| `get_trademark_info` | `searchKey` | `status` | Trademark Info |
| `get_wechat_official_account` | `searchKey` | - | Wechat Official Account |
| `get_weibo_account` | `searchKey` | - | Weibo Account |

## operation

Operating activity, tenders, hiring, qualifications, financing, and news. MCP prefix: `mcp__plugin_qcc-due-diligence_qcc-operation__`

| Tool | Required params | Common optional params | Label |
| --- | --- | --- | --- |
| `get_administrative_license` | `searchKey` | - | Administrative License |
| `get_advertising_review` | `searchKey` | - | Advertising Review |
| `get_asset_auction` | `searchKey` | - | Asset Auction |
| `get_bidding_info` | `searchKey` | `role`, `date_from` | Bidding Info |
| `get_company_announcement` | `searchKey` | - | Company Announcement |
| `get_counterfeit_cosmetics` | `searchKey` | - | Counterfeit Cosmetics |
| `get_credit_commitments` | `searchKey` | - | Credit Commitments |
| `get_credit_evaluation` | `searchKey` | - | Credit Evaluation |
| `get_entry_denied` | `searchKey` | - | Entry Denied |
| `get_financing_lease_info` | `searchKey` | - | Financing Lease Info |
| `get_financing_records` | `searchKey` | - | Financing Records |
| `get_food_safety` | `searchKey` | - | Food Safety |
| `get_game_approval` | `searchKey` | - | Game Approval |
| `get_government_announcement` | `searchKey` | - | Government Announcement |
| `get_government_interview` | `searchKey` | - | Government Interview |
| `get_honor_info` | `searchKey` | - | Honor Info |
| `get_import_export_credit` | `searchKey` | - | Import Export Credit |
| `get_investment_institution` | `searchKey` | - | Investment Institution |
| `get_land_grant_info` | `searchKey` | - | Land Grant Info |
| `get_land_transfer_info` | `searchKey` | - | Land Transfer Info |
| `get_news_sentiment` | `searchKey` | `sentiment`, `date_from` | News Sentiment |
| `get_private_fund_manager` | `searchKey` | - | Private Fund Manager |
| `get_product_recall` | `searchKey` | - | Product Recall |
| `get_product_spot_check` | `searchKey` | - | Product Spot Check |
| `get_property_rights_transaction` | `searchKey` | - | Property Rights Transaction |
| `get_qualifications` | `searchKey` | `status`, `year` | Qualifications |
| `get_random_check` | `searchKey` | - | Random Check |
| `get_ranking_list_info` | `searchKey` | - | Ranking List Info |
| `get_recruitment_info` | `searchKey` | - | Recruitment Info |
| `get_related_announcement` | `searchKey` | - | Related Announcement |
| `get_software_violation` | `searchKey` | - | Software Violation |
| `get_spot_check_info` | `searchKey` | - | Spot Check Info |
| `get_taxpayer_qualification` | `searchKey` | - | Taxpayer Qualification |
| `get_tech_achievement` | `searchKey` | - | Tech Achievement |
| `get_telecom_license` | `searchKey` | - | Telecom License |

## executive

Executive, legal representative, controller, and individual risk records. MCP prefix: `mcp__plugin_qcc-due-diligence_qcc-executive__`

| Tool | Required params | Common optional params | Label |
| --- | --- | --- | --- |
| `get_executive_admin_penalty` | `searchKey`, `personName` | - | Executive Admin Penalty |
| `get_executive_beneficial_owner` | `searchKey`, `personName` | - | Executive Beneficial Owner |
| `get_executive_case_filing` | `searchKey`, `personName` | - | Executive Case Filing |
| `get_executive_controlled_companies` | `searchKey`, `personName` | - | Executive Controlled Companies |
| `get_executive_court_notice` | `searchKey`, `personName` | - | Executive Court Notice |
| `get_executive_dishonest` | `searchKey`, `personName` | - | Executive Dishonest |
| `get_executive_equity_freeze` | `searchKey`, `personName` | - | Executive Equity Freeze |
| `get_executive_equity_pledge` | `searchKey`, `personName` | - | Executive Equity Pledge |
| `get_executive_exit_restriction` | `searchKey`, `personName` | - | Executive Exit Restriction |
| `get_executive_hearing_notice` | `searchKey`, `personName` | - | Executive Hearing Notice |
| `get_executive_high_consumption_ban` | `searchKey`, `personName` | - | Executive High Consumption Ban |
| `get_executive_historical_admin_penalty` | `searchKey`, `personName` | - | Executive Historical Admin Penalty |
| `get_executive_historical_case_filing` | `searchKey`, `personName` | - | Executive Historical Case Filing |
| `get_executive_historical_court_notice` | `searchKey`, `personName` | - | Executive Historical Court Notice |
| `get_executive_historical_dishonest` | `searchKey`, `personName` | - | Executive Historical Dishonest |
| `get_executive_historical_equity_freeze` | `searchKey`, `personName` | - | Executive Historical Equity Freeze |
| `get_executive_historical_equity_pledge` | `searchKey`, `personName` | - | Executive Historical Equity Pledge |
| `get_executive_historical_hearing_notice` | `searchKey`, `personName` | - | Executive Historical Hearing Notice |
| `get_executive_historical_high_consumption_ban` | `searchKey`, `personName` | - | Executive Historical High Consumption Ban |
| `get_executive_historical_investments` | `searchKey`, `personName` | - | Executive Historical Investments |
| `get_executive_historical_judgment_debtor` | `searchKey`, `personName` | - | Executive Historical Judgment Debtor |
| `get_executive_historical_judicial_docs` | `searchKey`, `personName` | - | Executive Historical Judicial Docs |
| `get_executive_historical_legal_rep_roles` | `searchKey`, `personName` | - | Executive Historical Legal Rep Roles |
| `get_executive_historical_partners` | `searchKey`, `personName` | - | Executive Historical Partners |
| `get_executive_historical_positions` | `searchKey`, `personName` | - | Executive Historical Positions |
| `get_executive_historical_pre_litigation_mediation` | `searchKey`, `personName` | - | Executive Historical Pre Litigation Mediation |
| `get_executive_historical_related_companies` | `searchKey`, `personName` | - | Executive Historical Related Companies |
| `get_executive_historical_service_notice` | `searchKey`, `personName` | - | Executive Historical Service Notice |
| `get_executive_historical_terminated_cases` | `searchKey`, `personName` | - | Executive Historical Terminated Cases |
| `get_executive_investments` | `searchKey`, `personName` | - | Executive Investments |
| `get_executive_judgment_debtor` | `searchKey`, `personName` | - | Executive Judgment Debtor |
| `get_executive_judicial_docs` | `searchKey`, `personName` | - | Executive Judicial Docs |
| `get_executive_legal_rep_roles` | `searchKey`, `personName` | - | Executive Legal Rep Roles |
| `get_executive_positions` | `searchKey`, `personName` | - | Executive Positions |
| `get_executive_pre_litigation_mediation` | `searchKey`, `personName` | - | Executive Pre Litigation Mediation |
| `get_executive_property_reward_notice` | `searchKey`, `personName` | - | Executive Property Reward Notice |
| `get_executive_related_companies` | `searchKey`, `personName` | - | Executive Related Companies |
| `get_executive_related_risk_scan` | `searchKey`, `personName` | - | Executive Related Risk Scan |
| `get_executive_risk_scan` | `searchKey`, `personName` | - | Executive Risk Scan |
| `get_executive_service_notice` | `searchKey`, `personName` | - | Executive Service Notice |
| `get_executive_stock_pledge` | `searchKey`, `personName` | - | Executive Stock Pledge |
| `get_executive_tax_violation` | `searchKey`, `personName` | - | Executive Tax Violation |
| `get_executive_terminated_cases` | `searchKey`, `personName` | - | Executive Terminated Cases |
| `get_executive_valuation_inquiry` | `searchKey`, `personName` | - | Executive Valuation Inquiry |
