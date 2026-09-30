# 小队施法目标与当前读条生命周期

## 说明&逻辑

通过玩家 `UNIT_SPELLCAST_SENT` 保存本次普通目标名与castGUID，START事件确认当前读条，STOP／FAILED／INTERRUPTED／SUCCEEDED清理对应记录。
SENT参数为unit、targetName、castGUID、spellID，START等事件为unit、castGUID、spellID、castBarID，位置不能混用。
当前读条与尚未开始的请求分开，新的SENT不会覆盖当前读条目标。只匹配player、party1–4的普通名字；同名无法唯一确定、秘密名字或未知目标输出0。队伍变化清理记录，不每秒无条件擦除长读条。
示例另显示状态、剩余秒数和技能类别；类别1对应82326、2对应19750、3其他，可按需要替换普通ID映射。数据只用于观察，不包含任何操作或治疗决策。
普通读条存在性使用 `UnitCastingInfo` 第11项非秘密delay；引导使用 `UnitChannelInfo` 第9项非秘密isEmpowered是否为nil，false仍表示存在普通引导。
DurationObject可能秘密，仅用 `issecretvalue(duration) or duration ~= nil` 判断可交给原生消费者，不能 `if duration then`。
剩余时间曲线与[冷却编码](spell-cooldown.md)一致，0–10秒段每级0.1秒。

## Lua代码块

