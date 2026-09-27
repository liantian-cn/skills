# 生命值比例

## 说明&逻辑

`UnitHealthPercent(unit, true, curve)` 把预测生命比例直接交给黑到白的颜色曲线。示例保留 usePredicted=true，不能改口为纯当前生命比例。无单位为黑色，与零生命相同。世界、生命、上限、预测治疗与吸收变化事件刷新；没有轮询。target／focus 版本需加入对应切换事件。

示例可独立放入已加载的插件 Lua 文件；每段是独立示例，不需同时加载。坐标与尺寸均为 UI 单位。

## Lua代码块

### 生命值比例

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

local UNIT_TOKEN = "player"

local CreateFrame              = CreateFrame
local UnitExists               = UnitExists
local UnitHealthPercent        = UnitHealthPercent
local After                    = C_Timer.After

local eventFrame               = CreateFrame("Frame")

local function update()
    if not output then return end
    local color = BLACK
    if UnitExists(UNIT_TOKEN) then
        color = UnitHealthPercent(UNIT_TOKEN, true, percentCurve)
    end
    output:SetVertexColor((color):GetRGBA())
end

local function initialize()

    update()
end

eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
eventFrame:RegisterUnitEvent("UNIT_HEALTH", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_MAXHEALTH", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_HEAL_PREDICTION", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_ABSORB_AMOUNT_CHANGED", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_HEAL_ABSORB_AMOUNT_CHANGED", UNIT_TOKEN)
eventFrame:SetScript("OnEvent", function()
    After(0, update)
end)
C_Timer.After(0, initialize)
```

### 目标／焦点版本

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

local UNIT_TOKEN = "target"

local CreateFrame              = CreateFrame
local UnitExists               = UnitExists
local UnitHealthPercent        = UnitHealthPercent
local After                    = C_Timer.After

local eventFrame               = CreateFrame("Frame")

local function update()
    if not output then return end
    local color = BLACK
    if UnitExists(UNIT_TOKEN) then
        color = UnitHealthPercent(UNIT_TOKEN, true, percentCurve)
    end
    output:SetVertexColor((color):GetRGBA())
end

local function initialize()

    update()
end

eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
if UNIT_TOKEN == "target" then
    eventFrame:RegisterEvent("PLAYER_TARGET_CHANGED")
elseif UNIT_TOKEN == "focus" then
    eventFrame:RegisterEvent("PLAYER_FOCUS_CHANGED")
end
eventFrame:RegisterUnitEvent("UNIT_HEALTH", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_MAXHEALTH", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_HEAL_PREDICTION", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_ABSORB_AMOUNT_CHANGED", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_HEAL_ABSORB_AMOUNT_CHANGED", UNIT_TOKEN)
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
```

## 来源与适用边界

方法基于已确认的游戏实现经验，具体API、单位与返回值限制见上文；替换单位、参数或客户端版本时需检查这些前提。独立示例仍需在接入环境验收显示、采样和状态转换。

仅在追溯或维护时读取 [来源记录与映射](../MAINTENANCE.md#源码覆盖映射)，日常使用无需加载原工程。
