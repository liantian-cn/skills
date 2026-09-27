# 指定光环是否存在

## 说明&逻辑

`AuraContainer` 的首匹配槽按 includeSpellIDs 过滤，槽显隐由原生框架处理；槽内静态白纹理覆盖黑底。多个 ID 表示首个匹配存在，不合并层数或持续时间，不读取 AuraData／槽可见性来恢复秘密状态。

玩家自身增益采用 HELPFUL|PLAYER。目标自身施加减益用 HARMFUL|PLAYER，并按 UnitCanAssist(...,true,true) 的不可协助侧显示；不可协助不保证可攻击。可协助目标增益使用 HELPFUL，不限玩家施加。PLAYER 的来源范围包含宠物／载具，不能等同角色本人。三段示例按上述不同条件分别给出。focus 变体修改 UNIT_TOKEN；玩家自身版本固定 player。原生容器管理日常光环更新，额外只在世界／单位身份变化时 UpdateAllAuras，不加每帧扫描。

示例可独立放入已加载的插件 Lua 文件；每段是独立示例，不需同时加载。坐标与尺寸均为 UI 单位。

## Lua代码块

### 指定光环是否存在

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

local ipairs                  = ipairs

local CreateFrame             = CreateFrame
local After                   = C_Timer.After

local AURA_IDS                = { 441426, 447954, 441424, 441378, 441416 }
local eventFrame              = CreateFrame("Frame")
local container

local function Refresh()
    if not container then
        return
    end
    container:UpdateAllAuras()
end

local function Initialize()

    container = CreateFrame("AuraContainer", nil, canvas, "CustomAuraContainerTemplate")
    container:SetAllPoints(canvas)
    container:SetFrameLevel((canvas:GetFrameLevel() + 1))
    container:SetUnit("player")

    local includeSpellIDs = {}
    for _, spellID in ipairs(AURA_IDS) do
        includeSpellIDs[spellID] = true
    end
    container:AddAuraSlot("aura", "HELPFUL|PLAYER", {
        candidateFilters = { includeSpellIDs = includeSpellIDs },
        initializeFrame = function(frame)
            frame:SetSize(DISPLAY_WIDTH, DISPLAY_HEIGHT)
            frame:SetPoint("TOPLEFT", container, "TOPLEFT")
            frame:SetFrameLevel((container:GetFrameLevel() + 1))
            local color = WHITE
            local overlay = frame:CreateTexture(nil, "OVERLAY")
            overlay:SetAllPoints(frame)
            overlay:SetTexture("Interface\\Buttons\\WHITE8X8")
            overlay:SetVertexColor(color:GetRGBA())
        end,
    })
    Refresh()
end

eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
eventFrame:SetScript("OnEvent", function()
    After(0, Refresh)
end)
C_Timer.After(0, Initialize)
```

### 不可协助目标／焦点的自身减益

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

local UNIT_TOKEN = "target"

local ipairs                  = ipairs

local CreateFrame             = CreateFrame
local After                   = C_Timer.After
local UnitExists              = UnitExists
local UnitCanAssist           = UnitCanAssist

local AURA_IDS                = { 55078 }
local eventFrame              = CreateFrame("Frame")
local container

local function Refresh()
    if not container then
        return
    end

    container:SetShown(UnitExists(UNIT_TOKEN) and not UnitCanAssist("player", UNIT_TOKEN, true, true))
    container:UpdateAllAuras()
end

local function Initialize()

    container = CreateFrame("AuraContainer", nil, canvas, "CustomAuraContainerTemplate")
    container:SetAllPoints(canvas)
    container:SetFrameLevel((canvas:GetFrameLevel() + 1))
    container:SetUnit(UNIT_TOKEN)

    local includeSpellIDs = {}
    for _, spellID in ipairs(AURA_IDS) do
        includeSpellIDs[spellID] = true
    end
    container:AddAuraSlot("aura", "HARMFUL|PLAYER", {
        candidateFilters = { includeSpellIDs = includeSpellIDs },
        initializeFrame = function(frame)
            frame:SetSize(DISPLAY_WIDTH, DISPLAY_HEIGHT)
            frame:SetPoint("TOPLEFT", container, "TOPLEFT")
            frame:SetFrameLevel((container:GetFrameLevel() + 1))
            local color = WHITE
            local overlay = frame:CreateTexture(nil, "OVERLAY")
            overlay:SetAllPoints(frame)
            overlay:SetTexture("Interface\\Buttons\\WHITE8X8")
            overlay:SetVertexColor(color:GetRGBA())
        end,
    })
    Refresh()
end

eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
if UNIT_TOKEN == "target" then
    eventFrame:RegisterEvent("PLAYER_TARGET_CHANGED")
elseif UNIT_TOKEN == "focus" then
    eventFrame:RegisterEvent("PLAYER_FOCUS_CHANGED")
end
eventFrame:RegisterUnitEvent("UNIT_FACTION", "player", UNIT_TOKEN)
eventFrame:RegisterUnitEvent("UNIT_FLAGS", UNIT_TOKEN)
eventFrame:SetScript("OnEvent", function()
    After(0, Refresh)
end)
C_Timer.After(0, Initialize)
```

### 可协助目标／焦点的增益，不限施加者

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
local UnitCanAssist = UnitCanAssist
local ipairs = ipairs

local AURA_IDS = { 195181 }
local UNIT_TOKEN = "target"
local container
local eventFrame = CreateFrame("Frame")
local function update()
    if not container then return end
    container:SetShown(UnitExists(UNIT_TOKEN) and UnitCanAssist("player", UNIT_TOKEN, true, true))
    container:UpdateAllAuras()
end
local function initialize()

    container = CreateFrame("AuraContainer", nil, canvas, "CustomAuraContainerTemplate")
    container:SetAllPoints(canvas)
    container:SetFrameLevel((canvas:GetFrameLevel() + 1))
    container:SetUnit(UNIT_TOKEN)
    local includeSpellIDs = {}
    for _, spellID in ipairs(AURA_IDS) do includeSpellIDs[spellID] = true end
    container:AddAuraSlot("aura", "HELPFUL", {
        candidateFilters = { includeSpellIDs = includeSpellIDs },
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

## 解析

以下为 Python 风格伪代码，采样术语见 [通用约定](../SKILL.md#采样与解析约定)。

```text
return 区域.是白色  # 黑色表示条件不成立；异常像素由接入项目单独处理
```

## 来源与适用边界

方法基于已确认的游戏实现经验，具体API、单位与返回值限制见上文；替换单位、参数或客户端版本时需检查这些前提。独立示例仍需在接入环境验收显示、采样和状态转换。

仅在追溯或维护时读取 [来源记录与映射](../MAINTENANCE.md#源码覆盖映射)，日常使用无需加载原工程。
