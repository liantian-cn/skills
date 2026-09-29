---
name: wow-pixel-encoding
description: 将 WoW 内置属性通过 Lua 显示为色块、进度条或图标，并说明 Python 如何从像素还原状态。用于选择或实现属性像素化方法、处理秘密值的显示路径、匹配编码与解析，以及维护这些经验；面向通用 WoW 插件，不提供自动操作、截图定位或轮转框架。
---

# WoW 属性像素编码

先按下表定位所需属性，只读对应 reference；有多种实现时按单位、返回类型和需要的输出选择。每篇给出原理、自包含 Lua、刷新机制、解析伪代码和来源。无需先搜索整个 references，也无需加载原项目。

## 方法索引

### 单位与玩家状态

| 需求／关键词 | 读取 |
| --- | --- |
| 存在；UnitExists | [单位是否存在](references/unit-exists.md) |
| 存活、死亡、灵魂；UnitIsDeadOrGhost | [单位是否存活](references/unit-alive.md) |
| 可攻击；UnitCanAttack | [单位是否可攻击](references/unit-can-attack.md) |
| 可协助；UnitCanAssist | [单位是否可协助](references/unit-can-assist.md) |
| 敌对关系；UnitIsEnemy | [单位是否敌对](references/unit-enemy.md) |
| 战斗状态；UnitAffectingCombat | [单位战斗状态](references/unit-combat.md) |
| 目标是自己；UnitIsUnit | [玩家是否选中自己](references/player-self-target.md) |
| 移动；IsPlayerMoving | [玩家是否移动](references/player-moving.md) |
| 坐骑或载具；IsMounted / UnitInVehicle | [玩家是否乘坐坐骑或载具](references/player-vehicle.md) |
| 地面施法选点；SpellIsTargeting | [是否正在选择地面技能目标](references/player-targeting-spell.md) |
| 输入／聊天焦点；GetCurrentKeyBoardFocus | [输入框是否持有键盘焦点](references/keyboard-focus.md) |
| 蓄力；UnitChannelInfo | [玩家是否正在蓄力](references/player-empowering.md) |
| 组队／团队；IsInGroup / IsInRaid | [玩家是否在队伍或团队](references/player-group.md) |
| 存活宠物；pet | [玩家是否有存活宠物](references/player-pet.md) |
| 职责；UnitGroupRolesAssigned | [玩家职责枚举](references/player-role.md) |

### 生命与资源

| 需求／关键词 | 读取 |
| --- | --- |
| 预测生命比例；UnitHealthPercent | [生命值比例](references/health-percent.md) |
| 固定资源比例：法力、怒气、集中值、能量、符文能量、星界能量、漩涡值、狂乱值、恶魔之怒、苦痛 | [固定类型资源比例](references/power-percent.md) |
| 跟随当前主要资源类型；UnitPowerType | [当前主要资源比例](references/primary-power.md) |
| 整数：连击点、圣能、真气、精华、奥术充能、整灵魂碎片 | [普通整数资源直接编码](references/power-integer.md) |
| 0～6枚可用符文；GetRuneCooldown | [可用符文数量](references/runes.md) |
| 小数灵魂碎片；0～50原始片段 | [包含十分之一的灵魂碎片](references/soul-shard-fragments.md) |
| 治疗／伤害吸收量严格超过阈值 | [吸收量是否严格超过阈值](references/absorb-threshold.md) |

### 技能、物品与施法

| 需求／关键词 | 读取 |
| --- | --- |
| 技能冷却剩余秒数、GCD；DurationObject | [技能冷却与公共冷却剩余时间](references/spell-cooldown.md) |
| 技能充能；currentCharges；NumericRuleFormatter | [充能数量灰度单格](references/spell-charges-single-cell.md) |
| 技能充能；已知量程的进度条方案 | [充能数量进度条](references/spell-charges-statusbar.md) |
| 当前可施法次数；GetSpellCastCount；不是累计次数 | [可施法次数灰度单格](references/spell-cast-count-single-cell.md) |
| 近战／远程／打断射程；IsSpellInRange | [技能对单位的射程判定](references/spell-range.md) |
| 已知技能／天赋；法术书 | [技能或天赋是否已知](references/spell-known.md) |
| 技能触发高亮；IsSpellOverlayed | [技能触发高亮](references/spell-overlay.md) |
| 技能可用性；IsSpellUsable | [技能当前可用性](references/spell-usable.md) |
| 有库存且冷却结束；不检查usable | [有库存的物品冷却就绪](references/item-cooldown.md) |
| 饰品／治疗石／药水可用且冷却结束；不检查库存 | [物品可使用且冷却就绪](references/item-usable-ready.md) |
| 施法／引导已经过比例 | [施法与引导已经过比例](references/cast-progress.md) |
| 当前施法／引导可打断 | [当前施法或引导是否可打断](references/cast-interruptible.md) |
| 玩家可观察施法目标名→单位编码 | [可观察的玩家施法目标](references/cast-target.md) |

