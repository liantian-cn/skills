# 技能冷却与公共冷却剩余时间

## 说明&逻辑

`C_Spell.GetSpellCooldownDuration(spellIdentifier, ignoreGCD)` 返回持续时间对象，`EvaluateRemainingDuration(curve)` 把剩余秒数送入颜色曲线。示例普通技能按候选顺序选择首个法术书条目，ignoreGCD=true；GCD 使用 61304、ignoreGCD=false，不检查其是否在法术书。API 可接受技能标识；本示例的法术书选择使用 ID。事件加 0.1 秒轮询，否则倒计时颜色不会仅因时间流逝自动更新。

示例节点为：秒数 0/10/30/120/245 → 亮度 255/155/115/25/0。一个8位通道只有0～255共256阶；分段曲线把更多颜色间隔分配给即将结束的冷却，以较低的长冷却精度换取短冷却精度。相邻节点间线性插值，整体不等距。

| 剩余秒数区间 | 亮度变化 | 可分配的颜色间隔数 | 每阶对应秒数 |
| --- | --- | --- | --- |
| 0～10 | 255→155 | 100 | 0.1 |
| 10～30 | 155→115 | 40 | 0.5 |
| 30～120 | 115→25 | 90 | 1 |
| 120～245 | 25→0 | 25 | 5 |

若把0～245秒均匀编码到整个通道，每阶约0.96秒；本例将0～10秒细化到每阶0.1秒，因此更适合临近就绪时的判断。上表是理想的数值步长，实际准确度还受渲染、采样和0.1秒刷新间隔影响。256阶之间共有255个间隔，各段共享端点。

这些节点是精度分配示例，可根据关心的时间范围调整；保持曲线单调，并同步修改Lua节点与Python反插值。未选中技能、无对象与 ≥245 秒均可能黑色，解码245只表示该端点，不能据此认定确切剩余245秒。

示例可独立放入已加载的插件 Lua 文件；每段是独立示例，不需同时加载。坐标与尺寸均为 UI 单位。

## Lua代码块

### 技能冷却与公共冷却剩余时间

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

local remainingCurve = C_CurveUtil.CreateColorCurve()
remainingCurve:SetType(Enum.LuaCurveType.Linear)
remainingCurve:AddPoint(0, CreateColor(255 / 255, 255 / 255, 255 / 255, 1))
remainingCurve:AddPoint(10, CreateColor(155 / 255, 155 / 255, 155 / 255, 1))
remainingCurve:AddPoint(30, CreateColor(115 / 255, 115 / 255, 115 / 255, 1))
remainingCurve:AddPoint(120, CreateColor(25 / 255, 25 / 255, 25 / 255, 1))
remainingCurve:AddPoint(245, CreateColor(0 / 255, 0 / 255, 0 / 255, 1))

local random                   = math.random
local ipairs                   = ipairs

local CreateFrame              = CreateFrame
local After                    = C_Timer.After
local IsSpellInSpellBook       = C_SpellBook.IsSpellInSpellBook
local GetSpellCooldownDuration = C_Spell.GetSpellCooldownDuration

local SPELL_IDS                = { 47528 }
local eventFrame               = CreateFrame("Frame")

local selectedSpellID
local function SelectSpell()
    selectedSpellID = nil
    for _, spellID in ipairs(SPELL_IDS) do
        if IsSpellInSpellBook(spellID) then
            selectedSpellID = spellID
            return
        end
    end
end

local function Refresh()
    if not output then return end
    local color = BLACK
    if selectedSpellID then
        local duration = GetSpellCooldownDuration(selectedSpellID, true)
        if duration then color = duration:EvaluateRemainingDuration(remainingCurve) end
    end
    output:SetVertexColor((color):GetRGBA())
end

local function Initialize()

    SelectSpell()
    Refresh()
end

eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
eventFrame:RegisterEvent("SPELLS_CHANGED")
eventFrame:RegisterEvent("SPELL_UPDATE_COOLDOWN")
eventFrame:SetScript("OnEvent", function(_, event)
    After(0, function()
        if event == "PLAYER_ENTERING_WORLD" or event == "SPELLS_CHANGED" then SelectSpell() end
        Refresh()
    end)
end)
local elapsedTime = -random() * 0.1
eventFrame:SetScript("OnUpdate", function(_, elapsed)
    elapsedTime = elapsedTime + elapsed
    if elapsedTime >= 0.1 then
        elapsedTime = elapsedTime % 0.1
        Refresh()
    end
end)
C_Timer.After(0, Initialize)
```

### 公共冷却：独立示例

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

local remainingCurve = C_CurveUtil.CreateColorCurve()
remainingCurve:SetType(Enum.LuaCurveType.Linear)
remainingCurve:AddPoint(0, CreateColor(255 / 255, 255 / 255, 255 / 255, 1))
remainingCurve:AddPoint(10, CreateColor(155 / 255, 155 / 255, 155 / 255, 1))
remainingCurve:AddPoint(30, CreateColor(115 / 255, 115 / 255, 115 / 255, 1))
remainingCurve:AddPoint(120, CreateColor(25 / 255, 25 / 255, 25 / 255, 1))
remainingCurve:AddPoint(245, CreateColor(0 / 255, 0 / 255, 0 / 255, 1))

local random                   = math.random

local CreateFrame              = CreateFrame
local After                    = C_Timer.After
local GetSpellCooldownDuration = C_Spell.GetSpellCooldownDuration

local SPELL_IDS                = { 61304 }
local eventFrame               = CreateFrame("Frame")

local function Refresh()
    if not output then return end
    local color = BLACK

    local duration = GetSpellCooldownDuration(SPELL_IDS[1], false)
    if duration then color = duration:EvaluateRemainingDuration(remainingCurve) end
    output:SetVertexColor((color):GetRGBA())
end

local function Initialize()

    Refresh()
end

eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
eventFrame:RegisterEvent("SPELLS_CHANGED")
eventFrame:RegisterEvent("SPELL_UPDATE_COOLDOWN")
eventFrame:SetScript("OnEvent", function()
    After(0, function()
        Refresh()
    end)
end)
local elapsedTime = -random() * 0.1
eventFrame:SetScript("OnUpdate", function(_, elapsed)
    elapsedTime = elapsedTime + elapsed
    if elapsedTime >= 0.1 then
        elapsedTime = elapsedTime % 0.1
        Refresh()
    end
end)
C_Timer.After(0, Initialize)
```

## 解析

以下为 Python 风格伪代码，采样术语见 [通用约定](../SKILL.md#采样与解析约定)。

```text
return 插值(通道采样值, [0,25,115,155,255], [245,120,30,10,0])
# 相邻点线性插值；输入端点之外饱和到端点。
```

## 来源与适用边界

方法基于已确认的游戏实现经验，具体API、单位与返回值限制见上文；替换单位、参数或客户端版本时需检查这些前提。独立示例仍需在接入环境验收显示、采样和状态转换。

仅在追溯或维护时读取 [来源记录与映射](../MAINTENANCE.md#源码覆盖映射)，日常使用无需加载原工程。
