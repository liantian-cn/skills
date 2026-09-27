# 技能对单位的射程判定

## 说明&逻辑

`C_Spell.IsSpellInRange(spellID, unit)` 的潜在秘密布尔直接交给颜色消费者。只对非秘密 nil 做空值处理；无单位为黑色。示例 49998，改用远程／打断技能 ID 即切换相应判据，不能视为精确距离。target／focus 切换、法术书事件加 0.1 秒兜底。配置应使用有效且有意义的射程技能；黑色不区分 nil 与明确不在范围。

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
local IsSpellInRange = C_Spell.IsSpellInRange
local issecretvalue = issecretvalue

local SPELL_ID = 49998

local eventFrame = CreateFrame("Frame")

local function Update()
    if not output then return end
    local inRange = IsSpellInRange(SPELL_ID, UNIT_TOKEN)
    if not issecretvalue(inRange) and inRange == nil then
        inRange = false
    end
    local rangeColor = EvaluateColorFromBoolean(inRange, WHITE, BLACK)
    local color = EvaluateColorFromBoolean(UnitExists(UNIT_TOKEN), rangeColor, BLACK)
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
eventFrame:RegisterEvent("SPELLS_CHANGED")

eventFrame:SetScript("OnEvent", function()
    After(0, Update)
end)

local elapsedTime = -random() * 0.1
eventFrame:SetScript("OnUpdate", function(_, elapsed)
    elapsedTime = elapsedTime + elapsed
    if elapsedTime >= 0.1 then
        elapsedTime = elapsedTime % 0.1
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
