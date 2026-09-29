# 技能充能数量转为灰度单格

## 说明&逻辑

`C_Spell.GetSpellCharges` 返回结构中的 `currentCharges` 是当前充能数量，不是下一层充能的恢复时间。选择法术书中的首个候选技能，把该字段直接交给 `formatter:FormatNumber`，再交给 FontString。

无已知候选、无充能结构、普通 nil 字段与真实零计数均显示黑色，不能仅凭本格区分。候选选择只判断普通法术书信息；数值 nil 判断先检查 `issecretvalue`，秘密数值直接进入格式器。示例 ID 50842 为具体充能技能候选；未学习时输出零。充能返回结构的存在性可判断，潜在秘密字段不参与 Lua 条件。

创建时初始化；进入世界、法术书变化、充能和次数事件后延后一轮刷新，并保留一秒兜底。进入世界与法术书变化时重新选择候选。

[NumericFormatter:FormatNumber 声明](https://github.com/Gethe/wow-ui-source/blob/live/Interface/AddOns/Blizzard_APIDocumentationGenerated/NumericFormatterAPIDocumentation.lua) 将秘密参数条件标为 `AllowedWhenUntainted`，需满足该条件。结果直接传给 `SetText`，不在 Lua 中读回、比较或解析结果。不能把显示输出当作已经解除秘密限制的普通字符串。

### 灰度编码与秘密值

初始化时生成 256 条固定文本规则：阈值 n 对应颜色码 `|cFFnnnnnn█|r`，其中每个 nn 是 n 的两位十六进制。循环变量是普通数字，实际秘密计数只交给原生格式器。没有用秘密数值执行 Lua 比较、算术、表索引或 `string.format`。

R=G=B 的颜色字节都等于输出计数，0 为黑色、1 为灰度 1、254 为灰度 254；255 及更大计数沿用最高阈值的白色规则。这里采用非负整数输入，不提供负数或小数编码语义。无需额外控件钳制，也不需要在规则中设置 `max`：最后一条输出文本本来就是固定白色。

把实心字形放大并居中，只让小格子保留其内部区域。文字不设置会截断字形的窄宽高，关闭阴影，并允许内嵌颜色码生效。4×4 是示例尺寸；1×1 物理像素也可以表达同一灰度，但必须确保字形完全覆盖采样位置。1 层只比黑色亮一个字节，人眼几乎看不出，不代表没有数值。

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

-- 初始化时只使用普通循环变量，不在 Lua 中处理秘密计数。
local formatter = C_StringUtil.CreateNumericRuleFormatter()
local rules = {}
for count = 0, 255 do
    rules[#rules + 1] = {
        threshold = count,
        format = string.format("|cFF%02X%02X%02X%s|r",
            count, count, count, CHARACTER),
    }
end
formatter:SetBreakpoints(rules)
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
local selectedSpellID
local eventFrame = CreateFrame("Frame")

local function SelectSpell()
    selectedSpellID = nil
    for _, spellID in ipairs(SPELL_IDS) do
        if C_SpellBook.IsSpellInSpellBook(spellID) then
            selectedSpellID = spellID
            return
        end
    end
end

local function Refresh()
    if selectedSpellID == nil then
        text:SetText(formatter:FormatNumber(0))
        return
    end
    local chargeInfo = C_Spell.GetSpellCharges(selectedSpellID)
    if chargeInfo == nil then
        text:SetText(formatter:FormatNumber(0))
        return
    end
    local value = chargeInfo.currentCharges
    if not issecretvalue(value) and value == nil then
        value = 0
    end
    text:SetText(formatter:FormatNumber(value))
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
return count  # 255 表示至少 255；0 的业务歧义见上文
```

容差由接入环境校准；理想纯色输入可取 0。三个通道相等只能排除部分异常，不能检测共同的亮度偏移。抗锯齿、透明度、颜色变换或其他覆盖可能改变输出，因此需检查实际渲染。不要再除以 255 当作计数，不要按白像素比例计算，也无需 OCR。

| 实际非负整数 | 显示 RGB 字节 | 解析输出 |
| ---: | --- | ---: |
| 0 | (0, 0, 0) | 0 |
| 1 | (1, 1, 1) | 1 |
| 254 | (254, 254, 254) | 254 |
| 255 | (255, 255, 255) | 255 |
| 256 | (255, 255, 255) | 255 |

## 来源与适用边界

本篇是独立灰度改写，完整 Lua 可放入已加载的插件文件，无需加载其他 reference 的代码；未包含插件 TOC。要求客户端提供所用格式器、文字接口及相应数据 API。字体必须包含 U+2588 实心字形。

本次静态校验不等于游戏内验收。应实际检查秘密状态下的显示、0/1/254/255/256、缺失数据与状态切换，以及不同 UI 缩放下的纯色覆盖。原始实现的使用结果不能自动扩展为本篇改写的实测结论。

仅追溯时读取 [单格计数来源记录](../MAINTENANCE.md#灰度单格计数来源)；日常理解与使用无需读取原工程。
