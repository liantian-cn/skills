# 北大法宝脚本取数

## 环境与命令

在技能根目录运行下列命令；从其他工作目录调用时使用脚本的绝对路径。运行要求 Node.js ≥22.18，直接执行 `.ts`，无需安装运行时依赖。开发检查使用 `npm ci`、`npm run check`、`npm test`；`npm run test:live` 会真实调用全部 10 项操作并消耗服务额度。

凭据只从进程环境变量 `PKU_LAW_API` 读取。缺失时提示用户配置后重新启动终端/会话；不写入代码、参数文件、日志或输出。无需向客户端注册服务或工具。内部传输沿用北大法宝协议，日常调用不会拉取全部工具清单。

```powershell
node scripts/pku-law.ts list
node scripts/pku-law.ts help get_law_item_content
```

只查看本次要用的操作帮助，不读取整个 `scripts/operations.json`。以下 PowerShell 示例避免内联 JSON 在不同 shell 中丢失引号：

```powershell
New-Item -ItemType Directory -Path query-results -Force | Out-Null
@{ title = '中华人民共和国民法典'; tiao_num = 585 } |
  ConvertTo-Json | Set-Content -LiteralPath query-results/query.json -Encoding utf8
node scripts/pku-law.ts get_law_item_content --args-file query-results/query.json --out query-results/article-585.json
```

也支持 `--args '<JSON对象>'`。`--out` 保存完整数据和协议响应，目标文件必须尚不存在，父目录须已创建。使用不同结果文件名保留多轮检索记录。输入文件与输出文件不得同名。

默认输出前 5 项及每个长文本字段的前 600 字符，保留案号、来源链接、日期、时效性等；`preview` 列出截断路径和省略字段。`returnedItems` 是本次接口返回数量，不是数据库总量；关键词接口最多返回前 20 项，没有分页参数，不得声称完成穷尽检索。语义检索可用 `size`（1–20）控制上游数量，`--limit` 只控制本地预览。

**引用前读取完整正文**：优先用 `--out` 保存结果，再按需读取其中的 `data`，避免重复收费请求；短查询可直接加 `--full` 输出完整数据。预览中的片段不能当作完整法条或裁判文书。

```powershell
$result = Get-Content -Raw -LiteralPath query-results/article-585.json | ConvertFrom-Json
$result.data.Data.FullText
```

## 操作选择

参数的完整类型、必填字段和筛选项以 `help <operation>` 为准。以下只提供路由和最小输入，不一次性加载全部参数。

| 操作 | 用途 | 最小参数示例 |
| --- | --- | --- |
| `get_law_list` | 法规标题/正文关键词检索，补充效力及日期信息 | `{"title":"中华人民共和国民法典"}` |
| `search_article` | 按问题语义找法条 | `{"text":"合同违约金调整","size":5}` |
| `get_article` | 按法规标题和中文条号取原文 | `{"title":"中华人民共和国民法典","number":"第五百八十五条"}` |
| `get_law_item_content` | 按数字条号取原文及元数据 | `{"title":"中华人民共和国民法典","tiao_num":585}` |
| `get_case_list` | 案例标题/正文关键词检索 | `{"title":"腾讯","fulltext":"合同纠纷"}` |
| `search_case` | 案情语义检索，可筛案件类型、法院、参照级别等 | `{"text":"腾讯公司合同纠纷","size":5}` |
| `law_recognition` | 识别、标准化文本中的法规名称或条文 | `{"text":"根据《中华人民共和国民法典》第五百八十五条"}` |
| `anhao_recognition` | 案号识别、验证和标准化 | `{"text":"（2013）民三终字第4号"}` |
| `adjust_provisions` | 依据引用线索检索权威法条，供比对 | `{"userlaw":[{"title":"中华人民共和国民法典","article_number":"585"}],"prompt":"民法典第五百八十五条规定是什么？"}` |
| `get_linked_content` | 为文本添加法规链接 | `{"message":"根据《中华人民共和国民法典》第五百八十五条，当事人可以约定违约金。"}` |

## 对接工作流

- **案例检索**：关键词用 `get_case_list`，事实模式用 `search_case`；已知案号先用 `anhao_recognition` 核实身份与链接，再检索/打开来源核对正文。关键词命中不代表案由或事实相同，仍执行相似度评估。接口没有独立的“当事人字段”“引用本法条的全部案例”或任意全文拉取功能；方法论中这些路径改用标题/正文检索与来源页面，不编造参数，也不把局部检索当作全量。
- **法规检索**：`get_law_list` 找法律及版本，`search_article` 找相关条文，`get_article` 或 `get_law_item_content` 精确读取。元数据为空不等于无效或现行有效；按法律标题、版本和来源匹配后补查。
- **效力与引用核验**：可先用 `law_recognition` 标准化，再用 `adjust_provisions` 取得权威原文；结合 `get_law_list` / `get_law_item_content` 的时效性、效力位阶和日期，继续执行效力核验工作流。`adjust_provisions` 返回检索结果，不提供“已校验通过”的证明；模型必须逐项比对条号、文字和版本。`get_article` 部分元数据可能为空，不能据此跳过核验。
- **其他法律资料**：先用法规/案例检索查覆盖范围内资料；立法说明、监管材料、学术观点及域外比较资料若未覆盖，使用可用的官方来源检索并记录出处，或标注 `[待检索]`。不宣称本脚本覆盖所有法律信息数据库。
- **文书审校**：需要时调用法规识别、案号识别、权威原文检索；用户需要加链接时用 `get_linked_content`。加链成功不证明法条现行有效。无识别结果、`hasLinks:false` 是有效空结果。

`adjust_provisions.userlaw` 只填用户明确提到的法规/条号；`answerlaw` 表达待检索的推测线索，不把推测写回用户原话；`prompt` 原样传递用户问题。未知条号或文字省略相应字段或使用空字符串，不填虚构内容（部分上游参数描述提到 null，但其声明类型为 string，优先按类型传值）。

原工作流中的历史法律与案例示例保留为方法演示；执行任务时仍须检索适用时点的版本，不能直接把示例当作现行依据。

## 失败处理与输出来源

成功输出 `ok:true`、`operation`、`retrievedAt`、`source` 和 `data`。`source` 是取数接口地址，报告中应另外引用 `data` 中的实际法规/案例链接。保留查询参数、检索时间和筛选条件作为检索记录。

失败在标准错误输出 `ok:false`、`code` 和脱敏 `message`，进程退出码为 1。包括缺少环境变量、无效参数、HTTP 401/429/5xx、45 秒单次请求超时、协议错误和业务错误。可用 `--timeout-ms` 调整超时。脚本不自动重试，以免重复消耗额度。

401 若提示检查剩余积分失败，应检查账号额度或服务状态，不能据此认定“没有案例”。失败或关键字段不足时，保留方法论分析并标记 `[待检索]` / `[待核验]`，不得用模型记忆填补。真实空数组则记录本次条件下未命中，并按工作流调整检索式。
