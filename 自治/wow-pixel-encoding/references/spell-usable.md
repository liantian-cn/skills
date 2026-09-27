# 技能当前可用性

## 说明&逻辑

`C_Spell.IsSpellUsable` 只消费第一个返回值，经布尔颜色曲线显示；不在 Lua 分支判断潜在秘密可用性。首个法术书匹配候选优先；不单独编码 insufficientPower，也不等于冷却、距离等所有施法条件均满足。法术书事件与 0.1 秒轮询刷新。

示例可独立放入已加载的插件 Lua 文件；每段是独立示例，不需同时加载。坐标与尺寸均为 UI 单位。

## Lua代码块

```lua
-- 独立示例：尺寸和偏移均为 UI 单位，由接入项目负责物理像素对齐。
local DISPLAY_WIDTH, DISPLAY_HEIGHT = 4, 4
local canvas = CreateFrame("Frame", nil, UIParent)
canvas:SetSize(DISPLAY_WIDTH, DISPLAY_HEIGHT)
canvas:SetPoint("TOPLEFT", UIParent, "TOPLEFT", 32, -32)
canvas:SetFrameStrata("TOOLTIP")
canvas:SetAlpha(1)
local background = canvas:CreateTexture(nil, "BACKGROUND")
background:SetAllPoints(canvas)
background:SetColorTexture(0, 0, 0, 1)
local BLACK = CreateColor(0, 0, 0, 1)
local WHITE = CreateColor(1, 1, 1, 1)
local output = canvas:CreateTexture(nil, "ARTWORK")
output:SetAllPoints(canvas)
output:SetTexture("Interface\\Buttons\\WHITE8X8")
output:SetVertexColor(0, 0, 0, 1)

local After = C_Timer.After
local random = math.random

local CreateFrame = CreateFrame
local IsSpellInSpellBook = C_SpellBook.IsSpellInSpellBook
local IsSpellUsable = C_Spell.IsSpellUsable
local EvaluateColorFromBoolean = C_CurveUtil.EvaluateColorFromBoolean
local ipairs = ipairs

local UPDATE_INTERVAL = 0.1

local SPELL_IDS = { 47528 }

local selectedSpellID
local eventFrame = CreateFrame("Frame")

local function SelectSpell()
    selectedSpellID = nil
    for _, spellID in ipairs(SPELL_IDS) do
        if IsSpellInSpellBook(spellID) then
            selectedSpellID = spellID
            return
        end
    end
end

local function update()
    if not output then
        return
    end

    if not selectedSpellID then
        output:SetVertexColor((BLACK):GetRGBA())
        return
    end

    local isUsable = IsSpellUsable(selectedSpellID)
    local color = EvaluateColorFromBoolean(isUsable, WHITE, BLACK)
    output:SetVertexColor((color):GetRGBA())
end

local function InitializeUsableCell()

    SelectSpell()
end

eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
eventFrame:RegisterEvent("SPELLS_CHANGED")
eventFrame:SetScript("OnEvent", function()
    After(0, function()
        SelectSpell()
        update()
    end)
end)
local fastTimeElapsed = -random()
eventFrame:SetScript("OnUpdate", function(_, elapsed)
    fastTimeElapsed = fastTimeElapsed + elapsed
    if fastTimeElapsed > UPDATE_INTERVAL then
        fastTimeElapsed = fastTimeElapsed - UPDATE_INTERVAL
        update()
    end
end)
C_Timer.After(0, InitializeUsableCell)
```

## 解析

以下为 Python 风格伪代码，采样术语见 [通用约定](../SKILL.md#采样与解析约定)。

```text
return 区域.是白色  # 黑色表示条件不成立；异常像素由接入项目单独处理
```

## 来源与适用边界

方法基于已确认的游戏实现经验，具体API、单位与返回值限制见上文；替换单位、参数或客户端版本时需检查这些前提。独立示例仍需在接入环境验收显示、采样和状态转换。

仅在追溯或维护时读取 [来源记录与映射](../MAINTENANCE.md#源码覆盖映射)，日常使用无需加载原工程。
