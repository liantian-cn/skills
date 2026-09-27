# 玩家职责枚举

## 说明&逻辑

`UnitGroupRolesAssigned("player")` 返回职责字符串。先检查是否秘密，再比较普通字符串；秘密职责和 NONE 同为黑色。NONE／TANK／HEALER／DAMAGER 编码为 0／85／170／255。职责及队伍事件加 1 秒兜底。

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
local UnitGroupRolesAssigned = UnitGroupRolesAssigned
local issecretvalue = issecretvalue

local UPDATE_INTERVAL = 1
local UNIT_TOKEN = "player"
local ROLE_TANK = 85 / 255
local ROLE_HEALER = 170 / 255
local ROLE_DAMAGER = 1

local eventFrame = CreateFrame("Frame")

local function update()
    if not output then return end
    local role = UnitGroupRolesAssigned(UNIT_TOKEN)
    local value = 0
    if not issecretvalue(role) then
        if role == "TANK" then
            value = ROLE_TANK
        elseif role == "HEALER" then
            value = ROLE_HEALER
        elseif role == "DAMAGER" then
            value = ROLE_DAMAGER
        end
    end
    output:SetVertexColor(value, value, value, 1)
end

local function initialize()

end

eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
eventFrame:RegisterEvent("PLAYER_ROLES_ASSIGNED")
eventFrame:RegisterEvent("ROLE_CHANGED_INFORM")
eventFrame:RegisterEvent("GROUP_ROSTER_UPDATE")
eventFrame:SetScript("OnEvent", function()
    After(0, function() update() end)
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
要求区域为纯灰色，采样值为精确整数
return {0: "NONE", 85: "TANK", 170: "HEALER", 255: "DAMAGER"}[通道采样值]
# 非枚举字节作为无效数据，不按最近颜色猜测。
```

## 来源与适用边界

方法基于已确认的游戏实现经验，具体API、单位与返回值限制见上文；替换单位、参数或客户端版本时需检查这些前提。独立示例仍需在接入环境验收显示、采样和状态转换。

仅在追溯或维护时读取 [来源记录与映射](../MAINTENANCE.md#源码覆盖映射)，日常使用无需加载原工程。