```lua
local CELL = 4
local canvas = CreateFrame("Frame", nil, UIParent)
canvas:SetPoint("TOPLEFT", UIParent, "TOPLEFT", 32, -32)
canvas:SetSize(4 * CELL, CELL)
local WHITE = CreateColor(1, 1, 1, 1)
local BLACK = CreateColor(0, 0, 0, 1)
local function NewCell(index)
    local texture = canvas:CreateTexture(nil, "ARTWORK")
    texture:SetPoint("TOPLEFT", canvas, "TOPLEFT", (index - 1) * CELL, 0)
    texture:SetSize(CELL, CELL)
    texture:SetColorTexture(0, 0, 0, 1)
    return {
        setCell = function(_, color) texture:SetColorTexture(color:GetRGBA()) end,
        setCellRGBA = function(_, r, g, b) texture:SetColorTexture(r, g, b, 1) end,
    }
end
local remainingCurve = C_CurveUtil.CreateColorCurve()
remainingCurve:SetType(Enum.LuaCurveType.Linear)
for _, point in ipairs({ {0,255}, {10,155}, {30,115}, {120,25}, {245,0} }) do
    local gray = point[2] / 255
    remainingCurve:AddPoint(point[1], CreateColor(gray, gray, gray, 1))
end
local cells = {}
local pending = {}
local activeGUID, activeTarget, activeKind = nil, 0, 0
local units = { "player", "party1", "party2", "party3", "party4" }
local frame = CreateFrame("Frame")

local function Kind(spellID)
    if issecretvalue(spellID) or spellID == nil then return 0 end
    if spellID == 82326 then return 1 end
    if spellID == 19750 then return 2 end
    return 3
end

local function FindTarget(targetName)
    if issecretvalue(targetName) or targetName == nil or targetName == "" then return 0 end
    local found = 0
    for index, unit in ipairs(units) do
        if UnitExists(unit) then
            local name, realm = UnitFullName(unit)
            if not issecretvalue(name) and not issecretvalue(realm) and name then
                local fullName = realm and realm ~= "" and (name .. "-" .. realm) or name
                if targetName == name or targetName == fullName then
                    if found ~= 0 then return 0 end
                    found = index
                end
            end
        end
    end
    return found
end

local function Gray(cell, value)
    local gray = value / 255
    cell:setCellRGBA(gray, gray, gray)
end

local function Refresh()
    if not cells[1] then return end
    local _, _, _, _, _, _, _, _, spellID, _, delay = UnitCastingInfo("player")
    local empowered = select(9, UnitChannelInfo("player"))
    local state, remaining = 0, WHITE
    if delay ~= nil then
        state = 1
        local duration = UnitCastingDuration("player")
        if issecretvalue(duration) or duration ~= nil then
            remaining = duration:EvaluateRemainingDuration(remainingCurve)
        end
        if activeKind == 0 then activeKind = Kind(spellID) end
    elseif empowered ~= nil then
        state = 2
        activeGUID, activeTarget, activeKind = nil, 0, 0
    else
        activeGUID, activeTarget, activeKind = nil, 0, 0
    end
    Gray(cells[1], state)
    cells[2]:setCell(remaining)
    Gray(cells[3], activeKind)
    Gray(cells[4], activeTarget)
end

local rosterEvents = {
    PLAYER_ENTERING_WORLD = true, GROUP_ROSTER_UPDATE = true,
    GROUP_JOINED = true, GROUP_LEFT = true, GROUP_FORMED = true,
}
for event in pairs(rosterEvents) do frame:RegisterEvent(event) end
for _, event in ipairs({
    "UNIT_SPELLCAST_SENT", "UNIT_SPELLCAST_START", "UNIT_SPELLCAST_STOP",
    "UNIT_SPELLCAST_SUCCEEDED", "UNIT_SPELLCAST_FAILED", "UNIT_SPELLCAST_FAILED_QUIET",
    "UNIT_SPELLCAST_INTERRUPTED", "UNIT_SPELLCAST_DELAYED",
    "UNIT_SPELLCAST_CHANNEL_START", "UNIT_SPELLCAST_CHANNEL_STOP",
    "UNIT_SPELLCAST_EMPOWER_START", "UNIT_SPELLCAST_EMPOWER_STOP",
}) do frame:RegisterUnitEvent(event, "player") end

frame:SetScript("OnEvent", function(_, event, _, arg1, arg2, arg3)
    if rosterEvents[event] then
        pending = {}
        activeGUID, activeTarget, activeKind = nil, 0, 0
    elseif event == "UNIT_SPELLCAST_SENT" then
        local targetName, castGUID, spellID = arg1, arg2, arg3
        if not issecretvalue(castGUID) and castGUID then
            pending[castGUID] = { target = FindTarget(targetName), kind = Kind(spellID) }
        end
    elseif event == "UNIT_SPELLCAST_START" then
        local castGUID, spellID = arg1, arg2
        activeGUID, activeTarget, activeKind = nil, 0, Kind(spellID)
        if not issecretvalue(castGUID) and castGUID then
            local request = pending[castGUID]
            activeGUID = castGUID
            if request then activeTarget = request.target end
            pending[castGUID] = nil
        end
    elseif event == "UNIT_SPELLCAST_STOP" or event == "UNIT_SPELLCAST_SUCCEEDED"
        or event == "UNIT_SPELLCAST_FAILED" or event == "UNIT_SPELLCAST_FAILED_QUIET"
        or event == "UNIT_SPELLCAST_INTERRUPTED" then
        local castGUID = arg1
        if not issecretvalue(castGUID) and castGUID then
            pending[castGUID] = nil
            if castGUID == activeGUID then activeGUID, activeTarget, activeKind = nil, 0, 0 end
        end
    end
    C_Timer.After(0, Refresh)
end)
local elapsed = 0
frame:SetScript("OnUpdate", function(_, delta)
    elapsed = elapsed + delta
    if elapsed >= 0.05 then elapsed = elapsed % 0.05; Refresh() end
end)
local function Initialize()
    for x = 1, 4 do cells[x] = NewCell(x) end
    Refresh()
end
C_Timer.After(0, Initialize)
```

## 解析

```text
state = round(gray[0])  # 0空闲、1普通读条、2引导或蓄力
remaining = interpolate(gray[1], [0,25,115,155,255], [245,120,30,10,0])
kind = round(gray[2])    # 0未知、1/2为配置的技能类别、3其他
code = round(gray[3])
target = [None, "player", "party1", "party2", "party3", "party4"][code] if 0 <= code <= 5 else None
当前目标只在state==1期间解释；不能把待施法请求当作已经开始的读条
```

## 来源与适用边界

示例只负责属性显示和配对解析。尺寸以UI单位表示，接入时保证物理像素对齐；普通Lua语法检查不代表游戏内已经验收。
来源、客户端API核对和验证记录见[维护指南](../MAINTENANCE.md#小队集中属性与首领状态)。
