# 小队四连续光环与可驱散状态

## 说明&逻辑

每个光环组或驱散类型创建四个连续槽。一个光环组可以包含多个ID；Magic、Disease、Poison使用不同的四槽组，可以同时为真。
`AuraContainer` 负责光环匹配、显隐和日常更新，不读取秘密AuraData，也不统一轮询光环。
同一party token更换成员时，必须在已有槽上调用 `SetAuraSlotCandidateFilters("aura", candidates)` 并刷新；仅再次 `SetUnit("party1")` 不会重建同token的缓存。不存在的成员隐藏容器，不向 `SetUnit` 传nil。
指定ID筛选用于可协助单位的HELPFUL光环；驱散类型使用HARMFUL原生候选筛选。显示“某种驱散类型存在”不能单独证明当前角色具备对应驱散能力，接入时仍匹配已知技能。

## Lua代码块

```lua
local CELL = 4
local UNITS = { "party1", "party2", "party3", "party4" }
local GROUPS = {
    { name = "beacon", filter = "HELPFUL", candidates = { includeSpellIDs = { [53563] = true, [156910] = true, [1244893] = true } } },
    { name = "eternal_flame", filter = "HELPFUL", candidates = { includeSpellIDs = { [156322] = true } } },
    { name = "magic", filter = "HARMFUL|RAID_PLAYER_DISPELLABLE", candidates = { includeDispelTypes = { Magic = true } } },
    { name = "disease", filter = "HARMFUL|RAID_PLAYER_DISPELLABLE", candidates = { includeDispelTypes = { Disease = true } } },
    { name = "poison", filter = "HARMFUL|RAID_PLAYER_DISPELLABLE", candidates = { includeDispelTypes = { Poison = true } } },
}
if not C_AddOns.IsAddOnLoaded("Blizzard_AuraContainer") then C_AddOns.LoadAddOn("Blizzard_AuraContainer") end
local canvas = CreateFrame("Frame", nil, UIParent)
canvas:SetPoint("TOPLEFT", UIParent, "TOPLEFT", 32, -32)
canvas:SetSize(#GROUPS * #UNITS * CELL, CELL)
local background = canvas:CreateTexture(nil, "BACKGROUND")
background:SetAllPoints(canvas)
background:SetColorTexture(0, 0, 0, 1)
local entries = {}
for groupIndex, group in ipairs(GROUPS) do
    for unitIndex, unit in ipairs(UNITS) do
        local container = CreateFrame("AuraContainer", nil, canvas, "CustomAuraContainerTemplate")
        container:SetPoint("TOPLEFT", canvas, "TOPLEFT", ((groupIndex - 1) * #UNITS + unitIndex - 1) * CELL, 0)
        container:SetSize(CELL, CELL)
        container:SetUnit(unit)
        container:AddAuraSlot("aura", group.filter, {
            candidateFilters = group.candidates,
            initializeFrame = function(frame)
                frame:SetSize(CELL, CELL)
                frame:SetPoint("TOPLEFT", container, "TOPLEFT")
                local texture = frame:CreateTexture(nil, "OVERLAY")
                texture:SetAllPoints(frame)
                texture:SetColorTexture(1, 1, 1, 1)
            end,
        })
        entries[#entries + 1] = { unit = unit, container = container, candidates = group.candidates }
    end
end
local function Refresh()
    for _, entry in ipairs(entries) do
        if UnitExists(entry.unit) then
            entry.container:Show()
            entry.container:SetUnit(entry.unit)
            entry.container:SetAuraSlotCandidateFilters("aura", entry.candidates)
            entry.container:UpdateAllAuras()
        else
            entry.container:Hide()
        end
    end
end
local events = CreateFrame("Frame")
for _, event in ipairs({ "PLAYER_ENTERING_WORLD", "GROUP_ROSTER_UPDATE", "GROUP_JOINED", "GROUP_LEFT", "GROUP_FORMED", "SPELLS_CHANGED" }) do
    events:RegisterEvent(event)
end
local pending = false
events:SetScript("OnEvent", function()
    if pending then return end
    pending = true
    C_Timer.After(0, function() pending = false; Refresh() end)
end)
C_Timer.After(0, Refresh)
```

## 解析

```text
每个属性组有4个Cell，顺序party1、party2、party3、party4
先读取配套存在性Cell；不存在的成员不解释其光环状态
has_aura = inner_pixels_are_white(cell)
has_magic、has_disease、has_poison分别读取，不能互相覆盖
非黑白输入按无效处理
```

## 来源与适用边界

示例只负责属性显示和配对解析。尺寸以UI单位表示，接入时保证物理像素对齐；普通Lua语法检查不代表游戏内已经验收。
来源、客户端API核对和验证记录见[维护指南](../MAINTENANCE.md#小队集中属性与首领状态)。
