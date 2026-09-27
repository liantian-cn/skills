# ipr 工具参考

只在当前工作流需要本类数据时读取。下表用于选工具；实际权限、参数与说明以 `node scripts/qcc.ts describe ipr <工具名>` 为准。通过 `call ipr <工具名> --params-file <路径或 ->` 获取资料。

| 工具 | 业务名称 | 必填参数 | 可选参数 |
| --- | --- | --- | --- |
| `get_app_info` | APP | `searchKey` | — |
| `get_commercial_franchise` | 商业特许经营 | `searchKey` | — |
| `get_copyright_work_info` | 作品著作权 | `searchKey` | `year` |
| `get_douyin_account` | 抖音 | `searchKey` | — |
| `get_integrated_circuit_layout` | 集成电路布图 | `searchKey` | — |
| `get_international_patent` | 国际专利 | `searchKey` | — |
| `get_internet_service_info` | 网络服务备案 | `searchKey` | — |
| `get_ipr_pledge` | 知产出质 | `searchKey` | — |
| `get_kuaishou_account` | 快手 | `searchKey` | — |
| `get_mini_program` | 小程序 | `searchKey` | — |
| `get_online_store` | 线上店铺 | `searchKey` | — |
| `get_patent_info` | 专利 | `searchKey` | `patent_type`, `status` |
| `get_software_copyright_info` | 软件著作权 | `searchKey` | `year` |
| `get_standard_info` | 标准信息 | `searchKey` | — |
| `get_trademark_document` | 商标文书 | `searchKey` | — |
| `get_trademark_info` | 商标 | `searchKey` | `status` |
| `get_wechat_official_account` | 微信公众号 | `searchKey` | — |
| `get_weibo_account` | 微博 | `searchKey` | — |
