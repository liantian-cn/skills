# 防骑军备状态 spec_protection_holy_armaments

## 说明&逻辑

本方法只针对圣骑士防御专精（GetSpecialization() == 2），不自动推广到神圣或其他专精。读取固定普通技能ID的 `C_Spell.GetOverrideSpell(375576)`；普通结果432459表示神圣壁垒，432472表示圣洁武器。先检查 `issecretvalue`，只对普通返回值比较；秘密、nil、无匹配或非防骑都输出0，避免沿用上一次形态。

RGB灰度字节0/1/2分别表示未知/壁垒/武器。这里的1/2是枚举值，不是充能，也不是某个增益是否存在。不能通过两个技能充能是否非零或usable是否为真来推导当前形态。无替代时API返回输入ID本身，因此不能把查询某形态后返回自身视为该形态当前激活。

进入世界、法术书、专精与图标事件后延后刷新；忽略事件中的技能参数，使用固定普通ID查询，每秒兜底。每次重新计算状态，失去匹配立即清零。

该映射有源码依据，但当前客户端与天赋下的实际替代链仍需游戏内验收。API可调用不等于375576必然返回这两个形态。未识别时应保持未知，不能猜测或轮流尝试形态。

## Lua代码块

```lua
-- 防骑军备形态：灰度字节 0=未知、1=神圣壁垒、2=圣洁武器。
-- 只比较普通替代技能 ID；未识别时清零，不沿用上一次形态。
local DISPLAY_WIDTH, DISPLAY_HEIGHT = 4, 4
local canvas = CreateFrame("Frame", nil, UIParent)
canvas:SetSize(DISPLAY_WIDTH, DISPLAY_HEIGHT)
canvas:SetPoint("TOPLEFT", UIParent, "TOPLEFT", 32, -32)
canvas:SetFrameStrata("TOOLTIP")
canvas:SetAlpha(1)
local background = canvas:CreateTexture(nil, "BACKGROUND")
background:SetAllPoints(canvas)
background:SetColorTexture(0, 0, 0, 1)
local output
local eventFrame = CreateFrame("Frame")
local function Refresh()
    if not output then return end
    local state = 0
    local _, class = UnitClass("player")
    if class == "PALADIN" and GetSpecialization() == 2 then
        local spellID = C_Spell.GetOverrideSpell(375576)
        if not issecretvalue(spellID) then
            if spellID == 432459 then state = 1
            elseif spellID == 432472 then state = 2 end
        end
    end
    local value = state / 255
    output:SetVertexColor(value, value, value, 1)
end
local function Initialize()
    output = canvas:CreateTexture(nil, "ARTWORK")
    output:SetAllPoints(canvas)
    output:SetTexture("Interface\\Buttons\\WHITE8X8")
    Refresh()
end
eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
eventFrame:RegisterEvent("SPELLS_CHANGED")
eventFrame:RegisterEvent("PLAYER_SPECIALIZATION_CHANGED")
eventFrame:RegisterEvent("SPELL_UPDATE_ICON")
eventFrame:SetScript("OnEvent", function() C_Timer.After(0, Refresh) end)
local elapsedTime = -math.random()
eventFrame:SetScript("OnUpdate", function(_, elapsed)
    elapsedTime = elapsedTime + elapsed
    if elapsedTime >= 1 then
        elapsedTime = elapsedTime % 1
        Refresh()
    end
end)
C_Timer.After(0, Initialize)
```

## 解析

```text
gray = 已确认有效采样区域的RGB平均字节值
state = floor(gray + 0.5)
if state == 1: return 神圣壁垒
if state == 2: return 圣洁武器
return 未知
```

0包括未学习、非防骑、秘密返回或替代关系未匹配。字节1/2肉眼接近黑色；不可按白色布尔解析，也不可将灰度再除以255作为枚举。编码为普通整数，无秘密值算术。

## 来源与适用边界

见[维护记录](../MAINTENANCE.md#防骑军备状态)。验收进入世界、两个形态切换、切换专精、未学习天赋和未识别替代ID时的清零。不能把另一专精的效果增益ID用于本枚举。
