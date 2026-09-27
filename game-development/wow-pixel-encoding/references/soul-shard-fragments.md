# 包含十分之一的灵魂碎片

## 说明&逻辑

`UnitPower("player", Enum.PowerType.SoulShards, true)` 的原始片段直接传给 StatusBar，固定量程 0～50。每 10 片段是一整碎片；Lua 不对秘密片段做运算，由 Python 恢复格点再除以 10。增加 UNIT_POWER_FREQUENT 捕获片段变化。条宽是 UI 单位，能否分辨 50 个格点取决于最终物理宽度。整数模式另见 power-integer.md。

示例可独立放入已加载的插件 Lua 文件；每段是独立示例，不需同时加载。坐标与尺寸均为 UI 单位。

## Lua代码块

```lua
-- 独立示例：尺寸和偏移均为 UI 单位，由接入项目负责物理像素对齐。
local DISPLAY_WIDTH, DISPLAY_HEIGHT = 100, 4
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
local bar = CreateFrame("StatusBar", nil, canvas)
bar:SetAllPoints(canvas)
bar:SetFrameLevel(canvas:GetFrameLevel() + 1)
bar:SetOrientation("HORIZONTAL")
bar:SetColorFill(1, 1, 1, 1)

local eventFrame = CreateFrame("Frame")
bar:SetMinMaxValues(0, 50)
local function Update()
    -- 原始片段可能秘密：不做比较或算术，只交给显示消费者。
    bar:SetValue(UnitPower("player", Enum.PowerType.SoulShards, true))
end
eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
eventFrame:RegisterUnitEvent("UNIT_POWER_UPDATE", "player")
eventFrame:RegisterUnitEvent("UNIT_POWER_FREQUENT", "player")
eventFrame:RegisterUnitEvent("UNIT_MAXPOWER", "player")
eventFrame:RegisterUnitEvent("UNIT_DISPLAYPOWER", "player")
eventFrame:SetScript("OnEvent", function() C_Timer.After(0, Update) end)
C_Timer.After(0, Update)
```

## 解析

以下为 Python 风格伪代码，采样术语见 [通用约定](../SKILL.md#采样与解析约定)。

```text
比率 = 白色填充像素数 / (白色填充像素数 + 黑色背景像素数)
return floor(比率 * 50 + 0.5) / 10  # 0.0～5.0；无有效像素时不要执行除法
```

## 来源与适用边界

方法基于已确认的游戏实现经验，具体API、单位与返回值限制见上文；替换单位、参数或客户端版本时需检查这些前提。独立示例仍需在接入环境验收显示、采样和状态转换。

仅在追溯或维护时读取 [来源记录与映射](../MAINTENANCE.md#源码覆盖映射)，日常使用无需加载原工程。
