# 技能范围内可观察敌人数

## 说明&逻辑

只扫描 nameplate1～40：存在、可攻击、存活，并按 COMBAT_ONLY 配置要求处于战斗。射程结果先检查秘密，仅普通 true 才计数；秘密／nil 不计入，结果不是全部附近敌人数。count/40 编码灰度，Python恢复最近计数格点。无效技能为零；姓名板变化事件加1秒兜底。名字中的“近战”取决于所选技能，示例49998；不表示精确几码距离。

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

local After = C_Timer.After
local random = math.random
local CreateFrame = CreateFrame
local IsSpellInRange = C_Spell.IsSpellInRange
local DoesSpellExist = C_Spell.DoesSpellExist
local issecretvalue = issecretvalue
local UnitExists = UnitExists
local UnitCanAttack = UnitCanAttack
local UnitIsDeadOrGhost = UnitIsDeadOrGhost
local UnitAffectingCombat = UnitAffectingCombat

local UPDATE_INTERVAL = 1
local UNIT_TOKEN = "player"
local SPELL_ID = 49998
local COMBAT_ONLY = false
local NAMEPLATE_LIMIT = 40

local eventFrame = CreateFrame("Frame")

local function update()
    if not output then return end
    if not DoesSpellExist(SPELL_ID) then
        output:SetVertexColor(0, 0, 0, 1)
        return
    end
    local count = 0
    for index = 1, NAMEPLATE_LIMIT do
        local unit = "nameplate" .. index
        if UnitExists(unit)
            and UnitCanAttack(UNIT_TOKEN, unit)
            and not UnitIsDeadOrGhost(unit)
            and (not COMBAT_ONLY or UnitAffectingCombat(unit))
        then
            local inRange = IsSpellInRange(SPELL_ID, unit)
            if not issecretvalue(inRange) and inRange == true then
                count = count + 1
            end
        end
    end
    local value = count / NAMEPLATE_LIMIT
    output:SetVertexColor(value, value, value, 1)
end

local function initialize()

end

eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
eventFrame:RegisterEvent("NAME_PLATE_UNIT_ADDED")
eventFrame:RegisterEvent("NAME_PLATE_UNIT_REMOVED")
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
