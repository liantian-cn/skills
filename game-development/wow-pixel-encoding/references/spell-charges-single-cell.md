# 技能充能数量转为灰度单格

## 说明&逻辑

`C_Spell.GetSpellCharges` 返回结构中的 `currentCharges` 是当前充能数量，不是下一层充能的恢复时间。选择法术书中的首个候选技能，将秘密数值直接传给 `string.format` 的三个 `%02X`，生成 R=G=B 的颜色码，再将结果直接交给 `FontString:SetText`。不创建 NumericRuleFormatter，也不使用辅助 StatusBar。

无已知候选、无充能结构、普通 nil 字段与真实零计数均显示黑色。充能结构的存在性可判断，潜在秘密字段不参与 Lua 条件。示例 ID 50842 为充能技能候选，已知计数范围为 0～2；未学习时输出零。候选选择只判断普通法术书信息；数值 nil 判断先检查 `issecretvalue`，秘密数值不比较、不计算、不作为表索引。

创建时初始化；进入世界、法术书变化、充能和次数事件后延后一轮刷新，并保留一秒兜底。进入世界与法术书变化时重新选择候选。

### 已知性代理与读取ID

某些替代技能需要通过授予它的技能确认已学习，但代理ID不一定能读取该形态的充能。可配置 `KNOWN_SPELL_IDS`，键是充能读取ID，值只用于已知性回退。例如432459／432472的已知性代理为1289728，仍分别将432459／432472交给GetSpellCharges。

代理不能证明当前形态，也不能把两个形态混成等价候选。需要区分形态时分别显示充能，并使用[防骑军备状态](spec-protection-holy-armaments.md)；适用专精和客户端验收边界见该文。默认空代理表不改变读取ID。

### 格式化路径与秘密值限制

