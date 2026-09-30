# 吸收量是否严格超过阈值

需要相对于最大生命的比例时，使用[两类吸收ValueBar](party-absorb-valuebar.md)，不要用固定绝对阈值代替百分比。

## 说明&逻辑

`UnitGetTotalHealAbsorbs` 或 `UnitGetTotalAbsorbs` 的秘密数值直接进入 StatusBar。量程设为 [THRESHOLD, THRESHOLD+1]，在吸收量为整数的前提下，小于等于阈值全黑，大于阈值全白。外观像 Cell，但底层机制是进度条，不用 Lua 比较秘密值。初始化和对应吸收变化事件刷新，无轮询。阈值只是配置示例；若换成可含小数的属性，中间可能为部分填充，不能照搬布尔解释。

示例可独立放入已加载的插件 Lua 文件；每段是独立示例，不需同时加载。坐标与尺寸均为 UI 单位。

## Lua代码块

### 吸收量是否严格超过阈值

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

local CreateFrame             = CreateFrame
local After                   = C_Timer.After
local UnitGetTotalHealAbsorbs = UnitGetTotalHealAbsorbs

local THRESHOLD               = 250000
local eventFrame              = CreateFrame("Frame")
local absorbBar

local function Refresh()
    if not absorbBar then
        return
    end
    local color = WHITE
    absorbBar:SetColorFill(color:GetRGBA())
    absorbBar:SetValue(UnitGetTotalHealAbsorbs("player"))
end

local function Initialize()

    absorbBar = CreateFrame("StatusBar", nil, canvas)
    absorbBar:SetAllPoints(canvas)
    absorbBar:SetFrameLevel((canvas:GetFrameLevel() + 1))
    absorbBar:SetMinMaxValues(THRESHOLD, THRESHOLD + 1)
    Refresh()
end

eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
eventFrame:RegisterUnitEvent("UNIT_HEAL_ABSORB_AMOUNT_CHANGED", "player")
eventFrame:SetScript("OnEvent", function()
    After(0, Refresh)
end)
C_Timer.After(0, Initialize)
```

### 伤害吸收量版本

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

local CreateFrame             = CreateFrame
local After                   = C_Timer.After
local UnitGetTotalAbsorbs     = UnitGetTotalAbsorbs

local THRESHOLD               = 500000
local eventFrame              = CreateFrame("Frame")
local absorbBar

local function Refresh()
    if not absorbBar then
        return
    end
    local color = WHITE
    absorbBar:SetColorFill(color:GetRGBA())
    absorbBar:SetValue(UnitGetTotalAbsorbs("player"))
end

local function Initialize()

    absorbBar = CreateFrame("StatusBar", nil, canvas)
    absorbBar:SetAllPoints(canvas)
    absorbBar:SetFrameLevel((canvas:GetFrameLevel() + 1))
    absorbBar:SetMinMaxValues(THRESHOLD, THRESHOLD + 1)
    Refresh()
end

eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
eventFrame:RegisterUnitEvent("UNIT_ABSORB_AMOUNT_CHANGED", "player")
eventFrame:SetScript("OnEvent", function()
    After(0, Refresh)
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
