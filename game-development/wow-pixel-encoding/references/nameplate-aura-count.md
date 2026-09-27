# 范围内指定非秘密减益的可观察敌人数

## 说明&逻辑

在 nameplate-range-count.md 的筛选上，进一步使用 `GetUnitAuraBySpellID` 查询指定减益。初始化要求 `C_Secrets.GetSpellAuraSecrecy(AURA_ID)==Enum.SecrecyLevel.NeverSecret`，否则明确报错。返回对象及 isHarmful 字段先判秘密，只有普通有害光环才计数；不读取秘密光环做统计。示例AURA_ID需在接入环境确认满足前提。姓名板／UNIT_AURA事件加1秒兜底；计数上限40，不代表全部敌人。

示例可独立放入已加载的插件 Lua 文件；每段是独立示例，不需同时加载。坐标与尺寸均为 UI 单位。

## Lua代码块

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
local output = canvas:CreateTexture(nil, "ARTWORK")
output:SetAllPoints(canvas)
output:SetTexture("Interface\\Buttons\\WHITE8X8")
output:SetVertexColor(0, 0, 0, 1)

local CreateFrame = CreateFrame
local After = C_Timer.After
local random = math.random
local error = error
local issecretvalue = issecretvalue
local UnitExists = UnitExists
local UnitCanAttack = UnitCanAttack
local UnitIsDeadOrGhost = UnitIsDeadOrGhost
local UnitAffectingCombat = UnitAffectingCombat
local DoesSpellExist = C_Spell.DoesSpellExist
local IsSpellInRange = C_Spell.IsSpellInRange
local GetSpellAuraSecrecy = C_Secrets.GetSpellAuraSecrecy
local NeverSecret = Enum.SecrecyLevel.NeverSecret
local GetUnitAuraBySpellID = C_UnitAuras.GetUnitAuraBySpellID

local SPELL_ID = 49998
local AURA_ID = 55078
local COMBAT_ONLY = false
local NAMEPLATE_LIMIT = 40
local UPDATE_INTERVAL = 1

local eventFrame = CreateFrame("Frame")
local function update()
    if not output then return end
    local count = 0
    if DoesSpellExist(SPELL_ID) then
        for index = 1, NAMEPLATE_LIMIT do
            local unit = "nameplate" .. index
            if UnitExists(unit) and UnitCanAttack("player", unit)
                and not UnitIsDeadOrGhost(unit)
                and (not COMBAT_ONLY or UnitAffectingCombat(unit)) then
                local inRange = IsSpellInRange(SPELL_ID, unit)
                if not issecretvalue(inRange) and inRange == true then
                    local aura = GetUnitAuraBySpellID(unit, AURA_ID)
                    if not issecretvalue(aura) and aura ~= nil then
                        local harmful = aura.isHarmful
                        if not issecretvalue(harmful) and harmful == true then
                            count = count + 1
                        end
                    end
                end
            end
        end
    end
    local brightness = count / NAMEPLATE_LIMIT
    output:SetVertexColor(brightness, brightness, brightness, 1)
end
local function initialize()
    if GetSpellAuraSecrecy(AURA_ID) ~= NeverSecret then
        error("player_range_aura_units_count: aura_id 必须为 NeverSecret，配置值=" .. AURA_ID)
    end

end
eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
eventFrame:RegisterEvent("NAME_PLATE_UNIT_ADDED")
eventFrame:RegisterEvent("NAME_PLATE_UNIT_REMOVED")
eventFrame:RegisterEvent("UNIT_AURA")
eventFrame:SetScript("OnEvent", function()
    After(0, function() update() end)
end)
local fastTimeElapsed = -random()
eventFrame:SetScript("OnUpdate", function(_, elapsed)
    fastTimeElapsed = fastTimeElapsed + elapsed
    if fastTimeElapsed > UPDATE_INTERVAL then
        fastTimeElapsed = fastTimeElapsed - UPDATE_INTERVAL
        update()
    end
end)
C_Timer.After(0, initialize)
```

## 解析

以下为 Python 风格伪代码，采样术语见 [通用约定](../SKILL.md#采样与解析约定)。

```text
return floor((通道采样值 / 255.0) * 40 + 0.5)
```

## 来源与适用边界

方法基于已确认的游戏实现经验，具体API、单位与返回值限制见上文；替换单位、参数或客户端版本时需检查这些前提。独立示例仍需在接入环境验收显示、采样和状态转换。

仅在追溯或维护时读取 [来源记录与映射](../MAINTENANCE.md#源码覆盖映射)，日常使用无需加载原工程。
