# 服务索引

只读取当前工作流需要的类别；不要将全部工具表加载到上下文。每个查询均经 `node scripts/qcc.ts call <服务> <工具名> --params-file <路径或 ->` 执行。

| 工作流中的服务称呼 | CLI 服务参数 | 按需参考 |
| --- | --- | --- |
| qcc-company 企业基座 | `company` | [工商、股权、财务](tools/company.md) |
| qcc-risk 风险 | `risk` | [司法、经营及资产风险](tools/risk.md) |
| qcc-executive 人员画像 | `executive` | [高管、自然人及其关联风险](tools/executive.md) |
| qcc-operation 经营数据 | `operation` | [经营、资质、融资及新闻](tools/operation.md) |
| qcc-ipr 知识产权 | `ipr` | [知识产权及数字资产](tools/ipr.md) |

原插件的 `legal-regulation`、`legal-case`、`document` 服务路由也保留在脚本中，分别对应法规、司法案例和文档解析。现有 12 个工作流没有直接绑定它们的具体工具，不自动调用；确有需要时依据对应服务当前字典确定工具名，再 `describe`，不能猜测工具、参数或把企业查询参数强加给它们。

静态表只帮助选择工具。`describe` 返回当前单工具的完整 schema；`call` 也会在脚本内部检查当前工具目录及必填参数。服务端新增、移除或未授权的工具不能仅凭表格认定可用。
