# 小队伤害吸收与治疗吸收百分比 ValueBar

## 说明&逻辑

本方法提供两种来源，共用同一条带显示。设置 `ABSORB_KIND="healing"` 使用详细治疗计算器的 `GetHealAbsorbs()` 和 `GetMaximumHealth()`；设置为 `"damage"` 使用 `UnitGetTotalAbsorbs()` 和 `UnitHealthMax()`。
治疗吸收是计算器按默认模式处理后的数值，可能包含预测治疗抵扣和钳制；不能称为原始总治疗吸收。伤害吸收版本表示原始伤害吸收总量占最大生命的比例。
秘密量直接传给原生 `SetMinMaxValues`／`SetValue`，不在Lua里除以最大生命。先用局部变量接收 `GetHealAbsorbs()` 的第一返回值，避免第二个clamped布尔参数误传到 `SetValue` 的插值参数。
每条内容为整数5 Cell，Cell示例4px，即20px内容，左右各半格红色分隔，总占6 Cell。四名队友在同一文件连续创建四条，起点相隔6格；单人版本将UNITS改为 `{ "player" }`。
约5个百分点／物理像素；100%以上饱和，零与不存在都显示黑色，配合独立存在性Cell解释。可以选择其他整数内容宽度，并同步解析参数；不能把非整数Cell宽传给要求整数的解析接口。
只需固定绝对阈值时继续使用[吸收阈值Cell](absorb-threshold.md)，不必引入条长解码。

## Lua代码块

```lua
local CELL, CONTENT_CELLS = 4, 5
local ABSORB_KIND = "healing" -- "damage" 为伤害吸收版本
local UNITS = { "party1", "party2", "party3", "party4" }
local canvas = CreateFrame("Frame", nil, UIParent)
canvas:SetPoint("TOPLEFT", UIParent, "TOPLEFT", 32, -32)
canvas:SetSize(#UNITS * (CONTENT_CELLS + 1) * CELL, CELL)
local entries = {}
for index, unit in ipairs(UNITS) do
    local backing = CreateFrame("Frame", nil, canvas)
    backing:SetPoint("TOPLEFT", canvas, "TOPLEFT", (index - 1) * (CONTENT_CELLS + 1) * CELL, 0)
    backing:SetSize((CONTENT_CELLS + 1) * CELL, CELL)
    local separator = backing:CreateTexture(nil, "BACKGROUND")
    separator:SetAllPoints(backing)
    separator:SetColorTexture(1, 0, 0, 1)
    local content = CreateFrame("Frame", nil, backing)
    content:SetPoint("TOPLEFT", backing, "TOPLEFT", CELL / 2, 0)
    content:SetSize(CONTENT_CELLS * CELL, CELL)
    local black = content:CreateTexture(nil, "BACKGROUND")
    black:SetAllPoints(content)
    black:SetColorTexture(0, 0, 0, 1)
    local bar = CreateFrame("StatusBar", nil, content)
    bar:SetAllPoints(content)
    bar:SetColorFill(1, 1, 1, 1)
    entries[index] = { unit = unit, bar = bar, calculator = CreateUnitHealPredictionCalculator() }
end
local function Refresh()
    for _, entry in ipairs(entries) do
        if not UnitExists(entry.unit) then
            entry.bar:SetMinMaxValues(0, 1)
            entry.bar:SetValue(0)
        elseif ABSORB_KIND == "healing" then
            UnitGetDetailedHealPrediction(entry.unit, nil, entry.calculator)
            local amount = entry.calculator:GetHealAbsorbs()
            entry.bar:SetMinMaxValues(0, entry.calculator:GetMaximumHealth())
            entry.bar:SetValue(amount)
        else
            local amount = UnitGetTotalAbsorbs(entry.unit)
            local maximum = UnitHealthMax(entry.unit)
            entry.bar:SetMinMaxValues(0, maximum)
            entry.bar:SetValue(amount)
        end
    end
end
local events = CreateFrame("Frame")
for _, event in ipairs({ "PLAYER_ENTERING_WORLD", "GROUP_ROSTER_UPDATE", "GROUP_JOINED", "GROUP_LEFT", "GROUP_FORMED",
    "UNIT_HEALTH", "UNIT_MAXHEALTH", "UNIT_HEAL_PREDICTION", "UNIT_ABSORB_AMOUNT_CHANGED", "UNIT_HEAL_ABSORB_AMOUNT_CHANGED" }) do
    events:RegisterEvent(event)
end
local pending = false
events:SetScript("OnEvent", function()
    if pending then return end
    pending = true
    C_Timer.After(0, function() pending = false; Refresh() end)
end)
local elapsed = 0
events:SetScript("OnUpdate", function(_, delta)
    elapsed = elapsed + delta
    if elapsed >= 2 then elapsed = elapsed % 2; Refresh() end
end)
C_Timer.After(0, Refresh)
```

## 解析

```text
每名成员的完整区域宽24px、高4px，起点每次增加24px
content = region[1:3, 2:-2]  # 去掉上下边缘和左右红色分隔
white = count_pixels(content == (255, 255, 255))
black = count_pixels(content == (0, 0, 0))
if white + black == 0: return 无效
absorb_pct = white / (white + black) * 100
# 全白只表示达到量程上限；不恢复100%以上的实际吸收量
# 有效量程与精度由实际渲染的20px黑白内容决定
```

## 来源与适用边界

示例只负责属性显示和配对解析。尺寸以UI单位表示，接入时保证物理像素对齐；普通Lua语法检查不代表游戏内已经验收。
来源、客户端API核对和验证记录见[维护指南](../MAINTENANCE.md#小队集中属性与首领状态)。