### 光环与计数

| 需求／关键词 | 读取 |
| --- | --- |
| 血DK专精沸点；spec_boiling_point；1265982冷却事件触发的3秒本地倒计时 | [沸点事件倒计时](references/spec-boiling-point.md) |
| 指定buff／debuff是否存在；AuraContainer | [指定光环是否存在](references/aura-presence.md) |
| 光环剩余秒数；固定方块字符与字体颜色曲线 | [光环持续时间转为色块](references/aura-duration.md) |
| 光环层数；SetApplicationCount；NumericRuleFormatter | [光环层数灰度单格](references/aura-stacks-single-cell.md) |
| 光环层数；SetApplicationBar；进度条方案 | [光环层数转为进度条](references/aura-stacks-statusbar.md) |
| 大型防御增益；BIG_DEFENSIVE | [玩家大型防御增益](references/aura-big-defensive.md) |
| 可驱散buff／debuff；Magic、Enrage等类型 | [按可驱散类型筛选光环](references/aura-dispellable.md) |
| 姓名板中技能范围内可观察敌人数 | [技能范围内可观察敌人数](references/nameplate-range-count.md) |
| 范围内指定NeverSecret减益的可观察敌人数 | [范围内指定非秘密减益的可观察敌人数](references/nameplate-aura-count.md) |

### 图标

| 需求／关键词 | 读取 |
| --- | --- |
| 玩家／目标／焦点施法图标；潜在秘密纹理 | [施法与引导图标](references/cast-icon.md) |
| 辅助战斗推荐图标；GetNextCastSpell | [辅助战斗推荐技能图标](references/assisted-combat-icon.md) |
| 普通静态技能ID→图标；异步资源加载 | [普通技能 ID 的图标与异步加载](references/spell-icon.md) |

## 选择显示路径

| 方式 | 优先使用的场景 | Python 读取什么 |
| --- | --- | --- |
| Cell 色块 | 普通值可编码；原生 API 将秘密布尔、比例、DurationObject 映射为颜色；或数值规则格式器输出固定彩色文字 | 约定通道值、灰度计数、黑白状态或曲线反插值 |
| ValueBar 进度条 | 需要条长与已知量程的表达，或当前数据源缺少适用的单格显示接口；保留充能与层数的旧方案 | 白色填充相对黑白内容的比例，再结合固定量程 |
| IconTile 图标 | 施法纹理等不能在 Lua 中读取内容的值 | 固定裁剪区域的图像／指纹，与已采样图标匹配 |

能完整表达所需语义时优先选 Cell，尺寸可小至一个物理像素；4×4 只是示例尺寸，不是 API 要求。ValueBar 的宽度决定量化精度。光环持续时间可使用 Cell 字体颜色绑定，在适用场景优先选用这一紧凑的显示方式。吸收量阈值虽然外观是黑白块，内部仍使用 StatusBar。

光环层数、技能充能数量和可施法次数在满足对应 API 前提时优先使用灰度单格：256 条固定文字规则编码 0～255，最高阈值覆盖更大计数，不依赖辅助 StatusBar。需要区分超过 255 的计数时，不能把饱和白色当作精确值。

## 为什么使用分段曲线

一个8位通道的0～255只有256个等级，即255个相邻间隔。均匀编码整个量程，会把同样的精度分给每段数值；实际需求往往更关心冷却临近就绪或光环临近消失时的细小变化。

分段曲线可把更多颜色间隔分配给重要区间，让这些区间更实用、精细，同时降低其他区间的精度。它重新分配有限精度，不增加信息容量，也不保证所有区间都更准确。例如冷却0～10秒占100个颜色间隔，每阶0.1秒；120～245秒占25个间隔，每阶5秒。

设计时先确定有效量程与需要重点区分的区间，再选单调的颜色节点。相邻节点的理想数值步长为 `数值差 / 颜色字节差的绝对值`。保持节点单调才能按单一通道反插值；如端点被用来表示缺失、永久或饱和，要一并说明歧义。修改节点时必须同步修改Lua编码和Python反插值。实际准确度仍受渲染、采样与刷新间隔影响。

具体节点和精度表见 [技能冷却](references/spell-cooldown.md) 与 [光环持续时间](references/aura-duration.md)；示例节点可以按需求调整，并非所有属性的固定标准。

