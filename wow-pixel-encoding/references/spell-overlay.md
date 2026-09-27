# 技能触发高亮

## 说明&逻辑

`C_SpellActivationOverlay.IsSpellOverlayed` 查询首个法术书匹配候选的高亮状态并映射黑白。候选选择不是任意候选高亮的逻辑或；法术书变化时重选。保留高亮显示／隐藏事件，无周期轮询。

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

local CreateFrame = CreateFrame
local IsSpellInSpellBook = C_SpellBook.IsSpellInSpellBook
local IsSpellOverlayed = C_SpellActivationOverlay.IsSpellOverlayed
local EvaluateColorFromBoolean = C_CurveUtil.EvaluateColorFromBoolean
local ipairs = ipairs

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

    local isOverlayed = IsSpellOverlayed(selectedSpellID)
    local color = EvaluateColorFromBoolean(isOverlayed, WHITE, BLACK)
    output:SetVertexColor((color):GetRGBA())
end

local function InitializeOverlayCell()

    SelectSpell()
    update()
end

eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
eventFrame:RegisterEvent("SPELL_ACTIVATION_OVERLAY_GLOW_SHOW")
eventFrame:RegisterEvent("SPELL_ACTIVATION_OVERLAY_GLOW_HIDE")
eventFrame:RegisterEvent("SPELLS_CHANGED")
eventFrame:SetScript("OnEvent", function(_, event)
    After(0, function()
        if event == "SPELLS_CHANGED" then
            SelectSpell()
        end
        update()
    end)
end)
C_Timer.After(0, InitializeOverlayCell)
```

## 解析

以下为 Python 风格伪代码，采样术语见 [通用约定](../SKILL.md#采样与解析约定)。

```text
return 区域.是白色  # 黑色表示条件不成立；异常像素由接入项目单独处理
```

## 来源与适用边界

方法基于已确认的游戏实现经验，具体API、单位与返回值限制见上文；替换单位、参数或客户端版本时需检查这些前提。独立示例仍需在接入环境验收显示、采样和状态转换。

仅在追溯或维护时读取 [来源记录与映射](../MAINTENANCE.md#源码覆盖映射)，日常使用无需加载原工程。
