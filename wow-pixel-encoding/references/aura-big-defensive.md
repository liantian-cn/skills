# 玩家大型防御增益

## 说明&逻辑

`HELPFUL|BIG_DEFENSIVE` 过滤，加 BigDefensive／Normal 排序，首匹配槽白色覆盖黑底。它依赖原生分类，不是维护减伤技能 ID 表，也不代表剩余减伤量。原生容器更新光环，世界事件主动刷新。

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

local After = C_Timer.After
local CreateFrame = CreateFrame
local BigDefensive = AuraContainerSortMethod.BigDefensive
local Normal = AuraContainerSortDirection.Normal

local UNIT_TOKEN = "player"
local SLOT_KEY = "aura"
local AURA_FILTER = "HELPFUL|BIG_DEFENSIVE"

local container
local eventFrame = CreateFrame("Frame")

local function update()
    if container then container:UpdateAllAuras() end
end

local function initialize()

    container = CreateFrame("AuraContainer", nil, canvas, "CustomAuraContainerTemplate")
    container:SetAllPoints(canvas)
    container:SetFrameLevel((canvas:GetFrameLevel() + 1))
    container:SetUnit(UNIT_TOKEN)
    container:AddAuraSlot(SLOT_KEY, AURA_FILTER, {
        sortMethod = BigDefensive,
        sortDirection = Normal,
        initializeFrame = function(frame)
            frame:SetSize(DISPLAY_WIDTH, DISPLAY_HEIGHT)
            frame:SetPoint("TOPLEFT", container, "TOPLEFT")
            frame:SetFrameLevel((container:GetFrameLevel() + 1))
            frame.ActiveOverlay = frame:CreateTexture(nil, "OVERLAY")
            frame.ActiveOverlay:SetAllPoints(frame)
            frame.ActiveOverlay:SetTexture("Interface\\Buttons\\WHITE8X8")
            frame.ActiveOverlay:SetVertexColor(WHITE:GetRGBA())
        end,
    })
end

eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
eventFrame:SetScript("OnEvent", function()
    After(0, function() update() end)
end)
C_Timer.After(0, initialize)
```

## 解析

以下为 Python 风格伪代码，采样术语见 [通用约定](../SKILL.md#采样与解析约定)。

```text
return 区域.是白色  # 黑色表示条件不成立；异常像素由接入项目单独处理
```

## 来源与适用边界

方法基于已确认的游戏实现经验，具体API、单位与返回值限制见上文；替换单位、参数或客户端版本时需检查这些前提。独立示例仍需在接入环境验收显示、采样和状态转换。

仅在追溯或维护时读取 [来源记录与映射](../MAINTENANCE.md#源码覆盖映射)，日常使用无需加载原工程。
