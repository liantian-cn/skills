# 单位是否存在

## 说明&逻辑

`UnitExists(unit)` 的布尔结果交给 `EvaluateColorFromBoolean`，存在白色，否则黑色。示例默认 target，可把 UNIT_TOKEN 改为 focus；相应单位切换事件已包含。事件延后刷新，加 1 秒兜底。

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

local UNIT_TOKEN = "target"

local random = math.random

local CreateFrame = CreateFrame
local After = C_Timer.After
local EvaluateColorFromBoolean = C_CurveUtil.EvaluateColorFromBoolean
local UnitExists = UnitExists

local eventFrame = CreateFrame("Frame")

local function Update()
    if not output then return end
    local color = EvaluateColorFromBoolean(UnitExists(UNIT_TOKEN), WHITE, BLACK)
    output:SetVertexColor((color):GetRGBA())
end

local function Initialize()

    Update()
end

eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
if UNIT_TOKEN == "target" then
    eventFrame:RegisterEvent("PLAYER_TARGET_CHANGED")
elseif UNIT_TOKEN == "focus" then
    eventFrame:RegisterEvent("PLAYER_FOCUS_CHANGED")
end
eventFrame:RegisterUnitEvent("UNIT_FLAGS", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_FACTION", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_HEALTH", UNIT_TOKEN)
eventFrame:SetScript("OnEvent", function()
    After(0, Update)
end)

local elapsedTime = -random()
eventFrame:SetScript("OnUpdate", function(_, elapsed)
    elapsedTime = elapsedTime + elapsed
    if elapsedTime >= 1 then
        elapsedTime = elapsedTime % 1
        Update()
    end
end)
C_Timer.After(0, Initialize)
```

## 解析

以下为 Python 风格伪代码，采样术语见 [通用约定](../SKILL.md#采样与解析约定)。

```text
return 区域.是白色  # 黑色表示条件不成立；异常像素由接入项目单独处理
```

## 来源与适用边界

方法基于已确认的游戏实现经验，具体API、单位与返回值限制见上文；替换单位、参数或客户端版本时需检查这些前提。独立示例仍需在接入环境验收显示、采样和状态转换。

仅在追溯或维护时读取 [来源记录与映射](../MAINTENANCE.md#源码覆盖映射)，日常使用无需加载原工程。
