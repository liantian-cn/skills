# 按可驱散类型筛选光环

## 说明&逻辑

使用 `candidateFilters.includeDispelTypes` 与 RAID_PLAYER_DISPELLABLE 过滤。玩家用 HARMFUL；目标／焦点用 HELPFUL，并要求 UnitIsEnemy，不把敌对门控换成 UnitCanAttack。此筛选表达团队可驱散语义，不能仅凭白色保证玩家本人当前有能力驱散。

已收录类型键：Magic、Poison、Disease、Curse、Stealth、Special、Enrage。空表或全false不匹配。示例目标 Magic/Enrage，玩家减益示例只选 Magic；按实际需求修改静态集合。首匹配槽只报告存在；原生容器管理显示，身份变化事件主动刷新。Enrage 键与目标／焦点路径经用户确认已验证。

示例可独立放入已加载的插件 Lua 文件；每段是独立示例，不需同时加载。坐标与尺寸均为 UI 单位。

## Lua代码块

### 按可驱散类型筛选光环

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

local CreateFrame = CreateFrame
local After = C_Timer.After
local UnitExists = UnitExists
local UnitIsEnemy = UnitIsEnemy

local DISPEL_TYPES = { Magic = true, Enrage = true }
local UNIT_TOKEN = "target"
local container
local eventFrame = CreateFrame("Frame")
local function update()
    if not container then return end
    container:SetShown(UnitExists(UNIT_TOKEN) and UnitIsEnemy("player", UNIT_TOKEN))
    container:UpdateAllAuras()
end
local function initialize()

    container = CreateFrame("AuraContainer", nil, canvas, "CustomAuraContainerTemplate")
    container:SetAllPoints(canvas)
    container:SetFrameLevel((canvas:GetFrameLevel() + 1))
    container:SetUnit(UNIT_TOKEN)
    container:AddAuraSlot("aura", "HELPFUL|RAID_PLAYER_DISPELLABLE", {
        candidateFilters = { includeDispelTypes = DISPEL_TYPES },
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
    update()
end
eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
if UNIT_TOKEN == "target" then
    eventFrame:RegisterEvent("PLAYER_TARGET_CHANGED")
elseif UNIT_TOKEN == "focus" then
    eventFrame:RegisterEvent("PLAYER_FOCUS_CHANGED")
end
eventFrame:RegisterUnitEvent("UNIT_FACTION", "player", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_FLAGS", UNIT_TOKEN)
eventFrame:SetScript("OnEvent", function() After(0, update) end)
C_Timer.After(0, initialize)
```

### 玩家可驱散减益

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

local UNIT_TOKEN = "player"
local SLOT_KEY = "aura"
local DISPEL_TYPES = { Magic = true }
local AURA_FILTER = "HARMFUL|RAID_PLAYER_DISPELLABLE"

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
        candidateFilters = { includeDispelTypes = DISPEL_TYPES },
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
