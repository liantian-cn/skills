# 施法与引导图标

## 说明&逻辑

`UnitCastingInfo`／`UnitChannelInfo` 返回的纹理可能秘密，直接送给 Texture:SetTexture。通过非秘密的 delayTime／isEmpowered 哨兵判断空闲，不检查秘密纹理是否为空，也不根据 SetTexture 的返回值分支。无单位／无施法隐藏纹理，露出黑底。图标只承载纹理；是否可打断另读 [可打断状态](cast-interruptible.md)。事件加 0.1 秒刷新，player／target／focus 见两段示例。

示例可独立放入已加载的插件 Lua 文件；每段是独立示例，不需同时加载。坐标与尺寸均为 UI 单位。

## Lua代码块

### 施法与引导图标

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
local UnitCastingInfo = UnitCastingInfo
local UnitChannelInfo = UnitChannelInfo
local UnitExists = UnitExists

local eventFrame = CreateFrame("Frame")

local function Refresh()

    if not UnitExists("player") then icon:Hide(); return end
    local _, _, texture, _, _, _, _, _, _, _, delayTime = UnitCastingInfo("player")
    if delayTime == nil then
        local _, _, channelTexture, _, _, _, _, _, empowered = UnitChannelInfo("player")
        if empowered == nil then icon:Hide(); return end
        texture = channelTexture
    end

    icon:SetTexture(texture)
    icon:Show()

end

local function Initialize()

    Refresh()
end

eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_START", "player")
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_STOP", "player")
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_INTERRUPTED", "player")
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_FAILED", "player")
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_FAILED_QUIET", "player")
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_DELAYED", "player")
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_SUCCEEDED", "player")
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_CHANNEL_START", "player")
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_CHANNEL_STOP", "player")
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_CHANNEL_UPDATE", "player")
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_EMPOWER_START", "player")
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_EMPOWER_STOP", "player")
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_EMPOWER_UPDATE", "player")
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_INTERRUPTIBLE", "player")
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_NOT_INTERRUPTIBLE", "player")
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

### 目标／焦点版本

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

local UNIT_TOKEN = "target"

local random = math.random

local CreateFrame = CreateFrame
local After = C_Timer.After
local UnitCastingInfo = UnitCastingInfo
local UnitChannelInfo = UnitChannelInfo
local UnitExists = UnitExists
local issecretvalue = issecretvalue
local EvaluateColorFromBoolean = C_CurveUtil.EvaluateColorFromBoolean

local eventFrame = CreateFrame("Frame")

local function Refresh()

    if not UnitExists(UNIT_TOKEN) then icon:Hide(); return end
    local _, _, texture, _, _, _, _, blocked, _, _, delayTime = UnitCastingInfo(UNIT_TOKEN)
    if delayTime == nil then
        local _, _, channelTexture, _, _, _, channelBlocked, _, empowered = UnitChannelInfo(UNIT_TOKEN)
        if empowered == nil then icon:Hide(); return end
        texture = channelTexture

    end

    icon:SetTexture(texture)
    icon:Show()

end

local function Initialize()

    Refresh()
end

eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
if UNIT_TOKEN == "target" then
    eventFrame:RegisterEvent("PLAYER_TARGET_CHANGED")
elseif UNIT_TOKEN == "focus" then
    eventFrame:RegisterEvent("PLAYER_FOCUS_CHANGED")
end
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_START", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_STOP", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_INTERRUPTED", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_FAILED", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_FAILED_QUIET", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_DELAYED", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_SUCCEEDED", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_CHANNEL_START", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_CHANNEL_STOP", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_CHANNEL_UPDATE", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_EMPOWER_START", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_EMPOWER_STOP", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_EMPOWER_UPDATE", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_INTERRUPTIBLE", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_SPELLCAST_NOT_INTERRUPTIBLE", UNIT_TOKEN)
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