不要将这条路径改成 `formatter:FormatNumber(secretValue)`：[接口声明](https://github.com/Gethe/wow-ui-source/blob/live/Interface/AddOns/Blizzard_APIDocumentationGenerated/NumericFormatterAPIDocumentation.lua) 标记 `AllowedWhenUntainted`，在不满足条件的插件执行环境中会拒绝秘密参数。光环层数的 `SetApplicationCount(text, { formatter = formatter })` 是原生绑定，不能据此推断插件主动调用 `FormatNumber` 也能接收秘密计数。

此处参考的是 `string.format → SetText` 显示路径；格式化结果直接用于显示，不读回、比较或解析。不能仅凭 `SetText` 接受秘密参数，推断任何客户端版本的 `string.format` 都支持秘密数值；当前灰度直传改写仍需游戏内验收。

### 灰度编码与范围

输入必须是已知范围内的 **0～255 非负整数**。`string.format("|cFF%02X%02X%02X%s|r", value, value, value, CHARACTER)` 将同一个计数写入 R/G/B：0 为黑色、1 为灰度 1、255 为白色。不需要 256 条规则，也没有按最大充能或次数缩放。

`%02X` 只保证最少两位，**不负责钳制**。256 会输出三位 `100`，破坏固定宽度颜色码，因此本例不支持大于 255、负数或小数，不承诺上限饱和。适用范围应依据技能语义预先确认，不能通过比较或计算秘密值进行运行时范围检查。此处 255 表示精确计数 255，与光环规则方案的“至少 255”不同。

把实心字形放大并居中，只保留格子内部区域。文字不限制窄宽高，关闭阴影，并允许内嵌颜色码生效。4×4 是示例尺寸；较小格子也必须确保字形覆盖有效采样位置。灰度 1 肉眼接近黑色，不代表零计数。

## Lua代码块

```lua
-- 独立示例：尺寸和偏移均为 UI 单位，接入时负责物理像素对齐。
local DISPLAY_WIDTH, DISPLAY_HEIGHT = 4, 4
local CHARACTER = "█"
local canvas = CreateFrame("Frame", nil, UIParent)
canvas:SetSize(DISPLAY_WIDTH, DISPLAY_HEIGHT)
canvas:SetPoint("TOPLEFT", UIParent, "TOPLEFT", 32, -32)
canvas:SetFrameStrata("TOOLTIP")
canvas:SetAlpha(1)
canvas:SetClipsChildren(true)
local background = canvas:CreateTexture(nil, "BACKGROUND")
background:SetAllPoints(canvas)
background:SetColorTexture(0, 0, 0, 1)

local text = canvas:CreateFontString(nil, "ARTWORK", "GameFontNormal")
text:SetPoint("CENTER", canvas, "CENTER")
text:SetJustifyH("CENTER")
text:SetJustifyV("MIDDLE")
text:SetFontHeight(88)
text:SetTextColor(1, 1, 1, 1)
text:SetShadowOffset(0, 0)
text:SetFixedColor(false)

-- 按需替换为本角色法术书中的技能；无候选时输出黑色。
local SPELL_IDS = { 50842 }
local KNOWN_SPELL_IDS = {} -- 可选：{ [432459] = 1289728, [432472] = 1289728 }
local selectedSpellID
local eventFrame = CreateFrame("Frame")

local function SelectSpell()
    selectedSpellID = nil
    for _, spellID in ipairs(SPELL_IDS) do
        local known = C_SpellBook.IsSpellInSpellBook(spellID) or C_SpellBook.IsSpellKnown(spellID)
        local knownID = KNOWN_SPELL_IDS[spellID]
        if not known and knownID then
            known = C_SpellBook.IsSpellInSpellBook(knownID) or C_SpellBook.IsSpellKnown(knownID)
        end
        if known then
            selectedSpellID = spellID
            return
        end
    end
end

local function Refresh()
    if selectedSpellID == nil then
        text:SetText("|cFF000000█|r")
        return
    end
    local chargeInfo = C_Spell.GetSpellCharges(selectedSpellID)
    if chargeInfo == nil then
        text:SetText("|cFF000000█|r")
        return
    end
    local value = chargeInfo.currentCharges
    if not issecretvalue(value) and value == nil then
        value = 0
    end
    text:SetText(string.format("|cFF%02X%02X%02X%s|r", value, value, value, CHARACTER))
end

eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
eventFrame:RegisterEvent("SPELLS_CHANGED")
eventFrame:RegisterEvent("SPELL_UPDATE_CHARGES")
eventFrame:RegisterEvent("SPELL_UPDATE_USES")
eventFrame:SetScript("OnEvent", function(_, event)
    C_Timer.After(0, function()
        if event == "PLAYER_ENTERING_WORLD" or event == "SPELLS_CHANGED" then
            SelectSpell()
        end
        Refresh()
    end)
end)

-- 保留一秒兜底；事件仍负责及时刷新。
local elapsedTime = -math.random()
eventFrame:SetScript("OnUpdate", function(_, elapsed)
    elapsedTime = elapsedTime + elapsed
    if elapsedTime >= 1 then
        elapsedTime = elapsedTime % 1
        Refresh()
    end
end)
C_Timer.After(0, function()
    SelectSpell()
    Refresh()
end)
```

## 解析

输入是已取得的格子图像，以下为 Python 风格伪代码，不包含截图或定位框架。颜色通道使用 0～255 字节尺度；若输入已经归一化到 0～1，先乘以 255。单个物理像素直接读取该像素；较大格子读取已确认不含边缘的内部区域。

```text
region = 已确认由实心字符覆盖的有效采样区域
if region 为空:
    return 无效采样

# 按采样来源明确 RGB/BGR 顺序，只读取颜色通道，不计 alpha。
r, g, b = region 各颜色通道的均值
if max(r, g, b) - min(r, g, b) > 通道容差:
    return 无效采样

gray = (r + g + b) / 3
count = floor(gray + 0.5)
if count < 0 or count > 255:
    return 无效采样
return count  # 输入范围已确认在 0～255；255 是精确值，0 可表示缺失
```

容差由接入环境校准；理想纯色输入可取 0。三个通道相等只能排除部分异常，不能检测共同的亮度偏移。抗锯齿、透明度、颜色变换或其他覆盖可能改变输出，因此需检查实际渲染。不要再除以 255 当作计数，不要按白像素比例计算，也无需 OCR。

| 实际非负整数 | 显示 RGB 字节 | 解析输出 |
| ---: | --- | ---: |
| 0 | (0, 0, 0) | 0 |
| 1 | (1, 1, 1) | 1 |
| 254 | (254, 254, 254) | 254 |
| 255 | (255, 255, 255) | 255 |
| 256 | 超出适用范围，颜色码不再有效 | 不支持 |

## 来源与适用边界

本篇是独立灰度改写，完整 Lua 可放入已加载的插件文件，无需加载其他 reference 的代码；未包含插件 TOC。要求客户端支持此处的秘密数值格式化显示路径、文字接口及相应数据 API。字体必须包含 U+2588 实心字形。

当前直接格式化灰度的改写尚未收到游戏内验收结果。应检查秘密状态下的显示、零值与业务最大计数、缺失数据与状态切换，以及不同 UI 缩放下的纯色覆盖。0/1/254/255 可作为静态编码样本；256 仅用于说明越界不受支持，不作为饱和测试。原始实现的使用结果不能自动扩展为本篇改写的实测结论。

仅追溯时读取 [单格计数来源记录](../MAINTENANCE.md#灰度单格计数来源)；日常理解与使用无需读取原工程。
