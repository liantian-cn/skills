# 辅助战斗推荐技能图标

## 说明&逻辑

`C_AssistedCombat.GetNextCastSpell(false)` 返回推荐技能 ID，普通 nil 时清空，否则用 GetSpellTexture 显示图标。显示推荐技能的核心纹理，Python按图标区域解析。世界／法术书事件加0.1秒轮询。

示例可独立放入已加载的插件 Lua 文件；每段是独立示例，不需同时加载。坐标与尺寸均为 UI 单位。

## Lua代码块

```lua
-- 独立示例：尺寸和偏移均为 UI 单位，由接入项目负责物理像素对齐。
local DISPLAY_WIDTH, DISPLAY_HEIGHT = 8, 8
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
local icon = canvas:CreateTexture(nil, "ARTWORK")
icon:SetAllPoints(canvas)
icon:Hide()

local random = math.random

local CreateFrame = CreateFrame
local After = C_Timer.After
local GetNextCastSpell = C_AssistedCombat.GetNextCastSpell
local GetSpellTexture = C_Spell.GetSpellTexture

local eventFrame = CreateFrame("Frame")

local function Refresh()

    local spellID = GetNextCastSpell(false)
    if spellID == nil then icon:Hide(); return end

    icon:SetTexture(GetSpellTexture(spellID))
    icon:Show()

end

local function Initialize()

    Refresh()
end

eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
eventFrame:RegisterEvent("SPELLS_CHANGED")
eventFrame:SetScript("OnEvent", function(_, event)
    After(0, function()
        Refresh()
    end)
end)
local elapsedTime = -random() * 0.1
eventFrame:SetScript("OnUpdate", function(_, elapsed)
    elapsedTime = elapsedTime + elapsed
    if elapsedTime >= 0.1 then
        elapsedTime = elapsedTime % 0.1
        Refresh()
    end
end)
C_Timer.After(0, Initialize)
```

## 解析

以下为 Python 风格伪代码，采样术语见 [通用约定](../SKILL.md#采样与解析约定)。

```text
if 图标内部区域.是黑色:
    return 无图标
return 固定算法指纹(图标内部区域的连续RGB字节)
# 与同尺寸、同裁剪、同渲染条件下采集的图标匹配；不从指纹直接推导技能ID。
```

## 来源与适用边界

方法基于已确认的游戏实现经验，具体API、单位与返回值限制见上文；替换单位、参数或客户端版本时需检查这些前提。独立示例仍需在接入环境验收显示、采样和状态转换。

仅在追溯或维护时读取 [来源记录与映射](../MAINTENANCE.md#源码覆盖映射)，日常使用无需加载原工程。
