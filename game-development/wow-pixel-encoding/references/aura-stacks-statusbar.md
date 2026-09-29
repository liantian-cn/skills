# 光环层数转为进度条

## 说明&逻辑

在 `AuraContainer` 槽初始化中创建 StatusBar，通过 `SetApplicationBar(bar, {maxApplications=...})` 绑定层数。maxApplications 是已知量程，不对秘密层数做算术。白填充黑背景，光环消失露黑底。无光环与零层不能仅由本条区分，超过量程无法精确恢复。玩家增益示例采用12层量程，可按所需光环调整；目标／焦点减益按不可协助侧单独门控，不保证可攻击。两段均保留 PLAYER 过滤，其来源范围包含玩家宠物／载具，不能等同仅角色本人；单槽多 ID 为首匹配，不汇总各光环层数。日常刷新由原生容器管理。

示例可独立放入已加载的插件 Lua 文件；每段是独立示例，不需同时加载。坐标与尺寸均为 UI 单位。

## Lua代码块

### 光环层数转为进度条

```lua
-- 独立示例：尺寸和偏移均为 UI 单位，由接入项目负责物理像素对齐。
local DISPLAY_WIDTH, DISPLAY_HEIGHT = 12, 4
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

local AURA_IDS                = { 195181 }
local MAX_APPLICATIONS        = 12
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
            local bar = CreateFrame("StatusBar", nil, frame)
            bar:SetAllPoints(frame)
            bar:SetFrameLevel((frame:GetFrameLevel() + 1))
            bar:SetOrientation("HORIZONTAL")
            bar:SetColorFill(color:GetRGBA())
            frame:SetApplicationBar(bar, { maxApplications = MAX_APPLICATIONS })
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

### 目标自身减益层数

```lua
-- 独立示例：尺寸和偏移均为 UI 单位，由接入项目负责物理像素对齐。
local DISPLAY_WIDTH, DISPLAY_HEIGHT = 12, 4
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

local AURA_IDS = { 55078 }
local MAX_APPLICATIONS = 12
local UNIT_TOKEN = "target"
local WHITE_TEXTURE = "Interface\\Buttons\\WHITE8X8"
local container
local eventFrame = CreateFrame("Frame")
local function update()
    if not container then return end
    container:SetShown(UnitExists(UNIT_TOKEN) and not UnitCanAssist("player", UNIT_TOKEN, true, true))
    container:UpdateAllAuras()
end
local function initialize()

    container = CreateFrame("AuraContainer", nil, canvas, "CustomAuraContainerTemplate")
    container:SetAllPoints(canvas)
    container:SetFrameLevel((canvas:GetFrameLevel() + 1))
    container:SetUnit(UNIT_TOKEN)
    local includeSpellIDs = {}
    for _, spellID in ipairs(AURA_IDS) do includeSpellIDs[spellID] = true end
    container:AddAuraSlot("aura", "PLAYER|HARMFUL", {
        candidateFilters = { includeSpellIDs = includeSpellIDs },
        initializeFrame = function(frame)
            frame:SetSize(DISPLAY_WIDTH, DISPLAY_HEIGHT)
            frame:SetPoint("TOPLEFT", container, "TOPLEFT")
            frame:SetFrameLevel((container:GetFrameLevel() + 1))
            local bar = CreateFrame("StatusBar", nil, frame)
            bar:SetFrameLevel((frame:GetFrameLevel() + 1))
            bar:SetAllPoints(frame)
            bar:SetOrientation("HORIZONTAL")
            bar:SetStatusBarTexture(WHITE_TEXTURE)
            bar:SetStatusBarColor(WHITE:GetRGBA())
            local background = bar:CreateTexture(nil, "BACKGROUND")
            background:SetAllPoints(bar)
            background:SetColorTexture(BLACK:GetRGBA())
            frame:SetApplicationBar(bar, { maxApplications = MAX_APPLICATIONS })
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
比率 = 白色像素数 / (白色像素数 + 黑色像素数)
return 比率 * MAX_APPLICATIONS  # 返回float数量估计；量程和分辨率必须一致
```

## 来源与适用边界

方法基于已确认的游戏实现经验，具体API、单位与返回值限制见上文；替换单位、参数或客户端版本时需检查这些前提。独立示例仍需在接入环境验收显示、采样和状态转换。

仅在追溯或维护时读取 [来源记录与映射](../MAINTENANCE.md#源码覆盖映射)，日常使用无需加载原工程。
