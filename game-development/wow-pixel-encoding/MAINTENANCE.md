# 维护 wow-pixel-encoding

只在新增、纠正或合并实现时读取本文件；日常使用从 [方法索引](SKILL.md#方法索引) 直接进入相关文档。

项目名称、历史路径与来源对比只放在本指南的追溯记录中；SKILL.md、reference正文及代码直接描述API与行为。依赖工程框架的控制开关或调度状态不列为属性方法，也不逐项登记其名称。

## 添加或更新一种方法

1. 找到原始Lua和配对Python解析，读实际代码、共享曲线和显示封装，不仅依赖文件名或旧注释。在本指南集中记录来源路径、版本线索及验证情况。优先复用同 API／编码机制的已有文档，单位、技能、资源变体通常用参数与差异说明合并。
2. 写清输入属性、单位／来源筛选、普通或秘密返回值、显示消费者、黑白／量程／曲线含义以及无法区分的状态。使用分段曲线时说明256阶内的精度分配目的，列出每段步长，不把节点当成项目固定常量。不同业务语义不能因为同为黑白就混为一个条件。
3. Lua使用原生 API，自建展示框体、背景与纹理／条；列出具体示例参数和所有必需常量。保留初始化、事件、延后刷新、周期更新或原生容器绑定，消除项目配置、显示类、模板占位符和媒体资源依赖。尺寸使用可调 UI 单位。
4. Python仅写解析伪代码，交代输入区域、通道、数值范围、量程、节点顺序、舍入和无效输入。不要顺便引入截图框架、轮转或技能执行。
5. 在 SKILL.md 的精确需求位置加入直接链接和必要关键词，更新本文件的源码覆盖映射。普通使用者不需要阅读维护清单才能找到方法。
6. 校验链接、Lua语法与编码／解析契约，再按实际可用环境验收。若新增或扩大了未验证行为，明确区分原经验和新改写，不把用户先前验证自动延伸到所有变体。

文件名使用英文小写短横线；正文中文、API标识原样保留。不要复制原项目的控制开关、档案、固定矩阵坐标或初始化框架。新增文件先查同名内容，保留已有未提交工作；提交仅包含实际改动的技能文件。

## Reference 模板

以下是写作结构，不是待填充的可执行 Lua。正式 reference 中代码必须自包含，不保留占位符。

````markdown
# 属性／方法名称

## 说明&逻辑

说明实际API及关键参数、普通／秘密值限制、显示方式、刷新机制与适用单位。
定义颜色端点／数值量程，以及不存在、nil、永久、到期、饱和等相关边界。
同方法变体用参数或差异表；不能只说“换单位”而遗漏对应事件和门控。

## Lua代码块

```lua
-- 完整可运行示例：原生框体创建、具体参数、编码、初始化及刷新。
```

## 解析

```text
Python风格伪代码：约定输入→取通道／条长／图标→恢复业务输出。
```

## 来源与适用边界

说明适用前提与接入验收边界；用链接指向维护指南中的来源记录。原工程名称和路径不写入本篇。
````

## 验证方式

- 使用 skill-creator 的 `scripts/quick_validate.py` 检查技能前置元数据；它不验证 WoW 行为。
- 检查每个 reference 均能从 SKILL.md 直接到达，所有相对链接有效，最低三个章节齐全。
- 提取 Lua 代码块做语法编译；检查不存在项目显示类、未定义局部常量或模板占位符。普通 Lua 编译器不提供 WoW API，语法通过不等于客户端可运行。
- 对照源实现验证事件、调用参数、nil／秘密分支、曲线端点与配对解析；同一修改不要只更新 Lua 或只更新伪代码。
- 验收适用的状态转换：单位出现／消失／切换，空闲／施法／引导结束，技能未学习，零／满充能，光环新增／消失／永久／到期，以及条长量化和颜色饱和。只检查对应方法，不增加无关测试套件。
- 运行 `git diff --check`；只提交技能目录。不要为了验证文档修改 PixBlood／Phantom 实现或游戏设置。

## 来源与确认记录

整理日期：2026-09-27。源码工作区为 PixBlood；当时仓库 HEAD 为 `d845e2233e650d9d5a75ec0ef704edb859cb27ec`。`references/Phantom` 是该工作区的参考目录，并非另一个独立 Git 仓库；不把父仓库 HEAD 冒称 Phantom 的独立版本。

- PixBlood 插件元数据为 Interface `120100`、Version `12.1.0.68209`。历史元数据不是本次运行客户端的检测结果。
- Phantom 注释多引用 WoW UI 源码 `12.1.0.69587`、revision `a89e9d0ceb7f6cd31e8fc5ca7df1a338ac0b1b58`；灵魂碎片记录另提目标 `12.1.0.69814`。这些是历史来源线索，本次没有冒称重新核验最新官方源码。
- 用户明确确认两处现有实现已经验证，并逐项确认目标／焦点可驱散增益、`Enrage = true`、PixBlood目标／焦点施法图标显示与清空、小数灵魂碎片路径均已验证。原注释的相关“未游戏实测”属于过时记录，不复制成当前待验结论；不修改源项目注释。
- 原经验的验证不等于本次去封装示例已经再次游戏测试。本次验收以文档、来源对照、语法与解码契约为限；接入后的UI缩放、颜色和状态转换仍由实际客户端验收。

### 保留的关键差异

| 方法 | 采用的约定／边界 |
| --- | --- |
| 冷却 | PixBlood秒数0/10/30/120/245→亮度255/155/115/25/0；不混入Phantom的0/5/30/155/375秒节点 |
| 光环时长 | 固定方块字符加字体颜色绑定，保留永久／饱和共白色、到期／缺失共黑色 |
| 光环身份 | 指定目标增益／减益沿用可协助／不可协助分类；驱散增益使用UnitIsEnemy；PLAYER范围包含宠物／载具 |
| 充能／层数进度条 | 保存在 *-statusbar.md；PixBlood解析为比例×量程的float，需要Phantom整数输出时显式采用其舍入，不静默更改 |
| 灰度单格计数 | *-single-cell.md 使用256条固定灰度规则，字节即计数；0保留缺失歧义，255表示达到上限；不使用辅助StatusBar |
| 普通整数资源 | 秘密、越界、非整数报错；小数灵魂碎片另用StatusBar，不泛化普通算术到秘密值 |
| 物品 | 库存+冷却就绪，与usable+资源+零冷却且不检查库存分别记录 |
| 玩家乘坐状态 | PixBlood把IsMounted和UnitInVehicle都计入；文件名in_vehicle不代表仅载具 |
| 施法目标 | 保留每秒清空、长施法可能提前丢失记录、秘密名字暂留旧值 |
| 姓名板 | 只数1～40中可观察且符合筛选的单位；指定光环要求NeverSecret，不能当全部附近敌人数 |
| 图标 | 去除角标资源与面板；秘密施法纹理不根据SetTexture返回值分支，普通静态ID路径保留加载事件 |

## 源码覆盖映射

### 灰度单格计数来源

- 版本：1.0.1，整理日期 2026-09-29；变更清单见 [CHANGElOG.txt](CHANGElOG.txt)。
- 来源为 Shigure，工作区 `E:/Documents/GitHub/Shigure`，分支 `forever-test`，提交 `9a93f6f5c2ecb782890b6d8990479cf3e2d982bd`。`Forever/Shingen/Shingen.toc` 声明 Interface `120100`、Version `1.2.1.30`，不是本次运行客户端的检测结果。
- `Forever/Shingen/core/block.lua` 的 `GetApplicationFormatter`、`SetupAuraApplicationPixel` 提供256条固定彩色文字规则和 `SetApplicationCount` 绑定的原始路径；对应 [光环层数灰度单格](references/aura-stacks-single-cell.md)。
- 同文件的 `CreateCountPixel` 分别读取 `GetSpellCharges().currentCharges` 与 `GetSpellCastCount`；调用入口为 `Forever/Shingen/unit/player.lua` 的 `RefreshPlayerBars`。分别对应 [充能数量灰度单格](references/spell-charges-single-cell.md) 与 [可施法次数灰度单格](references/spell-cast-count-single-cell.md)。后者是当前可施放次数，不是累计施法次数；现有旧充能文没有这条数据源，不虚构旧施法次数示例。
- 原工程的配对解析是 C# `Runtime/PixelScanDecoder.cs` 的 `TryDecodeTopRowBlock`，并非 Python：R/G 编码索引、B 编码数值。新示例移除索引通道，改为 R=G=B=计数字节；每篇自行给出 Python 风格解析伪代码。
- 充能与可施法次数的原工程路径使用辅助 StatusBar 钳制后以 `string.format` 生成颜色码。1.0.1 曾改写为 `formatter:FormatNumber(value)` 后直接 `SetText`；该直接调用现已因下述实测限制撤回。当前两篇改为 `string.format → SetText`，R=G=B，无辅助 StatusBar，限定输入为已知 0～255 整数，不再承诺超过 255 时饱和。
- 为保持独立示例的既有行为，充能与可施法次数使用法术书候选选择、事件延后刷新及一秒兜底；这部分继承旧充能 reference 的结构，不冒称原工程完全采用同一调度。光环例保留玩家增益及目标/焦点减益的筛选与门控，新增显式模板插件加载。
- 原进度条 reference 仅改名为 `aura-stacks-statusbar.md`、`spell-charges-statusbar.md`，保留原文；`aura-duration.md` 的颜色曲线版本未更改。历史 PixBlood/Phantom 来源映射继续指向旧方案。
- 用户已报告 Shigure 原实现可用；灰度、独立初始化和移除辅助钳制属于改写，不能继承为已游戏实测。光环规则保留 255 及以上饱和；充能与可施法次数直传方案仅覆盖 0～255，256 不受支持。秘密状态、实际字形覆盖、光环切换与零/满充能等仍需客户端验收。
- API 依据：[数值规则结构](https://github.com/Gethe/wow-ui-source/blob/live/Interface/AddOns/Blizzard_APIDocumentationGenerated/NumericRuleFormatterSharedDocumentation.lua)、[FormatNumber](https://github.com/Gethe/wow-ui-source/blob/live/Interface/AddOns/Blizzard_APIDocumentationGenerated/NumericFormatterAPIDocumentation.lua)。规则阈值为最低适用输入，直接格式化须满足 `AllowedWhenUntainted`；输出不用于 Lua 反读。上述链接为可变的 live 源码镜像。


#### 2026-09-29：秘密计数直接调用修正

- PixBlood 实测在 `048_spell_charges_blood_boil.lua` 调用 `CountFormatter:FormatNumber(currentCharges)` 报错：秘密参数只允许 untainted execution；日志中 `currentCharges` 为 secret number。这确认的是该直接调用路径失败，不是共享 formatter 或灰度编码失败。
- 对照 Shigure `CreateCountPixel`：充能／可施法次数使用 `string.format → SetText`，而光环层数使用 `SetApplicationCount` 原生绑定；不能把两种消费者混为一谈。
- PixBlood 提交 `ded42db` 修改 048、051 为秘密值直接格式化三个相同颜色通道；两技能计数为 0～2，用户明确不要辅助 StatusBar。061 与原 067（布局调整后为 052）已经使用原生光环绑定，无需改成主动格式化。
- 本次同步修正 `spell-charges-single-cell.md` 与 `spell-cast-count-single-cell.md`，后者同样曾直接调用受限方法，不能遗漏。保留原有数据源、候选选择和刷新机制。
- 当前没有收到 PixBlood 新路径的游戏内验证结果，也未单独实测可施法次数；只记录失败证据、源码一致性和静态验证。共享 formatter 仍用于光环规则，在初始化阶段创建一次。

### 沸点事件倒计时

- 2026-09-27：来源为 `E:/Documents/GitHub/Shigure/Fuyutsui/core/events.lua` 的 `SPELL_UPDATE_COOLDOWN` 与 `unit/player.lua` 的 `UpdateBoilingPoint`；普通 ID `1265982` 匹配后，以 `C_Timer.NewTicker` 每秒递减，共三次。源码分析不等于游戏内验证。
- 新实现位于 PixBlood `pix/lua/cells/066_spec_boiling_point.lua`，配对解析为 `pix/context.py` 的 `spec_boiling_point`。使用 `GetTime()+3` 截止时间、0.1 秒刷新、向上取整十分之一秒及 RGB 灰度 0～30；进入世界清零。属于明确改写，不能继承原实现或其他属性的验证状态。
- [独立方法](references/spec-boiling-point.md) 同步采用新编码和时间戳规则；游戏事件语义与实际像素状态转换尚待客户端验收。

路径相对 PixBlood 工作区。以下是审阅和维护清单，日常调用无需加载它。
PixBlood 的配对 Python 解码来自 `pix/context.py` 和 `pix/matrix.py`；共享曲线来自 `pix/lua/core/base.lua`，显示封装来自 `pix/lua/ui/`。
Phantom 每个目录同时参考 `template.lua`、`condition.py`、`plugin.toml`；同目录名映射表示整组实现，不仅是Lua。

### PixBlood cells

| 源文件（pix/lua/cells/） | Reference |
| --- | --- |
| `066_spec_boiling_point.lua` | [spec-boiling-point](references/spec-boiling-point.md) |
| `004_player_is_alive.lua` | [unit-alive](references/unit-alive.md) |
| `005_player_health_pct.lua` | [health-percent](references/health-percent.md) |
| `006_power_runic_power.lua` | [power-percent](references/power-percent.md) |
| `007_power_rune.lua` | [runes](references/runes.md) |
| `008_player_in_combat.lua` | [unit-combat](references/unit-combat.md) |
| `009_player_is_player_target.lua` | [player-self-target](references/player-self-target.md) |
| `010_player_is_moving.lua` | [player-moving](references/player-moving.md) |
| `011_player_in_vehicle.lua` | [player-vehicle](references/player-vehicle.md) |
| `012_player_is_targeting_spell.lua` | [player-targeting-spell](references/player-targeting-spell.md) |
| `013_player_is_chatting.lua` | [keyboard-focus](references/keyboard-focus.md) |
| `014_ticket_13_ready.lua` | [item-usable-ready](references/item-usable-ready.md) |
| `015_ticket_14_ready.lua` | [item-usable-ready](references/item-usable-ready.md) |
| `016_healthstone_ready.lua` | [item-usable-ready](references/item-usable-ready.md) |
| `017_heal_potion_ready.lua` | [item-usable-ready](references/item-usable-ready.md) |
| `018_player_has_heal_absorb.lua` | [absorb-threshold](references/absorb-threshold.md) |
| `019_player_has_damage_absorb.lua` | [absorb-threshold](references/absorb-threshold.md) |
| `020_player_cast_progress.lua` | [cast-progress](references/cast-progress.md) |
| `021_player_is_empowering.lua` | [player-empowering](references/player-empowering.md) |
| `022_target_is_exists.lua` | [unit-exists](references/unit-exists.md) |
| `023_target_is_alive.lua` | [unit-alive](references/unit-alive.md) |
| `024_target_can_attack.lua` | [unit-can-attack](references/unit-can-attack.md) |
| `025_target_can_assist.lua` | [unit-can-assist](references/unit-can-assist.md) |
| `026_target_health_pct.lua` | [health-percent](references/health-percent.md) |
| `027_target_cast_interruptible.lua` | [cast-interruptible](references/cast-interruptible.md) |
| `028_target_cast_progress.lua` | [cast-progress](references/cast-progress.md) |
| `029_target_in_melee_range.lua` | [spell-range](references/spell-range.md) |
| `030_target_in_ranged_range.lua` | [spell-range](references/spell-range.md) |
| `031_target_in_interrupt_range.lua` | [spell-range](references/spell-range.md) |
| `032_focus_is_exists.lua` | [unit-exists](references/unit-exists.md) |
| `033_focus_is_alive.lua` | [unit-alive](references/unit-alive.md) |
| `034_focus_can_attack.lua` | [unit-can-attack](references/unit-can-attack.md) |
| `035_focus_can_assist.lua` | [unit-can-assist](references/unit-can-assist.md) |
| `036_focus_health_pct.lua` | [health-percent](references/health-percent.md) |
| `037_focus_cast_interruptible.lua` | [cast-interruptible](references/cast-interruptible.md) |
| `038_focus_cast_progress.lua` | [cast-progress](references/cast-progress.md) |
| `039_focus_in_melee_range.lua` | [spell-range](references/spell-range.md) |
| `040_focus_in_ranged_range.lua` | [spell-range](references/spell-range.md) |
| `041_focus_in_interrupt_range.lua` | [spell-range](references/spell-range.md) |
| `042_spell_cd_global_cooldown.lua` | [spell-cooldown](references/spell-cooldown.md) |
| `043_spell_cd_mind_freeze.lua` | [spell-cooldown](references/spell-cooldown.md) |
| `044_spell_cd_reapers_mark.lua` | [spell-cooldown](references/spell-cooldown.md) |
| `045_spell_cd_dancing_rune_weapon.lua` | [spell-cooldown](references/spell-cooldown.md) |
| `046_spell_cd_deaths_caress.lua` | [spell-cooldown](references/spell-cooldown.md) |
| `047_spell_cd_raise_dead.lua` | [spell-cooldown](references/spell-cooldown.md) |
| `048_spell_charges_blood_boil.lua` | [spell-charges-statusbar](references/spell-charges-statusbar.md) |
| `051_spell_charges_death_and_decay.lua` | [spell-charges-statusbar](references/spell-charges-statusbar.md) |
| `054_item_cd_lights_potential.lua` | [item-cooldown](references/item-cooldown.md) |
| `055_player_has_dance_of_midnight.lua` | [aura-presence](references/aura-presence.md) |
| `056_player_has_buff_boiling_point.lua` | [aura-presence](references/aura-presence.md) |
| `057_player_has_buff_death_and_decay.lua` | [aura-presence](references/aura-presence.md) |
| `058_player_has_buff_crimson_scourge.lua` | [aura-presence](references/aura-presence.md) |
| `059_player_has_buff_exterminate.lua` | [aura-presence](references/aura-presence.md) |
| `060_player_buff_duration_bone_shield.lua` | [aura-duration](references/aura-duration.md) |
| `061_player_buff_stacks_bone_shield.lua` | [aura-stacks-statusbar](references/aura-stacks-statusbar.md) |
| `065_target_has_debuff_blood_plague.lua` | [aura-presence](references/aura-presence.md) |
| `I01_player_cast_icon.lua` | [cast-icon](references/cast-icon.md) |
| `I02_assisted_combat_icon.lua` | [assisted-combat-icon](references/assisted-combat-icon.md) |
| `I03_target_cast_icon.lua` | [cast-icon](references/cast-icon.md) |
| `I04_focus_cast_icon.lua` | [cast-icon](references/cast-icon.md) |

### Phantom conditions

目录前缀：`references/Phantom/phantom/conditions/`。

| 源目录 | Reference／排除原因 |
| --- | --- |
| `aura_player_buff_duration@dev` | 按用户要求跳过旧进度条方案；持续时间读取 [aura-duration](references/aura-duration.md)，不承诺旧百分比契约仍被保留 |
| `aura_player_buff_duration_pct@dev` | 按用户要求跳过旧进度条方案；持续时间读取 [aura-duration](references/aura-duration.md)，不承诺旧百分比契约仍被保留 |
| `aura_player_buff_stacks@dev` | [aura-stacks-statusbar](references/aura-stacks-statusbar.md) |
| `aura_target_debuff_duration@dev` | 按用户要求跳过旧进度条方案；持续时间读取 [aura-duration](references/aura-duration.md)，不承诺旧百分比契约仍被保留 |
| `aura_target_debuff_duration_pct@dev` | 按用户要求跳过旧进度条方案；持续时间读取 [aura-duration](references/aura-duration.md)，不承诺旧百分比契约仍被保留 |
| `aura_target_debuff_stacks@dev` | [aura-stacks-statusbar](references/aura-stacks-statusbar.md) |
| `focus_can_assist@dev` | [unit-can-assist](references/unit-can-assist.md) |
| `focus_can_attack@dev` | [unit-can-attack](references/unit-can-attack.md) |
| `focus_cast_icon@dev` | [cast-icon](references/cast-icon.md) |
| `focus_cast_interruptible@dev` | [cast-interruptible](references/cast-interruptible.md) |
| `focus_cast_progress@dev` | [cast-progress](references/cast-progress.md) |
| `focus_has_buff@dev` | [aura-presence](references/aura-presence.md) |
| `focus_has_debuff@dev` | [aura-presence](references/aura-presence.md) |
| `focus_has_dispellable_buff@dev` | [aura-dispellable](references/aura-dispellable.md) |
| `focus_health_pct@dev` | [health-percent](references/health-percent.md) |
| `focus_in_combat@dev` | [unit-combat](references/unit-combat.md) |
| `focus_in_range@dev` | [spell-range](references/spell-range.md) |
| `focus_is_alive@dev` | [unit-alive](references/unit-alive.md) |
| `focus_is_enemy@dev` | [unit-enemy](references/unit-enemy.md) |
| `focus_is_exists@dev` | [unit-exists](references/unit-exists.md) |
| `interrupt_blacklist_icons@dev` | [spell-icon](references/spell-icon.md) |
| `item_cooldown_ready@dev` | [item-cooldown](references/item-cooldown.md) |
| `player_cast_icon@dev` | [cast-icon](references/cast-icon.md) |
| `player_cast_progress@dev` | [cast-progress](references/cast-progress.md) |
| `player_cast_target@dev` | [cast-target](references/cast-target.md) |
| `player_damage_absorb@dev` | [absorb-threshold](references/absorb-threshold.md) |
| `player_has_big_defensive@dev` | [aura-big-defensive](references/aura-big-defensive.md) |
| `player_has_buff@dev` | [aura-presence](references/aura-presence.md) |
| `player_has_dispellable_debuff@dev` | [aura-dispellable](references/aura-dispellable.md) |
| `player_has_pet@dev` | [player-pet](references/player-pet.md) |
| `player_heal_absorb@dev` | [absorb-threshold](references/absorb-threshold.md) |
| `player_heal_potion_ready@dev` | [item-usable-ready](references/item-usable-ready.md) |
| `player_health_pct@dev` | [health-percent](references/health-percent.md) |
| `player_healthstone_ready@dev` | [item-usable-ready](references/item-usable-ready.md) |
| `player_in_combat@dev` | [unit-combat](references/unit-combat.md) |
| `player_in_group@dev` | [player-group](references/player-group.md) |
| `player_in_vehicle@dev` | [player-vehicle](references/player-vehicle.md) |
| `player_is_chatting@dev` | [keyboard-focus](references/keyboard-focus.md) |
| `player_is_empowering@dev` | [player-empowering](references/player-empowering.md) |
| `player_is_moving@dev` | [player-moving](references/player-moving.md) |
| `player_is_player_target@dev` | [player-self-target](references/player-self-target.md) |
| `player_is_targeting_spell@dev` | [player-targeting-spell](references/player-targeting-spell.md) |
| `player_melee_enemies_count@dev` | [nameplate-range-count](references/nameplate-range-count.md) |
| `player_primary_power@dev` | [primary-power](references/primary-power.md) |
| `player_range_aura_units_count@dev` | [nameplate-aura-count](references/nameplate-aura-count.md) |
| `player_role@dev` | [player-role](references/player-role.md) |
| `player_trinket_ready@dev` | [item-usable-ready](references/item-usable-ready.md) |
| `spec_power_arcane_charges@dev` | [power-integer](references/power-integer.md) |
| `spec_power_chi@dev` | [power-integer](references/power-integer.md) |
| `spec_power_combo_points@dev` | [power-integer](references/power-integer.md) |
| `spec_power_energy@dev` | [power-percent](references/power-percent.md) |
| `spec_power_essence@dev` | [power-integer](references/power-integer.md) |
| `spec_power_focus@dev` | [power-percent](references/power-percent.md) |
| `spec_power_fury@dev` | [power-percent](references/power-percent.md) |
| `spec_power_holy_power@dev` | [power-integer](references/power-integer.md) |
| `spec_power_insanity@dev` | [power-percent](references/power-percent.md) |
| `spec_power_lunar_power@dev` | [power-percent](references/power-percent.md) |
| `spec_power_maelstrom@dev` | [power-percent](references/power-percent.md) |
| `spec_power_mana@dev` | [power-percent](references/power-percent.md) |
| `spec_power_pain@dev` | [power-percent](references/power-percent.md) |
| `spec_power_rage@dev` | [power-percent](references/power-percent.md) |
| `spec_power_rune@dev` | [runes](references/runes.md) |
| `spec_power_runic_power@dev` | [power-percent](references/power-percent.md) |
| `spec_power_soul_shards@dev` | [power-integer](references/power-integer.md)、[soul-shard-fragments](references/soul-shard-fragments.md) |
| `spell_charges@dev` | [spell-charges-statusbar](references/spell-charges-statusbar.md) |
| `spell_cooldown@dev` | [spell-cooldown](references/spell-cooldown.md) |
| `spell_gcd@dev` | [spell-cooldown](references/spell-cooldown.md) |
| `spell_in_range@dev` | [spell-range](references/spell-range.md) |
| `spell_known@dev` | [spell-known](references/spell-known.md) |
| `spell_overlay@dev` | [spell-overlay](references/spell-overlay.md) |
| `spell_usable@dev` | [spell-usable](references/spell-usable.md) |
| `talent_known@dev` | [spell-known](references/spell-known.md) |
| `target_can_assist@dev` | [unit-can-assist](references/unit-can-assist.md) |
| `target_can_attack@dev` | [unit-can-attack](references/unit-can-attack.md) |
| `target_cast_icon@dev` | [cast-icon](references/cast-icon.md) |
| `target_cast_interruptible@dev` | [cast-interruptible](references/cast-interruptible.md) |
| `target_cast_progress@dev` | [cast-progress](references/cast-progress.md) |
| `target_has_buff@dev` | [aura-presence](references/aura-presence.md) |
| `target_has_debuff@dev` | [aura-presence](references/aura-presence.md) |
| `target_has_dispellable_buff@dev` | [aura-dispellable](references/aura-dispellable.md) |
| `target_health_pct@dev` | [health-percent](references/health-percent.md) |
| `target_in_combat@dev` | [unit-combat](references/unit-combat.md) |
| `target_in_range@dev` | [spell-range](references/spell-range.md) |
| `target_is_alive@dev` | [unit-alive](references/unit-alive.md) |
| `target_is_enemy@dev` | [unit-enemy](references/unit-enemy.md) |
| `target_is_exists@dev` | [unit-exists](references/unit-exists.md) |

## 防骑军备状态

- 2026-09-29：用户审核后移植并以spec_protection命名。来源为Shigure的`Retail/Fuyutsui/unit/player.lua:414`及`core/stateblocks.lua:232`，事件入口为`core/events.lua`的PLAYER_ENTERING_WORLD与SPELL_UPDATE_ICON。`class/Paladin.lua`中防御专精同时列出壁垒与武器充能；神圣专精仅列壁垒充能。共享实现不自动证明跨专精效果一致。
- 原实现以GetOverrideSpell(375576)匹配432459／432472，再输出index/255；本次加防骑门控、秘密返回保护、未知清零、法术书／专精事件和一秒兜底。源码证据不等于游戏实测，375576替代链及两次形态切换仍待客户端验收。
- 接入实现为`E:/Documents/GitHub/PixProtection/pix/lua/cells/058_spec_protection_holy_armaments.lua`，配对解析为`pix/context.py`同名属性。reference保持原生独立显示，不包含循环框架。
- Shigure的`Retail/Fuyutsui/core/spells.lua:46`将432459／432472的已知性回退到1289728，但充能仍读取原ID。本次在充能reference补充可选代理映射，不把1289728当作等价充能来源。
- 对照本地wow-ui-source的`SpellDocumentation.lua`：GetOverrideSpell无替代时返回输入ID；普通返回值可比较。未识别时清零，不因查询结果等于传入形态ID就认定该形态激活。


## 小队集中属性与首领状态

2026-10-01：新增四连续小队Cell、两类吸收百分比ValueBar、玩家当前施法目标生命周期和首领状态方法。

- 小队刷新参考 `E:/Documents/GitHub/PixBlood/references/DejaVu/DejaVu_Party/Status.lua`：先判断存在，合并队伍事件，空槽清零；本次接入为 `E:/Documents/GitHub/PixHoly/pix/lua/core/units.lua` 和四连续属性文件。
- 治疗吸收来源为 Shigure `Fuyutsui/core/block.lua` 的详细治疗计算器，源码版本 `ca5f864c868cb5651b628c17a09d75dd94e8b5c6`；伤害吸收版本使用已有 `UnitGetTotalAbsorbs` 路径配最大生命。两者口径分别说明，不把计算后的治疗吸收叫作原始总量。
- ValueBar参考 `PixHoly/pix/lua/ui/valuebar.lua`：内容5个4px Cell、完整占6 Cell，Python `getValueBar(x,5)` 的黑白比例配对。技能示例去掉工程显示类，使用原生背板、红色分隔与StatusBar；约5个百分点精度不是所有宽度的固定规则。
- 当前读条与待施法请求分开，目标无法匹配时输出未知；新 `party-cast-target.md` 不继承旧 `cast-target.md` 每秒清空和秘密目标名保留旧值的行为。该变体属于新增生命周期实现，不能继承旧实现的游戏实测结论。
- 首领完整枚举来自 Shigure `Fuyutsui/core/config.lua`；首领秒数、目标身份和玩家剩余读条接入到 PixHoly 060、064、067组。技能只记录显示和解析，不包含自动操作或治疗决策。
- 本地官方界面源码版本 `09b9db7948abc9b9648dedaab51eb0cf3ee67b31`。核对了 UnitDocumentation、LuaDurationObject、UnitHealPredictionCalculator、SimpleStatusBar、Blizzard_AuraContainer：DurationObject秘密对象检查、施法事件参数位置、GetHealAbsorbs第二返回值、同token重绑均按接口处理。
- 验证范围：独立Lua示例语法、技能元数据与链接、项目静态检查及像素协议。游戏内实际渲染、秘密状态和事件切换仍需接入验收；伤害吸收比例示例没有冒称已经在客户端实测。
