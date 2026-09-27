# 可观察的玩家施法目标

## 说明&逻辑

`UNIT_SPELLCAST_SENT` 的普通目标名与 player、party1～4、raid1～40 的普通 UnitName 比较。秘密目标名暂留旧值；成功、停止、失败以及每秒兜底均清空，因此长施法可能提前失去目标记录。这是一种有时效限制的目标记录方式，不能作为可靠的任意施法目标查询。编码0未知、1玩家、2～5队员、6～45团员，每码乘5。

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
local UnitName = UnitName
local UnitExists = UnitExists
local issecretvalue = issecretvalue

local UPDATE_INTERVAL = 1
local UNIT_TOKEN = "player"
local TARGET_STEP = 5
local PARTY_LIMIT = 4
local RAID_LIMIT = 40
local RAID_CODE_OFFSET = 5

local eventFrame = CreateFrame("Frame")

local function update()
    if output then output:SetVertexColor(0, 0, 0, 1) end
end

local function setTarget(code)
    local value = code * TARGET_STEP / 255
    output:SetVertexColor(value, value, value, 1)
end

local function matches(unit, targetName)
    if not UnitExists(unit) then return false end
    local unitName = UnitName(unit)
    return not issecretvalue(unitName) and unitName ~= nil and unitName == targetName
end

local function setCastTarget(targetName)
    if not output or issecretvalue(targetName) then return end
    if targetName == nil then
        update(); return
    end
    if matches(UNIT_TOKEN, targetName) then
        setTarget(1); return
    end
    for index = 1, PARTY_LIMIT do
        if matches("party" .. index, targetName) then
            setTarget(index + 1); return
        end
    end
    for index = 1, RAID_LIMIT do
        if matches("raid" .. index, targetName) then
            setTarget(index + RAID_CODE_OFFSET); return
        end
    end
    update()
end

local function initialize()

end

eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_SENT", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_STOP", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_INTERRUPTED", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_FAILED", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_FAILED_QUIET", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_SUCCEEDED", UNIT_TOKEN)
eventFrame:SetScript("OnEvent", function(_, event, _, targetName)
    After(0, function()
        if event == "UNIT_SPELLCAST_SENT" then
            setCastTarget(targetName)
        else
            update()
        end
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

C_Timer.After(0, initialize)
```

## 解析

以下为 Python 风格伪代码，采样术语见 [通用约定](../SKILL.md#采样与解析约定)。

```text
要求纯灰色整数采样值，且为5的倍数、范围0～225
code = int(通道采样值) // 5
if code == 0: return ""
if code == 1: return "player"
if code <= 5: return "party" + str(code - 1)
return "raid" + str(code - 5)
```

## 来源与适用边界

方法基于已确认的游戏实现经验，具体API、单位与返回值限制见上文；替换单位、参数或客户端版本时需检查这些前提。独立示例仍需在接入环境验收显示、采样和状态转换。

仅在追溯或维护时读取 [来源记录与映射](../MAINTENANCE.md#源码覆盖映射)，日常使用无需加载原工程。
