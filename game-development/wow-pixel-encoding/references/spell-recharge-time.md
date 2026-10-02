# 技能下一层充能恢复剩余时间

## 说明&逻辑

`C_Spell.GetSpellChargeDuration(spellID)` 返回当前正在恢复的下一层充能的 DurationObject。将对象直接交给 `EvaluateRemainingDuration`，把颜色交给显示接口；不读取秘密计时数值，不在Lua比较充能数量。

它不同于技能是否可施放，也不同于恢复全部充能需要的总时间。有剩余充能时，下一层仍可能正在恢复。配套读取[当前充能数量](spell-charges-single-cell.md)，并以同样的文字显示路径把 `GetSpellCharges().maxCharges` 编码到另一个灰度Cell。

满充能不能仅由“没有DurationObject”推出：未学习、无数据也可能没有对象。因此无对象显示黑色；Python先检查最大充能>0且当前充能≥最大值，满足才把恢复时间解释为0，否则按时间曲线解析。黑色时间端点表示缺失或至少245秒，不表示就绪。

曲线复用[技能冷却](spell-cooldown.md)：0/10/30/120/245秒对应255/155/115/25/0灰度。0–10秒每阶0.1秒，适合2秒附近的判断。创建时刷新，进入世界、法术书和充能事件延后刷新，并每0.1秒重新求值。实际量化误差仍需客户端检查。

## Lua代码块

以下独立示例只显示恢复时间。当前和最大充能由充能数量方法分别提供，最大值版本只把 `chargeInfo.currentCharges` 改为 `chargeInfo.maxCharges`；两者均限制为已知0–255整数，并使用相同的缺失处理。

```lua
local SPELL_ID = 217200
local frame = CreateFrame("Frame", nil, UIParent)
frame:SetPoint("TOPLEFT", UIParent, "TOPLEFT", 32, -32)
frame:SetSize(4, 4)
frame:SetFrameStrata("TOOLTIP")
frame:SetAlpha(1)
local texture = frame:CreateTexture(nil, "ARTWORK")
texture:SetAllPoints(frame)
local BLACK = CreateColor(0, 0, 0, 1)
local curve = C_CurveUtil.CreateColorCurve()
curve:SetType(Enum.LuaCurveType.Linear)
for _, point in ipairs({ { 0, 255 }, { 10, 155 }, { 30, 115 }, { 120, 25 }, { 245, 0 } }) do
    local gray = point[2] / 255
    curve:AddPoint(point[1], CreateColor(gray, gray, gray, 1))
end
local known = false
local function SelectSpell()
    known = C_SpellBook.IsSpellInSpellBook(SPELL_ID) or C_SpellBook.IsSpellKnown(SPELL_ID)
end
local function Refresh()
    local color = BLACK
    if known then
        local duration = C_Spell.GetSpellChargeDuration(SPELL_ID)
        if issecretvalue(duration) or duration ~= nil then
            color = duration:EvaluateRemainingDuration(curve)
        end
    end
    texture:SetColorTexture(color:GetRGBA())
end
for _, event in ipairs({ "PLAYER_ENTERING_WORLD", "SPELLS_CHANGED", "SPELL_UPDATE_CHARGES" }) do
    frame:RegisterEvent(event)
end
frame:SetScript("OnEvent", function(_, event)
    C_Timer.After(0, function()
        if event == "PLAYER_ENTERING_WORLD" or event == "SPELLS_CHANGED" then SelectSpell() end
        Refresh()
    end)
end)
local elapsed = 0
frame:SetScript("OnUpdate", function(_, delta)
    elapsed = elapsed + delta
    if elapsed >= 0.1 then elapsed = elapsed % 0.1; Refresh() end
end)
C_Timer.After(0, function() SelectSpell(); Refresh() end)
```

## 解析

```text
current = 读取当前充能灰度整数
maximum = 读取最大充能灰度整数
if maximum > 0 and current >= maximum:
    return 0.0
return 分段线性插值(恢复时间灰度, [0,25,115,155,255], [245,120,30,10,0])
```

最大充能缺失时不因current=maximum=0误判满充能。恢复时间0不等于技能一定可施放；调用方需要的已知性、充能和冷却状态应分别读取。

## 来源与适用边界

API及实现来源集中记录于[维护指南](../MAINTENANCE.md#技能充能恢复剩余时间)。本方法已做来源核对、Lua语法及配对解析检查，未将这些检查表述为游戏实测；秘密DurationObject、秘密充能文字显示、满充能和学习/遗忘技能的转换仍需实际客户端验收。
