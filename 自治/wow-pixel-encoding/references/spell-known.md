# 技能或天赋是否已知

## 说明&逻辑

`C_SpellBook.IsSpellKnown` 或 `IsSpellInSpellBook` 对任一候选成立即白色。查询天赋授予的技能也使用这一路径；它不解析天赋树节点、等级或已投入点数。初始化与 SPELLS_CHANGED／世界事件延后刷新，无轮询。

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
local CreateFrame = CreateFrame
local IsSpellKnown = C_SpellBook.IsSpellKnown
local IsSpellInSpellBook = C_SpellBook.IsSpellInSpellBook
local ipairs = ipairs

local UNIT_TOKEN = "player"
local SPELL_IDS = { 47528 }

local eventFrame = CreateFrame("Frame")

local function update()
    if not output then return end
    for _, spellID in ipairs(SPELL_IDS) do
        if IsSpellKnown(spellID) or IsSpellInSpellBook(spellID) then
            output:SetVertexColor(C_CurveUtil.EvaluateColorFromBoolean(true, WHITE, BLACK):GetRGBA())
            return
        end
    end
    output:SetVertexColor(C_CurveUtil.EvaluateColorFromBoolean(false, WHITE, BLACK):GetRGBA())
end

local function initialize()

    After(0, function() update() end)
end

eventFrame:RegisterEvent("PLAYER_ENTERING_WORLD")
eventFrame:RegisterEvent("SPELLS_CHANGED")
eventFrame:SetScript("OnEvent", function()
    After(0, function() update() end)
end)
C_Timer.After(0, initialize)
```

## 解析

以下为 Python 风格伪代码，采样术语见 [通用约定](../SKILL.md#采样与解析约定)。

```text
return 区域.是白色  # 黑色表示条件不成立；异常像素由接入项目单独处理
```

## 来源与适用边界

方法基于已确认的游戏实现经验，具体API、单位与返回值限制见上文；替换单位、参数或客户端版本时需检查这些前提。独立示例仍需在接入环境验收显示、采样和状态转换。

仅在追溯或维护时读取 [来源记录与映射](../MAINTENANCE.md#源码覆盖映射)，日常使用无需加载原工程。
