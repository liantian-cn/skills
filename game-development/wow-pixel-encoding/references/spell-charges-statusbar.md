# 技能充能数量

## 说明&逻辑

`C_Spell.GetSpellCharges` 返回结构中的 currentCharges 直接交给 StatusBar；Lua 不对秘密充能值做比较或缩放。MAX_CHARGES 是已知配置，不从秘密结果计算。选择首个法术书候选；无候选或无结构显示零，不能仅从零区分这些状态。保留充能、次数与法术书事件及 1 秒兜底。条宽和量程分别设置。

示例可独立放入已加载的插件 Lua 文件；每段是独立示例，不需同时加载。坐标与尺寸均为 UI 单位。

## Lua代码块

```lua
-- 独立示例：尺寸和偏移均为 UI 单位，由接入项目负责物理像素对齐。
local DISPLAY_WIDTH, DISPLAY_HEIGHT = 16, 4
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
local bar = CreateFrame("StatusBar", nil, canvas)
bar:SetAllPoints(canvas)
bar:SetFrameLevel(canvas:GetFrameLevel() + 1)
bar:SetOrientation("HORIZONTAL")
bar:SetColorFill(1, 1, 1, 1)

local random = math.random
local ipairs = ipairs

local CreateFrame = CreateFrame
local After = C_Timer.After
local IsSpellInSpellBook = C_SpellBook.IsSpellInSpellBook
local GetSpellCharges = C_Spell.GetSpellCharges

local MAX_CHARGES = 2
local SPELL_IDS = { 50842 }
local eventFrame = CreateFrame("Frame")

local selectedSpellID
local function SelectSpell()
    selectedSpellID = nil
    for _, spellID in ipairs(SPELL_IDS) do
        if IsSpellInSpellBook(spellID) then
            selectedSpellID = spellID
            return
        end
    end
end

local function Refresh()
    if not bar then return end
    local color = WHITE
    bar:SetColorFill(color:GetRGBA())
    if selectedSpellID then
        local chargeInfo = GetSpellCharges(selectedSpellID)
        if chargeInfo then
            bar:SetValue(chargeInfo.currentCharges)
            return
        end
    end
    bar:SetValue(0)
end

local function Initialize()

    bar:SetMinMaxValues(0, MAX_CHARGES)
    SelectSpell()
    Refresh()
end

eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
eventFrame:RegisterEvent("SPELLS_CHANGED")
eventFrame:RegisterEvent("SPELL_UPDATE_CHARGES")
eventFrame:RegisterEvent("SPELL_UPDATE_USES")
eventFrame:SetScript("OnEvent", function(_, event)
    After(0, function()
        if event == "PLAYER_ENTERING_WORLD" or event == "SPELLS_CHANGED" then SelectSpell() end
        Refresh()
    end)
end)
local elapsedTime = -random()
eventFrame:SetScript("OnUpdate", function(_, elapsed)
    elapsedTime = elapsedTime + elapsed
    if elapsedTime >= 1 then
        elapsedTime = elapsedTime % 1
        Refresh()
    end
end)
C_Timer.After(0, Initialize)
```

## 解析

以下为 Python 风格伪代码，采样术语见 [通用约定](../SKILL.md#采样与解析约定)。

```text
比率 = 白色像素数 / (白色像素数 + 黑色像素数)
return 比率 * MAX_CHARGES  # 返回float数量估计
# 若需整数充能数，可用floor(比率 * MAX_CHARGES + 0.5)，先确保像素精度足够。
```

## 来源与适用边界

方法基于已确认的游戏实现经验，具体API、单位与返回值限制见上文；替换单位、参数或客户端版本时需检查这些前提。独立示例仍需在接入环境验收显示、采样和状态转换。

仅在追溯或维护时读取 [来源记录与映射](../MAINTENANCE.md#源码覆盖映射)，日常使用无需加载原工程。
