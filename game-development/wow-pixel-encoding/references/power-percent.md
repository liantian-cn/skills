# 固定类型资源比例

## 说明&逻辑

`UnitPowerPercent("player", powerType, false, curve)` 直接输出颜色；示例使用 RunicPower。无需读取秘密资源值做除法。资源、资源上限、显示类型变化事件刷新。比率不是绝对数量，恢复数量必须有与该场景一致的上限；例如已知当前资源上限为125时可乘125，但该上限不是所有职业或配置的通用常量。

可替换的已收录 Enum.PowerType：Mana、Rage、Focus、Energy、RunicPower、LunarPower、Maelstrom、Insanity、Fury、Pain。

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

local percentCurve = C_CurveUtil.CreateColorCurve()
percentCurve:SetType(Enum.LuaCurveType.Linear)
percentCurve:AddPoint(0, CreateColor(0 / 255, 0 / 255, 0 / 255, 1))
percentCurve:AddPoint(1, CreateColor(255 / 255, 255 / 255, 255 / 255, 1))

local CreateFrame              = CreateFrame
local UnitPowerPercent         = UnitPowerPercent
local After                    = C_Timer.After
local RunicPower               = Enum.PowerType.RunicPower

local eventFrame               = CreateFrame("Frame")

local function update()
    if not output then return end
    local color = UnitPowerPercent("player", RunicPower, false, percentCurve)
    output:SetVertexColor((color):GetRGBA())
end

local function initialize()

    update()
end

eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
eventFrame:RegisterUnitEvent("UNIT_POWER_UPDATE", "player")
eventFrame:RegisterUnitEvent("UNIT_MAXPOWER", "player")
eventFrame:RegisterUnitEvent("UNIT_DISPLAYPOWER", "player")
eventFrame:SetScript("OnEvent", function()
    After(0, update)
end)
C_Timer.After(0, initialize)
```

## 解析

以下为 Python 风格伪代码，采样术语见 [通用约定](../SKILL.md#采样与解析约定)。

```text
比率 = 通道采样值 / 255.0
return 比率  # 需要百分数时乘以 100
# 已知且适用的资源上限为 M 时，数量估计 = 比率 * M。
```

## 来源与适用边界

方法基于已确认的游戏实现经验，具体API、单位与返回值限制见上文；替换单位、参数或客户端版本时需检查这些前提。独立示例仍需在接入环境验收显示、采样和状态转换。

仅在追溯或维护时读取 [来源记录与映射](../MAINTENANCE.md#源码覆盖映射)，日常使用无需加载原工程。
