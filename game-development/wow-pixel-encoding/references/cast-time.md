# 施法和引导的已过／剩余秒数

## 说明&逻辑

指定单位的DurationObject经原生颜色曲线显示秒数，`MODE`选择已过或剩余时间。与[施法进度比例](cast-progress.md)分开使用。
以0–25.5秒线性编码，每级0.1秒；空闲为0，超过上限饱和。需要区分空闲与刚开始／将结束时，额外读取施法状态。
示例UNIT可以改为player、target、focus或boss1；单位变化由0.1秒刷新发现。DurationObject可能秘密，不能参与Lua真假分支；施法存在性检查第11项delay，引导检查第9项isEmpowered非nil。
实际需要分段剩余时间曲线时，使用[冷却曲线](spell-cooldown.md)的节点并同步解析。

## Lua代码块

```lua
local UNIT = "player"
local MODE = "remaining" -- "elapsed" 为已过秒数
local SIZE = 4
local frame = CreateFrame("Frame", nil, UIParent)
frame:SetPoint("TOPLEFT", UIParent, "TOPLEFT", 32, -32)
frame:SetSize(SIZE, SIZE)
local texture = frame:CreateTexture(nil, "ARTWORK")
texture:SetAllPoints(frame)
local BLACK = CreateColor(0, 0, 0, 1)
local curve = C_CurveUtil.CreateColorCurve()
curve:SetType(Enum.LuaCurveType.Linear)
curve:AddPoint(0, BLACK)
curve:AddPoint(25.5, CreateColor(1, 1, 1, 1))
local function Refresh()
    local color = BLACK
    if UnitExists(UNIT) then
        local duration
        if select(11, UnitCastingInfo(UNIT)) ~= nil then
            duration = UnitCastingDuration(UNIT)
        elseif select(9, UnitChannelInfo(UNIT)) ~= nil then
            duration = UnitChannelDuration(UNIT)
        end
        if issecretvalue(duration) or duration ~= nil then
            if MODE == "elapsed" then color = duration:EvaluateElapsedDuration(curve)
            else color = duration:EvaluateRemainingDuration(curve) end
        end
    end
    texture:SetColorTexture(color:GetRGBA())
end
frame:RegisterEvent("PLAYER_ENTERING_WORLD")
for _, event in ipairs({ "UNIT_SPELLCAST_START", "UNIT_SPELLCAST_STOP", "UNIT_SPELLCAST_DELAYED",
    "UNIT_SPELLCAST_INTERRUPTED", "UNIT_SPELLCAST_CHANNEL_START", "UNIT_SPELLCAST_CHANNEL_STOP", "UNIT_SPELLCAST_CHANNEL_UPDATE" }) do
    frame:RegisterUnitEvent(event, UNIT)
end
frame:SetScript("OnEvent", function() C_Timer.After(0, Refresh) end)
local elapsed = 0
frame:SetScript("OnUpdate", function(_, delta)
    elapsed = elapsed + delta
    if elapsed >= 0.1 then elapsed = elapsed % 0.1; Refresh() end
end)
C_Timer.After(0, Refresh)
```

## 解析

```text
seconds = gray / 10
# 255表示至少25.5秒；0不能单独区分空闲和时间端点
```

## 来源与适用边界

示例只负责属性显示和配对解析。尺寸以UI单位表示，接入时保证物理像素对齐；普通Lua语法检查不代表游戏内已经验收。
来源、客户端API核对和验证记录见[维护指南](../MAINTENANCE.md#小队集中属性与首领状态)。