## 秘密值与刷新

- 普通值才能直接比较、运算、索引或控制 Lua 分支。潜在秘密布尔用 `C_CurveUtil.EvaluateColorFromBoolean`；比例／持续时间用原生颜色曲线；秘密计数可经原生 NumericRuleFormatter 输出文字或交 StatusBar；秘密纹理交 Texture。格式器调用须满足秘密参数条件，输出直接交给显示接口，不读回文本作判断。取得颜色后直接把 `color:GetRGBA()` 传给显示 API，不把通道拿回 Lua 判断。
- 需要判断普通 nil 时保留原示例的 `issecretvalue` 顺序。某条路径可直接计算不表示其他单位、版本或返回值也可计算。不要通过槽的可见性、文本或布局在 Lua 中反读秘密数据。
- AuraContainer 负责光环筛选和显隐，DurationText 绑定负责持续更新时间与颜色；不要再读取秘密 AuraData 或给所有光环强加轮询。
- 普通示例保留事件延后刷新；冷却、进度等在颜色求值后不会自行随时间变动，需要原示例的轮询。每篇分别保留事件、0.1秒／1秒轮询或容器原生更新，不套统一刷新间隔。
- 示例以已加载的插件 Lua 文件为宿主，不包含插件 TOC。使用所列 API／模板的客户端是前提；尺寸与偏移是 UI 单位，接入项目负责物理像素对齐、位置与采样区域。多段示例独立使用，合并时应调整位置，避免相互覆盖。

## 采样与解析约定

解析段是 Python 风格伪代码；“区域”“插值”“指纹”等由接入项目提供，不是需要安装的库。输入从已截取的显示区域开始，不规定截图 API 或定位算法。

- **通道采样值**：0～255 的浮点数。黑色包含0；像素为整数，多像素采样结果可为小数。选取不含边缘／装饰的稳定区域；1×1区域直接读取唯一像素，不能套用4×4的裁剪下标。
- **灰度与亮度值**：本技能默认 Lua 输出 R=G=B；此时可取指定通道，也可平均相同通道与区域内像素，称“亮度值”。这里不是加权感知亮度公式。
- **灰度整数计数**：单格计数的字节亮度就是计数，按格点舍入，不除以 255 作为计数；0 的缺失歧义和 255 的上限饱和见各篇。它与条长比例、生命百分比和时间曲线分别使用不同解析。
- **单通道编码**：若项目只用 R、G 或 B 表达数值，Lua曲线端点和Python必须约定同一通道，采样仅使用该通道，不能平均三个通道。截图若为 BGR／BGRA，先识别通道顺序。不同通道承载不同属性时分别解码。
- **归一化比率**：对 Cell，`通道采样值 / 255.0`，范围0～1；百分数再乘100。ValueBar比率另由填充比例计算，不能拿白色填充的亮度除255代替条长。
- **黑白布尔**：默认灰度方案用区域全白表示真、全黑表示假。若改成单通道方案，就判断约定通道满值／零值。异常或非纯色不能自动等同业务上的假；容差、失败结果由接入项目明确制定。
- **ValueBar**：在条的黑白内容区域内计算 `白像素数 / (白像素数 + 黑像素数)`，排除分隔和装饰；分母为零表示采样无效。结合已知量程恢复数值，整数格点按对应文档舍入。物理条宽不足会丢精度，增加UI宽度也须检查实际渲染宽度。
- **曲线解析**：使用与Lua同一组节点，按采样值升序排列做分段线性反插值；端点饱和意味着失去范围外信息。曲线黑白端点的业务含义由各篇定义，不能统一把白色当就绪、黑色当不存在。
- **图标**：固定区域尺寸、裁剪、RGB顺序和指纹算法；黑底表示无图标。指纹只能匹配同条件下采集的图标，不天然等同技能ID，也不保证多个共享纹理技能可区分。

保留来源量化与状态歧义，例如永久光环与高于曲线上限都可能全白。示例使用不透明白纹理／黑背景；实际截图应检查缩放、混色、字体裁剪和颜色变换，避免把渲染误差当成游戏状态。

## 经验与维护

每种方法按 WoW API、输入条件、显示方式和配对解析描述，保持独立于工程框架。原始经验的确认范围见维护指南，不自动延伸到新改写；独立示例仍需在接入环境验收。历史来源统一留在维护指南，版本变化时按需核验相关 API。工程控制开关、调度状态和配置框架不属于本技能的属性方法。

只在新增／修改经验时读取 [维护指南](MAINTENANCE.md)：包含文档模板、来源覆盖清单、验证流程和已排除实现。
