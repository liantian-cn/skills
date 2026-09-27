# 普通整数资源直接编码

## 说明&逻辑

`UnitPower("player", powerType, false)` 仅在结果为非秘密的 0～255 整数时，除以 255 送入灰度通道。秘密、非整数或越界结果明确报错，不擅自当作零。初始化及资源变化事件刷新。

示例 ComboPoints；相同路径覆盖 HolyPower、Chi、Essence、ArcaneCharges、SoulShards（整数模式）。这些方法的普通值前提仅适用于已验证场景，不据此保证所有单位／版本均为非秘密。

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
local UnitPower = UnitPower
local POWER_TYPE = Enum.PowerType.ComboPoints
local issecretvalue = issecretvalue
local type = type
local error = error

local UNIT_TOKEN = "player"
local MAX_ENCODED_POWER = 255

local eventFrame = CreateFrame("Frame")
local function update()
    if not output then return end
    local power = UnitPower(UNIT_TOKEN, POWER_TYPE, false)
    if issecretvalue(power) then
        error("次要资源返回秘密值")
    end
    if type(power) ~= "number" or power < 0 or power > MAX_ENCODED_POWER or power % 1 ~= 0 then
        error("次要资源必须为 0..255 整数")
    end
    local mean = power / MAX_ENCODED_POWER
    output:SetVertexColor(mean, mean, mean, 1)
end
eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
eventFrame:RegisterUnitEvent("UNIT_POWER_UPDATE", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_MAXPOWER", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_DISPLAYPOWER", UNIT_TOKEN)
eventFrame:SetScript("OnEvent", function()
    After(0, function() update() end)
end)
C_Timer.After(0, function()

    update()
end)
```

## 解析

以下为 Python 风格伪代码，采样术语见 [通用约定](../SKILL.md#采样与解析约定)。

```text
要求纯灰色且通道采样值为整数
return int(通道采样值)  # 不乘资源上限，也不除以255
```

## 来源与适用边界

方法基于已确认的游戏实现经验，具体API、单位与返回值限制见上文；替换单位、参数或客户端版本时需检查这些前提。独立示例仍需在接入环境验收显示、采样和状态转换。

仅在追溯或维护时读取 [来源记录与映射](../MAINTENANCE.md#源码覆盖映射)，日常使用无需加载原工程。
