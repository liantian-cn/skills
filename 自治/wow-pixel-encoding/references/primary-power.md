# 当前主要资源比例

## 说明&逻辑

`UnitPowerType("player")` 选择当前主要资源类型，再交给 `UnitPowerPercent` 求颜色。与固定资源方法分开：切换显示资源时仍跟随玩家主要类型。初始化、UNIT_POWER_UPDATE、UNIT_DISPLAYPOWER 事件刷新；单个色块只编码比率，不编码资源类型或最大值。

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
local UnitPowerType = UnitPowerType
local UnitPowerPercent = UnitPowerPercent
local CreateColorCurve = C_CurveUtil.CreateColorCurve
local Linear = Enum.LuaCurveType.Linear

local UNIT_TOKEN = "player"
local RATIO_MIN = 0.0
local RATIO_MAX = 1.0
local UNMODIFIED = false

local powerCurve = CreateColorCurve()
powerCurve:SetType(Linear)
powerCurve:AddPoint(RATIO_MIN, BLACK)
powerCurve:AddPoint(RATIO_MAX, WHITE)

local eventFrame = CreateFrame("Frame")

local function update()
    if not output then
        return
    end

    local color = UnitPowerPercent(UNIT_TOKEN, UnitPowerType(UNIT_TOKEN), UNMODIFIED, powerCurve)
    output:SetVertexColor((color):GetRGBA())
end

local function InitializePowerCell()

    update()
end

eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
eventFrame:RegisterUnitEvent("UNIT_POWER_UPDATE", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_DISPLAYPOWER", UNIT_TOKEN)
eventFrame:SetScript("OnEvent", function()
    After(0, function() update() end)
end)
C_Timer.After(0, InitializePowerCell)
```

## 解析

以下为 Python 风格伪代码，采样术语见 [通用约定](../SKILL.md#采样与解析约定)。

```text
比率 = 通道采样值 / 255.0
return 比率  # 需要百分数时乘以 100
```

## 来源与适用边界

方法基于已确认的游戏实现经验，具体API、单位与返回值限制见上文；替换单位、参数或客户端版本时需检查这些前提。独立示例仍需在接入环境验收显示、采样和状态转换。

仅在追溯或维护时读取 [来源记录与映射](../MAINTENANCE.md#源码覆盖映射)，日常使用无需加载原工程。
