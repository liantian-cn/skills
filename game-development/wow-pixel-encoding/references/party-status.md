# 小队集中创建连续状态 Cell

## 说明&逻辑

每项属性一次创建party1–4四个连续槽，按属性分组排列，不把同一成员的所有属性混放成一组。
先检查 `UnitExists`，空槽清零。队伍事件合并到帧末全量刷新；生命、连接、职责等各自的事件也触发刷新，普通状态保留2秒兜底、范围0.1秒刷新。
存在、存活、连接、可协助和范围是黑白值；职责为1坦克、2治疗、3输出、5未分配，职业为普通classID，未知为0；预测生命使用0–1输入曲线。
潜在秘密布尔通过原生颜色消费者显示，秘密生命比例通过原生曲线显示。职业和职责仅编码普通值；不在Lua比较秘密身份。
两类吸收存在性用量程0–1的原生StatusBar：整数吸收量大于0显示白色。指定固定绝对阈值时沿用[阈值方法](absorb-threshold.md)。
示例射程技能82326可替换为调用者需要的技能。单位不存在与血量为0是不同状态，配对解析必须先处理存在性。

## Lua代码块

```lua
local CELL = 4
local UNITS = { "party1", "party2", "party3", "party4" }
local FIELDS = { "exists", "alive", "connected", "can_assist", "health_pct",
    "role", "class_id", "in_range", "damage_absorb_present", "heal_absorb_present" }
local canvas = CreateFrame("Frame", nil, UIParent)
canvas:SetPoint("TOPLEFT", UIParent, "TOPLEFT", 32, -32)
canvas:SetSize(#FIELDS * #UNITS * CELL, CELL)
local WHITE, BLACK = CreateColor(1, 1, 1, 1), CreateColor(0, 0, 0, 1)
local healthCurve = C_CurveUtil.CreateColorCurve()
healthCurve:SetType(Enum.LuaCurveType.Linear)
healthCurve:AddPoint(0, BLACK)
healthCurve:AddPoint(1, WHITE)
local slots = {}
for fieldIndex, field in ipairs(FIELDS) do
    for unitIndex, unit in ipairs(UNITS) do
        local backing = CreateFrame("Frame", nil, canvas)
        backing:SetPoint("TOPLEFT", canvas, "TOPLEFT", ((fieldIndex - 1) * #UNITS + unitIndex - 1) * CELL, 0)
        backing:SetSize(CELL, CELL)
        local texture = backing:CreateTexture(nil, "BACKGROUND")
        texture:SetAllPoints(backing)
        texture:SetColorTexture(0, 0, 0, 1)
        local slot = { unit = unit, field = field, texture = texture }
        if field == "damage_absorb_present" or field == "heal_absorb_present" then
            local bar = CreateFrame("StatusBar", nil, backing)
            bar:SetAllPoints(backing)
            bar:SetMinMaxValues(0, 1)
            bar:SetColorFill(1, 1, 1, 1)
            slot.bar = bar
        end
        slots[#slots + 1] = slot
    end
end
local function Boolean(value)
    if not issecretvalue(value) and value == nil then value = false end
    return C_CurveUtil.EvaluateColorFromBoolean(value, WHITE, BLACK)
end
local function Number(value)
    if issecretvalue(value) or value == nil then value = 0 end
    local gray = value / 255
    return CreateColor(gray, gray, gray, 1)
end
local function Refresh(onlyField)
    for _, slot in ipairs(slots) do
        local unit, field = slot.unit, slot.field
        if not onlyField or field == onlyField then
            local color = BLACK
            if not UnitExists(unit) then
                if slot.bar then slot.bar:SetValue(0) end
            elseif field == "exists" then color = WHITE
            elseif field == "alive" then
                color = C_CurveUtil.EvaluateColorFromBoolean(UnitIsDeadOrGhost(unit), BLACK, WHITE)
            elseif field == "connected" then color = Boolean(UnitIsConnected(unit))
            elseif field == "can_assist" then color = Boolean(UnitCanAssist("player", unit))
            elseif field == "health_pct" then color = UnitHealthPercent(unit, true, healthCurve)
            elseif field == "in_range" then color = Boolean(C_Spell.IsSpellInRange(82326, unit))
            elseif field == "role" then
                local role = UnitGroupRolesAssigned(unit)
                local value = 5
                if not issecretvalue(role) then value = ({ TANK = 1, HEALER = 2, DAMAGER = 3 })[role] or 5 end
                color = Number(value)
            elseif field == "class_id" then
                local _, _, classID = UnitClass(unit)
                color = Number(classID)
            elseif field == "damage_absorb_present" then slot.bar:SetValue(UnitGetTotalAbsorbs(unit))
            elseif field == "heal_absorb_present" then slot.bar:SetValue(UnitGetTotalHealAbsorbs(unit))
            end
            slot.texture:SetColorTexture(color:GetRGBA())
        end
    end
end
local events = CreateFrame("Frame")
for _, event in ipairs({ "PLAYER_ENTERING_WORLD", "GROUP_ROSTER_UPDATE", "GROUP_JOINED", "GROUP_LEFT", "GROUP_FORMED",
    "PARTY_MEMBER_ENABLE", "PARTY_MEMBER_DISABLE", "UNIT_CONNECTION", "UNIT_FLAGS", "UNIT_TARGETABLE_CHANGED",
    "PLAYER_ROLES_ASSIGNED", "SPELLS_CHANGED", "UNIT_HEALTH", "UNIT_MAXHEALTH", "UNIT_HEAL_PREDICTION",
    "UNIT_ABSORB_AMOUNT_CHANGED", "UNIT_HEAL_ABSORB_AMOUNT_CHANGED" }) do events:RegisterEvent(event) end
local pending = false
events:SetScript("OnEvent", function()
    if pending then return end
    pending = true
    C_Timer.After(0, function() pending = false; Refresh() end)
end)
local rangeElapsed, stateElapsed = 0, 0
events:SetScript("OnUpdate", function(_, delta)
    rangeElapsed, stateElapsed = rangeElapsed + delta, stateElapsed + delta
    if rangeElapsed >= 0.1 then rangeElapsed = rangeElapsed % 0.1; Refresh("in_range") end
    if stateElapsed >= 2 then stateElapsed = stateElapsed % 2; Refresh() end
end)
C_Timer.After(0, Refresh)
```

## 解析

```text
每个Cell采样内部灰度，保持属性分组和party1→party4的顺序
index = field_index * 4 + party_index  # 两者从0开始
exists = bool_cell("exists", party_index)
if not exists: 不将该成员的其他属性用于计算
health_pct = gray("health_pct", party_index) / 255 * 100
role = round(gray("role", party_index))
class_id = round(gray("class_id", party_index))
其余布尔字段：纯白为真、纯黑为假；其他颜色由接入端按无效输入处理
```

## 来源与适用边界

示例只负责属性显示和配对解析。尺寸以UI单位表示，接入时保证物理像素对齐；普通Lua语法检查不代表游戏内已经验收。
来源、客户端API核对和验证记录见[维护指南](../MAINTENANCE.md#小队集中属性与首领状态)。
